# PRP — P1.M1.T2.S1: Coalesce concurrent confirmation waiters in FormStackProvider

---

## Goal

**Feature Goal**: Close **Issue 2** (concurrent cancel requests orphan the first
confirmation promise) by making the confirmation system in
`FormStackProvider` **re-entrancy-safe**. The single
`resolve: (confirmed: boolean) => void` slot on `PendingConfirmation` is replaced
with `resolvers: Set<(confirmed: boolean) => void>`. A second
`requestConfirmation` call arriving while a dialog is already open now
**coalesces** onto the existing pending confirmation (merging `affectedForms` and
adding its resolver to the Set) instead of overwriting it. Both
`handleConfirmationConfirm` and `handleConfirmationCancel` iterate the Set and
resolve every waiter with the same answer, then clear the slot — using functional
`setState`, which makes the handlers stable. Net effect: **every** `cancelForm()`
/ `popToIndex()` promise settles when the user responds; **no** promise is ever
orphaned.

**Deliverable**: (1) A modified `src/components/FormStackProvider.tsx` — the
`PendingConfirmation` interface (`resolve` → `resolvers: Set<...>`),
`requestConfirmation` (functional-setState coalescing), and
`handleConfirmationConfirm` / `handleConfirmationCancel` (iterate Set, stable
deps). (2) A new integration test
`src/components/__tests__/ConfirmationReentrancy.integration.test.tsx` that
fires `cancelForm()` twice in flight and asserts both promises settle on a
single "Keep Editing" click, plus the "Discard" path (both resolve `true`, stack
clears).

**Success Definition**: With a `confirmOnCancel: true` form open, two rapid
`cancelForm()` calls produce exactly **one** confirmation dialog; clicking
"Keep Editing" once settles **both** `cancelForm()` promises (neither hangs);
clicking "Discard" settles both and reduces the stack to 0 with `openForm()`
resolving `undefined`. `npx tsc --noEmit` exits 0; `npx vitest run` is green
(existing ~298+ tests + new tests, 0 regressions). Only `FormStackProvider.tsx`
and the new test file change.

---

## User Persona (if applicable)

**Target User**: Library consumers (and their end users) who wire host-level
cancel affordances — Escape key, backdrop click, window close button,
breadcrumbs (`popToIndex`) — onto `cancelForm()`, exactly as described in
PRD §10.1.

**Use Case**: A user double-taps Escape, or clicks the backdrop while the form's
own Cancel button is already mid-confirmation, or clicks a breadcrumb while a
confirm dialog is open. Two cancellation requests land on the provider before the
user answers the dialog.

**User Journey**: Form is open (dirty, `confirmOnCancel`) → host fires
`cancelForm()` twice in quick succession → **one** "Discard Changes?" dialog
appears → user clicks "Keep Editing" once → dialog closes, form stays, and
**both** host `await`s return (previously the first would hang forever) → OR user
clicks "Discard" → dialog closes, form pops, stack clears, both host `await`s
return.

**Pain Points Addressed**: Today, the second `requestConfirmation` overwrites the
first `{ resolve }`, so the first `cancelForm()` promise **never settles**. Any
host code `await`ing `cancelForm()` (e.g. an effect running after cancel) hangs
forever, and the abandoned async closure retains references to `state.stack`
(latent memory leak). Realistic triggers are enumerated in the PRD §10.1 host
pattern.

---

## Why

- **Promise contract.** `cancelForm()` and `popToIndex()` return promises. Callers
  that `await` them (host effects, breadcrumb handlers) must be able to rely on
  settlement. An orphaned promise is an indefinite hang.
- **PRD §5.2 / §8 conformance.** §5.2 defines `cancelForm` / `popToIndex`;
  §8 (Cancellation & Dirty State) governs confirmation. A second cancel request
  arriving during an open confirmation must not strand the first.
- **Eliminates a latent memory leak.** The orphaned async closure retains
  references to `state.stack`; coalescing lets it complete and be collected.
- **Corrects the plural-title UX.** As a positive side effect, the dialog title
  "Discard Changes to N Forms?" now fires correctly when ≥2 **different** forms
  coalesce into one confirmation (previously `affectedForms` only ever reflected
  the last request).
- **Makes confirmation handlers stable.** Switching to functional `setState`
  removes `pendingConfirmation` from the handlers' `useCallback` dep arrays,
  eliminating unnecessary `ConfirmationDialog` re-renders.

---

## What

User-visible behavior is **unchanged** for the single-request path (open a form,
cancel once, click Keep Editing / Discard — identical to today). The change is
purely about the **concurrent/re-entrant** path: two cancellation requests in
flight now coalesce onto one dialog and **all** tracked promises settle on a
single user response.

### Scope (EXACT — do only this)

1. **`src/components/FormStackProvider.tsx`** — three edits:
   - **Interface**: `PendingConfirmation.resolve` →
     `resolvers: Set<(confirmed: boolean) => void>` (update the JSDoc comment too).
   - **`requestConfirmation`**: use the functional `setPendingConfirmation((prev) => ...)`
     form to coalesce (merge `affectedForms` via a de-duplicating `Set`, add the
     new resolver to the existing `Set`). Keep `[]` deps.
   - **`handleConfirmationConfirm` / `handleConfirmationCancel`**: iterate the
     `Set` and resolve every waiter inside a functional `setPendingConfirmation`
     updater (returning `null` to clear the slot). Change both `useCallback` dep
     arrays from `[pendingConfirmation]` to `[]`.
   - The `<ConfirmationDialog>` JSX title logic
     (`pendingConfirmation.affectedForms.length > 1`) is **untouched** — the field
     name is unchanged and now correctly reflects merged forms.
