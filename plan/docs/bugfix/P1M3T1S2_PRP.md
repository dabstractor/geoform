name: "P1.M3.T1.S2: Add test for popToIndex error handling"
description: |

---

## Goal

**Feature Goal**: Add comprehensive test coverage for the popToIndex function's environment-specific error handling behavior.

**Deliverable**: Three new test cases in `src/components/__tests__/FormStackProvider.test.tsx` validating RangeError throwing in development and silent failure in production.

**Success Definition**: All tests pass, verifying that:
- Negative index throws RangeError in development
- Out-of-bounds index throws RangeError in development
- Invalid indices return undefined silently in production

## User Persona (if applicable)

**Target User**: Developer/Tester

**Use Case**: Ensure error handling behavior of popToIndex is properly tested during development and CI/CD

**User Journey**: Tests run automatically via `npm test` or `vitest` to validate popToIndex behavior

**Pain Points Addressed**: Missing test coverage for error handling added in P1.M3.T1.S1

## Why

- **Quality Assurance**: Validates the development-only error throwing behavior added in P1.M3.T1.S1 works correctly
- **Regression Prevention**: Ensures production builds silently handle invalid indices (graceful degradation)
- **Documentation**: Tests serve as executable documentation of expected popToIndex behavior

## What

Add three test cases to verify popToIndex error handling:
1. Negative index throws RangeError in development mode
2. Out-of-bounds index throws RangeError in development mode
3. Invalid indices return undefined silently in production mode

### Success Criteria

- [ ] Test file `src/components/__tests__/FormStackProvider.test.tsx` created with three test cases
- [ ] Development tests use `expect(() => fn()).toThrow()` pattern for synchronous error testing
- [ ] Production tests verify silent return (undefined) behavior
- [ ] NODE_ENV properly mocked using `vi.stubEnv()` with cleanup in `vi.unstubAllEnvs()`
- [ ] All tests pass: `npm test -- FormStackProvider.test.tsx`
- [ ] No console.error artifacts in test output

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

✓ Source function (popToIndex) fully documented
✓ Test patterns from codebase analyzed
✓ NODE_ENV mocking patterns researched
✓ Testing best practices documented
✓ File structure established

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://vitest.dev/api/vi.html#stubenv
  why: vi.stubEnv() API documentation for mocking NODE_ENV
  critical: Always cleanup with vi.unstubAllEnvs() in afterEach

- url: https://vitest.dev/api/expect.html#tothrow
  why: expect().toThrow() API for testing synchronous error throwing
  critical: Must wrap function in arrow function: expect(() => fn()).toThrow()

- file: /home/dustin/projects/geoform/src/components/FormStackProvider.tsx
  why: Source file containing the modified popToIndex function (lines 103-153)
  pattern: Development-mode error throwing with process.env.NODE_ENV check
  gotcha: The function uses typeof process check for SSR compatibility

- file: /home/dustin/projects/geoform/src/components/__tests__/FormStackProvider.integration.test.tsx
  why: Existing integration test file to understand test structure and patterns
  pattern: Uses describe blocks, TestForm/TestConsumer components, fireEvent for interactions
  gotcha: This is integration testing - new file should be unit-focused

- file: /home/dustin/projects/geoform/src/hooks/__tests__/useFormStackActions.test.tsx
  why: Example of expect().toThrow() pattern for error testing in this codebase
  pattern: expect(() => { renderHook(() => useFormStackActions()); }).toThrow('message')
  gotcha: Tests for hook usage outside provider context

- file: /home/dustin/projects/geoform/src/components/__tests__/FormErrorBoundary.test.tsx
  why: Example of console.error suppression pattern for expected errors
  pattern: console.error = vi.fn() in beforeEach, restore in afterEach
  gotcha: Required to prevent test output pollution from expected errors

- docfile: /home/dustin/projects/geoform/plan/bugfix/architecture/testing_best_practices.md
  why: Section 1.4 - Test results, not throws. Use expect().toThrow() for synchronous functions.
  section: 1.4
  pattern: expect(() => functionCall()).toThrow() - wrap function in arrow function
  gotcha: This pattern is for direct function calls, NOT error boundaries (which test results instead)

- file: /home/dustin/projects/geoform/vitest.config.ts
  why: Test configuration to understand environment setup
  pattern: Uses jsdom environment, includes vitest.setup.ts as setupFiles
  gotcha: No NODE_ENV stubbing in global setup - must be done per-test

