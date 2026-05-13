import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  DimensionScore,
  TokenUsage,
  XpEvent,
} from '@/types'

export type PartialAnalyze = {
  dimensions: DimensionScore[]
  overall_score?: number
  strengths?: string[]
  improvements?: string[]
  improved_prompt?: string
  improved_dimensions?: DimensionScore[]
  improved_overall_score?: number
  session_token?: string
  tokens?: TokenUsage
  analysis_time_ms?: number
  xp_earned?: XpEvent[]
  xp_total?: number
  new_badges?: string[]
}

type AnalyzeState =
  | { phase: 'idle' }
  | { phase: 'streaming'; partial: PartialAnalyze }
  | { phase: 'done'; result: AnalyzeResponse }
  | { phase: 'error'; message: string }

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

function applyEvent(prev: PartialAnalyze, frame: SSEFrame): PartialAnalyze {
  const data = frame.data as Record<string, unknown>
  switch (frame.event) {
    case 'dimension':
      return { ...prev, dimensions: [...prev.dimensions, data as unknown as DimensionScore] }
    case 'scoring_meta':
      return {
        ...prev,
        overall_score: data.overall_score as number | undefined,
        strengths: (data.strengths as string[] | undefined) ?? prev.strengths,
        improvements: (data.improvements as string[] | undefined) ?? prev.improvements,
      }
    case 'scoring_complete':
      return {
        ...prev,
        session_token: data.session_token as string | undefined,
        xp_earned: data.xp_earned as XpEvent[] | undefined,
        xp_total: data.xp_total as number | undefined,
        new_badges: data.new_badges as string[] | undefined,
      }
    case 'improve':
      return {
        ...prev,
        improved_prompt: data.improved_prompt as string | undefined,
        improved_dimensions: data.improved_dimensions as DimensionScore[] | undefined,
        improved_overall_score: data.improved_overall_score as number | undefined,
      }
    case 'finalize':
      return {
        ...prev,
        tokens: data.tokens as TokenUsage | undefined,
        analysis_time_ms: data.analysis_time_ms as number | undefined,
      }
    default:
      return prev
  }
}

export function useAnalyze() {
  const [state, setState] = useState<AnalyzeState>({ phase: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const analyze = useCallback(async (req: AnalyzeRequest): Promise<AnalyzeResponse | null> => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    let partial: PartialAnalyze = { dimensions: [] }
    setState({ phase: 'streaming', partial })

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: ac.signal,
      })

      if (!res.ok || !res.body) {
        let message = `HTTP ${res.status}`
        try {
          const j = await res.json()
          if (j?.error) message = j.error
        } catch {
          // body not JSON; keep status message
        }
        throw new Error(message)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

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

          if (frame.event === 'error') {
            const msg = (frame.data as { error?: string })?.error || 'Analysis failed'
            throw new Error(msg)
          }
          if (frame.event === 'done') {
            const result = partial as AnalyzeResponse
            setState({ phase: 'done', result })
            return result
          }
          partial = applyEvent(partial, frame)
          setState({ phase: 'streaming', partial })
        }
      }

      // Stream ended without explicit `done` — treat what we have as final.
      const result = partial as AnalyzeResponse
      setState({ phase: 'done', result })
      return result
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return null
      const msg = err instanceof Error ? err.message : 'Analysis failed'
      setState({ phase: 'error', message: msg })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ phase: 'idle' })
  }, [])

  const partial: PartialAnalyze | null =
    state.phase === 'streaming'
      ? state.partial
      : state.phase === 'done'
        ? state.result
        : null

  return {
    phase: state.phase,
    partial,
    result: state.phase === 'done' ? state.result : null,
    error: state.phase === 'error' ? state.message : null,
    isStreaming: state.phase === 'streaming',
    isLoading: state.phase === 'streaming',
    analyze,
    reset,
  }
}
