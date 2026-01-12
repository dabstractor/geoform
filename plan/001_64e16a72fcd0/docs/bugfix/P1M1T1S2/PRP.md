# Product Requirement Prompt (PRP): Implement Improved Error Suppression for useFormStack Tests

---

## Goal

**Feature Goal**: Add console.error suppression to the error-throwing test in `src/hooks/__tests__/useFormStack.test.tsx` to eliminate noisy test output when running the test suite.

**Deliverable**: Modified `src/hooks/__tests__/useFormStack.test.tsx` with proper `beforeEach`/`afterEach` console.error suppression in the `describe('when used outside FormStackProvider')` block.

**Success Definition**: Running `npm test -- src/hooks/__tests__/useFormStack.test.tsx` produces clean output with no unhandled console.error artifacts when the error-throwing test executes.

## User Persona (if applicable)

**Target User**: Developer/QA engineer responsible for maintaining clean test output and ensuring test quality.

**Use Case**: The test suite currently produces noisy console.error output when running tests that intentionally throw errors (e.g., provider validation tests). Adding console.error suppression ensures clean test output that only shows actual test failures.

**User Journey**: Developer runs tests → Sees cluttered console.error output from expected errors → Applies console.error suppression pattern → Tests run with clean output, making real failures more visible

**Pain Points Addressed**:
- Noisy test output obscures actual test failures
- Developers must visually filter through expected error messages
- CI/CD logs become difficult to parse
- Inconsistent patterns across test files (some have suppression, some don't)

## Why

- **Clean test output**: React automatically logs errors to `console.error` even when caught by error boundaries or expected in tests. This creates noisy output that obscures real failures.
- **Consistent patterns**: The `FormErrorBoundary.test.tsx` file already uses proper console.error suppression, but `useFormStack.test.tsx` does not.
- **Best practice compliance**: Following established patterns from React Testing Library, Vitest documentation, and community best practices (as documented in `plan/docs/architecture/testing_best_practices.md` Section 1.2).
- **One-line fix**: The audit in P1.M1.T1.S1 identified exactly one test (lines 60-68) that needs console.error suppression.

## What

This is a **focused implementation task** that modifies exactly one file with a minimal, well-defined change.

### Scope

**IN SCOPE**:
- Modify `src/hooks/__tests__/useFormStack.test.tsx` to add console.error suppression
- Add necessary imports (`vi`, `beforeEach`, `afterEach`) if not already present
- Place suppression hooks inside the `describe('when used outside FormStackProvider')` block
- Verify tests pass without console.error noise

**OUT OF SCOPE**:
- Modifying other test files (handled by subsequent tasks: P1.M1.T2, P1.M1.T2.S1)
- Creating reusable test utilities for error suppression
- Changing test logic or assertions
- Modifying the source code being tested

### Success Criteria

- [ ] Test `npm test -- src/hooks/__tests__/useFormStack.test.tsx` runs without console.error noise
- [ ] All existing tests still pass (8 tests total)
- [ ] Console.error suppression is scoped only to error-throwing describe block
- [ ] Code follows the pattern from `FormErrorBoundary.test.tsx` (lines 22-31)
- [ ] No new test files or utilities are created

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact file to modify with line numbers
- Current code state and exact change needed
- Pattern to follow from within this codebase
- External research with specific URLs
- Validation commands that work in this project

### Documentation & References

```yaml
# MUST READ - Internal Codebase Patterns
- file: src/hooks/__tests__/useFormStack.test.tsx
  why: TARGET FILE TO MODIFY - Contains error-throwing test at lines 60-68
  pattern: Look for describe('when used outside FormStackProvider') block
  gotcha: Only one test needs suppression - the one using expect().toThrow()

- file: src/components/__tests__/FormErrorBoundary.test.tsx
  why: PATTERN TO FOLLOW - Shows proper beforeEach/afterEach console.error suppression (lines 22-31)
  pattern: Uses direct assignment pattern: console.error = vi.fn() and console.error = originalError
  gotcha: This is the established pattern in this codebase

- file: plan/docs/bugfix/P1M1T1S1/research/test_audit_notes.md
  why: AUDIT FINDINGS - Complete analysis of what needs to be fixed
  section: "Detailed Findings" section shows exact test and line numbers
  critical: Confirms only ONE test needs modification (lines 60-68)

- docfile: plan/docs/architecture/testing_best_practices.md
  why: TESTING BEST PRACTICES - Section 1.2 documents the recommended pattern
  section: Section 1.2 "Best Practice: Suppress Console Error During Tests"
  critical: Shows beforeEach/afterEach pattern with vi.fn()

- docfile: plan/bugfix/P1M1T1S2/research/vitest_spyon_patterns.md
  why: VITEST-SPECIFIC RESEARCH - Complete guide on vi.spyOn() vs vi.fn() for console methods
  section: "Current to Recommended Migration" shows both patterns work
  critical: Codebase uses direct assignment (vi.fn()), which is acceptable

# EXTERNAL DOCUMENTATION - Specific URLs with Section Anchors
- url: https://vitest.dev/guide/mocking
  why: Official Vitest mocking documentation - core concepts for console.error suppression
  critical: "Always remember to clear or restore mocks before or after each test run!"

- url: https://vitest.dev/api/vi
  why: Complete vi.* utility API reference - sections on vi.fn(), vi.spyOn()
  critical: Understanding that vi.fn() creates a mock function for assignment

- url: https://testing-library.com/docs/react-testing-library/faq/#how-do-i-test-error-boundaries
  why: React Testing Library official guidance on error testing
  critical: React automatically logs errors to console.error even when caught

- url: https://jshakespeare.com/react-error-boundary-testing-rtl/
  why: Clear, practical guide with code examples for error boundary testing
  critical: Shows the beforeEach/afterEach pattern with console.error replacement

- url: https://www.testingjavascript.com/lessons/react-hide-console-error-logs-when-testing-error-boundaries-with-jest-spyon
  why: Kent C. Dodds' dedicated lesson on suppressing console output (applies to Vitest too)
  critical: The recommended pattern that works across Jest and Vitest
```

### Current Codebase Tree

```bash
src/
├── components/
│   └── __tests__/
│       ├── FormErrorBoundary.test.tsx  # HAS console.error suppression (PATTERN REFERENCE)
│       └── FormStackRenderer.test.tsx  # HAS console.error suppression
├── hooks/
│   └── __tests__/
│       ├── useFormStack.test.tsx       # TARGET FILE - needs suppression at lines 60-68
│       ├── useFormStackState.test.tsx  # Similar issue (NOT IN SCOPE for this task)
│       ├── useFormStackURLSync.test.tsx # Similar issue (NOT IN SCOPE for this task)
│       └── useFormStackActions.test.tsx
```

### Desired Codebase Tree with Changes

```bash
# No structural changes - only content modification to existing file

src/
├── hooks/
│   └── __tests__/
│       └── useFormStack.test.tsx       # MODIFIED: Add console.error suppression

# File modification summary:
# - Line 1: Add vi, beforeEach, afterEach to imports (if not already present)
# - Lines 60-68: Add beforeEach/afterEach hooks inside describe block
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: React 19 is used (check package.json)
// React 19 context validation errors still use console.error

// CRITICAL: This codebase uses Vitest, NOT Jest
// Use vi.fn() not jest.fn()
// Import from 'vitest' module

// GOTCHA: FormErrorBoundary.test.tsx uses direct assignment pattern:
// console.error = vi.fn() and console.error = originalError
// This is the established pattern in this codebase - follow it for consistency

// CRITICAL: The useFormStack.test.tsx file currently imports:
// import { describe, it, expect } from 'vitest';
// Need to ADD: vi, beforeEach, afterEach to the import

// GOTCHA: Only ONE describe block needs suppression:
// describe('when used outside FormStackProvider', () => { ... })
// Other describe blocks should NOT have suppression (they don't throw errors)

// CRITICAL: Don't place suppression at file level - only inside error-throwing describe block
// This prevents suppressing errors that might occur in other tests

// GOTCHA: The file uses renderHook from @testing-library/react
// The test that throws is: expect(() => { renderHook(() => useFormStack()); }).toThrow()
```

---

## Implementation Blueprint

### Data Models and Structure

This is a simple code modification task - no new data models are created.

**Current State (lines 60-68)**:
```typescript
describe('when used outside FormStackProvider', () => {
  it('should throw error from useFormStackState', () => {
    // Arrange & Act & Assert
    // Combined hook uses individual hooks, so error comes from first failing hook
    expect(() => {
      renderHook(() => useFormStack());
    }).toThrow('useFormStackState must be used within a FormStackProvider');
  });
});
```

**Desired State (after modification)**:
```typescript
describe('when used outside FormStackProvider', () => {
  // Suppress console.error for expected errors in this block
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('should throw error from useFormStackState', () => {
    // Arrange & Act & Assert
    // Combined hook uses individual hooks, so error comes from first failing hook
    expect(() => {
      renderHook(() => useFormStack());
    }).toThrow('useFormStackState must be used within a FormStackProvider');
  });
});
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: UPDATE imports in src/hooks/__tests__/useFormStack.test.tsx
  - MODIFY: Line 1 import statement from 'vitest'
  - ADD: vi, beforeEach, afterEach to the import if not already present
  - CURRENT: import { describe, it, expect } from 'vitest';
  - NEW: import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
  - NAMING: Follow existing import style (named imports on single line)

Task 2: ADD console.error suppression to error-throwing describe block
  - LOCATE: describe('when used outside FormStackProvider', () => { ... }) at lines 60-68
  - ADD: const originalError = console.error; declaration inside describe block
  - ADD: beforeEach(() => { console.error = vi.fn(); }); hook
  - ADD: afterEach(() => { console.error = originalError; }); hook
  - PRESERVE: Existing test logic and assertions
  - PLACEMENT: Hooks go BEFORE the it() statement, inside the describe block
  - INDENTATION: Maintain existing 2-space indentation

Task 3: VERIFY the modification
  - RUN: npm test -- src/hooks/__tests__/useFormStack.test.tsx
  - CHECK: All 8 tests pass
  - CHECK: No console.error output appears when test runs
  - VERIFY: Test output shows clean execution
```

### Implementation Patterns & Key Details

```typescript
// PATTERN TO APPLY (from FormErrorBoundary.test.tsx lines 22-31):
describe('when used outside FormStackProvider', () => {
  // Suppress console.error for expected errors in this block
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  // ... existing test code ...
});

// KEY DETAIL: The const declaration goes BEFORE beforeEach
// This captures the original console.error BEFORE any test runs

// KEY DETAIL: beforeEach/afterEach are inside the describe block
// This scopes suppression to only this error-throwing test

// KEY DETAIL: afterEach RESTORES the original implementation
// This prevents suppression from leaking to other tests

// GOTCHA: Don't use vi.spyOn() for this task
// The established pattern in this codebase is direct assignment
// Follow existing patterns for consistency

// CRITICAL: Only modify the "when used outside FormStackProvider" describe block
// Other describe blocks don't throw errors and don't need suppression
```

### Integration Points

```yaml
FILES_MODIFIED:
  - modify: src/hooks/__tests__/useFormStack.test.tsx
    changes: Add imports (vi, beforeEach, afterEach), add suppression hooks to describe block
    lines: Line 1 (imports), Lines 61-66 (insert hooks before existing test)

NO OTHER CHANGES:
  - No source code modifications
  - No new test files
  - No new utilities
  - No configuration changes

DEPENDENCIES:
  - None (standalone test file modification)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after making changes - fix before proceeding
npm run type-check
# Expected: Zero TypeScript errors

# Run the specific test file
npm test -- src/hooks/__tests__/useFormStack.test.tsx
# Expected: All 8 tests pass, no console.error noise

# Run full test suite to ensure no regressions
npm test
# Expected: All tests pass across the entire project
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the modified file specifically
npm test -- src/hooks/__tests__/useFormStack.test.tsx --reporter=verbose

# Expected output:
# ✓ useFormStack (8 tests)
#   ✓ when used within FormStackProvider (4 tests)
#   ✓ when used outside FormStackProvider (1 test) ← This one should now be clean
#   ✓ return type structure (1 test)
#   ✓ reference stability (1 test)
#   ✓ should have openForm that returns a Promise (1 test)

# Check that tests pass
npm test -- src/hooks/__tests__/useFormStack.test.tsx --run
# Expected: Exit code 0, all tests pass

# Verify no console.error output appears
# Run test and capture output - should not see red error messages
npm test -- src/hooks/__tests__/useFormStack.test.tsx 2>&1 | grep -i "error.*useFormStackState" | wc -l
# Expected: 0 (no console.error output containing the error message)
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify other hook test files still work (no cross-file interference)
npm test -- src/hooks/__tests__/

# Verify component tests still work
npm test -- src/components/__tests__/

# Verify all tests pass
npm test

# Expected: All tests pass, no regression in other test files
```

### Level 4: Manual Verification

```bash
# Run tests with verbose output to visually confirm clean output
npm test -- src/hooks/__tests__/useFormStack.test.tsx --reporter=verbose

# Visually inspect output for:
# - No red error messages from React
# - No "console.error" output lines
# - Clean test pass/fail indicators only

# If using VS Code or similar:
# - Open src/hooks/__tests__/useFormStack.test.tsx
# - Run test using the Vitest extension
# - Verify no errors appear in the test output panel
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 8 tests in useFormStack.test.tsx pass
- [ ] No console.error output when test runs
- [ ] TypeScript type checking passes (`npm run type-check`)
- [ ] No ESLint or formatting errors
- [ ] Test execution time is reasonable (no significant slowdown)

### Feature Validation

- [ ] Success criterion met: Clean test output with no console.error noise
- [ ] Error-throwing test still correctly validates the error message
- [ ] Console.error is only suppressed for the error-throwing describe block
- [ ] Other tests in the file are unaffected
- [ ] Pattern matches FormErrorBoundary.test.tsx implementation

### Code Quality Validation

- [ ] Follows existing codebase patterns (direct assignment: console.error = vi.fn())
- [ ] File modification is minimal (only necessary changes made)
- [ ] No new test files or utilities created
- [ ] Indentation and formatting match existing file style
- [ ] Imports are properly ordered and formatted

### Documentation & Deployment

- [ ] Change is minimal and focused (single file, single describe block)
- [ ] No environment variables or configuration changes needed
- [ ] No deployment impact (test-only change)
- [ ] Ready for handoff to next task (P1.M1.T2)

---

## Anti-Patterns to Avoid

- ❌ Don't use vi.spyOn() - codebase uses direct assignment pattern
- ❌ Don't place console.error suppression at file level - scope to describe block only
- ❌ Don't modify the test assertions or logic
- ❌ Don't add new tests or test utilities
- ❌ Don't modify other test files (useFormStackState, useFormStackURLSync)
- ❌ Don't forget to import vi, beforeEach, afterEach from 'vitest'
- ❌ Don't use jest.spyOn() or jest.fn() - this is Vitest, not Jest
- ❌ Don't use vi.mock() for console - doesn't work properly for global objects
- ❌ Don't use vi.clearAllMocks() - use console.error = originalError for restoration
- ❌ Don't suppress console.error in non-error-throwing describe blocks
- ❌ Don't change the error message assertion in the toThrow() call

---

## Confidence Score

**One-Pass Implementation Success Likelihood: 10/10**

**Rationale**:
- Extremely focused scope: one file, one describe block, ~6 lines of code
- Excellent pattern reference within the codebase (FormErrorBoundary.test.tsx)
- Comprehensive research documentation with specific examples
- Audit from P1.M1.T1.S1 identified exact line numbers and required change
- Validation commands are project-specific and verified working
- No dependencies on other changes or files

**Risk Factors**:
- None identified - this is a straightforward, well-documented change

---

## References Summary

### Internal Codebase Files
1. `src/hooks/__tests__/useFormStack.test.tsx` - TARGET FILE (lines 60-68)
2. `src/components/__tests__/FormErrorBoundary.test.tsx` - PATTERN REFERENCE (lines 22-31)
3. `plan/docs/bugfix/P1M1T1S1/research/test_audit_notes.md` - AUDIT FINDINGS
4. `plan/docs/architecture/testing_best_practices.md` - BEST PRACTICES (Section 1.2)

### External Research Files (stored in `plan/bugfix/P1M1T1S2/research/`)
1. `vitest_spyon_patterns.md` - Vitest console.error suppression patterns
2. `codebase_tree.txt` - Complete codebase structure
3. `react_error_testing_2025.md` - React error testing patterns

### External Documentation URLs
1. https://vitest.dev/guide/mocking - Vitest mocking guide
2. https://vitest.dev/api/vi - vi.* API reference
3. https://testing-library.com/docs/react-testing-library/faq/ - RTL FAQ
4. https://jshakespeare.com/react-error-boundary-testing-rtl/ - Error boundary testing guide
5. https://www.testingjavascript.com/lessons/react-hide-console-error-logs-when-testing-error-boundaries-with-jest-spyon - Kent C. Dodds on console suppression

---

**PRP Version: 1.0**
**Created: 2025-01-11**
**For: Task P1.M1.T1.S2 - Implement Improved Error Suppression for useFormStack Tests**
**Previous Task: P1.M1.T1.S1 - Audit Error-Throwing Test Patterns (Complete)**
**Next Task: P1.M1.T2.S1 - Apply Error Suppression to useFormStackURLSync Tests**
