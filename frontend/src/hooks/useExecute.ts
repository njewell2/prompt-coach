import { useState, useCallback } from 'react'
import type { ExecuteResponse, RevealResponse } from '@/types'

type ExecuteState =
  | { phase: 'idle' }
  | { phase: 'revealing' }
  | { phase: 'executing'; reveal: RevealResponse | null }
  | { phase: 'done'; reveal: RevealResponse | null; execution: ExecuteResponse }
  | { phase: 'error'; message: string }

export function useExecute() {
  const [state, setState] = useState<ExecuteState>({ phase: 'idle' })

  const reveal = useCallback(async (sessionToken: string): Promise<RevealResponse | null> => {
    setState({ phase: 'revealing' })
    try {
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setState({ phase: 'executing', reveal: data })
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Reveal failed'
      setState({ phase: 'error', message: msg })
      return null
    }
  }, [])

  const execute = useCallback(async (prompt: string, revealData: RevealResponse | null): Promise<ExecuteResponse | null> => {
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setState({ phase: 'done', reveal: revealData, execution: data })
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Execution failed'
      setState({ phase: 'error', message: msg })
      return null
    }
  }, [])

  const revealAndExecute = useCallback(async (sessionToken: string) => {
    const revealData = await reveal(sessionToken)
    if (!revealData) return
    await execute(revealData.improved_prompt, revealData)
  }, [reveal, execute])

  // For practice mode: improved_prompt already available, skip reveal
  const executeOnly = useCallback(async (improvedPrompt: string) => {
    setState({ phase: 'executing', reveal: null })
    await execute(improvedPrompt, null)
  }, [execute])

  const reset = useCallback(() => setState({ phase: 'idle' }), [])

  return {
    phase: state.phase,
    revealData: (state.phase === 'executing' || state.phase === 'done') ? state.reveal : null,
    execution: state.phase === 'done' ? state.execution : null,
    error: state.phase === 'error' ? state.message : null,
    isRevealing: state.phase === 'revealing',
    isExecuting: state.phase === 'executing',
    revealAndExecute,
    executeOnly,
    reset,
  }
}
