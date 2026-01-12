name: "P1.M2.T2.S3: Write tests for race condition scenarios in useFormStackURLSync"
description: |

---

## Goal

**Feature Goal**: Write comprehensive integration tests for race condition protection mechanisms in the useFormStackURLSync hook, ensuring URL state consistency under rapid operations and browser navigation.

**Deliverable**: New test suite in `src/hooks/__tests__/useFormStackURLSync.test.tsx` covering rapid form operations, browser navigation race conditions, mount/unmount safety, and URL state consistency.

**Success Definition**:
- All test scenarios from the work item pass successfully
- Tests verify RAF-based coalescing prevents duplicate history API calls
- Tests verify isMountedRef pattern prevents memory leaks and React warnings
- Tests verify URL state remains consistent throughout rapid operations
- Tests verify browser back/forward navigation works correctly under race conditions
- Zero console errors or warnings during test execution
- Tests can be added to existing test file without breaking existing tests

## User Persona (if applicable)

**Target User**: QA Engineer, Developer maintaining the useFormStackURLSync hook

**Use Case**: Ensuring the hook's race condition protection mechanisms work correctly under stress conditions before deployment to production

**User Journey**:
1. Developer runs test suite to verify race condition protection
2. Tests simulate rapid user interactions and browser navigation
3. Tests verify URL state consistency and no memory leaks
4. Developer gains confidence in hook's stability under race conditions

**Pain Points Addressed**:
- Uncertainty whether race condition fixes actually work in practice
- Fear of memory leaks from pending RAF callbacks
- Concerns about URL state corruption during rapid operations
- Need to verify browser navigation doesn't break URL sync

## Why

- **Production Stability**: Race conditions in URL sync can cause broken navigation, lost state, and poor user experience
- **Regression Prevention**: Tests ensure future changes don't reintroduce race condition bugs
- **Confidence in Fixes**: P1.M2.T2.S1 and P1.M2.T2.S2 implemented protection mechanisms that need validation
- **Edge Case Coverage**: Browser navigation during rapid updates is difficult to test manually but critical for UX

## What

Write integration tests covering these scenarios:

### Success Criteria

- [ ] Test rapid openForm calls (3+ in quick succession) verify URL state consistency
- [ ] Test open form → immediate browser back scenario
- [ ] Test open → open → back → forward navigation sequence
- [ ] Test URL state remains consistent throughout all operations
- [ ] Test no duplicate history entries are created
- [ ] Test mount/unmount safety prevents memory leaks
- [ ] All tests pass with zero console errors

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test validation**: This PRP provides all context needed including:
- Complete hook API with exact type signatures
- Existing test infrastructure and patterns
- Mock setup patterns for window.history API
- Code examples from existing tests
- External documentation URLs for React Testing Library and Vitest

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Hook Implementation (Modified in P1.M2.T2.S2)
- file: src/hooks/useFormStackURLSync.ts
  why: Complete implementation including race condition protection mechanisms added in P1.M2.T2.S2
  pattern: Extract isMountedRef pattern (lines 158-170), RAF-based coalescing (lines 184-251), version-based update tracking (lines 193-209)
  critical: The hook uses dual execution paths - RAF for production, synchronous for tests (detected by isRAFActuallyAvailable at lines 15-41)
  gotcha: Test environment detection happens via NODE_ENV='test' and vi/vitest worker detection - tests run synchronously, not with actual RAF

# Existing Tests (Baseline for new tests)
- file: src/hooks/__tests__/useFormStackURLSync.test.tsx
  why: Contains existing test patterns and mock setup that should be reused and extended
  pattern: History API mock setup (lines 26-120), wrapper pattern (lines 13-16), console error suppression (lines 374-383)
  critical: Tests already exist for race conditions starting at line 451 - review these to understand what's already covered
  gotcha: The existing tests already cover most scenarios - verify gaps before adding new tests

# Test Configuration
- file: vitest.config.ts
  why: Test framework configuration - Vitest with jsdom environment
  pattern: Environment is 'jsdom', setupFiles is './vitest.setup.ts', test pattern matches 'src/**/*.{test,spec}.{ts,tsx}'
  gotcha: Using Vitest 2.1.0+ with v8 coverage provider

