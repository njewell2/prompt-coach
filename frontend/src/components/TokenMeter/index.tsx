import type { TokenUsage } from '@/types'
import { Icon } from '@/components/shared/Icon'

interface TokenMeterProps {
  tokens: TokenUsage
  analysisMs?: number
  executionMs?: number
}

export function TokenMeter({ tokens, analysisMs, executionMs }: TokenMeterProps) {
  const total = tokens.input + tokens.output + (tokens.cache_read ?? 0)
  const hasCacheHit = (tokens.cache_read ?? 0) > 0

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
      padding: '10px 16px',
      background: 'var(--surface-quiet)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
      fontSize: 'var(--fs-micro)',
      color: 'var(--ink-3)',
    }}>
      <span style={{ fontWeight: 'var(--fw-semi)', color: 'var(--ink-2)' }}>Tokens used:</span>
      <span>{tokens.input.toLocaleString()} in</span>
      <span>·</span>
      <span>{tokens.output.toLocaleString()} out</span>
      {hasCacheHit && (
        <>
          <span>·</span>
          <span style={{ color: 'var(--score-high)', fontWeight: 'var(--fw-semi)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {tokens.cache_read.toLocaleString()} cached <Icon.Zap size={12} />
          </span>
        </>
      )}
      <span>·</span>
      <span style={{ color: 'var(--ink-2)' }}>{total.toLocaleString()} total</span>
      {analysisMs && (
        <>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-3)' }}>
            {(analysisMs / 1000).toFixed(1)}s
          </span>
        </>
      )}
    </div>
  )
}
