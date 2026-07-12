# PRP — P1.M2.T1.S2: Document `cancelForm` + `popToIndex` across action tables and the `FormStackActions` type

---

## Goal

**Feature Goal**: Close the `cancelForm` documentation gap flagged in
`readme_gap_map.md` §3.3 (today `grep -c cancelForm README.md` returns **0** —
`cancelForm` is absent from ALL hook Returns tables and the `FormStackActions` type
block) and finish the `popToIndex` documentation (it is already present in the
`useFormStackActions` table and the `FormStackActions` type, but is **missing** from
the `useFormStack` Returns table and its description row is too terse). All edits
mirror the post-P1.M1.T1.S2 hook surface: `useFormStack()` returns
`{ stack, openForm, closeForm, popToIndex, cancelForm }` and
`useFormStackActions()` returns `{ openForm, closeForm, popToIndex, cancelForm }`.

**Deliverable**: A **single edit to `README.md`** — three content-anchored edits to
three named zones: (A) the `useFormStack` **Returns** table (add `popToIndex` +
`cancelForm` rows), (B) the `useFormStackActions` **Returns** table (add `cancelForm`
row + clarify the existing `popToIndex` row), and (C) the `FormStackActions` type
block (add `cancelForm: () => Promise<void>;`). **No source files are touched**
(Mode B — changeset-level docs).

**Success Definition**:
- `grep -c cancelForm README.md` is **≥ 3** (the contract's literal gate: two table
  rows + one type-def line).
- The `useFormStack` Returns table lists all five members
  (`stack`, `openForm`, `closeForm`, `popToIndex`, `cancelForm`).
- The `useFormStackActions` Returns table lists all four action members
  (`openForm`, `closeForm`, `popToIndex`, `cancelForm`) with an accurate `popToIndex`
  description.
- The `FormStackActions` type block contains `cancelForm: () => Promise<void>;`.
- `npm run type-check`, `npm test`, and `npm run build` all stay green (README-only
  edit → no-regression, and proves no source file was accidentally changed).
- `git status --short` shows **only** `README.md` modified.

---

## User Persona (if applicable)

**Target User**: A `geoform` consumer reading `README.md` to drive a host window
(e.g. a single shared modal) who needs the Escape / backdrop / host-close action, or
who needs programmatic multi-level cancellation.

**Use Case**: The consumer wires their modal's `onClose` to the hook's `cancelForm`,
and wires `<Breadcrumbs/>` (which uses `popToIndex` internally). They look in the API
Reference to confirm the signatures and that `cancelForm` honors `confirmOnCancel`.

**User Journey**: Read `#### useFormStack` → see `cancelForm` + `popToIndex` in the
Returns table → read `#### useFormStackActions` for the actions-only variant → check
the `FormStackActions` type to get the exact TS signature → wire it up.

**Pain Points Addressed**: Today `cancelForm` is implemented and shipped
(`FormStackProvider.tsx` + `useFormStack.ts` + `FormStackActions` type) and specified
(PRD §5.2 h4.3) but **invisible in the README** — a consumer wiring a host modal has
no documented action to reach for, and the `useFormStack` table is stale (3 of 5
members). This closes both gaps (D2 / Mode B).

---

## Why

- **Discoverability of a shipped action.** `cancelForm` is already exported, typed,
  and tested (`src/types/__tests__/types.test.ts` asserts all four members). The
  README is the public face of the library; an undocumented action is effectively a
  private API. This closes that gap.
- **Keeps the three API surfaces in sync.** There are three places that enumerate the
  hook surface: the `useFormStack` Returns table, the `useFormStackActions` Returns
  table, and the `FormStackActions` type block. A drift in any one is a documentation
  bug. The `useFormStack` table drifted to 3/5 after P1.M1.T1.S2 added
  `popToIndex` + `cancelForm`; this PRP resyncs all three.
