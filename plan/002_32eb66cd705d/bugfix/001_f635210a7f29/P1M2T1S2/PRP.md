# PRP — P1.M2.T1.S2: Update `useFormStackViewport` hook to map internal→public and fix `FormStackViewport` + tests

---

## Goal

**Feature Goal**: Close the **runtime** half of Issue 3 (internal-type leakage from
`useFormStackViewport()`). The sibling subtask **P1.M2.T1.S1 has already landed** the
*type* fix (it split `FormStackViewportValue` into an internal
`FormStackViewportContextValue` + a sanitized public `FormStackViewportValue`, retyped
the context, and re-exported both — all verified in the current source). What remains is
the *runtime* fix: the hook still `return useContext(FormStackViewportContext)` raw, so
the returned object still physically carries `component`, `deferred`, `confirmOnCancel`,
and `onCancelRequest`. This PRP rewrites the hook to project the internal context value
to the sanitized public shape (`{ id, label }[]` + `onClose` only), rewrites the test
file that S1 deliberately left broken (8 `tsc` errors, all confined to that one test
file), and rewrites the hook's JSDoc + example (Mode A) to drop the now-false
"assignable to `FormStackRendererProps` / spreadable" claim.

**Deliverable**: Edits to **two** files only:
1. `src/hooks/useFormStackViewport.ts` — rewrite the function body to `useMemo`-map
   internal→public; rewrite the JSDoc + example (Mode A).
2. `src/hooks/__tests__/useFormStackViewport.test.tsx` — fix the 3 affected tests (1
   surgical assertion fix + 2 full test rewrites) + add `FormStackViewportContextValue`
   to the type import.
`src/components/FormStackViewport.tsx` is **verified unchanged** (it already compiles
cleanly after S1 — the context carries the internal value which is structurally identical
to `FormStackRendererProps`, so its `<FormStackRenderer {...viewport}/>` spread works).

**Success Definition**:
- `useFormStackViewport()` returns an object whose entries carry **only** `{ id, label }`
  and whose value carries **only** `{ stack, onClose }` — no `component`, `deferred`,
  `confirmOnCancel`, or `onCancelRequest` reachable at runtime or by type.
- `npx tsc --noEmit` exits **0** (FULL green — S2 fixes the last 8 errors S1 left).
- `npx vitest run` is **all green**, including the rewritten test file.
- `git status --short` shows exactly the two files above (`FormStackViewport.tsx` is NOT
  in the diff).

---

## User Persona (if applicable)

**Target User**: A `geoform` consumer using the low-level `useFormStackViewport()` hook to
read the open forms for custom rendering (e.g. a host header/summary), and the library
maintainers who must honor PRD §10.1's "no internal-type leakage" guarantee.

**Use Case**: A consumer calls `const vp = useFormStackViewport()` and reads `vp.stack` to
render a list of open-form labels. They must NOT be handed `component`/`deferred`, which
would let them hijack a form's `openForm()` promise resolution
(`vp.stack[0].deferred.resolve(attackerValue)`).

**User Journey**: `useFormStackViewport()` → `vp.stack` is `readonly StackEntry[]`
(`{ id, label? }`) and the runtime objects contain only those keys → `vp.stack[0].deferred`
is BOTH a type error AND physically absent.

**Pain Points Addressed**: Before this fix, the public hook handed consumers the raw
`InternalStackEntry` internals — a real (if minor) encapsulation/security gap proven by
the adversarial QA pass (Issue 3). S1 closed the type hole; S2 closes the runtime hole.

---

## Why

- **Honors PRD §10.1.** That section promises the hostable-viewport exports are
  "through the public API (**no internal-type leakage**)". Issue 3 proved the low-level
  hook violated this at both the type level (fixed by S1) and the runtime level (this
  PRP). A consumer could still `vp.stack[0].deferred.resolve(hijackedValue)` at runtime
  even after S1, because the hook returned the raw context object.
- **Makes the type honest.** After S1 the *type* says `stack: readonly StackEntry[]`, but
  the *runtime object* still has `component`/`deferred`. A consumer using `as any` or
  runtime reflection could still reach the internals. S2 makes the runtime match the type.
- **Low risk.** The change is a `useMemo` projection in one hook + a test rewrite. The
  `<FormStackViewport/>` component path is untouched (it reads the internal context
  directly, not the hook). No provider, renderer, or reducer changes.

---

## What

The hook stops returning the raw context value and instead projects it:

```ts
export function useFormStackViewport(): FormStackViewportValue | null {
  const internal = useContext(FormStackViewportContext);
  return useMemo(() => {
    if (!internal) return null;
    return {
      stack: internal.stack.map(({ id, label }) => ({ id, label })),
      onClose: internal.onClose,
    };
  }, [internal]);
}
```

The returned object carries **only** `{ stack, onClose }`; each stack entry carries
**only** `{ id, label }`. `component`, `deferred`, `confirmOnCancel`, and
`onCancelRequest` are dropped at runtime. The `<FormStackViewport/>` component is
unaffected (it consumes the internal context directly, not this hook).

### Scope (EXACT — do only this)

1. **`src/hooks/useFormStackViewport.ts`** — add `useMemo` to the React import; rewrite the
   function body to the mapped/memoized projection above; rewrite the JSDoc + `@example`
   (Mode A) to describe the sanitized surface and show only `{ stack, onClose }` access
   (drop the false "assignable to `FormStackRendererProps`" claim and the spreading
   example).
