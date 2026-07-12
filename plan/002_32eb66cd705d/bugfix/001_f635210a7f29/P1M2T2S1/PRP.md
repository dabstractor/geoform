# PRP — P1.M2.T2.S1: Add dev-mode duplicate-ID warning in `FormStackProvider.openForm` (Issue 4)

---

## Goal

**Feature Goal**: Close Issue 4 (Minor) from the adversarial QA pass. Today
`openForm({ id })` happily pushes a form whose `id` is already on the stack, which
collides on React `key` in `FormStackRenderer` (`key={entry.id}`) and `Breadcrumbs`
(`key={entry.id}`) with no diagnostic. This task adds a **development-only**
`console.warn` at the top of `openForm` when the incoming `id` is already present on
`state.stack`, plus the matching test and a Mode-A JSDoc note on `OpenFormOptions.id`.

**Deliverable**: Edits to **three** files only:
1. `src/components/FormStackProvider.tsx` — add the dev-mode duplicate check to
   `openForm` (before `dispatch PUSH_FORM`) and change its `useCallback` deps from
   `[]` to `[state.stack]`.
2. `src/components/__tests__/FormStackProvider.test.tsx` — append a new
   `describe('FormStackProvider - openForm duplicate id warning', …)` block (dev-mode
   warn + unique-id no-warn + first-occurrence no-warn + production no-warn).
3. `src/types/stack.ts` — expand the `OpenFormOptions.id` JSDoc (Mode A) to note that
   duplicate IDs produce a development-mode warning and cause React key collisions.

**Success Definition**:
- In development mode, `openForm` emits a `console.warn` whose text contains
  `Duplicate form id "<id>" detected` when an `id` already on the stack is pushed again.
- The first occurrence of any `id` warns nothing; unique ids warn nothing.
- Production is **unaffected** — no `console.warn`, no behavior change; the form still
  pushes (uniqueness remains a documented consumer responsibility).
- `npx tsc --noEmit` is green (the three touched files contribute zero new errors).
- `npx vitest run` is all green, including the new duplicate-id tests.
- `git status --short` shows exactly the three files above.

---

## User Persona (if applicable)

**Target User**: A `geoform` consumer (and the library maintainers) who accidentally
opens a child form that reuses a parent's `id` (e.g. `openForm({ id: 'editor' })` from
inside another `'editor'` form).

**Use Case**: During development the consumer opens a nested form that reuses an id.
Instead of silently producing a React "duplicate key" warning (which points at the
renderer, not the cause) and risking instance/state mix-ups, geoform emits a clear,
actionable `[FormStack] Duplicate form id "…" detected.` warning naming the offending id
and the contract it violates (PRD §5.2).

**User Journey**: Developer opens a duplicate-id form → sees the `[FormStack]` warning in
the dev console → fixes the id → warning disappears → ships with no production cost (the
guard is dev-only).

**Pain Points Addressed**: Today a duplicate id silently produces undefined React
reconciliation behavior (the QA pass confirmed parent input state survived by luck, but
key collisions are UB in general). The warning surfaces the root cause at the `openForm`
call site instead of deep in the renderer.

---

## Why

- **Honors PRD §5.2.** `OpenFormOptions.id` is documented as "Unique identifier for this
  form instance". Issue 4 proved the library neither enforces nor warns when that contract
  is violated. A dev-only warning is the QA pass's recommended, low-risk remediation.
- **Cheap, targeted diagnostic.** The guard is a `state.stack.some(...)` + `console.warn`
  behind a `NODE_ENV === 'development'` check — zero production cost, zero runtime
  behavior change (the form still pushes). It matches the existing dev-guard style in
  this exact file (`closeForm` usage warning, `popToIndex` `RangeError`, viewport
  forgotten-host/duplicate-viewport warnings).
- **Low risk.** The only behavioral nuance is `openForm`'s `useCallback` deps change
  (`[]` → `[state.stack]`), which changes its reference identity on stack change. This is
  **already** the case for `cancelForm` and `popToIndex` in the same file (both depend on
  `[state.stack]`), so `actionsValue` already recomputes on stack change — no NEW
  re-render regression is introduced. `openForm` is consumed imperatively (onClick
  handlers), never as a `useEffect` dependency.

---

## What

In development mode, `openForm` warns when a duplicate id is about to be pushed; the form
is still pushed (the warning is diagnostic, not a guard). Production behavior is
identical to today.

### Scope (EXACT — do only this)

1. **`src/components/FormStackProvider.tsx`** — at the top of the `openForm` `useCallback`
   body (before `// Create deferred promise for async resolution`), insert the dev-mode
   duplicate-id check (exact code in the Implementation Blueprint). Change the closing
   deps from `}, []);` to `}, [state.stack]);`. No other changes to this file.
2. **`src/components/__tests__/FormStackProvider.test.tsx`** — append a new
   `describe('FormStackProvider - openForm duplicate id warning', …)` block at the END of
   the file (after the `closeForm` production-mode test). Add a trivial `StubForm`. Cover:
   dev-mode warns on duplicate; dev-mode does NOT warn on unique ids; dev-mode does NOT
   warn on the first occurrence; production does NOT warn at all.
