# fibo — design spec

fibo's UI follows the **Atlassian Design System (ADS)** so Jira users feel at
home. This file is the source of truth for every visual decision. Token
values were pulled from `@atlaskit/tokens` (current "visual refresh"
palette, brand `#1868DB`).

What this spec covers: color, typography, shape, space, elevation, component
recipes, and voice. What it deliberately keeps from fibo: the pixel-art
avatars, the 12 per-player identity colors on played cards, and the game
layout (toolbar → stage → rail). No functionality changes.

---

## 1. Color

App tokens map to ADS tokens as follows. Light mode is the reference
experience (Jira is light-first); dark mode uses the ADS dark ramp.

| fibo token      | ADS token                          | Light                | Dark                 |
| --------------- | ---------------------------------- | -------------------- | -------------------- |
| `--bg`          | `elevation.surface.sunken`         | `#F8F8F8`            | `#18191A`            |
| `--surface`     | `elevation.surface.raised`         | `#FFFFFF`            | `#242528`            |
| `--surface-hi`  | `color.background.neutral`         | `rgba(5,21,36,0.06)` | `rgba(206,206,217,0.07)` |
| `--line`        | `color.border`                     | `rgba(11,18,14,0.14)`| `rgba(227,228,242,0.12)` |
| `--line-strong` | `color.border.bold`                | `#7D818A`            | `#7E8188`            |
| `--control`     | `color.border.input`               | `#8C8F97`            | `#7E8188`            |
| `--text`        | `color.text`                       | `#292A2E`            | `#CECFD2`            |
| `--dim`         | `color.text.subtlest`              | `#6B6E76`            | `#96999E`            |
| `--accent`      | `color.background.brand.bold`      | `#1868DB`            | `#669DF1`            |
| `--accent-ink`  | `color.text.inverse`               | `#FFFFFF`            | `#1F1F21`            |
| `--accent-dim`  | `color.background.selected`        | `#E9F2FE`            | `#1C2B42`            |
| `--accent-hover`| `color.background.brand.bold.hovered` | `#1558BC`         | `#8FB8F6`            |
| `--success`     | `color.text.success`               | `#4C6B1F`            | `#B3DF72`            |
| `--danger`      | `color.text.danger` (text) / `color.background.danger.bold` (fills) | `#AE2E24` / `#C9372C` | `#FD9891` / `#F87168` |
| `--warn`        | `color.text.warning`               | `#9E4C00`            | `#FBC828`            |
| `--backdrop`    | ADS blanket                        | `rgba(9,30,66,0.54)` | `rgba(3,4,4,0.6)`    |

Rules:

- **Blue is the only interactive accent.** Primary buttons, selected states,
  focus rings, links. No slate/graphite accents.
- **Identity colors are gameplay, not chrome.** The 12 player hues appear
  only on played/revealed seat cards, avatars, and player names — exactly as
  today.
- Semantic colors (danger/success/warning) appear only in their semantic
  roles (destructive confirm, error toasts, timer-critical).

## 2. Typography

- **Family**: system sans, matching ADS fallbacks (we cannot ship Atlassian
  Sans):
  `ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, "Helvetica Neue", Helvetica, Arial, sans-serif`
- **Body**: 14px / 20px, weight 400 (`font.body`).
- **Small body / secondary**: 12px / 16px (`font.body.small`).
- **Headings**: weight 600 (ADS uses 653 in Atlassian Sans; 600 is the
  fallback equivalent). Scale: 24/28 (`heading.large`, story title),
  20/24 (`heading.medium`), 16/20 (`heading.small`).
- **Metrics** (consensus value, card points): weight 600, tabular-nums.
- **Section headers** (card eyebrows): 12px, weight 600, `--dim`,
  sentence case — **no uppercase, no letter-spacing** (Jira uses quiet
  sentence-case section headers).
- Monospace is retired everywhere, including numbers (use
  `font-variant-numeric: tabular-nums` where alignment matters).

### The enforced UI scale

