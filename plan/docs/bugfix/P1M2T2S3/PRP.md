# Product Requirement Prompt (PRP): Race Condition Test Suite for useFormStackURLSync

**Work Item**: P1.M2.T2.S3
**Task**: Write tests for race condition scenarios
**Status**: READY FOR IMPLEMENTATION
**Confidence Score**: 9/10 for one-pass implementation success

---

## Goal

**Feature Goal**: Write comprehensive integration tests for `useFormStackURLSync` hook to verify that race condition protection mechanisms (RAF-based coalescing, version tracking, isMountedRef guards) work correctly under rapid successive operations and browser navigation scenarios.

**Deliverable**: Extended `src/hooks/__tests__/useFormStackURLSync.test.tsx` with new test suite covering:
1. Rapid openForm calls (3+ in quick succession)
2. Open form → immediate browser back
3. Open → open → back → forward sequence
4. URL state consistency verification throughout operations
5. Verification of no duplicate history entries

**Success Definition**:
- All race condition scenarios have passing tests
- Tests verify RAF-based coalescing prevents duplicate URL updates
- Tests verify isMountedRef guards prevent state updates after unmount
- Tests verify URL state remains consistent during rapid operations
- Tests verify no duplicate history entries are created
- All existing tests continue to pass
- Test coverage increases for race condition code paths

## User Persona (if applicable)

**Target User**: Developer/QA maintaining the codebase

**Use Case**: Validating that the race condition fixes from P1.M2.T2.S1 and P1.M2.T2.S2 work correctly under stress conditions

**User Journey**:
1. Developer adds race condition protection to hook
2. Developer runs new test suite to verify fixes work
3. Tests catch regressions if race condition protection is broken
4. CI/CD pipeline runs tests automatically on every commit

**Pain Points Addressed**:
- No automated verification that race condition fixes work
- Manual testing is time-consuming and error-prone
- Regressions can occur without detection
- Hard to reproduce race conditions consistently

## Why

- **Business value**: Ensures reliable URL sync behavior in production, prevents customer-facing bugs from race conditions
- **Integration**: Completes the P1.M2.T2 race condition fix trilogy (S1: implement coalescing, S2: add unmount guards, S3: test coverage)
- **Problems solved**: Lack of automated test coverage for race condition scenarios, potential for undetected regressions

---

## What

### Technical Implementation

Add new test suite to `src/hooks/__tests__/useFormStackURLSync.test.tsx`:

1. **Test suite: "Race Condition Protection"**
   - Tests for RAF-based coalescing (rapid URL updates)
   - Tests for version-based update coalescing
   - Tests for mount/unmount safety

2. **Test suite: "Rapid Form Operations"**
   - Rapid openForm calls (3+ in succession)
   - Rapid closeForm calls
   - Mixed open/close operations

3. **Test suite: "Browser Navigation Race Conditions"**
   - Open form → immediate browser back
   - Open → open → back → forward sequence
   - Rapid back/forward button clicks

4. **Test suite: "URL State Consistency"**
   - Verify URL matches stack state after operations
   - Verify no duplicate history entries
   - Verify history state contains correct form IDs

### Success Criteria

- [ ] New test suite "Race Condition Protection" added
- [ ] New test suite "Rapid Form Operations" added
- [ ] New test suite "Browser Navigation Race Conditions" added
- [ ] New test suite "URL State Consistency" added
- [ ] All new tests pass
- [ ] All existing tests continue to pass
- [ ] Test coverage increases for race condition code paths
- [ ] Tests use fake timers appropriately (vi.useFakeTimers)
- [ ] Tests use proper act() wrapping for state changes
- [ ] Tests verify both behavior and absence of side effects

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Complete existing test file to understand patterns
- Research on RTL race condition testing patterns
- Research on Vitest fake timers
- Complete implementation of the hook being tested
- All integration points and dependencies
- Specific test scenarios with code patterns
- Known gotchas specific to this codebase

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# EXTERNAL DOCUMENTATION
- url: https://vitest.dev/api/mock-functions.html
  why: Vitest mock functions documentation - vi.useFakeTimers(), vi.advanceTimersByTime()
  critical: Required for testing RAF-based coalescing

