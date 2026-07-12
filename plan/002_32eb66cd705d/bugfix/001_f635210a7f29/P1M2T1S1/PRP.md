# PRP — P1.M2.T1.S1: Define internal context value type and sanitize public `FormStackViewportValue`

---

## Goal

**Feature Goal**: Close the **type-level** half of Issue 3 (internal-type leakage
from `useFormStackViewport()` / `FormStackViewportValue`) by splitting the single
leaking type into two: a new **internal** `FormStackViewportContextValue` (carries
`InternalStackEntry`, used by the context + renderer) and a **sanitized public**
`FormStackViewportValue` (`readonly StackEntry[]` + `onClose` only — no
`component`, `deferred`, `confirmOnCancel`, or `onCancelRequest`). The
`FormStackViewportContext` is retyped onto the internal shape. This is the
type-definition **foundation**: it closes the leak at the **type** level (a
consumer can no longer *type* `vp.stack[0].deferred.resolve(...)`) and sets up
S2 (P1.M2.T1.S2) to close the **runtime** leak via the hook's internal→public
mapping and to fix the tests.

**Deliverable**: Three small edits across three files:
1. `src/types/context.ts` — add `FormStackViewportContextValue` (`@internal`);
   sanitize `FormStackViewportValue`; rewrite its JSDoc (Mode A).
2. `src/types/index.ts` — re-export `FormStackViewportContextValue`.
3. `src/context/FormStackContext.ts` — import `FormStackViewportContextValue`;
   retype `FormStackViewportContext`; refresh its JSDoc.
**No other files are touched.** No source file changes behavior; no new tests are
added by this subtask (the existing `useFormStackViewport.test.tsx` will need S2's
fixes — that is the agreed handoff, documented below).

**Success Definition**:
- Two distinct types exist: `FormStackViewportContextValue` (internal, mirrors
  `FormStackRendererProps`) and `FormStackViewportValue` (public, sanitized).
