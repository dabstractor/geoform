# Research Findings — P1.M1.T1.S2: Route form-invoked onError to FormErrorBoundary

## Task
Rework `FormStackRenderer.handleError` so a form's injected `onError(error)` prop
NO LONGER rejects the `openForm()` deferred and NO LONGER pops the form. Instead it
routes the error to the surrounding `FormErrorBoundary`'s new `showError(error)`
method (added by S1, already present at `FormErrorBoundary.tsx:144`). This makes the
form-invoked error channel consistent with the render-error channel (both show the
inline Retry/Dismiss UI; neither mutates the stack). Closes Issue 1 (PRD §9).

## Dependency on S1 (CONTRACT — already implemented)
- S1 added `showError(error: Error): void { this.setState({ hasError: true, error }); }`
  to `FormErrorBoundary` at **`src/components/FormErrorBoundary.tsx:144-146`** (VERIFIED present).
- Class JSDoc updated (S1). `FormErrorBoundary` is already exported (no export change needed).
- S2 consumes this method via a ref. S2 does NOT touch FormErrorBoundary.tsx.

## Verified codebase facts (spot-checked Jul 12 2026)

### Target file 1: `src/components/FormStackRenderer.tsx` (102 lines)
- Line 1: `import { createElement, type ReactElement } from 'react';`
  → MUST add `useRef` here: `import { createElement, useRef, type ReactElement } from 'react';`
- Line 3: `import type { InternalStackEntry, FormProps } from '../types';`
- Line 4: `import { FormErrorBoundary } from './FormErrorBoundary';`
  → `FormErrorBoundary` is a CLASS import → usable as BOTH value and TYPE.
  → NO new import needed for `new Map<string, FormErrorBoundary>()` (class = value + type).
- Line 23: `export function FormStackRenderer({...}): ReactElement | null {`
- **Line 32: EARLY RETURN `if (stack.length === 0) { return null; }`**
  → CRITICAL: `useRef(...)` MUST be called BEFORE this return (rules of hooks —
    hooks cannot follow a conditional early return). Insert the ref between the
    function signature and line 32.
- Lines 52-55: `handleSubmit` (per-entry, inside stack.map closure) — leave as is.
- Lines 57-65: `handleCancel` (per-entry) — leave as is.
- **Lines 67-69: `handleError` (the BUGGY one to rework):**
  ```ts
  const handleError = (error: unknown) => {
    entry.deferred.reject(error);  // ← REMOVE
    onClose();                      // ← REMOVE
  };
  ```
  `entry` is in scope (defined inside `stack.map((entry, index) => {...})`).
- Lines 73-76: `formProps` = `{ onSubmit: handleSubmit, onCancel: handleCancel, onError: handleError }`.
- Lines 87-101: `<FormErrorBoundary formId={entry.id} onDismiss={...} onError={...}>` JSX.
  → ADD a callback `ref` prop here.

### The new handleError (from contract §3c):
```ts
const handleError = (error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`[FormStack] Form-invoked onError in form ${entry.id}:`, err);
  boundaryRefs.current.get(entry.id)?.showError(err);
  // NO reject, NO onClose — form stays mounted, stack unchanged,
  // openForm() stays pending (PRD §9 compliant).
};
```

### The new ref Map + callback ref (from contract §3a/§3b):
```ts
// Top of component body, BEFORE the early return:
const boundaryRefs = useRef(new Map<string, FormErrorBoundary>());
// On each <FormErrorBoundary> in the map:
ref={(instance) => {
  if (instance) boundaryRefs.current.set(entry.id, instance);
  else boundaryRefs.current.delete(entry.id);
}}
```
React 18/19: `ref` on a class component yields the instance directly (no forwardRef).
`instance` is `FormErrorBoundary | null` (null on unmount → cleanup delete).

### Target file 2: `src/types/form.ts` (Mode A docs)
- **Line 34: `/** Optional error handler for form-level errors */`**
- **Line 35: `onError?: (error: unknown) => void;`**
  → Replace the one-line JSDoc with a richer block clarifying: surfaces error to
    FormErrorBoundary (inline Retry/Dismiss UI), does NOT reject openForm(), does
    NOT mutate the stack (aligns with PRD §9).

### How FormErrorBoundary.showError behaves (S1 output, verified):
- Sets `{ hasError: true, error }` → `render()` returns the fallback branch:
  - `div[role="alert"][data-testid="error-boundary-${formId}"]`
  - title "Something went wrong"
  - `{error?.message || 'An unexpected error...'}`
  - buttons "Try Again" (handleRetry → clears hasError, increments retryCount, remounts children)
    and "Dismiss" (handleDismiss → calls this.props.onDismiss).