2. **`src/components/__tests__/ConfirmationReentrancy.integration.test.tsx`** (NEW):
   - JSDOM dialog mocks (`showModal`/`close`).
   - "Keep Editing" path: open `confirmOnCancel` form → fire `cancelForm()` twice →
     assert one dialog → click "Keep Editing" once → `waitFor` both tracked
     promises settled → form stays, `openForm()` unresolved.
   - "Discard" path: same setup → click "Discard" once → `waitFor` both settled →
     stack 0, `openForm()` resolved `undefined`.
   - Regression: single `cancelForm()` still behaves as before (dialog appears,
     Keep Editing leaves it open, Discard clears).

### Success Criteria

- [ ] `PendingConfirmation` has `resolvers: Set<(confirmed: boolean) => void>` (no `resolve` field).
- [ ] `requestConfirmation` uses functional `setPendingConfirmation((prev) => ...)` and merges (de-duplicates) `affectedForms` + adds the resolver to the existing `Set`.
- [ ] `handleConfirmationConfirm` / `handleConfirmationCancel` iterate the `Set` and clear the slot via functional `setState`, with `[]` deps (no `pendingConfirmation` in either dep array).
- [ ] Two rapid `cancelForm()` calls produce exactly **one** dialog.
- [ ] After one "Keep Editing" click, **both** `cancelForm()` promises settle (asserted via `waitFor` on tracked settlement spans within a timeout).
- [ ] After one "Discard" click, **both** settle and the stack is 0 with `openForm()` → `undefined`.
- [ ] `npx tsc --noEmit` exits 0; `npx vitest run` green (0 regressions).
- [ ] Only `src/components/FormStackProvider.tsx` is modified among source files; the only other change is the new test file.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** The PRP quotes the exact current buggy code
(with line numbers), the exact replacement code (from the architecture analysis +
item contract), the exact JSDOM dialog-mock pattern, the exact host-`cancelForm()`
test fixture pattern (mirrored from `FormStackProvider.autoRender.test.tsx`), and a
fully copy-ready integration test including the dual-promise tracking fixture. The
reducer's `POP_FORM`-on-empty-stack no-op is documented so the Discard double-pop is
understood as safe.

### Documentation & References

```yaml
# MUST READ — the single file being reworked
- file: src/components/FormStackProvider.tsx
  why: Houses the PendingConfirmation interface (~:82), requestConfirmation (~:108-113),
        handleConfirmationConfirm/handleConfirmationCancel (~:219-231), and the
        <ConfirmationDialog> JSX with the title pluralization logic (~return block).
  pattern: useState<PendingConfirmation | null>(null) single slot; useCallback with
        functional setState already used elsewhere (e.g. applyViewportMountDelta).
  gotcha: requestConfirmation currently uses setPendingConfirmation({ ... }) (value form).
        The fix switches it to the FUNCTIONAL form setPendingConfirmation((prev) => ...).
        Do NOT keep the value form — that is the bug.

# MUST READ — the issue this closes (exact fix quoted)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/issue_analysis.md
  why: §Issue 2 gives the exact buggy code, PRD refs (§5.2, §8, §10.1), the observed defect
        (first cancelForm() NEVER settles), and the prescribed coalescing fix with code.
  section: "## Issue 2 (Major): Concurrent cancel requests orphan the first confirmation promise"

# MUST READ — system context (confirmation architecture + test conventions)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/system_context.md
  why: "### Confirmation System" explains the single-slot design and the two callers
        (cancelForm via handleCancelRequest, popToIndex). "### Test Conventions" lists the
        render()/screen/fireEvent/act + waitFor conventions used here.
  section: "### Confirmation System" and "## Test Conventions"

# TEST PATTERNS — host cancelForm() action (mirror this fixture style)
- file: src/components/__tests__/FormStackProvider.autoRender.test.tsx
  why: describe('cancelForm action', ...) at :383 is the canonical host cancelForm() test:
        CapturingOpener (awaits openForm → onResult), HostShell (FormStackViewport + host-close
        button calling cancelForm()), useFormStackActions/useFormStackState hooks.
        assert onResult not-called (Keep Editing) vs toHaveBeenCalledWith(undefined) (Discard),
        getByRole('alertdialog', { hidden: true }), getByText('Keep Editing'/'Discard').
  pattern: NO HTMLDialogElement mock in THIS file — but dialog integration tests DO need it
        (see next). autoRender tests use getByRole('alertdialog') WITHOUT {hidden:true} in
        some places; the REENTRANCY test MUST use { hidden: true } because native <dialog>
        is hidden in JSDOM. Mirror ConfirmationDialog.integration.test.tsx for the mock.

# TEST PATTERNS — JSDOM dialog mock + { hidden: true } query (REQUIRED for the new test)
- file: src/components/__tests__/ConfirmationDialog.integration.test.tsx
  why: beforeEach sets HTMLDialogElement.prototype.showModal = vi.fn() and .close = vi.fn()
        (JSDOM lacks showModal). Uses getByRole('alertdialog', { hidden: true }) and
        getByText('Discard Changes?'), getByText('Keep Editing'), getByText('Discard').
        Also the canonical confirmOnCancel:true flow (open → cancel-btn → dialog → Keep/Discard).
  pattern: arrange(open) → act(open) → act(cancel trigger) → assert dialog present →
        act(click Keep/Discard) → waitFor(assert settlement).

# REDUCER — confirms double POP_FORM safety in the Discard path
- file: src/context/formStackReducer.ts
  why: POP_FORM returns state unchanged when state.stack.length === 0. So the second
        cancelForm() in a coalesced Discard (which dispatches POP_FORM on an already-empty
        stack) is a harmless no-op. No special handling needed.

# Spec — the PRD lines this satisfies
- file: PRD.md
  why: §5.2 cancelForm/popToIndex return promises that must settle; §8 Cancellation & Dirty
        State (confirmation); §10.1 host pattern wires Escape/backdrop/close to cancelForm().
  section: §5.2, §8, §10.1
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── package.json                 # scripts: test = "vitest run", type-check = "tsc --noEmit"
├── src/
│   ├── components/
│   │   ├── FormStackProvider.tsx          # ← EDIT: PendingConfirmation + requestConfirmation + handlers
│   │   ├── ConfirmationDialog.tsx         # READ-ONLY (title logic already reads affectedForms.length)
│   │   └── __tests__/
│   │       ├── ConfirmationDialog.integration.test.tsx     # pattern reference (dialog mock + flows)
│   │       ├── FormStackProvider.autoRender.test.tsx        # pattern reference (host cancelForm action)
│   │       └── ConfirmationReentrancy.integration.test.tsx  # ← NEW: concurrent-cancel coalescing test
│   └── context/
│       └── formStackReducer.ts            # READ-ONLY (POP_FORM no-op on empty stack — Discard safety)
└── plan/002_32eb66cd705d/bugfix/001_f635210a7f29/
    ├── architecture/{issue_analysis,system_context}.md
    └── P1M1T2S1/                          # ← THIS PRP lives here
```

