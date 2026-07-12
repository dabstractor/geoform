# PRP — P1.M2.T3.S1: Create `examples/shared-modal/` Demonstration

---

## Goal

**Feature Goal**: Create a minimal, **runnable** demonstration of the
single-shared-modal (hostable-viewport) pattern from PRD §10.1 and the README
"Hostable Viewport (Single Shared Modal)" Advanced-Usage subsection produced by
sibling **S1**. The demo proves that one consumer-hosted window (a modal) can host
the entire form stack — unbounded nesting, breadcrumb header, Escape/backdrop
wired to `cancelForm()` — using the **public API only** and the **same form
components** already shipped in `examples/relational-forms/`. It is illustrative
only and is **not** added to the published package (it lives under `examples/`).

**Deliverable**:
1. A new directory **`examples/shared-modal/`** containing:
   - **`App.tsx`** — a root that wraps the app in
     `<FormStackProvider autoRender={false}>` and renders a `SharedModalHost`
     component plus a launch button. `SharedModalHost` is a **zero-dependency,
     inline modal** (plain `<div>` overlay with inline styles) whose header is
     `<Breadcrumbs/>`, whose body is `<FormStackViewport/>`, and whose
     Escape/backdrop/close gesture calls `cancelForm()`. It **reuses** the
     relational-forms form components (`OrganizationForm` → `TeamForm` →
     `UserForm`) by relative import to demonstrate N-deep nesting inside one
     window. A JSDoc header comment explains how to run it.
   - **`README.md`** — a short "how to run" file (mirrors the relational-forms
     integration instructions).
2. A **one-line pointer** added to the README `### Hostable Viewport (Single
   Shared Modal)` Advanced-Usage subsection (the canonical home of this pattern),
   and an additional entry in the `## Examples` section — both linking to
   `./examples/shared-modal` (Mode B docs; optional per the contract, included
   for discoverability).

**Success Definition**:
- `examples/shared-modal/App.tsx` and `examples/shared-modal/README.md` exist and
  the example compiles conceptually against the public exports (it uses only
  symbols exported from `src/index.ts` and the existing relational-forms files).
- The `SharedModalHost` uses `useFormStackState().stack.length > 0` to open, mounts
  **exactly one** `<FormStackViewport/>`, renders `<Breadcrumbs/>` as the header,
  and wires Escape + backdrop-click to `cancelForm()` (from `useFormStackActions()`).
- The example reuses `OrganizationForm` (and transitively `TeamForm`/`UserForm`)
  from `../relational-forms/` — **not** a copy — to demonstrate 3-deep nesting
  inside the single modal.
- The new files are **excluded** from publish/build/type-check/test by the existing
  pipeline config (proven below); `npm run build`, `npm run type-check`, `npm test`
  all remain green; `git status --short` shows only `examples/` additions + the
  two README line insertions.
- The README gains a discoverable pointer to the example.

---

## User Persona (if applicable)

**Target User**: A `geoform` consumer evaluating the hostable-viewport feature
(`autoRender={false}`) who wants a **concrete, copy-pasteable** single-shared-modal
host — without committing to MUI or any dialog library. They read the README
Hostable Viewport subsection (which uses an illustrative MUI `<Dialog>`) and want
to see a dependency-free, actually-runnable version.

**Use Case**: The consumer opens `examples/shared-modal/App.tsx`, reads the JSDoc
"Running This Example" block, drops the files into a Vite React-TS app, and
observes: click "Create Organization" → one modal opens; "+ Add Team" → the body
swaps to TeamForm (OrganizationForm stays mounted-hidden, its state preserved);
"+ Add Team Member" → body swaps to UserForm (N=3 deep); Escape or backdrop click
→ cancels the top form (with the `confirmOnCancel` dialog when applicable);
breadcrumbs → navigate back.

**User Journey**: read README Hostable Viewport subsection → follow the
"see examples/shared-modal" pointer → read `examples/shared-modal/README.md` run
instructions → wire into Vite → run → verify single-modal N-deep nesting +
Escape/backdrop cancel.

**Pain Points Addressed**: The PRD/README MUI `<Dialog>` example is illustrative
and pulls in an unstated dependency. A zero-dep inline modal that actually runs
removes the "what do I install / how do I host this without MUI?" friction and
proves the chrome-less design works with plain DOM.

---

## Why

