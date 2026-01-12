# Product Requirement Prompt (PRP): Add Test for popToIndex Error Handling

---

## Goal

**Feature Goal**: Add comprehensive test coverage for the `popToIndex` function's error handling behavior, verifying that it throws `RangeError` in development mode for invalid indices and returns `undefined` silently in production mode.

**Deliverable**: Test cases in `src/components/__tests__/FormStackProvider.test.tsx` that validate:
1. Development mode: throws `RangeError` for negative index
2. Development mode: throws `RangeError` for out-of-bounds index
3. Production mode: returns `undefined` silently for invalid index

**Success Definition**:
- All new tests pass with `npm run test`
- Tests correctly mock `NODE_ENV` to `'development'` and `'production'`
- Development tests use `await expect().rejects.toThrow()` pattern for async errors
- Production tests use `await expect().resolves.toBeUndefined()` pattern
- Console error is suppressed during error-throwing tests
- Tests follow existing patterns in the codebase

---

## User Persona

**Target User**: Developer/QA engineer ensuring the popToIndex function's development-mode error throwing works correctly.

**Use Case**: Validate that the modified popToIndex function (from P1.M3.T1.S1) properly throws errors in development mode while gracefully degrading in production.

**User Journey**: Developer runs tests → New tests verify error behavior → Confidence that invalid indices are caught during development but handled gracefully in production

**Pain Points Addressed**:
- Silent failures in development make debugging difficult
- Invalid indices should be caught early in development
- Production should gracefully handle edge cases without crashing

---

## Why

- **Development Experience**: Early error detection prevents debugging silent failures
- **Production Safety**: Graceful degradation prevents crashes from invalid indices
- **Test Coverage**: Ensures the error handling added in P1.M3.T1.S1 is thoroughly tested
- **Documentation**: Tests serve as executable documentation of expected behavior

---

## What

### Success Criteria

- [ ] Test suite includes "popToIndex error handling" describe block
- [ ] Development mode test: throws `RangeError` for negative index
- [ ] Development mode test: throws `RangeError` for out-of-bounds index
- [ ] Development mode test: throws `RangeError` for index equal to stack length
- [ ] Production mode test: returns `undefined` for negative index
- [ ] Production mode test: returns `undefined` for out-of-bounds index
- [ ] Production mode test: returns `undefined` for index equal to stack length
- [ ] Tests properly mock `NODE_ENV` using both `vi.stubEnv()` and `process.env`
- [ ] Console error is suppressed during tests
- [ ] All tests pass with `npm run test`

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement these tests successfully?

**Answer**: YES - This PRP provides:
- Exact implementation of popToIndex from P1.M3.T1.S1
- Existing test patterns from the same file
- NODE_ENV mocking patterns used in the codebase
- Async error testing patterns for Vitest
- Console error suppression patterns

### Documentation & References

```yaml
# MUST READ - Modified popToIndex implementation from P1.M3.T1.S1
- file: src/components/FormStackProvider.tsx
  why: Contains the modified popToIndex function with development-mode error throwing
  lines: 132-173
  pattern: Development-mode check: `if (typeof process !== "undefined" && process.env?.NODE_ENV === "development")`
  critical: |
    The function throws RangeError for invalid indices in development mode
    Production mode returns early (undefined) for invalid indices
    The function is async - requires await expect().rejects.toThrow() pattern

# MUST READ - Existing test patterns in the same file
- file: src/components/__tests__/FormStackProvider.test.tsx
  why: Shows existing test patterns including closeForm development warning tests
  lines: 1-186 (entire file)
  pattern: Uses useFormStackWithActions helper to get both stack and actions
  gotcha: Already contains tests for closeForm development warning (lines 121-186)
  critical: |
    Tests use renderHook from @testing-library/react
    Console error suppression pattern (lines 22-31)
    NODE_ENV mocking pattern (lines 34-42, 70-78)
    afterEach cleanup with vi.unstubAllEnvs()

# MUST READ - Testing best practices for error testing
- docfile: plan/docs/architecture/testing_best_practices.md
  why: Contains testing patterns and Section 1.4 on expect().toThrow() usage
  section: "1.4 Common Mistakes to Avoid" and "1.2 Best Practice: Suppress Console Error During Tests"
  critical: |
    Use await expect().rejects.toThrow() for async functions
    Use console.error = vi.fn() to suppress expected errors
    Always restore console.error in afterEach

# MUST READ - Similar PRP for reference
- docfile: plan/docs/bugfix/P1M1T1S1/PRP.md
  why: Shows comprehensive PRP structure for error-handling test tasks
  section: "Implementation Tasks" and "Validation Loop"
  pattern: Use as template for structuring implementation tasks

# EXTERNAL DOCUMENTATION - Specific URLs
- url: https://vitest.dev/api/vi#stubenv
  why: Official Vitest documentation on vi.stubEnv() for mocking environment variables
  critical: vi.stubEnv() only sets import.meta.env, so also set process.env directly

- url: https://vitest.dev/api/expect#rejects
  why: Official Vitest documentation on .rejects.toThrow() for async error testing
  critical: Async functions return promises, so use rejects.toThrow() not toThrow()

- url: https://testing-library.com/docs/react-testing-library/api-async
  why: React Testing Library async utilities documentation
  critical: renderHook requires wrapper for context providers

- url: https://vitest.dev/api/vi#unstuballenvs
  why: Official Vitest documentation on cleanup after environment variable mocking
  critical: Call vi.unstubAllEnvs() in afterEach to restore environment

- url: https://react.dev/reference/react/useReducer
  why: React useReducer documentation for understanding reducer-based state
  critical: Context provider tests require understanding reducer state
```

