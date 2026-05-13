import { useEffect, useRef } from 'react'
import type { DimensionScore } from '@/types'
import { scoreColor, deltaColor, formatDelta } from '@/utils/score'
import { ResearchBadge } from '@/components/ResearchBadge'

type DimensionVariant = 'card' | 'hero' | 'row'

interface DimensionCardProps {
  dimension: DimensionScore
  previousScore?: number          // for delta display
  improvedScore?: number          // for comparison mode
  isFocused?: boolean             // highlighted challenge dimension
  showComparison?: boolean
  animationDelay?: number
  variant?: DimensionVariant      // 'card' = legacy, 'hero' = full-width with citation, 'row' = compact rail
}

export function DimensionCard({
  dimension,
  previousScore,
  improvedScore,
  isFocused = false,
  showComparison = false,
  animationDelay = 0,
  variant = 'card',
}: DimensionCardProps) {
  if (variant === 'row') {
    return <DimensionRow dimension={dimension} previousScore={previousScore} animationDelay={animationDelay} />
  }
  if (variant === 'hero') {
    return <DimensionHero
      dimension={dimension}
      previousScore={previousScore}
      improvedScore={improvedScore}
      showComparison={showComparison}
      animationDelay={animationDelay}
    />
  }
  return <DimensionCardLegacy
    dimension={dimension}
    previousScore={previousScore}
    improvedScore={improvedScore}
    isFocused={isFocused}
    showComparison={showComparison}
    animationDelay={animationDelay}
  />
}

