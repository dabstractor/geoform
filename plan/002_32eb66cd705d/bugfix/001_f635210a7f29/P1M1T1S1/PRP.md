# PRP — P1.M1.T1.S1: Add imperative `showError(error)` method to `FormErrorBoundary`

---

## Goal

**Feature Goal**: Give `FormErrorBoundary` (a React class component) a new public
instance method `showError(error: Error): void` that imperatively surfaces the
existing Retry/Dismiss fallback UI for a **non-render** error. It sets the same
state (`{ hasError: true, error }`) that `getDerivedStateFromError` sets, so the
already-built fallback renders with zero new UI. This is the **foundation**
subtask for fixing Issue 1 (form-invoked `onError` violating PRD §9): sibling
**P1.M1.T1.S2** will obtain a ref to the boundary inside `FormStackRenderer` and
call `ref.current.showError(error)` instead of rejecting/popping.

**Deliverable**: A modified `src/components/FormErrorBoundary.tsx` (one new
public method + Mode-A JSDoc on the class) and new tests in
`src/components/__tests__/FormErrorBoundary.test.tsx` proving the method shows
the fallback, that Retry clears it, that Dismiss fires `onDismiss`, and that
`componentDidCatch`/`onError` do NOT fire for the imperative path. **No other
source file is touched.** No export changes are needed (already exported).

**Success Definition**: `const b = useRef<FormErrorBoundary>(null)` then
`b.current?.showError(new Error('x'))` is valid TypeScript and renders the
fallback; `npx tsc --noEmit` exits 0; `npx vitest run` is green (294 → ~298
tests across 26 files); existing 294 tests remain green; `FormStackRenderer` is
untouched.

---

## User Persona (if applicable)

**Target User**: Library consumers / the geoform provider internals (via S2) who
need to route a non-render error (a form calling its injected `onError` prop)
through the boundary's existing fallback UI rather than mutating the stack.

**Use Case**: A form component calls `onError(new Error('db write failed'))`. Per
PRD §9 the provider should display inline error UI (Retry/Dismiss) and must NOT
auto-pop the stack or reject `openForm()`. S2 will rewire
`FormStackRenderer.handleError` to call this `showError` method; S1 builds the
method itself.

**User Journey**: Form fires `onError` → S2 calls `boundaryRef.current.showError(error)`
→ boundary `setState({ hasError:true, error })` → fallback UI appears (form stays
mounted, stack unchanged) → user clicks "Try Again" (children re-render) or
"Dismiss" (`onDismiss` runs).

**Pain Points Addressed**: Today the form-invoked `onError` path rejects the
`openForm()` deferred AND pops the form (non-compliant with PRD §9, plus emits an
unhandled rejection). The boundary already has compliant Retry/Dismiss UI for
*render* errors but no imperative entry point. This task adds that entry point.

---

## Why

- **Foundation for the Issue-1 fix (PRD §9 conformance).** The boundary already
  implements the compliant inline-error behavior (Retry/Dismiss, no auto-pop,
  form stays mounted). S1 exposes it imperatively; S2 wires the form-invoked
  `onError` to it. Splitting method-first keeps S1 tiny and independently testable.
- **Reuses existing UI — zero new rendering code.** `showError` only calls
  `this.setState({ hasError: true, error })`, which re-enters the existing
  `render()` fallback branch.
- **Does not regress the render-error channel.** The two channels (render error
  via React lifecycle; form-invoked `onError` via imperative call) now converge on
  the SAME fallback UI, making error handling consistent.

---

## What

Add **one public instance method** to the `FormErrorBoundary` class:

```ts
/**
 * Imperatively display the error fallback UI for a NON-render error
 * (e.g. a form-invoked `onError`). Sets the same state as
 * `getDerivedStateFromError`, so the existing Retry/Dismiss UI appears and
 * the form stays mounted (no stack mutation).
 *
 * Note: `componentDidCatch` and the `onError` prop callback do NOT fire for
 * imperatively-set errors — no React error was caught. Callers must perform
 * any logging BEFORE calling this method.
 *
 * @param error - The error to surface in the fallback UI.
 */
showError(error: Error): void {
  this.setState({ hasError: true, error });
}
```