- **Prerequisite for the hostable-viewport narrative.** The Hostable Viewport section
  (P1.M2.T2.S1) will tell consumers to wire their modal's `onClose` to `cancelForm`.
  That section can only cross-link to a documented symbol — so documenting
  `cancelForm` here is the prerequisite anchor.
- **No behavioral risk.** This is pure documentation — Markdown table rows + one type
  line. It cannot change runtime behavior, types, or tests.

---

## What

User-visible behavior (of the **docs**): three README zones gain the missing
`cancelForm` member and an accurate `popToIndex` description, matching the
post-P1.M1.T1.S2 hook surface exactly.

### Scope (EXACT — do only this)

Three content-anchored edits to `README.md` (Zone A, Zone B, Zone C — see
Implementation Blueprint). **Do NOT** edit any other section (see Scope Guard). In
particular, do **not** touch the `useFormStack` destructuring example
(`const { stack, openForm, closeForm } = useFormStack();`) — it is a *usage* example
that destructures the subset that component needs; it is not a surface enumeration
and is intentionally left as-is.

### Success Criteria

- [ ] `grep -c cancelForm README.md` ≥ 3.
- [ ] The `useFormStack` Returns table contains rows for `popToIndex` AND `cancelForm`.
- [ ] The `useFormStackActions` Returns table contains a `cancelForm` row.
- [ ] The `useFormStackActions` `popToIndex` row description mentions "cancelling all
      deeper forms" and "used by `<Breadcrumbs/>`".
- [ ] The `FormStackActions` type block contains the line `cancelForm: () => Promise<void>;`.
- [ ] `npm run type-check`, `npm test`, `npm run build` all green (no-regression).
- [ ] `git status --short` lists **only** `README.md`.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** This is three small Markdown edits at
content-anchored locations in `README.md`. The exact old-text blocks, the exact
replacement text (row/line content), the house-style table/type-block format to
mirror, the verified signatures, and the exact validation commands are all captured
below. No inference is required.

### Documentation & References

