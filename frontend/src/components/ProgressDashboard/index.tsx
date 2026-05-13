import { useNavigate } from 'react-router-dom'
import { useProgress } from '@/hooks/useProgress'
import { CHALLENGES, DIMENSION_META } from '@/data/challenges'
import { scoreColor } from '@/utils/score'
import { Leaderboard } from '@/components/Leaderboard'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Icon } from '@/components/shared/Icon'

const BADGE_ICONS: Record<string, (p: any) => JSX.Element> = {
  golden_beginner: Icon.Trophy,
  dimension_master: Icon.Target,
  completionist:    Icon.Flag,
}

const XP_REASON_LABELS: Record<string, string> = {
  attempt: 'Attempts',
  pass: 'Challenges passed',
  gold: 'Gold-scored challenges',
  first_try: 'First-try passes',
  improve: 'Big improvements',
  perfect_dim: 'Perfect areas',
  reveal: 'Expert reveals',
}

const AREA_IDS = ['clarity', 'context', 'output', 'examples', 'thinking']

function RadarChart({ averages }: { averages: Record<string, number> }) {
  const size = 280
  const cx = size / 2
  const cy = size / 2
  const maxR = 110
  const n = AREA_IDS.length

  function polarToXY(angle: number, r: number) {
    const rad = (angle - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const angles = AREA_IDS.map((_, i) => (360 / n) * i)
  const rings = [2, 4, 6, 8, 10]

  const values = AREA_IDS.map(id => averages[id] ?? 0)
  const dataPoints = AREA_IDS.map((_, i) => {
    const r = (values[i] / 10) * maxR
    return polarToXY(angles[i], r)
  })
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {rings.map(r => {
        const pts = angles.map(a => polarToXY(a, (r / 10) * maxR))
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
        return (
          <path key={r} d={path} fill="none" stroke="var(--border)" strokeWidth="1" opacity={0.6} />
        )
      })}

      {angles.map((angle, i) => {
        const outer = polarToXY(angle, maxR)
        return (
          <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="var(--border)" strokeWidth="1" />
        )
      })}

      <path d={dataPath} fill="var(--captech-blue)" fillOpacity={0.12} stroke="var(--captech-blue)" strokeWidth="2" />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--captech-blue)" />
      ))}

      {AREA_IDS.map((id, i) => {
        const labelR = maxR + 24
        const pos = polarToXY(angles[i], labelR)
        const val = values[i]
        const meta = DIMENSION_META[id]
        return (
          <g key={id}>
            <text
              x={pos.x} y={pos.y - 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="var(--text-secondary)"
              fontFamily="Inter, sans-serif"
            >
              {meta?.name ?? id}
            </text>
            {val > 0 && (
              <text
                x={pos.x} y={pos.y + 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={scoreColor(val)}
                fontFamily="Inter, sans-serif"
              >
                {val.toFixed(1)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function ProgressDashboard() {
  const navigate = useNavigate()
  const { dimensionAverages, stats, getProgress, clearAll, badges, xpTotal, xpEvents } = useProgress()

  const averages = dimensionAverages()
  const appStats = stats()
  const hasData = appStats.totalAttempts > 0

  const areaEntries = AREA_IDS
    .filter(id => averages[id] !== undefined)
    .map(id => ({ id, score: averages[id], meta: DIMENSION_META[id] }))

  const avgScore = areaEntries.length > 0
    ? Math.round((areaEntries.reduce((s, e) => s + e.score, 0) / areaEntries.length) * 10)
    : 0

  const sortedAreas = [...areaEntries].sort((a, b) => b.score - a.score)

  const xpByReason = xpEvents.reduce<Record<string, { count: number; amount: number }>>((acc, ev) => {
    const key = ev.reason
    if (!acc[key]) acc[key] = { count: 0, amount: 0 }
    acc[key].count += 1
    acc[key].amount += ev.amount
    return acc
  }, {})

  return (
    <div className="pc-progress-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      <style>{`
        @media (max-width: 720px) {
          .pc-progress-page { padding: 24px 16px !important; }
          .pc-progress-main-grid { grid-template-columns: 1fr !important; }
          .pc-progress-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <Leaderboard />

      <PageHeader
        title="Your Progress"
        subtitle="How you're doing across the five areas and all ten challenges."
        right={hasData ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (window.confirm('Reset all progress? This cannot be undone.')) {
                clearAll()
              }
            }}
          >
            Reset progress
          </Button>
        ) : null}
      />

      {!hasData ? (
        <Card padding={64} style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--ink-4)', marginBottom: '16px', display: 'inline-flex' }}>
            <Icon.Chart size={42} />
          </div>
          <h2 style={{ fontSize: 'var(--fs-h1)', marginBottom: '8px' }}>
            No attempts yet
          </h2>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-3)', marginBottom: '24px' }}>
            Complete some challenges to see your area scores and challenge progress here.
          </p>
          <Button onClick={() => navigate('/')} iconRight={<Icon.ArrowRight size={15} />}>
            Start Training
          </Button>
        </Card>
      ) : (
        <>
          <div className="pc-progress-stats-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px', marginBottom: '32px',
          }}>
            <StatCard
              label="XP Earned"
              value={xpTotal}
              sub={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Icon.Zap size={12} /> total
              </span>}
              accent="gold"
            />
            <StatCard label="Challenges Passed" value={`${appStats.passed}/${appStats.total}`} sub={`of ${appStats.total}`} />
            <StatCard
              label="Gold Stars"
              value={appStats.gold}
              sub={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Icon.Trophy size={12} /> scored ≥90
              </span>}
            />
            <StatCard label="Total Attempts" value={appStats.totalAttempts} sub="submissions" />
            <StatCard label="Avg Score" value={`${avgScore}/10`} sub="across areas" />
          </div>

          {/* Badges */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: 'var(--fs-h2)', marginBottom: '12px' }}>
              Badges
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              {Object.entries(badges).map(([bid, b]) => {
                const pct = Math.min(100, Math.round((b.progress.current / Math.max(b.progress.target, 1)) * 100))
                const IconComp = BADGE_ICONS[bid] ?? Icon.Trophy
                return (
                  <Card
                    key={bid}
                    accent={b.earned ? 'gold' : 'none'}
                    padding={16}
                    style={{ opacity: b.earned ? 1 : 0.92 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ color: b.earned ? 'var(--captech-yellow)' : 'var(--ink-4)', display: 'inline-flex' }}>
                        <IconComp size={20} />
                      </span>
                      <span style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' }}>
                        {b.label}
                      </span>
                      {b.earned && (
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: 'var(--fs-micro)',
                          color: 'var(--score-high)',
                          fontWeight: 'var(--fw-bold)',
                          letterSpacing: '0.08em',
                        }}>
                          EARNED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-3)', marginBottom: '10px', lineHeight: 1.5 }}>
                      {b.description}
                    </div>
                    <div style={{ height: '6px', background: 'var(--surface-quiet)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: b.earned ? 'var(--captech-yellow)' : 'var(--captech-blue)',
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                    <div style={{ marginTop: '6px', fontSize: 'var(--fs-micro)', color: 'var(--ink-3)' }}>
                      {b.progress.current} / {b.progress.target}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* XP breakdown */}
          {Object.keys(xpByReason).length > 0 && (
            <Card padding={20} style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: 'var(--fs-h2)', marginBottom: '12px' }}>
                XP Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(xpByReason)
                  .sort((a, b) => b[1].amount - a[1].amount)
                  .map(([reason, { count, amount }]) => (
                    <div
                      key={reason}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 'var(--fs-small)',
                      }}
                    >
                      <span style={{ color: 'var(--ink)' }}>
                        {XP_REASON_LABELS[reason] || reason}
                        <span style={{ color: 'var(--ink-3)', marginLeft: '6px' }}>× {count}</span>
                      </span>
                      <span style={{
                        color: 'var(--captech-navy)',
                        fontWeight: 'var(--fw-bold)',
                        fontVariantNumeric: 'tabular-nums',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <Icon.Zap size={13} />
                        +{amount}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Radar + challenge list */}
          <div className="pc-progress-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px', alignItems: 'start' }}>
            <Card padding={24}>
              <h3 style={{ fontSize: 'var(--fs-h2)', marginBottom: '20px' }}>
                Your Five Areas
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <RadarChart averages={averages} />
              </div>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: 'var(--fs-h2)', marginBottom: '4px' }}>
                Challenge Progress
              </h3>
              <Card padding={16}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {CHALLENGES.map((c, idx) => {
                    const p = getProgress(c.id)
                    const best = p?.best_score ?? 0
                    const passed = best >= 75
                    const gold = best >= 90
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--fs-small)' }}>
                        <span style={{
                          fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-semi)',
                          color: 'var(--ink-4)', width: '22px', flexShrink: 0,
                        }}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span style={{
                          flex: 1, minWidth: 0, color: 'var(--ink)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {c.title}
                        </span>
                        {best > 0 ? (
                          <span style={{
                            fontSize: 'var(--fs-micro)',
                            fontWeight: 'var(--fw-bold)',
                            color: scoreColor(best, true),
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {best}
                            {gold && <Icon.Trophy size={11} style={{ marginLeft: 4, verticalAlign: 'text-top', color: 'var(--accent-gold)' }} />}
                            {passed && !gold && <Icon.CheckCircle size={11} style={{ marginLeft: 4, verticalAlign: 'text-top', color: 'var(--score-high)' }} />}
                          </span>
                        ) : (
                          <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-4)' }}>—</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          </div>

          {/* Area averages (detailed) */}
          {sortedAreas.length > 0 && (
            <Card padding={24} style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: 'var(--fs-h2)', marginBottom: '8px' }}>
                Area Averages
              </h3>
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-3)', marginBottom: '16px' }}>
                Scored across all your training attempts.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {sortedAreas.map(({ id, score, meta }, i) => (
                  <div key={id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {i === 0 && (
                          <span style={{ color: 'var(--captech-yellow)', display: 'inline-flex' }}>
                            <Icon.Trophy size={13} />
                          </span>
                        )}
                        {i === sortedAreas.length - 1 && sortedAreas.length > 1 && (
                          <span style={{ color: 'var(--score-mid)', display: 'inline-flex' }}>
                            <Icon.Trend size={13} />
                          </span>
                        )}
                        <span style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semi)', color: 'var(--ink)' }}>
                          {meta?.name ?? id}
                        </span>
                        <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)' }}>
                          — {meta?.description}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 'var(--fs-small)',
                        fontWeight: 'var(--fw-bold)',
                        color: scoreColor(score),
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {score.toFixed(1)}/10
                      </span>
                    </div>
                    <div style={{
                      height: '6px', background: 'var(--surface-quiet)',
                      borderRadius: 'var(--radius-full)', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: `${score * 10}%`,
                        background: scoreColor(score),
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 1s ease',
                      }} />
                    </div>
                    {i === sortedAreas.length - 1 && sortedAreas.length > 1 && (
                      <p style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', marginTop: '4px' }}>
                        Focus here — this area needs the most work.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button onClick={() => navigate('/')} iconRight={<Icon.ArrowRight size={15} />}>
              Continue Training
            </Button>
            <Button variant="secondary" onClick={() => navigate('/practice')}>
              Free Practice
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
