# PRP — P1.M1.T1.S2: Route form-invoked `onError` to `FormErrorBoundary` instead of rejecting/popping

---

## Goal

**Feature Goal**: Close **Issue 1** (PRD §9 violation) by reworking
`FormStackRenderer.handleError` so that when a form calls its injected
`onError(error)` prop, the renderer **no longer rejects the `openForm()` deferred**
and **no longer pops the form**. Instead it routes the error to the surrounding
`FormErrorBoundary`'s imperative `showError(error)` method (added by the
already-implemented sibling **P1.M1.T1.S1**), surfacing the existing inline
Retry/Dismiss UI. This makes the form-invoked error channel **consistent** with
the render-error channel: both show Retry/Dismiss, neither mutates the stack, and
`openForm()` honours its `T | undefined` contract (never rejects).

**Deliverable**: (1) A modified `src/components/FormStackRenderer.tsx` — add a
per-entry boundary ref Map (`useRef(new Map<string, FormErrorBoundary>())`), a
callback `ref` on each `<FormErrorBoundary>`, and a reworked `handleError` that
calls `console.error(...)` + `boundaryRefs.current.get(entry.id)?.showError(err)`
and does **nothing else**. (2) A Mode-A JSDoc update on `FormProps.onError` in
`src/types/form.ts`. (3) A renderer-level regression test in
`src/components/__tests__/FormStackRenderer.test.tsx` asserting the deferred is
neither rejected nor resolved, `onClose` is not called, and the fallback UI
appears. (4) A new end-to-end integration test
`src/__tests__/integration/FormOnError.integration.test.tsx` asserting (through
the real provider) that `openForm()` does not reject, no unhandled rejection
fires, `stack.length` stays 1, and the boundary fallback (`role="alert"`) is
visible.

**Success Definition**: A form calling `onError(new Error('boom'))` leaves the
stack unchanged, keeps `openForm()` pending (no reject, no resolve, no unhandled
rejection), and shows the boundary's Retry/Dismiss fallback. `npx tsc --noEmit`
exits 0; `npx vitest run` is green (298 → ~300+ across 26 files); existing 298
tests remain green; `FormErrorBoundary.tsx` is untouched.

---

## User Persona (if applicable)

**Target User**: Library consumers writing form components that can encounter
application-level errors (e.g. a failed submit/save) and who call the injected
`onError` prop to surface them.

**Use Case**: A form calls `onError(new Error('db write failed'))`. Per PRD §9 the
provider displays inline Retry/Dismiss UI and must **not** auto-pop the stack or
reject `openForm()`. The caller (matching the PRD §12 example) simply `await`s
`openForm(...)` without a `try/catch`.

**User Journey**: Form fires `onError` → `handleError` logs + calls
`boundaryRef.showError(err)` → boundary `setState({hasError:true, error})` →
fallback UI appears (stack entry stays, deferred still pending) → user clicks
"Try Again" (form remounts, deferred still pending) or "Dismiss"
(`onDismiss` → `deferred.resolve(undefined)` + `onClose()` → cancel semantics).

**Pain Points Addressed**: Today the form-invoked `onError` path rejects the
deferred (breaking the `T | undefined` contract, emitting an unhandled rejection
when the caller doesn't `try/catch`) AND pops the form (mutating the stack,
violating §9 "Errors do not mutate stack state automatically"). The render-error
path was already compliant; this makes the two channels consistent.

---

## Why

- **PRD §9 conformance.** §9 states `onError(error)` "may be called by the form",
  "Errors do not mutate stack state automatically", and the provider "may display:
  Inline error UI, Retry action, Dismiss action". The current `handleError`
  violates all three. This fix routes the error to the already-compliant boundary UI.
- **Honours the `openForm()` contract (§5.2/§6).** The promise resolves to
  `T | undefined`; rejection is never specified. Rejecting (today) breaks callers
  who follow the §12 example (bare `await`, no `try/catch`) → unhandled rejection.
- **Consistency across error channels.** A **render** error is caught by
  `FormErrorBoundary` (Retry/Dismiss, no auto-pop, form stays). A form-invoked
  `onError` should behave the same — both now converge on the same fallback UI.
- **Reuses existing UI — zero new rendering code.** `showError` (S1) sets the same
  state `getDerivedStateFromError` sets, so the already-built fallback renders.
  `handleError` only decides *where* to send the error.

---

## What

User-visible behavior: when a form calls its injected `onError(error)`, the form's
error boundary shows the inline Retry/Dismiss UI; the stack is unchanged;
`openForm()` stays pending (it will only settle later — on Retry nothing happens
to it; on Dismiss it resolves `undefined`). The form's React subtree is replaced
by the fallback (same as a render error); on Retry the form remounts. **No** reject,
**no** `onClose`, **no** unhandled rejection.

