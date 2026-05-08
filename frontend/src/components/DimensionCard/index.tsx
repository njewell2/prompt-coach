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
        background: 'var(--bg-card)',
        border: isFocused ? '2px solid var(--captech-blue)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
        animationDelay: `${animationDelay}ms`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isFocused && (
            <span style={{
              fontSize: '10px', fontWeight: 700,
              background: 'var(--captech-blue)', color: '#fff',
              padding: '2px 7px', borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Focus
            </span>
          )}
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {dimension.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {delta !== undefined && delta !== 0 && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: deltaColor(delta) }}>
              {formatDelta(delta)}
            </span>
          )}
          <span style={{
            fontSize: '15px', fontWeight: 700, color,
            minWidth: '36px', textAlign: 'right',
          }}>
            {dimension.score}<span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>/10</span>
          </span>
        </div>
      </div>

      {/* Score bar(s) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
        {/* User score bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showComparison && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '28px', flexShrink: 0 }}>You</span>
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
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>
        </div>

        {/* Improved score bar */}
        {showComparison && improvedScore !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '28px', flexShrink: 0 }}>AI</span>
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
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1) 0.2s',
                }}
              />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: scoreColor(improvedScore), minWidth: '30px' }}>
              {improvedScore}/10
            </span>
            {improvedScore > dimension.score && (
              <span style={{ fontSize: '11px', color: 'var(--score-high)', fontWeight: 600 }}>
                +{improvedScore - dimension.score}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Explanation */}
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
        {dimension.explanation}
      </p>

      {/* Suggestion */}
      <div style={{
        padding: '10px 12px',
        background: 'var(--accent-gold-light)',
        borderRadius: 'var(--radius-sm)',
        borderLeft: '3px solid var(--accent-gold)',
        marginBottom: '4px',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
          <strong>Try this:</strong> {dimension.suggestion}
        </p>
      </div>

      <ResearchBadge citation={dimension.citation} />
    </div>
  )
}