3. **`src/types/stack.ts`** — expand the `OpenFormOptions.id` field JSDoc from the current
   one-liner to a multi-line note (Mode A) covering the dev-mode warning + React key
   collision + consumer responsibility + production-unchanged.

**Do NOT** touch `FormStackRenderer.tsx`, `Breadcrumbs.tsx`, any hook, any context type,
or `useFormStackViewport.ts`/its test (owned by parallel S2). **Do NOT** change the React
`key` strategy (the alternative fix in Issue 4 — keying by a monotonic index — is out of
scope; this task implements the *warn* remediation only).

### Success Criteria

- [ ] `openForm`'s body begins (before the deferred creation) with a
      `if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')`
      guard that `console.warn`s when `state.stack.some((e) => e.id === options.id)`.
- [ ] The warning message contains `Duplicate form id "${options.id}" detected` and
      references PRD §5.2 / React key collisions in FormStackRenderer and Breadcrumbs.
- [ ] `openForm`'s `useCallback` deps are `[state.stack]` (was `[]`).
- [ ] The form is STILL pushed (the `dispatch PUSH_FORM` and `return deferred.promise`
      paths are unchanged) — no runtime/production behavior change.
- [ ] New tests: dev-mode warns on duplicate id; dev-mode does NOT warn on unique ids;
      dev-mode does NOT warn on the first occurrence; production does NOT warn.
- [ ] The `OpenFormOptions.id` JSDoc documents the dev-mode warning + key-collision risk.
- [ ] `npx tsc --noEmit` green (the three files contribute zero new errors).
- [ ] `npx vitest run` all green, including the new tests.
- [ ] `git status --short` lists exactly `FormStackProvider.tsx`, `stack.ts`,
      `FormStackProvider.test.tsx`.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** The exact current `openForm` body (verbatim), the
exact replacement body (with the guard + new deps), the exact test block to append
(verbatim, mirroring the existing `closeForm` warning tests), the exact env-stubbing
idiom (the `vi.stubEnv` + direct `process.env` double-set), and the exact JSDoc rewrite
are all specified below. The single test-correctness landmine (per-call `act()` so the
second call sees the flushed stack) is called out. No inference is required.

### Documentation & References

```yaml
# MUST READ — the authoritative fix this implements
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/issue_analysis.md
  why: §Issue 4 "Fix Strategy" prescribes EXACTLY the openForm dev-warning + the
        `[]` → `[state.stack]` deps change, and explains why the reference-stability
        change is acceptable (openForm is imperative; cancelForm/popToIndex already
        depend on state.stack). "Cross-Issue Dependencies" confirms Issue 4 overlaps
        Issue 2's FILE (FormStackProvider.tsx) but a DIFFERENT function (openForm) —
        Issue 2 is Complete, so the file is stable.
  section: "## Issue 4 (Minor) ... Fix Strategy"
  critical: The prescribed message references "PRD §5.2". The item-description CONTRACT
        gives the exact message string — use it verbatim (see Implementation Blueprint).

# MUST READ — the test conventions + the Issue-4 test outline
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/architecture/test_patterns.md
  why: "Patterns Required for New Tests → Issue 4: Duplicate ID Warning Test" gives the
        5-step outline (spy console.warn; open 'same'; open 'same' again; assert warn;
        assert no warn for unique). "Environment Notes" states the CRITICAL gotcha:
        process.env.NODE_ENV is 'test' in Vitest, dev guards check '=== development',
        so tests MUST `vi.stubEnv('NODE_ENV','development')` — AND (per the existing
        tests) also set process.env directly, because vi.stubEnv only sets import.meta.env.
  section: "### Issue 4: Duplicate ID Warning Test" + "## Environment Notes"

# PRIMARY EDIT TARGET #1 — openForm (the function being guarded)
- file: src/components/FormStackProvider.tsx
  why: openForm is a useCallback with deps `[]` (it currently reads NOTHING from state).
        Adding the duplicate check reads `state.stack`, so deps MUST become [state.stack].
        The current body is quoted verbatim in the Implementation Blueprint. `state.stack`
        is InternalStackEntry<unknown>[]; InternalStackEntry extends StackEntry (has id).
  pattern: "Mirror the existing dev-guards in THIS file: closeForm (usage warn), popToIndex
        (RangeError), and the viewport useEffect (forgotten-host / duplicate-viewport warns).
        All use `typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'`."
  gotcha: openForm already imports nothing new — `state`, `options`, `InternalStackEntry`
        are all in scope. No import changes needed.