### Scope (EXACT — do only this)

1. **`src/components/FormStackRenderer.tsx`**:
   - Add `useRef` to the `react` import.
   - Add `const boundaryRefs = useRef(new Map<string, FormErrorBoundary>());`
     **before** the `if (stack.length === 0) return null;` early return.
   - Rework `handleError` (lines 67-69): replace `reject + onClose` with
     `console.error(...) + boundaryRefs.current.get(entry.id)?.showError(err)`.
   - Add a callback `ref` to each `<FormErrorBoundary>` (set/delete by `entry.id`).
2. **`src/types/form.ts`** (Mode A): replace the one-line `onError` JSDoc with a
   richer block clarifying it surfaces the error to `FormErrorBoundary` and does
   NOT reject `openForm()` or mutate the stack (PRD §9).
3. **`src/components/__tests__/FormStackRenderer.test.tsx`**: add a test proving
   the deferred is not rejected/resolved, `onClose` not called, fallback visible.
4. **`src/__tests__/integration/FormOnError.integration.test.tsx`** (NEW): full
   provider test — `openForm()` not rejected, no unhandled rejection,
   `stack.length === 1`, fallback (`role="alert"`) visible.

### Success Criteria

- [ ] `handleError` calls `console.error` then `boundaryRefs.current.get(entry.id)?.showError(err)`; it does NOT call `entry.deferred.reject` or `onClose`.
- [ ] A `useRef(new Map<string, FormErrorBoundary>())` exists before the early return, and each `<FormErrorBoundary>` has a callback `ref` populating it by `entry.id` (with null-cleanup).
- [ ] `FormProps.onError` JSDoc documents the boundary-surfacing behavior and the non-rejection/non-mutation guarantees.
- [ ] Renderer unit test: after a form calls `onError`, `deferred.reject` NOT called, `deferred.resolve` NOT called, `onClose` NOT called, and `screen.getByRole('alert')` is present.
- [ ] Integration test: after `onError`, `openForm()` does not reject, no `unhandledRejection` fires, `stack.length === 1`, and `getByRole('alert')` visible.
- [ ] `npx tsc --noEmit` exits 0; `npx vitest run` green (existing 298 + new tests).
- [ ] `FormErrorBoundary.tsx` is untouched (S1 owns it; `showError` already exists there).

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** The PRP quotes the exact current code of
`handleError`, the exact `showError` method (S1, already present), the exact ref +
callback-ref patterns, the exact DOM assertions for the fallback, the exact mock
helpers to reuse in the renderer test, and the exact full-provider integration
pattern. The only inference the implementer makes is formatting.

### Documentation & References

