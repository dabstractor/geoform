# PRP — P1.M2.T4.S1: Verify README Completeness for All 0.2.0 Symbols + Build/Typecheck/Test Green

---

## Goal

**Feature Goal**: Perform the **§5 Mode B final README consistency sweep** for the
0.2.0 "Hostable Viewport (Single Shared Modal)" changeset. Prove, deterministically,
that (a) **every** 0.2.0 public symbol is mentioned in `README.md`, (b) the three
release gates (`npm run build`, `npm run type-check`, `npm test`) are green with the
expected test count (≥ 287), and (c) the five README sections touched by the
changeset (`FormStackProvider`, `Hooks`, `Types`, `Advanced Usage`, `Common Pitfalls`)
are internally consistent — no stale claim (e.g. "useFormStack returns only 3
actions") survives. This is a **verification + tidy** task: the prior sibling tasks
(P1.M2.T1.S1–S4, P1.M2.T2.S1–S2) are already Complete, and P1.M1.T1.S2 added the
`popToIndex` test that lifts the suite to 287.

**Deliverable**:
1. A reproduced, green verification run of the **grep set** (7 symbols/phrases, each
   ≥1 hit), **build** (tsup), **type-check** (`tsc --noEmit`), and **test**
   (`vitest run`, ≥ 287 tests).
2. A section-by-section consistency sign-off of the five README sections named in
   the contract.
3. **Conditional, minimal in-place README edits** — ONLY where a genuine residual
   staleness or broken anchor is found. If the README is already complete and
   consistent (the researched baseline), **zero file edits are required and that is
   a correct, expected outcome**.
4. **No source-library changes.** Mode B: any README-vs-source drift is fixed in the
   README, never in `src/`.

**Success Definition**:
- All 7 grep-set entries return ≥1 hit in `README.md`:
  `autoRender`, `FormStackViewport`, `cancelForm`, `popToIndex`,
  `useFormStackViewport`, `FormStackViewportValue`, and the phrase
  `Single Shared Modal` (or `shared modal`).
- `npm run build`, `npm run type-check`, and `npm test` all exit 0; test count is
  **≥ 287**.
- The five README sections contain no internal contradiction and no claim that
  contradicts `src/` behaviour.
- A consumer reading only `README.md` can adopt `autoRender={false}` +
  `<FormStackViewport/>` correctly (the adoption-readiness bar from
  `delta_prd.md` §7).

---

## User Persona (if applicable)

**Target User**: The 0.2.0 **release owner** — the person who must assert, with
evidence, that the changeset-level documentation is complete and the package still
builds/passes before tagging. They are NOT reading this PRP to build a feature; they
are reading it to **ship**.

**Use Case**: Before cutting the 0.2.0 release, run one deterministic sweep that
either confirms "README complete + all gates green + no contradictions" or surfaces
the exact residual defect to fix in place.

**Pain Points Addressed**: Manual "eyeball" sign-off is error-prone; a symbol can be
documented in one table but missing from another, or a stale claim can linger after
an API addition. The sweep replaces eyeballing with a **grep contract** + a
**deterministic gate run** + a **fixed consistency checklist**.

---

## Why

- **Closes the §5 Mode B loop.** `delta_prd.md` §7 Success Criteria require
  "README.md documents every 0.2.0 public symbol … grep for each new symbol returns
  hits in README" and "Full test suite (286+) continues to pass; `npm run build` /
  `npm run typecheck` green." This task is the formal, reproducible proof of those
  two criteria.
- **Catches cross-section drift.** The same symbol was documented across several
  tables (e.g. `cancelForm` appears in the `useFormStack` Returns table, the
  `useFormStackActions` Returns table, and the `FormStackActions` type block). A
  sweep is the only stage positioned to verify **all** instances are consistent.
- **Protects the adoption path.** `delta_prd.md` §7's final criterion — "a consumer
  reading only the README can adopt `autoRender={false}` + `<FormStackViewport/>`
  correctly" — is a readability property that gates don't catch; the consistency
  read does.
- **No behavioral risk.** Mode B: no `src/` edits. The worst case is a one-line
  README fix; the best (and researched-baseline) case is zero edits.

---

## What

A deterministic, three-phase sweep executed against the repo after the prior
README-editing siblings are Complete.

### Scope (EXACT — do only this)

1. **GREP VERIFICATION** — run the exact grep set (see Implementation Tasks); every
   entry must return ≥1 hit.
2. **GATE VERIFICATION** — run `npm run build`, `npm run type-check`, `npm test`;
   all must exit 0 with ≥ 287 tests.
3. **CONSISTENCY READ** — read the five named README sections against the
   checklist (§Implementation Blueprint); confirm no staleness and no README-vs-source
   contradiction. **Fix residual staleness in place in `README.md` only** if (and
   only if) a genuine defect is found.

**Do NOT** restructure README sections, rewrite prose, or "improve" wording — this
is a consistency sweep, not a documentation redesign. **Do NOT** edit any file under
`src/`. **Do NOT** revert or delete the parallel P1.M2.T3.S1 example pointer lines
if present (see Parallel-Sibling Awareness). **Do NOT** add the optional
`examples/shared-modal/` yourself — that is P1.M2.T3.S1's deliverable.

### Success Criteria

- [ ] Grep set: all 7 entries return ≥1 hit in `README.md`.
- [ ] `npm run build` exits 0 (tsup CJS+ESM+DTS success).
- [ ] `npm run type-check` exits 0 (`tsc --noEmit`).
- [ ] `npm test` exits 0 with **≥ 287** tests passing.
- [ ] Five named README sections pass the consistency checklist (no stale
      "3-actions"-style claim; tables and type blocks in agreement; README claims
      match `src/` behaviour).
- [ ] Any edit made is to `README.md` only, is minimal, and is justified by a
      specific defect (or: zero edits, if the baseline holds).
- [ ] No file under `src/` is modified (`git status --short` shows none).

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed to
implement this successfully?_ **Yes.** The exact grep commands, the exact gate
commands, the known-good baseline numbers (287 tests; all symbols already present;
build/type-check green), the exact section-by-section consistency checklist, the
explicit **non-staleness callout** that prevents the single most likely
false-positive edit, the README-vs-source cross-check items (Mode B: fix README,
not source), and the parallel-sibling (P1.M2.T3.S1) awareness are all captured
below. No inference is required.

### Documentation & References

```yaml
# MUST READ — the verification contract (defines the grep set + gate names)
- file: plan/002_32eb66cd705d/architecture/readme_gap_map.md
  why: "§Completion Verification" defines the EXACT 7-entry grep set and the three
        gate commands (build / tsc --noEmit / vitest run) the sweep must satisfy.
  section: "Completion Verification (after edits)"
  critical: Its "New-Public-Symbol Presence" table shows several symbols as
        "MISSING" — that table is STALE; the symbols were added by the now-Complete
        P1.M2.T1.* / P1.M2.T2.* siblings. The sweep re-greps to prove they are present.

# MUST READ — the success criteria this sweep proves
- file: plan/002_32eb66cd705d/delta_prd.md
  why: §7 "Success Criteria" is the authoritative bar (grep hits + ≥286 tests +
        build/typecheck green + consumer-readable). §4 D2 enumerates the README
        sections that must be consistent. §6 reaffirms "no behavior change".
  section: "§4 D2 + §6 + §7"

# MUST READ — the artifact being verified
- file: README.md
  why: The sweep target. Read the five sections named in the contract:
        FormStackProvider (#### FormStackProvider incl. autoRender props table +
        Dev-mode guard note), Hooks (#### useFormStack / useFormStackState /
        useFormStackActions / useFormStackURLSync / useFormStackViewport Returns
        tables), Types (#### FormStackActions + #### FormStackViewportValue type
        blocks), Advanced Usage (### Hostable Viewport (Single Shared Modal)),
        Common Pitfalls (### Forgetting <FormStackViewport/> with autoRender={false}).
  gotcha: README is being concurrently lengthened by P1.M2.T3.S1 (two additive
        pointer lines). Anchor on TEXT, never line numbers.

# MUST READ — source truth the README claims must match (Mode B fixes README, not src)
- file: src/components/FormStackProvider.tsx
  why: Authoritative for autoRender default, the dev-mode forgotten-host guard
        (warns ≤ once per episode, dev-only, resets on mount/clear), cancelForm()
        (no-op on empty; resolves top deferred with undefined; honors
        confirmOnCancel), and popToIndex(index).
  critical: If a README claim drifts from this file, edit README to match — NEVER
        edit src/ (Mode B / no behavior change).

# MUST READ — type definitions the README type blocks must match
- file: src/types/context.ts
  why: FormStackViewportValue interface (fields: stack, onClose, onCancelRequest)
        — the README #### FormStackViewportValue type block must match this shape.
- file: src/index.ts
  why: The public export surface — confirms which symbols are actually shipped
        (autoRender on FormStackProvider; FormStackViewport; useFormStackViewport;
        FormStackViewportValue; cancelForm/popToIndex on the action hooks).

# MUST READ — the parallel sibling's effect on README (do NOT revert its pointers)
- file: plan/002_32eb66cd705d/P1M2T3S1/PRP.md
  why: P1.M2.T3.S1 (OPTIONAL example) adds examples/shared-modal/{App.tsx,README.md}
        and two additive one-line README pointers to ./examples/shared-modal
        (one in the Hostable Viewport subsection after the @see line; one in the
        ## Examples section before ## Browser Support). Its examples/ files are
        excluded from all gates (see Context §"Gate Scope").
  critical: Those pointer lines may or may not be present when the sweep runs
        (T3.S1 was in-flight in parallel). If present, they are T3.S1's deliverable;
        do NOT delete them. They do NOT affect the 7-symbol grep set.

# REFERENCE — the house README conventions (so any in-place fix matches style)
- file: plan/002_32eb66cd705d/architecture/readme_gap_map.md
  why: "House-Style Templates" defines the Hook Returns table format and the Type
        Definition block format. Any fix must match these exactly.
  section: "House-Style Templates (match exactly)"
```

### Current Codebase tree (relevant slice)

```bash
README.md                     # SWEEP TARGET — five sections verified, fixed only if stale
src/                          # READ-ONLY (Mode B: no edits). Truth source for cross-checks
  components/FormStackProvider.tsx   # autoRender default + dev guard + cancelForm/popToIndex
  components/FormStackViewport.tsx   # zero-prop viewport (README entry must match)
  hooks/useFormStackViewport.ts      # returns FormStackViewportValue | null
  types/context.ts                   # FormStackViewportValue interface shape
  index.ts                           # public export surface
examples/                      # EXCLUDED from all gates (see Gate Scope)
  relational-forms/            # existing
  shared-modal/                # ADDED by parallel P1.M2.T3.S1 (if completed) — leave alone
package.json  tsconfig.json  tsup.config.ts  vitest.config.ts   # gate scope configs
plan/002_32eb66cd705d/
  P1M2T4S1/research/verification_baseline.md   # the known-good baseline evidence (READ)
```

### Desired Codebase tree with files to be added/changed

```bash
README.md                      # UNCHANGED (preferred) — or 1..N minimal in-place fixes
                               #   ONLY where a genuine staleness/contradiction is found
# No new files are created by this task. (A verification record may be written to
# plan/002_32eb66cd705d/P1M2T4S1/research/ if useful, but is optional.)
```

Responsibility of each touched file: `README.md` is the sole file that MAY be edited,
and only with surgical, defect-justified fixes.

### Known Gotchas of our codebase & Library Quirks

```python
# CRITICAL: This is a VERIFICATION sweep, NOT a feature build. At the researched
# baseline (commit b6f13e6) ALL gates are green (287/287 tests; build success;
# tsc --noEmit exit 0) and ALL 7 grep-set symbols are already present. The sweep's
# job is to RE-PROVE that and fix only residual staleness. "Zero README edits" is a
# CORRECT, EXPECTED outcome if the baseline holds.

# CRITICAL (false-positive guard): README's `#### useFormStack` code EXAMPLE contains
#   const { stack, openForm, closeForm } = useFormStack();
# This is an idiomatic MINIMAL DESTRUCTURE (destructure only what the example uses),
# NOT a claim that useFormStack returns only 3 things — the Returns table immediately
# below lists all 5. DO NOT "fix" this by adding popToIndex/cancelForm to the
# destructure. This is the single most likely erroneous edit a sweep can introduce.

# CRITICAL (Mode B): any README-vs-source drift is fixed in README, NEVER in src/.
# The dev-guard wording, cancelForm() semantics, popToIndex semantics, and
# FormStackViewportValue shape are defined in src/; README must conform.

# CRITICAL (parallel sibling): P1.M2.T3.S1 runs in parallel and may add two README
# pointer lines to ./examples/shared-modal (Hostable Viewport subsection + Examples
# section) plus examples/shared-modal/* files. Do NOT revert the pointer lines; the
# example files are excluded from build/type-check/test by config and cannot break gates.

# GOTCHA: the gate names are `build` (tsup), `type-check` (tsc --noEmit), `test`
# (vitest run) — note the hyphen in `type-check`. The contract's `npx tsc --noEmit`
# and `npx vitest run` are the same as `npm run type-check` and `npm test`.

# GOTCHA: anchor ALL README reads/edits on TEXT, not line numbers — the README shifts
# under the parallel T3.S1 pointer insertions and under any in-place fix you make.

# GOTCHA: the grep-set phrase is "Single Shared Modal" OR "shared modal"
# (case-insensitive). Either match counts. The Features bullet uses
# "Hostable Viewport (Single Shared Modal)"; the Advanced Usage subsection heading is
# "### Hostable Viewport (Single Shared Modal)". Both satisfy the phrase requirement.

# GOTCHA: the delta_prd.md "286+" test figure predates the popToIndex test added in
# P1.M1.T1.S2. The CURRENT correct floor is 287. Do not treat 286 as the target.
```

---

## Implementation Blueprint

### Implementation Tasks (ordered by dependencies)

```yaml
Task 0: READ the known-good baseline (do this FIRST to calibrate expectations)
  - READ: plan/002_32eb66cd705d/P1M2T4S1/research/verification_baseline.md
  - NOTE the baseline numbers: 287/287 tests; build success; tsc exit 0; all 7
        grep-set symbols already ≥1 hit; NO internal contradictions found.
  - INTERNALIZE the false-positive guard (the useFormStack minimal-destructure line
        is NOT staleness) and the Mode-B rule (fix README, never src/).

Task 1: GREP VERIFICATION — prove every 0.2.0 symbol is in README
  - RUN (exact):
        for s in autoRender FormStackViewport cancelForm popToIndex \
                 useFormStackViewport FormStackViewportValue; do
          printf '%-24s %s\n' "$s" "$(grep -c "$s" README.md)"
        done
        echo "Single Shared Modal : $(grep -c 'Single Shared Modal' README.md)"
        echo "shared modal (ci)   : $(grep -ci 'shared modal' README.md)"
  - ASSERT: each of the 6 symbols prints ≥1; at least one of the two phrase
        variants prints ≥1.
  - IF any symbol prints 0: that is a genuine gap. Add the missing mention in the
        CORRECT section per readme_gap_map.md §"Section-by-Section Insertion Map"
        (e.g. a missing `cancelForm` row belongs in BOTH the useFormStack and
        useFormStackActions Returns tables AND the FormStackActions type block).
        Match the House-Style Templates exactly. (At baseline this branch is not
        expected to trigger.)

Task 2: GATE VERIFICATION — prove build/type-check/test are green
  - RUN: npm run build        # tsup (CJS+ESM+DTS) — expect "Build success", exit 0
  - RUN: npm run type-check   # tsc --noEmit — expect no output, exit 0
  - RUN: npm test             # vitest run — expect "Tests 287 passed (287)", exit 0
  - ASSERT: all three exit 0; test count is ≥ 287.
  - IF a gate is red: this is out of scope for a README sweep (it indicates a
        source/regression issue). Record the failure verbatim and STOP — do NOT
        attempt source fixes (Mode B / forbidden). Surface to the orchestrator.

Task 3: CONSISTENCY READ — the five named sections (run AFTER Tasks 1-2)
  Read each section and confirm the checklist. For each item, the known-good
  baseline status is noted; "FIX" only if the item is actually wrong.

  3a. #### FormStackProvider (Components section)
      - Props table has an `autoRender` row: type `boolean`, default `true`,
        describing true = provider renders viewport (v1 behavior) vs. false = host
        via <FormStackViewport/>.                         [baseline: present ✅]
      - "Dev-mode guard" note: warns ≤ once per "forgotten host" episode when
        autoRender={false} + open form + no mounted <FormStackViewport/>; dev-only;
        resets once a viewport mounts or the stack clears. Cross-check wording vs.
        src/components/FormStackProvider.tsx (the console.warn guard). FIX README
        if it over- or under-states the guard.            [baseline: matches ✅]

  3b. Hooks — Returns tables
      - #### useFormStack Returns table lists ALL of: stack, openForm, closeForm,
        popToIndex, cancelForm (5 rows).                  [baseline: 5 rows ✅]
      - #### useFormStackActions Returns table lists ALL of: openForm, closeForm,
        popToIndex, cancelForm (4 rows).                  [baseline: 4 rows ✅]
      - #### useFormStackViewport Returns table lists `value` of type
        FormStackViewportValue | null.                    [baseline: present ✅]
      - VERIFY the two action tables AGREE on the popToIndex and cancelForm
        descriptions (same semantics wording). FIX if one drifts.
                                                            [baseline: identical ✅]
      - DO NOT "fix" the minimal destructure in the useFormStack code EXAMPLE
        (see false-positive guard in Known Gotchas).      [baseline: leave as-is ✅]

  3c. Types — type blocks
      - #### FormStackActions interface block lists openForm, closeForm,
        popToIndex, cancelForm and matches src/index.ts → src/types.
                                                            [baseline: matches ✅]
      - #### FormStackViewportValue interface block lists stack, onClose,
        onCancelRequest and matches src/types/context.ts; includes the note that
        InternalStackEntry is internal/not exported.      [baseline: matches ✅]

  3d. ### Hostable Viewport (Single Shared Modal) (Advanced Usage)
      - Uses <FormStackProvider autoRender={false}>.       [baseline ✅]
      - Mounts EXACTLY ONE <FormStackViewport/>.           [baseline ✅]
      - Wires the host close gesture to cancelForm() (e.g. Dialog onClose={cancelForm}).
                                                            [baseline ✅]
      - Renders <Breadcrumbs/> as the header (DialogTitle). [baseline ✅]
      - "Guarantees" para states the renderer renders exactly once and the
        openForm() promise contract is unchanged.          [baseline ✅]
      - NOTE: if P1.M2.T3.S1's pointer line ("See examples/shared-modal …") is
        present after the @see line, leave it intact. If it is present but its
        anchor/link is broken, fix the anchor text in place (do not delete it).

  3e. ### Forgetting <FormStackViewport/> with autoRender={false} (Common Pitfalls)
      - Matches house BAD/GOOD/Why template.               [baseline ✅]
      - References the dev-mode guard consistently with §FormStackProvider's note
        (same "≤ once per episode / dev-only / resets" wording). FIX if inconsistent.
                                                            [baseline: consistent ✅]

Task 4: CONDITIONAL FIX — apply only if Task 3 found a genuine defect
  - For each defect: make the MINIMAL in-place README edit, anchored on unique text.
  - Match House-Style Templates (Returns table row format; Type Definition block).
  - RE-RUN Task 1 (grep) and Task 2 (gates) after ANY edit to confirm no regression.
  - DO NOT edit src/. DO NOT revert P1.M2.T3.S1 pointer lines. DO NOT restructure.

Task 5: RECORD THE VERIFICATION RESULT
  - Summarize: grep-set table (symbol → hit count), gate results (build/type-check/
    test exit codes + test count), section-by-section checklist sign-off, and a list
    of any edits made (with before/after) — or an explicit "zero edits" statement.
  - Optional: write the record to
    plan/002_32eb66cd705d/P1M2T4S1/research/verification_record.md (allowed output).
```

### Implementation Patterns & Key Details

```bash
# === The grep contract (Task 1) — reproduce verbatim ===
# Every line below must print ≥1.
for s in autoRender FormStackViewport cancelForm popToIndex \
         useFormStackViewport FormStackViewportValue; do
  printf '%-24s %s\n' "$s" "$(grep -c "$s" README.md)"
done
# Phrase variant — at least one of these two must print ≥1:
grep -c  'Single Shared Modal' README.md   # exact-case
grep -ci 'shared modal'        README.md   # case-insensitive (catches "Shared Modal")

# === The gate contract (Task 2) ===
npm run build        # → "Build success" (CJS + ESM + DTS), exit 0
npm run type-check   # → silent, exit 0
npm test             # → "Tests 287 passed (287)", exit 0   (floor: 287)

# === The no-regression assertion (after any Task 4 edit) ===
git status --short src/   # MUST be empty (Mode B: no source edits)

# === The consistency cross-check (Task 3) — README claim vs source truth ===
# autoRender default + dev-guard wording:
grep -n "autoRender" src/components/FormStackProvider.tsx
grep -n "console.warn\|forgotten host\|autoRender" src/components/FormStackProvider.tsx
# cancelForm / popToIndex semantics:
grep -n "cancelForm\|popToIndex" src/components/FormStackProvider.tsx
# FormStackViewportValue shape:
grep -n "FormStackViewportValue" src/types/context.ts
```

### Integration Points

```yaml
SOURCE (none):
  - Mode B: NO edits under src/. git status --short src/ must be empty.

PACKAGE / BUILD / TYPE-CHECK / TEST CONFIG (none):
  - No config changes. The gates' scopes already exclude examples/ (see Gate Scope
    in Context), so P1.M2.T3.S1's example files cannot affect them.

