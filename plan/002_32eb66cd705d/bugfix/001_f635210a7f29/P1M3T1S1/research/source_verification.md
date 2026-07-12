# Source Verification — Confirmed State of All Four Fixes (read against `src/`)

This PRP documents four already-merged fixes. Before writing the README sync, the
ACTUAL current source was read to document what was implemented (not just what the
architecture doc predicted). Findings below are the source of truth for the README
prose.

## Issue 1 — form-invoked `onError` routed to `FormErrorBoundary` (PRD §9)

### `src/components/FormErrorBoundary.tsx` — `showError(error)` EXISTS ✓

```ts
public showError(error: Error): void {
  this.setState({ hasError: true, error });
}
```
- Class-component JSDoc already documents it (lines ~104-122 of the file): "Sets the
  same state as `getDerivedStateFromError`, so the existing Retry/Dismiss UI appears
  and the form stays mounted (no stack mutation)." Also notes
  `componentDidCatch` / the `onError` prop do NOT fire for imperatively-set errors.

### `src/components/FormStackRenderer.tsx` — `handleError` REWORKED ✓

```ts
const handleError = (error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`[FormStack] Form-invoked onError in form ${entry.id}:`, err);
  boundaryRefs.current.get(entry.id)?.showError(err);
  // NO reject, NO onClose — stack unchanged, openForm() stays pending (PRD §9).
};
```
- `boundaryRefs = useRef(new Map<string, FormErrorBoundary>())` declared BEFORE the
  `if (stack.length === 0) return null` early return (Rules of Hooks).
- Ref callback on `<FormErrorBoundary>` registers/unregisters by `entry.id`.
- The boundary's `onDismiss` resolves `entry.deferred.resolve(undefined)` + `onClose()`
  (cancel semantics). The boundary's `onError` prop is a logging-only callback that
  fires only on componentDidCatch (render errors), NOT on showError.

**README implication:** the 'Error Boundaries' prose line
`// onError is called when the error boundary catches an error` (README ~L744) is
INVERTED — the form CALLS onError to SIGNAL an error, which is ROUTED TO the boundary.
Also must state: stack NOT mutated, `openForm()` does NOT reject (T | undefined
holds), Retry keeps it pending, Dismiss resolves undefined.

## Issue 2 — concurrent confirmation coalescing (internal; no user-facing doc change)

`src/components/FormStackProvider.tsx` — `PendingConfirmation` now:
```ts
interface PendingConfirmation {
  affectedForms: string[];
  resolvers: Set<(confirmed: boolean) => void>;  // coalesced waiters
}
```
`requestConfirmation` merges a second request into the existing pending slot
(`[...new Set([...prev.affectedForms, ...affectedForms])]` + new Set of resolvers).
Handlers resolve ALL waiters inside the functional setState updater and return null.

**README implication:** NONE for user-facing behavior — the contract explicitly says
"No user-facing behavior change (internal re-entrancy fix)". The existing README
'Confirmation Dialogs' section (~L722) and the ConfirmationDialog pluralization prose
remain accurate. This task does NOT edit for Issue 2.

## Issue 3 — `FormStackViewportValue` sanitized (no internal-type leakage, PRD §10.1)

### `src/types/context.ts` — public type NARROWED ✓

```ts
export interface FormStackViewportValue {
  stack: readonly StackEntry[];   // was InternalStackEntry<unknown>[]
  onClose: () => void;
  // onCancelRequest REMOVED from public type
}
```
- New `@internal` `FormStackViewportContextValue` carries the full internal stack +
  `onCancelRequest` (renderer-facing).
- `FormStackRendererProps.stack` is still `InternalStackEntry<unknown>[]` (internal,
  correct).

### `src/hooks/useFormStackViewport.ts` — maps internal → public ✓

```ts
return useMemo(() => {
  if (!internal) return null;
  return {
    stack: internal.stack.map(({ id, label }) => ({ id, label })),
    onClose: internal.onClose,
  };
}, [internal]);
```
- Returns null outside a provider / empty stack.

**README implication (TWO stale sections to fix, both required):**
1. `#### FormStackViewportValue` (~L603): type def still shows
   `stack: InternalStackEntry<unknown>[]` + `onCancelRequest`; prose still says
   "Structurally identical to FormStackRendererProps, so the value can be spread
   directly onto `<FormStackRenderer/>`" + an InternalStackEntry Note. ALL stale.
2. `#### useFormStackViewport` (~L464): prose still says "returns the props required
   by `<FormStackRenderer/>` — the internal stack plus the onClose/onCancelRequest
   callbacks", "assignable to FormStackRendererProps, so it can be spread directly
   onto the renderer", and the example spreads `{...viewport}` onto
   `<FormStackRenderer>`. ALL stale (would no longer typecheck). This is REQUIRED to
   satisfy the OUTPUT "no stale InternalStackEntry-leaking documentation".

## Issue 4 — dev-mode duplicate-ID warning in `openForm` (PRD §5.2)

### `src/components/FormStackProvider.tsx` — guard EXISTS in `openForm` ✓

```ts
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
  if (state.stack.some((e) => e.id === options.id)) {
    console.warn(
      `[FormStack] Duplicate form id "${options.id}" detected. ` +
      'Form IDs should be unique on the stack to avoid React key collisions ' +
      'in FormStackRenderer and Breadcrumbs (PRD §5.2: ...).'
    );
  }
}
```
- `openForm` deps are now `[state.stack]` (was `[]`).
- The form is STILL pushed (diagnostic warning, not a guard).
- Production unaffected.

**README implication:** the contract says add a note in OpenFormOptions (~L530) OR
Common Pitfalls. The OpenFormOptions section has a `> **Note:**`-friendly spot right
after its definition block. Adding a callout there is the most discoverable placement
and matches the README's existing Note-callout style.

## README stale-reference grep (the complete inventory)

| Line | Stale text | Fix task |
|------|-----------|----------|
| 467-469 | "internal stack plus the onClose/onCancelRequest callbacks" / "assignable to FormStackRendererProps, so it can be spread directly onto the renderer" | hook § rewrite (correlated w/ b) |
| 469-481 | example `return <FormStackRenderer {...viewport} />` | hook § rewrite |
| 490 | Returns row "Renderer props (assignable to FormStackRendererProps)" | hook § rewrite |
| 606 | "Structurally identical to FormStackRendererProps, so the value can be spread directly onto" | (b) type § |
| 616 | `stack: InternalStackEntry<unknown>[];` | (b) type § |
| 620 | `onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>;` | (b) type § |
| 624-627 | InternalStackEntry Note | (b) type § |
| 744 | `// onError is called when the error boundary catches an error` | (a) Error Boundaries § |

No `reject`-prose anywhere in README (grep returned nothing) — the only stale onError
claim is the inverted L744 sentence. No `showError` anywhere yet (must add for c).
No `duplicate` anywhere yet (must add for d).

## FormErrorBoundary Props-table `onError` row — DO NOT change

README L268: `| onError | (error, info) => void | - | Called when error is caught |`.
This is the boundary's OWN logging prop (fires in `componentDidCatch`, i.e. render
errors). It remains accurate. The new Methods note for `showError` explicitly states
it does NOT fire this prop, which disambiguates without editing the row.
