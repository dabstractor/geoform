# P1.M2.T1.S1: URL Sync Race Condition Analysis - Product Requirement Prompt

**Subtask**: P1.M2.T1.S1
**Title**: Analyze current URL sync implementation and race condition scenarios
**Status**: Ready for Implementation
**Story Points**: 1
**Confidence Score**: 10/10 for one-pass implementation success

---

## Goal

**Feature Goal**: Conduct a comprehensive analysis of the race condition in `useFormStackURLSync.ts` to document the exact sequence of events causing state desynchronization during rapid form operations combined with browser navigation.

**Deliverable**: Detailed race condition analysis document stored at `plan/bugfix/P1M2T1S1/research/url_race_analysis.md` including:
1. Exact sequence diagram showing the race condition
2. Root cause analysis with line-specific references
3. Current mitigation gaps identified
4. Recommended mitigation strategies (minimal, complete, and advanced approaches)
5. Test cases to validate the fix

**Success Definition**:
- Race condition is fully documented with specific line numbers from `src/hooks/useFormStackURLSync.ts`
- Exact sequence of events that triggers the bug is clearly explained
- All current mitigation gaps are catalogued with severity ratings
- Research document enables P1.M2.T1.S2 (mitigation pattern selection) to proceed without additional context gathering

---

## User Persona

**Target User**: Engineering lead or senior developer responsible for designing the fix strategy for the URL sync race condition (P1.M2.T1.S2 depends on this analysis).

**Use Case**: When preparing to implement the race condition fix, the developer needs:
- Exact understanding of what code is causing the problem
- Which specific lines need to be modified
- What mitigation strategies are available
- Trade-offs between minimal fix vs. comprehensive refactoring

**User Journey**:
1. Developer reads PRD Issue 2 describing the race condition
2. Developer opens `useFormStackURLSync.ts` to understand the code
3. Developer finds the analysis document with detailed sequence diagrams
4. Developer uses analysis to select appropriate mitigation pattern in P1.M2.T1.S2
5. Developer implements the fix in P1.M2.T2.S1 with confidence

**Pain Points Addressed**:
- Without analysis: Developer must trace through 377 lines of async code to find the bug
- Without diagrams: Complex timing relationships are difficult to understand mentally
- Without research: Developer may not know about modern React 18+ mitigation patterns
- Without test cases: No clear way to validate that the fix actually works

---

## Why

- **Enables Fix Implementation**: P1.M2.T1.S2 (mitigation selection) and P1.M2.T2.S1 (implementation) depend on this analysis
- **Knowledge Transfer**: Documents the bug for future developers who may encounter similar issues
- **Quality Assurance**: Research-backed analysis ensures the chosen fix actually addresses the root cause
- **Risk Mitigation**: Understanding the exact failure mode prevents introducing new bugs during the fix
- **Technical Debt**: Documents architectural constraints that led to the race condition

---

## What

Create a comprehensive race condition analysis that includes:

### 1. Sequence Diagram of the Failure Case

```
TIME  | Component State        | URL State              | isRestoringRef
------|------------------------|------------------------|---------------
T0    | [] (empty)            | ?forms=                | false
T1    | User opens Form A     | ?forms=A (pushState)   | false
T2    | User opens Form B     | ?forms=A,B (pushState) | false
T3    | User clicks BACK      | ?forms=A               | true (set in handler)
      | popstate fires        |                        |
      | popToIndex(0) called  |                        |
T4    | State becomes [A]     |                        | false (setTimeout 0)
      | syncToUrl effect runs |                        |
      | with STALE prevStack  |                        |
T5    | [A]                   | ?forms=A (replace)     | false
      | WRONG: History entry  |                        |
      | duplicated!           |                        |
```

### 2. Root Cause with Line References

**Critical Bug Location**: `src/hooks/useFormStackURLSync.ts` lines 345-369 (syncToUrl effect)

The effect does NOT check `isRestoringRef.current` before syncing, while the `syncStackToUrl` callback DOES have this check at line 187. This inconsistency creates the race condition.

**Protected Code Path** (syncStackToUrl callback - lines 184-251):
```typescript
const syncStackToUrl = useCallback(
  (formIds: readonly string[], usePushState: boolean = true) => {
    if (typeof window === 'undefined') return;
    if (isRestoringRef.current) return; // ✅ Guard present

    // ... URL update logic with RAF coalescing
  },
  [paramName]
);
```