Plus update the **class-level JSDoc** to document the new imperative entry point
(Mode A) and add the tests described below. **Do not modify any other file** (no
`FormStackRenderer.tsx`, no `index.ts`, no `components/index.ts` — see Gotchas).

### Success Criteria

- [ ] `FormErrorBoundary` has a public `showError(error: Error): void` instance
      method that calls `this.setState({ hasError: true, error })`.
- [ ] A `ref` to a `FormErrorBoundary` instance can call `showError` and the
      fallback UI (`role="alert"`, the error message, "Try Again" + "Dismiss")
      appears; the wrapped children are hidden.
- [ ] Calling `showError` does NOT invoke `componentDidCatch` and does NOT invoke
      the `onError` prop (no React error was caught).
- [ ] After `showError`, clicking "Try Again" clears the error and re-renders
      children; clicking "Dismiss" calls the `onDismiss` prop.
- [ ] Class JSDoc documents the new method and notes it is for non-render errors.
- [ ] `npx tsc --noEmit` exits 0; `npx vitest run` is green (existing 294 + new
      tests).
- [ ] No file other than `FormErrorBoundary.tsx` and its test is modified.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed
to implement this successfully?_ **Yes.** The PRP quotes the exact class shape,
the exact state field names, the exact fallback DOM (roles/text) to assert
against, the exact ref+`act()` test pattern, and the exact validation commands.
The change is ~5 lines of code + one JSDoc block + tests.

### Documentation & References

