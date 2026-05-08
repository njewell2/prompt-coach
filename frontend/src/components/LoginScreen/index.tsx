import { useState, FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { CapTechLogo } from '@/components/shared/CapTechLogo'

export function LoginScreen() {
  const { login, loading, error } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await login(username.trim(), email.trim().toLowerCase())
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <CapTechLogo color="var(--captech-blue)" height={28} />
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '10px' }}>
          Prompt Engineering Coach
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-elevated)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Start training
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: 1.5 }}>
          Enter your name and email to save your progress and pick up where you left off.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Name
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your name"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--captech-blue)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--captech-blue)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '10px 12px',
              background: 'var(--score-low-bg)',
              border: '1px solid var(--score-low)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--score-low)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !email.trim()}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? 'var(--text-muted)' : 'var(--captech-blue)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Starting…' : 'Start Training →'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Your email is only used to restore your progress — no account, no password.
      </p>
    </div>
  )
}