- file: /home/dustin/projects/geoform/vitest.setup.ts
  why: Global test setup for cleanup and mock reset
  pattern: afterEach cleanup(), vi.clearAllMocks()
  gotcha: vi.unstubAllEnvs() must be called in test file afterEach, not global setup
```

### Current Codebase tree (src/components/__tests__/)

```bash
src/components/__tests__/
├── Breadcrumbs.integration.test.tsx
├── Breadcrumbs.test.tsx
├── ConfirmationDialog.integration.test.tsx
├── ConfirmationDialog.test.tsx
├── FormErrorBoundary.test.tsx
├── FormStackProvider.integration.test.tsx  # Existing integration tests
└── FormStackRenderer.test.tsx
```

### Desired Codebase tree with files to be added

```bash
src/components/__tests__/
├── ...
├── FormStackProvider.test.tsx  # NEW: Unit tests for popToIndex error handling
└── ...
```

**File Responsibility:**
- `FormStackProvider.test.tsx` - Unit tests for popToIndex error handling, separate from integration tests

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Vitest requires wrapping function in arrow function for toThrow()
// CORRECT: expect(() => popToIndex(-1)).toThrow(RangeError)
// WRONG: expect(popToIndex(-1)).toThrow(RangeError) - executes immediately, error won't be caught

// CRITICAL: vi.stubEnv() for NODE_ENV, not direct process.env mutation
// CORRECT: vi.stubEnv('NODE_ENV', 'development')
// WRONG: process.env.NODE_ENV = 'development' - doesn't work with Vitest's environment isolation

// CRITICAL: Always cleanup env stubs to prevent test pollution
// REQUIRED: vi.unstubAllEnvs() in afterEach()

// CRITICAL: popToIndex uses typeof process check for SSR compatibility
// SOURCE CODE: if (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
// This means tests must mock process.env.NODE_ENV, not just import.meta.env.DEV

// GOTCHA: Error messages include both index and stack length
// EXAMPLE: "popToIndex: Invalid index -1. Stack length is 3."
// Tests should match partial message with regex: /Invalid index.*Stack length/

// GOTCHA: Existing codebase uses console.error suppression for expected errors
// PATTERN: console.error = vi.fn() in beforeEach, restore in afterEach
// This prevents console pollution from expected RangeError throws
```

## Implementation Blueprint

### Data models and structure

No new data models needed. Testing existing popToIndex function signature:

```typescript
// From FormStackProvider.tsx lines 103-153
const popToIndex = useCallback(async (index: number) => {
  // Development-mode error throwing
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
    if (index < 0 || index >= state.stack.length) {
      throw new RangeError(
        `popToIndex: Invalid index ${index}. Stack length is ${state.stack.length}.`
      );
    }
  }
  // Production: silent return for invalid indices
  if (index < 0 || index >= state.stack.length) {
    return;
  }
  // ... rest of implementation
}, [state.stack, requestConfirmation]);
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/components/__tests__/FormStackProvider.test.tsx
  - IMPLEMENT: Test file with three test cases for popToIndex error handling
  - FOLLOW pattern: src/hooks/__tests__/useFormStackActions.test.tsx (expect().toThrow() usage)
  - FOLLOW pattern: src/components/__tests__/FormErrorBoundary.test.tsx (console.error suppression)
  - IMPORTS: describe, it, expect, vi, beforeEach, afterEach from 'vitest'
  - IMPORTS: render, renderHook from '@testing-library/react'
  - IMPORTS: FormStackProvider from '../FormStackProvider'
  - IMPORTS: useFormStack from '../../hooks/useFormStack'
  - PLACEMENT: src/components/__tests__/FormStackProvider.test.tsx (NEW FILE)

Task 2: IMPLEMENT test setup and console.error suppression
  - ADD: describe block 'popToIndex error handling'
  - ADD: consoleErrorSpy variable for console.error suppression
  - IMPLEMENT: beforeEach to spy on console.error with vi.fn()
  - IMPLEMENT: afterEach to restore console.error and call vi.unstubAllEnvs()
  - FOLLOW pattern: FormErrorBoundary.test.tsx lines 12-20

Task 3: IMPLEMENT test 'should throw error in development for negative index'
  - ADD: beforeEach with vi.stubEnv('NODE_ENV', 'development')
  - IMPLEMENT: renderHook with useFormStack, wrapped in FormStackProvider
  - IMPLEMENT: expect(() => result.current.popToIndex(-1)).toThrow(RangeError)
  - IMPLEMENT: expect(() => result.current.popToIndex(-1)).toThrow(/Invalid index -1/)
  - VERIFY: Error message contains both index and stack length context

Task 4: IMPLEMENT test 'should throw error in development for out-of-bounds index'
  - ADD: beforeEach with vi.stubEnv('NODE_ENV', 'development')
  - IMPLEMENT: Setup with 2-3 forms in stack using openForm
  - IMPLEMENT: expect(() => result.current.popToIndex(999)).toThrow(RangeError)
  - IMPLEMENT: expect(() => result.current.popToIndex(999)).toThrow(/Invalid index 999/)
  - VERIFY: Stack length is included in error message

Task 5: IMPLEMENT test 'should return undefined silently in production for invalid index'
  - ADD: beforeEach with vi.stubEnv('NODE_ENV', 'production')
  - IMPLEMENT: Setup with 2-3 forms in stack using openForm
  - IMPLEMENT: expect(() => result.current.popToIndex(-1)).not.toThrow()
  - IMPLEMENT: Verify popToIndex returns undefined (no throw, no stack change)
  - VERIFY: Stack remains unchanged after invalid popToIndex call

Task 6: RUN tests and verify
  - EXECUTE: npm test -- FormStackProvider.test.tsx
  - VERIFY: All three tests pass
  - VERIFY: No console.error artifacts in output
  - VERIFY: Total tests in FormStackProvider suite increases by 3
```