### Desired Codebase tree with files to be added/changed

```bash
src/components/FormStackProvider.tsx                                   # MODIFIED — coalescing confirmation
src/components/__tests__/ConfirmationReentrancy.integration.test.tsx   # NEW — concurrent-cancel test
# (ConfirmationDialog.tsx, formStackReducer.ts, and all other files UNCHANGED)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: requestConfirmation MUST switch to the FUNCTIONAL setState form.
//   The bug is literally that it uses the VALUE form setPendingConfirmation({ ... }),
//   which overwrites. The fix is setPendingConfirmation((prev) => prev ? {...merge} : {...new}).
//   If you keep the value form, you have NOT fixed anything.

// CRITICAL: when merging resolvers, construct a NEW Set from the spread of the old one.
//   `new Set([...prev.resolvers, resolve])` — never mutate prev.resolvers in place
//   (React state must be treated as immutable; mutating the prior Set can corrupt
//   the in-flight render's reference).

// CRITICAL: the handlers MUST resolve waiters INSIDE the functional updater and return null:
//     setPendingConfirmation((prev) => { prev?.resolvers.forEach((r) => r(true)); return null; });
//   Two reasons: (1) it reads the CURRENT pendingConfirmation (defeats stale-closure bugs);
//   (2) it clears the slot atomically. Resolving outside the updater (e.g. reading a stale
//   closure variable) re-introduces the orphaning bug under re-renders.

// GOTCHA (handler stability): both handlers currently have [pendingConfirmation] in their
//   useCallback deps. After the fix they read nothing from closure (the functional updater
//   receives prev), so deps become []. This is REQUIRED, not optional — it is what makes them
//   stable and removes them as a re-render trigger. Leaving [pendingConfirmation] would still
//   WORK functionally but defeats half the purpose and breaks the "stable handlers" claim.

// GOTCHA (double-pop in Discard): when two coalesced cancelForm()s both confirm, each runs
//   top.deferred.resolve(undefined) + dispatch({type:'POP_FORM'}). The 2nd POP_FORM targets an
//   already-empty stack — formStackReducer returns state UNCHANGED (verified: POP_FORM no-ops
//   when length===0). The 2nd resolve on an already-resolved deferred is also a no-op. So the
//   Discard path is safe with NO extra dedup logic. Do not add a guard — it is unnecessary and
//   out of scope.

// GOTCHA (plural title): the JSX title uses `pendingConfirmation.affectedForms.length > 1`.
//   After coalescing, if two DIFFERENT forms trigger confirmation, length becomes 2 → the plural
//   "Discard Changes to N Forms?" title fires. This is correct and intended. Do not change the JSX.

// GOTCHA (JSDOM native dialog): the new integration test MUST mock
//   HTMLDialogElement.prototype.showModal and .close (JSDOM lacks showModal) in a beforeEach,
//   AND query the dialog with getByRole('alertdialog', { hidden: true }) because a native
//   <dialog> without an open attribute is not in the accessibility tree. See
//   ConfirmationDialog.integration.test.tsx for the exact mock.

// GOTCHA (two cancelForm() in one tick): cancelForm is async and suspends at its first await
//   (await handleCancelRequest → await requestConfirmation). The requestConfirmation Promise
//   executor runs SYNCHRONOUSLY, so setPendingConfirmation fires before suspension. Calling
//   cancelForm() twice in a single click handler therefore produces two functional setState
//   calls in the same batch → they coalesce correctly. This is the deterministic repro.

// TOOLING: Vitest 2.1 + @testing-library/react 16 + jsdom 25. Validation = `tsc --noEmit`
//   + `vitest run`. NOT ruff/mypy/pytest/uv.
```