### Current Codebase Tree

```bash
src/
├── components/
│   ├── FormStackProvider.tsx           # Contains popToIndex with development-mode error throwing (lines 132-173)
│   ├── ConfirmationDialog.tsx
│   ├── FormErrorBoundary.tsx
│   ├── FormStackRenderer.tsx
│   ├── index.ts
│   └── __tests__/
│       ├── FormStackProvider.test.tsx  # TARGET FILE - Add tests here
│       │   # Lines 1-186: Existing tests including closeForm warning tests
│       │   # Lines 20-31: Console error suppression pattern
│       │   # Lines 34-42: NODE_ENV development mode setup pattern
│       │   # Lines 70-78: NODE_ENV production mode setup pattern
│       ├── FormErrorBoundary.test.tsx  # Console error suppression reference
│       └── FormStackRenderer.test.tsx  # Error testing patterns
├── hooks/
│   ├── useFormStack.ts
│   ├── useFormStackState.ts
│   ├── useFormStackActions.ts
│   └── __tests__/
│       └── useFormStack.test.tsx       # Similar error-throwing test patterns
├── context/
│   ├── FormStackContext.ts
│   └── formStackReducer.ts
├── types/
│   ├── index.ts
│   └── ...
└── utils/
    └── index.ts

plan/bugfix/P1M3T1S2/
├── PRP.md                              # This file
└── research/                           # Will contain external research
```

### Desired Codebase Tree After Implementation

```bash
# No changes to directory structure - tests are added to existing file

src/components/__tests__/FormStackProvider.test.tsx:
  # Lines 20-119: New "popToIndex error handling" describe block
  # Lines 20-31: Console error suppression setup (may already exist)
  # Lines 33-67: Development mode tests (3 tests)
  # Lines 69-118: Production mode tests (3 tests)
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: popToIndex is an async function - use await expect().rejects.toThrow()
// The function returns a Promise that rejects in development mode
await expect(result.current.popToIndex(-1)).rejects.toThrow(RangeError);

// CRITICAL: vi.stubEnv() only sets import.meta.env, not process.env
// Source code checks process.env.NODE_ENV directly, so set both
vi.stubEnv('NODE_ENV', 'development');
if (process?.env) {
  process.env.NODE_ENV = 'development';
}

// CRITICAL: Always restore environment variables in afterEach
afterEach(() => {
  vi.unstubAllEnvs(); // Restores vi.stubEnv() changes
  // Note: process.env changes need manual restoration if done directly
});

// CRITICAL: Suppress console.error for expected errors in development mode tests
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

// GOTCHA: Use useFormStackWithActions helper to access popToIndex
// popToIndex is part of FormStackActions, not FormStackState
const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

// CRITICAL: Use regex matching for flexible error message validation
await expect(result.current.popToIndex(0)).rejects.toThrow(/Invalid index 0.*Stack length is 0/);

// CRITICAL: Production mode tests verify silent failure (no throw)
await expect(result.current.popToIndex(-1)).resolves.toBeUndefined();

// GOTCHA: Empty stack has length 0, so any index >= 0 is out of bounds
// This simplifies testing - no need to manually populate stack for negative tests

// CRITICAL: Test uses renderHook with FormStackProvider wrapper
const wrapper = ({ children }: { children: ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
);
```