### Implementation Patterns & Key Details

```typescript
// CRITICAL: Test wrapper pattern for useFormStack hook
import { renderHook } from '@testing-library/react';
import { FormStackProvider } from '../FormStackProvider';
import { useFormStack } from '../../hooks/useFormStack';

const wrapper = ({ children }) => (
  <FormStackProvider>{children}</FormStackProvider>
);

const { result } = renderHook(() => useFormStack(), { wrapper });

// CRITICAL: Environment stubbing pattern
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
});

afterEach(() => {
  vi.unstubAllEnvs(); // REQUIRED: Cleanup to prevent test pollution
});

// CRITICAL: Error testing pattern - MUST wrap in arrow function
// This is a synchronous function call, not an error boundary
expect(() => result.current.popToIndex(-1)).toThrow(RangeError);

// GOTCHA: Use regex for partial message matching (more flexible)
expect(() => result.current.popToIndex(-1)).toThrow(/Invalid index -1/);

// PATTERN: Console error suppression to prevent test output pollution
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

// PATTERN: Setting up forms in stack for out-of-bounds testing
await act(async () => {
  await result.current.openForm(() => <TestForm id="form1" />);
  await result.current.openForm(() => <TestForm id="form2" />);
});
// Stack length is now 2, so index 2 or higher is out of bounds
```

### Integration Points

```yaml
TEST_FRAMEWORK:
  - runner: vitest
  - config: vitest.config.ts (jsdom environment, setupFiles: vitest.setup.ts)
  - command: npm test -- FormStackProvider.test.tsx

HOOKS_TESTED:
  - useFormStack: Provides popToIndex via result.current.popToIndex
  - Pattern from: src/hooks/__tests__/useFormStack.test.tsx

COMPONENTS_TESTED:
  - FormStackProvider: Wrapper for renderHook
  - Pattern from: src/hooks/__tests__/useFormStackActions.test.tsx
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file creation - fix before proceeding
npx tsc --noEmit src/components/__tests__/FormStackProvider.test.tsx
npx eslint src/components/__tests__/FormStackProvider.test.tsx --fix

# Project-wide validation
npm run lint
npm run typecheck

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the new file
npm test -- FormStackProvider.test.tsx

# Test all FormStackProvider tests (integration + new unit tests)
npm test -- FormStackProvider

# Run with coverage
npm run test:coverage

# Expected: All 3 new tests pass. No "Unhandled error" artifacts in output.
# If failing, debug root cause:
# 1. Check if NODE_ENV is properly stubbed (typeof process check)
# 2. Verify function is wrapped in arrow function for toThrow()
# 3. Ensure vi.unstubAllEnvs() is called in afterEach
```

### Level 3: Integration Testing (System Validation)

```bash
# Full test suite for components
npm test -- src/components/__tests__/

# Verify no regression in existing tests
npm test -- FormStackProvider.integration.test.tsx

# Verify total test count increased
npm test -- --reporter=verbose | grep -A 5 "FormStackProvider.test.tsx"

# Expected: All tests pass. Existing tests unaffected by new file.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Verify development vs production behavior
npm test -- -t "should throw error in development"
npm test -- -t "should return undefined silently in production"

# Test file runs in isolation
npm test -- --run FormStackProvider.test.tsx

# Verify console.error is being suppressed (no console artifacts)
npm test -- FormStackProvider.test.tsx 2>&1 | grep -i "console.error" || echo "No console errors - Good!"

# Expected: Clean test output with no error artifacts.
```

