# Issue Analysis & Fix Strategy

## Issue 1 (Major): Form-invoked `onError` mutates stack AND rejects `openForm()`

### Current Code
**File**: `src/components/FormStackRenderer.tsx:67-69`
```ts
const handleError = (error: unknown) => {
  entry.deferred.reject(error);  // ← openForm() REJECTS
  onClose();                      // ← dispatches POP_FORM → stack MUTATED
};
```

### Root Cause
`handleError` conflates the form-invoked `onError` (a callback the form calls to signal
an application-level error) with a fatal stack teardown. It rejects the `openForm()`
deferred (violating the `T | undefined` contract) and pops the form (violating §9
"Errors do not mutate stack state automatically").

### Fix Strategy: Route form-invoked `onError` into `FormErrorBoundary`

The fix decouples `onError` from stack mutation by surfacing the error to the
existing `FormErrorBoundary` (which already has compliant Retry/Dismiss UI).

#### Step 1: Add imperative `showError(error)` to `FormErrorBoundary`
The boundary is a class component. Adding a public instance method that calls
`this.setState({ hasError: true, error })` is standard React — it triggers the
same re-render path as `getDerivedStateFromError`, showing the fallback UI.

```ts
// FormErrorBoundary — new public method
public showError(error: Error): void {
  this.setState({ hasError: true, error });
}
```

Note: `componentDidCatch` will NOT fire for imperatively-set errors (no React
error was caught). The existing `onError` prop callback (for logging) also won't
fire. Logging for the form-invoked path should be handled in `handleError`
before calling `showError`.

#### Step 2: Rework `FormStackRenderer.handleError`
The renderer needs per-entry boundary refs. Since it maps over `stack`, use a
`useRef<Map<string, FormErrorBoundary>>()` with ref callbacks:

```tsx
const boundaryRefs = useRef(new Map<string, FormErrorBoundary>());

const handleError = (error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`[FormStack] Form-invoked onError in ${entry.id}:`, err);
  boundaryRefs.current.get(entry.id)?.showError(err);
  // NO reject, NO onClose — form stays mounted, stack unchanged
};
```

Ref callback in JSX:
```tsx
ref={(instance) => {
  if (instance) boundaryRefs.current.set(entry.id, instance);
  else boundaryRefs.current.delete(entry.id);
}}
```

#### Expected Behavior After Fix
- `onError` called → boundary shows Retry/Dismiss UI (same as render errors)
- Stack depth unchanged (form stays mounted)
- `openForm()` deferred stays pending (no reject, no resolve)
- User clicks Retry → form remounts (retryCount increments), deferred still pending
- User clicks Dismiss → `onDismiss` fires → `deferred.resolve(undefined)` + `onClose()`

#### Files Modified
- `src/components/FormErrorBoundary.tsx` (add `showError` method)
- `src/components/FormStackRenderer.tsx` (rework `handleError`, add ref management)

---

## Issue 2 (Major): Concurrent cancel requests orphan the first confirmation promise

### Current Code
**File**: `src/components/FormStackProvider.tsx:82,92-96`
```ts
interface PendingConfirmation {
  affectedForms: string[];
  resolve: (confirmed: boolean) => void;  // single resolver
}

const requestConfirmation = useCallback((affectedForms) => {
  return new Promise((resolve) => {
    setPendingConfirmation({ affectedForms, resolve }); // overwrites prior slot
  });
}, []);
```

### Root Cause
A single `resolve` callback is stored. A second `requestConfirmation` call
overwrites `pendingConfirmation`, making the first `resolve` unreachable.

### Fix Strategy: Coalesce concurrent waiters

Change `PendingConfirmation` to track a **Set** of resolvers. When a second
request arrives while one is pending, merge the resolver and `affectedForms`
rather than overwriting.

```ts
interface PendingConfirmation {
  affectedForms: string[];
  resolvers: Set<(confirmed: boolean) => void>;  // multiple waiters
}

const requestConfirmation = useCallback((affectedForms: string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    setPendingConfirmation((prev) => {
      if (prev) {
        // Coalesce: merge into existing pending confirmation
        return {
          affectedForms: [...new Set([...prev.affectedForms, ...affectedForms])],
          resolvers: new Set([...prev.resolvers, resolve]),
        };
      }
      return {
        affectedForms,
        resolvers: new Set([resolve]),
      };
    });
  });
}, []);
```

Handlers become stable (no `pendingConfirmation` dependency):
```ts
const handleConfirmationConfirm = useCallback(() => {
  setPendingConfirmation((prev) => {
    prev?.resolvers.forEach((r) => r(true));
    return null;
  });
}, []);

const handleConfirmationCancel = useCallback(() => {
  setPendingConfirmation((prev) => {
    prev?.resolvers.forEach((r) => r(false));
    return null;
  });
}, []);
```

The ConfirmationDialog title logic reads `pendingConfirmation.affectedForms.length`
which now reflects merged forms — the plural "Discard Changes to N Forms?" title
works correctly when multiple forms are affected.

#### Files Modified
- `src/components/FormStackProvider.tsx` (PendingConfirmation interface, requestConfirmation, handlers)

---

## Issue 3 (Minor): `useFormStackViewport()` leaks internal `component` and `deferred`