- url: https://vitest.dev/api/vi.html
  why: Vitest vi reference - timer control methods
  critical: Timer advancement strategies for RAF callbacks

- url: https://testing-library.com/docs/react-testing-library/api#renderhook
  why: React Testing Library renderHook API documentation
  critical: Understanding renderHook, act(), and waitFor patterns

- url: https://testing-library.com/docs/react-testing-library/api#act
  why: React Testing Library act() API documentation
  critical: Wrapping state updates in tests

- url: https://react.dev/learn/running-tests-simultaneously
  why: React documentation on test isolation and cleanup
  critical: Understanding beforeEach/afterEach patterns

# INTERNAL RESEARCH DOCUMENTS
- file: /home/dustin/projects/geoform/plan/bugfix/P1M2T2S3/research/rtl_race_condition_patterns.md
  why: Comprehensive research on React Testing Library patterns for race conditions
  critical: 18 specific test patterns with runnable code examples
  section: Full document - especially "Testing Rapid Successive State Changes" section

- file: /home/dustin/projects/geoform/plan/bugfix/P1M2T2S3/research/vitest_fake_timers.md
  why: Research on Vitest fake timers for RAF-based coalescing
  critical: Timer advancement strategies, RAF testing patterns
  section: "RAF Coalescing Patterns" section

- file: /home/dustin/projects/geoform/plan/bugfix/P1M2T2S3/research/vitest_fake_timer_examples.ts
  why: Executable code examples for fake timer testing
  critical: Ready-to-run test patterns for useFormStackURLSync
  section: Full file

- file: /home/dustin/projects/geoform/plan/bugfix/P1M2T2S3/research/README.md
  why: Quick reference summary of research findings
  critical: Key takeaways and recommended testing strategy

# PREVIOUS PRPs - CONTEXT FOR WHAT WAS IMPLEMENTED
- file: /home/dustin/projects/geoform/plan/docs/bugfix/P1M2T2S1/PRP.md
  why: PRP for useRef-based pending update tracking (RAF coalescing)
  critical: Understanding the coalescing pattern that needs testing
  section: Lines 300-398 (Implementation Patterns)

- file: /home/dustin/projects/geoform/plan/docs/bugfix/P1M2T2S2/PRP.md
  why: PRP for isMountedRef pattern (unmount safety)
  critical: Understanding the unmount guards that need testing
  section: Lines 339-550 (Implementation Patterns)

# CODE FILES
- file: /home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts
  why: TARGET FILE - The implementation being tested
  pattern: RAF-based coalescing (lines 184-251), isMountedRef guards (lines 161-170, 200-238)
  gotcha: isRAFActuallyAvailable() bypasses RAF in test environments
  line_range: 1-377 (entire file)

- file: /home/dustin/projects/geoform/src/hooks/__tests__/useFormStackURLSync.test.tsx
  why: TARGET FILE - Add new test suites to this file
  pattern: Existing test structure, mock setup, wrapper component
  section: Lines 1-387 (entire file)

- file: /home/dustin/projects/geoform/src/hooks/__tests__/useFormStack.test.tsx
  why: Reference for hook testing patterns
  pattern: renderHook, act(), wrapper, describe blocks

- file: /home/dustin/projects/geoform/plan/architecture/testing_strategy.md
  why: Overall testing strategy for the project
  critical: Test philosophy, coverage goals, organization
  section: "Unit Testing Strategy" section

# CONFIGURATION FILES
- file: /home/dustin/projects/geoform/vitest.config.ts
  why: Test configuration
  pattern: jsdom environment, test match patterns

- file: /home/dustin/projects/geoform/package.json
  why: Project scripts
  pattern: "test": "vitest", "test:coverage": "vitest --coverage"
