# Test Audit Notes: Error-Throwing Patterns in useFormStack Tests

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total tests audited** | 7 tests |
| **Tests with error-throwing** | 1 test |
| **Tests needing console.error suppression** | 1 test |
| **Target file** | `src/hooks/__tests__/useFormStack.test.tsx` |

**Key Finding:** The test file contains exactly one error-throwing test (lines 60-67) that tests the hook throws an error when used outside the provider. This test lacks `console.error` suppression, causing noisy test output.

---

## Detailed Findings

### Test 1: "should throw error from useFormStackState"

- **File**: `src/hooks/__tests__/useFormStack.test.tsx`
- **Line Numbers**: 60-67
- **Describe Block**: `when used outside FormStackProvider`

#### Current Pattern

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

#### Issue

React automatically logs errors to `console.error` when components/hooks throw errors, even when those errors are expected in tests. When this test runs, the following console output appears:

```
console.error
  Error: useFormStackState must be used within a FormStackProvider
      at useFormStackState (/path/to/file)
```

This creates noisy test output that obscures actual test failures and makes CI/CD logs difficult to parse.

#### Recommended Pattern

Since this file contains **other tests that do NOT throw errors** (lines 13-58, 70-103), the console.error suppression should be added **within this specific describe block** only, following the nested describe pattern from `FormStackRenderer.test.tsx`.

**Option 1: Simple Pattern (from FormErrorBoundary.test.tsx)**

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
    expect(() => {
      renderHook(() => useFormStack());
    }).toThrow('useFormStackState must be used within a FormStackProvider');
  });
});
```

**Option 2: vi.spyOn Pattern (from vitest_error_suppression.md - RECOMMENDED)**

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
    // Arrange & Act & Assert
    expect(() => {
      renderHook(() => useFormStack());
    }).toThrow('useFormStackState must be used within a FormStackProvider');
  });
});
```

