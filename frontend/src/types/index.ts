export interface DimensionScore {
  id: string
  name: string
  score: number
  explanation: string
  suggestion: string
  citation: {
    source: 'Anthropic' | 'Google' | 'OpenAI' | 'Meta' | 'arXiv'
    quote: string
    reference: string
  }
}

export interface TokenUsage {
  input: number
  output: number
  cache_read: number
  cache_creation: number
}

export interface AnalyzeRequest {
  prompt: string
  context?: string
  challenge_id?: string
  mode: 'training' | 'practice'
}

export interface AnalyzeResponse {
  dimensions: DimensionScore[]
  overall_score: number
  strengths: string[]
  improvements: string[]
  session_token?: string         // training mode only
  improved_prompt?: string       // practice mode only
  improved_dimensions?: DimensionScore[]
  improved_overall_score?: number
  tokens: TokenUsage
  analysis_time_ms: number
}

export interface RevealResponse {
  improved_prompt: string
  improved_dimensions: DimensionScore[]
  improved_overall_score: number
}

export interface ExecuteResponse {
  response: string
  tokens: { input: number; output: number }
  execution_time_ms: number
}

export interface ChallengeAttempt {
  timestamp: number
  prompt: string
  score: number
  dimensions: DimensionScore[]
  session_token?: string
}

export interface ChallengeProgress {
  challengeId: string
  attempts: ChallengeAttempt[]
  best_score: number
  passed: boolean
  gold: boolean
  revealed: boolean
}

export interface HistoryEntry {
  id: string
  timestamp: number
  prompt_preview: string
  overall_score: number
  grade: string
  response: AnalyzeResponse
}

export type ScoreGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'

export interface Challenge {
  id: string
  tier: 'beginner' | 'intermediate' | 'advanced'
  order: number
  title: string
  structural_task: string
  brief: string
  topic_prompt: string
  topic_examples: string[]
  focus_dimensions: string[]
  secondary_dimensions: string[]
  hint: string
  unlock_after: string | null
}
