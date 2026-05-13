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
  skip_improved?: boolean
}

export interface XpEvent {
  reason: 'attempt' | 'pass' | 'gold' | 'first_try' | 'improve' | 'perfect_dim' | 'reveal'
  amount: number
  metadata?: { challenge_id?: string; dim_id?: string; delta?: number } | null
  timestamp?: number
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
  xp_earned?: XpEvent[]          // training mode only, authenticated
  xp_total?: number
  new_badges?: string[]
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
  strengths?: string[]
  improvements?: string[]
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

export interface Badge {
  earned: boolean
  label: string
  description: string
  progress: { current: number; target: number }
}

export interface UserProgressResponse {
  challenges: Record<string, ChallengeProgress>
  xp_total: number
  xp_events: XpEvent[]
  badges: Record<string, Badge>
  rank: { position: number | null; total: number }
}

export interface LeaderboardRow {
  username: string
  xp: number
  challenges_passed: number
  rank?: number
  is_you?: boolean
}

export interface LeaderboardMeResponse {
  top: LeaderboardRow[]
  above: LeaderboardRow[]
  below: LeaderboardRow[]
  you: (LeaderboardRow & { rank: number }) | null
  rank: number | null
  total: number
}

export interface LeaderboardTopResponse {
  top: LeaderboardRow[]
  total: number
}

export interface FacilitatorTheme {
  name: string
  description: string
  quote_ids: number[]
}

export interface FacilitatorResponse {
  id: number
  username: string
  text: string
  created_at: number
}

export interface FacilitatorResponsesPayload {
  responses: FacilitatorResponse[]
  cluster: { themes: FacilitatorTheme[]; quote_count: number; created_at: number } | null
  clustering: boolean
}

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
  // Optional concrete content to work on (pilot: B1). When present, the
  // challenge switches to a 3-step guided flow and topic_prompt is ignored.
  sample_content?: {
    label: string
    body: string
    goal: string
  }
}
