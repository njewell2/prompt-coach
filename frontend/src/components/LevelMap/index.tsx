import { useNavigate } from 'react-router-dom'
import { CHALLENGES, challengeDisplayTitle } from '@/data/challenges'
import { useProgress } from '@/hooks/useProgress'
import { useAuth } from '@/hooks/useAuth'
import type { Challenge } from '@/types'
import { Button } from '@/components/shared/Button'
import { Icon } from '@/components/shared/Icon'
import { PageHeader } from '@/components/shared/PageHeader'
import { Eyebrow } from '@/components/shared/Eyebrow'

type NodeState = 'gold' | 'passed' | 'next' | 'unlocked' | 'locked'

const NODE_COLOR = 'var(--captech-blue)'

function nodeState(
  unlocked: boolean,
  bestScore: number,
  attempted: boolean,
  isNext: boolean,
): NodeState {
  if (!unlocked) return 'locked'
  if (bestScore >= 90) return 'gold'
  if (bestScore >= 75) return 'passed'
  if (isNext) return 'next'
  if (attempted) return 'next'
  return 'unlocked'
}

function NodeCircle({ state }: { state: NodeState }) {
  const size = state === 'next' ? 44 : 36

  const bg =
    state === 'gold'    ? 'var(--captech-yellow)' :
    state === 'passed'  ? NODE_COLOR :
    state === 'next'    ? NODE_COLOR :
    state === 'unlocked'? 'var(--surface)' :
                          'var(--surface-quiet)'

  const border =
    state === 'gold'    ? '2px solid var(--captech-yellow)' :
    state === 'passed'  ? `2px solid ${NODE_COLOR}` :
    state === 'next'    ? `3px solid ${NODE_COLOR}` :
                          '2px solid var(--border)'

  const iconColor =
    state === 'gold'    ? 'var(--captech-navy)' :
    state === 'passed'  ? 'var(--surface)' :
    state === 'next'    ? 'var(--surface)' :
                          'var(--ink-4)'

  const boxShadow = state === 'next' ? `0 0 0 6px ${NODE_COLOR}22` : undefined

  const iconSize = state === 'next' ? 20 : 16
  const iconEl =
    state === 'gold'   ? <Icon.Trophy size={iconSize} /> :
    state === 'passed' ? <Icon.CheckCircle size={iconSize} /> :
    state === 'next'   ? <Icon.Play size={iconSize} /> :
    state === 'locked' ? <Icon.Lock size={iconSize} /> :
                         <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-4)' }} />

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: bg,
      border,
      boxShadow,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: iconColor,
      flexShrink: 0,
      transition: 'box-shadow 0.2s',
    }}>
      {iconEl}
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

  const appStats = stats()
  const nextChallenge = CHALLENGES.find(c => isUnlocked(c.id) && (getProgress(c.id)?.best_score ?? 0) < 75)

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
            {appStats.totalAttempts > 0 ? 'Continue' : 'Start'}
          </Button>
        ) : null}
      />

      {CHALLENGES.map((challenge: Challenge, idx: number) => {
        const prog = getProgress(challenge.id)
        const unlocked = isUnlocked(challenge.id)
        const bestScore = prog?.best_score ?? 0
        const attempted = (prog?.attempts.length ?? 0) > 0
        const isNext = challenge.id === nextChallenge?.id
        const state = nodeState(unlocked, bestScore, attempted, isNext)
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
                padding: '10px 12px',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                opacity: state === 'locked' ? 0.45 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-hover)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent'
              }}
            >
              <NodeCircle state={state} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                  <Eyebrow color="var(--ink-4)" style={{ letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums' }}>
                    {String(challengeNumber).padStart(2, '0')}
                  </Eyebrow>
                  <span style={{
                    fontSize: 'var(--fs-body)', fontWeight: state === 'next' ? 'var(--fw-bold)' : 'var(--fw-semi)',
                    color: state === 'locked' ? 'var(--ink-4)' : 'var(--ink)',
                  }}>
                    {challengeDisplayTitle(challenge)}
                  </span>
                  {state === 'next' && (
                    <span style={{
                      fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)',
                      color: 'var(--surface)', background: NODE_COLOR,
                      padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      letterSpacing: '0.06em',
                    }}>
                      NEXT
                    </span>
                  )}
                  {state === 'passed' && bestScore > 0 && (
                    <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--ink-3)', fontWeight: 'var(--fw-semi)', fontVariantNumeric: 'tabular-nums' }}>
                      {(bestScore / 10).toFixed(1)}/10
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 'var(--fs-small)',
                  color: state === 'locked' ? 'var(--ink-4)' : 'var(--ink-3)',
                  marginTop: '2px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {challenge.structural_task}
                </div>
              </div>
            </div>

            {!isLast && (
              <div style={{
                marginLeft: '34px',
                width: '2px', height: '16px',
                background: 'var(--border)',
              }} />
            )}
          </div>
        )
      })}

      {/* Free Practice CTA — The "one spark" on this page is the yellow CTA. No yellow stripe. */}
      <div style={{
        marginTop: '32px',
        padding: '20px 24px',
        background: 'var(--captech-navy)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-bold)', color: 'var(--surface)', marginBottom: '4px' }}>
            Free Practice
          </div>
          <div style={{ fontSize: 'var(--fs-small)', color: 'rgba(255,255,255,0.72)' }}>
            Submit any prompt and see the AI-improved version instantly.
          </div>
        </div>
        <button
          onClick={() => navigate('/practice')}
          style={{
            background: 'var(--captech-yellow)', color: 'var(--captech-navy)',
            border: 'none', borderRadius: 'var(--radius-md)',
            padding: '10px 18px', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semi)',
            cursor: 'pointer', whiteSpace: 'nowrap',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            minHeight: '44px',
          }}
        >
          Open <Icon.ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