2. **`src/hooks/__tests__/useFormStackViewport.test.tsx`** — add
   `FormStackViewportContextValue` to the type import; fix the
   "returns the viewport value when a form is open" test (remove the `confirmOnCancel`
   assertion, replace the `onCancelRequest` assertion with an absence check); replace the
   "exposes internal entry fields (component/deferred)" test with a sanitized-surface
   test; replace the "FormStackViewportValue is assignable to FormStackRendererProps"
   type-level test with two conditional-type guards (internal IS assignable; public is NOT).

### Success Criteria

- [ ] `useFormStackViewport()` body uses `useMemo` and projects `internal.stack` to
      `{ id, label }[]` (no `component`/`deferred`/`confirmOnCancel` in the output).
- [ ] `npx tsc --noEmit` exits **0** (full green — was exit 2 before S2).
- [ ] `npx vitest run` is all green, including the rewritten test file.
- [ ] The rewritten tests assert: entry keys are exactly `['id','label']`; value keys are
      exactly `['onClose','stack']`; `'onCancelRequest' in value` is `false`; the public
      type is NOT assignable to `FormStackRendererProps` (compile-guarded).
- [ ] The hook JSDoc + example describe/show only the sanitized `{ stack, onClose }` access.
- [ ] `git status --short` lists exactly `src/hooks/useFormStackViewport.ts` and
      `src/hooks/__tests__/useFormStackViewport.test.tsx`.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** Both target files are quoted verbatim (exact
current text + exact replacement text) in the Implementation Blueprint. The current `tsc`
errors are enumerated (8, all in the test file). The `noUncheckedIndexedAccess: true`
tsconfig fact (which forces `!`/`?.` on array indexing in tests) is captured. The
conditional-type guard pattern for "not assignable" is explained. The unchanged
`FormStackViewport.tsx` is verified clean. No inference is required.

### Documentation & References

```yaml
# MUST READ — the authoritative fix this implements (step 4 is S2's hook mapping; step 5
# confirms FormStackViewport needs no change; "Test Impact" enumerates the test changes)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/issue_analysis.md
  why: §Issue 3 "Fix Strategy" steps 4-5 + "Test Impact" prescribe exactly the hook
        mapping, the no-change viewport verification, and the two test rewrites.
  section: "## Issue 3 (Minor) ... Fix Strategy", "#### Test Impact"
  critical: The mapping uses `useMemo` keyed on the context value. The test impact says
        the "exposes internal entry fields" test must assert the SANITIZED surface, and the
        "assignable to FormStackRendererProps" test must change because the public type is
        intentionally NOT spreadable anymore.

# MUST READ — the S1 contract (what already exists when S2 starts)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/P1M2T1S1/PRP.md
  why: S1 ALREADY LANDED. Its deliverables (FormStackViewportContextValue @internal,
        sanitized FormStackViewportValue, retyped context, both re-exported from
        src/types/index.ts) are the INPUTS to S2. S1 explicitly DEFERRED the hook body
        + the test file to S2 (the "S1→S2 handoff"). Do not re-edit S1's files.
  section: "Integration Points → HANDOFF TO P1.M2.T1.S2"

# MUST READ — the test conventions + the exact sanitized-surface test outline
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/test_patterns.md
  why: "Patterns Required for New Tests → Issue 3: Sanitized Viewport Value Test" gives
        the 5-step outline S2's test must follow (open a form, read the hook value, assert
        only {id,label}, assert onClose is a function, assert no onCancelRequest).
  section: "### Issue 3: Sanitized Viewport Value Test"

# PRIMARY EDIT TARGET #1 — the hook (current body leaks at runtime; JSDoc is stale)
- file: src/hooks/useFormStackViewport.ts
  why: Currently `return useContext(FormStackViewportContext)` (raw internal value).
        Rewrite to the useMemo-mapped projection. The JSDoc FALSELY claims the return is
        "assignable to FormStackRendererProps" and the example spreads it onto
        <FormStackRenderer/> — both now FALSE (Mode A rewrite required).
  pattern: Import `useMemo` alongside `useContext`; keep the `FormStackViewportContext`
        import from '../context' and the `FormStackViewportValue` type import from '../types'.
  gotcha: tsconfig has noUncheckedIndexedAccess:true — N/A in the hook (the map callback
        destructures), but be aware for tests.

# PRIMARY EDIT TARGET #2 — the test file (8 tsc errors, all here — S2's scope)
- file: src/hooks/__tests__/useFormStackViewport.test.tsx
  why: S1 deliberately left this broken (the S1→S2 handoff). 3 tests need changes (1
        surgical, 2 full rewrites) + 1 import addition. Exact current text quoted in the
        Implementation Blueprint.
  pattern: Uses renderHook + act from @testing-library/react; wrapper =
        <FormStackProvider autoRender={false}>; StubForm; type-level checks via literal consts.
  gotcha: noUncheckedIndexedAccess:true → `value.stack[0]` is `StackEntry | undefined`.
        Use `value.stack[0]!` (after a length/define assertion) for Object.keys() calls,
        or `?.` for property reads.

# NO-CHANGE VERIFICATION — confirmed 0 tsc errors after S1 (read to confirm, do NOT edit)
- file: src/components/FormStackViewport.tsx
  why: Reads `useContext(FormStackViewportContext)` (internal type) and spreads onto
        <FormStackRenderer {...viewport}/>. FormStackViewportContextValue is structurally
        identical to FormStackRendererProps → spread compiles. Verified 0 errors.
  critical: Work item §3b says add an explicit type annotation ONLY if type inference
        fails. It does NOT fail. Do NOT edit this file.

# THE ASSIGNABILITY LINCHPINS (read to understand, do not edit)
- file: src/types/stack.ts
  why: `export interface InternalStackEntry<T> extends StackEntry` — InternalStackEntry is
        a SUBTYPE of StackEntry. This is why (a) the raw-context hook still compiled under
        S1, and (b) `FormStackViewportContextValue` IS assignable to `FormStackRendererProps`
        (the internal type-level test asserts this).
- file: src/components/FormStackRenderer.tsx
  why: `FormStackRendererProps` (lines 6-12) = `{ stack: InternalStackEntry<unknown>[];
        onClose; onCancelRequest }` — structurally identical to
        FormStackViewportContextValue. Confirms the internal-assignable assertion + the
        no-change viewport.

# CURRENT TYPE STATE (S1 landed) — read to confirm shapes, do NOT edit
- file: src/types/context.ts
  why: Contains both FormStackViewportContextValue (@internal) and the sanitized
        FormStackViewportValue. S2 consumes these as-is.
- file: src/context/FormStackContext.ts
  why: FormStackViewportContext = createContext<FormStackViewportContextValue | null>(null).
        S2 consumes this as-is.

# OPTIONAL / OUT OF SCOPE — stale comment, do NOT fix here
- file: src/index.ts
  why: Line ~402 JSDoc on the public FormStackViewportValue re-export still says
        "Structurally identical to FormStackRendererProps" — now FALSE. S1 flagged this
        OPTIONAL/deferred. S2's DOCS scope (work item §5) is ONLY the hook's own JSDoc.
  critical: Do NOT expand scope to fix this comment — leave it for P1.M3 (changeset doc sync).
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── src/
│   ├── hooks/
│   │   ├── useFormStackViewport.ts                # ← EDIT: body (useMemo map) + JSDoc + example
│   │   └── __tests__/
│   │       └── useFormStackViewport.test.tsx      # ← EDIT: import + 3 tests
│   ├── components/
│   │   ├── FormStackViewport.tsx                  # READ-ONLY (verified 0 errors; NO change)
│   │   └── FormStackRenderer.tsx                  # READ-ONLY (FormStackRendererProps shape)
│   ├── types/
│   │   ├── context.ts                             # READ-ONLY (S1 landed: split types)
│   │   └── stack.ts                               # READ-ONLY (InternalStackEntry extends StackEntry)
│   └── context/
│       └── FormStackContext.ts                    # READ-ONLY (S1 landed: retyped context)
├── tsconfig.json                                  # READ-ONLY (strict + noUncheckedIndexedAccess)
└── plan/002_32eb66cd705d/bugfix/001_f635210a7f29/
    ├── architecture/issue_analysis.md             # §Issue 3 Fix Strategy (authoritative)
    ├── architecture/test_patterns.md              # §Issue 3 test outline
    └── P1M2T1S2/                                   # ← THIS PRP lives here
```

