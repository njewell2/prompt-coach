import { useEffect, useRef } from 'react'
import type { DimensionScore } from '@/types'
import { scoreColor, deltaColor, formatDelta } from '@/utils/score'
import { ResearchBadge } from '@/components/ResearchBadge'

interface DimensionCardProps {
  dimension: DimensionScore
  previousScore?: number          // for delta display
  improvedScore?: number          // for comparison mode
  isFocused?: boolean             // highlighted challenge dimension
  showComparison?: boolean
  animationDelay?: number
}

export function DimensionCard({
  dimension,
  previousScore,
  improvedScore,
  isFocused = false,
  showComparison = false,
  animationDelay = 0,
}: DimensionCardProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const improvBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = `${dimension.score * 10}%`
      if (improvBarRef.current && improvedScore !== undefined) {
        improvBarRef.current.style.width = `${improvedScore * 10}%`
      }
    }, animationDelay)
    return () => clearTimeout(timeout)
  }, [dimension.score, improvedScore, animationDelay])

  const delta = previousScore !== undefined ? dimension.score - previousScore : undefined
  const color = scoreColor(dimension.score)

  return (
    <div
      className="fade-in-up"
      style={{
        background: 'var(--surface)',
        border: isFocused ? '1px solid var(--captech-blue)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        animationDelay: `${animationDelay}ms`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isFocused && (
            <span style={{
              fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)',
              background: 'var(--captech-blue)', color: 'var(--text-inverse)',
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Focus
            </span>
          )}
          <span style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semi)', color: 'var(--ink)' }}>
            {dimension.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {delta !== undefined && delta !== 0 && (
            <span style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semi)', color: deltaColor(delta) }}>
              {formatDelta(delta)}
            </span>
          )}
          <span style={{
            fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-bold)', color,
            minWidth: '36px', textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {dimension.score}<span style={{ fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-reg)', color: 'var(--ink-3)' }}>/10</span>
          </span>
        </div>
      </div>

      {/* Score bar(s) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
        {/* User score bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showComparison && (
            <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', width: '28px', flexShrink: 0, fontWeight: 'var(--fw-semi)' }}>You</span>
          )}
          <div style={{
            flex: 1, height: '8px', background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-full)', overflow: 'hidden',
          }}>
            <div
              ref={barRef}
              style={{
                height: '100%', width: '0%',
                background: color,
                borderRadius: 'var(--radius-full)',
                transition: 'width 700ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          </div>
        </div>

        {/* Improved score bar */}
        {showComparison && improvedScore !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', width: '28px', flexShrink: 0, fontWeight: 'var(--fw-semi)' }}>AI</span>
            <div style={{
              flex: 1, height: '8px', background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-full)', overflow: 'hidden',
            }}>
              <div
                ref={improvBarRef}
                style={{
                  height: '100%', width: '0%',
                  background: scoreColor(improvedScore),
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 700ms cubic-bezier(0.22, 1, 0.36, 1) 200ms',
                }}
              />
            </div>
            <span style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semi)', color: scoreColor(improvedScore), minWidth: '30px', fontVariantNumeric: 'tabular-nums' }}>
              {improvedScore}/10
            </span>
            {improvedScore > dimension.score && (
              <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--score-high)', fontWeight: 'var(--fw-bold)' }}>
                +{improvedScore - dimension.score}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Explanation */}
      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: '10px' }}>
        {dimension.explanation}
      </p>

      {/* Suggestion — hidden at perfect score (nothing to improve) */}
      {dimension.score < 10 && (
        <div style={{
          padding: '10px 12px',
          background: 'var(--accent-gold-light)',
          borderRadius: 'var(--radius-md)',
          borderLeft: 'var(--accent-left-gold)',
          marginBottom: '4px',
        }}>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink)', lineHeight: 1.5, margin: 0 }}>
            <strong>Try this:</strong> {dimension.suggestion}
          </p>
        </div>
      )}

      <ResearchBadge citation={dimension.citation} />
    </div>
  )
}
