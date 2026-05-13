import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FacilitatorResponse, FacilitatorResponsesPayload } from '@/types'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Eyebrow } from '@/components/shared/Eyebrow'
import { Icon } from '@/components/shared/Icon'

const POLL_MS = 4000

export function FacilitatorResponses() {
  const [payload, setPayload] = useState<FacilitatorResponsesPayload | null>(null)
  const [view, setView] = useState<'themes' | 'list'>('themes')

  useEffect(() => {
    let cancelled = false
    async function tick() {
      try {
        const res = await fetch('/api/facilitator/responses')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setPayload(data)
      } catch { /* ignore transient */ }
    }
    tick()
    const t = window.setInterval(tick, POLL_MS)
    return () => { cancelled = true; window.clearInterval(t) }
  }, [])

  if (!payload) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--ink-3)' }}>Loading responses…</div>
  }

  const responses = payload.responses
  const cluster = payload.cluster
  const responsesById = new Map(responses.map(r => [r.id, r]))
  const themes = cluster?.themes ?? []
  const themeCount = themes.length

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      padding: '20px 16px',
    }}>
      <style>{`
        @keyframes pc-clust-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes pc-card-enter {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .pc-fac-grid { grid-template-columns: 1fr !important; }
          .pc-fac-header { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Compact header row */}
        <div
          className="pc-fac-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Eyebrow style={{ marginBottom: '2px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <span>{responses.length} responses · {themeCount} themes</span>
                {payload.clustering && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    animation: 'pc-clust-pulse 1.2s cubic-bezier(0.22, 1, 0.36, 1) infinite',
                    color: 'var(--captech-blue)',
                    letterSpacing: 'normal',
                    textTransform: 'none',
                  }}>
                    <span style={{ width: '5px', height: '5px', background: 'var(--captech-blue)', borderRadius: '50%' }} />
                    updating themes…
                  </span>
                )}
              </span>
            </Eyebrow>
            <h1 style={{ fontSize: 'var(--fs-h1)', margin: 0, color: 'var(--ink)', lineHeight: 1.2 }}>
              Where do you see AI being most valuable?
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant={view === 'themes' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('themes')}>Themed</Button>
            <Button variant={view === 'list' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('list')}>Ungrouped</Button>
            <Link to="/facilitator/leaderboard" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" iconRight={<Icon.ArrowRight size={14} />}>
                Leaderboard
              </Button>
            </Link>
          </div>
        </div>

        {responses.length === 0 ? (
          <Card padding={48} style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-3)' }}>
              Waiting for responses…
            </p>
          </Card>
        ) : view === 'themes' && cluster ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {themes.map((t, ti) => (
              <section key={`${t.name}-${ti}`}>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '10px',
                  marginBottom: '4px',
                  flexWrap: 'wrap',
                }}>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: 'var(--fw-bold)',
                    margin: 0,
                    color: 'var(--ink)',
                  }}>
                    {t.name}
                  </h2>
                  <span style={{
                    fontSize: 'var(--fs-micro)',
                    fontWeight: 'var(--fw-semi)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-4)',
                  }}>
                    {t.quote_ids.length} responses
                  </span>
                </div>
                <p style={{
                  fontSize: 'var(--fs-small)',
                  color: 'var(--ink-3)',
                  marginBottom: '10px',
                  lineHeight: 1.4,
                }}>
                  {t.description}
                </p>
                <div
                  className="pc-fac-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {t.quote_ids.map(qid => {
                    const r = responsesById.get(qid)
                    if (!r) return null
                    return <ResponseCard key={r.id} r={r} />
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div
            className="pc-fac-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '8px',
            }}
          >
            {[...responses].reverse().map(r => (
              <ResponseCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ResponseCard({ r }: { r: FacilitatorResponse }) {
  return (
    <Card variant="quiet" padding={10} style={{ animation: 'pc-card-enter 0.3s ease-out' }}>
      <div style={{
        fontSize: 'var(--fs-micro)',
        fontWeight: 'var(--fw-semi)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
        marginBottom: '4px',
      }}>
        {r.username}
      </div>
      <div style={{
        fontSize: 'var(--fs-small)',
        color: 'var(--ink)',
        lineHeight: 1.4,
      }}>
        &ldquo;{r.text}&rdquo;
      </div>
    </Card>
  )
}