## Final Validation Checklist

### Technical Validation

- [ ] File created at `src/components/__tests__/FormStackProvider.test.tsx`
- [ ] All 3 test cases pass: `npm test -- FormStackProvider.test.tsx`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] NODE_ENV properly mocked with `vi.stubEnv()` and `vi.unstubAllEnvs()`
- [ ] Console errors suppressed during expected error tests

### Feature Validation

- [ ] Test 1: Negative index throws RangeError in development
- [ ] Test 2: Out-of-bounds index throws RangeError in development
- [ ] Test 3: Invalid index returns undefined silently in production
- [ ] Error messages include both index and stack length
- [ ] Tests use `expect(() => fn()).toThrow()` pattern (not `expect(fn()).toThrow()`)
- [ ] No console.error artifacts in test output

### Code Quality Validation

- [ ] Follows existing test file structure (describe blocks, naming conventions)
- [ ] Uses same imports as other test files (vitest, @testing-library/react)
- [ ] Implements console.error suppression pattern from FormErrorBoundary.test.tsx
- [ ] Implements wrapper pattern for FormStackProvider
- [ ] Environment cleanup in afterEach with vi.unstubAllEnvs()

### Documentation & Deployment

- [ ] Test names are descriptive and self-documenting
- [ ] Tests serve as executable documentation of popToIndex behavior
- [ ] No code comments needed - test names describe behavior clearly

---

## Anti-Patterns to Avoid

- ❌ Don't use `expect(popToIndex(-1)).toThrow()` - function executes before expect catches it
- ❌ Don't use `process.env.NODE_ENV = 'development'` - use `vi.stubEnv('NODE_ENV', 'development')`
- ❌ Don't forget `vi.unstubAllEnvs()` in afterEach - causes test pollution
- ❌ Don't skip console.error suppression - causes test output artifacts
- ❌ Don't test error boundary behavior - this is direct function call testing
- ❌ Don't add tests to integration test file - create separate unit test file
- ❌ Don't use exact string matching for error messages - use regex for flexibility
- ❌ Don't forget to wrap function in arrow function for toThrow()

---

## Research Notes

### Key Findings from Codebase Analysis

1. **No FormStackProvider.test.tsx exists** - Only `FormStackProvider.integration.test.tsx` exists. New file needed.

2. **expect().toThrow() pattern used in codebase** - Found in `useFormStackActions.test.tsx`:
   ```typescript
   expect(() => {
     renderHook(() => useFormStackActions());
   }).toThrow('useFormStackActions must be used within a FormStackProvider');
   ```

3. **Console error suppression pattern** - Found in `FormErrorBoundary.test.tsx`:
   ```typescript
   let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
   beforeEach(() => {
     consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
   });
   afterEach(() => {
     consoleErrorSpy.mockRestore();
   });
   ```

4. **NODE_ENV check in source** - popToIndex uses:
   ```typescript
   if (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
   ```
   This means tests must mock `process.env.NODE_ENV`, not `import.meta.env.DEV`.

5. **Wrapper pattern for provider testing** - From useFormStack tests:
   ```typescript
   const wrapper = ({ children }) => (
     <FormStackProvider>{children}</FormStackProvider>
   );
   const { result } = renderHook(() => useFormStack(), { wrapper });
   ```

### Testing Best Practices Reference

From `plan/bugfix/architecture/testing_best_practices.md` Section 1.4:
- **Test results, not throws** for error boundaries
- **Use expect().toThrow() for synchronous function calls** (our case - not error boundary)
- Wrap function in arrow function: `expect(() => fn()).toThrow()`

---

## Confidence Score

**Confidence Score**: 9/10 for one-pass implementation success

**Reasoning**:
- ✅ Source function fully analyzed and documented
- ✅ Test patterns exist in codebase to follow
- ✅ NODE_ENV mocking pattern researched and documented
- ✅ Anti-patterns identified and documented
- ⚠️ Only minor uncertainty: Vitest's handling of `typeof process` in tests (verify during implementation)

**Validation needed during implementation**:
1. Confirm `vi.stubEnv('NODE_ENV', 'development')` works with `typeof process !== "undefined"` check
2. If not working, may need additional process mocking