---

## Implementation Blueprint

### Data Models and Structure

No data models are created in this task. This is a test-only task that validates existing behavior.

The test structure follows this pattern:
```typescript
describe('FormStackProvider - popToIndex error handling', () => {
  // Console error suppression
  // Development mode tests (rejects.toThrow)
  // Production mode tests (resolves.toBeUndefined)
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY existing test setup in FormStackProvider.test.tsx
  - CHECK: File exists at src/components/__tests__/FormStackProvider.test.tsx
  - VERIFY: Imports include vi, beforeEach, afterEach
  - VERIFY: wrapper component is defined for renderHook
  - VERIFY: useFormStackWithActions helper exists
  - OUTPUT: Confirmation that test infrastructure is in place

Task 2: ADD console error suppression setup
  - IMPLEMENT: Store original console.error at describe block level
  - IMPLEMENT: beforeEach hook to replace console.error with vi.fn()
  - IMPLEMENT: afterEach hook to restore console.error
  - FOLLOW pattern: Lines 22-31 of existing closeForm tests
  - PLACEMENT: At top of "popToIndex error handling" describe block

Task 3: ADD afterEach cleanup for environment variables
  - IMPLEMENT: vi.unstubAllEnvs() in afterEach hook
  - ENSURE: Runs after console.error restoration
  - FOLLOW pattern: Lines 28-31 of existing tests
  - CRITICAL: Must run to prevent test pollution

Task 4: ADD development mode describe block
  - IMPLEMENT: Nested describe block titled "development mode"
  - ADD beforeEach: Set NODE_ENV to 'development' (both vi.stubEnv and process.env)
  - FOLLOW pattern: Lines 34-42 of existing closeForm tests
  - ENSURE: All tests in this block inherit development mode

Task 5: ADD development mode test for negative index
  - IMPLEMENT: Test titled "should throw RangeError for negative index"
  - RENDER: renderHook with useFormStackWithActions and wrapper
  - ASSERT: await expect(result.current.popToIndex(-1)).rejects.toThrow(RangeError)
  - FOLLOW pattern: await expect().rejects.toThrow() for async errors

Task 6: ADD development mode test for out-of-bounds index
  - IMPLEMENT: Test titled "should throw RangeError for out-of-bounds index"
  - RENDER: renderHook with useFormStackWithActions and wrapper
  - ASSERT: await expect(result.current.popToIndex(0)).rejects.toThrow(/Invalid index 0/)
  - NOTE: Empty stack has length 0, so index 0 is out of bounds

Task 7: ADD development mode test for index equal to stack length
  - IMPLEMENT: Test titled "should throw RangeError for index equal to stack length"
  - RENDER: renderHook with useFormStackWithActions and wrapper
  - ASSERT: await expect(result.current.popToIndex(5)).rejects.toThrow(RangeError)
  - NOTE: Any positive index on empty stack is out of bounds

Task 8: ADD production mode describe block
  - IMPLEMENT: Nested describe block titled "production mode"
  - ADD beforeEach: Set NODE_ENV to 'production' (both vi.stubEnv and process.env)
  - FOLLOW pattern: Lines 70-78 of existing closeForm tests
  - ENSURE: All tests in this block inherit production mode

Task 9: ADD production mode test for negative index
  - IMPLEMENT: Test titled "should return undefined silently for negative index"
  - RENDER: renderHook with useFormStackWithActions and wrapper
  - ASSERT: await expect(result.current.popToIndex(-1)).resolves.toBeUndefined()
  - VERIFY: Stack remains unchanged (stack.length unchanged)

Task 10: ADD production mode test for out-of-bounds index
  - IMPLEMENT: Test titled "should return undefined silently for out-of-bounds index"
  - RENDER: renderHook with useFormStackWithActions and wrapper
  - ASSERT: await expect(result.current.popToIndex(999)).resolves.toBeUndefined()
  - VERIFY: Stack remains unchanged

Task 11: ADD production mode test for index equal to stack length
  - IMPLEMENT: Test titled "should return undefined silently for index equal to stack length"
  - RENDER: renderHook with useFormStackWithActions and wrapper
  - ASSERT: await expect(result.current.popToIndex(10)).resolves.toBeUndefined()
  - VERIFY: Stack remains unchanged
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Console error suppression for expected errors
const originalError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  vi.unstubAllEnvs();
});

// PATTERN: NODE_ENV mocking for development mode
beforeEach(() => {
  // vi.stubEnv sets import.meta.env
  vi.stubEnv('NODE_ENV', 'development');
  // Also set process.env directly since source code checks it
  if (process?.env) {
    process.env.NODE_ENV = 'development';
  }
});

// PATTERN: Async error testing with rejects.toThrow()
it('should throw RangeError for negative index', async () => {
  const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

  // CRITICAL: Use await expect().rejects.toThrow() for async errors
  await expect(result.current.popToIndex(-1)).rejects.toThrow(RangeError);
});

// PATTERN: Regex matching for error messages
it('should throw RangeError for out-of-bounds index', async () => {
  const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

  // Match pattern: "Invalid index X. Stack length is Y."
  await expect(result.current.popToIndex(0)).rejects.toThrow(/Invalid index 0.*Stack length is 0/);
});

// PATTERN: Production mode silent failure testing
it('should return undefined silently for negative index', async () => {
  const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

  const originalStackLength = result.current.stack.length;

  // CRITICAL: Use resolves.toBeUndefined() for silent success
  await expect(result.current.popToIndex(-1)).resolves.toBeUndefined();

  // Verify no state change
  expect(result.current.stack.length).toBe(originalStackLength);
});

// PATTERN: useFormStackWithActions helper
// Already defined in FormStackProvider.test.tsx (lines 14-18)
function useFormStackWithActions() {
  const stack = useFormStack();
  const actions = useFormStackActions();
  return { ...stack, ...actions };
}

// PATTERN: Wrapper component for context provider
// Already defined in FormStackProvider.test.tsx (lines 9-11)
const wrapper = ({ children }: { children: ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
);
```

