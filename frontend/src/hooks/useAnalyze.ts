import { useState, useCallback } from 'react'
import type { AnalyzeRequest, AnalyzeResponse } from '@/types'

type AnalyzeState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'done'; result: AnalyzeResponse }
  | { phase: 'error'; message: string }

export function useAnalyze() {
  const [state, setState] = useState<AnalyzeState>({ phase: 'idle' })

  const analyze = useCallback(async (req: AnalyzeRequest): Promise<AnalyzeResponse | null> => {
    setState({ phase: 'loading' })
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setState({ phase: 'done', result: data })
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed'
      setState({ phase: 'error', message: msg })
      return null
    }
  }, [])

  const reset = useCallback(() => setState({ phase: 'idle' }), [])

  return {
    phase: state.phase,
    result: state.phase === 'done' ? state.result : null,
    error: state.phase === 'error' ? state.message : null,
    isLoading: state.phase === 'loading',
    analyze,
    reset,
  }
}