```yaml
# MUST READ — the authoritative type the README type block must mirror
- file: src/types/context.ts
  why: Defines `export interface FormStackActions` (line 53). `popToIndex` at line 82,
        `cancelForm` at line 97 — the exact signatures to copy into the README type
        block and Returns tables. JSDoc above each member is the authoritative prose
        to paraphrase for the Description column.
  pattern: popToIndex => "(index: number) => void"; cancelForm => "() => Promise<void>;".
  critical: cancelForm JSDoc says "No-op when the stack is empty" and "host window
        should wire to Escape / backdrop / host-level close button" — both facts belong
        in the README description. popToIndex is fire-and-forget (typed void) even
        though the impl is async; use the TYPE, not the impl, in the README.

# MUST READ — the post-fix combined-hook surface (proof the useFormStack table is stale)
- file: src/hooks/useFormStack.ts
  why: Line 173 `return { stack, openForm, closeForm, popToIndex, cancelForm };` is THE
        source of truth for the 5-member useFormStack surface. Line 109 (popToIndex)
        and line 123 (cancelForm) confirm the combined-hook return type members.
  critical: This file PROVES the useFormStack Returns table must grow from 3 to 5 rows.

# MUST READ — behavioral confirmation + dev-mode RangeError detail for popToIndex
- file: src/components/FormStackProvider.tsx
  why: Line 156 popToIndex impl (dev-mode RangeError on out-of-bounds index; production
        silently ignores; cancels deeper forms, honoring their confirmOnCancel). Line
        213 cancelForm impl (confirmation → resolve deferred undefined → pop). Confirms
        the Description-column wording.
  critical: popToIndex respects confirmOnCancel on the deeper forms it cancels — this
        is implied by "cancelling all deeper forms" but do NOT over-specify in a table
        cell; keep the description concise.

# MUST READ — the type test that locks the four-member contract
- file: src/types/__tests__/types.test.ts
  why: Lines 120-134 assert FormStackActions has openForm, closeForm, popToIndex, AND
        cancelForm. Confirms the README type block must carry all four members.
  section: "describe('FormStackActions'..."

# MUST READ — the gap being closed + insertion points + house-style templates
- file: plan/002_32eb66cd705d/architecture/readme_gap_map.md
  why: §3.3 / item 3 prescribes exactly these three edits (useFormStackActions table
        add cancelForm + clarify popToIndex; useFormStack table add cancelForm +
        popToIndex; FormStackActions type add cancelForm). Also gives the House-Style
        Templates (b) Returns table and (c) type block to match exactly.
  section: "Section-by-Section Insertion Map §3" and "House-Style Templates"

# MUST READ — the authoritative spec this documents
- file: PRD.md
  why: §5.2 h4.3 (cancelForm) and h4.4 (popToIndex) define the canonical prose.
  critical: PRD says cancelForm "resolves its deferred with undefined" and is
        "no-op on an empty stack"; popToIndex "cancels all deeper forms (used by
        <Breadcrumbs/>)". Paraphrase these exactly.

# HOUSE-STYLE MIRROR — the peer Returns tables already in the README
- file: README.md
  why: The existing useFormStackActions Returns table and the useFormStackURLSync
        Returns table show the EXACT format: `**Returns:**` heading + 3-col table
        (Property | Type | Description) + backticked cells, with `Promise<T \| undefined>`
        using an ESCAPED pipe inside table cells.
  pattern: Copy the header row and the escaped-pipe style verbatim from the
        useFormStackActions table.
  gotcha: Table cells must escape `|` as `\|` inside `Promise<T \| undefined>` —
        match the existing rows exactly.

# EXACT EDIT TARGETS — the three content-anchored zones (see Implementation Blueprint)
- file: README.md
  why: Three zones to edit: useFormStack Returns table, useFormStackActions Returns
        table, FormStackActions type block. Each oldText is a multi-line block (see
        the Uniqueness Gotcha below — single rows are NOT unique).
  gotcha: Line numbers are APPROXIMATE and WILL SHIFT after sibling P1.M2.T1.S1
        expands the FormStackProvider Props area (~line 144) into a multi-line block.
        Therefore ALL anchors are CONTENT-BASED (exact text blocks), NEVER line numbers.
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── README.md                       # ← EDIT: 3 content-anchored zones (A/B/C)
├── PRD.md                          # READ-ONLY — §5.2 h4.3/h4.4 source of truth
├── package.json                    # scripts: test=vitest run, type-check=tsc --noEmit, build=tsup
├── src/
│   ├── types/context.ts            # READ-ONLY — FormStackActions interface (authoritative types)
│   ├── hooks/useFormStack.ts       # READ-ONLY — line 173 combined-hook surface (5 members)
│   ├── components/FormStackProvider.tsx  # READ-ONLY — behavioral confirmation
│   └── types/__tests__/types.test.ts     # READ-ONLY — locks the 4-member contract
└── plan/002_32eb66cd705d/
    ├── architecture/readme_gap_map.md    # §3.3 gap + insertion map + house-style templates
    └── P1M2T1S2/                          # ← THIS PRP lives here
```

### Desired Codebase tree with files to be changed

```bash
README.md                           # MODIFIED — 3 zones (A/B/C): add cancelForm rows/line + popToIndex row + clarification
# (no new files; no source files touched)
```

### Known Gotchas of our codebase & Library Quirks

