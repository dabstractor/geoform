# Test Audit Notes: Error-Throwing Patterns in useFormStack Tests

**Audit Date:** 2025-01-11
**Task:** P1.M1.T1.S1 - Audit Error-Throwing Test Patterns
**Target File:** `src/hooks/__tests__/useFormStack.test.tsx`

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total tests audited** | 8 tests |
| **Tests with error-throwing** | 1 test |
| **Tests needing console.error suppression** | 1 test |
| **Tests already using proper suppression** | 0 tests |

**Key Finding:** The `useFormStack.test.tsx` file contains exactly one error-throwing test that lacks console.error suppression. When this test runs, React automatically logs the expected error to `console.error`, creating noisy test output.

---

## Detailed Findings

### Test 1: "should throw error from useFormStackState"

- **File:** `src/hooks/__tests__/useFormStack.test.tsx`
- **Line Numbers:** 60-68
- **Describe Block:** `when used outside FormStackProvider`

**Current Pattern:**
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

**Issue:**
This test verifies that `useFormStack` throws an error when used outside the `FormStackProvider`. The test correctly uses `expect().toThrow()` to assert the error message, but it lacks `console.error` suppression. When the hook throws the error, React logs it to `console.error` automatically (even though it's caught by the test), creating red error output in test results.

**Why console.error is produced:**
- The `useFormStackState` hook (called internally by `useFormStack`) throws an error when the context is undefined
- React's error boundary system catches this error and logs it to `console.error`
- This happens even though the test successfully catches the error with `expect().toThrow()`

**Recommended Pattern:**

Based on `src/components/__tests__/FormErrorBoundary.test.tsx` (lines 22-31), use a nested `describe` block with `beforeEach`/`afterEach` for console.error suppression:

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

**Alternative Pattern (Better - using vi.spyOn):**

From `plan/bugfix/P1M1T1S1/research/vitest_error_suppression.md`:

```typescript
describe('when used outside FormStackProvider', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should throw error from useFormStackState', () => {
    expect(() => {
      renderHook(() => useFormStack());
    }).toThrow('useFormStackState must be used within a FormStackProvider');
  });
});
```

**Rationale:**
- Reference: [Vitest Mocking Guide](https://vitest.dev/guide/mocking) - "Always remember to clear or restore mocks before or after each test run!"
- Reference: [React Testing Library FAQ](https://testing-library.com/docs/react-testing-library/faq/#how-do-i-test-error-boundaries) - React automatically logs errors to `console.error` even when caught
- The `vi.spyOn()` pattern is preferred because it can be restored with `.mockRestore()`, ensuring proper cleanup
- Using a nested `describe` block ensures console.error is only suppressed for this specific error-throwing test, not for other tests in the file

**Implementation Note:**
Since this file contains other tests that don't throw errors (lines 13-58, 70-104), the console.error suppression should be placed inside the `describe('when used outside FormStackProvider')` block, not at the file level. This prevents suppressing errors that might occur in other tests.

---

## Recommended Implementation Order

For task P1.M1.T1.S2 (implementation task), follow this order:

1. **Add missing imports** (if not already present):
   - Add `vi` to the existing imports from 'vitest'
   - The file currently imports: `describe, it, expect` from 'vitest'
   - Need to add: `vi, beforeEach, afterEach` to the import

2. **Add console.error suppression to the error-throwing describe block**:
   - Add `beforeEach`/`afterEach` hooks inside `describe('when used outside FormStackProvider')`
   - Use either the direct assignment pattern (`console.error = vi.fn()`) or `vi.spyOn()` pattern

3. **Verify the fix**:
   - Run `npm test -- src/hooks/__tests__/useFormStack.test.tsx`
   - Confirm tests pass without console.error noise in output

---

## Comparative Analysis: Other Hook Test Files

### useFormStackState.test.tsx
- **Location:** `src/hooks/__tests__/useFormStackState.test.tsx`
- **Issue:** Similar to useFormStack.test.tsx - has error-throwing tests (lines 41-46, 48-53) WITHOUT console.error suppression
- **Recommendation:** Apply the same fix pattern

### useFormStackURLSync.test.tsx
- **Location:** `src/hooks/__tests__/useFormStackURLSync.test.tsx`
- **Issue:** Has error-throwing test (lines 310-314) WITHOUT console.error suppression
- **Recommendation:** Apply the same fix pattern

---

## References

### Internal Codebase Files
1. **`src/hooks/__tests__/useFormStack.test.tsx`** - TARGET FILE (audit target)
2. **`src/components/__tests__/FormErrorBoundary.test.tsx`** - PATTERN REFERENCE (lines 22-31)
   - Shows the `beforeEach`/`afterEach` pattern with `console.error = vi.fn()`
3. **`src/components/__tests__/FormStackRenderer.test.tsx`** - PATTERN REFERENCE (lines 217-226)
   - Shows nested describe block with console.error suppression

### External Research Files (stored in `plan/bugfix/P1M1T1S1/research/`)
1. **`vitest_error_suppression.md`**
   - Complete Vitest console.error suppression patterns
   - Shows `beforeEach`/`afterEach` pattern with `vi.spyOn()`
   - Critical: Use `vi.spyOn()` not `vi.fn()` for proper restoration
2. **`react_error_testing.md`**
   - React-specific error testing patterns
   - React 18 uses `console.error`, React 19 uses `console.warn`
   - This project uses React 19, but context validation errors still use `console.error`
3. **`toThrow_patterns.md`**
   - Best practices for `expect().toThrow()` with React hooks
   - "Always suppress console.error when testing 'must be used within provider' errors"

### External Documentation URLs
1. **[Vitest Mocking Guide](https://vitest.dev/guide/mocking)**
   - Official Vitest mocking documentation
   - Section: "Always remember to clear or restore mocks before or after each test run!"
2. **[Vitest Vi API Reference](https://vitest.dev/api/vi)**
   - Complete `vi.*` utility API reference
   - Sections on `vi.spyOn()`, `vi.restoreAllMocks()`
3. **[React Testing Library FAQ - Error Boundaries](https://testing-library.com/docs/react-testing-library/faq/#how-do-i-test-error-boundaries)**
   - Official guidance on testing error boundaries
   - Note about React 18 (console.error) vs React 19 (console.warn) behavior
4. **[James Shakespeare: Testing Error Boundaries with RTL](https://jshakespeare.com/react-error-boundary-testing-rtl/)**
   - Practical guide with code examples
   - Shows the `beforeEach`/`afterEach` pattern with console.error replacement
5. **[Kent C. Dodds: Hide console.error Logs](https://www.testingjavascript.com/lessons/react-hide-console-error-logs-when-testing-error-boundaries-with-jest-spyon)**
   - Dedicated lesson on suppressing console output
   - The recommended pattern that works across Jest and Vitest

---

## Anti-Patterns to Avoid

- ❌ Don't use `vi.mock()` for console - it's hoisted and doesn't work for global objects
- ❌ Don't use `vi.clearAllMocks()` - use `vi.restoreAllMocks()` instead
- ❌ Don't place console.error suppression at file level if only one test block throws errors
- ❌ Don't forget to import `vi`, `beforeEach`, and `afterEach` from 'vitest'
- ❌ Don't use `jest.spyOn()` - this codebase uses Vitest, not Jest

---

## Next Steps

This audit report is the input for **Task P1.M1.T1.S2** (implementation task), which will:
1. Apply the recommended console.error suppression pattern to `useFormStack.test.tsx`
2. Verify tests pass without console.error noise
3. Consider applying the same fix to `useFormStackState.test.tsx` and `useFormStackURLSync.test.tsx`

---

**Audit Completed:** 2025-01-11
**Prepared For:** Task P1.M1.T1.S2 - Implement Improved Error Suppression
