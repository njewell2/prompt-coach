import { useNavigate } from 'react-router-dom'
import { useProgress } from '@/hooks/useProgress'
import { CHALLENGES, DIMENSION_META } from '@/data/challenges'
import { scoreColor } from '@/utils/score'

const DIM_IDS = [
  'clarity_directness',
  'context_background',
  'output_specification',
  'role_persona',
  'examples_few_shot',
  'reasoning_guidance',
  'constraint_definition',
  'task_decomposition',
]

// Simple SVG radar chart — no external deps
function RadarChart({ averages }: { averages: Record<string, number> }) {
  const size = 280
  const cx = size / 2
  const cy = size / 2
  const maxR = 110
  const n = DIM_IDS.length

  function polarToXY(angle: number, r: number) {
    const rad = (angle - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const angles = DIM_IDS.map((_, i) => (360 / n) * i)

  // Grid rings at 2, 4, 6, 8, 10
  const rings = [2, 4, 6, 8, 10]

  // Data polygon
  const dataPoints = DIM_IDS.map((id, i) => {
    const val = averages[id] ?? 0
    const r = (val / 10) * maxR
    return polarToXY(angles[i], r)
  })
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {/* Grid rings */}
      {rings.map(r => {
        const pts = angles.map(a => polarToXY(a, (r / 10) * maxR))
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
        return (
          <path
            key={r}
            d={path}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            opacity={0.6}
          />
        )
      })}

      {/* Spokes */}
      {angles.map((angle, i) => {
        const outer = polarToXY(angle, maxR)
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x} y2={outer.y}
            stroke="var(--border)"
            strokeWidth="1"
          />
        )
      })}

      {/* Data polygon fill */}
      <path d={dataPath} fill="var(--captech-blue)" fillOpacity={0.12} stroke="var(--captech-blue)" strokeWidth="2" />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--captech-blue)" />
      ))}

      {/* Labels */}
      {DIM_IDS.map((id, i) => {
        const labelR = maxR + 24
        const pos = polarToXY(angles[i], labelR)
        const meta = DIMENSION_META[id]
        const val = averages[id]
        return (
          <g key={id}>
            <text
              x={pos.x} y={pos.y - 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="var(--text-secondary)"
              fontFamily="Inter, sans-serif"
            >
              {meta?.shortName ?? id}
            </text>
            {val !== undefined && (
              <text
                x={pos.x} y={pos.y + 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={scoreColor(val)}
                fontFamily="Inter, sans-serif"
              >
                {val}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function TierProgress({
  tier,
  challenges,
  getProgress,
}: {
  tier: 'beginner' | 'intermediate' | 'advanced'
  challenges: typeof CHALLENGES
  getProgress: (id: string) => { best_score: number; attempts: number; has_gold?: boolean; gold?: boolean } | null | undefined
}) {
  const cfg = {
    beginner: { label: 'Beginner', color: 'var(--tier-beginner)', bg: '#eff6ff' },
    intermediate: { label: 'Intermediate', color: 'var(--tier-intermediate)', bg: '#f5f3ff' },
    advanced: { label: 'Advanced', color: 'var(--tier-advanced)', bg: '#fffbeb' },
  }[tier]

  const tierChallenges = challenges.filter(c => c.tier === tier)
  const passed = tierChallenges.filter(c => (getProgress(c.id)?.best_score ?? 0) >= 75).length
  const gold = tierChallenges.filter(c => (getProgress(c.id) as any)?.gold).length
  const pct = Math.round((passed / tierChallenges.length) * 100)

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {cfg.label}
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {gold > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--accent-gold)' }}>⭐ {gold}</span>
          )}
          <span style={{
            fontSize: '12px', fontWeight: 700, color: cfg.color,
            background: cfg.bg, padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
          }}>
            {passed}/{tierChallenges.length}
          </span>
        </div>
      </div>
      <div style={{
        height: '8px', background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-full)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: cfg.color,
          borderRadius: 'var(--radius-full)',
          transition: 'width 1s ease',
        }} />
      </div>
      <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
        {pct}% complete
      </div>
    </div>
  )
}

export function ProgressDashboard() {
  const navigate = useNavigate()
  const { dimensionAverages, stats, getProgress, clearAll } = useProgress()

  const averages = dimensionAverages()
  const appStats = stats()
  const hasData = appStats.totalAttempts > 0

  const avgScore = appStats.totalAttempts > 0
    ? Math.round(
        Object.values(averages).reduce((a, b) => a + b, 0) /
        Math.max(Object.values(averages).length, 1) * 10
      )
    : 0

  // Best and worst dimensions
  const dimEntries = DIM_IDS
    .filter(id => averages[id] !== undefined)
    .map(id => ({ id, score: averages[id], meta: DIMENSION_META[id] }))
    .sort((a, b) => b.score - a.score)

  const tiers: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced']

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Your Progress
          </h1>
          <div style={{ width: '40px', height: '3px', background: 'var(--accent-gold)', borderRadius: '2px' }} />
        </div>
        {hasData && (
          <button
            onClick={() => {
              if (window.confirm('Reset all progress? This cannot be undone.')) {
                clearAll()
              }
            }}
            style={{
              fontSize: '12px', color: 'var(--text-muted)',
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            Reset Progress
          </button>
        )}
      </div>

      {!hasData ? (
        /* Empty state */
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No attempts yet
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Complete some challenges to see your dimension scores and tier progress here.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'var(--captech-blue)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              padding: '10px 22px', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Start Training →
          </button>
        </div>
      ) : (
        <>
          {/* Overview stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '12px', marginBottom: '32px',
          }}>
            {[
              { label: 'Challenges Passed', value: `${appStats.passed}/${appStats.total}`, sub: 'of 18' },
              { label: 'Gold Stars', value: `${appStats.gold} ⭐`, sub: 'scored ≥90' },
              { label: 'Total Attempts', value: appStats.totalAttempts, sub: 'submissions' },
              { label: 'Avg Dimension', value: `${avgScore}/10`, sub: 'overall' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '16px 18px',
                boxShadow: 'var(--shadow-card)',
              }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Main content: radar + tier progress */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px', alignItems: 'start' }}>
            {/* Radar chart */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '28px',
              boxShadow: 'var(--shadow-card)',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
                Dimension Radar
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <RadarChart averages={averages} />
              </div>
            </div>

            {/* Tier progress */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Tier Progress
              </h3>
              {tiers.map(tier => (
                <TierProgress
                  key={tier}
                  tier={tier}
                  challenges={CHALLENGES}
                  getProgress={id => {
                    const p = getProgress(id)
                    return p ? { best_score: p.best_score, attempts: p.attempts.length, gold: p.gold } : null
                  }}
                />
              ))}
            </div>
          </div>

          {/* Dimension breakdown table */}
          {dimEntries.length > 0 && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '24px 28px',
              boxShadow: 'var(--shadow-card)', marginBottom: '32px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
                Dimension Averages
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {dimEntries.map(({ id, score, meta }, i) => (
                  <div key={id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {i === 0 && <span style={{ fontSize: '11px' }}>🏆</span>}
                        {i === dimEntries.length - 1 && dimEntries.length > 1 && (
                          <span style={{ fontSize: '11px' }}>📈</span>
                        )}
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {meta?.name ?? id}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: scoreColor(score) }}>
                        {score}/10
                      </span>
                    </div>
                    <div style={{
                      height: '6px', background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-full)', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: `${score * 10}%`,
                        background: scoreColor(score),
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 1s ease',
                      }} />
                    </div>
                    {i === dimEntries.length - 1 && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Focus area — this dimension needs the most work.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA to continue */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'var(--captech-blue)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                padding: '10px 22px', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Continue Training →
            </button>
            <button
              onClick={() => navigate('/practice')}
              style={{
                background: 'none', color: 'var(--text-primary)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                padding: '10px 22px', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Free Practice
            </button>
          </div>
        </>
      )}
    </div>
  )
}