README (conditional, in-place only):
  - sections that MAY receive a minimal fix (only if a defect is found):
      FormStackProvider props table / Dev-mode guard note;
      useFormStack + useFormStackActions Returns tables;
      FormStackActions + FormStackViewportValue type blocks;
      Hostable Viewport (Single Shared Modal) subsection;
      Forgetting <FormStackViewport/> Common Pitfall.
  - rule: fix README to match src/, never the reverse. Anchor edits on unique text.
  - parallel-safety: do NOT touch P1.M2.T3.S1's ./examples/shared-modal pointer lines
      (other than fixing a broken anchor in place, without deleting).

ROUTES / DATABASE / CONFIG: none.
```

---

## Validation Loop

> For this task, Levels 1-3 ARE the work (the sweep is itself a validation). Run
> them in order; the "expected" values are the known-good baseline.

### Level 1: Grep Contract (Symbol Completeness)

```bash
for s in autoRender FormStackViewport cancelForm popToIndex \
         useFormStackViewport FormStackViewportValue; do
  printf '%-24s %s\n' "$s" "$(grep -c "$s" README.md)"
done
grep -c  'Single Shared Modal' README.md
grep -ci 'shared modal'        README.md

# Expected: each of the 6 symbols ≥ 1; at least one phrase variant ≥ 1.
# Baseline: autoRender 21, FormStackViewport 38, cancelForm 6, popToIndex 3,
#           useFormStackViewport 6, FormStackViewportValue 3, "Single Shared Modal" 2.
# Re-run after any in-place fix to confirm the counts did not drop.
```

### Level 2: Gate Contract (Build / Type-check / Test)

```bash
npm run build && npm run type-check && npm test

