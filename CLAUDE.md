# fibo

Ephemeral story-point planning sessions (planning poker). React 19 + Vite
+ TypeScript monorepo on Firebase Realtime Database, styled after the
Atlassian Design System. Feature complete — changes are maintenance,
polish, and carefully considered additions.

## Read these first

- **[FEATURES.md](FEATURES.md)** — every feature and how it behaves. Keep
  it updated when behavior changes; never remove functionality.
- **[STANDARDS.md](STANDARDS.md)** — coding standards (SOLID for React,
  CSS token rules). All code must comply.
- **[DESIGN.md](DESIGN.md)** — the design system: ADS token mapping,
  typography, components, and the implementation conventions (§8). Any
  UI/UX change must follow it; both themes must be verified.

## Layout

- `packages/shared/src/` — domain types, deck, identity sets, winner
  calculation, export/import codec, id generation. Pure, no Firebase.
- `apps/web/src/` — the app. `lib/api.ts` owns every database read/write;
  components never touch Firebase directly. `styles.css` is the single
  stylesheet.
- `functions/` — the scheduled session-cleanup Cloud Function
  (standalone package, not an npm workspace; mirrors
  `packages/shared/src/expiry.ts` — keep them in sync).
- `scripts/` — one-time ops scripts (deploy service-account setup).

## Commands

```bash
npm run dev          # Vite dev server on :5173
npm run emulators    # RTDB emulator (project demo-fibo, db port 9000) — run in a second terminal
npm run typecheck    # both workspaces; must pass clean before any commit
npm run test:unit    # vitest over packages/shared
npm run build        # typecheck + production build
npm run test:e2e     # Playwright against the emulator (needs `npm run emulators` running)
```

CI (`.github/workflows/deploy.yml`) runs typecheck + unit + e2e on every
push and PR; `main` deploys only after they pass. Tests are part of any
change — see the Testing section of STANDARDS.md.

The app auto-connects to the emulator when served from `localhost` with no
`VITE_FIREBASE_*` env vars. Inspect/poke emulator state over REST:
`http://localhost:9000/sessions/<id>.json?ns=demo-fibo-default-rtdb`.

## Deployment

Pushes to `main` auto-deploy to Firebase Hosting + database rules
(project `fibo-49d58`, live at https://fibo-49d58.web.app) via
`.github/workflows/deploy.yml` and the `FIREBASE_SERVICE_ACCOUNT` secret.
There are no manual deploy steps; don't run `firebase deploy` by hand
unless CI is broken.

## Working rules

- Use the **context7** MCP to fetch current docs whenever a question
  involves a library, framework, or CLI (React, Vite, Firebase,
  firebase-tools, Playwright, lucide-react…) — even when the answer seems
  known; training data goes stale.
- Verify UI changes live in the browser preview, in **both themes**, and
  at desktop / stacked (≤860px) / phone (≤480px) widths when layout is
  touched. DESIGN.md §8 lists the layout invariants (card table never
  scrolls, fixed strip heights, 16px inputs on touch widths…).
- Realtime data can be partial — guard user records (`u && u.name`)
  anywhere the user map is rendered.
- Commit per logical change with an imperative subject and a why-body;
  typecheck must be clean first.