```yaml
# MUST READ — the file being reworked
- file: src/components/FormStackRenderer.tsx
  why: Houses handleError (the buggy :67-69 reject+onClose) and the <FormErrorBoundary>
        JSX (:87-101) where the callback ref goes. Also the early return (:32) that
        governs where useRef must be placed.
  pattern: per-entry inline callbacks inside stack.map((entry,index)=>{...}); handleSubmit/
        handleCancel already use this closure-over-entry style — handleError follows it.
  gotcha: useRef MUST be called BEFORE the `if (stack.length === 0) return null;` early
        return (:32). Placing it after = conditional hook = React error.

# MUST READ — the sibling method this task consumes (already implemented by S1)
- file: src/components/FormErrorBoundary.tsx
  why: showError(error: Error): void at :144-146 sets {hasError:true, error} → re-enters
        the existing render() fallback branch (role="alert", "Something went wrong",
        {error.message}, "Try Again"/"Dismiss"). S2 calls it; does NOT modify this file.
  pattern: boundary render() fallback (when hasError) shows div[role="alert"] with the
        error message + Try Again (handleRetry) + Dismiss (handleDismiss→onDismiss).
  gotcha: showError does NOT fire componentDidCatch or the onError prop (no React error
        caught) — that is why handleError logs with console.error BEFORE calling showError.
  gotcha: FormErrorBoundary is a CLASS import on FormStackRenderer:4 — usable as BOTH value
        and type. `new Map<string, FormErrorBoundary>()` needs NO extra import.

# MUST READ — the issue this closes (PRD §9)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/issue_analysis.md
  why: §Issue 1 gives the exact current buggy code, the PRD refs (§9, §5.2, §6, §12),
        the observed defects (stack 1→0, openForm rejects, unhandledRejection), and the
        prescribed fix (route to boundary, no reject, no onClose).
  section: "## Issue 1 (Major)" and "#### Step 2: Rework FormStackRenderer.handleError"

# MUST READ — the S1 PRP (dependency contract — treat as already implemented)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/P1M1T1S1/PRP.md
  why: Defines showError(error: Error): void { this.setState({hasError:true,error}); }
        which S2 calls. Confirms FormErrorBoundary is already exported (no export work).
  gotcha: Do NOT duplicate S1's work — showError is DONE (verified at :144). Do not edit
        FormErrorBoundary.tsx.

# MODIFY — Mode-A docs target
- file: src/types/form.ts
  why: FormProps.onError (:34-35, one-line JSDoc) must be updated to document that onError
        surfaces to FormErrorBoundary (Retry/Dismiss) and does NOT reject openForm/mutate
        the stack — aligning with PRD §9.
  pattern: FormProps<T> already has rich JSDoc (see onSubmit/onCancel + class-level block).
        Match that style for the new onError JSDoc.

# TEST PATTERNS — renderer unit test to extend
- file: src/components/__tests__/FormStackRenderer.test.tsx
  why: Reuse createMockDeferred() + createMockEntry(id,label,deferred); spy pattern
        `vi.spyOn(deferred,'reject')`; the "error boundary integration" describe block
        (console.error mocked) already asserts getByRole('alert') for RENDER errors.
  pattern: existing tests spy on deferred.resolve/reject and assert called/not-called +
        onClose called/not-called. Extend with an onError-button entry + same spy style.
  gotcha: createMockEntry's component has NO onError button — build a custom entry whose
        component calls onError on a click. console.error IS mocked in the error describe
        block (inherited) so handleError's console.error is swallowed.

# TEST PATTERNS — full-provider integration test to mirror
- file: src/__tests__/integration/ErrorBoundaryIsolation.integration.test.tsx
  why: Canonical pattern for <FormStackProvider><TestApp/></FormStackProvider> with a
        TestApp that uses useFormStack() and exposes stack.length via a data-testid span.
        Mirror it for the onError (button-click) path instead of the render-throw path.
  pattern: console.error mocked beforeEach/afterEach; await act(async()=>fireEvent.click(...));
        assert getByRole('alert') + getByTestId('stack-length').

# Reference — error-handling architecture (two channels converge here)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/system_context.md
  why: "Error Handling — Two Channels" explains the render-error vs form-onError split.
        This task makes them converge on the same boundary fallback UI.
  section: "### Error Handling — Two Channels (Currently Inconsistent)"

# Spec — the PRD lines this satisfies
- file: PRD.md
  why: §9 (onError may be called; errors do not mutate stack; may show inline UI/Retry/
        Dismiss); §5.2/§6 (openForm resolves T|undefined, never rejects); §12 (caller
        awaits without try/catch).
  section: §9 Error Handling, §5.2 openForm, §6 FormProps.onError, §12 example
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── PRD.md
├── package.json                 # scripts: test = "vitest run", type-check = "tsc --noEmit"
├── src/
│   ├── components/
│   │   ├── FormErrorBoundary.tsx           # showError() @ :144 (S1 — DO NOT TOUCH)
│   │   ├── FormStackRenderer.tsx           # ← EDIT: +useRef import, +ref Map, rework handleError, +callback ref
│   │   └── __tests__/
│   │       └── FormStackRenderer.test.tsx  # ← EDIT: +onError regression test
│   ├── types/
│   │   └── form.ts                         # ← EDIT: Mode-A JSDoc on FormProps.onError (:34-35)
│   └── __tests__/integration/
│       ├── ErrorBoundaryIsolation.integration.test.tsx   # pattern reference (render errors)
│       └── FormOnError.integration.test.tsx              # ← NEW: form-invoked onError E2E
└── plan/002_32eb66cd705d/bugfix/001_f635210a7f29/
    ├── architecture/{issue_analysis,system_context}.md
    ├── P1M1T1S1/PRP.md                    # S1 contract (showError — already implemented)
    └── P1M1T1S2/                          # ← THIS PRP lives here
```

### Desired Codebase tree with files to be added/changed

