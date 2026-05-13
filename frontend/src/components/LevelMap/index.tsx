import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CHALLENGES, challengeDisplayTitle } from '@/data/challenges'
import { useProgress } from '@/hooks/useProgress'
import { useAuth } from '@/hooks/useAuth'
import type { Challenge } from '@/types'
import { Button } from '@/components/shared/Button'
import { Icon } from '@/components/shared/Icon'
import { PageHeader } from '@/components/shared/PageHeader'
import { Eyebrow } from '@/components/shared/Eyebrow'

type NodeKind = 'gold' | 'attempted' | 'idle'

const NODE_COLOR = 'var(--captech-blue)'

function NodeCircle({ kind, number, isNext }: { kind: NodeKind; number: number; isNext: boolean }) {
  const size = isNext ? 44 : 36

  const bg =
    kind === 'gold'      ? 'var(--captech-yellow)' :
    kind === 'attempted' ? NODE_COLOR :
                           'var(--surface)'

  const border =
    kind === 'gold'      ? '2px solid var(--captech-yellow)' :
    kind === 'attempted' ? `2px solid ${NODE_COLOR}` :
                           '2px solid var(--border)'

  const textColor =
    kind === 'gold'      ? 'var(--captech-navy)' :
    kind === 'attempted' ? 'var(--surface)' :
                           'var(--ink-3)'

  const boxShadow = isNext ? `0 0 0 6px ${NODE_COLOR}22` : undefined
  const fontSize = isNext ? '17px' : '15px'

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: bg,
      border,
      boxShadow,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: textColor,
      flexShrink: 0,
      transition: 'box-shadow 0.2s',
      fontSize,
      fontWeight: 'var(--fw-bold)',
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1,
    }}>
      {number}
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      margin: '20px 0 16px',
    }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <Eyebrow style={{
        background: 'var(--surface-quiet)',
        padding: '2px 10px',
        borderRadius: 'var(--radius-full)',
      }}>
        {label}
      </Eyebrow>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

export function LevelMap() {
  const navigate = useNavigate()
  const { isUnlocked, getProgress, stats } = useProgress()
  const { user } = useAuth()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const appStats = stats()
  const nextChallenge = CHALLENGES.find(c => isUnlocked(c.id) && (getProgress(c.id)?.best_score ?? 0) < 75)
  const nextChallengeNumber = nextChallenge ? CHALLENGES.findIndex(c => c.id === nextChallenge.id) + 1 : null

  return (
    <div className="pc-levelmap-page" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px 64px' }}>
      <style>{`
        @media (max-width: 640px) {
          .pc-levelmap-page { padding: 24px 16px 48px !important; }
        }
      `}</style>

      <PageHeader
        size="compact"
        title={appStats.totalAttempts > 0 ? `Welcome back, ${user?.username ?? ''}` : `Hey ${user?.username ?? ''}, let's start training`}
        subtitle={
          <>
            <span>{appStats.passed} of {appStats.total} challenges passed</span>
            {appStats.gold > 0 && (
              <span style={{ marginLeft: '8px', color: 'var(--ink-3)' }}>· {appStats.gold} gold</span>
            )}
          </>
        }
        right={nextChallenge ? (
          <Button
            onClick={() => navigate(`/challenge/${nextChallenge.id}`)}
            iconRight={<Icon.ArrowRight size={16} />}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ lineHeight: 1 }}>{appStats.totalAttempts > 0 ? 'Continue' : 'Start'} with Challenge</span>
              <span style={{ fontSize: '1.35em', fontWeight: 'var(--fw-bold)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {nextChallengeNumber}
              </span>
            </span>
          </Button>
        ) : null}
      />

      {CHALLENGES.map((challenge: Challenge, idx: number) => {
        const prog = getProgress(challenge.id)
        const bestScore = prog?.best_score ?? 0
        const attempted = (prog?.attempts.length ?? 0) > 0
        const isNext = challenge.id === nextChallenge?.id
        const kind: NodeKind = bestScore >= 85 ? 'gold' : attempted ? 'attempted' : 'idle'
        const isLast = idx === CHALLENGES.length - 1
        const challengeNumber = idx + 1

        return (
          <div key={challenge.id}>
            {/* Labeled dividers before challenge 6 ("Putting it together") and challenge 9 ("Combine all five") */}
            {challengeNumber === 6 && <SectionDivider label="Putting it together" />}
            {challengeNumber === 9 && <SectionDivider label="Combine all five" />}

            <div
              onClick={() => navigate(`/challenge/${challenge.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
                cursor: 'pointer',
                transition: 'background 0.15s, box-shadow 0.15s, transform 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.background = 'var(--surface-hover)'
                el.style.boxShadow = 'var(--shadow-card-hover)'
                el.style.borderColor = 'var(--border-strong, var(--border))'
                el.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.background = 'var(--surface)'
                el.style.boxShadow = 'var(--shadow-card)'
                el.style.borderColor = 'var(--border)'
                el.style.transform = 'translateY(0)'
              }}
            >
              <NodeCircle kind={kind} number={challengeNumber} isNext={isNext} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 'var(--fs-body)', fontWeight: isNext ? 'var(--fw-bold)' : 'var(--fw-semi)',
                    color: 'var(--ink)',
                  }}>
                    {challengeDisplayTitle(challenge)}
                  </span>
                  {isNext && (
                    <span style={{
                      fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)',
                      color: 'var(--surface)', background: NODE_COLOR,
                      padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      letterSpacing: '0.06em',
                    }}>
                      NEXT
                    </span>
                  )}
                  {attempted && bestScore > 0 && (
                    <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', fontWeight: 'var(--fw-semi)', fontVariantNumeric: 'tabular-nums' }}>
                      {(bestScore / 10).toFixed(1)}/10
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!isLast && (
              <div style={{
                marginLeft: '34px',
                width: '2px', height: '12px',
                background: 'var(--border)',
                margin: '4px 0 4px 34px',
              }} />
            )}
          </div>
        )
      })}

    </div>
  )
}
