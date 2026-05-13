import { useCallback, useEffect, useRef, useState } from 'react'
import type { RevealResponse } from '@/types'

export type StreamPhase = 'idle' | 'streaming' | 'done' | 'error'

export interface StreamState {
  phase: StreamPhase
  text: string
  tokens?: { input: number; output: number }
  executionMs?: number
  error?: string
}

const IDLE_STREAM: StreamState = { phase: 'idle', text: '' }

type ExpertCacheEntry = { revealData: RevealResponse; expertExec: StreamState }
const expertCache = new Map<string, ExpertCacheEntry>()

export function hasExpertCacheFor(challengeId: string): boolean {
  return expertCache.has(challengeId)
}

type SSEFrame = { event: string; data: unknown }

function parseSSE(frame: string): SSEFrame | null {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  if (dataLines.length === 0) return null
  try {
    return { event, data: JSON.parse(dataLines.join('\n')) }
  } catch {
    return null
  }
}

async function streamExecute(
  prompt: string,
  signal: AbortSignal,
  onUpdate: (patch: Partial<StreamState>) => void,
  onReplace: (next: StreamState) => void,
) {
  onReplace({ phase: 'streaming', text: '' })
  try {
    const res = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal,
    })
    if (!res.ok || !res.body) {
      let message = `HTTP ${res.status}`
      try {
        const j = await res.json()
        if (j?.error) message = j.error
      } catch {
        // not json
      }
      onUpdate({ phase: 'error', error: message })
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    let acc = ''

    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      let sep
      while ((sep = buf.indexOf('\n\n')) >= 0) {
        const frameStr = buf.slice(0, sep)
        buf = buf.slice(sep + 2)
        const frame = parseSSE(frameStr)
        if (!frame) continue

        if (frame.event === 'delta') {
          const t = (frame.data as { text?: string })?.text ?? ''
          if (t) {
            acc += t
            onUpdate({ text: acc })
          }
        } else if (frame.event === 'done') {
          const data = frame.data as { tokens?: { input: number; output: number }; execution_time_ms?: number }
          onUpdate({
            phase: 'done',
            tokens: data.tokens,
            executionMs: data.execution_time_ms,
          })
          return
        } else if (frame.event === 'error') {
          const msg = (frame.data as { error?: string })?.error ?? 'Execution failed'
          onUpdate({ phase: 'error', error: msg })
          return
        }
      }
    }
    // Stream ended without an explicit `done` event — accept what we have.
    onUpdate({ phase: 'done' })
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') return
    const msg = err instanceof Error ? err.message : 'Execution failed'
    onUpdate({ phase: 'error', error: msg })
  }
}

export function useExecute() {
  const [revealData, setRevealData] = useState<RevealResponse | null>(null)
  const [isRevealing, setIsRevealing] = useState(false)
  const [revealError, setRevealError] = useState<string | null>(null)
  const [userExec, setUserExec] = useState<StreamState>(IDLE_STREAM)
  const [expertExec, setExpertExec] = useState<StreamState>(IDLE_STREAM)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setRevealData(null)
    setIsRevealing(false)
    setRevealError(null)
    setUserExec(IDLE_STREAM)
    setExpertExec(IDLE_STREAM)
  }, [])

  const reveal = useCallback(async (sessionToken: string, signal: AbortSignal): Promise<RevealResponse | null> => {
    setIsRevealing(true)
    setRevealError(null)
    try {
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken }),
        signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setRevealData(data)
      return data
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return null
      const msg = err instanceof Error ? err.message : 'Reveal failed'
      setRevealError(msg)
      return null
    } finally {
      setIsRevealing(false)
    }
  }, [])

  const updateUser = useCallback((patch: Partial<StreamState>) => {
    setUserExec(prev => ({ ...prev, ...patch }))
  }, [])
  const replaceUser = useCallback((next: StreamState) => setUserExec(next), [])
  const updateExpert = useCallback((patch: Partial<StreamState>) => {
    setExpertExec(prev => ({ ...prev, ...patch }))
  }, [])
  const replaceExpert = useCallback((next: StreamState) => setExpertExec(next), [])

  const executeExpertOnly = useCallback(async (improvedPrompt: string) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    setUserExec(IDLE_STREAM)
    setExpertExec(IDLE_STREAM)

    void streamExecute(improvedPrompt, ac.signal, updateExpert, replaceExpert)
  }, [updateExpert, replaceExpert])

  const revealAndExecuteBoth = useCallback(async (
    sessionToken: string | null,
    userPrompt: string,
    challengeId?: string,
  ) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    setUserExec(IDLE_STREAM)

    // Cache hit: hydrate expert from cache, only stream user.
    if (challengeId) {
      const cached = expertCache.get(challengeId)
      if (cached) {
        setRevealData(cached.revealData)
        setExpertExec(cached.expertExec)
        void streamExecute(userPrompt, ac.signal, updateUser, replaceUser)
        return
      }
    }

    if (!sessionToken) return

    setExpertExec(IDLE_STREAM)
    const data = await reveal(sessionToken, ac.signal)
    if (!data || ac.signal.aborted) return

    // Stream user in parallel.
    void streamExecute(userPrompt, ac.signal, updateUser, replaceUser)

    // Stream expert and capture final state into cache on success.
    let captured: StreamState = { phase: 'streaming', text: '' }
    const captureUpdate = (patch: Partial<StreamState>) => {
      captured = { ...captured, ...patch }
      setExpertExec(prev => ({ ...prev, ...patch }))
    }
    const captureReplace = (next: StreamState) => {
      captured = next
      setExpertExec(next)
    }
    await streamExecute(data.improved_prompt, ac.signal, captureUpdate, captureReplace)
    if (challengeId && captured.phase === 'done' && !ac.signal.aborted) {
      expertCache.set(challengeId, { revealData: data, expertExec: captured })
    }
  }, [reveal, updateUser, replaceUser])

  return {
    revealData,
    isRevealing,
    revealError,
    userExec,
    expertExec,
    revealAndExecuteBoth,
    executeExpertOnly,
    hasExpertCache: hasExpertCacheFor,
    reset,
  }
}
