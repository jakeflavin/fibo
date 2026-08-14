# fibo — coding standards

Mandatory rules. Examples are generic; apply the principle, not the
literal snippet.

## SOLID

### Single responsibility

One reason to change per module. Components render; hooks fetch;
`lib/api.ts` talks to the database; `packages/shared` holds domain
rules; `styles.css` styles.

```tsx
// Bad: fetching, business rules, and two UIs in one component
function Panel() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { fetch('/rows').then(r => r.json()).then(setRows); }, []);
  const winner = rows.reduce(/* 30 lines of scoring */);
  return <>{/* table markup */}{/* summary markup */}</>;
}

// Good: a hook, a pure rule, one component per UI
function Panel() {
  const rows = useRows();
  return (<><RowTable rows={rows} /><Summary winner={computeWinner(rows)} /></>);
}
```

Don't: mix data access into components; put rendering into `lib/`;
grow a component past one screenful before splitting.

### Open/closed

Extend by adding data or a new implementation, not by editing every
consumer. Deck values, roles, and identity colors are declared once and
consumed generically.

```tsx
// Bad: every new value edits this component
{v === 'coffee' ? <Coffee /> : v === 'skip' ? '?' : v === 21 ? '21' : …}

// Good: one renderer owns the mapping
<VoteGlyph value={v} />
```

Don't: switch on a type field in many places — add the case to the one
table (deck presets, role lozenges, menu items) that owns it.

### Liskov substitution

Anything accepting an interface must work with every implementation of
it. A variant component takes the same props and honors all of them.

```tsx
// Bad: the compact variant silently ignores onSelect
function CompactRow({ story, onSelect }: RowProps) {
  return <li>{story.title}</li>; // onSelect dropped — callers can't swap variants
}

// Good: both variants honor the full contract
function CompactRow({ story, onSelect }: RowProps) {
  return <li onClick={() => onSelect(story.id)}>{story.title}</li>;
}
```

Don't: throw on inputs a sibling accepts; narrow a prop's accepted
values in an override; return a different shape than the base promises.

### Interface segregation

Take only what you use. Small prop types, small function signatures.

```tsx
// Bad: forces every caller to have the whole world
function TitleRow({ session, users, settings }: Everything) { … }

// Good: minimal surface
function TitleRow({ title, canEdit, onRename }: TitleRowProps) { … }
```

Don't: pass `session` where a story will do; export one giant "utils"
interface; add a prop "for later".

### Dependency inversion

Depend on abstractions. UI calls named `lib/api.ts` functions and
shared types — never Firebase primitives.

```tsx
// Bad: component knows the database layout
onClick={() => set(ref(db, `sessions/${id}/stories/${sid}/result`), v)}

// Good: component knows the intent
onClick={() => setResult(session.id, story.id, v)}
```

Don't: import `firebase/*` outside `lib/` and `firebase.ts`; reach into
`import.meta.env` outside one config module.

## React

Do:

- **Derive, don't mirror.** Compute from props/state at render.

  ```tsx
  // Bad
  const [count, setCount] = useState(0);
  useEffect(() => setCount(items.length), [items]);
  // Good
  const count = items.length;
  ```

- **Effects touch the outside world only** (subscriptions, timers, DOM
  measurement) and always return a cleanup.
- **Controlled inputs**: `value` + `onChange`, state owned by the
  component or form.
- **Stable keys from ids**, never array index for lists that reorder.
- **Functional updates** when new state depends on old:
  `setCount(c => c + 1)`.
- **Key remounts on identity changes**: `<Room key={sessionId} />`
  instead of hand-resetting each piece of state.
- **Custom hooks** for reused stateful logic (`useSession`, `useTheme`).
- **Guard external data** before rendering:
  `.filter(([, u]) => u && u.name)`.
- **Accessibility always**: `aria-label` on icon-only buttons,
  `role="menu"`/`menuitem`, Escape + backdrop close on dialogs, visible
  focus.

Don't:

- Define a component inside another component (remounts every render).
- Lie to dependency arrays or silence the lint rule without a comment.
- Add `useMemo`/`useCallback` without a measured reason.
- Use effects to transform data for rendering — that's a render-time
  expression.
- Poll with `setInterval` where a subscription exists (`onValue`,
  `ResizeObserver`).
- Use `any`, or `!` outside a proven-narrow boundary. Shared shapes
  live in `packages/shared/src/types.ts` only.
- Spread unknown props through components; declare what you accept.

## Realtime data (Firebase RTDB)

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

## CSS

- Tokens only: every color, shadow, radius, and font size comes from
  the `:root` custom properties (see DESIGN.md). A hex literal outside
  the token blocks is a defect.
- One stylesheet, sectioned by comment banners; mobile overrides live
  in the existing media-query blocks.
- Prefer a modifier class over specificity fights; `!important` is
  banned.
- Layout invariants (DESIGN.md §8): the card table never scrolls;
  fixed-height strips share their height variable; inputs hold 16px at
  touch widths.

## Testing

Tests ship with the change. CI runs typecheck + unit + functions + e2e
on every push and PR; deploys require all green.

Do:

- **Test behavior, not implementation**: assert what the user sees or
  the function returns, not internal state or call counts.
- Unit-test every `packages/shared` export: happy path, edges,
  rejections. Hard-to-UI-test rules belong in shared for exactly this
  reason.
- E2e-test user-visible flows with real multi-browser sessions; a new
  feature adds its steps, a changed label updates the assertion in the
  same commit.
- Select by role and accessible name:
  `getByRole('button', { name: 'Flip' })`.
- Await assertions (`await expect(...)`) — they retry until true.
- Make tests deterministic: plant fixtures over emulator REST instead
  of racing timing (disconnects, animations).

Don't:

- Sleep for state (`waitForTimeout`) — the only exception is letting a
  finished animation settle before a screenshot.
- Use case-sensitive text matchers; copy is sentence case
  (`/add a story/i`).
- Assert on CSS classes when a role or name exists.
- Share mutable state between tests or depend on test order.
- Write conditional assertions (`if (x) expect(...)`) — a test proves
  one thing, always.
- Retry a flaky test into submission: fix it or delete it the day it
  flakes.

## General

- Sentence case everywhere; labels say what the control does ("Delete
  story", not "Submit").
- Comments state a constraint the code can't show — why, not what.
- Destructive actions confirm first and use the danger treatment.
- **Commits** are one logical change: imperative subject, a body that
  explains why. Typecheck and verify both themes before committing UI
  work.
- **Docs move with behavior**: behavior changes update FEATURES.md in
  the same commit; design changes update DESIGN.md; new conventions
  land here.
