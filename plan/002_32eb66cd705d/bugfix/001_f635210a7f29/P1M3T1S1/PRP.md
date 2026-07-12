# PRP — P1.M3.T1.S1: Update README.md (onError routing, FormStackViewportValue, FormErrorBoundary, duplicate-ID)

---

## Goal

**Feature Goal**: Sync `README.md` to accurately reflect the four already-merged
adversarial-QA fixes (P1.M1 / P1.M2). The README currently contains **four** stale
or missing pieces that contradict the shipped behavior: (a) the 'Error Boundaries'
section inverts the `onError` contract, (b) the `FormStackViewportValue` type block
still shows the leaked internal shape (`InternalStackEntry[]` + `onCancelRequest`),
the `useFormStackViewport` hook section still claims the value is spreadable onto
`<FormStackRenderer/>`, (c) the `FormErrorBoundary` section documents no `showError`
method, and (d) nothing mentions the dev-mode duplicate-ID warning. This task rewrites
those five spots so the public docs match the source.

**Deliverable**: Edits to **ONE** file only — `README.md`. No source, no types, no
tests, no PRD, no tasks.json are touched. Five localized edits (the four contract
items, with item (b) requiring a correlated rewrite of the hook section because it
makes the identical stale InternalStackEntry-leakage claims):

1. **Error Boundaries** section (~L737) — rewrite to correctly describe form-invoked
   `onError` → `FormErrorBoundary` routing; no stack mutation; `openForm()` never
   rejects (PRD §9).
2. **FormStackViewportValue** type section (~L603) — replace the type block with the
   sanitized interface (`stack: readonly StackEntry[]`; `onClose: () => void`); drop
   `onCancelRequest`; remove the InternalStackEntry Note; correct the prose.
3. **useFormStackViewport** hook section (~L464) — rewrite the stale "props required by
   FormStackRenderer / assignable to FormStackRendererProps / spread directly" prose
   and the `{...viewport}` example to the sanitized read-only read use-case.
   *(Correlated with item 2 — same stale InternalStackEntry-leakage claims; required
   to satisfy the OUTPUT "no stale InternalStackEntry-leaking documentation".)*
4. **FormErrorBoundary** section (~L245) — add a **Methods** subsection documenting
   `showError(error)`.
5. **OpenFormOptions** section (~L530) — add a `> **Note:**` callout about the
   dev-mode duplicate-ID warning (PRD §5.2).

**Success Definition**:
- The README contains **no** occurrence of: `// onError is called when the error
  boundary catches an error`, `InternalStackEntry`, "assignable to
  `FormStackRendererProps`", or "spread directly onto the renderer".
- The `FormStackViewportValue` definition shows `stack: readonly StackEntry[]` and
  `onClose: () => void` only.
- The `useFormStackViewport` example reads `viewport.stack` for display and never
  spreads onto `<FormStackRenderer/>`.
- The `FormErrorBoundary` section lists a `showError(error)` method.
- The `OpenFormOptions` section notes the dev-mode duplicate-ID warning.
- `npx tsc --noEmit` still exits 0 (README is not compiled; confirms nothing else
  moved) and `npx vitest run` is still all green (README is not tested).
- `git status --short` shows `README.md` plus (only) the files the parallel
  `P1.M2.T2.S1` item edits — NOT any file this task owns beyond `README.md`.

---

## User Persona (if applicable)

**Target User**: A `geoform` consumer reading the README to learn the `onError`
contract, the viewport hook/type, or the error-boundary API — and the maintainer
cutting the 0.2.x changeset docs.

**Use Case**: The consumer writes a form that calls `onError` on a failed save and
needs to know what happens (does `await openForm()` throw? does the form close?).
They also reach for `useFormStackViewport()` to render a host header of open forms and
need the accurate (sanitized) return shape.

**Pain Points Addressed**: Today the README tells the consumer the *opposite* of what
the code does for `onError`, shows an `InternalStackEntry`-leaking public type that no
longer exists, and shows a `<FormStackRenderer {...viewport}/>` example that no longer
typechecks. After this task the docs match the shipped behavior.

---

## Why

