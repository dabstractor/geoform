# Research: Console Error Suppression Patterns for Vitest

## Overview

This document consolidates research findings on console.error/console.warn suppression patterns in Vitest and Jest, conducted to support PRP P1.M1.T2.S1.

## Working Pattern in Geoform Codebase

### Location: `src/hooks/__tests__/useFormStack.test.tsx`

Lines 60-70 contain the working suppression pattern from P1.M1.T1.S2:

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
    expect(() => {
      renderHook(() => useFormStack());
    }).toThrow('useFormStackState must be used within a FormStackProvider');
  });
});
```

### Pattern Characteristics

| Aspect | Value |
|--------|-------|
| Method | Direct function replacement |
| Suppression | `console.error = vi.fn()` |
| Restoration | `console.error = originalError` |
| Scope | Describe block level |
| Cleanup | beforeEach/afterEach hooks |

## Files Using This Pattern

The following test files in the codebase use console.error suppression:

1. **`src/hooks/__tests__/useFormStack.test.tsx`** (lines 60-70)
2. **`src/components/__tests__/FormErrorBoundary.test.tsx`** (lines 22-31)
3. **`src/components/__tests__/FormStackRenderer.test.tsx`** (lines 217-226)
4. **`src/__tests__/integration/ErrorBoundaryIsolation.integration.test.tsx`**

## Target File Analysis

### `src/hooks/__tests__/useFormStackURLSync.test.tsx`

**Status**: Needs error suppression applied

**Test requiring suppression** (lines 309-315):
```typescript
describe('error handling', () => {
  it('should throw error when used outside FormStackProvider', () => {
    expect(() => {
      renderHook(() => useFormStackURLSync());
    }).toThrow('useFormStackState must be used within a FormStackProvider');
  });
});
```

**Required modification**: Insert suppression pattern inside describe block, before the it() statement.

## External Research References

### Official Documentation

| Resource | URL | Key Insight |
|----------|-----|-------------|
| Vitest Mocking Guide | https://vitest.dev/guide/mocking | Official vi.fn() and vi.spyOn() docs |
| Vitest Vi API | https://vitest.dev/api/vi | Complete vi.* utilities reference |
| Testing Library FAQ | https://testing-library.com/docs/react-testing-library/faq/ | Error boundary testing patterns |
| Kent C. Dodds Blog | https://kentcdodds.com/blog/common-mistakes-with-react-testing-library | Best practices for clean test output |

### Community Resources

| Resource | URL | Key Insight |
|----------|-----|-------------|
| Error Boundary Testing RTL | https://jshakespeare.com/react-error-boundary-testing-rtl/ | Comprehensive error boundary guide |
| Hide Console.error Logs | https://www.testingjavascript.com/lessons/react-hide-console-error-logs-when-testing-error-boundaries-with-jest-spyon | Jest-specific patterns |

## Alternative Patterns Found

### Pattern A: vi.spyOn() (Recommended by Vitest docs)

```typescript
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});
```

**Pros**: More semantically correct, better TypeScript support
**Cons**: Not used in this codebase (inconsistent with existing patterns)

### Pattern B: vi.restoreAllMocks() in afterEach

```typescript
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks(); // Restores ALL mocks
});
```

**Pros**: Cleans up all mocks at once
**Cons**: Requires vitest.config.ts to have `restoreMocks: true` (not currently set)

### Pattern C: Config-based Auto-restore

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    restoreMocks: true,
  },
});
```

**Pros**: Automatic restoration, no manual afterEach needed
**Cons**: Not currently enabled in project

## Key Gotchas Discovered

### 1. clearAllMocks() vs restoreAllMocks()

The project's `vitest.setup.ts` uses `vi.clearAllMocks()`:

```typescript
// vitest.setup.ts lines 11-13
afterEach(() => {
  vi.clearAllMocks();
});
```

**Critical difference**:
- `vi.clearAllMocks()`: Clears call history only, implementations remain mocked
- `vi.restoreAllMocks()`: Restores original implementations AND clears history

**Implication**: Manual restoration in test files is REQUIRED (already handled by the pattern)

### 2. React Error Logging Timing

React may log errors asynchronously. For tests verifying errors were logged:

```typescript
// Use waitFor for async error logging
await waitFor(() => {
  expect(spy).toHaveBeenCalled();
});
```

### 3. Spying on Wrong Console Method

Some React warnings go to `console.warn`, not `console.error`. For comprehensive suppression:

```typescript
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
```

### 4. Not Verifying What Was Logged

Blind suppression can hide unexpected errors. Best practice:

```typescript
const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

// ... test code ...

// Verify expected error was logged
expect(spy).toHaveBeenCalledWith(expect.stringContaining('expected message'));
```

## Best Practice Summary

### DO ✅

1. Always restore mocks after tests (manual or automatic)
2. Scope suppression to describe blocks, not globally
3. Add comments explaining why suppression is needed
4. Verify expected errors occur (don't suppress blindly)
5. Use waitFor for async error logging scenarios

### DON'T ❌

1. Don't forget to restore - mocks persist across tests
2. Don't use clearAllMocks() when you mean restoreAllMocks()
3. Don't suppress globally - keep scope minimal
4. Don't use vi.mock() for console - it doesn't work properly
5. Don't mock after imports - set up before component usage

## Implementation Recommendation

**For P1.M1.T2.S1**: Use the established codebase pattern (direct console replacement) for consistency.

**Pattern to apply**:
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

**Rationale**: Pattern is proven in P1.M1.T1.S2, used across 4 test files, and requires no changes to existing infrastructure.

## Validation Commands

```bash
# Run specific test file
npm test -- src/hooks/__tests__/useFormStackURLSync.test.tsx

# Run full test suite
npm test

# Check for console.error artifacts
npm test 2>&1 | grep -i "console.error" | grep -i "useformstackurlsync" || echo "Clean output - SUCCESS"
```

## Expected Outcome

After implementation:
- Error handling test still validates error is thrown
- No console.error artifacts in test output
- Pattern matches other test files in codebase
- All tests pass without modification to test logic
