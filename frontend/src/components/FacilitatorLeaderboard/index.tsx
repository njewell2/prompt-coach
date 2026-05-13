import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { LeaderboardRow, LeaderboardTopResponse } from '@/types'
import { Icon } from '@/components/shared/Icon'

const POLL_MS = 3000

const MEDAL_COLORS = ['var(--medal-gold)', 'var(--medal-silver)', 'var(--medal-bronze)']

export function FacilitatorLeaderboard() {
  const [data, setData] = useState<LeaderboardTopResponse | null>(null)
  const prevState = useRef<Map<string, { xp: number; rank: number }>>(new Map())
  const [pulseUsers, setPulseUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    async function tick() {
      try {
        const res = await fetch('/api/leaderboard/top')
        if (!res.ok) return
        const payload = (await res.json()) as LeaderboardTopResponse
        if (!cancelled) setData(payload)
      } catch { /* ignore */ }
    }
    tick()
    const t = window.setInterval(tick, POLL_MS)
    return () => { cancelled = true; window.clearInterval(t) }
  }, [])

  useEffect(() => {
    if (!data) return
    const changed = new Set<string>()
    for (const r of data.top) {
      const rank = r.rank ?? 0
      const prev = prevState.current.get(r.username)
      if (prev && prev.rank !== rank) {
        changed.add(r.username)
      }
    }
    prevState.current = new Map(data.top.map(r => [r.username, { xp: r.xp, rank: r.rank ?? 0 }]))
    if (changed.size) {
      setPulseUsers(changed)
      const t = window.setTimeout(() => setPulseUsers(new Set()), 1400)
      return () => window.clearTimeout(t)
    }
  }, [data])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--captech-dark-navy)',
      color: 'var(--surface)',
      padding: '32px 20px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @keyframes pc-flb-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(253, 218, 36, 0.6); background-color: rgba(253, 218, 36, 0.22); }
          100% { box-shadow: 0 0 0 12px rgba(253, 218, 36, 0); background-color: rgba(255,255,255,0.04); }
        }
        @media (max-width: 640px) {
          .pc-flb-root { padding: 20px 10px !important; }
          .pc-flb-title { font-size: 22px !important; }
          .pc-flb-row { padding: 10px 12px !important; gap: 12px !important; }
          .pc-flb-rank { font-size: 24px !important; min-width: 38px !important; }
          .pc-flb-name { font-size: 16px !important; }
          .pc-flb-xp { font-size: 18px !important; }
        }
      `}</style>

      <div className="pc-flb-root" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '18px', flexWrap: 'wrap', gap: '12px',
        }}>
          <h1 className="pc-flb-title" style={{
            fontSize: '28px', fontWeight: 'var(--fw-bold)', margin: 0,
            letterSpacing: '-0.01em',
            color: '#fff',
          }}>
            Leaderboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 'var(--fs-small)', color: 'rgba(255,255,255,0.6)' }}>
              {data ? `${data.total} participants` : 'Loading…'}
            </div>
            <Link
              to="/facilitator/responses"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                fontSize: 'var(--fs-small)',
                fontWeight: 'var(--fw-semi)',
                color: 'var(--surface)',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
              }}
            >
              <Icon.ArrowLeft size={14} /> Responses
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {data?.top.map(r => (
            <Row key={r.username} row={r} pulse={pulseUsers.has(r.username)} />
          ))}
          {data && data.top.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              No one on the board yet. Scores appear after the first submissions.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ row, pulse }: { row: LeaderboardRow; pulse: boolean }) {
  const rank = row.rank ?? 0
  const medal = rank >= 1 && rank <= 3 ? MEDAL_COLORS[rank - 1] : 'rgba(255,255,255,0.5)'
  const showMedal = rank >= 1 && rank <= 3
  return (
    <div
      className="pc-flb-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        padding: '14px 18px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius-lg)',
        animation: pulse ? 'pc-flb-pulse 1.3s ease-out' : undefined,
      }}
    >
      <div className="pc-flb-rank" style={{
        minWidth: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px',
        fontSize: 'clamp(28px, 7vw, 40px)', fontWeight: 'var(--fw-bold)',
        color: medal,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        letterSpacing: '-0.025em',
      }}>
        {showMedal && <Icon.Trophy size={24} />}
        {rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="pc-flb-name" style={{
          fontSize: '22px', fontWeight: 'var(--fw-bold)', color: 'var(--surface)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
        }}>
          {row.username}
        </div>
        <div style={{ fontSize: 'var(--fs-small)', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>
          {row.challenges_passed} challenges passed
        </div>
      </div>
      <div className="pc-flb-xp" style={{
        fontSize: '26px', fontWeight: 'var(--fw-bold)',
        color: 'var(--captech-yellow)',
        fontVariantNumeric: 'tabular-nums',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        letterSpacing: '-0.015em',
      }}>
        <Icon.Zap size={20} /> {row.xp}
      </div>
    </div>
  )
}