```bash
src/components/FormStackRenderer.tsx                          # MODIFIED — ref Map + callback ref + reworked handleError
src/types/form.ts                                             # MODIFIED — richer onError JSDoc (Mode A)
src/components/__tests__/FormStackRenderer.test.tsx           # MODIFIED — +onError regression test
src/__tests__/integration/FormOnError.integration.test.tsx    # NEW — form-invoked onError E2E
# (FormErrorBoundary.tsx is NOT modified — S1 already added showError)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL (rules of hooks): FormStackRenderer has an EARLY RETURN at line 32
//   (`if (stack.length === 0) { return null; }`). The new `useRef(...)` MUST be
//   placed BEFORE that return, immediately after the function signature. Putting
//   it after the return = conditional hook call = React throws "rendered fewer
//   hooks than expected". This is the #1 way to break this task.

// CRITICAL: handleError must NOT call entry.deferred.reject(error) NOR onClose().
//   The WHOLE POINT of the fix is to stop mutating the stack and stop rejecting.
//   Replace those two lines with: console.error(...) + boundaryRefs.get(...)?.showError(err).

// GOTCHA (no extra import): `import { FormErrorBoundary } from './FormErrorBoundary';`
//   (FormStackRenderer:4) imports a CLASS, which TS treats as BOTH a value (constructor)
//   AND a type (instance type). So `new Map<string, FormErrorBoundary>()` compiles with
//   NO new import. Do not add a redundant `import type { FormErrorBoundary }`.

// GOTCHA (React refs to classes): In React 18/19, a `ref` prop on a class component
//   yields the instance directly — NO forwardRef needed. The callback ref receives
//   `FormErrorBoundary | null` (null on unmount) — that's why the callback does
//   `else boundaryRefs.current.delete(entry.id)` for cleanup.

// GOTCHA ("form stays mounted" wording): The contract comment says "form stays mounted"
//   — this means the STACK ENTRY stays (not popped) and the deferred stays PENDING. It
//   does NOT mean the form's React subtree stays rendered: when showError sets hasError,
//   the boundary's render() returns the fallback INSTEAD of children (same as a render
//   error). On "Try Again" the form remounts fresh. This is PRD §9 compliant and
//   consistent with the render-error channel. The testable invariants are: stack.length
//   unchanged, deferred not rejected, fallback UI visible.

// GOTCHA (logging): showError does NOT fire componentDidCatch or the boundary's onError
//   prop (no React error was caught). So handleError MUST do its own console.error BEFORE
//   calling showError. The renderer test's error describe block already mocks console.error.

// GOTCHA (console.error in tests): React also logs caught RENDER errors to console.error;
//   that's why the existing test files mock console.error globally in their error blocks.
//   For the form-invoked path, only OUR console.error (from handleError) fires — harmless
//   under the existing mock.

// TOOLING: this project uses Vitest + tsc — NOT ruff/mypy/pytest. Validation = tsc + vitest.
```

---

## Implementation Blueprint

### Data models and structure

No new data models. The single structural addition is a ref Map on the renderer:

```typescript
// New (inside FormStackRenderer, before the early return).
// FormErrorBoundary is already imported as a class (value + type) — no new import.
const boundaryRefs = useRef(new Map<string, FormErrorBoundary>());
```

`handleError` is reworked to call S1's method (already present):

