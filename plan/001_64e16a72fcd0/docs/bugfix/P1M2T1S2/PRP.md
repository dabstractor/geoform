# PRP: P1.M2.T1.S2 - Select Optimal Race Condition Mitigation Pattern

---

## Goal

**Feature Goal**: Select the optimal React pattern for mitigating URL synchronization race conditions in the `useFormStackURLSync` hook, specifically addressing rapid form open/close operations combined with browser back button navigation.

**Deliverable**: A decision document stored at `plan/bugfix/architecture/url_mitigation_decision.md` containing:
1. Selected pattern recommendation with detailed justification
2. Pattern comparison matrix against specific use case requirements
3. Implementation sketch with exact code placement guidance
4. Validation test cases to verify the fix

**Success Definition**:
- Decision document clearly identifies the optimal pattern
- Justification directly addresses all three race condition scenarios from P1.M2.T1.S1
- Implementation sketch provides exact file locations and line numbers
- Pattern selection maintains URL sync accuracy (0ms lag) while preventing race conditions

---

## Why

### Business Value
- **User Experience**: Prevents duplicate history entries that cause "back button hell" where users must press back multiple times to close a single form
- **Data Integrity**: Ensures URL state always matches component state, preventing navigation confusion
- **Reliability**: Eliminates race conditions in a critical path (navigation) that affects 100% of users

### Integration with Existing Features
- Builds upon P1.M2.T1.S1 race condition analysis that identified three specific failure scenarios
- Provides the design foundation for P1.M2.T2 implementation tasks
- Maintains compatibility with existing `isRestoringRef`, `isUpdatingRef`, `pendingUpdateRef` infrastructure

### Problems Solved
- **Scenario 1**: Rapid form open/close followed by immediate back button press creates duplicate history entries
- **Scenario 2**: Multiple state updates queue before browser processes history, causing URL-state desync
- **Scenario 3**: Component unmounts during async URL update, causing memory leaks and React warnings

---

## What

### User-Visible Behavior
No user-visible changes in this subtask. This is a research/design task that produces a decision document.

### Technical Requirements

**Input Requirements:**
1. Race condition analysis from P1.M2.T1.S1 (documented in `plan/docs/bugfix/P1M2T1S1/research/url_sync_race_conditions.md`)
2. Three candidate patterns from `plan/bugfix/architecture/testing_best_practices.md` Section 2
3. Current `useFormStackURLSync` implementation in `src/hooks/useFormStackURLSync.ts`

**Evaluation Criteria:**
1. **URL Sync Accuracy**: Must have 0ms lag - URL must immediately reflect state changes
2. **Browser Back/Forward Support**: Must work correctly with `popstate` events
3. **Rapid Operation Handling**: Must coalesce multiple rapid updates
4. **Mount Safety**: Must prevent updates after component unmount
5. **Test Compatibility**: Must work in jsdom/test environments

**Output Requirements:**
1. Decision document at `plan/bugfix/architecture/url_mitigation_decision.md`
2. Selected pattern with justification against all evaluation criteria
3. Implementation sketch with exact file paths and line numbers
4. Test validation approach

### Success Criteria

- [ ] Decision document exists at specified path
- [ ] Pattern selection clearly justified against all 5 evaluation criteria
- [ ] Implementation sketch references exact file locations (e.g., `src/hooks/useFormStackURLSync.ts:351`)
- [ ] Decision accounts for existing codebase patterns and infrastructure
- [ ] Validation test cases defined for all three race scenarios from P1.M2.T1.S1

---

## All Needed Context

### Context Completeness Check

**Question:** "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer:** Yes - this PRP provides:
1. Exact file locations and line numbers for all relevant code
2. Complete pattern documentation from architecture best practices
3. Specific race condition scenarios from prior analysis
4. Decision criteria with scoring matrix
5. Implementation sketches with code examples
6. Validation commands that work in this project

### Documentation & References