- file: vitest.setup.ts
  why: Global test setup for cleanup and mock clearing
  pattern: afterEach cleanup and vi.clearAllMocks()
  critical: Tests automatically get cleanup and mock clearing

# Related Hooks (For Understanding Context)
- file: src/hooks/useFormStack.ts
  why: Main form stack hook that useFormStackURLSync integrates with
  pattern: Understanding openForm/closeForm API for testing

- file: src/hooks/useFormStackState.ts
  why: Provides stack state that URL sync reads from
  pattern: Stack structure is { id: string }[]

# External Documentation
- url: https://testing-library.com/docs/react-testing-library/api#renderhook
  why: renderHook API for testing React hooks
  section: renderHook

- url: https://testing-library.com/docs/dom-testing-library/api-async#waitfor
  why: waitFor for async assertions in tests
  section: waitFor

- url: https://testing-library.com/docs/react-testing-library/api#act
  why: act() wrapper for state changes in tests
  section: act

- url: https://vitest.dev/api/vi#vi-usefaketimers
  why: Vitest fake timers for testing requestAnimationFrame behavior
  section: vi.useFakeTimers

- url: https://developer.mozilla.org/en-US/docs/Web/API/History/pushState
  why: Understanding pushState for mocking
  section: pushState

- url: https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event
  why: Understanding popstate event for browser navigation simulation
  section: popstate event

# Architecture Documentation (if available)
- docfile: plan/bugfix/architecture/system_context.md
  why: System context for URL sync and race condition analysis
  section: Race condition scenarios and protection patterns

- docfile: COMPREHENSIVE_TESTING_RESEARCH_2025.md
  why: Consolidated testing research including RAF patterns, race condition testing, and best practices
  section: Complete reference for React Testing Library patterns, fake timers, and history API mocking
```

### Current Codebase tree

```bash
src/
├── hooks/
│   ├── useFormStackURLSync.ts          # Hook being tested (modified in P1.M2.T2.S2)
│   ├── useFormStack.ts                 # Main form stack hook
│   ├── useFormStackState.ts            # State management
│   ├── useFormStackActions.ts          # Action methods (popToIndex)
│   ├── __tests__/
│   │   ├── useFormStackURLSync.test.tsx  # EXISTING TESTS - EXTEND THIS FILE
│   │   └── useFormStack.test.tsx       # Reference for test patterns
├── components/
│   └── FormStackProvider.tsx           # Provider wrapper for tests
├── utils/
│   └── index.ts                        # URL building/parsing utilities
vitest.config.ts                        # Test configuration
vitest.setup.ts                         # Global test setup
```

### Desired Codebase tree with files to be added

```bash
# No new files needed - extend existing test file
src/hooks/__tests__/useFormStackURLSync.test.tsx  # ADD NEW TEST CASES TO THIS FILE
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Vitest/jsdom doesn't execute requestAnimationFrame callbacks
// The hook detects test environment and executes synchronously instead
// See: isRAFActuallyAvailable() at lines 15-41 of useFormStackURLSync.ts
// Do NOT use vi.useFakeTimers() unless explicitly testing RAF path
// Using fake timers requires mocking the environment detection

// CRITICAL: All state changes MUST be wrapped in act()
// Failing to wrap state changes causes "update not wrapped in act()" warnings
act(() => {
  result.current.openForm({ id: 'form-1', component: () => null });
});

// CRITICAL: Console.error suppression pattern for testing error cases
// Tests should suppress expected errors to avoid cluttering test output
const originalError = console.error;
beforeEach(() => { console.error = vi.fn(); });
afterEach(() => { console.error = originalError; });

// GOTCHA: popstate handler is captured via addEventListener mock
// The existing test setup captures popstateHandler variable (line 24)
// Use this to simulate browser back/forward navigation
popstateHandler?.({ state: { forms: ['form-1'] } } as PopStateEvent);

// GOTCHA: History API mocks update window.location to reflect URL changes
// This allows getUrlState() to return correct values in tests
// See lines 28-83 for the mock implementation