```markdown
<!-- CRITICAL: This is Mode B (documentation-only). The ONLY file you may edit is README.md.
     Do NOT touch any src/ file, PRD.md, tasks.json, prd_snapshot.md, or CHANGELOG.md. -->

<!-- CRITICAL: UNIQUENESS. The row
     | `closeForm` | `() => void` | Closes the current form |
     appears in BOTH the useFormStack Returns table (Zone A) AND the useFormStackActions
     Returns table (Zone B). A single-row oldText is therefore NOT unique and the edit
     tool will reject it (or match the wrong one). Each edit MUST use a multi-line block:
       - Zone A anchor = the `stack` row + the `openForm ... Opens a form and awaits result` row
         + the `closeForm` row. The "and awaits result" suffix + `stack` row are unique to Zone A.
       - Zone B anchor = the `openForm ... Opens a form |` row (SHORT form, no "and awaits")
         + the `closeForm` row + the `popToIndex ... Navigates to form at index` row.
         The short "Opens a form |" + "Navigates to form at index" text is unique to Zone B. -->

<!-- CRITICAL: LINE NUMBERS ARE NOT ANCHORS. Sibling P1.M2.T1.S1 (running in parallel)
     expands the FormStackProvider Props area (~line 144) into a multi-line block, which
     shifts every line below it DOWN. If S1 lands first, Zones A/B/C will no longer be at
     ~313/362/509. ALWAYS locate them by their CONTENT (the exact text blocks in the
     Implementation Blueprint), never by line number. `grep -n` to find current lines. -->

<!-- GOTCHA: Table cells must escape the pipe character: write `Promise<T \| undefined>`
     (backslash-pipe) inside markdown table rows, exactly as the existing rows already do.
     In the tsx TYPE BLOCK (Zone C), do NOT escape — write `Promise<T | undefined>` plainly. -->

<!-- GOTCHA: popToIndex is typed `(index: number) => void` (fire-and-forget) even though the
     implementation in FormStackProvider.tsx is `async`. The README must reflect the PUBLIC
     TYPE (void), not the async impl. Source: src/types/context.ts line 82. -->

<!-- GOTCHA: cancelForm is typed `() => Promise<void>`. The README must show the Promise
     return type in BOTH the Returns tables (Zone A + B) and the type block (Zone C).
     Source: src/types/context.ts line 97. -->

<!-- GOTCHA: Do NOT touch the useFormStack destructuring example
     (`const { stack, openForm, closeForm } = useFormStack();`). It is a USAGE example that
     destructures only what that component uses (openForm). It is not a surface enumeration;
     leaving it as a subset destructure is idiomatic and correct. -->

<!-- GOTCHA: The Hostable Viewport section (P1.M2.T2.S1) does not exist yet. Do NOT link
     cancelForm's description to it, and do NOT create it. Keep the description self-contained
     ("resolves its deferred with undefined; honors confirmOnCancel; no-op on an empty stack"). -->
```

---

## Implementation Blueprint

### Data models and structure

No data models. This is a Markdown documentation edit. The structured assets are
**table rows** and **one type line**, all fixed by the source signatures:

```markdown
# cancelForm Returns-table row (Zones A + B — identical content)
| `cancelForm` | `() => Promise<void>` | Cancels the top form (resolves its deferred with `undefined`; honors `confirmOnCancel`). No-op on an empty stack |

# popToIndex Returns-table row (Zone A is NEW; Zone B is a CLARIFICATION of the existing row)
| `popToIndex` | `(index: number) => void` | Navigates to the form at `index`, cancelling all deeper forms (used by `<Breadcrumbs/>`) |

# cancelForm type-block line (Zone C)
  cancelForm: () => Promise<void>;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EDIT README.md Zone A — useFormStack Returns table (add popToIndex + cancelForm)
  - TARGET FILE: README.md
  - LOCATE BY CONTENT (not line number): the `#### useFormStack` entry's `**Returns:**`
        table whose rows are `stack` / `openForm ... Opens a form and awaits result` /
        `closeForm`. (Currently ~lines 313-319; will shift after P1.M2.T1.S1 lands.)
  - OLD TEXT (exact 3-row block — verified unique via the `stack` row + "and awaits result"):
        | `stack` | `readonly StackEntry[]` | Current form stack |
        | `openForm` | `<T>(options) => Promise<T \| undefined>` | Opens a form and awaits result |
        | `closeForm` | `() => void` | Closes the current form |
  - NEW TEXT: the same 3 rows + 2 new rows (popToIndex, then cancelForm) — see
        "Exact Replacement" §A below.
  - FOLLOW pattern: the existing useFormStackActions Returns table (header row +
        backticked cells + escaped-pipe `Promise<T \| undefined>`).
  - NAMING: property keys `popToIndex`, `cancelForm` (exact camelCase — match source/PRD).
  - GOTCHA: keep `Promise<T \| undefined>` (escaped pipe) in table cells.
  - GOTCHA: do NOT change the destructuring example above the table.