- DOES NOT fire componentDidCatch / the `onError` prop (no React error was caught).
- When fallback shows, the wrapped children (form) are not rendered by the boundary
  (same as a render error). On "Try Again" the form remounts (fresh state); the
  deferred is still pending throughout.

### Existing onDismiss handler on the boundary (CORRECT — do not change):
```tsx
onDismiss={() => {
  // Same behavior as cancel - resolve with undefined
  entry.deferred.resolve(undefined);
  onClose();
}}
```
→ When the user clicks Dismiss after seeing the form-invoked error, this fires:
  resolves deferred with undefined (cancel semantics) + pops the form. PRD §9 compliant.

## Existing onDismiss handler on the boundary (CORRECT — do not change):
(already noted above)

## Test patterns (VERIFIED)

### Renderer unit test: `src/components/__tests__/FormStackRenderer.test.tsx`
- Imports: vitest (describe/it/expect/vi/beforeEach/afterEach) + RTL (render/screen/fireEvent/act).
- Helpers (REUSE): `createMockDeferred()`, `createMockEntry(id, label, deferred)`.
  `createMockEntry` builds an entry whose component has Submit/Cancel buttons but NO onError
  button → for the onError test, create a custom entry whose component calls `onError`.
- `createMockEntry` signature: `(id, label?, deferred?) => InternalStackEntry<unknown>`.
- Existing "error boundary integration" describe block (console.error mocked in beforeEach)
  covers RENDER errors (component throws) → getByRole('alert'), Dismiss, Retry, isolation.
- **GAP (this task fills):** NO test covers the form-invoked `onError` prop path.
- Pattern for spying: `const rejectSpy = vi.spyOn(deferred, 'reject');` then assert NOT called.

### Integration test: `src/__tests__/integration/ErrorBoundaryIsolation.integration.test.tsx`
- Full-provider pattern: `<FormStackProvider><TestApp/></FormStackProvider>` where TestApp
  uses `useFormStack()` to open forms. Tracks `stack.length` via a `<span data-testid="stack-length">`.
- console.error mocked in beforeEach/afterEach.
- Renders forms that throw DURING RENDER. For the onError path, render a form that calls
  `onError` on a button click (NOT a render throw).

### Decision: NEW integration test file `src/__tests__/integration/FormOnError.integration.test.tsx`
- Rationale: the form-invoked onError channel is a distinct concern from render errors;
  a dedicated file is more discoverable and matches the contract's "the integration test".
  (Extending ErrorBoundaryIsolation is acceptable too, but a new file is cleaner.)

## How to track openForm() rejection + unhandledRejection (robust pattern)
- Primary guard: attach a rejection tracker to the promise:
  `p.then(() => settled='resolved', () => settled='rejected');` then assert
  `settled === undefined` (neither resolved nor rejected) after flushing microtasks.
  Attaching the handler makes the promise "handled" (deterministic, no vitest auto-fail).
- Secondary guard (honors contract "Track unhandledRejection events"): add a
  `process.on('unhandledRejection', handler)` listener, assert it is never called,
  remove in finally/afterEach. Defense-in-depth.
- Flush microtasks: `await act(async () => { await new Promise(r => setTimeout(r, 10)); });`.

## Tooling baseline (verified live)
- `npx tsc --noEmit` → exit 0 (clean).
- `npx vitest run` → **298 passed (298)** across **26** files (S1 added 4: was 294).
  After this change (+renderer test + integration test): expect ~300-302 across 26 files.

## package.json scripts
- `"test": "vitest run"`, `"type-check": "tsc --noEmit"`. Contract uses `npx tsc --noEmit` / `npx vitest run`.

## Critical gotchas
1. **Rules of hooks**: `useRef(...)` MUST be before the `if (stack.length === 0) return null;`
   early return (line 32). Placing it after = conditional hook call = React error.
2. **No new import for the type**: `FormErrorBoundary` class import (line 4) already provides
   both value and instance type. `new Map<string, FormErrorBoundary>()` works as-is.
3. **Do NOT touch FormErrorBoundary.tsx** — S1 owns it; showError already exists there.
4. **Do NOT change the boundary's onDismiss** — it correctly resolves undefined + onClose.
5. **handleError must NOT call reject/close** — only console.error + boundaryRefs.get().showError().
6. **"form stays mounted"** in the contract means "stack entry stays (not popped) + deferred
   pending" — NOT that the React component instance stays mounted. When showError shows the
   fallback, the boundary stops rendering children (same as render errors); on Retry the form
   remounts. This is PRD §9 compliant and consistent with the render-error channel.
7. **entry.id uniqueness**: the ref Map keys by entry.id; if two entries share an id they'd
   collide (that's Issue 4, separate task — not this one). Not a concern for this fix.