---

## Implementation Blueprint

### Data models and structure

No new data models. One interface field change:

```typescript
// src/components/FormStackProvider.tsx — interface change (the ONLY data-model edit)
interface PendingConfirmation {
  /** Form names/IDs that would be cancelled (merged across concurrent requests) */
  affectedForms: string[];
  /** All waiters awaiting the user's answer — resolved together when the user responds */
  resolvers: Set<(confirmed: boolean) => void>;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: WRITE FAILING TEST FIRST (TDD) — src/components/__tests__/ConfirmationReentrancy.integration.test.tsx
  - CREATE the file using the COMPLETE copy-ready body below (JSDOM dialog mock + DualCancelHost
        fixture that fires cancelForm() twice and tracks both settlements via data-testid spans,
        + three it() blocks). This is a NEW file — do not modify any existing test file.

    ┌─── src/components/__tests__/ConfirmationReentrancy.integration.test.tsx ───────────────┐
    │ import { useState } from 'react';                                                       │
    │ import { describe, it, expect, vi, beforeEach } from 'vitest';                          │
    │ import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';       │
    │ import { FormStackProvider } from '../FormStackProvider';                               │
    │ import { FormStackViewport } from '../FormStackViewport';                               │
    │ import { useFormStackActions, useFormStackState } from '../../hooks';                   │
    │ import type { FormProps } from '../../types';                                           │
    │                                                                                          │
    │ // JSDOM lacks showModal/close — required for every dialog integration test in this repo │
    │ beforeEach(() => {                                                                       │
    │   HTMLDialogElement.prototype.showModal = vi.fn();                                       │
    │   HTMLDialogElement.prototype.close = vi.fn();                                           │
    │ });                                                                                      │
    │                                                                                          │
    │ // Minimal form with the props the renderer injects (no buttons needed — cancellation    │
    │ // is driven by the host's cancelForm() below).                                          │
    │ function StubForm({ onSubmit, onCancel }: FormProps<unknown>) {                          │
    │   return (                                                                               │
    │     <div data-testid="stub-form">                                                       │
    │       <button data-testid="stub-submit" onClick={() => onSubmit({ ok: true })}>         │
    │         Submit                                                                           │
    │       </button>                                                                          │
    │       <button data-testid="stub-cancel" onClick={onCancel}>Cancel</button>              │
    │     </div>                                                                              │
    │   );                                                                                    │
    │ }                                                                                       │
    │                                                                                       │
    │ /**
    │  * Host shell that (a) opens a confirmOnCancel form, (b) has a button firing
    │  * cancelForm() TWICE in one click, and (c) exposes settlement of BOTH returned
    │  * promises via data-testid spans (flipped to "true" in each promise's .finally).
    │  * Also exposes stack.length and the openForm() result.
    │  */
    │ function DualCancelHost({
    │   onResult,
    │ }: {
    │   onResult: (val: unknown) => void;
    │ }) {
    │   const { openForm, cancelForm } = useFormStackActions();
    │   const { stack } = useFormStackState();
    │   const [settled, setSettled] = useState<[boolean, boolean]>([false, false]);
    │
    │   const open = async () => {
    │     const result = await openForm({
    │       id: 'f1',
    │       component: StubForm,
    │       label: 'F1',
    │       confirmOnCancel: true,
    │     });
    │     onResult(result);
    │   };
    │
    │   // Fire cancelForm() TWICE in one tick and track both settlements.
    │   const doubleCancel = () => {
    │     [cancelForm(), cancelForm()].forEach((p, i) => {
    │       p.finally(() =>
    │         setSettled((prev) => {
    │           const next = [...prev] as [boolean, boolean];
    │           next[i] = true;
    │           return next;
    │         }),
    │       );
    │     });
    │   };
    │
    │   return (
    │     <div>
    │       <span data-testid="stack-length">{stack.length}</span>
    │       <span data-testid="settled-0">{String(settled[0])}</span>
    │       <span data-testid="settled-1">{String(settled[1])}</span>
    │       <FormStackViewport />
    │       <button data-testid="open" onClick={open}>open</button>
    │       <button data-testid="double-cancel" onClick={doubleCancel}>double cancel</button>
    │     </div>
    │   );
    │ }
    │
    │ describe('Confirmation re-entrancy (Issue 2)', () => {
    │   it('coalesces concurrent cancelForm() requests — one Keep Editing click settles BOTH', async () => {
    │     const onResult = vi.fn();
    │     render(
    │       <FormStackProvider autoRender={false}>
    │         <DualCancelHost onResult={onResult} />
    │       </FormStackProvider>,
    │     );
    │
    │     await act(async () => { fireEvent.click(screen.getByTestId('open')); });
    │     expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
    │
    │     // Fire two cancelForm() in flight.
    │     await act(async () => { fireEvent.click(screen.getByTestId('double-cancel')); });
    │
    │     // Exactly ONE dialog (the second request coalesced onto the first).
    │     expect(screen.getByRole('alertdialog', { hidden: true })).toBeInTheDocument();
    │
    │     // Respond ONCE.
    │     await act(async () => { fireEvent.click(screen.getByText('Keep Editing')); });
    │
    │     // CRITICAL: BOTH cancelForm() promises must settle (previously the FIRST hung forever).
    │     await waitFor(() => {
    │       expect(screen.getByTestId('settled-0')).toHaveTextContent('true');
    │       expect(screen.getByTestId('settled-1')).toHaveTextContent('true');
    │     });
    │
    │     // Keep Editing = cancel rejected → form stays open, openForm() still pending.
    │     expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
    │     expect(screen.queryByRole('alertdialog')).toBeNull();
    │     expect(onResult).not.toHaveBeenCalled();
    │   });
    │
    │   it('coalesces concurrent cancelForm() requests — one Discard click settles BOTH and clears the stack', async () => {
    │     const onResult = vi.fn();
    │     render(
    │       <FormStackProvider autoRender={false}>
    │         <DualCancelHost onResult={onResult} />
    │       </FormStackProvider>,
    │     );
    │
    │     await act(async () => { fireEvent.click(screen.getByTestId('open')); });
    │     await act(async () => { fireEvent.click(screen.getByTestId('double-cancel')); });
    │
    │     expect(screen.getByRole('alertdialog', { hidden: true })).toBeInTheDocument();
    │
    │     await act(async () => { fireEvent.click(screen.getByText('Discard')); });
    │
    │     // Both promises settle on the single confirm.
    │     await waitFor(() => {
    │       expect(screen.getByTestId('settled-0')).toHaveTextContent('true');
    │       expect(screen.getByTestId("settled-1")).toHaveTextContent('true');
    │     });
    │
    │     // Discard = cancel confirmed → stack clears to 0, openForm() resolves undefined.
    │     // (The 2nd POP_FORM on the now-empty stack is a reducer no-op; the 2nd resolve on an
    │     // already-settled deferred is a no-op — both safe.)
    │     await waitFor(() => { expect(onResult).toHaveBeenCalledWith(undefined); });
    │     expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
    │     expect(screen.queryByRole('alertdialog')).toBeNull();
    │   });
    │
    │   // Regression guard: the single-request path is unchanged by the coalescing fix.
    │   it('single cancelForm() still behaves as before (Keep Editing keeps, Discard clears)', async () => {
    │     const onResult = vi.fn();
    │     function SingleCancelHost({ onResult }: { onResult: (v: unknown) => void }) {
    │       const { openForm, cancelForm } = useFormStackActions();
    │       const { stack } = useFormStackState();
    │       const open = async () => {
    │         const r = await openForm({ id: 'f1', component: StubForm, label: 'F1', confirmOnCancel: true });
    │         onResult(r);
    │       };
    │       return (
    │         <div>
    │           <span data-testid="stack-length">{stack.length}</span>
    │           <FormStackViewport />
    │           <button data-testid="open" onClick={open}>open</button>
    │           <button data-testid="single-cancel" onClick={() => cancelForm()}>cancel</button>
    │         </div>
    │       );
    │     }
    │     render(
    │       <FormStackProvider autoRender={false}>
    │         <SingleCancelHost onResult={onResult} />
    │       </FormStackProvider>,
    │     );
    │     await act(async () => { fireEvent.click(screen.getByTestId('open')); });
    │     await act(async () => { fireEvent.click(screen.getByTestId('single-cancel')); });
    │     expect(screen.getByRole('alertdialog', { hidden: true })).toBeInTheDocument();
    │     await act(async () => { fireEvent.click(screen.getByText('Keep Editing')); });
    │     expect(screen.queryByRole('alertdialog')).toBeNull();
    │     expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
    │     expect(onResult).not.toHaveBeenCalled();
    │   });
    │ });
    │ └───────────────────────────────────────────────────────────────────────────┘

  - NOTES on the fixture: autoRender={false} + an explicit <FormStackViewport/> mirrors the
        §10.1 host pattern and keeps the form mounted visibly (same as FormStackProvider.autoRender
        tests). The DualCancelHost fires BOTH cancelForm()s inside ONE onClick handler (one tick) so
        both setPendingConfirmation calls land in the same React batch — the deterministic repro.
        useState for `settled` + setSettled inside each promise's .finally lets the test assert
        settlement via waitFor on the data-testid spans (the .finally runs during the act() of the
        dialog click but the state flush is observed through waitFor).
  - RUN: npx vitest run src/components/__tests__/ConfirmationReentrancy.integration.test.tsx
        → the "Keep Editing settles BOTH" test FAILS today: settled-0 stays "false" (the FIRST
        cancelForm() promise never resolves because the second overwrites its resolver). The
        "Discard settles BOTH" test also fails (first promise orphaned). The single-cancel
        regression test PASSES today. That is the expected RED state before Task 2-4.

Task 2: EDIT src/components/FormStackProvider.tsx — PendingConfirmation interface
  - LOCATE (~line 82):
        interface PendingConfirmation {
          /** Form names/IDs that would be cancelled */
          affectedForms: string[];
          /** Callback when user responds */
          resolve: (confirmed: boolean) => void;
        }
  - REPLACE WITH:
        interface PendingConfirmation {
          /** Form names/IDs that would be cancelled (merged across concurrent requests) */
          affectedForms: string[];
          /** All concurrent waiters — resolved together when the user responds */
          resolvers: Set<(confirmed: boolean) => void>;
        }

Task 3: EDIT src/components/FormStackProvider.tsx — requestConfirmation (coalesce)
  - LOCATE (~lines 108-113):
        const requestConfirmation = useCallback((affectedForms: string[]): Promise<boolean> => {
          return new Promise((resolve) => {
            setPendingConfirmation({ affectedForms, resolve });
          });
        }, []);
  - REPLACE WITH (FUNCTIONAL setState — coalesce concurrent waiters):
        const requestConfirmation = useCallback((affectedForms: string[]): Promise<boolean> => {
          return new Promise((resolve) => {
            setPendingConfirmation((prev) => {
              if (prev) {
                // Coalesce: merge into the existing pending confirmation so all
                // concurrent waiters are resolved together (Issue 2 fix).
                return {
                  affectedForms: [...new Set([...prev.affectedForms, ...affectedForms])],
                  resolvers: new Set([...prev.resolvers, resolve]),
                };
              }
              return { affectedForms, resolvers: new Set([resolve]) };
            });
          });
        }, []);
  - NOTE: deps stay []. The function reads NOTHING from closure (prev is passed in).

Task 4: EDIT src/components/FormStackProvider.tsx — handlers (stable, iterate Set)
  - LOCATE (~lines 219-231):
        const handleConfirmationConfirm = useCallback(() => {
          if (pendingConfirmation) {
            pendingConfirmation.resolve(true);
            setPendingConfirmation(null);
          }
        }, [pendingConfirmation]);

        const handleConfirmationCancel = useCallback(() => {
          if (pendingConfirmation) {
            pendingConfirmation.resolve(false);
            setPendingConfirmation(null);
          }
        }, [pendingConfirmation]);
  - REPLACE WITH (resolve ALL waiters inside functional updater; stable deps):
        const handleConfirmationConfirm = useCallback(() => {
          setPendingConfirmation((prev) => {
            prev?.resolvers.forEach((resolver) => resolver(true));
            return null;
          });
        }, []);

        const handleConfirmationCancel = useCallback(() => {
          setPendingConfirmation((prev) => {
            prev?.resolvers.forEach((resolver) => resolver(false));
            return null;
          });
        }, []);
  - RUN: npx vitest run src/components/__tests__/ConfirmationReentrancy.integration.test.tsx
        → the Task-1 tests now PASS (green). Both promises settle on a single click.

Task 5: PROJECT-WIDE VALIDATION
  - RUN: npx tsc --noEmit → expect exit 0. (Risk: ensure `resolve` → `resolvers` rename has no
        leftover references. Grep `pendingConfirmation.resolve` → should be 0 hits.)
  - RUN: npx vitest run → expect all green (existing suite incl. ConfirmationDialog.integration
        + FormStackProvider.autoRender cancelForm tests + new reentrancy tests). 0 regressions.
  - RUN: git status --short → expect EXACTLY:
        M src/components/FormStackProvider.tsx
        ?? src/components/__tests__/ConfirmationReentrancy.integration.test.tsx
    NOTHING else.

Task 6: SCOPE-HYGIENE CHECK
  - CONFIRM ConfirmationDialog.tsx, formStackReducer.ts, FormStackRenderer.tsx, FormErrorBoundary.tsx
        are UNCHANGED (grep git diff --name-only).
  - CONFIRM no `pendingConfirmation.resolve` references remain in FormStackProvider.tsx.
  - CONFIRM handleConfirmationConfirm/handleConfirmationCancel deps are [] (grep `}, \[\]);` after each).
  - CONFIRM the <ConfirmationDialog> JSX title logic is untouched (still reads affectedForms.length).
```