// GOTCHA: The test suite already includes race condition tests
// Lines 451-1182 contain extensive race condition tests
// Review before adding new tests to avoid duplication

// GOTCHA: useFormStackWithURLSync helper hook (lines 456-461)
// Combines useFormStack, useFormStackActions, and useFormStackURLSync
// Use this for testing integration between all hooks

// GOTCHA: isUpdatingRef prevents sync loops during popstate
// When popstate fires, isUpdatingRef.current is checked
// If true, popstate handler returns early to prevent race conditions
```

## Implementation Blueprint

### Data models and structure

No new data models needed - tests use existing hook interfaces:

```typescript
// Hook return type (from useFormStackURLSync.ts)
interface UseFormStackURLSyncReturn {
  isRestoring: boolean;
  getUrlState: () => string[];
  forceUrlUpdate: () => void;
}

// Helper hook for combined testing (already exists in test file at lines 456-461)
function useFormStackWithURLSync() {
  const formStack = useFormStack();
  const { popToIndex } = useFormStackActions();
  const urlSync = useFormStackURLSync({ popToIndex });
  return { ...urlSync, ...formStack, popToIndex };
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: REVIEW existing test coverage
  - ANALYZE: src/hooks/__tests__/useFormStackURLSync.test.tsx lines 451-1182
  - IDENTIFY: Which scenarios from work item are already covered
  - DETERMINE: If new tests are needed or if existing tests cover requirements
  - NOTE: Existing tests include rapid form operations, mount/unmount safety, browser navigation, URL state consistency, and stress tests

Task 2: VERIFY test scenarios against work item requirements
  - CHECK: Are rapid openForm calls (3+ in quick succession) tested? (YES: lines 621-653, 1079-1102)
  - CHECK: Is "open form → immediate browser back" tested? (YES: lines 749-777)
  - CHECK: Is "open → open → back → forward" tested? (YES: lines 779-809)
  - CHECK: Is URL state consistency verified? (YES: lines 910-1064)
  - CHECK: Is duplicate history entry prevention tested? (YES: lines 981-1013)
  - DECISION: If all scenarios covered, task is verification. If gaps exist, write new tests.

Task 3: (OPTIONAL) ADD any missing test cases
  - ONLY if gaps identified in Task 2
  - FOLLOW: Existing test structure and patterns
  - PLACE: In appropriate describe block within useFormStackURLSync.test.tsx
  - USE: Existing mock setup, wrapper, and helper functions
  - NAMING: it("should [specific behavior being tested]")
  - PATTERN: Wrap state changes in act(), use waitFor() for assertions

Task 4: (OPTIONAL) ADD fake timer tests for RAF path
  - ONLY if testing production RAF coalescing behavior specifically
  - USE: vi.useFakeTimers() with vi.advanceTimersByTime(16) to advance RAF frames
  - GOTCHA: Must mock isRAFActuallyAvailable to return true for this to work
  - PLACE: In new describe("RAF coalescing with fake timers") block
  - VERIFY: Multiple rapid updates result in single history API call

Task 5: RUN test suite
  - EXECUTE: npm test -- src/hooks/__tests__/useFormStackURLSync.test.tsx
  - VERIFY: All tests pass with zero errors
  - CHECK: No console warnings or errors
  - CONFIRM: Coverage for race condition scenarios is adequate

Task 6: (OPTIONAL) DOCUMENT any findings
  - IF: Existing tests already cover all scenarios
  - CREATE: Brief documentation explaining coverage
  - STORE: In plan/bugfix/P1M2T2S3/research/ directory
  - EXPLAIN: Which tests cover which scenarios from work item
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// EXISTING TEST COVERAGE ANALYSIS
// ============================================================================
// The existing test suite (lines 451-1182) already includes:
//
// 1. RAF-based coalescing tests (lines 464-539)
//    - Multiple rapid URL updates coalesced into one
//    - Version-based update coalescing with 5 rapid updates
//
// 2. Mount/unmount safety tests (lines 541-606)
//    - No state updates after unmount
//    - Rapid mount/unmount cycles (10 iterations)
//
// 3. Rapid form operations tests (lines 609-735)
//    - Rapid openForm calls (3+ forms)
//    - Rapid closeForm calls
//    - Mixed rapid open/close operations
//
// 4. Browser navigation race conditions (lines 737-908)
//    - Open form → immediate browser back
//    - Open → open → back → forward sequence
//    - Rapid back/forward button clicks
//    - Navigation during URL update
//
// 5. URL state consistency tests (lines 910-1065)
//    - Consistency throughout rapid operations
//    - No duplicate history entries created
//    - Unique states in history tracking
//
// 6. Stress tests (lines 1067-1182)
//    - 10 rapid form opens
//    - Rapid open/close cycles
//    - Interleaved navigation and operations
//
// CONCLUSION: All work item scenarios are ALREADY COVERED by existing tests.
// The primary task is VERIFICATION, not writing new tests.
// ============================================================================

// Pattern: Test file structure (from existing tests)
describe("race condition protection", () => {
  describe("RAF-based coalescing", () => {
    // Tests for RAF coalescing behavior
  });

  describe("mount/unmount safety", () => {
    // Tests for isMountedRef pattern
  });
});

describe("rapid form operations", () => {
  // Tests for rapid open/close operations
});

describe("browser navigation race conditions", () => {
  // Tests for popstate during rapid operations
});

describe("URL state consistency", () => {
  // Tests for URL/stack synchronization consistency
});

// Pattern: Console error suppression (for mount/unmount tests)
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

// Pattern: Mock setup is shared across all tests
// Lines 26-120 contain the beforeEach hook that sets up:
// - mockPushState, mockReplaceState
// - mockAddEventListener, mockRemoveEventListener
// - popstateHandler capture
// - window.history and window.location mocks

// Pattern: Using the helper hook for integration testing
const { result } = renderHook(() => useFormStackWithURLSync(), { wrapper });

// Pattern: State changes wrapped in act()
act(() => {
  result.current.openForm({ id: "form-1", component: () => null });
});

// Pattern: Async assertions with waitFor
await waitFor(() => {
  expect(result.current.getUrlState()).toEqual(["form-1"]);
});

// Pattern: Simulating browser navigation
popstateHandler?.({ state: { forms: ["form-1"] } } as PopStateEvent);

// Pattern: Tracking mock call counts for verification
const initialPushStateCount = mockPushState.mock.calls.length;
// ... perform operations ...
const finalPushStateCount = mockPushState.mock.calls.length;
expect(finalPushStateCount - initialPushStateCount).toBeLessThanOrEqual(1);
```

### Integration Points

```yaml
TEST_FILE:
  - extend: src/hooks/__tests__/useFormStackURLSync.test.tsx
  - pattern: Add new describe blocks or add tests to existing blocks
  - preserve: All existing mock setup and helper functions

MOCK_SETUP:
  - reuse: Existing beforeEach hook (lines 26-120)
  - provides: mockPushState, mockReplaceState, popstateHandler
  - critical: Do not modify existing mock setup unless necessary

HELPER_HOOK:
  - use: useFormStackWithURLSync (lines 456-461)
  - combines: useFormStack, useFormStackActions, useFormStackURLSync
  - available: In the test file, can be used in new tests

WRAPPER:
  - use: Existing wrapper (lines 13-16)
  - provides: FormStackProvider context
  - required: For all hook tests
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript type checking
npx tsc --noEmit

# Run linter and fix issues
npm run lint -- --fix
# or if using eslint directly
npx eslint src/hooks/__tests__/useFormStackURLSync.test.tsx --fix

# Expected: Zero type errors, zero linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run specific test file
npm test -- src/hooks/__tests__/useFormStackURLSync.test.tsx

# Run with coverage
npm test -- --coverage src/hooks/__tests__/useFormStackURLSync.test.tsx

# Run in watch mode during development
npm test -- --watch src/hooks/__tests__/useFormStackURLSync.test.tsx

# Expected: All tests pass. If failing, READ output and fix before proceeding.
# Verify specifically that race condition tests (lines 451-1182) all pass.
```

### Level 3: Integration Testing (System Validation)

```bash
# Run full test suite to ensure no regressions
npm test

# Run all hook tests together
npm test -- src/hooks/__tests__/

# Verify test output is clean (no console errors or warnings)
# Expected: All tests pass, zero console errors, clean test output

# Specific test scenarios to verify:
npm test -- -t "should coalesce multiple rapid URL updates"
npm test -- -t "should handle rapid openForm calls"
npm test -- -t "should handle open form → immediate browser back"
npm test -- -t "should handle open → open → back → forward sequence"
npm test -- -t "should maintain consistency throughout rapid operations"
npm test -- -t "should verify no duplicate history entries are created"
npm test -- -t "should not update state after unmount"
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual verification of test coverage
# Check if all work item scenarios are covered:

# 1. Rapid openForm calls (3+ in quick succession)
npm test -- -t "rapid openForm"

# 2. Open form → immediate browser back
npm test -- -t "open form → immediate browser back"

# 3. Open → open → back → forward sequence
npm test -- -t "open → open → back → forward"

# 4. URL state consistency
npm test -- -t "URL state consistency"

# 5. No duplicate history entries
npm test -- -t "duplicate history"

# Mount/unmount safety verification
npm test -- -t "mount/unmount"

# Stress tests for robustness
npm test -- -t "stress tests"

# Coverage report (if coverage tools are available)
npm test -- --coverage --reporter=html
# Open coverage/index.html to verify race condition code is covered
```

## Final Validation Checklist

### Technical Validation

- [ ] All tests pass: `npm test -- src/hooks/__tests__/useFormStackURLSync.test.tsx`
- [ ] No console errors or warnings during test execution
- [ ] TypeScript compilation succeeds: `npx tsc --noEmit`
- [ ] No linting errors: `npm run lint`
- [ ] Test coverage shows race condition protection code is exercised

### Feature Validation

- [ ] Rapid openForm calls (3+ in quick succession) test passes
- [ ] Open form → immediate browser back test passes
- [ ] Open → open → back → forward sequence test passes
- [ ] URL state consistency is verified throughout operations
- [ ] No duplicate history entries test passes
- [ ] Mount/unmount safety tests pass (no React warnings)
- [ ] All success criteria from work item are met

### Code Quality Validation

- [ ] Tests follow existing patterns in the test file
- [ ] State changes are properly wrapped in act()
- [ ] Console.error is suppressed for expected error cases
- [ ] Test names clearly describe what behavior is being tested
- [ ] Tests are independent (no shared state between tests)

### Documentation & Deployment

- [ ] If new tests were added, they are properly documented with comments
- [ ] If existing tests already cover scenarios, note this in completion
- [ ] Test output is clean and readable

---

## Anti-Patterns to Avoid

- ❌ Don't modify the existing mock setup unless absolutely necessary
- ❌ Don't write tests that depend on execution order or timing
- ❌ Don't use real timers - rely on the test environment's synchronous execution
- ❌ Don't forget to wrap state changes in act()
- ❌ Don't forget to restore console.error after suppressing it
- ❌ Don't write duplicate tests - check what's already covered first
- ❌ Don't use setTimeout/async delays for synchronization - use waitFor()
- ❌ Don't test implementation details (like ref values) - test behavior
- ❌ Don't create new test files - extend the existing one
- ❌ Don't ignore failing tests - fix them before marking task complete

---

## Additional Notes

### Existing Test Coverage Summary

The existing test suite in `useFormStackURLSync.test.tsx` (lines 451-1182) already provides comprehensive coverage of all scenarios specified in the work item:

1. **Rapid openForm calls (3+ in quick succession)**: Lines 621-653, 1079-1102
2. **Open form → immediate browser back**: Lines 749-777
3. **Open → open → back → forward sequence**: Lines 779-809
4. **URL state consistency**: Lines 910-1065
5. **No duplicate history entries**: Lines 981-1013
6. **Mount/unmount safety**: Lines 541-606

### Task Completion Criteria

This task (P1.M2.T2.S3) can be considered complete if:
1. All existing tests pass successfully
2. Verification confirms all work item scenarios are covered
3. Test output is clean with zero console errors

If gaps are identified during verification, add the necessary test cases following the existing patterns in the file.