Task 2: EDIT README.md Zone B — useFormStackActions Returns table (add cancelForm + clarify popToIndex)
  - TARGET FILE: README.md
  - LOCATE BY CONTENT: the `#### useFormStackActions` entry's `**Returns:**` table whose
        rows are `openForm ... Opens a form |` (SHORT) / `closeForm` /
        `popToIndex ... Navigates to form at index`. (Currently ~lines 362-368.)
  - OLD TEXT (exact 3-row block — verified unique via short "Opens a form |" +
        "Navigates to form at index"):
        | `openForm` | `<T>(options) => Promise<T \| undefined>` | Opens a form |
        | `closeForm` | `() => void` | Closes the current form |
        | `popToIndex` | `(index: number) => void` | Navigates to form at index |
  - NEW TEXT: openForm + closeForm (unchanged) + clarified popToIndex row + new
        cancelForm row — see "Exact Replacement" §B below.
  - GOTCHA: this is the ONLY zone where popToIndex ALREADY exists — you are REPLACING
        its description (clarifying), not adding a new row.

Task 3: EDIT README.md Zone C — FormStackActions type block (add cancelForm line)
  - TARGET FILE: README.md
  - LOCATE BY CONTENT: the `#### FormStackActions` entry's ```tsx interface block
        containing openForm/closeForm/popToIndex members. (Currently ~lines 509-517.)
  - OLD TEXT (exact block — verified unique):
        ```tsx
        interface FormStackActions {
          openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
          closeForm: () => void;
          popToIndex: (index: number) => void;
        }
        ```
  - NEW TEXT: the same block with `  cancelForm: () => Promise<void>;` appended before
        the closing `}` — see "Exact Replacement" §C below.
  - GOTCHA: inside the tsx block do NOT escape the pipe — write `Promise<T | undefined>`
        plainly (only table cells escape it).

Task 4: VALIDATE (no edits — run commands)
  - RUN: grep -c cancelForm README.md            → expect ≥ 3 (the contract gate).
  - RUN: grep -n cancelForm README.md            → confirm 2 table rows (Zones A+B) +
          1 type line (Zone C).
  - RUN: grep -n popToIndex README.md            → expect 3 hits (Zone A new row +
          Zone B clarified row + Zone C type line).
  - RUN: npm run type-check                       → expect exit 0 (no-regression).
  - RUN: npm test                                 → expect all green (no-regression).
  - RUN: npm run build                            → expect success (no-regression).
  - RUN: git status --short                       → expect ONLY README.md modified.
  - If type-check/test/build FAIL: you accidentally edited a source file. Revert
          it (only README.md should change) and re-run.
