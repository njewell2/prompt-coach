import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Challenge } from '@/types'
import { useAnalyze } from '@/hooks/useAnalyze'
import { useExecute } from '@/hooks/useExecute'
import { useProgress } from '@/hooks/useProgress'
import { Button } from '@/components/shared/Button'
import { ErrorBanner } from '@/components/shared/ErrorBanner'
import { AnalysisLoadingState } from '@/components/shared/LoadingShimmer'
import { ScoreDisplay } from '@/components/ScoreDisplay'
import { DimensionCard } from '@/components/DimensionCard'
import { TokenMeter } from '@/components/TokenMeter'
import { scoreLabel, scoreColor, toDisplayScore } from '@/utils/score'
import { CHALLENGE_MAP } from '@/data/challenges'

const STATUS_MESSAGES = [
  'Reading your prompt…',
  'Scoring 8 dimensions…',
  'Generating expert rewrite…',
  'Finalising feedback…',
]

export function ChallengeView() {
  const { id: challengeId = '' } = useParams<{ id: string }>()
  const progress = useProgress()
  const navigate = useNavigate()
  const challenge = CHALLENGE_MAP.get(challengeId)
  const [topic, setTopic] = useState('')
  const [promptText, setPromptText] = useState('')
  const [statusIdx, setStatusIdx] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [revealRequested, setRevealRequested] = useState(false)

  const { analyze, result, isLoading, error, reset } = useAnalyze()
  const exec = useExecute()
  const prog = progress.getProgress(challengeId)

  const statusRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

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

  if (!challenge) return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Challenge not found.</div>

  if (!progress.isUnlocked(challengeId)) {
    const prev = challenge.unlock_after ? CHALLENGE_MAP.get(challenge.unlock_after) : null
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>Challenge Locked</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Complete "{prev?.title ?? 'the previous challenge'}" with a score of 75+ to unlock this challenge.
        </p>
        <Button variant="secondary" onClick={() => navigate('/')}>Back to Level Map</Button>
      </div>
    )
  }

  const lastAttempt = prog?.attempts[prog.attempts.length - 1]
  const sessionToken = result?.session_token ?? lastAttempt?.session_token
  const canReveal = progress.canReveal(challengeId) || (prog?.revealed ?? false)
  const nextChallenge = challenge.unlock_after
    ? Object.values(Object.fromEntries(CHALLENGE_MAP)).find((c: Challenge) => c.unlock_after === challengeId)
    : null

  async function handleSubmit() {
    if (!promptText.trim() || !challenge) return
    // For sample_content challenges, include the source material so the AI
    // judges the prompt in context. For legacy challenges, fall back to topic.
    const fullPrompt = challenge.sample_content
      ? `[Source material]\n${challenge.sample_content.body}\n\n[User prompt]\n${promptText}`
      : topic ? `[Topic: ${topic}]\n\n${promptText}` : promptText
    const res = await analyze({ prompt: fullPrompt, challenge_id: challengeId, mode: 'training' })
    if (res) {
      progress.addAttempt(challengeId, fullPrompt, res.overall_score, res.dimensions, res.session_token)
      topRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  async function handleReveal() {
    if (!sessionToken) return
    setRevealRequested(true)
    progress.markRevealed(challengeId)
    await exec.revealAndExecute(sessionToken)
  }

  const attemptCount = prog?.attempts.length ?? 0
  const bestScore = prog?.best_score ?? 0

  const hasSample = !!challenge.sample_content

  return (
    <div ref={topRef} style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Challenge header (compact) */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <TierBadge tier={challenge.tier} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Challenge {challenge.id.toUpperCase()}
          </span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {challenge.title}
        </h1>
        <div style={{ width: '32px', height: '3px', background: 'var(--accent-gold)', marginBottom: '12px', borderRadius: 2 }} />
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          {challenge.brief}
        </p>
      </div>

      {hasSample ? (
        <>
          {/* STEP 1: Read the source material */}
          <StepBlock number={1} title="Read this" subtitle={challenge.sample_content!.label}>
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '16px 20px',
              fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-sans)',
            }}>
              {challenge.sample_content!.body}
            </div>
            <p style={{
              marginTop: '12px',
              fontSize: '13px', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span>🎯</span>
              <span><strong>Goal:</strong> {challenge.sample_content!.goal}</span>
            </p>
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
              placeholder="Example: &quot;Summarize the meeting notes in 3 bullet points for my VP…&quot;"
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {promptText.length} / 8000
              </span>
              <button
                onClick={() => setShowHint(h => !h)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--accent-blue)', padding: 0 }}
              >
                {showHint ? 'Hide hint' : 'Need a hint?'}
              </button>
            </div>
            {showHint && (
              <div style={{
                marginTop: '10px', padding: '12px 16px',
                background: 'var(--accent-gold-light)', borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--accent-gold)',
                fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                💡 {challenge.hint}
              </div>
            )}
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
            subtitle="We'll rate your prompt on the dimensions below and coach you on how to improve."
            locked={!promptText.trim()}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scoring focus:</span>
              {challenge.focus_dimensions.map(d => (
                <span key={d} style={{
                  fontSize: '11px', fontWeight: 600,
                  background: 'var(--captech-blue)', color: '#fff',
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                }}>
                  {d.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>
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
        </>
      ) : (
        <>
          {/* Legacy flow for challenges without sample content */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '24px',
            marginBottom: '24px', boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{
              padding: '16px 20px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              marginBottom: '16px',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Your Task
              </p>
              <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                {challenge.structural_task}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>Scoring focus:</span>
              {challenge.focus_dimensions.map(d => (
                <span key={d} style={{
                  fontSize: '12px', fontWeight: 600,
                  background: 'var(--captech-blue)', color: '#fff',
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                }}>
                  {d.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>

            <button
              onClick={() => setShowHint(h => !h)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--accent-blue)', padding: 0 }}
            >
              {showHint ? '▲ Hide hint' : '▼ Show hint'}
            </button>
            {showHint && (
              <div style={{
                marginTop: '10px', padding: '12px 16px',
                background: 'var(--accent-gold-light)', borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--accent-gold)',
                fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                💡 {challenge.hint}
              </div>
            )}
          </div>

          {/* Topic input */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
            boxShadow: 'var(--shadow-card)',
          }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {challenge.topic_prompt}
            </label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Your topic…"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                fontSize: '14px', color: 'var(--text-primary)', background: '#fff',
                outline: 'none', marginBottom: '10px',
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {challenge.topic_examples.map(ex => (
                <button
                  key={ex}
                  onClick={() => setTopic(ex)}
                  style={{
                    padding: '5px 12px', borderRadius: 'var(--radius-full)',
                    background: topic === ex ? 'var(--captech-blue)' : 'var(--bg-secondary)',
                    color: topic === ex ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Workbench */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Your Prompt
              </label>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {promptText.length} / 8000
              </span>
            </div>
            <textarea
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder="Write your prompt here…"
              rows={8}
              style={{
                width: '100%', padding: '14px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                fontSize: '14px', color: 'var(--text-primary)', background: '#fff',
                resize: 'vertical', lineHeight: 1.7, outline: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            />
            {attemptCount > 0 && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Attempt {attemptCount + 1} · Best score: <strong style={{ color: scoreColor(bestScore, true) }}>{toDisplayScore(bestScore)}/10</strong>
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
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
                {attemptCount === 0 ? 'Analyze Prompt' : 'Re-analyze'}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Error */}
      {error && <div style={{ marginBottom: '24px' }}><ErrorBanner message={error} onDismiss={reset} /></div>}

      {/* Loading state */}
      {isLoading && <AnalysisLoadingState statusText={STATUS_MESSAGES[statusIdx]} />}

      {/* Results */}
      {result && !isLoading && (
        <div className="fade-in-up">
          {/* Pass / Gold banner */}
          {result.overall_score >= 75 && (
            <div style={{
              background: result.overall_score >= 90 ? 'var(--score-mid-bg)' : 'var(--score-high-bg)',
              border: `1px solid ${result.overall_score >= 90 ? 'var(--score-mid)' : 'var(--score-high)'}`,
              borderRadius: 'var(--radius-lg)', padding: '16px 24px',
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '24px',
            }}>
              <span style={{ fontSize: '24px' }}>
                {result.overall_score >= 90 ? '⭐' : '✅'}
              </span>
              <div>
                <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                  {result.overall_score >= 90 ? 'Gold Star!' : 'Challenge Passed!'}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {result.overall_score >= 90
                    ? 'Exceptional prompt engineering. You nailed it.'
                    : nextChallenge ? `"${nextChallenge.title}" is now unlocked.` : 'All challenges in this tier complete!'}
                </p>
              </div>
              {nextChallenge && result.overall_score < 90 && (
                <Button
                  variant="primary"
                  size="sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => navigate(`/challenge/${nextChallenge.id}`)}
                >
                  Next Challenge →
                </Button>
              )}
            </div>
          )}

          {/* Score summary */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '32px',
            display: 'flex', alignItems: 'center', gap: '32px',
            flexWrap: 'wrap', marginBottom: '24px',
            boxShadow: 'var(--shadow-card)',
          }}>
            <ScoreDisplay score={result.overall_score} />
            <div style={{ flex: 1, minWidth: '240px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                Score Analysis
              </h2>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Grade</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: scoreColor(result.overall_score, true) }}>
                    {scoreLabel(result.overall_score, true)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Attempt</p>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>#{attemptCount}</p>
                </div>
                {lastAttempt && attemptCount > 1 && (
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>vs last attempt</p>
                    <p style={{ fontSize: '22px', fontWeight: 700, color: scoreColor(result.overall_score - lastAttempt.score + result.overall_score, true) }}>
                      {result.overall_score > lastAttempt.score ? '+' : ''}{result.overall_score - lastAttempt.score}
                    </p>
                  </div>
                )}
              </div>

              {/* Strengths */}
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--score-high)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  ✓ What You Did Well
                </p>
                {result.strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--score-high)', flexShrink: 0 }}>✓</span>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</p>
                  </div>
                ))}
              </div>

              {/* Improvements */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  ↑ Top Improvements
                </p>
                {result.improvements.map((imp, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--accent-blue)', flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{imp}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Token meter */}
          <div style={{ marginBottom: '24px' }}>
            <TokenMeter tokens={result.tokens} analysisMs={result.analysis_time_ms} />
          </div>

          {/* Dimension breakdown */}
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Dimension Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {result.dimensions.map((dim, i) => {
              const prevDim = lastAttempt?.dimensions.find(d => d.id === dim.id)
              return (
                <DimensionCard
                  key={dim.id}
                  dimension={dim}
                  previousScore={prevDim?.score}
                  isFocused={challenge.focus_dimensions.includes(dim.id)}
                  animationDelay={i * 60}
                />
              )
            })}
          </div>

          {/* Reveal gate */}
          {!prog?.revealed && canReveal && !revealRequested && (
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '32px', textAlign: 'center',
              marginBottom: '24px',
            }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Ready to see the expert version?
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Reveal the AI-optimized prompt and see it run side-by-side with yours.
              </p>
              <Button onClick={handleReveal} loading={exec.isRevealing || exec.isExecuting} size="lg">
                Reveal Expert Version →
              </Button>
            </div>
          )}

          {/* Expert comparison */}
          {(exec.revealData || prog?.revealed) && (exec.revealData) && (
            <ExpertComparison
              userDimensions={result.dimensions}
              userScore={result.overall_score}
              revealData={exec.revealData}
              execution={exec.execution}
              isExecuting={exec.isExecuting}
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
      {/* Step number circle */}
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
      {/* Step body */}
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

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    beginner: 'var(--tier-beginner)',
    intermediate: 'var(--tier-intermediate)',
    advanced: 'var(--tier-advanced)',
  }
  const bgs: Record<string, string> = {
    beginner: 'var(--tier-beginner-bg)',
    intermediate: 'var(--tier-intermediate-bg)',
    advanced: 'var(--tier-advanced-bg)',
  }
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700,
      color: colors[tier], background: bgs[tier],
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      textTransform: 'capitalize',
    }}>
      {tier}
    </span>
  )
}

function ExpertComparison({
  userDimensions,
  userScore,
  revealData,
  execution,
  isExecuting,
}: {
  userDimensions: ReturnType<typeof useAnalyze>['result'] extends null ? never : NonNullable<ReturnType<typeof useAnalyze>['result']>['dimensions']
  userScore: number
  revealData: NonNullable<ReturnType<typeof useExecute>['revealData']>
  execution: ReturnType<typeof useExecute>['execution']
  isExecuting: boolean
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(revealData.improved_prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fade-in-up" style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Expert Comparison
        </h3>
        <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Your best: <strong style={{ color: scoreColor(userScore, true) }}>{toDisplayScore(userScore)}/10</strong>
          </span>
          <span>→</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            Expert: <strong style={{ color: scoreColor(revealData.improved_overall_score, true) }}>{toDisplayScore(revealData.improved_overall_score)}/10</strong>
          </span>
          <span style={{ color: 'var(--score-high)', fontWeight: 700 }}>
            +{toDisplayScore(revealData.improved_overall_score) - toDisplayScore(userScore)} ↑
          </span>
        </div>
      </div>

      {/* Expert prompt */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Expert Prompt</h4>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Copy'}
          </Button>
        </div>
        <pre style={{
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
          padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px',
          color: 'var(--text-primary)', lineHeight: 1.7,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          margin: 0, maxHeight: '400px', overflowY: 'auto',
        }}>
          {revealData.improved_prompt}
        </pre>
      </div>

      {/* AI response to expert prompt */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          AI Response to Expert Prompt
        </h4>
        {isExecuting ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
            <span style={{
              width: '16px', height: '16px', borderRadius: '50%',
              border: '2px solid var(--captech-blue)', borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite', display: 'inline-block',
              flexShrink: 0,
            }} />
            Running optimized prompt…
          </div>
        ) : execution ? (
          <div style={{
            fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8,
            maxHeight: '500px', overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {execution.response}
          </div>
        ) : null}
      </div>

      {/* Comparison dimension bars */}
      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
        Dimension Comparison
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
        {userDimensions.map((dim, i) => {
          const improvDim = revealData.improved_dimensions.find(d => d.id === dim.id)
          return (
            <DimensionCard
              key={dim.id}
              dimension={dim}
              improvedScore={improvDim?.score}
              showComparison={true}
              animationDelay={i * 60}
            />
          )
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
