# PRP — P1.M1.T1.S1: Produce formal conformance audit note

---

## Goal

**Feature Goal**: Produce the formal, authoritative conformance audit note
(`plan/002_32eb66cd705d/audit_note.md`) that **formalizes** the already-completed
0.2.0 conformance audit into the deliverable required by `delta_prd.md` §4 D1
("Output: a short audit note"). The note must state, for each of the seven D1
bullets, a PASS verdict with a one-line `file:line` citation and the covering
test name; record the single genuine mismatch and its resolution; record the
informational NOTE 2; and record the freshly re-run green tooling counts
(`tsc`, `vitest`). **No source code is modified in this subtask.**

**Deliverable**: A single new file — `plan/002_32eb66cd705d/audit_note.md` —
concise (≤ 2 pages when rendered), that is the authoritative audit deliverable.

**Success Definition**: The file exists; every D1 bullet has a PASS verdict with
a real, verifiable `file:line` citation and test name; the `popToIndex`/
`useFormStack()` mismatch and the `void`-vs-`Promise` note are both recorded
with their dispositions; the note records live green counts from a re-run of
`npx tsc --noEmit` and `npx vitest run`; and a downstream reader (specifically
the P1.M2 README task) can learn the **final hook surface** from it without
reading any other file.

---

## User Persona (if applicable)

**Target User**: The orchestrator / sibling implementing agents (P1.M1.T1.S2 and
the P1.M2 docs milestone) — not an end user.

**Use Case**: S2 fixes MISMATCH 1 and P1.M2 documents 0.2.0; both consult the
audit note to learn what the conformance verdict is, what the one open gap is,
and what the final public hook surface should be.

**Pain Points Addressed**: The raw `architecture/audit_findings.md` is working
evidence, not a "short audit note" deliverable. This task produces the formal,
citable artifact the delta explicitly requires.

---

## Why

- **Fulfills Requirement D1 of the delta.** `delta_prd.md` §4 mandates "a short
  audit note (file under `plan/002_32eb66cd705d/`)" as the D1 deliverable. The
  audit *work* is done; the *artifact* is not yet written. This task writes it.
- **Establishes the authoritative final hook surface.** P1.M2 (README sync)
  must document the exact symbols on `useFormStack()` etc. The audit note is the
  single source of truth that says "after S2, `useFormStack()` returns
  `{ stack, openForm, closeForm, popToIndex, cancelForm }`".
- **Records the one real gap and its fix.** MISMATCH 1 (`popToIndex` missing
  from the combined hook) is fixed in S2; the note records the pre-fix state and
  the agreed resolution so the chain is auditable.
- **Proves tooling health at audit time.** Re-running `tsc` + `vitest` and
  recording the counts gives the deliverable live evidence rather than a
  copy-pasted claim.

---

## What

A concise (≤ 2 pages rendered) Markdown audit note at
`plan/002_32eb66cd705d/audit_note.md` containing exactly these sections:

1. **Header** — title, scope ("Delta 0.2.0 conformance audit — formal note"),
   reference to the source evidence (`architecture/audit_findings.md`), and the
   cross-referenced specs (`delta_prd.md` §4 D1; `PRD.md` §5.1, §5.2, §10,
   §10.1, §16).
2. **Tooling evidence (live re-run)** — the exit status + counts from a fresh
   `npx tsc --noEmit` and `npx vitest run`, captured at the time the note is
   written.
3. **D1 conformance table** — seven rows, each: bullet → **PASS** → one-line
   `file:line` citation → covering test name(s).
4. **Mismatch register** — the single genuine mismatch (MISMATCH 1) with its
   severity, the recommended additive fix, and an explicit pointer to the sibling
   task (P1.M1.T1.S2) that implements it.
5. **Notes (no action)** — NOTE 2 (`popToIndex` `void` return type matches PRD
   §5.2) recorded as "matches spec — no action".
