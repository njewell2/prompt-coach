import type { CSSProperties, ReactNode } from 'react'

export function Eyebrow({ children, color, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div style={{
      fontSize: 'var(--fs-micro)',
      fontWeight: 'var(--fw-semi)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: color ?? 'var(--ink-3)',
      ...style,
    }}>
      {children}
    </div>
  )
}