# HOUSE-STYLE MIRROR — the closest existing dev-warning test (console.warn spy)
- file: src/components/__tests__/FormStackProvider.test.tsx
  why: The `describe('FormStackProvider - closeForm development warning', …)` block is the
        EXACT pattern to clone: the beforeEach/afterEach env-stubbing + console.warn spy,
        the `expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining(...))`
        assertion, the production-mode "does not warn" counterpart, and the
        `useFormStackWithActions()` + `wrapper` helpers (already defined at file top).
  pattern: "beforeEach: vi.stubEnv('NODE_ENV','development') + `if (process?.env)
        process.env.NODE_ENV='development'` + spy; afterEach: vi.unstubAllEnvs() +
        restore process.env='test' + mockRestore."
  critical: Reuse the EXISTING `wrapper` (autoRender=true) and `useFormStackWithActions()`.
        Do NOT use autoRender=false — it would fire the forgotten-host guard and pollute
        the spy. With autoRender=true, React's duplicate-key warning goes to console.ERROR
        (harmless to a console.WARN spy).

# HOUSE-STYLE MIRROR — the warn + NOT-warn assertion pair
- file: src/components/__tests__/FormStackProvider.autoRender.test.tsx
  why: The "dev-mode forgotten-host guard" + "dev-mode duplicate-viewport guard" blocks
        show the canonical `expect(spy).toHaveBeenCalledWith(stringContaining(...))` for
        the positive case AND `expect(spy).not.toHaveBeenCalledWith(stringContaining(...))`
        for the negative case. Clone this assertion style.
  pattern: "Positive: toHaveBeenCalledWith(expect.stringContaining('Duplicate form id'));
        Negative: not.toHaveBeenCalledWith(expect.stringContaining('Duplicate form id'))."

# PRIMARY EDIT TARGET #3 — the Mode-A JSDoc (OpenFormOptions.id)
- file: src/types/stack.ts
  why: `OpenFormOptions.id` currently has a one-line JSDoc `/** Unique identifier for this
        form instance */`. OUTPUT spec #5 (Mode A) requires expanding it to clarify that
        duplicate IDs produce a dev-mode warning and can cause React key collisions.
        InternalStackEntry extends StackEntry (same `id` field) — the contract is shared.
  gotcha: Do NOT change the field TYPE (still `id: string`) or any other field. Only expand
        the id JSDoc comment.

# THE DEPS-CHANGE RATIONALE (read to understand, do not edit)
- file: src/components/FormStackProvider.tsx
  why: `cancelForm` (deps `[state.stack, handleCancelRequest]`) and `popToIndex` (deps
        `[state.stack, requestConfirmation]`) ALREADY depend on state.stack. Therefore
        `actionsValue` (useMemo deps `[openForm, closeForm, popToIndex, cancelForm]`)
        ALREADY recomputes on every stack change. Adding `[state.stack]` to openForm does
        NOT introduce a new re-render regression — it joins cancelForm/popToIndex.
  critical: This is WHY the contract accepts the deps change. Do NOT "optimize" openForm
        with a ref to avoid the deps change — the contract prescribes `[state.stack]`.

# SIBLING CONTRACT (parallel — consume its outputs, do not overlap)
- file: plan/002_32eb66cd705d/bugfix/001_f635210a7f29/P1M2T1S2/PRP.md
  why: S2 edits src/hooks/useFormStackViewport.ts + its test (Issue 3 runtime leak). It does
        NOT touch FormStackProvider.tsx, stack.ts, or FormStackProvider.test.tsx. ZERO file
        overlap — both can land independently.
  critical: Do NOT edit useFormStackViewport.ts or its test (S2's scope).

# THE KEY-COLLISION ROOT CAUSE (read to confirm, do not edit)
- file: src/components/FormStackRenderer.tsx
  why: Keys list items by `entry.id` (Issue 4 root cause). Two same-id entries → React
        duplicate-key warning. The new openForm warning surfaces this at the call site.
- file: src/components/Breadcrumbs.tsx
  why: Also keys by `entry.id`. Same collision. The warning message names both components.
```

### Current Codebase tree (relevant slice)

```bash
geoform/
├── src/
│   ├── components/
│   │   ├── FormStackProvider.tsx                  # ← EDIT: openForm guard + deps [state.stack]
│   │   ├── FormStackRenderer.tsx                  # READ-ONLY (key={entry.id} root cause)
│   │   ├── Breadcrumbs.tsx                        # READ-ONLY (key={entry.id} root cause)
│   │   └── __tests__/
│   │       └── FormStackProvider.test.tsx         # ← EDIT: append duplicate-id describe block
│   ├── types/
│   │   └── stack.ts                               # ← EDIT: OpenFormOptions.id JSDoc (Mode A)
│   └── hooks/
│       └── useFormStackViewport.ts                # READ-ONLY (parallel S2 owns this)
├── tsconfig.json                                  # READ-ONLY (strict; noUncheckedIndexedAccess)
└── plan/002_32eb66cd705d/bugfix/001_f635210a7f29/
    ├── architecture/issue_analysis.md             # §Issue 4 Fix Strategy (authoritative)
    ├── architecture/test_patterns.md              # §Issue 4 test outline + env-stubbing note
    └── P1M2T2S1/                                  # ← THIS PRP lives here
```

### Desired Codebase tree with files to be changed