6. **Audit conclusion** — a one-paragraph summary: behavioral spec fully met
   modulo the one additive S2 fix; final hook surface stated.

**This subtask does NOT modify any source file.** The only file it creates is
the audit note itself.

### Success Criteria

- [ ] `plan/002_32eb66cd705d/audit_note.md` exists.
- [ ] Each of the 7 D1 bullets is marked **PASS** with a real `file:line`
      citation and a covering test name.
- [ ] The note records the live green counts from a fresh `npx tsc --noEmit`
      (exit 0) and `npx vitest run` (count/count green across N files).
- [ ] MISMATCH 1 (`popToIndex` absent from `useFormStack()`) is recorded with the
      resolution = additive fix in P1.M1.T1.S2.
- [ ] NOTE 2 (`void` return type) is recorded as "matches PRD §5.2 — no action".
- [ ] The note states the final intended hook surface explicitly.
- [ ] The note is ≤ 2 pages rendered and is self-contained (a reader needs no
      other file to understand the verdict).
- [ ] No files under `src/`, `PRD.md`, `tasks.json`, or `prd_snapshot.md` are
      touched.

---

## All Needed Context

### Context Completeness Check

_If someone knew nothing about this codebase, would they have everything needed
to implement this successfully?_ **Yes.** The audit is already performed and its
evidence is in `architecture/audit_findings.md`. The PRP below restates every
citation and test name the writer needs, plus the exact validation commands.
The writer's only real judgment call is formatting — the content is determined.

### Documentation & References

```yaml
# MUST READ — primary input (the audit evidence to formalize)
- file: plan/002_32eb66cd705d/architecture/audit_findings.md
  why: Source of truth for all 7 PASS bullets, MISMATCH 1, and NOTE 2 — with
        file:line citations and test names. The audit note is its formal distillation.
  critical: Do NOT copy verbatim. The note must be the ≤2-page *deliverable*
        (concise, citable), not the longer working-evidence file.

# MUST READ — the requirement that mandates this deliverable
- file: plan/002_32eb66cd705d/delta_prd.md
  why: §4 "Requirement D1 — Conformance audit" enumerates the exact bullets the
        note must cover and says "Output: a short audit note". §7 Success Criteria
        sets the bar (impl verified against PRD; full suite green).
  section: §4 D1 (the seven bullets), §7 (Success Criteria)

# MUST READ — the authoritative spec the implementation is audited against
- file: PRD.md
  why: §5.2 defines the exact useFormStack() surface incl. popToIndex (: void);
        §10/§10.1 define rendering + hostable viewport; §16 is the 0.2.0 changelog.
  section: §5.2 (popToIndex void signature), §10.1, §16

# Reference — the downstream consumer's dependency on this note
- file: plan/002_32eb66cd705d/architecture/readme_gap_map.md
  why: Confirms the final surface P1.M2 must document (e.g. useFormStack Returns
        table is missing cancelForm AND popToIndex). The audit note should state
        this final surface explicitly so P1.M2 has one source of truth.
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash
geoform/
├── PRD.md                         # authoritative spec (READ-ONLY here)
├── README.md                      # (stale re: 0.2.0 — out of scope for S1)
├── package.json                   # scripts: test = vitest run, type-check = tsc --noEmit
├── src/
│   ├── components/FormStackProvider.tsx   # cancelForm/popToIndex/dev-guard (cited)
│   ├── components/FormStackViewport.tsx
│   ├── components/FormStackRenderer.tsx
│   ├── hooks/useFormStack.ts             # ← MISMATCH 1: no popToIndex (cited)
│   ├── hooks/useFormStackActions.ts       # ← exposes popToIndex (the source)
│   ├── hooks/useFormStackViewport.ts
│   ├── types/context.ts                   # FormStackViewportValue, FormStackActions
│   └── index.ts                           # public exports
└── plan/002_32eb66cd705d/
    ├── delta_prd.md                       # D1 requirement lives here
    ├── prd_snapshot.md
    ├── architecture/
    │   ├── audit_findings.md             # PRIMARY INPUT for this task
    │   ├── readme_gap_map.md
    │   ├── system_context.md
    │   └── external_deps.md
    └── P1M1T1S1/                          # ← THIS PRP lives here
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
plan/002_32eb66cd705d/
  audit_note.md        # NEW — the formal D1 audit deliverable (this task's ONLY output)
```