# Expected: all three exit 0.
# Baseline: build → CJS+ESM+DTS "Build success"; type-check → silent exit 0;
#           test → "Test Files 26 passed (26) | Tests 287 passed (287)".
# Floor on test count: ≥ 287 (the delta_prd "286+" predates the popToIndex test).
```

### Level 3: Consistency Read (Section Sign-off)

```bash
# Quick machine-assisted consistency checks (the human-style read is in Task 3):
# (a) both action tables list popToIndex AND cancelForm:
grep -n "popToIndex\|cancelForm" README.md   # expect matches in BOTH Returns tables
                                            #   AND the FormStackActions type block

# (b) the Hostable Viewport host wires cancelForm + exactly one viewport:
grep -n "autoRender={false}" README.md
grep -n "onClose={cancelForm}" README.md
grep -c "<FormStackViewport />" README.md   # informational (appears in several snippets)

# (c) no stale "returns only"/"only returns" action-count claim:
grep -ni "returns only\|only returns" README.md | grep -i "action\|hook\|useFormStack" || echo "none (good)"

# Expected: (a) ≥ 6 matches across the two tables + the type block; (b) autoRender={false}
# and onClose={cancelForm} present in the Hostable Viewport snippet; (c) "none (good)".
# The read in Task 3 is authoritative; these greps are a fast double-check.
```

### Level 4: Sweep-Hygiene & Parallel-Safety Validation

```bash
# Confirm Mode B held (no source touched):
git status --short src/                       # MUST be empty

