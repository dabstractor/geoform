# PRP — P1.M2.T1.S4: Add `#### useFormStackViewport` hook + `#### FormStackViewportValue` type entries to README.md

---

## Goal

**Feature Goal**: Close the two documentation gaps flagged in
`readme_gap_map.md` §3.5 and §3.6. Today `useFormStackViewport` and
`FormStackViewportValue` each have **0 grep hits** in `README.md`. The
`### Hooks` section ends at `#### useFormStackURLSync` with no
`useFormStackViewport` entry, and the `### Types` section ends at
`#### FormStackActions` with no `FormStackViewportValue` entry. This task inserts
**two** house-style entries: a `#### useFormStackViewport` hook block (in the
Hooks section) and a `#### FormStackViewportValue` type block (in the Types
section).

**Deliverable**: **Two content-anchored edits to `README.md`** — one new
`#### useFormStackViewport` hook entry inserted between the `---` that closes
`#### useFormStackURLSync` and the `### Types` heading; one new
`#### FormStackViewportValue` type entry inserted between the
`#### FormStackActions` type block and the `## Advanced Usage` heading. **No
source files are touched** (Mode B — changeset-level docs).

**Success Definition**:
- A dedicated `#### useFormStackViewport` heading exists in `### Hooks`, placed
  after `#### useFormStackURLSync` and before `### Types`.
- A dedicated `#### FormStackViewportValue` heading exists in `### Types`,
  placed after `#### FormStackActions` and before `## Advanced Usage`.
- The hook entry follows the house-style hook template: one-line description →
  use-case note → `tsx` import+usage snippet → `**Returns:**` table (one row).
- The type entry follows the house-style type template: description →
  `**Definition:**` `tsx` interface block pulled verbatim from
  `src/types/context.ts:10-22` → an `InternalStackEntry` internal-type note.
- `grep -c useFormStackViewport README.md` is **≥ 1** AND
  `grep -c FormStackViewportValue README.md` is **≥ 1** (both contract gates).
- `npm run type-check`, `npm test`, and `npm run build` all stay green
  (README-only edit → no-regression, and proves no source file was touched).
- `git status --short` shows **only** `README.md` modified.

---

## User Persona (if applicable)

**Target User**: A `geoform` consumer who chose the hostable-viewport pattern
(`<FormStackProvider autoRender={false}>`) and needs the **low-level escape
hatch** — they want to forward custom props to `<FormStackRenderer/>` or wrap it,
rather than mounting the zero-prop `<FormStackViewport/>` component.

**Use Case**: The consumer reads the Hooks section looking for a hook that gives
them direct access to the renderer props. They find `#### useFormStackViewport`,
copy the snippet (`const viewport = useFormStackViewport(); if (!viewport) return
null; return <FormStackRenderer {...viewport}/>`), then jump to the Types section
to understand the `FormStackViewportValue` shape.

**User Journey**: Read `#### useFormStackViewport` → learn it returns
`FormStackViewportValue | null`, assignable to `FormStackRendererProps` → copy the
snippet → click/scroll to `#### FormStackViewportValue` → see the interface +
note that `InternalStackEntry` is internal → spread the value onto
`<FormStackRenderer/>` with confidence.

**Pain Points Addressed**: Today both symbols are completely absent from the
README (0 grep hits). A consumer who needs the low-level hook — the exact
audience PRD §10.1 calls out ("consumers who wrap or forward custom props") — has
no documentation to reach for.

---

## Why

- **Discoverability of two shipped exports.** `useFormStackViewport` is exported
  from the public surface (`src/index.ts:317`), and `FormStackViewportValue` is
  exported as a type (`src/index.ts:407`). They are the low-level companions to
  the `<FormStackViewport/>` component documented by the parallel sibling
  P1.M2.T1.S3. Both the Hooks and Types sections are canonical discovery
  surfaces; undocumented public symbols there are effectively invisible.
- **Mirrors PRD §10.1.** PRD §10.1 names `useFormStackViewport()` as the second
  of two exports that make the chrome-less renderer placeable through the public
  API, and `FormStackViewportValue` as its return type (assignable to
  `FormStackRendererProps`, no internal-type leakage). The README must document
  the hook (this task) to match the component entry S3 adds.
