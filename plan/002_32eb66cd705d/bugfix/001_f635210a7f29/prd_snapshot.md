# Bug Fix Requirements

## Overview

Creative end-to-end / adversarial QA pass of the `geoform` implementation against
**PRD v1** (with the 0.2.0 "hostable viewport" delta), performed after the
`P1.M1.T1.S2` fix that added `popToIndex` to the `useFormStack()` combined hook.

**Baseline at audit time:** `npx tsc --noEmit` → exit 0 (clean).
`npx vitest run` → **294 / 294** tests pass across **26** files (0 failures).

**Targeted fix verdict — PASS.** The `popToIndex` addition to `useFormStack()`
was verified directly and is correct and complete:
- `useFormStack().popToIndex` is exposed and is the **same stable reference** as
  `useFormStackActions().popToIndex` (`src/hooks/useFormStack.ts`).
- `popToIndex(0)` cancels the deeper form on a 2-deep stack; `popToIndex(-1)`
  clears the whole stack.
- `UseFormStackReturn` lists `{ stack, openForm, closeForm, popToIndex, cancelForm }`.
- The published `dist/` was rebuilt and contains the new surface
  (`dist/index.d.ts` `UseFormStackReturn.popToIndex`), so consumers of the built
  package get the fix.

The headline 0.2.0 feature — the **single-shared-modal host pattern
(`autoRender={false}` + `<FormStackViewport/>`)** — was exercised end-to-end and
works as specified: an open form renders exactly once, submit returns the opaque
value, host-level `cancelForm()` resolves `undefined`, and deep nesting preserves
parent state. Core UX rules (open / submit / cancel / nest / state-preservation /
breadcrumbs) all behave correctly.

The issues below are **pre-existing defects in adjacent areas** that the standard
validation suite does not cover (the relevant code paths have **no covering
tests**). They are **not regressions** introduced by the `popToIndex` fix. Two
are Major (real, deterministic, affect documented public APIs) and two are Minor
(encapsulation / polish).

---

## Critical Issues (Must Fix)

None. Core functionality (open / submit / cancel / nest / state preservation /
breadcrumbs / hostable viewport) works.

---

## Major Issues (Should Fix)

### Issue 1: Form-invoked `onError` mutates the stack AND rejects `openForm()` — violates PRD §9

**Severity**: Major
**PRD Reference**: §9 Error Handling — "`onError(error)` may be called by the
form"; "Errors do not mutate stack state automatically"; "Provider may display:
Inline error UI, Retry action, Dismiss action". Also §5.2 / §6 (the `openForm()`
promise contract resolves to `T | undefined`; rejection is never specified) and
§6 `FormProps.onError`.

**Expected Behavior**: When a form calls its injected `onError(error)` prop, the
provider should **not** mutate the stack automatically. Per PRD §9 it may instead
display inline error UI with Retry / Dismiss (mirroring the render-error path
handled by `FormErrorBoundary`). `openForm()` must continue to honour its
documented `T | undefined` contract (it must not reject).

**Actual Behavior**: `FormStackRenderer` wires the form's `onError` to
`handleError`, which **rejects the deferred and immediately pops the form**
(`src/components/FormStackRenderer.tsx:67-69`):

```ts
const handleError = (error: unknown) => {
  entry.deferred.reject(error);  // ← openForm() REJECTS (not value|undefined)
  onClose();                      // ← dispatches POP_FORM → stack MUTATED
};
```

Observed (adversarial test):
- Stack depth goes `1 → 0` (form is unmounted) — the stack **is** mutated.
- `await openForm(...)` **rejects** with the error instead of resolving.
- No inline error UI / Retry / Dismiss is shown for this path.
- When the caller does not `try/catch` the `openForm()` promise (the PRD §12
  example only `await`s and reads the value), the rejection surfaces as an
  **unhandled promise rejection** (verified: `unhandledRejection` fires once).

This also makes the two error channels inconsistent: a **render** error is
caught by `FormErrorBoundary` (shows Retry/Dismiss, does **not** auto-pop, keeps
the form mounted — compliant with §9), but a form-invoked `onError` is far
harsher (reject + pop — non-compliant with §9).

**Steps to Reproduce**:
1. Render a form whose component calls its `onError` prop, e.g.
   `<button onClick={() => onError(new Error('boom'))} />`.