```yaml
# MUST READ - Architecture Documentation
- file: plan/bugfix/architecture/testing_best_practices.md
  why: Contains the three race condition mitigation patterns to evaluate
  section: Section 2 (lines 214-405)
  pattern: Pattern definitions with code examples for useRef, useDeferredValue, useTransition
  critical: Section 2.2 recommends useRef pattern with pending update coalescing

# MUST READ - Prior Analysis
- file: plan/docs/bugfix/P1M2T1S1/research/url_sync_race_conditions.md
  why: Complete race condition analysis identifying three failure scenarios
  section: All sections (comprehensive research)
  pattern: Race condition timeline diagrams and mitigation strategies
  gotcha: Primary bug at syncToUrl effect lines 345-369 missing isRestoringRef guard

# MUST READ - Prior Analysis (Concise)
- file: plan/docs/bugfix/P1M2T1S1/research/url_race_analysis.md
  why: Focused analysis with sequence diagrams
  section: Timeline T0-T5 showing exact race sequence
  pattern: Visual representation of state vs URL vs flag timing
  gotcha: setTimeout resets isRestoringRef before state update completes

# MUST READ - Current Implementation
- file: src/hooks/useFormStackURLSync.ts
  why: The hook containing the race condition and existing mitigation patterns
  section: Complete file (all sections relevant)
  pattern: Multiple refs for state tracking (isRestoringRef, isUpdatingRef, pendingUpdateRef, etc.)
  gotcha: Lines 345-369 syncToUrl effect missing guard that exists at line 187 in callback

# MUST READ - Pattern Research
- file: plan/bugfix/P1M2T1S2/research/react_patterns_research.md
  why: Deep research on all three React patterns with performance analysis
  section: Complete document (1353 lines)
  pattern: Code examples, best practices, anti-patterns for each pattern
  critical: Performance comparison table showing useRef: ~10ms, useDeferredValue: ~50ms

# MUST READ - Pattern Evaluation
- file: plan/bugfix/P1M2T1S2/research/pattern_evaluation.md
  why: This task's evaluation of patterns against specific use case requirements
  section: Complete document (decision matrix and recommendation)
  pattern: Scoring against 5 requirements with 50-point maximum
  critical: Pattern A (useRef) scores 50/50, Pattern C (useTransition) scores 43/50

# REFERENCE - Test Patterns
- file: src/hooks/__tests__/useFormStackURLSync.test.tsx
  why: Existing test patterns for URL sync validation
  section: All test blocks
  pattern: Vitest + @testing-library/react-hooks patterns
  gotcha: Tests mock window.history API

# REFERENCE - URL Utilities
- file: src/utils/urlEncoding.ts
  why: URL encoding/decoding functions used by URL sync
  section: All functions (encodeFormStack, decodeFormStack, buildFormStackUrl, parseFormStackUrl)
  pattern: URL-safe encoding with special character handling
```

### Current Codebase Tree

```bash
geoform/
├── plan/
│   ├── bugfix/
│   │   ├── P1M2T1S2/               # THIS TASK
│   │   │   └── PRP.md              # THIS DOCUMENT
│   │   └── architecture/
│   │       └── testing_best_practices.md
│   └── docs/
│       └── bugfix/
│           └── P1M2T1S1/           # PRIOR ANALYSIS
│               └── research/
│                   ├── url_sync_race_conditions.md
│                   └── url_race_analysis.md
├── src/
│   ├── hooks/
│   │   ├── useFormStackURLSync.ts  # PRIMARY FILE WITH BUG
│   │   └── __tests__/
│   │       └── useFormStackURLSync.test.tsx
│   └── utils/
│       └── urlEncoding.ts
└── package.json
```

### Desired Output Codebase Tree

```bash
geoform/
└── plan/
    └── bugfix/
        └── architecture/
            └── url_mitigation_decision.md  # OUTPUT: Decision document
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: window.history API behavior in test environments
// In jsdom/test environments, requestAnimationFrame may not work properly
// Solution: Use isRAFActuallyAvailable() helper to detect and handle

function isRAFActuallyAvailable(): boolean {
  return typeof window !== 'undefined' &&
         typeof window.requestAnimationFrame === 'function' &&
         // Additional check for jsdom
         !navigator.userAgent.includes('jsdom');
}

// CRITICAL: The existing codebase already implements Pattern A (useRef)
// The bug is NOT the pattern - it's a missing guard in the sync effect
// Lines 345-369: syncToUrl effect does NOT check isRestoringRef.current
// Line 187: syncStackToUrl callback DOES check isRestoringRef.current

// CRITICAL: useDeferredValue creates URL lag
// For navigation scenarios, URL lag is unacceptable
// User expects URL to change immediately when form opens/closes

// CRITICAL: useTransition requires React 18+
// Check package.json for React version
// Project uses: "react": "^18.3.1" - useTransition IS available

// CRITICAL: Multiple refs serve different purposes
// isRestoringRef: Prevents URL updates during popstate handling
// isUpdatingRef: Prevents concurrent URL updates
// pendingUpdateRef: Version-based coalescing (RA scheduling)
// latestStackRef: Stores latest stack for RAF callback access
// isMountedRef: Prevents updates after unmount
// prevStackRef: Detects stack changes for sync effect
```

