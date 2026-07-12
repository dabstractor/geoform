# PRP — P1.M2.T2.S1: Add Features bullet + `### Hostable Viewport (Single Shared Modal)` Advanced Usage section to README.md

---

## Goal

**Feature Goal**: Close the two narrative-documentation gaps flagged in
`readme_gap_map.md` §3.1 and §3.7. Today the `## Features` list ends at
"Error Boundaries Per Form" with no mention of the hostable viewport, and the
`## Advanced Usage` section ends at `### Custom Breadcrumb Styling` with **no**
subsection documenting the single-shared-modal pattern — even though siblings
P1.M2.T1.S1 (FormStackProvider `autoRender` prop) and P1.M2.T1.S3
(`<FormStackViewport/>` component) already ship cross-links pointing at
`#hostable-viewport-single-shared-modal`, an anchor that **does not yet resolve**.
This task creates that target section and adds the missing Features bullet.

**Deliverable**: **Two content-anchored edits to `README.md`** — (1) one new
bullet appended to the `## Features` list (after "Error Boundaries Per Form");
(2) one new `### Hostable Viewport (Single Shared Modal)` subsection inserted as
the **last** Advanced Usage subsection, immediately before `## Common Pitfalls`.
**No source files are touched** (Mode B — changeset-level docs).

**Success Definition**:
- The `## Features` list gains exactly one new bullet whose bold lead is
  `**Hostable Viewport (Single Shared Modal)**`.
- A `### Hostable Viewport (Single Shared Modal)` heading exists in
  `## Advanced Usage`, positioned after `### Custom Breadcrumb Styling` and
  before `## Common Pitfalls`.
- The new subsection contains: a rationale paragraph; the FULL runnable
  `SharedModalHost` example (faithful to PRD §10.1, with geoform imports added);
  a host-level Escape/backdrop → `cancelForm()` wiring note; the guarantees
  paragraph; and `@see` cross-links to the `autoRender` prop and the Common Pitfall.
- The heading text is **exactly** `### Hostable Viewport (Single Shared Modal)` so
  the slug `#hostable-viewport-single-shared-modal` resolves the existing inbound
  cross-links at README lines 150 and 325.
- `grep -ci 'shared modal' README.md` increments (baseline after S1/S2/S3 = 3);
  `grep -c autoRender README.md` increments (baseline = 6).
- `npm run type-check`, `npm test`, and `npm run build` all stay green (README-only
  edit → no-regression, and proves no source file was touched).
- `git status --short` shows **only** `README.md` modified.

---

## User Persona (if applicable)

**Target User**: A `geoform` consumer evaluating the library from the README who
wants to host the entire form stack inside **one** shared window (e.g. an MUI
`<Dialog/>`) instead of each form opening its own — and needs to understand the
pattern, see a runnable example, and know the guarantees before adopting it.

**Use Case**: The consumer scans `## Features`, sees the "Hostable Viewport
(Single Shared Modal)" bullet, and jumps to the Advanced Usage subsection to copy
the `SharedModalHost` example. They learn: set `autoRender={false}`, place
`<FormStackViewport/>` in the modal body, wire the host's close gesture to
`cancelForm()`, and trust that `openForm()`'s promise contract is unchanged.

**User Journey**: Read Features bullet → click/scroll to the `### Hostable Viewport`
subsection → read the rationale (chrome-less, consumer owns the window) → copy the
`SharedModalHost` example → note the Escape/backdrop → `cancelForm()` wiring → read
the guarantees → follow the `@see` link to the `autoRender` prop for the full prop
table, and to the Common Pitfall to avoid the "forgotten viewport" mistake.

**Pain Points Addressed**: Today the hostable-viewport pattern is **invisible** in
the narrative README. Two existing cross-links (from the `autoRender` prop row and
the `<FormStackViewport/>` note) point at `#hostable-viewport-single-shared-modal`
which **resolves to nothing** — a dead anchor. The consumer who wants the
single-modal UX has no example to reach for in the prose sections.

---

## Why

- **Resolves two dead inbound anchors.** Sibling S1 (line 150: the `autoRender`
  prop row) and sibling S3 (line 325: the `<FormStackViewport/>` note) both link to
  `#hostable-viewport-single-shared-modal`. Until this task creates the
  `### Hostable Viewport (Single Shared Modal)` heading, those links are broken.
  This task is what those links are waiting for.
