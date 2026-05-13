import type { Challenge } from '@/types'

export const CHALLENGES: Challenge[] = [
  {
    id: 'b1', tier: 'beginner', order: 1,
    title: 'Just Ask',
    structural_task: 'Write a prompt that asks the AI to summarize the meeting notes above.',
    brief: 'The simplest prompts often fail because they are too vague. A good prompt leaves no room for the model to guess: it states the task, the subject, and the desired outcome in clear, direct language.',
    topic_prompt: '',
    topic_examples: [],
    focus_dimensions: ['clarity'],
    secondary_dimensions: [],
    hint: "Start with a strong action verb (Summarize, Extract, Identify). Say exactly how long the summary should be, what it should include, and who it's for.",
    unlock_after: null,
    sample_content: {
      label: 'Meeting notes: Q3 product planning',
      body: `Attendees: Priya (PM), Marcus (Eng lead), Dana (Design), Tom (Sales)

1. Pricing rework is the #1 request from enterprise prospects. Dana has mockups of a new pricing page; Tom says 3 of our last 5 lost deals cited unclear pricing.
2. Mobile bug backlog has grown to 47 issues. Marcus proposes a 2-week "fix-it" sprint in October. Concern: blocks the payments migration.
3. Payments migration to Stripe Billing: infra ready, but legal review pending — likely 3 more weeks. Tom flagged that one enterprise customer is stalling their renewal on it.
4. Hiring: 2 senior engineer reqs open for 6 weeks, only 4 qualified candidates in pipeline. Marcus wants to try a contract-to-hire route.
5. OKRs for Q4 due by Sept 30. Priya will circulate a draft Friday. Current leading candidates: (a) ship new pricing, (b) cut mobile P0 bugs by 50%, (c) complete Stripe migration.

Decisions: fix-it sprint approved contingent on legal finishing Stripe review first. Priya to follow up with legal Monday.
Action items: Priya → Stripe legal status by Mon; Dana → pricing page v2 by next Thurs; Marcus → contract-to-hire proposal by Wed.`,
      goal: 'You want a short summary you can forward to your VP who missed the meeting.',
    },
  },
  {
    id: 'b2', tier: 'beginner', order: 2,
    title: 'Set the Scene',
    structural_task: 'Write a prompt to get useful advice on the situation above.',
    brief: "Context transforms a generic answer into a targeted one. Before asking the AI for advice, give it the background it needs: who you are, who AI should act as, what situation you're in, and what a good outcome looks like.",
    topic_prompt: '',
    topic_examples: [],
    focus_dimensions: ['context'],
    secondary_dimensions: ['clarity'],
    hint: 'Include: who you are (role/experience), the specific situation, what you\'ve already considered, and who AI should act as (e.g. an experienced manager, a coaching expert).',
    unlock_after: 'b1',
    sample_content: {
      label: 'Scenario: a hard 1:1 on Wednesday',
      body: `You are a second-year team lead managing four analysts. One of them, Alex, has been a strong contributor for two years but has missed three consecutive deadlines this quarter and has gone noticeably quiet in team meetings. Peers are starting to pick up the slack; you're hearing grumbling. You have a 1:1 with Alex scheduled for Wednesday. You've never had to give hard feedback before and don't want this to blow up — or be swept under the rug.`,
      goal: 'You want practical advice on how to approach the Wednesday conversation with Alex.',
    },
  },
  {
    id: 'b3', tier: 'beginner', order: 3,
    title: 'Shape the Output',
    structural_task: 'Write a prompt that produces a structured summary of the support tickets above.',
    brief: "Without output instructions, AI picks a format for you, and it may not be what you need. Specifying the exact output format (table, bullets, sections, length) and the boundaries (what to include, what to skip) dramatically improves usability.",
    topic_prompt: '',
    topic_examples: [],
    focus_dimensions: ['output'],
    secondary_dimensions: ['clarity'],
    hint: 'Tell the model the format (table with these columns, bullets, etc.), the length (N rows or N bullets max), and what to exclude (e.g. skip thank-you notes).',
    unlock_after: 'b2',
    sample_content: {
      label: 'Customer support tickets: last 7 days',
      body: `1. "Love the new dashboard but export is still broken — third week in a row."
2. "Can't log in on mobile, says session expired over and over. URGENT."
3. "Thank you!! The team solved my billing issue in under an hour, amazing service."
4. "Report generator times out for anything over 30 days. Had to split into 6 queries."
5. "UI feels great and search is faster. One request: can we bulk-edit tags?"
6. "Why did pricing go up without warning? About to switch providers if this isn't explained."`,
      goal: "You want a structured table you can paste into your team's Monday standup.",
    },
  },
  {
    id: 'b5', tier: 'beginner', order: 5,
    title: "Show Don't Tell",
    structural_task: 'Write a prompt that reformats the raw notes above into a consistent structure.',
    brief: "Examples are one of the most reliable tools in prompting. Instead of describing what you want in words, show the model an example of input and expected output. This removes ambiguity and locks in the format you're after.",
    topic_prompt: '',
    topic_examples: [],
    focus_dimensions: ['examples'],
    secondary_dimensions: ['output'],
    hint: 'Include at least one input/output example pair in your prompt. Show the exact format you want the output to follow, and the model will match your pattern.',
    unlock_after: 'b3',
    sample_content: {
      label: "Raw notes from today's 1:1s",
      body: `- Amy 10am still blocked on api access, waiting on IT for 3 days. wants me to escalate.
- 1030 Jordan, promotion case ready for review. Need eng lead signoff by Fri.
met w/ Priya @ 11: pricing rollout now delayed by 2 wks, wants me to tell sales this week`,
      goal: 'You want these reformatted into a consistent {time | person | topic | action needed} structure so you can paste them into your weekly report.',
    },
  },
  {
    id: 'b6', tier: 'beginner', order: 6,
    title: 'Think It Through',
    structural_task: 'Write a prompt that walks through the troubleshooting problem above systematically.',
    brief: "For messy problems, asking the model to think step-by-step dramatically improves accuracy. Chain-of-thought prompting keeps the model from jumping to conclusions and breaks the work into phases you can verify.",
    topic_prompt: '',
    topic_examples: [],
    focus_dimensions: ['thinking'],
    secondary_dimensions: ['context'],
    hint: 'Instruct the model to reason step by step before answering. Break the task into phases: "First, list possible causes. Then, rank them by likelihood. Finally, suggest how to test the top two."',
    unlock_after: 'b5',
    sample_content: {
      label: 'Troubleshooting: sudden pipeline drop',
      body: `Our marketing-qualified lead (MQL) pipeline usually delivers around 100 leads per month to sales. Last month it delivered 12. Nothing obvious broke: the website is up, the forms submit, Salesforce is receiving data, and marketing ran the same campaigns as always. Sales is escalating fast and the VP wants answers tomorrow.`,
      goal: 'You want AI to walk through possible causes systematically and tell you what to check first.',
    },
  },
  {
    id: 'i2', tier: 'intermediate', order: 2,
    title: 'Meeting to Action',
    structural_task: 'Write a prompt that extracts and prioritizes action items from the meeting notes above.',
    brief: "Extracting structured decisions from raw text requires the model to understand your prioritization criteria, the output format, and any constraints, like ignoring discussion that didn't result in a commitment. This combines clarity, output shape, and boundaries.",
    topic_prompt: '',
    topic_examples: [],
    focus_dimensions: ['clarity', 'output'],
    secondary_dimensions: ['context'],
    hint: 'Specify what counts as an action item, how to rank priority (business impact? urgency?), what to exclude (unassigned ideas, backlog grooming), and the exact output fields (owner, deadline, priority).',
    unlock_after: 'b6',
    sample_content: {
      label: 'Meeting notes: Q3 product planning',
      body: `Attendees: Priya (PM), Marcus (Eng lead), Dana (Design), Tom (Sales)

1. Pricing rework is the #1 request from enterprise prospects. Dana has mockups of a new pricing page; Tom says 3 of our last 5 lost deals cited unclear pricing.
2. Mobile bug backlog has grown to 47 issues. Marcus proposes a 2-week "fix-it" sprint in October. Concern: blocks the payments migration.
3. Payments migration to Stripe Billing: infra ready, but legal review pending — likely 3 more weeks. Tom flagged that one enterprise customer is stalling their renewal on it.
4. Hiring: 2 senior engineer reqs open for 6 weeks, only 4 qualified candidates in pipeline. Marcus wants to try a contract-to-hire route.
5. OKRs for Q4 due by Sept 30. Priya will circulate a draft Friday. Current leading candidates: (a) ship new pricing, (b) cut mobile P0 bugs by 50%, (c) complete Stripe migration.

Decisions: fix-it sprint approved contingent on legal finishing Stripe review first. Priya to follow up with legal Monday.
Action items: Priya → Stripe legal status by Mon; Dana → pricing page v2 by next Thurs; Marcus → contract-to-hire proposal by Wed.`,
      goal: 'You want a prioritized action-item list with owner, deadline, and priority, ready to paste into your project tracker.',
    },
  },
  {
    id: 'i5', tier: 'intermediate', order: 5,
    title: 'Customer Voice',
    structural_task: 'Write a prompt that surfaces recurring themes across the feedback above.',
    brief: "Qualitative analysis at scale needs context about what matters, examples of how to classify a theme, a clear output structure, and constraints that prevent over-generalizing. Four of the five areas show up here at once.",
    topic_prompt: '',
    topic_examples: [],
    focus_dimensions: ['context', 'examples', 'output'],
    secondary_dimensions: [],
    hint: 'Tell AI what you\'re preparing for (a QBR?), give one example of a theme with its supporting quotes, set a minimum evidence threshold (e.g. at least 2 comments per theme), and define the output shape.',
    unlock_after: 'i2',
    sample_content: {
      label: 'NPS survey comments: last quarter',
      body: `1. The product has replaced three tools for us. Pricing is high but we can justify it for now. — SaaS Co
2. Love it, but the mobile experience still feels like an afterthought. — Finance team
3. Support is excellent. Documentation is not. — Engineering lead
4. Simple to set up for my team. Wish the reporting was deeper. — Ops manager
5. We'd pay more if we got better SSO options. Currently blocked on rollout. — IT lead
6. Great tool. Slack integration works about 80% of the time. — PM
7. Way too many emails. Can't find the settings to turn them off. — Marketer
8. The search is the weakest part. We often end up using browser Ctrl+F. — Recruiter
9. Customer success rep is amazing. Product is fine, CS is the reason we renewed. — Director
10. The data export times out on large datasets. Had to build a workaround. — Analyst`,
      goal: 'You want 3–4 recurring themes with counts and supporting quotes, formatted for a quarterly business review.',
    },
  },
  {
    id: 'i4', tier: 'intermediate', order: 4,
    title: 'Risk Radar',
    structural_task: 'Write a prompt that flags and categorizes risks in the vendor proposal above.',
    brief: "Risk analysis benefits from a structured expert lens. Combine context about what you're evaluating, an appropriate reviewer role, systematic reasoning, and output that categorizes risks by type and severity so stakeholders can triage quickly.",
    topic_prompt: '',
    topic_examples: [],
    focus_dimensions: ['context', 'output', 'thinking'],
    secondary_dimensions: [],
    hint: 'Assign a risk-reviewer role (procurement analyst, vendor-risk specialist), ask the model to reason through risks by category first, then output a severity-rated table.',
    unlock_after: 'i5',
    sample_content: {
      label: 'Vendor proposal: data warehousing contract',
      body: `VENDOR: DataSphere Inc. (Series B, ~80 employees, founded 2019)
CONTRACT: 3-year commitment, $240K/yr, pre-paid annually (total $720K)
TERM: Auto-renewing 3-year term with 120-day exit notice
PAYMENT: Upfront annual; no refund on early cancellation after day 30
DATA: Full customer data hosted on vendor infrastructure; they handle backups
SLA: 99.5% uptime, credit-only remedy, capped at 2% of annual fee
COMPLIANCE: SOC 2 Type II; GDPR status "in progress"; no HIPAA
INTEGRATION: Proprietary ingestion format; migration tool is beta
PRICING: 20% annual increase baked in after year 1
PERSONNEL: Dedicated success rep named in contract, no backup staffing clause
REFERENCES: Two customers provided; one is a sister company of the vendor's CEO`,
      goal: 'You want the highest-severity risks flagged by category (financial, operational, compliance, vendor health) before your legal review on Friday.',
    },
  },
  {
    id: 'a1', tier: 'advanced', order: 1,
    title: 'Deep Review',
    structural_task: 'Write a prompt that produces an expert review of the policy draft above.',
    brief: "An expert review needs all five areas working together: a credentialed reviewer, the right context, structured reasoning, examples of what counts as an issue, precise output, and clear scope. This is the shape of real work.",
    topic_prompt: '',
    topic_examples: [],
    focus_dimensions: ['clarity', 'context', 'output', 'examples', 'thinking'],
    secondary_dimensions: [],
    hint: 'Assign a specialist reviewer role, show an example of what a "gap" or "inconsistency" looks like, ask for findings categorized by severity, and decompose into review phases (scope → gaps → conflicts → vague language).',
    unlock_after: 'i4',
    sample_content: {
      label: 'Security policy: employee device access (draft v2)',
      body: `SCOPE: All employees and contractors with company device access.

POLICY:
1. Company devices must have full-disk encryption enabled at all times.
2. All personal devices (BYOD) used for work must install company MDM software.
3. Sensitive data (customer PII, source code, financials) may be accessed from any device at the employee's discretion as long as encryption is enabled.
4. Departing employees are responsible for deleting company data from personal devices; this will be audited upon request.
5. Passwords must be changed every 90 days. No other credential requirements apply.
6. USB drives are permitted as long as they are encrypted by the user.
7. Exceptions can be granted by a manager in writing.

ENFORCEMENT: IT reserves the right to audit devices upon suspicion of policy violation.
EFFECTIVE: Upon CEO signature.`,
      goal: 'You want a senior-reviewer-level critique flagging gaps, inconsistencies, and vague enforceability, before this goes company-wide.',
    },
  },
  {
    id: 'a5', tier: 'advanced', order: 5,
    title: 'Incident Analysis',
    structural_task: 'Write a prompt that produces a blameless post-mortem from the incident timeline above.',
    brief: "Post-mortems require causal reasoning, structured output, and careful constraints around blame versus systems analysis. This is the capstone: all five areas must work together to produce a document the whole company can learn from.",
    topic_prompt: '',
    topic_examples: [],
    focus_dimensions: ['clarity', 'context', 'output', 'examples', 'thinking'],
    secondary_dimensions: [],
    hint: 'Assign a retrospective-facilitator role, explicitly constrain to blameless analysis (critique systems, not individuals), and decompose into: timeline → root cause → contributing factors → impact → remediation → prevention.',
    unlock_after: 'a1',
    sample_content: {
      label: 'Incident timeline: payment processing outage',
      body: `DURATION: 2h 47m outage (Tues 09:12–11:59 ET)
IMPACT: ~4,300 customer transactions failed; $180K in blocked payments

TIMELINE:
09:08 — Automated deploy of billing-service v4.12 to prod via standard pipeline
09:12 — First alert: error rate on POST /charge exceeds 5% (usually <0.1%)
09:14 — On-call engineer paged; pager silent for 3m (engineer was in another incident)
09:17 — Engineer acknowledges; begins investigation
09:28 — Suspected DB connection pool exhaustion; engineer restarts pool
09:32 — Partial recovery; error rate drops to 2% but begins climbing again
09:44 — Second on-call pulled in; root cause suspected to be new code in v4.12
09:58 — Decision to roll back v4.12
10:15 — Rollback initiated; deploy pipeline slow due to unrelated CI congestion
11:47 — Rollback complete
11:59 — Error rate returns to baseline

OBSERVATIONS: No pre-deploy load test was run. Rollback docs were last updated in 2022. On-call runbook for this service was incomplete.`,
      goal: 'You want a blameless post-mortem suitable to share company-wide: timeline, root cause, contributing factors, impact, remediation, and prevention.',
    },
  },
]

