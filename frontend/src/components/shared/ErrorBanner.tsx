interface ErrorBannerProps {
  message: string
  onDismiss?: () => void
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const isAuth = message.toLowerCase().includes('aws') || message.toLowerCase().includes('credential')

  return (
    <div style={{
      background: isAuth ? 'var(--score-mid-bg)' : 'var(--score-low-bg)',
      border: `1px solid ${isAuth ? 'var(--score-mid)' : 'var(--score-low)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    }}>
      <span style={{ fontSize: '18px', flexShrink: 0 }}>{isAuth ? '🔐' : '⚠️'}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {isAuth ? 'Authentication Required' : 'Something went wrong'}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: isAuth ? 'var(--font-mono)' : undefined }}>
          {message}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1 }}
        >
          ×
        </button>
      )}
    </div>
  )
}