```bash
src/components/FormStackProvider.tsx               # MODIFIED — openForm dev guard + deps [state.stack]
src/components/__tests__/FormStackProvider.test.tsx # MODIFIED — appended duplicate-id describe block
src/types/stack.ts                                 # MODIFIED — OpenFormOptions.id JSDoc expanded (Mode A)
# (no new files; no other source files touched)
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: This is a TS/React project. The validation gates are `npx tsc --noEmit` and
//   `npx vitest run`. Do NOT run ruff/mypy/pytest/uv.

// CRITICAL: vi.stubEnv('NODE_ENV','development') ONLY sets import.meta.env; the SOURCE
//   checks process.env.NODE_ENV. Tests MUST do BOTH:
//     vi.stubEnv('NODE_ENV', 'development');
//     if (process?.env) process.env.NODE_ENV = 'development';
//   and restore BOTH in afterEach (vi.unstubAllEnvs() + process.env.NODE_ENV = 'test').
//   This is the exact idiom in the existing closeForm/forgotten-host/duplicate-viewport
//   tests. Omitting the direct process.env set → the guard never fires → test fails.

// CRITICAL (test correctness): after the fix, openForm closes over state.stack (deps
//   [state.stack]). For the SECOND openForm({ id:'dup' }) to SEE the first push, React
//   must have re-rendered between the two calls. So wrap EACH openForm in its OWN act():
//     act(() => { result.current.openForm({ id: 'dup', component: StubForm }); });
//     act(() => { result.current.openForm({ id: 'dup', component: StubForm }); });
//   Calling both back-to-back WITHOUT per-call act() uses the SAME pre-render closure
//   (empty stack) → no duplicate detected → test fails. This is the #1 test landmine.

// CRITICAL: reuse the EXISTING `wrapper` (autoRender=true). Do NOT use autoRender=false:
//   it would fire the "forgotten host" guard (console.warn) and pollute the spy. With
//   autoRender=true, React's duplicate-key warning goes to console.ERROR — harmless to a
//   console.WARN spy.

// CRITICAL: the deps change ([] → [state.stack]) is ACCEPTABLE and introduces NO NEW
//   re-render regression: cancelForm and popToIndex already depend on [state.stack], so
//   actionsValue already recomputes on stack change. openForm is consumed imperatively
//   (onClick), never as a useEffect dependency. Do NOT "optimize" with a ref — the
//   contract prescribes [state.stack].

// GOTCHA: the warning must NOT prevent the push. The form is STILL pushed (dispatch
//   PUSH_FORM + return deferred.promise are unchanged). This is a diagnostic warning,
//   not a guard — uniqueness is a documented consumer responsibility (PRD §5.2).

// GOTCHA: the message string has a trailing space in the first fragment:
//   `[FormStack] Duplicate form id "${options.id}" detected. `  <-- note trailing space.
//   Keep it (it joins the next fragment). The test asserts stringContaining on a prefix
//   that does not include the trailing space, so this is cosmetic but must match the
//   contract verbatim.

// GOTCHA: No new imports are needed in FormStackProvider.tsx — `state`, `options`, and
//   `InternalStackEntry` are already in scope in openForm.

// GOTCHA: Parallel-safety — S2 (P1.M2.T1.S2) edits useFormStackViewport.ts + its test.
//   Your three files are FormStackProvider.tsx, stack.ts, FormStackProvider.test.tsx.
//   ZERO overlap. If the full `npx tsc --noEmit` is non-zero at implementation time due
//   to S2 being mid-flight (S1→S2 handoff left 8 errors in useFormStackViewport.test.tsx
//   per S2's PRP), verify YOUR files are clean: `npx tsc --noEmit 2>&1 | grep -E
//   'FormStackProvider\.tsx|stack\.ts'` should be empty.
```

---

## Implementation Blueprint

### Data models and structure

No new data models. The change reads the existing `state.stack`
(`InternalStackEntry<unknown>[]`) — each entry has `id: string` (via `StackEntry`).

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: EDIT src/components/FormStackProvider.tsx — add the dev-mode duplicate check + fix deps
  - LOCATE the current openForm useCallback (the comment `// Full openForm implementation
        with deferred promise` ... the closing `}, []);`). Its exact current text is quoted
        in "Exact Replacement" §A oldText.
  - REPLACE it with the guarded version (exact newText in §A): insert the
        `if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')`
        block at the TOP of the body (before `// Create deferred promise`), and change the
        trailing deps from `}, []);` to `}, [state.stack]);`.
  - GUARD MESSAGE: use the contract's exact string (see §A).
  - GOTCHA: do NOT add imports — state/options/InternalStackEntry are in scope.
  - GOTCHA: do NOT remove or reorder the deferred/entry/dispatch/return logic — only
        PREPEND the guard and change the deps.

Task 2: EDIT src/types/stack.ts — expand OpenFormOptions.id JSDoc (Mode A)
  - LOCATE the field `  /** Unique identifier for this form instance */\n  id: string;`
        inside `interface OpenFormOptions<T = unknown>`. Exact current text in §B oldText.
  - REPLACE the one-line JSDoc with the multi-line note (exact newText in §B) covering:
        dev-mode warning, React key collisions in FormStackRenderer/Breadcrumbs, consumer
        responsibility, production unchanged.
  - GOTCHA: do NOT change the field type (`id: string`) or any other field.