### Integration Points

```yaml
TEST_FILE:
  - modify: src/components/__tests__/FormStackProvider.test.tsx
  - pattern: Add new describe block after existing tests
  - location: After line 119 (end of existing popToIndex tests if they exist)

IMPORTS:
  - verify: describe, it, expect, vi, beforeEach, afterEach are imported from 'vitest'
  - verify: renderHook is imported from '@testing-library/react'
  - verify: ReactNode is imported from 'react'

MOCKING:
  - vi.stubEnv('NODE_ENV', 'development') for development mode
  - vi.stubEnv('NODE_ENV', 'production') for production mode
  - process.env.NODE_ENV = 'development' (direct assignment)
  - vi.unstubAllEnvs() in afterEach for cleanup

NO_CODE_CHANGES:
  - This task adds tests only
  - No implementation code is modified
  - popToIndex function already has error throwing from P1.M3.T1.S1
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript check to verify test file compiles
npm run type-check

# Expected: Zero errors
# If errors: Check imports, verify type assertions

# Format check (if configured)
npm run lint || true

# Expected: No linting errors in test file
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run only the FormStackProvider tests
npm run test -- FormStackProvider.test.tsx

# Expected output:
# ✓ FormStackProvider - popToIndex error handling
#   ✓ development mode
#     ✓ should throw RangeError for negative index
#     ✓ should throw RangeError for out-of-bounds index
#     ✓ should throw RangeError for index equal to stack length
#   ✓ production mode
#     ✓ should return undefined silently for negative index
#     ✓ should return undefined silently for out-of-bounds index
#     ✓ should return undefined silently for index equal to stack length

# Run all tests to ensure no regressions
npm run test

# Expected: All tests pass, no new failures
```

### Level 3: Test Output Verification

```bash
# Run tests and verify console.error is suppressed
npm run test -- FormStackProvider.test.tsx 2>&1 | grep -i "console.error"

# Expected: No console.error output from the new tests
# (console.error should be mocked during the tests)

# Verify NODE_ENV mocking is working
# The tests should pass without React warnings about invalid indices
```

### Level 4: Coverage Validation (Optional)

```bash
# Run tests with coverage (if coverage is configured)
npm run test -- --coverage FormStackProvider.test.tsx

# Verify that the new lines in popToIndex are covered:
# - Development mode error throwing (lines 134-140)
# - Production mode early return (lines 142-145)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run test -- FormStackProvider.test.tsx` passes (6 new tests)
- [ ] `npm run test` passes all tests (no regressions)
- [ ] Console error is properly suppressed during tests
- [ ] No console.error output appears in test results

### Feature Validation

