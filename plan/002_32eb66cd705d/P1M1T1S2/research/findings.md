# Research Findings — P1.M1.T1.S2: Add `popToIndex` to `useFormStack()`

## Task
Additive ~2-line fix to close MISMATCH 1 from `audit_findings.md`:
`useFormStack()` omits `popToIndex` while `useFormStackActions()` exposes it.
PRD §5.2 / delta §3 expect BOTH hooks to surface it. Add it to the combined hook + a test.

## Verified codebase facts (spot-checked Jul 12 2026)

### Target file: `src/hooks/useFormStack.ts` (161 lines)
- `export interface UseFormStackReturn {` → **line 13**
  - members in order: `stack` (:27), `openForm` (:46), `closeForm` (:50–108, big JSDoc), `cancelForm` (:99–110)
  - closing `}` of interface → **line 111**
  - Last member before close: `cancelForm: () => Promise<void>;` → **line 110**
- `cancelForm` JSDoc on UseFormStackReturn (the style to mirror for popToIndex): lines ~99–109.
- Body (end of file):
  - line 157: `const { stack } = useFormStackState();`
  - line 158: `const { openForm, closeForm, cancelForm } = useFormStackActions();`
  - line 159: (blank)
  - line 160: `return { stack, openForm, closeForm, cancelForm };`
  - line 161: `}`

### Source of truth: `src/types/context.ts`
- `FormStackActions` interface declares `popToIndex: (index: number) => void;` → **line 82**
- Its canonical JSDoc (mirror target): lines ~71–76:
  ```
  /**
   * Navigates to a specific form in the stack by index.
   * All forms after the target index are cancelled (resolved with undefined).
   * Used by Breadcrumbs component for direct navigation.
   * @param index - Zero-based index of the target form
   */
  popToIndex: (index: number) => void;
  ```
- `useFormStackActions()` (`src/hooks/useFormStackActions.ts`) returns the full
  `FormStackActions` (incl. popToIndex) → already wired.

### Implementation backing popToIndex
- `src/components/FormStackProvider.tsx:156` — `const popToIndex = useCallback(async (index) => {...})`.
  - Dev-mode RangeError on out-of-range index (`:159-163`).
  - Resolves each deeper entry's `deferred.resolve(undefined)` in reverse (`:189-194`).
  - `dispatch({ type: 'POP_TO_INDEX', index })` (`:197`).
  - Memoized in the actions object (`:239-243`) and provided via `FormStackActionsContext`.

### Ordering (from OUTPUT spec)
Final `UseFormStackReturn` must list: `{ stack, openForm, closeForm, popToIndex, cancelForm }`.
→ Insert `popToIndex` **between** `closeForm` and `cancelForm` (both in the interface and the returned object).

### `void` vs `async` (NOTE 2 — no action, do not "fix")
- `FormStackActions.popToIndex` is typed `(index: number) => void` (matches PRD §5.2).
- Impl is `async` → returns `Promise<void>`. TS accepts assigning a Promise-returning
  fn to a `void`-returning type (void-return rule). `tsc` is clean. → New
  `UseFormStackReturn.popToIndex` MUST also be typed `void` (not `Promise<void>`) to
  match PRD §5.2 and `FormStackActions`.

### Test file: `src/hooks/__tests__/useFormStack.test.tsx`
- Uses `vitest` + `renderHook`/`act` from `@testing-library/react`.
- Local `wrapper` = `<FormStackProvider>{children}</FormStackProvider>` (REAL provider — no mocks).
- Existing patterns:
  - `expect(result.current).toHaveProperty('openForm')`
  - `expect(typeof result.current.closeForm).toBe('function')`
  - `act(() => { result.current.openForm({...}) })` then assert.
- Existing "structure" test asserts stack/openForm/closeForm only → must be extended/added
  for popToIndex.
- `useFormStackActions.test.tsx` does NOT currently have a popToIndex test (only openForm/closeForm).

### How to build a 2-deep stack for the new test (proven by integration tests)
- `openForm()` pushes synchronously then awaits the deferred → calling it twice in `act()`
  grows the stack to 2 without resolving the promises.
- Reference: `src/__tests__/integration/BreadcrumbNavigation.integration.test.tsx` opens 3 forms
  by clicking buttons; stack-length reaches 3 before breadcrumb navigation.
- For renderHook: `result.current.openForm({id, component})` ×2 in `act()` → `stack.length === 2`.
  Then `result.current.popToIndex(0)` in `act()` → `stack.length === 1`. This proves it is
  the wired-through function, not a stub.

### Breadcrumbs usage (for @see link)
- `src/components/Breadcrumbs.tsx:33` — `export function Breadcrumbs(...)`.
- Exported from `src/components/index.ts:9`. This is the canonical consumer of popToIndex.

## Tooling baseline (verified live)
- `npx tsc --noEmit` → exit 0 (clean).
- `npx vitest run` → **286 passed (286)** across **26** files (all green).
- After this change (+1 test, maybe +2): expect **287/287** (or 288) across 26 files.

## package.json scripts
- `"test": "vitest run"`, `"type-check": "tsc --noEmit"`.
- Contract phrases them as `npx tsc --noEmit` / `npx vitest run` (equivalent).

## Out-of-scope guardrails
- Do NOT change `void` → `Promise<void>` (NOTE 2: matches spec).
- Do NOT touch README (handled by P1.M2.T1.S2).
- Do NOT touch PRD.md / tasks.json / prd_snapshot.md.
- JSDoc for the new member IS in scope for this subtask (Mode A, rides with the work).