# Confirm examples/ exclusion still holds (P1.M2.T3.S1 can't break gates):
node -e "console.log(require('./package.json').files)"   # [ 'dist', 'README.md', 'LICENSE' ]
grep -n "entry:" tsup.config.ts                          # entry: ['src/index.ts']
grep -n '"include"' tsconfig.json                        # ["src", "vitest.setup.ts"]
grep -n "include:" vitest.config.ts                      # ['src/**/*.{test,spec}.{ts,tsx}']

# Confirm P1.M2.T3.S1 pointer lines (if present) are intact, not reverted:
grep -n "examples/shared-modal" README.md   # ≥ 0 (may be 0 if T3.S1 still in flight;
                                            #   if present, must NOT have been deleted)

# Expected: src/ clean; config exclusions intact; T3.S1 pointers (if any) preserved.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 grep contract met: all 7 grep-set entries ≥1 hit in `README.md`.
- [ ] Level 2 gate contract met: `npm run build`, `npm run type-check`, `npm test`
      all exit 0; test count ≥ 287.
- [ ] Level 3 consistency read passed for all five sections (3a–3e).
- [ ] Level 4 hygiene passed: `git status --short src/` empty; config exclusions
      intact; P1.M2.T3.S1 pointers (if present) preserved.

### Feature Validation

