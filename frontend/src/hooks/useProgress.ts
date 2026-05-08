import { useState, useCallback, useEffect } from 'react'
import type { ChallengeProgress, ChallengeAttempt, DimensionScore } from '@/types'
import { CHALLENGES } from '@/data/challenges'

export function useProgress() {
  const [progress, setProgress] = useState<Map<string, ChallengeProgress>>(new Map)
  const [loaded, setLoaded] = useState(false)

  // Load from server on mount
  useEffect(() => {
    fetch('/api/user/progress')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.challenges) {
          setProgress(new Map(Object.entries(data.challenges) as [string, ChallengeProgress][]))
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const isUnlocked = useCallback((challengeId: string): boolean => {
    const challenge = CHALLENGES.find(c => c.id === challengeId)
    if (!challenge) return false
    if (!challenge.unlock_after) return true
    const prev = progress.get(challenge.unlock_after)
    return (prev?.best_score ?? 0) >= 75
  }, [progress])

  // Optimistic local update — DB write happens server-side in /api/analyze
  const addAttempt = useCallback((
    challengeId: string,
    prompt: string,
    score: number,
    dimensions: DimensionScore[],
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

  const markRevealed = useCallback((challengeId: string) => {
    // Persist to server
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

  return {
    progress,
    loaded,
    isUnlocked,
    addAttempt,
    markRevealed,
    canReveal,
    getProgress,
    dimensionAverages,
    stats,
    clearAll,
  }
}
