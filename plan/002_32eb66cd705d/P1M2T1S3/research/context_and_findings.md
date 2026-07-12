# Research Notes — P1.M2.T1.S3 (Add FormStackViewport component entry)

## Task
Insert a new `#### FormStackViewport` component entry into the `### Components`
section of `README.md`, immediately after the `---` separator that closes the
`#### FormErrorBoundary` entry and immediately before the `### Hooks` heading.
Mode B (documentation-only). **Only `README.md` is edited.**

## 1. The component contract (source of truth)

`src/components/FormStackViewport.tsx` — `export function FormStackViewport(): ReactElement | null`

Behavior captured from the source + its JSDoc:
- **Zero props.** Reads `viewport` from `FormStackViewportContext` and a mount
  setter from `FormStackViewportMountContext`.
- **Registers its mount** via `useEffect` (`setMounted(true)` on mount,
  `setMounted(false)` on unmount). This is what powers the **dev-mode guard**
  (when `autoRender={false}`, a form is open, and no viewport has mounted, the
  provider warns). Already documented in the FormStackProvider entry (README line 162).
- **Renders `null`** when there is no viewport value (outside a provider, or
  stack empty — the viewport value is `null` when empty).
- **Otherwise** renders `<FormStackRenderer {...viewport} />` — the chrome-less
  renderer (top form visible; parents mounted but hidden via `display: none`).
- Consumers never touch `InternalStackEntry` / the internal stack.

JSDoc verbatim facts to paraphrase:
- "Renders the form-stack viewport (the stacked form bodies: top visible,
  parents mounted-but-hidden) wherever it is placed."
- "Reads the stack from context, so it requires **no props**."
- "Intended for consumers who set `<FormStackProvider autoRender={false}>` and
  want to host the viewport inside their own window chrome (e.g. a single shared
  `<Dialog>`)."
- "Renders nothing when the stack is empty."

## 2. Export status (verified)
`src/index.ts`:
- `export { FormStackViewport } from './components';`  (line 130) ✓
- `export { useFormStackState } from './hooks';`        (line 263) ✓ — used in the placement snippet
- `export { useFormStackActions } from './hooks';`      (used in PRD §10.1 example) ✓

## 3. PRD §10 / §10.1 (the authoritative spec)
- §10: renderer is chrome-less; top form visible; parents mounted-hidden
  (`display: none`); no portals; transitions provider-owned.
- §10.1: `<FormStackViewport/>` is a **zero-prop** component; renders stacked
  bodies (top visible, parents mounted-hidden); reads stack from context;
  renders nothing when empty. Pair with `useFormStackViewport()` (low-level).
- §10.1 canonical example (full shared-modal walkthrough — that is
  **P1.M2.T2.S1**'s job, NOT this task). For this entry we keep a
  **placement-focused** snippet: `<FormStackProvider autoRender={false}>` wrapping
  a host that renders `<FormStackViewport/>`.
- §10.1 guarantees: with `autoRender={false}` + exactly one `<FormStackViewport/>`,
  an open form renders exactly once; `openForm()` promise contract unchanged.

## 4. README insertion point (verified, content-anchored — NOT line numbers)

`grep -n` findings (current state, AFTER P1.M2.T1.S1 landed):
```
244  #### FormErrorBoundary
279  .form-error-boundary__dismiss-button      <- last CSS line of FormErrorBoundary
283  ```                                        <- close of the css fence  (the read tool shows --- then ### Hooks)
284  ### Hooks
```
The exact anchor block (unique — `.form-error-boundary__dismiss-button` appears
once; `### Hooks` appears once):
```
.form-error-boundary__dismiss-button
```

---

### Hooks
```
→ Insert `#### FormStackViewport` between the `---` and `### Hooks`.

NOTE: The gap map (§3.4) cited "~line 264" — that was measured BEFORE
P1.M2.T1.S1 expanded the FormStackProvider Props area (~lines 144-164). The
expansion shifted FormErrorBoundary DOWN to line 244. Anchoring by content
(`.form-error-boundary__dismiss-button` + `---` + `### Hooks`) is stable.

## 5. House-style component-entry template (match exactly)
From the gap map "House-Style Templates (a)" + observed existing entries
(Breadcrumbs, ConfirmationDialog, FormErrorBoundary):
1. `#### Name`
2. One-line (or short-paragraph) description.
3. ` ```tsx ` import + usage snippet.
4. `**Props:**` line + table (or `**Props:** None`).
5. (optional) `**CSS Classes:**` / `**Returns:**` / `>` blockquote note.
6. `---` separator.

FormStackViewport has **no props and no CSS classes**, so the entry is:
desc → tsx snippet → `**Props:** None` → blockquote note → `---`.

The blockquote (`> **Note:** ...`) is established house style — the
FormStackProvider entry uses it for its "Dev-mode guard" note (README line 162).

## 6. Cross-links (safe)
- The `autoRender` prop already lives in the FormStackProvider Props table
  (README line 150) and already links to `[Hostable Viewport](#hostable-viewport-single-shared-modal)`.
- That anchor (`### Hostable Viewport (Single Shared Modal)`) will be created by
  **P1.M2.T2.S1**. Reusing the SAME anchor in this entry is consistent with the
  established convention (S1 already uses it) and will resolve once T2.S1 lands.
- This entry must NOT create the Hostable Viewport section, the
  `useFormStackViewport` hook entry, the `FormStackViewportValue` type entry, or
  the "Forgetting <FormStackViewport/>" Common Pitfall — those are S4 / T2.S1 /
  T2.S2 respectively.

## 7. Parallel-execution safety
- **P1.M2.T1.S2** (running in parallel) edits THREE zones, all BELOW `### Hooks`:
  useFormStack Returns table, useFormStackActions Returns table, FormStackActions
  type block. It does NOT touch the FormErrorBoundary area or the `### Hooks`
  heading. → No overlap / no conflict with S3's single insertion above `### Hooks`.
- **P1.M2.T1.S1** (autoRender) has ALREADY LANDED — its expansion is above the
  insertion point and is now stable.

## 8. Contract gate (the literal success check)
`grep -c FormStackViewport README.md` currently returns **4** (all from S1's
FormStackProvider Props area: lines 150, 153, 158, 162). The contract requires
**≥ 1**. Adding the new entry raises it to ≥ 6 and — more importantly —
establishes the **dedicated component entry** that the API Reference currently
lacks. (The 4 existing hits are all inside the FormStackProvider entry's prose;
none is a standalone `#### FormStackViewport` API entry.)

## 9. Validation commands (verified present in package.json)
- `npm run type-check`  → `tsc --noEmit`
- `npm test`            → `vitest run`
- `npm run build`       → `tsup`
- `git status --short`  → must show ONLY `README.md`
README-only edit cannot break these; running them proves no source file was
accidentally touched.