### Desired Codebase tree with files to be changed

```bash
src/hooks/useFormStackViewport.ts                  # MODIFIED — useMemo map + JSDoc/example rewrite
src/hooks/__tests__/useFormStackViewport.test.tsx  # MODIFIED — import + 3 test fixes
# (no new files; FormStackViewport.tsx, types/*, context/* are UNCHANGED)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: S1 has ALREADY LANDED. Do NOT edit src/types/context.ts,
//   src/types/index.ts, or src/context/FormStackContext.ts — those are S1's (done).
//   Editing them would conflict with the landed S1 and is out of scope.

// CRITICAL: tsconfig has `noUncheckedIndexedAccess: true`. In the TEST file,
//   `value.stack[0]` is typed `StackEntry | undefined`. For Object.keys(entry) (which
//   needs a definite object), write `const entry = value.stack[0]!;` after a length
//   assertion. For property reads, `?.` is fine. The hook body is unaffected (the map
//   callback destructures, so no index access).

// CRITICAL: FormStackViewport.tsx must NOT be edited. Verified: 0 tsc errors after S1.
//   The context carries FormStackViewportContextValue (structurally identical to
//   FormStackRendererProps), so <FormStackRenderer {...viewport}/> still compiles.
//   Work item §3b: only add an annotation IF inference fails — it doesn't.

// GOTCHA: useMemo deps must be `[internal]` (the context value), NOT `[internal.stack]`.
//   The provider recreates the context value (its viewportValue useMemo) when the stack
//   changes, so `[internal]` captures every stack change. Referential stability is
//   preserved when nothing changes (the memo returns the same projected object) → no
//   needless consumer re-render. Matches issue_analysis.md step 4.

// GOTCHA: The mapped entry `{ id, label }` must destructure BOTH id and label from the
//   internal entry (label is optional). Do NOT spread the internal entry (`{...entry}`)
//   — that would re-leak component/deferred/confirmOnCancel at runtime. Explicit
//   destructuring is the whole point.

// GOTCHA: onCancelRequest is intentionally NOT on the returned object. The public
//   FormStackViewportValue (S1) omits it; S2's projection must also omit it. Do not
//   "forward it for convenience" — that re-opens the leak.

// GOTCHA: The "not assignable" type test cannot use expect().not.toAssignTo() —
//   assignability is compile-only. Use the conditional-type + literal-const idiom:
//     type PublicAssignable = FormStackViewportValue extends FormStackRendererProps ? true : false;
//     const publicAssignable: PublicAssignable = false;   // compile-error if leak returns
//     expect(publicAssignable).toBe(false);               // runtime assertion
//   This both fails-to-compile on regression AND asserts at runtime.

// GOTCHA: This is a TS/React project. The validation gates are `npx tsc --noEmit` and
//   `npx vitest run`. Do NOT run ruff/mypy/pytest/uv.
```

---

## Implementation Blueprint

### Data models and structure

