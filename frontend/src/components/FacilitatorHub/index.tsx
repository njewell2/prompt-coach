import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { Icon } from '@/components/shared/Icon'

export function FacilitatorHub() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
      }}>
        <div style={{
          maxWidth: '720px', margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <BrandLogo logoColor="var(--captech-blue)" textColor="var(--ink)" height={22} />
          <span style={{
            fontSize: 'var(--fs-micro)',
            fontWeight: 'var(--fw-bold)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--ink-3)',
            padding: '2px 8px',
            background: 'var(--surface-quiet)',
            borderRadius: 'var(--radius-full)',
          }}>
            Facilitator
          </span>
        </div>
      </header>

      <main style={{ flex: 1, padding: '48px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', marginBottom: '8px' }}>
            Facilitator
          </h1>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-3)', marginBottom: '32px' }}>
            Tools for running the workshop.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <HubLink
              to="/facilitator/leaderboard"
              icon={<Icon.Trophy size={20} />}
              title="Leaderboard"
              subtitle="Live ranking of participants"
            />
            <HubLink
              to="/facilitator/responses"
              icon={<Icon.Message size={20} />}
              title="Results"
              subtitle="Focus responses and emerging themes"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function HubLink({ to, icon, title, subtitle }: { to: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '20px 24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        textDecoration: 'none',
        transition: 'background 0.15s, box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.background = 'var(--surface-hover)'
        el.style.boxShadow = 'var(--shadow-card-hover)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.background = 'var(--surface)'
        el.style.boxShadow = 'var(--shadow-card)'
        el.style.transform = 'translateY(0)'
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'var(--captech-blue)', color: 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' }}>
          {title}
        </div>
        <div style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-3)', marginTop: '2px' }}>
          {subtitle}
        </div>
      </div>
      <Icon.ArrowRight size={18} />
    </Link>
  )
}