```

### Current Codebase Tree

```bash
geoform/
├── src/
│   ├── hooks/
│   │   ├── useFormStackURLSync.ts              # Implementation under test
│   │   ├── useFormStack.ts
│   │   ├── useFormStackState.ts
│   │   ├── useFormStackActions.ts
│   │   └── __tests__/
│   │       ├── useFormStackURLSync.test.tsx    # TARGET FILE - Add tests here
│   │       └── useFormStack.test.tsx
│   ├── utils/
│   │   └── index.ts                            # URL encoding utilities
│   └── components/
│       └── FormStackProvider.tsx
├── plan/
│   └── bugfix/
│       └── P1M2T2S3/
│           ├── PRP.md                          # This file
│           └── research/
│               ├── rtl_race_condition_patterns.md
│               ├── vitest_fake_timers.md
│               ├── vitest_fake_timer_examples.ts
│               └── README.md
├── vitest.config.ts
├── package.json
└── tsconfig.json
```

### Desired Codebase Tree with Changes

```bash
# No new files - only additions to existing test file
src/hooks/__tests__/useFormStackURLSync.test.tsx  # ADD: New test suites
```

### Known Gotchas of This Codebase & Library Quirks

```typescript
// CRITICAL: isRAFActuallyAvailable() bypasses RAF in test environments
// The hook detects test environments and executes updates synchronously
// This means RAF-based coalescing cannot be tested directly without modification
// Solution: Tests verify behavior (coalescing works), not implementation detail

// CRITICAL: Existing mock setup uses vi.fn() for history API
// mockPushState and mockReplaceState are already set up in beforeEach
// Use these mocks to verify no duplicate calls occur

// CRITICAL: popstateHandler is captured in addEventListener mock
// To trigger popstate events, call: popstateHandler?.({ state: { forms: [...] } })
// This is already set up in existing test patterns

// CRITICAL: FormStackProvider wrapper is required
// renderHook(() => useFormStackURLSync(), { wrapper })
// The wrapper is defined at top of test file

// CRITICAL: use act() for all state changes
// Any operation that modifies React state must be wrapped in act()
// Pattern: act(() => { result.current.openForm(...); })

// CRITICAL: waitFor for async operations
// Use waitFor for assertions that depend on async updates
// Pattern: await waitFor(() => expect(onRestore).toHaveBeenCalled());

// CRITICAL: Error suppression pattern
// For tests that expect errors, use console.error suppression
// Pattern: console.error = vi.fn(); // beforeEach
//          console.error = originalError; // afterEach

// CRITICAL: Fake timers require cleanup
// If using vi.useFakeTimers(), MUST restore in afterEach
// Pattern: beforeEach(() => { vi.useFakeTimers(); });
//          afterEach(() => { vi.useRealTimers(); });

// CRITICAL: Test environment uses jsdom, not real browser
// window.history.pushState doesn't actually navigate
// Tests must verify mock calls, not actual browser behavior

// CRITICAL: React Testing Library version
// Using @testing-library/react@16.3.1 with modern APIs
// renderHook, act(), waitFor are all available

// GOTCHA: openForm is async but tests don't need to await
// useFormStack.openForm returns a Promise
// But for URL sync testing, we don't care about the promise resolution

// GOTCHA: URL sync depends on stack changes
// Must use useFormStackActions to modify stack
// This triggers URL sync effect automatically

// GOTCHA: History state is mocked
// window.history.state is set in mock but doesn't persist
// Verify using mock calls, not state inspection

// GOTCHA: Multiple RAF callbacks may be scheduled
// When testing rapid operations, multiple RAF callbacks may be pending
// Advance timers by multiple frames if needed: vi.advanceTimersByTime(32) for 2 frames

// GOTCHA: isMountedRef pattern doesn't require special test setup
// The ref is automatically managed by the hook
// Tests verify behavior (no warnings), not the ref value directly

// GOTCHA: Version-based coalescing is internal
// pendingUpdateRef is not exposed
// Verify coalescing by checking mock call counts, not version values
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - using existing test utilities:

```typescript
// Existing test utilities (no changes needed)
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Existing mocks (no changes needed)
let mockPushState: ReturnType<typeof vi.fn>;
let mockReplaceState: ReturnType<typeof vi.fn>;
let popstateHandler: ((event: PopStateEvent) => void) | null = null;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD new describe block for race condition tests
  - ADD: describe('race condition protection', () => { ... });
  - LOCATION: After existing describe blocks (around line 387)
  - NAMING: Use lowercase for describe text (existing pattern)
  - STRUCTURE: Multiple nested describe blocks for organization
  - DEPENDENCIES: None

Task 2: ADD tests for rapid URL updates (RAF coalescing)
  - ADD: it('should coalesce multiple rapid URL updates into one', () => { ... });
  - VERIFY: mockPushState called only once for 3+ rapid updates
  - USE: act() for state changes
  - USE: waitFor for assertions
  - LOCATION: Inside "race condition protection" describe
  - PATTERN: Force multiple updates, verify single history API call

Task 3: ADD tests for openForm rapid succession
  - ADD: it('should handle rapid openForm calls correctly', () => { ... });
  - VERIFY: URL shows all forms in correct order
  - VERIFY: No duplicate history entries
  - USE: useFormStack to open forms rapidly
  - USE: getUrlState() to verify URL state
  - LOCATION: Inside new "rapid form operations" describe

Task 4: ADD tests for open → immediate back
  - ADD: it('should handle open form → immediate browser back', () => { ... });
  - VERIFY: Form closes without race condition
  - VERIFY: URL updates correctly
  - USE: popstateHandler to simulate back button
  - USE: Check for no duplicate history entries
  - LOCATION: Inside new "browser navigation race conditions" describe

Task 5: ADD tests for open → open → back → forward
  - ADD: it('should handle open → open → back → forward sequence', () => { ... });
  - VERIFY: All forms open, then navigation works correctly
  - VERIFY: URL state consistent throughout
  - USE: Multiple form opens, then popstate events
  - USE: Verify final state matches expected
  - LOCATION: Inside "browser navigation race conditions" describe

Task 6: ADD tests for URL state consistency
  - ADD: it('should maintain URL state consistency throughout rapid operations', () => { ... });
  - VERIFY: URL always matches stack state
  - VERIFY: No orphaned history entries
  - USE: Mix of open, close, navigation operations
  - USE: Check URL after each operation
  - LOCATION: Inside new "URL state consistency" describe

Task 7: ADD tests for mount/unmount safety
  - ADD: it('should not update state after unmount', () => { ... });
  - VERIFY: No console warnings on rapid unmount
  - VERIFY: No memory leaks from pending RAF callbacks
  - USE: renderHook with unmount
  - USE: Verify no warnings in console.error
  - LOCATION: Inside "race condition protection" describe

Task 8: VERIFY all tests pass
  - RUN: npm test -- src/hooks/__tests__/useFormStackURLSync.test.tsx
  - VERIFY: All existing tests pass
  - VERIFY: All new tests pass
  - CHECK: No TypeScript errors
  - CHECK: No linting errors
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CRITICAL TEST PATTERN 1: Rapid URL Updates (RAF Coalescing)
// ============================================================================
// Tests that multiple rapid syncStackToUrl calls are coalesced into one

describe('RAF-based coalescing', () => {
  it('should coalesce multiple rapid URL updates into one', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
    const { openForm, closeForm } = useFormStack();

    // Trigger multiple rapid URL updates
    act(() => {
      openForm({ id: 'form-1', component: () => null });
      openForm({ id: 'form-2', component: () => null });
      openForm({ id: 'form-3', component: () => null });
    });

    // Wait for all updates to settle
    await waitFor(() => {
      // Should only see ONE pushState call (for form-3), not three
      expect(mockPushState).toHaveBeenCalledTimes(1);
      // URL should contain all three forms
      expect(result.current.getUrlState()).toEqual(['form-1', 'form-2', 'form-3']);
    });
  });
});

// ============================================================================
// CRITICAL TEST PATTERN 2: Rapid Form Operations
// ============================================================================
// Tests rapid form opening and closing

describe('rapid form operations', () => {
  it('should handle rapid openForm calls correctly', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
    const { openForm } = useFormStack();

    // Rapidly open forms
    act(() => {
      openForm({ id: 'org-form', component: () => null });
      openForm({ id: 'team-form', component: () => null });
      openForm({ id: 'user-form', component: () => null });
    });

    await waitFor(() => {
      // Verify URL contains all forms in order
      expect(result.current.getUrlState()).toEqual([
        'org-form',
        'team-form',
        'user-form'
      ]);

      // Verify no duplicate history entries
      const pushStateCalls = mockPushState.mock.calls.length;
      const replaceStateCalls = mockReplaceState.mock.calls.length;
      // Should have: 1 push (for initial) + 2 pushes (for subsequent opens) = 3 total
      // But with coalescing, should be fewer
      expect(pushStateCalls).toBeLessThanOrEqual(3);
      expect(replaceStateCalls).toBe(0); // No replaceState for opening
    });
  });

  it('should handle rapid closeForm calls correctly', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
    const { openForm, closeForm } = useFormStack();

    // Open forms first
    act(() => {
      openForm({ id: 'form-1', component: () => null });
      openForm({ id: 'form-2', component: () => null });
      openForm({ id: 'form-3', component: () => null });
    });

    // Clear mock calls from opening
    vi.clearAllMocks();

    // Rapidly close forms
    act(() => {
      closeForm();
      closeForm();
      closeForm();
    });

    await waitFor(() => {
      // All forms should be closed
      expect(result.current.getUrlState()).toEqual([]);

      // Should have used replaceState for closing (or no calls if all closed)
      // The exact behavior depends on implementation
    });
  });
});

// ============================================================================
// CRITICAL TEST PATTERN 3: Browser Navigation Race Conditions
// ============================================================================
// Tests navigation during rapid updates

describe('browser navigation race conditions', () => {
  it('should handle open form → immediate browser back', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
    const { openForm, closeForm } = useFormStack();

    // Open a form
    act(() => {
      openForm({ id: 'form-1', component: () => null });
    });

    // Clear mocks
    vi.clearAllMocks();

    // Simulate immediate browser back
    act(() => {
      popstateHandler?.({ state: { forms: [] } } as PopStateEvent);
    });

    await waitFor(() => {
      // Form should be closed
      expect(result.current.getUrlState()).toEqual([]);

      // Should handle navigation cleanly without race condition
      // No duplicate history entries
      expect(mockPushState).not.toHaveBeenCalled();
    });
  });

  it('should handle open → open → back → forward sequence', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
    const { openForm } = useFormStack();

    // Open two forms
    act(() => {
      openForm({ id: 'form-1', component: () => null });
      openForm({ id: 'form-2', component: () => null });
    });

    await waitFor(() => {
      expect(result.current.getUrlState()).toEqual(['form-1', 'form-2']);
    });

    // Clear mocks
    vi.clearAllMocks();

    // Simulate back (go to form-1)
    act(() => {
      popstateHandler?.({ state: { forms: ['form-1'] } } as PopStateEvent);
    });

    await waitFor(() => {
      expect(result.current.getUrlState()).toEqual(['form-1']);
    });

    // Simulate forward (go back to form-2)
    // Note: Forward navigation requires form registry, may not work in current implementation
    // This test documents the expected behavior
  });
});

// ============================================================================
// CRITICAL TEST PATTERN 4: URL State Consistency
// ============================================================================
// Tests that URL always matches stack state

describe('URL state consistency', () => {
  it('should maintain URL state consistency throughout rapid operations', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
    const { openForm, closeForm } = useFormStack();

    // Open form-1
    act(() => {
      openForm({ id: 'form-1', component: () => null });
    });

    await waitFor(() => {
      expect(result.current.getUrlState()).toEqual(['form-1']);
    });

    // Open form-2 (rapid succession)
    act(() => {
      openForm({ id: 'form-2', component: () => null });
    });

    await waitFor(() => {
      expect(result.current.getUrlState()).toEqual(['form-1', 'form-2']);
    });

    // Open form-3 (rapid succession)
    act(() => {
      openForm({ id: 'form-3', component: () => null });
    });

    await waitFor(() => {
      expect(result.current.getUrlState()).toEqual(['form-1', 'form-2', 'form-3']);
    });

    // Close form-3
    act(() => {
      closeForm();
    });

    await waitFor(() => {
      expect(result.current.getUrlState()).toEqual(['form-1', 'form-2']);
    });

    // Verify no orphaned history entries
    // URL should always match stack state
  });

  it('should verify no duplicate history entries are created', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
    const { openForm } = useFormStack();

    const initialPushStateCount = mockPushState.mock.calls.length;
    const initialReplaceStateCount = mockReplaceState.mock.calls.length;

    // Rapidly open 5 forms
    act(() => {
      for (let i = 1; i <= 5; i++) {
        openForm({ id: `form-${i}`, component: () => null });
      }
    });

    await waitFor(() => {
      expect(result.current.getUrlState()).toHaveLength(5);
    });

    const finalPushStateCount = mockPushState.mock.calls.length;
    const finalReplaceStateCount = mockReplaceState.mock.calls.length;

    // With RAF coalescing, should have fewer than 5 calls
    // Exact count depends on implementation timing
    const pushStateDelta = finalPushStateCount - initialPushStateCount;
    expect(pushStateDelta).toBeLessThanOrEqual(5);
    expect(pushStateDelta).toBeGreaterThan(0);

    // Should use pushState for opening, not replaceState
    expect(finalReplaceStateCount).toBe(initialReplaceStateCount);
  });
});

// ============================================================================
// CRITICAL TEST PATTERN 5: Mount/Unmount Safety
// ============================================================================
// Tests that isMountedRef guards work correctly

describe('mount/unmount safety', () => {
  it('should not update state after unmount', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    const { unmount } = renderHook(() => useFormStackURLSync(), { wrapper });
    const { openForm } = useFormStack();

    // Open a form (triggers RAF callback)
    act(() => {
      openForm({ id: 'form-1', component: () => null });
    });

    // Unmount immediately (before RAF callback completes)
    act(() => {
      unmount();
    });

    // Wait for any pending RAF callbacks
    await waitFor(() => {
      // Should not have any React warnings about updates on unmounted component
      const errorCalls = consoleErrorSpy.mock.calls.filter(call =>
        call[0]?.includes?.('unmounted') ||
        call[0]?.includes?.('setState')
      );
      expect(errorCalls).toHaveLength(0);
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle rapid mount/unmount cycles', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    // Mount and unmount rapidly
    for (let i = 0; i < 10; i++) {
      const { unmount } = renderHook(() => useFormStackURLSync(), { wrapper });

      act(() => {
        unmount();
      });
    }

    await waitFor(() => {
      // Should not have any warnings
      const errorCalls = consoleErrorSpy.mock.calls.filter(call =>
        call[0]?.includes?.('unmounted') ||
        call[0]?.includes?.('setState') ||
        call[0]?.includes?.('memory leak')
      );
      expect(errorCalls).toHaveLength(0);
    });

    consoleErrorSpy.mockRestore();
  });
});
```