- **Closes the documentation leg of all four fixes.** P1.M1 (Issues 1–2) and P1.M2
  (Issues 3–4) shipped source + tests; the README was left describing the *old*
  behavior. This is the explicit P1.M3 milestone ("Changeset-Level Documentation
  Sync").
- **The `onError` inversion is the highest-risk stale doc.** Issue 1 changed the
  contract: `onError` no longer rejects `openForm()` or pops the stack. A consumer who
  trusts the current README will write code assuming the old (rejecting) semantics.
- **The viewport hook/type rewrite is load-bearing for Issue 3.** The whole point of
  Issue 3 was "no internal-type leakage"; the README must not keep advertising the leak
  (and a non-typechecking spread example).
- **`showError` is now part of the public surface** (used by `FormStackRenderer` to
  route form-invoked errors) and is undocumented.
- **Low risk.** Markdown-only edits; no compiled/tested artifact changes. The only
  failure mode is a stale-claim grep not clearing — caught by the Level-3 grep gates.

---

## What

Rewrite five localized regions of `README.md` to match the shipped source. No other
file changes.

### Scope (EXACT — do only this)

1. **`README.md` 'Error Boundaries' section** (~L737) — replace the whole section body
   (heading through the closing of its code fence, before `### Custom Breadcrumb
   Styling`) with a corrected version describing BOTH render errors and form-invoked
   `onError`, and the no-mutation / no-reject / Retry-pending / Dismiss-undefined
   semantics (PRD §9). Exact oldText/newText in §A.
2. **`README.md` 'FormStackViewportValue' type section** (~L603) — replace the section
   (heading through the InternalStackEntry Note, before `## Advanced Usage`) with the
   sanitized definition + corrected prose. Exact oldText/newText in §B.
3. **`README.md` 'useFormStackViewport' hook section** (~L464) — replace the section
   (heading through the Returns table row, before the `---` + `### Types`) with a
   sanitized read-only-read description + corrected example. Exact oldText/newText in
   §C.
4. **`README.md` 'FormErrorBoundary' section** (~L245) — insert a **Methods**
   subsection (one table row) between the Props table and `**CSS Classes:**`. Exact
   oldText/newText in §D.
5. **`README.md` 'OpenFormOptions' section** (~L530) — insert a `> **Note:**` callout
   between the definition code-fence and the `---` separator. Exact oldText/newText in
   §E.

**Do NOT** touch: the FormErrorBoundary Props-table `onError` row (L268 — it describes
the boundary's own componentDidCatch logging prop, which is still accurate; the new
Methods note disambiguates `showError` from it), the FormProps `onError` one-liner
(L524 — terse but not false; the rich detail lives in the Error Boundaries section and
in `src/types/form.ts` JSDoc), the 'Confirmation Dialogs' section (Issue 2 has no
user-facing behavior change), any source/type/test file, `PRD.md`, or `tasks.json`.

### Success Criteria

- [ ] Error Boundaries section states the form CALLS `onError` to signal an error which
      is ROUTED to the boundary; the stack is NOT mutated; `openForm()` does NOT reject.
- [ ] No occurrence of `// onError is called when the error boundary catches an error`.
- [ ] `FormStackViewportValue` definition shows `stack: readonly StackEntry[]` and
      `onClose: () => void`; no `onCancelRequest`; no `InternalStackEntry`.
- [ ] `useFormStackViewport` section never claims spreadability onto
      `<FormStackRenderer/>`; its example reads `viewport.stack` for display only.
- [ ] No occurrence of `InternalStackEntry`, "assignable to `FormStackRendererProps`",
      or "spread directly onto the renderer" anywhere in the README.
- [ ] `FormErrorBoundary` section has a Methods table row for `showError(error)`.
- [ ] `OpenFormOptions` section has a Note callout about the dev-mode duplicate-ID
      warning.
- [ ] `npx tsc --noEmit` exit 0; `npx vitest run` all green (no regression).
- [ ] `git status --short` shows `README.md` (plus only the parallel S1 item's files,
      if it landed concurrently) — NOT any other file this task owns.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** Every edit is specified as a byte-accurate
`oldText` → `newText` pair (§A–§E) drawn from a direct read of the current `README.md`.
The shipped behavior each edit must reflect was verified against the actual source
(`src/components/FormErrorBoundary.tsx`, `FormStackRenderer.tsx`,
`FormStackProvider.tsx`, `src/types/context.ts`, `src/types/form.ts`,
`src/hooks/useFormStackViewport.ts`) — see `research/source_verification.md`. No
inference is required; the implementer applies five `edit` calls and runs the grep +
type/test gates.

### Documentation & References

```yaml
# MUST READ — the verified source of truth for what the README must now say
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/P1M3T1S1/research/source_verification.md
  why: Confirms, against the ACTUAL src/, the exact post-fix behavior of all four
        issues (onError routing, sanitized viewport type, showError method, duplicate-ID
        guard) AND the complete README stale-reference inventory (line-by-line).
  critical: The grep inventory lists EVERY stale line (467-469, 469-481, 490, 606,
        616, 620, 624-627, 744). The §A–§E edits below cover all of them. Do not
        "discover" additional edits — the inventory is exhaustive.

# MUST READ — the authoritative fix descriptions (why each README claim changed)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/issue_analysis.md
  why: Issue 1 (showError + handleError rework → no reject/onClose), Issue 3
        (sanitized FormStackViewportValue + internal context type), Issue 4
        (dev-mode duplicate-ID warning). Issue 2 is explicitly "no user-facing change".
  section: "## Issue 1/3/4 (…) Fix Strategy"

# PRIMARY EDIT TARGET — the only file this task modifies
- file: README.md
  why: All five edits land here. The exact current text of each edit region is quoted
        verbatim in §A–§E oldText (verified unique within the file).
  pattern: "README uses `#### Heading`, fenced ```tsx blocks, GitHub-style `> **Note:**`
        callouts, and Props/Methods tables. New prose mirrors these exactly (see §A–§E
        newText)."
  gotcha: README escapes generic type brackets in some headings (e.g. `#### FormProps\<T\>`)
        — but NOT inside fenced code blocks. The edited headings (FormStackViewportValue,
        useFormStackViewport, FormErrorBoundary, OpenFormOptions-with-\<T\>) are NOT
        being renamed, so do not touch the escaping. Inside code fences, write plain
        `<T>`.

# VERIFIED SHIPPED BEHAVIOR (read to confirm prose accuracy — do NOT edit these)
- file: src/components/FormErrorBoundary.tsx
  why: Confirms `public showError(error: Error): void { this.setState({ hasError: true,
        error }); }` exists and its JSDoc (no componentDidCatch / no onError prop fire
        for imperatively-set errors). Drives §D Methods row wording.
- file: src/components/FormStackRenderer.tsx
  why: Confirms handleError now routes to `boundaryRefs.current.get(entry.id)?.showError(err)`
        with NO reject and NO onClose; the boundary's onDismiss resolves undefined +
        onClose (cancel semantics). Drives §A prose.
- file: src/types/context.ts
  why: Confirms public `FormStackViewportValue { stack: readonly StackEntry[]; onClose:
        () => void }` (no onCancelRequest); internal `FormStackViewportContextValue`
        carries the full internal stack. Drives §B.
- file: src/hooks/useFormStackViewport.ts
  why: Confirms the hook maps internal → `{ id, label }[] + onClose` via useMemo;
        returns null outside provider. Drives §C example.
- file: src/components/FormStackProvider.tsx
  why: Confirms the dev-mode `console.warn` in openForm for duplicate id + the
        `[FormStack] Duplicate form id "…" detected` message. Drives §E callout.

# PARALLEL-SAFETY (consume, do not overlap)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/P1M2T2S1/PRP.md
  why: The parallel item edits FormStackProvider.tsx, stack.ts, and
        FormStackProvider.test.tsx (Issue 4 source). It does NOT touch README.md. ZERO
        file overlap. At validation time `git status --short` will list those three
        files IN ADDITION to README.md if S1 landed first — that is expected, not a
        scope violation by THIS task.
  critical: Do NOT edit any of S1's three files. This task touches README.md ONLY.
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── README.md                                      # ← THE ONLY FILE EDITED (5 regions)
├── src/                                           # READ-ONLY (verify behavior; do not edit)
│   ├── components/FormErrorBoundary.tsx           #   showError(error) exists
│   ├── components/FormStackRenderer.tsx           #   handleError → showError (no reject/onClose)
│   ├── components/FormStackProvider.tsx           #   openForm dev-mode duplicate-ID warn (parallel S1)
│   ├── types/context.ts                           #   sanitized FormStackViewportValue
│   ├── types/form.ts                              #   onError JSDoc (rich; README FormProps stays terse)
│   └── hooks/useFormStackViewport.ts              #   maps internal → public
└── plan/002_32eb66cd705d/bugfix/001_f635210a7f29/
    ├── architecture/issue_analysis.md             # authoritative fix strategy per issue
    └── P1M3T1S1/                                  # ← THIS PRP + research/
```

### Desired Codebase tree with files to be changed

```bash
README.md                                          # MODIFIED — 5 localized region rewrites (§A–§E)
# (no new files; no source/type/test changes)
```

### Known Gotchas of our codebase & Library Quirks

```markdown
<!-- CRITICAL: This is a Markdown-only task. The validation gates are `npx tsc --noEmit`
     and `npx vitest run` (to confirm NOTHING ELSE regressed — README itself is neither
     compiled nor tested). Do NOT run ruff/mypy/pytest/uv. The REAL gate is the
     Level-3 stale-reference grep (it must return empty for the banned phrases). -->

<!-- CRITICAL: There is NO markdown linter configured (package.json has none). So there
     is no "lint pass" for the README; correctness is enforced by the grep gates + a
     human read. Keep markdown valid (blank line before/after fenced blocks and tables;
     GitHub renders tables only with a blank line preceding them). -->

<!-- CRITICAL: scope = README.md ONLY. The parallel item P1.M2.T2.S1 edits
     FormStackProvider.tsx / stack.ts / FormStackProvider.test.tsx. At validation time
     `git status --short` may list those three files too — that is S1's work, not yours.
     Verify YOU only touched README.md via `git diff --name-only README.md` and confirm
     no OTHER file in YOUR commit set. -->

<!-- GOTCHA: README escapes angle brackets in SOME headings (e.g. `#### FormProps\<T\>`),
     but NOT inside fenced code blocks. None of the five edits renames a heading, so do
     not alter the escaping. Inside the OpenFormOptions fenced block (§E context) and
     any code you write, use plain `<T>` / `<FormStackViewport/>` (no backslash). -->

<!-- GOTCHA: the §D Methods table MUST be preceded by a blank line and followed by a
     blank line before `**CSS Classes:**`, or GitHub will not render the table (it would
     merge into the preceding Props table or the following heading). The §A–§E newText
     blocks already include these blank lines — preserve them. -->

<!-- GOTCHA: do NOT edit the FormErrorBoundary Props-table `onError` row (L268). It
     describes the boundary's own componentDidCatch logging callback (still accurate).
     The new Methods row for `showError` explicitly states it does NOT fire that prop,
     which disambiguates without touching the row. -->

<!-- GOTCHA: do NOT enrich the FormProps `onError` one-liner (L524). It is terse but not
     false; the full onError contract now lives in the rewritten Error Boundaries
     section (§A) and in src/types/form.ts JSDoc. Over-editing it would expand scope. -->

<!-- GOTCHA: anchor links in newText use GitHub's slug rules: lowercase, spaces→hyphens,
     `<`,`>`,`\` stripped. So `#### FormStackViewportValue` → #formstackviewportvalue and
     `#### FormStackViewport` → #formstackviewport. The §B/§C cross-links use exactly
     these slugs. -->
```

---

## Implementation Blueprint

### Data models and structure

None. This task edits Markdown prose and fenced type blocks only; no runtime data.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EDIT README.md — §A Error Boundaries section (~L737)
  - LOCATE the '### Error Boundaries' heading through the closing ``` of its code fence,
        immediately before '### Custom Breadcrumb Styling'. Exact current text in §A
        oldText (verified unique — the `// onError is called when the error boundary
        catches an error` line appears once).
  - REPLACE with §A newText: describes (1) render errors caught by the boundary and
        (2) form-invoked onError routed to the boundary via showError; states the stack
        is NOT mutated and openForm() does NOT reject (T | undefined holds, PRD §9);
        Retry = re-mount + stays pending; Dismiss = resolves undefined (cancel).
  - GOTCHA: keep the ```tsx fenced block balanced (one open, one close).

Task 2: EDIT README.md — §B FormStackViewportValue type section (~L603)
  - LOCATE '#### FormStackViewportValue' through the InternalStackEntry Note, immediately
        before '## Advanced Usage'. Exact current text in §B oldText (verified unique).
  - REPLACE with §B newText: sanitized prose + type block showing
        `stack: readonly StackEntry[]` and `onClose: () => void` only; a Note that the
        public value is NOT spreadable onto FormStackRenderer; a Note that the hook maps
        each internal entry to id/label only.
  - GOTCHA: remove ALL InternalStackEntry references from this region (type + Note).

Task 3: EDIT README.md — §C useFormStackViewport hook section (~L464)
  - LOCATE '#### useFormStackViewport' through the Returns table row, immediately before
        the '---' + '### Types'. Exact current text in §C oldText (verified unique).
  - REPLACE with §C newText: sanitized read-only-read description; example that reads
        `viewport.stack` for display (maps entries to <li>); Returns row pointing at the
        FormStackViewportValue type (no 'assignable to FormStackRendererProps').
  - GOTCHA: the old example spreads `{...viewport}` onto <FormStackRenderer> — that no
        longer typechecks and is the core stale claim. The new example must NOT spread.

Task 4: EDIT README.md — §D FormErrorBoundary Methods subsection (~L245)
  - LOCATE the last Props row (`| fallback | ReactNode | - | Custom error UI |`) + the
        following blank line + `**CSS Classes:**`. Exact current text in §D oldText
        (verified unique — this row + CSS Classes appears once).
  - REPLACE with §D newText: the same fallback row + a blank line + a **Methods:**
        table (one row: `showError`, `(error: Error) => void`, full description) + a
        blank line + `**CSS Classes:**`.
  - GOTCHA: keep the blank lines around the table or GitHub won't render it.

Task 5: EDIT README.md — §E OpenFormOptions Note callout (~L530)
  - LOCATE the end of the OpenFormOptions definition fence (`  confirmOnCancel?: boolean;
        }` + closing ```) + the following `---` + `#### StackEntry`. Exact current text
        in §E oldText (verified unique).
  - REPLACE with §E newText: the same definition close + a blank line + a `> **Note:**`
        callout about the dev-mode duplicate-ID warning (references FormStackRenderer/
        Breadcrumbs React key collisions + PRD §5.2 + production unchanged) + the
        existing `---` + `#### StackEntry`.
  - GOTCHA: the callout must sit between the code fence and the `---` separator.

