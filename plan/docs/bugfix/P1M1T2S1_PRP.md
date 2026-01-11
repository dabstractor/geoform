# PRP: Apply Error Suppression Improvements to useFormStackURLSync Tests

## Goal

**Feature Goal**: Apply console.error suppression pattern from useFormStack.test.tsx to useFormStackURLSync.test.tsx for clean test output

**Deliverable**: Modified `src/hooks/__tests__/useFormStackURLSync.test.tsx` with error suppression applied to tests that trigger expected errors

**Success Definition**: All tests pass with zero uncaught console.error artifacts in test output

## User Persona (if applicable)

**Target User**: Developer running the test suite locally and in CI/CD pipelines

**Use Case**: Running test suite should produce clean output without expected error messages cluttering the logs

**User Journey**: Developer runs `npm test` → Tests execute → Clean output shows only test results, not expected error artifacts

**Pain Points Addressed**: Expected error messages from hook validation tests clutter test output, making it harder to spot real issues

## Why

- **Developer Experience**: Clean test output improves debugging by eliminating noise from expected errors
- **CI/CD Clarity**: Automated test runs produce readable logs for failure triage
- **Consistency**: Matches the pattern already established in P1.M1.T1.S2 (useFormStack.test.tsx)
- **Best Practice**: Following testing strategy principle: "Error boundary tests should verify fallback UI appears, not that errors are thrown"

## What

Apply console.error suppression pattern to tests in `useFormStackURLSync.test.tsx` that intentionally trigger errors. The error handling test at lines 309-315 throws an error when the hook is used outside FormStackProvider.

### Success Criteria

- [ ] `describe('error handling')` block has console.error suppression applied
- [ ] All existing tests pass without modification to test logic
- [ ] Running `npm test` produces zero console.error artifacts from this file
- [ ] Pattern matches the implementation in useFormStack.test.tsx

## All Needed Context

### Context Completeness Check

_Validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**YES** - This PRP includes: exact pattern to copy, file location, specific tests to modify, validation commands, and context about why this pattern exists.

### Documentation & References

```yaml
# MUST READ - Working Pattern to Copy
- file: src/hooks/__tests__/useFormStack.test.tsx
  why: Contains the working error suppression pattern from P1.M1.T1.S2
  pattern: Lines 60-70 - console.error suppression with beforeEach/afterEach
  section: describe('when used outside FormStackProvider') block
  gotcha: The suppression is scoped to the describe block, not globally

# TARGET FILE - File to Modify
- file: src/hooks/__tests__/useFormStackURLSync.test.tsx
  why: Target file that needs error suppression applied
  pattern: Lines 309-315 - error handling test that throws expected error
  gotcha: Only the error handling describe block needs suppression

# SIMILAR PATTERNS - For Reference
- file: src/components/__tests__/FormErrorBoundary.test.tsx
  why: Another example of the same suppression pattern
  pattern: Lines 22-31 - describe block level suppression
  gotcha: Same pattern used across multiple test files

- file: src/components/__tests__/FormStackRenderer.test.tsx
  why: Additional example of suppression in error boundary tests
  pattern: Lines 217-226 - describe block level suppression
  gotcha: Shows pattern applied to integration-style tests

# EXTERNAL RESEARCH - Best Practices
- url: https://vitest.dev/guide/mocking
  why: Official Vitest mocking documentation
  critical: vi.spyOn() vs direct function replacement patterns

- url: https://testing-library.com/docs/react-testing-library/faq/
  why: Testing Library guidance on error boundary testing
  critical: "Suppress console.error for expected errors" is standard practice

- url: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
  why: Best practices for clean test output
  critical: Error suppression should be scoped to specific tests

# TEST CONFIGURATION
- file: vitest.setup.ts
  why: Global test setup file - uses vi.clearAllMocks() not vi.restoreAllMocks()
  gotcha: Setup file clears mocks but doesn't restore implementations

- file: vitest.config.ts
  why: Vitest configuration with restoreMocks not enabled
  gotcha: restoreMocks: false means manual restoration is required
```

### Current Codebase Tree

```bash
geoform/
├── src/
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   ├── useFormStack.test.tsx          # REFERENCE - Has working suppression (P1.M1.T1.S2)
│   │   │   └── useFormStackURLSync.test.tsx   # TARGET - Needs suppression applied
│   │   ├── useFormStack.ts
│   │   └── useFormStackURLSync.ts
│   └── components/
│       └── __tests__/
│           ├── FormErrorBoundary.test.tsx     # REFERENCE - Has suppression
│           └── FormStackRenderer.test.tsx     # REFERENCE - Has suppression
├── vitest.setup.ts                             # Global test setup
├── vitest.config.ts                            # Vitest configuration
└── package.json
```