function DimensionCardLegacy({
  dimension,
  previousScore,
  improvedScore,
  isFocused = false,
  showComparison = false,
  animationDelay = 0,
}: Omit<DimensionCardProps, 'variant'>) {
  const barRef = useRef<HTMLDivElement>(null)
  const improvBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${dimension.score / 10})`
      if (improvBarRef.current && improvedScore !== undefined) {
        improvBarRef.current.style.transform = `scaleX(${improvedScore / 10})`
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isFocused && (
            <span style={{
              fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)',
              background: 'var(--captech-blue)', color: 'var(--surface)',
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showComparison && (
            <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', width: '28px', flexShrink: 0, fontWeight: 'var(--fw-semi)' }}>You</span>
          )}
          <Bar refEl={barRef} color={color} />
        </div>

        {showComparison && improvedScore !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', width: '28px', flexShrink: 0, fontWeight: 'var(--fw-semi)' }}>AI</span>
            <Bar refEl={improvBarRef} color={scoreColor(improvedScore)} delayMs={200} />
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

      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: '10px' }}>
        {dimension.explanation}
      </p>

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

/**
 * Hero variant — full-width, used for the focused dimension on the result page.
 * Larger score, side-by-side bar + bullets, citation underneath.
 */
function DimensionHero({
  dimension,
  previousScore,
  improvedScore,
  showComparison = false,
  animationDelay = 0,
}: Omit<DimensionCardProps, 'isFocused' | 'variant'>) {
  const barRef = useRef<HTMLDivElement>(null)
  const improvBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${dimension.score / 10})`
      if (improvBarRef.current && improvedScore !== undefined) {
        improvBarRef.current.style.transform = `scaleX(${improvedScore / 10})`
      }
    }, animationDelay)
    return () => clearTimeout(t)
  }, [dimension.score, improvedScore, animationDelay])

  const delta = previousScore !== undefined ? dimension.score - previousScore : undefined
  const color = scoreColor(dimension.score)

  return (
    <div
      className="fade-in-up pc-hero-dim"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: 'var(--accent-left-blue)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--fs-micro)',
            fontWeight: 'var(--fw-semi)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--captech-blue)',
            marginBottom: '4px',
          }}>
            Focus area
          </div>
          <div style={{ fontSize: 'var(--fs-h1)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', lineHeight: 1.15, letterSpacing: '-0.015em' }}>
            {dimension.name}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexShrink: 0 }}>
          {delta !== undefined && delta !== 0 && (
            <span style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semi)', color: deltaColor(delta) }}>
              {formatDelta(delta)}
            </span>
          )}
          <span style={{
            fontSize: 'var(--fs-numeral)', fontWeight: 'var(--fw-bold)', color,
            fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            letterSpacing: '-0.025em',
          }}>
            {dimension.score}
          </span>
          <span style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-3)', fontWeight: 'var(--fw-reg)' }}>
            /10
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showComparison && (
            <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', width: '28px', flexShrink: 0, fontWeight: 'var(--fw-semi)' }}>You</span>
          )}
          <Bar refEl={barRef} color={color} height={10} />
        </div>
        {showComparison && improvedScore !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', width: '28px', flexShrink: 0, fontWeight: 'var(--fw-semi)' }}>AI</span>
            <Bar refEl={improvBarRef} color={scoreColor(improvedScore)} height={10} delayMs={200} />
            <span style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semi)', color: scoreColor(improvedScore), minWidth: '30px', fontVariantNumeric: 'tabular-nums' }}>
              {improvedScore}/10
            </span>
          </div>
        )}
      </div>

      <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: '14px', maxWidth: '70ch' }}>
        {dimension.explanation}
      </p>

      {dimension.score < 10 && (
        <div style={{
          padding: '12px 14px',
          background: 'var(--accent-gold-light)',
          borderRadius: 'var(--radius-md)',
          borderLeft: 'var(--accent-left-gold)',
          marginBottom: '12px',
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

/**
 * Compact rail row — the four non-focused dimensions on the result page.
 * One line: name, score, bar, optional delta. No citation, no suggestion.
 */
function DimensionRow({
  dimension,
  previousScore,
  animationDelay = 0,
}: Omit<DimensionCardProps, 'isFocused' | 'variant' | 'showComparison' | 'improvedScore'>) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${dimension.score / 10})`
    }, animationDelay)
    return () => clearTimeout(t)
  }, [dimension.score, animationDelay])

  const delta = previousScore !== undefined ? dimension.score - previousScore : undefined
  const color = scoreColor(dimension.score)

  return (
    <div
      className="fade-in-up"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(120px, 28%) minmax(80px, 1fr) auto',
        alignItems: 'center',
        gap: '14px',
        padding: '10px 0',
        borderTop: '1px solid var(--border)',
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <span style={{
        fontSize: 'var(--fs-small)',
        fontWeight: 'var(--fw-semi)',
        color: 'var(--ink)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {dimension.name}
      </span>
      <Bar refEl={barRef} color={color} height={6} />
      <span style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '6px',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {delta !== undefined && delta !== 0 && (
          <span style={{ fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semi)', color: deltaColor(delta) }}>
            {formatDelta(delta)}
          </span>
        )}
        <span style={{
          fontSize: 'var(--fs-small)',
          fontWeight: 'var(--fw-bold)',
          color,
          minWidth: '36px',
          textAlign: 'right',
        }}>
          {dimension.score.toFixed(1)}
          <span style={{ fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-reg)', color: 'var(--ink-4)' }}>
            /10
          </span>
        </span>
      </span>
    </div>
  )
}

/**
 * Score bar — animates with `transform: scaleX(...)` (compositor) instead of `width` (layout).
 * Bar starts at scaleX(0) and the parent applies the target scale once `animationDelay` elapses.
 */
function Bar({
  refEl,
  color,
  height = 8,
  delayMs = 0,
}: {
  refEl: React.RefObject<HTMLDivElement>
  color: string
  height?: number
  delayMs?: number
}) {
  return (
    <div style={{
      flex: 1, height: `${height}px`, background: 'var(--surface-quiet)',
      borderRadius: 'var(--radius-full)', overflow: 'hidden',
    }}>
      <div
        ref={refEl}
        style={{
          height: '100%', width: '100%',
          background: color,
          borderRadius: 'var(--radius-full)',
          transformOrigin: 'left center',
          transform: 'scaleX(0)',
          transition: `transform 700ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms`,
        }}
      />
    </div>
  )
}
