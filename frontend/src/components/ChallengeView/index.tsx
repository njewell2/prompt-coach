import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Challenge } from '@/types'
import { useAnalyze } from '@/hooks/useAnalyze'
import { useExecute, type StreamState } from '@/hooks/useExecute'
import { useProgress } from '@/hooks/useProgress'
import { Button } from '@/components/shared/Button'
import { ErrorBanner } from '@/components/shared/ErrorBanner'
import { Card } from '@/components/shared/Card'
import { AnalysisLoadingState, HeroShimmer, ResponseCardShimmer, ScoreCardShimmer, Shimmer } from '@/components/shared/LoadingShimmer'
import { ScoreDisplay } from '@/components/ScoreDisplay'
import { DimensionCard } from '@/components/DimensionCard'
import { MarkdownText } from '@/components/shared/MarkdownText'
import { scoreLabel, scoreColor, toDisplayScore } from '@/utils/score'
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
  'Finalizing feedback…',
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
  // Tracks the in-flight submission so streaming-driven effects below
  // can fire choreography (XP, scroll) and expert reveal exactly once.
  const submitRef = useRef<{ fullPrompt: string; skipImproved: boolean } | null>(null)
  const choreographedRef = useRef(false)
  const expertKickedRef = useRef(false)

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
    submitRef.current = null
    choreographedRef.current = false
    expertKickedRef.current = false
    reset()
    exec.reset()
    window.scrollTo({ top: 0, behavior: 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId])

  if (!challenge) return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--ink-3)' }}>Challenge not found.</div>

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

  // On return to a previously revealed challenge: hydrate the expert comparison
  // from the in-memory cache if we have it. Otherwise leave it hidden — the
  // persisted score/feedback above is what shows the "previous run", and the
  // user can re-submit to refresh the expert comparison. We deliberately do NOT
  // re-trigger reveal/execute here: that would shimmer indefinitely if the
  // backend session is no longer available.
  useEffect(() => {
    if (
      displayResult?.source === 'persisted' &&
      prog?.revealed &&
      !exec.revealData &&
      !exec.isRevealing &&
      exec.userExec.phase === 'idle' &&
      exec.expertExec.phase === 'idle'
    ) {
      exec.hydrateFromCache(challengeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayResult?.source, prog?.revealed, challengeId])

  async function handleSubmit() {
    if (!promptText.trim() || !challenge) return
    const fullPrompt = challenge.sample_content
      ? `[Source material]\n${challenge.sample_content.body}\n\n[User prompt]\n${promptText}`
      : promptText
    const skipImproved = exec.hasExpertCache(challengeId)
    submitRef.current = { fullPrompt, skipImproved }
    choreographedRef.current = false
    expertKickedRef.current = false
    await analyze({
      prompt: fullPrompt,
      challenge_id: challengeId,
      mode: 'training',
      skip_improved: skipImproved,
    })
  }

  // Fire XP floaters, badges, confetti, scroll, and persist the attempt as
  // soon as scoring completes (overall_score + xp_earned arrive). The expert
  // comparison can keep streaming below without holding any of this back.
  useEffect(() => {
    if (choreographedRef.current) return
    if (!submitRef.current) return
    const score = partial?.overall_score
    const xp = partial?.xp_earned
    if (score === undefined || xp === undefined) return
    choreographedRef.current = true

    const { fullPrompt } = submitRef.current
    progress.addAttempt(
      challengeId,
      fullPrompt,
      score,
      partial?.dimensions ?? [],
      partial?.strengths,
      partial?.improvements,
      partial?.session_token,
    )
    progress.applyAttemptServerSide(xp, partial?.xp_total, partial?.new_badges)

    const isGold = score >= 85
    const newBadges = Array.isArray(partial?.new_badges) ? partial!.new_badges! : []
    const xpEarned = Array.isArray(xp) ? xp : []

    if (xpEarned.length > 0) {
      setFloats(xpEarned.map((ev, i) => ({
        id: `${Date.now()}-${i}`,
        label: XP_REASON_LABELS[ev.reason] || ev.reason,
        amount: ev.amount,
      })))
      const totalMs = xpEarned.length * 220 + 3500 + 200
      window.setTimeout(() => setFloats([]), totalMs)
    }

    if (newBadges.length > 0) {
      const delay = xpEarned.length > 0 ? 1500 : 0
      window.setTimeout(() => {
        setToastBadges(prev => [...prev, ...newBadges])
      }, delay)
    }
    if (isGold) {
      const goldDelay = newBadges.length > 0 ? 2200 : (xpEarned.length > 0 ? 1500 : 0)
      window.setTimeout(() => {
        setShowConfetti(true)
        window.setTimeout(() => setShowConfetti(false), 2200)
      }, goldDelay)
    }

    scoreCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partial?.overall_score, partial?.xp_earned])

  // Kick off the expert/user execution stream once we have a session_token
  // (skip_improved=false) or immediately when expert data is cached.
  useEffect(() => {
    if (expertKickedRef.current) return
    if (!submitRef.current) return
    const { fullPrompt, skipImproved } = submitRef.current
    if (skipImproved) {
      expertKickedRef.current = true
      if (!prog?.revealed) progress.markRevealed(challengeId)
      exec.revealAndExecuteBoth(null, fullPrompt, challengeId)
      return
    }
    if (partial?.session_token) {
      expertKickedRef.current = true
      if (!prog?.revealed) progress.markRevealed(challengeId)
      exec.revealAndExecuteBoth(partial.session_token, fullPrompt, challengeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partial?.session_token])

  const attemptCount = prog?.attempts.length ?? 0
  const bestScore = prog?.best_score ?? 0

  return (
    <div ref={topRef} className="pc-challenge-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      <style>{`
        @media (max-width: 720px) {
          .pc-challenge-page { padding: 24px 16px !important; }
          .pc-challenge-page .pc-score-summary { padding: 20px !important; gap: 20px !important; }
          .pc-challenge-page .pc-hero-dim { padding: 20px !important; }
        }
      `}</style>
      <XpFloaters floats={floats} />
      <BadgeToasts
        badgeIds={toastBadges}
        onDismiss={(id) => setToastBadges(prev => prev.filter(b => b !== id))}
      />
      <Confetti show={showConfetti} />
      {!isLoading && nextChallenge && (
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
          background: 'none', border: 'none', padding: '8px 4px 8px 0', cursor: 'pointer',
          fontSize: 'var(--fs-small)', color: 'var(--captech-blue)', fontWeight: 'var(--fw-semi)',
          marginBottom: '8px',
          minHeight: '36px',
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

      {/* STEP 1: Read the source material — collapses on mobile once user begins step 2 */}
      <StepBlock
        number={1}
        title="Read this"
        subtitle={challenge.sample_content?.label}
        collapsedOnMobile={promptText.length > 0}
      >
        <hr style={{
          border: 'none',
          borderTop: '1px solid var(--border)',
          margin: '4px 0 16px',
        }} />
        <div style={{
          fontSize: 'var(--fs-body)', color: 'var(--ink-2)', lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          fontFamily: 'var(--font-sans)',
        }}>
          <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '8px' }}>Context:</strong>
          {challenge.sample_content?.body}
        </div>
        {challenge.sample_content?.goal && (
          <p style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
            fontSize: 'var(--fs-body)', color: 'var(--ink-2)', lineHeight: 1.7,
            display: 'flex', alignItems: 'flex-start', gap: '8px',
          }}>
            <span style={{ color: 'var(--captech-blue)', display: 'inline-flex', marginTop: '4px' }}><Icon.Target size={16} /></span>
            <span><strong style={{ color: 'var(--ink)' }}>Goal:</strong> {challenge.sample_content.goal}</span>
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
          className="pc-prompt-input"
          value={promptText}
          onChange={e => setPromptText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
          }}
          rows={6}
          style={{
            width: '100%', padding: '14px',
            border: '1px solid transparent', borderRadius: 'var(--radius-md)',
            fontSize: 'var(--fs-body)', color: 'var(--ink)', background: 'var(--surface-quiet)',
            resize: 'vertical', lineHeight: 1.6, outline: 'none',
            fontFamily: 'var(--font-sans)',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        />
        <style>{`
          .pc-prompt-input:focus {
            border-color: var(--captech-blue);
            box-shadow: 0 0 0 3px rgba(0, 93, 185, 0.12);
          }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-4)' }}>
            Cmd+Enter to submit
          </span>
          <span style={{
            fontSize: 'var(--fs-micro)',
            color: promptText.length > 6500 ? 'var(--score-low)' : 'var(--ink-3)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {promptText.length} / 8000
          </span>
        </div>
        {attemptCount > 0 && (
          <p style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', marginTop: '12px' }}>
            Attempt {attemptCount + 1} · Best score: <strong style={{ color: scoreColor(bestScore, true) }}>{toDisplayScore(bestScore).toFixed(1)}/10</strong>
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
            <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 'var(--fw-semi)' }}>Scoring focus:</span>
            {challenge.focus_dimensions.map(aid => {
              const meta = DIMENSION_META[aid]
              return meta ? (
                <span key={aid} style={{
                  fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semi)',
                  background: 'var(--captech-blue)', color: 'var(--surface)',
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
            iconRight={<Icon.ArrowRight size={16} />}
          >
            {attemptCount === 0 ? 'Score my prompt' : 'Re-score'}
          </Button>
        </div>
      </StepBlock>

      {/* Error */}
      {error && <div style={{ marginBottom: '24px' }}><ErrorBanner message={error} onDismiss={reset} onRetry={() => handleSubmit()} /></div>}

      {/* Loading state — only before any data has arrived */}
      {isLoading && (!displayResult || displayResult.dimensions.length === 0) && (
        <AnalysisLoadingState statusText={STATUS_MESSAGES[statusIdx]} />
      )}

      {/* Results */}
      {displayResult && (!isLoading || displayResult.dimensions.length > 0) && (
        <div className="fade-in-up">
          {/* Pass / Gold banner — shows whenever the user's best score has cleared 75
              (i.e. once passed, always shown) so the recognition persists across visits. */}
          {bestScore >= 75 && (
            <div style={{
              background: bestScore >= 85 ? 'var(--score-mid-bg)' : 'var(--score-high-bg)',
              border: `1px solid ${bestScore >= 85 ? 'var(--score-mid)' : 'var(--score-high)'}`,
              borderRadius: 'var(--radius-lg)', padding: '16px 24px',
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '24px',
            }}>
              <span style={{
                display: 'inline-flex',
                color: bestScore >= 85 ? 'var(--score-mid)' : 'var(--score-high)',
              }}>
                {bestScore >= 85 ? <Icon.Trophy size={26} /> : <Icon.CheckCircle size={26} />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-h3)', color: 'var(--ink)' }}>
                  {bestScore >= 85 ? 'Gold Star!' : 'Challenge Passed!'}
                </p>
                <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-2)' }}>
                  {bestScore >= 85
                    ? 'Exceptional prompt engineering. You nailed it.'
                    : nextChallenge ? `You're ready for "${nextChallenge.title}".` : 'All challenges complete!'}
                </p>
              </div>
              {nextChallenge && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/challenge/${nextChallenge.id}`)}
                  iconRight={<Icon.ArrowRight size={14} />}
                >
                  Next Challenge
                </Button>
              )}
            </div>
          )}

          {/* Sub-75 coach voice — recommend pushing the score up, but always offer
              the next challenge as an explicit out so the user isn't stuck. */}
          {bestScore > 0 && bestScore < 75 && displayResult.dimensions.length > 0 && (
            <div style={{
              background: 'var(--score-mid-bg)',
              border: '1px solid var(--score-mid)',
              borderRadius: 'var(--radius-lg)', padding: '16px 24px',
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '24px',
            }}>
              <span style={{ display: 'inline-flex', color: 'var(--score-mid)' }}>
                <Icon.Trend size={22} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-h3)', color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  Aim for 75 or higher
                </p>
                <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-2)' }}>
                  We recommend getting your score to at least 75 before moving on, but you can continue to the next challenge if you'd like.
                </p>
              </div>
              {nextChallenge && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/challenge/${nextChallenge.id}`)}
                  iconRight={<Icon.ArrowRight size={14} />}
                >
                  Next Challenge
                </Button>
              )}
            </div>
          )}
          {displayResult.source === 'persisted' && bestScore < 75 && (
            <div style={{
              background: 'var(--surface-quiet)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '24px',
              fontSize: 'var(--fs-small)', color: 'var(--ink-3)',
            }}>
              <Icon.File size={16} />
              <span>Your last attempt, score <strong style={{ color: scoreColor(displayResult.overall_score ?? 0, true) }}>{toDisplayScore(displayResult.overall_score ?? 0).toFixed(1)}/10</strong>. Submit again to refresh.</span>
            </div>
          )}

          {/* Score summary — flat at rest */}
          <div ref={scoreCardRef} className="pc-score-summary" style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '32px',
            display: 'flex', alignItems: 'center', gap: '32px',
            flexWrap: 'wrap', marginBottom: '24px',
            scrollMarginTop: '16px',
          }}>
            {typeof displayResult.overall_score === 'number'
              ? <ScoreDisplay score={displayResult.overall_score} />
              : <Shimmer width={120} height={120} borderRadius="50%" />
            }
            <div style={{ flex: 1, minWidth: '240px' }}>
              <h2 style={{ fontSize: 'var(--fs-display)', fontWeight: 'var(--fw-bold)', marginBottom: '16px', color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Score analysis
              </h2>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 'var(--fw-semi)' }}>Grade</p>
                  {typeof displayResult.overall_score === 'number' ? (
                    <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-bold)', color: scoreColor(displayResult.overall_score, true) }}>
                      {scoreLabel(displayResult.overall_score, true)}
                    </p>
                  ) : (
                    <Shimmer width={70} height={18} />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 'var(--fw-semi)' }}>Attempt</p>
                  <p style={{ fontSize: 'var(--fs-h1)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>#{attemptCount + (displayResult.source === 'fresh' && displayResult.streaming ? 1 : 0)}</p>
                </div>
              </div>

              <p style={{
                fontSize: 'var(--fs-small)', color: 'var(--ink-3)',
                display: 'flex', alignItems: 'center', gap: '6px',
                marginBottom: '16px', lineHeight: 1.4,
              }}>
                <span style={{ color: 'var(--captech-blue)', display: 'inline-flex', flexShrink: 0 }}>
                  <Icon.Target size={13} />
                </span>
                <span>
                  {nextChallenge
                    ? "Aim for 7.5/10 before moving on, or jump to the next challenge whenever you like."
                    : 'Aim for 7.5/10 to feel solid on this one.'}
                </span>
              </p>

              {displayResult.strengths && displayResult.strengths.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)', color: 'var(--score-high)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    What you did well
                  </p>
                  {displayResult.strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--score-high)', flexShrink: 0 }}>✓</span>
                      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-2)', lineHeight: 1.5 }}>{s}</p>
                    </div>
                  ))}
                </div>
              )}

              {displayResult.improvements && displayResult.improvements.length > 0 && (
                <div>
                  <p style={{ fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)', color: 'var(--captech-blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    Top improvements
                  </p>
                  {displayResult.improvements.map((imp, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--captech-blue)', flexShrink: 0, fontWeight: 'var(--fw-bold)' }}>{i + 1}.</span>
                      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-2)', lineHeight: 1.5 }}>{imp}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hero + rail — the challenge's focus dimension is locked to the hero
              slot from the start; non-focus dimensions stream into the rail as they
              arrive. The hero never flips between dimensions while streaming. */}
          {(() => {
            const focusId = challenge.focus_dimensions[0]
            const allDims = displayResult.dimensions
            const focusHero = focusId ? allDims.find(d => d.id === focusId) : undefined

            // Without an explicit focus_dimensions, defer hero pick until streaming
            // is complete, then surface the lowest-scoring dimension as the coach
            // foothold. (No production challenge currently hits this branch.)
            const fallbackHero = !focusId && !displayResult.streaming
              ? [...allDims].sort((a, b) => a.score - b.score)[0]
              : undefined

            const hero = focusHero ?? fallbackHero
            const rail = hero
              ? allDims.filter(d => d.id !== hero.id)
              : focusId
                ? allDims.filter(d => d.id !== focusId)
                : allDims

            const heroLabel = focusId ? 'The challenge focus area' : 'Where to focus next'
            const showHeroSlot = focusId !== undefined || hero !== undefined

            return (
              <div style={{ marginBottom: '32px' }}>
                {showHeroSlot && (
                  <>
                    <div style={{
                      fontSize: 'var(--fs-micro)',
                      fontWeight: 'var(--fw-semi)',
                      color: 'var(--ink-3)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}>
                      {heroLabel}
                    </div>
                    {hero ? (
                      <DimensionCard
                        key={hero.id}
                        dimension={hero}
                        variant="hero"
                        animationDelay={0}
                      />
                    ) : (
                      <HeroShimmer />
                    )}
                  </>
                )}

                {rail.length > 0 && (
                  <Card padding={24} style={{ marginTop: '24px' }}>
                    <h3 style={{
                      fontSize: 'var(--fs-h3)',
                      fontWeight: 'var(--fw-bold)',
                      color: 'var(--ink)',
                      marginBottom: '16px',
                    }}>
                      The other four areas
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {rail.map((dim, i) => (
                        <DimensionCard
                          key={dim.id}
                          dimension={dim}
                          variant="row"
                          animationDelay={120 + i * 60}
                        />
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )
          })()}

          {/* Expert comparison — render header + shimmers as soon as a submit is in flight,
              fill in each section as data arrives. On a persisted revisit with no cached
              expert data, we skip rendering this entirely; the user can re-submit to
              regenerate it instead of staring at empty shimmers. */}
          {(displayResult.source === 'fresh' || exec.isRevealing || exec.revealData || exec.revealError || exec.userExec.phase !== 'idle' || exec.expertExec.phase !== 'idle') && (
            <ExpertComparison
              revealData={exec.revealData}
              revealError={exec.revealError}
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
  collapsedOnMobile = false,
  children,
}: {
  number: number
  title: string
  subtitle?: string
  locked?: boolean
  collapsedOnMobile?: boolean
  children: React.ReactNode
}) {
  const collapseClass = collapsedOnMobile ? 'pc-step-collapsed-mobile' : ''
  return (
    <div className={`pc-step ${collapseClass}`} style={{
      display: 'flex', gap: '16px',
      marginBottom: '24px',
      opacity: locked ? 0.55 : 1,
      transition: 'opacity 0.2s',
    }}>
      <style>{`
        .pc-step-collapsed-mobile .pc-step-body { display: block; }
        @media (max-width: 720px) {
          .pc-step-collapsed-mobile .pc-step-body { display: none; }
        }
      `}</style>
      <div style={{
        flexShrink: 0,
        width: '32px', height: '32px',
        borderRadius: '50%',
        background: locked ? 'var(--surface-quiet)' : 'var(--captech-blue)',
        color: locked ? 'var(--ink-3)' : 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)',
        border: locked ? '1px solid var(--border)' : 'none',
        marginTop: '2px',
      }}>
        {number}
      </div>
      <div style={{
        flex: 1, minWidth: 0,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: '20px 24px',
      }}>
        <h3 style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', marginBottom: subtitle ? '2px' : '12px' }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-2)', marginBottom: '14px', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
        <div className="pc-step-body">
          {children}
        </div>
      </div>
    </div>
  )
}

function ExpertComparison({
  revealData,
  revealError,
  userExec,
  expertExec,
}: {
  revealData: ReturnType<typeof useExecute>['revealData']
  revealError: ReturnType<typeof useExecute>['revealError']
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

  return (
    <div className="fade-in-up" style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' }}>
          Expert comparison
        </h3>
      </div>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' }}>Expert prompt</h4>
          <Button variant="secondary" size="sm" onClick={handleCopy} disabled={!revealData}>
            {copied ? '✓ Copied' : 'Copy'}
          </Button>
        </div>
        {revealData ? (
          <pre style={{
            background: 'var(--surface-quiet)', borderRadius: 'var(--radius-md)',
            padding: '16px', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-small)',
            color: 'var(--ink)', lineHeight: 1.7,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            margin: 0, maxHeight: '400px', overflowY: 'auto',
          }}>
            {revealData.improved_prompt}
          </pre>
        ) : revealError ? (
          <ErrorBanner message={`The expert prompt couldn't be generated: ${revealError}. Re-submit your prompt to try again.`} />
        ) : (
          <div style={{
            background: 'var(--surface-quiet)', borderRadius: 'var(--radius-md)',
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

      {!revealError && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))',
          gap: '16px',
        }}>
          <ResponseCard title="AI Response to Your Prompt" stream={userExec} placeholder={!revealData || userExec.phase === 'idle'} />
          <ResponseCard title="AI Response to Expert Prompt" stream={expertExec} placeholder={!revealData} />
        </div>
      )}
    </div>
  )
}

function ResponseCard({ title, stream, placeholder = false }: { title: string; stream: StreamState; placeholder?: boolean }) {
  // Shimmer only while we're actually waiting on data — reveal pending or active stream.
  // Idle-with-no-text means nothing was kicked off (e.g. cache miss after a backend restart);
  // render an empty card instead of shimmering forever.
  const awaiting = placeholder || (stream.phase === 'streaming' && !stream.text)
  if (awaiting) {
    return <ResponseCardShimmer title={title} />
  }
  if (stream.phase === 'idle' && !stream.text) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '24px',
      display: 'flex', flexDirection: 'column',
    }}>
      <h4 style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', marginBottom: '12px' }}>
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
