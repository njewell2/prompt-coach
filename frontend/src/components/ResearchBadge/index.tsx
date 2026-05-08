import type { DimensionScore } from '@/types'

const SOURCE_COLORS: Record<string, string> = {
  Anthropic: '#d97706',
  Google:    '#1e56b0',
  OpenAI:    '#16a34a',
  Meta:      '#7c3aed',
  arXiv:     '#db2777',
}

interface ResearchBadgeProps {
  citation: DimensionScore['citation']
}

export function ResearchBadge({ citation }: ResearchBadgeProps) {
  const color = SOURCE_COLORS[citation.source] ?? '#64748b'
  return (
    <div style={{
      marginTop: '12px',
      padding: '10px 12px',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-sm)',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {citation.source}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>·</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{citation.reference}</span>
      </div>
      <p style={{
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontStyle: 'italic',
        lineHeight: 1.5,
        margin: 0,
      }}>
        "{citation.quote}"
      </p>
    </div>
  )
}
