import type { CSSProperties, ReactNode } from 'react'

type Accent = 'none' | 'gold' | 'blue'
type Variant = 'default' | 'quiet'

interface CardProps {
  children: ReactNode
  accent?: Accent
  variant?: Variant
  padding?: number | string
  onClick?: () => void
  className?: string
  style?: CSSProperties
  interactive?: boolean
  id?: string
  role?: string
  ariaLabel?: string
}

export function Card({
  children,
  accent = 'none',
  variant = 'default',
  padding = 20,
  onClick,
  className,
  style,
  interactive,
  id,
  role,
  ariaLabel,
}: CardProps) {
  const isInteractive = Boolean(onClick) || interactive
  const base: CSSProperties = {
    background: variant === 'quiet' ? 'var(--surface-quiet)' : 'var(--surface)',
    border: variant === 'quiet' ? '1px solid transparent' : '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: typeof padding === 'number' ? `${padding}px` : padding,
    boxShadow: variant === 'quiet' ? 'none' : 'var(--shadow-card)',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
  }
  if (accent === 'gold') base.borderLeft = 'var(--accent-left-gold)'
  if (accent === 'blue') base.borderLeft = 'var(--accent-left-blue)'
  if (isInteractive) {
    base.cursor = 'pointer'
  }
  return (
    <div
      id={id}
      role={role}
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
      style={{ ...base, ...style }}
      onMouseEnter={isInteractive ? (e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card-hover)'
      } : undefined}
      onMouseLeave={isInteractive ? (e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = variant === 'quiet' ? 'none' : 'var(--shadow-card)'
      } : undefined}
    >
      {children}
    </div>
  )
}
