import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Challenge } from '@/types'
import { useAnalyze } from '@/hooks/useAnalyze'
import { useExecute, type StreamState } from '@/hooks/useExecute'
import { useProgress } from '@/hooks/useProgress'
import { Button } from '@/components/shared/Button'
import { ErrorBanner } from '@/components/shared/ErrorBanner'
import { AnalysisLoadingState, ResponseCardShimmer, ScoreCardShimmer, Shimmer } from '@/components/shared/LoadingShimmer'
import { ScoreDisplay } from '@/components/ScoreDisplay'
import { DimensionCard } from '@/components/DimensionCard'
import { MarkdownText } from '@/components/shared/MarkdownText'
import { scoreLabel, scoreColor, toDisplayScore, deltaColor, formatDelta } from '@/utils/score'
import { CHALLENGES, CHALLENGE_MAP, DIMENSION_META, challengeDisplayTitle } from '@/data/challenges'
import { XpFloaters, type XpFloat } from '@/components/feedback/XpFloater'
import { BadgeToasts } from '@/components/feedback/BadgeToast'
import { Confetti } from '@/components/feedback/Confetti'
import { NextChallengePill } from '@/components/feedback/NextChallengePill'
import type { DimensionScore } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { Icon } from '@/components/shared/Icon'

const XP_REASON_LABELS: Record<string, string> = {
  attempt: 'Submission',
  pass: 'Passed',
  gold: 'Gold',
  first_try: 'First try',
  improve: 'Improved',
  perfect_dim: 'Perfect area',
  reveal: 'Expert reveal',
}

const STATUS_MESSAGES = [
  'Reading your prompt…',
  'Scoring 5 areas…',
  'Generating expert rewrite…',
  'Finalising feedback…',
]