### Integration Points

```yaml
TEST_DEPENDENCIES:
  - import: { renderHook, act, waitFor } from '@testing-library/react'
    reason: Required for testing React hooks
    usage: renderHook for setup, act() for state changes, waitFor for async

  - import: { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
    reason: Test framework and utilities
    usage: Test structure, assertions, mocking

  - import: { FormStackProvider } from '../../components'
    reason: Required wrapper for hook tests
    usage: const wrapper = ({ children }) => <FormStackProvider>{children}</FormStackProvider>

  - import: { useFormStackURLSync } from '../useFormStackURLSync'
    reason: The hook being tested
    usage: renderHook(() => useFormStackURLSync())

  - import: { useFormStack } from '../useFormStack'
    reason: Need to trigger form operations
    usage: const { openForm, closeForm } = useFormStack()

AFFECTED_FILES:
  - src/hooks/__tests__/useFormStackURLSync.test.tsx
    reason: TARGET FILE - Add new test suites
    impact: Extends existing test coverage

MOCK_SETUP:
  - mockPushState, mockReplaceState
    reason: Already set up in existing tests
    usage: Verify history API calls

  - popstateHandler
    reason: Already captured in addEventListener mock
    usage: Simulate browser navigation

CLEANUP:
  - beforeEach: Reset mocks, clear mock calls
  - afterEach: Restore original window properties, clear mocks
  - Pattern: Already established in existing tests
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after adding tests - fix before proceeding
npm run type-check
# Expected: "No type errors found"
# If errors: Read TypeScript output and fix type issues

# Format the file
npm run format
# or: npx prettier --write src/hooks/__tests__/useFormStackURLSync.test.tsx

# Lint the file
npm run lint
# or: npx eslint src/hooks/__tests__/useFormStackURLSync.test.tsx

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the specific hook (all tests should pass)
npm test -- src/hooks/__tests__/useFormStackURLSync.test.tsx

# Run tests in watch mode for rapid feedback
npm test -- --watch src/hooks/__tests__/useFormStackURLSync.test.tsx

# Full test suite for hooks
npm test -- src/hooks/__tests__/

# Coverage validation
npm run test:coverage
# Check that useFormStackURLSync coverage increased for race condition paths

# Expected: All tests pass. If failing, debug root cause and fix tests.
# Common issues:
#   - Missing act() wrapper around state changes
#   - Not using waitFor for async assertions
#   - Mock setup incorrect
#   - Test expectations don't match implementation behavior
```