- **Matches PRD §10.1 in the narrative surface.** PRD §10.1 ("Consumer-Hosted
  Viewport (Single Shared Modal)") is the canonical spec — target UX, the two
  exports, the full `SharedModalHost` example, and the guarantees. The README's
  narrative (Features + Advanced Usage) is the primary consumer-discovery surface;
  the pattern must appear there, not only in the API Reference.
- **Faithful to the design principle: chrome-less renderer.** PRD §10 and §16
  reaffirm geoform "stays chrome-less (no built-in window)". The Advanced Usage
  subsection is where that principle is *explained* to consumers: the library
  renders form bodies; the window chrome is the consumer's job.
- **No behavioral risk.** Pure documentation — one bullet + one Markdown
  subsection. Cannot change runtime behavior, types, or tests.

---

## What

User-visible behavior (of the **docs**): the `## Features` list gains one bullet,
and the `## Advanced Usage` section gains one new `### Hostable Viewport (Single
Shared Modal)` subsection as its **last** subsection, immediately before
`## Common Pitfalls`.

### Scope (EXACT — do only this)

Two content-anchored insertions to `README.md` (see Implementation Blueprint):

1. **Features bullet** — append one bullet after the
   `- **Error Boundaries Per Form** ...` bullet and before the `## Installation`
   heading.

2. **Advanced Usage subsection** — insert a new
   `### Hostable Viewport (Single Shared Modal)` subsection between the closing
   code fence of `### Custom Breadcrumb Styling` and the `## Common Pitfalls`
   heading. The subsection must contain: a rationale paragraph; the FULL runnable
   `SharedModalHost` example (PRD §10.1, adapted with geoform imports); a
   host-level Escape/backdrop → `cancelForm()` wiring note; the guarantees
   paragraph; and `@see` cross-links to the `autoRender` prop
   (`#formstackprovider`) and the new Common Pitfall
   (`#forgetting-formstackviewport-with-autorenderfalse`).

**Do NOT** edit any API Reference entry (those are owned by S1–S4). **Do NOT**
create the Common Pitfall entry itself (that is sibling P1.M2.T2.S2) — only
cross-link to it. **Do NOT** touch any source file (see Scope Guard).

### Success Criteria

- [ ] `## Features` contains a new bullet whose bold lead is exactly
      `**Hostable Viewport (Single Shared Modal)**`, positioned after the
      "Error Boundaries Per Form" bullet and before `## Installation`.
- [ ] A `### Hostable Viewport (Single Shared Modal)` heading exists in
      `## Advanced Usage`, positioned after `### Custom Breadcrumb Styling` and
      before `## Common Pitfalls`. (Heading text is EXACT — controls the slug.)
- [ ] The subsection contains a rationale paragraph stating: one window hosts the
      entire stack; the window chrome is the consumer's job; geoform stays
      chrome-less.
- [ ] The subsection contains the FULL `SharedModalHost` example faithful to PRD
      §10.1: `<FormStackProvider autoRender={false}>` wrapping `<SharedModalHost/>`;
      `useFormStackState().stack`; `useFormStackActions().cancelForm`;
      `<Dialog open={stack.length > 0} onClose={cancelForm}>`;
      `<DialogTitle><Breadcrumbs /></DialogTitle>`;
      `<DialogContent><FormStackViewport /></DialogContent>`.
- [ ] The subsection contains a note that the host's close gesture (Escape /
      backdrop, via MUI `<Dialog>` `onClose`) is wired to `cancelForm()` and that
      one handler covers both.
- [ ] The subsection contains the guarantees paragraph: with `autoRender={false}`
      and exactly one `<FormStackViewport/>`, an open form renders exactly once;
      `openForm()`'s promise contract is unchanged (callers like
      `ExpandingAutocomplete` need no edits).
- [ ] The subsection contains `@see` cross-links to the `autoRender` prop
      (`#formstackprovider`) and the Common Pitfall
      (`#forgetting-formstackviewport-with-autorenderfalse`).
- [ ] `grep -ci 'shared modal' README.md` > 3 (increments past the S1/S2/S3
      baseline).
- [ ] `grep -c autoRender README.md` > 6 (increments past baseline).
- [ ] `npm run type-check`, `npm test`, `npm run build` all green (no-regression).
- [ ] `git status --short` lists **only** `README.md`.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** This is two content-anchored Markdown
insertions at verified-unique text blocks in `README.md`. The exact old-text
blocks, the exact replacement text (both the bullet and the full subsection), the
Advanced Usage house-style to mirror, the canonical PRD §10.1 example, the verified
heading slug, and the exact validation commands are all captured below. No inference
is required.

### Documentation & References