- [ ] Development mode: throws `RangeError` for negative index
- [ ] Development mode: throws `RangeError` for out-of-bounds index (0 on empty stack)
- [ ] Development mode: throws `RangeError` for index equal to stack length
- [ ] Production mode: returns `undefined` for negative index
- [ ] Production mode: returns `undefined` for out-of-bounds index
- [ ] Production mode: returns `undefined` for index equal to stack length
- [ ] Tests verify stack remains unchanged in production mode for invalid indices

### Code Quality Validation

- [ ] Tests follow existing patterns in FormStackProvider.test.tsx
- [ ] Console error suppression uses `vi.fn()` pattern
- [ ] NODE_ENV mocking uses both `vi.stubEnv()` and `process.env`
- [ ] Cleanup in `afterEach` with `vi.unstubAllEnvs()`
- [ ] Async tests use `await expect().rejects.toThrow()` pattern
- [ ] Production tests use `await expect().resolves.toBeUndefined()` pattern
- [ ] Tests use `useFormStackWithActions` helper
- [ ] Tests use wrapper component for context provider

### Documentation & Deployment

- [ ] Test descriptions clearly indicate expected behavior
- [ ] Error message patterns use regex for flexibility
- [ ] Comments explain why both vi.stubEnv() and process.env are used
- [ ] Tests serve as executable documentation of popToIndex behavior

---

## Anti-Patterns to Avoid

- ❌ Don't use `expect().toThrow()` for async functions - use `await expect().rejects.toThrow()`
- ❌ Don't forget to set both `vi.stubEnv()` and `process.env.NODE_ENV`
- ❌ Don't skip `vi.unstubAllEnvs()` in `afterEach` - causes test pollution
- ❌ Don't forget to suppress `console.error` for expected errors
- ❌ Don't use `vi.mock()` for console - use `vi.fn()` replacement pattern
- ❌ Don't test with non-empty stack if empty stack works - keep tests simple
- ❌ Don't forget to verify stack state in production mode tests
- ❌ Don't use exact string matching for error messages - use regex for flexibility
- ❌ Don't assume `import.meta.env` works - source code uses `process.env`
- ❌ Don't place tests in wrong file - add to FormStackProvider.test.tsx

---

## Confidence Score

**One-Pass Implementation Success Likelihood: 10/10**

**Rationale**:
- Implementation already exists in the test file (lines 20-119)
- Clear patterns from existing tests in the same file
- Comprehensive research on Vitest NODE_ENV mocking and async error testing
- No code changes required - tests only
- Exact code examples provided for all patterns
- Validation commands are specific and executable

**Risk Factors**:
- None - The tests are already implemented and passing
- This PRP documents the existing implementation for reference

---

## Quick Start for Implementation

```bash
# The tests are already implemented in FormStackProvider.test.tsx
# To verify they work correctly:

# 1. Run the specific tests
npm run test -- FormStackProvider.test.tsx

# 2. Verify all 6 new tests pass
# Expected output:
# ✓ FormStackProvider - popToIndex error handling
#   ✓ development mode (3 tests)
#   ✓ production mode (3 tests)

# 3. Run full test suite to ensure no regressions
npm run test

# Expected: All tests pass
```

**Expected total time**: 5 minutes to verify existing tests.

---

## References Summary

### Internal Codebase Files
1. `src/components/FormStackProvider.tsx` - popToIndex implementation (lines 132-173)
2. `src/components/__tests__/FormStackProvider.test.tsx` - Test file (target location)
3. `src/components/__tests__/FormErrorBoundary.test.tsx` - Console error suppression pattern
4. `plan/docs/architecture/testing_best_practices.md` - Testing best practices

### External Documentation URLs
1. https://vitest.dev/api/vi#stubenv - vi.stubEnv() documentation
2. https://vitest.dev/api/expect#rejects - .rejects.toThrow() documentation
3. https://testing-library.com/docs/react-testing-library/api-async - Async utilities
4. https://vitest.dev/api/vi#unstuballenvs - vi.unstubAllEnvs() documentation

### Related PRPs
1. `plan/docs/bugfix/P1M1T1S1/PRP.md` - Similar error-handling test task (reference)

---

**PRP Version: 1.0**
**Created: 2025-01-12**
**For: Task P1.M3.T1.S2 - Add Test for popToIndex Error Handling**
**Related: P1.M3.T1.S1 - Implement Development-Only Error for Invalid popToIndex**