Task 6: VALIDATE (no edits — run the gates)
  - RUN: npx tsc --noEmit  → expect exit 0 (README is not compiled; this just confirms
        nothing else moved in your working tree).
  - RUN: npx vitest run  → expect all green (README is not tested; confirms no
        regression from any concurrent work).
  - RUN the Level-3 stale-reference greps (see Validation Loop §Level 3) → each must
        return EMPTY for the banned phrases and NON-empty for the new phrases.
  - RUN: git diff --name-only -- README.md  → expect exactly `README.md`.
  - RUN: git status --short  → expect README.md plus (only) P1.M2.T2.S1's files if it
        landed; verify YOU did not touch any source/type/test file.
```

### Exact Replacement

> Every `oldText` below was read verbatim from the current `README.md` and is unique
> within the file. Apply each as a single `edit` call.

#### §A — Task 1 (Error Boundaries section)

- `oldText`:

  ````markdown
  ### Error Boundaries

  Each form is automatically wrapped in an error boundary. For custom error handling:

  ```tsx
  // In your form component
  function MyForm({ onSubmit, onCancel, onError }: FormProps<Data>) {
    // onError is called when the error boundary catches an error
    // Use it for logging to external services
  }

  // The error boundary provides default UI with:
  // - Error message display
  // - "Try Again" button (re-renders the form)
  // - "Dismiss" button (closes the form)
  ```
  ````

- `newText`:

  ````markdown
  ### Error Boundaries

  Each form is automatically wrapped in its own `FormErrorBoundary`, so a crash in one
  form never affects its parents. The boundary surfaces errors through a single
  consistent Retry / Dismiss UI, and geoform routes **two** kinds of errors into it:

  1. **Render errors** — an exception thrown while the form renders. The boundary
     catches it (`getDerivedStateFromError`) and shows the fallback UI.
  2. **Form-invoked errors** — the form calls its injected `onError` prop to signal an
     application-level error (e.g. a failed save). The provider routes that error to the
     same boundary (via its imperative `showError()` method), so it appears in the
     identical Retry / Dismiss UI.

  ```tsx
  // In your form component — call onError to SIGNAL an error.
  // It is routed TO the boundary; it is not "the boundary catching an error".
  function MyForm({ onSubmit, onCancel, onError }: FormProps<Data>) {
    const handleSave = async () => {
      try {
        const data = await persist();
        onSubmit(data);
      } catch (err) {
        // Surface the error in the boundary's Retry/Dismiss UI.
        // The form stays mounted, the stack is NOT mutated, and the
        // `await openForm()` promise does NOT reject (PRD §9).
        onError(err);
      }
    };
  }

  // The error boundary provides default UI with:
  // - Error message display
  // - "Try Again" button (re-mounts the form; openForm() stays pending)
  // - "Dismiss" button (cancels the form; openForm() resolves undefined)
  ```

  Per PRD §9, an error **does not mutate the stack automatically** and `openForm()`
  **never rejects** on this path — it keeps honouring its `T | undefined` contract.
  **Retry** re-mounts the form (the promise stays pending); **Dismiss** resolves the
  caller's `await openForm()` with `undefined` (cancel semantics). See
  [`FormErrorBoundary`](#formerrorboundary) for the `showError(error)` method that powers
  the form-invoked path.
  ````

#### §B — Task 2 (FormStackViewportValue type section)

- `oldText`:

  ````markdown
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
  ````

- `newText`:

  ````markdown
  #### FormStackViewportValue

  The **sanitized, read-only** value returned by `useFormStackViewport()` (or `null`
  when there is nothing to render). It deliberately exposes **only** the
  display-oriented fields of each open form — `{ id, label? }` — plus the `onClose`
  callback. It does **not** carry the internal stack-entry fields (`component`,
  `deferred`, `confirmOnCancel`) or an `onCancelRequest` callback, so a consumer cannot
  hijack a form's promise resolution (`entry.deferred.resolve(...)`) or mount forms
  directly (PRD §10.1 "no internal-type leakage").

  > **Note:** This public value is intentionally **not** spreadable onto
  > `<FormStackRenderer/>` — that renderer needs the full internal entry, which the
  > public type keeps hidden. Use the zero-prop
  > [`<FormStackViewport/>`](#formstackviewport) component to render the stack; use
  > `useFormStackViewport()` only to *read* the open forms.

  **Definition:**

  ```tsx
  interface FormStackViewportValue {
    /** Read-only stack entries (`{ id, label? }` only — no component/deferred) */
    stack: readonly StackEntry[];
    /** Callback to close/pop the top form */
    onClose: () => void;
  }
  ```

  > **Note:** The public hook maps each internal entry down to its `id`/`label` only;
  > the full entry (with `component`/`deferred`) never leaves the renderer.
  ````

#### §C — Task 3 (useFormStackViewport hook section)

- `oldText`:

  ````markdown
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
  ````

- `newText`:

  ````markdown
  #### useFormStackViewport

  Low-level hook that returns a **sanitized, read-only** view of the open forms — each
  entry as a plain `{ id, label? }` (`StackEntry`) plus the `onClose` callback — or
  `null` when there is nothing to render (empty stack, or used outside a
  `<FormStackProvider>`).

  Use it when you want to **read** the open forms for custom rendering (e.g. a host
  header, a summary list, or breadcrumb-like chrome you build yourself) **without**
  mounting the renderer. It exposes only display-oriented fields — never the internal
  `component`/`deferred`/`confirmOnCancel` or an `onCancelRequest` callback (PRD §10.1
  "no internal-type leakage"). Most consumers should use the zero-prop
  [`<FormStackViewport/>`](#formstackviewport) component, which renders the stacked form
  bodies for you.

  ```tsx
  import { useFormStackViewport } from 'geoform';

  function OpenFormsSummary() {
    const viewport = useFormStackViewport();
    if (!viewport) return null;
    // Only safe, display-oriented fields are reachable:
    return (
      <ul>
        {viewport.stack.map((entry) => (
          <li key={entry.id}>{entry.label ?? entry.id}</li>
        ))}
      </ul>
    );
  }
  ```

  **Returns:**

  | Property | Type | Description |
  |----------|------|-------------|
  | `value` | [`FormStackViewportValue`](#formstackviewportvalue) \| `null` | Sanitized view (`{ stack: readonly StackEntry[]; onClose }`), or `null` when the stack is empty or the hook is used outside a `<FormStackProvider>` |
  ````

#### §D — Task 4 (FormErrorBoundary Methods subsection)

- `oldText`:

  ```markdown
  | `fallback` | `ReactNode` | - | Custom error UI |

  **CSS Classes:**
  ```

- `newText`:

  ```markdown
  | `fallback` | `ReactNode` | - | Custom error UI |

  **Methods:**

  | Method | Signature | Description |
  |--------|-----------|-------------|
  | `showError` | `(error: Error) => void` | Imperatively display the Retry / Dismiss fallback UI for a **non-render** error — e.g. a form-invoked `onError`. Sets the same state as a caught render error, so the form stays mounted and the stack is unchanged (PRD §9). Does **not** trigger `componentDidCatch` or the `onError` prop callback (no React error was caught), so perform any logging **before** calling it. |

  **CSS Classes:**
  ```

#### §E — Task 5 (OpenFormOptions Note callout)

- `oldText`:

  ````markdown
    /** If true, shows confirmation dialog before cancel */
    confirmOnCancel?: boolean;
  }
  ```

  ---

  #### StackEntry
  ````