- **Closes a flagged doc gap.** `plan/002_32eb66cd705d/architecture/readme_gap_map.md`
  §4 notes `examples/shared-modal/` does NOT exist (only `relational-forms/`).
  `plan/002_32eb66cd705d/delta_prd.md` §4 D2 marks this OPTIONAL/non-blocking, but
  a runnable demo materially de-risks adoption of the 0.2.0 hostable-viewport
  feature.
- **Proves the strongest claim of the feature.** Reusing the **same**
  `OrganizationForm`/`TeamForm`/`UserForm` (unchanged) inside a shared-modal host
  demonstrates that forms are agnostic to the rendering strategy: they work under
  the default auto-rendered viewport (relational-forms) AND a consumer-hosted
  modal (shared-modal) with `autoRender={false}`, zero edits, unchanged
  `openForm()` promise contract (PRD §10.1 guarantees).
- **Shows the Escape/backdrop → `cancelForm()` contract in action**, including the
  native `<dialog>` confirmation stacking (see gotcha §4 of the research note).
- **No behavioral risk.** Everything lives under `examples/`, which is excluded
  from `"files"`, `tsup` entry, `tsconfig` include, and vitest `include`. No source
  library file is touched.

---

## What

A new `examples/shared-modal/` directory with two files, plus two one-line README
insertions.

### Scope (EXACT — do only this)

1. **CREATE `examples/shared-modal/App.tsx`** — a runnable demo (see Implementation
   Blueprint). Must:
   - import library symbols from `'../../src'` (NOT a bare `'geoform'` import —
     mirrors `examples/relational-forms/App.tsx`);
   - reuse the form components via `'../relational-forms/OrganizationForm'` and
     types via `'../relational-forms/types'`;
   - render `<FormStackProvider autoRender={false}>` wrapping a
     `<SharedModalHost/>` and a launch control (`ExampleContent` with a
     "Create Organization" button using `openForm`);
   - define `SharedModalHost` using `useFormStackState()` + `useFormStackActions()`,
     a document `keydown` Escape handler, a backdrop click handler, a header with
     `<Breadcrumbs/>`, and **exactly one** `<FormStackViewport/>` body;
   - use **inline `style` props** (not classNames) for overlay/backdrop so the
     modal actually overlays when run (examples ship no CSS);
   - include a JSDoc header with a "## Running This Example" block (mirror the
     relational-forms `App.tsx` header rhythm).
2. **CREATE `examples/shared-modal/README.md`** — short "how to run" (Vite
   React-TS integration), 1–2 paragraphs + a code fence, mirroring the relational-
   forms integration snippet.
3. **MODIFY `README.md`** — two text-anchored one-line insertions (see Integration
   Points). Do NOT touch any API Reference entry, the Hostable Viewport subsection
   body (owned by S1), or any Common Pitfall (owned by S2).

**Do NOT** copy the relational-forms form components into `shared-modal/` —
**reuse** them via relative import. **Do NOT** add a `package.json`,
`vite.config.ts`, or `tsconfig.json` to the example (the existing examples ship
none; they are "integrate into your app" snippets). **Do NOT** import `@mui/material`
or any dialog library (keep it zero-dependency).

### Success Criteria

- [ ] `examples/shared-modal/App.tsx` exists and imports **only** from `'../../src'`
      and `'../relational-forms/*'` — no bare `'geoform'`, no new third-party deps.
- [ ] The root renders `<FormStackProvider autoRender={false}>`.
- [ ] `SharedModalHost` opens on `stack.length > 0`, renders `<Breadcrumbs/>` as
      the header, renders **exactly one** `<FormStackViewport/>` as the body.
- [ ] Escape (document `keydown`, `e.key === 'Escape'`) and backdrop click both
      call `cancelForm()`; the modal panel calls `e.stopPropagation()` so in-modal
      clicks do not cancel.
- [ ] The example opens `OrganizationForm` (which opens `TeamForm` → `UserForm`),
      demonstrating ≥ 3-deep nesting inside the single modal.
- [ ] `examples/shared-modal/README.md` exists and contains runnable integration
      instructions (Vite main.tsx snippet).
- [ ] `App.tsx` has a JSDoc header comment including a "## Running This Example"
      section.
- [ ] README has a discoverable pointer to `./examples/shared-modal` (in the
      Hostable Viewport subsection and/or the `## Examples` section).
