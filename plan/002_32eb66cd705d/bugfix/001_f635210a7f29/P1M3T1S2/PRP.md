# PRP — P1.M3.T1.S2: Update src/index.ts export JSDoc + verify dist build consistency

---

## Goal

**Feature Goal**: Make the `src/index.ts` **package-entry-point re-export
JSDoc comments** consistent with the already-merged P1.M1 / P1.M2 fixes, then
rebuild `dist/` and assert the published `.d.ts` reflects the sanitized types.
Three re-export comments are currently **stale** and contradict the shipped
behavior: (1) the `FormStackViewportValue` comment claims it is "Structurally
identical to `FormStackRendererProps`", (2) the `useFormStackViewport` comment
references the now-removed `onCancelRequest` and claims the value is the "props
required by `<FormStackRenderer/>`", and (3) the `FormProps` comment never
documents the `onError` prop (which Issue 1 reworked to route to the error
boundary). After the edits, the full type-check + test suite + tsup build must
pass cleanly and the rebuilt `dist/index.d.ts` must show
`FormStackViewportValue.stack` as `readonly StackEntry[]`, no `InternalStackEntry`
in the public export surface, and `FormErrorBoundary.showError`.

**Deliverable**: Edits to **ONE** source file only — `src/index.ts` (three
localized JSDoc rewrites), followed by a clean `dist/` rebuild. No other source
file, no README, no PRD, no tasks.json are touched.

1. **`useFormStackViewport` re-export JSDoc** (~L305) — rewrite to describe the
   sanitized read-only `{ id, label? }[] + onClose` return value; drop
   `onCancelRequest`; drop the "props required by `<FormStackRenderer/>`" /
   "spreadable" framing (PRD §10.1).
2. **`FormStackViewportValue` re-export JSDoc** (~L396, contract a) — rewrite
   to describe the sanitized `readonly StackEntry[]` value that is intentionally
   NOT spreadable onto `<FormStackRenderer/>`; drop "Structurally identical to
   `FormStackRendererProps`".
3. **`FormProps` re-export JSDoc** (~L372, contract b) — add a concise paragraph
   documenting `onError` as routing to the surrounding `FormErrorBoundary`
   (Retry/Dismiss UI; does NOT reject `openForm()`; does NOT mutate the stack;
   PRD §9).
4. **Rebuild + verify**: `npx tsc --noEmit` → 0; `npx vitest run` → all green
   (baseline 311 / 28 files); `npm run build` → clean `dist/`; assert
   `dist/index.d.ts` reflects the sanitized types (see Validation Loop).

**Success Definition**:
- No occurrence in `src/index.ts` of: `onCancelRequest` (in the viewport
  hook/type comments — the `FormStackRenderer` example at L98 is allowed to keep
  it, that's the renderer's own prop), "Structurally identical to
  `FormStackRendererProps`", or "props required by `<FormStackRenderer/>`".
- `FormProps` re-export JSDoc contains an `onError` paragraph citing
  `FormErrorBoundary` routing + the no-reject / no-mutation guarantee (PRD §9).
- `FormStackViewportValue` re-export JSDoc states `readonly StackEntry[]` and
  "not spreadable onto `<FormStackRenderer/>`".
- `npx tsc --noEmit` exits 0; `npx vitest run` is all green; `npm run build`
  succeeds and emits `dist/index.{mjs,cjs,d.ts}` (+ maps).
- `dist/index.d.ts` `FormStackViewportValue.stack` is `readonly StackEntry[]`;
  the public `export { … }` line contains no `InternalStackEntry`;
  `FormErrorBoundary.showError(error: Error)` is present in `dist/index.d.ts`.
- `git status --short` shows `src/index.ts` (plus `README.md` from the parallel
  S1 item, if it landed concurrently) — `dist/*` is gitignored and stays
  untracked.

---

## User Persona (if applicable)