Outside of headings, display type (logo, consensus value), and card
metrics, exactly three sizes exist, declared as tokens in `:root` and
used everywhere via `var()` — never as literals:

| Token            | Size | Use |
| ---------------- | ---- | --- |
| `--font-body`    | 14px | Anything the user reads or clicks: buttons, segment cells, ruler chips, menu items, list-row titles, names, vote columns, the timer clock |
| `--font-small`   | 12px | Secondary/labelling type: eyebrows, field labels, hints, badges, tallies, the footer |
| `--font-lozenge` | 11px | Lozenge tags (`You`, `Admin`, `Lead`) and the version chip only |

13px does not exist. Interactive controls and list rows are at least
32px tall (joined-group cells are 30px inside their 1px group border,
32px outer). Text inputs stay 16px at touch widths (§8).

## 3. Shape & space

- **Radius scale** (ADS refresh): controls (buttons, inputs, chips) `4px`
  (`radius.small`); cards/panels `8px` (`radius.large`); modals `12px`
  (`radius.xlarge`); lozenges `2px` (`radius.xsmall`); avatars round
  (`radius.full`).
- **Spacing**: ADS 8px grid with 4px halves — use 4 / 8 / 12 / 16 / 24 / 32
  (`space.050`–`space.400`). Card padding: 16px (rail), 24px (stage).
  Gutters between cards: 16px (ADS pages breathe more than the current
  12px).

## 4. Layout & elevation

**Jira chrome is full-bleed and table-like — no floating cards, no
gutters.** The app fills the window on the `--surface` background, and
structure comes from 1px `--line` dividers between sections:

- **App bar**: full-width, ~48px, brand left / actions right, bottom
  border. No fixed-width page container.
- **Toolbar** (leads): full-width strip under the app bar with a bottom
  border, like a Jira board header.
- **Sidebar** (consensus / team / queue): fixed 320px column with a left
  border; sections stack with hairline dividers between them, each with
  16–20px internal padding.
- **Stage**: flat region filling the remainder; the hand is a footer tray
  split off by a top hairline.
- **Footer**: slim full-width strip with a top border.
- On mobile the sidebar stacks below the stage (left border becomes a top
  border); the hand becomes the fixed bottom bar.

Shadows are reserved for things that genuinely float:

| Level    | Use                          | Light shadow                                            | Dark shadow |
| -------- | ---------------------------- | ------------------------------------------------------- | ----------- |
| raised   | seat + hand cards            | `0 1px 1px rgba(30,31,33,0.25), 0 0 1px rgba(30,31,33,0.31)` | `0 1px 1px rgba(1,4,4,0.5), 0 0 1px rgba(1,4,4,0.5)` |
| overlay  | menu, modal, toasts          | `0 8px 12px rgba(30,31,33,0.15), 0 0 1px rgba(30,31,33,0.31)` | `0 0 0 1px rgba(189,189,189,0.12), 0 8px 12px rgba(1,4,4,0.36), 0 0 1px rgba(1,4,4,0.5)` |

`elevation.surface.sunken` remains for set-apart canvases (the home and
join pages, where the form card floats).

## 5. Components

- **Buttons** (ADS): borderless, height 32px, radius 4px, 14px weight 500,
  padding 0 12px.
  - *Primary*: `--accent` bg, `--accent-ink` text; hover `--accent-hover`.
  - *Default*: `--surface-hi` (neutral) bg, `--text`; hover darkens.
  - *Subtle*: transparent bg; hover `--surface-hi` (menu button, icon
    buttons).
  - *Disabled*: neutral bg at reduced opacity, no fill drop needed since
    fills are quiet.
- **Segmented groups** (timer presets, point ruler): joined cells inside a
  single `--line` border, radius 4px, active cell = `--accent-dim` bg +
  `--accent` text (Jira "selected" pattern) instead of solid fill.
- **Text fields**: `--surface` bg, 1px `--control` border, radius 4px,
  focus = 2px `--accent` border (border-color swap + 1px inset ring), no
  glow. No prompt glyphs (`>`, `+`) — use placeholder + label.
