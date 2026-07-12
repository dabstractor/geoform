# P1.M2.T4.S1 — Verification Sweep Baseline Evidence

> Captured during PRP research. Establishes the **known-good baseline** the
> implementation sweep must reproduce and protect. All commands run against the
> repo at commit `b6f13e6` (P1.M2.T2.S2 = latest Complete sibling; P1.M2.T3.S1
> was in-flight in parallel and is excluded from gates).

## 1. Grep-Set Baseline (README.md, current)

The `readme_gap_map.md` §Completion Verification grep set — **EVERY symbol already
returns ≥1 hit**. The gap map's "MISSING" rows are STALE: P1.M2.T1.S1–S4 and
P1.M2.T2.S1–S2 (all Complete) already added them.

| Symbol / phrase | Hits | Status |
|---|---|---|
| `autoRender` | 21 | ✅ |
| `FormStackViewport` | 38 | ✅ |
| `cancelForm` | 6 | ✅ |
| `popToIndex` | 3 | ✅ |
| `useFormStackViewport` | 6 | ✅ |
| `FormStackViewportValue` | 3 | ✅ |
| `Single Shared Modal` (exact) | 2 | ✅ |
| `shared modal` (case-insensitive) | 8 | ✅ |
| `hostable viewport` (case-insensitive) | 5 | ✅ |

Reproduce:
```bash
for s in autoRender FormStackViewport cancelForm popToIndex \
         useFormStackViewport FormStackViewportValue; do
  printf '%-24s %s\n' "$s" "$(grep -c "$s" README.md)"
done
grep -c 'Single Shared Modal' README.md
grep -ci 'shared modal' README.md
```

## 2. Gate Baseline (all GREEN)

```
npm test          → Test Files 26 passed (26) | Tests 287 passed (287) | 1.52s
npm run build     → CJS+ESM+DTS Build success (tsup)
npm run type-check→ tsc --noEmit exit 0
```

