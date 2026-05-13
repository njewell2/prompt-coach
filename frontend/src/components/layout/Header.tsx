import { useNavigate, useLocation } from 'react-router-dom'
import { useProgress } from '@/hooks/useProgress'
import { useAuth, type AuthUser } from '@/hooks/useAuth'
import { Icon } from '@/components/shared/Icon'
import { BrandLogo } from '@/components/shared/BrandLogo'

const BADGE_META: Record<string, { Comp: (p: any) => JSX.Element; label: string }> = {
  golden_beginner: { Comp: Icon.Trophy, label: 'Golden Beginner' },
  dimension_master: { Comp: Icon.Target, label: 'Dimension Master' },
  completionist: { Comp: Icon.Flag, label: 'Completionist' },
}

export function Header({ user }: { user: AuthUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { xpTotal, badges } = useProgress()
  const { logout } = useAuth()

  const navLinks = [
    { path: '/', label: 'Training' },
    { path: '/progress', label: 'Progress' },
  ]

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const earnedBadges = Object.entries(badges).filter(([, b]) => b.earned)

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <style>{`
        @media (max-width: 640px) {
          .pc-header-inner {
            flex-wrap: wrap !important;
            padding: 8px 16px !important;
            height: auto !important;
            gap: 8px !important;
          }
          .pc-header-nav { flex-wrap: wrap !important; gap: 2px !important; }
          .pc-header-user { max-width: 80px !important; font-size: 11px !important; }
        }
      `}</style>

      <div
        className="pc-header-inner"
        style={{
          maxWidth: '900px', margin: '0 auto',
          padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '60px',
          gap: '16px',
        }}
      >
        {/* Brand cluster */}
        <button
          onClick={() => navigate('/')}
          aria-label="Prompt Coach — home"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center',
          }}
        >
          <BrandLogo logoColor="var(--captech-blue)" textColor="var(--ink)" height={26} />
        </button>

        {/* XP pill + earned badges — kept separate so they have breathing room and aren't part of the brand hit-area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
          <span
            title={`${xpTotal} XP`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'var(--fs-small)',
              background: 'var(--captech-yellow)',
              color: 'var(--captech-navy)',
              fontWeight: 'var(--fw-bold)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              lineHeight: 1,
            }}
          >
            <Icon.Zap size={13} />
            {xpTotal}
          </span>

          {earnedBadges.length > 0 && (
            <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
              {earnedBadges.map(([bid, b]) => {
                const meta = BADGE_META[bid]
                if (!meta) return null
                const C = meta.Comp
                return (
                  // Earned badges sit next to the yellow XP pill, so we render them in
                  // captech-navy (not yellow) to honor DESIGN.md's One Spark Rule:
                  // at most one yellow glyph above 14px on any given screen.
                  <span key={bid} title={b.label} style={{ color: 'var(--captech-navy)', display: 'inline-flex' }}>
                    <C size={16} />
                  </span>
                )
              })}
            </span>
          )}
        </div>

        <nav className="pc-header-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {navLinks.map(link => {
            const active = isActive(link.path)
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 10px',
                  height: '60px',
                  fontSize: 'var(--fs-small)',
                  fontWeight: active ? 'var(--fw-semi)' : 'var(--fw-reg)',
                  color: active ? 'var(--ink)' : 'var(--ink-3)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'color 0.15s',
                  letterSpacing: '0.01em',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-3)'
                }}
              >
                {link.label}
                {active && (
                  <span style={{
                    position: 'absolute',
                    left: '10px', right: '10px', bottom: 0,
                    height: '2px',
                    background: 'var(--captech-blue)',
                    borderRadius: '2px 2px 0 0',
                  }} />
                )}
              </button>
            )
          })}

          <div style={{
            marginLeft: '8px',
            paddingLeft: '12px',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span
              className="pc-header-user"
              style={{
                fontSize: 'var(--fs-small)',
                color: 'var(--ink-3)',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.username}
            </span>
            <button
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '6px',
                color: 'var(--ink-3)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '36px',
                minWidth: '36px',
                justifyContent: 'center',
              }}
            >
              <Icon.Logout size={15} />
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}