```

### Exact Replacement

#### §A — Task 1 (Zone A: useFormStack Returns table)

- `oldText` (the exact current 3-row block):

  ```markdown
  | `stack` | `readonly StackEntry[]` | Current form stack |
  | `openForm` | `<T>(options) => Promise<T \| undefined>` | Opens a form and awaits result |
  | `closeForm` | `() => void` | Closes the current form |
  ```

- `newText` (add 2 rows after `closeForm`):

  ```markdown
  | `stack` | `readonly StackEntry[]` | Current form stack |
  | `openForm` | `<T>(options) => Promise<T \| undefined>` | Opens a form and awaits result |
  | `closeForm` | `() => void` | Closes the current form |
  | `popToIndex` | `(index: number) => void` | Navigates to the form at `index`, cancelling all deeper forms (used by `<Breadcrumbs/>`) |
  | `cancelForm` | `() => Promise<void>` | Cancels the top form (resolves its deferred with `undefined`; honors `confirmOnCancel`). No-op on an empty stack |
  ```

#### §B — Task 2 (Zone B: useFormStackActions Returns table)

- `oldText` (the exact current 3-row block):

  ```markdown
  | `openForm` | `<T>(options) => Promise<T \| undefined>` | Opens a form |
  | `closeForm` | `() => void` | Closes the current form |
  | `popToIndex` | `(index: number) => void` | Navigates to form at index |
  ```

- `newText` (clarify popToIndex description + add cancelForm row):

  ```markdown
  | `openForm` | `<T>(options) => Promise<T \| undefined>` | Opens a form |
  | `closeForm` | `() => void` | Closes the current form |
  | `popToIndex` | `(index: number) => void` | Navigates to the form at `index`, cancelling all deeper forms (used by `<Breadcrumbs/>`) |
  | `cancelForm` | `() => Promise<void>` | Cancels the top form (resolves its deferred with `undefined`; honors `confirmOnCancel`). No-op on an empty stack |
  ```

#### §C — Task 3 (Zone C: FormStackActions type block)

- `oldText` (the exact current block, including the ```tsx fences):

  ````markdown
  ```tsx
  interface FormStackActions {
    openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
    closeForm: () => void;
    popToIndex: (index: number) => void;
  }
  ```
  ````

- `newText` (append `cancelForm: () => Promise<void>;` before the closing brace):

  ````markdown
  ```tsx
  interface FormStackActions {
    openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
    closeForm: () => void;
    popToIndex: (index: number) => void;
    cancelForm: () => Promise<void>;
  }
  ```
  ````

> **Note on the `edit` tool:** all three `oldText` blocks above are verified unique in
> the current `README.md` (see the Uniqueness Gotcha in Known Gotchas). They may be
> applied as three separate `edit` calls, or as a single `edit` call with three
> `edits[]` entries (they are non-overlapping and each `oldText` is independently
> unique). Backticks and backslash-pipes inside the values are literal — pass them as-is.

### Implementation Patterns & Key Details

```markdown
<!-- PATTERN: Returns table (from readme_gap_map.md template (b)):
     **Returns:**
     (blank line)
     | Property | Type | Description |
     |----------|------|-------------|
     | `name` | `type` | description |
     Use the SAME 3-column header and backtick-each-cell style. Escape `|` as `\|`
     inside `Promise<T \| undefined>`. -->

<!-- PATTERN: type block (from readme_gap_map.md template (c) + existing
     FormStackActions block): a ```tsx interface Name { ... } ``` block with one
     member per line, 2-space indent, semicolon-terminated. Do NOT escape pipes here. -->

<!-- CRITICAL: the three zones must AGREE on the surface. After edits:
     - useFormStack table: stack, openForm, closeForm, popToIndex, cancelForm (5)
     - useFormStackActions table: openForm, closeForm, popToIndex, cancelForm (4)
     - FormStackActions type: openForm, closeForm, popToIndex, cancelForm (4)
     These mirror src/hooks/useFormStack.ts:173 and src/types/context.ts:53-99 exactly. -->

<!-- CRITICAL: the cancelForm description must state BOTH:
     - "resolves its deferred with undefined" (the promise-resolution semantics)
     - "honors confirmOnCancel" (shows the confirmation dialog when the top form asked)
     - "No-op on an empty stack" (from the JSDoc + PRD)
     Source consensus: src/types/context.ts:83-97, PRD §5.2 h4.3. -->

<!-- CRITICAL: the popToIndex description must state BOTH:
     - "cancelling all deeper forms" (i.e. all forms after the target index are
       resolved with undefined — from context.ts:79)
     - "used by <Breadcrumbs/>" (from PRD §5.2 h4.4 + context.ts:78)
     Source consensus: src/types/context.ts:78-81, PRD §5.2 h4.4. -->
```

### Integration Points