### Desired Codebase Tree

```bash
# No new files - modification only
# The structure remains the same
# Only src/hooks/__tests__/useFormStackURLSync.test.tsx is modified
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Vitest uses vi.fn() not jest.fn()
// The project uses Vitest, not Jest

// CRITICAL: Global setup uses vi.clearAllMocks() NOT vi.restoreAllMocks()
// File: vitest.setup.ts lines 11-13
// This means mocks are NOT automatically restored between tests
// Manual restoration in afterEach is REQUIRED

// CRITICAL: Error suppression must be scoped to describe block
// Do NOT apply globally at file level - only to tests that trigger errors

// CRITICAL: Only one test in useFormStackURLSync.test.tsx throws an error
// Line 312: expect(() => { renderHook(() => useFormStackURLSync()); }).toThrow(...)
// This is the "error handling" describe block test

// CRITICAL: The pattern uses direct console.error replacement (not vi.spyOn)
// Current working pattern:
//   const originalError = console.error;
//   beforeEach(() => { console.error = vi.fn(); });
//   afterEach(() => { console.error = originalError; });
```

## Implementation Blueprint

### Data Models and Structure

No data models - this is a test-only change.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ANALYZE Current Test File Structure
  - LOCATE: src/hooks/__tests__/useFormStackURLSync.test.tsx
  - IDENTIFY: describe('error handling') block at lines 309-315
  - UNDERSTAND: Test throws 'useFormStackState must be used within a FormStackProvider' error
  - DEPENDENCIES: None

Task 2: EXTRACT Reference Pattern
  - COPY: Pattern from src/hooks/__tests__/useFormStack.test.tsx lines 60-70
  - PATTERN:
    ```typescript
    // Suppress console.error for expected errors in this block
    const originalError = console.error;

    beforeEach(() => {
      console.error = vi.fn();
    });

    afterEach(() => {
      console.error = originalError;
    });
    ```
  - PLACEMENT: Inside describe('error handling') block, before the it() statement
  - DEPENDENCIES: Task 1

Task 3: MODIFY useFormStackURLSync.test.tsx
  - TARGET: src/hooks/__tests__/useFormStackURLSync.test.tsx
  - LOCATION: Line 309, inside describe('error handling') block
  - INSERT: Suppression pattern before line 310 (the it() statement)
  - PRESERVE: Existing test logic - only add suppression, don't change test
  - DEPENDENCIES: Task 2

Task 4: VALIDATE Implementation
  - RUN: npm test -- src/hooks/__tests__/useFormStackURLSync.test.tsx
  - VERIFY: All tests pass
  - CHECK: No console.error artifacts in output
  - DEPENDENCIES: Task 3

Task 5: REGRESSION CHECK
  - RUN: npm test (full suite)
  - VERIFY: No other tests broken by change
  - CHECK: useFormStack.test.tsx still works (no changes to reference pattern)
  - DEPENDENCIES: Task 4
```

### Implementation Patterns & Key Details

```typescript
// EXACT PATTERN TO APPLY (from useFormStack.test.tsx):

// Describe block structure with suppression:
describe('error handling', () => {
  // Add these 6 lines inside the describe block, before the it() statement:
  // Suppress console.error for expected errors in this block
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('should throw error when used outside FormStackProvider', () => {
    expect(() => {
      renderHook(() => useFormStackURLSync());
    }).toThrow('useFormStackState must be used within a FormStackProvider');
  });
});

// IMPORTS - No new imports needed!
// The file already imports: vi, beforeEach, afterEach from 'vitest'
// See line 1: import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

### Integration Points