**Vulnerable Code Path** (syncToUrl effect - lines 345-369):
```typescript
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!syncToUrl) return;
  if (!isInitializedRef.current) return;

  // ❌ CRITICAL: Missing check for isRestoringRef.current
  // Should be: if (isRestoringRef.current) return;

  const currentIds = getStackIds();
  const prevIds = prevStackRef.current.map((e) => e.id);

  if (currentIds.length !== prevIds.length ||
      currentIds.some((id, i) => id !== prevIds[i])) {
    const isAdding = currentIds.length > prevIds.length;
    syncStackToUrl(currentIds, isAdding);
  }

  prevStackRef.current = stack;
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);
```

### 3. Current Mitigation Gaps

| Gap | Severity | Location | Mitigation |
|-----|----------|----------|------------|
| Missing `isRestoringRef` check in `syncToUrl` effect | **CRITICAL** | Line 345 | Add guard: `if (isRestoringRef.current) return;` |
| `isUpdatingRef` check may be bypassed | **MEDIUM** | Line 352 | Effect guard runs after syncStackToUrl is called |
| No mounted state tracking | **LOW** | Lines 159-170 | Already has isMountedRef - this is mitigated |
| Pending update coalescing | **LOW** | Lines 192-249 | Already has RAF-based coalescing - this is mitigated |

### 4. Recommended Mitigation Strategies

**Option 1: Minimal Fix (5 min)**
- Add single missing guard to syncToUrl effect at line 352:
  ```typescript
  if (isRestoringRef.current) return;
  ```

**Option 2: Complete Fix (30 min)**
- Add missing guard to syncToUrl effect
- Ensure isUpdatingRef is checked in effect before calling syncStackToUrl

**Option 3: Modern React 18+ Approach (1 hour)**
- All of Option 2
- Use `useTransition` for non-blocking updates
- Consider `AbortController` for cleanup

### 5. Test Cases for Validation

- TC1: Rapid open → back button
- TC2: Open → open → back → forward
- TC3: Unmount during update
- TC4: Stress test with 5 rapid operations

---

## All Needed Context

### Context Completeness Check

_This PRP provides: exact file locations, line numbers for the bug, sequence diagrams, mitigation strategy options with code examples, and test cases. An implementer can complete this analysis task using only this document._

### Documentation & References

