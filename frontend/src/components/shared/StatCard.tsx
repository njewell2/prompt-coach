import type { ReactNode } from 'react'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: 'none' | 'gold' | 'blue'
}

export function StatCard({ label, value, sub, accent = 'none' }: StatCardProps) {
  return (
    <Card accent={accent} padding={18}>
      <div style={{
        fontSize: 'var(--fs-micro)',
        fontWeight: 'var(--fw-semi)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
        marginBottom: '8px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'clamp(24px, 6vw, 30px)',
        fontWeight: 'var(--fw-bold)',
        color: 'var(--ink)',
        lineHeight: 1.05,
        letterSpacing: 'var(--tracking-tight)',
        fontVariantNumeric: 'tabular-nums',
        wordBreak: 'break-word',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: '4px', fontSize: 'var(--fs-small)', color: 'var(--ink-3)' }}>
          {sub}
        </div>
      )}
    </Card>
  )
}