```typescript
// S1 output (FormErrorBoundary.tsx:144-146) — DO NOT MODIFY, just call it:
showError(error: Error): void {
  this.setState({ hasError: true, error });
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: WRITE FAILING TEST FIRST (TDD) in src/components/__tests__/FormStackRenderer.test.tsx
  - ADD a new test INSIDE the existing `describe('error boundary integration', ...)` block
        (console.error is already mocked there via beforeEach/afterEach — inherited).
  - BUILD a custom entry whose component calls onError on a click (createMockEntry has no
        onError button, so define inline). Reuse createMockDeferred() + vi.spyOn pattern:
        ```tsx
        it('should route form-invoked onError to the boundary without rejecting or popping', () => {
          const deferred = createMockDeferred<unknown>();
          const rejectSpy = vi.spyOn(deferred, 'reject');
          const resolveSpy = vi.spyOn(deferred, 'resolve');
          const entry: InternalStackEntry<unknown> = {
            id: 'onerror-form',
            label: 'OnError Form',
            component: ({ onError }: FormProps<unknown>) => (
              <div data-testid="onerror-form">
                <button data-testid="fire-error" onClick={() => onError(new Error('boom'))}>
                  Fire Error
                </button>
              </div>
            ),
            confirmOnCancel: false,
            deferred,
          };
          const onClose = vi.fn();
          const onCancelRequest = createMockCancelRequest();

          render(<FormStackRenderer stack={[entry]} onClose={onClose} onCancelRequest={onCancelRequest} />);

          fireEvent.click(screen.getByTestId('fire-error'));

          // PRD §9: no reject, no resolve, no pop
          expect(rejectSpy).not.toHaveBeenCalled();
          expect(resolveSpy).not.toHaveBeenCalled();
          expect(onClose).not.toHaveBeenCalled();
          // Error surfaced to the boundary fallback UI
          expect(screen.getByRole('alert')).toBeInTheDocument();
          expect(screen.getByText('boom')).toBeInTheDocument();
        });
        ```
  - RUN: `npx vitest run src/components/__tests__/FormStackRenderer.test.tsx`
        → this test FAILS today (handleError rejects+pops → rejectSpy called, no alert, onClose called).
        That is the expected RED state before Task 2.

Task 2: REWORK FormStackRenderer (src/components/FormStackRenderer.tsx)
  - EDIT line 1 import: `import { createElement, useRef, type ReactElement } from 'react';` (+useRef).
  - ADD (immediately after the function signature, BEFORE the `if (stack.length === 0)` early return):
        `const boundaryRefs = useRef(new Map<string, FormErrorBoundary>());`
    (No new import — FormErrorBoundary is already a class import at line 4 = value+type.)
  - REPLACE handleError (lines 67-69). Current:
        const handleError = (error: unknown) => {
          entry.deferred.reject(error);
          onClose();
        };
    New:
        const handleError = (error: unknown) => {
          const err = error instanceof Error ? error : new Error(String(error));
          console.error(`[FormStack] Form-invoked onError in form ${entry.id}:`, err);
          boundaryRefs.current.get(entry.id)?.showError(err);
          // NO reject, NO onClose — stack unchanged, openForm() stays pending (PRD §9).
        };
  - ADD a callback `ref` prop to the <FormErrorBoundary> element (inside the JSX, e.g. before
        or after formId). Exact attribute to add:
        ```tsx
        <FormErrorBoundary
          ref={(instance) => {
            if (instance) boundaryRefs.current.set(entry.id, instance);
            else boundaryRefs.current.delete(entry.id);
          }}
          formId={entry.id}
          onDismiss={() => { entry.deferred.resolve(undefined); onClose(); }}
          onError={(error, errorInfo) => {
            console.error(`[FormStack] Error in form ${entry.id}:`, error);
            console.error('Component stack:', errorInfo.componentStack);
          }}
        >
        ```
    (Keep the EXISTING onDismiss + onError as-is; only ADD the ref.)
  - DO NOT touch handleSubmit / handleCancel / formProps / the boundary's onDismiss or onError.
  - RUN: `npx vitest run src/components/__tests__/FormStackRenderer.test.tsx`
        → the Task-1 test now PASSES (green). Existing renderer tests stay green.

Task 3: UPDATE FormProps.onError JSDoc (Mode A) in src/types/form.ts
  - LOCATE line 34-35: `/** Optional error handler for form-level errors */` + `onError?: (error: unknown) => void;`.
  - REPLACE the one-line JSDoc with a richer block, e.g.:
        /**
         * Called by a form to surface an application-level error (e.g. a failed save).
         * The provider routes this to the surrounding {@link FormErrorBoundary}, which
         * shows inline Retry / Dismiss UI — it does **not** reject the `openForm()`
         * promise (the `T | undefined` contract holds) and does **not** mutate the
         * stack (PRD §9). On Dismiss the form is cancelled (`openForm()` resolves
         * `undefined`); on Retry the form remounts and `openForm()` remains pending.
         *
         * @param error - The error to surface in the boundary fallback UI.
         * @see {@link FormErrorBoundary} - Renders the Retry/Dismiss fallback
         */
        onError?: (error: unknown) => void;
  - STYLE: match the existing FormProps JSDoc density (param + @see tags).
  - RUN: `npx tsc --noEmit` → exit 0 (JSDoc-only change; no type change).

Task 4: CREATE the integration test src/__tests__/integration/FormOnError.integration.test.tsx
  - MIRROR the full-provider pattern from ErrorBoundaryIsolation.integration.test.tsx
        (FormStackProvider + TestApp using useFormStack; <span data-testid="stack-length">).
  - CONSOLE: mock console.error in beforeEach/afterEach (handleError logs; also RTL/React may).
  - STRUCTURE (one primary it() — adapt names as you like):
        ```tsx
        import type { ReactNode } from 'react';
        import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
        import { render, screen, fireEvent, act } from '@testing-library/react';
        import { FormStackProvider } from '../../components/FormStackProvider';
        import { useFormStack } from '../../hooks';
        import type { FormProps } from '../../types';

        describe('FormOnError Integration', () => {
          const originalError = console.error;
          beforeEach(() => { console.error = vi.fn(); });
          afterEach(() => { console.error = originalError; });

          it('routes form-invoked onError to the boundary: no reject, no unhandledRejection, stack unchanged', async () => {
            // Track unhandled rejections (defense-in-depth)
            const unhandled: unknown[] = [];
            const onUnhandled = (reason: unknown) => unhandled.push(reason);
            process.on('unhandledRejection', onUnhandled);

            // Form that calls onError on click
            function ErrorCallingForm({ onError }: FormProps<string>): ReactNode {
              return (
                <div data-testid="error-calling-form">
                  <button data-testid="fire-onerror" onClick={() => onError(new Error('boom'))}>
                    Fire Error
                  </button>
                </div>
              );
            }

            let settled: 'resolved' | 'rejected' | undefined;
            function TestApp() {
              const { openForm, stack } = useFormStack();
              const start = async () => {
                const p = openForm({ id: 'error-form', component: ErrorCallingForm, label: 'Error Form' });
                // Track settlement (also makes the promise "handled" → deterministic)
                p.then(() => { settled = 'resolved'; }, () => { settled = 'rejected'; });
              };
              return (
                <div>
                  <span data-testid="stack-length">{stack.length}</span>
                  <button data-testid="start" onClick={start}>Start</button>
                </div>
              );
            }

            try {
              render(<FormStackProvider><TestApp /></FormStackProvider>);
              await act(async () => { fireEvent.click(screen.getByTestId('start')); });
              expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

              await act(async () => { fireEvent.click(screen.getByTestId('fire-onerror')); });
              // Flush microtasks so any latent rejection/unhandledRejection would surface
              await act(async () => { await new Promise((r) => setTimeout(r, 10)); });

              expect(settled).toBeUndefined();              // neither resolved nor rejected
              expect(unhandled).toHaveLength(0);            // no unhandled rejection
              expect(screen.getByTestId('stack-length')).toHaveTextContent('1'); // stack unchanged
              expect(screen.getByRole('alert')).toBeInTheDocument();             // boundary fallback
              expect(screen.getByText('boom')).toBeInTheDocument();
            } finally {
              process.off('unhandledRejection', onUnhandled);
            }
          });
        });
        ```
  - OPTIONAL second it(): after the error is shown, clicking "Dismiss" resolves the form
        (cancel) and reduces the stack to 0; clicking "Try Again" clears the alert and
        re-renders the form (deferred still pending). Add if time permits; the primary test
        above is the contract-required one.
  - RUN: `npx vitest run src/__tests__/integration/FormOnError.integration.test.tsx` → green.

Task 5: PROJECT-WIDE VALIDATION
  - RUN: `npx tsc --noEmit` → expect exit 0.
  - RUN: `npx vitest run` → expect all green (298 prior + new tests ≈ 300+, 26 files).
  - RUN: `git status --short` → expect ONLY:
        M src/components/FormStackRenderer.tsx
        M src/types/form.ts
        M src/components/__tests__/FormStackRenderer.test.tsx
        ?? src/__tests__/integration/FormOnError.integration.test.tsx
    NOTHING else — especially NOT src/components/FormErrorBoundary.tsx.

Task 6: SCOPE-HYGIENE CHECK
  - CONFIRM src/components/FormErrorBoundary.tsx is UNCHANGED (S1 owns it; showError exists).
  - CONFIRM no export files changed (src/index.ts, src/components/index.ts untouched).
  - CONFIRM PRD.md, tasks.json, prd_snapshot.md untouched.
```