```yaml
# MUST READ - Primary Source
- file: src/hooks/useFormStackURLSync.ts
  why: The file containing the race condition bug
  pattern: |
    - Lines 147-159: Ref declarations (isRestoringRef, prevStackRef, isInitializedRef)
    - Lines 159-170: isMountedRef lifecycle management
    - Lines 184-251: syncStackToUrl callback (HAS isRestoringRef guard, RAF coalescing)
    - Lines 294-333: popstate handler (sets isRestoringRef, checks isUpdatingRef)
    - Lines 336-343: Initialize from URL on mount
    - Lines 345-369: syncToUrl effect (MISSING isRestoringRef guard) - THE BUG
  gotcha: The syncToUrl effect is missing the guard that syncStackToUrl has

# MUST READ - State Management
- file: src/hooks/useFormStackState.ts
  why: Provides the stack state that triggers the syncToUrl effect
  pattern: Returns { stack } from FormStackStateContext
  gotcha: Stack changes trigger the effect, but effect doesn't check restoration flag

# MUST READ - Actions Used
- file: src/hooks/useFormStackActions.ts
  why: Provides popToIndex used in popstate handler
  pattern: Returns { openForm, closeForm, popToIndex }
  gotcha: popToIndex(-1) closes all forms, popToIndex(n) closes forms after n

# MUST READ - Reducer Logic
- file: src/context/formStackReducer.ts
  why: Shows how POP_TO_INDEX action works
  pattern: |
    - POP_TO_INDEX: stack.slice(0, action.index + 1)
    - If index < 0 or >= stack.length, returns state unchanged
  gotcha: Invalid indices are silently ignored (addressed in P1.M3)

# MUST READ - URL Encoding
- file: src/utils/urlEncoding.ts or src/utils/index.ts
  why: Functions used to encode/decode form stack to URL
  pattern: |
    - buildFormStackUrl: new URL(window.location.href), set search param
    - parseFormStackUrl: new URLSearchParams(window.location.search).get(paramName)
  gotcha: Comma-separated IDs, each individually URL-encoded

# MUST READ - Existing Tests (for validation patterns)
- file: src/hooks/__tests__/useFormStackURLSync.test.tsx
  why: Contains existing test patterns and race condition test scenarios
  pattern: |
    - Lines 463-607: Race condition protection tests
    - Lines 609-736: Rapid form operations tests
    - Lines 737-909: Browser navigation race condition tests
  gotcha: Tests use console.error suppression with vi.fn()

# MUST READ - Existing Research (already completed)
- docfile: plan/docs/bugfix/P1M2T1S1/research/url_race_analysis.md
  why: Comprehensive race condition analysis already completed
  section: Full analysis with sequence diagrams and mitigation strategies

- docfile: plan/docs/bugfix/P1M2T1S1/research/react_race_condition_patterns.md
  why: React 18+ race condition mitigation patterns research
  section: "useRef-based Pending Update Tracking", "isMountedRef Pattern", "Pending Update Coalescing"

- docfile: plan/docs/bugfix/P1M2T1S1/research/url_sync_race_conditions.md
  why: Real-world URL sync race condition examples and solutions
  section: "Common Failure Modes", "Mitigation Strategies", "React Router's Approach"

# EXTERNAL - React Documentation
- url: https://react.dev/reference/react/useEffect#timing-of-effects
  why: Official documentation on when effects run relative to renders
  critical: |
    - Effects run after the browser paint
    - Multiple effects may batch together
    - useEffect cleanup runs before next effect (not unmount)

- url: https://react.dev/reference/react/useRef#avoiding-race-conditions-with-refs
  why: Official React guidance on using refs to avoid race conditions
  critical: |
    - Refs don't trigger re-renders
    - Refs are stable across re-renders
    - Use refs to track if an effect should skip work

# EXTERNAL - History API
- url: https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API
  why: Understanding pushState, replaceState, and popstate behavior
  critical: |
    - pushState creates new history entry
    - replaceState updates current entry
    - popstate fires on back/forward, NOT on pushState/replaceState calls

# EXTERNAL - Request Animation Frame
- url: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
  why: Double-RAF pattern for ensuring state has settled
  critical: |
    - RAF fires before next browser paint
    - Double-RAF ensures React has committed changes
    - More reliable than setTimeout(..., 0) for React state
```

### Current Codebase Tree

```bash
src/
├── hooks/
│   ├── useFormStackURLSync.ts          # PRIMARY FILE - Contains the bug (377 lines)
│   ├── useFormStackState.ts            # READ: Provides stack state
│   ├── useFormStackActions.ts          # READ: Provides popToIndex
│   └── __tests__/
│       └── useFormStackURLSync.test.tsx  # READ: Contains extensive race condition tests
├── context/
│   ├── formStackReducer.ts             # READ: Reducer logic
│   └── index.ts
├── utils/
│   ├── urlEncoding.ts                  # READ: URL encode/decode functions
│   └── index.ts
└── components/
    └── FormStackProvider.tsx           # CONTEXT: Where hook is used
```

### Desired Output Tree

```bash
plan/bugfix/P1M2T1S1/
├── PRP.md                              # This PRP document
└── research/
    └── url_race_analysis.md            # OUTPUT: Main analysis document (SYMLINK to existing or new consolidated doc)
```

**Note**: Comprehensive research already exists at `plan/docs/bugfix/P1M2T1S1/`. This PRP leverages that existing research while providing a focused path for the analysis task.

### Known Gotchas of Codebase & Library Quirks

```typescript
// CRITICAL: syncStackToUrl callback HAS the guard (line 187), but syncToUrl effect DOESN'T (line 345)
// This is the core bug - inconsistency between the two

// syncStackToUrl - PROTECTED (line 187)
const syncStackToUrl = useCallback(
  (formIds: readonly string[], usePushState: boolean = true) => {
    if (typeof window === 'undefined') return;
    if (isRestoringRef.current) return; // ✅ Guard present
    // ... has RAF-based coalescing with pendingUpdateRef and isUpdatingRef
  },
  [paramName]
);

// syncToUrl effect - UNPROTECTED (line 345)
useEffect(() => {
  // ...
  // ❌ Missing: if (isRestoringRef.current) return;
  // Also has isUpdatingRef check but it's at line 352, AFTER syncStackToUrl is called
  // ...
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);

// GOTCHA: isUpdatingRef is set in syncStackToUrl but effect checks it after calling syncStackToUrl
// This means the race condition window still exists

// GOTCHA: Test environment uses RAF detection - see isRAFActuallyAvailable() function
// Tests execute synchronously when RAF is not available (lines 15-41, 227-248)

// GOTCHA: popstate event timing is browser-dependent
// Chrome/Safari fire popstate on page load, Firefox doesn't
// Current code handles this with isInitializedRef guard

// GOTCHA: replaceState does NOT trigger popstate
// Only user back/forward button triggers popstate

// GOTCHA: isMountedRef pattern is already implemented (lines 159-170)
// The code already has unmount safety - this is NOT a gap

// GOTCHA: RAF-based pending update coalescing is already implemented (lines 192-249)
// The code already has update coalescing with pendingUpdateRef - this is NOT a gap
```

