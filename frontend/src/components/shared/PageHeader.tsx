import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  eyebrow?: ReactNode
  right?: ReactNode
  size?: 'default' | 'compact'
}

export function PageHeader({ title, subtitle, eyebrow, right, size = 'default' }: PageHeaderProps) {
  const titleSize = size === 'compact' ? 'var(--fs-h1)' : 'var(--fs-display)'
  return (
    <header style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap',
      marginBottom: size === 'compact' ? '20px' : '28px',
    }}>
      <div style={{ minWidth: 0, flex: '1 1 260px' }}>
        {eyebrow && (
          <div style={{
            fontSize: 'var(--fs-micro)',
            fontWeight: 'var(--fw-semi)',
            color: 'var(--ink-3)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>
            {eyebrow}
          </div>
        )}
        <h1 style={{
          fontSize: titleSize,
          lineHeight: 1.2,
          margin: 0,
          color: 'var(--ink)',
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            marginTop: '8px',
            fontSize: 'var(--fs-body)',
            color: 'var(--ink-3)',
            lineHeight: 1.5,
            maxWidth: '640px',
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {right && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {right}
        </div>
      )}
    </header>
  )
}
