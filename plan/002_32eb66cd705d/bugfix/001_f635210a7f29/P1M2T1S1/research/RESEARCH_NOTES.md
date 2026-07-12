# Research Notes — P1.M2.T1.S1

**Work item**: Define internal context value type (`FormStackViewportContextValue`)
and sanitize public `FormStackViewportValue`. Type-definition **foundation** for
Issue 3 (internal-type leakage). Closes the **type-level** leak; S2 (P1.M2.T1.S2)
closes the **runtime** leak (hook mapping) + fixes the test file.

## The one hard sequencing fact (drives the whole PRP)

`InternalStackEntry<T> extends StackEntry` (src/types/stack.ts). Therefore after S1:

- `FormStackViewportContextValue` (internal: `stack: InternalStackEntry<unknown>[]`,
  `onClose`, `onCancelRequest`) is assignable to sanitized `FormStackViewportValue`
  (`stack: readonly StackEntry[]`, `onClose`) — because a subtype array is
  covariantly assignable to a readonly supertype array, and the extra
  `onCancelRequest` is allowed in non-literal assignment.
- ⇒ `useFormStackViewport.ts` (`return useContext(FormStackViewportContext)`)
  STILL COMPILES (it "lies" at runtime — returns the internal shape typed as the
  public shape — which is exactly why S2 must add the mapping).
- ⇒ `FormStackViewport.tsx` (`<FormStackRenderer {...viewport}/>`) STILL COMPILES
  (`FormStackViewportContextValue` is structurally identical to
  `FormStackRendererProps`).
- ⇒ `FormStackProvider.tsx` `viewportValue` useMemo (produces
  `{stack: state.stack, onClose, onCancelRequest}`) STILL COMPILES.

**So after S1, EVERY source file compiles. The ONLY tsc errors are in
`src/hooks/__tests__/useFormStackViewport.test.tsx`** — which is explicitly S2's
scope ("fix … tests"). This is the agreed S1→S2 handoff.

## Enumerated S2-handoff test errors (so S1's gate can verify them)

All in `src/hooks/__tests__/useFormStackViewport.test.tsx`:
1. ~line 58: `value.stack[0]?.confirmOnCancel` — TS2339 (StackEntry has no field).
2. ~line 60: `value.onCancelRequest` — TS2339 (removed from public Value).
3. ~lines 81-83: `entry?.component`, `entry?.deferred`, `entry?.deferred.resolve`
   — TS2339 (StackEntry has no component/deferred).
4. ~line 95: object literal `{..., onCancelRequest}` → `FormStackViewportValue` —
   TS2354 excess property.
5. ~line 100: `acceptRendererProps(value)` — sanitized Value NOT assignable to
   `FormStackRendererProps` (StackEntry[] ̸→ InternalStackEntry[]).
6. ~line 102: `<FormStackRenderer {...value}/>` — same as 5.

## Scope (strict — item contract a/b/c + Mode A JSDoc)

EDIT ONLY:
- `src/types/context.ts` — ADD `FormStackViewportContextValue` (@internal);
  SANITIZE `FormStackViewportValue` (`readonly StackEntry[]` + `onClose`, drop
  `onCancelRequest`); rewrite its JSDoc (Mode A).
- `src/types/index.ts` — ADD `FormStackViewportContextValue` to the `./context`
  re-export (internal types barrel only — NOT the public `src/index.ts`).
- `src/context/FormStackContext.ts` — import `FormStackViewportContextValue`
  (replace the `FormStackViewportValue` import); change
  `FormStackViewportContext` generic to `FormStackViewportContextValue | null`;
  refresh the context's JSDoc to reference the internal type.

DO NOT TOUCH (S2 owns): `src/hooks/useFormStackViewport.ts`,
`src/hooks/__tests__/useFormStackViewport.test.tsx`. `src/components/FormStackViewport.tsx`
and `src/components/FormStackProvider.tsx` need NO change (compile as-is).

## Authoritative sources (verified by direct read)

| Fact | Source | Evidence |
|------|--------|----------|
| Current leaking `FormStackViewportValue` | `src/types/context.ts:17-25` | `stack: InternalStackEntry<unknown>[]`; `onCancelRequest: (entry: InternalStackEntry<unknown>)=>...` |
| `FormStackRendererProps` (internal shape) | `src/components/FormStackRenderer.tsx:24-31` | identical to current Value |
| `FormStackViewportContext` typed on `FormStackViewportValue` | `src/context/FormStackContext.ts:2,29` | `createContext<FormStackViewportValue \| null>` |
| Hook returns raw context (the leak) | `src/hooks/useFormStackViewport.ts:34-36` | `return useContext(FormStackViewportContext)` |
| Provider produces internal shape | `src/components/FormStackProvider.tsx` viewportValue useMemo | `{stack: state.stack, onClose: closeForm, onCancelRequest: handleCancelRequest}` |
| `InternalStackEntry extends StackEntry` (assignability linchpin) | `src/types/stack.ts` | `export interface InternalStackEntry<T> extends StackEntry` |
| `StackEntry = {id; label?}` (the sanitized entry) | `src/types/stack.ts` | `export interface StackEntry { id: string; label?: string }` |
| The fix strategy (split internal/public) | `issue_analysis.md` §Issue 3 "Fix Strategy" steps 1-3 | defines ContextValue + sanitized Value + context switch |
| Type hierarchy + LEAK marker | `system_context.md` §Type Hierarchy | `FormStackViewportValue.stack = InternalStackEntry<unknown>[] (LEAKS — Issue 3) ✗` |
| Public barrel exports Value (comment becomes stale) | `src/index.ts:407` | `export type { FormStackViewportValue }` + JSDoc "Structurally identical to FormStackRendererProps" |

## Parallel-safety

P1.M1.T2.S1 (running concurrently) edits ONLY `src/components/FormStackProvider.tsx`
(PendingConfirmation/requestConfirmation/handlers) + a NEW test file. S1 edits
types/context.ts, types/index.ts, context/FormStackContext.ts. **ZERO file
overlap.** Both land cleanly: FormStackProvider.tsx's `viewportValue` produces the
internal shape that S1's `FormStackViewportContextValue` describes.

## Validation approach (honest gate)

After S1 `npx tsc --noEmit` is NON-ZERO **by design** (S2's test file references
removed fields). S1's gate is therefore:
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "useFormStackViewport.test.tsx"
# EXPECT: EMPTY  (no source-file errors)
```
i.e. all errors must be confined to the test file (the enumerated handoff). Do NOT
run the full `vitest` suite as S1's gate — the test file won't compile until S2.