### Implementation Patterns & Key Details

```typescript
// --- PATTERN: the reworked handleError (per-entry, inside stack.map closure) ---
const handleError = (error: unknown) => {
  // Normalize non-Error throws (onError type is `unknown`) so showError gets an Error.
  const err = error instanceof Error ? error : new Error(String(error));
  // Log here — showError does NOT fire componentDidCatch/the boundary's onError prop.
  console.error(`[FormStack] Form-invoked onError in form ${entry.id}:`, err);
  // Route to THIS entry's boundary (keyed by entry.id). Optional chaining = safe no-op
  // if the ref isn't set yet (shouldn't happen, but defensive).
  boundaryRefs.current.get(entry.id)?.showError(err);
  // NO entry.deferred.reject(...) — keeps openForm() pending (T | undefined contract).
  // NO onClose() — stack unchanged (PRD §9 "errors do not mutate stack state").
};

// --- PATTERN: per-entry boundary ref Map (declared ONCE, before the early return) ---
// Placed at the top of FormStackRenderer's body, BEFORE `if (stack.length === 0) return null;`.
const boundaryRefs = useRef(new Map<string, FormErrorBoundary>());

// --- PATTERN: callback ref (cleanup on unmount) ---
<FormErrorBoundary
  ref={(instance) => {
    if (instance) boundaryRefs.current.set(entry.id, instance);
    else boundaryRefs.current.delete(entry.id);   // null on unmount → cleanup
  }}
  ...
/>

// --- PATTERN: the existing boundary onDismiss is ALREADY correct (do not change) ---
onDismiss={() => {
  entry.deferred.resolve(undefined); // cancel semantics
  onClose();                          // pop the form
}}
// After a form-invoked error, the user clicking "Dismiss" runs this → openForm()
// resolves undefined (cancel). "Try Again" just clears hasError (form remounts,
// deferred still pending). Both are PRD §9 compliant.
```