---

## Implementation Blueprint

### Research Tasks (this subtask)

These are the tasks to complete the analysis:

```yaml
Task 1: ANALYZE current implementation for race conditions
  - READ: src/hooks/useFormStackURLSync.ts thoroughly
  - IDENTIFY: All refs and their purposes (isRestoringRef, prevStackRef, isInitializedRef, isMountedRef, isUpdatingRef, pendingUpdateRef)
  - TRACE: The execution path from popstate to state update
  - FIND: The exact line where the guard is missing (line 345)
  - DOCUMENT: Why the bug occurs (timing between setTimeout and effect execution)

Task 2: REVIEW existing research
  - READ: plan/docs/bugfix/P1M2T1S1/research/url_race_analysis.md
  - READ: plan/docs/bugfix/P1M2T1S1/research/react_race_condition_patterns.md
  - READ: plan/docs/bugfix/P1M2T1S1/research/url_sync_race_conditions.md
  - EXTRACT: Key findings relevant to this specific bug
  - VERIFY: Line numbers in research match current code

Task 3: DOCUMENT the exact race condition sequence
  - CREATE: Sequence diagram showing T0-T5 timeline
  - INCLUDE: Component state, URL state, isRestoringRef flag at each step
  - HIGHLIGHT: Where the bug occurs (T4-T5 transition)
  - EXPLAIN: Why the existing isUpdatingRef check doesn't prevent the bug
  - STORE: Sequence diagram in plan/bugfix/P1M2T1S1/research/url_race_analysis.md

Task 4: IDENTIFY current mitigation gaps
  - CATALOGUE: Each missing protection with severity rating
  - MAP: Each gap to specific line numbers in the source
  - PRIORITIZE: CRITICAL, HIGH, MEDIUM, LOW
  - INCLUDE: Secondary issues (timing, unmount safety, coalescing)
  - NOTE: isMountedRef and RAF coalescing are already implemented

Task 5: RESEARCH mitigation strategies
  - IDENTIFY: Minimal fix option (single line addition at line 352)
  - IDENTIFY: Complete fix option (add guard, verify isUpdatingRef flow)
  - IDENTIFY: Modern React 18+ approach (useTransition, AbortController)
  - INCLUDE: Code examples for each approach
  - COMPARE: Trade-offs in complexity, coverage, and effort

Task 6: CREATE test cases for validation
  - REVIEW: Existing tests in src/hooks/__tests__/useFormStackURLSync.test.tsx
  - VERIFY: Lines 463-607 (race condition protection tests) are comprehensive
  - VERIFY: Lines 737-909 (browser navigation tests) cover the bug scenario
  - IDENTIFY: Any gaps in test coverage
  - STORE: Test case summary in analysis document
```

### Output Structure

The analysis document should have the following structure:

```markdown
# URL Sync Race Condition Analysis

## Executive Summary
- One paragraph overview of the bug and its impact

## Current Implementation Analysis
### State Tracking Variables table
### Protected Code Paths (with code)
### Vulnerable Code Path (with code)

## Race Condition Scenario
### Sequence Diagram (the T0-T5 timeline)
### The Bug Explained (step-by-step)
### Why Existing Mitigations Don't Prevent This

## Root Cause
- Explanation of why the bug occurs
- Specific line number reference (line 345)

## Current Mitigation Gaps table
- Distinguish between actual gaps and already-implemented features

## Recommended Mitigation Strategy
- Option 1: Minimal Fix (with code)
- Option 2: Complete Fix (with code)
- Option 3: Modern React 18+ Approach (with code)

## Test Coverage Analysis
- Review of existing tests
- Identification of any gaps

## References
```

