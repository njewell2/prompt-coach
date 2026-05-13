import { useEffect, useState } from 'react'
import { Icon } from '@/components/shared/Icon'

export interface XpFloat {
  id: string
  label: string
  amount: number
}

const FLOAT_MS = 3500
const STACK_GAP_PX = 56
const STAGGER_MS = 220

export function XpFloaters({ floats }: { floats: XpFloat[] }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 9000,
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes pc-xp-rise {
          0%    { opacity: 0; transform: translate(-50%, 24px) scale(0.92); }
          10%   { opacity: 1; transform: translate(-50%, 0) scale(1); }
          82%   { opacity: 1; transform: translate(-50%, -16px) scale(1); }
          100%  { opacity: 0; transform: translate(-50%, -56px) scale(1); }
        }
      `}</style>
      {floats.map((f, i) => (
        <Floater key={f.id} float={f} index={i} />
      ))}
    </div>
  )
}

function Floater({ float, index }: { float: XpFloat; index: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), index * STAGGER_MS)
    return () => window.clearTimeout(t)
  }, [index])

  if (!visible) return null

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: `calc(15% + ${index * STACK_GAP_PX}px)`,
      transform: 'translateX(-50%)',
      padding: '10px 18px',
      background: 'var(--captech-yellow)',
      color: 'var(--captech-navy)',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--fs-h3)',
      fontWeight: 800,
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.18)',
      whiteSpace: 'nowrap',
      animation: `pc-xp-rise ${FLOAT_MS}ms ease-out forwards`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
    }}>
      <Icon.Zap size={16} />
      +{float.amount} XP{float.label ? ` · ${float.label}` : ''}
    </div>
  )
}
