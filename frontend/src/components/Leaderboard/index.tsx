import { useEffect, useRef, useState } from 'react'
import type { LeaderboardMeResponse } from '@/types'
import { Icon } from '@/components/shared/Icon'

const POLL_MS = 3000

type RowKind = 'top' | 'above' | 'you' | 'below'

interface DisplayRow {
  kind: RowKind
  rank: number
  username: string
  xp: number
  challenges_passed: number
  is_you: boolean
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardMeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const prevRanks = useRef<Map<string, { xp: number; rank: number }>>(new Map())
  const [pulseKeys, setPulseKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

    async function tick() {
      try {
        const res = await fetch('/api/leaderboard/me')
        if (!res.ok) return
        const payload = (await res.json()) as LeaderboardMeResponse
        if (cancelled) return
        setData(payload)
        setLoading(false)
      } catch {
        // ignore transient failures
      }
    }

    tick()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') tick()
    }, POLL_MS)
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [])

  useEffect(() => {
    if (!data) return
    const rows = buildDisplayRows(data)
    const newPulses = new Set<string>()
    for (const r of rows) {
      const prev = prevRanks.current.get(r.username)
      if (prev && (prev.xp !== r.xp || prev.rank !== r.rank)) {
        newPulses.add(r.username)
      }
    }
    prevRanks.current = new Map(rows.map(r => [r.username, { xp: r.xp, rank: r.rank }]))
    if (newPulses.size) {
      setPulseKeys(newPulses)
      const t = window.setTimeout(() => setPulseKeys(new Set()), 1200)
      return () => window.clearTimeout(t)
    }
  }, [data])

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--ink-3)', fontSize: 'var(--fs-small)' }}>Loading leaderboard…</div>
  }
  if (!data || data.total === 0) {
    return (
      <div style={{
        padding: '20px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', textAlign: 'center', color: 'var(--ink-3)',
        fontSize: 'var(--fs-small)',
      }}>
        No one on the leaderboard yet. Complete a challenge to claim your spot.
      </div>
    )
  }

  const rows = buildDisplayRows(data)
  const showDivider = rows.some(r => r.kind !== 'top')

  return (
    <div style={{ marginBottom: '32px' }}>
      <style>{pulseKeyframes}</style>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h2 style={{ fontSize: 'var(--fs-h2)', margin: 0 }}>Leaderboard</h2>
        <span style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-3)' }}>
          {data.rank ? `You're #${data.rank} of ${data.total}` : `${data.total} participants`}
        </span>
      </div>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {rows.map((r, i) => (
          <Row
            key={`${r.kind}-${r.username}-${r.rank}`}
            row={r}
            showTop={i === 0 || rows[i - 1].kind !== r.kind}
            showDivider={showDivider && i > 0 && (rows[i - 1].kind === 'top' && r.kind !== 'top')}
            pulse={pulseKeys.has(r.username)}
          />
        ))}
      </div>
    </div>
  )
}

function buildDisplayRows(data: LeaderboardMeResponse): DisplayRow[] {
  const out: DisplayRow[] = []
  data.top.forEach((r, i) => out.push({
    kind: 'top',
    rank: r.rank ?? i + 1,
    username: r.username,
    xp: r.xp,
    challenges_passed: r.challenges_passed,
    is_you: Boolean(r.is_you),
  }))
  data.above.forEach(r => out.push({
    kind: 'above',
    rank: r.rank ?? 0,
    username: r.username,
    xp: r.xp,
    challenges_passed: r.challenges_passed,
    is_you: false,
  }))
  if (data.you && !out.some(r => r.is_you)) {
    out.push({
      kind: 'you',
      rank: data.you.rank,
      username: data.you.username,
      xp: data.you.xp,
      challenges_passed: data.you.challenges_passed,
      is_you: true,
    })
  }
  data.below.forEach(r => out.push({
    kind: 'below',
    rank: r.rank ?? 0,
    username: r.username,
    xp: r.xp,
    challenges_passed: r.challenges_passed,
    is_you: false,
  }))
  return out
}

function Row({ row, showDivider, pulse }: { row: DisplayRow; showTop: boolean; showDivider: boolean; pulse: boolean }) {
  const rankColor = row.rank === 1 ? 'var(--medal-gold)'
    : row.rank === 2 ? 'var(--medal-silver)'
    : row.rank === 3 ? 'var(--medal-bronze)'
    : 'var(--ink-4)'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderTop: showDivider ? '1px dashed var(--border)' : '1px solid var(--border)',
        borderLeft: row.is_you ? 'var(--accent-left-blue)' : '4px solid transparent',
        background: row.is_you ? 'rgba(0, 93, 185, 0.04)' : 'transparent',
        animation: pulse ? 'pc-pulse 1.1s ease-out' : undefined,
      }}
    >
      <div style={{
        width: '28px',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-body)', color: rankColor,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {row.rank <= 3 ? <Icon.Trophy size={16} /> : row.rank}
      </div>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{
          fontSize: 'var(--fs-body)', fontWeight: row.is_you ? 'var(--fw-bold)' : 'var(--fw-semi)',
          color: 'var(--ink)', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {row.username}{row.is_you ? ' (you)' : ''}
        </div>
        <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)' }}>
          {row.challenges_passed} passed
        </div>
      </div>
      <div style={{
        fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)',
        color: 'var(--captech-navy)',
        fontVariantNumeric: 'tabular-nums',
        display: 'inline-flex', alignItems: 'center', gap: '4px',
      }}>
        <Icon.Zap size={13} /> {row.xp}
      </div>
    </div>
  )
}

const pulseKeyframes = `
@keyframes pc-pulse {
  0%   { background-color: rgba(253, 218, 36, 0.55); }
  100% { background-color: rgba(253, 218, 36, 0); }
}
`