export const CHALLENGE_MAP = new Map(CHALLENGES.map(c => [c.id, c]))

export const DIMENSION_META: Record<string, { name: string; shortName: string; description: string }> = {
  clarity:  { name: 'Clarity',  shortName: 'Clarity',  description: 'Say exactly what you want: strong verb, specific subject, no guessing.' },
  context:  { name: 'Context',  shortName: 'Context',  description: 'Set the scene: who you are, who AI should be, what the situation is.' },
  output:   { name: 'Output',   shortName: 'Output',   description: 'Shape the result: format, length, structure, what to include or avoid.' },
  examples: { name: 'Examples', shortName: 'Examples', description: "Show don't tell: give input/output pairs so AI matches the pattern." },
  thinking: { name: 'Thinking', shortName: 'Thinking', description: 'Guide the process: ask for step-by-step or break the job into phases.' },
}

const FOCUS_PREFIX_MAX_INDEX = 5

export function shouldShowFocusPrefix(challenge: Challenge): boolean {
  return CHALLENGES.indexOf(challenge) < FOCUS_PREFIX_MAX_INDEX
}

export function focusPrefix(challenge: Challenge): string | null {
  if (challenge.focus_dimensions.length !== 1) return null
  const meta = DIMENSION_META[challenge.focus_dimensions[0]]
  return meta ? meta.name : null
}

export function challengeDisplayTitle(challenge: Challenge): string {
  if (!shouldShowFocusPrefix(challenge)) return challenge.title
  const focus = focusPrefix(challenge)
  return focus ? `Focus: ${focus} · ${challenge.title}` : challenge.title
}
