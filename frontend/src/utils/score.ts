export type ScoreLabel = 'Exceptional' | 'Strong' | 'Developing' | 'Needs Work' | 'Foundational'

export function scoreLabel(score: number, outOf100 = false): ScoreLabel {
  const n = outOf100 ? score : score * 10
  if (n >= 90) return 'Exceptional'
  if (n >= 75) return 'Strong'
  if (n >= 55) return 'Developing'
  if (n >= 35) return 'Needs Work'
  return 'Foundational'
}

/** Convert an overall 0-100 score to a 0-10 display score with one decimal */
export function toDisplayScore(score: number): number {
  return Math.round(score) / 10
}

export function scoreColor(score: number, outOf100 = false): string {
  const n = outOf100 ? score : score * 10
  if (n >= 70) return 'var(--score-high)'
  if (n >= 40) return 'var(--score-mid)'
  return 'var(--score-low)'
}

export function scoreBg(score: number, outOf100 = false): string {
  const n = outOf100 ? score : score * 10
  if (n >= 70) return 'var(--score-high-bg)'
  if (n >= 40) return 'var(--score-mid-bg)'
  return 'var(--score-low-bg)'
}

export function deltaColor(delta: number): string {
  if (delta > 0) return 'var(--score-high)'
  if (delta < 0) return 'var(--score-low)'
  return 'var(--ink-3)'
}

export function formatDelta(delta: number): string {
  const rounded = Math.round(delta * 10) / 10
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  if (rounded > 0) return `+${text} ↑`
  if (rounded < 0) return `${text} ↓`
  return '·'
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Legacy alias so existing imports of scoreGrade don't break — returns label instead
export const scoreGrade = scoreLabel
export type ScoreGrade = ScoreLabel
