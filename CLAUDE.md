# fibo

Ephemeral story-point planning (planning poker) for software teams: no
accounts, sessions are temporary, the unguessable session link is the
only credential. A React 19 + Vite SPA talks directly to Firebase
Realtime Database (no app server); a small `packages/shared` package
holds all pure domain logic; two Cloud Functions provide the weekly
session cleanup and a remote MCP endpoint so Claude can drive sessions.
Styled after the Atlassian Design System so Jira users feel at home.
Full overview, directory structure, commands, and deployment live in
[README.md](README.md).

## Rules (must follow)

- **Never assume — your knowledge may be out of date.** Use the context7
  MCP to fetch current docs whenever a question involves a library,
  framework, or CLI (React, Vite, Firebase, firebase-tools, Playwright,
  dnd-kit, lucide-react, the MCP SDK, …), even when you think you know
  the answer.
- **Read [STANDARDS.md](STANDARDS.md) before touching any code.** Its
  rules are mandatory, including the testing bar and the realtime-data
  rules (no overlapping multi-path writes, stamp `touchedAt`, guard
  partial records).
- **Read [DESIGN.md](DESIGN.md) before making any UI change.** Tokens,
  type scale, component recipes, and the layout invariants in §8 are
  binding; verify both themes.
- **Read [FEATURES.md](FEATURES.md) when planning or touching an
  existing feature** so you have its exact current behavior and edge
  cases as background. Update it in the same commit when behavior
  changes.
- **Consult the README** for commands, project overview, and directory
  structure — don't duplicate them here or guess at them.
- **Keep the function mirrors in sync.** `functions/` cannot import
  `packages/shared`, so it carries small marked mirrors (expiry, deck
  rules, results table). A change to either side changes both.
- **Never remove functionality.** fibo is feature complete; changes are
  maintenance, polish, and deliberate additions.

## Workflow

1. Follow all rules above and pull the relevant context (docs, code,
   current library docs) before writing anything.
2. **Ask follow-up questions** when the request is ambiguous — never
   assume you understand what is being asked.
3. Build with tests alongside the change (unit for pure logic, e2e for
   user-visible behavior — see STANDARDS.md).
4. **Always visually verify your changes as if you were a real user**:
   drive the app in the browser preview against the emulator, in both
   themes, and at the responsive breakpoints when layout is touched.
   Restore any state you disturb in shared test sessions.
5. Run the full test suites before pushing; CI gates the deploy on them.
6. **Make small commits with detailed messages** — one logical change
   per commit, imperative subject, a body that explains why.
7. Unless specified otherwise, **work in and push directly to `main`**
   (temporary while we build the first MVP). Pushes to `main` deploy
   automatically once tests pass.