Task 3: EDIT src/components/__tests__/FormStackProvider.test.tsx — append the test block
  - LOCATE the END of the file: the closeForm production-mode test + its two closing `});`
        + the describe's closing `});`. Exact current text in §C oldText.
  - APPEND (after the final `});`) a `StubForm` const + the new
        `describe('FormStackProvider - openForm duplicate id warning', …)` block with FOUR
        tests (dev warn-on-duplicate, dev no-warn-on-unique, dev no-warn-on-first,
        production no-warn). Exact newText in §C.
  - REUSE: the existing `wrapper` (autoRender=true) and `useFormStackWithActions()` — both
        already defined at file top. `act` is already imported (line 2).
  - GOTCHA: use the double env-set idiom (vi.stubEnv + process.env) + per-call act().
  - GOTCHA: define `StubForm` OUTSIDE the renderHook call (module-level, just before the
        describe). It must be a valid ComponentType<FormProps<unknown>>.

Task 4: VALIDATE (no edits — run the contract gates)
  - RUN: npx tsc --noEmit  → expect exit 0 (your 3 files: zero new errors).
  - RUN: npx vitest run src/components/__tests__/FormStackProvider.test.tsx  → expect all
        green, including the 4 new tests.
  - RUN: npx vitest run  → expect ALL green (no regression; the only files you touched are
        the 3 above).
  - RUN: grep -n "Duplicate form id" src/components/FormStackProvider.tsx  → expect ≥ 1.
  - RUN: grep -n "\[state.stack\]" src/components/FormStackProvider.tsx  → confirm openForm
        deps (and that you didn't disturb cancelForm/popToIndex which also have it).
  - RUN: git status --short  → expect exactly:
          M src/components/FormStackProvider.tsx
          M src/components/__tests__/FormStackProvider.test.tsx
          M src/types/stack.ts
  - If a NEW test FAILS: the most likely cause is forgetting per-call act() (Task 3 GOTCHA)
        or forgetting the direct process.env set (Task 3 GOTCHA). Re-read those.
```

### Exact Replacement

#### §A — Task 1 (openForm guard + deps)

- `oldText` (the exact current `openForm` useCallback — verified unique; the comment +
  signature + full body + the `[]` deps):

  ```ts
    // Full openForm implementation with deferred promise
    const openForm = useCallback(<T,>(options: OpenFormOptions<T>): Promise<T | undefined> => {
      // Create deferred promise for async resolution
      const deferred = createDeferredPromise<T>();

      // Create internal stack entry
      const entry: InternalStackEntry<T> = {
        id: options.id,
        label: options.label,
        component: options.component,
        confirmOnCancel: options.confirmOnCancel ?? false,
        deferred,
      };

      // Push form onto stack (cast to unknown for reducer type compatibility)
      dispatch({ type: 'PUSH_FORM', entry: entry as InternalStackEntry<unknown> });

      // Return promise immediately - caller awaits
      return deferred.promise;
    }, []);
  ```

- `newText` (prepend the dev-mode duplicate check; change deps `[]` → `[state.stack]`;
  the deferred/entry/dispatch/return logic is byte-identical):

  ```ts
    // Full openForm implementation with deferred promise
    const openForm = useCallback(<T,>(options: OpenFormOptions<T>): Promise<T | undefined> => {
      // Development-mode guard: warn when a duplicate id is pushed onto the stack.
      // Duplicate ids collide on React `key` in FormStackRenderer and Breadcrumbs
      // (PRD §5.2 documents id as "Unique identifier for this form instance").
      // Uniqueness remains a consumer responsibility — the form is still pushed;
      // this is a diagnostic warning, not a guard. Production is unaffected.
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        if (state.stack.some((e) => e.id === options.id)) {
          console.warn(
            `[FormStack] Duplicate form id "${options.id}" detected. ` +
            'Form IDs should be unique on the stack to avoid React key collisions ' +
            'in FormStackRenderer and Breadcrumbs (PRD §5.2: "Unique identifier for this form instance").'
          );
        }
      }

      // Create deferred promise for async resolution
      const deferred = createDeferredPromise<T>();

      // Create internal stack entry
      const entry: InternalStackEntry<T> = {
        id: options.id,
        label: options.label,
        component: options.component,
        confirmOnCancel: options.confirmOnCancel ?? false,
        deferred,
      };

      // Push form onto stack (cast to unknown for reducer type compatibility)
      dispatch({ type: 'PUSH_FORM', entry: entry as InternalStackEntry<unknown> });

      // Return promise immediately - caller awaits
      return deferred.promise;
    }, [state.stack]);
  ```

> **Note on the `edit` tool:** the `oldText` above is the verbatim current `openForm`
> block and is unique in the file (the `// Full openForm implementation` comment and the
> `<T,>(options: OpenFormOptions<T>)` signature appear once). The replacement is a single
> contiguous region — one safe edit.

#### §B — Task 2 (OpenFormOptions.id JSDoc, Mode A)

- `oldText` (the exact current field inside `OpenFormOptions` — verified unique):

  ```ts
    /** Unique identifier for this form instance */
    id: string;
  ```

- `newText`:

  ```ts
    /**
     * Unique identifier for this form instance.
     *
     * IDs must be unique across all forms currently on the stack. Pushing a form
     * whose `id` is already present produces a **development-mode warning** (a
     * `console.warn` from `openForm`) because duplicate IDs collide on the React
     * `key` used by `FormStackRenderer` and `Breadcrumbs`, which can cause form
     * instance and state mix-ups. Production behavior is unchanged — the form is
     * still pushed — so uniqueness remains a consumer responsibility (PRD §5.2).
     */
    id: string;
  ```