```yaml
# MUST READ — the canonical spec this subsection documents (verbatim example source)
- file: PRD.md
  why: §10.1 "Consumer-Hosted Viewport (Single Shared Modal)" is the authoritative
        source: target UX (one modal hosts the entire stack; opening a child
        replaces the visible body, parent kept mounted-hidden; header becomes
        breadcrumbs; host-level close/Escape/backdrop → cancelForm(); nesting
        unbounded); the FULL SharedModalHost example; and the guarantees paragraph
        ("with autoRender={false} and exactly one <FormStackViewport/>, an open form
        renders exactly once; the promise contract of openForm() is unchanged, so
        callers like ExpandingAutocomplete need no edits").
  section: "§10.1"
  critical: The example block in the PRP's Implementation Blueprint is the PRD §10.1
        example ADAPTED only by adding the geoform import statement — keep the body
        (Dialog open/onClose, DialogTitle>Breadcrumbs, DialogContent>FormStackViewport)
        faithful.

# MUST READ — the design principle the rationale paragraph explains
- file: PRD.md
  why: §10 "Rendering Behavior" states the renderer is "deliberately chrome-less: it
        renders the stacked form bodies only and injects onSubmit/onCancel/onError.
        It intentionally imposes no window." §16 Changelog (0.2.0) reaffirms
        "Non-goals reaffirmed: geoform stays chrome-less (no built-in window)". The
        rationale paragraph paraphrases these.
  section: "§10 Rendering Behavior" + "§16 Changelog 0.2.0"

# MUST READ — the inbound cross-links this section must satisfy
- file: README.md
  why: Lines 150 and 325 already contain `[Hostable Viewport](#hostable-viewport-single-shared-modal)`.
        Line 150 is in the FormStackProvider `autoRender` prop row (sibling S1); line
        325 is in the `<FormStackViewport/>` note (sibling S3). Both are DEAD until
        this task creates the `### Hostable Viewport (Single Shared Modal)` heading.
  pattern: "The heading text is the ONLY control on the slug. GitHub's slugger:
        lowercase → strip () and all non-alnum/space/hyphen → spaces→hyphens. Verified:
        'Hostable Viewport (Single Shared Modal)' → '#hostable-viewport-single-shared-modal'."
  critical: The heading MUST be exactly `### Hostable Viewport (Single Shared Modal)`.
        Do NOT add a colon, em-dash, or reword it — any change breaks the slug and the
        two inbound links. (Verified in research/external_research.md §3.)

# MUST READ — the gap being closed + insertion points + house-style
- file: plan/002_32eb66cd705d/architecture/readme_gap_map.md
  why: §3.1 prescribes the Features bullet; §3.7 (item 7) prescribes the Advanced
        Usage subsection with its exact content checklist (rationale, full PRD §10.1
        example, host-level close → cancelForm note, guarantees paragraph, cross-links
        to autoRender prop + Common Pitfall). The insertion anchor is "before line 664
        (## Common Pitfalls)" — but that line number is STALE (pre-S1/S2/S3); anchor by
        the `## Common Pitfalls` HEADING instead.
  section: "Section-by-Section Insertion Map §1 and §7"
  gotcha: The gap map's "line 16" (Features) and "line 664" (Common Pitfalls) are
        pre-sibling-expansion numbers. README is now 1210 lines. ALWAYS anchor by
        content, never by line number.

# MUST READ — the sibling PRP that defines what exists when this task runs
- file: plan/002_32eb66cd705d/P1M2T1S4/PRP.md
  why: S4 (parallel) adds the `#### useFormStackViewport` hook entry (Hooks section)
        and the `#### FormStackViewportValue` type entry (Types section). Those are
        ABOVE `## Advanced Usage` and do not overlap this task. S4 is the contract for
        "what the Types section ends with" before `## Advanced Usage`.
  critical: This task's insertions are entirely WITHIN `## Features` and
        `## Advanced Usage`. Zero overlap with S4's Hooks/Types insertions or any
        S1/S2/S3 API-Reference edit.

# HOUSE-STYLE MIRROR — Advanced Usage subsection rhythm (no --- separators)
- file: README.md
  why: The existing Advanced Usage subsections (`### URL Sync`, `### Confirmation
        Dialogs`, `### Error Boundaries`, `### Custom Breadcrumb Styling`) flow with
        bare `###` headings and NO `---` separators between them. Each subsection is
        prose → one or more ```tsx / ```css fenced blocks → optional blockquote note.
        Match this rhythm: do NOT add a leading or trailing `---` around the new
        subsection.
  pattern: "### Title\n\n<intro prose>\n\n```tsx\n<example>\n```\n\n<explanatory
        bullets/paragraphs>\n\n> **Note:** ... (optional)\n\n@see [text](#anchor) (optional)"
  gotcha: Verified via `grep -n '^---$\|^### \|^## Common Pitfalls' README.md` in the
        629–790 range: there are NO `---` lines between Advanced Usage subsections.

# HOUSE-STYLE MIRROR — Features bullet rhythm
- file: README.md
  why: Existing bullets use the exact form `- **Bold Lead** - description`. The new
        bullet must match: `- **Hostable Viewport (Single Shared Modal)** - <desc>`.
  pattern: "- **<Title>** - <one-line description>"

# CROSS-LINK TARGET — the autoRender prop (sibling S1, already landed)
- file: README.md
  why: The `#### FormStackProvider` entry (line ~128) now contains the `autoRender`
        props-table row (line 150) which itself links back to this section. The
        `@see` cross-link FROM this subsection should point at the FormStackProvider
        anchor so the reader can jump to the full prop table.
  critical: The FormStackProvider anchor is `#formstackprovider` (verified in use at
        README line ~1065 area; also confirmed by `grep -oE '\]\(#[^)]+\)'`). Use
        `[`autoRender`](#formstackprovider)`.

# CROSS-LINK TARGET (fragile) — the Common Pitfall (sibling P1.M2.T2.S2, Planned)
- file: plan/002_32eb66cd705d/architecture/readme_gap_map.md
  why: §3.8 prescribes S2's heading as `### Forgetting <FormStackViewport/> with
        autoRender={false}`. GitHub slugger yields
        `#forgetting-formstackviewport-with-autorenderfalse` (JSX punctuation
        `<>/{/}/=` is STRIPPED without inserting word boundaries, so `autoRender={false}`
        collapses to the token `autorenderfalse`). Verified in research/external_research.md §3.
  critical: S2 is NOT yet implemented when this PRP runs. The slug is computed from the
        PRESCRIBED heading. If S2 lands a DIFFERENT heading, the implementer MUST
        recompute the slug (see Coordination Note in Implementation Blueprint). A
        temporarily dangling link is acceptable and resolves once S2 lands.

# EXTERNAL — MUI Dialog idiom used in the example
- url: https://mui.com/material-ui/api/dialog/
  why: Confirms `<Dialog open={} onClose={}>` is canonical; `onClose` receives
        (event, reason) where reason is `'escapeKeyDown'` OR `'backdropClick'`, so a
        single handler covers both Escape and backdrop. Ignoring the args
        (`onClose={cancelForm}`) is idiomatic. This justifies the wiring note.
  critical: The example uses `onClose={cancelForm}` — one handler for both gestures.

# EXTERNAL — GitHub heading-slug rules (controls the cross-link slugs)
- url: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
  why: Confirms the slugger: lowercase → strip `()` `<>` `{}` `/` `=` → spaces to
        hyphens. Verified slugs:
          our heading   → #hostable-viewport-single-shared-modal
          S2's heading  → #forgetting-formstackviewport-with-autorenderfalse
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── README.md                              # ← EDIT: 2 content-anchored insertions
│                                             (1 Features bullet; 1 Advanced Usage subsection)
├── PRD.md                                 # READ-ONLY — §10 + §10.1 + §16 source of truth
├── package.json                           # scripts: test=vitest run, type-check=tsc --noEmit, build=tsup
└── plan/002_32eb66cd705d/
    ├── architecture/readme_gap_map.md     # §3.1/§3.7 gaps + insertion map
    ├── P1M2T1S4/PRP.md                    # parallel sibling (Hooks/Types) — no overlap
    └── P1M2T2S1/                          # ← THIS PRP lives here
        └── research/external_research.md  # MUI Dialog + slug rules (this PRP's research)
```

### Desired Codebase tree with files to be changed

```bash
README.md                                  # MODIFIED — 2 content-anchored insertions
                                             (1 new Features bullet; 1 new ### Hostable
                                              Viewport (Single Shared Modal) subsection)
# (no new files; no source files touched)
```

### Known Gotchas of our codebase & Library Quirks

```markdown
<!-- CRITICAL: This is Mode B (documentation-only). The ONLY file you may edit is README.md.
     Do NOT touch any src/ file, PRD.md, tasks.json, prd_snapshot.md, or CHANGELOG.md. -->

<!-- CRITICAL: THE HEADING TEXT CONTROLS THE SLUG. The heading must be EXACTLY
     `### Hostable Viewport (Single Shared Modal)` so the slug is
     `#hostable-viewport-single-shared-modal`. Siblings S1 (line 150) and S3 (line 325)
     already link to that anchor; if you reword the heading, add a colon, or use an
     em-dash, the slug changes and those two links break. Verified in
     research/external_research.md §3. -->

<!-- CRITICAL: ANCHOR BY CONTENT, NOT LINE NUMBER. The gap map cited Features "line 16"
     and "line 664" for Common Pitfalls — both are STALE (pre-S1/S2/S3; README is now
     1210 lines). The Implementation Blueprint's oldText blocks are verified UNIQUE:
         grep -n "don't affect parent forms" README.md     # Features bullet (1 hit)
         grep -n 'color: #999;' README.md                  # CSS close (1 hit)
     Locate with grep; confirm uniqueness before editing. -->

<!-- GOTCHA: Advanced Usage subsections use NO `---` separators between them (verified:
     no `---` lines between lines 629 and 790). Do NOT add a leading/trailing `---`
     around the new subsection — it must flow with bare `###` like its siblings. -->

<!-- GOTCHA: The example is ADAPTED from PRD §10.1 by adding a geoform import statement.
     The body must stay faithful: <FormStackProvider autoRender={false}> wraps
     <SharedModalHost/>; SharedModalHost reads useFormStackState().stack and
     useFormStackActions().cancelForm; <Dialog open={stack.length > 0} onClose={cancelForm}>
     with <DialogTitle><Breadcrumbs /></DialogTitle> and
     <DialogContent><FormStackViewport /></DialogContent>. Do NOT "simplify" away
     cancelForm, Breadcrumbs, or the DialogTitle/DialogContent split — the contract
     (OUTPUT spec #3) requires the PRD §10.1 example verbatim (adapted). -->

<!-- GOTCHA: useFormStackState (returns `stack`) and useFormStackActions (returns
     `cancelForm`) are both documented API-Reference entries (sibling S2, Complete).
     The example's references resolve. Do NOT re-document them here; the subsection is
     NARRATIVE (rationale + example + guarantees), not an API table. -->

<!-- GOTCHA: The Common-Pitfall cross-link slug is FRAGILE. S2 is Planned (not done).
     The slug `#forgetting-formstackviewport-with-autorenderfalse` is computed from the
     gap-map-prescribed heading. See the Coordination Note in Implementation Blueprint:
     verify/recompute against S2's ACTUAL heading when it lands. -->

<!-- GOTCHA: Do NOT create the Common Pitfall entry (that is S2's job). This task only
     CROSS-LINKS to it. Do NOT edit the API Reference (Components/Hooks/Types — owned by
     S1–S4). Your two insertions are: one bullet in ## Features, one subsection in
     ## Advanced Usage. -->

<!-- GOTCHA: The MUI Dialog/DialogTitle/DialogContent in the example are ILLUSTRATIVE
     (geoform has no hard MUI dependency). State this in a one-line note so readers
     don't think MUI is required. The host can be any window primitive. -->

<!-- GOTCHA: Parallel-safety — sibling S4 inserts into ### Hooks and ### Types (above
     ## Advanced Usage). Sibling S2 (later) inserts into ## Common Pitfalls (below your
     anchor). Your two insertions are in ## Features and the END of ## Advanced Usage.
     ZERO overlap with S4 or S2. -->
```

---

## Implementation Blueprint

### Data models and structure

No data models. This is a Markdown documentation edit. The two structured assets
are the **new Features bullet** and the **new Advanced Usage subsection**, both
fixed by the PRD §10.1 contract and the README house-style.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EDIT README.md — append the Features bullet
  - TARGET FILE: README.md
  - LOCATE BY CONTENT (not line number): the last Features bullet
        `- **Error Boundaries Per Form** - Crashes in one form don't affect parent forms`
        immediately followed by a blank line and `## Installation`. Confirm uniqueness:
            grep -n "don't affect parent forms" README.md   # exactly 1 hit
  - OLD TEXT (exact, verified unique): see "Exact Replacements" §A oldText.
  - NEW TEXT: the Error Boundaries bullet + the NEW Hostable Viewport bullet + blank
        line + `## Installation`. See "Exact Replacements" §A newText.
  - FOLLOW pattern: the existing Features bullets (`- **Title** - description`).
  - NAMING: bold lead exactly `**Hostable Viewport (Single Shared Modal)**`.
  - GOTCHA: keep the single blank line between the last bullet and `## Installation`
        (do not add/remove blank lines beyond inserting the new bullet).

Task 2: EDIT README.md — insert the ### Hostable Viewport (Single Shared Modal) subsection
  - TARGET FILE: README.md
  - LOCATE BY CONTENT (not line number): the closing CSS rule + fence of
        `### Custom Breadcrumb Styling`, immediately followed by `## Common Pitfalls`.
        Confirm uniqueness:
            grep -n 'color: #999;' README.md   # exactly 1 hit
  - OLD TEXT (exact, verified unique): see "Exact Replacements" §B oldText.
  - NEW TEXT: the CSS close + fence + blank line + the NEW subsection (heading +
        rationale + example + wiring note + guarantees + @see cross-links) + blank
        line + `## Common Pitfalls`. See "Exact Replacements" §B newText.
  - FOLLOW pattern: the existing Advanced Usage subsections (bare `###` heading,
        prose, fenced ```tsx block, explanatory bullets, optional `> **Note:**`
        blockquote, optional `@see` line). NO `---` separators.
  - NAMING: heading EXACTLY `### Hostable Viewport (Single Shared Modal)`.
  - GOTCHA: the heading text controls the slug — do not alter it.
  - GOTCHA: do NOT add a `---` before or after the subsection.

Task 3: VALIDATE (no edits — run commands)
  - RUN: grep -ci 'shared modal' README.md           → expect > 3 (was 3).
  - RUN: grep -c autoRender README.md                → expect > 6 (was 6).
  - RUN: grep -n '^### Hostable Viewport' README.md  → expect exactly 1 heading.
  - RUN: grep -n 'SharedModalHost' README.md         → expect ≥ 1 (the example).
  - RUN: grep -n '#hostable-viewport-single-shared-modal' README.md → expect ≥ 2
        (the two existing inbound links now resolve to a real heading).
  - RUN: grep -n 'onClose={cancelForm}' README.md    → expect ≥ 1 (the example).
  - RUN: grep -n '#formstackprovider' README.md      → expect ≥ 1 (the @see link).
  - RUN: npm run type-check                          → expect exit 0 (no-regression).
  - RUN: npm test                                    → expect all green (no-regression).
  - RUN: npm run build                               → expect success (no-regression).
  - RUN: git status --short                          → expect ONLY README.md modified.
  - If type-check/test/build FAIL: you edited a source file. Revert it.
```

### Exact Replacements

#### §A — Task 1 (append the Features bullet)

- `oldText` (the exact current block — verified unique; the last Features bullet +
  blank line + `## Installation`):

  ````markdown
  - **Error Boundaries Per Form** - Crashes in one form don't affect parent forms

  ## Installation
  ````

- `newText` (the Error Boundaries bullet + the NEW Hostable Viewport bullet + blank
  line + `## Installation`):

  ````markdown
  - **Error Boundaries Per Form** - Crashes in one form don't affect parent forms
  - **Hostable Viewport (Single Shared Modal)** - Set `autoRender={false}` on `<FormStackProvider/>` and place `<FormStackViewport/>` to host the whole stack in one window (e.g. an MUI `<Dialog/>`); zero migration, defaults to v1 behavior

  ## Installation
  ````

#### §B — Task 2 (insert the `### Hostable Viewport (Single Shared Modal)` subsection)

- `oldText` (the exact current block — verified unique; the closing CSS rule of
  Custom Breadcrumb Styling + its closing fence + blank line + `## Common Pitfalls`):

  ````markdown
    color: #999;
  }
  ```

  ## Common Pitfalls
  ````

- `newText` (preserve the CSS close + fence + blank line, then insert the FULL new
  subsection, then blank line + `## Common Pitfalls`):

  ````markdown
    color: #999;
  }
  ```

  ### Hostable Viewport (Single Shared Modal)

  By default (`autoRender={true}`), `<FormStackProvider/>` renders the stacked form
  bodies itself, as a sibling of its children. For most apps that is exactly right
  and needs zero setup. But when you want **one window to host the entire stack** —
  for example a single modal that stays open while forms push and pop inside it —
  set `autoRender={false}` and render `<FormStackViewport/>` yourself wherever the
  stacked bodies should appear.

  This keeps geoform **chrome-less**: the library renders the form *bodies* and
  injects `onSubmit`/`onCancel`/`onError`, but it never imposes a window. The window
  chrome — the shared modal, its breadcrumb header, and its body slot — is the
  **consumer's** job. You get full control of the surrounding UI without forking the
  renderer.

  ```tsx
  import {
    FormStackProvider,
    FormStackViewport,
    Breadcrumbs,
    useFormStackState,
    useFormStackActions,
  } from 'geoform';

  // Dialog / DialogTitle / DialogContent below are illustrative — e.g. from
  // @mui/material. Any window primitive that gives you an open/onClose + a body
  // slot works; geoform has no hard MUI dependency.
  <FormStackProvider autoRender={false}>
    <SharedModalHost />
  </FormStackProvider>

  function SharedModalHost() {
    const { stack } = useFormStackState();
    const { cancelForm } = useFormStackActions();
    return (
      <Dialog open={stack.length > 0} onClose={cancelForm}>
        <DialogTitle><Breadcrumbs /></DialogTitle>
        <DialogContent><FormStackViewport /></DialogContent>
      </Dialog>
    );
  }
  ```

  A few things to notice in the host above:

  - **One window, unbounded nesting.** Opening a child form replaces the visible body
    (the parent stays mounted but hidden, state preserved); the `<DialogTitle>`
    becomes breadcrumbs; nesting is unbounded (N deep).
  - **Escape / backdrop cancels the top form.** The host's close gesture is wired to
    `cancelForm()`. With MUI's `<Dialog>`, a single `onClose` handler covers both the
    Escape key and the backdrop click — so closing the modal cancels the top form
    (honoring `confirmOnCancel`) while leaving deeper forms intact. The host owns the
    window's close gesture; geoform owns the stack's cancel semantics.
  - **`<FormStackViewport/>` renders nothing when empty.** `Dialog open={stack.length > 0}`
    keeps the window closed until a form is actually open.

  > **Guarantees:** with `autoRender={false}` and exactly one `<FormStackViewport/>`
  > mounted, an open form renders **exactly once** — the renderer is not duplicated.
  > The promise contract of `openForm()` is **unchanged**, so existing callers (e.g.
  > `ExpandingAutocomplete`) need no edits. Mounting more than one
  > `<FormStackViewport/>` while `autoRender={false}` would render the stack multiple
  > times — don't.

  @see the [`autoRender`](#formstackprovider) prop on `<FormStackProvider/>`, and
  [Common Pitfalls > Forgetting `<FormStackViewport/>`](#forgetting-formstackviewport-with-autorenderfalse).

  ## Common Pitfalls
  ````

> **Note on the `edit` tool:** both `oldText` blocks are verified unique in the
> current `README.md` (`"don't affect parent forms"` appears exactly once;
> `color: #999;` appears exactly once). The backticks and fences inside the values
> are literal — pass them as-is. You may issue both edits in a SINGLE `edit()` call
> with two entries in `edits[]` (they are non-overlapping), or as two separate calls.

#### Coordination Note — the Common-Pitfall cross-link slug

The `@see` link
`[Common Pitfalls > Forgetting <FormStackViewport/>](#forgetting-formstackviewport-with-autorenderfalse)`
points at sibling **P1.M2.T2.S2**, which is **Planned** (not yet implemented). The
slug `#forgetting-formstackviewport-with-autorenderfalse` is computed from the
**gap-map-prescribed** heading `### Forgetting <FormStackViewport/> with
autoRender={false}` (GitHub strips `<>{/}/=` without inserting word boundaries, so
`autoRender={false}` → `autorenderfalse`). When implementing:

- **If S2 has already landed** with that exact heading → the slug resolves; no change
  needed.
- **If S2 landed a DIFFERENT heading** → recompute the slug from S2's actual heading
  (lowercase → strip `()<>{}=/` → spaces to hyphens) and update the `@see` anchor.
- **If S2 has NOT yet landed** → the link is temporarily dangling and resolves once
  S2 lands. That is acceptable for docs.

The other cross-link, `[`autoRender`](#formstackprovider)`, is **stable** —
`#formstackprovider` is the long-standing anchor for the `#### FormStackProvider`
heading and is already used elsewhere in the README.

### Implementation Patterns & Key Details

```markdown
<!-- PATTERN: Features bullet (match existing bullets exactly):
     - **<Bold Lead>** - <one-line description>
     The new bullet's bold lead is the SAME phrase as the Advanced Usage heading
     (minus the leading "### "), so the Features bullet and the section title
     reinforce each other. -->

<!-- PATTERN: Advanced Usage subsection (match existing subsections — NO --- separators):
     ### Title

     <intro prose — 1-2 paragraphs>

     ```tsx
     <runnable example>
     ```

     <explanatory bullets or paragraph>

     > **Guarantees:** / **Note:** <blockquote callout>

     @see [<text>](#anchor) <optional>
     Match this rhythm. The subsection ends by flowing directly into the next ##
     heading (## Common Pitfalls) with one blank line — no trailing ---. -->

<!-- CRITICAL: The example body must match PRD §10.1 on every fact:
     - <FormStackProvider autoRender={false}> wraps a host component
     - host reads useFormStackState().stack and useFormStackActions().cancelForm
     - <Dialog open={stack.length > 0} onClose={cancelForm}>
     - <DialogTitle><Breadcrumbs /></DialogTitle>
     - <DialogContent><FormStackViewport /></DialogContent>
     The ONLY adaptation vs PRD §10.1 is adding the geoform import block. Do not
     drop cancelForm, Breadcrumbs, or the DialogTitle/DialogContent split. -->

<!-- CRITICAL: The guarantees paragraph must state BOTH guarantees from PRD §10.1:
     (1) with autoRender={false} and exactly one <FormStackViewport/>, an open form
         renders exactly once;
     (2) the promise contract of openForm() is unchanged (so callers like
         ExpandingAutocomplete need no edits).
     Plus the contrapositive caution: >1 mounted viewport renders the stack N times. -->

<!-- CRITICAL: The wiring note must explain that the host owns the close gesture and
     geoform owns the cancel semantics — and that one MUI onClose handler covers both
     Escape and backdrop. This is the "host-level Escape/backdrop → cancelForm()" note
     from the contract. -->
```

### Integration Points

```yaml
README.md — ## Features:
  - APPEND: one bullet after "Error Boundaries Per Form", before ## Installation.
  - PRESERVE: all existing Features bullets unchanged.

README.md — ## Advanced Usage:
  - INSERT: one new ### Hostable Viewport (Single Shared Modal) subsection as the
            LAST subsection, after ### Custom Breadcrumb Styling and before
            ## Common Pitfalls.
  - PRESERVE: all existing Advanced Usage subsections (URL Sync, Confirmation
            Dialogs, Error Boundaries, Custom Breadcrumb Styling) unchanged.
  - PRESERVE: the ## Common Pitfalls heading and everything below it (the Common
            Pitfall entry itself is added by sibling P1.M2.T2.S2 — do NOT add it here).

CROSS-LINKS:
  - OUTBOUND: the new subsection links to #formstackprovider (stable) and to
            #forgetting-formstackviewport-with-autorenderfalse (S2's entry; see
            Coordination Note).
  - INBOUND (pre-existing, now satisfied): the autoRender prop row (line 150) and
            the <FormStackViewport/> note (line 325) link TO this new heading's slug
            #hostable-viewport-single-shared-modal. Creating the heading resolves them.

SOURCE FILES: NONE modified (Mode B).
PRD.md / tasks.json / prd_snapshot.md / CHANGELOG.md: NONE modified (read-only).
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
cd /home/dustin/projects/geoform
# The contract gates — counts must INCREMENT past the post-S1/S2/S3 baseline.
grep -ci 'shared modal' README.md     # EXPECT: > 3   (baseline was 3; new bullet + section add more)
grep -c  autoRender README.md         # EXPECT: > 6   (baseline was 6; new section adds more)

# The new Features bullet exists exactly once, with the exact bold lead.
grep -n '\*\*Hostable Viewport (Single Shared Modal)\*\*' README.md
# EXPECT: ≥ 2 hits — one in the Features bullet, one as the ### heading.

# The new heading exists exactly once, positioned correctly.
grep -n '^### Hostable Viewport' README.md
# EXPECT: exactly 1 hit, located AFTER ### Custom Breadcrumb Styling and BEFORE ## Common Pitfalls.

# Confirm placement relative to neighbors (by content, not line number).
grep -n '^### Custom Breadcrumb Styling\|^### Hostable Viewport\|^## Common Pitfalls' README.md
# EXPECT: three headings in this order: Custom Breadcrumb Styling < Hostable Viewport < Common Pitfalls.

# The heading slug matches the two existing inbound cross-links (now resolved).
grep -n '#hostable-viewport-single-shared-modal' README.md
# EXPECT: ≥ 3 hits — the 2 pre-existing inbound links (lines ~150, ~325) now point at a real heading.

# The example contains the PRD §10.1 essentials.
grep -n 'onClose={cancelForm}' README.md        # EXPECT: ≥ 1 (the example).
grep -n '<DialogTitle><Breadcrumbs /></DialogTitle>' README.md   # EXPECT: ≥ 1.
grep -n '<DialogContent><FormStackViewport /></DialogContent>' README.md  # EXPECT: ≥ 1.

# The cross-links are present.
grep -n '#formstackprovider' README.md                              # EXPECT: ≥ 1 (the @see link).
grep -n '#forgetting-formstackviewport-with-autorenderfalse' README.md  # EXPECT: ≥ 1 (the @see link).
```

### Level 2: Markdown Structure (Subsection Validation)

```bash
cd /home/dustin/projects/geoform
# The new subsection sits cleanly between Custom Breadcrumb Styling's close and ## Common Pitfalls,
# with NO --- separators (matching the Advanced Usage house-style).
awk '/^### Hostable Viewport/{f=1} f{print} /^## Common Pitfalls/{exit}' README.md \
  | grep -nE '^### |^---$|^## Common Pitfalls'
# EXPECT: the ### Hostable Viewport heading, then ## Common Pitfalls — and NO --- lines.

# The subsection has exactly one tsx fence (the example).
awk '/^### Hostable Viewport/{f=1} f{print} /^## Common Pitfalls/{exit}' README.md \
  | grep -cE '```tsx'
# EXPECT: 1.

# The guarantees blockquote is present.
awk '/^### Hostable Viewport/{f=1} f{print} /^## Common Pitfalls/{exit}' README.md \
  | grep -E '> \*\*Guarantees:'
# EXPECT: 1 hit.

# The rationale paragraph states the chrome-less principle.
awk '/^### Hostable Viewport/{f=1} f{print} /^## Common Pitfalls/{exit}' README.md \
  | grep -iE 'chrome-less|chrome.less|consumer'
# EXPECT: ≥ 1 hit (the rationale).

# The Features bullet is a single bullet line (no broken markdown).
grep -n '^- \*\*Hostable Viewport (Single Shared Modal)\*\*' README.md
# EXPECT: 1 hit (a clean `- **...** -` bullet).
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
# Anchor-resolution check: render README.md in a markdown viewer (or GitHub preview)
# and confirm:
#   - Clicking "[Hostable Viewport](#hostable-viewport-single-shared-modal)" at the
#     FormStackProvider autoRender row (line ~150) AND at the FormStackViewport note
#     (line ~325) now SCROLLS to the new ### Hostable Viewport heading (previously dead).
#   - The new Features bullet renders as one bullet with bold lead.
#   - The example renders as one tsx code block (no broken fences).
#   - The guarantees callout renders as a blockquote.
#   - The @see links render as inline links; #formstackprovider jumps to the
#     #### FormStackProvider heading.
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

- [ ] `grep -ci 'shared modal' README.md` > 3 (increments past baseline).
- [ ] `grep -c autoRender README.md` > 6 (increments past baseline).
- [ ] `npm run type-check` exits 0 (no-regression).
- [ ] `npm test` all green (no-regression).
- [ ] `npm run build` succeeds (no-regression).
- [ ] `git status --short` shows ONLY `README.md`.

### Feature Validation

- [ ] `## Features` has a new bullet with bold lead
      `**Hostable Viewport (Single Shared Modal)**`, after "Error Boundaries Per Form".
- [ ] A `### Hostable Viewport (Single Shared Modal)` heading exists in
      `## Advanced Usage`, after `### Custom Breadcrumb Styling`, before
      `## Common Pitfalls`.
- [ ] The subsection's rationale states: one window hosts the whole stack; chrome is
      the consumer's job; geoform is chrome-less.
- [ ] The subsection's example matches PRD §10.1 (`autoRender={false}`, `SharedModalHost`,
      `useFormStackState().stack`, `useFormStackActions().cancelForm`,
      `<Dialog open={stack.length > 0} onClose={cancelForm}>`,
      `<DialogTitle><Breadcrumbs /></DialogTitle>`,
      `<DialogContent><FormStackViewport /></DialogContent>`).
- [ ] The subsection's wiring note explains Escape/backdrop → `cancelForm()` via one
      `onClose` handler.
- [ ] The subsection's guarantees paragraph states both guarantees (renders exactly
      once; `openForm()` promise unchanged) + the >1-viewport caution.
