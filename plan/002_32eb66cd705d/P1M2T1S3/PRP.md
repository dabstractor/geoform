# PRP — P1.M2.T1.S3: Add `#### FormStackViewport` component entry to README.md

---

## Goal

**Feature Goal**: Close the `FormStackViewport` component-entry gap flagged in
`readme_gap_map.md` §3.4. Today `FormStackViewport` appears in the README **only**
inside the `FormStackProvider` Props/prose area (lines 150–162, added by the
now-landed P1.M2.T1.S1). The `### Components` section has **no dedicated
`#### FormStackViewport` API entry** — it jumps from `#### FormErrorBoundary`
straight to `### Hooks`. This task inserts a standalone, house-style component
entry for the zero-prop placeable viewport, so consumers reading the Components
section can discover and wire it.

**Deliverable**: A **single content-anchored edit to `README.md`** — one new
`#### FormStackViewport` block inserted between the `---` separator that closes
`#### FormErrorBoundary` and the `### Hooks` heading. **No source files are
touched** (Mode B — changeset-level docs).

**Success Definition**:
- A dedicated `#### FormStackViewport` heading exists in `### Components`, placed
  after `#### FormErrorBoundary` and before `### Hooks`.
- The entry follows the house-style component-entry template: description →
  `tsx` import+placement snippet → `**Props:** None` → `autoRender={false}` note.
- The entry's prose accurately reflects the source
  (`src/components/FormStackViewport.tsx`) and PRD §10/§10.1: zero-prop; renders
  the stacked form bodies (top visible, parents mounted-hidden via `display:
  none`); reads the stack from context; renders `null` when empty or outside a
  provider.
