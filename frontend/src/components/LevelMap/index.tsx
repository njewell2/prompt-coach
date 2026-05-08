import { useNavigate } from 'react-router-dom'
import { CHALLENGES } from '@/data/challenges'
import { useProgress } from '@/hooks/useProgress'
import type { Challenge, ChallengeAttempt } from '@/types'

const TIER_CONFIG = {
  beginner: {
    label: 'Beginner',
    color: 'var(--tier-beginner)',
    bg: '#eff6ff',
    description: 'One focus dimension per challenge. Build the fundamentals.',
    order: 1,
  },
  intermediate: {
    label: 'Intermediate',
    color: 'var(--tier-intermediate)',
    bg: '#f5f3ff',
    description: 'Combine 3–4 dimensions. Real-world task structures.',
    order: 2,
  },
  advanced: {
    label: 'Advanced',
    color: 'var(--tier-advanced)',
    bg: '#fffbeb',
    description: 'All 8 dimensions. Complex, multi-step prompts.',
    order: 3,
  },
}

function ChallengeCard({
  challenge,
  locked,
  progress,
  onClick,
}: {
  challenge: Challenge
  locked: boolean
  progress: { best_score: number; attempts: ChallengeAttempt[] | number; gold?: boolean; has_gold?: boolean } | null | undefined
  onClick: () => void
}) {
  const tier = TIER_CONFIG[challenge.tier]
  const passed = (progress?.best_score ?? 0) >= 75
  const gold = progress?.gold ?? progress?.has_gold ?? false
  const attemptCount = Array.isArray(progress?.attempts) ? progress.attempts.length : (progress?.attempts ?? 0)
  const attempted = attemptCount > 0

  return (
    <div
      onClick={locked ? undefined : onClick}
      style={{
        background: locked ? 'var(--bg-secondary)' : 'var(--bg-card)',
        border: gold
          ? '2px solid var(--accent-gold)'
          : passed
          ? `2px solid ${tier.color}`
          : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.55 : 1,
        boxShadow: locked ? 'none' : 'var(--shadow-card)',
        transition: 'box-shadow 0.15s, transform 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!locked) {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow =
            '0 4px 20px rgba(0,0,0,0.12)'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = locked
          ? 'none'
          : 'var(--shadow-card)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Gold shimmer accent */}
      {gold && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, var(--accent-gold), #fbbf24, var(--accent-gold))',
        }} />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Challenge number badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', height: '24px', borderRadius: '50%',
            background: locked ? 'var(--text-muted)' : tier.color,
            color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0,
          }}>
            {locked ? '🔒' : challenge.order}
          </span>
          <span style={{
            fontSize: '14px', fontWeight: 700,
            color: locked ? 'var(--text-muted)' : 'var(--text-primary)',
          }}>
            {challenge.title}
          </span>
        </div>

        {/* Status badge */}
        {gold ? (
          <span style={{ fontSize: '16px' }}>⭐</span>
        ) : passed ? (
          <span style={{
            fontSize: '10px', fontWeight: 700, color: '#fff',
            background: tier.color,
            padding: '2px 7px', borderRadius: 'var(--radius-full)',
          }}>PASS</span>
        ) : attempted ? (
          <span style={{
            fontSize: '10px', fontWeight: 600, color: tier.color,
            background: tier.bg,
            padding: '2px 7px', borderRadius: 'var(--radius-full)',
            border: `1px solid ${tier.color}`,
          }}>IN PROGRESS</span>
        ) : null}
      </div>

      {/* Structural task */}
      <p style={{
        fontSize: '12px', color: locked ? 'var(--text-muted)' : 'var(--text-secondary)',
        lineHeight: 1.5, marginBottom: '12px',
      }}>
        {challenge.structural_task}
      </p>

      {/* Focus dimension chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
        {challenge.focus_dimensions.map(dim => (
          <span key={dim} style={{
            fontSize: '10px', fontWeight: 600,
            color: locked ? 'var(--text-muted)' : tier.color,
            background: locked ? 'transparent' : tier.bg,
            padding: '2px 6px', borderRadius: 'var(--radius-full)',
            border: `1px solid ${locked ? 'var(--border)' : tier.color}`,
            textTransform: 'capitalize',
          }}>
            {dim.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {/* Best score bar */}
      {attempted && !locked && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Best: {progress!.best_score}/100
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {attemptCount} attempt{attemptCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{
            height: '4px', background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-full)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress!.best_score}%`,
              background: progress!.best_score >= 90
                ? 'var(--accent-gold)'
                : progress!.best_score >= 75
                ? tier.color
                : 'var(--score-mid)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

export function LevelMap() {
  const navigate = useNavigate()
  const { isUnlocked, getProgress, stats } = useProgress()

  const appStats = stats()
  const tiers: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced']

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Prompt Engineering Training
        </h1>
        <div style={{ width: '40px', height: '3px', background: 'var(--captech-yellow)', borderRadius: '2px', marginBottom: '14px' }} />
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '580px' }}>
          Master the 8 dimensions of effective prompting through structured challenges grounded in frontier lab research.
          Score 7.5+ to pass each level and unlock the next.
        </p>

        {/* Stats row */}
        {appStats.totalAttempts > 0 && (
          <div style={{
            display: 'flex', gap: '24px', marginTop: '24px',
            padding: '16px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
          }}>
            <Stat label="Challenges Passed" value={appStats.passed} />
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <Stat label="Gold Stars" value={appStats.gold} suffix="⭐" />
            <div style={{ width: '1px', background: 'var(--border)' }} />
            <Stat label="Total Attempts" value={appStats.totalAttempts} />
          </div>
        )}
      </div>

      {/* Tier sections */}
      {tiers.map(tier => {
        const cfg = TIER_CONFIG[tier]
        const tierChallenges = CHALLENGES.filter(c => c.tier === tier)
        const tierPassed = tierChallenges.filter(c => (getProgress(c.id)?.best_score ?? 0) >= 75).length

        return (
          <div key={tier} style={{ marginBottom: '48px' }}>
            {/* Tier header */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {cfg.label}
              </h2>
              <span style={{
                fontSize: '12px', fontWeight: 700, color: cfg.color,
                background: cfg.bg, padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${cfg.color}`,
              }}>
                {tierPassed}/{tierChallenges.length} passed
              </span>
            </div>
            {/* Gold accent underline */}
            <div style={{ width: '40px', height: '3px', background: 'var(--accent-gold)', borderRadius: '2px', marginBottom: '8px' }} />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {cfg.description}
            </p>

            {/* Challenge grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
            }}>
              {tierChallenges.map(challenge => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  locked={!isUnlocked(challenge.id)}
                  progress={getProgress(challenge.id)}
                  onClick={() => navigate(`/challenge/${challenge.id}`)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Free Practice CTA */}
      <div style={{
        marginTop: '16px', padding: '28px 32px',
        background: 'var(--captech-navy)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '24px', flexWrap: 'wrap',
        boxShadow: '0 4px 20px rgba(0,56,101,0.18)',
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            Free Practice
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>
            No challenges, no unlocks. Submit any prompt and instantly see the AI-improved version side by side.
          </p>
        </div>
        <button
          onClick={() => navigate('/practice')}
          style={{
            background: 'var(--captech-yellow)', color: 'var(--captech-navy)',
            border: 'none', borderRadius: 'var(--radius-md)',
            padding: '10px 22px', fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          Open Practice →
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value}{suffix}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
        {label}
      </div>
    </div>
  )
}