2. Open it via `openForm({ id, component })` (no `try/catch` around the await,
   matching PRD §12).
3. Click the button to fire `onError`.

Actual: the form vanishes, the stack shrinks, and an unhandled promise rejection
for `Error: boom` is emitted. Expected (PRD §9): the form stays mounted, the
stack is unchanged, and the provider offers inline error UI / Retry / Dismiss.

**Suggested Fix**: Decouple the form-invoked `onError` from stack mutation. On
`onError(error)`, surface the error to the surrounding `FormErrorBoundary` (e.g.
throw inside the boundary, or route the error into boundary state) so the
existing Retry/Dismiss UI handles it, and do **not** reject the `openForm()`
deferred or call `onClose()`. If a fatal/close semantic is genuinely desired for
`onError`, resolve the deferred with `undefined` (cancel semantics) rather than
rejecting, and document it — but the PRD §9 wording ("do not mutate stack state
automatically", "Provider may display…") favours the inline-UI path. Add a
covering integration test that calls the injected `onError` and asserts (a) the
stack is unchanged, (b) `openForm()` does not reject.

---

### Issue 2: Concurrent cancel requests orphan the first confirmation promise (`cancelForm`/`popToIndex` never settle)

**Severity**: Major
**PRD Reference**: §5.2 `cancelForm` / `popToIndex`; §8 Cancellation & Dirty
State; §10.1 (host wires Escape/backdrop/close to `cancelForm()`).

**Expected Behavior**: Each call to `cancelForm()` / `popToIndex()` should
either complete or be cleanly short-circuited; its returned promise should
always settle. A second cancellation request arriving while a confirmation
dialog is already open must not strand the first request.

**Actual Behavior**: Confirmation uses a **single state slot**
(`src/components/FormStackProvider.tsx:82` `useState<PendingConfirmation |
null>`). `requestConfirmation` overwrites it on every call
(`:92-96`):

```ts
const requestConfirmation = useCallback((affectedForms) => {
  return new Promise((resolve) => {
    setPendingConfirmation({ affectedForms, resolve }); // overwrites any prior slot
  });
}, []);
```

Both `cancelForm()` (via `handleCancelRequest`, `:213-217`) and `popToIndex()`
(`:188-191`) call `requestConfirmation`. When a second request arrives before
the user responds to the first dialog, the second `setPendingConfirmation`
**replaces** the first `{ resolve }`. The first request's `resolve` callback is
now unreachable, so its promise **never settles**.

Observed (deterministic adversarial test): open a `confirmOnCancel: true` form,
fire `cancelForm()` twice in succession, then click "Keep Editing" once. Tracked
promise outcomes:

```
#promises tracked: 2
settled states: [ false, true ]   ← first cancelForm() NEVER settles
openForm resolved count: 0         ← (correct: user chose Keep Editing)
```

**Impact / blast radius**: User-visible stack state usually ends up correct
(because some completion path runs), but the orphaned promise is a real defect:
- Any host code that `await`s `cancelForm()` (e.g. an effect that runs after the
  cancel) **hangs forever**.
- The abandoned async closure retains references to `state.stack` (latent
  memory leak).
- Realistic triggers: (a) the §10.1 host pattern wires Escape/backdrop/close to
  `cancelForm()` — a double keypress or backdrop+Escape can fire two requests;
  (b) clicking a breadcrumb (`popToIndex`) while a confirm dialog is already
  open from a form's own Cancel button.

**Steps to Reproduce**:
1. Open a form with `confirmOnCancel: true`.
2. Call `cancelForm()` (dialog appears), then call `cancelForm()` again before
   responding (dialog is overwritten).
3. Click "Keep Editing".
4. Observe: the **first** `cancelForm()` promise never resolves or rejects.

**Suggested Fix**: Make confirmation re-entrancy-safe. Options: (a) coalesce
concurrent requests onto the existing pending confirmation (resolve all waiters
with the same answer); (b) reject/short-circuit a second request while one is
pending; or (c) queue requests. At minimum, when overwriting
`pendingConfirmation`, resolve the previous waiter (e.g. `false`) instead of
dropping its `resolve`. Add a test that fires two cancel requests in flight and
asserts both promises settle.

---

## Minor Issues (Nice to Fix)

### Issue 3: `useFormStackViewport()` / `FormStackViewportValue` leak internal `component` and `deferred` — contradicts PRD §10.1 "no internal-type leakage"

**Severity**: Minor
**PRD Reference**: §10.1 — "Two exports make the chrome-less renderer placeable
through the public API (**no internal-type leakage**)"; §5.2 (public `stack` is
`Array<{ id, label?}>`).