### Implementation Patterns & Key Details

```typescript
// --- PATTERN: coalescing requestConfirmation (functional setState) ---
const requestConfirmation = useCallback((affectedForms: string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    setPendingConfirmation((prev) => {
      if (prev) {
        // De-dup affectedForms (Set spread) + add this resolver to the existing Set.
        return {
          affectedForms: [...new Set([...prev.affectedForms, ...affectedForms])],
          resolvers: new Set([...prev.resolvers, resolve]),
        };
      }
      return { affectedForms, resolvers: new Set([resolve]) };
    });
  });
}, []); // [] — reads nothing from closure (prev is the updater arg)

// --- PATTERN: stable handlers resolve ALL waiters, then clear the slot ---
const handleConfirmationConfirm = useCallback(() => {
  setPendingConfirmation((prev) => {
    prev?.resolvers.forEach((resolver) => resolver(true)); // settle every waiter
    return null;                                           // clear the slot atomically
  });
}, []); // [] — stable (no pendingConfirmation closure read)

const handleConfirmationCancel = useCallback(() => {
  setPendingConfirmation((prev) => {
    prev?.resolvers.forEach((resolver) => resolver(false));
    return null;
  });
}, []);

// --- UNCHANGED: <ConfirmationDialog> title still reads affectedForms.length ---
// (in the return JSX) — the field name is unchanged; coalesced forms now make the
// plural "Discard Changes to N Forms?" fire correctly. Do NOT touch this JSX.
title={
  pendingConfirmation && pendingConfirmation.affectedForms.length > 1
    ? `Discard Changes to ${pendingConfirmation.affectedForms.length} Forms?`
    : 'Discard Changes?'
}
```