---

## Implementation Blueprint

### Research & Analysis Tasks

```yaml
Task 1: READ and synthesize P1.M2.T1.S1 race condition analysis
  - READ: plan/docs/bugfix/P1M2T1S1/research/url_sync_race_conditions.md
  - READ: plan/docs/bugfix/P1M2T1S1/research/url_race_analysis.md
  - EXTRACT: Three specific race condition scenarios
  - EXTRACT: Timeline T0-T5 showing exact failure sequence
  - EXTRACT: Current mitigation strategies and their gaps

Task 2: READ and understand testing best practices patterns
  - READ: plan/bugfix/architecture/testing_best_practices.md Section 2
  - EXTRACT: Pattern A - useRef for tracking pending operations (lines 238-274)
  - EXTRACT: Pattern B - useDeferredValue for non-blocking updates (lines 281-310)
  - EXTRACT: Pattern C - useTransition for coordinated updates (lines 312-341)
  - EXTRACT: Section 2.2 recommendation for useRef pattern

Task 3: ANALYZE current implementation against patterns
  - READ: src/hooks/useFormStackURLSync.ts (complete file)
  - IDENTIFY: Existing useRef patterns (lines 128-251: syncStackToUrl callback)
  - IDENTIFY: Missing guard in syncToUrl effect (lines 345-369)
  - COMPARE: Current implementation vs. Section 2.2 recommendation
  - NOTE: Codebase already implements Pattern A - bug is missing guard, not wrong pattern

Task 4: EVALUATE patterns against use case requirements
  - REQUIREMENT 1: URL sync accuracy (0ms lag required)
  - REQUIREMENT 2: Browser back/forward support (popstate handling)
  - REQUIREMENT 3: Rapid operation coalescing (100+ operations/second)
  - REQUIREMENT 4: Mount safety (no updates after unmount)
  - REQUIREMENT 5: Test environment compatibility (jsdom)

Task 5: CREATE pattern comparison matrix
  - SCORE: Pattern A (useRef) against all 5 requirements
  - SCORE: Pattern B (useDeferredValue) against all 5 requirements
  - SCORE: Pattern C (useTransition) against all 5 requirements
  - DOCUMENT: Strengths and weaknesses of each pattern
  - DOCUMENT: URL lag concerns for useDeferredValue
  - DOCUMENT: React 18+ requirements for useTransition

Task 6: SELECT optimal pattern with justification
  - DECIDE: Pattern A (useRef) based on scoring matrix
  - JUSTIFY: Already implemented in codebase (minimal change)
  - JUSTIFY: Zero URL lag (critical for navigation)
  - JUSTIFY: Complete race prevention with existing refs
  - JUSTIFY: Test environment proven with isRAFActuallyAvailable()

Task 7: CREATE implementation sketch
  - IDENTIFY: Exact file location: src/hooks/useFormStackURLSync.ts
  - IDENTIFY: Exact line number: 351 (after other guards in syncToUrl effect)
  - SPECIFY: Single-line fix: `if (isRestoringRef.current) return;`
  - DOCUMENT: Secondary improvements for P1.M2.T2 (double-RAF, pending processing)

Task 8: DEFINE validation test cases
  - TEST CASE 1: Rapid Open → Back Button (no duplicate history)
  - TEST CASE 2: Open → Open → Back → Forward (state matches URL)
  - TEST CASE 3: Unmount During Update (no errors, no late updates)
  - TEST CASE 4: Stress Test (100 rapid operations, only last wins)
```

### Decision Framework

