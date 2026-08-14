# fibo — feature specification

Every feature, its rules, and its edge cases. With
[DESIGN.md](DESIGN.md) and [STANDARDS.md](STANDARDS.md), this should be
enough to rebuild the app. Live at https://fibo-49d58.web.app.

## Sessions

### Create

- Home page: name field (pre-filled from last use), deck picker
  (Fibonacci pre-selected), Create session.
- Creating writes a session with the creator as `owner` and navigates
  to `/s/<id>`. Ids use a lowercase alphabet without `0/o/1/l`:
  sessions 10 chars, users 16, stories 12.
- **Start from an export**: pick an exported JSON file; the session is
  created with its stories, points, and deck.

### Join

- The join gate shows a name field, Join session, Join as spectator,
  and a count of people present.
- Joining picks the lowest free identity (random when all 12 taken) and
  stores the user id in `localStorage` per session; refreshes rejoin
  silently.
- **First joiner becomes Admin** when the session has no `owner`.
  Spectator joins never inherit the seat.
- A membership record without a `name` does not count as joined.

### Share, New session, Leave

- **Share / QR**: modal with the invite URL and a QR code.
- **New session**: creates a fresh session under your name and
  navigates into it as Admin. Rooms remount per session id.
- **Leave session** (danger, confirmed): removes your user record and
  active vote, forgets your stored identity, returns home.

### Presence & expiry

- Clients set `users/<uid>/online = true`; `onDisconnect` removes the
  flag. Team rows show a presence dot.
- Writes stamp `touchedAt`; disconnects stamp session-level
  `lastSeenAt`.
- A session **expires** when everyone is offline and nothing has
  touched it for **48 hours** (last activity = max of the stamps,
  `createdAt`, user/story timestamps).
- A Cloud Function sweeps expired sessions Sundays 3:00 AM Eastern.
  Opening an expired link shows "Session expired" and deletes it on the
  spot. A dead link shows "Session not found".

## Roles & team management

| Role        | Lozenge     | Powers |
| ----------- | ----------- | ------ |
| Admin       | `Admin`     | Everything a Lead can, plus manage the team and deck |
| Lead        | `Lead`      | Run rounds: queue, activate, flip, timer, auto, override, repoint, edit/delete/reorder stories, import |
| Participant | —           | Vote, watch, export, copy results |
| Spectator   | `Spectator` | Watch and export only: no seat, no hand, not in the tally |

- Exactly one Admin. The seat moves by **Transfer admin** (confirmed;
  target becomes `owner`, previous admin becomes `leader`) or the
  first-joiner rule.
- Your row carries a `You` lozenge.
- **Row actions (Admin)** — hover a row for the `…` menu: Make/Remove
  lead (hidden for spectators), Make spectator/participant (to
  spectator also clears their standing vote), Transfer admin (hidden
  for spectators), Remove from session (danger; deletes the user and
  their active vote).
- Team rows: presence dot, avatar in a round identity-tinted container,
  identity-colored name, lozenges, vote cell (blank for spectators or
  no story; check when voted; the card after the flip; `?` otherwise).
  The vote column is 4ch wide.
- The team section has a fixed height; the roster scrolls inside it.

## Decks

- Presets: Fibonacci `0 1 2 3 5 8 13 21` (default), T-shirt
  `XS S M L XL XXL`. Custom: free-form field split on
  commas/whitespace — 2–12 cards, labels truncated to 4 chars, deduped
  case-insensitively, entered lowest-first (entry order = rank).
  `skip` and `coffee` are reserved, checked before truncation.
- Every hand also deals `?` (skip) and a coffee card.
- The deck is stored on the session (absent = Fibonacci). **Change
  deck** (gear menu, Admin) restyles every client immediately. Pointed
  stories keep their values unless repointed.
- **Winner**: most repeated card; ties break toward the higher deck
  rank. Values not in the deck rank lowest. Skip wins only when nobody
  played a value card.

## The queue

- **Add**: leads type and press Enter; the new story goes straight onto
  the table.
- **Bulk paste**: multi-line text queues one story per line (bullets
  stripped, blanks dropped, 200-char cap, one atomic write). The first
  pasted story starts the round only when the table is empty.
- **Click** (leads; active row not clickable): queued → fresh face-down
  round; done → reopens revealed with cards and consensus intact;
  switching away from a flipped round with a result accepts it, from an
  unflipped round returns it to queued with votes cleared.
- **Drag reorder** (leads): dnd-kit with a 6px activation distance so
  clicks still activate; touch works; keyboard: Space lifts, arrows
  move, Space drops; one atomic order write.
- Rows show points in a leading badge (`?` until pointed); the active
  row uses the selected treatment.

## The story on the table

