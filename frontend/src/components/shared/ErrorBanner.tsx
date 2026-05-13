import { Icon } from '@/components/shared/Icon'
import { Button } from '@/components/shared/Button'

interface ErrorBannerProps {
  message: string
  onDismiss?: () => void
  onRetry?: () => void
}

export function ErrorBanner({ message, onDismiss, onRetry }: ErrorBannerProps) {
  const isAuth = message.toLowerCase().includes('aws') || message.toLowerCase().includes('credential')
  const IconComp = isAuth ? Icon.Key : Icon.Alert
  const accent = isAuth ? 'var(--score-mid)' : 'var(--score-low)'
  const bg = isAuth ? 'var(--score-mid-bg)' : 'var(--score-low-bg)'

  return (
    <div style={{
      background: bg,
      border: `1px solid ${accent}`,
      borderRadius: 'var(--radius-md)',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    }}>
      <span style={{ color: accent, flexShrink: 0, display: 'inline-flex', marginTop: '1px' }}>
        <IconComp size={18} />
      </span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 'var(--fw-semi)', fontSize: 'var(--fs-body)', color: 'var(--ink)', marginBottom: '4px' }}>
          {isAuth ? 'Authentication Required' : 'Something went wrong'}
        </p>
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-2)', fontFamily: isAuth ? 'var(--font-mono)' : undefined }}>
          {message}
        </p>
        {onRetry && (
          <div style={{ marginTop: '10px' }}>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Resubmit
            </Button>
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--ink-3)', display: 'inline-flex', padding: '2px',
          }}
        >
          <Icon.Close size={16} />
        </button>
      )}
    </div>
  )
}
