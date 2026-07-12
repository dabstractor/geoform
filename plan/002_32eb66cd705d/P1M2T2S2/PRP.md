# PRP — P1.M2.T2.S2: Add `### Forgetting <FormStackViewport/> with autoRender={false}` Common Pitfall to README.md

---

## Goal

**Feature Goal**: Close the last 0.2.0 narrative-documentation gap in
`README.md`'s `## Common Pitfalls` section. Today there is **no** pitfall for the
"forgotten host" mistake — the single most likely footgun of the hostable-viewport
feature. With `<FormStackProvider autoRender={false}>`, forgetting to mount
`<FormStackViewport/>` makes an open form render **nowhere** (the form is on the
stack, its `openForm()` Promise stays pending, and nothing is visible). This task
adds the missing pitfall so consumers are warned, following the existing
BAD/GOOD/Why house template, and completes the cross-link cycle started by sibling
S1 (whose Hostable Viewport subsection links TO this pitfall's slug).

**Deliverable**: **One content-anchored insertion to `README.md`** — a new
`### Forgetting <FormStackViewport/> with autoRender={false}` subsection appended
as the **last** Common Pitfall, immediately before the `## TypeScript` heading.
**No source files are touched** (Mode B — changeset-level docs).

**Success Definition**:
- A `### Forgetting <FormStackViewport/> with autoRender={false}` heading exists
  in `## Common Pitfalls`, positioned **after** the last existing pitfall
  ("Not Handling Async Form Submission Properly") and **before** `## TypeScript`.
- The heading text is **exactly** that string so the slug is
  `#forgetting-formstackviewport-with-autorenderfalse` — which resolves the
  **inbound cross-link** that sibling S1 already wrote (README ~line 855).
- The pitfall follows the house BAD/GOOD/Why template: `**Problem**` →
  `**❌ BAD**` (tsx) → `**✅ GOOD**` (tsx) → `**Why it's problematic**` → optional
  Note blockquote → `@see` line. Matches the rhythm of the six existing pitfalls.
- The pitfall explains the **dev-only** nature of the guard (dev warns once per
  episode; production is silent), so users don't rely on the warning shipping.
- `@see` cross-links point to `#formstackviewport` (component entry) and
  `#hostable-viewport-single-shared-modal` (S1's subsection) — both verified to
  resolve.
- `grep -c 'autoRender={false}' README.md` ≥ 2 (contract OUTPUT spec #4; currently
  9 post-S1, this edit adds more — easily met).
- `npm run type-check`, `npm test`, `npm run build` all stay green (README-only
  edit → no-regression, and proves no source file was touched).
- `git status --short` shows **only** `README.md` modified.

---

## User Persona (if applicable)

**Target User**: A `geoform` consumer who adopted the hostable viewport
(`autoRender={false}`) to host the whole form stack in one window — and forgot to
mount `<FormStackViewport/>`. In dev they may see a one-time `console.warn`; in
production the form is silently invisible.

**Use Case**: The consumer scans `## Common Pitfalls` (or follows the
`@see` cross-link from the Hostable Viewport Advanced Usage subsection) and lands
on this entry. They see the BAD shape (provider with `autoRender={false}`, no
viewport), recognize their bug, copy the GOOD shape (mount exactly one
`<FormStackViewport/>`), and learn WHY the dev guard exists but must not be relied
upon in production.

**User Journey**: (from S1 subsection) read Hostable Viewport example → follow
`@see` link "Common Pitfalls > Forgetting `<FormStackViewport/>`" → read Problem →
compare BAD vs GOOD → read Why (intentional chrome-less provider renders no
viewport) → read Note (dev-only guard, silent in prod) → follow `@see` to the
FormStackViewport component entry / back to the Hostable Viewport section.

**Pain Points Addressed**: The "form opens but nothing appears" failure mode is
invisible and silent in production. Without this pitfall, a consumer has only the
dev-only `console.warn` (which never fires in production builds) to diagnose it.
The pitfall makes the mistake discoverable in the docs and gives the one-line fix.

---

## Why

- **Resolves a dead inbound cross-link.** Sibling S1's `### Hostable Viewport
  (Single Shared Modal)` subsection (README ~line 855) ends with
  `[Common Pitfalls > Forgetting <FormStackViewport/>](#forgetting-formstackviewport-with-autorenderfalse)`.
  Until this task creates that heading, the link is **dead**. This task is what
  that link is waiting for.
- **Matches the canonical dev-guard behavior.** The implementation
  (`src/components/FormStackProvider.tsx`, audit bullet 4) ships a dev-only
  forgotten-host guard. The README's Common Pitfalls section — the primary
  "don't do this" surface — had no entry for the exact mistake the guard exists to
  catch. The gap map §3.8 flags this as the one remaining Common-Pitfalls gap.
- **Faithful to the design principle: chrome-less renderer.** `autoRender={false}`
  means the provider intentionally renders **no** viewport (PRD §10/§10.1). The
  pitfall explains the *consequence* of that design choice for consumers who opt
  into it — and why mounting exactly one `<FormStackViewport/>` is the contract.
- **No behavioral risk.** Pure documentation — one Markdown subsection. Cannot
  change runtime behavior, types, or tests.

---

## What

User-visible behavior (of the **docs**): the `## Common Pitfalls` section gains
one new `### Forgetting <FormStackViewport/> with autoRender={false}` subsection
as its **last** pitfall, immediately before the `## TypeScript` heading.

### Scope (EXACT — do only this)

One content-anchored insertion to `README.md` (see Implementation Blueprint):

1. **New Common Pitfall** — insert a new
   `### Forgetting <FormStackViewport/> with autoRender={false}` subsection
   between the **last** existing pitfall's `@see` line
   (`@see [Core Concepts > Promise-Based API]... and [API Reference > useFormStack]...`)
   and the `## TypeScript` heading. The subsection must contain: a `**Problem**`
   line; a `**❌ BAD**` tsx block (provider with `autoRender={false}`, no
   `<FormStackViewport/>`); a `**✅ GOOD**` tsx block (mount exactly one
   `<FormStackViewport/>` in a host); a `**Why it's problematic**` paragraph; a
   `> **Note**` blockquote on the dev-only guard; and an `@see` line cross-linking
   to `#formstackviewport` and `#hostable-viewport-single-shared-modal`.

**Do NOT** edit any API Reference entry, Advanced Usage subsection, or Features
bullet (those are owned by S1–S4). **Do NOT** touch any source file (see Scope
Guard). **Do NOT** alter any existing pitfall.

### Success Criteria

- [ ] A `### Forgetting <FormStackViewport/> with autoRender={false}` heading
      exists in `## Common Pitfalls`, positioned **after** "Not Handling Async
      Form Submission Properly" and **before** `## TypeScript`. (Heading text is
      EXACT — controls the slug.)
- [ ] The pitfall's first labelled block is `**Problem**:` stating that
      `autoRender={false}` renders no viewport and a forgotten host makes an open
      form render nowhere.
- [ ] The `**❌ BAD**` tsx block shows `<FormStackProvider autoRender={false}>`
      with NO `<FormStackViewport/>` mounted.
- [ ] The `**✅ GOOD**` tsx block shows mounting exactly ONE `<FormStackViewport/>`
      inside a host (e.g. a `<Dialog>` with `useFormStackState().stack`).
- [ ] The `**Why it's problematic**` paragraph explains the provider renders no
      viewport (still provides context + `<ConfirmationDialog/>`), so `openForm()`
      succeeds but nothing appears.
- [ ] The `> **Note**` blockquote states the guard fires at most once per
      "forgotten host" episode, **dev-only**, resets when a viewport mounts or the
      stack clears, and is silent in production.
- [ ] The `@see` line cross-links to `#formstackviewport` AND
      `#hostable-viewport-single-shared-modal`.
- [ ] `grep -c 'autoRender={false}' README.md` ≥ 2 (contract OUTPUT spec #4).
- [ ] `grep -n '#forgetting-formstackviewport-with-autorenderfalse' README.md`
      ≥ 2 (S1's inbound link + the now-real heading resolves it).
- [ ] `npm run type-check`, `npm test`, `npm run build` all green (no-regression).
- [ ] `git status --short` lists **only** `README.md`.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** This is one content-anchored Markdown
insertion at a verified-unique text boundary in `README.md`. The exact old-text
block, the exact replacement text (the full pitfall), the house-style template to
mirror (extracted from the six existing pitfalls), the verified heading slug, the
verified `@see` anchor targets, the dev-guard facts (quoted from source), and the
exact validation commands are all captured below. No inference is required.

### Documentation & References

```yaml
# MUST READ — the canonical spec this pitfall documents
- file: PRD.md
  why: §10 "Rendering Behavior" (provider is chrome-less, renders no window) and
        §10.1 "Consumer-Hosted Viewport (Single Shared Modal)" (autoRender={false}
        → provider renders NO viewport; consumer renders <FormStackViewport/>;
        dev-mode guard warns when autoRender={false}, a form is open, and no
        viewport has mounted). §5.1 documents the autoRender prop + dev guard.
  section: "§10 + §10.1 + §5.1 (autoRender)"
  critical: The pitfall's Problem/Why must reflect that autoRender={false} renders
        no viewport but STILL provides state/actions context + ConfirmationDialog.
        The Note must reflect the dev-only, at-most-once-per-episode, resets-on-
        mount-or-clear guard behavior.

# MUST READ — the gap being closed + insertion prescription + house template
- file: plan/002_32eb66cd705d/architecture/readme_gap_map.md
  why: §3.8 prescribes THIS pitfall: heading `### Forgetting <FormStackViewport/>
        with autoRender={false}`, BAD = no viewport, GOOD = mount exactly one
        <FormStackViewport/>, Why = dev guard, @see links. The "before line 939"
        line number is STALE (pre-expansion); anchor by the `## TypeScript`
        HEADING instead. The "House-Style Templates" appendix confirms the
        pitfall rhythm.
  section: "§3.8 + House-Style Templates"
  gotcha: ALL line numbers in the gap map (664, 937, 939) are PRE-expansion and
        wrong. README is now ~1257 lines and shifting (S1 is editing concurrently).
        ALWAYS anchor by content, never by line number.

# MUST READ — the dev-guard behavior (source of truth for the Why/Note)
- file: plan/002_32eb66cd705d/architecture/audit_findings.md
  why: Bullet 4 ("Dev-mode forgotten-host guard warns ≤ once per episode") is the
        verified behavioral spec: trigger = !autoRender && stack.length>0 &&
        !viewportMounted; dev-only (NODE_ENV==='development'); latches once per
        episode; resets when a viewport mounts OR the stack clears.
  section: "D1 Conformance Bullets — bullet 4"
  critical: Quote the guard is DEV-ONLY. In production an unhosted form is SILENT.
        This is the central user gotcha — consumers must not rely on the warning.

# MUST READ — the dev-guard implementation (exact warning string to quote in BAD)
- file: src/components/FormStackProvider.tsx
  why: The `warnedForgottenHostRef` effect is the source. Quote its exact
        console.warn string in the BAD example so users recognize it:
        '[FormStackProvider] autoRender is false and a form is open, but no
        <FormStackViewport/> is mounted. Render <FormStackViewport/> inside your
        host (e.g. your shared modal) so the form is visible.'
  pattern: "useEffect on [autoRender, state.stack.length, viewportMounted];
        if (forgotten && !warnedRef && NODE_ENV==='development') console.warn(...)
        + latch; else reset ref."
  critical: Do NOT invent a different warning string. Quote the real one.

# MUST READ — the inbound cross-link this pitfall must satisfy
- file: README.md
  why: Sibling S1's Hostable Viewport subsection (~line 855) ends with
        `[Common Pitfalls > Forgetting <FormStackViewport/>](#forgetting-formstackviewport-with-autorenderfalse)`.
        That link is DEAD until this task creates the heading. The slug is
        controlled SOLELY by the heading text.
  pattern: "GitHub slugger: lowercase → strip <>/{}=() and non-alnum/space/hyphen
        → spaces→hyphens. 'Forgetting <FormStackViewport/> with autoRender={false}'
        → '#forgetting-formstackviewport-with-autorenderfalse' (verified)."
  critical: The heading MUST be exactly
        `### Forgetting <FormStackViewport/> with autoRender={false}`. A colon,
        em-dash, reword, or extra space breaks the slug and S1's link.

# MUST READ — the house template to mirror (extracted from the 6 existing pitfalls)
- file: README.md
  why: Every existing pitfall follows: `### Title` → `**Problem**:` → `**❌ BAD** -`
        + ```tsx → `**✅ GOOD** -` + ```tsx → `**Why it's problematic**:` →
        (optional `> **Note**`) → `@see [text](#anchor) for ...`. Code fences are
        ```tsx; inline markers are `// ❌` / `// ✅` trailing comments; NO `---`
        separators between pitfalls.
  pattern: "See research/HOUSE_TEMPLATE.md for the full skeleton + the six
        existing pitfall titles."

# CROSS-LINK TARGET — the component entry (verified present)
- file: README.md
  why: `#### FormStackViewport` heading (verified at README ~line 285) → slug
        `#formstackviewport`. The @see link `[API Reference > FormStackViewport](#formstackviewport)`
        resolves. The component entry's own example (`<FormStackProvider
        autoRender={false}>` + `useFormStackState().stack` + `<Dialog open=...>` +
        `<FormStackViewport />`) is the model for the GOOD example — reuse it for
        doc self-consistency.
  critical: Use the slug `#formstackviewport` (verified unique heading).

# CROSS-LINK TARGET — the Hostable Viewport subsection (sibling S1, LANDED)
- file: README.md
  why: `### Hostable Viewport (Single Shared Modal)` heading (verified at README
        ~line 791) → slug `#hostable-viewport-single-shared-modal`. The @see link
        `[Advanced Usage > Hostable Viewport](#hostable-viewport-single-shared-modal)`
        resolves BECAUSE S1 has already landed. This creates the bidirectional
        cross-link (S1's subsection ↔ our pitfall).
  critical: If S1's subsection is ever missing/reverted, this anchor dangles — but
        it is the correct canonical link and S1 is the dependency, not us.

# SIBLING CONTEXT — what S1 produced (the parallel task this builds on)
- file: plan/002_32eb66cd705d/P1M2T2S1/PRP.md
  why: S1 added the Features bullet + the `### Hostable Viewport (Single Shared
        Modal)` Advanced Usage subsection, which contains the inbound link to OUR
        pitfall's slug and the "SharedModalHost" example. Our pitfall's GOOD block
        mirrors S1's host pattern. S1 is the contract for "the Advanced Usage
        subsection exists and links to our slug."
  critical: S1 has ALREADY landed in the working tree (verified: heading at line
        791, inbound link at line 855, 9 `autoRender={false}` occurrences). Our
        @see to `#hostable-viewport-single-shared-modal` therefore resolves TODAY.

# EXTERNAL — GitHub heading-slug rules (controls the heading → slug mapping)
- url: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
  why: Confirms the slugger. Verified: our heading →
        `#forgetting-formstackviewport-with-autorenderfalse` (the JSX punctuation
        `<>/{/}/=` is stripped without inserting word boundaries, so
        `autoRender={false}` collapses to the token `autorenderfalse`).
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── README.md                              # ← EDIT: 1 content-anchored insertion
│                                             (new ### pitfall before ## TypeScript)
├── PRD.md                                 # READ-ONLY — §5.1/§10/§10.1 source of truth
├── src/components/FormStackProvider.tsx   # READ-ONLY — dev-guard source + warn string
├── package.json                           # scripts: test=vitest run, type-check=tsc, build=tsup
└── plan/002_32eb66cd705d/
    ├── architecture/readme_gap_map.md     # §3.8 gap + house template
    ├── architecture/audit_findings.md     # bullet 4 = dev-guard behavior
    └── P1M2T2S2/                          # ← THIS PRP lives here
        ├── PRP.md
        └── research/
            ├── HOUSE_TEMPLATE.md          # pitfall skeleton + 6 existing titles
            ├── SLUGS_AND_ANCHORS.md       # slug derivation + @see target verification
            └── DEV_GUARD.md               # guard logic + exact warn string
```

### Desired Codebase tree with files to be changed

```bash
README.md                                  # MODIFIED — 1 content-anchored insertion
                                             (1 new ### pitfall as the LAST Common
                                              Pitfall, before ## TypeScript)
# (no new files; no source files touched)
```

### Known Gotchas of our codebase & Library Quirks

```markdown
<!-- CRITICAL: This is Mode B (documentation-only). The ONLY file you may edit is
     README.md. Do NOT touch any src/ file, PRD.md, tasks.json, prd_snapshot.md,
     or CHANGELOG.md. -->

<!-- CRITICAL: THE HEADING TEXT CONTROLS THE SLUG. The heading MUST be EXACTLY
     `### Forgetting <FormStackViewport/> with autoRender={false}` so the slug is
     `#forgetting-formstackviewport-with-autorenderfalse`. Sibling S1 already
     links to that anchor (README ~line 855); if you reword the heading, add a
     colon/em-dash, or change spacing, the slug changes and S1's link breaks.
     Verified in research/SLUGS_AND_ANCHORS.md §1. -->

<!-- CRITICAL: ANCHOR BY CONTENT, NOT LINE NUMBER. The contract cited "## TypeScript
     (line 939)" and the gap map cited "line 664/937/939" — ALL are pre-expansion and
     STALE. README is ~1257 lines AND is being edited concurrently by sibling S1
     (observed line drift 790→857 for ## Common Pitfalls in one session). The
     Implementation Blueprint's oldText block is verified UNIQUE:
         grep -n '@see \[Core Concepts > Promise-Based API\]' README.md   # 1 hit
         grep -n '^## TypeScript' README.md                               # 1 hit
     Locate with grep; confirm uniqueness before editing. -->

<!-- CRITICAL: THE DEV GUARD IS DEV-ONLY. The Note blockquote MUST state the guard
     fires only when NODE_ENV==='development'. In production an unhosted form is
     SILENT. This is the central user gotcha — consumers must mount exactly one
     <FormStackViewport/> and not rely on the warning. Quote the real warn string
     (from src/components/FormStackProvider.tsx) in the BAD example. -->

<!-- GOTCHA: Common Pitfalls use NO `---` separators between entries (verified: no
     `---` anywhere inside ## Common Pitfalls). Do NOT add a leading/trailing `---`
     around the new pitfall — it must flow with bare `###` like its siblings. -->

<!-- GOTCHA: Follow the house verb convention for the explanation label. For a
     footgun/mistake pitfall use `**Why it's problematic**:` (matches the closeForm
     pitfall). Do NOT use "How it works" (that's for the async-submission pitfall). -->

<!-- GOTCHA: Code fences inside the pitfall are ```tsx (NOT ```jsx or ```ts).
     Inline markers are C-style trailing comments `// ❌ ...` / `// ✅ ...` (NOT JSX
     block comments {/* */}) — matching every existing pitfall. -->

<!-- GOTCHA: The GOOD example should mirror the FormStackViewport component entry's
     own example (useFormStackState().stack + <Dialog open={stack.length > 0}> +
     <FormStackViewport />) so the docs are self-consistent. Do NOT invent a
     different host shape. -->

<!-- GOTCHA: Do NOT duplicate or alter the existing pitfalls. Your ONE insertion
     is a NEW ### subsection inserted AFTER the last pitfall ("Not Handling Async
     Form Submission Properly") and BEFORE ## TypeScript. Do NOT edit the API
     Reference, Advanced Usage, or Features (owned by S1–S4). -->

<!-- GOTCHA: Parallel-safety — sibling S1 edits ## Features + ## Advanced Usage
     (above your anchor). S1 has ALREADY landed, but may still be re-editing. Your
     insertion is at the END of ## Common Pitfalls (below S1's anchor). ZERO overlap.
     If S1 rewrites its subsection, re-verify your @see to
     #hostable-viewport-single-shared-modal still resolves (grep the heading). -->
```

---

## Implementation Blueprint

### Data models and structure

No data models. This is a Markdown documentation edit. The single structured
asset is the **new Common Pitfall subsection**, fixed by the house template + the
dev-guard facts + the contract §3 LOGIC.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EDIT README.md — insert the ### Forgetting <FormStackViewport/> pitfall
  - TARGET FILE: README.md
  - LOCATE BY CONTENT (not line number): the LAST pitfall's closing @see line
        `@see [Core Concepts > Promise-Based API](#promise-based-api) and [API Reference > useFormStack](#useformstack).`
        immediately followed by a blank line and `## TypeScript`. Confirm uniqueness:
            grep -n '@see \[Core Concepts > Promise-Based API\]' README.md   # exactly 1 hit
            grep -n '^## TypeScript' README.md                               # exactly 1 hit
  - OLD TEXT (exact, verified unique): see "Exact Replacement" oldText.
  - NEW TEXT: the existing @see line + blank line + the NEW pitfall (heading +
        Problem + BAD tsx + GOOD tsx + Why + Note blockquote + @see) + blank line
        + `## TypeScript`. See "Exact Replacement" newText.
  - FOLLOW pattern: the six existing Common Pitfalls (research/HOUSE_TEMPLATE.md).
  - NAMING: heading EXACTLY `### Forgetting <FormStackViewport/> with autoRender={false}`.
  - GOTCHA: the heading text controls the slug — do not alter it.
  - GOTCHA: do NOT add a `---` before or after the pitfall.
  - GOTCHA: code fences are ```tsx; markers are `// ❌`/`// ✅`.

Task 2: VALIDATE (no edits — run commands)
  - RUN: grep -nc 'autoRender={false}' README.md                      → expect ≥ 2 (was 9; grows).
  - RUN: grep -n '^### Forgetting <FormStackViewport/>' README.md     → expect exactly 1 heading.
  - RUN: grep -n 'forgetting-formstackviewport-with-autorenderfalse' README.md
        → expect ≥ 2 (S1's inbound link + the now-real heading resolves it).
  - RUN: grep -n '#formstackviewport' README.md                       → expect ≥ 1 (our @see).
  - RUN: grep -n '#hostable-viewport-single-shared-modal' README.md   → expect ≥ 1 (our @see).
  - RUN: verify placement (by content, not line number):
        awk '/^## Common Pitfalls/{f=1} f{print} /^## TypeScript/{exit}' README.md \
          | grep -nE '^### |^## TypeScript'
        → expect the new heading as the LAST ### before ## TypeScript.
  - RUN: npm run type-check                          → expect exit 0 (no-regression).
  - RUN: npm test                                    → expect all green (no-regression).
  - RUN: npm run build                               → expect success (no-regression).
  - RUN: git status --short                          → expect ONLY README.md modified.
  - If type-check/test/build FAIL: you edited a source file. Revert it.
```

### Exact Replacement

- `oldText` (the exact current block — verified unique; the last pitfall's `@see`
  line + blank line + `## TypeScript` heading):

  ````markdown
  @see [Core Concepts > Promise-Based API](#promise-based-api) and [API Reference > useFormStack](#useformstack).

  ## TypeScript
  ````

- `newText` (preserve the existing `@see` line + blank line, then insert the FULL
  new pitfall, then blank line + `## TypeScript`):

  ````markdown
  @see [Core Concepts > Promise-Based API](#promise-based-api) and [API Reference > useFormStack](#useformstack).

  ### Forgetting <FormStackViewport/> with autoRender={false}

  **Problem**: With `<FormStackProvider autoRender={false}>`, the provider renders **no** viewport. If you forget to mount `<FormStackViewport/>` yourself, an open form renders nowhere — the form is pushed onto the stack and its `openForm()` Promise stays pending, but nothing is visible on screen. The only hint is a dev-only `console.warn`.

  **❌ BAD** - autoRender off, no viewport mounted:
  ```tsx
  // App.tsx
  function App() {
    return (
      <FormStackProvider autoRender={false}>
        <MyApp />  // ❌ No <FormStackViewport/> anywhere!
      </FormStackProvider>
    );
  }
  // openForm() pushes the form onto the stack, but its body renders nowhere.
  // In development you'll see a one-time warning:
  //   [FormStackProvider] autoRender is false and a form is open, but no
  //   <FormStackViewport/> is mounted. Render <FormStackViewport/> inside
  //   your host (e.g. your shared modal) so the form is visible.
  ```

  **✅ GOOD** - mount exactly one <FormStackViewport/> where the stack bodies go:
  ```tsx
  // App.tsx
  function App() {
    return (
      <FormStackProvider autoRender={false}>
        <SharedModalHost />
      </FormStackProvider>
    );
  }

  // Render <FormStackViewport/> inside your host (e.g. a shared modal):
  function SharedModalHost() {
    const { stack } = useFormStackState();
    return (
      <Dialog open={stack.length > 0}>
        <FormStackViewport />  // ✅ The stacked form bodies now render here
      </Dialog>
    );
  }
  ```

  **Why it's problematic**: With `autoRender={false}` the provider intentionally renders no viewport — it still provides the state/actions context and still renders `<ConfirmationDialog/>`, but it no longer shows form bodies. So an `openForm()` call succeeds (the form is on the stack and its Promise stays open), yet nothing appears. The form isn't broken; it's just unhosted.

  > **Note**: In development, a dev-mode guard logs a `console.warn` at most once per "forgotten host" episode when `autoRender={false}`, a form is open, and no `<FormStackViewport/>` has mounted. The warning resets once a viewport mounts or the stack clears. This guard is **dev-only** — in production an unhosted form is silent, so mount exactly one `<FormStackViewport/>`.

  @see [API Reference > FormStackViewport](#formstackviewport) for the zero-prop viewport, and [Advanced Usage > Hostable Viewport](#hostable-viewport-single-shared-modal) for the full single-shared-modal pattern.

  ## TypeScript
  ````

> **Note on the `edit` tool:** the `oldText` block is verified unique in the current
> `README.md` (the `@see [Core Concepts > Promise-Based API]...` line appears exactly
> once — it is the closing line of the Async-submission pitfall; `## TypeScript` is
> the unique top-level heading). The backticks and fences inside the values are
> literal — pass them as-is. The new pitfall is inserted as a SINGLE `edit()` call
> with one entry in `edits[]`.

#### Coordination Note — the inbound cross-link (S1) and outbound @see

- **Inbound (S1 → us):** S1's Hostable Viewport subsection links to
  `#forgetting-formstackviewport-with-autorenderfalse`. Our heading produces exactly
  that slug (verified), so the link resolves the instant this edit lands. No action
  beyond using the EXACT heading text.
- **Outbound (us → S1):** our `@see` links to `#hostable-viewport-single-shared-modal`,
  which resolves BECAUSE S1 has already landed (heading verified at README ~line 791).
  If, when implementing, `grep -n '^### Hostable Viewport' README.md` returns
  nothing (S1 reverted/missing), the link dangles — but it remains the correct
  canonical target; leave it (S1 is the dependency).
- **Outbound (us → component entry):** `#formstackviewport` resolves to the
  `#### FormStackViewport` heading (verified at README ~line 285), a long-standing
  stable anchor.

### Implementation Patterns & Key Details

```markdown
<!-- PATTERN: Common Pitfall subsection (mirror the six existing entries — NO --- separators):
     ### <Title>

     **Problem**: <1-2 sentence mistake + symptom>

     **❌ BAD** - <short label>:
     ```tsx
     // <file>  (optional locator)
     <mistake, with // ❌ markers>
     ```

     **✅ GOOD** - <short label>:
     ```tsx
     // <file>  (optional locator)
     <fix, with // ✅ markers>
     ```

     **Why it's problematic**: <mechanism paragraph>

     > **Note**: <caveat/gotcha blockquote>   (optional)

     @see [<text>](#anchor) for <purpose>.   (last line)
     Match this rhythm. The pitfall ends by flowing into the next ## heading
     (## TypeScript) with one blank line — no trailing ---. -->

<!-- CRITICAL: The heading text is the ONLY control on the slug. It MUST be
     `### Forgetting <FormStackViewport/> with autoRender={false}` →
     #forgetting-formstackviewport-with-autorenderfalse (S1's inbound link).
     Do not reword, punctuate, or respell. -->

<!-- CRITICAL: Quote the REAL console.warn string in the BAD example (from
     src/components/FormStackProvider.tsx) so users recognize it. Do not invent. -->

<!-- CRITICAL: The Note MUST say the guard is dev-only and silent in production.
     This is the single most important user-facing fact in the pitfall. -->

<!-- CRITICAL: The GOOD block mounts EXACTLY ONE <FormStackViewport/>. The contract
     (§3 LOGIC + §10.1 guarantees) is "exactly one". Do not show multiple. -->
```

### Integration Points

```yaml
README.md — ## Common Pitfalls:
  - INSERT: one new ### Forgetting <FormStackViewport/> with autoRender={false}
            subsection as the LAST pitfall, after "Not Handling Async Form
            Submission Properly" and before ## TypeScript.
  - PRESERVE: all six existing pitfalls unchanged (do not edit/merge/reorder).
  - PRESERVE: the ## TypeScript heading and everything below it.

CROSS-LINKS:
  - OUTBOUND: the new pitfall links to #formstackviewport (stable, component entry)
            and #hostable-viewport-single-shared-modal (S1's subsection, landed).
  - INBOUND (pre-existing, now satisfied): S1's Hostable Viewport subsection
            (~line 855) links TO this pitfall's slug
            #forgetting-formstackviewport-with-autorenderfalse. Creating the
            heading resolves it.

SOURCE FILES: NONE modified (Mode B).
PRD.md / tasks.json / prd_snapshot.md / CHANGELOG.md: NONE modified (read-only).
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
cd /home/dustin/projects/geoform
# The contract gate — the count must be ≥ 2 (contract OUTPUT spec #4). It is
# already 9 post-S1 and this edit adds more, so this is a presence check, not a
# tight count assertion.
grep -c 'autoRender={false}' README.md     # EXPECT: ≥ 2 (and > current 9)

# The new heading exists exactly once, with the EXACT text (slug control).
grep -n '^### Forgetting <FormStackViewport/> with autoRender={false}$' README.md
# EXPECT: exactly 1 hit.

# Confirm placement relative to neighbors (by content, not line number).
awk '/^## Common Pitfalls/{f=1} f{print} /^## TypeScript/{exit}' README.md \
  | grep -nE '^### |^## TypeScript'
# EXPECT: the six existing pitfalls in order, THEN our new heading, THEN ## TypeScript
#         (our heading is the LAST ### before ## TypeScript).

# The inbound cross-link from S1 now resolves to a real heading.
grep -n 'forgetting-formstackviewport-with-autorenderfalse' README.md
# EXPECT: ≥ 2 hits — S1's inbound link (~line 855) + the heading's implicit anchor.

# The outbound @see links are present and target real headings.
grep -n '#formstackviewport' README.md                       # EXPECT: ≥ 1 (our @see).
grep -n '#hostable-viewport-single-shared-modal' README.md   # EXPECT: ≥ 1 (our @see).

# The pitfall follows the house template (Problem / BAD / GOOD / Why / Note / @see).
awk '/^### Forgetting <FormStackViewport/{f=1} f{print} /^## TypeScript/{exit}' README.md \
  | grep -nE '^\*\*Problem|^\*\*❌ BAD|^\*\*✅ GOOD|^\*\*Why it|^\*\*Note|^@see|^> \*\*Note'
# EXPECT: Problem, ❌ BAD, ✅ GOOD, Why it's problematic, > **Note**, @see — all present.
```

### Level 2: Markdown Structure (Pitfall Validation)

```bash
cd /home/dustin/projects/geoform
# The new pitfall sits cleanly between the last existing pitfall and ## TypeScript,
# with NO --- separators (matching the Common Pitfalls house-style).
awk '/^### Forgetting <FormStackViewport/{f=1} f{print} /^## TypeScript/{exit}' README.md \
  | grep -nE '^---$'
# EXPECT: zero `---` lines.

# The pitfall has exactly TWO tsx fences (BAD + GOOD).
awk '/^### Forgetting <FormStackViewport/{f=1} f{print} /^## TypeScript/{exit}' README.md \
  | grep -cE '```tsx'
# EXPECT: 2.

# The Note blockquote states the dev-only nature.
awk '/^### Forgetting <FormStackViewport/{f=1} f{print} /^## TypeScript/{exit}' README.md \
  | grep -E '> \*\*Note\*\*:.*dev-only'
# EXPECT: 1 hit (must contain "dev-only").

# The BAD example quotes the real warn string.
awk '/^### Forgetting <FormStackViewport/{f=1} f{print} /^## TypeScript/{exit}' README.md \
  | grep -F '[FormStackProvider] autoRender is false and a form is open'
# EXPECT: 1 hit.

# The GOOD example mounts exactly one <FormStackViewport/>.
awk '/^### Forgetting <FormStackViewport/{f=1} f{print} /^## TypeScript/{exit}' README.md \
  | grep -E '<FormStackViewport />|<FormStackViewport/>'
# EXPECT: ≥ 1 hit in the GOOD block.

# The @see line is the LAST non-blank line of the pitfall (before ## TypeScript).
awk '/^### Forgetting <FormStackViewport/{f=1} f{print} /^## TypeScript/{exit}' README.md \
  | grep -E '^@see \[API Reference > FormStackViewport\]'
# EXPECT: 1 hit.
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
# Anchor-resolution check (GitHub markdown preview or a viewer):
#   - Clicking "[Common Pitfalls > Forgetting <FormStackViewport/>]" at the end of
#     S1's Hostable Viewport subsection (~line 855) now SCROLLS to the new heading
#     (previously dead).
#   - The new pitfall's @see links render as inline links; #formstackviewport jumps
#     to the #### FormStackViewport heading; #hostable-viewport-single-shared-modal
#     jumps to S1's subsection (bidirectional link).
#   - The BAD/GOOD blocks each render as one tsx code block (no broken fences).
#   - The Note renders as a blockquote.
# (No automated markdown linter is configured in this repo — visual check only.)

# Scope guard: ONLY README.md changed.
git status --short
# EXPECT: exactly one line: " M README.md". Anything else is a scope violation.

# Scope guard: no source file was modified.
git diff --name-only
# EXPECT: README.md  (and nothing under src/, PRD.md, tasks.json, CHANGELOG.md, etc.)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `grep -c 'autoRender={false}' README.md` ≥ 2 (contract OUTPUT spec #4).
- [ ] `grep -n '^### Forgetting <FormStackViewport/> with autoRender={false}$' README.md`
      returns exactly 1 hit (EXACT heading → correct slug).
- [ ] `npm run type-check` exits 0 (no-regression).
- [ ] `npm test` all green (no-regression).
- [ ] `npm run build` succeeds (no-regression).
- [ ] `git status --short` shows ONLY `README.md`.

### Feature Validation

- [ ] The new heading `### Forgetting <FormStackViewport/> with autoRender={false}`
      is the LAST pitfall, before `## TypeScript`.
- [ ] `**Problem**` states `autoRender={false}` renders no viewport; a forgotten
      host makes an open form render nowhere.
- [ ] `**❌ BAD**` shows `<FormStackProvider autoRender={false}>` with NO
      `<FormStackViewport/>`, and quotes the real dev `console.warn` string.
- [ ] `**✅ GOOD**` shows mounting exactly ONE `<FormStackViewport/>` in a host
      (`useFormStackState().stack` + `<Dialog open={stack.length > 0}>`).
- [ ] `**Why it's problematic**` explains the provider renders no viewport (still
      provides context + `<ConfirmationDialog/>`), so `openForm()` succeeds but
      nothing appears.
- [ ] The `> **Note**` blockquote states the guard is **dev-only**, fires at most
      once per episode, resets on mount/clear, and is silent in production.
- [ ] `@see` cross-links to `#formstackviewport` AND
      `#hostable-viewport-single-shared-modal`.
- [ ] S1's inbound link (`#forgetting-formstackviewport-with-autorenderfalse`)
      now resolves to the new heading.

### Code Quality Validation

- [ ] The pitfall matches the Common Pitfalls house style (bare `###`, Problem →
      `❌ BAD` tsx → `✅ GOOD` tsx → Why → Note blockquote → `@see`) — NO `---`
      separators added.
- [ ] Code fences are ` ```tsx `; markers are `// ❌` / `// ✅` trailing comments.
- [ ] No existing pitfall, API Reference entry, Advanced Usage subsection, or
      Features bullet was edited.
- [ ] No source files, PRD.md, tasks.json, prd_snapshot.md, or CHANGELOG.md modified.

### Documentation & Deployment

- [ ] The pitfall is self-consistent with PRD §5.1 / §10 / §10.1.
- [ ] The dev-guard description is consistent with the wording S1 already used
      (README ~line 163: "at most once per 'forgotten host' episode ...
      resets once a viewport mounts or the stack clears").
- [ ] The warn string quoted in the BAD example matches the real implementation
      (`src/components/FormStackProvider.tsx`).
- [ ] The GOOD example mirrors the FormStackViewport component entry's own example.

---

## Anti-Patterns to Avoid

- ❌ Don't edit any file other than `README.md`. This is Mode B (docs-only). In
  particular don't touch `src/`, `PRD.md`, `tasks.json`, `prd_snapshot.md`, or
  `CHANGELOG.md`.
- ❌ Don't alter the heading text. It MUST be exactly
  `### Forgetting <FormStackViewport/> with autoRender={false}` — the slug
  `#forgetting-formstackviewport-with-autorenderfalse` is hard-referenced by S1's
  inbound link (README ~line 855). A colon, em-dash, reword, or spacing change
  breaks it.
- ❌ Don't anchor edits by line number. The contract's "line 939" and the gap
  map's "664/937/939" are pre-expansion and stale; README is ~1257 lines and
  shifting (S1 edits concurrently). Anchor by the exact text block
  (`@see [Core Concepts > Promise-Based API]...` + `## TypeScript`); locate with
  `grep -n` and confirm uniqueness.
- ❌ Don't add `---` separators around the new pitfall. Common Pitfalls flow with
  bare `###` headings (verified: no `---` anywhere inside `## Common Pitfalls`).
- ❌ Don't use the wrong explanation verb. For a footgun pitfall use
  `**Why it's problematic**:` — NOT "How it works" (that's the async-submission
  pitfall) and NOT "Why it doesn't work" (that's the URL-sync pitfall).
- ❌ Don't use ` ```jsx ` or ` ```ts ` fences, or JSX block comments `{/* */}`.
  House style is ` ```tsx ` fences with `// ❌` / `// ✅` trailing comments.
- ❌ Don't invent a `console.warn` string. Quote the real one from
  `src/components/FormStackProvider.tsx` (captured in research/DEV_GUARD.md) so
  users recognize the warning they actually see.
- ❌ Don't omit the "dev-only / silent in production" fact. It is the central
  user gotcha and must appear in the Note blockquote.
- ❌ Don't edit the API Reference, Advanced Usage subsection, or Features bullet —
  those are owned by S1–S4. Your single insertion is a new `###` at the END of
  `## Common Pitfalls`.
- ❌ Don't show mounting multiple `<FormStackViewport/>` as the fix. The contract
  (§3 LOGIC + §10.1) is "exactly one". (Multiple viewports render the stack N
  times — that caution lives in S1's guarantees blockquote, not here.)
- ❌ Don't add a markdown linter or new tooling. None is configured; validation is
  grep + no-regression build/test + visual anchor-resolution check.

---

## Confidence Score

**9.5 / 10** for one-pass success. This is a single content-anchored Markdown
insertion at a verified-unique text boundary (the last pitfall's `@see` line +
`## TypeScript`), with the exact old/new text specified verbatim above. The
heading slug is verified against GitHub's slugger rules
(`#forgetting-formstackviewport-with-autorenderfalse`) and matches sibling S1's
**already-landed** inbound cross-link (README ~line 855) — so this task both adds
content AND fixes a dead anchor. The Common Pitfalls house-style (no `---`,
`###` → Problem → `❌ BAD` tsx → `✅ GOOD` tsx → Why → Note → `@see`) is mirrored
from the six existing pitfalls. The dev-guard facts and the exact `console.warn`
string are quoted from `src/components/FormStackProvider.tsx` (audit bullet 4),
not invented. Both outbound `@see` targets (`#formstackviewport`, `#hostable-
viewport-single-shared-modal`) are verified to resolve in the current README. The
half-point residual is the **moving-target line numbers** (S1 edits README
concurrently), fully mitigated by content-anchored edits + grep-uniqueness checks.
Parallel-execution safety is high: S1 edits `## Features` + `## Advanced Usage`
(above this task's anchor); this task inserts at the END of `## Common Pitfalls`
— zero overlap.