```yaml
README.md — Zone A (useFormStack Returns table):
  - ADD rows: popToIndex, cancelForm (after the existing closeForm row).
  - PRESERVE: the destructuring example above the table (do NOT expand it).

README.md — Zone B (useFormStackActions Returns table):
  - REPLACE the popToIndex row description (clarify: "cancelling all deeper forms; used by <Breadcrumbs/>").
  - ADD row: cancelForm (after the clarified popToIndex row).
  - PRESERVE: openForm + closeForm rows unchanged.

README.md — Zone C (FormStackActions type block):
  - ADD line: `  cancelForm: () => Promise<void>;` (before the closing `}`).
  - PRESERVE: the ```tsx fences and the other three members unchanged.

CROSS-LINKS: NONE in this PRP. The Hostable Viewport section (P1.M2.T2.S1) does not
          exist yet; do not link to it. (P1.M2.T2.S1 may later add a cross-link FROM
          that section TO the cancelForm row, but that is out of scope here.)

SOURCE FILES: NONE modified (Mode B).
PRD.md / tasks.json / prd_snapshot.md / CHANGELOG.md: NONE modified (read-only).
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
cd /home/dustin/projects/geoform
# The contract gate — cancelForm must now appear in ≥ 3 places (2 tables + 1 type line).
grep -c cancelForm README.md        # EXPECT: >= 3  (was 0)
grep -n cancelForm README.md        # EXPECT: one row in useFormStack table,
                                    #         one row in useFormStackActions table,
                                    #         one line in FormStackActions type block.

# popToIndex must now appear in 3 places (useFormStack table + useFormStackActions table + type).
grep -n popToIndex README.md        # EXPECT: 3 hits; verify each description is accurate.

# Confirm the three zones still have valid table structure / fences.
grep -n "useFormStack\|FormStackActions" README.md   # locate the 3 zones to eyeball
```

### Level 2: Markdown Structure (Component Validation)

```bash
cd /home/dustin/projects/geoform
# Zone A — useFormStack Returns table now has 5 rows.
sed -n '/#### useFormStack/,/^---$/p' README.md | grep -E '^\| `'   # EXPECT: 5 table rows
# Zone B — useFormStackActions Returns table now has 4 rows + clarified popToIndex.
sed -n '/#### useFormStackActions/,/^---$/p' README.md | grep -E '^\| `'   # EXPECT: 4 table rows
# Zone C — FormStackActions type block now has 4 members.
sed -n '/#### FormStackActions/,/^```$/p' README.md | grep -E ': \('   # EXPECT: 4 member lines

# Confirm the popToIndex description was clarified (no longer the terse "Navigates to form at index").
grep -n "Navigates to form at index" README.md   # EXPECT: 0 hits (replaced by clarified wording)
grep -n "cancelling all deeper forms" README.md  # EXPECT: 2 hits (Zones A + B)

# Confirm the escaped-pipe style is intact in table cells (not broken into extra columns).
grep -n 'Promise<T \\\\| undefined>' README.md    # EXPECT: hits with the escaped pipe
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
#   - The useFormStack Returns table renders 5 rows (3 cols each).
#   - The useFormStackActions Returns table renders 4 rows (3 cols each).
#   - The FormStackActions type block renders 4 members inside the tsx fence.
#   - No table row spilled into an extra column (escaped-pipe check).
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

- [ ] `grep -c cancelForm README.md` ≥ 3 (the contract gate).
- [ ] `npm run type-check` exits 0 (no-regression).
- [ ] `npm test` all green (no-regression).
- [ ] `npm run build` succeeds (no-regression).
- [ ] `git status --short` shows ONLY `README.md`.

### Feature Validation

