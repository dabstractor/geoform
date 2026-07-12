# Conformance Audit Findings — Delta 0.2.0 (Requirement D1)

Source: independent read-only audit (reviewer subagent) + direct code
inspection. Cross-checked against `delta_prd.md` §4 (D1) and `PRD.md` §5.1, §5.2,
§10, §10.1, §16. No code was modified during the audit.

## Tooling (verified)
- `npx tsc --noEmit` → **PASS** (exit 0).
- `npx vitest run` → **PASS**, **286/286** tests across 26 files.

## D1 Conformance Bullets — ALL PASS

| # | Bullet | Verdict | Evidence |
|---|--------|---------|----------|
| 1 | `cancelForm()` no-op on empty stack; resolves top deferred with `undefined` | **PASS** | `FormStackProvider.tsx:213-222` (`if (!top) return;` then `top.deferred.resolve(undefined)`). Tests: `FormStackProvider.autoRender.test.tsx` empty-stack + non-confirmOnCancel blocks. |
| 2 | `cancelForm()` honors `confirmOnCancel` (confirm→resolve→pop) | **PASS** | `handleCancelRequest` (`:200-206`) gates on `entry.confirmOnCancel`; `cancelForm` awaits + early-returns on reject (`:216-219`). Tests: confirmOnCancel show-dialog + reject-keeps-form blocks. |
| 3 | `popToIndex(index)` cancels all deeper forms | **PASS** | `popToIndex` (`:156-197`) reverses through `state.stack.slice(index+1)`, resolves each `deferred.resolve(undefined)`, then `dispatch POP_TO_INDEX`. Tests: `BreadcrumbNavigation.integration`, `Breadcrumbs.integration`, boundary tests. |
| 4 | Dev-mode forgotten-host guard warns ≤ once per episode | **PASS** | `FormStackProvider.tsx:263-283` `warnedForgottenHostRef` gates; resets when viewport mounts / stack clears. Tests: autoRender test suite dev-mode block (warns / doesn't-warn-when-mounted / at-most-once). |
| 5 | `FormStackViewportValue` assignable to `FormStackRendererProps` | **PASS** | Field-for-field identical (`types/context.ts:10-22` vs `FormStackRenderer.tsx:6-14`). Compile-time guard test in `useFormStackViewport.test.tsx`. |
| 6 | `openForm()` promise contract unchanged (additive only) | **PASS** | `openForm` (`:87-108`) unchanged; resolution via injected `onSubmit`/`onCancel`. Lifecycle/integration suites green. |
| 7 | All new public symbols exported from `src/index.ts` | **PASS** | `FormStackViewport` (component), `useFormStackViewport` (hook), `FormStackViewportValue` (type) are standalone exports; `cancelForm`/`popToIndex` are action methods on `FormStackActions`. |

## Mismatches Found

### MISMATCH 1 (genuine — FIX): `popToIndex` absent from `useFormStack()`

- `useFormStack()` returns `{ stack, openForm, closeForm, cancelForm }` —
  **no `popToIndex`** (`useFormStack.ts:158-160`).
- `UseFormStackReturn` interface declares no `popToIndex` (`useFormStack.ts:21-110`).
- `useFormStackActions()` DOES expose `popToIndex` (`FormStackActions`,
  `types/context.ts:82`).
- `delta_prd.md` §3: *"useFormStack / useFormStackActions now surface cancelForm
  / popToIndex"* — both hooks expected to surface both. PRD §5.2 lists
  `popToIndex` under the `useFormStack()` section.
- `cancelForm` (sibling, same delta) IS on both hooks; no principled reason to
  omit `popToIndex` from the combined hook.

**Severity:** low (still reachable via `useFormStackActions()`; no current
breakage). **But** a consumer following PRD §5.2 writing
`const { popToIndex } = useFormStack()` gets `undefined` + a TS error.

**RECOMMENDED FIX (additive, ~2 lines):**
```ts
// UseFormStackReturn interface — add:
popToIndex: (index: number) => void;

// useFormStack() body:
const { openForm, closeForm, popToIndex, cancelForm } = useFormStackActions();
return { stack, openForm, closeForm, popToIndex, cancelForm };
```
Add a test asserting `useFormStack()` exposes `popToIndex` and that it works.

### NOTE 2 (not a fix — matches PRD): `popToIndex` return type `void` vs async impl

- `FormStackActions.popToIndex` declared `(index: number) => void`
  (`types/context.ts:82`) — **matches PRD §5.2** (`void`).
- Implementation is `async` (`FormStackProvider.tsx:156`), returning
  `Promise<void>`. TS accepts this (special void-return rule); `tsc` clean.
- **No action required** — the type matches the PRD. The only nuance is that a
  typed caller cannot `.catch` the dev-mode `RangeError` (becomes an unhandled
  rejection in dev). This is acceptable for a dev-only assertion and is
  consistent with the spec. Leave as `void`.

## AUDIT CONCLUSION

Behavioral spec is fully met (all 7 D1 bullets pass; build + tests green).
Exactly **one** genuine mismatch to fix: add `popToIndex` to the
`useFormStack()` combined hook surface (additive, tested). No other code changes
required. Output audit note to `plan/002_32eb66cd705d/audit_note.md` as the
formal deliverable of the audit task.