- **Lozenges** (`you`, `admin`, `lead` tags): 11px weight 600 sentence case,
  2px radius, 2px 6px padding, neutral bg (`--surface-hi`) + `--dim` text.
  No square brackets.
- **Avatars**: pixel avatars retained, seated in round neutral-background
  containers (24px in lists), like Jira avatars.
- **Dropdown menu**: overlay surface + overlay shadow, radius 8px, item
  hover `--surface-hi`, 14px text, icons at 16px.
- **Modals**: overlay surface, radius 12px, overlay shadow, title 20/24
  weight 600 left-aligned, actions right-aligned (primary on the right).
- **Toasts**: overlay surface + shadow, radius 8px, no glyph prefixes.
- **List rows** (team, queue): 32px min height, 4px radius hover
  (`--surface-hi`), selected/active = `--accent-dim` bg with `--accent`
  text accents — the Jira selected-row pattern.
- **Story title**: left-aligned like a Jira issue summary — 20–24px,
  weight 600, no display-face theatrics.
- **The table**: the seats sit on a sunken region (`--bg`, 8px radius) —
  the Jira board-column idiom — so raised cards have something to be
  raised *from*.
- **Seat cards**: a tight grid (12px gaps) with a "thrown on the
  table" landing — each card carries a small deterministic tilt and
  drop derived from its user id (±5°, 0–5px), identical on every
  client and stable across renders; hovering straightens the card.
  The scatter never perturbs the grid itself (no irregular gaps — the
  packing math owns spacing). Cards are crafted like a real deck: an inner frame
  line on every back, corner indices on revealed fronts (top-left +
  rotated bottom-right), and the avatar seated in an identity-tinted
  circle that echoes the team list. Face-down = card-face fill, hairline
  border, raised shadow; locked-in/revealed = identity fill. Packing and
  sizing logic unchanged.
- **Hand cards**: sit on their own sunken felt strip mirroring the
  table region. Surface tiles with hairline borders and the same
  inner-frame deck detail as the seat cards; the selected card uses the
  Jira selection pattern — `--accent-dim` fill, 2px `--accent` border,
  accent text (frame tinted to match) — never a solid dark fill. Hover
  is a subtle 2px lift, not a launch.

- **Segmented pickers** (deck picker, timer segment): joined `--line`
  group; the active cell uses the solid primary fill (`--accent` bg,
  `--accent-ink` text) — the same treatment as the selected point on
  the ruler and the Flip button.
- **Key chips** (shortcut cheat sheet): `--font-small` 600 on
  `--surface-hi`, 1px `--line` border, 4px radius, 40px min width,
  centered.
- **Copyable rows** (Connect Claude): label + `--surface-hi` code pill
  (scrolls internally, never overflows the modal) + a 32px icon copy
  button; each copy confirms with a toast.
- **Timer bar**: replaces the consensus placeholder while running —
  clock (tabular) + accent track/fill; the final 5 seconds go
  `--danger` with a blink.
- **Toasts**: bottom-centered stack, overlay surface + shadow, info and
  error kinds; error text in `--danger`.

## 5b. Motion

Motion is quiet and purposeful; `prefers-reduced-motion` users get the
reduced experience by relying only on these short transitions:

- `rise` (fade + 6px up, 0.2–0.25s ease-out): list rows, cards, menus
  entering.
- `pop` (scale 0.5→1, 0.35s springy cubic-bezier): the consensus value.
- Card flip: 3D `rotateY` on the seat card inner, 0.55s with a slight
  overshoot curve; `lockin` bumps the seat 4px up for 0.25s when a vote
  lands.
- Seat scatter: each card carries a deterministic tilt (±5°) and drop
  (0–5px) from its user id; hover straightens over 0.25s.
- Drag-reorder: the row in flight lifts on `--shadow-float` above its
  neighbors; drops settle with the sortable transition.
- Hover-reveal actions fade in over 0.12s. Menus and modals appear with
  `rise`; nothing bounces, slides across the screen, or loops.

