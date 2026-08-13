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

## General

- **Voice:** sentence case everywhere; no terminal glyphs (`~ $`, `>`,
  `[tags]`); labels say what the control does ("Delete story", not
  "Submit").
- **Comments** state a constraint the code can't show (why, not what).
  Delete narration comments.
- **Commits** are one logical change with a subject line in the
  imperative and a body explaining why. Typecheck and visually verify
  both themes before committing UI work.
- **Destructive actions** always confirm first (modal), and their
  buttons/menu items use the danger treatment.
