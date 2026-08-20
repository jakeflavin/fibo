# fibo

**Story points, no strings attached.** Ephemeral sprint-planning
sessions — no accounts, just a link and a name.

Live at **https://portfolio-4b9fe.web.app/fibo/** · Atlassian Design
System styling · MIT licensed.

## What it does

- Create a session, pick a deck (Fibonacci, t-shirt, or custom), share
  the link or QR code.
- Teammates join as players or spectators. Everyone gets a pixel avatar
  and identity color.
- Vote face-down; flip manually, on a timer, or automatically when
  everyone has voted. Override, repoint, reorder the queue, bulk-paste
  stories, edit titles inline.
- Get points out: copy a table for Jira, export JSON, or use the MCP
  endpoint from Claude.
- Sessions expire 48 hours after everyone leaves.
- Follows your system's light/dark preference until you pick one.

See [FEATURES.md](FEATURES.md) for the full spec.

## Directory structure

```text
fibo/
├── apps/web/               # React 19 + Vite SPA
│   └── src/
│       ├── components/
│       ├── pages/          # Home and Room routes
│       ├── lib/            # api.ts (all database I/O), storage.ts, theme.ts, urls.ts
│       ├── styles/         # shared styled-components and primitives
│       └── styles.css      # tokens and reset only — components style themselves
├── packages/shared/        # pure domain logic + vitest suite
├── functions/              # Cloud Functions: cleanup + MCP (standalone package)
├── scripts/                # one-time ops scripts
├── firebase.json
└── .github/workflows/      # test-then-deploy pipeline
```

## Architecture

- No app server. The browser talks straight to Firebase Realtime
  Database.
- Trust model: the link is the credential. Vote secrecy is a UI
  convention, not cryptography.
- Pure logic lives in `packages/shared` so it's unit-testable in
  milliseconds and reusable. It cannot import React or Firebase.
- Two Cloud Functions: `cleanupSessions` sweeps expired sessions weekly,
  and `mcp` serves a stateless streamable-HTTP MCP endpoint behind the
  Hosting rewrite at `/mcp`.
- Presence uses RTDB `onDisconnect` handlers that remove the online
  flag. Activity stamps feed the expiry clock.

## Local development

Prereqs: Node 22+, Java 17+, `npm i -g firebase-tools`.

```bash
npm install
npm run emulators   # terminal 1 — database emulator
npm run dev         # terminal 2 — http://localhost:5173
```

The app connects to the emulator automatically on `localhost`. Emulator
REST: `http://localhost:9000/sessions/<id>.json?ns=demo-fibo-default-rtdb`.

## Testing

```bash
npm run typecheck
npm test                     # shared + functions
npm run test -w apps/web     # components
```

## Deployment

Pushes to `main` run all tests, then deploy hosting, database rules, and
functions (`.github/workflows/deploy.yml`). PRs run the tests only.

New deployment target, one-time:

1. Create a Firebase project with a Realtime Database; upgrade to Blaze.
2. Put the web app config in `apps/web/.env.production`.
3. Run `./scripts/setup-deploy-sa.sh` (`SKIP_KEY=1` to update roles only).
4. Enable the Google APIs the first deploy errors name.

## Connect Claude (MCP)

Endpoint: `https://portfolio-4b9fe.web.app/fibo/mcp`. Add it once:

- Claude Desktop / claude.ai: Settings → Connectors → Add custom
  connector → paste the URL.
- Claude Code:
  `claude mcp add --transport http --scope user fibo https://portfolio-4b9fe.web.app/fibo/mcp`

Claude can then create sessions, add stories, and read results. The
first person to open a Claude-created session becomes its admin.

## Contributing

1. Read [CLAUDE.md](CLAUDE.md), [STANDARDS.md](STANDARDS.md),
   [DESIGN.md](DESIGN.md), and [FEATURES.md](FEATURES.md).
2. Tests ship with the change; CI blocks deploys on them.
3. Small commits, imperative subjects. Work directly on `main` for now.
4. Behavior changes update FEATURES.md in the same commit.

## Honest limitations

- Vote secrecy is a UI convention. Don't use fibo for salary votes.
- The MCP endpoint is public but rate-limited; it can do nothing
  without a session link.
- fibo is served from a sub-path of the portfolio, so every URL built at
  runtime goes through `lib/urls.ts`. A root-absolute path is answered by
  the directory's catch-all with an HTTP 200, which fails silently.
- Expired sessions can sit at rest for up to a week between sweeps.

## License

[MIT](LICENSE) — © Jake Flavin.

## Standards

Code in this repo follows the [shared standards](https://github.com/jakeflavin/portfolio/blob/main/docs/STANDARDS.md) and [layout](https://github.com/jakeflavin/portfolio/blob/main/docs/LAYOUT.md) used across the directory, plus the app-specific rules in [STANDARDS.md](STANDARDS.md).
