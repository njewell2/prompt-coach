import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--captech-blue)',
    color: '#fff',
    border: '1px solid var(--captech-blue)',
  },
  secondary: {
    background: '#fff',
    color: 'var(--captech-navy)',
    border: '1px solid var(--border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--captech-blue)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--score-low)',
    color: '#fff',
    border: '1px solid var(--score-low)',
  },
}

const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 14px', fontSize: '13px', borderRadius: 'var(--radius-sm)' },
  md: { padding: '10px 20px', fontSize: '14px', borderRadius: 'var(--radius-md)' },
  lg: { padding: '14px 28px', fontSize: '15px', borderRadius: 'var(--radius-md)' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        ...styles[variant],
        ...sizes[size],
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
      {children}
    </button>
  )
}