- `grep -c FormStackViewport README.md` is **≥ 1** (the contract's literal gate;
  it is currently 4 from S1's prose and will rise).
- `npm run type-check`, `npm test`, and `npm run build` all stay green (README-only
  edit → no-regression, and proves no source file was accidentally changed).
- `git status --short` shows **only** `README.md` modified.

---

## User Persona (if applicable)

**Target User**: A `geoform` consumer reading the `### Components` API Reference
who wants to host the form-stack viewport inside their own window chrome (e.g. a
single shared `<Dialog>` modal) instead of letting the provider render it
automatically.

**Use Case**: The consumer sets `<FormStackProvider autoRender={false}>` and now
needs to know which component renders the stacked form bodies and where to place
it. They scan the Components section and find the `#### FormStackViewport` entry.

**User Journey**: Read `#### FormStackViewport` → learn it is zero-prop and reads
the stack from context → copy the import + placement snippet → see the
`autoRender={false}` note → mount `<FormStackViewport/>` inside their host.

**Pain Points Addressed**: Today a consumer who chose `autoRender={false}` (the
hostable-viewport pattern from PRD §10.1) has no Components-section entry to reach
for — `FormStackViewport` is only mentioned in passing inside the
`FormStackProvider` Props table. A dedicated entry makes the placeable viewport a
first-class, discoverable API symbol.

---

## Why

- **Discoverability of a shipped export.** `FormStackViewport` is exported from
  the public surface (`src/index.ts:130`), is zero-prop, and is the recommended
  way to host the stack (the source JSDoc says "Most consumers should use
  `<FormStackViewport/>`" over the low-level `useFormStackViewport` hook). The
  Components section is the canonical discovery surface; an undocumented component
  there is effectively invisible.
- **Mirrors PRD §10.1.** PRD §10.1 names `<FormStackViewport/>` as one of the two
  exports that make the chrome-less renderer placeable through the public API. The
  README must document it as a component (this task) and its hook companion as a
  hook (P1.M2.T1.S4).
- **Anchor for the Hostable Viewport narrative.** The Hostable Viewport Advanced
  Usage section (P1.M2.T2.S1) and the "Forgetting `<FormStackViewport/>`" Common
  Pitfall (P1.M2.T2.S2) both need a Components-section anchor to cross-link to.
  This entry is that anchor.
- **No behavioral risk.** Pure documentation — one Markdown block. Cannot change
  runtime behavior, types, or tests.

---

## What

User-visible behavior (of the **docs**): the `### Components` section gains a new
`#### FormStackViewport` entry, inserted between the `---` that closes
`#### FormErrorBoundary` and the `### Hooks` heading. The entry matches the
house-style component-entry template.

### Scope (EXACT — do only this)

One content-anchored insertion to `README.md` (see Implementation Blueprint). The
new block contains: (1) a `#### FormStackViewport` heading; (2) a description
covering zero-prop, top-visible / parents-`display:none`, reads-from-context,
renders `null` when empty or outside a provider; (3) a `tsx` import + placement
snippet (`<FormStackProvider autoRender={false}>` wrapping a host that renders
`<FormStackViewport/>`); (4) a `**Props:** None` line; (5) a blockquote note that
the viewport is only meaningful with `autoRender={false}` (and that the default
`autoRender={true}` already renders the provider's own viewport, so mounting
another would double-render). **Do NOT** edit any other section (see Scope Guard).

### Success Criteria

- [ ] A `#### FormStackViewport` heading exists in `### Components`, positioned
      after `#### FormErrorBoundary` and before `### Hooks`.
- [ ] The entry description states the viewport is **zero-prop**, renders stacked
      form bodies with the **top form visible and parents hidden via `display:
      none`**, **reads the stack from context**, and **renders `null` when the
      stack is empty or outside a provider**.
- [ ] The entry includes a `tsx` snippet showing `FormStackProvider
      autoRender={false}` wrapping a host that renders `<FormStackViewport/>`.
- [ ] The entry includes a literal `**Props:** None` statement.
- [ ] The entry includes a note that it is only meaningful with
      `autoRender={false}` (and why — default provider already renders a viewport).
- [ ] `grep -c FormStackViewport README.md` ≥ 1.
- [ ] `npm run type-check`, `npm test`, `npm run build` all green (no-regression).
- [ ] `git status --short` lists **only** `README.md`.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** This is one Markdown block inserted at a
content-anchored location in `README.md`. The exact old-text block, the exact
replacement text (the full new entry), the house-style template to mirror, the
verified component behavior, and the exact validation commands are all captured
below. No inference is required.

### Documentation & References

```yaml
# MUST READ — the component contract this entry documents
- file: src/components/FormStackViewport.tsx
  why: The authoritative behavior: zero props; reads `viewport` from
        `FormStackViewportContext` + a mount setter from
        `FormStackViewportMountContext`; registers mount for the dev guard via
        `useEffect`; returns `null` when there is no viewport value (empty stack
        or outside a provider); otherwise renders `<FormStackRenderer {...viewport}/>`.
        The JSDoc is the authoritative prose to paraphrase.
  pattern: "zero-prop; renders stacked form bodies (top visible, parents mounted-hidden);
        reads stack from context; renders nothing when empty; intended for
        autoRender={false} host window chrome."
  critical: The component has NO props and NO CSS classes — so the entry uses
        `**Props:** None` and has NO `**CSS Classes:**` block. Do NOT invent props.

# MUST READ — public export status (proves it belongs in the Components section)
- file: src/index.ts
  why: Line 130 `export { FormStackViewport } from './components';`. Also confirms
        `useFormStackState` (line 263) and `useFormStackActions` are exported,
        which the placement snippet may import.
  critical: `FormStackViewport` is a real, named public export — the entry is
        warranted, not speculative.

# MUST READ — the gap being closed + insertion point + house-style template
- file: plan/002_32eb66cd705d/architecture/readme_gap_map.md
  why: §3.4 / item 4 prescribes exactly this entry (zero-prop viewport; renders
        stacked bodies, top visible, parents display:none; reads from context;
        renders nothing when empty; import+placement snippet with
        autoRender={false}; `**Props:** None`). Also gives the House-Style Template
        (a) for component entries to match exactly.
  section: "Section-by-Section Insertion Map §3 (item 4)" and "House-Style Templates"
  gotcha: The gap map cited "~line 264" — that was measured BEFORE P1.M2.T1.S1
        expanded the FormStackProvider Props area. FormErrorBoundary has since
        shifted DOWN to line 244. ALWAYS anchor by content, never by line number.

# MUST READ — the authoritative spec this documents
- file: PRD.md
  why: §10 defines rendering behavior (top visible; parents mounted-hidden via
        `display: none`; renderer chrome-less). §10.1 defines
        `<FormStackViewport/>` as a zero-prop component rendering the stacked
        bodies, reading from context, rendering nothing when empty.
  critical: §10.1 guarantee — with `autoRender={false}` + exactly one
        `<FormStackViewport/>`, an open form renders exactly once. This is the
        basis for the "only meaningful with autoRender={false}" note.

# HOUSE-STYLE MIRROR — the peer component entries already in the README
- file: README.md
  why: The existing `#### Breadcrumbs`, `#### ConfirmationDialog`, and
        `#### FormErrorBoundary` entries show the EXACT format: `#### Name`
        heading → one-line/short description → ```tsx import+usage snippet →
        `**Props:**` table-or-None → (optional) `>` blockquote note → `---`.
        The `#### FormStackProvider` entry also uses a `> **Dev-mode guard:**`
        blockquote — the same `>` note style this entry reuses.
  pattern: Copy the heading + description + fenced tsx + `**Props:**` + `---`
        rhythm verbatim from the Breadcrumbs/FormErrorBoundary entries.
  gotcha: Each component entry is followed by a `---` separator. The new entry
        MUST end with its own `---` so `### Hooks` keeps a separator above it.

# EXACT EDIT TARGET — the insertion anchor (see Implementation Blueprint)
- file: README.md
  why: The single insertion point is the `---` separator that closes
        `#### FormErrorBoundary`, immediately followed by `### Hooks`.
  gotcha: Line numbers are APPROXIMATE and shift across sibling tasks. Anchor by
        the exact text block (`.form-error-boundary__dismiss-button` ... `---` ...
        `### Hooks`), located via `grep -n`.
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── README.md                       # ← EDIT: insert one block between FormErrorBoundary's --- and ### Hooks
├── PRD.md                          # READ-ONLY — §10/§10.1 source of truth
├── package.json                    # scripts: test=vitest run, type-check=tsc --noEmit, build=tsup
├── src/
│   ├── components/FormStackViewport.tsx  # READ-ONLY — the component contract (zero-prop)
│   └── index.ts                         # READ-ONLY — line 130 confirms public export
└── plan/002_32eb66cd705d/
    ├── architecture/readme_gap_map.md    # §3.4 gap + insertion map + house-style template
    └── P1M2T1S3/                          # ← THIS PRP lives here
```

### Desired Codebase tree with files to be changed

```bash
README.md                           # MODIFIED — 1 content-anchored insertion (new #### FormStackViewport block)
# (no new files; no source files touched)
```

### Known Gotchas of our codebase & Library Quirks

```markdown
<!-- CRITICAL: This is Mode B (documentation-only). The ONLY file you may edit is README.md.
     Do NOT touch any src/ file, PRD.md, tasks.json, prd_snapshot.md, or CHANGELOG.md. -->

<!-- CRITICAL: ANCHOR BY CONTENT, NOT LINE NUMBER. The gap map cited "~line 264" but that
     predates P1.M2.T1.S1, which expanded the FormStackProvider Props area and shifted
     FormErrorBoundary DOWN to line 244. The `---` you want is the one IMMEDIATELY above
     `### Hooks`. Locate it with:
         grep -n "form-error-boundary__dismiss-button\|^### Hooks" README.md
     and confirm the block between them is: the closing ``` of the css fence, then `---`,
     then `### Hooks`. The Implementation Blueprint's oldText block is verified unique. -->

<!-- CRITICAL: The new entry must NOT duplicate the full Hostable Viewport (shared-modal)
     walkthrough — that is P1.M2.T2.S1's job. Keep the tsx snippet PLACEMENT-FOCUSED:
     <FormStackProvider autoRender={false}> wrapping a host that renders <FormStackViewport/>.
     Do NOT include the full Breadcrumbs-as-DialogTitle / cancelForm / Dialog-onClose flow. -->

<!-- GOTCHA: FormStackViewport has NO props and NO CSS classes. Use `**Props:** None` and
     do NOT add a Props table or a `**CSS Classes:**` block. (Source: the component takes
     no args and renders <FormStackRenderer {...viewport}/> — no styling of its own.) -->

<!-- GOTCHA: The entry must end with its own `---` separator so the Components section
     keeps its rhythm (every component entry is followed by `---`). Without it, the new
     entry would run directly into `### Hooks`. -->

<!-- GOTCHA: The `#hostable-viewport-single-shared-modal` anchor is NOT YET a real heading —
     it will be created by P1.M2.T2.S1. BUT it is ALREADY referenced in the README (line 150,
     the FormStackProvider autoRender Props row, added by the landed S1). Reusing the SAME
     anchor here is consistent with the established convention and will resolve once T2.S1
     lands. Do NOT invent a different anchor slug. -->

<!-- GOTCHA: Do NOT document the `useFormStackViewport` hook or the `FormStackViewportValue`
     type in THIS entry — those are P1.M2.T1.S4 (hook + type). You may MENTION
     `useFormStackViewport` as the low-level hook alternative (it is cross-referenced in the
     source JSDoc), but do not write its Returns table or type block here. -->

<!-- GOTCHA: "parents mounted-hidden" MUST be expressed as `display: none` (per PRD §10), not
     e.g. "visibility: hidden" or "opacity: 0". The exact CSS strategy is display:none. -->
```

---

## Implementation Blueprint

### Data models and structure

No data models. This is a Markdown documentation edit. The single structured asset
is the **new component-entry block**, fixed by the source behavior and the
house-style template.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EDIT README.md — insert the new #### FormStackViewport component entry
  - TARGET FILE: README.md
  - LOCATE BY CONTENT (not line number): the `---` separator that closes the
        `#### FormErrorBoundary` entry, immediately followed by `### Hooks`.
        Confirm with:
            grep -n "form-error-boundary__dismiss-button\|^### Hooks" README.md
        The oldText block below is verified UNIQUE (`.form-error-boundary__dismiss-button`
        appears once; `### Hooks` appears once).
  - OLD TEXT (exact block — the last FormErrorBoundary CSS line, the closing ``` of
        the css fence, the `---`, and the `### Hooks` heading):
        (see "Exact Replacement" §A oldText below)
  - NEW TEXT: the same opening (FormErrorBoundary CSS line + ``` + `---`) + the NEW
        `#### FormStackViewport` block + its own trailing `---` + `### Hooks`
        (see "Exact Replacement" §A newText below).
  - FOLLOW pattern: the existing `#### Breadcrumbs` / `#### FormErrorBoundary`
        entries (heading → description → ```tsx snippet → `**Props:**` → optional `>`
        note → `---`).
  - NAMING: heading `#### FormStackViewport` (exact — matches the export name).
  - GOTCHA: the new entry must END with its own `---` so `### Hooks` keeps a separator
        above it (every component entry is `---`-terminated).
  - GOTCHA: keep the snippet placement-focused; do NOT turn it into the full
        shared-modal walkthrough (that is P1.M2.T2.S1).

Task 2: VALIDATE (no edits — run commands)
  - RUN: grep -c FormStackViewport README.md        → expect >= 1 (the contract gate).
  - RUN: grep -n "^#### FormStackViewport" README.md → expect exactly 1 heading.
  - RUN: grep -n "Props:\*\* None" README.md         → expect a hit inside the new entry.
  - RUN: grep -n "display: none\|display:none" README.md → expect a hit in the new entry's description.
  - RUN: npm run type-check                           → expect exit 0 (no-regression).
  - RUN: npm test                                     → expect all green (no-regression).
  - RUN: npm run build                                → expect success (no-regression).
  - RUN: git status --short                           → expect ONLY README.md modified.
  - If type-check/test/build FAIL: you accidentally edited a source file. Revert
          it (only README.md should change) and re-run.
```

### Exact Replacement

#### §A — Task 1 (insert `#### FormStackViewport` before `### Hooks`)

- `oldText` (the exact current block — verified unique; this is the tail of the
  FormErrorBoundary entry + the `---` + the `### Hooks` heading):

  ````markdown
  .form-error-boundary__dismiss-button
  ```

  ---

  ### Hooks
  ````

- `newText` (preserve the FormErrorBoundary tail + its `---`, then insert the full
  new `#### FormStackViewport` entry ending in its own `---`, then `### Hooks`):

  ````markdown
  .form-error-boundary__dismiss-button
  ```

  ---

  #### FormStackViewport

  Zero-prop placeable viewport that renders the stacked form bodies — the top form
  is visible while parent forms stay mounted but hidden (`display: none`). It reads
  the stack from context, so it takes no props, and renders `null` when the stack is
  empty or when it is used outside a `<FormStackProvider>`.

  ```tsx
  import {
    FormStackProvider,
    FormStackViewport,
    useFormStackState,
  } from 'geoform';

  function App() {
    return (
      <FormStackProvider autoRender={false}>
        <SharedModalHost />
      </FormStackProvider>
    );
  }

  // Render <FormStackViewport/> wherever the stacked form bodies should appear —
  // e.g. the body of a single shared modal that hosts the whole stack:
  function SharedModalHost() {
    const { stack } = useFormStackState();
    return (
      <Dialog open={stack.length > 0}>
        <FormStackViewport />
      </Dialog>
    );
  }
  ```

  **Props:** None. The viewport reads everything it needs from context.

  > **Note:** `<FormStackViewport/>` is only meaningful when the provider is set to
  > `<FormStackProvider autoRender={false}>`. With the default `autoRender={true}`,
  > the provider already renders its own viewport as a sibling of `children`, so
  > mounting an additional `<FormStackViewport/>` would render the stack twice. For
  > the full single-shared-modal pattern, see
  > [Hostable Viewport](#hostable-viewport-single-shared-modal).

  ---

  ### Hooks
  ````

> **Note on the `edit` tool:** the `oldText` block above is verified unique in the
> current `README.md` (`.form-error-boundary__dismiss-button` appears once; `### Hooks`
> appears once). The backticks and fences inside the values are literal — pass them
> as-is. Because the `oldText` includes both the FormErrorBoundary CSS class line AND
> the `### Hooks` heading, it cannot match any other `---` separator in the file.

### Implementation Patterns & Key Details

```markdown
<!-- PATTERN: Component entry (from readme_gap_map.md template (a) + observed
     Breadcrumbs/ConfirmationDialog/FormErrorBoundary entries):
     #### Name
     <one-line / short-paragraph description>
     ```tsx
     <import + usage snippet>
     ```
     **Props:** <table | None>
     (> optional blockquote note)
     ---
     Match this rhythm exactly. -->

<!-- PATTERN: The blockquote note (`> **Note:** ...`) is established house style —
     the FormStackProvider entry uses it for its "Dev-mode guard" note. Reuse the
     same `>` form for the autoRender={false} note. -->

<!-- CRITICAL: The entry prose must match the source (src/components/FormStackViewport.tsx)
     and PRD §10/§10.1 on every fact:
     - zero-prop        (component signature takes no args)
     - renders the stacked form bodies (it renders <FormStackRenderer {...viewport}/>)
     - top form visible; parents mounted but hidden via display:none  (PRD §10)
     - reads the stack from context  (useContext(FormStackViewportContext))
     - renders null when empty or outside a provider  (the `if (!viewport) return null`)
     Source consensus: FormStackViewport.tsx + PRD §10/§10.1. -->

<!-- CRITICAL: The "only meaningful with autoRender={false}" note must explain WHY:
     the default autoRender={true} already renders the provider's own viewport, so a
     second <FormStackViewport/> would double-render. This is the key consumer footgun
     (it also underpins the dev-mode guard documented in the FormStackProvider entry). -->
```

### Integration Points

```yaml
README.md — ### Components section:
  - INSERT: a new `#### FormStackViewport` entry between the `---` that closes
            `#### FormErrorBoundary` and the `### Hooks` heading.
  - PRESERVE: all existing component entries (FormStackProvider, Breadcrumbs,
            ConfirmationDialog, FormErrorBoundary) unchanged.
  - PRESERVE: the `### Hooks` heading and everything below it (the parallel sibling
            P1.M2.T1.S2 edits tables BELOW `### Hooks` — do not touch that region).

CROSS-LINKS:
  - OUTBOUND: `[Hostable Viewport](#hostable-viewport-single-shared-modal)` — reuses
            the anchor slug already referenced at README line 150 (the autoRender
            Props row). It will resolve once P1.M2.T2.S1 creates that heading.
  - INBOUND (later, by other tasks): P1.M2.T2.S1 (Advanced Usage) and P1.M2.T2.S2
            (Common Pitfall) may link TO this entry. Do not create those sections here.

SOURCE FILES: NONE modified (Mode B).
PRD.md / tasks.json / prd_snapshot.md / CHANGELOG.md: NONE modified (read-only).
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
cd /home/dustin/projects/geoform
# The contract gate — FormStackViewport must appear (it already does in S1's prose;
# this adds the dedicated entry).
grep -c FormStackViewport README.md        # EXPECT: >= 1  (rises from 4 to ~6)

# The new heading exists exactly once, in the Components section.
grep -n "^#### FormStackViewport" README.md # EXPECT: exactly 1 hit, located after
                                           #         #### FormErrorBoundary and before
                                           #         ### Hooks.

# The entry carries the required house-style elements.
grep -n "Props:\*\* None" README.md        # EXPECT: a hit inside the new entry.
grep -n "display: none" README.md          # EXPECT: a hit in the new entry's description.

# Confirm the entry is positioned correctly relative to its neighbors.
grep -n "#### FormErrorBoundary\|^#### FormStackViewport\|^### Hooks" README.md
# EXPECT: FormErrorBoundary line < FormStackViewport line < ### Hooks line.
```

### Level 2: Markdown Structure (Component Validation)

```bash
cd /home/dustin/projects/geoform
# The new entry sits cleanly between FormErrorBoundary's --- and ### Hooks, and is
# itself --- terminated.
sed -n '/^#### FormErrorBoundary/,/^### Hooks/p' README.md | grep -nE '^#### |^---$|^### Hooks'
# EXPECT: the FormErrorBoundary heading, a --- (its closer), the FormStackViewport
#         heading, another --- (the new entry's closer), then ### Hooks.

# The tsx snippet inside the new entry is a single fenced block (no broken fences).
awk '/^#### FormStackViewport/{f=1} f{print} /^### Hooks/{exit}' README.md | grep -c '```tsx'
# EXPECT: 1 (exactly one tsx fence opens the snippet).

# The Props statement is present and the autoRender={false} note is present.
awk '/^#### FormStackViewport/{f=1} f{print} /^### Hooks/{exit}' README.md | grep -E 'Props:\*\* None|autoRender=\{false\}'
# EXPECT: both lines present.
```

### Level 3: No-Regression Build/Test (System Validation)

```bash
cd /home/dustin/projects/geoform
# README-only edit CANNOT break these, but running them PROVES no source file was
# accidentally edited. If any of these fail, a src/ file was touched — revert it.
npm run type-check   # EXPECT: exit 0  (tsc --noEmit)
npm test             # EXPECT: all green (vitest run) — no change from prior baseline
npm run build        # EXPECT: success (tsup)
```

### Level 4: Creative & Domain-Specific Validation

```bash
cd /home/dustin/projects/geoform
# Render check: open README.md in a markdown viewer (or GitHub preview) and confirm:
#   - The Components section now lists FormStackViewport after FormErrorBoundary.
#   - The description reads cleanly (top visible, parents display:none, reads from
#     context, renders null when empty).
#   - The tsx snippet renders as one code block (no broken fences).
#   - `**Props:** None` renders as bold "Props:" followed by "None".
#   - The blockquote note renders as a quoted callout.
#   - The `[Hostable Viewport](...)` link uses the same slug as line 150.
# (No automated markdown linter is configured in this repo — visual check only.)

# Scope guard: ONLY README.md changed.
git status --short
# EXPECT: exactly one line: " M README.md". Anything else is a scope violation.

# Scope guard: no source file was modified.
git diff --name-only
# EXPECT: README.md  (and nothing under src/, PRD.md, tasks.json, etc.)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `grep -c FormStackViewport README.md` ≥ 1 (the contract gate).
- [ ] `npm run type-check` exits 0 (no-regression).
- [ ] `npm test` all green (no-regression).
- [ ] `npm run build` succeeds (no-regression).
- [ ] `git status --short` shows ONLY `README.md`.

### Feature Validation

- [ ] A `#### FormStackViewport` heading exists in `### Components`, after
      `#### FormErrorBoundary` and before `### Hooks`.
- [ ] The description states: zero-prop; renders stacked form bodies; top form
      visible with parents hidden via `display: none`; reads stack from context;
      renders `null` when empty or outside a provider.
- [ ] A `tsx` import + placement snippet shows `FormStackProvider
      autoRender={false}` wrapping a host that renders `<FormStackViewport/>`.
- [ ] A literal `**Props:** None` statement is present.
- [ ] A note explains the viewport is only meaningful with `autoRender={false}`
      (default `true` already renders the provider's own viewport → double-render).
- [ ] The entry ends with its own `---` separator.

### Code Quality Validation

- [ ] Entry follows the house-style component-entry template (matches
      Breadcrumbs / ConfirmationDialog / FormErrorBoundary rhythm).
- [ ] The blockquote (`>`) note style matches the FormStackProvider "Dev-mode guard" note.
- [ ] The `[Hostable Viewport](#hostable-viewport-single-shared-modal)` link reuses
      the exact anchor slug already present at README line 150.
- [ ] No sibling-task sections were edited (scope guard — see Known Gotchas).
- [ ] No source files, PRD.md, tasks.json, prd_snapshot.md, or CHANGELOG.md modified.

### Documentation & Deployment

- [ ] The new entry is self-consistent with PRD §10/§10.1 and the source JSDoc.
- [ ] The new entry is consistent with the component's public behavior
      (`src/components/FormStackViewport.tsx`).

---

## Anti-Patterns to Avoid

- ❌ Don't edit any file other than `README.md`. This is Mode B (docs-only). In
  particular don't touch `src/`, `PRD.md`, `tasks.json`, `prd_snapshot.md`, or
  `CHANGELOG.md`.
- ❌ Don't anchor the edit by line number. P1.M2.T1.S1 already shifted
  FormErrorBoundary down from the gap map's "~264" to line 244. Anchor by the
  exact text block (`.form-error-boundary__dismiss-button` ... `---` ...
  `### Hooks`); locate it with `grep -n`.
- ❌ Don't invent props or CSS classes. `FormStackViewport` is zero-prop and has
  no styles of its own. Use `**Props:** None` and skip the Props table and
  `**CSS Classes:**` block.
- ❌ Don't omit the trailing `---`. Every component entry is `---`-terminated;
  without it the new entry runs into `### Hooks`.
- ❌ Don't turn the snippet into the full shared-modal walkthrough
  (Breadcrumbs-as-DialogTitle, `cancelForm` on `Dialog.onClose`, etc.). That is
  P1.M2.T2.S1's Advanced Usage section. Keep this snippet placement-focused.
- ❌ Don't document the `useFormStackViewport` hook Returns table or the
  `FormStackViewportValue` type here — those are P1.M2.T1.S4. A brief mention of
  `useFormStackViewport` as the low-level hook alternative is fine; a full hook
  entry is out of scope.
- ❌ Don't invent a different anchor slug for the Hostable Viewport link. Reuse
  `#hostable-viewport-single-shared-modal` — it is already referenced at README
  line 150 and is the established convention.
- ❌ Don't describe hidden parents as `visibility: hidden` or `opacity: 0`. The
  PRD §10 strategy is `display: none`.
- ❌ Don't forget to state "renders `null` when the stack is empty **or outside a
  provider**" — both conditions trigger the `if (!viewport) return null` guard in
  the source.
- ❌ Don't add a markdown linter or new tooling. None is configured; validation is
  grep + no-regression build/test + visual render check.
- ❌ Don't edit the region below `### Hooks`. The parallel sibling P1.M2.T1.S2
  edits the `useFormStack` / `useFormStackActions` Returns tables and the
  `FormStackActions` type block (all below `### Hooks`). Your single insertion is
  above `### Hooks` — keep it there to avoid any overlap.

---

## Confidence Score

**9.5 / 10** for one-pass success. This is a single, content-anchored Markdown
insertion at a verified-unique text block in `README.md`, with the exact old/new
text specified verbatim above. The component behavior is confirmed against two
independent sources (`src/components/FormStackViewport.tsx` + its JSDoc, and PRD
§10/§10.1), and the export status is confirmed at `src/index.ts:130`. The
house-style template is mirrored from three existing peer entries. The only
residual half-point is the **forward link** to `#hostable-viewport-single-shared-
modal` (created later by P1.M2.T2.S1) — but that exact slug is ALREADY referenced
at README line 150 (landed S1), so reusing it is consistent and low-risk; the link
will resolve once T2.S1 lands. Parallel-execution safety is high: sibling S2's
edits are entirely below `### Hooks`, with zero overlap with this insertion.