### Known Gotchas of our codebase & Library Quirks

```python
# CRITICAL: This task is a DOCUMENTATION/PLANNING artifact. Do NOT edit src/.
#   The only file you create is plan/002_32eb66cd705d/audit_note.md.
#   Touching PRD.md, tasks.json, prd_snapshot.md, or any src/ file is FORBIDDEN.

# CRITICAL: Re-run the tooling LIVE — do not paste the 286/26 numbers from
#   audit_findings.md. The note must record the count observed at write time.
#   (It is expected to still be 286/286 across 26 files because no code changes
#    here, but the note must show the fresh run, not an inherited claim.)

# GOTCHA: package.json scripts -> "test": "vitest run", "type-check": "tsc --noEmit".
#   The task contract phrases them as `npx tsc --noEmit` and `npx vitest run`,
#   which are equivalent to `npm run type-check` / `npm run test`. Either is fine;
#   prefer the `npx` forms to match the contract verbatim.

# GOTCHA: The `void` return type of popToIndex is INTENTIONAL and matches PRD
#   §5.2, even though the implementation is `async`. tsc accepts this (TS
#   void-return rule). NOTE 2 is "no action" — do NOT flag it as a defect.

# GOTCHA: MISMATCH 1 is FIXED IN S2 (a *later* subtask that depends on S1).
#   This note records the gap + resolution; it does NOT fix it. State the final
#   surface as the POST-S2 intent so P1.M2 documents the right thing.
```

---

## Implementation Blueprint

### Document structure

The audit note is Markdown prose + one table. There are no data models, code, or
types to author. The structure is fixed by the D1 bullets.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: RE-RUN TOOLING (capture live evidence for the note)
  - RUN: `npx tsc --noEmit`   → record exit 0 (clean)
  - RUN: `npx vitest run`     → record "N/N tests passed across M files"
  - NOTE: run from repo root (/home/dustin/projects/geoform)
  - EXPECTED: tsc clean; ~286/286 across ~26 files (no code changes since the
        audit, so the count should match audit_findings.md — but RECORD the
        number you actually see).
  - WHY: D1 requires the note to be backed by green tooling; do not inherit the
        number, re-observe it.

Task 2: CREATE plan/002_32eb66cd705d/audit_note.md (the sole deliverable)
  - WRITE: a concise (≤ 2 pages rendered) Markdown file.
  - STRUCTURE (use these exact sections):
      1. Title + scope line + spec references (delta_prd.md §4 D1; PRD §5.1/5.2/
         10/10.1/16; source evidence = architecture/audit_findings.md).
      2. Tooling evidence (live): `tsc --noEmit` → exit 0; `vitest run` →
         <count>/<count> across <files> files. State the run was performed at
         note-writing time.
      3. "D1 Conformance Bullets — ALL PASS" table with 7 rows (see Task 3 for
         the exact citations to use).
      4. "Mismatch register": MISMATCH 1 (popToIndex absent from useFormStack())
         — severity low; recommended additive fix (add to UseFormStackReturn +
         destructure in body); resolution = implemented in P1.M1.T1.S2.
      5. "Notes (no action)": NOTE 2 — popToIndex `void` return type matches
         PRD §5.2 (impl is async; tsc accepts via void-return rule) → no action.
      6. "Audit conclusion": behavioral spec fully met modulo the one additive
         S2 fix; state the final intended hook surface.
  - NAMING/PLACEMENT: exactly `plan/002_32eb66cd705d/audit_note.md`.
  - LENGTH: ≤ 2 pages rendered. Be terse — one-line citations, not paragraphs.

