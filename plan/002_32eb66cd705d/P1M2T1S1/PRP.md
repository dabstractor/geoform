# PRP — P1.M2.T1.S1: Document `autoRender` prop + dev-mode guard on `FormStackProvider`

---

## Goal

**Feature Goal**: Close the `autoRender` documentation gap flagged in
`readme_gap_map.md` §3.2 (today `grep -c autoRender README.md` returns **0**) by
documenting the `autoRender` prop (default `true`) and the dev-mode
"forgotten-host" guard on the existing `#### FormStackProvider` component entry in
`README.md`, in the repo's house-style (props table + tsx snippet + guard note).

**Deliverable**: A **single edit to `README.md`** — replace the line
`**Props:** None required. Children are rendered normally.` (line **144**) with a
props table containing the `autoRender` row, a short prose line preserving
"Children are rendered normally", a minimal `autoRender={false}` tsx snippet, and a
dev-mode guard note. **No source files are touched** (Mode B — changeset-level docs).

**Success Definition**:
- `grep -c autoRender README.md` is **≥ 1** (the contract's literal gate).
- The `#### FormStackProvider` section documents (a) the `autoRender` prop in a
  house-style props table, (b) the dev-mode forgotten-host guard, and (c) keeps the
  "children rendered normally" information.
- `npm run type-check`, `npm test`, and `npm run build` all stay green (README-only
  edit → no-regression, and proves no source file was accidentally changed).
- `git status --short` shows **only** `README.md` modified.

---

## User Persona (if applicable)

**Target User**: A `geoform` consumer reading `README.md` to learn how to host the
form-stack viewport inside their own window (e.g. a single shared modal).

**Use Case**: The consumer wants the stacked form bodies inside their own modal
chrome, so they set `autoRender={false}` and render `<FormStackViewport/>` themselves.

**User Journey**: Read `#### FormStackProvider` → see the `autoRender` prop table
row → copy the `autoRender={false}` snippet → render `<FormStackViewport/>` in their
modal → (if they forget) the dev-mode guard `console.warn` reminds them.

**Pain Points Addressed**: Today `autoRender` is implemented and shipped
(`FormStackProvider.tsx`) and specified (PRD §5.1) but **invisible in the README** —
a consumer has no way to discover the hostable-viewport feature from the docs.

---

## Why

- **Discoverability of a shipped 0.2.0 feature.** `autoRender` is already exported
  and working (audit bullet 4 PASS). The README is the public face of the library;
  an undocumented prop is effectively a private API. This closes that gap (D2 / Mode B).
- **Prevents the #1 footgun.** The companion narrative section (P1.M2.T2.S1) and
  Common Pitfall (P1.M2.T2.S2) will both hinge on `autoRender={false}`; documenting
  the prop here is the prerequisite anchor those sections cross-link to.
- **No behavioral risk.** This is pure documentation — Markdown text. It cannot
  change runtime behavior, types, or tests.

---

## What

User-visible behavior (of the **docs**): the `#### FormStackProvider` entry gains a
`**Props:**` table whose key row is `autoRender` (`boolean`, default `true`,
describing true = provider renders the viewport as a sibling of `children`
(v1 behavior; zero migration), false = provider renders no viewport → host it
yourself via `<FormStackViewport/>`; the `<ConfirmationDialog/>` is always rendered).
A minimal `autoRender={false}` tsx snippet and a dev-mode guard note (warns ≤ once
per forgotten-host episode when `autoRender={false}` + an open form + no mounted
`<FormStackViewport/>`; resets once a viewport mounts or the stack clears) follow.
The "children rendered normally" information is preserved.

### Scope (EXACT — do only this)

1. **`README.md` line 144 only** — replace the single line
   `**Props:** None required. Children are rendered normally.` with the structured
   block specified in the Implementation Blueprint below.
2. **Do NOT** create or edit any other section (see Scope Guard). The cross-link to
   the Hostable Viewport section is a **forward-link** to an expected anchor that a
   later task (P1.M2.T2.S1) will create.

### Success Criteria

- [ ] `grep -c autoRender README.md` ≥ 1.
- [ ] `grep -n 'autoRender' README.md` shows the `autoRender` row inside the
      `#### FormStackProvider` block (between line 128 and the `---` at line 146).
- [ ] A props table with header `| Prop | Type | Default | Description |` exists in
      the FormStackProvider entry.
- [ ] A dev-mode guard note is present in the FormStackProvider entry.
- [ ] A minimal `autoRender={false}` tsx snippet is present in the entry.
- [ ] The phrase "rendered normally" (re: children) is retained.
- [ ] `npm run type-check`, `npm test`, `npm run build` all green (no-regression).
- [ ] `git status --short` lists **only** `README.md`.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** This is a one-line-into-a-block Markdown edit
to a named location (README line 144). The exact replacement text, the house-style
table format to mirror, the verified autoRender semantics, and the exact validation
commands are all captured below. No inference is required.

### Documentation & References

```yaml
# MUST READ — the authoritative prop semantics + default + JSDoc to paraphrase
- file: src/components/FormStackProvider.tsx
  why: Defines FormStackProviderProps.autoRender (default true), renders the viewport
        as a sibling of children when true ({autoRender && <FormStackViewport/>}),
        and contains the dev-mode forgotten-host useEffect guard with the exact
        console.warn text to paraphrase.
  pattern: The JSDoc on autoRender already states the true/false semantics and that
        <ConfirmationDialog/> is always rendered — mirror this wording in the table
        description column.
  critical: The guard fires ONLY in dev (process.env.NODE_ENV === 'development') and
        at MOST ONCE per forgotten-host episode; resets when a viewport mounts or the
        stack clears. The README note must say "at most once" and "resets".

# MUST READ — the gap being closed + insertion point + house-style templates
- file: plan/002_32eb66cd705d/architecture/readme_gap_map.md
  why: §3.2 says autoRender is MISSING (0 grep hits) and prescribes "Expand **Props:**
        at line 144" into a props table with the autoRender row + dev guard note +
        short tsx snippet, keeping "children rendered normally". Also gives the
        House-Style Templates (a)/(b) to match exactly.
  section: "Section-by-Section Insertion Map §2" and "House-Style Templates"

# MUST READ — the authoritative spec this documents
- file: PRD.md
  why: §5.1 / the autoRender subsection (h4.0) define the canonical true/false
        semantics and the dev-mode guard. "See §10.1" cross-references the
        consumer-hosted viewport pattern.
  section: §5.1 FormStackProvider, autoRender (h4.0), §10.1 (cross-ref target)
  critical: PRD says false = "provider renders NO viewport; consumer renders
        <FormStackViewport/>; <ConfirmationDialog/> still rendered." Match this.

# MUST READ — the dev-guard audit verdict (D1 bullet 4) to paraphrase accurately
- file: plan/002_32eb66cd705d/architecture/audit_findings.md
  why: Bullet 4 documents the verified behavior: warnedForgottenHostRef gates the
        warning; warns ≤ once per episode; resets when viewport mounts / stack clears.
  section: "D1 Conformance Bullets — bullet 4"

# HOUSE-STYLE MIRROR — a peer component entry that uses a Props table
- file: README.md
  why: The ConfirmationDialog entry (#### ConfirmationDialog, ~lines 199-209) and
        Breadcrumbs entry (~lines 154) show the exact Props-table format to match:
        `**Props:`\n\n`| Prop | Type | Default | Description |` + rows.
  pattern: Copy the table header and column widths style from ConfirmationDialog.
  gotcha: The existing FormStackProvider entry already has a default import+usage
        tsx block (lines 132-142). Keep it. The NEW autoRender={false} snippet goes
        AFTER the props table, inside the same component entry (before the `---`).

# EXACT EDIT TARGET — the one line to replace
- file: README.md
  why: Line 144 is `**Props:** None required. Children are rendered normally.`
        Replace it with the structured block (see Implementation Blueprint).
  gotcha: Do NOT change lines 128-143 (heading/desc/import snippet) or the `---`
        at line 146. Only line 144's content expands.

# HOUSE-STYLE MIRROR — a peer component entry with a prose note + table
- file: README.md
  why: Breadcrumbs entry (~148-184) shows: desc → tsx → `**Props:**` → table →
        `**CSS Classes:**` → `**Returns:**` → `---`. This confirms multiple labeled
        blocks can sit inside one component entry, so adding a tsx snippet + a
        blockquote guard note after the table is house-style-consistent.
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── README.md                       # ← EDIT: line 144 (#### FormStackProvider **Props:**)
├── PRD.md                          # READ-ONLY — §5.1 / autoRender (h4.0) source of truth
├── package.json                    # scripts: test=vitest run, type-check=tsc --noEmit, build=tsup
├── src/
│   ├── components/
│   │   └── FormStackProvider.tsx   # READ-ONLY — autoRender prop + dev guard (source of semantics)
│   └── index.ts                    # (no change)
└── plan/002_32eb66cd705d/
    ├── architecture/
    │   ├── readme_gap_map.md       # §3.2 gap + insertion map + house-style templates
    │   └── audit_findings.md       # bullet 4 dev-guard verdict
    └── P1M2T1S1/                   # ← THIS PRP lives here
```

### Desired Codebase tree with files to be changed

```bash
README.md                           # MODIFIED — one line (144) expands into a props table + tsx snippet + guard note
# (no new files; no source files touched)
```

### Known Gotchas of our codebase & Library Quirks

```markdown
<!-- CRITICAL: This is Mode B (documentation-only). The ONLY file you may edit is README.md.
     Do NOT touch any src/ file, PRD.md, tasks.json, prd_snapshot.md, or CHANGELOG.md. -->

<!-- CRITICAL: Scope guard. Other README sections are owned by sibling subtasks.
     Touch ONLY the #### FormStackProvider **Props:** area (line 144). Do NOT edit:
       - useFormStack / useFormStackActions Returns tables  → P1.M2.T1.S2
       - FormStackActions type block                       → P1.M2.T1.S2
       - #### FormStackViewport component entry            → P1.M2.T1.S3
       - useFormStackViewport hook / FormStackViewportValue type → P1.M2.T1.S4
       - "Hostable Viewport (Single Shared Modal)" section → P1.M2.T2.S1
       - "Forgetting <FormStackViewport/>" Common Pitfall  → P1.M2.T2.S2 -->

<!-- GOTCHA: The cross-link to #hostable-viewport-single-shared-modal is a FORWARD-LINK.
     That section (P1.M2.T2.S1) does not exist yet. The anchor will resolve once that
     task lands. Do NOT create the section yourself (out of scope). It is acceptable
     that the link is temporarily unresolvable — it is the agreed handoff point. -->

<!-- GOTCHA: The dev guard is DEV-ONLY and AT-MOST-ONCE-PER-EPISODE. Say both in the note.
     It also RESETS once a viewport mounts or the stack clears. Source:
     FormStackProvider.tsx warnedForgottenHostRef + useEffect. Do not imply it fires in
     production or every render. -->

<!-- GOTCHA: <ConfirmationDialog/> is ALWAYS rendered regardless of autoRender (it is
     not gated by autoRender in the JSX). The table description must state this so
     consumers don't think autoRender={false} disables cancellation confirmation. -->

<!-- GOTCHA: README is GitHub-flavored markdown. Anchor for a future
     "### Hostable Viewport (Single Shared Modal)" heading is
     #hostable-viewport-single-shared-modal (lowercase, spaces→hyphens, parens stripped).
     Anchor for a future "### Forgetting <FormStackViewport/> with autoRender={false}"
     heading is #forgetting-formstackviewport-with-autorenderfalse (strip '<' '>' '/'). -->
```

---

## Implementation Blueprint

### Data models and structure

No data models. This is a Markdown documentation edit. The single structured asset
is the **props table row** whose content is fixed by the source semantics:

```markdown
| `autoRender` | `boolean` | `true` | When `true` (default), the provider renders the form-stack viewport itself, as a sibling of `children` (v1 behavior; zero migration). When `false`, the provider renders **no** viewport — host it yourself by rendering `<FormStackViewport/>` where you want the stacked form bodies (e.g. inside a single shared modal). The `<ConfirmationDialog/>` is always rendered regardless. See [Hostable Viewport](#hostable-viewport-single-shared-modal). |
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EDIT README.md — expand the FormStackProvider **Props:** area (line 144)
  - TARGET FILE: README.md
  - OLD TEXT (the exact single line at line 144, including the leading "**Props:** "):
        **Props:** None required. Children are rendered normally.
  - NEW TEXT (the full replacement block — see "Exact Replacement" below). It contains:
      (a) a "Children are rendered normally" prose line (preserves the original info),
      (b) a **Props:** props table with one row: autoRender (boolean, true, ...),
      (c) a minimal autoRender={false} tsx snippet,
      (d) a blockquote dev-mode guard note,
      (e) a forward cross-link to #hostable-viewport-single-shared-modal.
  - KEEP: lines 128-143 (heading, one-line desc, existing default import+usage snippet)
          and the `---` at line 146.
  - FOLLOW pattern: README ConfirmationDialog entry (~lines 199-209) for the Props
          table format; Breadcrumbs entry (~148-184) for multiple labeled blocks
          inside one component entry.
  - NAMING: prop key `autoRender` (exact, camelCase — matches source/PRD). Type
          column: `boolean`. Default column: `true`.
  - GOTCHA: do NOT add rows for other symbols (FormStackViewport, cancelForm, etc.) —
          those belong to sibling subtasks. Only the autoRender row + children prose.
  - GOTCHA: the forward-link anchor must be #hostable-viewport-single-shared-modal.

Task 2: VALIDATE (no edits — run commands)
  - RUN: grep -c autoRender README.md            → expect ≥ 1 (the contract gate).
  - RUN: grep -n autoRender README.md            → confirm hits are inside the
          #### FormStackProvider block (between line 128 and the --- at line 146).
  - RUN: npm run type-check                       → expect exit 0 (no-regression).
  - RUN: npm test                                 → expect all green (no-regression).
  - RUN: npm run build                            → expect success (no-regression).
  - RUN: git status --short                       → expect ONLY README.md modified.
  - If type-check/test/build FAIL: you accidentally edited a source file. Revert
          it (only README.md should change) and re-run.
```

### Exact Replacement (Task 1)

Use the `edit` tool with:

- `oldText` = the exact current line 144:
  ```
  **Props:** None required. Children are rendered normally.
  ```

- `newText` = the block below (note: inner code fences are 3-backtick ```tsx blocks;
  the whole block is what replaces the single line — do not wrap it in extra fences):

  ~~~markdown
  Children are rendered normally — the provider adds no wrapper DOM around them. The optional `autoRender` prop controls who renders the stacked form bodies:

  **Props:**

  | Prop | Type | Default | Description |
  |------|------|---------|-------------|
  | `autoRender` | `boolean` | `true` | When `true` (default), the provider renders the form-stack viewport itself, as a sibling of `children` (v1 behavior; zero migration). When `false`, the provider renders **no** viewport — host it yourself by rendering `<FormStackViewport/>` where you want the stacked form bodies (e.g. inside a single shared modal). The `<ConfirmationDialog/>` is always rendered regardless. See [Hostable Viewport](#hostable-viewport-single-shared-modal). |

  ```tsx
  import { FormStackProvider, FormStackViewport } from 'geoform';

  // Host the viewport yourself (e.g. inside one shared modal):
  <FormStackProvider autoRender={false}>
    {app}
    {/* render <FormStackViewport/> somewhere in your host UI */}
  </FormStackProvider>
  ```

  > **Dev-mode guard:** When `autoRender={false}`, a form is open, and no `<FormStackViewport/>` has mounted, the provider logs a `console.warn` at most once per "forgotten host" episode (development only; the warning resets once a viewport mounts or the stack clears).
  ~~~

> **Note on the `edit` tool:** the `oldText` (`**Props:** None required. Children are rendered normally.`) is a single line and is unique in `README.md` (verified — it only appears in the FormStackProvider entry), so it is a safe exact match. The `newText` contains a 3-backtick ```tsx fence; pass it as-is to the tool (the tool takes raw text, so backticks inside the value are fine).

### Implementation Patterns & Key Details

```markdown
<!-- PATTERN: house-style component entry (from readme_gap_map.md template (a)):
     #### Name → one-line desc → ```tsx import+usage → **Props:** → ... → ---
     The FormStackProvider entry ALREADY has: heading(128), desc(130), default
     import+usage(132-142). We are only expanding the **Props:** line(144) into
     a richer labeled block. Everything else stays put. -->

<!-- PATTERN: props table (from ConfirmationDialog README ~199-209):
     **Props:**
     (blank line)
     | Prop | Type | Default | Description |
     |------|------|---------|-------------|
     | `name` | `type` | `default-or-required` | description |
     Use the SAME column order and backtick-each-cell style. -->

<!-- PATTERN: blockquote note. The repo's Common Pitfalls section uses ">" blockquotes
     for emphasis; using a ">" guard note here is consistent and visually clear. -->

<!-- CRITICAL: the autoRender description MUST include:
     - true = provider renders viewport as sibling of children (v1 behavior; zero migration)
     - false = provider renders NO viewport; you host via <FormStackViewport/>
     - <ConfirmationDialog/> is ALWAYS rendered regardless
     - "at most once per forgotten-host episode" (dev only; resets on mount/clear)
     These four facts are the ones the audit + PRD + source agree on. -->
```

### Integration Points

```yaml
README.md (#### FormStackProvider block, line 144):
  - EXPAND: single "**Props:** None required..." line → props table + snippet + note.
  - PRESERVE: heading (128), desc (130), default usage snippet (132-142), trailing --- (146).

CROSS-LINKS (forward — resolve when sibling tasks land):
  - #hostable-viewport-single-shared-modal  → P1.M2.T2.S1 (Hostable Viewport section)
  - (optional) the dev note may also link to the future Common Pitfall
    #forgetting-formstackviewport-with-autorenderfalse → P1.M2.T2.S2. Including this
    link is recommended but optional; omit if unsure of the final heading wording.

SOURCE FILES: NONE modified (Mode B).
PRD.md / tasks.json / prd_snapshot.md / CHANGELOG.md: NONE modified (read-only).
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
cd /home/dustin/projects/geoform
# Confirm the edit landed and autoRender is now documented.
grep -c autoRender README.md        # EXPECT: >= 1  (was 0)
grep -n autoRender README.md        # EXPECT: hits inside #### FormStackProvider (128..146)

# Sanity-check the props-table header was added in the right block.
grep -n "^| Prop | Type | Default" README.md   # EXPECT: a hit; confirm one is near line 144
```

### Level 2: Markdown Structure (Component Validation)

```bash
cd /home/dustin/projects/geoform
# Confirm the FormStackProvider block still starts and ends correctly.
sed -n '128,150p' README.md
# EXPECT: 128 "#### FormStackProvider", default usage tsx, the NEW **Props:** table +
#         autoRender snippet + guard note, then "---" before "#### Breadcrumbs".

# Confirm the forward-link anchor is present (will resolve once P1.M2.T2.S1 lands).
grep -n "hostable-viewport-single-shared-modal" README.md   # EXPECT: >= 1

# Confirm children-rendered-normally info is retained.
grep -n "rendered normally" README.md                       # EXPECT: >= 1

# Confirm the dev guard note is present and says "at most once".
grep -n "Dev-mode guard" README.md                          # EXPECT: >= 1
grep -n "at most once" README.md                            # EXPECT: >= 1
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
#   - The props table renders with 4 columns (Prop | Type | Default | Description).
#   - The autoRender={false} tsx snippet renders as a code block.
#   - The blockquote guard note renders as a callout.
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

- [ ] `grep -c autoRender README.md` ≥ 1 (the contract gate).
- [ ] `npm run type-check` exits 0 (no-regression).
- [ ] `npm test` all green (no-regression).
- [ ] `npm run build` succeeds (no-regression).
- [ ] `git status --short` shows ONLY `README.md`.

### Feature Validation

- [ ] The `#### FormStackProvider` entry has a `**Props:**` table with an `autoRender` row.
- [ ] The `autoRender` description states true=default/v1-behavior and false=host-it-yourself.
- [ ] The description notes `<ConfirmationDialog/>` is always rendered.
- [ ] A dev-mode guard note is present and says "at most once" + "development only" + resets.
- [ ] A minimal `autoRender={false}` tsx snippet is present.
- [ ] "rendered normally" (re: children) is retained.
- [ ] A forward cross-link to `#hostable-viewport-single-shared-modal` is present.

### Code Quality Validation

- [ ] Props table column order/style matches ConfirmationDialog/Breadcrumbs entries.
- [ ] Entry structure follows the house-style component-entry template.
- [ ] No sibling-task sections were edited (scope guard — see Known Gotchas).
- [ ] No source files, PRD.md, tasks.json, prd_snapshot.md, or CHANGELOG.md modified.

### Documentation & Deployment

- [ ] The new content is self-consistent with PRD §5.1 (h4.0) and the source JSDoc.
- [ ] The forward-link anchor will resolve when P1.M2.T2.S1 lands (handoff agreed).

---

## Anti-Patterns to Avoid

- ❌ Don't edit any file other than `README.md`. This is Mode B (docs-only). In particular
  don't touch `src/`, `PRD.md`, `tasks.json`, `prd_snapshot.md`, or `CHANGELOG.md`.
- ❌ Don't edit sibling-task README sections. The Returns tables, `FormStackActions` type
  block, `FormStackViewport`, `useFormStackViewport`, `FormStackViewportValue`, the
  Hostable Viewport section, and the Common Pitfall are owned by P1.M2.T1.S2/S3/S4 and
  P1.M2.T2.S1/S2. Touch ONLY the `#### FormStackProvider` `**Props:**` area.
- ❌ Don't create the Hostable Viewport section yourself. The cross-link is a forward-link;
  creating the section is out of scope and would collide with P1.M2.T2.S1.
- ❌ Don't imply the dev guard fires in production or on every render. It is dev-only and
  at-most-once-per-forgotten-host-episode (resets on mount/clear). Say so exactly.
- ❌ Don't drop the "children rendered normally" information — the contract requires it be kept.
- ❌ Don't say `autoRender={false}` disables `<ConfirmationDialog/>`. It doesn't — only the
  form viewport is affected. The dialog is always rendered.
- ❌ Don't invent a different anchor for the Hostable Viewport cross-link. Use the agreed
  `#hostable-viewport-single-shared-modal` (from the gap-map heading outline).
- ❌ Don't add a markdown linter or new tooling. None is configured; validation is grep +
  no-regression build/test + visual render check.

---

## Confidence Score

**9.5 / 10** for one-pass success. This is a single-line Markdown expansion at a named,
verified location (README line 144) into a block whose exact content is specified
verbatim above, following house-style patterns pulled from peer entries
(ConfirmationDialog, Breadcrumbs). The autoRender semantics, dev-guard behavior, and
exact warning wording are all confirmed against `FormStackProvider.tsx`, PRD §5.1, the
audit findings, and the gap map. The only residual half-point is the forward cross-link
anchor (`#hostable-viewport-single-shared-modal`), which is intentionally unresolved until
P1.M2.T2.S1 lands — that is by design, not a defect, and the PRP flags it explicitly so
the implementer doesn't "fix" it by creating the section out of scope.