- [ ] The subsection has `@see` cross-links to `#formstackprovider` and
      `#forgetting-formstackviewport-with-autorenderfalse`.
- [ ] The two pre-existing inbound links (lines ~150, ~325) now resolve to the new
      heading (slug `#hostable-viewport-single-shared-modal`).

### Code Quality Validation

- [ ] The Features bullet matches the `- **Lead** - desc` house style.
- [ ] The subsection matches the Advanced Usage house style (bare `###`, prose, fenced
      `tsx`, bullets, blockquote, `@see`) — NO `---` separators added.
- [ ] No sibling-task sections were edited (API Reference owned by S1–S4; Common
      Pitfall entry owned by S2).
- [ ] No source files, PRD.md, tasks.json, prd_snapshot.md, or CHANGELOG.md modified.

### Documentation & Deployment

- [ ] The subsection is self-consistent with PRD §10 / §10.1 / §16.
- [ ] The example is faithful to PRD §10.1 (adapted only by adding imports).
- [ ] The MUI primitives are flagged as illustrative (no hard MUI dependency implied).
- [ ] The cross-link slug is correct against S2's actual heading (recomputed if needed
      per the Coordination Note).

---

## Anti-Patterns to Avoid

- ❌ Don't edit any file other than `README.md`. This is Mode B (docs-only). In
  particular don't touch `src/`, `PRD.md`, `tasks.json`, `prd_snapshot.md`, or
  `CHANGELOG.md`.