```yaml
# MUST READ — the file being modified (verbatim class shape is quoted below too)
- file: src/components/FormErrorBoundary.tsx
  why: Contains the target class. The new method must use the SAME state shape
        ({ hasError, error }) the boundary already renders against, and the SAME
        this.setState style as the existing private handleRetry handler.
  pattern: arrow-fn private handlers (handleRetry/handleDismiss); getDerivedStateFromError
        sets { hasError: true, error }; render() branches on this.state.hasError.
  gotcha: showError should be a PLAIN method (not arrow fn) — it is always invoked
        as instance.showError(...) so `this` is bound. Arrow fn is unnecessary and
        inconsistent with lifecycle methods; plain method matches getDerivedStateFromError/
        componentDidCatch style.

# MUST READ — the test file to extend (co-located __tests__/ dir)
- file: src/components/__tests__/FormErrorBoundary.test.tsx
  why: Add a new describe() block here. Reuses the existing console.error
        suppression helpers (beforeEach/afterEach) and import style.
  pattern: render() + screen.getByRole('alert') / getByText(...) / getByRole('button',
        { name: 'Try Again' }) / fireEvent.click(...). console.error mocked globally
        in this file (inherited by the new block).
  gotcha: showError() triggers a class setState re-render OUTSIDE a React event
        handler, so the call MUST be wrapped in act(() => {...}) or the DOM won't
        flush and React will warn. Import act from '@testing-library/react'.

# Reference — the issue this subtask serves (S1 = foundation; S2 = wiring)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/issue_analysis.md
  why: §Issue 1 documents the PRD §9 violation (form onError → reject+pop) that
        S2 fixes using this method. Read to understand WHY showError must NOT
        itself touch the stack or the deferred (it must only set UI state).
  section: "Issue 1"

# Reference — error-handling architecture (two channels converge here)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/system_context.md
  why: "Error Handling — Two Channels" explains the render-error vs form-onError
        split. showError makes the form-onError channel reuse the render-error UI.
  section: "### Error Handling — Two Channels (Currently Inconsistent)"

# Reference — test conventions (act, waitFor, console mocking)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/test_patterns.md
  why: Confirms framework stack (Vitest 2.1 + RTL 16 + jsdom 25) and that
        console.error is suppressed for error-boundary tests. Dev-mode note
        (NODE_ENV) is NOT relevant to this subtask.

# Spec — the PRD line this ultimately satisfies
- file: PRD.md
  why: §9 "Provider may display: Inline error UI, Retry action, Dismiss action"
        + "Errors do not mutate stack state automatically". showError enables
        exactly that path for non-render errors.
  section: §9 Error Handling (and §6 FormProps.onError)
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash
geoform/
├── PRD.md
├── package.json                 # scripts: test = "vitest run", type-check = "tsc --noEmit"
├── src/
│   ├── components/
│   │   ├── FormErrorBoundary.tsx          # ← MODIFY (add showError + JSDoc)
│   │   ├── FormStackRenderer.tsx          # ← DO NOT TOUCH (S2's job)
│   │   └── ...
│   │   └── __tests__/
│   │       └── FormErrorBoundary.test.tsx # ← MODIFY (add describe block)
│   ├── components/index.ts                # already exports FormErrorBoundary (NO change)
│   └── index.ts                           # already exports FormErrorBoundary @ :210 (NO change)
└── plan/002_32eb66cd705d/bugfix/001_f635210a7f29/
    ├── architecture/{issue_analysis,system_context,test_patterns}.md
    └── P1M1T1S1/                          # ← THIS PRP lives here
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
src/components/FormErrorBoundary.tsx          # MODIFIED — +showError method + class JSDoc
src/components/__tests__/FormErrorBoundary.test.tsx  # MODIFIED — +describe('imperative showError')
# (no new files; no other files touched)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: FormErrorBoundary is ALREADY exported.
//   src/components/index.ts -> `export { FormErrorBoundary } from './FormErrorBoundary';`
//   src/index.ts:210         -> `export { FormErrorBoundary } from './components';`
//   So DO NOT add any export. The contract's "export the class type if not already
//   exported" condition is ALREADY met. Adding a duplicate export = lint/compile noise.

// CRITICAL: showError sets { hasError: true, error } ONLY. Do NOT increment retryCount
//   (that is handleRetry's job, on the Retry click). Do NOT call componentDidCatch, the
//   onError prop, onClose, or anything stack-related. Pure UI state. This keeps S1's
//   surface minimal and lets S2 own all stack/deferred logic.

// CRITICAL: Do NOT modify FormStackRenderer.tsx. Wiring handleError -> boundaryRef
//   (including adding the ref itself) is P1.M1.T1.S2. Touching it here breaks the
//   dependency contract and risks colliding with S2.

// CRITICAL (React/testing): showError() calls this.setState OUTSIDE a React event
//   handler. In tests you MUST wrap the call in act(() => {...}) or (a) React prints
//   an "act(...)" warning and (b) the fallback DOM won't be flushed before assertions.

// GOTCHA (React refs to classes): In React 18/19, a `ref` on a class component yields
//   the instance directly — NO forwardRef is needed. The ref generic is the class
//   itself: createRef<FormErrorBoundary>() or useRef<FormErrorBoundary>(null). At the
//   type level, the class name FormErrorBoundary IS the instance type (TS class = value
//   + type). No FormErrorBoundaryHandle type exists and none needs to be created.

// GOTCHA (console noise): React logs caught RENDER errors to console.error (that's why
//   the test file mocks console.error globally). An IMPERATIVELY-set error is NOT a
//   caught render error, so React logs nothing for showError(). The inherited mock is
//   harmless; you may assert console.error was NOT called for showError if desired.

// GOTCHA (TypeScript on the ref prop): passing `ref={ref}` to a class element is
//   standard; the JSX typing accepts it via the class's LegacyRef. If (unlikely) a TS
//   error appears about the ref prop, the supported fallback is a cast on the call
//   site: (ref.current as FormErrorBoundary).showError(...). Prefer the clean path first.

// TOOLING: this project uses Vitest + tsc — NOT ruff/mypy/pytest. Validation = tsc + vitest.
```

---

## Implementation Blueprint

### Data models and structure

No new models. The class already declares:

```typescript
interface FormErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}
```