- **287 tests** matches the contract ("≥ 287 after the popToIndex test added in
  P1.M1.T1.S2"). The earlier delta_prd figure "286+" predates the popToIndex test.
- `popToIndex` is exercised in 5 test files: `FormStackProvider.test.tsx`,
  `Breadcrumbs.test.tsx`, `useFormStack.test.tsx`, `useFormStackURLSync.test.tsx`,
  `types.test.ts`.

## 3. Gate Scope (why examples/ can't break the gates)

| Gate | Scope config | examples/ included? |
|---|---|---|
| publish | `package.json "files": ["dist","README.md","LICENSE"]` | ❌ excluded |
| build | `tsup.config.ts entry: ['src/index.ts']` | ❌ excluded |
| type-check | `tsconfig.json "include": ["src","vitest.setup.ts"]` | ❌ excluded |
| test | `vitest.config.ts include: ['src/**/*.{test,spec}.{ts,tsx}']` | ❌ excluded |

⇒ The parallel **P1.M2.T3.S1** `examples/shared-modal/` addition **cannot** turn
these gates red. Its only README effect is two additive pointer lines (text-anchored
in the Hostable Viewport subsection + the `## Examples` section) that reference
`./examples/shared-modal` — they do NOT touch the 7-symbol grep set.

## 4. Consistency Read (the 5 sections named in the contract)

Findings — **NO internal contradictions found at baseline.**

### 4a. useFormStack Returns table (README ~lines 358-367)
Lists all 5 entries: `stack`, `openForm`, `closeForm`, `popToIndex`, `cancelForm`. ✅
NOT the stale "3 actions" the contract warned about.

### 4b. useFormStackActions Returns table (README ~lines 408-417)
Lists all 4 actions: `openForm`, `closeForm`, `popToIndex`, `cancelForm`. ✅

### 4c. FormStackActions type block (README ~lines 592-597)
```tsx
interface FormStackActions {
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  closeForm: () => void;
  popToIndex: (index: number) => void;
  cancelForm: () => Promise<void>;
}
```
Complete and matches `src/index.ts` → `src/types`. ✅

### 4d. FormStackViewport entry
Zero-prop; reads from context; `**Props:** None`; Note links to Hostable Viewport
+ warns against mounting two viewports under `autoRender={true}`. ✅

### 4e. useFormStackViewport entry
Returns `FormStackViewportValue | null`; assignable to `FormStackRendererProps`. ✅

### 4f. FormStackViewportValue type block
Fields `stack`, `onClose`, `onCancelRequest`; explicit note that
`InternalStackEntry` is internal (not exported). ✅

### 4g. Hostable Viewport (Single Shared Modal) section
Uses `<FormStackProvider autoRender={false}>`, mounts exactly one
`<FormStackViewport/>`, wires `<Breadcrumbs/>` to `DialogTitle`,
`<FormStackViewport/>` to `DialogContent`, and `Dialog onClose={cancelForm}`.
"Guarantees" para says renderer renders exactly once; `openForm()` promise
contract unchanged. ✅

### 4h. Common Pitfall "Forgetting <FormStackViewport/> with autoRender={false}"
Matches house BAD/GOOD/Why template; references the dev-mode guard (warns ≤ once
per episode, dev-only, resets on mount/clear). ✅

## 5. NON-Staleness Callout (prevent false-positive "fixes")

README ~line 340, inside the `#### useFormStack` code **example**:
```tsx
const { stack, openForm, closeForm } = useFormStack();
```
This is an **idiomatic minimal destructure** (destructure only what the example
uses), NOT a claim that `useFormStack` returns only 3 things. The Returns table
immediately below it lists all 5. **DO NOT "fix" this** by adding `popToIndex`/
`cancelForm` to the destructure — that would be noise and would actually mislead
(the example deliberately shows the common-case subset). This is the single most
likely false-positive a sweep agent might introduce.

## 6. Cross-Check Required (README claim vs source — Mode B fixes README, not source)

The sweep should sanity-confirm these README claims still match source behaviour
(if they drift, the fix is to **README**, never source — Mode B / no behavior change):

- **autoRender default `true`** — `src/components/FormStackProvider.tsx`
  (`FormStackProviderProps.autoRender` default). README §FormStackProvider prop table.
- **Dev-guard: warns ≤ once per "forgotten host" episode, dev-only, resets on
  viewport mount or stack clear** — `src/components/FormStackProvider.tsx` (the
  `console.warn` guard). README §FormStackProvider "Dev-mode guard" note + the
  Common Pitfall "Why it's problematic" note.
- **`cancelForm()`: no-op on empty stack; resolves top deferred with `undefined`;
  honors `confirmOnCancel`** — `src/components/FormStackProvider.tsx`
  (`cancelForm` `useCallback`). README Returns-table rows.
- **`popToIndex(index)`: cancels all deeper forms; used by `<Breadcrumbs/>`** —
  same file. README Returns-table rows.
- **`FormStackViewportValue` assignable to `FormStackRendererProps`** —
  `src/types/context.ts` + `src/components/FormStackRenderer.tsx`. README type block.

## 7. Parallel-Sibling Awareness (P1.M2.T3.S1, in flight)

P1.M2.T3.S1's PRP (read in full) specifies:
- CREATE `examples/shared-modal/App.tsx` + `examples/shared-modal/README.md`.
- MODIFY `README.md`: two additive, text-anchored one-line pointers to
  `./examples/shared-modal` — one after the Hostable Viewport `@see` line, one in
  the `## Examples` section before `## Browser Support`.

Implications for THIS sweep:
- The README may be ~2 lines longer when the sweep runs; **anchor on text, never
  line numbers**.
- The sweep MUST NOT revert those pointer lines (they are T3.S1's deliverable).
- The 7-symbol grep set is UNAFFECTED by the pointer lines.
- The example files are excluded from all gates (§3) — they cannot break the
  build/type-check/test baseline.
- If the sweep finds a broken anchor in a T3.S1 pointer, that is a T3.S1 defect;
  the sweep may fix the anchor text in place (it's within the README consistency
  mandate) but must not delete the pointer.

## 8. Expected Sweep Outcome

At baseline, **all gates are green and the README is internally consistent**.
The most likely sweep result is therefore:
1. Grep set re-confirmed (7/7 symbols present).
2. build / type-check / test re-confirmed green (287/287).
3. Consistency read finds **no** residual staleness → **zero README edits**.
4. (Conditional) If T3.S1's pointers introduced a broken anchor, fix that anchor.

The sweep's primary deliverable is the **verification record** (green gates +
grep results + section-by-section consistency sign-off), not new code.