- ❌ Don't alter the heading text. It MUST be exactly
  `### Hostable Viewport (Single Shared Modal)` — the slug
  `#hostable-viewport-single-shared-modal` is hard-referenced by the two existing
  inbound links (lines ~150, ~325). A colon, em-dash, or reword breaks them.
- ❌ Don't anchor edits by line number. The gap map's "line 16" / "line 664" are
  pre-S1/S2/S3 and stale (README is now 1210 lines). Anchor by the exact text
  blocks (`"don't affect parent forms"` and `color: #999;`); locate with `grep -n`.
- ❌ Don't add `---` separators around the new subsection. Advanced Usage subsections
  flow with bare `###` headings (verified: no `---` between lines 629–790).
- ❌ Don't drop pieces of the PRD §10.1 example. `cancelForm`, `Breadcrumbs`, and the
  `DialogTitle`/`DialogContent` split are all required by the contract (OUTPUT spec #3:
  "the PRD §10.1 example verbatim (adapted)"). The only adaptation is adding imports.
- ❌ Don't omit either guarantee. Both "renders exactly once" AND "openForm() promise
  unchanged" must appear (PRD §10.1 + the contract LOGIC spec).
- ❌ Don't create the Common Pitfall entry — that is sibling P1.M2.T2.S2. Only
  cross-link to it.