`showError` reuses `hasError` + `error` only. The existing `render()` fallback
branch (triggered when `this.state.hasError === true`) renders:

- a `div[role="alert"][data-testid="error-boundary-${formId}"]`,
- the title `"Something went wrong"`,
- `{error?.message || 'An unexpected error occurred while loading this form.'}`,
- buttons `"Try Again"` (`handleRetry`) and `"Dismiss"` (`handleDismiss`).

These are the exact assertions the new tests will use.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: WRITE FAILING TESTS FIRST (TDD) in src/components/__tests__/FormErrorBoundary.test.tsx
  - ADD import: `import { createRef } from 'react';` and add `act` to the
        '@testing-library/react' import (it already imports render, screen, fireEvent).
  - ADD a new describe block: `describe('imperative showError', () => { ... })`.
  - TEST 1 (happy path): render <FormErrorBoundary ref={ref} formId="test"
        onDismiss={vi.fn()}><div data-testid="child">Child</div></FormErrorBoundary>;
        assert child visible + no alert; then
        `act(() => { ref.current!.showError(new Error('boom')); });` and assert
        screen.getByRole('alert'), screen.getByText('boom') present, and
        queryByTestId('child') is gone.
  - TEST 2 (no lifecycle/onError): render with onError={vi.fn()}; act(() =>
        ref.current!.showError(new Error('boom'))); assert onError NOT called.
        (Documents that componentDidCatch/onError do not fire for imperative errors.)
  - TEST 3 (Retry clears): after showError, fireEvent.click(getByRole('button',
        { name: 'Try Again' })); assert queryByRole('alert') gone + getByTestId('child')
        back.
  - TEST 4 (Dismiss fires prop): after showError, fireEvent.click(getByRole('button',
        { name: 'Dismiss' })); assert onDismiss called once.
  - REF TYPE: `const ref = createRef<FormErrorBoundary>();` (class name is the instance
        type). Use `ref.current!` inside act because current is `FormErrorBoundary | null`.
  - RUN: `npx vitest run src/components/__tests__/FormErrorBoundary.test.tsx`
        → new tests FAIL (showError does not exist yet). This is the expected red state.

Task 2: IMPLEMENT showError + Mode-A JSDoc in src/components/FormErrorBoundary.tsx
  - ADD the public method to the class body (place it near getDerivedStateFromError /
        componentDidCatch so the error-surface methods cluster together). Use the
        EXACT signature `showError(error: Error): void` and body
        `this.setState({ hasError: true, error });`. Plain method, NOT an arrow fn
        (it is always called as instance.showError(...); see Gotchas).
  - ADD the JSDoc block on the method (quoted in the "What" section above): state it
        is for NON-render errors (form-invoked onError path), that it sets the same
        state as getDerivedStateFromError so the existing Retry/Dismiss UI appears,
        and that componentDidCatch / the onError prop do NOT fire (caller must log).
  - UPDATE the class-level JSDoc (the big comment above `export class FormErrorBoundary`)
        to add a short paragraph noting the imperative entry point:
        "In addition to catching render errors, the boundary exposes a public
        `showError(error)` instance method so callers with a ref can surface a
        non-render error (e.g. a form-invoked onError) through the SAME Retry/Dismiss
        UI without mutating the stack."
  - RUN: `npx vitest run src/components/__tests__/FormErrorBoundary.test.tsx`
        → new tests now PASS (green). Existing tests in the file stay green.

Task 3: PROJECT-WIDE VALIDATION
  - RUN: `npx tsc --noEmit` → expect exit 0.
  - RUN: `npx vitest run` → expect all green (294 prior + 4 new = 298 across 26 files;
        record whatever count you observe).
  - RUN: `git status --short` → expect ONLY FormErrorBoundary.tsx + its test changed.

Task 4: SCOPE-HYGIENE CHECK
  - CONFIRM src/components/FormStackRenderer.tsx is unchanged (grep for the file in
        `git status` — it must NOT appear). Wiring is S2's job.
  - CONFIRM no export files changed (src/index.ts, src/components/index.ts untouched).
  - CONFIRM PRD.md, tasks.json, prd_snapshot.md untouched.