### Integration Points

```yaml
CONSUMES (from S1 — already implemented):
  - FormErrorBoundary.showError(error: Error): void @ FormErrorBoundary.tsx:144-146.
    S2 calls it via a ref. S2 does NOT modify FormErrorBoundary.tsx.

MODIFIES (this subtask):
  - src/components/FormStackRenderer.tsx (+useRef import, +ref Map, reworked handleError,
        +callback ref on <FormErrorBoundary>)
  - src/types/form.ts (Mode-A JSDoc on FormProps.onError — behavior documented, no type change)
  - src/components/__tests__/FormStackRenderer.test.tsx (+onError regression test)
  - src/__tests__/integration/FormOnError.integration.test.tsx (NEW full-provider E2E)

NO INTEGRATION CHURN:
  - exports: UNCHANGED (FormStackRenderer, FormProps are already exported).
  - FormErrorBoundary.tsx: UNCHANGED.
  - no database / config / route changes (pure component behavior fix).
  - The boundary's onDismiss/onError props: UNCHANGED (onDismiss already does the right
    resolve(undefined)+onClose() for cancel-on-dismiss).
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
cd /home/dustin/projects/geoform
npx tsc --noEmit
# Expected: exit 0. Risk spots to watch if it errors:
#   - `useRef` not imported → add to the react import (Task 2).
#   - callback ref `instance` param type — TS infers FormErrorBoundary | null from the
#     class ref; if not, annotate `(instance: FormErrorBoundary | null) => {...}`.
#   - Map<string, FormErrorBoundary> — FormErrorBoundary is a class import = type too.
# (No ruff/mypy/black here — TS/React project. tsc is the type gate.)
```

### Level 2: Unit Tests (Component Validation)

```bash
cd /home/dustin/projects/geoform
# The renderer regression test (fast, tightest guard)
npx vitest run src/components/__tests__/FormStackRenderer.test.tsx
# Expected: all green, INCLUDING the new onError test (reject/resolve/onClose NOT called;
# getByRole('alert') present). The existing render-error tests stay green.

# The boundary tests (S1) must stay green — S2 did not touch FormErrorBoundary
npx vitest run src/components/__tests__/FormErrorBoundary.test.tsx
# Expected: green (unchanged).
```

### Level 3: Integration Testing (System Validation)

```bash
cd /home/dustin/projects/geoform
# The new full-provider E2E
npx vitest run src/__tests__/integration/FormOnError.integration.test.tsx
# Expected: green — openForm() not rejected, no unhandledRejection, stack.length === 1,
# getByRole('alert') visible.

# Regression: existing render-error integration suite still green
npx vitest run src/__tests__/integration/ErrorBoundaryIsolation.integration.test.tsx
# Expected: green (S2 changed the onError PATH, not the render-throw path).

# Full suite — confirms no regressions from the handleError rework
npx vitest run
# Expected: all green. Baseline was 298/298 across 26 files; expect ~300+/300+ after.
# If a PRE-EXISTING test fails, your edit broke something (e.g. you changed onDismiss or
# handleSubmit) — revert that part. If only your NEW test fails, debug the implementation.
```

### Level 4: Scope-Hygiene & Contract Validation (critical for a layered fix)

```bash
cd /home/dustin/projects/geoform
git status --short
# Expected EXACTLY:
#   M src/components/FormStackRenderer.tsx
#   M src/types/form.ts
#   M src/components/__tests__/FormStackRenderer.test.tsx
#   ?? src/__tests__/integration/FormOnError.integration.test.tsx
# NOTHING else — especially NOT src/components/FormErrorBoundary.tsx, NOT any export file,
# NOT PRD.md / tasks.json / prd_snapshot.md.

# Confirm handleError no longer rejects/pops (grep):
grep -n "entry.deferred.reject\|onClose()" src/components/FormStackRenderer.tsx
# Expected: the ONLY remaining `onClose()` calls are in handleSubmit, handleCancel, and the
# boundary's onDismiss — NOT in handleError. And `entry.deferred.reject` should NOT appear
# in handleError (grep it; the only reject reference anywhere is the DeferredPromise type).

# Confirm the ref Map + callback ref are present:
grep -n "boundaryRefs\|showError" src/components/FormStackRenderer.tsx
# Expected: boundaryRefs declared (useRef Map), used in handleError (get+showError), and in
# the callback ref (set/delete).

# Confirm FormErrorBoundary.tsx was NOT modified by S2:
git diff --name-only | grep FormErrorBoundary || echo "OK: FormErrorBoundary untouched"
# Expected: "OK: FormErrorBoundary untouched".
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npx tsc --noEmit` exits 0.
- [ ] `npx vitest run src/components/__tests__/FormStackRenderer.test.tsx` green (incl. new onError test).
- [ ] `npx vitest run src/__tests__/integration/FormOnError.integration.test.tsx` green.
- [ ] `npx vitest run` green project-wide (existing 298 + new tests, 0 regressions).
- [ ] Level 4 scope check: exactly the 3 modified + 1 new file; `FormErrorBoundary.tsx` untouched.

