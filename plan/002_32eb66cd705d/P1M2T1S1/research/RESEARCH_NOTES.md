# Research Notes — P1.M2.T1.S1

**Work item:** Document `autoRender` prop + dev-mode guard on `FormStackProvider`
(README.md, Mode B — documentation-only).

## Scope boundary (critical — do not cross)

- **Only edit:** the `**Props:**` area of the `#### FormStackProvider` component
  entry in `README.md` (currently **line 144**).
- **Do NOT touch** (sibling README tasks own these):
  - `useFormStack` / `useFormStackActions` Returns tables, `FormStackActions` type
    block → **P1.M2.T1.S2** (cancelForm + popToIndex).
  - `#### FormStackViewport` component entry → **P1.M2.T1.S3**.
  - `useFormStackViewport` hook + `FormStackViewportValue` type → **P1.M2.T1.S4**.
  - "Hostable Viewport (Single Shared Modal)" Advanced Usage section → **P1.M2.T2.S1**.
  - "Forgetting `<FormStackViewport/>`" Common Pitfall → **P1.M2.T2.S2**.
- The cross-link to the Hostable Viewport section is a **forward-link** to an
  expected anchor (`#hostable-viewport-single-shared-modal`); it resolves once
  P1.M2.T2.S1 lands. Do NOT create that section here.

## Authoritative sources (verified by direct read)

| Fact | Source file | Evidence |
|------|-------------|----------|
| `autoRender?: boolean` default `true` | `src/components/FormStackProvider.tsx` | `FormStackProviderProps.autoRender` JSDoc + destructure `{ children, autoRender = true }` |
| true = provider renders viewport sibling of children | same | `{autoRender && <FormStackViewport />}` in JSX return |
| `<ConfirmationDialog/>` always rendered regardless | same | rendered unconditionally in return JSX |
| Dev guard: warn ≤ once per forgotten episode | same | `warnedForgottenHostRef` + `useEffect` gating on `!autoRender && stack.length>0 && !viewportMounted`; resets when viewport mounts / stack clears |
| Exact warning text | same | `'[FormStackProvider] autoRender is false and a form is open, but no <FormStackViewport/> is mounted...'` |
| Dev-guard test coverage | `src/components/__tests__/FormStackProvider.autoRender.test.tsx` | `describe('dev-mode forgotten-host guard')` — warns / warns-at-most-once / doesn't-warn-when-mounted |
| PRD spec | `PRD.md` §5.1 (h3.0) / §5.1 autoRender (h4.0) | `true` default; `false` hosts viewport; dev-mode guard; "See §10.1" |
| Gap to close | `plan/002_32eb66cd705d/architecture/readme_gap_map.md` §3.2 | `autoRender` MISSING (0 grep hits); expand `**Props:**` @ line 144 |
| D1 audit bullet 4 | `plan/002_32eb66cd705d/architecture/audit_findings.md` | dev-mode forgotten-host guard PASS |

## House-style (confirmed from peer entries)

- **Component entry template:** `#### Name` → one-line desc → ```` ```tsx ```` import+usage → `**Props:**` → (table or note) → `---`.
- **Props table** (ConfirmationDialog README ~line 199-209; Breadcrumbs ~line 154):
  ```
  **Props:**

  | Prop | Type | Default | Description |
  |------|------|---------|-------------|
  | `propname` | `type` | `default` | description |
  ```
- README uses GitHub-flavored markdown; anchor for a `### Foo Bar (Baz)` heading is `#foo-bar-baz`.

## Current exact content to replace (README line 144)

```
**Props:** None required. Children are rendered normally.
```

(Preceded by the default import+usage snippet at lines 132-142; followed by blank
line 145 and `---` at line 146.)

## Validation (verified commands)

- `npm run type-check` = `tsc --noEmit` (must stay exit 0 — README edit can't break it; confirms no accidental source edit).
- `npm test` = `vitest run` (must stay green — no-regression).
- `npm run build` = `tsup` (must stay green).
- `grep -c autoRender README.md` → must be ≥ 1 (the contract's literal gate).
- `git status --short` → ONLY `README.md` modified.

No markdown linter is configured in the repo (no markdownlint/prettier/remark config at root).