### Integration Points

```yaml
MODIFIES (this subtask):
  - src/components/FormStackProvider.tsx:
        * PendingConfirmation interface (resolve → resolvers: Set<...>)
        * requestConfirmation (value setState → functional coalescing setState)
        * handleConfirmationConfirm / handleConfirmationCancel (iterate Set, functional setState, [] deps)
  - src/components/__tests__/ConfirmationReentrancy.integration.test.tsx (NEW)

NO INTEGRATION CHURN:
  - ConfirmationDialog.tsx: UNCHANGED (title logic reads affectedForms.length — field name preserved).
  - formStackReducer.ts: UNCHANGED (POP_FORM already no-ops on empty stack — Discard double-pop safe).
  - exports: UNCHANGED (PendingConfirmation is a non-exported internal interface).
  - Public hooks/actions: UNCHANGED (cancelForm/popToIndex signatures & behavior identical for the
        single-request path; only the concurrent path is repaired).
  - No database / config / route / env changes (pure component-state behavior fix).

PARALLEL-SAFETY:
  - P1.M1.T1.S2 (running concurrently) edits FormStackRenderer.tsx + src/types/form.ts + creates
        FormOnError.integration.test.tsx. This task edits ONLY FormStackProvider.tsx + a NEW test
        file. ZERO file overlap → no merge conflict.
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
cd /home/dustin/projects/geoform
npx tsc --noEmit
# Expected: exit 0. Risk spots to watch if it errors:
#   - Leftover `pendingConfirmation.resolve(...)` → must be 0 (rename to resolvers iteration).
#   - `prev.resolvers` type — Set<(confirmed: boolean) => void>; forEach callback typed.
#   - The handler useCallback deps: ensure BOTH are [] (a leftover [pendingConfirmation] dep
#     would reference the now-unused binding and could trigger an eslint exhaustive-deps warning,
#     but NOT a tsc error — still fix it).
# (TS/React project — tsc is the type gate. No ruff/mypy/black.)
```

