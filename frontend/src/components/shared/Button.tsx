import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 'var(--fs-small)', borderRadius: 'var(--radius-md)', minHeight: '32px' },
  md: { padding: '8px 16px', fontSize: 'var(--fs-body)',  borderRadius: 'var(--radius-md)', minHeight: '36px' },
  lg: { padding: '12px 22px', fontSize: 'var(--fs-h3)',   borderRadius: 'var(--radius-md)', minHeight: '44px' },
}

// Hover styles live in a stylesheet (vs. React state) so that navigation
// or unmount during a click can never leave a button stuck in its hover
// state — the browser drops :hover the moment the cursor leaves.
const STYLES = `
.pc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: var(--fw-semi);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
  line-height: 1;
}
.pc-btn:disabled { cursor: not-allowed; opacity: 0.6; }

.pc-btn--primary   { background: var(--captech-blue); color: var(--surface); border: 1px solid var(--captech-blue); }
.pc-btn--secondary { background: var(--surface); color: var(--captech-blue); border: 1px solid var(--border); }
.pc-btn--ghost     { background: transparent; color: var(--captech-blue); border: 1px solid transparent; }
.pc-btn--danger    { background: var(--score-low); color: var(--surface); border: 1px solid var(--score-low); }

.pc-btn--primary:hover:not(:disabled)   { background: var(--captech-navy); border-color: var(--captech-navy); }
.pc-btn--secondary:hover:not(:disabled) { border-color: var(--captech-blue); }
.pc-btn--ghost:hover:not(:disabled)     { background: rgba(0, 93, 185, 0.08); }
.pc-btn--danger:hover:not(:disabled)    { background: var(--score-low-strong, #B5341F); border-color: var(--score-low-strong, #B5341F); }
`

let stylesInjected = false
function ensureStyles() {
  if (stylesInjected || typeof document === 'undefined') return
  const tag = document.createElement('style')
  tag.dataset.pcButton = 'true'
  tag.textContent = STYLES
  document.head.appendChild(tag)
  stylesInjected = true
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  iconLeft,
  iconRight,
  children,
  className,
  style,
  ...rest
}: ButtonProps) {
  ensureStyles()

  return (
    <button
      disabled={disabled || loading}
      className={`pc-btn pc-btn--${variant}${className ? ` ${className}` : ''}`}
      style={{
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
