# fibo

**Story points, no strings attached.** Ephemeral sprint-planning sessions for software teams — no accounts, no signup, just a link (or a QR code) and a name.

```
~ $ fibo
```

## What it does

- **Create a session** → you get a unique shareable URL and become the session **owner**.
- **Teammates join** by opening the link and entering a name. Each person is randomly assigned one of **12 color + fat-pixel avatar identities**.
- **Owners promote participants to leaders.** Leaders and the owner can put stories on the table, flip cards, set countdown timers, and edit results. Everyone votes.
- **Vote** with the Fibonacci deck (0, 1, 2, 3, 5, 8, 13, 21) or play the **skip** card. Everyone can see *who* has locked in a vote, but values stay hidden until the cards are flipped.
- **Flip** manually or let the **timer** auto-flip at zero. The most-repeated number wins by default (ties break high); leaders can override it, call a revote, or accept and move to the next story.
- **Story queue** keeps the running list of everything pointed this session.
- **Export / import** the session as JSON — export is available to everyone, import (which replaces the queue) to leaders and the owner.
- **Light & dark themes**, responsive from phones to desktops, terminal-flavored UI throughout.

Sessions are meant to be temporary: state lives in Firebase Realtime Database keyed by an unguessable session id, with no user accounts anywhere.

## Stack

- TypeScript monorepo (npm workspaces)
  - `packages/shared` — domain types, deck, avatar sets, winner calculation, export/import codec
  - `apps/web` — React 19 + Vite app
- Firebase Realtime Database (live sync + presence via `onDisconnect`)
- Firebase Hosting (SPA rewrite config included)
- Playwright end-to-end tests against the Firebase Emulator Suite

## Local development

Prereqs: Node 22+, Java 17+ (for the database emulator), `npm i -g firebase-tools`.

```bash
npm install

# terminal 1 — Realtime Database emulator (offline demo project)
npm run emulators

# terminal 2 — dev server on http://localhost:5173
npm run dev
```

The app auto-connects to the emulator whenever it's served from `localhost` and no `VITE_FIREBASE_*` env vars are set.

## Tests

```bash
npm run build        # typecheck + production build (preview server serves this)
npm run emulators    # in another terminal
npm run test:e2e     # full multi-user session flow + visual matrix (3 viewports × 2 themes)
```

The e2e suite drives three browser contexts through an entire planning session: create → QR share → join → vote (secrecy asserted) → flip → override → promote leader → accept → timer auto-flip → export → import → revote → presence loss.

## Deploying to Firebase

1. Create a Firebase project and enable the **Realtime Database** (any region).
2. Register a **web app** in the project and copy its config into `apps/web/.env.local` (see `.env.example`).
3. Point the CLI at your project and ship it:

```bash
firebase login
firebase use <your-project-id>
npm run build
firebase deploy --only hosting,database
```

`firebase.json` deploys `apps/web/dist` with SPA rewrites and applies `database.rules.json` (reads/writes are scoped to `/sessions/$id`; root access is denied).

## Honest limitations

- **Vote secrecy is a UI convention, not cryptography.** With open per-session database rules and no server code, a determined teammate could read votes from the wire before the flip. Fine for planning poker; don't use it for salary votes.
- **Sessions aren't auto-deleted.** RTDB has no TTL; abandoned sessions just sit there unreferenced. Add a scheduled Cloud Function if you want hard expiry.