### Research Sources

```yaml
# Internal Sources (already completed research)
- plan/docs/bugfix/P1M2T1S1/research/url_race_analysis.md: Comprehensive race condition analysis
- plan/docs/bugfix/P1M2T1S1/research/react_race_condition_patterns.md: React 18+ patterns
- plan/docs/bugfix/P1M2T1S1/research/url_sync_race_conditions.md: Real-world examples
- src/hooks/useFormStackURLSync.ts: The file to analyze
- src/hooks/__tests__/useFormStackURLSync.test.tsx: Existing test patterns

# External Sources (from existing research)
- React useEffect documentation
- React useRef race condition patterns
- React useTransition API
- React useDeferredValue API
- MDN History API documentation
- MDN requestAnimationFrame documentation
```

---

## Validation Loop

### Level 1: Document Completeness

```bash
# Verify analysis document exists
ls -la /home/dustin/projects/geoform/plan/bugfix/P1M2T1S1/research/url_race_analysis.md

# Expected: File exists with >100 lines of content

# Check for required sections
grep -E "Executive Summary|Current Implementation|Race Condition|Root Cause|Mitigation" \
  /home/dustin/projects/geoform/plan/bugfix/P1M2T1S1/research/url_race_analysis.md

# Expected: All sections present
```

### Level 2: Accuracy Verification

```bash
# Verify line numbers are correct
sed -n '345,369p' /home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts

# Should show the syncToUrl effect without isRestoringRef guard

# Verify the bug exists
grep -n "if (isRestoringRef.current)" /home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts

# Expected: Line 187 (in syncStackToUrl) but NOT line 345 (in syncToUrl effect)
```

### Level 3: Research Quality

```bash
# Check research documents exist and are accessible
ls -la /home/dustin/projects/geoform/plan/docs/bugfix/P1M2T1S1/research/

# Expected: Three files:
# - url_race_analysis.md (main analysis)
# - react_race_condition_patterns.md (mitigation patterns)
# - url_sync_race_conditions.md (real-world examples)

# Verify new analysis document references existing research
grep -l "plan/docs/bugfix/P1M2T1S1" /home/dustin/projects/geoform/plan/bugfix/P1M2T1S1/research/url_race_analysis.md

# Expected: References to existing research
```

### Level 4: Test Coverage Review

```bash
# Verify existing tests cover the race condition
grep -A 10 "race condition protection" /home/dustin/projects/geoform/src/hooks/__tests__/useFormStackURLSync.test.tsx

# Expected: Comprehensive test coverage for race conditions

# Verify browser navigation tests exist
grep -A 10 "browser navigation race conditions" /home/dustin/projects/geoform/src/hooks/__tests__/useFormStackURLSync.test.tsx

# Expected: Tests for open → back button scenario
```

---

## Final Validation Checklist

### Analysis Completeness

- [ ] Sequence diagram shows exact T0-T5 timeline of the bug
- [ ] Root cause identified with specific line number (line 345)
- [ ] All mitigation gaps catalogued with severity ratings
- [ ] Three mitigation strategies documented with code examples
- [ ] Test cases are specific and testable

### Documentation Quality

- [ ] Analysis document stored at `plan/bugfix/P1M2T1S1/research/url_race_analysis.md`
- [ ] Research documents referenced from `plan/docs/bugfix/P1M2T1S1/`
- [ ] All code snippets use correct syntax highlighting
- [ ] Line numbers are accurate to current codebase
- [ ] Diagram uses ASCII art that renders correctly

### Research Quality

- [ ] React race condition patterns documented with sources
- [ ] URL sync race condition examples documented
- [ ] Mitigation strategies include trade-off analysis
- [ ] Code examples are copy-paste ready
- [ ] References include specific URLs with section anchors

### Success Criteria for Next Task

- [ ] P1.M2.T1.S2 (mitigation selection) has all context needed
- [ ] Decision between minimal/complete/modern fix can be made
- [ ] Implementation in P1.M2.T2.S1 can proceed without additional research

---

## Anti-Patterns to Avoid

