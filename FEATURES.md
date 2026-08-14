# fibo — feature specification

The complete behavioral spec: every feature, its exact rules, and its
edge cases. Together with [DESIGN.md](DESIGN.md) (look and feel) and
[STANDARDS.md](STANDARDS.md) (how it's built), this document should be
sufficient to rebuild the app as it exists today. The app lives at
https://fibo-49d58.web.app.

## Sessions

### Create

- Home page: a required **name** field (pre-filled with the last name
  used on this browser), a **deck picker** (Fibonacci pre-selected —
  quick create stays one click; see Decks), and **Create session**.
- Creating writes a full session document with the creator as its only
  user (role `owner`, identity 0, online) and navigates to
  `/s/<sessionId>`. Session ids are 10 characters of an unambiguous
  lowercase alphabet (no `0/o`, no `1/l`); user ids 16; story ids 12.
- **Start from an export** — a secondary button; pick a previously
  exported JSON file and the session is created pre-loaded with its
  stories, their points, and its deck (see Export / Import).

### Join

- Opening a session link without a stored identity shows the **join
  gate**: name field, **Join session** (primary), **Join as spectator**
  (subtle), and a live count of people already there.
- Joining picks the lowest free identity index (random when all 12 are
  taken) and stores the user id in `localStorage` per session, so
  refreshes rejoin silently.
- **First joiner becomes Admin**: joining as a *player* when the session
  has no valid user with role `owner` seats you as `owner`. This makes
  headless (MCP-created) sessions runnable and heals sessions whose
  admin left. Spectator joins never inherit the seat.
- A membership record without a `name` (a partial ghost record) does not
  count as joined; the gate shows again.

### Share, New session, Leave

- **Share / QR** (gear menu): modal with the invite URL as text and as a
  QR code.
- **New session** (gear menu): creates a fresh session under your
  current name and navigates straight into it as its Admin; the old
  session is untouched. Rooms remount per session id — no state or
  presence carries over.
- **Leave session** (gear menu, danger, confirmed): removes your user
  record and your vote on the active story, forgets your stored identity
  for that room, and returns home. You can rejoin via the link.

### Presence

- Each connected client sets `users/<uid>/online = true` and registers
  an `onDisconnect` that **removes** the flag (never writes `false`:
  a queued write against a user the admin just removed would resurrect
  the record as a ghost). Team rows show a green/grey presence dot.
- Disconnects also stamp a session-level `lastSeenAt` (server-side); all
  meaningful writes stamp `touchedAt`. Both feed the expiry clock.

### Expiry (sessions are temporary)

- A session is **expired** when every user is offline AND nothing has
  touched it for **48 hours** (last activity = max of `touchedAt`,
  `lastSeenAt`, `createdAt`, user `joinedAt`s, story timestamps — the
  fallbacks age sessions created before the stamps existed).
- A scheduled Cloud Function sweeps expired sessions **Sundays 3:00 AM
  Eastern**. Opening an expired session's link shows a "Session expired"
  page and deletes it on the spot (latched, so the page doesn't flip to
  "not found" when the deletion empties the live subscription).
- A dead link shows "Session not found" with a start-over button.

## Roles & team management

| Role        | Lozenge     | Powers |
| ----------- | ----------- | ------ |
| Admin       | `Admin`     | Everything a Lead can do, plus manage the team and the deck |
| Lead        | `Lead`      | Run rounds: queue, activate, flip, timer, auto, override, repoint, edit/delete stories, reorder, import |
| Participant | —           | Vote, watch, export, copy results |
| Spectator   | `Spectator` | Watch and export only: no seat card, no hand, never counted in the tally or auto-flip |

- Exactly one Admin, always. The seat moves only by deliberate handoff —
  **Transfer admin** in a row menu (confirmed; the target becomes
  `owner`, the previous admin steps down to `leader`, atomically) — or
  by the first-joiner rule when no admin exists.
- Your own row carries a `You` lozenge.
- **Row actions (Admin only)**: hovering a team row reveals a `…`
  meatball; its menu offers **Make lead / Remove as lead** (hidden for
  spectators), **Make spectator / Make participant** (moving someone to
  spectator also clears their standing vote in the same write),
  **Transfer admin** (hidden for spectators), and the danger
  **Remove from session** (deletes the user record and their vote on the
  active story).
- Team rows show, per user: presence dot, avatar in a round
  identity-tinted container, identity-colored name, lozenges, and a vote
  cell — blank for spectators or when no story is up; a check once
  they've voted; their actual card after the flip; `?` otherwise. The
  vote column is 4ch wide (the longest legal card label) so wide values
  can never stretch the rail.
- The team section holds a fixed height; the roster scrolls inside it so
  joins and leaves never resize the sidebar.

## Decks

- **Presets**: Fibonacci `0 1 2 3 5 8 13 21` (default) and T-shirt
  `XS S M L XL XXL`. **Custom**: a free-form field parsed on
  commas/whitespace — 2–12 cards, each label truncated to 4 characters,
  case-insensitively deduped, entered lowest-first (entry order is rank
  order). `skip` and `coffee` are reserved words and are checked
  *before* truncation (so "coffee" can't sneak in as "coff").
- Every deck also deals **`?` (skip)** and a **coffee** card in the
  hand; they are never deck values.
- The deck is chosen at creation and stored on the session (absent =
  Fibonacci). **Change deck** (gear menu, Admin only) opens a modal with
  the same picker; saving restyles every client's hand and override
  ruler immediately. **Stories already pointed keep their values unless
  repointed** — a session may legitimately hold results from several
  deck eras.
- **Winner math is rank-based**: the most repeated card wins; ties break
  toward the higher deck rank (position in the card list). Values no
  longer in the deck rank lowest. Skips/coffees never win unless nobody
  played a value card (then the round's result is `skip`).

## The queue

- **Add** — leads type into "Add a story…" and press Enter; a new story
  goes **straight onto the table** as the active story.
- **Bulk paste** — pasting multi-line text into the same input queues
  one story per line: split on newlines, markdown bullets (`- * •`)
  stripped, blanks dropped, titles capped at 200 chars, one atomic
  write. The first pasted story starts the round only when the table is
  empty; otherwise the batch appends. Single-line pastes edit the field
  normally.
- **Click semantics** (leads; the active row is not clickable):
  - a **queued** story goes on the table with a fresh face-down round;
  - a **done** story reopens **revealed**, with everyone's cards and the
    consensus intact (repoint for a fresh round);
  - switching away from a story whose cards are flipped with a standing
    result **accepts it** (status `done`, `pointedAt` stamped); switching
    away mid-round returns it to the queue with votes cleared.
- **Drag reorder** (leads) — rows are sortable (dnd-kit): a 6px pointer
  travel threshold keeps plain clicks activating rows; touch works;
  keyboard: focus a row, **Space lifts, arrows move, Space drops**
  (Enter still activates). The drop persists as one atomic write of the
  new order indexes.
- Every row shows its points in a leading badge (`?` until pointed); the
  active story is marked by the selected-row treatment alone.
- The queue takes the sidebar's leftover height and scrolls internally.

## The story on the table

- The title renders above the table, clamped to two lines (full text in
  the hover tooltip); it never reflows the stage when its length
  changes.
- **Inline edit (leads)**: hover reveals a pencil icon directly after
  the last character (overlaying the clipped corner when the title
  truncates). It swaps the title for a full-width input with ✓/✕ icon
  buttons floating below its right corner. **Enter or ✓ saves; Escape,
  ✕, or clicking anywhere off the editor cancels.**
- **Delete (leads)**: the trash icon beside the pencil, confirmed in a
  modal; deleting the active story also clears the table.

## Voting & the table

- **Your hand** — one card per deck value plus `?` and coffee, docked at
  the stage's foot. Click to play face-down; click the same card again
  to take it back. The hand locks when no story is up or after the flip.
  Spectators have no hand at all.
- **Seat cards** — every player (never spectators) has a card on the
  table in their identity color, dealt with a deterministic per-user
  tilt/drop ("thrown on the table"; hover straightens). Face-down shows
  the pixel avatar; once they lock in, the card fills with their
  identity color. After the flip, cards show the value with corner
  indices; non-voters flip as `?`.
- **The table never scrolls.** A JS packer picks the row count that
  maximizes card size for the measured stage, with a uniform fit-scale
  as a last resort. Everyone sees *who* has voted; values stay hidden
  until the flip (a UI convention — see Honest limitations in the
  README).

## Running a round (leads)

The controls toolbar sits under the app bar: Flip · timer segment
(`30s 1m 2m Auto`) · the point ruler · repoint.

- **Flip** — reveals all cards and writes the default winner (rank-based
  majority, above). Allowed before everyone votes. Flipping cancels a
  running timer.
- **Timer** — starts a shared countdown; the timer bar replaces the
  consensus placeholder; cards auto-flip at zero (any leading client
  performs the write). Timer buttons disable while one runs.
- **Auto** — the last cell of the timer segment, session-wide and
  persistent: while armed, the round flips the moment **every online
  player** has voted (offline members don't block; spectators never
  count; a room with nobody online never auto-flips). Timer and Auto
  are one mode: starting a countdown disarms Auto, arming Auto cancels
  the timer.
- **Consensus** — after the flip: the winning value plus a tally like
  `13×2 · ?×4`, where `?` merges explicit skips, coffee cards, and
  non-voters (spectators excluded). The consensus strip is fixed-height
  and never reflows the layout.
- **Override** — the point ruler lets leads set the result to any deck
  value; the selected value uses the solid primary fill.
- **Repoint** — clears votes and result, flips cards face-down for
  another round on the same story.

## Keyboard shortcuts

Fixed bindings, listed in-app (gear menu → "Keyboard shortcuts", or the
`?` key). Keys never fire while typing in a field or with a modifier
held; the cheat sheet shows only rows that apply to your role.

| Key | Action |
| --- | ------ |
| `1`–`9`, `0` | Play the nth card of the deck (press again to take it back) |
| `S` | Play the skip card |
| `C` | Play the coffee card |
| `F` | Flip the cards (leads) |
| `R` | Repoint the story (leads) |
| `?` | Open the cheat sheet |

## Export / Import

- **Copy results** (gear menu, everyone): puts the queue on the
  clipboard as `title<TAB>points` rows in order — blank for unpointed,
  `?` for skipped — ready for Jira or a spreadsheet.
- **Committed points rule** (used by every results surface — copy,
  export, MCP): a done story's result always counts, and the **active
  story counts once its cards are flipped with a standing result** (the
  same result the app accepts when switching away).
- **Export JSON** (gear menu, everyone): downloads
  `fibo-session-YYYY-MM-DD.json`, format v3:

  ```json
  {
    "app": "fibo",
    "version": 3,
    "exportedAt": "2026-08-14T…",
    "deck": { "preset": "tshirt", "cards": ["XS","S","M","L","XL","XXL"] },
    "stories": [
      { "title": "JIRA-1 checkout", "points": "M" },
      { "title": "JIRA-2 unpointed" }
    ]
  }
  ```

  v1 (status+result) and v2 (points, no deck) files still import.
- **Import validation is sanity, not deck membership**: any finite
  number, `skip`, or a 1–4 character label survives — sessions mix deck
  eras. Garbage points are dropped (story imports unpointed); a missing
  title or broken JSON rejects the file with a human-readable error.
- **Import JSON** (gear menu, leads): replaces the story list, applies
  the file's deck, and clears the table — an import recreates the
  exported session. Stories with points arrive `done`; the rest queued.
- **Start from an export** (home page): same parsing, but creates a
  brand-new session with the file's stories and deck.

## Connect Claude (MCP)

A remote MCP endpoint at **`https://fibo-49d58.web.app/mcp`** (stateless
streamable HTTP; POST only). No authentication — the session link is the
credential, identical to the browser. Setup instructions live in both
gear menus → **Connect Claude**:

- Claude Desktop / claude.ai: Settings → Connectors → Add custom
  connector → paste the URL.
- Claude Code:
  `claude mcp add --transport http --scope user fibo https://fibo-49d58.web.app/mcp`

Tools (each accepts a full link or bare session id):

| Tool | Arguments | Behavior |
| ---- | --------- | -------- |
| `create_session` | `stories` (strings or `{title, points?}`), `deck?` (`{preset, cards?}`) | Writes an ownerless session; pre-pointed stories arrive done; returns the join link. First joiner becomes Admin. |
| `add_stories` | `session`, `titles[]` | Appends to the queue end; never disturbs the table. |
| `get_session` | `session` | Roster (name/role/online), deck, active story + revealed, autoFlip, full queue. |
| `get_results` | `session` | Stories with committed points, as JSON and as the tab-separated table. |

Rate limits (best-effort, per IP): 60 requests/min, 10 session
creations/hour → 429.

## Appearance

- **Themes**: dark (default) and light, full ADS ramps; the choice
  persists locally and can be switched from any gear menu. The favicon
  is a tilted brand-blue card with the `?` glyph.
- **Identity**: 12 sets, each a unique hue (dark + light variants) and
  an 8×8 fat-pixel avatar. Identity colors appear only on gameplay
  surfaces: seat cards, avatars, names.

## Responsive behavior

- **Desktop (>860px)** — toolbar strip, stage with docked hand, 320px
  sidebar (consensus / team / queue).
- **Stacked (≤860px)** — sidebar drops below the stage: consensus takes
  a full-width row; team and queue split the width in explicit halves
  with a vertical hairline; the hand becomes a fixed bottom bar, one
  row of shrinking cards; the toolbar wraps to two full rows.
- **Phones (≤480px)** — sections stack in one column; the hand deals
  into a five-across two-row grid (the whole deck on screen, no
  scrolling). Text fields hold 16px at touch widths so iOS never
  auto-zooms.

## Data model (Realtime Database)

Everything lives under `sessions/$sessionId`; root reads/writes are
denied and per-session access is open (`.validate` requires `id` +
`createdAt`, which also blocks dying writes from resurrecting deleted
sessions).

```ts
Session {
  id: string;                 // == $sessionId
  createdAt: number;          // epoch ms
  touchedAt?: number;         // stamped by every meaningful write
  lastSeenAt?: number;        // stamped server-side on disconnect
  currentStoryId?: string | null;
  revealed: boolean;          // current round face-up?
  deck?: { preset: 'fib'|'tshirt'|'custom'; cards: (number|string)[] } | null;
  autoFlip?: boolean;
  timer?: { endsAt: number; seconds: number } | null;
  users?:   Record<uid, { name; role: 'owner'|'leader'|'participant'|'spectator';
                          identity: 0-11; online?: boolean; joinedAt }>;
  stories?: Record<sid, { id; title; status: 'queued'|'active'|'done';
                          order: number; result?: number|string|null;
                          votes?: Record<uid, number|string>;
                          createdAt; pointedAt? }>;
}
```

Invariants: exactly one `active` story at a time (the table); exactly
one `owner` (except transiently in headless sessions, healed on join);
vote values are deck cards or `skip`/`coffee`; multi-path updates never
write a record and its own child in one call.