export function ChallengeView() {
  const { id: challengeId = '' } = useParams<{ id: string }>()
  const progress = useProgress()
  const navigate = useNavigate()
  const challenge = CHALLENGE_MAP.get(challengeId)
  const [promptText, setPromptText] = useState('')
  const [statusIdx, setStatusIdx] = useState(0)
  const [floats, setFloats] = useState<XpFloat[]>([])
  const [toastBadges, setToastBadges] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)

  const { analyze, partial, result, isLoading, isStreaming, error, reset } = useAnalyze()
  const exec = useExecute()
  const prog = progress.getProgress(challengeId)

  const statusRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const scoreCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoading) {
      statusRef.current = setInterval(() => {
        setStatusIdx(i => Math.min(i + 1, STATUS_MESSAGES.length - 1))
      }, 2000)
    } else {
      if (statusRef.current) clearInterval(statusRef.current)
      setStatusIdx(0)
    }
    return () => { if (statusRef.current) clearInterval(statusRef.current) }
  }, [isLoading])

  // When the route changes to a different challenge, clear all per-challenge local
  // state. The component instance is reused across challenge IDs, so without this
  // the previous challenge's prompt, analysis, and expert comparison would leak through.
  useEffect(() => {
    setPromptText('')
    setFloats([])
    setToastBadges([])
    setShowConfetti(false)
    reset()
    exec.reset()
    window.scrollTo({ top: 0, behavior: 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId])

  if (!challenge) return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Challenge not found.</div>

  if (!progress.isUnlocked(challengeId)) {
    const prev = challenge.unlock_after ? CHALLENGE_MAP.get(challenge.unlock_after) : null
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ color: 'var(--ink-4)', display: 'inline-flex', marginBottom: '16px' }}>
          <Icon.Lock size={42} />
        </div>
        <h2 style={{ fontSize: 'var(--fs-h1)', marginBottom: '8px' }}>Challenge Locked</h2>
        <p style={{ color: 'var(--ink-3)', marginBottom: '24px' }}>
          Complete "{prev?.title ?? 'the previous challenge'}" with a score of 75+ to unlock this challenge.
        </p>
        <Button variant="secondary" onClick={() => navigate('/')} iconLeft={<Icon.ArrowLeft size={15} />}>
          Back to Level Map
        </Button>
      </div>
    )
  }

  const lastAttempt = prog?.attempts[prog.attempts.length - 1]
  const nextChallenge = Object.values(Object.fromEntries(CHALLENGE_MAP))
    .find((c: Challenge) => c.unlock_after === challengeId)

  const challengeIndex = CHALLENGES.findIndex(c => c.id === challenge.id)
  const challengeNumber = challengeIndex >= 0 ? challengeIndex + 1 : challenge.order
  const totalChallenges = CHALLENGES.length
  const nextChallengeIndex = nextChallenge ? CHALLENGES.findIndex(c => c.id === nextChallenge.id) : -1
  const nextChallengeNumber = nextChallengeIndex >= 0 ? nextChallengeIndex + 1 : 0

  type DisplayResult = {
    overall_score?: number
    dimensions: DimensionScore[]
    strengths?: string[]
    improvements?: string[]
    session_token?: string
    source: 'fresh' | 'persisted'
    streaming: boolean
  }

  const displayResult: DisplayResult | null = partial
    ? {
        overall_score: partial.overall_score,
        dimensions: partial.dimensions,
        strengths: partial.strengths,
        improvements: partial.improvements,
        session_token: partial.session_token,
        source: 'fresh',
        streaming: isStreaming,
      }
    : lastAttempt
      ? {
          overall_score: lastAttempt.score,
          dimensions: lastAttempt.dimensions,
          strengths: lastAttempt.strengths ?? [],
          improvements: lastAttempt.improvements ?? [],
          session_token: lastAttempt.session_token,
          source: 'persisted',
          streaming: false,
        }
      : null

  // Best-effort: if showing a persisted result and the user previously revealed
  // the expert prompt, try to re-fetch it. The session_store is in-memory, so a
  // backend restart will 404 — useExecute swallows that and we just render
  // without the expert comparison.
  useEffect(() => {
    if (
      displayResult?.source === 'persisted' &&
      prog?.revealed &&
      lastAttempt?.session_token &&
      !exec.revealData &&
      !exec.isRevealing &&
      exec.userExec.phase === 'idle' &&
      exec.expertExec.phase === 'idle'
    ) {
      exec.revealAndExecuteBoth(lastAttempt.session_token, lastAttempt.prompt, challengeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayResult?.source, prog?.revealed, lastAttempt?.session_token])

  async function handleSubmit() {
    if (!promptText.trim() || !challenge) return
    const fullPrompt = challenge.sample_content
      ? `[Source material]\n${challenge.sample_content.body}\n\n[User prompt]\n${promptText}`
      : promptText
    const skipImproved = exec.hasExpertCache(challengeId)
    const res = await analyze({
      prompt: fullPrompt,
      challenge_id: challengeId,
      mode: 'training',
      skip_improved: skipImproved,
    })
    if (res) {
      progress.addAttempt(challengeId, fullPrompt, res.overall_score, res.dimensions, res.strengths, res.improvements, res.session_token)
      progress.applyAttemptServerSide(res.xp_earned, res.xp_total, res.new_badges)

      if (Array.isArray(res.xp_earned) && res.xp_earned.length > 0) {
        setFloats(res.xp_earned.map((ev, i) => ({
          id: `${Date.now()}-${i}`,
          label: XP_REASON_LABELS[ev.reason] || ev.reason,
          amount: ev.amount,
        })))
        window.setTimeout(() => setFloats([]), 2500)
      }
      if (Array.isArray(res.new_badges) && res.new_badges.length > 0) {
        setToastBadges(prev => [...prev, ...(res.new_badges || [])])
      }
      if ((res.overall_score ?? 0) >= 90) {
        setShowConfetti(true)
        window.setTimeout(() => setShowConfetti(false), 2600)
      }

      scoreCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

      // Always kick off expert/user execution. When skipImproved is true the
      // backend won't return a session_token — useExecute will hydrate the
      // expert side from its in-memory cache and only stream the user side.
      if (skipImproved) {
        if (!prog?.revealed) progress.markRevealed(challengeId)
        exec.revealAndExecuteBoth(null, fullPrompt, challengeId)
      } else if (res.session_token) {
        if (!prog?.revealed) progress.markRevealed(challengeId)
        exec.revealAndExecuteBoth(res.session_token, fullPrompt, challengeId)
      }
    }
  }

  const attemptCount = prog?.attempts.length ?? 0
  const bestScore = prog?.best_score ?? 0

  return (
    <div ref={topRef} className="pc-challenge-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      <style>{`
        @media (max-width: 720px) {
          .pc-challenge-page { padding: 24px 16px !important; }
        }
      `}</style>
      <XpFloaters floats={floats} />
      <BadgeToasts
        badgeIds={toastBadges}
        onDismiss={(id) => setToastBadges(prev => prev.filter(b => b !== id))}
      />
      <Confetti show={showConfetti} />
      {!isLoading && bestScore >= 75 && nextChallenge && (
        <NextChallengePill
          key={`${challenge.id}-${attemptCount}`}
          title={nextChallenge.title}
          nextNumber={nextChallengeNumber}
          totalChallenges={totalChallenges}
          onClick={() => navigate(`/challenge/${nextChallenge.id}`)}
        />
      )}
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontSize: '13px', color: 'var(--accent-blue)', fontWeight: 600,
          marginBottom: '14px',
        }}
      >
        <Icon.ArrowLeft size={14} />
        Back to Training Home
      </button>
      <PageHeader
        size="compact"
        eyebrow={<span>Challenge {challengeNumber} of {totalChallenges}</span>}
        title={challengeDisplayTitle(challenge)}
        subtitle={challenge.brief}
      />

      {/* STEP 1: Read the source material */}
      <StepBlock number={1} title="Read this" subtitle={challenge.sample_content?.label}>
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '16px 20px',
          fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          fontFamily: 'var(--font-sans)',
        }}>
          {challenge.sample_content?.body}
        </div>
        {challenge.sample_content?.goal && (
          <p style={{
            marginTop: '12px',
            fontSize: 'var(--fs-small)', color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ color: 'var(--captech-blue)', display: 'inline-flex' }}><Icon.Target size={15} /></span>
            <span><strong>Goal:</strong> {challenge.sample_content.goal}</span>
          </p>
        )}
      </StepBlock>

      {/* STEP 2: Write your prompt */}
      <StepBlock
        number={2}
        title="Write your prompt"
        subtitle={challenge.structural_task}
      >
        <textarea
          value={promptText}
          onChange={e => setPromptText(e.target.value)}
          placeholder='Example: "Summarize the meeting notes in 3 bullet points for my VP…"'
          rows={6}
          style={{
            width: '100%', padding: '14px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            fontSize: '14px', color: 'var(--text-primary)', background: '#fff',
            resize: 'vertical', lineHeight: 1.7, outline: 'none',
            fontFamily: 'var(--font-mono)',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {promptText.length} / 8000
          </span>
        </div>
        {attemptCount > 0 && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
            Attempt {attemptCount + 1} · Best score: <strong style={{ color: scoreColor(bestScore, true) }}>{toDisplayScore(bestScore)}/10</strong>
          </p>
        )}
      </StepBlock>

      {/* STEP 3: Submit */}
      <StepBlock
        number={3}
        title="Score my prompt"
        subtitle="We'll rate your prompt on the five areas below and coach you on how to improve."
        locked={!promptText.trim()}
      >
        {challenge.focus_dimensions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scoring focus:</span>
            {challenge.focus_dimensions.map(aid => {
              const meta = DIMENSION_META[aid]
              return meta ? (
                <span key={aid} style={{
                  fontSize: '11px', fontWeight: 600,
                  background: 'var(--captech-blue)', color: '#fff',
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                }}>
                  {meta.name}
                </span>
              ) : null
            })}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {result && (
            <Button variant="secondary" onClick={() => { reset(); exec.reset() }}>
              Clear
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            loading={isLoading}
            disabled={!promptText.trim() || isLoading}
            size="lg"
          >
            {attemptCount === 0 ? 'Score my prompt →' : 'Re-score →'}
          </Button>
        </div>
      </StepBlock>

      {/* Error */}
      {error && <div style={{ marginBottom: '24px' }}><ErrorBanner message={error} onDismiss={reset} /></div>}

      {/* Loading state — only before any data has arrived */}
      {isLoading && (!displayResult || displayResult.dimensions.length === 0) && (
        <AnalysisLoadingState statusText={STATUS_MESSAGES[statusIdx]} />
      )}

      {/* Results */}
      {displayResult && (!isLoading || displayResult.dimensions.length > 0) && (
        <div className="fade-in-up">
          {/* Pass / Gold banner — only on a fresh, fully-streamed result. */}
          {displayResult.source === 'fresh' && !displayResult.streaming && (displayResult.overall_score ?? 0) >= 75 && (
            <div style={{
              background: (displayResult.overall_score ?? 0) >= 90 ? 'var(--score-mid-bg)' : 'var(--score-high-bg)',
              border: `1px solid ${(displayResult.overall_score ?? 0) >= 90 ? 'var(--score-mid)' : 'var(--score-high)'}`,
              borderRadius: 'var(--radius-lg)', padding: '16px 24px',
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '24px',
            }}>
              <span style={{
                display: 'inline-flex',
                color: (displayResult.overall_score ?? 0) >= 90 ? 'var(--score-mid)' : 'var(--score-high)',
              }}>
                {(displayResult.overall_score ?? 0) >= 90 ? <Icon.Trophy size={26} /> : <Icon.CheckCircle size={26} />}
              </span>
              <div>
                <p style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-h3)', color: 'var(--ink)' }}>
                  {(displayResult.overall_score ?? 0) >= 90 ? 'Gold Star!' : 'Challenge Passed!'}
                </p>
                <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-2)' }}>
                  {(displayResult.overall_score ?? 0) >= 90
                    ? 'Exceptional prompt engineering. You nailed it.'
                    : nextChallenge ? `"${nextChallenge.title}" is now unlocked.` : 'All challenges complete!'}
                </p>
              </div>
              {nextChallenge && (displayResult.overall_score ?? 0) < 90 && (
                <Button
                  variant="primary"
                  size="sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => navigate(`/challenge/${nextChallenge.id}`)}
                  iconRight={<Icon.ArrowRight size={14} />}
                >
                  Next Challenge
                </Button>
              )}
            </div>
          )}

          {displayResult.source === 'persisted' && (
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '24px',
              fontSize: 'var(--fs-small)', color: 'var(--ink-3)',
            }}>
              <Icon.File size={16} />
              <span>Your last attempt — score <strong style={{ color: scoreColor(displayResult.overall_score ?? 0, true) }}>{displayResult.overall_score ?? 0}/100</strong>. Submit again to refresh.</span>
            </div>
          )}

          {/* Score summary */}
          <div ref={scoreCardRef} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '32px',
            display: 'flex', alignItems: 'center', gap: '32px',
            flexWrap: 'wrap', marginBottom: '24px',
            boxShadow: 'var(--shadow-card)',
            scrollMarginTop: '16px',
          }}>
            {typeof displayResult.overall_score === 'number'
              ? <ScoreDisplay score={displayResult.overall_score} />
              : <Shimmer width={120} height={120} borderRadius="50%" />
            }
            <div style={{ flex: 1, minWidth: '240px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                Score Analysis
              </h2>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Grade</p>
                  {typeof displayResult.overall_score === 'number' ? (
                    <p style={{ fontSize: '15px', fontWeight: 700, color: scoreColor(displayResult.overall_score, true) }}>
                      {scoreLabel(displayResult.overall_score, true)}
                    </p>
                  ) : (
                    <Shimmer width={70} height={18} />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Attempt</p>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>#{attemptCount + (displayResult.source === 'fresh' && displayResult.streaming ? 1 : 0)}</p>
                </div>
              </div>

              {displayResult.strengths && displayResult.strengths.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--score-high)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    ✓ What You Did Well
                  </p>
                  {displayResult.strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--score-high)', flexShrink: 0 }}>✓</span>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</p>
                    </div>
                  ))}
                </div>
              )}

              {displayResult.improvements && displayResult.improvements.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    ↑ Top Improvements
                  </p>
                  {displayResult.improvements.map((imp, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--accent-blue)', flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{imp}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Five area breakdown */}
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Your Five Areas
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '16px', marginBottom: '32px' }}>
            {displayResult.dimensions.map((dim, i) => (
              <DimensionCard
                key={dim.id}
                dimension={dim}
                isFocused={challenge.focus_dimensions.includes(dim.id)}
                animationDelay={i * 60}
              />
            ))}
            {displayResult.streaming && Array.from({ length: Math.max(0, 5 - displayResult.dimensions.length) }).map((_, i) => (
              <ScoreCardShimmer key={`shim-${i}`} />
            ))}
          </div>

          {/* Expert comparison — render header + shimmers as soon as a submit is in flight,
              fill in each section as data arrives. */}
          {(displayResult.source === 'fresh' || (displayResult.source === 'persisted' && prog?.revealed)) && (
            <ExpertComparison
              userScore={displayResult.overall_score ?? 0}
              revealData={exec.revealData}
              userExec={exec.userExec}
              expertExec={exec.expertExec}
            />
          )}
        </div>
      )}
    </div>
  )
}

function StepBlock({
  number,
  title,
  subtitle,
  locked = false,
  children,
}: {
  number: number
  title: string
  subtitle?: string
  locked?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', gap: '16px',
      marginBottom: '24px',
      opacity: locked ? 0.55 : 1,
      transition: 'opacity 0.2s',
    }}>
      <div style={{
        flexShrink: 0,
        width: '32px', height: '32px',
        borderRadius: '50%',
        background: locked ? 'var(--bg-secondary)' : 'var(--captech-blue)',
        color: locked ? 'var(--text-muted)' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', fontWeight: 700,
        border: locked ? '1px solid var(--border)' : 'none',
        marginTop: '2px',
      }}>
        {number}
      </div>
      <div style={{
        flex: 1, minWidth: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: subtitle ? '2px' : '12px' }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}

function ExpertComparison({
  userScore,
  revealData,
  userExec,
  expertExec,
}: {
  userScore: number
  revealData: ReturnType<typeof useExecute>['revealData']
  userExec: StreamState
  expertExec: StreamState
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!revealData) return
    navigator.clipboard.writeText(revealData.improved_prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const userDisplay = toDisplayScore(userScore)
  const expertDisplay = revealData ? toDisplayScore(revealData.improved_overall_score) : null
  const delta = expertDisplay != null ? expertDisplay - userDisplay : 0

  return (
    <div className="fade-in-up" style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Expert Comparison
        </h3>
        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Your best: <strong style={{ color: scoreColor(userScore, true) }}>{userDisplay}/10</strong>
          </span>
          <span>→</span>
          {revealData ? (
            <>
              <span style={{ color: 'var(--text-secondary)' }}>
                Expert: <strong style={{ color: scoreColor(revealData.improved_overall_score, true) }}>{expertDisplay}/10</strong>
              </span>
              {delta !== 0 && (
                <span style={{ color: deltaColor(delta), fontWeight: 700 }}>
                  {formatDelta(delta)}
                </span>
              )}
            </>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              Expert: <Shimmer width={48} height={16} />
            </span>
          )}
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Expert Prompt</h4>
          <Button variant="secondary" size="sm" onClick={handleCopy} disabled={!revealData}>
            {copied ? '✓ Copied' : 'Copy'}
          </Button>
        </div>
        {revealData ? (
          <pre style={{
            background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px',
            color: 'var(--text-primary)', lineHeight: 1.7,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            margin: 0, maxHeight: '400px', overflowY: 'auto',
          }}>
            {revealData.improved_prompt}
          </pre>
        ) : (
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <Shimmer width="95%" height={12} />
            <Shimmer width="100%" height={12} />
            <Shimmer width="88%" height={12} />
            <Shimmer width="72%" height={12} />
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))',
        gap: '16px',
      }}>
        <ResponseCard title="AI Response to Your Prompt" stream={userExec} />
        <ResponseCard title="AI Response to Expert Prompt" stream={expertExec} placeholder={!revealData} />
      </div>
    </div>
  )
}

function ResponseCard({ title, stream, placeholder = false }: { title: string; stream: StreamState; placeholder?: boolean }) {
  // Awaiting kickoff: either we haven't yet started this stream (idle + nothing typed)
  // or the prerequisite reveal hasn't landed yet (placeholder=true).
  const awaiting = placeholder || (stream.phase === 'idle' && !stream.text) || (stream.phase === 'streaming' && !stream.text)
  if (awaiting) {
    return <ResponseCardShimmer title={title} />
  }
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '24px',
      boxShadow: 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column',
    }}>
      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
        {title}
      </h4>
      {stream.phase === 'error' ? (
        <ErrorBanner message={stream.error ?? 'Execution failed'} />
      ) : stream.text ? (
        <MarkdownText text={stream.text} maxHeight={500} />
      ) : null}
    </div>
  )
}
