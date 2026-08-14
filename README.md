# fibo

**Story points, no strings attached.** Ephemeral sprint-planning
sessions for software teams — no accounts, no signup, just a link (or a
QR code) and a name.

Live at **https://fibo-49d58.web.app** · styled after the Atlassian
Design System so Jira users feel at home · MIT licensed.

## What it does

- **Create a session** → you get a unique shareable URL and become the
  session **Admin**. Pick a deck (Fibonacci, t-shirt, or custom), or
  start straight from a previously exported file.
- **Teammates join** by opening the link and entering a name — as
  players or as spectators. Each person gets one of 12 color +
  fat-pixel avatar identities.
- **Vote** face-down, **flip** manually, on a timer, or automatically
  when everyone has voted; override or repoint; the queue supports bulk
  paste, drag reordering, and inline title editing.
- **Get the points out**: copy a title/points table for Jira, export
  JSON, or let Claude do it over the built-in **MCP endpoint**.
- Sessions expire 48 hours after everyone leaves (weekly cleanup + an
  on-open expiry gate). See [FEATURES.md](FEATURES.md) for the complete,
  detailed feature specification.

## Directory structure

```text
fibo/
├── apps/web/               # React 19 + Vite SPA
│   └── src/
│       ├── components/     # one component per file; JSDoc on every export
│       ├── pages/          # Home (create) and Room (session) routes
│       ├── lib/            # api.ts (ALL database I/O), storage.ts, useSession.ts
│       └── styles.css      # the single stylesheet (ADS tokens; see DESIGN.md)
├── packages/shared/        # pure domain logic — no React, no Firebase
│   ├── src/                # types, deck, winner, codec, expiry, clipboard, round, ids, identity
│   └── test/               # vitest suite (every export covered)
├── functions/              # Cloud Functions (standalone package, NOT an npm workspace)
│   ├── src/index.ts        # weekly session cleanup (Sundays 3am ET)
│   ├── src/mcp.ts          # remote MCP endpoint (served at /mcp)
│   └── test/               # vitest: pure helpers + JSON-RPC integration vs the emulator
├── e2e/                    # Playwright specs (multi-user flows + visual matrix)
├── scripts/                # one-time ops (deploy service-account setup)
├── firebase.json           # hosting (SPA rewrite + /mcp rewrite), database rules, emulators
└── .github/workflows/      # test-then-deploy pipeline
```

## Architecture

- **No app server.** The browser talks straight to Firebase Realtime
  Database; every client subscribes to `sessions/<id>` and renders live
  state. `apps/web/src/lib/api.ts` owns every read/write — components
  never touch Firebase directly.
- **Trust model: the link is the credential.** Database rules scope all
  access to `/sessions/$id` (root reads/writes denied); anyone holding
  the unguessable id can read and write that session, exactly like the
  people in the room. Vote secrecy is a UI convention, not cryptography.
- **Pure logic lives in `packages/shared`** (deck rules, winner
  tie-breaking, export/import codec, expiry, results table) so it's
  unit-testable in milliseconds and reusable. It cannot import React or
  Firebase — the package graph enforces the boundary.
- **Two Cloud Functions** (Blaze plan, ~$0/mo, deployed by CI):
  `cleanupSessions` sweeps expired sessions weekly, and `mcp` serves a
  stateless streamable-HTTP MCP endpoint behind the Hosting rewrite at
  `/mcp`. Functions can't import the workspace package, so they carry
  small marked mirrors of shared logic — keep them in sync.
- **Presence** uses RTDB `onDisconnect` handlers that *remove* the
  online flag (never write `false` — a dying write against a deleted
  user record would resurrect it as a ghost). Activity stamps
  (`touchedAt` on writes, session-level `lastSeenAt` on disconnect)
  feed the expiry clock.

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
`localhost` and no `VITE_FIREBASE_*` env vars are set. Inspect or poke
emulator state over REST:
`http://localhost:9000/sessions/<id>.json?ns=demo-fibo-default-rtdb`.

