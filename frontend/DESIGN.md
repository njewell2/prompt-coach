---
name: Prompt Coach
description: An AI-literacy training tool and CapTech portfolio piece — editorial, dense, disciplined.
colors:
  captech-blue: "#005DB9"
  captech-navy: "#003865"
  captech-dark-navy: "#002B5F"
  captech-yellow: "#FDDA24"
  captech-yellow-wash: "#FFFBE6"
  ink: "#0F172A"
  ink-2: "#334155"
  ink-3: "#64748B"
  ink-4: "#94A3B8"
  page: "#F6F8FA"
  surface: "#FFFFFF"
  surface-hover: "#F9FBFD"
  surface-quiet: "#F4F6F9"
  border: "#E3E8EF"
  border-strong: "#CBD5E1"
  score-low: "#D94032"
  score-mid: "#E8A000"
  score-high: "#1A7E42"
typography:
  display:
    fontFamily: "canada-type-gibson, Gibson, Helvetica Neue, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "canada-type-gibson, Gibson, Helvetica Neue, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "canada-type-gibson, Gibson, Helvetica Neue, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "canada-type-gibson, Gibson, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "canada-type-gibson, Gibson, Helvetica Neue, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.08em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
components:
  button-primary:
    backgroundColor: "{colors.captech-blue}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.captech-navy}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.captech-blue}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.captech-navy}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-quiet:
    backgroundColor: "{colors.surface-quiet}"
    rounded: "{rounded.lg}"
    padding: "10px"
  xp-pill:
    backgroundColor: "{colors.captech-yellow}"
    textColor: "{colors.captech-navy}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  chip-tier:
    backgroundColor: "{colors.surface-quiet}"
    textColor: "{colors.captech-blue}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: Prompt Coach

## 1. Overview

**Creative North Star: "The Briefing Room"**

Prompt Coach is designed as if a senior consultant is briefing a room from a
projector while every attendee follows along on their own device. The interface
is dense without being cluttered, confident without being loud, and optimized
for the two vantage points that actually matter: a laptop at arm's length and a
projection screen at the back of a room. White surfaces, near-black ink for
reading weight, CapTech blue carrying the chrome, and CapTech yellow reserved
for the one thing on any given screen worth drawing the eye to — an XP pill, a
gold-scored challenge, the active leaderboard rank.

The system rejects every shortcut AI tooling usually takes. There is no dark
mode, no neon accent, no chat-bubble UI, no hero-metric template, and no
identical card grid. It rejects the mirror-image shortcut for learning tools:
no cartoon mascots, no Duolingo green, no cheesy celebratory overlays.
Gamification is in the brand palette, or it does not ship.

**Key Characteristics:**
- Flat surfaces at rest; shadows appear only on state change (hover, focus,
  the row that just climbed the leaderboard).
- Near-black `#0F172A` headings, not navy. Navy is reserved for CTAs, active
  states, and the projector hero.
- Two accent hues total, both CapTech. Blue leads chrome. Yellow is the
  scarcest color on any screen.
- Dense layouts on purpose. The facilitator needs to show 50+ responses or
  6 ranks without scrolling; the attendee on a phone completes a challenge
  without fighting the layout.
- Animations communicate real events. If motion doesn't mark state change,
  it doesn't exist.

## 2. Colors

A three-color system: CapTech blue carries the chrome, CapTech yellow marks the
single moment worth celebrating on a given screen, and a near-black ink ramp
does the reading work. Every neutral is the cool grays the ink palette provides;
we do not introduce warm grays or tonal greens.

### Primary
- **CapTech Blue** (`#005DB9`): Primary CTA background, active navigation
  indicator, `is_you` left-border accent on leaderboard rows, challenge-map
  tier-beginner color, progress-bar fill, and the focus ring. The workhorse.
- **CapTech Navy** (`#003865`): The primary button's hover state. Logo wordmark.
  Tier-advanced challenges. XP pill text. Reserved for weight when blue would
  be too bright.
