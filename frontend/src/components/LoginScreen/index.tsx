import { useState, FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { CapTechLogo } from '@/components/shared/CapTechLogo'
import { Button } from '@/components/shared/Button'
import { Icon } from '@/components/shared/Icon'

const FOCUS_MAX = 500

export function LoginScreen() {
  const { login, loading, error } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [focus, setFocus] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await login(username.trim(), email.trim().toLowerCase(), focus.trim())
  }

  const focusOver = focus.length > FOCUS_MAX

  return (
    <div className="login-screen" style={{
      minHeight: '100vh',
      background: 'var(--page-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <style>{`
        @media (max-width: 480px) {
          .login-screen { padding: 16px !important; justify-content: flex-start !important; padding-top: 32px !important; }
          .login-card { padding: 24px !important; }
        }
      `}</style>

      {/* Brand row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
        <CapTechLogo color="var(--captech-blue)" height={32} />
        <span style={{
          fontSize: 'var(--fs-display)',
          fontWeight: 'var(--fw-bold)',
          color: 'var(--ink)',
          letterSpacing: '-0.025em',
          lineHeight: 1,
        }}>
          Prompt Coach
        </span>
      </div>

      <div className="login-card" style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-elevated)',
        padding: '32px',
        width: '100%',
        maxWidth: '440px',
      }}>
        <h2 style={{ fontSize: 'var(--fs-h1)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', margin: 0, marginBottom: '6px', letterSpacing: '-0.015em' }}>
          Start training
        </h2>
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-3)', marginBottom: '24px', lineHeight: 1.5 }}>
          Enter your name and email to save your progress and pick up where you left off.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. nick or nick_j"
              required
              autoFocus
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--captech-blue)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--captech-blue)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Where do you see AI being most valuable in your work?</label>
            <textarea
              value={focus}
              onChange={e => setFocus(e.target.value)}
              placeholder="e.g. writing first drafts, untangling data, getting unstuck on problems, prepping for meetings, learning new things…"
              rows={3}
              style={{
                ...inputStyle,
                minHeight: '88px',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.45,
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--captech-blue)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-4)' }}>Optional, but the whole room benefits.</span>
              <span style={{ fontSize: 'var(--fs-micro)', color: focusOver ? 'var(--score-low)' : 'var(--ink-4)' }}>
                {focus.length}/{FOCUS_MAX}
              </span>
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '10px 12px',
              background: 'var(--score-low-bg)',
              border: '1px solid var(--score-low)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-small)',
              color: 'var(--score-low)',
            }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            disabled={!username.trim() || !email.trim() || focusOver}
            iconRight={<Icon.ArrowRight size={16} />}
            style={{ width: '100%' }}
          >
            Start Training
          </Button>
        </form>
      </div>

      <p style={{ marginTop: '18px', fontSize: 'var(--fs-micro)', color: 'var(--ink-4)', textAlign: 'center', maxWidth: '440px' }}>
        Your email is only used to restore your progress. No account, no password.
      </p>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--fs-micro)',
  fontWeight: 'var(--fw-semi)',
  color: 'var(--ink-3)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '16px',
  color: 'var(--ink)',
  background: 'var(--surface)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}