### Level 2: Unit / Component Tests (Targeted)

```bash
cd /home/dustin/projects/geoform
# The new reentrancy test (fastest, tightest guard for the fix)
npx vitest run src/components/__tests__/ConfirmationReentrancy.integration.test.tsx
# Expected: green — both "Keep Editing" and "Discard" paths settle BOTH cancelForm() promises.

# Existing confirmation flows must stay green (regression guard for the single-request path)
npx vitest run src/components/__tests__/ConfirmationDialog.integration.test.tsx
npx vitest run src/components/__tests__/FormStackProvider.autoRender.test.tsx
# Expected: green (the coalescing fix does not change single-request behavior).
```

### Level 3: Integration / Full-Suite Regression

```bash
cd /home/dustin/projects/geoform
# Full suite — confirms no regressions across lifecycle, breadcrumbs, viewport, etc.
npx vitest run
# Expected: all green. Baseline at audit time was 294/294 → 298 → ~300+ after the parallel
# P1.M1.T1 work; expect all of those + the new reentrancy tests. 0 failures.
# If a PRE-EXISTING test fails, your edit broke the single-request confirmation path —
# re-check that the JSX title and the functional-setState updaters are correct.
```

### Level 4: Scope-Hygiene & Contract Validation (critical for a one-file fix)

```bash
cd /home/dustin/projects/geoform
git status --short
# Expected EXACTLY:
#   M src/components/FormStackProvider.tsx
#   ?? src/components/__tests__/ConfirmationReentrancy.integration.test.tsx
# NOTHING else — especially NOT ConfirmationDialog.tsx, formStackReducer.ts, FormStackRenderer.tsx,
# FormErrorBoundary.tsx, any export file, PRD.md, tasks.json, prd_snapshot.md.

# Confirm no leftover single-resolver references:
grep -n "pendingConfirmation.resolve\|\.resolve(true)\|\.resolve(false)" src/components/FormStackProvider.tsx
# Expected: ZERO hits (the resolve calls are now `resolver(true/false)` inside forEach updaters).

# Confirm both handlers are stable (empty dep arrays):
grep -n "handleConfirmationConfirm\|handleConfirmationCancel" src/components/FormStackProvider.tsx
# Expected: the definitions end with `}, []);` (NOT `}, [pendingConfirmation]);`).

# Confirm coalescing is in place:
grep -n "resolvers: new Set\|new Set(\[\.\.\.prev" src/components/FormStackProvider.tsx
# Expected: hits in requestConfirmation (coalesce branch) and the new-slot branch.

# Confirm only FormStackProvider.tsx changed among source:
git diff --name-only | grep -v "ConfirmationReentrancy" | grep "\.tsx\?$"
# Expected: ONLY src/components/FormStackProvider.tsx.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npx tsc --noEmit` exits 0.
- [ ] `npx vitest run src/components/__tests__/ConfirmationReentrancy.integration.test.tsx` green (both Keep-Editing and Discard paths settle BOTH promises).
- [ ] `npx vitest run` green project-wide (0 regressions; existing confirmation/cancelForm tests intact).
- [ ] Level 4 scope check: exactly 1 modified source file + 1 new test file.

