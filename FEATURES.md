# fibo — features

fibo runs ephemeral story-point planning sessions: no accounts, no signup,
sessions are temporary. This is the complete feature list and how each one
works. The app lives at https://fibo-49d58.web.app.

## Sessions

- **Create a session** — on the home page, enter your name and press
  "Create session". You become the session's **Admin** and land in the room.
  Your name is remembered locally for next time.
- **Join a session** — anyone who opens a session link sees the join gate:
  enter a name, press "Join session". No account needed. The gate shows how
  many people are already there.
- **Share / QR** — gear menu → "Share / QR" opens a modal with the invite
  link and a QR code teammates can scan.
- **New session** — gear menu → "New session" creates a fresh room under
  your current name and jumps straight into it (you become its Admin). The
  old session is left untouched.
- **Leave session** — gear menu → "Leave session" (destructive, confirmed
  first). Removes you from the roster along with your vote and forgets your
  identity for that room. You can rejoin any time with the invite link.
- **Ephemeral by design** — a session expires once everyone is offline
  and nothing has touched it for **48 hours**. A weekly cleanup job
  (Sundays) deletes expired sessions, and opening an expired session's
  link shows "Session expired" and deletes it on the spot. A dead link
  shows a "session not found" page.

## Roles

| Role        | Lozenge | Powers |
| ----------- | ------- | ------ |
| Admin       | `Admin` | Everything a Lead can do, plus manage the team |
| Lead        | `Lead`  | Run rounds: queue, activate, flip, timer, override, repoint, edit/delete stories, import |
| Participant | —       | Vote, watch, export |

- The session creator is the Admin. There is exactly one — and only a
  deliberate handoff moves the seat: **Transfer admin** in a team row's
  `…` menu (confirmed first) makes that user the Admin and steps the
  previous one down to Lead.
- Your own row carries a `You` lozenge.
- **Team management (Admin only)** — hovering a team row reveals a `…`
  (meatball) button. Its menu offers **Make lead / Remove as lead** and the
  destructive **Remove from session** (removes the user and their vote on
  the table).

## The queue

- **Add a story** — leads type into "Add a story…" and press Enter. A new
  story goes **straight onto the table** as the active story.
- **Switch stories** — leads click any non-active row to put it on the
  table. Switching away from a flipped story with a standing result accepts
  that result and marks the story done; switching away mid-round returns it
  to the queue with votes cleared.
- **Reopen a pointed story** — clicking a done story reopens it revealed,
  with everyone's cards and the consensus intact (use repoint for a fresh
  round on it).
- **Points at a glance** — every row shows its points in the leading badge
  (`?` until pointed). The active story is marked by the blue selected row.
- **Import replaces the queue** — see Export / Import below.

## The story on the table

- **Story title** — shown above the card table, clamped to two lines (the
  full text is in the hover tooltip).
- **Edit title (leads)** — hovering the title reveals a pencil icon right
  after the last character. It swaps the title for an inline input:
  **Enter or ✓ saves; Escape, ✕, or clicking anywhere else cancels.**
- **Delete story (leads)** — the trash icon next to the pencil opens a
  confirm dialog, then deletes the story (clearing the table if it was
  active).

## Voting

- **Your hand** — the deck at the foot of the stage: `0 1 2 3 5 8 13 21`,
  plus **`?` (skip)** for "can't size this" and a **coffee cup** for
  "break, please". Click a card to play it face-down; click it again to
  take it back. Cards lock once the round is flipped.
- **Seat cards** — every participant has a card on the table in their
  identity color. Face-down shows their pixel avatar; a filled card means
  they've locked in. The table **never scrolls** — cards re-pack into rows
  and resize to fit the space.
- **Presence** — the dot before each team row shows who's connected right
  now. The vote column shows a check once someone has voted, and their
  actual card after the flip (`?` for skips and non-voters).

## Running a round (leads)

The controls toolbar sits under the app bar:

- **Flip** — reveals everyone's cards and writes the default winner
  (majority, ties broken high). Flipping is allowed even before everyone
  votes; non-voters flip as `?`.
- **Timer** — `30s / 1m / 2m` starts a shared countdown; cards auto-flip
  at zero. The timer bar replaces the consensus placeholder while running.
  Flip cancels a running timer; timer buttons disable while one is active.
- **Consensus & override** — after the flip, the consensus card shows the
  winning value plus the tally (`13×2 · ?×4`). The point ruler in the
  toolbar lets leads override the result to any deck value; the selected
  value uses the solid primary fill.
- **Repoint** — the circular-arrow button clears votes and flips cards
  back down for another round on the same story.

## Export / Import

- **Export JSON** — gear menu; downloads the queue with statuses and
  points (`fibo-session-YYYY-MM-DD.json`, format v2; v1 files import
  fine). Available to everyone.
- **Import JSON** — gear menu, leads only; replaces the story list with
  the imported document and clears the table.

## Appearance

- **Themes** — dark (default) and light, both full Atlassian Design System
  ramps. Switch via gear menu → "Switch to light/dark mode" (also on the
  home and join pages). The choice persists locally.
- **Identity colors** — each player gets one of 12 hues, used on their
  seat card, avatar, and name. Colors are tuned per theme.

## Responsive behavior

- **Desktop (>860px)** — toolbar strip, stage with docked hand, 320px
  sidebar (consensus / team / queue).
- **Stacked (≤860px)** — sidebar drops below the stage: consensus takes a
  full-width row, team and queue split the width with a hairline divider;
  the hand becomes a fixed bottom bar with cards sharing one row.
- **Phones (≤480px)** — sections stack in one column and the hand deals
  into a five-across, two-row grid: the whole deck stays on screen, no
  scrolling. Text fields hold 16px so iOS never auto-zooms.