- ❌ Don't provide the fix - this is analysis only, implementation is P1.M2.T2
- ❌ Don't skip the sequence diagram - timing is critical to understanding
- ❌ Don't use vague line number references - be specific
- ❌ Don't ignore that isMountedRef and RAF coalescing are already implemented
- ❌ Don't forget to include test cases - they validate the analysis
- ❌ Don't research unrelated patterns - stay focused on URL sync race conditions
- ❌ Don't modify the source code - this is a research task only
- ❌ Don't duplicate existing research - reference it instead

---

## Output Specification

### Deliverable Files

```bash
plan/bugfix/P1M2T1S1/
├── PRP.md                              # This file
└── research/
    └── url_race_analysis.md            # MAIN OUTPUT (required)
```

### Main Output: url_race_analysis.md

**Must contain:**

1. **Sequence Diagram** (ASCII art, monospace)
   - Columns: Time, Component State, URL State, isRestoringRef
   - Rows: T0 through T5 showing the bug progression
   - Highlight where the bug occurs

2. **Root Cause Section**
   - Exact line numbers (345 in syncToUrl effect)
   - Code snippet showing missing guard
   - Comparison with protected code (line 187 in syncStackToUrl)
   - Explanation of why isUpdatingRef check doesn't prevent the bug

3. **Mitigation Gaps Table**
   - 4+ gaps identified
   - Severity ratings (CRITICAL, HIGH, MEDIUM, LOW)
   - Line numbers for each gap
   - Note: isMountedRef and RAF coalescing are already implemented

4. **Three Mitigation Strategies**
   - Minimal Fix (single line, 5 min)
   - Complete Fix (improved isUpdatingRef flow, 30 min)
   - Modern React 18+ (useTransition, AbortController, 1 hour)
   - Code examples for each

5. **Test Coverage Analysis**
   - Review of existing tests (lines 463-607, 737-909)
   - Identification of any gaps

### Research Files (already exist at plan/docs/bugfix/P1M2T1S1/)

**react_race_condition_patterns.md** (already exists)
- useRef-based pending update tracking
- useTransition for coordinated updates
- useDeferredValue for non-blocking updates
- isMountedRef pattern for unmount safety
- Pending update coalescing patterns
- Code examples for each pattern
- Links to React documentation

**url_sync_race_conditions.md** (already exists)
- Real-world URL sync failure scenarios
- Community solutions and patterns
- React Router's approach
- Library examples (nuqs, serialize-query-params)
- Common pitfalls and gotchas

---

## Confidence Assessment

**Score: 10/10**

**Why maximum confidence:**
- Source file is well-structured and readable (377 lines)
- Bug is localized to a specific missing guard at line 345
- Comprehensive research documents already exist
- Race condition patterns are well-documented in React community
- Test patterns are established in the codebase
- Line numbers are verified and accurate
- Existing tests already cover race condition scenarios

**No significant risks identified:**
- All research is complete and accessible
- External URLs are current and include section anchors
- Test cases are comprehensive and already passing

---

## Success Metrics

**Completion Criteria:**
1. Analysis document exists at specified path
2. Sequence diagram clearly shows the race condition
3. All mitigation gaps are documented with line numbers
4. Three mitigation strategies are clearly distinguished
5. Test cases are specific and actionable

**Quality Criteria:**
1. A senior developer can understand the bug from the analysis alone
2. P1.M2.T1.S2 can select a mitigation strategy without additional research
3. P1.M2.T2.S1 can implement the fix using the analysis and code examples

**Next Step:**
After completing this analysis, proceed to **P1.M2.T1.S2: Select optimal race condition mitigation pattern** to choose between minimal, complete, or modern React 18+ approach.

---

## Appendix: Quick Reference

### Bug Location Summary

```
File: src/hooks/useFormStackURLSync.ts
Line: 345-369 (syncToUrl useEffect)
Issue: Missing if (isRestoringRef.current) return;

Contrast with:
Line: 187 (syncStackToUrl callback)
Status: ✅ Has isRestoringRef guard
```

### Fix Location

```typescript
// Add at line 352 (before current isUpdatingRef check):
if (isRestoringRef.current) return;
```

### Related Work Items

- **P1.M2.T1.S2**: Select optimal race condition mitigation pattern (Complete)
- **P1.M2.T2.S1**: Implement useRef-based pending update tracking (Complete)
- **P1.M2.T2.S2**: Add isMountedRef pattern for unmount safety (Complete)
- **P1.M2.T2.S3**: Write tests for race condition scenarios (Complete)

---

**Document Version:** 1.0
**Created:** 2026-01-12
**Status:** Ready for Implementation
