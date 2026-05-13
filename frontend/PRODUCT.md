# Product

## Register

product

## Users

CapTech consultants and their clients, participating in a 15–20 minute in-person
AI-literacy session. They use Prompt Coach live, on whatever device they
brought — often phones, sometimes laptops. A facilitator drives the room from a
projector, referencing the attendees' responses and the live leaderboard. After
the session, attendees may return individually to complete more challenges at
their own pace.

The user's context is short, public, and a little competitive: they're trying
to earn XP and not look bad on the leaderboard while genuinely learning how to
write better prompts.

## Product Purpose

Prompt Coach is two things at once, equally:

1. **A working tool that teaches prompt engineering** through a tight challenge
   flow with dimension-level scoring, expert rewrites, and progress tracking.
   The scoring is grounded in published research from Anthropic, Google,
   OpenAI, Meta, and arXiv — cited in the UI so users trust the rubric.
2. **CapTech's demo of what AI literacy looks like when practiced well.** The
   app is client-facing evidence that the team ships thoughtful, on-brand AI
   products. It should hold up as a portfolio piece outside the event.

Success: an attendee leaves the 15-minute session with (a) a visible record of
progress they're proud of, and (b) a concrete feeling of "I know what a strong
prompt looks like now." The facilitator gets real-time visibility into what
the room thinks AI is for, via the clustered response view.

## Brand Personality

Confident, precise, editorial. Black headings, disciplined color, dense but
uncluttered layouts. The app speaks like a senior consultant: clear, never
condescending, quietly impressed by the user when they do well and specifically
constructive when they don't.

Three words: **grounded, competent, generous.**

Voice is "coach, not judge": every score is a growth opportunity. Even a weak
first attempt gets forward-looking language. Never shaming, never sycophantic.
The coach respects the user enough to tell them exactly what to fix next.

Feedback animations (XP floaters, confetti on gold, leaderboard pulses) are
intentional: they should feel like a well-crafted piece of product, not like a
mobile game. Every motion has a reason; every curve is the right curve.

## Anti-references

- **Duolingo / Kahoot-style gamification.** No cartoon mascots, no cheesy
  confetti, no loud congratulatory sound effects. Gamification in this app
  serves learning and is always in the brand palette.
- **Legacy enterprise training software.** No dense compliance-form layouts,
  no stock-photo heroes, no beige-on-gray. We are not a corporate LMS.
- **Generic "AI tool" aesthetic.** No dark-mode-by-default, no neon accents,
  no chat-bubble-as-primary-UI. AI is the subject matter, not the visual theme.
- **SaaS cliches.** No gradient text, no glass cards as default, no hero-metric
  templates, no identical card grids.

## Design Principles

1. **Coach, not judge.** Copy, scoring, and micro-interactions treat every
   attempt as progress. The voice is specific and constructive, never
   encouraging in a hollow way and never cutting.
2. **Practice what we preach.** The tool teaches prompt engineering, so its
   own copy, structure, and information hierarchy are models of clarity.
   If the UI is confusing, we've lost credibility before the first challenge.
3. **Brand discipline: CapTech blue, CapTech yellow, near-black ink.** The
   palette is a hard constraint, not a suggestion. Blue leads; yellow accents
   purposeful moments (XP, gold achievements, the one thing worth celebrating
   on the screen); black carries the reading weight. We do not introduce new
   hues outside this trio without a specific, defensible reason.
4. **Density serves the live event.** The facilitator needs to see 50+
   responses or 6 leaderboard rows on a projector without scrolling. The
   attendee on a phone needs to complete a challenge without fighting the
   layout. Tight spacing, short copy, no decorative padding.
5. **Every animation is intentional.** If a motion doesn't communicate state
   change or draw attention to a real event (XP earned, badge unlocked, rank
   changed), it doesn't ship. Curves are exponential ease-out. No bounce.
6. **Earns the portfolio shot.** The screens get photographed at the event and
   screenshotted by CapTech salespeople afterward. Every page should look
   intentional enough to be a case study thumbnail.

## Accessibility & Inclusion

- **WCAG 2.1 AA** baseline. Primary text contrast ≥ 7:1 (AAA on body text
  where possible) since a portion of the audience will view on a projector.
- **Mobile-first.** Tap targets ≥ 44px, no iOS zoom on inputs (font-size ≥
  16px), no horizontal scroll at iPhone SE widths.
- **Motion-sensitive users.** Respect `prefers-reduced-motion` everywhere
  animations exist: confetti, XP floaters, leaderboard pulses, and card
  transitions should all fall back to instant state changes.
- **Projector legibility.** The facilitator leaderboard and response-themes
  views assume a room-length viewing distance; typography on those pages
  trades density for legibility even on a laptop.
- **Color-blindness.** Never use color alone to convey state. Passed / gold /
  locked states in the challenge map also use icon shape. Score colors on
  dimension bars are paired with numeric values.
