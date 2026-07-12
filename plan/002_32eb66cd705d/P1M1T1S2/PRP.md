# PRP — P1.M1.T1.S2: Add `popToIndex` to the `useFormStack()` combined hook surface

---

## Goal

**Feature Goal**: Close MISMATCH 1 from the 0.2.0 conformance audit by making
`popToIndex` available on the **combined** `useFormStack()` hook surface — the
one place the audit found the implementation diverging from PRD §5.2 / delta §3.
`useFormStackActions()` already exposes `popToIndex`; `cancelForm` (its sibling
from the same delta) is already on both hooks. This task makes `popToIndex`
symmetric: `const { popToIndex } = useFormStack()` becomes valid and functional.

**Deliverable**: A small, purely-additive change to **one** source file
(`src/hooks/useFormStack.ts`) — add `popToIndex: (index: number) => void` (with
JSDoc) to the `UseFormStackReturn` interface and destructure/return it from the
`useFormStack()` body — **plus** a new test in
`src/hooks/__tests__/useFormStack.test.tsx` proving the surface is exposed and
wired through (calling it on a 2-deep stack cancels the deeper form). No other
files change.

**Success Definition**: `const { popToIndex } = useFormStack()` compiles and works;
`UseFormStackReturn` lists `{ stack, openForm, closeForm, popToIndex, cancelForm }`;
`npx tsc --noEmit` exits 0; `npx vitest run` is green (286 → 287+ tests, 26 files);
the new test asserts both exposure and functional wiring.

---

## User Persona (if applicable)

**Target User**: A consumer of the `geoform` library writing
`const { popToIndex } = useFormStack()` (e.g. a custom Breadcrumbs-like component
or a programmatic deep-link navigation handler).

**Use Case**: A component already reading stack state via the combined hook wants
to also navigate the stack without switching to the actions-only hook.

**User Journey**: `const { stack, popToIndex } = useFormStack()` → render
breadcrumbs → on click call `popToIndex(i)` → deeper forms cancel and the stack
shrinks. Today this is a TS error + runtime `undefined`; after this task it works.

**Pain Points Addressed**: PRD §5.2 documents `popToIndex` under `useFormStack()`,
but the code omitted it. Consumers following the PRD get `undefined` + a type error.
This removes that footgun with zero behavioral risk (the function already exists on
the actions context and is merely re-exported).

---

## Why

- **Conformance with the authoritative spec.** PRD §5.2 places `popToIndex` under
  `useFormStack()`, and `delta_prd.md` §3 states both hooks "surface cancelForm /
  popToIndex". The audit (`audit_findings.md` MISMATCH 1) flagged this as the
  single genuine divergence. This task closes it.
- **Internal consistency.** `cancelForm` (same delta, same kind of action) is on
  both hooks. There is no principled reason `popToIndex` is on the actions hook
  but not the combined hook. Symmetry removes a surprise.
- **Zero behavioral risk.** This is additive: the function already exists and is
  memoized on `FormStackActionsContext`. We are re-exporting a stable reference,
  not implementing new logic — so there is nothing new to get wrong at runtime.
- **Unblocks documentation.** P1.M2.T1.S2 will document `popToIndex` on both hooks;
  it needs the combined hook to actually have it.

---

## What