### Feature Validation

- [ ] `handleError` calls `console.error` then `boundaryRefs.current.get(entry.id)?.showError(err)`.
- [ ] `handleError` does NOT call `entry.deferred.reject` and does NOT call `onClose`.
- [ ] `useRef(new Map<string, FormErrorBoundary>())` declared before the early return.
- [ ] Each `<FormErrorBoundary>` has a callback `ref` (set on instance, delete on null).
- [ ] Renderer test: `rejectSpy`/`resolveSpy`/`onClose` NOT called; `getByRole('alert')` + `getByText('boom')` present.
- [ ] Integration test: `settled === undefined`, `unhandled.length === 0`, `stack.length === '1'`, `getByRole('alert')` visible.
- [ ] `FormProps.onError` JSDoc documents boundary-surfacing + non-rejection/non-mutation (PRD §9).

### Code Quality Validation

- [ ] `handleError` normalizes non-Error (`error instanceof Error ? ... : new Error(String(error))`).
- [ ] Callback ref cleans up on unmount (`else delete`).
- [ ] The boundary's existing `onDismiss`/`onError` props are preserved (only `ref` added).
- [ ] JSDoc on `FormProps.onError` matches the file's existing rich-JSDoc style.
- [ ] Tests follow existing patterns (mock deferred + spy; full-provider integration with stack-length span).
- [ ] Anti-patterns avoided (see below): no FormErrorBoundary edits, no reject/close in handleError, no forwardRef.

### Documentation & Deployment

- [ ] Mode-A JSDoc on `FormProps.onError` is part of THIS subtask (rides with the work).
- [ ] README.md NOT touched here (README error-handling section is P1.M3.T1.S1's job).
- [ ] No new env vars / config.

---

## Anti-Patterns to Avoid

- ❌ Don't place `useRef(...)` AFTER the `if (stack.length === 0) return null;` early return —
  that is a conditional hook call and React will throw. Put it first, before the return.
- ❌ Don't leave `entry.deferred.reject(error)` or `onClose()` in `handleError`. The ENTIRE
  purpose of this task is to remove both. Rejecting breaks the `T | undefined` contract
  (§5.2) and emits an unhandled rejection; `onClose()` mutates the stack (violates §9).
- ❌ Don't modify `src/components/FormErrorBoundary.tsx`. S1 already added `showError`
  (verified at :144). Editing it risks colliding with S1 and is out of scope.
- ❌ Don't add a `forwardRef` — class components give instance refs natively in React 18/19.
- ❌ Don't add a new `import type { FormErrorBoundary }` — the class import on line 4 already
  provides both the value and the instance type.
- ❌ Don't change the boundary's `onDismiss` or `onError` props — `onDismiss` already does the
  correct `resolve(undefined) + onClose()` (cancel-on-dismiss). Only ADD the `ref`.
- ❌ Don't skip the "deferred NOT rejected" assertion — `typeof onError === 'function'` would
  pass even on the buggy code. Assert the deferred is untouched (the real regression guard).
- ❌ Don't let the integration test's `openForm()` promise go unhandled if you also assert on
  `unhandledRejection` — attach `.then(_, onReject)` to make it deterministic AND assert
  `onReject` was never called (that IS the "does not reject" guard).
- ❌ Don't run ruff/mypy/pytest — this is a TS/React project; the gates are `tsc` + `vitest`.

---

## Confidence Score

**9 / 10** for one-pass success. The fix is small and precisely scoped: one method
rework (`handleError`), one ref Map + one callback ref (exact code quoted), one
Mode-A JSDoc, and two tests whose exact bodies and assertions are quoted verbatim.
The dependency on S1 is already satisfied (`showError` verified at
`FormErrorBoundary.tsx:144`), and the existing renderer/integration test files
provide copy-ready patterns (mock deferred + spy; full-provider with stack-length
span). The only residual risks are (1) the rules-of-hooks placement of `useRef`
(called out explicitly with the early-return line number) and (2) TS inferring the
callback-ref parameter type — both addressed in the PRP with the exact line and a
supported annotation fallback. The contract is unambiguous: no reject, no onClose,
route to `showError`, test the invariants.
