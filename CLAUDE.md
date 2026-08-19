# fibo

Ephemeral planning poker: no accounts, sessions are temporary, the
session link is the only credential. React 19 + Vite SPA on Firebase
Realtime Database; pure logic in `packages/shared`; two Cloud Functions
(weekly cleanup, MCP endpoint). Styled after the Atlassian Design
System. Overview, commands, and structure: [README.md](README.md).

## Rules (must follow)

- Never assume anything — your knowledge may be out of date. Use the
  context7 MCP for current docs whenever a question involves a library,
  framework, or CLI (React, Vite, Firebase, firebase-tools, vitest,
  dnd-kit, lucide-react, …).
- Read [STANDARDS.md](STANDARDS.md) before touching any code. Its rules
  are mandatory.
- Read [DESIGN.md](DESIGN.md) before making any UI change. Verify both
  themes.
- Read [FEATURES.md](FEATURES.md) when planning or touching an existing
  feature. Update it when behavior changes.
- Consult the README for commands, overview, and directory structure.
- Keep the `functions/` mirrors in sync with `packages/shared`.
- Never remove functionality.

## Workflow

1. Follow all rules and pull in context before writing anything.
2. Ask follow-up questions; never assume you understand what is being
   asked.
3. Write tests alongside the change.
4. Always visually verify your changes as if you were a real user (both
   themes; breakpoints when layout is touched).
5. Run the full test suites before pushing.
6. Make small commits with detailed messages.
7. Unless specified otherwise, work in and push directly to `main`
   (temporary while we build the MVP).