- [ ] Every 0.2.0 public symbol (autoRender, FormStackViewport, cancelForm,
      popToIndex, useFormStackViewport, FormStackViewportValue) is documented in
      `README.md`.
- [ ] The shared-modal pattern ("Single Shared Modal" / "shared modal") is
      documented in `README.md`.
- [ ] No stale "useFormStack returns only 3 actions"-style claim survives.
- [ ] README claims (dev-guard, cancelForm/popToIndex semantics,
      FormStackViewportValue shape) match `src/` behaviour.
- [ ] A consumer reading only `README.md` can adopt `autoRender={false}` +
      `<FormStackViewport/>` correctly.

### Code Quality Validation

- [ ] Any README edit is minimal, text-anchored, and justified by a specific defect
      (or: zero edits, with that explicitly recorded).
- [ ] Any README edit matches the House-Style Templates (Returns table row format;
      Type Definition block).
- [ ] No false-positive edit to the `useFormStack` code example's minimal
      destructure (`const { stack, openForm, closeForm } = useFormStack();`).
- [ ] No file under `src/` modified (Mode B).
- [ ] No P1.M2.T3.S1 deliverable (examples/shared-modal/* or README pointer lines)
      reverted.

### Documentation & Deployment

- [ ] Verification record produced (grep table + gate results + section sign-off +
      edit list or explicit "zero edits").
- [ ] No new dependencies, config, or source behavior introduced.

---

## Anti-Patterns to Avoid

- ❌ Don't treat this as a feature build — it is a verification sweep; "zero edits"
      is a correct outcome when the baseline holds.
- ❌ Don't "fix" the `const { stack, openForm, closeForm } = useFormStack();` line
      in the useFormStack code example — it is an idiomatic minimal destructure, not
      a stale "3 actions" claim. (Single most likely false-positive.)
- ❌ Don't edit any file under `src/` to "make README match" — Mode B fixes README,
      never source.
- ❌ Don't restructure README sections or rewrite prose — surgical, defect-justified
      fixes only.
- ❌ Don't revert or delete P1.M2.T3.S1's `examples/shared-modal/` files or its two
      README pointer lines (parallel sibling's deliverable).
- ❌ Don't anchor README reads/edits on line numbers — the README shifts under the
      parallel T3.S1 insertions and under your own edits; anchor on unique text.
- ❌ Don't treat the delta_prd "286+" test figure as the target — the current floor
      is **287** (the popToIndex test from P1.M1.T1.S2 raised it).
- ❌ Don't attempt source fixes if a gate is red — that is out of scope for a Mode B
      README sweep; record the failure verbatim and surface it to the orchestrator.
- ❌ Don't add the optional `examples/shared-modal/` demo yourself — that is
      P1.M2.T3.S1's task (and is marked OPTIONAL/non-blocking regardless).

---

**Confidence Score**: 9/10 — The task is a bounded verification sweep with a fully
researched known-good baseline (287/287 tests; build + type-check green; all 7
grep-set symbols already present; no internal contradictions found). The residual
uncertainty is small and one-sided: the only likely "work" is either zero edits
(the baseline holds) or a single minimal in-place README fix if the parallel
P1.M2.T3.S1 pointer introduced a broken anchor or if a cross-section drift escaped
prior siblings. The explicit false-positive guard (the useFormStack minimal
destructure) and the Mode-B / parallel-safety rules remove the two realistic ways
this sweep could do harm.
