import { useState, useCallback, useEffect, createContext, useContext, type ReactNode, createElement } from 'react'
import type {
  Badge,
  ChallengeAttempt,
  ChallengeProgress,
  DimensionScore,
  UserProgressResponse,
  XpEvent,
} from '@/types'
import { CHALLENGES } from '@/data/challenges'
import { useAuth } from '@/hooks/useAuth'

const EMPTY_BADGES: Record<string, Badge> = {}

interface ProgressContextValue {
  progress: Map<string, ChallengeProgress>
  loaded: boolean
  isUnlocked: (challengeId: string) => boolean
  addAttempt: (challengeId: string, prompt: string, score: number, dimensions: DimensionScore[], strengths?: string[], improvements?: string[], sessionToken?: string) => void
  applyAttemptServerSide: (xpEarned: XpEvent[] | undefined, xpTotalFromServer: number | undefined, newBadges: string[] | undefined) => void
  markRevealed: (challengeId: string) => void
  canReveal: (challengeId: string) => boolean
  getProgress: (challengeId: string) => ChallengeProgress | undefined
  dimensionAverages: () => Record<string, number>
  stats: () => { passed: number; gold: number; totalAttempts: number; total: number }
  clearAll: () => void
  refresh: () => Promise<void>
  xpTotal: number
  xpEvents: XpEvent[]
  badges: Record<string, Badge>
  rank: { position: number | null; total: number }
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Map<string, ChallengeProgress>>(new Map)
  const [loaded, setLoaded] = useState(false)
  const [xpTotal, setXpTotal] = useState(0)
  const [xpEvents, setXpEvents] = useState<XpEvent[]>([])
  const [badges, setBadges] = useState<Record<string, Badge>>(EMPTY_BADGES)
  const [rank, setRank] = useState<{ position: number | null; total: number }>({ position: null, total: 0 })

  const applyServerPayload = useCallback((data: UserProgressResponse) => {
    if (data.challenges) {
      setProgress(new Map(Object.entries(data.challenges) as [string, ChallengeProgress][]))
    }
    if (typeof data.xp_total === 'number') setXpTotal(data.xp_total)
    if (Array.isArray(data.xp_events)) setXpEvents(data.xp_events)
    if (data.badges) setBadges(data.badges)
    if (data.rank) setRank(data.rank)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/user/progress')
      if (res.ok) {
        const data = await res.json()
        applyServerPayload(data)
      }
    } catch {
      // swallow; keep existing state
    } finally {
      setLoaded(true)
    }
  }, [applyServerPayload])

  const { user } = useAuth()
  useEffect(() => {
    if (user) refresh()
  }, [user, refresh])

  const isUnlocked = useCallback((challengeId: string): boolean => {
    const challenge = CHALLENGES.find(c => c.id === challengeId)
    if (!challenge) return false
    if (!challenge.unlock_after) return true
    const prev = progress.get(challenge.unlock_after)
    return (prev?.best_score ?? 0) >= 75
  }, [progress])

  const addAttempt = useCallback((
    challengeId: string,
    prompt: string,
    score: number,
    dimensions: DimensionScore[],
    strengths?: string[],
    improvements?: string[],
    sessionToken?: string,
  ) => {
    setProgress(prev => {
      const next = new Map(prev)
      const existing = next.get(challengeId) ?? {
        challengeId,
        attempts: [],
        best_score: 0,
        passed: false,
        gold: false,
        revealed: false,
      }
      const attempt: ChallengeAttempt = {
        timestamp: Date.now(),
        prompt,
        score,
        dimensions,
        strengths,
        improvements,
        session_token: sessionToken,
      }
      const attempts = [...existing.attempts, attempt]
      const best = Math.max(existing.best_score, score)
      next.set(challengeId, {
        ...existing,
        attempts,
        best_score: best,
        passed: best >= 75,
        gold: best >= 90,
      })
      return next
    })
  }, [])

  const applyAttemptServerSide = useCallback((xpEarned: XpEvent[] | undefined, xpTotalFromServer: number | undefined, newBadges: string[] | undefined) => {
    if (Array.isArray(xpEarned) && xpEarned.length > 0) {
      setXpEvents(prev => [...prev, ...xpEarned])
    }
    if (typeof xpTotalFromServer === 'number') setXpTotal(xpTotalFromServer)
    if (Array.isArray(newBadges) && newBadges.length > 0) {
      // Refetch to pick up accurate badge state + rank
      refresh()
    }
  }, [refresh])

  const markRevealed = useCallback((challengeId: string) => {
    fetch('/api/user/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId }),
    }).catch(() => {})

    setProgress(prev => {
      const next = new Map(prev)
      const existing = next.get(challengeId)
      if (existing) next.set(challengeId, { ...existing, revealed: true })
      return next
    })
  }, [])

  const canReveal = useCallback((challengeId: string): boolean => {
    const p = progress.get(challengeId)
    if (!p) return false
    return p.attempts.length >= 2 || p.best_score >= 75
  }, [progress])

  const getProgress = useCallback((challengeId: string): ChallengeProgress | undefined => {
    return progress.get(challengeId)
  }, [progress])

  const dimensionAverages = useCallback((): Record<string, number> => {
    const totals: Record<string, number[]> = {}
    for (const p of progress.values()) {
      for (const attempt of p.attempts) {
        for (const dim of attempt.dimensions) {
          if (!totals[dim.id]) totals[dim.id] = []
          totals[dim.id].push(dim.score)
        }
      }
    }
    const avgs: Record<string, number> = {}
    for (const [id, scores] of Object.entries(totals)) {
      avgs[id] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
    }
    return avgs
  }, [progress])

  const stats = useCallback(() => {
    let passed = 0; let gold = 0; let totalAttempts = 0
    for (const p of progress.values()) {
      if (p.passed) passed++
      if (p.gold) gold++
      totalAttempts += p.attempts.length
    }
    return { passed, gold, totalAttempts, total: CHALLENGES.length }
  }, [progress])

  const clearAll = useCallback(() => {
    setProgress(new Map())
  }, [])

  return createElement(
    ProgressContext.Provider,
    {
      value: {
        progress,
        loaded,
        isUnlocked,
        addAttempt,
        applyAttemptServerSide,
        markRevealed,
        canReveal,
        getProgress,
        dimensionAverages,
        stats,
        clearAll,
        refresh,
        xpTotal,
        xpEvents,
        badges,
        rank,
      },
    },
    children,
  )
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within <ProgressProvider>')
  return ctx
}