- [ ] No source file under `src/` is modified (`git status --short` shows none).
- [ ] `npm run build`, `npm run type-check`, `npm test` all green (no-regression;
      examples are excluded from all three by config).

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** The exact public API symbols, the exact
existing example to mirror (`relational-forms/App.tsx`), the exact relative import
paths, the verified pipeline-exclusion table (so the implementer knows the gates
are no-regression sanity checks, not gates that compile the example), the verified
`cancelForm()` semantics, the critical native-`<dialog>` top-layer stacking fact,
the inline-style rationale, and the exact text-anchored README insertion points
are all captured below. No inference is required.

### Documentation & References

```yaml
# MUST READ — the pattern this example demonstrates
- file: PRD.md
  why: §10.1 "Consumer-Hosted Viewport (Single Shared Modal)" is the authoritative
        contract: autoRender={false} + exactly one <FormStackViewport/>; host
        Escape/backdrop → cancelForm(); unbounded nesting; unchanged openForm()
        promise. §12 shows the openForm() consumer usage shape reused here.
  section: "§10.1 + §12"
  critical: The host owns the window close gesture; geoform owns the cancel
        semantics. cancelForm() honors confirmOnCancel on the top form.

# MUST READ — the README subsection this example is the runnable form of
- file: README.md
  why: "### Hostable Viewport (Single Shared Modal)" (Advanced Usage) shows the
        MUI <Dialog> illustrative snippet. This example is its zero-dep, runnable
        counterpart. Its terminal @see line is the anchor for pointer insertion.
  section: "Advanced Usage > Hostable Viewport (Single Shared Modal)"
  gotcha: README is edited concurrently by S2. Anchor ONLY on unique text, never
        on line numbers. S1 (Hostable Viewport subsection) is Complete → stable.

# MUST READ — the house-style example to mirror exactly
- file: examples/relational-forms/App.tsx
  why: Defines the example conventions: library import via '../../src'; JSDoc
        header with "## Running This Example" Vite integration block; a root
        <FormStackProvider> + a content component that opens OrganizationForm via
        openForm(); collects NewOrganization → adds id via crypto.randomUUID().
  pattern: "Root provider + ExampleContent launch button + JSDoc run instructions"
  gotcha: examples ship NO package.json / vite config / CSS — they are
        "integrate into your app" snippets. Reuse, don't copy, the forms.

# MUST READ — the forms being reused (do NOT modify; import via ../relational-forms)
- file: examples/relational-forms/OrganizationForm.tsx
  why: OrganizationForm opens TeamForm (confirmOnCancel:true), which opens
        UserForm. Demonstrates 3-deep nesting. Implements FormProps<NewOrganization>.
  pattern: "FormProps<T> + openForm<NewChild>({component: ChildForm, ...})"
- file: examples/relational-forms/types.ts
  why: Provides NewOrganization / Organization types the shared-modal App needs
        to type its openForm call and result handling (mirrors relational-forms App).

# MUST READ — the public API surface used by the example (all exported from src/index.ts)
- file: src/index.ts
  why: Confirms exact symbol names + that FormStackViewport, useFormStackState,
        useFormStackActions, Breadcrumbs, FormStackProvider(autoRender) are public.
        The example MUST import these from '../../src' (mirroring relational-forms).
  critical: cancelForm lives on useFormStackActions() (and combined useFormStack()).

# MUST READ — cancelForm() semantics (what Escape/backdrop must call)
- file: src/components/FormStackProvider.tsx
  why: cancelForm() cancels the TOP form through confirmation (confirmOnCancel)
        then promise resolution; no-op when empty. This is the host close gesture.
  section: "cancelForm useCallback"
  critical: The provider also renders <ConfirmationDialog/> as a sibling of
        children — see ConfirmationDialog note below for stacking.

# MUST READ — why a plain-div modal works without a portal library
- file: src/components/ConfirmationDialog.tsx
  why: Renders a native <dialog> opened with showModal() (top-layer). The confirm
        dialog is rendered by the PROVIDER (sibling of children), yet paints above
        the example's z-index div overlay because native <dialog>::backdrop is in
        the top layer. ⇒ zero-dep inline modal is correct; no MUI/portal needed.
  section: "showModal() effect (lines ~67-75)"

# MUST READ — the pipeline-exclusion proof (gates are no-regression sanity checks)
- file: package.json
  why: "files": ["dist","README.md","LICENSE"] ⇒ examples/ is NOT published.
- file: tsup.config.ts
  why: entry: ['src/index.ts'] ⇒ examples/ is NOT built.
- file: tsconfig.json
  why: "include": ["src","vitest.setup.ts"] ⇒ examples/ is NOT type-checked.
- file: vitest.config.ts
  why: test.include: ['src/**/*.{test,spec}.{ts,tsx}'] ⇒ examples/ is NOT tested.
  critical: None of build/type-check/test will COMPILE the example. Their staying
        green proves "no source touched", not "example compiles". The example's
        own correctness is verified by manual/integration review only.

# REFERENCE — the gap being closed (OPTIONAL / non-blocking per delta_prd §4 D2)
- file: plan/002_32eb66cd705d/architecture/readme_gap_map.md
  why: §4 flags examples/shared-modal/ as missing. Notes only relational-forms/ exists.
- file: plan/002_32eb66cd705d/delta_prd.md
  why: §4 D2 marks this example OPTIONAL/non-blocking (stretch). Scope is minimal.
```

