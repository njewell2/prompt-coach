import { useState, useRef, useEffect } from 'react'
import { useAnalyze } from '@/hooks/useAnalyze'
import { useExecute } from '@/hooks/useExecute'
import { useHistory } from '@/hooks/useHistory'
import { DimensionCard } from '@/components/DimensionCard'
import { ScoreDisplay } from '@/components/ScoreDisplay'
import { TokenMeter } from '@/components/TokenMeter'
import { Button } from '@/components/shared/Button'
import { ErrorBanner } from '@/components/shared/ErrorBanner'
import { AnalysisLoadingState } from '@/components/shared/LoadingShimmer'
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

  const isLoading = analyze.phase === 'loading'
  const hasResult = analyze.phase === 'done' && analyze.result !== null

  const canSubmit = prompt.trim().length >= 10 && !isLoading

  function handleSubmit() {
    if (!canSubmit) return
    const p = prompt.trim()
    setSubmittedPrompt(p)
    analyze.analyze({ prompt: p, context: topic.trim() || undefined, mode: 'practice' })
  }

  // When analysis completes in practice mode, improved_prompt is included → auto-execute it
  useEffect(() => {
    if (analyze.phase === 'done' && analyze.result?.improved_prompt && exec.phase === 'idle') {
      // In practice mode we already have the improved prompt — no reveal needed, just execute
      exec.executeOnly(analyze.result.improved_prompt)
    }
  }, [analyze.phase, analyze.result?.improved_prompt])

  // Save to history when execution completes
  useEffect(() => {
    if (exec.phase === 'done' && analyze.result && submittedPrompt) {
      addEntry(submittedPrompt, analyze.result)
    }
  }, [exec.phase])

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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Free Practice
        </h1>
        <div style={{ width: '40px', height: '3px', background: 'var(--accent-gold)', borderRadius: '2px', marginBottom: '12px' }} />
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Submit any prompt and instantly see how an expert version compares — no levels, no locks.
        </p>
      </div>

      {/* Input section */}
      {!hasResult && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '28px',
          boxShadow: 'var(--shadow-card)', marginBottom: '24px',
        }}>
          {/* Optional topic */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Context (optional)
            </label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="What's this prompt for? e.g. 'summarizing legal contracts'"
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                fontSize: '14px', color: 'var(--text-primary)',
                background: 'var(--bg-primary)', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--captech-blue)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Prompt textarea */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Your Prompt
            </label>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Write any prompt here — a task you'd give to an AI, a question you'd ask, or a template you're working on..."
              rows={8}
              style={{
                width: '100%', padding: '12px 14px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                fontSize: '14px', color: 'var(--text-primary)',
                background: 'var(--bg-primary)', outline: 'none',
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
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Cmd+Enter to submit
              </span>
              <span style={{ fontSize: '11px', color: prompt.length > 3000 ? 'var(--score-low)' : 'var(--text-muted)' }}>
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
          >
            {isLoading ? 'Analyzing…' : 'Analyze & Compare →'}
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && <AnalysisLoadingState statusText="Analyzing and generating expert version…" />}

      {/* Error */}
      {analyze.phase === 'error' && analyze.error && (
        <ErrorBanner message={analyze.error} />
      )}

      {/* Results */}
      {hasResult && analyze.result && (
        <div className="fade-in-up">
          {/* Score comparison header */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '28px 32px',
            boxShadow: 'var(--shadow-card)', marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Score Comparison
              </h2>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                ← Try Another
              </Button>
            </div>

            <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <ScoreDisplay
                score={analyze.result.overall_score}
                label="Your Prompt"
                size={120}
              />
              {analyze.result.improved_overall_score !== undefined && (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    fontSize: '24px', color: 'var(--text-muted)',
                  }}>→</div>
                  <ScoreDisplay
                    score={analyze.result.improved_overall_score}
                    label="Expert Version"
                    size={120}
                  />
                </>
              )}
            </div>

            {/* Grade + delta summary */}
            {analyze.result.improved_overall_score !== undefined && (
              <div style={{
                display: 'flex', justifyContent: 'center', marginTop: '20px',
              }}>
                <span style={{
                  fontSize: '14px', color: 'var(--score-high)', fontWeight: 600,
                  background: '#f0fdf4', padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--score-high)',
                }}>
                  +{toDisplayScore(analyze.result.improved_overall_score) - toDisplayScore(analyze.result.overall_score)} points improvement
                  {' '}({scoreLabel(analyze.result.overall_score, true)} → {scoreLabel(analyze.result.improved_overall_score ?? 0, true)})
                </span>
              </div>
            )}

            {/* Token meter */}
            {analyze.result.tokens && (
              <div style={{ marginTop: '20px' }}>
                <TokenMeter
                  tokens={analyze.result.tokens}
                  analysisMs={analyze.result.analysis_time_ms}
                />
              </div>
            )}
          </div>

          {/* Strengths & Improvements */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
            marginBottom: '24px',
          }}>
            <CoachCard title="Strengths" items={analyze.result.strengths} color="var(--score-high)" icon="✓" />
            <CoachCard title="To Improve" items={analyze.result.improvements} color="var(--score-mid)" icon="↑" />
          </div>

          {/* Dimension comparison cards */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Dimension Breakdown
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
              {analyze.result.dimensions.map((dim, i) => (
                <DimensionCard
                  key={dim.id}
                  dimension={dim}
                  improvedScore={analyze.result?.improved_dimensions?.[i]?.score}
                  showComparison={true}
                  animationDelay={i * 60}
                />
              ))}
            </div>
          </div>

          {/* Expert prompt */}
          {analyze.result.improved_prompt && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '28px',
              boxShadow: 'var(--shadow-card)', marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Expert Prompt
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy(analyze.result!.improved_prompt!)}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </Button>
              </div>
              <pre style={{
                background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                padding: '16px', fontSize: '13px', lineHeight: 1.7,
                color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                fontFamily: 'var(--font-mono)', margin: 0,
                border: '1px solid var(--border)',
              }}>
                {analyze.result.improved_prompt}
              </pre>
            </div>
          )}

          {/* AI Response */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '28px',
            boxShadow: 'var(--shadow-card)',
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              AI Response to Expert Prompt
            </h3>
            {exec.phase === 'executing' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                <div style={{
                  width: '16px', height: '16px', border: '2px solid var(--border)',
                  borderTopColor: 'var(--captech-blue)', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ fontSize: '13px' }}>Running expert prompt…</span>
              </div>
            ) : exec.phase === 'done' && exec.execution ? (
              <>
                <div style={{
                  fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)', padding: '16px',
                  border: '1px solid var(--border)',
                }}>
                  {exec.execution.response}
                </div>
                {exec.execution.tokens && (
                  <div style={{ marginTop: '12px' }}>
                    <TokenMeter tokens={{ ...exec.execution.tokens, cache_read: 0, cache_creation: 0 }} executionMs={exec.execution.execution_time_ms} />
                  </div>
                )}
              </>
            ) : exec.phase === 'error' ? (
              <ErrorBanner message={exec.error ?? 'Execution failed'} />
            ) : null}
          </div>

          {/* Bottom CTA */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
            <Button variant="primary" size="lg" onClick={handleReset}>
              Analyze Another Prompt
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
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
        {title}
      </h4>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span style={{ color, fontWeight: 700, flexShrink: 0, fontSize: '13px' }}>{icon}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