```

### Implementation Patterns & Key Details

```typescript
// --- PATTERN: the new method (plain class method, reuses existing state shape) ---
// Place inside `export class FormErrorBoundary extends Component<...>` body.
showError(error: Error): void {
  // Same partial-state shape getDerivedStateFromError returns -> same render() branch.
  this.setState({ hasError: true, error });
}

// --- PATTERN: ref usage that S2 (and tests) will rely on ---
// React 18/19: ref on a class component yields the instance directly (no forwardRef).
const boundaryRef = useRef<FormErrorBoundary>(null);
// ...later, on a non-render error:
boundaryRef.current?.showError(new Error('db write failed'));
// -> fallback UI appears; form stays mounted; stack unchanged; openForm() unaffected.

// --- PATTERN: the test must flush the setState via act() ---
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import { FormErrorBoundary } from '../FormErrorBoundary';

it('shows fallback when showError() is called via ref', () => {
  const ref = createRef<FormErrorBoundary>();
  render(
    <FormErrorBoundary ref={ref} formId="test" onDismiss={vi.fn()}>
      <div data-testid="child">Child</div>
    </FormErrorBoundary>
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();

  act(() => {
    ref.current!.showError(new Error('boom'));   // setState outside React handler -> act()
  });

  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByText('boom')).toBeInTheDocument();
  expect(screen.queryByTestId('child')).not.toBeInTheDocument();
});

// --- GOTCHA re-affirmed: showError does NOT trigger the React error lifecycle ---
it('does not call onError for imperatively-set errors', () => {
  const onError = vi.fn();
  const ref = createRef<FormErrorBoundary>();
  render(<FormErrorBoundary ref={ref} formId="test" onDismiss={vi.fn()} onError={onError}><div /></FormErrorBoundary>);
  act(() => ref.current!.showError(new Error('boom')));
  expect(onError).not.toHaveBeenCalled();   // componentDidCatch never ran (no render throw)
});
```

### Integration Points

```yaml
SOURCE (this subtask):
  - modifies: src/components/FormErrorBoundary.tsx (+showError method, +class JSDoc)
  - modifies: src/components/__tests__/FormErrorBoundary.test.tsx (+describe block)

NO INTEGRATION THIS SUBTASK:
  - FormStackRenderer.tsx: UNCHANGED (S2 will add boundaryRef + call showError).
  - exports: UNCHANGED (FormErrorBoundary already exported from components/index.ts
    and src/index.ts:210).
  - no database / config / route changes (pure UI component).
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
cd /home/dustin/projects/geoform
npx tsc --noEmit                      # type-check the whole project (catches ref-type errors)
# Expected: exit 0. The riskiest line is `ref.current!.showError(...)` — tsc confirms
# the method exists on the instance type and the ref generic resolves to the class.

# (No ruff/mypy/black in this repo — it is a TS/React project. tsc is the type gate.)
# Expected: zero errors. If any, READ the output (usually a ref-generic mismatch) and fix.
```

### Level 2: Unit Tests (Component Validation)

```bash
cd /home/dustin/projects/geoform
# Targeted: the boundary test file (fast feedback loop)
npx vitest run src/components/__tests__/FormErrorBoundary.test.tsx
# Expected: all existing tests + the 4 new showError tests pass.

# Full suite (confirm no regressions elsewhere)
npx vitest run
# Expected: all green. Baseline was 294/294 across 26 files; expect ~298/298 after.
```

### Level 3: Integration Testing (System Validation)

```bash
# There is no running server for this library; "integration" here = the existing
# component/integration suites that render FormErrorBoundary indirectly stay green.
cd /home/dustin/projects/geoform
npx vitest run src/components/__tests__/ src/__tests__/integration/
# Expected: green. FormStackRenderer tests must be UNCHANGED because S1 did not edit
# the renderer. (If a renderer test breaks, you accidentally touched FormStackRenderer — revert.)
```

### Level 4: Scope-Hygiene Validation (critical for a layered fix)

```bash
cd /home/dustin/projects/geoform
git status --short
# Expected: exactly two files modified:
#   M src/components/FormErrorBoundary.tsx
#   M src/components/__tests__/FormErrorBoundary.test.tsx
# NOTHING else — especially NOT src/components/FormStackRenderer.tsx, NOT src/index.ts,
# NOT src/components/index.ts, NOT PRD.md / tasks.json / prd_snapshot.md.

