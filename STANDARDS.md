# fibo — coding standards

The standards for this app are the shared ones, kept with the directory that publishes it:

**<https://github.com/jakeflavin/portfolio/blob/main/docs/STANDARDS.md>**

This file used to hold them. They were generalised and moved so the other eight apps could
follow the same rules rather than each inventing their own — the SOLID and React sections
there are this document's, largely unchanged.

## What is specific to fibo

Everything below is in addition to the shared standard, not instead of it.

- **The workspace.** Domain rules live in `packages/shared` and are the canonical copy.
  `functions/` carries marked mirrors of some of them because Cloud Functions cannot import
  the workspace package without a bundler; changing either side changes both.
- **Realtime Database.** All I/O goes through `apps/web/src/lib/api.ts`. The shared
  standard's rules for realtime databases — multi-path writes, `touchedAt`, `onDisconnect`
  removing rather than writing — were written here and still apply first to this app.
- **Layout invariants** are in [DESIGN.md](DESIGN.md) §8: the card table never scrolls,
  fixed-height strips share their height variable, inputs hold 16px at touch widths.
- **Tests.** This is the only app with an e2e suite; it runs against emulators with real
  multi-browser sessions. A new feature adds its steps and a changed label updates the
  assertion in the same commit.
- **Behaviour changes update [FEATURES.md](FEATURES.md)** in the same commit.
