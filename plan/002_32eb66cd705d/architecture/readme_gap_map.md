# README.md Documentation-Gap Map — Delta 0.2.0 (Requirement D2)

Source: independent read-only recon (scout subagent) + direct grep verification.
`README.md` is 1084 lines. All line numbers 1-indexed, verified via
`grep -n '^#' README.md`.

## New-Public-Symbol Presence in README

| Symbol | In README? | Detail |
|--------|-----------|--------|
| `autoRender` | **MISSING** (0 hits) | — |
| `FormStackViewport` | **MISSING** (0 hits) | — |
| `cancelForm` | **MISSING** (0 hits) | absent from ALL hook tables + type defs |
| `popToIndex` | **PARTIAL** | line 350 (useFormStackActions table row) + line 499 (FormStackActions type); no prose |
| `useFormStackViewport` | **MISSING** (0 hits) | — |
| `FormStackViewportValue` | **MISSING** (0 hits) | — |
| shared modal / hostable viewport | **MISSING** (0 hits) | — |

**Additional staleness (same code path):**
- `useFormStack` Returns table (~lines 294-298) lists only `stack`, `openForm`,
  `closeForm` — missing `cancelForm` (and `popToIndex` after the M1 fix).
- `FormStackActions` interface block (~lines 497-500) missing `cancelForm()`.

## README Heading Outline (anchors for insertion)

```
10    ## Features                        <- bullet after line 16
124   ## API Reference
126     ### Components
128       #### FormStackProvider          <- autoRender props @ line 144
226       #### FormErrorBoundary          <- last component; FormStackViewport after line 264
266     ### Hooks
268       #### useFormStack               <- Returns table ~294 (add cancelForm/popToIndex)
328       #### useFormStackActions        <- Returns table ~347-350 (add cancelForm)
354       #### useFormStackURLSync        <- last hook; useFormStackViewport after ~line 394
397     ### Types
491       #### FormStackActions           <- add cancelForm @ ~497-500
501       (end of Types)                  <- FormStackViewportValue after line 501
503   ## Advanced Usage
627     ### Custom Breadcrumb Styling     <- last subsection; Hostable Viewport before line 664
664   ## Common Pitfalls
886     ### Not Handling Async Form Submission Properly  <- new pitfall before line 939
939   ## TypeScript
1002  ## Examples
```

## Section-by-Section Insertion Map + Content

### 1. Features bullet
- **Insert after line 16** (last Features bullet).
- Content: one bullet — hostable viewport / single shared modal; `autoRender={false}` + `<FormStackViewport/>`; zero migration.

### 2. FormStackProvider — `autoRender` prop + dev guard
- **Expand `**Props:**` at line 144.**
- Content: props table row `autoRender` (boolean, default `true`); true = provider renders viewport (v1 behavior); false = host via `<FormStackViewport/>`. Keep "children rendered normally." Add dev-mode guard note (warns ≤ once when `autoRender={false}` + open form + no mounted viewport). Short tsx snippet.

### 3. Actions tables — `cancelForm` + `popToIndex`
- **`useFormStackActions` Returns table (~line 350):** ADD `cancelForm` row `() => Promise<void>` — cancels top form (resolves deferred `undefined`; honors `confirmOnCancel`). Verify/clarify `popToIndex` row.
- **`useFormStack` Returns table (~line 294):** ADD `cancelForm` + `popToIndex` rows.
- **`FormStackActions` type (~line 497-500):** ADD `cancelForm: () => Promise<void>;`.

### 4. Components — `<FormStackViewport/>`
- **New `#### FormStackViewport` after the `---` at line 264** (before `### Hooks`).
- Content: zero-prop placeable viewport; renders stacked form bodies (top visible, parents `display:none`); reads stack from context; renders nothing when empty. Import + placement snippet (`autoRender={false}` + `<FormStackViewport/>` inside host). `**Props:** None`.

### 5. Hooks — `useFormStackViewport()`
- **New `#### useFormStackViewport` after the `---` at ~line 394** (before `### Types`).
- Content: returns `FormStackViewportValue | null` (assignable to `FormStackRendererProps`); for consumers who wrap/forward custom props. Returns table row.

### 6. Types — `FormStackViewportValue`
- **New `#### FormStackViewportValue` after line 501** (before `## Advanced Usage`).
- Content: shape passed to renderer; structurally assignable to `FormStackRendererProps`. `**Definition:**` tsx interface block (pull fields from `src/types/context.ts:10-22`).

### 7. Advanced Usage — "Hostable Viewport (Single Shared Modal)"
- **New `### Hostable Viewport (Single Shared Modal)` before line 664** (last Advanced Usage subsection).
- Content: rationale (one window hosts entire stack; chrome is consumer's; geoform chrome-less). Full runnable example from **PRD §10.1** (`SharedModalHost` with `useFormStackState().stack`, `useFormStackActions().cancelForm`, `<Breadcrumbs/>` as `<DialogTitle>`, `<FormStackViewport/>` as `<DialogContent>`, `Dialog open={stack.length>0} onClose={cancelForm}`). Guarantees paragraph (renders exactly once; promise contract unchanged). Cross-link to autoRender prop + Common Pitfall.

### 8. Common Pitfalls — "Forgetting `<FormStackViewport/>`"
- **New `### Forgetting <FormStackViewport/> with autoRender={false}` before line 939.**
- Content: match existing BAD/GOOD/Why template. Problem: `autoRender={false}` renders no viewport; forgotten host → forms render nowhere. BAD: no viewport. GOOD: mount exactly one `<FormStackViewport/>`. Why: dev guard. `@see` links.

## House-Style Templates (match exactly)

**(a) Component entry:** `#### Name` → one-line desc → ` ```tsx ` import+usage → `**Props:**` line → `---`.

**(b) Hook Returns table:**
```
**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `openForm` | `<T>(options) => Promise<T \| undefined>` | Opens a form |
```

**(c) Type Definition block:**
```tsx
interface FormStackActions {
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  closeForm: () => void;
  ...
}
```

## Optional: shared-modal example
`examples/shared-modal/` does **NOT** exist (only `examples/relational-forms/`).
D2 marks an example as optional/non-blocking. Available as a stretch task.

## Authoritative Signature Sources (writer pulls from these)
- `src/components/FormStackProvider.tsx` — `autoRender`, `cancelForm()`, `popToIndex()`, dev guard.
- `src/components/FormStackViewport.tsx` — zero-prop viewport.
- `src/hooks/useFormStackViewport.ts` — `FormStackViewportValue | null`.
- `src/types/context.ts:10-22` — `FormStackViewportValue` interface.
- `src/index.ts` — public exports.
- `PRD.md` §10.1 (lines ~238-277) — shared-modal example.

## Completion Verification (after edits)
Re-grep README for each symbol — every one must return ≥1 hit:
`autoRender`, `FormStackViewport`, `cancelForm`, `popToIndex`,
`useFormStackViewport`, `FormStackViewportValue`, "Single Shared Modal".
Then `npm run build` + `npx tsc --noEmit` + `npx vitest run` all green.