**Expected Behavior**: The low-level public hook should not hand consumers the
raw `InternalStackEntry` internals (`component`, `deferred.resolve`/`reject`).

**Actual Behavior**: `FormStackViewportValue.stack` is typed
`InternalStackEntry<unknown>[]` (`src/types/context.ts:19`; mirrored by
`FormStackRendererProps` `:124`). `InternalStackEntry` carries `component`
(the React component) and `deferred` (`{ promise, resolve, reject }`). A consumer
using the documented low-level hook can therefore hijack a form's resolution,
e.g.:

```ts
const vp = useFormStackViewport();
vp?.stack[0].deferred.resolve(hijackedValue); // resolves openForm() with attacker-chosen data
```

Observed (adversarial test): the returned entry exposes keys
`['id','label','component','confirmOnCancel','deferred']`, with `deferred`
containing `{ promise, resolve, reject }`.

Note: the **component** form `<FormStackViewport/>` is zero-prop and leaks
nothing; only the low-level hook / `FormStackViewportValue` type is affected.

**Suggested Fix**: Narrow the public surface — expose a read-only view
(`{ id, label }[]`) from the hook and keep `component`/`deferred` internal to the
renderer, OR document the constraint and type the public `stack` as a branded
opaque. (The renderer still needs the full entry internally; the leak is in what
the *public hook* returns.)

---

### Issue 4: Duplicate form `id`s collide on React `key` with no guard

**Severity**: Minor
**PRD Reference**: §5.2 `openForm({ id })` ("Unique identifier for this form
instance"); §7 Breadcrumbs; §10 Rendering.

**Expected Behavior**: Either enforce uniqueness or warn clearly in development
when a duplicate `id` is pushed.

**Actual Behavior**: `FormStackRenderer` (`src/components/FormStackRenderer.tsx:81`)
and `Breadcrumbs` (`src/components/Breadcrumbs.tsx:66`) both key list items by
`entry.id`. Pushing two forms with the same `id` produces a React
"duplicate key" warning and relies on React's graceful-degradation reconciliation
(in testing, parent input state was preserved, but key collisions are undefined
behaviour and can cause instance/state mix-ups in more complex trees).

**Steps to Reproduce**: `openForm({ id: 'same', ... })` twice (e.g. a parent
form opens a child that reuses the parent's id). React logs a duplicate-key
warning.

**Suggested Fix**: Add a development-mode guard in `openForm` that warns when an
`id` already present on the stack is pushed again, or key entries by an internal
monotonic index and use `id` only for display. Low priority since uniqueness is
a documented consumer responsibility.

---

## Testing Summary

- **Total distinct behaviors exercised**: ~30 (happy-path lifecycle, deep
  nesting, state preservation, breadcrumbs, hostable-viewport/§10.1 shared modal,
  `cancelForm`/`popToIndex` semantics, confirmation re-entrancy, `onError`
  contract, falsy submit values, duplicate IDs, type leakage, dist/exports,
  no-op edge cases).
- **Passing**: core open/submit/cancel/nest/state-preservation, breadcrumbs,
  the `popToIndex`-on-`useFormStack` fix, the §10.1 shared-modal host pattern
  (single render, submit, host `cancelForm`, deep-nest state preservation),
  `cancelForm` no-op on empty stack, falsy-value submit fidelity
  (`0`/`false`/`null`/`''` preserved, not coerced to `undefined`).
- **Failing / defective**: 4 issues above (2 Major, 2 Minor).
- **Areas with good coverage**: lifecycle, state preservation, breadcrumbs,
  autoRender/viewport diagnostics, URL sync, error-boundary render path.
- **Areas needing more attention**:
  - The form-invoked **`onError` prop path** has **zero** test coverage and is
    non-conformant with PRD §9 (Issue 1).
  - **Concurrent / re-entrant cancellation** (two `cancelForm`/`popToIndex` in
    flight) is untested and orphaned promises result (Issue 2).
  - Public type encapsulation around the viewport value (Issue 3) and duplicate
    `id` robustness (Issue 4).