> **Note:** this is the ONLY `/** Unique identifier for this form instance */` in the file
> (StackEntry.id uses `/** Unique identifier for the form */` — different text). The
> oldText is unique. Do not change the `StackEntry.id` JSDoc.

#### §C — Task 3 (append the test block)

- `oldText` (the exact current END of the file — the closeForm production-mode test + the
  two closing braces + the describe close; verified unique):

  ```ts
      it('should not warn when closeForm is called', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { result } = renderHook(() => useFormStackWithActions(), { wrapper });
        result.current.closeForm();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
      });
    });
  });
  ```

- `newText` (the same closeForm production test + its closes, THEN a new `StubForm` const +
  the new describe block appended):

  ```ts
      it('should not warn when closeForm is called', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { result } = renderHook(() => useFormStackWithActions(), { wrapper });
        result.current.closeForm();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
        consoleWarnSpy.mockRestore();
      });
    });
  });

  // Trivial form component for the duplicate-id warning tests. It is never
  // interacted with; it only needs to be a valid ComponentType<FormProps<unknown>>.
  const StubForm = () => <div data-testid="stub-form" />;

  describe('FormStackProvider - openForm duplicate id warning', () => {
    describe('development mode', () => {
      let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'development');
        if (process?.env) {
          process.env.NODE_ENV = 'development';
        }
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        vi.unstubAllEnvs();
        if (process?.env) {
          process.env.NODE_ENV = 'test';
        }
        consoleWarnSpy.mockRestore();
      });

      it('warns when a form with a duplicate id is opened', () => {
        const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

        act(() => {
          result.current.openForm({ id: 'dup', component: StubForm });
        });
        // The second openForm reuses 'dup'. Each call is wrapped in its own act()
        // so the first PUSH_FORM is flushed and the updated state.stack is visible
        // to the duplicate check in the (new) openForm closure.
        act(() => {
          result.current.openForm({ id: 'dup', component: StubForm });
        });

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Duplicate form id "dup"'),
        );
      });

      it('does not warn when ids are unique', () => {
        const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

        act(() => {
          result.current.openForm({ id: 'a', component: StubForm });
        });
        act(() => {
          result.current.openForm({ id: 'b', component: StubForm });
        });

        expect(consoleWarnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Duplicate form id'),
        );
      });

      it('does not warn for the first occurrence of an id', () => {
        const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

        act(() => {
          result.current.openForm({ id: 'solo', component: StubForm });
        });

        expect(consoleWarnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Duplicate form id'),
        );
      });
    });

    describe('production mode', () => {
      let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        vi.stubEnv('NODE_ENV', 'production');
        if (process?.env) {
          process.env.NODE_ENV = 'production';
        }
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        vi.unstubAllEnvs();
        if (process?.env) {
          process.env.NODE_ENV = 'test';
        }
        consoleWarnSpy.mockRestore();
      });

      it('does not warn for duplicate ids in production', () => {
        const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

        act(() => {
          result.current.openForm({ id: 'dup', component: StubForm });
        });
        act(() => {
          result.current.openForm({ id: 'dup', component: StubForm });
        });

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });
    });
  });
  ```

> **Note on the `edit` tool:** the `oldText` is the verbatim file tail and is unique. The
> replacement appends the new `StubForm` + describe block after the final `});`. Because
> `StubForm` uses JSX, confirm the file remains `.tsx` (it is). `act`, `renderHook`,
> `vi`, `wrapper`, and `useFormStackWithActions` are all already imported/defined.

### Implementation Patterns & Key Details

```typescript
// PATTERN: the dev-mode guard idiom used throughout FormStackProvider.tsx. Mirror it
//   exactly (the contract specifies single quotes). (FormStackProvider.tsx openForm)
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
  if (state.stack.some((e) => e.id === options.id)) {
    console.warn(`[FormStack] Duplicate form id "${options.id}" detected. ` + ...);
  }
}

// CRITICAL: the guard is a DIAGNOSTIC, not a guard. The PUSH_FORM dispatch and the
//   `return deferred.promise` MUST still run unconditionally. Do not `return` early.

// CRITICAL: deps `[state.stack]`. openForm now reads state.stack, so it MUST be a dep.
//   This is acceptable (cancelForm/popToIndex already do this); openForm is imperative.

// PATTERN: the test env-stubbing double-set. vi.stubEnv sets import.meta.env ONLY; the
//   source checks process.env. So set BOTH, restore BOTH. (test file)
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
  if (process?.env) process.env.NODE_ENV = 'development';
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  if (process?.env) process.env.NODE_ENV = 'test';
  consoleWarnSpy.mockRestore();
});

// CRITICAL (test correctness): per-call act(). The second openForm must see the flushed
//   stack from the first push. Without per-call act(), both calls share the pre-render
//   closure (empty stack) → no duplicate detected → test fails.
act(() => { result.current.openForm({ id: 'dup', component: StubForm }); });
act(() => { result.current.openForm({ id: 'dup', component: StubForm }); });

// PATTERN: console.warn assertion. toHaveBeenCalledWith(expect.stringContaining(...)) for
//   the positive case; not.toHaveBeenCalledWith(expect.stringContaining(...)) for the
//   negative. Mirrors the forgotten-host / duplicate-viewport tests.
```

