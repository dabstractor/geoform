# Conformance Audit Note — Delta 0.2.0 (Requirement D1)

**Scope:** Delta 0.2.0 conformance audit — formal note (deliverable D1).

**Spec references:** `delta_prd.md` §4 D1, §7; `PRD.md` §5.1, §5.2, §10, §10.1, §16.

**Source evidence:** `plan/002_32eb66cd705d/architecture/audit_findings.md`
(working audit; this note is its formal, citable distillation).

> No source code was modified to produce this note. It records the pre-fix state;
> the single open gap is resolved in the sibling task **P1.M1.T1.S2**.

## Tooling evidence (re-run at note-writing time)

Commands run from repo root at the time this note was written (not inherited
from the audit):

- `npx tsc --noEmit` → **PASS** (exit 0, clean).
- `npx vitest run` → **PASS**, **286 / 286** tests passed across **26** files
  (0 failures).

These counts match the independent audit because no `src/` change has landed
between the audit and this note.

## D1 Conformance Bullets — ALL PASS

> One-line `file:line` citations are intentional (audit-grade, terse). Table
> rows exceed 80 cols by design.

| # | D1 Bullet (short) | Verdict | Evidence (`file:line`) | Covering test |
| - | ----------------- | ------- | ---------------------- | ------------- |
| 1 | `cancelForm()` no-op on empty stack; resolves top deferred `undefined` | **PASS** | `src/components/FormStackProvider.tsx:213-222` — guard `if (!top) return;` then `top.deferred.resolve(undefined)` | `src/components/__tests__/FormStackProvider.autoRender.test.tsx` (empty-stack + non-`confirmOnCancel` blocks) |
| 2 | `cancelForm()` honors `confirmOnCancel` (confirm → resolve → pop) | **PASS** | `FormStackProvider.tsx` `handleCancelRequest` (`:200-206`) gates on `entry.confirmOnCancel`; `cancelForm` awaits + early-returns on reject (`:216-219`) | `FormStackProvider.autoRender.test.tsx` (`confirmOnCancel` show-dialog + reject-keeps-form blocks) |
| 3 | `popToIndex(index)` cancels all deeper forms | **PASS** | `FormStackProvider.tsx:156-197` — reverses through `state.stack.slice(index+1)`, resolves each `deferred.resolve(undefined)`, then `dispatch POP_TO_INDEX` | `src/__tests__/integration/BreadcrumbNavigation.integration.test.tsx`; `src/components/__tests__/Breadcrumbs.integration.test.tsx` (boundary tests) |
| 4 | Dev-mode forgotten-host guard warns ≤ once per episode | **PASS** | `FormStackProvider.tsx:263-283` — `warnedForgottenHostRef` (`:263`), gate (`:268`), set-true (`:278`), reset on viewport-mount / stack-clear (`:281`) | `FormStackProvider.autoRender.test.tsx` (warns / doesn't-warn-when-mounted / at-most-once) |
| 5 | `FormStackViewportValue` assignable to `FormStackRendererProps` (no internal-type leakage) | **PASS** | `src/types/context.ts:17` (`FormStackViewportValue`) vs `src/components/FormStackRenderer.tsx:6-14` (`FormStackRendererProps`) — field-for-field identical | `src/hooks/__tests__/useFormStackViewport.test.tsx` (compile-time guard test) |
| 6 | `openForm()` promise contract unchanged (additive only) | **PASS** | `FormStackProvider.tsx` `openForm` (`:87-108`, unchanged; resolves via injected `onSubmit`/`onCancel`) | `src/__tests__/integration/FormLifecycle.integration.test.tsx` + existing lifecycle/integration suites |
| 7 | All new public symbols exported from `src/index.ts` | **PASS** | `src/index.ts:130` (`FormStackViewport`), `:317` (`useFormStackViewport`), `:407` (`FormStackViewportValue`); `cancelForm`/`popToIndex` are action methods on `FormStackActions` (`src/types/context.ts:82`) | `src/hooks/__tests__/useFormStackActions.test.tsx`; `src/hooks/__tests__/useFormStackViewport.test.tsx` |

## Mismatch register

### MISMATCH 1 (genuine — FIX in P1.M1.T1.S2): `popToIndex` absent from `useFormStack()`

- **Symptom:** `useFormStack()` returns `{ stack, openForm, closeForm, cancelForm }`
  — **no `popToIndex`** (`src/hooks/useFormStack.ts`;
  `grep -n popToIndex src/hooks/useFormStack.ts` → no hits). The
  `UseFormStackReturn` interface declares none.
- **Contrast:** `useFormStackActions()` **does** expose `popToIndex`
  (`src/types/context.ts:82`); the sibling `cancelForm` is present on
  **both** hooks.
- **Spec basis:** `delta_prd.md` §3 + `PRD.md` §5.2 both list `popToIndex` under
  `useFormStack()`.
- **Severity:** **low** — still reachable via `useFormStackActions()`; no current
  breakage. A consumer following PRD §5.2 writing
  `const { popToIndex } = useFormStack()` gets `undefined` + a TS error.
- **Recommended fix (additive, ~2 lines + test):** add
  `popToIndex: (index: number) => void` to `UseFormStackReturn`; destructure +
  return it in the hook body; add a test asserting `useFormStack()` exposes
  `popToIndex`.
- **Resolution:** implemented in the dependent sibling task **P1.M1.T1.S2**
  (which depends on this note existing). This note records, not resolves, the gap.

## Notes (no action)

### NOTE 2: `popToIndex` return type `void` matches PRD §5.2 — no action

- `FormStackActions.popToIndex` is declared `(index: number) => void`
  (`src/types/context.ts:82`) — **matches PRD §5.2**.
- The implementation is `async` (`FormStackProvider.tsx:156`), i.e. it returns
  `Promise<void>`. TypeScript accepts the `async`→`void` assignment
  (void-return rule); `tsc --noEmit` is clean.
- **Disposition: matches spec — no action.** Leave as `void`.

## Audit conclusion

The 0.2.0 behavioral specification is **fully met**: all seven D1 conformance
bullets PASS with `file:line` evidence and covering tests, and the tooling is
green at audit time (`tsc` exit 0; `vitest` 286/286 across 26 files). Exactly
**one** genuine mismatch remains — `popToIndex` is missing from the
`useFormStack()` combined hook — and it is resolved by an additive, tested fix
in **P1.M1.T1.S2**. No other code change is required for conformance.

**Final intended public hook surface (post-S2), for downstream consumers (e.g.
P1.M2 README sync):**

- `useFormStack()` → `{ stack, openForm, closeForm, popToIndex, cancelForm }`
- `useFormStackActions()` → same action set, including `popToIndex`

A reader of this note alone has the complete verdict, the single open gap and
its resolution, and the authoritative final hook surface.
