# fibo — features

fibo runs ephemeral story-point planning sessions: no accounts, no signup,
sessions are temporary. This is the complete feature list and how each one
works. The app lives at https://fibo-49d58.web.app.

## Sessions

- **Create a session** — on the home page, enter your name and press
  "Create session". You become the session's **Admin** and land in the room.
  Your name is remembered locally for next time. A **deck picker** sits
  below the name: Fibonacci (the default — quick create stays one click),
  T-shirt sizes, or a custom deck (two to twelve cards, entered lowest to
  highest; "skip" and "coffee" are reserved).
- **Start from an export** — the home page can also create a session from
  a previously exported file: stories, their points, and the deck all
  carry over.
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
- **Bulk paste** — pasting a multi-line list into the same input queues
  one story per line (markdown bullets are stripped, blanks dropped).
  When nothing is on the table, the first pasted story starts the round;
  otherwise the batch just appends.
- **Switch stories** — leads click any non-active row to put it on the
  table. Switching away from a flipped story with a standing result accepts
  that result and marks the story done; switching away mid-round returns it
  to the queue with votes cleared.
- **Reorder by drag** — leads drag rows to rearrange the queue (touch
  works too; keyboard: focus a row, Space lifts, arrows move, Space
  drops). A plain click still puts the story on the table.
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
  (majority, ties broken toward the higher deck rank). Flipping is
  allowed even before everyone votes; non-voters flip as `?`.
- **Change deck (Admin)** — gear menu → "Change deck" opens a modal with
  the same picker as the home page. The hand and the override ruler
  restyle for everyone immediately; **stories already pointed keep their
  values unless they're repointed**.
- **Timer** — `30s / 1m / 2m` starts a shared countdown; cards auto-flip
  at zero. The timer bar replaces the consensus placeholder while running.
  Flip cancels a running timer; timer buttons disable while one is active.
- **Auto** — the toggle at the end of the timer segment. While on, the
  round flips by itself the moment every online player has voted
  (offline members don't block it — they reveal as `?`). The setting is
  session-wide and persists across rounds and stories. Auto and the
  countdown are alternatives: starting a timer disarms Auto, and arming
  Auto cancels a running timer.
- **Consensus & override** — after the flip, the consensus card shows the
  winning value plus the tally (`13×2 · ?×4`). The point ruler in the
  toolbar lets leads override the result to any deck value; the selected
  value uses the solid primary fill.
- **Repoint** — the circular-arrow button clears votes and flips cards
  back down for another round on the same story.

## Export / Import

- **Copy results** — gear menu; puts the queue on the clipboard as a
  `title<TAB>points` table (unpointed stories blank), ready to paste
  into Jira or a spreadsheet. Available to everyone.
- **Export JSON** — gear menu; downloads the queue with points and the
  session's deck (`fibo-session-YYYY-MM-DD.json`, format v3; v1/v2 files
  import fine). Available to everyone.
- **Import JSON** — gear menu, leads only; replaces the story list with
  the imported document and clears the table. The session's deck is not
  changed by an in-session import (deck changes are the Admin's, via
  "Change deck"); importing on the **home page** applies the file's deck
  to the new session.

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