No new data models. The hook returns an already-defined type
(`FormStackViewportValue`, S1). The only structural change is the **projection** inside
the hook that builds the sanitized object at runtime:

```typescript
// src/hooks/useFormStackViewport.ts — the projection (builds a NEW plain object)
return {
  stack: internal.stack.map(({ id, label }) => ({ id, label })),  // drops component/deferred/confirmOnCancel
  onClose: internal.onClose,                                       // forwards the safe callback
};
// onCancelRequest is intentionally DROPPED (public type omits it).
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EDIT src/hooks/useFormStackViewport.ts — rewrite the hook body (close the RUNTIME leak)
  - LOCATE the current function (after its JSDoc):
        export function useFormStackViewport(): FormStackViewportValue | null {
          return useContext(FormStackViewportContext);
        }
  - REPLACE the body with the useMemo-mapped projection (see "Exact Replacement" §A below).
  - CHANGE the React import (line 1) from `import { useContext } from 'react';` to
        `import { useContext, useMemo } from 'react';`.
  - KEEP: `import { FormStackViewportContext } from '../context';` and
          `import type { FormStackViewportValue } from '../types';` UNCHANGED.
  - GOTCHA: deps `[internal]` (the context value), NOT `[internal.stack]`.
  - GOTCHA: destructure `{ id, label }` explicitly — do NOT spread the internal entry.

Task 2: EDIT src/hooks/useFormStackViewport.ts — rewrite the JSDoc + @example (Mode A)
  - LOCATE the current JSDoc block (the big /** ... */ above the function). It currently
        FALSELY says: "Returns the props required by FormStackRenderer (internal stack,
        onClose, onCancelRequest)", "assignable to FormStackRendererProps", and the example
        spreads onto <FormStackRenderer {...viewport}/>. ALL of that is now FALSE.
  - REPLACE the entire JSDoc + @example with the sanitized-surface JSDoc in
        "Exact Replacement" §A below (describes { stack, onClose } only; example renders
        a summary list using only entry.id/entry.label; drops the spread/assignable claim).
  - CRITICAL (Mode A): the example must show ONLY { stack, onClose } access — no spreading
        onto <FormStackRenderer/>, no onCancelRequest, no entry.component.

Task 3: EDIT src/hooks/__tests__/useFormStackViewport.test.tsx — add the type import
  - LOCATE the type import (lines ~9-12):
        import type {
          FormStackViewportValue,
          FormProps,
        } from '../../types';
  - REPLACE with (add FormStackViewportContextValue):
        import type {
          FormStackViewportContextValue,
          FormStackViewportValue,
          FormProps,
        } from '../../types';
  - WHY: the rewritten type-level test (Task 6) constructs a FormStackViewportContextValue.

Task 4: EDIT src/hooks/__tests__/useFormStackViewport.test.tsx — fix "returns the viewport value" test
  - LOCATE the test "returns the viewport value when a form is open" (~lines 46-63).
  - REMOVE the assertion: `expect(value.stack[0]?.confirmOnCancel).toBe(true);` (confirmOnCancel
        is no longer on the public entry).
  - REPLACE the assertion `expect(typeof value.onCancelRequest).toBe('function');` with:
        expect('onCancelRequest' in value).toBe(false);
  - KEEP: the openForm({ id, component, label, confirmOnCancel: true }) call (confirmOnCancel
        is a valid OpenFormOptions field; keeping it proves the flag stays internal), the
        id/label/onClose assertions, and the not.toBeNull() guard.
  - See "Exact Replacement" §B below for the full before/after.

Task 5: EDIT src/hooks/__tests__/useFormStackViewport.test.tsx — replace "exposes internal entry fields" test
  - LOCATE the test "exposes internal entry fields (component/deferred) without leaking types"
        (~lines 65-88). This entire test ASSERTS THE LEAK EXISTS — it must be replaced.
  - REPLACE it (whole `it(...)` block) with a sanitized-surface test that asserts:
        entry keys are exactly ['id','label']; internal fields ('component','deferred',
        'confirmOnCancel') are absent; value keys are exactly ['onClose','stack'];
        'onCancelRequest' is absent; onClose is a function. See "Exact Replacement" §C.
  - GOTCHA: noUncheckedIndexedAccess → use `const entry = value.stack[0]!;` for Object.keys().

Task 6: EDIT src/hooks/__tests__/useFormStackViewport.test.tsx — replace the type-level test
  - LOCATE describe('type-level contracts') > it('FormStackViewportValue is assignable to
        FormStackRendererProps') (~lines 91-103). This asserts the public value IS spreadable
        onto the renderer — now FALSE (that was the leak).
  - REPLACE the whole `it(...)` with TWO tests:
        (1) "the INTERNAL context value is assignable to FormStackRendererProps (renderer
            spread still compiles)" — constructs a FormStackViewportContextValue, passes it to
            an acceptRendererProps function, and renders <FormStackRenderer {...internal}/>.
        (2) "the PUBLIC FormStackViewportValue is NOT assignable to FormStackRendererProps
            (leak closed)" — conditional-type guards via literal-typed consts:
              type InternalAssignable = FormStackViewportContextValue extends FormStackRendererProps ? true : false;
              type PublicAssignable   = FormStackViewportValue     extends FormStackRendererProps ? true : false;
              const internalAssignable: InternalAssignable = true;   // compile-errs if internal ever diverges
              const publicAssignable:   PublicAssignable   = false;  // compile-errs if leak returns
              expect(internalAssignable).toBe(true);
              expect(publicAssignable).toBe(false);
  - See "Exact Replacement" §D below.
  - GOTCHA: keep `import { FormStackRenderer, type FormStackRendererProps } from '../../components';`
        (already imported). The spread test (1) needs FormStackRenderer + FormStackRendererProps.

Task 7: VALIDATE (no edits — run the contract gates)
  - RUN: npx tsc --noEmit                        → expect exit 0 (FULL green; was exit 2).
  - RUN: npx vitest run                          → expect ALL green.
  - RUN: npx vitest run src/hooks/__tests__/useFormStackViewport.test.tsx  → expect the file green.
  - RUN: git status --short                      → expect exactly:
          M src/hooks/useFormStackViewport.ts
          M src/hooks/__tests__/useFormStackViewport.test.tsx
        (FormStackViewport.tsx must NOT appear.)
  - RUN: grep -n "useMemo\|internal.stack.map" src/hooks/useFormStackViewport.ts → confirm the mapping.
```

