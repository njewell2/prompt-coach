import { useEffect, useState } from 'react'
import { scoreLabel, scoreColor, toDisplayScore } from '@/utils/score'

interface ScoreDisplayProps {
  score: number        // 0-100 internal score
  size?: number
  showLabel?: boolean
  label?: string
}

export function ScoreDisplay({ score, size = 120, showLabel = true, label }: ScoreDisplayProps) {
  const displayScore = toDisplayScore(score)   // 0–10
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    let frame: number
    const start = performance.now()
    const duration = 1200

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(eased * displayScore)
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [displayScore])

  const color = scoreColor(score, true)
  const lbl = scoreLabel(score, true)
  const r = (size / 2) - 8
  const circumference = 2 * Math.PI * r
  // Arc represents score/10 of full circle
  const dash = (displayed / 10) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="var(--border)" strokeWidth="6"
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke 0.3s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: size * 0.22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {displayed.toFixed(1)}
          </span>
          <span style={{ fontSize: size * 0.11, color: 'var(--text-muted)', lineHeight: 1, marginTop: '1px' }}>
            / 10
          </span>
          {showLabel && (
            <span style={{ fontSize: size * 0.1, fontWeight: 600, color, lineHeight: 1, marginTop: '4px', textAlign: 'center' }}>
              {lbl}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      )}
    </div>
  )
}
