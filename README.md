# fibo

**Story points, no strings attached.** Ephemeral sprint-planning sessions
for software teams — no accounts, no signup, just a link (or a QR code)
and a name.

Live at **https://fibo-49d58.web.app** · styled after the Atlassian Design
System so Jira users feel at home.

## What it does

- **Create a session** → you get a unique shareable URL and become the
  session **Admin**. Teammates join by opening the link and entering a
  name; each person gets one of 12 color + fat-pixel avatar identities.
- **Admins manage the team** (hover a row for the `…` menu: make/remove
  lead, remove from session). Leads run the rounds; everyone votes.
- **Vote** with the Fibonacci deck (0–21), the **`?` skip** card, or the
  **coffee** card. Everyone sees *who* has locked in; values stay hidden
  until the flip.
- **Flip** manually or let a **timer** (30s/1m/2m) auto-flip at zero. The
  most-repeated number wins (ties break high); leads can override the
  result on the point ruler or repoint for another round.
- **Story queue** with points at a glance: adding a story puts it straight
  on the table, clicking rows switches or reopens stories, and the active
  story's title supports inline rename and delete.
- **Export / import** the queue as JSON — export for everyone, import
  (replaces the queue) for leads.
- **Light & dark themes**, responsive from phones (no-scroll 5×2 hand
  grid) to desktops.

Sessions are temporary: state lives in Firebase Realtime Database keyed by
an unguessable session id, with no user accounts anywhere.

## Connect Claude (MCP)

A remote MCP endpoint lives at `https://fibo-49d58.web.app/mcp` (an HTTP
Cloud Function behind a Hosting rewrite). Add it once as a connector —
Claude Desktop/claude.ai: Settings → Connectors → Add custom connector;
Claude Code: `claude mcp add --transport http --scope user fibo <url>` —
and Claude can create sessions from a backlog, append stories, and read
the results back for Jira. No accounts: the session link is the only
credential, and whoever opens a Claude-created session first becomes its
admin. In-app setup instructions live under the gear menu → "Connect
Claude".

## Documentation

- [FEATURES.md](FEATURES.md) — the complete feature list and how to use
  each one.
- [DESIGN.md](DESIGN.md) — the design system: tokens, components, and the
  layout conventions every UI change must follow.
- [STANDARDS.md](STANDARDS.md) — coding standards for contributions.
- [CLAUDE.md](CLAUDE.md) — orientation for AI-assisted development.

## Stack

- TypeScript monorepo (npm workspaces)
  - `packages/shared` — domain types, deck, avatar sets, winner
    calculation, export/import codec
  - `apps/web` — React 19 + Vite app
- Firebase Realtime Database (live sync + presence via `onDisconnect`)
- Firebase Hosting (SPA rewrite config included)
- Playwright end-to-end tests against the Firebase Emulator Suite

## Local development

Prereqs: Node 22+, Java 17+ (for the database emulator),
`npm i -g firebase-tools`.

```bash
npm install

# terminal 1 — Realtime Database emulator (offline demo project)
npm run emulators

# terminal 2 — dev server on http://localhost:5173
npm run dev
```

The app auto-connects to the emulator whenever it's served from
`localhost` and no `VITE_FIREBASE_*` env vars are set.

## Tests

```bash
npm run test:unit    # vitest over packages/shared (winner, codec, deck, ids, identities)
npm run emulators    # in another terminal
npm run test:e2e     # full multi-user session flow + visual matrix (3 viewports x 2 themes)
```

The e2e suite drives three browser contexts through an entire planning
session: create → QR share → join → vote (secrecy asserted) → flip →
override → promote leader → accept → timer auto-flip → export → import →
revote → presence loss.

## Deploying

Pushes to `main` run the full test suite and then deploy automatically to
Firebase Hosting + database rules via GitHub Actions
(`.github/workflows/deploy.yml`), authenticated with the
`FIREBASE_SERVICE_ACCOUNT` repo secret. Pull requests run the tests too. One-time setup for a new
project lives in `scripts/setup-deploy-sa.sh`.

To deploy manually to your own Firebase project instead: create a project
with a **Realtime Database**, register a web app and copy its config into
`apps/web/.env.local` (see `.env.example`), then:

```bash
firebase login
firebase use <your-project-id>
npm run build
firebase deploy --only hosting,database
```

`firebase.json` deploys `apps/web/dist` with SPA rewrites and applies
`database.rules.json` (reads/writes are scoped to `/sessions/$id`; root
access is denied).

## Honest limitations

- **Vote secrecy is a UI convention, not cryptography.** With open
  per-session database rules and no server code, a determined teammate
  could read votes from the wire before the flip. Fine for planning
  poker; don't use it for salary votes.
- **The MCP endpoint is public.** It's rate-limited and can only do
  what the public per-session REST surface already allows — nothing
  without a session link — but anyone can create empty sessions with
  it; the weekly cleanup eats them.
- **Session deletion is best-effort weekly.** A session expires once
  everyone is offline and nothing has touched it for 48 hours; a
  scheduled Cloud Function sweeps expired sessions every Sunday, and the
  app deletes an expired session on sight if anyone opens its link
  first. Between those, expired data can sit at rest for up to a week.
