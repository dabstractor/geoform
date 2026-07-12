# Source Verification — P1.M3.T1.S2 (src/index.ts export JSDoc + dist build consistency)

Read directly against the current `src/`, `dist/`, `package.json`, `.gitignore`,
and the already-landed P1.M1 / P1.M2 fixes. This is the source of truth for the
PRP's edits and gates.

## Baseline (measured, not assumed)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **exit 0** (clean) |
| `npx vitest run` | **311 / 311** across **28** files (0 failures) |
| `dist/` present? | Yes (rebuilt Jul 12 16:22); `dist/index.d.ts` (973 lines) |
| `dist` git-tracked? | **NO** — `.gitignore` line `dist` (build artifact) |

> NOTE: The PRD overview's "294 / 294 across 26 files" is the PRE-fix baseline.
> The P1.M1 / P1.M2 subtasks already added tests (onError routing, confirmation
> coalescing, sanitized viewport, duplicate-ID guard) → **311 / 28** now. So the
> gate is "all tests pass (current baseline 311)", not "294 + new".

## CRITICAL INSIGHT — where does `dist/index.d.ts` JSDoc come from?

**The generated `dist/index.d.ts` carries the DEFINITION-SITE JSDoc, NOT the
`src/index.ts` re-export comment.** Verified empirically:

- `dist/index.d.ts` `interface FormStackViewportValue` (L230-253) JSDoc =
  `src/types/context.ts`'s comment ("Public, sanitized value returned by …").
  It is **already correct** (sanitized). The `src/index.ts` re-export comment
  ("Props required to render … Structurally identical to FormStackRendererProps")
  does **NOT** appear in dist.
- `dist/index.d.ts` `declare function useFormStackViewport()` (L971) JSDoc =
  `src/hooks/useFormStackViewport.ts`'s comment ("Returns a **sanitized**,
  read-only view …"). Already correct.
- `dist/index.d.ts` `FormProps` (L~95) JSDoc = `src/types/form.ts`'s comment,
  which **already** documents `onError` routing (PRD §9).

**Implication for this task:** the `src/index.ts` re-export-comment edits are
for **SOURCE-LEVEL consistency** (developer reading index.ts; package-level
narrative). They do **not** change `dist/index.d.ts`. The `npm run build` step
therefore: (1) confirms the build still passes after the comment edits,
(2) regenerates a clean, consistent `dist/` artifact for the 0.2.x changeset,
(3) lets us assert the dist already reflects the sanitized types. Do NOT expect
the index.ts prose to appear in dist — that is by design.

## Stale-comment inventory in `src/index.ts` (EXHAUSTIVE)

Grep of `src/index.ts` for stale markers found exactly THREE stale regions:

### 1. `useFormStackViewport` re-export JSDoc (L305-317) — STALE ✓ in scope

```
 * Returns the props required by `<FormStackRenderer/>` (internal stack,
 * `onClose`, `onCancelRequest`), or `null` when the stack is empty. For
 * consumers who want to forward custom props to `<FormStackRenderer/>` or wrap
 * it. Most consumers should use `<FormStackViewport/>` instead.
```
- Mentions `onCancelRequest` — REMOVED from the public type in P1.M2.T1.S1.
- Claims "props required by FormStackRenderer" — FALSE; the public sanitized
  value is intentionally NOT spreadable onto the renderer (PRD §10.1).
- Correlated with the FormStackViewportValue edit (same stale claim). The
  contract names only FormStackViewportValue + FormProps, but leaving this
  hook comment stale contradicts the OUTPUT goal "source comments are
  consistent with the implementation." → include it.

### 2. `FormStackViewportValue` re-export JSDoc (L396-406) — STALE ✓ in scope (contract a)