### Integration Points

```yaml
FormStackProvider.tsx — openForm:
  - PREPEND: the dev-mode duplicate-id check at the top of the useCallback body.
  - CHANGE: deps [] → [state.stack].
  - PRESERVE: the deferred/entry/dispatch/return logic byte-for-byte.
  - PRESERVE: closeForm, popToIndex, cancelForm, requestConfirmation, the viewport
        useEffect, and the JSX return — UNCHANGED (Issue 2 already landed here).

src/types/stack.ts — OpenFormOptions.id:
  - EXPAND: the one-line JSDoc to a multi-line note (Mode A).
  - PRESERVE: the field type (id: string) and all other OpenFormOptions fields.
  - PRESERVE: StackEntry.id JSDoc (different text; do not touch).

FormStackProvider.test.tsx:
  - APPEND: StubForm const + the new describe block at END of file.
  - REUSE: the existing wrapper (autoRender=true) + useFormStackWithActions().
  - PRESERVE: all existing describe blocks (popToIndex, closeForm warning) UNCHANGED.

NO CHANGE (verified / out of scope):
  - FormStackRenderer.tsx, Breadcrumbs.tsx  (key={entry.id} root cause — NOT changed; the
        warn remediation surfaces the issue at the call site instead).
  - useFormStackViewport.ts + its test  (parallel S2's scope).
  - context types, reducer, hooks  (untouched).

VALIDATION GATES:
  - npx tsc --noEmit  → exit 0 (your 3 files: zero new errors).
  - npx vitest run    → all green, incl. the 4 new tests.
```

---

## Validation Loop

### Level 1: Type Gate

```bash
cd /home/dustin/projects/geoform
npx tsc --noEmit
# EXPECT: exit 0. (Your 3 files contribute zero new errors.)
# If exit non-zero: if the ONLY errors are in useFormStackViewport.test.tsx, that's the
# parallel S2 handoff (not yours). Confirm YOUR files are clean:
npx tsc --noEmit 2>&1 | grep -E 'FormStackProvider\.tsx|FormStackProvider\.test\.tsx|stack\.ts' | grep "error TS"
# EXPECT: EMPTY (no errors in your files).
```

### Level 2: Unit Tests (the new duplicate-id tests)

```bash
cd /home/dustin/projects/geoform
# Run the file you appended to, first.
npx vitest run src/components/__tests__/FormStackProvider.test.tsx
# EXPECT: all green, including the 4 new tests under
#         "FormStackProvider - openForm duplicate id warning".
# If "warns when a form with a duplicate id is opened" FAILS:
#   - Did you wrap EACH openForm in its own act()? (per-call act() is required)
#   - Did you set process.env.NODE_ENV directly (not just vi.stubEnv)?
#   - Did you change openForm's deps to [state.stack] (so the closure sees the stack)?

# Then the full suite (your change must not regress anything).
npx vitest run
# EXPECT: all green. The only files you touched are the 3 above.
```

### Level 3: Scope & Contract Validation

```bash
cd /home/dustin/projects/geoform
# Exactly the three agreed files changed:
git status --short
# EXPECT:
#   M src/components/FormStackProvider.tsx
#   M src/components/__tests__/FormStackProvider.test.tsx
#   M src/types/stack.ts
# NOTHING ELSE — especially NOT FormStackRenderer.tsx, Breadcrumbs.tsx,
# useFormStackViewport.ts, any context type, PRD.md, or tasks.json.

# Confirm the guard + message landed in openForm:
grep -n "Duplicate form id" src/components/FormStackProvider.tsx
# EXPECT: ≥ 1 hit (the console.warn string).

# Confirm the deps changed (and you didn't disturb siblings):
grep -n "\[state\.stack\]" src/components/FormStackProvider.tsx
# EXPECT: ≥ 3 hits — openForm (NEW), popToIndex, cancelForm.

# Confirm the form is STILL pushed (the guard did not add an early return):
grep -n "dispatch({ type: 'PUSH_FORM'" src/components/FormStackProvider.tsx
# EXPECT: exactly 1 hit (unchanged).

# Confirm the JSDoc note landed:
grep -n "development-mode warning" src/types/stack.ts
# EXPECT: ≥ 1 hit (the expanded OpenFormOptions.id JSDoc).

# Confirm you did NOT touch S2's files or the key-collision components:
git diff --name-only | grep -E "FormStackRenderer\.tsx|Breadcrumbs\.tsx|useFormStackViewport" \
  && echo "WARNING: scope violation" || echo "OK: out-of-scope files untouched"
```

### Level 4: Creative & Domain-Specific Validation

```bash
cd /home/dustin/projects/geoform
# Behavioral proof: run ONLY the new describe block and eyeball the 4 test names.
npx vitest run src/components/__tests__/FormStackProvider.test.tsx -t "duplicate id"
# EXPECT: 4 tests pass (warn-on-duplicate, no-warn-unique, no-warn-first, production-no-warn).

# Red→Green proof (optional but recommended): temporarily revert just the deps change
# (back to []), re-run the duplicate test, confirm it FAILS (the second openForm sees an
# empty stack → no warn), then restore [state.stack]. This proves the test actually
# exercises the guard and the deps change is load-bearing.

# Build the package (proves the published source is consistent):
npm run build
# EXPECT: success (tsup).
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npx tsc --noEmit` exit 0 (your 3 files: zero new errors).
- [ ] `npx vitest run src/components/__tests__/FormStackProvider.test.tsx` all green.
- [ ] `npx vitest run` all green (no regression).
- [ ] `git status --short` shows exactly the 3 files.

