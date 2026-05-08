import { useState, useCallback } from 'react'
import type { HistoryEntry, AnalyzeResponse } from '@/types'
import { scoreLabel } from '@/utils/score'

const STORAGE_KEY = 'prompt-coach-history'
const MAX = 50

function load(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(load)

  const addEntry = useCallback((prompt: string, response: AnalyzeResponse) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      prompt_preview: prompt.slice(0, 120),
      overall_score: response.overall_score,
      grade: scoreLabel(response.overall_score, true),
      response,
    }
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, MAX)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    return entry
  }, [])

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setHistory([])
  }, [])

  return { history, addEntry, clearHistory }
}
