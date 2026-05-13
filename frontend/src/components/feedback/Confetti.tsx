import { useEffect, useMemo, useState } from 'react'

const COUNT = 36
const DURATION_MS = 2200

interface Particle {
  id: number
  dx: number
  dy: number
  rot: number
  color: string
  size: number
  delay: number
}

const COLORS = ['#FDDA24', '#005DB9', '#00A5DF', '#003865', '#E8B923', '#FFFBE6']

export function Confetti({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false)
  const particles = useMemo<Particle[]>(() => makeParticles(), [])

  useEffect(() => {
    if (!show) return
    setVisible(true)
    const t = window.setTimeout(() => setVisible(false), DURATION_MS)
    return () => window.clearTimeout(t)
  }, [show])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: 8999,
    }}>
      <style>{`
        @keyframes pc-confetti {
          0%   { opacity: 0; transform: translate(0, 0) rotate(0); }
          10%  { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: '38%',
            width: `${p.size}px`,
            height: `${p.size * 0.4}px`,
            background: p.color,
            borderRadius: '2px',
            ['--dx' as any]: `${p.dx}px`,
            ['--dy' as any]: `${p.dy}px`,
            ['--rot' as any]: `${p.rot}deg`,
            animation: `pc-confetti ${DURATION_MS}ms ease-out ${p.delay}ms forwards`,
          }}
        />
      ))}
    </div>
  )
}

function makeParticles(): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < COUNT; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 180 + Math.random() * 240
    out.push({
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist + 120,   // bias downward
      rot: (Math.random() - 0.5) * 720,
      color: COLORS[i % COLORS.length],
      size: 8 + Math.random() * 6,
      delay: Math.random() * 180,
    })
  }
  return out
}
