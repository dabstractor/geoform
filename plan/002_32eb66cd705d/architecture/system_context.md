# System Context — Delta 0.2.0 "Hostable Viewport"

## Project

**geoform** — a batteries-included React library for managing infinitely nestable
hierarchical forms. Published as `geoform` (npm), TypeScript + React 18/19,
built with `tsup`, tested with `vitest` + `@testing-library/react`.

CWD: `/home/dustin/projects/geoform`. Current shipped version: `1.0.0`
(`package.json`). The prior planning round (`plan/001_64e16a72fcd0`) built the
core v1 system. **This round (002) is the 0.2.0 additive delta.**

## What the 0.2.0 Delta Adds

A consumer may host the entire form stack inside **one shared window** (e.g. an
MUI `<Dialog>`) instead of each form opening its own. Fully backwards-compatible;
defaults preserve 0.1.1/v1 behavior exactly. geoform stays **chrome-less**.

New public surface (additive):
- `FormStackProvider` gains `autoRender?: boolean` (default `true`).
- `<FormStackViewport/>` — zero-prop placeable viewport component.
- `useFormStackViewport()` hook + `FormStackViewportValue` type.
- `cancelForm(): Promise<void>` action (on `useFormStack()` + `useFormStackActions()`).
- Dev-mode "forgotten host" guard.

## CRITICAL: Feature is ALREADY IMPLEMENTED

The code already ships the 0.2.0 capability (commit `1e09499`,
CHANGELOG entry "hostable viewport for single-shared-modal form hosting"). The
remaining work for this delta is **verification + one conformance fix + README
documentation** — NOT re-implementation. See `audit_findings.md` and
`readme_gap_map.md`.

Re-implementing from scratch is **explicitly forbidden** (`delta_prd.md` §3, §6).

## Architecture (existing, confirmed by recon)

```
src/
├── components/
│   ├── FormStackProvider.tsx   # useReducer + dual-context; autoRender, cancelForm,
│   │                           #   popToIndex, dev forgotten-host guard (here)
│   ├── FormStackViewport.tsx   # zero-prop viewport: reads viewport ctx, registers
│   │                           #   mount via mount-ctx, renders <FormStackRenderer/>
│   ├── FormStackRenderer.tsx   # chrome-less renderer (stack bodies, display:none hidden)
│   ├── Breadcrumbs.tsx         # uses popToIndex via useFormStackActions()
│   ├── ConfirmationDialog.tsx  # shared confirm dialog (rendered regardless of autoRender)
│   └── FormErrorBoundary.tsx
├── context/
│   ├── FormStackContext.ts     # 4 contexts: State, Actions, Viewport, ViewportMount
│   └── formStackReducer.ts     # PUSH_FORM / POP_FORM / POP_TO_INDEX
├── hooks/
│   ├── useFormStack.ts         # combined hook -> { stack, openForm, closeForm, cancelForm }
│   ├── useFormStackState.ts    # state-only
│   ├── useFormStackActions.ts  # actions-only -> FormStackActions
│   ├── useFormStackViewport.ts # returns FormStackViewportValue | null
│   └── useFormStackURLSync.ts
├── types/
│   ├── context.ts              # FormStackViewportValue, FormStackActions, FormStackState
│   ├── stack.ts                # StackEntry, OpenFormOptions, InternalStackEntry
│   └── form.ts                 # FormProps, DeferredPromise
└── index.ts                    # public barrel (all 0.2.0 symbols exported)
```

### Key data flow for the viewport

`FormStackProvider` computes `viewportValue` (the internal `stack` + `onClose` +
`onCancelRequest`, or `null` when empty) and stores it in
`FormStackViewportContext`. `FormStackViewport` reads that context, registers its
mount via `FormStackViewportMountContext` (powers the dev guard), and spreads the
value into `<FormStackRenderer {...viewport} />`. The renderer renders all forms
with `display:none` on non-top forms (state preserved). `useFormStackViewport()`
returns the same value for consumers who forward it manually.

### `FormStackViewportValue` is structurally identical to `FormStackRendererProps`

```
{ stack: InternalStackEntry<unknown>[]; onClose: () => void;
  onCancelRequest: (entry) => Promise<boolean> }
```
Verified assignable (compile-time guard test passes; `tsc` clean).

## One Conformance Gap Found (see audit_findings.md)

`useFormStack()` (the combined hook) returns `{ stack, openForm, closeForm,
cancelForm }` but **omits `popToIndex`**, even though `useFormStackActions()`
exposes it and PRD §5.2 lists `popToIndex` under the `useFormStack()` section.
Fix = additive 2-line change to `UseFormStackReturn` + hook body. This is the
only code change in this delta.

## Test & Build Health (verified this round)

- `npx tsc --noEmit` → **PASS** (exit 0).
- `npx vitest run` → **286/286 tests pass** (26 files).
- Relevant suites: `FormStackProvider.autoRender.test.tsx` (13),
  `FormStackViewport.test.tsx` (8), `useFormStackViewport.test.tsx` (5).