- Title above the table, clamped to two lines (full text in the
  tooltip); never reflows the stage.
- **Inline edit** (leads): hover reveals a pencil right after the last
  character (overlaid on the corner when truncated). Input with ✓/✕
  below its right corner. Enter/✓ saves; Escape/✕/clicking away
  cancels.
- **Delete** (leads): trash icon, confirmed; deleting the active story
  clears the table.

## Voting & the table

- **Hand**: one card per deck value plus `?` and coffee. Click to play
  face-down; click again to take back. Locked when no story or after
  the flip. Spectators have no hand.
- **Seat cards**: every player has a card in their identity color with
  a deterministic per-user tilt/drop; hover straightens. Face-down
  shows the avatar; locked-in fills with the identity color; flipped
  shows the value with corner indices; non-voters flip as `?`.
- **The table never scrolls**: a packer picks the row count that
  maximizes card size, with a uniform fit-scale fallback.

## Running a round (leads)

Toolbar: Flip · `30s 1m 2m Auto` · point ruler · repoint.

- **Flip**: reveals all cards and writes the default winner. Allowed
  before everyone votes. Cancels a running timer.
- **Timer**: shared countdown, shown in place of the consensus; cards
  auto-flip at zero. Timer buttons disable while one runs.
- **Auto**: session-wide toggle; the round flips when every online
  player has voted (offline members don't block; spectators don't
  count; nobody online = never). Timer and Auto are one mode: each
  cancels the other.
- **Consensus**: winning value plus a tally like `13×2 · ?×4`; `?`
  merges skips, coffees, and non-voters.
- **Override**: the ruler sets the result to any deck value.
- **Repoint**: clears votes and result, cards go face-down.

## Keyboard shortcuts

Listed in-app (gear menu or `?`). Inert while typing or with a
modifier held; the sheet shows only rows for your role.

| Key | Action |
| --- | ------ |
| `1`–`9`, `0` | Play the nth card (again takes it back) |
| `S` / `C` | Skip / coffee card |
| `F` / `R` | Flip / repoint (leads) |
| `?` | Open the cheat sheet |

## Export / Import

- **Copy results** (everyone): clipboard table of `title<TAB>points`
  rows in order — blank for unpointed, `?` for skipped.
- **Committed points** (all results surfaces): a done story's result
  always counts; the active story counts once flipped with a result.
- **Export JSON** (everyone): `fibo-session-YYYY-MM-DD.json`, format v3:

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

  v1 and v2 files still import.
- **Import validation**: any finite number, `skip`, or a 1–4 char label
  survives (sessions mix deck eras). Garbage points import unpointed;
  a missing title or broken JSON rejects the file with a readable
  error.
- **Import JSON** (leads): replaces the story list, applies the file's
  deck, clears the table. Stories with points arrive `done`.
- **Start from an export** (home): same parsing, new session.

## Connect Claude (MCP)

Endpoint: `https://fibo-49d58.web.app/mcp` (stateless streamable HTTP,
POST only, no auth). Setup instructions in both gear menus → Connect
Claude. Tools accept a full link or bare id:

| Tool | Arguments | Behavior |
| ---- | --------- | -------- |
| `create_session` | `stories` (strings or `{title, points?}`), `deck?` | Writes an ownerless session; returns the join link |
| `add_stories` | `session`, `titles[]` | Appends to the queue end |
| `get_session` | `session` | Roster, deck, active story, autoFlip, queue |
| `get_results` | `session` | Committed points as JSON and a TSV table |

Rate limits per IP: 60 requests/min, 10 creates/hour → 429.

## Appearance & responsive

- Themes: dark (default) and light; switchable from any gear menu;
  persists locally. Favicon: a tilted blue card with `?`.
- Identity: 12 sets (unique hue with dark/light variants + 8×8 pixel
  avatar), used only on seat cards, avatars, and names.
- Desktop (>860px): toolbar, stage with docked hand, 320px sidebar.
- Stacked (≤860px): consensus full-width; team/queue in halves with a
  vertical hairline; the hand is a fixed bottom bar; the toolbar wraps
  to two rows.
- Phones (≤480px): one column; the hand is a 5×2 grid; inputs hold 16px
  so iOS never auto-zooms.

## Data model (Realtime Database)

Everything lives under `sessions/$sessionId`. Root access is denied;
per-session access is open, with `.validate` requiring `id` +
`createdAt`.

```ts
Session {
  id: string;
  createdAt: number;
  touchedAt?: number;
  lastSeenAt?: number;
  currentStoryId?: string | null;
  revealed: boolean;
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

Invariants: one `active` story at a time; one `owner` (healed on join
for headless sessions); votes are deck cards or `skip`/`coffee`;
multi-path updates never write a record and its own child together.