- [ ] `useFormStack` Returns table has `popToIndex` AND `cancelForm` rows (5 rows total).
- [ ] `useFormStackActions` Returns table has a `cancelForm` row (4 rows total).
- [ ] `popToIndex` description in BOTH tables says "cancelling all deeper forms" + "used by `<Breadcrumbs/>`".
- [ ] `cancelForm` description says "resolves its deferred with `undefined`" + "honors `confirmOnCancel`" + "No-op on an empty stack".
- [ ] `FormStackActions` type block contains `cancelForm: () => Promise<void>;`.
- [ ] The three zones AGREE on the surface (5 / 4 / 4 members as specified).

### Code Quality Validation

- [ ] Returns-table column order/style (3 cols: Property | Type | Description) matches existing tables.
- [ ] Type-block style (```tsx interface { ... } ```, one member/line, semicolons) matches the existing block.
- [ ] Escaped pipe `Promise<T \| undefined>` used in table cells; plain pipe in the tsx block.
- [ ] No sibling-task sections were edited (scope guard — see Known Gotchas).
- [ ] No source files, PRD.md, tasks.json, prd_snapshot.md, or CHANGELOG.md modified.

### Documentation & Deployment

- [ ] The new content is self-consistent with PRD §5.2 (h4.3/h4.4) and the source JSDoc.
- [ ] The new content is consistent with `src/hooks/useFormStack.ts:173` (the surface).

---

## Anti-Patterns to Avoid

- ❌ Don't edit any file other than `README.md`. This is Mode B (docs-only). In particular
  don't touch `src/`, `PRD.md`, `tasks.json`, `prd_snapshot.md`, or `CHANGELOG.md`.
- ❌ Don't edit sibling-task README sections. The FormStackProvider Props area (~line 144)
  is owned by **P1.M2.T1.S1** (parallel — its expansion will SHIFT your line numbers, so
  anchor by content). The `FormStackViewport` entry, `useFormStackViewport` hook,
  `FormStackViewportValue` type, the Hostable Viewport section, and the Common Pitfall are
  owned by P1.M2.T1.S3/S4 and P1.M2.T2.S1/S2. Touch ONLY Zones A/B/C.
- ❌ Don't use a single-row `oldText` for the `closeForm` row — it is NOT unique (appears in
  two tables). Always use the multi-line blocks specified in the Implementation Blueprint.
- ❌ Don't anchor edits by line number. P1.M2.T1.S1 shifts lines below ~146. Anchor by the
  exact text blocks (use `grep -n` to find current locations).
- ❌ Don't forget to escape the pipe in table cells: `Promise<T \| undefined>`. An
  unescaped `|` will split the cell into extra columns and break the table render.
- ❌ Don't escape the pipe in the tsx type block — there it must be plain `Promise<T | undefined>`.
- ❌ Don't type `popToIndex` as `async` or `Promise<...>` in the README. The PUBLIC type is
  `(index: number) => void` (fire-and-forget). The async impl is an internal detail.
- ❌ Don't drop "No-op on an empty stack" from the `cancelForm` description — it is in the
  JSDoc and PRD and is the key safety fact for host-window wiring.
- ❌ Don't expand the `useFormStack` destructuring example. It intentionally destructures a
  subset (usage example, not a surface enumeration).
- ❌ Don't link `cancelForm` to the Hostable Viewport section. That section does not exist
  yet (P1.M2.T2.S1); a dangling link is worse than no link.
- ❌ Don't add a markdown linter or new tooling. None is configured; validation is grep +
  no-regression build/test + visual render check.

---

## Confidence Score

**9.5 / 10** for one-pass success. This is three small, content-anchored Markdown edits
at verified-unique text blocks in `README.md`, with exact old/new text specified verbatim
above. The `cancelForm`/`popToIndex` signatures and descriptions are confirmed against
three independent sources (`src/types/context.ts`, `src/hooks/useFormStack.ts:173`,
PRD §5.2 h4.3/h4.4) plus the type test that locks the four-member contract. The only
residual half-point is the **line-number shift risk** from the parallel sibling
P1.M2.T1.S1 — fully mitigated by making every anchor content-based (exact text blocks),
so the implementer locates zones with `grep -n` rather than line numbers.