- ❌ Don't edit the API Reference (Components/Hooks/Types) — owned by S1–S4. Your two
  insertions are in `## Features` and the end of `## Advanced Usage`.
- ❌ Don't imply MUI is a hard dependency. The Dialog/DialogTitle/DialogContent are
  illustrative; state this in a one-line note.
- ❌ Don't add a markdown linter or new tooling. None is configured; validation is
  grep + no-regression build/test + visual anchor-resolution check.
- ❌ Don't leave the Common-Pitfall cross-link slug unverified if S2 has already
  landed with a different heading — recompute per the Coordination Note.

---

## Confidence Score

**9.5 / 10** for one-pass success. This is two content-anchored Markdown insertions
at verified-unique text blocks (`"don't affect parent forms"` and `color: #999;`),
with the exact old/new text specified verbatim above. The canonical example is
copied from PRD §10.1 (the contract's named source) and adapted only by adding the
geoform import block. The heading slug is verified against GitHub's slugger rules
and matches the two pre-existing inbound cross-links (lines ~150, ~325) — so this
task both adds content AND fixes two dead anchors. The Advanced Usage house-style
(no `---` separators, prose → `tsx` fence → bullets → blockquote → `@see`) is
mirrored from existing subsections. The only residual half-point is the
**Common-Pitfall cross-link slug**, which depends on sibling P1.M2.T2.S2's exact
heading (not yet implemented); the Coordination Note handles this with a recompute
rule, and the other cross-link (`#formstackprovider`) is stable. Parallel-execution
safety is high: S4 inserts into Hooks/Types (above `## Advanced Usage`), and S2
will insert into `## Common Pitfalls` (below this task's anchor) — zero overlap.
