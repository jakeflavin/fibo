# fibo — coding standards

Strict standards for all code in this repo. PRs that violate them get
rewritten, not merged. Examples are generic; apply the principle, not the
literal snippet.

## SOLID, applied to React

### Single responsibility

A component renders one thing; a module owns one concern. Data access
lives in `lib/api.ts`, shared game logic in `packages/shared`, styling in
`styles.css`. A component that fetches, computes, and renders is three
components (or a component plus helpers) waiting to be split.

```tsx
// Bad: one component owns fetching, business rules, and two UIs
function Panel() {
  const [data, setData] = useState<Row[]>([]);
  useEffect(() => { fetch('/rows').then(r => r.json()).then(setData); }, []);
  const winner = data.reduce(/* 30 lines of scoring */);
  return <>{/* table markup */}{/* summary markup */}</>;
}

// Good: data in a hook, rules in a pure module, one component per UI
function Panel() {
  const rows = useRows();
  return (
    <>
      <RowTable rows={rows} />
      <Summary winner={computeWinner(rows)} />
    </>
  );
}
```

### Open/closed

Extend by adding data, not by editing every consumer. Deck values, roles,
and identity colors are declared once in `packages/shared` and consumed
generically — adding a card to `DECK` must not require touching a
component.

```tsx
// Bad: every new value edits this component
{v === 'coffee' ? <Coffee /> : v === 'skip' ? '?' : v === 21 ? '21' : …}

// Good: one renderer owns the mapping; callers stay closed
<VoteGlyph value={v} />
```

### Liskov substitution

Components taking the same props shape must be interchangeable without
callers special-casing which one they got. Don't make a variant that
secretly ignores half its props or throws on inputs its sibling accepts.

### Interface segregation

Pass components only what they use. A component that takes `session` but
reads one story should take the story.

```tsx
// Bad: forces every caller to have the whole world
function TitleRow({ session, users, settings }: Everything) { … }

// Good: minimal surface, trivial to test and reuse
function TitleRow({ title, canEdit, onRename }: TitleRowProps) { … }
```

### Dependency inversion

UI depends on abstractions (`lib/api.ts` functions, shared types), never
on Firebase primitives directly. No `ref()`/`onValue()` in components —
if a component needs a new write, add a named function to `lib/api.ts`.

## React rules

- **Derive, don't mirror.** State that can be computed from props or other
  state is computed at render, not stored and synced.

  ```tsx
  // Bad
  const [count, setCount] = useState(0);
  useEffect(() => setCount(items.length), [items]);

  // Good
  const count = items.length;
  ```

- **Effects are for the outside world only** (subscriptions, timers, DOM
  measurement) and always return a cleanup. A subscription without an
  unsubscribe is a bug even if nothing visibly breaks.
- **Key remounts on identity changes.** When a route param names "which
  thing" a stateful tree shows, remount it (`<Room key={sessionId} />`)
  instead of hand-resetting each piece of state.
- **Guard external data.** Realtime records can be partial (concurrent
  writes, kicked clients). Filter or default before rendering:
  `Object.entries(users).filter(([, u]) => u && u.name)`. Never index into
  a lookup table with an unvalidated value.
- **No `any`, no `!` except at proven-narrow boundaries.** `npm run
  typecheck` must pass clean; types for shared shapes live in
  `packages/shared/src/types.ts` only.
- **Events over polling.** Subscribe (`onValue`, `ResizeObserver`) rather
  than `setInterval` checks.
- **Accessibility is not optional:** every icon-only button has an
  `aria-label`, menus use `role="menu"`/`menuitem"`, dialogs close on
  Escape and backdrop click, focus is always visible.

## Realtime data rules (Firebase RTDB)

Every one of these was a real bug once.

- All database I/O goes through `apps/web/src/lib/api.ts`. No
  `ref()`/`onValue()` in components.
- A multi-path `update()` may never write a record and its own child in
  one call. Put the child value inside the object.
- Stamp `touchedAt` on every meaningful write.
- `onDisconnect` handlers remove; they never write values.
- Guard partial records wherever the user map renders or is counted:
  filter `u && u.name`.
- Stateful views remount when their entity changes
  (`<RoomInner key={sessionId} />`).
- `functions/` carries marked mirrors of shared logic. Changing either
  side changes both; the shared version is canonical.

## CSS rules

- **Tokens only.** Every color, shadow, and radius comes from the
  `:root` custom properties (see DESIGN.md). A hex literal outside the
  token blocks is a defect.

  ```css
  /* Bad */  .note { color: #6b6e76; border-radius: 3px; }
  /* Good */ .note { color: var(--dim); border-radius: 4px; }
  ```

- One stylesheet (`apps/web/src/styles.css`), sectioned by comment
  banners; new rules go in the matching section. Mobile overrides live in
  the existing media-query blocks, never scattered.
- Watch selector specificity: don't stack competing selectors that
  cancel each other; prefer adding a modifier class over `!important`
  (which is banned).
- **Layout invariants** (see DESIGN.md for the full list): the card table
  never scrolls — content resizes to fit; fixed-height strips share their
  height variable so borders stay flush; text inputs hold 16px at touch
  widths.

## Testing

Tests are part of the change, not a follow-up. CI runs typecheck, unit
tests, and the e2e suite on every push and PR; deploys only happen when
all three pass.

- **Unit tests (`npm run test:unit`, vitest)** cover `packages/shared`
  exhaustively: every exported function gets happy-path, edge, and
  rejection cases. Pure logic never ships untested — if a rule is hard to
  test through the UI (tie-breaking, codec validation), that's exactly
  why it lives in `packages/shared`.
- **E2e tests (`npm run test:e2e`, Playwright against the emulator)**
  cover user-visible behavior: the full multi-user session flow plus a
  visual matrix (3 viewports × 2 themes). A new feature adds its steps to
  the flow; a changed label updates the assertion in the same commit.
- **Selectors:** prefer roles and accessible names
  (`getByRole('button', { name: 'Flip' })`) over CSS classes; string
  regexes are case-insensitive (`/add a story/i`) — copy is sentence
  case and will bite you otherwise.
- **No sleeps for state.** Await an assertion (`await expect(...)`),
  never `waitForTimeout`, except to let a finished animation settle
  before a screenshot.
- A test that fails must describe a real defect. Flaky tests get fixed
  or deleted the day they flake — never retried into submission.

## General

- **Voice:** sentence case everywhere; no terminal glyphs (`~ $`, `>`,
  `[tags]`); labels say what the control does ("Delete story", not
  "Submit").
- **Comments** state a constraint the code can't show (why, not what).
  Delete narration comments.
- **Commits** are one logical change: imperative subject, a body that
  explains why. Typecheck and verify both themes before committing UI
  work.
- **Docs move with behavior**: behavior changes update FEATURES.md in
  the same commit; design changes update DESIGN.md; new conventions
  land here.
- **Destructive actions** always confirm first (modal), and their
  buttons/menu items use the danger treatment.
