import type { DimensionScore } from '@/types'

const SOURCE_VARS: Record<string, string> = {
  Anthropic: 'var(--source-anthropic)',
  Google:    'var(--source-google)',
  OpenAI:    'var(--source-openai)',
  Meta:      'var(--source-meta)',
  arXiv:     'var(--source-arxiv)',
}

interface ResearchBadgeProps {
  citation: DimensionScore['citation']
}

export function ResearchBadge({ citation }: ResearchBadgeProps) {
  const color = SOURCE_VARS[citation.source] ?? 'var(--ink-3)'
  return (
    <div style={{
      marginTop: '12px',
      padding: '10px 12px',
      background: 'var(--surface-quiet)',
      borderRadius: 'var(--radius-md)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{
          fontSize: 'var(--fs-micro)',
          fontWeight: 'var(--fw-bold)',
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {citation.source}
        </span>
        <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-4)' }}>·</span>
        <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)' }}>{citation.reference}</span>
      </div>
      <p style={{
        fontSize: 'var(--fs-small)',
        color: 'var(--ink-2)',
        fontStyle: 'italic',
        lineHeight: 1.5,
        margin: 0,
      }}>
        "{citation.quote}"
      </p>
    </div>
  )
}