git diff --name-only
# Re-print the changed-file list; assert the two files above and only those.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npx tsc --noEmit` exits 0 (confirms `showError` exists on the instance type
      and the test ref generic resolves to `FormErrorBoundary`).
- [ ] `npx vitest run src/components/__tests__/FormErrorBoundary.test.tsx` green.
- [ ] `npx vitest run` green project-wide (existing 294 + new tests, 0 regressions).
- [ ] Level 4 scope check: exactly 2 files changed; `FormStackRenderer.tsx` untouched.

### Feature Validation

- [ ] `showError(error: Error): void` public method present; body is exactly
      `this.setState({ hasError: true, error })`.
- [ ] Test: calling it via ref shows `role="alert"` + the error message; hides children.
- [ ] Test: `onError`/`componentDidCatch` do NOT fire for the imperative call.
- [ ] Test: "Try Again" after `showError` clears the error and re-renders children.
- [ ] Test: "Dismiss" after `showError` calls the `onDismiss` prop once.
- [ ] Class-level JSDoc + method JSDoc document the non-render-error purpose and the
      "componentDidCatch/onError do not fire" caveat.

### Code Quality Validation

- [ ] Method is a plain class method (not an arrow fn), consistent with lifecycle methods.
- [ ] JSDoc style matches the existing rich JSDoc in the file (param tags, `@see`).
- [ ] Tests follow the file's existing patterns (render/screen/fireEvent, `vi.fn()`).
- [ ] `act()` wraps the imperative `setState` call in tests (no React act() warning).
- [ ] Anti-patterns avoided (see below): no forwardRef, no export churn, no renderer edits.

### Documentation & Deployment

- [ ] Mode-A JSDoc on the class + method is part of THIS subtask (rides with the work).
- [ ] No README change required here (README error-boundary section is P1.M3.T1.S1's job).
- [ ] No new env vars / config.

---

## Anti-Patterns to Avoid

- ❌ Don't use `forwardRef` — class components give instance refs natively in React 18/19.
- ❌ Don't make `showError` an arrow function — it is always called as
  `instance.showError(...)`, so `this` is bound; a plain method matches the lifecycle style.
- ❌ Don't add/increment `retryCount`, don't call `onClose`/`componentDidCatch`/`onError`,
  don't touch the deferred or the stack — `showError` is pure UI state. (S2 owns routing.)
- ❌ Don't edit `FormStackRenderer.tsx` — adding the ref + the `handleError` rework is S2.
- ❌ Don't add exports — `FormErrorBoundary` is already exported from
  `src/components/index.ts` and `src/index.ts:210`.
- ❌ Don't forget `act(() => …)` around the `showError` call in tests, or the DOM won't
  flush and React will warn.
- ❌ Don't skip the "onError NOT called" test — it documents the key behavioral contract
  (imperative errors don't trigger the React error lifecycle) that S2 relies on.
- ❌ Don't run ruff/mypy/pytest — this is a TS/React project; the gates are `tsc` + `vitest`.

---

## Confidence Score

**9 / 10** for one-pass success. The change is ~5 lines of code + one JSDoc block +
4 small tests, all on a single well-understood class file whose exact state shape,
fallback DOM, and test conventions are quoted verbatim above. The only residual
risk is a TypeScript edge case around passing `ref` to a class element under
`@types/react@19`; the PRP provides the `createRef<FormErrorBoundary>()` pattern
and a supported cast fallback. The dependency boundary with S2 (do not touch the
renderer) is stated explicitly and checked in Level 4.