- `newText`:

  ````markdown
    /** If true, shows confirmation dialog before cancel */
    confirmOnCancel?: boolean;
  }
  ```

  > **Note:** Form IDs must be unique across the forms currently on the stack. Pushing
  > a form whose `id` is already present produces a **development-mode warning** (a
  > `console.warn` from `openForm`) because duplicate IDs collide on the React `key`
  > used by `FormStackRenderer` and `Breadcrumbs`, which can cause form instance and
  > state mix-ups. Production behavior is unchanged — the form is still pushed — so
  > uniqueness remains a consumer responsibility (PRD §5.2).

  ---

  #### StackEntry
  ````

> **Note on the `edit` tool:** each `oldText` above is a verbatim, unique region of the
> current `README.md`. They do not overlap. The five edits may be applied as five
> separate `edit` calls (recommended, one per task) — do not merge them, since they are
> in different parts of the file and merging risks a non-unique/overlapping match.

### Implementation Patterns & Key Details

```markdown
<!-- PATTERN: GitHub Note callout. README uses `> **Note:** …` (block-quote, bold label,
     then text). §B/§C/§E all use it. Keep the `>` prefix on every wrapped line. -->

<!-- PATTERN: Props/Methods tables. A blank line BEFORE the table and AFTER it is
     required for GitHub to render it. §D inserts a Methods table between the Props
     table and **CSS Classes:** — the blank lines in §D newText are load-bearing. -->