Task 3: POPULATE the 7-row D1 table with these VERIFIED citations
  # Each row: # | D1 bullet (short) | Verdict | file:line citation | test(s)
  # These citations were spot-checked against the current source (Jul 12 2026):
  1. cancelForm() no-op on empty stack + resolves top deferred undefined
     → PASS → src/components/FormStackProvider.tsx:213-222 (guard `if (!top) return;`
       at :215; `top.deferred.resolve(undefined)`)
     → FormStackProvider.autoRender.test.tsx (empty-stack + non-confirmOnCancel blocks)
  2. cancelForm() honors confirmOnCancel (confirm → resolve → pop)
     → PASS → FormStackProvider.tsx handleCancelRequest (:200-206 gates on
       entry.confirmOnCancel); cancelForm awaits + early-returns on reject (:216-219)
     → FormStackProvider.autoRender.test.tsx (confirmOnCancel show-dialog +
       reject-keeps-form blocks)
  3. popToIndex(index) cancels all deeper forms
     → PASS → FormStackProvider.tsx:156-197 (popToIndex useCallback at :156;
       reverses through slice(index+1), resolves each deferred undefined, dispatches POP_TO_INDEX)
     → src/__tests__/integration/BreadcrumbNavigation.integration.test.tsx;
       src/components/__tests__/Breadcrumbs.integration.test.tsx (boundary tests)
  4. Dev-mode forgotten-host guard warns ≤ once per episode
     → PASS → FormStackProvider.tsx:263-283 (warnedForgottenHostRef at :263; gate
       at :268; set true at :278; reset at :281 on viewport-mount/stack-clear)
     → FormStackProvider.autoRender.test.tsx (warns / doesn't-warn-when-mounted /
       at-most-once)
  5. FormStackViewportValue assignable to FormStackRendererProps (no internal leakage)
     → PASS → src/types/context.ts:17 (FormStackViewportValue) vs
       src/components/FormStackRenderer.tsx:6-14 — field-for-field identical
     → src/hooks/__tests__/useFormStackViewport.test.tsx (compile-time guard test)
  6. openForm() promise contract unchanged (additive only)
     → PASS → FormStackProvider.tsx openForm (:87-108, unchanged; resolves via
       injected onSubmit/onCancel)
     → FormLifecycle.integration + existing lifecycle/integration suites
  7. All new public symbols exported from src/index.ts
     → PASS → src/index.ts:130 (FormStackViewport component), :317
       (useFormStackViewport hook), :407 (FormStackViewportValue type);
       cancelForm/popToIndex are action methods on FormStackActions
       (src/types/context.ts:82 popToIndex)
     → useFormStackActions.test.tsx; useFormStackViewport.test.tsx

Task 4: RECORD the mismatch + NOTE 2 + final surface (in the note body)
  - MISMATCH 1:
      * Symptom: useFormStack() returns { stack, openForm, closeForm, cancelForm }
        — NO popToIndex (src/hooks/useFormStack.ts body; UseFormStackReturn
        interface declares none). Confirmed by `grep -n popToIndex
        src/hooks/useFormStack.ts` → no hits.
      * Contrast: useFormStackActions() DOES expose popToIndex
        (src/types/context.ts:82); sibling cancelForm is on BOTH hooks.
      * Spec basis: delta_prd.md §3 + PRD §5.2 both list popToIndex under
        useFormStack().
      * Severity: low (reachable via useFormStackActions(); no current breakage),
        but a consumer writing `const { popToIndex } = useFormStack()` gets
        undefined + a TS error.
      * Resolution: additive ~2-line fix (add to UseFormStackReturn; destructure
        + return in body) + a test — IMPLEMENTED IN P1.M1.T1.S2 (depends on S1).
  - NOTE 2 (no action):
      * FormStackActions.popToIndex declared `(index: number) => void`
        (src/types/context.ts:82) — MATCHES PRD §5.2.
      * Impl is `async` (FormStackProvider.tsx:156) returning Promise<void>;
        tsc accepts (void-return rule). No action; leave as `void`.
  - FINAL HOOK SURFACE (state explicitly so P1.M2 has one source of truth):
      * After S2, `useFormStack()` returns:
        { stack, openForm, closeForm, popToIndex, cancelForm }.
      * useFormStackActions() returns the same action set incl. popToIndex.