### Current Codebase tree (relevant slice)

```bash
examples/
  relational-forms/            # ONLY existing example — the house style + form source
    App.tsx                    # <FormStackProvider> (autoRender=true default) + launch
    OrganizationForm.tsx       # opens TeamForm (confirmOnCancel:true) → UserForm
    TeamForm.tsx               # opens UserForm
    UserForm.tsx               # leaf form
    types.ts                   # User, Team, Organization, New*
src/
  index.ts                     # public API (FormStackProvider, FormStackViewport,
                               #   Breadcrumbs, useFormStackState, useFormStackActions, …)
  components/FormStackProvider.tsx   # autoRender prop + cancelForm() impl
  components/FormStackViewport.tsx   # zero-prop body slot
  components/ConfirmationDialog.tsx  # native <dialog> (top-layer) — stacking fact
README.md                      # Hostable Viewport subsection (S1) + ## Examples index
package.json  tsconfig.json  tsup.config.ts  vitest.config.ts   # all EXCLUDE examples/
```

### Desired Codebase tree with files to be added

```bash
examples/
  relational-forms/            # UNCHANGED (imported from, not modified)
    ... (App.tsx, *Form.tsx, types.ts)
  shared-modal/                # NEW — this task
    App.tsx                    # NEW — Provider autoRender={false} + SharedModalHost
                               #       + ExampleContent launch button + JSDoc run block;
                               #       reuses ../relational-forms/{OrganizationForm,types}
    README.md                  # NEW — short "how to run" (Vite integration)
README.md                      # MODIFIED — two one-line example pointers added
```

Responsibilities:
- `examples/shared-modal/App.tsx` — sole demonstration file; owns the host chrome
  (`SharedModalHost`) and the launch flow (`ExampleContent`). No library edit.
- `examples/shared-modal/README.md` — runnable integration instructions only.

### Known Gotchas of our codebase & Library Quirks

```tsx
// CRITICAL: examples/ is excluded from publish/build/type-check/test (see table above).
// `npm run type-check` will NOT compile App.tsx. Its staying green = "no src changed",
// NOT "the example type-checks". Verify the example by manual review against src/index.ts.

// CRITICAL: import the library via the RELATIVE source path, NOT the package name.
//   import { FormStackProvider, FormStackViewport, ... } from '../../src';   // ✅
//   import { ... } from 'geoform';                                           // ❌
// (Mirrors examples/relational-forms/App.tsx. 'geoform' resolves to dist/ which
//  may be absent/stale during local example hacking.)

// CRITICAL: mount EXACTLY ONE <FormStackViewport/>. Two would render the stack
// twice (PRD §10.1 / README Hostable Viewport "Guarantees"). The dev-only guard
// warns if zero are mounted while a form is open.

// CRITICAL: the cancel-confirmation <ConfirmationDialog/> is rendered by the PROVIDER
// (sibling of children), NOT inside SharedModalHost. It uses native <dialog>::showModal
// (top layer), so it paints above the example's div overlay with no portal lib.
// ⇒ A plain <div style={{position:'fixed', inset:0, ...}}> modal is correct.

// CRITICAL: examples ship NO CSS. relational-forms uses className hooks but provides
// no stylesheet. For a MODAL to actually overlay, use INLINE style props
// (position:fixed; inset:0; background:rgba(0,0,0,.5); z-index) — do NOT rely on a
// .css file that does not exist.

// GOTCHA: cancelForm() is async (Promise<void>) but using it as an onClick / keydown
// handler fire-and-forget is fine. It honors confirmOnCancel on the TOP form only;
// deeper forms stay intact (matches PRD §10.1 "Escape/backdrop cancels the top form").

// GOTCHA: backdrop click must call cancelForm(), but clicks INSIDE the modal panel
// must NOT. Stop propagation on the panel: <div onClick={(e)=>e.stopPropagation()}>.

// GOTCHA: Escape handler should be attached at document level and only active while
// the modal is open (stack.length>0). Clean up in the effect return.
```