- `FormStackViewportContext` is typed `FormStackViewportContextValue | null`.
- `FormStackViewportContextValue` is exported from `src/types/index.ts`.
- **Every source `.ts`/`.tsx` file compiles** after S1. The *only* `tsc` errors
  are the known, enumerated ones in `src/hooks/__tests__/useFormStackViewport.test.tsx`
  (S2's explicit scope). Verifiable via the grep-filter gate in Validation Loop L1.
- `git status --short` shows exactly the three files above (plus optionally the
  `src/index.ts` comment noted in Integration Points).

---

## User Persona (if applicable)

**Target User**: A `geoform` consumer using the low-level `useFormStackViewport()`
hook to forward custom props to `<FormStackRenderer/>` (the advanced/hostless path),
and the library maintainers who need the public API to honor PRD §10.1's
"no internal-type leakage" guarantee.

**Use Case**: A consumer reads `vp.stack` to render a custom header/summary of the
open forms. They must NOT be handed `component`/`deferred`, which would let them
hijack a form's `openForm()` promise resolution with attacker-chosen data.

**User Journey**: `const vp = useFormStackViewport()` → `vp.stack` is typed
`readonly StackEntry[]` (`{ id, label? }`) → only safe, display-oriented fields are
reachable; `vp.stack[0].deferred` is a **type error**. (S2 additionally makes the
runtime object match the type.)

**Pain Points Addressed**: Today `FormStackViewportValue.stack` is
`InternalStackEntry<unknown>[]`, exposing `component` and
`deferred.{promise,resolve,reject}` to any consumer of the documented public hook —
a real (if minor) encapsulation/security gap called out by the adversarial QA pass.

---

## Why

- **Honors PRD §10.1.** That section explicitly promises the hostable-viewport
  exports are "through the public API (**no internal-type leakage**)". Issue 3
  proved the low-level hook violates this. Splitting the type is the prerequisite
  fix.
- **Closes the type-level leak without risk.** This is purely additive at the type
  layer — the internal shape moves to `FormStackViewportContextValue`, the public
  shape narrows. No runtime behavior changes in S1 (the context still carries the
  same object; `FormStackViewport` still spreads it onto the renderer).
- **Enables S2.** S2 maps internal→public in the hook (closing the runtime leak)
  and rewrites the tests. S1 produces the two types S2 consumes. Sequencing S1
  first keeps S2 a focused, low-risk mapping change.

---

## What

Two types replace one, and the context is retyped:

- **`FormStackViewportContextValue`** (NEW, `@internal`) — `{ stack:
  InternalStackEntry<unknown>[]; onClose: () => void; onCancelRequest: (entry:
  InternalStackEntry<unknown>) => Promise<boolean> }`. Structurally identical to
  `FormStackRendererProps`. Carried by `FormStackViewportContext`.
- **`FormStackViewportValue`** (SANITIZED, public) — `{ stack: readonly StackEntry[];
  onClose: () => void }`. `onCancelRequest` is **removed** (it is typed on
  `InternalStackEntry`, which public consumers no longer have). Returned by
  `useFormStackViewport()` (S2 wires the mapping).
- **`FormStackViewportContext`** — retyped `FormStackViewportContextValue | null`.

User-visible behavior is unchanged by S1 alone (the runtime objects are identical);
the change is at the type boundary. The runtime sanitization is S2.

### Scope (EXACT — do only this)

1. **`src/types/context.ts`** — add `FormStackViewportContextValue`; replace the
   body of `FormStackViewportValue` with the sanitized shape; rewrite its JSDoc.
2. **`src/types/index.ts`** — add `FormStackViewportContextValue` to the
   `./context` re-export.
3. **`src/context/FormStackContext.ts`** — import `FormStackViewportContextValue`
   (drop the now-unused `FormStackViewportValue` import); change the
   `FormStackViewportContext` generic; refresh the JSDoc above it.

### Success Criteria

- [ ] `FormStackViewportContextValue` exists in `src/types/context.ts`, `@internal`,
      with `stack: InternalStackEntry<unknown>[]`, `onClose`, `onCancelRequest`.
- [ ] `FormStackViewportValue` is sanitized: `stack: readonly StackEntry[]`,
      `onClose: () => void`; **no** `onCancelRequest`; JSDoc states
      component/deferred are internal-only (Mode A).
- [ ] `FormStackViewportContextValue` is re-exported from `src/types/index.ts`.
- [ ] `FormStackViewportContext` is `createContext<FormStackViewportContextValue | null>(null)`.
- [ ] **No `tsc` error in any source file** (gate: `tsc --noEmit | grep "error TS" |
      grep -v "useFormStackViewport.test.tsx"` is empty).
- [ ] The only `tsc` errors are the enumerated ones in
      `src/hooks/__tests__/useFormStackViewport.test.tsx` (S2 handoff).
- [ ] `git status --short` lists exactly the three scope files (+ optional
      `src/index.ts` comment).

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** The three edits are quoted verbatim below,
with exact current text to match. The assignability proof (why every source file
still compiles) is documented. The expected test-file breakage is enumerated so the
implementer knows the intermediate non-zero `tsc` is correct and is not a failure.

### Documentation & References

```yaml
# MUST READ — the authoritative fix this implements (steps 1-3 are S1; step 4 is S2)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/issue_analysis.md
  why: §Issue 3 "Fix Strategy" gives the exact split: define internal
        FormStackViewportContextValue, sanitize public FormStackViewportValue,
        switch the context, (S2) map in the hook. Lists "Files Modified" + "Test Impact".
  section: "## Issue 3 (Minor) ... Fix Strategy", "#### Files Modified", "#### Test Impact"
  critical: The fix DELIBERATELY splits type work (S1) from hook/test work (S2). S1 does
        steps 1-3 ONLY. The test impact ("must be updated") is S2's job — do NOT edit the test here.

# MUST READ — type hierarchy + the LEAK marker
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/system_context.md
  why: §Type Hierarchy states FormStackViewportValue.stack = InternalStackEntry<unknown>[]
        (LEAKS — Issue 3) ✗ and FormStackRendererProps.stack = InternalStackEntry<unknown>[]
        (internal, correct). Confirms what stays internal vs public.
  section: "### Type Hierarchy"

# PRIMARY EDIT TARGET #1 — the type definitions
- file: src/types/context.ts
  why: Houses the current leaking FormStackViewportValue (lines ~11-25). Add the new
        @internal FormStackViewportContextValue here and sanitize FormStackViewportValue.
  pattern: The file already imports `StackEntry` and `InternalStackEntry` from './stack'
        (line 1) — no new imports needed. JSDoc style is rich (@see links, @default).
  gotcha: Keep the import line `import type { StackEntry, OpenFormOptions, InternalStackEntry } from './stack';`
        UNCHANGED — StackEntry is already imported (needed for sanitized Value.stack).

# PRIMARY EDIT TARGET #2 — the internal types barrel
- file: src/types/index.ts
  why: Re-exports the context types (// Context types block). Add FormStackViewportContextValue.
  gotcha: This is the INTERNAL types barrel (imported by src/context and src/hooks via '../types').
        Do NOT add FormStackViewportContextValue to the PUBLIC barrel src/index.ts — it is @internal.

# PRIMARY EDIT TARGET #3 — the context definition
- file: src/context/FormStackContext.ts
  why: Line 2 imports FormStackViewportValue; line 29 types FormStackViewportContext on it.
        Switch both to FormStackViewportContextValue. Refresh the JSDoc above line 29.
  gotcha: After the edit, FormStackViewportValue is no longer imported in this file — REMOVE it
        from the import (or tsc/eslint will flag an unused import). Import ONLY FormStackViewportContextValue.

# THE SUBTYPE RELATIONSHIP (the assignability linchpin — proves source compiles)
- file: src/types/stack.ts
  why: `export interface InternalStackEntry<T = unknown> extends StackEntry` — InternalStackEntry
        is a SUBTYPE of StackEntry. Therefore InternalStackEntry[] is assignable to readonly
        StackEntry[] (covariance), so FormStackViewportContextValue is assignable to the sanitized
        FormStackViewportValue. This is why useFormStackViewport.ts STILL COMPILES after S1.
  critical: This subtype relationship is the reason S1 leaves all SOURCE files green. Only the
        TEST file breaks (it references removed/typed-away fields).

# NO-CHANGE VERIFICATION — these still compile after S1 (read to confirm, do not edit)
- file: src/components/FormStackViewport.tsx
  why: `const viewport = useContext(FormStackViewportContext)` then `<FormStackRenderer {...viewport}/>`.
        After S1, viewport is FormStackViewportContextValue (internal) which is structurally identical
        to FormStackRendererProps → the spread still compiles. issue_analysis step 5: "no change".
- file: src/components/FormStackRenderer.tsx
  why: FormStackRendererProps (lines 24-31) is the internal shape. Unchanged; it now matches
        FormStackViewportContextValue exactly.
- file: src/hooks/useFormStackViewport.ts
  why: `return useContext(FormStackViewportContext)` typed as FormStackViewportValue|null.
        Compiles (assignable per above) but "lies" at runtime — S2 fixes the mapping. DO NOT EDIT here.
- file: src/components/FormStackProvider.tsx
  why: viewportValue useMemo produces {stack: state.stack, onClose, onCancelRequest} = the internal
        shape → matches FormStackViewportContextValue. Compiles. (Also: P1.M1.T2.S1 edits this file
        concurrently on DIFFERENT lines — no conflict; S1 does not touch it.)

# THE TEST FILE THAT WILL BREAK (S2 owns the fix — read only, do NOT edit)
- file: src/hooks/__tests__/useFormStackViewport.test.tsx
  why: After S1 this file has ~6 tsc errors (enumerated in RESEARCH_NOTES.md). They are the AGREED
        S1→S2 handoff. S1's gate verifies errors are confined HERE.
  gotcha: Do NOT "fix" this test in S1. S2 (P1.M2.T1.S2: "fix FormStackViewport + tests") owns it.

# PUBLIC BARREL — optional adjacent comment fix
- file: src/index.ts
  why: Line ~407 `export type { FormStackViewportValue }` carries a JSDoc claiming it is
        "Structurally identical to FormStackRendererProps" — which becomes FALSE after S1.
        This is a comment-only, zero-risk edit for coherence (see Integration Points). OPTIONAL.
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── src/
│   ├── types/
│   │   ├── context.ts          # ← EDIT: add ContextValue, sanitize Value, JSDoc
│   │   ├── stack.ts            # READ-ONLY — InternalStackEntry extends StackEntry (linchpin)
│   │   └── index.ts            # ← EDIT: re-export FormStackViewportContextValue
│   ├── context/
│   │   ├── FormStackContext.ts # ← EDIT: import + retype FormStackViewportContext + JSDoc
│   │   └── index.ts            # READ-ONLY (already re-exports the contexts)
│   ├── components/
│   │   ├── FormStackRenderer.tsx     # READ-ONLY — FormStackRendererProps (internal shape)
│   │   ├── FormStackViewport.tsx     # READ-ONLY — compiles as-is after S1
│   │   └── FormStackProvider.tsx     # READ-ONLY — (also edited by parallel P1.M1.T2.S1, diff lines)
│   ├── hooks/
│   │   ├── useFormStackViewport.ts   # READ-ONLY (S2 edits this) — compiles as-is after S1
│   │   └── __tests__/
│   │       └── useFormStackViewport.test.tsx  # READ-ONLY (S2 fixes) — breaks after S1 (by design)
│   └── index.ts                # (optional) stale JSDoc on FormStackViewportValue re-export
├── PRD.md                      # READ-ONLY — §10.1 (no internal-type leakage), §5.2 (StackEntry)
└── plan/002_32eb66cd705d/bugfix/001_f635210a7f29/
    ├── architecture/issue_analysis.md   # §Issue 3 Fix Strategy (authoritative)
    ├── architecture/system_context.md   # §Type Hierarchy (LEAK marker)
    └── P1M2T1S1/                        # ← THIS PRP lives here
```

### Desired Codebase tree with files to be changed

```bash
src/types/context.ts          # MODIFIED — +FormStackViewportContextValue; sanitized FormStackViewportValue + JSDoc
src/types/index.ts            # MODIFIED — +FormStackViewportContextValue re-export
src/context/FormStackContext.ts  # MODIFIED — import + FormStackViewportContext generic + JSDoc
src/index.ts                  # (OPTIONAL) MODIFIED — stale re-export JSDoc comment only
# (no new files; useFormStackViewport.ts and its test are S2's; FormStackViewport.tsx unchanged)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: InternalStackEntry<T> EXTENDS StackEntry (src/types/stack.ts). This subtype
//   relationship is WHY every source file still compiles after S1: InternalStackEntry[]
//   is assignable to readonly StackEntry[] (covariance), and the extra onCancelRequest on
//   FormStackViewportContextValue is allowed when assigning to the narrower public
//   FormStackViewportValue. Do NOT add redundant fields or casts "to make it compile" —
//   it already compiles. (If a source file errors, you changed too much.)

// CRITICAL: This subtask WILL leave `npx tsc --noEmit` NON-ZERO — by design. The only
//   errors are in src/hooks/__tests__/useFormStackViewport.test.tsx (S2's explicit scope:
//   "fix FormStackViewport + tests"). S1's gate is "no errors in any SOURCE file", verified
//   by grep-filtering tsc output. Do NOT try to make the full tsc green by editing the test
//   — that is S2's job and doing it here violates the scope boundary.

// GOTCHA: In src/context/FormStackContext.ts, after switching the import, FormStackViewportValue
//   is NO LONGER used in that file. Remove it from the import statement (unused import =
//   tsc/eslint error with this project's settings). Import only FormStackViewportContextValue
//   (plus FormStackState, FormStackActions which are still used).

// GOTCHA: Do NOT add FormStackViewportContextValue to the PUBLIC barrel src/index.ts. It is
//   @internal — it carries InternalStackEntry. Only src/types/index.ts (the internal barrel
//   used by src/context and src/hooks via '../types') should re-export it.

// GOTCHA: The current FormStackViewportValue JSDoc claims it is "Structurally identical to
//   FormStackRendererProps" so it can be "forward[ed] ... via spread ... WITHOUT leaking
//   internal types". After sanitization this is FALSE (it is no longer identical/spreadable;
//   that role moves to the internal ContextValue). The Mode A JSDoc rewrite MUST drop that
//   claim and instead document the sanitized fields + state component/deferred are internal-only.

// GOTCHA: onCancelRequest is removed from the PUBLIC type because its parameter is
//   InternalStackEntry<unknown> — a consumer of the public hook only has StackEntry, so they
//   could never call it correctly anyway. It stays on the internal ContextValue (the renderer
//   needs it). Do not "keep it for convenience".

// PARALLEL-SAFETY: P1.M1.T2.S1 edits src/components/FormStackProvider.tsx concurrently.
//   S1 does NOT touch FormStackProvider.tsx. Its viewportValue useMemo already produces the
//   internal shape that FormStackViewportContextValue describes → compiles under both changes.
```

---

## Implementation Blueprint

### Data models and structure

No runtime data. Two interface definitions (one new, one narrowed) and one context
retype. `StackEntry` and `InternalStackEntry` (src/types/stack.ts) are unchanged.

```typescript
// src/types/context.ts — NEW internal type (structurally == FormStackRendererProps)
/** @internal */
export interface FormStackViewportContextValue {
  stack: InternalStackEntry<unknown>[];
  onClose: () => void;
  onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>;
}

// src/types/context.ts — SANITIZED public type
export interface FormStackViewportValue {
  stack: readonly StackEntry[];   // { id, label? } only
  onClose: () => void;            // no onCancelRequest
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EDIT src/types/context.ts — add FormStackViewportContextValue + sanitize FormStackViewportValue
  - LOCATE the current FormStackViewportValue block (JSDoc ~lines 1-10 + interface ~lines 17-25).
  - INSERT (immediately BEFORE the existing FormStackViewportValue JSDoc) the new internal type:
        /**
         * Internal context value carried by {@link FormStackViewportContext}. Same shape the
         * provider produces (internal stack, `onClose`, `onCancelRequest`) and structurally
         * identical to {@link FormStackRendererProps}, so {@link FormStackViewport} can spread
         * it onto {@link FormStackRenderer}.
         *
         * Never exposed publicly: it carries {@link InternalStackEntry} (with
         * `component`/`deferred`/`confirmOnCancel`) and an `onCancelRequest` typed on
         * `InternalStackEntry`. The public, sanitized view is {@link FormStackViewportValue}.
         *
         * @internal
         */
        export interface FormStackViewportContextValue {
          /** Internal stack entries to render (top visible, parents mounted-hidden) */
          stack: InternalStackEntry<unknown>[];
          /** Callback when a form closes (pops the top form from the stack) */
          onClose: () => void;
          /** Request confirmation before cancelling an entry; resolves true if confirmed */
          onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>;
        }
  - REPLACE the entire current FormStackViewportValue JSDoc + interface with:
        /**
         * Public, sanitized value returned by {@link useFormStackViewport} (or `null` when the
         * stack is empty). A deliberately narrow view of the internal
         * {@link FormStackViewportContextValue}: a **read-only** `{ id, label }[]` stack and
         * the `onClose` callback only.
         *
         * It intentionally does **not** expose the internal stack-entry fields
         * (`component`, `deferred`, `confirmOnCancel`) or an `onCancelRequest` callback.
         * Those are internal to the renderer (see {@link FormStackRendererProps} and the
         * internal {@link FormStackViewportContextValue}); leaking them would let a consumer
         * hijack a form's promise resolution (`entry.deferred.resolve(...)`) or mount forms
         * directly. Most consumers should use {@link FormStackViewport} (the zero-prop
         * component) instead of this hook.
         *
         * @see {@link useFormStackViewport} - Hook returning this value (or null)
         * @see {@link FormStackViewport} - Zero-prop component that renders the viewport
         * @see {@link StackEntry} - The public entry type (`{ id, label? }`)
         */
        export interface FormStackViewportValue {
          /** Read-only stack entries (`{ id, label? }` only — no component/deferred) */
          stack: readonly StackEntry[];
          /** Callback to close/pop the top form */
          onClose: () => void;
        }
  - KEEP the line-1 import unchanged: `import type { StackEntry, OpenFormOptions, InternalStackEntry } from './stack';`
        (StackEntry is already imported; both types use only already-imported names.)
  - DO NOT touch FormStackState / FormStackActions / FormStackAction / FormStackReducerState in this file.
  - NAMING: FormStackViewportContextValue (camelCase, matches the PRD/issue_analysis spelling exactly).

Task 2: EDIT src/types/index.ts — re-export FormStackViewportContextValue
  - LOCATE the `// Context types` block:
        export type {
          FormStackState,
          FormStackActions,
          FormStackAction,
          FormStackReducerState,
          FormStackViewportValue,
        } from './context';
  - ADD `FormStackViewportContextValue,` to that list (alphabetic-ish / logical placement is fine;
        recommend right after FormStackViewportValue):
        export type {
          FormStackState,
          FormStackActions,
          FormStackAction,
          FormStackReducerState,
          FormStackViewportValue,
          FormStackViewportContextValue,
        } from './context';
  - GOTCHA: ONLY this internal barrel. Do NOT add it to src/index.ts (public).

Task 3: EDIT src/context/FormStackContext.ts — retype FormStackViewportContext + import + JSDoc
  - LOCATE line 2:
        import type { FormStackState, FormStackActions, FormStackViewportValue } from '../types';
    REPLACE WITH (drop the now-unused FormStackViewportValue; add FormStackViewportContextValue):
        import type {
          FormStackState,
          FormStackActions,
          FormStackViewportContextValue,
        } from '../types';
  - LOCATE the JSDoc + line 29 for FormStackViewportContext:
        /**
         * Carries the props required by {@link FormStackRenderer} (internal stack,
         * `onClose`, `onCancelRequest`) so a consumer-placed {@link FormStackViewport}
         * can render the stacked form bodies without exposing `InternalStackEntry`.
         * ...
         */
        export const FormStackViewportContext = createContext<FormStackViewportValue | null>(null);
    REPLACE the JSDoc + declaration with:
        /**
         * Carries the {@link FormStackViewportContextValue} (internal stack, `onClose`,
         * `onCancelRequest`) required by {@link FormStackRenderer}, so a consumer-placed
         * {@link FormStackViewport} can render the stacked form bodies. This is the INTERNAL
         * channel: it carries {@link InternalStackEntry}. The public, sanitized view is
         * {@link FormStackViewportValue}, produced by {@link useFormStackViewport}.
         *
         * The provider sets this to `null` when the stack is empty (and it is `null`
         * outside any provider), so {@link FormStackViewport} and
         * {@link useFormStackViewport} render/return nothing in those cases.
         */
        export const FormStackViewportContext =
          createContext<FormStackViewportContextValue | null>(null);
  - KEEP the `FormStackViewportContext.displayName = 'FormStackViewportContext';` line.
  - KEEP the State/Actions/Mount contexts untouched.

Task 4: VALIDATE (no edits — run the honest gate)
  - RUN: npx tsc --noEmit  (capture output). EXPECT non-zero exit (the test file breaks — by design).
  - RUN the SOURCE-GREEN gate:
        npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "useFormStackViewport.test.tsx"
        EXPECT: EMPTY (no source-file errors). If NON-empty, you changed a source file incorrectly — fix it.
  - RUN the HANDOFF-CONFIRMATION gate:
        npx tsc --noEmit 2>&1 | grep "error TS" | grep "useFormStackViewport.test.tsx" | wc -l
        EXPECT: >= 4 (the enumerated S2-handoff errors: confirmOnCancel/onCancelRequest access,
        component/deferred access, guard-test literal + assignability + spread). These are S2's job.
  - Do NOT run the full vitest suite as S1's gate — the test file won't compile until S2. If you do
        run it, expect a single file (useFormStackViewport.test.tsx) to fail to compile; that is expected.
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: internal vs public type split. The internal type MIRRORS the renderer props
// (so the component can spread context value → renderer with zero glue); the public type
// is a NARROW VIEW the hook projects. (src/types/context.ts)

/** @internal — mirrors FormStackRendererProps; carries InternalStackEntry */
export interface FormStackViewportContextValue {
  stack: InternalStackEntry<unknown>[];
  onClose: () => void;
  onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>;
}

/** public — read-only {id,label}[] + close only; NO onCancelRequest, NO internals */
export interface FormStackViewportValue {
  stack: readonly StackEntry[];
  onClose: () => void;
}
```

```typescript
// PATTERN: the context carries the INTERNAL type; the hook (S2) projects to the PUBLIC type.
// (src/context/FormStackContext.ts)
import type { FormStackViewportContextValue } from '../types';
export const FormStackViewportContext =
  createContext<FormStackViewportContextValue | null>(null);

// (src/hooks/useFormStackViewport.ts — UNCHANGED in S1; S2 rewrites the body to map.
//  It still compiles today because FormStackViewportContextValue is assignable to the
//  sanitized FormStackViewportValue via the InternalStackEntry <: StackEntry subtype.)
export function useFormStackViewport(): FormStackViewportValue | null {
  return useContext(FormStackViewportContext); // S2 replaces with a mapped/memoized projection
}
```

```typescript
// CRITICAL assignability proof (do not "fix" what already compiles):
//   InternalStackEntry<T> extends StackEntry               (src/types/stack.ts)
//   ⇒ InternalStackEntry<unknown>[]  assignable to  readonly StackEntry[]   (array covariance)
//   ⇒ FormStackViewportContextValue  assignable to  FormStackViewportValue   (extra onCancelRequest OK)
//   ⇒ `return useContext(FormStackViewportContext)` type-checks as FormStackViewportValue | null.
// And FormStackViewportContextValue is structurally identical to FormStackRendererProps
//   ⇒ `<FormStackRenderer {...viewport}/>` in FormStackViewport.tsx still type-checks.
// Net: ZERO source-file tsc errors after S1. Only the test file breaks.
```

### Integration Points

```yaml
TYPES (src/types/context.ts):
  - ADD: FormStackViewportContextValue (@internal; InternalStackEntry-based).
  - CHANGE: FormStackViewportValue → sanitized (readonly StackEntry[]; onClose; no onCancelRequest).

INTERNAL TYPES BARREL (src/types/index.ts):
  - ADD re-export: FormStackViewportContextValue from './context'.

CONTEXT (src/context/FormStackContext.ts):
  - IMPORT: FormStackViewportContextValue (drop unused FormStackViewportValue import).
  - RETYPE: FormStackViewportContext = createContext<FormStackViewportContextValue | null>(null).

NO CHANGE (verify they still compile — they do, per the assignability proof):
  - src/components/FormStackViewport.tsx  (spread onto FormStackRenderer; ContextValue == RendererProps)
  - src/components/FormStackRenderer.tsx  (FormStackRendererProps unchanged)
  - src/components/FormStackProvider.tsx  (viewportValue already = internal shape; also touched by parallel P1.M1.T2.S1 on different lines)
  - src/hooks/useFormStackViewport.ts     (compiles; "lies" at runtime until S2 maps)

PUBLIC BARREL (src/index.ts) — OPTIONAL adjacent fix (comment-only, zero-risk):
  - Line ~407 `export type { FormStackViewportValue }` has a JSDoc claiming it is
    "Structurally identical to FormStackRendererProps" — now FALSE. For coherence, update
    that 3-line comment to describe the sanitized shape (id/label only) and note the internal
    ContextValue is what mirrors the renderer. This is OPTIONAL (a stale comment) and does not
    affect compilation; it is NOT a gate. If in doubt about scope, skip it and flag it for S2/P1.M3.

HANDOFF TO P1.M2.T1.S2 (NOT your job — just don't break the agreement):
  - S2 will: rewrite useFormStackViewport() to useMemo-map internal→public (closing the RUNTIME leak),
    and rewrite src/hooks/__tests__/useFormStackViewport.test.tsx (the ~6 tsc errors S1 leaves are S2's).
  - S1 must NOT edit either file.

PARALLEL-SAFETY:
  - P1.M1.T2.S1 (concurrent) edits src/components/FormStackProvider.tsx + a NEW test file.
    S1 edits types/context.ts, types/index.ts, context/FormStackContext.ts. ZERO file overlap.
```

---

## Validation Loop

> **Read this first.** Unlike most subtasks, S1's `npx tsc --noEmit` is EXPECTED
> to be **non-zero**, because S2's test file (`useFormStackViewport.test.tsx`)
> references fields S1 removes. S1's gate is therefore **"no errors in any SOURCE
> file"**, verified by grep-filtering the tsc output. Do not chase a fully-green tsc
> here — that is the S1→S2 handoff by design.

### Level 1: Type-Consistency Gate (the primary S1 gate)

```bash
cd /home/dustin/projects/geoform
# 1) Run tsc and capture all errors.
npx tsc --noEmit 2>&1 | tee /tmp/s1-tsc.out

# 2) SOURCE-GREEN gate — there must be NO type error in any file EXCEPT the test file.
grep "error TS" /tmp/s1-tsc.out | grep -v "useFormStackViewport.test.tsx"
# EXPECT: EMPTY.  (If anything prints, a SOURCE file is broken — re-read Task 1-3 and fix.)

# 3) HANDOFF-CONFIRMATION gate — the ONLY errors are in the test file (S2's scope).
grep "error TS" /tmp/s1-tsc.out | grep "useFormStackViewport.test.tsx" | wc -l
# EXPECT: >= 4  (confirmOnCancel access, onCancelRequest access, component/deferred access,
#               guard-test literal excess-property, guard-test assignability, guard-test spread).

# 4) Spot-check the specific source files compiled (should appear with NO errors):
grep -E "types/context\.ts|types/index\.ts|context/FormStackContext\.ts|FormStackViewport\.tsx|FormStackRenderer\.tsx|FormStackProvider\.tsx|useFormStackViewport\.ts" /tmp/s1-tsc.out | grep "error TS"
# EXPECT: EMPTY (none of these source files have errors).
```

### Level 2: Targeted Test Compile (informational — do NOT fix)

```bash
cd /home/dustin/projects/geoform
# Confirm the ONLY failing test file is the agreed S2 handoff (it will fail to COMPILE):
npx vitest run src/hooks/__tests__/useFormStackViewport.test.tsx 2>&1 | tail -20
# EXPECT: a TypeScript compile failure in this file (TS2339 / TS2354 / TS2345 / TS2322 on the
#         enumerated lines). This is EXPECTED and is S2's fix. Do NOT edit the test here.
# All OTHER test files continue to compile and pass — spot-check a couple:
npx vitest run src/components/__tests__/FormStackViewport.test.tsx 2>&1 | tail -5   # EXPECT: pass
npx vitest run src/components/__tests__/FormStackProvider.autoRender.test.tsx 2>&1 | tail -5  # EXPECT: pass
```

> **Do NOT run the full `npx vitest run` as an S1 gate** — vitest compiles each test
> file on demand, and `useFormStackViewport.test.tsx` will fail to compile until S2.
> That single compile failure is the entire expected impact. (If you do run the full
> suite, expect exactly one file to fail-to-compile and everything else green.)

### Level 3: Scope & Contract Validation

```bash
cd /home/dustin/projects/geoform
# Exactly the agreed files changed (plus optional src/index.ts comment):
git status --short
# EXPECT:
#   M src/types/context.ts
#   M src/types/index.ts
#   M src/context/FormStackContext.ts
# (optionally) M src/index.ts   <- only if you did the optional comment fix
# NOTHING ELSE — especially NOT useFormStackViewport.ts, useFormStackViewport.test.tsx,
# FormStackViewport.tsx, FormStackRenderer.tsx, FormStackProvider.tsx, PRD.md, tasks.json.

# Confirm the two types now exist and the context is retyped:
grep -n "FormStackViewportContextValue" src/types/context.ts         # EXPECT: interface def
grep -n "FormStackViewportContextValue" src/types/index.ts           # EXPECT: re-export
grep -n "FormStackViewportContextValue" src/context/FormStackContext.ts  # EXPECT: import + createContext<...>

# Confirm the public type is sanitized (no onCancelRequest, readonly StackEntry[]):
sed -n '/export interface FormStackViewportValue/,/^}/p' src/types/context.ts
# EXPECT: only `stack: readonly StackEntry[];` and `onClose: () => void;`. NO onCancelRequest.

# Confirm the public type no longer references InternalStackEntry:
grep -n "InternalStackEntry" src/types/context.ts | grep "FormStackViewportValue" || echo "OK: public Value is clean"
# (FormStackViewportContextValue still references InternalStackEntry — that's correct.)

# Confirm onCancelRequest is GONE from the public type:
grep -c "onCancelRequest" src/types/context.ts   # EXPECT: exactly 1 (only on the internal ContextValue)
```

### Level 4: Creative & Domain-Specific Validation

```bash
cd /home/dustin/projects/geoform
# Type-level sanity: the internal type must still be spreadable onto the renderer
# (proves the FormStackViewport component path is intact). This is a READ check —
# the component already does <FormStackRenderer {...viewport}/>; Level 1 confirmed
# FormStackViewport.tsx has no tsc error, which IS this proof. No extra command needed.

# Parallel-safety check: confirm S1 did not collide with P1.M1.T2.S1's file.
git diff --name-only | grep "FormStackProvider.tsx" && echo "WARNING: S1 touched FormStackProvider.tsx (should not)" || echo "OK: FormStackProvider.tsx untouched by S1"
# EXPECT: "OK: FormStackProvider.tsx untouched by S1".
```

---

## Final Validation Checklist

### Technical Validation

- [ ] **Source-green gate**: `npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "useFormStackViewport.test.tsx"` is EMPTY.
- [ ] **Handoff gate**: the only `tsc` errors are the ≥4 enumerated ones in `useFormStackViewport.test.tsx`.
- [ ] `src/types/context.ts`, `src/types/index.ts`, `src/context/FormStackContext.ts` each have zero tsc errors.
- [ ] `FormStackViewport.tsx`, `FormStackRenderer.tsx`, `FormStackProvider.tsx`, `useFormStackViewport.ts` each have zero tsc errors (unchanged behavior).
- [ ] `git status --short` shows exactly the three scope files (+ optional `src/index.ts` comment).

### Feature Validation

- [ ] `FormStackViewportContextValue` exists (`@internal`), mirrors `FormStackRendererProps` (`stack: InternalStackEntry<unknown>[]`, `onClose`, `onCancelRequest`).
- [ ] `FormStackViewportValue` is sanitized: `stack: readonly StackEntry[]`, `onClose: () => void`; no `onCancelRequest`.
- [ ] `FormStackViewportValue` JSDoc documents the sanitized fields and states `component`/`deferred` are internal-only (Mode A).
- [ ] `FormStackViewportContextValue` is re-exported from `src/types/index.ts`.
- [ ] `FormStackViewportContext` is `createContext<FormStackViewportContextValue | null>(null)`.
- [ ] The `FormStackViewportValue` import was removed from `src/context/FormStackContext.ts` (no unused import).

### Code Quality Validation

- [ ] Internal type is `@internal` and NOT added to the public barrel `src/index.ts`.
- [ ] JSDoc rewrite drops the now-false "structurally identical / spreadable onto renderer" claim from the public type.
- [ ] No source file beyond the three scope files was modified (scope guard).
- [ ] The test file and `useFormStackViewport.ts` were NOT edited (S2's scope).
- [ ] No redundant casts or "make it compile" hacks — the subtype relationship already makes everything compile.

### Documentation & Deployment

- [ ] Mode A JSDoc on `FormStackViewportValue` (src/types/context.ts) updated.
- [ ] `FormStackViewportContext` JSDoc refreshed to reference the internal type.
- [ ] (Optional) stale re-export JSDoc in `src/index.ts` updated, OR flagged for S2/P1.M3.
- [ ] The S1→S2 handoff (enumerated test-file errors + the hook mapping) is left intact for S2.

---

## Anti-Patterns to Avoid

- ❌ Don't edit `src/hooks/useFormStackViewport.ts` or its test in S1. The hook mapping
  (closing the **runtime** leak) and the test rewrite are explicitly **P1.M2.T1.S2's** scope.
  S1 is the **type foundation only**. Doing S2's work here violates the scope boundary and
  risks S2 redoing it.
- ❌ Don't chase a fully-green `npx tsc --noEmit`. After S1 it is non-zero **by design**
  (S2's test file references removed fields). S1's gate is "no SOURCE-file errors"
  (grep-filtered), not "exit 0".
- ❌ Don't run the full `npx vitest run` and treat a failure as an S1 bug. The single
  test file fails to **compile** until S2; that is the agreed handoff.
- ❌ Don't add `FormStackViewportContextValue` to the public barrel `src/index.ts`. It is
  `@internal` (carries `InternalStackEntry`). Only `src/types/index.ts` (internal barrel)
  should re-export it.
- ❌ Don't leave an unused `FormStackViewportValue` import in `src/context/FormStackContext.ts`.
  After retyping the context, that file no longer uses it — remove it from the import.
- ❌ Don't keep `onCancelRequest` on the public `FormStackViewportValue` "for convenience".
  It takes `InternalStackEntry`, which public consumers no longer have — keeping it would
  re-leak the internal type. It stays only on the internal `FormStackViewportContextValue`.
- ❌ Don't add redundant casts/`as` to "make it compile". `InternalStackEntry extends StackEntry`
  already makes `FormStackViewportContextValue` assignable to the sanitized
  `FormStackViewportValue`, so the hook and components compile with zero glue. If a source file
  errors, you over-edited — re-read the tasks.
- ❌ Don't rewrite the `FormStackViewportValue` JSDoc to keep the "structurally identical to
  `FormStackRendererProps` / spreadable" claim. That is now false for the public type; that
  role belongs to the internal `FormStackViewportContextValue`.
- ❌ Don't run ruff/mypy/pytest/uv — this is a TS/React project; the type gate is `tsc`.

---

## Confidence Score

**8.5 / 10** for one-pass success. The core work is three tiny, verbatim edits to type
files, with the exact current text and exact replacement text quoted above and the
authoritative fix taken from `issue_analysis.md §Issue 3`. The `InternalStackEntry extends
StackEntry` subtype relationship is verified, so every **source** file provably still
compiles — the change is genuinely type-only at the source level. The 1.5 points of
reservation are entirely about the **honest-but-unusual validation gate**: S1 deliberately
leaves `npx tsc --noEmit` non-zero because S2 owns the test file, so the implementer must
understand that "non-zero tsc, but only in the one test file" is the *passing* state (not a
failure). The PRP makes that gate explicit and grep-filtered to remove ambiguity. No file
overlap with the concurrent P1.M1.T2.S1 work, so no merge conflict.