## Testing

```bash
npm run typecheck            # all workspaces; must be clean before any commit
npm run test:unit            # vitest over packages/shared
npm --prefix functions test  # functions helpers + MCP integration (emulator must be running)
npm run test:e2e             # Playwright vs the emulator (builds in test mode automatically)
```

The e2e suite drives multi-browser sessions through every flow —
create/join, voting secrecy, flip/override/repoint, timers and auto
flip, decks, bulk paste, reordering, spectators, admin transfer, kicks,
expiry, shortcuts, and the MCP-created-session admin seating — plus a
visual matrix (3 viewports × 2 themes).

## Deployment

Pushes to `main` run the full test suite and then deploy hosting,
database rules, and both functions via GitHub Actions
(`.github/workflows/deploy.yml`), authenticated with the
`FIREBASE_SERVICE_ACCOUNT` repo secret. Pull requests run the tests
too. There are no manual deploy steps; don't run `firebase deploy` by
hand unless CI is broken.

One-time setup for a new deployment target:

1. Create a Firebase project with a **Realtime Database**, upgrade it to
   the Blaze plan (the functions need it; usage sits inside free tiers),
   and set a small budget alert.
2. Register a web app and put its config in `apps/web/.env.production`.
3. Run `./scripts/setup-deploy-sa.sh` (creates the deploy service
   account, grants the roles hosting/database/functions deploys need,
   and stores the key as the GitHub secret; re-run with `SKIP_KEY=1` to
   update roles only).
4. Enable the Google APIs the functions need (cloudfunctions, cloudbuild,
   artifactregistry, run, cloudscheduler, eventarc, pubsub,
   firebasedatabase, cloudbilling) — first deploy errors name any that
   are missing.

## Connect Claude (MCP)

A remote MCP endpoint lives at `https://fibo-49d58.web.app/mcp` (an HTTP
Cloud Function behind a Hosting rewrite). Add it once as a connector —
Claude Desktop/claude.ai: Settings → Connectors → Add custom connector;
Claude Code:
`claude mcp add --transport http --scope user fibo https://fibo-49d58.web.app/mcp`
— and Claude can create sessions from a backlog, append stories, and
read the results back for Jira. No accounts: the session link is the
only credential, and whoever opens a Claude-created session first
becomes its admin. In-app setup instructions live under the gear menu →
"Connect Claude".

## Contributing

1. Read [CLAUDE.md](CLAUDE.md) (rules + workflow),
   [STANDARDS.md](STANDARDS.md) (mandatory coding standards),
   [DESIGN.md](DESIGN.md) (binding design system), and
   [FEATURES.md](FEATURES.md) (the behavioral spec).
2. Tests are part of every change, not a follow-up; CI blocks deploys on
   typecheck + unit + functions + e2e.
3. Small commits, imperative subjects, bodies that explain why. Work
   directly on `main` for now (MVP phase).
4. Behavior changes update FEATURES.md in the same commit; UI changes
   are verified in both themes and at the responsive breakpoints.

## Honest limitations

- **Vote secrecy is a UI convention, not cryptography.** With open
  per-session database rules and no server code, a determined teammate
  could read votes from the wire before the flip. Fine for planning
  poker; don't use it for salary votes.
- **The MCP endpoint is public.** It's rate-limited and can only do what
  the public per-session REST surface already allows — nothing without a
  session link — but anyone can create empty sessions with it; the
  weekly cleanup eats them.
- **Session deletion is best-effort weekly.** A session expires once
  everyone is offline and nothing has touched it for 48 hours; the
  Sunday sweep deletes expired sessions, and the app deletes an expired
  session on sight if anyone opens its link first. Between those,
  expired data can sit at rest for up to a week.

## License

[MIT](LICENSE) — © Jake Flavin.