## 6. Voice & content

- **Sentence case everywhere**: buttons ("Create session", "Flip"), labels
  ("Your name"), section headers ("Controls", "Team", "Queue", "Consensus").
- **No terminal affordances**: drop `~ $` prompts, `>` / `+` input glyphs,
  and bracketed tags. The wordmark is simply **fibo**.
- Tooltips and errors stay plain and directive, as they are.

## 7. What stays fibo

- Pixel-art avatars and the 12 identity hues (played cards, names).
- The room layout: controls toolbar above the stage, rail of consensus /
  team / queue, hand docked at the stage's foot.
- All interactions and features exactly as on `main`.

## 8. Implementation conventions

Decisions settled while building the spec out. New UI must follow these;
they are load-bearing, not suggestions.

### The 20px gutter

Everything in the main column sits on one left edge, 20px from the
window: the app-bar brand, the "Controls" label, the Flip button, the
story title, the felt regions, and the hand strip. Any new element in the
main column aligns to it. The sidebar has its own 20px internal padding.

### Strips and flush borders

- The toolbar and the consensus section share one height,
  `--strip-h: 96px`, and each draws its own `border-bottom` **inside**
  that height, so the two lines meet flush at the sidebar edge. Never mix
  an inside `border-bottom` on one side with a `border-top` on the
  section below the other — that's a 1px step.
- Sidebar sections divide with `border-top` on the following section
  (`.rail-section + .rail-section`), except after the consensus strip,
  which carries its own bottom border.

### Stability over reflow

- The **team section holds a fixed 300px**; the roster scrolls inside it.
  The queue takes the leftover height. Joins, leaves, votes, and timer
  state must never resize or shift the sections.
- The **card table never scrolls.** Seats re-pack into rows and resize to
  fit the measured stage (JS packer + uniform fit-scale as last resort).
- The consensus card reserves its layout whether or not a result exists
  (`?` placeholder; the timer bar swaps in, nothing moves).

### Hover-reveal actions (the Jira pattern)

Row and title actions are invisible until intent: `opacity: 0`, shown on
hover of the row/line and on `:focus-within` (keyboard users always get
them). Pair `pointer-events: none` with the hidden state. Examples: the
team-row meatball menu, the story-title pencil/trash. Title actions sit
inline **after the last character**; when the title truncates they
overlay the clipped corner on the title's own background.

### Inline editing

The story-title editor is the template: the text swaps for a full-width
field; ✓ (submit) and ✕ (cancel) icon buttons float below the field's
bottom-right corner on raised tiles; Enter saves, Escape cancels, and
**clicking anywhere off the editor cancels** (blur with a
`relatedTarget` containment check).

### Menus and modals

- Dropdowns anchor their top-left corner to the trigger, flip only when
  they'd leave the viewport, are content-width, and close on outside
  click, Escape, and scroll. Menus inside scrolling or transformed
  containers portal to `document.body` with fixed positioning.
- Modals always portal to `document.body` so the blanket covers the whole
  app. Destructive confirms put the danger-colored action on the right.

### Responsive breakpoints

- `>860px` — desktop grid (stage + 320px sidebar).
- `≤860px` — stacked: consensus full-width, team/queue in explicit
  halves (`1fr 1fr`, never `auto-fit` — a spanning row keeps empty
  tracks alive) with a vertical hairline between; hand becomes a fixed
  bottom bar, one row of shrinking cards; toolbar wraps to two full
  rows (Flip stretches beside the timers; the ruler shares its row with
  repoint).
- `≤480px` — sidebar single column; the hand deals into a 5×2 grid so
  the whole deck stays on screen.
- Text inputs hold **16px at ≤860px** — anything smaller makes iOS
  Safari zoom into the field.

### Data guards

Realtime records can be partial (e.g. a kicked client's presence write).
Anything that renders the user map filters `u && u.name` first, and
stateful views remount when the entity they show changes
(`<RoomInner key={sessionId} />`).
