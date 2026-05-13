import React, { useState } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

const baseStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--captech-blue)',
    color: 'var(--surface)',
    border: '1px solid var(--captech-blue)',
  },
  secondary: {
    background: 'var(--surface)',
    color: 'var(--captech-blue)',
    border: '1px solid var(--border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--captech-blue)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--score-low)',
    color: 'var(--surface)',
    border: '1px solid var(--score-low)',
  },
}

const hoverStyles: Record<Variant, React.CSSProperties> = {
  primary:   { background: 'var(--captech-navy)', borderColor: 'var(--captech-navy)' },
  secondary: { borderColor: 'var(--captech-blue)' },
  ghost:     { background: 'rgba(0, 93, 185, 0.08)' },
  danger:    { background: 'var(--score-low-strong, #B5341F)', borderColor: 'var(--score-low-strong, #B5341F)' },
}

const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 'var(--fs-small)', borderRadius: 'var(--radius-md)', minHeight: '32px' },
  md: { padding: '8px 16px', fontSize: 'var(--fs-body)',  borderRadius: 'var(--radius-md)', minHeight: '36px' },
  lg: { padding: '12px 22px', fontSize: 'var(--fs-h3)',   borderRadius: 'var(--radius-md)', minHeight: '44px' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  iconLeft,
  iconRight,
  children,
  style,
  ...rest
}: ButtonProps) {
  const [hover, setHover] = useState(false)
  const variantStyle = { ...baseStyles[variant], ...(hover && !disabled && !loading ? hoverStyles[variant] : {}) }

  return (
    <button
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontWeight: 'var(--fw-semi)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        ...sizes[size],
        ...variantStyle,
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span style={{
          width: '14px', height: '14px', borderRadius: '50%',
          border: '2px solid currentColor', borderTopColor: 'transparent',
          animation: 'spin 0.7s linear infinite', display: 'inline-block',
        }} />
      )}
      {!loading && iconLeft && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{iconLeft}</span>
      )}
      {children}
      {!loading && iconRight && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{iconRight}</span>
      )}
    </button>
  )
}
