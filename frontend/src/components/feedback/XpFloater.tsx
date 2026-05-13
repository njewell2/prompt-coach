import { useEffect, useState } from 'react'
import { Icon } from '@/components/shared/Icon'

export interface XpFloat {
  id: string
  label: string
  amount: number
}

const FLOAT_MS = 1800

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
          0%   { opacity: 0; transform: translate(-50%, 20px) scale(0.9); }
          15%  { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -80px) scale(1.05); }
        }
      `}</style>
      {floats.map((f, i) => (
        <Floater key={f.id} float={f} delayMs={i * 140} />
      ))}
    </div>
  )
}

function Floater({ float, delayMs }: { float: XpFloat; delayMs: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), delayMs)
    return () => window.clearTimeout(t)
  }, [delayMs])

  if (!visible) return null

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '18%',
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