- **CapTech Dark Navy** (`#002B5F`): Projector backgrounds only
  (`FacilitatorLeaderboard`). Never used in the attendee flow.

### Secondary
- **CapTech Yellow** (`#FDDA24`): The scarcest color. XP pill fill, gold-reveal
  confetti, earned-badge icon color, "Open" CTA on the Free Practice tile,
  and the `accent-left-gold` rule on a tiny set of cards (hint callouts,
  gold-earned badges). Never used for body text, body backgrounds, or charts.
- **Yellow Wash** (`#FFFBE6`): Background tint for earned-badge cards and hint
  callouts. The only way yellow reads on a large surface.

### Neutral
- **Ink** (`#0F172A`): Headings and primary on-surface text. Not the navy.
- **Ink-2** (`#334155`): Body copy.
- **Ink-3** (`#64748B`): Secondary copy, subtitle, meta text.
- **Ink-4** (`#94A3B8`): Quiet captions, locked-state text, the icon baseline.
- **Page** (`#F6F8FA`): App background. Every card floats on this.
- **Surface** (`#FFFFFF`): Default card and header background.
- **Surface Quiet** (`#F4F6F9`): Dense cards (response quotes, XP-breakdown
  rows) where a border on white would be too loud.
- **Border** (`#E3E8EF`): Standard 1px card border.

### Supporting (score rail)
- **Score Low** (`#D94032`): Scores below 50. Paired with the numeric value;
  never communicates state alone.
- **Score Mid** (`#E8A000`): Scores 50–74.
- **Score High** (`#1A7E42`): Scores ≥ 75 (passing), the "Challenge Passed"
  banner, and the "EARNED" badge pill.

### Supporting (medal ramp)
- **Medal Gold** (`#E8B923`): Rank 1 on both leaderboards. Distinct from the
  `--captech-yellow` brand accent so rank colors don't bleed into the One
  Spark Rule.
- **Medal Silver** (`#B5B5B5`): Rank 2.
- **Medal Bronze** (`#CD7F32`): Rank 3.

Medal colors appear only on the rank numeral and the Trophy icon for ranks
1–3. They do not appear on backgrounds, borders, or other UI chrome.

### Named Rules
**The One Spark Rule.** On any given screen there is at most one yellow surface
and one yellow glyph above 14px. If a new yellow appears, an old one has to
earn its way out. Blue can be everywhere; yellow cannot.

**The No-New-Hue Rule.** Outside of research-source citation dots (Anthropic,
Google, OpenAI, Meta, arXiv — fixed five), we do not introduce new hues.
Purples, teals, magentas, greens: all prohibited unless they're a score color
or a citation color.

## 3. Typography

**Display Font:** Canada Type Gibson (via Adobe Typekit), with Helvetica Neue
and Arial fallbacks.
**Body Font:** same; the entire system runs on Gibson to keep the voice
consistent.
**Mono Font:** SF Mono / Monaco / Cascadia Code — used only for the prompt
textarea and the token-meter display.

**Character:** Gibson is a humanist geometric sans with squared-off terminals
and a slightly condensed feel. Headings at weight 700 read as confident
consulting type; body at weight 400 reads easily at 14px. There is no display
pairing; the single family carries the whole system to avoid the cliched
serif-display-plus-sans-body SaaS aesthetic.

### Hierarchy
- **Display** (700, 32px, line-height 1.2, letter-spacing -0.01em): page heroes.
  `PageHeader` title, login-screen H1. At the top of the Progress page.
- **Headline** (700, 24px, line-height 1.25): compact page titles; challenge
  title in `ChallengeView`; leaderboard page title on the projector.
- **Title** (600, 18px, line-height 1.3): card section headings ("Badges",
  "XP Breakdown", "Dimension Radar"), theme names on the facilitator view.