- **Faithful to the source JSDoc.** `src/hooks/useFormStackViewport.ts` JSDoc is
  the authoritative prose ("Returns the props required by FormStackRenderer ...
  For consumers who want to forward custom props ... Most consumers should use
  FormStackViewport instead"). This task surfaces that guidance in the README.
- **No behavioral risk.** Pure documentation — two Markdown blocks. Cannot change
  runtime behavior, types, or tests.

---

## What

User-visible behavior (of the **docs**): the `### Hooks` section gains a new
`#### useFormStackViewport` entry (after `#### useFormStackURLSync`, before
`### Types`), and the `### Types` section gains a new
`#### FormStackViewportValue` entry (after `#### FormStackActions`, before
`## Advanced Usage`). Both entries match their respective house-style templates.

### Scope (EXACT — do only this)

Two content-anchored insertions to `README.md` (see Implementation Blueprint):

1. **Hook entry** — between the `---` that closes `#### useFormStackURLSync` and
   the `### Types` heading: a `#### useFormStackViewport` heading, a one-line
   description, a use-case note (consumers who wrap/forward custom props to
   `<FormStackRenderer/>` instead of using `<FormStackViewport/>`), a `tsx`
   import+usage snippet, and a `**Returns:**` table with one row.

2. **Type entry** — between the `#### FormStackActions` type block and the
   `## Advanced Usage` heading: a `#### FormStackViewportValue` heading, a
   description, a `**Definition:**` `tsx` interface block pulled verbatim from
   `src/types/context.ts:10-22`, and an `InternalStackEntry` internal-type note.

**Do NOT** edit any other section, component, hook, or type entry (see Scope
Guard). **Do NOT** touch the `FormStackActions` block itself — only insert after
it (adding the now-needed `---` separator + the new entry).

### Success Criteria

- [ ] A `#### useFormStackViewport` heading exists in `### Hooks`, positioned
      after `#### useFormStackURLSync` and before `### Types`.
- [ ] The hook entry's description states it returns the props required by
      `<FormStackRenderer/>` (or `null`), assignable to `FormStackRendererProps`.
- [ ] The hook entry includes a use-case note: for consumers who wrap/forward
      custom props to `<FormStackRenderer/>`; most should use
      `<FormStackViewport/>`.
- [ ] The hook entry includes a `tsx` snippet using
      `useFormStackViewport()` + `FormStackRenderer` (the source `@example`).
- [ ] The hook entry includes a `**Returns:**` table with one row describing
      `FormStackViewportValue | null`.
- [ ] A `#### FormStackViewportValue` heading exists in `### Types`, positioned
      after `#### FormStackActions` and before `## Advanced Usage`.
- [ ] The type entry includes a `**Definition:**` `tsx` interface block matching
      `src/types/context.ts:10-22` verbatim (`stack`, `onClose`, `onCancelRequest`).
- [ ] The type entry includes a note that `InternalStackEntry` is an internal
      (non-exported) type.
- [ ] `grep -c useFormStackViewport README.md` ≥ 1.
- [ ] `grep -c FormStackViewportValue README.md` ≥ 1.
- [ ] `npm run type-check`, `npm test`, `npm run build` all green (no-regression).
- [ ] `git status --short` lists **only** `README.md`.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** This is two content-anchored Markdown
insertions at verified-unique text blocks in `README.md`. The exact old-text
blocks, the exact replacement text (both full entries), the house-style hook and
type templates to mirror, the verified source signatures, and the exact
validation commands are all captured below. No inference is required.

### Documentation & References

```yaml
# MUST READ — the hook contract this entry documents
- file: src/hooks/useFormStackViewport.ts
  why: The authoritative behavior: `export function useFormStackViewport():
        FormStackViewportValue | null { return useContext(FormStackViewportContext); }`.
        Returns `null` when the stack is empty or outside a provider. The JSDoc
        is the authoritative prose to paraphrase ("Returns the props required by
        FormStackRenderer ... For consumers who want to forward custom props ...
        Most consumers should use FormStackViewport instead"). The `@example`
        block is the exact snippet to reuse.
  pattern: "returns FormStackViewportValue | null; null when empty/outside provider;
        assignable to FormStackRendererProps; low-level alternative to <FormStackViewport/>"
  critical: The hook takes NO arguments. The natural guard is
        `const viewport = useFormStackViewport(); if (!viewport) return null;`.

# MUST READ — the type contract this entry documents
- file: src/types/context.ts
  why: Lines 10-22 define `export interface FormStackViewportValue` with three
        fields: `stack: InternalStackEntry<unknown>[]`, `onClose: () => void`,
        `onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>`.
        The JSDoc above it states it is "Structurally identical to
        FormStackRendererProps" so it can be spread onto the renderer "without
        leaking internal types".
  pattern: "interface with stack/onClose/onCancelRequest; mirrors FormStackRendererProps"
  critical: This block is pulled VERBATIM into the README (including the /** */ JSDoc
        comments) — see Implementation Blueprint. `InternalStackEntry` is NOT
        exported publicly, so a note is required.

# MUST READ — the assignability claim (proves "assignable to FormStackRendererProps")
- file: src/components/FormStackRenderer.tsx
  why: Lines 8-14 define `export interface FormStackRendererProps` with the SAME
        three fields: `stack: InternalStackEntry<unknown>[]`, `onClose: () => void`,
        `onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>`.
        This confirms `FormStackViewportValue` is structurally identical → assignable.
  critical: The two interfaces are field-for-field identical. This is why the hook
        return can be spread directly: `<FormStackRenderer {...viewport} />`.

# MUST READ — public export status (proves both belong in the API Reference)
- file: src/index.ts
  why: Line 317 `export { useFormStackViewport } from './hooks';` and line 407
        `export type { FormStackViewportValue } from './types';`. Both are real,
        named public exports — the entries are warranted, not speculative.
  critical: `InternalStackEntry` is NOT in index.ts — it is internal. This is why
        the type block needs the internal-type note.

# MUST READ — the gap being closed + insertion points + house-style templates
- file: plan/002_32eb66cd705d/architecture/readme_gap_map.md
  why: §3.5 (item 5) prescribes the hook entry; §3.6 (item 6) prescribes the type
        entry. "House-Style Templates" defines (b) Hook Returns table and
        (c) Type Definition block formats to match exactly. "Authoritative
        Signature Sources" points at the exact files above.
  section: "Section-by-Section Insertion Map §5 and §6" + "House-Style Templates"
  gotcha: The gap map cited hook "~line 394" and type "line 501" — those were
        measured BEFORE siblings S1/S2/S3 expanded earlier sections. The hook
        anchor has shifted DOWN to ~line 459 and the type anchor to ~line 567.
        ALWAYS anchor by content, never by line number.

# MUST READ — the authoritative spec this documents
- file: PRD.md
  why: §10.1 defines `useFormStackViewport()` as "low-level hook returning the
        renderer props (FormStackViewportValue, assignable to FormStackRendererProps),
        or null when empty. For consumers who wrap or forward custom props to
        FormStackRenderer." This is the basis for the use-case note.
  critical: §10.1 guarantee — the value is "assignable to FormStackRendererProps"
        with "no internal-type leakage". Both phrases must appear in the entries.

# HOUSE-STYLE MIRROR — the peer hook and type entries already in the README
- file: README.md
  why: The existing `#### useFormStackActions` hook entry shows the EXACT hook
        format: `#### Name` heading → one-line description → optional detail →
        ```tsx import+usage snippet → `**Returns:**` + markdown table → `---`.
        The existing `#### OpenFormOptions` / `#### FormStackState` / `#### StackEntry`
        type entries show the EXACT type format: `#### Name` → description →
        `**Definition:**` → ```tsx interface block (with /** */ comments) → `---`.
  pattern: Copy the heading + description + fenced tsx + `**Returns:**`/`**Definition:**`
        + `---` rhythm verbatim from those peer entries.
  gotcha: The LAST type entry before `## Advanced Usage` (currently
        `#### FormStackActions`) has NO `---` between it and the `##` heading.
        When you insert `#### FormStackViewportValue` after it, you must ADD a
        `---` after `#### FormStackActions` (it is no longer last) and the new
        entry connects directly to `## Advanced Usage` (matching the old pattern
        where the last type had no trailing `---`).