```yaml
Evaluation Criteria:
  UR1_URL_SYNC_ACCURACY:
    weight: Critical
    requirement: URL must update immediately (0ms lag)
    reasoning: Navigation requires immediate URL feedback
    test: Measure time between state change and URL update

  UR2_BROWSER_NAVIGATION:
    weight: Critical
    requirement: popstate events must not create duplicate history
    reasoning: Back button is primary navigation method
    test: Open form → press back → check history.length

  UR3_RAPID_OPERATIONS:
    weight: Critical
    requirement: Must coalesce 100+ rapid updates
    reasoning: Form open/close can happen rapidly
    test: Fire 100 updates, verify only 1 history API call

  UR4_MOUNT_SAFETY:
    weight: High
    requirement: No updates after component unmount
    reasoning: Prevents memory leaks and React warnings
    test: Trigger update → unmount immediately → check for errors

  UR5_TEST_COMPATIBILITY:
    weight: High
    requirement: Must work in jsdom/test environments
    reasoning: Tests must pass in CI/CD
    test: Run full test suite in Vitest

Pattern Scoring:
  Pattern_A_useref:
    UR1_URL_SYNC_ACCURACY: 10/10 (synchronous, 0ms)
    UR2_BROWSER_NAVIGATION: 10/10 (isRestoringRef prevents races)
    UR3_RAPID_OPERATIONS: 10/10 (version-based coalescing)
    UR4_MOUNT_SAFETY: 10/10 (isMountedRef checks)
    UR5_TEST_COMPATIBILITY: 10/10 (isRAFActuallyAvailable handles)
    TOTAL: 50/50

  Pattern_B_useDeferredValue:
    UR1_URL_SYNC_ACCURACY: 5/10 (16-50ms lag)
    UR2_BROWSER_NAVIGATION: 3/10 (no popstate coordination)
    UR3_RAPID_OPERATIONS: 6/10 (no coalescing)
    UR4_MOUNT_SAFETY: 8/10 (React auto cleanup)
    UR5_TEST_COMPATIBILITY: 9/10 (React 18+)
    TOTAL: 31/50

  Pattern_C_useTransition:
    UR1_URL_SYNC_ACCURACY: 10/10 (immediate URL update)
    UR2_BROWSER_NAVIGATION: 9/10 (transition interruption)
    UR3_RAPID_OPERATIONS: 9/10 (auto-coalescing)
    UR4_MOUNT_SAFETY: 8/10 (needs manual ref)
    UR5_TEST_COMPATIBILITY: 7/10 (requires concurrent mode)
    TOTAL: 43/50
```

### Selected Pattern Details

```typescript
// PATTERN: useRef for Tracking Pending Operations
// JUSTIFICATION:
// 1. Already implemented in codebase with sophisticated coalescing
// 2. Zero URL lag - synchronous updates
// 3. Complete race prevention with multiple refs
// 4. Proven test compatibility with isRAFActuallyAvailable()
// 5. Minimal change required (single line fix)

// CURRENT STATE (has bug):
// File: src/hooks/useFormStackURLSync.ts
// Lines: 345-369

useEffect(() => {
  if (typeof window === "undefined") return;
  if (!syncToUrl) return;
  if (!isInitializedRef.current) return;

  // MISSING GUARD HERE - causes race condition
  // if (isRestoringRef.current) return;

  const currentIds = getStackIds();
  const prevIds = prevStackRef.current.map((e) => e.id);

  if (
    currentIds.length !== prevIds.length ||
    currentIds.some((id, i) => id !== prevIds[i])
  ) {
    const isAdding = currentIds.length > prevIds.length;
    syncStackToUrl(currentIds, isAdding);
  }

  prevStackRef.current = stack;
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);

// FIXED STATE (add single line):
useEffect(() => {
  if (typeof window === "undefined") return;
  if (!syncToUrl) return;
  if (!isInitializedRef.current) return;
  if (isRestoringRef.current) return; // ← ADD THIS LINE

  const currentIds = getStackIds();
  const prevIds = prevStackRef.current.map((e) => e.id);

  if (
    currentIds.length !== prevIds.length ||
    currentIds.some((id, i) => id !== prevIds[i])
  ) {
    const isAdding = currentIds.length > prevIds.length;
    syncStackToUrl(currentIds, isAdding);
  }

  prevStackRef.current = stack;
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);
```

---

## Validation Loop

### Level 1: Document Structure Validation

```bash
# Verify decision document exists at correct location
test -f plan/bugfix/architecture/url_mitigation_decision.md

# Verify document contains required sections
grep -q "## Selected Pattern" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "## Justification" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "## Implementation Sketch" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "## Validation Test Cases" plan/bugfix/architecture/url_mitigation_decision.md

# Expected: All checks pass, file exists and contains required sections
```

### Level 2: Decision Quality Validation