### Feature Validation

- [ ] `PendingConfirmation` has `resolvers: Set<(confirmed: boolean) => void>`; no `resolve` field.
- [ ] `requestConfirmation` uses functional `setPendingConfirmation((prev) => ...)` and coalesces (de-dups `affectedForms` + adds resolver to existing Set).
- [ ] `handleConfirmationConfirm`/`handleConfirmationCancel` iterate the Set inside a functional updater returning `null`, with `[]` deps.
- [ ] Two rapid `cancelForm()` calls show exactly **one** dialog.
- [ ] One "Keep Editing" click settles **both** tracked promises (form stays open; `openForm()` unresolved).
- [ ] One "Discard" click settles **both** and clears the stack to 0 (`openForm()` → `undefined`).
- [ ] Single `cancelForm()` still behaves exactly as before (regression it() passes).

### Code Quality Validation

- [ ] New `Set`s are constructed (immutable update), never mutated in place.
- [ ] No `pendingConfirmation` left in any `useCallback` dep array (handlers are stable).
- [ ] `<ConfirmationDialog>` JSX title logic unchanged (still reads `affectedForms.length`).
- [ ] Test follows repo conventions: JSDOM dialog mock, `act`/`waitFor`, `{ hidden: true }` dialog query, `data-testid` exposure.
- [ ] Anti-patterns avoided (see below): no value-form setState in requestConfirmation, no stale-closure reads in handlers, no unnecessary double-pop guard.

### Documentation & Deployment

- [ ] No user-facing/config/API/export surface change (item DOCS: none). `PendingConfirmation` is internal.
- [ ] No new env vars / config.
- [ ] (README / overview docs are P1.M3.T1's job — not this subtask.)

---

## Anti-Patterns to Avoid

- ❌ Don't keep the **value form** `setPendingConfirmation({ ... })` in `requestConfirmation`. That
  is literally the bug. Use the **functional form** `setPendingConfirmation((prev) => ...)`.
- ❌ Don't mutate `prev.resolvers` in place (e.g. `prev.resolvers.add(resolve)`). React state is
  immutable — construct a **new** `Set` via `new Set([...prev.resolvers, resolve])`.
- ❌ Don't resolve the waiters OUTSIDE the functional updater (e.g. `const p = pendingConfirmation;
  p.resolvers.forEach(...)` then a separate `setPendingConfirmation(null)`). Reading
  `pendingConfirmation` from closure re-introduces the stale-closure/orphaning risk. Resolve
  **inside** the updater against `prev`.
- ❌ Don't leave `[pendingConfirmation]` in the handlers' `useCallback` deps. After the fix they
  read nothing from closure → deps MUST be `[]`. (Functional, but defeats the stability purpose.)
- ❌ Don't add a guard against the double `POP_FORM` / double `resolve(undefined)` in the Discard
  path. `formStackReducer` POP_FORM is a no-op on an empty stack, and re-resolving an already-settled
  promise is a no-op. A guard is unnecessary scope.
- ❌ Don't change the `<ConfirmationDialog>` JSX title logic or `ConfirmationDialog.tsx`. The title
  already reads `affectedForms.length`; coalesced forms just make the plural title fire correctly.
- ❌ Don't forget the JSDOM `HTMLDialogElement.prototype.showModal`/`close` mock in the new test, and
  don't query the dialog without `{ hidden: true }` — a native `<dialog>` is not in the a11y tree
  in JSDOM until opened, so `getByRole('alertdialog')` (no flag) will throw "not found".
- ❌ Don't assert settlement synchronously — the promises settle during the `act()` of clicking the
  dialog button, but `.finally`/state updates flush asynchronously. Use `waitFor(...)` with a
  timeout to assert the tracked-settlement spans flip to `"true"`.
- ❌ Don't run ruff/mypy/pytest/uv — this is a TS/React project; the gates are `tsc` + `vitest`.

---

## Confidence Score

**9 / 10** for one-pass success. The fix is three small, exactly-specified edits to a single
file (interface field rename, functional-setState coalescing in `requestConfirmation`,
stable iterating handlers) — every line of replacement code is quoted verbatim from the
architecture analysis and the item contract. The reducer's `POP_FORM`-on-empty-stack no-op
is verified, so the Discard double-pop is a non-issue. The new integration test is fully
specified, including the JSDOM dialog mock (required), the dual-`cancelForm()` fixture
(mirroring the proven `HostShell`/`CapturingOpener` pattern from
`FormStackProvider.autoRender.test.tsx`), and `waitFor`-based settlement assertions. The
only residual risk is the exact shape of the dual-promise tracking fixture — addressed by
giving copy-ready component code in the Implementation Tasks. No file overlap with the
concurrent P1.M1.T1.S2 work, so no merge conflict.