---

## Implementation Blueprint

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE examples/shared-modal/App.tsx
  - IMPORT from '../../src': FormStackProvider, FormStackViewport, Breadcrumbs,
        useFormStackState, useFormStackActions.
  - IMPORT from '../relational-forms/OrganizationForm': { OrganizationForm }.
  - IMPORT type from '../relational-forms/types': NewOrganization, Organization.
  - IMPLEMENT SharedModalHost():
      * const { stack } = useFormStackState();
      * const { cancelForm } = useFormStackActions();
      * useEffect: when stack.length>0, attach document 'keydown' listener; on
        Escape (e.key==='Escape') call e.preventDefault() + cancelForm(). Cleanup
        removes the listener. Deps: [stack.length, cancelForm].
      * if (stack.length === 0) return null;   // window closed when empty
      * return a fixed-position backdrop <div style={backdrop} onClick={cancelForm}>
          containing a panel <div style={panel} onClick={(e)=>e.stopPropagation()}>
          with role="dialog" aria-modal="true":
            - <header style={header}><Breadcrumbs separator=" › " /></header>
            - <div style={body}><FormStackViewport /></div>   // EXACTLY ONE
      * use inline style objects (backdrop/panel/header/body) defined as consts.
  - IMPLEMENT ExampleContent():
      * const { openForm } = useFormStackActions() (or useFormStack());
      * const [organizations, setOrganizations] = useState<Organization[]>([]);
      * handleCreateOrganization = async () => {
          const newOrg = await openForm<NewOrganization>({
            id: 'create-organization',
            component: OrganizationForm,
            label: 'New Organization',
            confirmOnCancel: true,   // demonstrates confirmation inside the modal
          });
          if (newOrg) setOrganizations(prev => [...prev, {...newOrg, id: crypto.randomUUID()}]);
        };
      * render a simple landing UI: heading + a list/empty-state of organizations
        + a "Create Organization" button bound to handleCreateOrganization.
  - IMPLEMENT default export App():
      * return <FormStackProvider autoRender={false}><ExampleContent /><SharedModalHost /></FormStackProvider>
      * NOTE: ExampleContent (the app body) and SharedModalHost (the window) are
        BOTH children of the provider. The viewport lives inside the host only.
  - ADD JSDoc header comment at top of file: one-paragraph purpose + a
        "## Running This Example" section with a Vite main.tsx integration code
        fence (mirror examples/relational-forms/App.tsx header). Mention this is
        illustrative, not published, and that it reuses the relational-forms forms.
  - FOLLOW pattern: examples/relational-forms/App.tsx (import style, JSDoc rhythm,
        openForm<NewOrganization>({component: OrganizationForm, confirmOnCancel:true})).
  - NAMING: SharedModalHost, ExampleContent, App (default export). PascalCase comps.
  - PLACEMENT: examples/shared-modal/App.tsx.

Task 2: CREATE examples/shared-modal/README.md
  - Short doc: what the example demonstrates (single-shared-modal / hostable
        viewport), the 3-deep nesting, Escape/backdrop→cancelForm, and how to run.
  - INCLUDE a Vite React-TS integration snippet (create app; drop the example in;
        import App from the example path; render in main.tsx). Mirror the snippet
        in relational-forms/App.tsx JSDoc.
  - NOTE zero extra dependencies (React + the geoform source only; no MUI).
  - NOTE examples are illustrative and not part of the published package.
  - PLACEMENT: examples/shared-modal/README.md.