### Current Code
**File**: `src/types/context.ts:19`
```ts
export interface FormStackViewportValue {
  stack: InternalStackEntry<unknown>[];  // LEAKS component + deferred
  onClose: () => void;
  onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>;
}
```

The hook returns this directly:
```ts
export function useFormStackViewport(): FormStackViewportValue | null {
  return useContext(FormStackViewportContext);  // raw internal value
}
```

### Root Cause
`FormStackViewportContext` and the public hook share the same type. The context
MUST carry `InternalStackEntry[]` (the renderer needs `component`, `deferred`,
`confirmOnCancel`), but the public hook should expose only `StackEntry[]`.

### Fix Strategy: Separate internal context type from public hook return type

1. **Define an internal context value type** (`FormStackViewportContextValue`) in
   `types/context.ts` — same shape as current `FormStackViewportValue` but `@internal`.

2. **Sanitize the public `FormStackViewportValue`**:
```ts
export interface FormStackViewportValue {
  /** Read-only stack entries (id + label only — no internal types) */
  stack: readonly StackEntry[];
  /** Callback to close/pop the top form */
  onClose: () => void;
}
```
`onCancelRequest` is removed from the public type — it takes `InternalStackEntry`
and consumers of the public hook only have `StackEntry`.

3. **Change context type**: `FormStackViewportContext` carries
   `FormStackViewportContextValue | null` (internal).

4. **Hook maps internal → public**:
```ts
export function useFormStackViewport(): FormStackViewportValue | null {
  const internal = useContext(FormStackViewportContext);
  if (!internal) return null;
  return {
    stack: internal.stack.map(({ id, label }) => ({ id, label })),
    onClose: internal.onClose,
  };
}
```
(Memoize with `useMemo` keyed on `internal` to avoid unnecessary re-renders.)

5. **`FormStackViewport` component**: Reads `FormStackViewportContext` (internal type),
   spreads onto `<FormStackRenderer>`. Still works — runtime value unchanged.

#### Files Modified
- `src/types/context.ts` (split `FormStackViewportValue`, add internal type)
- `src/context/FormStackContext.ts` (change context generic type)
- `src/hooks/useFormStackViewport.ts` (map internal → public)
- `src/components/FormStackViewport.tsx` (no change — already uses context directly)

#### Test Impact
The existing test `useFormStackViewport.test.tsx` line "exposes internal entry fields
(component/deferred)" currently asserts the leak exists. This test must be updated to
verify the sanitized surface instead (no `component`, no `deferred` accessible).
The "FormStackViewportValue is assignable to FormStackRendererProps" test must also
change — the public type is intentionally NOT spreadable onto the renderer anymore.

---

## Issue 4 (Minor): Duplicate form `id`s collide on React `key` with no guard

### Current Code
**File**: `src/components/FormStackRenderer.tsx:81`, `src/components/Breadcrumbs.tsx:66`
```tsx
<div key={entry.id} ...>  // FormStackRenderer
<li key={entry.id} ...>   // Breadcrumbs
```

### Root Cause
Both components key list items by `entry.id`. Duplicate IDs produce React
"duplicate key" warnings and undefined reconciliation behavior.

### Fix Strategy: Development-mode warning in `openForm`

Add a `console.warn` in `FormStackProvider.openForm` when the `id` already exists
on the current stack:

```ts
const openForm = useCallback(<T,>(options: OpenFormOptions<T>): Promise<T | undefined> => {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    if (state.stack.some(e => e.id === options.id)) {
      console.warn(
        `[FormStack] Duplicate form id "${options.id}" detected. ` +
        'Form IDs should be unique on the stack to avoid React key collisions. ' +
        'OpenFormOptions.id is documented as a unique identifier (PRD §5.2).'
      );
    }
  }
  // ... rest of openForm
}, [state.stack]);
```

Note: `openForm` currently has `[]` deps (no `state.stack` dependency). Adding the
warning requires adding `state.stack` to the dependency array. This changes the
reference stability of `openForm` (it will update when the stack changes). This is
acceptable because `openForm` is in the actions context and consumers call it
imperatively, not as a dependency in `useEffect`.

#### Files Modified
- `src/components/FormStackProvider.tsx` (add warning + dep)

---

## Cross-Issue Dependencies

- **Issue 1** and **Issue 2** both modify `FormStackProvider.tsx` and/or
  `FormStackRenderer.tsx`. Issue 1 is primarily in `FormStackRenderer.tsx`;
  Issue 2 is entirely in `FormStackProvider.tsx`. They can proceed in parallel
  if task ordering ensures no merge conflicts.
- **Issue 3** changes types that Issue 1/2 reference. Issue 3 should be
  sequenced after Issue 1/2 or carefully coordinated, since the context type
  split affects the viewport value shape.
- **Issue 4** touches `openForm` in `FormStackProvider.tsx` — overlaps with
  Issue 2's file but different function. Coordinate.

### Recommended Order
1. Issue 1 (onError) — FormErrorBoundary + FormStackRenderer
2. Issue 2 (confirmation) — FormStackProvider
3. Issue 3 (type leak) — types + context + hook
4. Issue 4 (duplicate ID) — FormStackProvider

This ordering minimizes merge conflicts: Issue 1 touches the renderer, Issue 2
touches the provider's confirmation system, Issue 3 touches types/context/hook,
and Issue 4 adds a small warning to `openForm`.