User-visible behavior: `useFormStack()` gains a `popToIndex(index: number)` member
that behaves identically to `useFormStackActions().popToIndex` (because it **is**
the same function reference). Calling it navigates to the form at `index`,
cancelling all deeper forms (each deeper form's deferred resolves `undefined`, so
its parent's `await openForm()` resolves `undefined`). It is a no-op for
out-of-range indices in production; in development an out-of-range index throws a
`RangeError`. Return type is `void` (matches PRD §5.2 and `FormStackActions`).

### Scope (EXACT — do only this)

1. **`src/hooks/useFormStack.ts`** — `UseFormStackReturn` interface: insert
   `popToIndex: (index: number) => void;` **between** `closeForm` and `cancelForm`,
   with a short JSDoc that mirrors the `cancelForm` entry and references `<Breadcrumbs/>`.
2. **`src/hooks/useFormStack.ts`** — `useFormStack()` body: destructure `popToIndex`
   from `useFormStackActions()` and include it in the returned object, ordered
   `{ stack, openForm, closeForm, popToIndex, cancelForm }`.
3. **`src/hooks/__tests__/useFormStack.test.tsx`** — add a test (following existing
   patterns) asserting (a) `useFormStack()` exposes a callable `popToIndex`, and
   (b) calling it on a 2-deep stack cancels the deeper form (stack 2 → 1). No mocks.

### Success Criteria

- [ ] `UseFormStackReturn` lists `popToIndex: (index: number) => void` between
      `closeForm` and `cancelForm`, with JSDoc.
- [ ] `useFormStack()` body destructures `popToIndex` from `useFormStackActions()`
      and returns it; final order `{ stack, openForm, closeForm, popToIndex, cancelForm }`.
- [ ] New test in `useFormStack.test.tsx` passes: surface exposed AND functional
      (2-deep stack → 1 after `popToIndex(0)`).
- [ ] `npx tsc --noEmit` exits 0.
- [ ] `npx vitest run` is all green (286 → 287+ across 26 files).
- [ ] No file other than the two above is modified. `void` return type is preserved
      (do NOT change to `Promise<void>` — see NOTE 2).

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** The function already exists and is provided
via context; this task only re-exports it. The PRP below names the exact lines,
the exact member ordering, the JSDoc style to mirror, the test file/patterns to
follow, and the verified validation commands. No inference is required.

### Documentation & References

```yaml
# MUST READ — the authoritative spec this implements
- file: PRD.md
  why: §5.2 places `popToIndex: (index: number): void` under useFormStack(). This
        task makes the code match that section. §6 (Breadcrumbs) is the consumer.
  section: §5.2 (popToIndex), §6 (Breadcrumbs use popToIndex)
  critical: Return type is `void` per §5.2 — do NOT make it Promise<void>.

# MUST READ — the gap being closed (with the exact recommended fix)
- file: plan/002_32eb66cd705d/architecture/audit_findings.md
  why: "MISMATCH 1" states the gap and gives the exact ~2-line fix (interface +
        destructure/return). NOTE 2 says the `void` type is correct — leave it.
  section: "MISMATCH 1 (genuine — FIX)", "NOTE 2 (not a fix)"
  gotcha: NOTE 2 is NOT a defect — the impl is async (Promise<void>) but the type
        is void; tsc accepts this (void-return rule). Keep the type void.

# PRIMARY TARGET — the file to edit
- file: src/hooks/useFormStack.ts
  why: Houses both UseFormStackReturn (interface) and useFormStack() (body).
  pattern: cancelForm already mirrors the actions hook here — follow that precedent:
        declare on the interface, destructure from useFormStackActions(), return it.
  gotcha: UseFormStackReturn uses rich JSDoc (see cancelForm at :99-110). Mirror that
        style for the new popToIndex member. Order members exactly as in the OUTPUT
        spec: stack, openForm, closeForm, popToIndex, cancelForm.

# SOURCE OF TRUTH — popToIndex's canonical type + JSDoc to mirror
- file: src/types/context.ts
  why: FormStackActions.popToIndex at :82 is the authoritative declaration + JSDoc
        (:71-76). Use the SAME signature `(index: number) => void` on UseFormStackReturn.
  pattern: The FormStackActions JSDoc says "Navigates to a specific form... All forms
        after the target index are cancelled (resolved with undefined). Used by
        Breadcrumbs." — adapt this for the combined-hook entry and reference <Breadcrumbs/>.

# ALREADY-WIRED SOURCE — confirms popToIndex is on the actions context
- file: src/hooks/useFormStackActions.ts
  why: useFormStackActions() returns the full FormStackActions (incl. popToIndex).
        useFormStack() delegates to it; destructuring popToIndex Just Works.
  gotcha: Nothing to change here — it already returns popToIndex.

# IMPL backing popToIndex (read-only — understand the behavior the test asserts)
- file: src/components/FormStackProvider.tsx
  why: popToIndex useCallback (:156) resolves each deeper entry's deferred with
        undefined (:189-194) then dispatches POP_TO_INDEX (:197). This is WHY the
        test can assert stack length 2 → 1 after popToIndex(0).
  gotcha: Dev-mode RangeError on out-of-range index (:159-163). The test should use
        a valid index (0) so it stays on the happy path.

# TEST PATTERNS — the file to extend
- file: src/hooks/__tests__/useFormStack.test.tsx
  why: Exact patterns to follow: local wrapper = <FormStackProvider>, renderHook +
        act, toHaveProperty('openForm'), typeof ... toBe('function').
  pattern: How to assert exposure (toHaveProperty / typeof) AND how to drive openForm
        in act(). Extend the same style for popToIndex.
  gotcha: Build a 2-deep stack by calling openForm() twice in act() (it pushes
        synchronously, then awaits) — see BreadcrumbNavigation.integration.test.tsx
        for the proven multi-level pattern.

# REFERENCE — multi-level stack setup (read-only example)
- file: src/__tests__/integration/BreadcrumbNavigation.integration.test.tsx
  why: Opens 3 nested forms then asserts breadcrumb navigation reduces the stack.
        Demonstrates openForm grows the stack without resolving the suspended promises.
  pattern: fireEvent.click open buttons in successive act() blocks; stack-length grows.

# REFERENCE — the consumer the JSDoc should cite
- file: src/components/Breadcrumbs.tsx
  why: Breadcrumbs (exported at :33) is the canonical consumer of popToIndex. The new
        UseFormStackReturn JSDoc should @see it.
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── PRD.md                                   # authoritative spec (READ-ONLY — §5.2)
├── package.json                             # scripts: test=vitest run, type-check=tsc --noEmit
├── tsconfig.json
├── src/
│   ├── components/
│   │   ├── FormStackProvider.tsx            # popToIndex impl (:156) — read-only here
│   │   └── Breadcrumbs.tsx                  # canonical popToIndex consumer (:33)
│   ├── hooks/
│   │   ├── useFormStack.ts                  # ← EDIT: interface (:13-111) + body (:157-161)
│   │   ├── useFormStackActions.ts           # already returns popToIndex (no change)
│   │   ├── useFormStackState.ts
│   │   └── __tests__/
│   │       └── useFormStack.test.tsx        # ← EDIT: add popToIndex test
│   ├── types/
│   │   └── context.ts                       # FormStackActions.popToIndex (:82) — no change
│   └── index.ts                             # public exports (no change)
└── plan/002_32eb66cd705d/
    ├── architecture/audit_findings.md       # MISMATCH 1 + recommended fix
    ├── delta_prd.md                         # §3 both hooks surface cancelForm/popToIndex
    └── P1M1T1S2/                            # ← THIS PRP lives here
```

### Desired Codebase tree with files to be added/changed

```bash
src/hooks/useFormStack.ts                    # MODIFIED — +1 interface member (+JSDoc), 2 line edits in body
src/hooks/__tests__/useFormStack.test.tsx    # MODIFIED — +1 describe/it block (or extend existing)
# (no new files)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Return type MUST stay `void` (NOT Promise<void>).
//   FormStackActions.popToIndex is typed `(index: number) => void` (context.ts:82)
//   and PRD §5.2 says void. The impl is `async` (returns Promise<void>); TS accepts
//   assigning a Promise-returning fn to a void-returning type (void-return rule).
//   tsc is clean TODAY. Changing UseFormStackReturn to Promise<void> would (a)
//   diverge from the spec and (b) be the only place doing so. KEEP IT `void`.
//   (This is audit NOTE 2 — explicitly "no action".)

// CRITICAL: Member ordering matters for the deliverable contract.
//   Final UseFormStackReturn order: { stack, openForm, closeForm, popToIndex, cancelForm }.
//   Insert popToIndex BETWEEN closeForm and cancelForm — in BOTH the interface and
//   the returned object literal.

// GOTCHA: useFormStack() delegates to useFormStackActions() — do NOT re-implement.
//   `const { ..., popToIndex, ... } = useFormStackActions()` then return it. This
//   preserves reference stability (the actions context memoizes popToIndex).

// GOTCHA: openForm() pushes synchronously then awaits a deferred. So in the test,
//   calling openForm() twice inside act() grows the stack to 2 WITHOUT resolving.
//   This is the established pattern (see BreadcrumbNavigation.integration.test.tsx).
//   Use it to build the 2-deep stack the test needs.

// GOTCHA: popToIndex throws a RangeError in dev (NODE_ENV==='development') for
//   out-of-range indices (FormStackProvider.tsx:159-163). The test must use a
//   VALID index (0 on a 2-deep stack) to stay on the happy path.

// CRITICAL: This is a research/impl PRP for a CODE change (unlike S1 which was a
//   doc artifact). Editing src/hooks/useFormStack.ts and its test IS the deliverable.
//   But NEVER touch PRD.md, tasks.json, prd_snapshot.md, or README.md (README is
//   P1.M2.T1.S2's job).
```

---

## Implementation Blueprint

### Data models and structure

No new data models. The single type change is one interface member. Its shape is
already fixed by `FormStackActions.popToIndex` (`src/types/context.ts:82`):

```typescript
// EXACT signature to add to UseFormStackReturn (src/hooks/useFormStack.ts).
// MUST be `void` to match PRD §5.2 and FormStackActions — see NOTE 2.
popToIndex: (index: number) => void;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY UseFormStackReturn interface (src/hooks/useFormStack.ts)
  - LOCATE: `export interface UseFormStackReturn {` at line 13; closing `}` at line 111.
  - INSERT a new member BETWEEN `closeForm` (ends ~line 108) and `cancelForm`
        (starts with its JSDoc ~line 99... NOTE: cancelForm's JSDoc begins before
        line 99; the member `cancelForm: () => Promise<void>;` is at line 110).
  - EXACT member to add (signature + JSDoc mirroring the cancelForm entry style,
        referencing <Breadcrumbs/>):
      /**
       * Navigates to a specific form in the stack by index, cancelling all deeper
       * forms (each deeper form's deferred resolves with `undefined`, so its
       * parent's `await openForm()` resolves with `undefined`).
       *
       * Used by `<Breadcrumbs/>` for direct navigation to an earlier form. In
       * development an out-of-range index throws a `RangeError`; in production it
       * is a no-op.
       *
       * @param index - Zero-based index of the target form
       * @see {@link Breadcrumbs} - Component that calls this on breadcrumb clicks
       */
      popToIndex: (index: number) => void;
  - PLACEMENT: immediately before the existing `cancelForm` JSDoc/member, so the
        interface reads ...closeForm, popToIndex, cancelForm.
  - FOLLOW pattern: the rich JSDoc already on `cancelForm` (UseFormStackReturn)
        and the canonical JSDoc on `FormStackActions.popToIndex` (context.ts:71-76).
  - GOTCHA: keep the type `void` — do NOT use Promise<void>.

Task 2: MODIFY useFormStack() body (src/hooks/useFormStack.ts, lines 157-161)
  - CHANGE line 158 from:
        const { openForm, closeForm, cancelForm } = useFormStackActions();
    TO:
        const { openForm, closeForm, popToIndex, cancelForm } = useFormStackActions();
  - CHANGE line 160 from:
        return { stack, openForm, closeForm, cancelForm };
    TO:
        return { stack, openForm, closeForm, popToIndex, cancelForm };
  - ORDER: returned object must be { stack, openForm, closeForm, popToIndex, cancelForm }.
  - DEPENDENCIES: none beyond Task 1 (same file). Do both edits together.
  - GOTCHA: do NOT touch line 157 (`const { stack } = useFormStackState();`).

Task 3: ADD test(s) to src/hooks/__tests__/useFormStack.test.tsx
  - PATTERN: follow the existing file — vitest describe/it/expect, renderHook + act
        from @testing-library/react, the local `wrapper` (REAL FormStackProvider, no mocks).
  - ADD at minimum:
      (a) an exposure assertion in the existing "return type structure" / surface
          block: `expect(result.current).toHaveProperty('popToIndex')` and
          `expect(typeof result.current.popToIndex).toBe('function')`.
      (b) a NEW it() that builds a 2-deep stack and proves popToIndex is wired through:
          - open 2 forms via `act(() => { result.current.openForm({ id, component: () => null }) })`
            (call twice; stack grows to 2 because openForm pushes before awaiting).
          - assert `result.current.stack.toHaveLength(2)`.
          - call `await act(async () => { result.current.popToIndex(0); })`.
          - assert `result.current.stack.toHaveLength(1)` (the deeper form cancelled).
          - (optional but recommended) assert popToIndex reference identity:
            render useFormStackActions() in the same wrapper and check
            `useFormStack().popToIndex === actions.popToIndex` — proves it is the
            same function, not a stub. If awkward in one renderHook, the functional
            2→1 assertion already proves wiring; skip the identity check.
  - NAMING: it('should return working popToIndex function') and/or
        it('should expose popToIndex that cancels deeper forms when called').
  - MOCK: NONE. Use the real FormStackProvider via the existing `wrapper`.
  - COVERAGE: positive path (valid index 0 on a 2-deep stack). No need to test
        out-of-range dev-mode RangeError (already covered in FormStackProvider.test.tsx).
  - PLACEMENT: inside the existing top-level `describe('useFormStack', ...)`,
        alongside the "return type structure" and "reference stability" blocks.

Task 4: VALIDATE (no edits — run commands)
  - RUN: `npx tsc --noEmit`            → expect exit 0.
  - RUN: `npx vitest run`              → expect 287+ passed across 26 files.
  - TARGETED: `npx vitest run src/hooks/__tests__/useFormStack.test.tsx` → all green.
  - If anything fails, READ the output and fix the implementation (not the spec).
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: adding an action member to UseFormStackReturn — EXACTLY what was done
// for cancelForm. The interface member + JSDoc, then destructure + return.
// (src/hooks/useFormStack.ts)

// --- Interface (insert before cancelForm) ---
export interface UseFormStackReturn {
  stack: readonly StackEntry[];
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  closeForm: () => void;
  /**
   * Navigates to a specific form in the stack by index, cancelling all deeper
   * forms ... (see Task 1 for the full JSDoc).
   * @see {@link Breadcrumbs}
   */
  popToIndex: (index: number) => void;   // ← NEW — type is `void` (matches PRD §5.2)
  /** ... existing cancelForm JSDoc ... */
  cancelForm: () => Promise<void>;
}

// --- Body (destructure + return) ---
export function useFormStack(): UseFormStackReturn {
  const { stack } = useFormStackState();
  const { openForm, closeForm, popToIndex, cancelForm } = useFormStackActions(); // +popToIndex
  return { stack, openForm, closeForm, popToIndex, cancelForm };                 // +popToIndex
}
```

```typescript
// PATTERN: the functional wiring test (src/hooks/__tests__/useFormStack.test.tsx)
it('should expose a working popToIndex that cancels deeper forms', async () => {
  const { result } = renderHook(() => useFormStack(), { wrapper });

  // Build a 2-deep stack (openForm pushes synchronously, then awaits)
  act(() => { result.current.openForm({ id: 'form-1', component: () => null }); });
  act(() => { result.current.openForm({ id: 'form-2', component: () => null }); });
  expect(result.current.stack).toHaveLength(2);

  // popToIndex(0) cancels the deeper form
  await act(async () => { result.current.popToIndex(0); });
  expect(result.current.stack).toHaveLength(1);
});
```

### Integration Points

```yaml
TYPE SYSTEM:
  - UseFormStackReturn (src/hooks/useFormStack.ts) gains popToIndex: (index:number)=>void.
  - Source type FormStackActions.popToIndex (src/types/context.ts:82) is unchanged.
  - Assignability is already proven: the async impl is assignable to the void type
    (tsc clean today). No tsconfig changes.

PUBLIC API (src/index.ts):
  - NO change needed. useFormStack is already exported; its return type widening is
    purely additive and transparent to existing consumers.

DOCUMENTATION (README):
  - OUT OF SCOPE here. P1.M2.T1.S2 documents popToIndex across action tables. Do NOT
    edit README.md in this subtask. (Mode A: the only doc is the JSDoc in Task 1.)

TESTS:
  - Add to src/hooks/__tests__/useFormStack.test.tsx only. No new test files.
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
cd /home/dustin/projects/geoform
npx tsc --noEmit                # MUST exit 0 (no type errors)
# Expected: no output / exit 0. If errors, READ them — likely a typo in the signature
# or wrong member placement. The `void` type must NOT produce an error (void-return rule).

# (No ruff/mypy here — this is a TypeScript/React + vitest project. tsc IS the type gate.)
```

### Level 2: Unit Tests (Component Validation)

```bash
cd /home/dustin/projects/geoform
# Targeted: run the file you edited first
npx vitest run src/hooks/__tests__/useFormStack.test.tsx
# Expected: all tests in that file pass, INCLUDING the new popToIndex test(s).

# Then the sibling actions hook test (regression — must stay green):
npx vitest run src/hooks/__tests__/useFormStackActions.test.tsx
# Expected: green (unchanged).
```

### Level 3: Integration Testing (System Validation)

```bash
cd /home/dustin/projects/geoform
# Full suite — confirms no regressions from the surface widening.
npx vitest run
# Expected: 287+ passed across 26 files (was 286/286). If 286, the new test wasn't
# added/discovered — re-check Task 3. If a PRE-EXISTING test fails, your edit broke
# something (you likely changed behavior or member order) — fix it.

# Spot-check popToIndex still works end-to-end via the consumer path (breadcrumb nav):
npx vitest run src/__tests__/integration/BreadcrumbNavigation.integration.test.tsx
npx vitest run src/components/__tests__/Breadcrumbs.test.tsx
# Expected: green (these exercise popToIndex through the actions context; unaffected).
```

### Level 4: Creative & Domain-Specific Validation

```bash
cd /home/dustin/projects/geoform
# Confirm the deliverable contract literally — grep the final surface.
grep -n "popToIndex" src/hooks/useFormStack.ts
# Expected: at least 3 hits — (1) the interface member line, (2) the destructure,
# (3) the return. Plus JSDoc lines mentioning popToIndex/Breadcrumbs.

# Confirm UseFormStackReturn member order matches the OUTPUT spec:
sed -n '13,111p' src/hooks/useFormStack.ts | grep -nE "stack:|openForm:|closeForm:|popToIndex:|cancelForm:"
# Expected order: stack, openForm, closeForm, popToIndex, cancelForm.

# Confirm nothing else changed:
git status --short
# Expected: ONLY src/hooks/useFormStack.ts and src/hooks/__tests__/useFormStack.test.tsx
# modified. NOTHING under PRD.md, tasks.json, prd_snapshot.md, README.md, or other src/.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npx tsc --noEmit` exits 0.
- [ ] `npx vitest run` is all green (286 → 287+ across 26 files).
- [ ] Targeted run `npx vitest run src/hooks/__tests__/useFormStack.test.tsx` passes.
- [ ] Level 4 grep confirms `popToIndex` appears in interface + destructure + return.
- [ ] Level 4 grep confirms member order: stack, openForm, closeForm, popToIndex, cancelForm.

### Feature Validation

- [ ] `UseFormStackReturn` now lists `popToIndex: (index: number) => void` (with JSDoc).
- [ ] `useFormStack()` destructures `popToIndex` from `useFormStackActions()` and returns it.
- [ ] New test asserts surface exposure (`toHaveProperty('popToIndex')` / typeof function).
- [ ] New test asserts functional wiring (2-deep stack → length 1 after `popToIndex(0)`).
- [ ] `void` return type preserved (NOT changed to `Promise<void>` — NOTE 2).
- [ ] `const { popToIndex } = useFormStack()` is valid TypeScript (compiles).

### Code Quality Validation

- [ ] JSDoc on the new member mirrors the `cancelForm` entry style and `@see`s `<Breadcrumbs/>`.
- [ ] Member placement follows the existing interface conventions (JSDoc above each member).
- [ ] Returned object literal order matches the interface order.
- [ ] Test follows existing file patterns (local `wrapper`, renderHook + act, no mocks).
- [ ] No anti-patterns (no re-implementation of popToIndex logic; no new files; no mocks).

### Documentation & Deployment

- [ ] JSDoc added on `UseFormStackReturn.popToIndex` (Mode A — rides with the work).
- [ ] README.md NOT touched (deferred to P1.M2.T1.S2).
- [ ] No new environment variables or config.

---

## Anti-Patterns to Avoid

- ❌ Don't change `popToIndex`'s type to `Promise<void>`. It is `void` by spec (PRD §5.2)
  and by `FormStackActions` (context.ts:82). The async impl is assignable to `void`
  (tsc clean). This is audit NOTE 2 — explicitly "no action".
- ❌ Don't re-implement `popToIndex` logic inside `useFormStack()`. Destructure it from
  `useFormStackActions()` so the reference stays stable and behavior stays identical.
- ❌ Don't mock the provider in the new test. Use the real `FormStackProvider` via the
  existing local `wrapper` (the file already does this — follow it).
- ❌ Don't change member order. The deliverable contract fixes the order as
  `{ stack, openForm, closeForm, popToIndex, cancelForm }`.
- ❌ Don't edit `README.md`, `PRD.md`, `tasks.json`, `prd_snapshot.md`, or any other
  `src/` file. Only `useFormStack.ts` and its test change.
- ❌ Don't skip the functional part of the test. Asserting only `typeof popToIndex === 'function'`
  does NOT prove it is wired through — a stub would pass that. Assert the stack shrinks 2→1.
- ❌ Don't add new test files. Extend the existing `useFormStack.test.tsx`.

---

## Confidence Score

**10 / 10** for one-pass success. This is a deliberately tiny, purely-additive
change (one interface member + two one-line edits + one test) with the exact
recommended fix already specified in `audit_findings.md` MISMATCH 1. Every line
number, the member ordering, the JSDoc style to mirror, the test patterns to
follow, and the verified validation commands are captured above. The function
already exists and is memoized on the actions context — we are only re-exporting
it — so there is no new runtime logic to get wrong. The only real care points are
(1) keep the type `void` and (2) assert functional wiring, both of which are
called out explicitly.