```
 * Props required to render the form-stack viewport via `<FormStackRenderer/>`,
 * returned by `useFormStackViewport()` (or `null` when the stack is empty).
 * Structurally identical to `FormStackRendererProps`.
```
- "Structurally identical to FormStackRendererProps" — FALSE after Issue 3.
- "Props required to render … via FormStackRenderer" — FALSE; sanitized read-only.

### 3. `FormProps` re-export JSDoc (L370-405) — missing `onError` ✓ in scope (contract b)

```
 * Props interface that all form components must implement.
 * Forms receive these callbacks from FormStackProvider.
 *
 * @typeParam T - The type of value returned by onSubmit
```
- No mention of `onError`. Contract: "ensure onError is documented as routing
  to the error boundary (not rejecting openForm)." Rich detail already in
  `src/types/form.ts`; index.ts needs a concise pointer paragraph.

### NON-stale (verified, DO NOT touch)

- **L98** `<FormStackRenderer stack={internalStack} onClose={pop}
  onCancelRequest={confirm} />` — this is the **FormStackRenderer** example. The
  renderer's props (`FormStackRendererProps`) STILL take `onCancelRequest`
  (internal, correct). NOT stale.
- **L202** `onError={(error, info) => logToService(error)}` — the
  **FormErrorBoundary** example, showing the boundary's OWN logging prop (fires
  in `componentDidCatch`). Still accurate; NOT the form-invoked `onError`.
- All other re-export comments (FormStackProvider, FormStackViewport,
  Breadcrumbs, ConfirmationDialog, FormErrorBoundary props, OpenFormOptions,
  StackEntry, etc.) are accurate.

## dist verification points (what the rebuilt dist MUST show)

Confirmed against the CURRENT dist (these are post-fix already; the rebuild
must reproduce them):

1. **`FormStackViewportValue.stack` is `readonly StackEntry[]`** —
   `dist/index.d.ts` L247-253:
   ```ts
   interface FormStackViewportValue {
       stack: readonly StackEntry[];
       onClose: () => void;
   }
   ```
2. **No `InternalStackEntry` in the PUBLIC export statement** — the final
   `export { … }` line (L973) lists the public surface and does NOT include
   `InternalStackEntry` or `FormStackViewportContextValue`.
   - GOTCHA: `InternalStackEntry` DOES appear in the dist **body** (L220 def,
     L421/425 in the internal `FormStackViewportContextValue`, L452 in
     `FormStackRendererProps` prose). That is correct — it's an internal type
     referenced internally. The check is ONLY the `export { … }` line.
3. **`FormErrorBoundary.showError` present in dist** — `dist/index.d.ts` L668:
   ```ts
   showError(error: Error): void;
   ```

## Parallel-task boundary (NO overlap)

| File | Owner |
|------|-------|
| `README.md` | **P1.M3.T1.S1** (parallel, in progress — staged `M` in git) |
| `src/index.ts` | **P1.M3.T1.S2** (THIS task) |
| `dist/*` | gitignored; regenerated by this task's `npm run build` |

`git status --short` currently shows `README.md` (S1's work) + plan files. After
THIS task, it will additionally show `src/index.ts` (and `dist/*` will remain
untracked/ignored). No source-file overlap with S1.

## tsup / build mechanics

- `npm run build` → `tsup` (`tsup.config.ts`): `entry: ['src/index.ts']`,
  `format: ['esm','cjs']`, `dts: true`, `clean: true`, `target: 'es2020'`,
  `external: ['react','react-dom']`.
- `clean: true` wipes `dist/` then regenerates → produces `index.mjs`,
  `index.cjs`, `index.d.ts` (+ `.map` + `index.d.cts`).
- Because `dts: true` + single entry, all public types are bundled into the one
  `dist/index.d.ts`. The rebuild is deterministic; if source is unchanged in
  behavior, the only dist diff (vs the prior build) is the comment edits have NO
  effect (see CRITICAL INSIGHT above) — i.e. dist should be byte-identical to
  the current one modulo timestamps. That itself is the proof of consistency.