```yaml
TEST_FILE:
  - modify: src/hooks/__tests__/useFormStackURLSync.test.tsx
  - line: 309 (inside describe('error handling') block)
  - pattern: "Insert suppression before it() statement"

GLOBAL_SETUP:
  - note: vitest.setup.ts uses vi.clearAllMocks() not vi.restoreAllMocks()
  - implication: Manual restoration in afterEach is required (already in pattern)

TEST_RUNNER:
  - command: npm test
  - framework: Vitest with jsdom environment
  - config: vitest.config.ts with globals: true
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
npm run type-check    # TypeScript validation
# Expected: Zero type errors

# Vitest will handle syntax checking during test run
# No separate lint command in package.json
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the specific modified file
npm test -- src/hooks/__tests__/useFormStackURLSync.test.tsx

# Expected output:
# PASS src/hooks/__tests__/useFormStackURLSync.test.tsx
# ✓ should throw error when used outside FormStackProvider
# (all other tests pass)

# Full test suite for hooks
npm test -- src/hooks/__tests__/

# Expected: All hook tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Run full test suite to ensure no regressions
npm test

# Expected:
# Test Files  X passed (X)
# Tests X passed (X)
# No console.error artifacts from useFormStackURLSync tests

# Verify clean output specifically
npm test 2>&1 | grep -i "console.error" | grep -i "useformstackurlsync" || echo "No errors found - SUCCESS"
# Expected: "No errors found - SUCCESS"
```

### Level 4: Manual Verification

```bash
# Run tests with verbose output to see console behavior
npm test -- --reporter=verbose

# Check that:
# 1. Error handling test still throws (test validates expected error)
# 2. console.error is NOT printed to output (suppressed working)
# 3. All other tests in file pass unaffected
```

## Final Validation Checklist

### Technical Validation

- [ ] Modified file has no TypeScript errors: `npm run type-check`
- [ ] All tests in useFormStackURLSync.test.tsx pass
- [ ] Full test suite passes: `npm test`
- [ ] No console.error artifacts from this test file in output
- [ ] Pattern matches useFormStack.test.tsx implementation

### Feature Validation

- [ ] Error handling test still validates error is thrown (test not broken)
- [ ] console.error suppression scoped only to error handling describe block
- [ ] Other describe blocks in file unaffected (no global suppression)
- [ ] beforeEach/afterEach properly restore console.error

### Code Quality Validation

- [ ] Comment added: "Suppress console.error for expected errors in this block"
- [ ] const originalError declared before beforeEach
- [ ] afterEach restores original console.error (not just clearing)
- [ ] No changes to test logic - only added suppression

### Documentation & Deployment

- [ ] No new dependencies added
- [ ] No configuration changes required
- [ ] Change is self-documenting via existing test name
- [ ] Pattern is consistent with other test files in codebase

---

## Anti-Patterns to Avoid

- **Don't apply suppression globally** - Only to error handling describe block
- **Don't use vi.spyOn()** - Project uses direct console replacement pattern
- **Don't skip afterEach restoration** - Manual restoration required (no restoreMocks in config)
- **Don't modify test logic** - Only add suppression, keep test expectations unchanged
- **Don't suppress other tests** - Only the error handling test throws an error
- **Don't add new imports** - Required imports (vi, beforeEach, afterEach) already present

## Appendix: Research Findings

### Research Summary from P1.M1.T1.S2

The working error suppression pattern was successfully implemented in `useFormStack.test.tsx` during P1.M1.T1.S2. The pattern:
- Uses direct console.error replacement with `vi.fn()`
- Scopes suppression to describe block level
- Properly restores original console.error in afterEach
- Includes explanatory comment

### Current State Analysis

**File**: `src/hooks/__tests__/useFormStackURLSync.test.tsx`
- **Total tests**: 15 test cases across 8 describe blocks
- **Tests throwing errors**: 1 test ("should throw error when used outside FormStackProvider")
- **Current error handling**: None - console.error not suppressed
- **Required change**: Add suppression pattern to describe('error handling') block

### External Research Findings

1. **Vitest Best Practice**: Use `vi.spyOn()` for console methods (but our codebase uses direct replacement)
2. **Testing Library Guidance**: "Suppress console.error for expected errors" is standard practice
3. **Key Gotcha**: `vi.clearAllMocks()` ≠ `vi.restoreAllMocks()` - setup file uses clearAllMocks

### Pattern Comparison

| Approach | Our Pattern | Recommended (External) |
|----------|-------------|------------------------|
| Method | Direct replacement | vi.spyOn() |
| Restoration | Manual (const) | .mockRestore() |
| Scope | Describe block | Describe block |
| Comment | Yes | Yes |

Both work; our pattern is established in the codebase and should be maintained for consistency.

---

**Confidence Score**: 10/10

**Rationale**: This is a simple pattern copy task with comprehensive context, exact line numbers, working reference implementation, and clear validation commands. The implementation is a 6-line addition to an existing file with no logic changes required.