Task 3: MODIFY README.md — add the shared-modal pointer to Advanced Usage
  - FIND (unique, S1-stable text at end of "### Hostable Viewport (Single Shared Modal)"):
        @see the [`autoRender`](#formstackprovider) prop on `<FormStackProvider/>`, and
        [Common Pitfalls > Forgetting `<FormStackViewport/>`](#forgetting-formstackviewport-with-autorenderfalse).
  - INSERT immediately AFTER that paragraph, a one-line pointer:
        See [`examples/shared-modal`](./examples/shared-modal) for a complete
        runnable demo of this single-shared-modal pattern (zero dialog-library
        dependencies).
  - DO NOT edit any other line of the Hostable Viewport subsection.

Task 4: MODIFY README.md — add shared-modal to the ## Examples index
  - FIND (unique text, ~the Examples section):
        See the [examples/relational-forms](./examples/relational-forms) directory for a complete working example demonstrating:
  - INSERT a sibling block AFTER the relational-forms bullet list (which ends
        before the `## Browser Support` heading), e.g.:
        See [`examples/shared-modal`](./examples/shared-modal) for a runnable demo
        of the **hostable viewport / single-shared-modal** pattern
        (`autoRender={false}` + `<FormStackViewport/>`), reusing the same forms as
        the relational-forms example inside one consumer-hosted modal.
  - DO NOT modify the existing relational-forms bullets.
```

### Implementation Patterns & Key Details

```tsx
// === The SharedModalHost — the heart of this example ===
// Pattern: read stack for open/close + cancelForm for the close gesture.
// Mirror the README/S1 host snippet, but with a zero-dep inline modal.
function SharedModalHost() {
  const { stack } = useFormStackState();
  const { cancelForm } = useFormStackActions();

  // Escape cancels the top form (honors confirmOnCancel). Active only while open.
  useEffect(() => {
    if (stack.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        void cancelForm();          // async; fire-and-forget is fine
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [stack.length, cancelForm]);

  if (stack.length === 0) return null;   // <FormStackViewport/> also renders null when empty

  // Backdrop click = host close gesture → cancelForm.
  // Panel stops propagation so clicks inside the modal don't cancel.
  return (
    <div style={backdropStyle} onClick={cancelForm}>
      <div
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header style={headerStyle}>
          <Breadcrumbs separator=" › " />
        </header>
        <div style={bodyStyle}>
          <FormStackViewport />   {/* EXACTLY ONE; renders the stack bodies */}
        </div>
      </div>
    </div>
  );
}

// === Inline style objects (examples ship no CSS) ===
const backdropStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const panelStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 8, minWidth: 420, maxWidth: 640,
  maxHeight: '80vh', display: 'flex', flexDirection: 'column',
};
const headerStyle: React.CSSProperties = {
  padding: '12px 16px', borderBottom: '1px solid #eee',
};
const bodyStyle: React.CSSProperties = { padding: 16, overflow: 'auto' };

// === Root: provider with autoRender={false} hosts the viewport in the modal ===
export default function App() {
  return (
    <FormStackProvider autoRender={false}>
      <ExampleContent />     {/* app body: "Create Organization" launch button */}
      <SharedModalHost />    {/* the single window that hosts the whole stack */}
    </FormStackProvider>
  );
}

// === Launch flow: reuse the relational-forms OrganizationForm unchanged ===
function ExampleContent() {
  const { openForm } = useFormStackActions();
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const handleCreateOrganization = async () => {
    const newOrg = await openForm<NewOrganization>({
      id: 'create-organization',
      component: OrganizationForm,   // imported from '../relational-forms/OrganizationForm'
      label: 'New Organization',
      confirmOnCancel: true,         // demos confirmation stacking inside the modal
    });
    if (newOrg) {
      setOrganizations((prev) => [...prev, { ...newOrg, id: crypto.randomUUID() }]);
    }
  };

  return (
    <div>
      <h1>Geoform Example: Shared Modal (Hostable Viewport)</h1>
      {/* … organizations list / empty state … */}
      <button onClick={handleCreateOrganization}>Create Organization</button>
    </div>
  );
}
```

### Integration Points

```yaml
PACKAGE (none):
  - examples/ is NOT in package.json "files" → nothing to add. NOT published.

BUILD / TYPE-CHECK / TEST (none):
  - tsup entry, tsconfig include, vitest include all exclude examples/ → no config
    change. Gates stay green by construction (no-regression proof, not example compile).

README (Mode B docs — two one-line, text-anchored insertions):
  - add to: README.md → "### Hostable Viewport (Single Shared Modal)" (Advanced Usage)
    anchor (insert AFTER this exact block):
      "@see the [`autoRender`](#formstackprovider) prop on `<FormStackProvider/>`, and
       [Common Pitfalls > Forgetting `<FormStackViewport/>`](#forgetting-formstackviewport-with-autorenderfalse)."
    content: "See [`examples/shared-modal`](./examples/shared-modal) for a complete
              runnable demo of this single-shared-modal pattern (zero dialog-library
              dependencies)."
  - add to: README.md → "## Examples" section
    anchor (insert AFTER the relational-forms bullet list, before "## Browser Support"):
      "See the [examples/relational-forms](./examples/relational-forms) directory for a complete working example demonstrating:"
    content: a short sibling block linking ./examples/shared-modal and noting it
              reuses the relational-forms forms inside one consumer-hosted modal.

ROUTES / DATABASE / CONFIG: none.
```

---

## Validation Loop

> NOTE: Because `examples/` is excluded from build/type-check/test (see Context),
> Levels 1–2 are **no-regression sanity checks** proving no `src/` file changed —
> they do NOT compile the example. The example's own correctness is verified by
> Level 3 (manual/integration review).

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Confirm the new example files are syntactically plausible (optional, local only;
# they are NOT part of tsc's include). A quick standalone transpile sanity check:
npx tsc --noEmit --jsx react-jsx --moduleResolution bundler --target ES2020 \
  --module ESNext --strict examples/shared-modal/App.tsx 2>/dev/null \
  && echo "example transpile: ok (informational only)" \
  || echo "example transpile: warnings ok — examples are not type-checked by the project"

# Project gates MUST stay green (proves no src file was touched):
npm run type-check     # tsc --noEmit (includes src/ + vitest.setup.ts only)
npm run build          # tsup (entry: src/index.ts only)

# Expected: both pass with zero errors. The example is intentionally outside both.
```

### Level 2: Unit Tests (Component Validation)

```bash
# The example has NO tests (examples/ is excluded from vitest include). Confirm the
# full suite still passes (no-regression):
npm test               # vitest run (include: src/**/*.{test,spec}.{ts,tsx})

# Expected: all existing tests pass. No new test files are added by this task.
```

### Level 3: Integration Testing (System Validation — MANUAL review of the example)

```bash
# 3a. Verify the example reuses (does not duplicate) the relational-forms forms:
grep -n "from '../relational-forms/" examples/shared-modal/App.tsx
# Expected: matches for OrganizationForm and types. No copied form files exist:
ls examples/shared-modal/   # Expected: App.tsx, README.md  (only)

# 3b. Verify the public-API contract is satisfied (all symbols imported from ../../src):
grep -n "from '../../src'" examples/shared-modal/App.tsx
# Expected: one import line sourcing FormStackProvider, FormStackViewport,
#           Breadcrumbs, useFormStackState, useFormStackActions.

# 3c. Verify the hostable-viewport contract:
grep -n "autoRender={false}" examples/shared-modal/App.tsx        # provider opts out
grep -c "<FormStackViewport />" examples/shared-modal/App.tsx      # MUST be exactly 1
grep -n "cancelForm" examples/shared-modal/App.tsx                 # Escape + backdrop
grep -n "<Breadcrumbs" examples/shared-modal/App.tsx               # header
grep -n "stack.length" examples/shared-modal/App.tsx               # open/close guard

# Expected: autoRender={false} present; <FormStackViewport /> count == 1; cancelForm
# referenced in the Escape handler AND the backdrop onClick; Breadcrumbs in header;
# stack.length used for the open guard.

# 3d. To ACTUALLY RUN the demo (optional, in a throwaway Vite app):
#   npm create vite@latest shared-modal-sandbox -- --template react-ts
#   cd shared-modal-sandbox && npm i
#   # copy geoform repo alongside, then in src/main.tsx:
#   #   import App from '../../geoform/examples/shared-modal/App';
#   #   createRoot(document.getElementById('root')!).render(<App/>)
#   npm run dev   # open the printed URL
# Manual journey: Create Organization → +Add Team → +Add Team Member (3 deep in ONE
# modal); press Escape on a confirmOnCancel form → native confirmation dialog appears
# ABOVE the modal; click a breadcrumb → navigates back; backdrop click → cancels top.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Verify pipeline exclusion holds (the example is NOT shipped/built):
node -e "console.log(require('./package.json').files)"   # → [ 'dist', 'README.md', 'LICENSE' ]
grep -n "entry:" tsup.config.ts                          # → entry: ['src/index.ts']
grep -n '"include"' tsconfig.json                        # → ["src", "vitest.setup.ts"]
grep -n "include:" vitest.config.ts                      # → ['src/**/*.{test,spec}.{ts,tsx}']

# Verify README pointers resolve (anchors present, links not dead):
grep -n "examples/shared-modal" README.md                # ≥ 2 (Advanced Usage + Examples index)
grep -n "Hostable Viewport" README.md                    # the subsection still intact

# Verify no source file was touched:
git status --short                                       # examples/shared-modal/{App.tsx,README.md}
                                                         # + README.md only

# Expected: 'geoform' "files" omits examples/; git status shows only the two new
# example files + README.md modified.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run type-check` green (no-regression; examples excluded).
- [ ] `npm run build` green (no-regression; examples excluded).
- [ ] `npm test` green (no-regression; examples excluded).
- [ ] Level 3 grep contract met: `autoRender={false}`, exactly ONE
      `<FormStackViewport />`, `cancelForm` on Escape + backdrop, `<Breadcrumbs/>`
      header, `stack.length` open guard.

### Feature Validation

- [ ] `examples/shared-modal/App.tsx` imports the library from `'../../src'` only.
- [ ] `examples/shared-modal/App.tsx` reuses `OrganizationForm` (+types) from
      `'../relational-forms/*'` — no copied form files.
- [ ] `SharedModalHost` is a zero-dependency inline modal (inline `style` props;
      no MUI/portal import).
- [ ] `examples/shared-modal/README.md` exists with Vite run instructions.
- [ ] `App.tsx` JSDoc header includes a "## Running This Example" section.
- [ ] README has ≥ 1 discoverable pointer to `./examples/shared-modal`.
- [ ] Manual run (optional, Level 3d): 3-deep nesting in one modal; Escape on a
      `confirmOnCancel` form shows the native confirmation above the modal;
      breadcrumb navigation works; backdrop click cancels the top form.

### Code Quality Validation

- [ ] Mirrors `examples/relational-forms/App.tsx` conventions (import path, JSDoc,
      `openForm<NewOrganization>({component: OrganizationForm})` shape).
- [ ] No new `package.json`/`vite.config.ts`/`tsconfig.json` in the example.
- [ ] No third-party dialog dependency added.
- [ ] No file under `src/` modified.

### Documentation & Deployment

- [ ] README pointer(s) link to `./examples/shared-modal` and resolve.
- [ ] Example is self-documenting (JSDoc header + README.md).
- [ ] Example is NOT in the published package (`"files"` whitelist excludes it).

---

## Anti-Patterns to Avoid

- ❌ Don't import from `'geoform'` in the example — use `'../../src'` (mirrors
  relational-forms; `geoform` may be absent/stale locally).
- ❌ Don't copy the relational-forms form components into `shared-modal/` — reuse
  them via `'../relational-forms/*'` (the contract says "reuse").
- ❌ Don't mount more than one `<FormStackViewport/>` (renders the stack twice).
- ❌ Don't wire Escape/backdrop to `closeForm()` — use `cancelForm()` (it honors
  `confirmOnCancel` and resolves the promise correctly; PRD §10.1).
- ❌ Don't rely on a CSS file for the modal overlay — examples ship none; use
  inline `style`.
- ❌ Don't add `@mui/material` or any dialog library — keep the example zero-dep.
- ❌ Don't anchor README edits on line numbers (README shifts under concurrent S2
  edits) — anchor on unique text.
- ❌ Don't edit the Hostable Viewport subsection body or any Common Pitfall (owned
  by S1/S2) — only insert the example pointer lines.
- ❌ Don't add the example to `package.json` `"files"`, `tsup` entry, `tsconfig`
  include, or vitest include — it must stay unpublished/unbuilt.

---

**Confidence Score**: 9/10 — The task is well-bounded (two new example files + two
one-line README insertions), the public API and existing example to mirror are
fully specified, the pipeline-exclusion proof removes any risk of breaking gates,
and the critical native-`<dialog>` stacking fact is captured. The one residual
uncertainty is that the example itself is never compiled by the project gates, so
its correctness rests on careful adherence to the blueprint (mitigated by the
Level 3 grep contract + optional manual run).