- **Body** (400, 14px, line-height 1.55): default prose and card content. Max
  line length ~70ch; longer reads break into a second column.
- **Small** (400, 13px, line-height 1.5): dense table-like content, Progress
  page stat subtitles, leaderboard row secondary line.
- **Micro** (600, 11px, letter-spacing 0.08em, uppercase): eyebrow labels,
  theme count pills, EARNED tags, nav active-state semantic.

### Named Rules
**The Single-Family Rule.** One type family across the entire app. Display vs.
body contrast comes from weight and size, never from family switching.

**The Uppercase-Micro Rule.** Any label at 11px and below is uppercase with
0.08em tracking. Any text above 11px is sentence case. The rule is binary so
uppercase never leaks into reading copy.

**The 16px-Input Rule.** Inputs, textareas, and selects are always at least
16px. Anything smaller triggers iOS Safari's zoom-on-focus — unacceptable
during a live event.

## 4. Elevation

Surfaces are flat at rest. Every card sits on the page at 1px of border and
zero shadow. When the user interacts (hover, focus) or the system reports an
event (a leaderboard row just moved up, a badge just unlocked), shadow appears
as the evidence of state change. At rest, depth is communicated through
border-and-tone, not through shadow.

### Shadow Vocabulary
- **Card shadow** (`box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05)`): the default
  for any interactive card at hover state. Near-invisible; signals "you could
  pick this up" more than "this is floating."
- **Card-hover shadow** (`box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)`):
  appears on hover for interactive cards and on the actively pulsing
  leaderboard row.
- **Elevated shadow** (`box-shadow: 0 8px 24px rgba(15, 23, 42, 0.10)`):
  reserved for truly floating elements — the login card, badge toast, XP
  floater pill.

### Named Rules
**The Flat-At-Rest Rule.** No default shadow on any card. Shadow is response,
not aesthetic.

**The Shadow-Is-Navy Rule.** All shadow RGBA uses `rgba(15, 23, 42, …)`
(the ink-1 base), never pure black. Black shadows look gray; ink-tinted
shadows look like shadow.

## 5. Components

### Buttons
- **Shape:** 6px radius (`--radius-md`), 36px min height for md, 44px for lg.
- **Primary:** CapTech Blue fill, white text, 8×16 padding, weight 600.
  Hover transitions background to Navy. The primary path through every flow.
- **Secondary:** White fill, CapTech Blue text, 1px Border. Hover transitions
  the border to CapTech Blue. Used for dismissive or co-equal actions.
- **Ghost:** transparent fill, CapTech Blue text, no border at rest. Hover
  adds a pale blue wash (`rgba(0, 93, 185, 0.08)`). Used for toolbar-style
  actions (view toggles in facilitator pages, reset progress).
- **Danger:** Score Low fill, white text. Reserved for destructive confirmation.
- **Icon slots:** every button accepts `iconLeft` / `iconRight` so lucide
  icons sit at a consistent 14–16px next to the label.

### Chips
- **Tier chip** (Beginner / Intermediate / Advanced): `surface-quiet` fill,
  blue text at weight 600, pill radius. 2×8 padding.
- **EARNED pill**: Score High text on `accent-gold-light`, 11px micro label.
  Sits in the top-right of earned-badge cards.
- **Focused-dim chip** (inside `DimensionCard`): CapTech Blue fill, white text,
  3×10 padding, pill radius. Marks "this is the dimension this challenge is
  scoring on."

### Cards
- **Corner Style:** 8px (`--radius-lg`). The single exception is the Login
  card at 12px (`--radius-xl`) — it's a floating element, not a grid card.
- **Background:** Surface (`#FFFFFF`) by default.
- **Shadow Strategy:** See Elevation. Flat at rest.
- **Border:** 1px `--border` at rest for `default`; none for `quiet`.
- **Internal Padding:** 20px default. `quiet` variant drops to 10px for dense
  grids. StatCard uses 18px to fit 5-up layouts.
