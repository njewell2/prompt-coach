import { useState, useRef, useEffect } from 'react'
import { useAnalyze } from '@/hooks/useAnalyze'
import { useExecute } from '@/hooks/useExecute'
import { useHistory } from '@/hooks/useHistory'
import { DimensionCard } from '@/components/DimensionCard'
import { ScoreDisplay } from '@/components/ScoreDisplay'
import { TokenMeter } from '@/components/TokenMeter'
import { Button } from '@/components/shared/Button'
import { ErrorBanner } from '@/components/shared/ErrorBanner'
import { AnalysisLoadingState, ScoreCardShimmer, Shimmer } from '@/components/shared/LoadingShimmer'
import { PageHeader } from '@/components/shared/PageHeader'
import { Icon } from '@/components/shared/Icon'
import { scoreLabel, toDisplayScore } from '@/utils/score'

export function FreePractice() {
  const [topic, setTopic] = useState('')
  const [prompt, setPrompt] = useState('')
  const [submittedPrompt, setSubmittedPrompt] = useState('')
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const analyze = useAnalyze()
  const exec = useExecute()
  const { addEntry } = useHistory()

  const isLoading = analyze.isLoading
  const hasPartial = analyze.partial !== null
  const partial = analyze.partial

  const canSubmit = prompt.trim().length >= 10 && !isLoading

  function handleSubmit() {
    if (!canSubmit) return
    const p = prompt.trim()
    setSubmittedPrompt(p)
    analyze.analyze({ prompt: p, context: topic.trim() || undefined, mode: 'practice' })
  }

  // When analysis completes in practice mode, improved_prompt is included → auto-execute it
  useEffect(() => {
    if (analyze.phase === 'done' && analyze.result?.improved_prompt && exec.expertExec.phase === 'idle') {
      exec.executeExpertOnly(analyze.result.improved_prompt)
    }
  }, [analyze.phase, analyze.result?.improved_prompt])

  // Save to history when execution completes
  useEffect(() => {
    if (exec.expertExec.phase === 'done' && analyze.result && submittedPrompt) {
      addEntry(submittedPrompt, analyze.result)
    }
  }, [exec.expertExec.phase])

  function handleReset() {
    analyze.reset()
    exec.reset()
    setPrompt('')
    setSubmittedPrompt('')
    setTopic('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="pc-practice-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      <style>{`
        @media (max-width: 720px) {
          .pc-practice-page { padding: 24px 16px !important; }
        }
      `}</style>
      <PageHeader
        title="Free Practice"
        subtitle="Submit any prompt. See how an expert version compares."
      />

      {/* Input section */}
      {!hasPartial && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '28px',
          marginBottom: '24px',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--fs-micro)',
              fontWeight: 'var(--fw-semi)',
              color: 'var(--ink-3)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Context (optional)
            </label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="What's this prompt for? e.g. 'summarizing legal contracts'"
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                fontSize: '16px', color: 'var(--ink)',
                background: 'var(--surface)', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--captech-blue)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--fs-micro)',
              fontWeight: 'var(--fw-semi)',
              color: 'var(--ink-3)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Your prompt
            </label>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Write any prompt here. A task you'd give to an AI, a question you'd ask, or a template you're working on."
              rows={8}
              style={{
                width: '100%', padding: '12px 14px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                fontSize: '16px', color: 'var(--ink)',
                background: 'var(--surface)', outline: 'none',
                resize: 'vertical', lineHeight: 1.6,
                fontFamily: 'var(--font-sans)',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--captech-blue)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-4)' }}>
                Cmd+Enter to submit
              </span>
              <span style={{
                fontSize: 'var(--fs-micro)',
                color: prompt.length > 3000 ? 'var(--score-low)' : 'var(--ink-4)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {prompt.length} chars
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={isLoading}
            iconRight={<Icon.ArrowRight size={16} />}
          >
            {isLoading ? 'Analyzing…' : 'Analyze and compare'}
          </Button>
        </div>
      )}

      {/* Loading state — only before any data has arrived */}
      {isLoading && (!partial || partial.dimensions.length === 0) && (
        <AnalysisLoadingState statusText="Analyzing and generating expert version…" />
      )}

      {/* Error */}
      {analyze.phase === 'error' && analyze.error && (
        <ErrorBanner message={analyze.error} />
      )}

      {/* Results — render incrementally as `partial` fills */}
      {hasPartial && partial && (!isLoading || partial.dimensions.length > 0) && (
        <div className="fade-in-up">
          {/* Score comparison header */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '28px 32px',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'var(--fs-h1)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' }}>
                Score comparison
              </h2>
              <Button variant="ghost" size="sm" onClick={handleReset} iconLeft={<Icon.ArrowLeft size={14} />}>
                Try Another
              </Button>
            </div>

            <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              {typeof partial.overall_score === 'number' ? (
                <ScoreDisplay
                  score={partial.overall_score}
                  label="Your Prompt"
                  size={120}
                />
              ) : (
                <Shimmer width={120} height={120} borderRadius="50%" />
              )}
              {(typeof partial.improved_overall_score === 'number' || isLoading) && (
                <>
                  <span style={{ display: 'inline-flex', color: 'var(--ink-3)' }}>
                    <Icon.ArrowRight size={22} />
                  </span>
                  {typeof partial.improved_overall_score === 'number' ? (
                    <ScoreDisplay
                      score={partial.improved_overall_score}
                      label="Expert Version"
                      size={120}
                    />
                  ) : (
                    <Shimmer width={120} height={120} borderRadius="50%" />
                  )}
                </>
              )}
            </div>

            {/* Grade + delta summary */}
            {typeof partial.improved_overall_score === 'number' && typeof partial.overall_score === 'number' && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <span style={{
                  fontSize: 'var(--fs-body)', color: 'var(--score-high)', fontWeight: 'var(--fw-semi)',
                  background: 'var(--score-high-bg)', padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--score-high)',
                }}>
                  +{(Math.round((toDisplayScore(partial.improved_overall_score) - toDisplayScore(partial.overall_score)) * 10) / 10).toFixed(1)} points improvement ({scoreLabel(partial.overall_score, true)} to {scoreLabel(partial.improved_overall_score, true)})
                </span>
              </div>
            )}

            {/* Token meter */}
            {partial.tokens && (
              <div style={{ marginTop: '20px' }}>
                <TokenMeter
                  tokens={partial.tokens}
                  analysisMs={partial.analysis_time_ms ?? 0}
                />
              </div>
            )}
          </div>

          {/* Strengths & Improvements */}
          {(partial.strengths || partial.improvements) && (
            <div className="pc-practice-coach-grid" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
              marginBottom: '24px',
            }}>
              <style>{`
                @media (max-width: 640px) {
                  .pc-practice-coach-grid { grid-template-columns: 1fr !important; }
                }
              `}</style>
              <CoachCard title="Strengths" items={partial.strengths ?? []} color="var(--score-high)" icon="✓" />
              <CoachCard title="To improve" items={partial.improvements ?? []} color="var(--score-mid)" icon="↑" />
            </div>
          )}

          {/* Hero + rail breakdown */}
          {partial.dimensions.length > 0 && (() => {
            const all = partial.dimensions
            const improvedAll = partial.improved_dimensions ?? []
            // Pick the lowest-scoring dimension as the hero — that's what improved most.
            const hero = [...all].sort((a, b) => a.score - b.score)[0]
            const heroIdx = all.findIndex(d => d.id === hero.id)
            const rail = all.filter(d => d.id !== hero.id)
            const heroImproved = improvedAll[heroIdx]?.score
            return (
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  fontSize: 'var(--fs-micro)',
                  fontWeight: 'var(--fw-semi)',
                  color: 'var(--ink-3)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>
                  Where the expert version moved most
                </div>

                <DimensionCard
                  dimension={hero}
                  variant="hero"
                  improvedScore={heroImproved}
                  showComparison={heroImproved !== undefined}
                  animationDelay={0}
                />

                {rail.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <h3 style={{
                      fontSize: 'var(--fs-h3)',
                      fontWeight: 'var(--fw-bold)',
                      color: 'var(--ink)',
                      marginBottom: '4px',
                    }}>
                      The other four areas
                    </h3>
                    <div style={{ borderBottom: '1px solid var(--border)' }}>
                      {rail.map((dim, i) => (
                        <DimensionCard
                          key={dim.id}
                          dimension={dim}
                          variant="row"
                          animationDelay={120 + i * 60}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {isLoading && all.length < 5 && (
                  <div style={{ marginTop: '12px' }}>
                    <ScoreCardShimmer />
                  </div>
                )}
              </div>
            )
          })()}

          {/* Expert prompt */}
          {partial.improved_prompt && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '28px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' }}>
                  Expert prompt
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy(partial.improved_prompt!)}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </Button>
              </div>
              <pre style={{
                background: 'var(--surface-quiet)', borderRadius: 'var(--radius-md)',
                padding: '16px', fontSize: 'var(--fs-small)', lineHeight: 1.7,
                color: 'var(--ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                fontFamily: 'var(--font-mono)', margin: 0,
                border: '1px solid var(--border)',
              }}>
                {partial.improved_prompt}
              </pre>
            </div>
          )}

          {/* AI Response */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '28px',
          }}>
            <h3 style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', marginBottom: '16px' }}>
              AI response to expert prompt
            </h3>
            {exec.expertExec.phase === 'streaming' && !exec.expertExec.text ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--ink-3)' }}>
                <div style={{
                  width: '16px', height: '16px', border: '2px solid var(--border)',
                  borderTopColor: 'var(--captech-blue)', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ fontSize: 'var(--fs-small)' }}>Running expert prompt…</span>
              </div>
            ) : exec.expertExec.phase === 'error' ? (
              <ErrorBanner message={exec.expertExec.error ?? 'Execution failed'} />
            ) : exec.expertExec.text ? (
              <>
                <div style={{
                  fontSize: 'var(--fs-body)', color: 'var(--ink)', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', background: 'var(--surface-quiet)',
                  borderRadius: 'var(--radius-md)', padding: '16px',
                  border: '1px solid var(--border)',
                }}>
                  {exec.expertExec.text}
                </div>
                {exec.expertExec.phase === 'done' && exec.expertExec.tokens && (
                  <div style={{ marginTop: '12px' }}>
                    <TokenMeter
                      tokens={{ ...exec.expertExec.tokens, cache_read: 0, cache_creation: 0 }}
                      executionMs={exec.expertExec.executionMs}
                    />
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Bottom CTA */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
            <Button variant="primary" size="lg" onClick={handleReset}>
              Analyze another prompt
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CoachCard({ title, items, color, icon }: { title: string; items: string[]; color: string; icon: string }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px',
    }}>
      <h4 style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', marginBottom: '12px' }}>
        {title}
      </h4>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span style={{ color, fontWeight: 'var(--fw-bold)', flexShrink: 0, fontSize: 'var(--fs-small)' }}>{icon}</span>
            <span style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-2)', lineHeight: 1.5 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
