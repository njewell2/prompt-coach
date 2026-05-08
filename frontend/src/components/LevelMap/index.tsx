import { useNavigate } from 'react-router-dom'
import { CHALLENGES } from '@/data/challenges'
import { useProgress } from '@/hooks/useProgress'
import { useAuth } from '@/hooks/useAuth'
import type { Challenge } from '@/types'

const TIER_COLORS = {
  beginner:     'var(--tier-beginner)',
  intermediate: 'var(--tier-intermediate)',
  advanced:     'var(--tier-advanced)',
}

const TIER_LABELS = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
}

type NodeState = 'gold' | 'passed' | 'next' | 'unlocked' | 'locked'

function nodeState(
  challenge: Challenge,
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

function NodeCircle({ state, tier }: { state: NodeState; tier: Challenge['tier'] }) {
  const color = TIER_COLORS[tier]
  const size = state === 'next' ? 44 : 36

  const bg =
    state === 'gold'    ? 'var(--accent-gold)' :
    state === 'passed'  ? color :
    state === 'next'    ? color :
    state === 'unlocked'? 'var(--bg-card)' :
                          'var(--bg-secondary)'

  const border =
    state === 'gold'    ? '2px solid var(--accent-gold)' :
    state === 'passed'  ? `2px solid ${color}` :
    state === 'next'    ? `3px solid ${color}` :
    state === 'unlocked'? `2px solid var(--border)` :
                          '2px solid var(--border)'

  const icon =
    state === 'gold'    ? '⭐' :
    state === 'passed'  ? '✓' :
    state === 'next'    ? '▶' :
    state === 'locked'  ? '🔒' :
                          '○'

  const iconColor =
    state === 'gold'    ? 'var(--captech-navy)' :
    state === 'passed'  ? '#fff' :
    state === 'next'    ? '#fff' :
                          'var(--text-muted)'

  const boxShadow =
    state === 'next' ? `0 0 0 6px ${color}22` : undefined

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: bg,
      border,
      boxShadow,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: state === 'gold' ? '18px' : state === 'next' ? '16px' : '14px',
      color: iconColor,
      fontWeight: 700,
      flexShrink: 0,
      transition: 'box-shadow 0.2s',
    }}>
      {icon}
    </div>
  )
}

export function LevelMap() {
  const navigate = useNavigate()
  const { isUnlocked, getProgress, stats } = useProgress()
  const { user } = useAuth()

  const appStats = stats()

  // Find the "next" challenge: first unlocked, not-passed challenge
  const nextChallenge = CHALLENGES.find(c => isUnlocked(c.id) && (getProgress(c.id)?.best_score ?? 0) < 75)

  const tiers: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced']

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px 64px' }}>

      {/* Welcome + progress pill */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
        marginBottom: '32px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            {appStats.totalAttempts > 0 ? `Welcome back, ${user?.username ?? ''}` : `Hey ${user?.username ?? ''}, let's start training`}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {appStats.passed} of {appStats.total} challenges passed
            {appStats.gold > 0 && ` · ${appStats.gold} gold ⭐`}
          </p>
        </div>
        {nextChallenge && (
          <button
            onClick={() => navigate(`/challenge/${nextChallenge.id}`)}
            style={{
              background: 'var(--captech-blue)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              padding: '10px 20px', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {appStats.totalAttempts > 0 ? 'Continue →' : 'Start →'}
          </button>
        )}
      </div>

      {/* Game map */}
      {tiers.map(tier => {
        const tierChallenges = CHALLENGES.filter(c => c.tier === tier)
        const tierUnlocked = tierChallenges.some(c => isUnlocked(c.id))
        const tierPassed = tierChallenges.filter(c => (getProgress(c.id)?.best_score ?? 0) >= 75).length

        return (
          <div key={tier} style={{ marginBottom: '24px' }}>
            {/* Tier separator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '16px', opacity: tierUnlocked ? 1 : 0.45,
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: TIER_COLORS[tier],
                background: 'var(--bg-secondary)', padding: '0 8px',
              }}>
                {TIER_LABELS[tier]}
              </span>
              <span style={{
                fontSize: '11px', color: 'var(--text-muted)',
              }}>
                {tierPassed}/{tierChallenges.length}
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Challenge nodes */}
            {tierChallenges.map((challenge, idx) => {
              const prog = getProgress(challenge.id)
              const unlocked = isUnlocked(challenge.id)
              const bestScore = prog?.best_score ?? 0
              const attempted = (prog?.attempts.length ?? 0) > 0
              const isNext = challenge.id === nextChallenge?.id
              const state = nodeState(challenge, unlocked, bestScore, attempted, isNext)
              const isLast = idx === tierChallenges.length - 1

              return (
                <div key={challenge.id}>
                  {/* Node row */}
                  <div
                    onClick={() => unlocked && navigate(`/challenge/${challenge.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-lg)',
                      cursor: unlocked ? 'pointer' : 'default',
                      opacity: state === 'locked' ? 0.45 : 1,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (unlocked) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card-hover)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                    }}
                  >
                    <NodeCircle state={state} tier={tier} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{
                          fontSize: '14px', fontWeight: state === 'next' ? 700 : 600,
                          color: state === 'locked' ? 'var(--text-muted)' : 'var(--text-primary)',
                        }}>
                          {challenge.title}
                        </span>
                        {state === 'next' && (
                          <span style={{
                            fontSize: '10px', fontWeight: 700,
                            color: '#fff', background: TIER_COLORS[tier],
                            padding: '1px 6px', borderRadius: 'var(--radius-full)',
                          }}>
                            NEXT
                          </span>
                        )}
                        {state === 'passed' && bestScore > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {bestScore}/100
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: state === 'locked' ? 'var(--text-muted)' : 'var(--text-secondary)',
                        marginTop: '1px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {challenge.structural_task}
                      </div>
                    </div>
                  </div>

                  {/* Connector line between nodes */}
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
          </div>
        )
      })}

      {/* Free Practice CTA */}
      <div style={{
        marginTop: '32px', padding: '20px 24px',
        background: 'var(--captech-navy)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
            Free Practice
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
            Submit any prompt and see the AI-improved version instantly.
          </div>
        </div>
        <button
          onClick={() => navigate('/practice')}
          style={{
            background: 'var(--captech-yellow)', color: 'var(--captech-navy)',
            border: 'none', borderRadius: 'var(--radius-md)',
            padding: '8px 18px', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Open →
        </button>
      </div>
    </div>
  )
}