Task 5: SELF-CHECK before finishing
  - Confirm the file path is exactly plan/002_32eb66cd705d/audit_note.md.
  - Confirm ≤ 2 pages rendered (concise prose; one table).
  - Confirm every D1 row has a file:line citation AND a test name.
  - Confirm NO file under src/ was modified (`git status --short src/` empty).
  - Confirm PRD.md, tasks.json, prd_snapshot.md untouched.
```

### Implementation Patterns & Key Details

```markdown
<!-- Pattern: the D1 table row format. Keep each citation to ONE line. -->
| # | Bullet (short) | Verdict | Evidence (file:line) | Covering test |
|---|----------------|---------|----------------------|---------------|
| 1 | cancelForm no-op + resolves undefined | **PASS** | `FormStackProvider.tsx:213-222` | `FormStackProvider.autoRender.test.tsx` |

<!-- Pattern: mismatch entry format -->
**MISMATCH 1 (FIX in S2):** `useFormStack()` omits `popToIndex`
(`src/hooks/useFormStack.ts`). Reachable via `useFormStackActions()`. Spec: PRD
§5.2 / delta §3. Severity: low. Fix: additive (~2 lines) + test → P1.M1.T1.S2.

<!-- Pattern: tooling evidence block -->
## Tooling (re-run at note time)
- `npx tsc --noEmit` → **PASS** (exit 0)
- `npx vitest run` → **PASS**, **286/286** across 26 files  ← use the LIVE count
```

### Integration Points

```yaml
DOCUMENT DELIVERABLE (no code/config/route integration):
  - creates: plan/002_32eb66cd705d/audit_note.md
  - consumed by: P1.M2 (README task) — reads it to learn the final hook surface
  - consumed by: P1.M1.T1.S2 — confirms the mismatch it is assigned to fix
  - DOES NOT: modify src/, PRD.md, tasks.json, prd_snapshot.md, README.md
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Markdown is the artifact — lint for basic structure. (If markdownlint is
# available, use it; otherwise a manual read suffices.)
cd /home/dustin/projects/geoform
npx --no-install markdownlint-cli2 plan/002_32eb66cd705d/audit_note.md 2>/dev/null \
  || echo "(markdownlint not installed — manual review of headings/table instead)"

# Confirm the file is small/concise (≤ ~120 lines is a good proxy for ≤ 2 pages)
wc -l plan/002_32eb66cd705d/audit_note.md   # expect well under 2 pages

# Expected: file parses cleanly; table renders; headings are well-formed.
```

### Level 2: Content Checks (the "unit tests" for a doc artifact)

```bash
# Each of the 7 D1 bullets must appear with PASS + a file:line citation + a test name.
f=plan/002_32eb66cd705d/audit_note.md
for kw in "cancelForm" "confirmOnCancel" "popToIndex" "forgotten-host\|forgotten host\|dev-mode" "FormStackViewportValue" "openForm" "src/index.ts\|index.ts"; do
  grep -iqE "$kw" "$f" && echo "OK: $kw present" || echo "MISSING: $kw"
done

# The two dispositions must be recorded:
grep -iq "S2" "$f" && echo "OK: S2 resolution referenced"       || echo "MISSING: S2 ref"
grep -iqE "no action|matches.*5\.2|matches PRD" "$f" && echo "OK: NOTE 2 no-action recorded" || echo "MISSING: NOTE 2"

# Live tooling counts must be recorded (not inherited):
grep -iqE "tsc --noEmit" "$f" && echo "OK: tsc cited"           || echo "MISSING: tsc"
grep -iqE "vitest run"   "$f" && echo "OK: vitest cited"        || echo "MISSING: vitest"

# Expected: all OK, none MISSING.
```

### Level 3: Tooling Evidence (re-run to back the note's claims)

```bash
cd /home/dustin/projects/geoform
# These are the EXACT commands whose results the note records.
npx tsc --noEmit; echo "tsc exit: $?"
npx vitest run    # capture the "N passed across M files" summary line

# Expected: tsc exit 0; vitest all green (~286/286 across ~26 files).
# Record the numbers you SEE in the note — do not copy from audit_findings.md.
```

### Level 4: Scope-Hygiene Validation (critical for a planning artifact)

```bash
cd /home/dustin/projects/geoform
# Confirm ONLY the audit note was created — nothing in src/ or the protected files.
git status --short
# Expected: only `?? plan/002_32eb66cd705d/audit_note.md` (new file).
# MUST be empty of any src/, PRD.md, tasks.json, prd_snapshot.md changes.

git status --short src/ PRD.md plan/002_32eb66cd705d/tasks.json plan/002_32eb66cd705d/prd_snapshot.md
# Expected: no output (nothing modified).
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npx tsc --noEmit` exits 0 (recorded in the note).
- [ ] `npx vitest run` is all green (count/count recorded in the note).
- [ ] Level 2 content checks: all keywords present, none MISSING.
- [ ] Level 4 scope check: only `audit_note.md` added; no `src/`/protected edits.

### Feature Validation

- [ ] `plan/002_32eb66cd705d/audit_note.md` exists at the exact path.
- [ ] All 7 D1 bullets marked **PASS** with a real `file:line` citation AND a
      covering test name.
- [ ] MISMATCH 1 (`popToIndex` absent from `useFormStack()`) recorded with
      resolution = P1.M1.T1.S2.
- [ ] NOTE 2 (`void` return type) recorded as "matches PRD §5.2 — no action".
- [ ] Final intended hook surface stated explicitly
      (`{ stack, openForm, closeForm, popToIndex, cancelForm }` post-S2).
- [ ] Note is self-contained and ≤ 2 pages rendered.

### Code Quality Validation

- [ ] Markdown is well-formed (headings, table, fenced code where used).
- [ ] Citations are terse (one line each) — not copy-pasted paragraphs.
- [ ] Tone is an audit deliverable (declarative, evidence-led), not working notes.

### Documentation & Deployment

- [ ] Note references its source (`architecture/audit_findings.md`) and the specs
      (`delta_prd.md` §4 D1; PRD §5.2/§10.1/§16).
- [ ] Note is consumable by P1.M2 without reading any other file.

---

## Anti-Patterns to Avoid

- ❌ Don't edit any file under `src/`, or `PRD.md`, `tasks.json`,
  `prd_snapshot.md` — this is a planning artifact, not a code change.
- ❌ Don't copy the 286/26 numbers from `audit_findings.md` — re-run the tooling
  and record the live count (it should match, but the note must show a fresh run).
- ❌ Don't flag NOTE 2 (`void` return type) as a defect — it intentionally
  matches PRD §5.2; tsc accepts the async→void assignment.
- ❌ Don't fix MISMATCH 1 here — it is explicitly scoped to the *later* sibling
  P1.M1.T1.S2 (which depends on this note existing). Record it; do not resolve it.
- ❌ Don't pad the note to > 2 pages — the delta calls for a "short audit note".
  One table + terse mismatch/note blocks is the right shape.
- ❌ Don't omit the covering **test name** for any bullet — a PASS without a test
  citation is not audit-grade evidence.

---

## Confidence Score

**9 / 10** for one-pass success. The audit is already complete and every
citation in this PRP has been spot-checked against the current source. The
writer's job is formatting + a live tooling re-run, both fully specified above.
The one residual risk is recording a slightly different vitest count if the tree
has drifted — but no code changes in this subtask, so the count is expected to
hold, and the note records whatever it observes.