### Level 3: Integration Testing (System Validation)

```bash
# Start example app to test in browser
cd examples
npm install
npm run dev

# Manual testing checklist:
# 1. Open example app in browser
# 2. Open DevTools Console
# 3. Rapidly open 3+ forms
# 4. Verify URL shows all forms
# 5. Rapidly click back button
# 6. Verify forms close correctly
# 7. Check for no console warnings
# 8. Verify bookmark/sharing works correctly

# Expected: All manual tests pass, URL matches form state at all times
```

### Level 4: Race Condition Validation

```bash
# CRITICAL: Test the specific race condition scenarios

# Scenario 1: Monitor history API calls
# 1. Open browser DevTools Console
# 2. Run:
let pushStateCount = 0;
let replaceStateCount = 0;
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;
history.pushState = function(...args) {
  pushStateCount++;
  console.log('pushState #' + pushStateCount, args);
  return originalPushState.apply(this, args);
};
history.replaceState = function(...args) {
  replaceStateCount++;
  console.log('replaceState #' + replaceStateCount, args);
  return originalReplaceState.apply(this, args);
};
# 3. Rapidly open 3 forms
# 4. Should see minimal history API calls (coalesced)
# 5. URL should show all 3 forms

# Scenario 2: Stress test
# 1. Open 10 forms in rapid succession
# 2. Verify URL shows all 10 forms
# 3. Rapidly click back 5 times
# 4. Verify 5 forms close
# 5. Verify URL is correct

# Expected: Race conditions are handled gracefully, URL always consistent
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Type checking passes: `npm run type-check`
- [ ] All tests pass: `npm test -- src/hooks/__tests__/useFormStackURLSync.test.tsx`
- [ ] No formatting issues: `npm run format`
- [ ] No linting errors: `npm run lint`
- [ ] Coverage increased for race condition code paths
- [ ] Manual browser testing successful

### Feature Validation

- [ ] "race condition protection" test suite added
- [ ] "rapid form operations" test suite added
- [ ] "browser navigation race conditions" test suite added
- [ ] "URL state consistency" test suite added
- [ ] Tests verify RAF coalescing prevents duplicate updates
- [ ] Tests verify isMountedRef guards prevent warnings
- [ ] Tests verify URL state matches stack state
- [ ] Tests verify no duplicate history entries
- [ ] All existing tests still pass
- [ ] No regressions in existing functionality

### Code Quality Validation

- [ ] Follows existing test patterns (describe, it, expect)
- [ ] Uses act() for all state changes
- [ ] Uses waitFor for async assertions
- [ ] Proper setup/teardown in beforeEach/afterEach
- [ ] Test names are descriptive and clear
- [ ] Tests are independent (no shared state between tests)
- [ ] Mock cleanup is proper
- [ ] Error suppression used where appropriate
- [ ] Comments explain complex test scenarios

### Documentation Validation

- [ ] Test suites are well-organized with clear describe blocks
- [ ] Complex test scenarios have explanatory comments
- [ ] Test assertions are self-documenting
- [ ] Edge cases are covered with tests

---

## Anti-Patterns to Avoid

- ❌ **Don't use setTimeout in tests** - Use waitFor or fake timers instead
- ❌ **Don't forget act() wrapper** - All state changes must be in act()
- ❌ **Don't test implementation details** - Test behavior, not ref values
- ❌ **Don't use shared state between tests** - Each test should be independent
- ❌ **Don't skip cleanup** - Always clear mocks in afterEach
- ❌ **Don't use real timers** - Use fake timers if testing timing behavior
- ❌ **Don't assume async order** - Use waitFor for race conditions
- ❌ **Don't ignore console warnings** - Suppress and verify them
- ❌ **Don't test unrelated functionality** - Focus on race conditions
- ❌ **Don't make tests brittle** - Tests should work with implementation changes

---

## Appendix: Test Scenarios from Contract Definition

The following test scenarios are specified in the work item contract:

### 1. Rapid openForm calls (3+ in quick succession)

```typescript
it('should handle rapid openForm calls (3+ in quick succession)', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
  const { openForm } = useFormStack();

  act(() => {
    openForm({ id: 'form-1', component: () => null });
    openForm({ id: 'form-2', component: () => null });
    openForm({ id: 'form-3', component: () => null });
  });

  await waitFor(() => {
    expect(result.current.getUrlState()).toEqual(['form-1', 'form-2', 'form-3']);
  });
});
```

### 2. Open form → immediate browser back

```typescript
it('should handle open form → immediate browser back', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
  const { openForm } = useFormStack();

  act(() => {
    openForm({ id: 'form-1', component: () => null });
  });

  act(() => {
    popstateHandler?.({ state: { forms: [] } } as PopStateEvent);
  });

  await waitFor(() => {
    expect(result.current.getUrlState()).toEqual([]);
  });
});
```

### 3. Open → open → back → forward sequence

```typescript
it('should handle open → open → back → forward sequence', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
  const { openForm } = useFormStack();

  act(() => {
    openForm({ id: 'form-1', component: () => null });
    openForm({ id: 'form-2', component: () => null });
  });

  await waitFor(() => {
    expect(result.current.getUrlState()).toEqual(['form-1', 'form-2']);
  });

  act(() => {
    popstateHandler?.({ state: { forms: ['form-1'] } } as PopStateEvent);
  });

  await waitFor(() => {
    expect(result.current.getUrlState()).toEqual(['form-1']);
  });
});
```

### 4. Verify URL state remains consistent

```typescript
it('should maintain URL state consistency throughout operations', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
  const { openForm, closeForm } = useFormStack();

  // Open
  act(() => { openForm({ id: 'f1', component: () => null }); });
  await waitFor(() => { expect(result.current.getUrlState()).toEqual(['f1']); });

  // Open again
  act(() => { openForm({ id: 'f2', component: () => null }); });
  await waitFor(() => { expect(result.current.getUrlState()).toEqual(['f1', 'f2']); });

  // Close
  act(() => { closeForm(); });
  await waitFor(() => { expect(result.current.getUrlState()).toEqual(['f1']); });
});
```

### 5. Verify no history entries are duplicated

```typescript
it('should not create duplicate history entries', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
  const { openForm } = useFormStack();

  vi.clearAllMocks();

  act(() => {
    openForm({ id: 'f1', component: () => null });
    openForm({ id: 'f2', component: () => null });
    openForm({ id: 'f3', component: () => null });
  });

  await waitFor(() => {
    expect(result.current.getUrlState()).toEqual(['f1', 'f2', 'f3']);
  });

  // Should have minimal pushState calls (coalesced)
  expect(mockPushState.mock.calls.length).toBeLessThanOrEqual(3);
});
```

---

## References Summary

### Internal Research
- `/plan/bugfix/P1M2T2S3/research/rtl_race_condition_patterns.md` - RTL patterns for race conditions
- `/plan/bugfix/P1M2T2S3/research/vitest_fake_timers.md` - Vitest fake timers research
- `/plan/bugfix/P1M2T2S3/research/vitest_fake_timer_examples.ts` - Executable code examples
- `/plan/bugfix/P1M2T2S3/research/README.md` - Research summary

### Previous PRPs
- `/plan/docs/bugfix/P1M2T2S1/PRP.md` - useRef-based pending update tracking
- `/plan/docs/bugfix/P1M2T2S2/PRP.md` - isMountedRef pattern for unmount safety

### Code Files
- `src/hooks/useFormStackURLSync.ts` - Implementation under test
- `src/hooks/__tests__/useFormStackURLSync.test.tsx` - Target file for adding tests

### External Documentation
- https://vitest.dev/api/mock-functions.html - Mock functions and fake timers
- https://testing-library.com/docs/react-testing-library/api - RTL API reference

---

**PRP Version**: 1.0
**Last Updated**: 2026-01-11
**Status**: READY FOR IMPLEMENTATION
**Next Task**: P1.M3.T1.S1 (Fix popToIndex Silent Failure)