**Target User**: (a) a `geoform` **maintainer** cutting the 0.2.x changeset who
reads `src/index.ts` to confirm the public surface narrative matches the
shipped types, and (b) any **consumer** whose IDE surfaces the index.ts
re-export comment when hovering the package entry. Both currently see stale,
contradictory prose (a removed `onCancelRequest`; a false "structurally
identical" claim; a silent `onError`).

**Use Case**: The maintainer opens `src/index.ts` to sanity-check the four
adversarial-QA fixes before publishing and expects the entry-point comments to
agree with `src/types/*` and `src/hooks/*`.

**Pain Points Addressed**: Source comments that actively contradict the
compiled public types — confusing contributors and undermining trust in the
docs leg of the fix set (this is the last item of the P1.M3 documentation-sync
milestone).

---

## Why

- **Closes the source-comment leg of the documentation sync.** P1.M3.T1.S1
  fixed the `README.md`; this fixes the *package entry point* (`src/index.ts`).
  Both are the "Changeset-Level Documentation Sync" milestone. The definition-
  site JSDoc (`src/types/context.ts`, `src/types/form.ts`,
  `src/hooks/useFormStackViewport.ts`) is already correct from P1.M1/P1.M2 —
  only the index.ts re-export wrappers lagged.
- **The `onCancelRequest` reference is a live falsehood.** Issue 3 removed
  `onCancelRequest` from the *public* `FormStackViewportValue`. The index.ts
  hook comment still names it. A reader trusting index.ts will look for a
  callback that no longer exists on the public type.
- **"Structurally identical to FormStackRendererProps" is the exact claim
  Issue 3 invalidated.** The whole point of the fix was "no internal-type
  leakage" — the public value must NOT be spreadable onto the renderer.
- **`onError` is now part of the `FormProps` contract** (Issue 1) and the
  index.ts summary is the one place it goes unmentioned.
- **The dist rebuild is the integration gate.** It proves the build is clean
  after the edits and reproduces the sanitized `.d.ts` for the changeset.
  (See the CRITICAL INSIGHT in context: index.ts re-export comments do NOT
  flow into `dist/index.d.ts` — that file carries definition-site JSDoc — so
  the rebuild's job is consistency + clean artifact, not "change the dist
  prose".)

---

## What

Rewrite three localized re-export JSDoc blocks in `src/index.ts`, then rebuild
`dist/` and run the full validation matrix. No other file changes.

### Scope (EXACT — do only this)

1. **`src/index.ts` `useFormStackViewport` re-export JSDoc** (~L305-317) —
   replace the comment body (heading `/**` through the closing `*/` above
   `export { useFormStackViewport } from './hooks';`). Exact oldText/newText in
   §Edit-1. *(Correlated with Edit-2 — same stale `onCancelRequest` /
   "spreadable" claim; required to satisfy OUTPUT "source comments consistent
   with the implementation".)*
2. **`src/index.ts` `FormStackViewportValue` re-export JSDoc** (~L396-406,
   contract a) — replace the comment body. Exact oldText/newText in §Edit-2.
3. **`src/index.ts` `FormProps` re-export JSDoc** (~L372, contract b) — INSERT
   an `onError` paragraph between the "Forms receive these callbacks…"
   sentence and the `@typeParam` line. Exact oldText/newText in §Edit-3.
4. **VALIDATE** — run `npx tsc --noEmit`, `npx vitest run`, `npm run build`,
   and the dist grep assertions (see Validation Loop). No edits in this step.

**Do NOT touch**: the `FormStackRenderer` re-export example at L98 (it shows
`onCancelRequest` because the renderer's *own* `FormStackRendererProps` still
takes it — correct), the `FormErrorBoundary` example at L202 (`onError` there
is the boundary's logging prop — correct), any definition-site JSDoc in
`src/types/*` or `src/hooks/*` (already correct), `README.md` (parallel
P1.M3.T1.S1 owns it), `PRD.md`, or `tasks.json`.

### Success Criteria

- [ ] `useFormStackViewport` index.ts comment describes a sanitized read-only
      `{ id, label? }[] + onClose` value and never names `onCancelRequest` or
      "props required by `<FormStackRenderer/>`".
- [ ] `FormStackViewportValue` index.ts comment states `readonly StackEntry[]`,
      calls it sanitized/read-only, and never says "Structurally identical to
      `FormStackRendererProps`".
- [ ] `FormProps` index.ts comment has an `onError` paragraph citing
      `FormErrorBoundary` routing, no-reject, no-mutation (PRD §9).
- [ ] `npx tsc --noEmit` exit 0.
- [ ] `npx vitest run` all green (baseline 311 / 28 files).
- [ ] `npm run build` succeeds; `dist/index.{mjs,cjs,d.ts}` all present.
- [ ] `dist/index.d.ts`: `FormStackViewportValue.stack` is `readonly StackEntry[]`;
      public `export { … }` line has no `InternalStackEntry`; `showError(error: Error)`
      present on `FormErrorBoundary`.
- [ ] `git status --short` shows `src/index.ts` (plus only README.md if S1 landed) —
      no OTHER source file edited by this task.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed
to implement this successfully?_ **Yes.** Every edit is a byte-accurate
`oldText` → `newText` pair (§Edit-1–§Edit-3) drawn from a direct read of the
current `src/index.ts`. The shipped behavior each edit must reflect was verified
against the ACTUAL definition-site source (`src/types/context.ts`,
`src/types/form.ts`, `src/hooks/useFormStackViewport.ts`) and the current
`dist/index.d.ts` — see `research/source_verification.md`. No inference
required; the implementer applies three `edit` calls, rebuilds, and runs the
gates.

### Documentation & References

```yaml
# MUST READ — verified findings (stale-comment inventory, dist mechanics, baseline)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/P1M3T1S2/research/source_verification.md
  why: Confirms the EXACT three stale index.ts regions (with line numbers), the
        NON-stale regions to leave alone (L98 renderer example, L202 boundary
        example), the measured baseline (311/28 tests, tsc exit 0), the dist
        gitignore fact, and the CRITICAL dist-propagation insight.
  critical: The "CRITICAL INSIGHT" section explains WHY index.ts edits do not
        change dist/index.d.ts prose (definition-site JSDoc wins). Do NOT expect
        the new index.ts prose to appear in dist — that is by design. The rebuild
        is for clean-artifact + consistency proof.

# MUST READ — authoritative fix strategy per issue (why each comment is stale)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/issue_analysis.md
  why: Issue 1 (onError → boundary, no reject/onClose), Issue 3 (sanitized
        FormStackViewportValue + internal context type). Drives §Edit-1/2/3 wording.
  section: "## Issue 1" and "## Issue 3"

# PRIMARY EDIT TARGET — the only source file this task modifies
- file: src/index.ts
  why: All three JSDoc rewrites land here. The exact current text of each region
        is quoted verbatim in §Edit-1/2/3 oldText (verified unique within the file).
  pattern: "index.ts uses block JSDoc (/** ... */) above each `export { X } from
        './y'` and `export type { X } from './y'`. New prose mirrors this exactly."
  gotcha: The file re-exports — the JSDoc sits ABOVE the re-export statement, not
        at the definition. Editing here changes SOURCE narrative only, not dist
        (see research CRITICAL INSIGHT).

# VERIFIED DEFINITION-SITE TRUTH (read to confirm wording — do NOT edit these)
- file: src/types/context.ts
  why: Authoritative sanitized `FormStackViewportValue { stack: readonly StackEntry[];
        onClose: () => void }` + the `@internal FormStackViewportContextValue`. The
        index.ts FormStackViewportValue comment must agree with this. Drives §Edit-2.
- file: src/hooks/useFormStackViewport.ts
  why: Authoritative sanitized hook return + rich JSDoc ("sanitized, read-only view …
        never onCancelRequest"). The index.ts hook comment must agree. Drives §Edit-1.
- file: src/types/form.ts
  why: Authoritative `FormProps` with the rich `onError` JSDoc (routes to
        FormErrorBoundary; no reject; no mutation; PRD §9). The index.ts FormProps
        comment should add a CONCISE pointer to this (the rich text lives here).
        Drives §Edit-3.

# DIST MECHANICS
- file: tsup.config.ts
  why: `entry: ['src/index.ts']`, `dts: true`, `clean: true`, `format: ['esm','cjs']`,
        `external: ['react','react-dom']`. Confirms `npm run build` regenerates the
        single bundled `dist/index.d.ts` from the entry, carrying definition-site JSDoc.
- file: package.json
  why: `scripts.build = "tsup"`, `scripts.test = "vitest run"`,
        `scripts.type-check = "tsc --noEmit"`. Confirms the exact validation commands.
        `files: ["dist","README.md","LICENSE"]` confirms dist is the published artifact.

# PARALLEL-SAFETY (consume, do not overlap)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/P1M3T1S1/PRP.md
  why: The parallel item edits README.md ONLY (five localized region rewrites). It
        does NOT touch src/index.ts. ZERO source-file overlap. At validation time
        `git status --short` will list README.md too (S1's work) — that is expected,
        not a scope violation by THIS task.
  critical: Do NOT edit README.md. This task touches src/index.ts ONLY (plus the
        gitignored dist/ rebuild).
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── src/
│   ├── index.ts                              # ← THE ONLY SOURCE FILE EDITED (3 JSDoc blocks)
│   ├── types/context.ts                      # READ-ONLY (sanitized FormStackViewportValue — source of truth)
│   ├── types/form.ts                         # READ-ONLY (FormProps.onError rich JSDoc — source of truth)
│   ├── hooks/useFormStackViewport.ts         # READ-ONLY (sanitized hook — source of truth)
│   └── components/FormErrorBoundary.tsx      # READ-ONLY (showError exists)
├── dist/                                     # gitignored; REBUILT by `npm run build`
│   ├── index.d.ts                            #   verify: sanitized types + showError + export surface
│   ├── index.mjs / index.cjs                 #   runtime bundles
│   └── *.map
├── tsup.config.ts                            # build config (dts:true, clean:true, single entry)
├── package.json                              # scripts: build/test/type-check
└── plan/002_32eb66cd705d/bugfix/001_f635210a7f29/
    ├── architecture/issue_analysis.md        # authoritative fix strategy
    └── P1M3T1S2/                             # ← THIS PRP + research/
```

### Desired Codebase tree with files to be changed

```bash
src/index.ts                                   # MODIFIED — 3 localized JSDoc rewrites (§Edit-1/2/3)
dist/*                                         # REBUILT (gitignored) — regenerated by `npm run build`
# (no new source files; no other source/type/test changes)
```

### Known Gotchas of our codebase & Library Quirks

```markdown
<!-- CRITICAL: index.ts re-export JSDoc does NOT propagate to dist/index.d.ts.
     tsup/rollup dts bundling carries the DEFINITION-SITE JSDoc (src/types/context.ts,
     src/types/form.ts, src/hooks/useFormStackViewport.ts). Verified empirically: the
     current dist FormStackViewportValue comment == context.ts's comment, NOT index.ts's.
     So: do NOT expect the new index.ts prose to appear in dist. The edits are for
     SOURCE narrative consistency. The rebuild is a clean-artifact + consistency gate. -->

<!-- CRITICAL: dist/ is gitignored (.gitignore line `dist`). So `git status --short`
     will NOT show dist changes after `npm run build` — that is correct. The build gate
     is "build exits 0 + the expected files exist + dist greps pass", NOT "git shows dist". -->

<!-- CRITICAL: the public-export `InternalStackEntry` check is ONLY on the final
     `export { … }` line. InternalStackEntry DOES legitimately appear in the dist BODY
     (it's the internal type behind FormStackViewportContextValue / FormStackRendererProps).
     Do not panic when `grep InternalStackEntry dist/index.d.ts` returns body hits —
     assert only that it is absent from the `export { … }` statement. -->

<!-- GOTCHA: do NOT edit the FormStackRenderer example at L98 (`<FormStackRenderer
     stack={internalStack} onClose={pop} onCancelRequest={confirm} />`). The RENDERER's
     own props (FormStackRendererProps) STILL take onCancelRequest (internal, correct).
     Only the PUBLIC hook/type dropped it. -->

<!-- GOTCHA: do NOT edit the FormErrorBoundary example at L202 (`onError={(error, info)
     => logToService(error)}`). That onError is the BOUNDARY's own logging prop (fires in
     componentDidCatch for render errors), NOT the form-invoked onError. Still accurate. -->

<!-- GOTCHA: the FormProps onError paragraph (§Edit-3) should be CONCISE — the rich
     contract detail already lives in src/types/form.ts JSDoc. Don't duplicate it
     verbatim; point to FormErrorBoundary + the no-reject/no-mutation guarantee (PRD §9). -->

<!-- GOTCHA: JSDoc {@link} tags — use {@link FormErrorBoundary}, {@link FormStackViewport},
     {@link StackEntry} so IDE hover + TypeDoc resolve cross-references. The existing
     index.ts comments already use this style; mirror it. -->

<!-- GOTCHA: keep the `export { useFormStackViewport } from './hooks';` and
     `export type { FormStackViewportValue } from './types';` and
     `export type { FormProps } from './types';` statements UNCHANGED — only the
     JSDoc block above each changes. Do not alter import paths or export names. -->
```

---

## Implementation Blueprint

### Data models and structure

None. This task edits JSDoc prose above re-export statements; no runtime data,
no type changes (the public types are already correct from P1.M1/P1.M2).

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EDIT src/index.ts — §Edit-1 useFormStackViewport re-export JSDoc (~L305)
  - LOCATE the JSDoc block immediately above `export { useFormStackViewport } from
        './hooks';`. Exact current text in §Edit-1 oldText (verified unique — the
        phrase "Returns the props required by `<FormStackRenderer/>` (internal stack"
        appears once).
  - REPLACE with §Edit-1 newText: sanitized read-only `{ id, label? }[] + onClose`
        description; states it is intentionally NOT spreadable onto FormStackRenderer;
        references PRD §10.1; points to FormStackViewportValue / FormStackViewport /
        FormStackRenderer in @see.
  - PRESERVE: the `export { useFormStackViewport } from './hooks';` statement.

Task 2: EDIT src/index.ts — §Edit-2 FormStackViewportValue re-export JSDoc (~L396, contract a)
  - LOCATE the JSDoc block immediately above `export type { FormStackViewportValue }
        from './types';`. Exact current text in §Edit-2 oldText (verified unique —
        "Structurally identical to `FormStackRendererProps`." appears once).
  - REPLACE with §Edit-2 newText: sanitized `readonly StackEntry[]` value; read-only;
        intentionally NOT spreadable onto FormStackRenderer; references PRD §10.1;
        @see useFormStackViewport / FormStackViewport / StackEntry.
  - PRESERVE: the `export type { FormStackViewportValue } from './types';` statement.

Task 3: EDIT src/index.ts — §Edit-3 FormProps re-export JSDoc (~L372, contract b)
  - LOCATE the two-line opening of the FormProps JSDoc + the `@typeParam` line that
        follows the blank comment line. Exact current text in §Edit-3 oldText (verified
        unique — "Forms receive these callbacks from FormStackProvider." + the
        `@typeParam T - The type of value returned by onSubmit` pair appears once).
  - REPLACE with §Edit-3 newText: the SAME two opening lines + an onError paragraph
        (routes to {@link FormErrorBoundary}; no reject; no mutation; PRD §9) + the
        blank line + the SAME `@typeParam` line. (Inserts a paragraph; the @example
        block below is untouched.)
  - PRESERVE: the `@typeParam` line, the `@example` block, and the
        `export type { FormProps } from './types';` statement.

Task 4: VALIDATE (no edits — run the full matrix)
  - RUN: npx tsc --noEmit  → expect exit 0.
  - RUN: npx vitest run  → expect all green (baseline 311 / 28 files; comment edits
        cannot change behavior, so count must be ≥ 311 and 0 failures).
  - RUN: npm run build  → expect exit 0; emits dist/index.{mjs,cjs,d.ts} + .map.
  - RUN the Level-3 dist grep assertions (see Validation Loop §Level 3) → each must
        pass.
  - RUN: git status --short  → expect src/index.ts (plus README.md if the parallel
        S1 item landed); confirm YOU did not touch any OTHER source/type/test file.
```

### Exact Replacement

> Every `oldText` below was read verbatim from the current `src/index.ts` and is
> unique within the file. The three regions do not overlap. Apply each as a single
> `edit` call.

#### §Edit-1 — Task 1 (`useFormStackViewport` re-export JSDoc)

- `oldText`:

  ```ts
  /**
   * Returns the props required by `<FormStackRenderer/>` (internal stack,
   * `onClose`, `onCancelRequest`), or `null` when the stack is empty. For
   * consumers who want to forward custom props to `<FormStackRenderer/>` or wrap
   * it. Most consumers should use `<FormStackViewport/>` instead.
   *
   * @see {@link FormStackViewport} - The recommended, no-prop component form
   * @see {@link FormStackRenderer} - The low-level renderer this powers
   */
  export { useFormStackViewport } from './hooks';
  ```

- `newText`:

  ```ts
  /**
   * Low-level hook that returns a **sanitized, read-only** view of the open forms
   * — each entry as a plain `{ id, label? }` ({@link StackEntry}) plus the
   * `onClose` callback — or `null` when the stack is empty or the hook is used
   * outside a `<FormStackProvider>`. Use it to *read* the open forms for custom
   * rendering (e.g. a host header). It exposes only display-oriented fields — never
   * the internal `component`/`deferred`/`confirmOnCancel` or an `onCancelRequest`
   * callback — and the returned value is intentionally **not** spreadable onto
   * `<FormStackRenderer/>` (PRD §10.1 "no internal-type leakage"). Most consumers
   * should use the zero-prop {@link FormStackViewport} component, which renders the
   * stacked form bodies.
   *
   * @see {@link FormStackViewportValue} - The sanitized return type
   * @see {@link FormStackViewport} - The recommended, no-prop component form
   * @see {@link FormStackRenderer} - The low-level renderer (takes internal types)
   */
  export { useFormStackViewport } from './hooks';
  ```

#### §Edit-2 — Task 2 (`FormStackViewportValue` re-export JSDoc — contract a)

- `oldText`:

  ```ts
  /**
   * Props required to render the form-stack viewport via `<FormStackRenderer/>`,
   * returned by `useFormStackViewport()` (or `null` when the stack is empty).
   * Structurally identical to `FormStackRendererProps`.
   *
   * @see {@link useFormStackViewport} - Hook that returns this type
   * @see {@link FormStackViewport} - Component that consumes this value
   */
  export type { FormStackViewportValue } from './types';
  ```

- `newText`:

  ```ts
  /**
   * Public, sanitized value returned by `useFormStackViewport()` (or `null` when
   * the stack is empty). A deliberately narrow, read-only view: each open form is
   * exposed only as `{ id, label? }` ({@link StackEntry}) plus the `onClose`
   * callback — i.e. `stack` is `readonly StackEntry[]`. It does **not** carry the
   * internal entry fields (`component`/`deferred`/`confirmOnCancel`) or an
   * `onCancelRequest` callback, so it is intentionally **not** spreadable onto
   * `<FormStackRenderer/>` and cannot leak internal types (PRD §10.1
   * "no internal-type leakage").
   *
   * @see {@link useFormStackViewport} - Hook that returns this type
   * @see {@link FormStackViewport} - Zero-prop component that renders the viewport
   * @see {@link StackEntry} - The public entry type (`{ id, label? }`)
   */
  export type { FormStackViewportValue } from './types';
  ```

#### §Edit-3 — Task 3 (`FormProps` re-export JSDoc — contract b)

- `oldText`:

  ```ts
  /**
   * Props interface that all form components must implement.
   * Forms receive these callbacks from FormStackProvider.
   *
   * @typeParam T - The type of value returned by onSubmit
  ```

- `newText`:

  ```ts
  /**
   * Props interface that all form components must implement.
   * Forms receive these callbacks from FormStackProvider.
   *
   * Includes an optional `onError` callback a form calls to signal an
   * application-level error (e.g. a failed save). The provider routes the error
   * to the surrounding {@link FormErrorBoundary}, which shows Retry / Dismiss UI
   * — it does **not** reject the `openForm()` promise (the `T | undefined`
   * contract holds) and does **not** mutate the stack (PRD §9). On Dismiss the
   * form is cancelled (`openForm()` resolves `undefined`); on Retry the form
   * remounts and `openForm()` remains pending.
   *
   * @typeParam T - The type of value returned by onSubmit
  ```

> **Note on the `edit` tool:** each `oldText` above is a verbatim, unique region
> of the current `src/index.ts`. They do not overlap. Apply as three separate
> `edit` calls (one per task). Do not merge — they are in different parts of the
> file and merging risks a non-unique match.

### Implementation Patterns & Key Details

```markdown
<!-- PATTERN: index.ts re-export JSDoc uses block /** ... */ with a one-line summary,
     a detail paragraph, and `@see {@link X}` lines. §Edit-1/2/3 mirror this exactly.
     Use {@link} (not bare backticks) for cross-references so TypeDoc + IDE resolve them. -->

<!-- CRITICAL: §Edit-1 must DROP `onCancelRequest` entirely from the hook comment.
     The public sanitized value no longer has it (Issue 3). The only remaining
     onCancelRequest reference in index.ts is the FormStackRenderer example (L98),
     which is correct (the renderer's own prop) and must NOT be touched. -->

<!-- CRITICAL: §Edit-2 must DROP "Structurally identical to `FormStackRendererProps`".
     That claim is the exact falsehood Issue 3 fixed. Replace with "sanitized, read-only,
     not spreadable onto `<FormStackRenderer/>`". -->

<!-- CRITICAL: §Edit-3 must state onError ROUTES TO FormErrorBoundary and does NOT reject
     openForm() / does NOT mutate the stack (PRD §9). This is the Issue 1 contract. The
     rich detail already lives in src/types/form.ts; keep this paragraph concise. -->

<!-- GOTCHA: none of these edits change a type, a runtime value, or a test. So tsc and
     vitest MUST still pass identically (311/28). If tsc or vitest regresses, you
     accidentally edited code beyond the JSDoc — re-check the edit boundaries. -->

<!-- GOTCHA: the rebuild (`npm run build`) output is deterministic given unchanged
     source behavior; dist prose is definition-site JSDoc, so the rebuilt dist/index.d.ts
     should match the current one (modulo timestamps). That match is itself the proof
     that nothing behavioral moved. -->
```

### Integration Points

```yaml
src/index.ts — useFormStackViewport re-export JSDoc:
  - REPLACE: the JSDoc block above `export { useFormStackViewport } from './hooks';`.
  - PRESERVE: the export statement; the surrounding re-export ordering.

src/index.ts — FormStackViewportValue re-export JSDoc:
  - REPLACE: the JSDoc block above `export type { FormStackViewportValue } from './types';`.
  - PRESERVE: the export statement.

src/index.ts — FormProps re-export JSDoc:
  - INSERT: an onError paragraph between the opening two lines and the `@typeParam` line.
  - PRESERVE: the @typeParam line, the @example block, the export statement.

dist/ (build artifact, gitignored):
  - REGENERATE via `npm run build`. No manual dist edits.

NO CHANGE (verified / out of scope):
  - FormStackRenderer re-export example (L98) — renderer still takes onCancelRequest.
  - FormErrorBoundary re-export example (L202) — boundary's own logging onError prop.
  - All definition-site JSDoc in src/types/* and src/hooks/* — already correct.
  - README.md (parallel P1.M3.T1.S1), PRD.md, tasks.json.
```

---

## Validation Loop

### Level 1: Edit sanity (immediate)

```bash
cd /home/dustin/projects/geoform
# Confirm the three edits landed and the JSDoc blocks are well-formed.
grep -n "sanitized\|onError\|readonly StackEntry\|FormErrorBoundary" src/index.ts
# EXPECT: hits in each of the three edited regions. Eyeball that /** ... */ blocks
# are balanced and {@link} tags are intact.
```

### Level 2: Type-check + tests (no regression — comment edits must not change behavior)

```bash
cd /home/dustin/projects/geoform
npx tsc --noEmit
# EXPECT: exit 0. (Comment edits cannot change types; any error means you edited code
# beyond the JSDoc — re-check the edit boundaries.)

npx vitest run
# EXPECT: all green. Baseline at task start = 311 tests / 28 files, 0 failures.
# Count must be >= 311 with 0 failures (comments don't change behavior; if new tests
# from a parallel item landed, count may be higher — that's fine).
```

### Level 3: Build + dist type assertions (THE real correctness gate)

```bash
cd /home/dustin/projects/geoform
# Rebuild dist/ from scratch (tsup clean:true wipes + regenerates).
npm run build
# EXPECT: exit 0. Emits dist/index.mjs, dist/index.cjs, dist/index.d.ts (+ .map, .d.cts).

# --- dist assertions ---
# (1) FormStackViewportValue.stack is readonly StackEntry[]
grep -A3 "^interface FormStackViewportValue" dist/index.d.ts
# EXPECT: shows `stack: readonly StackEntry[];` and `onClose: () => void;` only.

# (2) InternalStackEntry is NOT in the PUBLIC export statement.
#     (It DOES appear in the dist body as an internal type — that's correct. Only the
#      final `export { ... }` line must omit it.)
grep "^export {" dist/index.d.ts | grep -c "InternalStackEntry"
# EXPECT: 0   (no InternalStackEntry exported publicly)
grep "^export {" dist/index.d.ts | grep -c "FormStackViewportContextValue"
# EXPECT: 0   (internal context value not exported)

# (3) FormErrorBoundary.showError is present in dist.
grep "showError(error: Error)" dist/index.d.ts
# EXPECT: one match (`showError(error: Error): void;`).

# (4) Public surface still exports the sanitized type + the error boundary.
grep "^export {" dist/index.d.ts | grep -c "FormStackViewportValue"
# EXPECT: 1   (FormStackViewportValue is exported)
grep "^export {" dist/index.d.ts | grep -c "FormErrorBoundary"
# EXPECT: >= 1 (FormErrorBoundary class exported)
```

> If `npm run build` fails: read the tsup/tsc output — a failure here almost always
> means a syntax error in one of the JSDoc edits (unbalanced `/** */`, stray backtick).
> If a dist assertion fails unexpectedly: the source types regressed — diff
> `src/types/context.ts` and `src/components/FormErrorBoundary.tsx` against the
> verified state in `research/source_verification.md`.

### Level 4: Scope & contract validation

```bash
cd /home/dustin/projects/geoform
# You touched ONLY src/index.ts (dist/ is gitignored and won't appear):
git status --short
# EXPECT: ` M src/index.ts` (and ` M README.md` if the parallel P1.M3.T1.S1 item
# landed concurrently — that's S1's work, NOT yours). dist/* must NOT appear
# (gitignored).

git diff --name-only
# EXPECT: src/index.ts present. README.md may also appear (S1). Confirm YOU made NO
# edits to any OTHER source/type/test file:
git diff --name-only | grep -E '^src/' | grep -v '^src/index\.ts$' && echo "WARNING: you edited a source file beyond index.ts" || echo "OK: only src/index.ts edited by this task"

# Confirm the stale phrases are GONE from index.ts:
grep -n "Structurally identical to \`FormStackRendererProps\`" src/index.ts
# EXPECT: no matches.
grep -n "props required by.*FormStackRenderer\|required by \`<FormStackRenderer" src/index.ts
# EXPECT: no matches in the viewport hook/type comments. (The FormStackRenderer
# example at L98 is allowed to mention the renderer — that's its own export.)
grep -n "onCancelRequest" src/index.ts
# EXPECT: exactly ONE match — the FormStackRenderer example at ~L98
#         (`<FormStackRenderer stack={internalStack} onClose={pop} onCancelRequest={confirm} />`).
#         If it appears in the useFormStackViewport or FormStackViewportValue comment, the edit failed.

# Confirm the NEW phrases are PRESENT:
grep -n "readonly StackEntry\[\]\|sanitized" src/index.ts
# EXPECT: matches in the FormStackViewportValue + useFormStackViewport comments.
grep -n "routes the error\|FormErrorBoundary" src/index.ts
# EXPECT: a match in the FormProps comment (onError routing paragraph).
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npx tsc --noEmit` exit 0.
- [ ] `npx vitest run` all green (≥ 311 tests, 0 failures).
- [ ] `npm run build` exit 0; `dist/index.{mjs,cjs,dts}` all present.
- [ ] dist: `FormStackViewportValue.stack` is `readonly StackEntry[]`.
- [ ] dist: public `export { … }` line omits `InternalStackEntry` AND `FormStackViewportContextValue`.
- [ ] dist: `FormErrorBoundary.showError(error: Error)` present.
- [ ] `git status --short` shows `src/index.ts` (+ README.md from S1 only); no OTHER
      source file edited; `dist/*` not listed (gitignored).

### Feature Validation

- [ ] `useFormStackViewport` index.ts comment: sanitized read-only `{ id, label? }[] +
      onClose`; no `onCancelRequest`; explicitly NOT spreadable onto `<FormStackRenderer/>`.
- [ ] `FormStackViewportValue` index.ts comment: `readonly StackEntry[]`; sanitized;
      not "Structurally identical to FormStackRendererProps".
- [ ] `FormProps` index.ts comment: `onError` paragraph citing `FormErrorBoundary`
      routing, no-reject, no-mutation (PRD §9).

### Code Quality Validation

- [ ] New prose mirrors existing index.ts JSDoc conventions (block `/** */`, `{@link}`
      cross-references, concise summary + detail).
- [ ] Export statements (`export { … } from './…'`) unchanged — only JSDoc blocks edited.
- [ ] Non-stale regions left untouched (FormStackRenderer L98 example, FormErrorBoundary
      L202 example, all definition-site JSDoc).
- [ ] Scope held to `src/index.ts` only; no README/PRD/tasks.json edit.

### Documentation & Deployment

- [ ] Package entry-point comments agree with the definition-site types and the README
      (which P1.M3.T1.S1 is syncing in parallel).
- [ ] `dist/` rebuilt and reflects all four shipped fixes (sanitized viewport type,
      no public InternalStackEntry, showError method, no onCancelRequest on the public
      viewport value).

---

## Anti-Patterns to Avoid

- ❌ Don't edit any file other than `src/index.ts`. README.md is the parallel
  P1.M3.T1.S1 item's; `src/types/*`, `src/hooks/*`, `src/components/*` are already
  correct; PRD.md and tasks.json are off-limits.
- ❌ Don't expect the new index.ts prose to appear in `dist/index.d.ts`. tsup carries
  the DEFINITION-SITE JSDoc (verified in research). The rebuild proves consistency +
  clean artifact, not a dist-prose change.
- ❌ Don't edit the `FormStackRenderer` example at L98 — the renderer's own props still
  take `onCancelRequest`. Only the PUBLIC hook/type dropped it.
- ❌ Don't edit the `FormErrorBoundary` example at L202 — that `onError` is the
  boundary's logging prop (componentDidCatch), not the form-invoked `onError`.
- ❌ Don't duplicate the full `src/types/form.ts` `onError` JSDoc into the index.ts
  FormProps comment. Add a CONCISE paragraph (routes to FormErrorBoundary; no reject;
  no mutation; PRD §9); the rich text lives at the definition site.
- ❌ Don't assert `InternalStackEntry` is entirely absent from `dist/index.d.ts` — it
  legitimately appears in the dist BODY as the internal type behind
  `FormStackViewportContextValue` / `FormStackRendererProps`. Assert only that it is
  absent from the public `export { … }` line.
- ❌ Don't skip the rebuild. Even though the dist already reflects sanitized types, the
  build is the integration gate that proves a clean publishable artifact after the
  comment edits and confirms nothing regressed.
- ❌ Don't run ruff/mypy/pytest/uv — this is a TypeScript project. The gates are
  `npx tsc --noEmit` + `npx vitest run` + `npm run build` + the dist greps.

---

## Confidence Score

**9.5 / 10** for one-pass success. This is a three-edit, byte-accurate JSDoc task on a
single file (`src/index.ts`), with each `oldText` read verbatim from the current source
and verified unique. The shipped behavior each edit must reflect was confirmed against
the ACTUAL definition-site types (`src/types/context.ts`, `src/types/form.ts`,
`src/hooks/useFormStackViewport.ts`) and the CURRENT `dist/index.d.ts` (which already
reflects the sanitized types) — recorded in `research/source_verification.md`. The one
subtlety — that index.ts re-export comments do NOT flow into dist — is documented as a
CRITICAL gotcha so the implementer sets correct expectations (the rebuild is a
clean-artifact + consistency gate, not a dist-prose change). The real correctness gates
are deterministic: `tsc --noEmit` exit 0, `vitest run` green, `npm run build` exit 0,
and the dist greps (sanitized type, no public InternalStackEntry, showError present).
Scope is fully isolated from the parallel P1.M3.T1.S1 item (different file: src/index.ts
vs README.md). The half-point reservation is only that a careless implementer might
expect the index.ts prose to appear in dist — mitigated by the explicit CRITICAL gotcha.