<!-- PATTERN: fenced ```tsx type blocks mirror the actual TS interface. §B's block must
     match src/types/context.ts FormStackViewportValue (readonly StackEntry[]; onClose).
     Do not invent fields. -->

<!-- CRITICAL: §C's old example is `<FormStackRenderer {...viewport} />` — that no longer
     typechecks (public value is intentionally not spreadable). The new example MUST read
     viewport.stack for display. This is the single most important correctness check. -->

<!-- CRITICAL: §A must INVERT the old claim. Old: "onError is called when the error
     boundary catches an error" (boundary→form). New: form CALLS onError to SIGNAL an
     error, ROUTED TO the boundary (form→boundary). Plus: no stack mutation, no reject. -->

<!-- GOTCHA: anchor links. `[`<FormStackViewport/>`](#formstackviewport)` and
     `[`FormStackViewportValue`](#formstackviewportvalue)` and
     `[`FormErrorBoundary`](#formerrorboundary)` use GitHub slug rules (lowercase,
     strip <,>,\). These slugs match the existing headings exactly. -->
```

### Integration Points

```yaml
README.md — Error Boundaries section:
  - REPLACE: the whole section body (heading → code-fence close).
  - ADD: a trailing prose paragraph + a cross-link to #formerrorboundary.
  - PRESERVE: the '### Custom Breadcrumb Styling' heading that follows (unchanged).

README.md — FormStackViewportValue type section:
  - REPLACE: heading through the InternalStackEntry Note.
  - PRESERVE: the '## Advanced Usage' / '### URL Sync' that follows (unchanged).

README.md — useFormStackViewport hook section:
  - REPLACE: heading through the Returns table row.
  - PRESERVE: the '---' + '### Types' that follows (unchanged).

README.md — FormErrorBoundary section:
  - INSERT: a **Methods:** table between the Props table and **CSS Classes:**.
  - PRESERVE: the Props table (incl. the onError row) and the CSS Classes list.

README.md — OpenFormOptions section:
  - INSERT: a `> **Note:**` callout between the definition fence and the '---'.
  - PRESERVE: the definition block, the '---', and '#### StackEntry' (unchanged).

NO CHANGE (verified / out of scope):
  - FormProps onError one-liner (L524) — terse but not false; detail lives in §A.
  - FormErrorBoundary Props-table onError row (L268) — boundary's own logging prop.
  - Confirmation Dialogs section (Issue 2 = no user-facing change).
  - any src/ file, PRD.md, tasks.json.
```

---

## Validation Loop

### Level 1: Markdown sanity (immediate)

```bash
cd /home/dustin/projects/geoform
# Confirm the five edits landed and markdown fences/tables are well-formed.
grep -n "FormStackViewportValue\|useFormStackViewport\|showError\|Duplicate form id\|Error Boundaries" README.md
# EXPECT: hits in each of the five edited regions. Eyeball that fenced ```tsx blocks are
# balanced and tables have blank lines around them.
```

### Level 2: No regression (type + test gates — README is neither, but confirm nothing else moved)

```bash
cd /home/dustin/projects/geoform
npx tsc --noEmit
# EXPECT: exit 0. README is not compiled; this confirms no source file in YOUR working
# tree was accidentally changed. (If exit non-zero AND the errors are only in files the
# parallel P1.M2.T2.S1 item owns — FormStackProvider.tsx/stack.ts/its test — that is S1's
# in-flight work, not yours. Confirm YOUR diff is README-only: `git diff --name-only`
# should list README.md and nothing you edited.)
npx vitest run
# EXPECT: all green. README is not tested; this confirms no behavioral regression.
```

### Level 3: Stale-reference grep gates (THE real correctness gate)

```bash
cd /home/dustin/projects/geoform
# --- BANNED phrases (each must return EMPTY / exit 1) ---
grep -n "onError is called when the error boundary catches an error" README.md
# EXPECT: no matches.

grep -n "InternalStackEntry" README.md
# EXPECT: no matches (was L616,620,624,627 — all in the old FormStackViewportValue block).

grep -n "assignable to \`FormStackRendererProps\`" README.md
# EXPECT: no matches (was L468,481,490,606).

grep -n "spread directly onto" README.md
# EXPECT: no matches (was L469,606).

grep -n "<FormStackRenderer {...viewport}" README.md
# EXPECT: no matches (the old non-typechecking example).

# --- NEW phrases (each must return ≥ 1 match) ---
grep -n "routed to the same boundary" README.md            # §A form-invoked path
grep -n "does \*\*not\*\* reject\|never rejects" README.md # §A no-reject claim (try both phrasings)
grep -n "readonly StackEntry\[\]" README.md                # §B sanitized stack type
grep -n "showError" README.md                              # §D Methods row (≥2 hits: §A mention + §D row)
grep -n "development-mode warning" README.md               # §E duplicate-ID callout
grep -n "Duplicate form id" README.md                      # §E references the shipped message
```

> If a BANNED phrase still matches: you missed an edit region (re-read §A–§E oldText —
> note the exact line numbers from `research/source_verification.md`). If a NEW phrase
> is missing: the corresponding §A–§E edit did not apply; re-run that edit.

### Level 4: Scope & contract validation

```bash
cd /home/dustin/projects/geoform
# You touched ONLY README.md:
git diff --name-only
# EXPECT: README.md is present. If the parallel P1.M2.T2.S1 item landed concurrently,
# FormStackProvider.tsx, src/types/stack.ts, and FormStackProvider.test.tsx may ALSO
# appear — that is S1's work, NOT yours. Confirm via:
git diff --name-only -- README.md   # → README.md
# and confirm you made NO edits to source/types/tests:
git diff --name-only | grep -vE '^README\.md$' | grep -E '\.(ts|tsx)$' && echo "WARNING: you edited a source file" || echo "OK: no source edits by this task"

# Optional: render-check (if you have a markdown previewer). GitHub renders tables only
# with a preceding blank line — the §D Methods table is the one to eyeball.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npx tsc --noEmit` exit 0 (no accidental source edit).
- [ ] `npx vitest run` all green (no regression).
- [ ] All Level-3 BANNED-phrase greps return empty.
- [ ] All Level-3 NEW-phrase greps return ≥ 1 match.
- [ ] `git diff --name-only -- README.md` → `README.md`; no `.ts`/`.tsx` edited by this task.

### Feature Validation

- [ ] Error Boundaries section: form CALLS onError → routed TO boundary; stack not
      mutated; `openForm()` does not reject; Retry = pending, Dismiss = undefined.
- [ ] `FormStackViewportValue` definition: `stack: readonly StackEntry[]`; `onClose:
      () => void`; no `onCancelRequest`; no `InternalStackEntry`.
- [ ] `useFormStackViewport` example reads `viewport.stack` for display; never spreads
      onto `<FormStackRenderer/>`.
- [ ] `FormErrorBoundary` has a Methods row for `showError(error)`.
- [ ] `OpenFormOptions` has a Note about the dev-mode duplicate-ID warning.

### Code Quality Validation

- [ ] New prose mirrors existing README conventions (`> **Note:**`, fenced ```tsx,
      Props/Methods tables with surrounding blank lines).
- [ ] Anchor links use correct GitHub slugs (`#formstackviewport`,
      `#formstackviewportvalue`, `#formerrorboundary`).
- [ ] No heading renamed (escaping like `\<T\>` left untouched).
- [ ] Scope held to README.md only (Props-table onError row and FormProps onError
      one-liner deliberately left as-is).

### Documentation & Deployment

- [ ] README accurately reflects all four shipped fixes (onError routing, sanitized
      viewport type, showError method, duplicate-ID guard).
- [ ] Issue 2 (concurrent confirmation) correctly left undocumented (no user-facing
      change) — the Confirmation Dialogs section is untouched.

---

## Anti-Patterns to Avoid

- ❌ Don't run ruff/mypy/pytest/uv — this is a Markdown-only task; the gates are
  `npx tsc --noEmit` + `npx vitest run` (regression guards) plus the Level-3 greps
  (the real correctness gate).
- ❌ Don't edit any source/type/test file. This task touches `README.md` ONLY. The
  parallel P1.M2.T2.S1 item owns `FormStackProvider.tsx`/`stack.ts`/its test — leave
  them alone.
- ❌ Don't keep the `<FormStackRenderer {...viewport} />` example in the
  `useFormStackViewport` section — it no longer typechecks (the public value is
  intentionally not spreadable). Replace it with the display-read example.
- ❌ Don't keep the inverted `// onError is called when the error boundary catches an
  error` claim. The form CALLS onError to SIGNAL an error; the provider ROUTES it TO the
  boundary. The two directions are opposites — get this right.
- ❌ Don't leave `InternalStackEntry` anywhere in the README. The whole point of Issue 3
  was "no internal-type leakage"; the public type is now `readonly StackEntry[]`.
- ❌ Don't edit the `FormErrorBoundary` Props-table `onError` row (L268). It documents
  the boundary's own componentDidCatch logging callback (still accurate). Add a Methods
  row for `showError` instead, and note there that `showError` does NOT fire that prop.
- ❌ Don't enrich the `FormProps` `onError` one-liner (L524). It is terse but not false;
  the full contract now lives in the rewritten Error Boundaries section. Over-editing
  expands scope.
- ❌ Don't document Issue 2 (concurrent confirmation) in the README. The contract is
  explicit: "No user-facing behavior change." Leave the Confirmation Dialogs section
  alone.
- ❌ Don't drop the blank lines around the §D Methods table — GitHub will not render a
  table that is flush against the preceding Props table or the following
  `**CSS Classes:**` line.
- ❌ Don't rename any heading or alter `\<T\>` escaping. The edits rewrite section
  *bodies*, not headings.

---

## Confidence Score

**9.5 / 10** for one-pass success. This is a Markdown-only task with five byte-accurate
`oldText` → `newText` edits, each drawn verbatim from a direct read of the current
`README.md` and verified unique. The shipped behavior each edit must reflect was
confirmed against the ACTUAL source (`FormErrorBoundary.tsx`, `FormStackRenderer.tsx`,
`FormStackProvider.tsx`, `types/context.ts`, `types/form.ts`,
`useFormStackViewport.ts`) — not just the architecture prediction — and recorded in
`research/source_verification.md` with a complete line-by-line stale-reference
inventory. The real correctness gate is the Level-3 grep (banned phrases empty, new
phrases present), which is deterministic and self-explanatory. The only half-point of
reservation is GitHub's markdown-table rendering dependency on surrounding blank lines
(§D) and the two non-overlapping prose phrasings the Level-3 grep tolerates for the
no-reject claim — both mitigated by explicit gotchas. Scope is fully isolated from the
parallel P1.M2.T2.S1 item (different file: README.md vs source).