```bash
# Verify decision document addresses all 5 evaluation criteria
grep -q "URL Sync Accuracy" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "Browser Navigation" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "Rapid Operations" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "Mount Safety" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "Test Compatibility" plan/bugfix/architecture/url_mitigation_decision.md

# Verify implementation sketch references exact file locations
grep -q "src/hooks/useFormStackURLSync.ts" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "line 351" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "isRestoringRef.current" plan/bugfix/architecture/url_mitigation_decision.md

# Expected: All criteria addressed, exact locations specified
```

### Level 3: Pattern Analysis Validation

```bash
# Verify all three patterns were evaluated
grep -q "Pattern A.*useRef" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "Pattern B.*useDeferredValue" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "Pattern C.*useTransition" plan/bugfix/architecture/url_mitigation_decision.md

# Verify URL lag concern for useDeferredValue is documented
grep -q "URL lag" plan/bugfix/architecture/url_mitigation_decision.md

# Verify React 18+ requirement for useTransition is documented
grep -q "React 18" plan/bugfix/architecture/url_mitigation_decision.md

# Expected: All patterns analyzed, limitations documented
```

### Level 4: Traceability Validation

```bash
# Verify decision references P1.M2.T1.S1 analysis
grep -q "P1.M2.T1.S1" plan/bugfix/architecture/url_mitigation_decision.md

# Verify decision addresses all three race scenarios
grep -q "Scenario 1" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "Scenario 2" plan/bugfix/architecture/url_mitigation_decision.md
grep -q "Scenario 3" plan/bugfix/architecture/url_mitigation_decision.md

# Expected: Clear traceability to prior analysis and all scenarios
```

---

## Final Validation Checklist

### Document Completeness

- [ ] Decision document exists at `plan/bugfix/architecture/url_mitigation_decision.md`
- [ ] All three patterns (useRef, useDeferredValue, useTransition) evaluated
- [ ] Pattern selection justified against all 5 evaluation criteria
- [ ] Implementation sketch includes exact file paths and line numbers
- [ ] Validation test cases cover all three race scenarios from P1.M2.T1.S1

### Decision Quality

- [ ] Selected pattern (useRef) has highest score in evaluation matrix
- [ ] URL lag concern for useDeferredValue clearly documented
- [ ] React 18+ requirements for useTransition clearly documented
- [ ] Existing codebase patterns acknowledged (Pattern A already implemented)
- [ ] Minimal change approach emphasized (single-line fix)

### Implementation Guidance

- [ ] Exact file location specified: `src/hooks/useFormStackURLSync.ts`
- [ ] Exact line number specified: 351 (in syncToUrl effect)
- [ ] Code to add clearly shown: `if (isRestoringRef.current) return;`
- [ ] Secondary improvements documented for P1.M2.T2
- [ ] Context on existing refs provided (isRestoringRef, isUpdatingRef, etc.)

### Traceability

- [ ] References P1.M2.T1.S1 race condition analysis
- [ ] References testing_best_practices.md Section 2
- [ ] Addresses all three identified race scenarios
- [ ] Provides clear path to P1.M2.T2 implementation tasks
- [ ] Research documents linked in PRP context section

---

## Anti-Patterns to Avoid

- ❌ **Don't select useDeferredValue** - URL lag (16-50ms) is unacceptable for navigation
- ❌ **Don't rewrite entire hook** - Existing useRef implementation is sophisticated, bug is single missing guard
- ❌ **Don't ignore React version** - useTransition requires React 18+ (check package.json)
- ❌ **Don't forget test environments** - jsdom doesn't support RAF properly, use isRAFActuallyAvailable()
- ❌ **Don't overlook existing refs** - isRestoringRef, isUpdatingRef, pendingUpdateRef already handle most edge cases
- ❌ **Don't skip traceability** - Decision must clearly link to P1.M2.T1.S1 analysis and specific scenarios
- ❌ **Don't provide vague guidance** - Must specify exact line numbers (e.g., "line 351", not "near the top")

---

## Output Specification

**Primary Output:** `plan/bugfix/architecture/url_mitigation_decision.md`

**Document Structure:**
1. Executive Summary (selected pattern)
2. Pattern Comparison Matrix (scoring against 5 criteria)
3. Detailed Analysis (strengths/weaknesses of each pattern)
4. Selected Pattern Justification (why useRef won)
5. Implementation Sketch (exact file/line, code to add)
6. Validation Test Cases (4 test scenarios)
7. References (links to research documents)

**Confidence Score:** 10/10

**Validation:** The completed PRP and decision document should enable clear understanding of which pattern to use and why, with exact implementation guidance for P1.M2.T2.