- **Accent Border (use sparingly):** a 4px left border in either
  `--captech-yellow` (hint callouts, earned badges) or `--captech-blue`
  (the "you" row on the attendee leaderboard, active theme headers). This is
  the only "stripe" pattern permitted, and only at exactly 4px, never as
  decoration.

### Inputs
- **Style:** 1px Border, 6px radius, 16px font-size (non-negotiable to prevent
  iOS zoom), 10×12 padding.
- **Focus:** border-color transitions to CapTech Blue. No box-shadow glow; the
  focus-visible outline handles keyboard focus.
- **Textarea:** same rules, `resize: vertical` only, min-height 84–140px
  depending on context.
- **Error state:** Score Low border + background wash.

### Navigation
- **Header:** sticky white bar with 1px bottom border. Brand cluster on the
  left (logo + wordmark + XP pill + earned badge icons), nav items on the
  right with a 2px CapTech Blue underline marking the active route. No
  filled-pill active state; the underline is the signal.
- **Mobile (≤640px):** nav wraps to a second row; active underline persists;
  nothing collapses into a hamburger. 32px min tap target on each link, 44px
  on the primary CTA.

### StatCard (signature)
The compact metric tile used on the Progress dashboard. Structure: 11px
uppercase eyebrow label, 26px bold value, 13px sub-line. Optional `accent="gold"`
puts a CapTech Yellow left-border to mark the headline stat (XP earned).

### Leaderboard Row (signature)
Three-column row — rank (tabular, with a Trophy icon for ranks 1–3),
identity (username bold, challenges-passed secondary), XP (Zap icon +
tabular number in Navy). The "you" variant carries a 4px CapTech Blue
left border and a faint blue wash. On rank change, the entire row pulses
once with a yellow-shadow keyframe (1.1s, ease-out).

## 6. Do's and Don'ts

### Do:
- **Do** use CapTech Yellow as the scarcest color on the screen. One pill,
  one icon, one left-border — not three.
- **Do** cite dimension scores with a numeric value next to the color bar.
  Color is never the sole signal for score state.
- **Do** lead every challenge, every page, and every card with the Display
  or Headline style in `--ink`. Navy is for CTAs and chrome.
- **Do** use icon + text on locked / passed / gold nodes on the challenge
  map. Shape communicates state alongside color.
- **Do** keep motion curves as exponential ease-out. Row pulse, XP floater
  rise, confetti fade — all ease-out, no bounce.
- **Do** respect `prefers-reduced-motion` on confetti, XP floaters, and
  leaderboard pulse. Fall back to instant state change.

### Don't:
- **Don't** use side-stripe borders greater than 4px, or stripes of any color
  beyond `--captech-yellow` and `--captech-blue`. The two `accent-left-*`
  tokens are the only legal stripes.
- **Don't** use gradient text, `background-clip: text`, or any `linear-gradient`
  fill on type anywhere. Emphasis is weight and size, never gradient.
- **Don't** use glassmorphism, backdrop-filter blurs, or translucent cards as
  default chrome. The app is white cards on a gray page; that's the texture.
- **Don't** render identical-looking card grids across multiple sections on
  the same page. The Progress dashboard intentionally varies: StatCard → Badge
  card → Radar card → Dimension rows. The variation IS the hierarchy.
- **Don't** introduce dark mode, neon accents, or "AI tool" chat-bubble
  layouts. Per PRODUCT.md: "AI is the subject matter, not the visual theme."
- **Don't** ship Duolingo-style celebratory overlays. Confetti is CapTech
  palette, fires only on gold (≥90), and runs once. Cheering animations
  larger than the XP pill are prohibited.
- **Don't** introduce corporate-LMS patterns: beige-on-gray, stock photos,
  dense compliance forms. Keep the chrome thin; keep the content the hero.
- **Don't** use em dashes in UI copy. Commas, colons, semicolons, or periods.
  Not `—`, not `--`.
