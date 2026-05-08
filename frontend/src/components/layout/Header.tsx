import { useNavigate, useLocation } from 'react-router-dom'
import { useProgress } from '@/hooks/useProgress'
import { useAuth, type AuthUser } from '@/hooks/useAuth'
import { CapTechLogo } from '@/components/shared/CapTechLogo'

export function Header({ user }: { user: AuthUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { stats } = useProgress()
  const { logout } = useAuth()
  const appStats = stats()

  const navLinks = [
    { path: '/', label: 'Training' },
    { path: '/practice', label: 'Practice' },
    { path: '/progress', label: 'Progress' },
  ]

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header style={{
      background: 'var(--captech-navy)',
      borderBottom: 'none',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    }}>
      <div style={{
        maxWidth: '900px', margin: '0 auto',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px',
      }}>
        {/* App name */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>
            Prompt Coach
          </span>
        </button>

        {/* Nav + user */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                background: isActive(link.path) ? 'rgba(255,255,255,0.12)' : 'none',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: isActive(link.path) ? 700 : 400,
                color: isActive(link.path) ? '#fff' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'background 0.15s, color 0.15s',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => {
                if (!isActive(link.path)) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
                }
              }}
              onMouseLeave={e => {
                if (!isActive(link.path)) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'
                }
              }}
            >
              {link.label}
              {link.path === '/progress' && appStats.gold > 0 && (
                <span style={{
                  fontSize: '10px', background: 'var(--captech-yellow)',
                  color: 'var(--captech-navy)', fontWeight: 700,
                  padding: '1px 5px', borderRadius: 'var(--radius-full)',
                }}>
                  {appStats.gold}★
                </span>
              )}
            </button>
          ))}

          {/* User + logout */}
          <div style={{ marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.username}
            </span>
            <button
              onClick={logout}
              title="Sign out"
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 'var(--radius-sm)', padding: '3px 8px',
                fontSize: '11px', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            >
              out
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}
