import { useEffect, useState } from 'react'
import { Icon } from '@/components/shared/Icon'

const BADGE_META: Record<string, { Comp: (p: any) => JSX.Element; label: string }> = {
  golden_beginner: { Comp: Icon.Trophy, label: 'Golden Beginner' },
  dimension_master: { Comp: Icon.Target, label: 'Dimension Master' },
  completionist:    { Comp: Icon.Flag,   label: 'Completionist' },
}

export function BadgeToasts({ badgeIds, onDismiss }: { badgeIds: string[]; onDismiss: (id: string) => void }) {
  return (
    <div style={{
      position: 'fixed',
      top: 'calc(env(safe-area-inset-top, 0px) + 72px)',
      right: '16px',
      zIndex: 9001,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '90vw',
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes pc-badge-in {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {badgeIds.map(id => (
        <Toast key={id} id={id} onDismiss={() => onDismiss(id)} />
      ))}
    </div>
  )
}

function Toast({ id, onDismiss }: { id: string; onDismiss: () => void }) {
  const meta = BADGE_META[id] || { Comp: Icon.Award, label: id }
  const [visible] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(onDismiss, 4000)
    return () => window.clearTimeout(t)
  }, [onDismiss])
  if (!visible) return null
  const Comp = meta.Comp
  return (
    <div style={{
      background: 'var(--accent-gold-light)',
      border: '1px solid var(--captech-yellow)',
      borderLeft: 'var(--accent-left-gold)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 16px',
      boxShadow: 'var(--shadow-elevated)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '240px',
      pointerEvents: 'auto',
      animation: 'pc-badge-in 260ms ease-out',
    }}>
      <span style={{ color: 'var(--captech-navy)', display: 'inline-flex' }}>
        <Comp size={22} />
      </span>
      <div>
        <div style={{
          fontSize: 'var(--fs-micro)',
          fontWeight: 'var(--fw-semi)',
          color: 'var(--ink-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Badge Unlocked
        </div>
        <div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' }}>
          {meta.label}
        </div>
      </div>
    </div>
  )
}