**Why Option 2 is recommended:**
- `vi.spyOn()` preserves the original implementation and can be restored with `.mockRestore()`
- More explicit and type-safe
- Follows Vitest best practices from [Vitest Mocking Guide](https://vitest.dev/guide/mocking)
- The spy can be inspected to verify console.error was actually called (if needed)

#### Rationale

**From [react_error_testing.md](../P1M1T1S1/research/react_error_testing.md):**
> "React automatically logs all errors to `console.error` (React 18) or `console.warn` (React 19), even when those errors are caught by error boundaries or expected in tests."

**From [tothrow_patterns.md](../P1M1T1S1/research/tothrow_patterns.md):**
> "Always suppress `console.error` when testing 'must be used within provider' errors."

**From [vitest_error_suppression.md](../P1M1T1S1/research/vitest_error_suppression.md):**
> "Use `vi.spyOn(console, 'error').mockImplementation(() => {})` and always restore with `.mockRestore()` or `vi.restoreAllMocks()`."

---

## Pattern Reference from Codebase

### Good Pattern: FormStackRenderer.test.tsx

**Location:** `src/components/__tests__/FormStackRenderer.test.tsx:216-226`

```typescript
describe('error boundary integration', () => {
  // Suppress console.error for expected errors in this block
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  // ... all error-throwing tests are here ...
});
```

**Why this pattern is good:**
- Console.error suppression is scoped to only the tests that need it (nested describe block)
- Other tests in the file are not affected
- Clear comment explaining why console.error is being suppressed

### Alternative Pattern: FormErrorBoundary.test.tsx

**Location:** `src/components/__tests__/FormErrorBoundary.test.tsx:22-31`

```typescript
describe('FormErrorBoundary', () => {
  // Suppress console.error for expected errors
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('when no error occurs', () => {
    // ... tests that don't throw ...
  });

  describe('when error occurs', () => {
    // ... tests that throw ...
  });
});
```

**Note:** This pattern applies suppression at the file level because ALL tests in this file involve error boundaries. For `useFormStack.test.tsx`, the nested pattern (FormStackRenderer) is more appropriate since only one test throws errors.

---

## React Version Considerations

This project uses **React 19.0.0** (per `package.json`).

- **React 18**: Logs errors to `console.error`
- **React 19**: Logs errors to `console.warn` for component errors

**However:** Context validation errors (like "must be used within provider") still use `console.error` in React 19, so suppressing `console.error` is the correct approach.

**From [react_error_testing.md](../P1M1T1S1/research/react_error_testing.md):**
> "Note: `onCaughtError` is not supported in React 18. For React 19, you can disable the additional `console.warn` call by providing a custom `onCaughtError` callback."

Since the error being tested is a **context validation error** (not a component render error), `console.error` suppression is the correct approach.

---

## Known Gotchas for This Codebase

1. **Vitest, not Jest**: Use `vi.spyOn()` not `jest.spyOn()`
2. **Use restoreAllMocks() not clearAllMocks()**: `clearAllMocks()` only clears call history, doesn't restore implementations
3. **Don't use vi.mock() for console**: Doesn't work properly for global objects like console
4. **Nested describe blocks preferred**: Since useFormStack.test.tsx has both error-throwing and non-error-throwing tests, use nested describe for suppression

---

## Recommended Implementation Order

For task **P1.M1.T1.S2** (Implement Improved Error Suppression):

1. Add `beforeEach` and `afterEach` to the `when used outside FormStackProvider` describe block
2. Import `vi` and `beforeEach`/`afterEach` from vitest (if not already imported)
3. Run tests to verify console.error is suppressed
4. Verify no other tests are affected

---

## Comparative Analysis: Other Hook Test Files

### useFormStackState.test.tsx

**Location:** `src/hooks/__tests__/useFormStackState.test.tsx:41-46, 48-53`

This file has similar error-throwing tests WITHOUT console.error suppression. It will need the same fix as useFormStack.test.tsx.

### useFormStackURLSync.test.tsx

**Location:** `src/hooks/__tests__/useFormStackURLSync.test.tsx:310-314`

This file also has an error-throwing test that tests "should throw error when used outside FormStackProvider" without console.error suppression.

**Note:** These files are OUT OF SCOPE for this audit (P1.M1.T1.S1) but should be addressed in future tasks.

---

## Implementation Checklist for P1.M1.T1.S2

- [ ] Add `vi` to imports from 'vitest' (if not present)
- [ ] Add `beforeEach` and `afterEach` to imports from 'vitest' (if not present)
- [ ] Add console.error suppression setup/teardown to `when used outside FormStackProvider` describe block
- [ ] Run `npm test` to verify tests pass with cleaner output
- [ ] Verify that non-error-throwing tests still work correctly

---

## References

### Internal Codebase Files
1. `src/hooks/__tests__/useFormStack.test.tsx` - TARGET (audit target)
2. `src/components/__tests__/FormErrorBoundary.test.tsx` - PATTERN REFERENCE
3. `src/components/__tests__/FormStackRenderer.test.tsx` - PATTERN REFERENCE

### External Research Files
1. `plan_bugfix/P1M1T1S1/research/vitest_error_suppression.md` - Vitest console.error suppression patterns
2. `plan_bugfix/P1M1T1S1/research/react_error_testing.md` - React error boundary testing patterns
3. `plan_bugfix/P1M1T1S1/research/tothrow_patterns.md` - expect().toThrow() best practices

### External Documentation URLs
1. https://vitest.dev/guide/mocking - Vitest mocking guide
2. https://vitest.dev/api/vi - vi.* API reference
3. https://testing-library.com/docs/react-testing-library/faq/ - RTL FAQ
4. https://jshakespeare.com/react-error-boundary-testing-rtl/ - Error boundary testing guide
5. https://www.testingjavascript.com/lessons/react-hide-console-error-logs-when-testing-error-boundaries-with-jest-spyon - Kent C. Dodds on console suppression

---

**Audit Completed:** 2025-01-10
**For:** Task P1.M1.T1.S1 - Audit Error-Throwing Test Patterns
**Next Task:** P1.M1.T1.S2 - Implement Improved Error Suppression