### Feature Validation

- [ ] `openForm` body begins with the dev-mode duplicate check (before the deferred).
- [ ] The warning contains `Duplicate form id "${options.id}" detected` + PRD §5.2 reference.
- [ ] `openForm` deps are `[state.stack]`.
- [ ] The form is STILL pushed (`dispatch PUSH_FORM` + `return deferred.promise` unchanged).
- [ ] Production does NOT warn (the production-mode test asserts `not.toHaveBeenCalled()`).
- [ ] New tests: dev warn-on-duplicate, dev no-warn-on-unique, dev no-warn-on-first, prod no-warn.
- [ ] `OpenFormOptions.id` JSDoc documents the dev-mode warning + key-collision risk (Mode A).

### Code Quality Validation

- [ ] The guard mirrors the existing dev-guard idiom in this file (typeof process + NODE_ENV).
- [ ] The test reuses the existing `wrapper` + `useFormStackWithActions()` (no new boilerplate).
- [ ] The test uses the double env-set idiom (vi.stubEnv + process.env) + per-call act().
- [ ] No file beyond the 3 scope files was modified.
- [ ] FormStackRenderer.tsx / Breadcrumbs.tsx / useFormStackViewport.ts untouched.

### Documentation & Deployment

- [ ] Mode A JSDoc on `OpenFormOptions.id` clarifies the dev warning + consumer responsibility.
- [ ] No README / CHANGELOG change required for this subtask (changeset doc sync is P1.M3).

---

## Anti-Patterns to Avoid

- ❌ Don't run ruff/mypy/pytest/uv — this is a TS/React project; the gates are
  `npx tsc --noEmit` and `npx vitest run`.
- ❌ Don't add an early `return` after the warning. The form MUST still be pushed — this is
  a diagnostic warning, not a guard. The `dispatch PUSH_FORM` + `return deferred.promise`
  run unconditionally.
- ❌ Don't keep `openForm`'s deps as `[]`. It now reads `state.stack`, so deps MUST be
  `[state.stack]` (React's rules-of-hooks / exhaustive-deps). Keeping `[]` would make the
  duplicate check read a STALE (always-empty) stack and never warn.
- ❌ Don't "optimize" the deps away with a ref. The contract prescribes `[state.stack]`, and
  it introduces no new regression (cancelForm/popToIndex already depend on it).
- ❌ Don't forget the direct `process.env.NODE_ENV` set in the test. `vi.stubEnv` alone sets
  only `import.meta.env`; the source checks `process.env` → the guard never fires → test fails.
- ❌ Don't call both `openForm`s back-to-back without per-call `act()`. The second call must
  see the flushed stack from the first push; without per-call act() it shares the pre-render
  closure (empty stack) → no duplicate detected → test fails.
- ❌ Don't use `autoRender={false}` in the duplicate-id test. It fires the forgotten-host
  guard (console.warn) and pollutes the spy. Use the existing default `wrapper` (autoRender=true).
- ❌ Don't edit `FormStackRenderer.tsx` or `Breadcrumbs.tsx` to change the `key` strategy.
  Issue 4 offered two fixes; this task implements the *warn* remediation only. The
  monotonic-index keying alternative is out of scope.
- ❌ Don't edit `useFormStackViewport.ts` or its test — that's parallel S2's scope (Issue 3).
- ❌ Don't change the `StackEntry.id` JSDoc (it says "Unique identifier for the form" —
  different text). Only `OpenFormOptions.id` ("Unique identifier for this form instance") is
  in scope for the Mode-A note.
- ❌ Don't alter the contract's exact warning message (the trailing space in the first
  fragment, the PRD §5.2 quote). Use it verbatim.

---

## Confidence Score

**9.5 / 10** for one-pass success. The fix is prescribed verbatim by the authoritative
`issue_analysis.md §Issue 4` and the item-description CONTRACT (exact guard code + exact
message + exact deps change). The current `openForm` body, the closest dev-warning test
(`closeForm development warning`), the exact env-stubbing idiom, and the file's existing
`state.stack`-dependent siblings (`cancelForm`, `popToIndex`) are all confirmed by direct
reads and quoted verbatim in the Implementation Blueprint. The two test-correctness
landmines — (1) `vi.stubEnv` only sets `import.meta.env` so `process.env` must also be set,
and (2) per-call `act()` so the second `openForm` sees the flushed stack — are both called
out with explicit workarounds. The deps change is justified (no new re-render regression:
`cancelForm`/`popToIndex` already depend on `[state.stack]`). Scope is fully isolated from
parallel S2 (different files). The only half-point of reservation is the test's dependence
on React's act()-flush semantics for the cross-call stack visibility — but that's a
well-understood React Testing Library behavior, and the per-call act() pattern is the
documented correct approach.
