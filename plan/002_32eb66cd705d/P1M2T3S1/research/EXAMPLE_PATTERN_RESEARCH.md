# Research Notes — P1.M2.T3.S1 (examples/shared-modal/ demonstration)

Scope: create `examples/shared-modal/` — a minimal **runnable** demo of the
single-shared-modal (hostable viewport) pattern from PRD §10.1 / README
Advanced Usage (S1). No published-package surface (examples/ is illustrative).

## 1. Existing example house style (the template to mirror)

`examples/relational-forms/` is the ONLY existing example. Files:

- `App.tsx` — root `<FormStackProvider>` + `ExampleContent` (uses default
  `autoRender=true`). Rich JSDoc header incl. a **"## Running This Example"**
  section showing how to mount it in a Vite `main.tsx`. Imports the library via
  **relative path `'../../src'`** and forms via `'./OrganizationForm'`.
- `OrganizationForm.tsx`, `TeamForm.tsx`, `UserForm.tsx` — the 3-level
  Organization→Team→User hierarchy. Each implements `FormProps<T>`, uses
  `useFormStack().openForm` to open its child, and collects results via
  async/await. State is `useState` (preserved while children are mounted-hidden).
- `types.ts` — `User`, `Team`, `Organization` (+ `New*` = `Omit<*, 'id'>`).

**Key convention**: examples have **no `package.json`, no Vite config, no tsconfig
entry**. They are "integrate into your own Vite React-TS app" snippets. They use
`className` hooks (`.example-app`, `.form`, …) but ship **no CSS file** — styling
is the integrator's responsibility.

**Reuse decision**: the forms are imported into shared-modal via the relative path
`'../relational-forms/OrganizationForm'` / `'../relational-forms/types'`. This
satisfies the contract's "reuse" wording AND demonstrates the strongest possible
point: the **same** form components render correctly in both the default
auto-rendered viewport (relational-forms) and the consumer-hosted shared modal
(shared-modal) with zero edits. The forms' own internal `'../../src'` import
resolves to repo-root `src/` correctly from either example dir.

## 2. Pipeline-exclusion proof (examples/ is NOT published/built/tested/type-checked)

Verified against every config — the new example files must NOT break any gate:

| Gate | File | Mechanism | examples/ included? |
|------|------|-----------|---------------------|
| publish | `package.json` `"files"` | `["dist","README.md","LICENSE"]` whitelist | ❌ |
| build  | `tsup.config.ts` `entry` | `['src/index.ts']` | ❌ |
| type-check | `tsconfig.json` `"include"` | `["src","vitest.setup.ts"]` | ❌ |
| test   | `vitest.config.ts` `test.include` | `['src/**/*.{test,spec}.{ts,tsx}']` | ❌ |

⇒ Adding `.tsx`/`.md` under `examples/shared-modal/` cannot fail
`npm run build`, `npm run type-check`, `npm test`, and is not shipped.
The success gate "build/typecheck/test stay green" is therefore a **no-regression**
sanity check, not a gate that compiles the example itself.

## 3. Public API surface the example must use (all from `src/index.ts`)

- `FormStackProvider` — accept `autoRender={false}` (PRD §5.1/§10.1).
- `FormStackViewport` — zero-prop body slot (PRD §10.1). Renders nothing when
  stack empty. Reads stack from context.
- `Breadcrumbs` — header. Props: `separator?: ReactNode` (default `'/'`).
- `useFormStackState()` → `{ stack }` (readonly `StackEntry[]`); use
  `stack.length > 0` to open/close the host window.
- `useFormStackActions()` → `{ openForm, closeForm, popToIndex, cancelForm }`.
  Use `cancelForm()` for the host's Escape/backdrop/close gesture.
- (Combined `useFormStack()` also exposes all of the above; the example prefers
  the split hooks to match the README/S1 host snippet exactly.)

`cancelForm()` semantics (verified `src/components/FormStackProvider.tsx`):
cancels the **top** form through the proper lifecycle — if that entry has
`confirmOnCancel`, it shows the confirmation dialog (same path as the form's own
injected `onCancel`), then resolves the deferred with `undefined` and pops.
No-op when stack empty. This is exactly what a host Escape/backdrop should call.

## 4. CRITICAL stacking fact — ConfirmationDialog is a native `<dialog>`

`src/components/ConfirmationDialog.tsx` renders a native HTML `<dialog>` opened
via `dialog.showModal()` (lines 68–69). Native modal `<dialog>` renders in the
**browser top layer**, above ALL other content regardless of z-index/DOM nesting.

Why it matters for this example: the `<ConfirmationDialog/>` is rendered by the
**provider** as a sibling of `children` (NOT inside `SharedModalHost`). If the
example built its modal with a `z-index`-stacked `<div>`, the native
`<dialog>::backdrop` would STILL paint above it (top layer beats z-index) — so
the cancel-confirmation flow works correctly with a plain-div modal host. No MUI
or portal library required. (The PRD/README MUI `<Dialog>` is "illustrative"; the
contract explicitly allows "a simple inline modal or window chrome".)

⇒ The example can be **zero extra dependencies** (React + the `src` source). Use
inline `style` props (not classNames) for the overlay/backdrop so the modal
actually overlays when run, since examples ship no CSS.

## 5. README insertion points (text-anchored, line numbers are STALE)

README is being edited concurrently by S2 (Common Pitfalls). S1 (Hostable
Viewport subsection) is **Complete → stable**. Anchor ONLY on unique text:

- **Optional pointer #1 (Advanced Usage — contract OUTPUT #4 / DOCS Mode B):**
  end of the `### Hostable Viewport (Single Shared Modal)` subsection, right
  after its terminal `@see` line:
  `…[Common Pitfalls > Forgetting ` + "`" + `<FormStackViewport/>` + "`" + `](#forgetting-formstackviewport-with-autorenderfalse).`
  Insert a one-line pointer: "See [`examples/shared-modal`](./examples/shared-modal)
  for a complete runnable demo of this pattern."
- **Optional pointer #2 (canonical Examples index):** the `## Examples` section
  (~line 1244) currently lists only `examples/relational-forms`. Append a sibling
  block for `examples/shared-modal`. Anchor on the unique line:
  `See the [examples/relational-forms](./examples/relational-forms) directory for a complete working example demonstrating:`

Both anchors are unique strings; line numbers are ignored on purpose.

## 6. Files to create (desired tree)

```
examples/
  relational-forms/        (UNCHANGED — only imported from)
    App.tsx
    OrganizationForm.tsx
    TeamForm.tsx
    UserForm.tsx
    types.ts
  shared-modal/            (NEW)
    App.tsx                (Provider autoRender={false} + SharedModalHost + launch)
    README.md              (how to run — short)
```

`App.tsx` imports:
- `'../../src'` → `FormStackProvider, FormStackViewport, Breadcrumbs,
  useFormStackState, useFormStackActions` (+ `type NewOrganization, Organization`
  from `'../relational-forms/types'`, and `OrganizationForm` from
  `'../relational-forms/OrganizationForm'`).

No source-library files are touched. `examples/` is not in `"files"`.