### Exact Replacement

#### §A — Tasks 1 & 2 (hook body + JSDoc)

The hook file is small. The two changes (import line + JSDoc+body) are best done as two
edits. The full **target file content** is:

```ts
import { useContext, useMemo } from 'react';
import { FormStackViewportContext } from '../context';
import type { FormStackViewportValue } from '../types';

/**
 * Returns a **sanitized**, read-only view of the form-stack viewport: the open forms as
 * a `{ id, label? }[]` ({@link StackEntry} array) and the `onClose` callback. Use this
 * when you want to read the open forms for custom rendering (e.g. a host header or
 * summary) without mounting the renderer yourself.
 *
 * This hook is the **public** counterpart to the internal context value
 * ({@link FormStackViewportContextValue}) carried by {@link FormStackViewportContext}. It
 * deliberately exposes **only** `{ id, label }` entries and `onClose` — never the
 * internal stack-entry fields (`component`, `deferred`, `confirmOnCancel`) or
 * `onCancelRequest` — so a consumer cannot hijack a form's promise resolution
 * (`entry.deferred.resolve(...)`) or mount forms directly (PRD §10.1 "no internal-type
 * leakage").
 *
 * Returns `null` when the stack is empty (or when used outside a
 * {@link FormStackProvider}), so the natural guard is
 * `const viewport = useFormStackViewport(); if (!viewport) return null;`.
 *
 * Most consumers should use {@link FormStackViewport} (the zero-prop component) instead —
 * it renders the stacked form bodies for you. This hook is for advanced consumers who only
 * need the safe, display-oriented fields.
 *
 * @returns The sanitized {@link FormStackViewportValue} (`{ stack: readonly StackEntry[];
 * onClose }`), or `null` when there is nothing to render.
 * @throws {Error} Never throws — returns `null` outside a provider.
 *
 * @see {@link FormStackViewport} - The recommended, no-prop component form
 * @see {@link FormStackViewportValue} - The sanitized return type
 * @see {@link StackEntry} - The public entry type (`{ id, label? }`)
 *
 * @example
 * ```tsx
 * import { useFormStackViewport } from 'geoform';
 *
 * function OpenFormsSummary() {
 *   const viewport = useFormStackViewport();
 *   if (!viewport) return null;
 *   // Only safe, display-oriented fields are reachable:
 *   return (
 *     <ul>
 *       {viewport.stack.map((entry) => (
 *         <li key={entry.id}>{entry.label ?? entry.id}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useFormStackViewport(): FormStackViewportValue | null {
  const internal = useContext(FormStackViewportContext);
  return useMemo(() => {
    if (!internal) return null;
    return {
      stack: internal.stack.map(({ id, label }) => ({ id, label })),
      onClose: internal.onClose,
    };
  }, [internal]);
}
```

> **Note on the `edit` tool:** the import line
> `import { useContext } from 'react';` is unique in the file — replace it with
> `import { useContext, useMemo } from 'react';`. Then replace the ENTIRE current JSDoc +
> function (from the opening `/**` above `@returns The props required by FormStackRenderer`
> through the closing `}` of the function) with the JSDoc + body above. Because the whole
> JSDoc+function block is being replaced as one contiguous region, this is a single safe
> edit (the `oldText` is the verbatim current JSDoc+function; see the file read in the
> references). Alternatively, overwrite the whole file with the content above via `write`.

#### §B — Task 4 (fix "returns the viewport value" test)

- `oldText` (the exact current assertion tail of that test):

  ```ts
      // Re-read after the state update.
      expect(result.current.viewport).not.toBeNull();
      const value = result.current.viewport as FormStackViewportValue;
      expect(value.stack).toHaveLength(1);
      expect(value.stack[0]?.id).toBe('f1');
      expect(value.stack[0]?.label).toBe('F1');
      expect(value.stack[0]?.confirmOnCancel).toBe(true);
      expect(typeof value.onClose).toBe('function');
      expect(typeof value.onCancelRequest).toBe('function');
    });
  ```

- `newText`:

  ```ts
      // Re-read after the state update.
      expect(result.current.viewport).not.toBeNull();
      const value = result.current.viewport as FormStackViewportValue;
      expect(value.stack).toHaveLength(1);
      expect(value.stack[0]?.id).toBe('f1');
      expect(value.stack[0]?.label).toBe('F1');
      expect(typeof value.onClose).toBe('function');
      // Sanitized: the public value exposes NO onCancelRequest callback.
      expect('onCancelRequest' in value).toBe(false);
    });
  ```

#### §C — Task 5 (replace "exposes internal entry fields" test)

- `oldText` (the exact current test block):

  ```ts
    it('exposes internal entry fields (component/deferred) without leaking types', () => {
      const { result } = renderHook(
        () => {
          const viewport = useFormStackViewport();
          const { openForm } = useFormStackActions();
          return { viewport, openForm };
        },
        { wrapper },
      );

      act(() => {
        result.current.openForm({ id: 'f1', component: StubForm });
      });

      const entry = (result.current.viewport as FormStackViewportValue).stack[0];
      // The hook still surfaces the internal renderer props (component/deferred)
      // so <FormStackRenderer/> can mount the form — but as a single opaque
      // value, not individual exported internals.
      expect(entry).toBeDefined();
      expect(typeof entry?.component).toBe('function');
      expect(entry?.deferred).toBeDefined();
      expect(typeof entry?.deferred.resolve).toBe('function');
    });
  ```

- `newText`:

  ```ts
    it('returns a sanitized stack exposing only { id, label } (no internal fields)', () => {
      const { result } = renderHook(
        () => {
          const viewport = useFormStackViewport();
          const { openForm } = useFormStackActions();
          return { viewport, openForm };
        },
        { wrapper },
      );

      act(() => {
        // Open with confirmOnCancel to prove the flag stays internal.
        result.current.openForm({ id: 'f1', component: StubForm, label: 'F1', confirmOnCancel: true });
      });

      const value = result.current.viewport as FormStackViewportValue;
      expect(value.stack).toHaveLength(1);

      // The public entry carries ONLY id + label (component/deferred/confirmOnCancel dropped).
      const entry = value.stack[0]!;
      expect(Object.keys(entry).sort()).toEqual(['id', 'label']);
      expect('component' in entry).toBe(false);
      expect('deferred' in entry).toBe(false);
      expect('confirmOnCancel' in entry).toBe(false);

      // The public value exposes ONLY { stack, onClose } (no onCancelRequest).
      expect(typeof value.onClose).toBe('function');
      expect(Object.keys(value).sort()).toEqual(['onClose', 'stack']);
      expect('onCancelRequest' in value).toBe(false);
    });
  ```

#### §D — Task 6 (replace the type-level test)

- `oldText` (the exact current type-level block):

  ```ts
  describe('type-level contracts', () => {
    it('FormStackViewportValue is assignable to FormStackRendererProps', () => {
      // Compile-time guard for acceptance criterion #5: the non-null return of
      // useFormStackViewport() must be spreadable onto <FormStackRenderer/>.
      const acceptRendererProps = (_p: FormStackRendererProps): null => null;
      const value: FormStackViewportValue = {
        stack: [],
        onClose: () => {},
        onCancelRequest: async () => true,
      };
      acceptRendererProps(value); // compiles only if assignable
      // <FormStackViewport/> has no required props:
      const _el = <FormStackRenderer {...value} />;
      void _el;
      expect(true).toBe(true);
    });
  });
  ```

- `newText`:

  ```ts
  describe('type-level contracts', () => {
    it('the INTERNAL context value is assignable to FormStackRendererProps (renderer spread still compiles)', () => {
      // <FormStackViewport/> spreads the internal FormStackViewportContextValue onto
      // <FormStackRenderer/>. That spread must still type-check: the internal context
      // value is structurally identical to FormStackRendererProps.
      const acceptRendererProps = (_p: FormStackRendererProps): null => null;
      const internal: FormStackViewportContextValue = {
        stack: [],
        onClose: () => {},
        onCancelRequest: async () => true,
      };
      acceptRendererProps(internal); // compiles only if assignable
      const _el = <FormStackRenderer {...internal} />;
      void _el;
      expect(true).toBe(true);
    });

    it('the PUBLIC FormStackViewportValue is NOT assignable to FormStackRendererProps (leak closed)', () => {
      // The public hook return type intentionally omits onCancelRequest (and the
      // internal stack-entry fields), so it can no longer be spread onto the renderer.
      // These conditional-type guards FAIL TO COMPILE if the leak ever returns
      // (regression guard), and assert the runtime literal value too.
      type InternalAssignable = FormStackViewportContextValue extends FormStackRendererProps ? true : false;
      type PublicAssignable = FormStackViewportValue extends FormStackRendererProps ? true : false;

      const internalAssignable: InternalAssignable = true;  // compiles => internal IS assignable
      const publicAssignable: PublicAssignable = false;     // compiles => public is NOT assignable

      expect(internalAssignable).toBe(true);
      expect(publicAssignable).toBe(false);
    });
  });
  ```

> **Note on the `edit` tool for the test file:** Tasks 3-6 are four non-overlapping edits
> to distinct regions (import block; test-1 tail; test-2 whole; type-level whole). They may
> be applied as four separate `edit` calls or as one `edit` call with four `edits[]`
> entries. Each `oldText` above is verbatim from the current file and is unique within it.

### Implementation Patterns & Key Details

```typescript
// PATTERN: internal→public projection (closes the runtime leak). The hook maps the
// internal context value to a fresh object carrying only the public fields. (hook)
export function useFormStackViewport(): FormStackViewportValue | null {
  const internal = useContext(FormStackViewportContext);
  return useMemo(() => {
    if (!internal) return null;
    return {
      stack: internal.stack.map(({ id, label }) => ({ id, label })), // explicit destructure
      onClose: internal.onClose,
    };
  }, [internal]);
}

// CRITICAL: destructure { id, label } explicitly. NEVER `{ ...entry }` — that would
// forward component/deferred/confirmOnCancel and re-open the leak.

// CRITICAL: useMemo deps = [internal] (the context value). The provider's viewportValue
// useMemo recreates the context value on stack change, so [internal] captures all changes
// and is referentially stable otherwise (no needless re-render).

// PATTERN: "not assignable" type test (compile + runtime). Assignability is compile-only,
// so encode it as a conditional type whose result is a literal `true`/`false`, assign that
// literal to a const of the same literal type (compile-error if the answer flips), and
// assert the runtime value. (test file)
type PublicAssignable = FormStackViewportValue extends FormStackRendererProps ? true : false;
const publicAssignable: PublicAssignable = false;  // TS error if PublicAssignable ever becomes `true`
expect(publicAssignable).toBe(false);

// GOTCHA: noUncheckedIndexedAccess:true → value.stack[0] is `StackEntry | undefined`.
// For Object.keys(entry) use `const entry = value.stack[0]!;`. For reads, `?.` is fine.
```

### Integration Points

```yaml
HOOK (src/hooks/useFormStackViewport.ts):
  - IMPORT: add `useMemo` to the react import.
  - BODY: replace `return useContext(FormStackViewportContext)` with the useMemo projection.
  - JSDOC + @example: full rewrite (Mode A) — sanitized surface, drop spread/assignable claim.

TESTS (src/hooks/__tests__/useFormStackViewport.test.tsx):
  - IMPORT: add FormStackViewportContextValue to the '../../types' type import.
  - TEST "returns the viewport value when a form is open": remove confirmOnCancel assertion;
        replace onCancelRequest typeof with `expect('onCancelRequest' in value).toBe(false)`.
  - TEST "exposes internal entry fields...": REPLACE with sanitized-surface test (Object.keys
        asserts only {id,label} on entries and {onClose,stack} on the value; 'in' checks for
        absence of internal fields).
  - TEST "FormStackViewportValue is assignable to FormStackRendererProps": REPLACE with two
        tests (internal IS assignable + renderer spread; public is NOT assignable via
        conditional-type guards).

NO CHANGE (verified):
  - src/components/FormStackViewport.tsx  (0 tsc errors; spread onto FormStackRenderer compiles)
  - src/types/context.ts, src/types/index.ts, src/context/FormStackContext.ts  (S1 landed; do not re-edit)
  - src/components/FormStackRenderer.tsx, src/components/FormStackProvider.tsx  (untouched)

OUT OF SCOPE (do not touch — flagged for P1.M3 changeset doc sync):
  - src/index.ts line ~402 stale JSDoc ("Structurally identical to FormStackRendererProps")
    on the public FormStackViewportValue re-export. Leave as-is; S2's DOCS scope is the hook only.

VALIDATION GATES:
  - npx tsc --noEmit  → exit 0 (full green).
  - npx vitest run    → all green.
```

---

## Validation Loop

### Level 1: Type Gate (the primary S2 gate — FULL green, unlike S1)

```bash
cd /home/dustin/projects/geoform
npx tsc --noEmit
# EXPECT: exit 0, NO output. (S2 fixes the last 8 errors S1 left in the test file.)
# If ANY error prints, read it: a source file error means you over-edited; a test file
# error means a test rewrite is still wrong. Fix before proceeding.

# Specifically confirm the previously-broken test file is now clean:
npx tsc --noEmit 2>&1 | grep "useFormStackViewport.test.tsx" | grep "error TS"
# EXPECT: EMPTY.
```

### Level 2: Unit Tests (the rewritten test file)

```bash
cd /home/dustin/projects/geoform
# Run JUST the rewritten file first.
npx vitest run src/hooks/__tests__/useFormStackViewport.test.tsx
# EXPECT: all tests pass (outside-provider null, empty-stack null, viewport-value-present,
#         sanitized-surface, internal-assignable, public-not-assignable).

# Then the full suite (S2 should not regress anything; all 294+ tests stay green).
npx vitest run
# EXPECT: all green. The only files S2 touched are the hook + its test.

# Spot-check the <FormStackViewport/> component path still works (it was NOT edited):
npx vitest run src/components/__tests__/FormStackViewport.test.tsx
# EXPECT: all green (proves the component still renders via the internal context).
```

### Level 3: Scope & Contract Validation

```bash
cd /home/dustin/projects/geoform
# Exactly the two agreed files changed (FormStackViewport.tsx must NOT appear):
git status --short
# EXPECT:
#   M src/hooks/useFormStackViewport.ts
#   M src/hooks/__tests__/useFormStackViewport.test.tsx
# NOTHING ELSE — especially NOT FormStackViewport.tsx, FormStackRenderer.tsx,
# FormStackProvider.tsx, types/*, context/*, PRD.md, tasks.json.

# Confirm the hook now maps (closes the runtime leak):
grep -n "useMemo\|internal.stack.map" src/hooks/useFormStackViewport.ts
# EXPECT: useMemo imported and the `.map(({ id, label }) => ({ id, label }))` projection present.

# Confirm onCancelRequest is NOT forwarded by the hook:
grep -n "onCancelRequest" src/hooks/useFormStackViewport.ts
# EXPECT: EMPTY (the public projection must not forward onCancelRequest).

# Confirm S1's files were NOT re-edited:
git diff --name-only | grep -E "types/context\.ts|types/index\.ts|context/FormStackContext\.ts|FormStackViewport\.tsx" \
  && echo "WARNING: scope violation (S1 files / FormStackViewport.tsx touched)" || echo "OK: S1 files + viewport untouched"

# Confirm the FormStackViewport component still compiles + its test passes (no-change proof):
npx tsc --noEmit 2>&1 | grep "FormStackViewport.tsx" || echo "OK: FormStackViewport.tsx clean"
```

### Level 4: Creative & Domain-Specific Validation

```bash
cd /home/dustin/projects/geoform
# Adversarial runtime check: the hook output must NOT physically carry internal fields.
# (This mirrors the Issue 3 reproduction.) Add a throwaway assertion in a scratch test or
# run via node — but the sanitized-surface test (Task 5) already encodes this:
#   expect(Object.keys(entry).sort()).toEqual(['id', 'label']);
#   expect('deferred' in entry).toBe(false);
# If that test is green, the runtime leak is closed. No extra command needed.

# Build the package (proves the public dist types + runtime are consistent):
npm run build
# EXPECT: success (tsup). The published FormStackViewportValue type is the sanitized one.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npx tsc --noEmit` exits 0 (FULL green — was exit 2 before S2).
- [ ] `npx vitest run` all green.
- [ ] `npx vitest run src/hooks/__tests__/useFormStackViewport.test.tsx` all green.
- [ ] `git status --short` shows exactly `src/hooks/useFormStackViewport.ts` and its test.

### Feature Validation

- [ ] `useFormStackViewport()` body uses `useMemo` + maps `internal.stack` to `{ id, label }[]`.
- [ ] The hook does NOT forward `onCancelRequest` (grep empty).
- [ ] The sanitized-surface test asserts entry keys `['id','label']` and value keys `['onClose','stack']`.
- [ ] The sanitized-surface test asserts `'deferred' in entry === false` and `'onCancelRequest' in value === false`.
- [ ] The type-level test asserts the INTERNAL value IS assignable to `FormStackRendererProps` (and spreads).
- [ ] The type-level test asserts the PUBLIC value is NOT assignable to `FormStackRendererProps` (compile-guarded).
- [ ] The `<FormStackViewport/>` component still renders (its test file passes; the file was not edited).

### Code Quality Validation

- [ ] Hook JSDoc + example describe/show ONLY `{ stack, onClose }` access (Mode A).
- [ ] The JSDoc drops the now-false "assignable to `FormStackRendererProps`" / spreading claim.
- [ ] `useMemo` deps are `[internal]` (not `[internal.stack]`, not `[]`).
- [ ] The projection destructures `{ id, label }` explicitly (no `{ ...entry }` spread that would re-leak).
- [ ] No source file beyond the two scope files was modified (scope guard).
- [ ] S1's files (`types/context.ts`, `types/index.ts`, `context/FormStackContext.ts`) were NOT re-edited.

### Documentation & Deployment

- [ ] Mode A JSDoc on `useFormStackViewport` updated to reflect the sanitized return type.
- [ ] The example renders a summary list using only `entry.id`/`entry.label` (no renderer spread).
- [ ] The stale `src/index.ts` re-export comment was NOT touched (deferred to P1.M3; out of scope).

---

## Anti-Patterns to Avoid

- ❌ Don't edit S1's files (`src/types/context.ts`, `src/types/index.ts`,
  `src/context/FormStackContext.ts`). S1 has **landed**; re-editing them risks a conflict
  and is out of scope. S2 consumes S1's types as-is.
- ❌ Don't edit `src/components/FormStackViewport.tsx`. Verified 0 tsc errors after S1; the
  internal-context spread onto `<FormStackRenderer/>` still compiles. Work item §3b says add
  an annotation ONLY if inference fails — it doesn't.
- ❌ Don't spread the internal entry (`{ ...entry }`) in the hook projection. That would
  forward `component`/`deferred`/`confirmOnCancel` and re-open the runtime leak. Destructure
  `{ id, label }` explicitly.
- ❌ Don't forward `onCancelRequest` from the hook "for convenience". The public type omits
  it (S1); the projection must omit it too. Its parameter is `InternalStackEntry`, which
  public consumers no longer have.
- ❌ Don't use `useMemo` deps of `[internal.stack]` or `[]`. Use `[internal]` (the context
  value) so every provider-side stack change recomputes, while preserving referential
  stability when nothing changed.
- ❌ Don't use `expect(...).not.toAssignTo(...)` for the "not assignable" test — it doesn't
  exist (assignability is compile-only). Use the conditional-type + literal-const guard in
  Task 6.
- ❌ Don't index `value.stack[0]` without handling `undefined`. tsconfig has
  `noUncheckedIndexedAccess: true`, so it's `StackEntry | undefined`. Use `!` (after a length
  assertion) for `Object.keys()`, or `?.` for reads.
- ❌ Don't chase a green `npx tsc --noEmit` by editing S1's type files. The 8 errors are ALL
  in the test file and are fixed by the test rewrites in Tasks 3-6. If a SOURCE file errors,
  you over-edited — re-read the tasks.
- ❌ Don't expand scope to fix the stale `src/index.ts` re-export comment. It is out of scope
  (deferred to P1.M3). S2's DOCS scope is the hook's own JSDoc + example only.
- ❌ Don't run ruff/mypy/pytest/uv — this is a TS/React project; the gates are
  `npx tsc --noEmit` and `npx vitest run`.

---

## Confidence Score

**9.5 / 10** for one-pass success. S1 has **already landed** (verified in the current
source, not just its PRP), so the type foundation is concrete: both types exist, the
context is retyped, both are re-exported. The S2 work is a focused `useMemo` projection in
one hook + a test rewrite whose exact current text, exact replacement text, and exact
failing errors (8, all in the one test file) are all quoted verbatim above. The two subtle
landmines — `noUncheckedIndexedAccess: true` (forces `!`/`?.` in tests) and the
"not-assignable" test needing a conditional-type guard (not a runtime matcher) — are both
called out and worked around. `FormStackViewport.tsx` is verified clean (no change). The
only half-point of reservation is the conditional-type guard test, which is a slightly
uncommon TS idiom — but its exact code is provided, and it both compiles and asserts. No
file overlap with any concurrent task (S1 done; P1.M1.* done; the hook + its test are
exclusively S2's).