# HOUSE-STYLE MIRROR — Returns table format (the type-pipe escaping convention)
- file: README.md
  why: The existing Returns tables escape the `|` in union types as `\|`, e.g.
        `| \`openForm\` | \`<T>(options) => Promise<T \| undefined>\` | Opens a form |`.
        The new hook's Returns row uses `FormStackViewportValue | null` — the
        union pipe MUST be escaped as `\|` or the table breaks.
  pattern: `| \`value\` | \`FormStackViewportValue \| null\` | <description> |`
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── README.md                              # ← EDIT: 2 content-anchored insertions
│                                             (1 hook entry before ### Types;
│                                              1 type entry before ## Advanced Usage)
├── PRD.md                                 # READ-ONLY — §10.1 source of truth
├── package.json                           # scripts: test=vitest run, type-check=tsc --noEmit, build=tsup
├── src/
│   ├── hooks/useFormStackViewport.ts      # READ-ONLY — the hook contract (returns FormStackViewportValue | null)
│   ├── types/context.ts                   # READ-ONLY — lines 10-22, the FormStackViewportValue interface
│   ├── components/FormStackRenderer.tsx   # READ-ONLY — FormStackRendererProps (identical shape → assignable)
│   └── index.ts                           # READ-ONLY — lines 317 + 407 confirm public exports
└── plan/002_32eb66cd705d/
    ├── architecture/readme_gap_map.md     # §3.5/§3.6 gaps + insertion map + house-style templates
    └── P1M2T1S4/                          # ← THIS PRP lives here
```

### Desired Codebase tree with files to be changed

```bash
README.md                                  # MODIFIED — 2 content-anchored insertions
                                             (new #### useFormStackViewport hook block;
                                              new #### FormStackViewportValue type block)
# (no new files; no source files touched)
```

### Known Gotchas of our codebase & Library Quirks

```markdown
<!-- CRITICAL: This is Mode B (documentation-only). The ONLY file you may edit is README.md.
     Do NOT touch any src/ file, PRD.md, tasks.json, prd_snapshot.md, or CHANGELOG.md. -->

<!-- CRITICAL: ANCHOR BY CONTENT, NOT LINE NUMBER. The gap map cited hook "~line 394"
     and type "line 501", but siblings S1/S2/S3 have since expanded earlier sections and
     pushed everything DOWN (README is now 1151 lines; hook anchor ~459, type anchor ~567).
     Locate anchors with grep, by exact text, and confirm uniqueness:
         grep -n "forceUrlUpdate" README.md          # hook anchor (appears exactly once)
         grep -n "^interface FormStackActions" README.md   # type anchor region
     The Implementation Blueprint's oldText blocks are verified unique. -->

<!-- CRITICAL: There are TWO edits, at TWO different anchors. Do them as ONE edit() call
     with TWO entries in edits[] (the oldText blocks are non-overlapping and unique).
     OR as two separate edit() calls. Either is fine — but do NOT merge them into a
     single oldText/newText spanning the whole Types section (too fragile). -->

<!-- GOTCHA: Hook Returns table — the `|` in `FormStackViewportValue | null` MUST be
     escaped as `\|` inside the markdown table cell, exactly like the peer tables do
     (`Promise<T \| undefined>`). An unescaped `|` adds a phantom table column. -->

<!-- GOTCHA: The LAST type entry before `## Advanced Usage` currently has NO `---`.
     `#### FormStackActions` goes straight into `## Advanced Usage`. When you insert
     `#### FormStackViewportValue` after it you must ADD a `---` after FormStackActions
     (now that it's no longer the last type), and the new entry connects directly to
     `## Advanced Usage` (no trailing `---`), matching how the last type previously
     connected. -->

<!-- GOTCHA: The Hooks section's last hook (useFormStackURLSync) DOES end with `---`
     before `### Types`. Keep that `---` (it now separates useFormStackURLSync from
     the new useFormStackViewport) and ADD a NEW `---` after useFormStackViewport
     before `### Types`. -->

<!-- GOTCHA: `InternalStackEntry` is an INTERNAL type — NOT exported from src/index.ts.
     The type block uses it (verbatim from context.ts:10-22) to document the shape, but
     a note MUST explain it is internal and not part of the public API. The public,
     sanitized entry view is `StackEntry`. -->

<!-- GOTCHA: The type interface block is pulled VERBATIM from src/types/context.ts:10-22,
     INCLUDING the /** */ JSDoc comments on each field. Do NOT strip the comments — the
     peer type entries (OpenFormOptions, FormStackState, StackEntry) all keep their
     comments. (Only FormStackActions omits comments; that is an inconsistency — but
     "verbatim from context.ts" + the OpenFormOptions precedent favors keeping them.) -->

<!-- GOTCHA: Do NOT document the `useFormStackViewport` hook Returns table in the type
     entry, and do NOT re-document the component (that is S3). Keep each entry to its
     lane: hook entry = hook + Returns; type entry = interface + note. You MAY
     cross-reference: the type entry's description can say "returned by
     useFormStackViewport()", and the hook entry can say "see FormStackViewportValue". -->

<!-- GOTCHA: "assignable to FormStackRendererProps" and "no internal-type leakage" are
     EXACT phrases from PRD §10.1 / the context.ts JSDoc. Use them — they are the
     consumer-facing guarantee. -->

<!-- GOTCHA: Parallel-safety — sibling S3 inserts a `#### FormStackViewport` COMPONENT
     entry in the Components section (above `### Hooks`). Your two edits are in the
     Hooks and Types sections (below `### Hooks`). There is ZERO overlap. Both PRPs
     can be applied independently. -->
```

---

## Implementation Blueprint

### Data models and structure

No data models. This is a Markdown documentation edit. The two structured assets
are the **new hook-entry block** and the **new type-entry block**, both fixed by
the source signatures and the house-style templates.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EDIT README.md — insert the new #### useFormStackViewport hook entry
  - TARGET FILE: README.md
  - LOCATE BY CONTENT (not line number): the `---` separator that closes the
        `#### useFormStackURLSync` entry, immediately followed by `### Types`.
        Confirm with:
            grep -n "forceUrlUpdate\|^### Types" README.md
        The oldText block below is verified UNIQUE (`forceUrlUpdate` appears
        exactly once in the whole README).
  - OLD TEXT (exact block — the useFormStackURLSync Returns table's last row,
        the closing `---`, and the `### Types` heading): see "Exact Replacements"
        §A oldText below.
  - NEW TEXT: the same opening (forceUrlUpdate row + `---`) + the NEW
        `#### useFormStackViewport` block + its own trailing `---` + `### Types`.
        See "Exact Replacements" §A newText below.
  - FOLLOW pattern: the existing `#### useFormStackActions` hook entry (heading →
        description → ```tsx snippet → `**Returns:**` table → `---`).
  - NAMING: heading `#### useFormStackViewport` (exact — matches the export name).
  - GOTCHA: keep the existing `---` (now separates useFormStackURLSync from the
        new hook) and ADD a new `---` after the new hook (before `### Types`).
  - GOTCHA: escape the `|` in `FormStackViewportValue | null` as `\|` in the
        Returns table cell.

Task 2: EDIT README.md — insert the new #### FormStackViewportValue type entry
  - TARGET FILE: README.md
  - LOCATE BY CONTENT (not line number): the `#### FormStackActions` interface
        block, immediately followed by `## Advanced Usage`. Confirm with:
            grep -n "^interface FormStackActions\|^## Advanced Usage" README.md
        The oldText block below is verified UNIQUE (the FormStackActions interface
        body appears once).
  - OLD TEXT (exact block — the FormStackActions interface block + `## Advanced
        Usage`): see "Exact Replacements" §B oldText below.
  - NEW TEXT: the FormStackActions interface block + a NEW `---` separator + the
        NEW `#### FormStackViewportValue` block (ending in the note, NO trailing
        `---`) + `## Advanced Usage`. See "Exact Replacements" §B newText below.
  - FOLLOW pattern: the existing `#### OpenFormOptions` / `#### FormStackState`
        type entries (heading → description → `**Definition:**` → ```tsx interface
        block → `---`).
  - NAMING: heading `#### FormStackViewportValue` (exact — matches the export name).
  - GOTCHA: ADD a `---` after the FormStackActions block (it is no longer the last
        type). The new FormStackViewportValue entry connects directly to
        `## Advanced Usage` with NO trailing `---` (matching how FormStackActions
        previously connected).
  - GOTCHA: the interface body is pulled VERBATIM from src/types/context.ts:10-22,
        including the /** */ comments.

Task 3: VALIDATE (no edits — run commands)
  - RUN: grep -c useFormStackViewport README.md    → expect >= 1 (contract gate).
  - RUN: grep -c FormStackViewportValue README.md  → expect >= 1 (contract gate).
  - RUN: grep -n "^#### useFormStackViewport" README.md   → expect exactly 1 heading.
  - RUN: grep -n "^#### FormStackViewportValue" README.md → expect exactly 1 heading.
  - RUN: npm run type-check                         → expect exit 0 (no-regression).
  - RUN: npm test                                   → expect all green (no-regression).
  - RUN: npm run build                              → expect success (no-regression).
  - RUN: git status --short                         → expect ONLY README.md modified.
  - If type-check/test/build FAIL: you accidentally edited a source file. Revert
          it (only README.md should change) and re-run.
```

### Exact Replacements

#### §A — Task 1 (insert `#### useFormStackViewport` before `### Types`)

- `oldText` (the exact current block — verified unique; this is the
  useFormStackURLSync Returns table's last row + the closing `---` + the
  `### Types` heading):

  ````markdown
  | `forceUrlUpdate` | `() => void` | Manually trigger URL update |

  ---

  ### Types
  ````

- `newText` (preserve the forceUrlUpdate row + its `---`, then insert the full
  new `#### useFormStackViewport` entry ending in its own `---`, then `### Types`):

  ````markdown
  | `forceUrlUpdate` | `() => void` | Manually trigger URL update |

  ---

  #### useFormStackViewport

  Low-level hook that returns the props required by `<FormStackRenderer/>` — the
  internal stack plus the `onClose`/`onCancelRequest` callbacks — or `null` when
  there is nothing to render. The returned value is assignable to
  `FormStackRendererProps`, so it can be spread directly onto the renderer.

  For consumers who want to forward custom props to `<FormStackRenderer/>` or wrap
  it, instead of mounting the zero-prop `<FormStackViewport/>` component. Most
  consumers should use `<FormStackViewport/>`.

  ```tsx
  import { useFormStackViewport, FormStackRenderer } from 'geoform';

  function CustomHost() {
    const viewport = useFormStackViewport();
    if (!viewport) return null;
    // viewport is assignable to FormStackRendererProps
    return <FormStackRenderer {...viewport} />;
  }
  ```

  **Returns:**

  | Property | Type | Description |
  |----------|------|-------------|
  | `value` | `FormStackViewportValue \| null` | Renderer props (assignable to `FormStackRendererProps`), or `null` when the stack is empty or the hook is used outside a `<FormStackProvider>` |

  ---

  ### Types
  ````

#### §B — Task 2 (insert `#### FormStackViewportValue` before `## Advanced Usage`)

- `oldText` (the exact current block — verified unique; this is the
  FormStackActions interface body inside its ```tsx fence + the `## Advanced Usage`
  heading. NOTE: there is currently NO `---` between them):

  ````markdown
  interface FormStackActions {
    openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
    closeForm: () => void;
    popToIndex: (index: number) => void;
    cancelForm: () => Promise<void>;
  }
  ```

  ## Advanced Usage
  ````

- `newText` (preserve the FormStackActions interface body + its closing fence,
  ADD a `---` separator, then insert the full new `#### FormStackViewportValue`
  entry — description + `**Definition:**` interface block + the internal-type
  note (NO trailing `---`) — then `## Advanced Usage`):

  ````markdown
  interface FormStackActions {
    openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
    closeForm: () => void;
    popToIndex: (index: number) => void;
    cancelForm: () => Promise<void>;
  }
  ```

  ---

  #### FormStackViewportValue

  The renderer props returned by `useFormStackViewport()`. Structurally identical
  to `FormStackRendererProps`, so the value can be spread directly onto
  `<FormStackRenderer/>` without leaking internal types into the public API.
  Consumers should never need to construct this themselves — read it via
  `useFormStackViewport()` or let `<FormStackViewport/>` render it.

  **Definition:**

  ```tsx
  interface FormStackViewportValue {
    /** Internal stack entries to render (top visible, parents mounted-hidden) */
    stack: InternalStackEntry<unknown>[];
    /** Callback when a form closes (pops the top form from the stack) */
    onClose: () => void;
    /** Request confirmation before cancelling an entry; resolves true if confirmed */
    onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>;
  }
  ```

  > **Note:** `InternalStackEntry` is an **internal type** — it is not exported
  > from the package entry point and is not part of the public API. It appears
  > here only to document the value's shape. Consumers obtain the full value from
  > `useFormStackViewport()` and never construct or name `InternalStackEntry`
  > directly; the public, sanitized view of a stack entry is `StackEntry`.

  ## Advanced Usage
  ````

> **Note on the `edit` tool:** both `oldText` blocks are verified unique in the
> current `README.md` (`forceUrlUpdate` appears exactly once; the FormStackActions
> interface body appears exactly once). The backticks and fences inside the values
> are literal — pass them as-is. You may issue both edits in a SINGLE `edit()` call
> with two entries in `edits[]` (they are non-overlapping), or as two separate calls.

### Implementation Patterns & Key Details

```markdown
<!-- PATTERN: Hook entry (from readme_gap_map.md template (b) + observed
     useFormStackActions entry):
     #### Name
     <one-line description>
     <optional use-case note paragraph>
     ```tsx
     <import + usage snippet>
     ```
     **Returns:**

     | Property | Type | Description |
     |----------|------|-------------|
     | `<name>` | `<type>` | <description> |
     ---
     Match this rhythm exactly. -->

<!-- PATTERN: Type entry (from readme_gap_map.md template (c) + observed
     OpenFormOptions/FormStackState/StackEntry entries):
     #### Name
     <description>
     **Definition:**

     ```tsx
     interface Name {
       /** field comment */
       field: type;
       ...
     }
     ```
     (> optional note)
     Match this rhythm. The LAST type before a ## heading omits the trailing ---. -->

<!-- CRITICAL: The hook entry prose must match the source
     (src/hooks/useFormStackViewport.ts) and PRD §10.1 on every fact:
     - returns the props required by FormStackRenderer (the JSDoc's first line)
     - returns FormStackViewportValue | null  (the function signature)
     - null when the stack is empty OR outside a provider  (the JSDoc + useContext)
     - assignable to FormStackRendererProps  (PRD §10.1 + context.ts JSDoc)
     - for consumers who wrap/forward custom props; most should use <FormStackViewport/>
       (the JSDoc's second sentence)
     Source consensus: useFormStackViewport.ts + PRD §10.1. -->

<!-- CRITICAL: The type entry interface block must match src/types/context.ts:10-22
     field-for-field: stack, onClose, onCancelRequest — with their /** */ comments.
     And FormStackRendererProps (src/components/FormStackRenderer.tsx:8-14) confirms
     the shapes are identical → the "structurally identical / assignable" claim holds. -->

<!-- CRITICAL: The InternalStackEntry note must state it is INTERNAL / not exported.
     This is the "no internal-type leakage" guarantee from PRD §10.1. -->
```

### Integration Points

```yaml
README.md — ### Hooks section:
  - INSERT: a new `#### useFormStackViewport` entry between the `---` that closes
            `#### useFormStackURLSync` and the `### Types` heading.
  - PRESERVE: all existing hook entries (useFormStack, useFormStackState,
            useFormStackActions, useFormStackURLSync) unchanged. The parallel
            sibling P1.M2.T1.S2 (Complete) edited the useFormStack and
            useFormStackActions Returns tables — do not touch those.

README.md — ### Types section:
  - INSERT: a new `#### FormStackViewportValue` entry between the
            `#### FormStackActions` block and the `## Advanced Usage` heading.
  - PRESERVE: all existing type entries (FormProps, OpenFormOptions, StackEntry,
            FormStackState, FormStackActions) unchanged. Only ADD a `---` after
            FormStackActions (now that it is no longer the last type).
  - PRESERVE: the `## Advanced Usage` heading and everything below it.

CROSS-LINKS:
  - WITHIN: the hook entry references `FormStackViewportValue` and
            `FormStackRendererProps` (resolved by the type entry + the renderer
            export). The type entry references `useFormStackViewport()`,
            `FormStackRendererProps`, `<FormStackViewport/>`, and `StackEntry`
            (all real README/source symbols).
  - INBOUND (later, by other tasks): P1.M2.T2.S1 (Advanced Usage) and P1.M2.T2.S2
            (Common Pitfall) may link TO these entries. Do not create those
            sections here.

SOURCE FILES: NONE modified (Mode B).
PRD.md / tasks.json / prd_snapshot.md / CHANGELOG.md: NONE modified (read-only).
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
cd /home/dustin/projects/geoform
# The contract gates — both symbols must appear (currently 0 hits each).
grep -c useFormStackViewport README.md    # EXPECT: >= 1  (rises from 0)
grep -c FormStackViewportValue README.md  # EXPECT: >= 1  (rises from 0)

# The new headings exist exactly once, in the right sections.
grep -n "^#### useFormStackViewport" README.md   # EXPECT: exactly 1 hit, located
                                                 #         after #### useFormStackURLSync
                                                 #         and before ### Types.
grep -n "^#### FormStackViewportValue" README.md # EXPECT: exactly 1 hit, located
                                                 #         after #### FormStackActions
                                                 #         and before ## Advanced Usage.

# The entries carry the required house-style elements.
grep -n "Returns:\*\*" README.md | tail -3        # EXPECT: a hit inside the new hook entry.
grep -n "Definition:\*\*" README.md | tail -3     # EXPECT: a hit inside the new type entry.
grep -n "InternalStackEntry" README.md            # EXPECT: hits inside the new type entry
                                                  #         (interface + the internal-type note).
grep -n "assignable to .FormStackRendererProps" README.md  # EXPECT: hits in both entries.

# Confirm the hook entry is positioned correctly relative to its neighbors.
grep -n "#### useFormStackURLSync\|^#### useFormStackViewport\|^### Types" README.md
# EXPECT: useFormStackURLSync line < useFormStackViewport line < ### Types line.

# Confirm the type entry is positioned correctly relative to its neighbors.
grep -n "^#### FormStackActions\|^#### FormStackViewportValue\|^## Advanced Usage" README.md
# EXPECT: FormStackActions line < FormStackViewportValue line < ## Advanced Usage line.
```

### Level 2: Markdown Structure (Entry Validation)

```bash
cd /home/dustin/projects/geoform
# The new hook entry sits cleanly between useFormStackURLSync's --- and ### Types,
# and is itself --- terminated.
awk '/^#### useFormStackURLSync/{f=1} f{print} /^### Types/{exit}' README.md \
  | grep -nE '^#### |^---$|^### Types'
# EXPECT: the useFormStackURLSync heading, a --- (its closer), the
#         useFormStackViewport heading, another --- (the new entry's closer),
#         then ### Types.

# The new hook entry has exactly one tsx fence and one Returns table.
awk '/^#### useFormStackViewport/{f=1} f{print} /^### Types/{exit}' README.md \
  | grep -cE '```tsx'
# EXPECT: 1 (exactly one tsx fence opens the snippet).

# The Returns table row uses the escaped union (FormStackViewportValue \| null).
awk '/^#### useFormStackViewport/{f=1} f{print} /^### Types/{exit}' README.md \
  | grep -F 'FormStackViewportValue \| null'
# EXPECT: one hit (the escaped union in the Returns table).

# The new type entry sits cleanly after FormStackActions and before ## Advanced Usage,
# with a --- now separating FormStackActions from it.
awk '/^#### FormStackActions/{f=1} f{print} /^## Advanced Usage/{exit}' README.md \
  | grep -nE '^#### |^---$|^## Advanced Usage'
# EXPECT: the FormStackActions heading, a --- (newly added), the
#         FormStackViewportValue heading, then ## Advanced Usage.

# The type entry's interface block matches context.ts:10-22 field-for-field.
awk '/^#### FormStackViewportValue/{f=1} f{print} /^## Advanced Usage/{exit}' README.md \
  | grep -E 'stack:|onClose:|onCancelRequest:'
# EXPECT: all three fields present.

# The internal-type note is present.
awk '/^#### FormStackViewportValue/{f=1} f{print} /^## Advanced Usage/{exit}' README.md \
  | grep -iE 'internal'
# EXPECT: at least one hit (the InternalStackEntry internal-type note).
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
#   - The Hooks section now lists useFormStackViewport after useFormStackURLSync.
#   - The hook description reads cleanly (returns renderer props or null; assignable
#     to FormStackRendererProps; for consumers who wrap/forward custom props).
#   - The hook tsx snippet renders as one code block (no broken fences).
#   - The Returns table renders with 3 columns (Property | Type | Description) and the
#     `FormStackViewportValue | null` union is NOT split into a 4th column.
#   - The Types section now lists FormStackViewportValue after FormStackActions.
#   - The type Definition block renders as one code block with the 3 fields + comments.
#   - The InternalStackEntry note renders as a quoted callout.
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

- [ ] `grep -c useFormStackViewport README.md` ≥ 1 (contract gate).
- [ ] `grep -c FormStackViewportValue README.md` ≥ 1 (contract gate).
- [ ] `npm run type-check` exits 0 (no-regression).
- [ ] `npm test` all green (no-regression).
- [ ] `npm run build` succeeds (no-regression).
- [ ] `git status --short` shows ONLY `README.md`.

### Feature Validation

- [ ] A `#### useFormStackViewport` heading exists in `### Hooks`, after
      `#### useFormStackURLSync` and before `### Types`.
- [ ] The hook description states it returns the props required by
      `<FormStackRenderer/>` (or `null`), assignable to `FormStackRendererProps`.
- [ ] The hook entry has a use-case note (consumers who wrap/forward custom props;
      most should use `<FormStackViewport/>`).
- [ ] The hook entry has a `tsx` snippet using `useFormStackViewport()` +
      `FormStackRenderer`.
- [ ] The hook entry has a `**Returns:**` table with one `FormStackViewportValue |
      null` row (pipe escaped).
- [ ] A `#### FormStackViewportValue` heading exists in `### Types`, after
      `#### FormStackActions` and before `## Advanced Usage`.
- [ ] The type entry has a `**Definition:**` `tsx` interface block with
      `stack`, `onClose`, `onCancelRequest` matching `src/types/context.ts:10-22`.
- [ ] The type entry has a note that `InternalStackEntry` is internal/non-exported.
- [ ] A `---` separator now follows `#### FormStackActions` (it is no longer last).

### Code Quality Validation

- [ ] The hook entry follows the house-style hook template (matches
      useFormStackActions rhythm).
- [ ] The type entry follows the house-style type template (matches
      OpenFormOptions/FormStackState rhythm).
- [ ] The blockquote (`>`) note style is used for the InternalStackEntry note.
- [ ] No sibling-task sections were edited (scope guard — see Known Gotchas).
- [ ] No source files, PRD.md, tasks.json, prd_snapshot.md, or CHANGELOG.md modified.

### Documentation & Deployment

- [ ] The new entries are self-consistent with PRD §10.1 and the source JSDoc.
- [ ] The new entries are consistent with the public behavior
      (`src/hooks/useFormStackViewport.ts` + `src/types/context.ts:10-22`).
- [ ] The "assignable to `FormStackRendererProps`" / "no internal-type leakage"
      guarantee from PRD §10.1 is reflected in both entries.

---

## Anti-Patterns to Avoid

- ❌ Don't edit any file other than `README.md`. This is Mode B (docs-only). In
  particular don't touch `src/`, `PRD.md`, `tasks.json`, `prd_snapshot.md`, or
  `CHANGELOG.md`.
- ❌ Don't anchor the edits by line number. The gap map's hook "~394" and type
  "~501" predate siblings S1/S2/S3 and have shifted DOWN (hook anchor ~459, type
  anchor ~567). Anchor by the exact text blocks (`forceUrlUpdate` ... `---` ...
  `### Types` and the `interface FormStackActions { ... }` ... `## Advanced Usage`);
  locate them with `grep -n`.
- ❌ Don't forget to escape the `|` in `FormStackViewportValue | null` as `\|`
  inside the Returns table cell. An unescaped pipe adds a phantom 4th column.
- ❌ Don't omit the now-required `---` after `#### FormStackActions`. It was the
  last type (no `---`) before `## Advanced Usage`; once you insert a type after
  it, it needs the inter-entry `---` like every other type entry.
- ❌ Don't add a trailing `---` after the new `#### FormStackViewportValue` entry.
  The last type before a `##` heading connects directly (matching how
  FormStackActions previously did).
- ❌ Don't strip the `/** */` comments from the type interface block. Pull it
  verbatim from `src/types/context.ts:10-22`; the peer type entries
  (OpenFormOptions, FormStackState, StackEntry) keep their comments.
- ❌ Don't omit the `InternalStackEntry` internal-type note. It is the
  "no internal-type leakage" guarantee from PRD §10.1 and prevents consumers from
  thinking they should import `InternalStackEntry`.
- ❌ Don't document the `<FormStackViewport/>` component here — that is
  P1.M2.T1.S3. You may cross-reference it by name; don't write its entry.
- ❌ Don't restate the hook's Returns table inside the type entry or vice versa.
  Keep each entry to its lane (hook = hook + Returns; type = interface + note).
- ❌ Don't invent a different description than the source JSDoc. The hook's
  JSDoc ("Returns the props required by FormStackRenderer ... For consumers who
  want to forward custom props ... Most consumers should use FormStackViewport
  instead") is the authoritative prose.
- ❌ Don't add a markdown linter or new tooling. None is configured; validation is
  grep + no-regression build/test + visual render check.
- ❌ Don't edit the region above `### Hooks` (Components — owned by the parallel
  S3) or the FormStackActions block body (owned by the completed S2). Your two
  insertions are between useFormStackURLSync and `### Types`, and between
  FormStackActions and `## Advanced Usage` — keep them there to avoid overlap.

---

## Confidence Score

**9.5 / 10** for one-pass success. This is two content-anchored Markdown
insertions at verified-unique text blocks in `README.md`, with the exact
old/new text specified verbatim above. Both source signatures are confirmed
against three independent sources (`src/hooks/useFormStackViewport.ts` + its JSDoc,
`src/types/context.ts:10-22`, and `src/components/FormStackRenderer.tsx:8-14` for
the assignability claim), and both export statuses are confirmed at `src/index.ts`
(lines 317 + 407). The house-style templates are mirrored from existing peer
entries (useFormStackActions for the hook; OpenFormOptions/FormStackState for the
type). The only residual half-point is the **separator nuance** around the last
type entry (adding `---` after FormStackActions, no trailing `---` on the new
entry) — but the exact oldText/newText blocks above handle this precisely.
Parallel-execution safety is high: sibling S3's edit is entirely in the
Components section (above `### Hooks`), with zero overlap with either of these two
insertions; sibling S2 (Complete) already finalized the FormStackActions block
body, which this task only appends after (never edits).
