# Research Findings — P1.M1.T2.S1 (Coalesce concurrent confirmation waiters)

## 1. The bug (current code in `src/components/FormStackProvider.tsx`)

- `PendingConfirmation` interface (~line 82): `{ affectedForms: string[]; resolve: (confirmed: boolean) => void }` — single resolver slot.
- `requestConfirmation` (~lines 108-113):
  ```ts
  const requestConfirmation = useCallback((affectedForms: string[]): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingConfirmation({ affectedForms, resolve }); // OVERWRITES prior slot
    });
  }, []);
  ```
- `handleConfirmationConfirm` / `handleConfirmationCancel` (~lines 219-231): read `pendingConfirmation` from closure, call `.resolve(true/false)`, then `setPendingConfirmation(null)`. Both have `[pendingConfirmation]` in their `useCallback` dep arrays (unstable).
- Callers of `requestConfirmation`: `cancelForm()` (via `handleCancelRequest`, ~213-217) and `popToIndex()` (~188-191).
- `<ConfirmationDialog>` JSX title reads `pendingConfirmation.affectedForms.length` for pluralization (still valid after fix — field name unchanged).

## 2. Repro mechanics (why two cancelForm() calls orphan the first)

Both `cancelForm()` invocations read the SAME `state.stack[last]` (stack not yet mutated while awaiting confirmation). Each reaches `await requestConfirmation(...)`. The `new Promise` executor runs synchronously → `setPendingConfirmation` is called twice in the same tick. On the buggy code the 2nd OVERWRITES the 1st `{ resolve }` → resolve #1 unreachable → its promise NEVER settles.

## 3. The fix (from architecture/issue_analysis.md §Issue 2 + item contract)

- Change `resolve` → `resolvers: Set<(confirmed: boolean) => void>`.
- `requestConfirmation`: use functional setState to COALESCE:
  ```ts
  return new Promise((resolve) => {
    setPendingConfirmation((prev) => prev
      ? { affectedForms: [...new Set([...prev.affectedForms, ...affectedForms])],
          resolvers: new Set([...prev.resolvers, resolve]) }
      : { affectedForms, resolvers: new Set([resolve]) });
  });
  ```
  Deps stay `[]` (no closure reads of state) → still stable.
- Handlers: iterate the Set inside functional setState → become stable (`[]` deps):
  ```ts
  const handleConfirmationConfirm = useCallback(() => {
    setPendingConfirmation((prev) => { prev?.resolvers.forEach((r) => r(true)); return null; });
  }, []);
  const handleConfirmationCancel  = useCallback(() => {
    setPendingConfirmation((prev) => { prev?.resolvers.forEach((r) => r(false)); return null; });
  }, []);
  ```
- Positive side effect: plural title ("Discard Changes to N Forms?") now actually fires when ≥2 DIFFERENT forms coalesce.

## 4. Double-pop safety (Discard path)

When user clicks Discard, BOTH coalesced `cancelForm()` promises resolve `true`. Each then runs `top.deferred.resolve(undefined)` + `dispatch({type:'POP_FORM'})`. The second `POP_FORM` on a now-empty stack is a **NO-OP** (`formStackReducer` POP_FORM: `if (state.stack.length === 0) return state;`). `top.deferred.resolve(undefined)` a 2nd time is also a no-op (promise already resolved). So Discard path is safe. ✓

## 5. Test patterns discovered (verified in repo)

- **Host `cancelForm()` pattern** lives in `src/components/__tests__/FormStackProvider.autoRender.test.tsx` → `describe('cancelForm action', ...)` (line ~383). Uses `CapturingOpener` (awaits `openForm`, calls `onResult`), `HostShell` (renders `<FormStackViewport/>` + `host-close` button calling `cancelForm()`), `useFormStackActions`/`useFormStackState` hooks.
- **JSDOM dialog support**: every dialog test file sets `beforeEach(() => { HTMLDialogElement.prototype.showModal = vi.fn(); HTMLDialogElement.prototype.close = vi.fn(); });` (e.g. `ConfirmationDialog.integration.test.tsx`, `ConfirmationDialog.test.tsx`).
- **Querying the dialog**: `screen.getByRole('alertdialog', { hidden: true })` (native `<dialog>` is `hidden` in JSDOM when not `showModal`'d via real DOM). Absent assertions: `screen.queryByRole('alertdialog')`.
- **Buttons**: `screen.getByText('Keep Editing')` (cancel/reject) and `screen.getByText('Discard')` (confirm).
- **Async wrapping**: every interaction that triggers state updates is wrapped `await act(async () => { fireEvent.click(...) })`. Settlement/promise resolution asserted via `await waitFor(() => expect(...))`.
- **Tracking openForm() resolution**: `onResult` callback (`CapturingOpener` awaits `openForm` then calls `onResult(result)`); assert `onResult` not-called (Keep Editing) or `toHaveBeenCalledWith(undefined)` (Discard).
- **Stack-length exposure**: `<span data-testid="stack-length">{stack.length}</span>` via `useFormStackState()`.

## 6. Tracking the two cancelForm() promises (MOCKING contract from item)

The new test must fire `cancelForm()` twice rapidly and assert BOTH settle on a single "Keep Editing" / "Discard" click. The existing `HostShell` only calls `cancelForm()` once per click. A dedicated fixture is needed that:
1. Opens a `confirmOnCancel: true` form.
2. Has a button that fires `cancelForm()` TWICE and captures both returned `Promise<void>`s.
3. Exposes settlement (e.g. via `data-testid` spans updated from each promise's `.finally`), so the test can `waitFor` both `true`.

Design (see PRP Task 4 for full code): a `DoubleCancelHost` component using `useFormStackActions().cancelForm` + `useFormStackState().stack`, pushing two `cancelForm()` results into a tracked array and flipping `data-testid="settled-0"` / `settled-1` spans to `"true"` in each promise's `.finally`. Assert via `waitFor` (with timeout) that both settle.

## 7. Scope / parallel-safety notes

- This task modifies ONLY `src/components/FormStackProvider.tsx` (+ new test file). It does NOT touch `FormStackRenderer.tsx`, `FormErrorBoundary.tsx`, or `src/types/form.ts` (those are P1.M1.T1.S2's domain, running in parallel). No file overlap → no merge conflict.
- No user-facing/config/API/export surface change → no docs work (item DOCS: none). `PendingConfirmation` is a non-exported internal interface.
- Validation gates: `npx tsc --noEmit` + `npx vitest run` (Vitest 2.1 + RTL 16 + jsdom). NOT ruff/mypy/pytest.

## 8. Confidence

9/10 for one-pass success. The fix is 3 small edits to one file, each with exact code quoted in the item contract. The only non-trivial part is the integration test fixture (capturing two in-flight promises), which is fully specified in the PRP with copy-ready code.
