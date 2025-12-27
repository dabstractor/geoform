# PRP: Unit Tests (P4.M1)

**Milestone:** P4.M1 - Unit Tests
**Project:** React Hierarchical Form Stack System (geoform)
**Status:** Verification milestone - Tests implemented during P1-P3 phases
**Estimated Story Points:** 5 SP (verification only - already implemented)
**Dependencies:** P3.M1 (Complete) - URL Sync Plugin

---

## Goal

**Feature Goal**: Verify comprehensive unit test coverage for all utilities, reducer, and hooks in the geoform library. This milestone validates that tests written during implementation phases P1-P3 meet quality standards and provide adequate coverage for the core library functionality.

**Deliverable**:
- Verified test files for `createDeferredPromise` utility
- Verified test files for `urlEncoding` utilities
- Verified test files for `formStackReducer`
- Verified test files for `useFormStackState`, `useFormStackActions`, `useFormStack` hooks
- Verified test files for `useFormStackURLSync` hook
- Documentation of test patterns and coverage
- Installation of coverage tooling (optional enhancement)

**Success Definition**:
1. All existing unit tests pass: `npm run test` shows 186 tests passing
2. Tests cover all public API functions (utilities and hooks)
3. Tests verify both success paths and error conditions
4. Tests verify reference stability for performance-critical hooks
5. All test files follow established project patterns (AAA, renderHook wrapper)
6. No React act() warnings in test output (minor issue to address)
7. `npm run type-check` passes with zero errors
8. `npm run build` succeeds

---

## User Persona

**Target User**: Library maintainers and contributors

**Use Case**: Ensuring library reliability through automated testing

**User Journey**:
1. Clone the geoform repository
2. Run `npm install` to install dependencies
3. Run `npm run test` to verify all tests pass
4. Run `npm run test:watch` during development for TDD workflow
5. Review test files to understand expected behavior

**Pain Points Addressed**:
- Regression prevention during future development
- Clear documentation of expected behavior through tests
- Confidence in library stability for consumers

---

## Why

- **Quality Assurance**: Automated tests catch regressions before they reach production
- **Documentation**: Tests serve as living documentation of expected behavior
- **Refactoring Safety**: Comprehensive tests enable safe code improvements
- **Contributor Confidence**: New contributors can verify their changes don't break existing functionality
- **API Contract**: Tests define the public API contract for consumers

---

## What

### Success Criteria

- [x] `createDeferredPromise` utility has 10 passing tests covering:
  - Structure validation (promise, resolve, reject properties)
  - Promise resolution with values
  - Promise resolution with undefined (cancel case)
  - Complex object handling
  - Single resolution guarantee (first value wins)
  - Promise rejection with Error
  - Promise rejection with string
  - Rejection takes precedence over later resolution
  - Generic type handling (number, array)
- [x] `urlEncoding` utilities have 35 passing tests covering:
  - Empty array encoding
  - Single and multiple form ID encoding
  - Special character URL encoding (&, =, ?, #, spaces)
  - Null/undefined handling in decoding
  - Invalid URI encoding graceful failure
  - Empty segment filtering
  - Round-trip preservation (encode/decode cycle)
  - Unicode character support
  - URL building with parameter preservation
  - URL parsing with custom parameter names
- [x] `formStackReducer` has 12 passing tests covering:
  - Initial state validation
  - PUSH_FORM action (empty stack, existing stack)
  - POP_FORM action (normal, empty stack edge case)
  - POP_TO_INDEX action (first, middle, bounds checking)
  - State immutability verification
- [x] `useFormStackState` hook has 6 passing tests covering:
  - Return type structure validation
  - Empty stack initial state
  - Readonly stack enforcement
  - Error throwing outside provider
  - Helpful error message content
  - Reference stability across renders
- [x] `useFormStackActions` hook has 5 passing tests covering:
  - Return type structure (openForm, closeForm)
  - openForm returns Promise
  - Error throwing outside provider
  - Helpful error message content
  - Reference stability across renders
- [x] `useFormStack` combined hook has 7 passing tests covering:
  - Return type structure (stack, openForm, closeForm)
  - Empty stack initial state
  - Function type validation
  - openForm returns Promise
  - Error throwing outside provider (from useFormStackState)
  - Return type interface matching
  - Reference stability across renders
- [x] `useFormStackURLSync` hook has 20 passing tests covering:
  - Initialization without error
  - Return type structure (isRestoring, getUrlState, forceUrlUpdate)
  - URL restoration on mount with onRestore callback
  - Empty URL handling
  - restoreOnMount option respect
  - isRestoring state during restoration
  - popstate event listener registration/cleanup
  - syncFromUrl: false option
  - getUrlState utility method
  - forceUrlUpdate calling replaceState
  - Custom paramName option
  - syncToUrl: false option
  - Error handling outside provider
  - URL-encoded special character handling
  - Empty query string handling
  - Empty forms param value handling

---

## All Needed Context

### Context Completeness Check

_This PRP documents existing test coverage implemented during P1-P3. All test files exist and pass. This milestone focuses on verification and documentation._

### Documentation & References

```yaml
# Existing test files to verify
- file: src/utils/__tests__/createDeferredPromise.test.ts
  why: Tests for deferred promise utility
  tests: 10 tests covering structure, resolve, reject, generics
  pattern: Vitest describe/it/expect with async/await

- file: src/utils/__tests__/urlEncoding.test.ts
  why: Tests for URL encoding utilities
  tests: 35 tests covering encode, decode, build, parse
  pattern: Vitest with beforeEach/afterEach for window.location mocking

- file: src/context/__tests__/formStackReducer.test.ts
  why: Tests for form stack reducer
  tests: 12 tests covering all actions and immutability
  pattern: createMockEntry helper, AAA pattern

- file: src/hooks/__tests__/useFormStackState.test.tsx
  why: Tests for state context hook
  tests: 6 tests covering returns, errors, stability
  pattern: renderHook with FormStackProvider wrapper

- file: src/hooks/__tests__/useFormStackActions.test.tsx
  why: Tests for actions context hook
  tests: 5 tests covering returns, errors, stability
  pattern: renderHook with FormStackProvider wrapper

- file: src/hooks/__tests__/useFormStack.test.tsx
  why: Tests for combined hook
  tests: 7 tests covering composition, returns, stability
  pattern: renderHook with FormStackProvider wrapper

- file: src/hooks/__tests__/useFormStackURLSync.test.tsx
  why: Tests for URL sync hook
  tests: 20 tests covering sync, restoration, events
  pattern: Comprehensive window/history mocking

# Configuration files
- file: vitest.config.ts
  why: Test runner configuration
  pattern: jsdom environment, globals enabled, coverage via v8

- file: vitest.setup.ts
  why: Test setup and cleanup
  pattern: afterEach cleanup, mock clearing

# Testing best practices documentation (external)
- url: https://vitest.dev/api/
  why: Official Vitest API documentation
  critical: Use describe/it/expect pattern, vi for mocking

- url: https://testing-library.com/docs/react-testing-library/api#renderhook
  why: renderHook API for testing React hooks
  critical: Use wrapper option for provider context

- url: https://testing-library.com/docs/react-testing-library/setup#cleanup
  why: Cleanup patterns for React testing
  critical: cleanup() called in vitest.setup.ts afterEach
```

### Current Codebase Tree (Test Files)

```bash
geoform-opus/src/
├── __tests__/
│   └── setup.test.tsx                    # Test environment verification (2 tests)
├── context/
│   └── __tests__/
│       └── formStackReducer.test.ts      # Reducer unit tests (12 tests)
├── types/
│   └── __tests__/
│       └── types.test.ts                 # Type-level tests (10 tests)
├── utils/
│   └── __tests__/
│       ├── createDeferredPromise.test.ts # Deferred promise tests (10 tests)
│       └── urlEncoding.test.ts           # URL encoding tests (35 tests)
├── hooks/
│   └── __tests__/
│       ├── useFormStackState.test.tsx    # State hook tests (6 tests)
│       ├── useFormStackActions.test.tsx  # Actions hook tests (5 tests)
│       ├── useFormStack.test.tsx         # Combined hook tests (7 tests)
│       └── useFormStackURLSync.test.tsx  # URL sync hook tests (20 tests)
└── components/
    └── __tests__/
        ├── FormStackProvider.integration.test.tsx  # Provider integration (4 tests)
        ├── FormStackRenderer.test.tsx              # Renderer tests (14 tests)
        ├── Breadcrumbs.test.tsx                    # Breadcrumbs unit (16 tests)
        ├── Breadcrumbs.integration.test.tsx        # Breadcrumbs integration (3 tests)
        ├── ConfirmationDialog.test.tsx             # Dialog unit (12 tests)
        ├── ConfirmationDialog.integration.test.tsx # Dialog integration (8 tests)
        └── FormErrorBoundary.test.tsx              # Error boundary (22 tests)
```

### Test Summary Statistics

| Category | Test Files | Tests | Status |
|----------|-----------|-------|--------|
| Utilities | 2 | 45 | Passing |
| Reducer | 1 | 12 | Passing |
| Hooks | 4 | 38 | Passing |
| Types | 1 | 10 | Passing |
| Components | 7 | 79 | Passing |
| Setup | 1 | 2 | Passing |
| **TOTAL** | **16** | **186** | **All Passing** |

### Known Issues (Minor)

```typescript
// ISSUE: React act() warnings in some hook tests
// Location: useFormStackActions.test.tsx, useFormStack.test.tsx
// Severity: Minor (tests still pass)
// Description: "An update to FormStackProvider inside a test was not wrapped in act(...)"
// Root cause: openForm() triggers state update when called without awaiting
// Fix (optional): Wrap openForm calls in act() when testing return type
//
// Example fix:
// Before:
const returnValue = result.current.openForm({ id: 'test', component: () => null });
//
// After:
let returnValue: Promise<unknown>;
act(() => {
  returnValue = result.current.openForm({ id: 'test', component: () => null });
});
```

### Test Patterns Used

```typescript
// PATTERN 1: Arrange-Act-Assert (AAA)
// Used throughout all test files
it('should return empty stack initially', () => {
  // Arrange
  const { result } = renderHook(() => useFormStack(), { wrapper });

  // Act - none needed for initial state

  // Assert
  expect(result.current.stack).toHaveLength(0);
});

// PATTERN 2: renderHook with Provider Wrapper
// Required for all hook tests that need FormStackProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
);

const { result, rerender } = renderHook(() => useFormStack(), { wrapper });

// PATTERN 3: Error Throwing Tests
// Used for testing hooks outside provider
expect(() => {
  renderHook(() => useFormStackState());
}).toThrow('useFormStackState must be used within a FormStackProvider');

// PATTERN 4: Reference Stability Tests
// Verifies memoization for performance-critical hooks
it('should return stable function references between renders', () => {
  const { result, rerender } = renderHook(() => useFormStackActions(), { wrapper });
  const firstOpenForm = result.current.openForm;

  rerender();

  expect(result.current.openForm).toBe(firstOpenForm);
});

// PATTERN 5: Async Promise Tests
// Used for createDeferredPromise and promise-returning functions
it('should resolve promise with value', async () => {
  const deferred = createDeferredPromise<string>();

  deferred.resolve('test value');
  const result = await deferred.promise;

  expect(result).toBe('test value');
});

// PATTERN 6: Mock Helper Functions
// Used for reducer tests
const createMockEntry = (id: string, label?: string): InternalStackEntry<unknown> => ({
  id,
  label,
  component: () => null,
  confirmOnCancel: false,
  deferred: {
    promise: Promise.resolve(undefined),
    resolve: () => {},
    reject: () => {},
  },
});

// PATTERN 7: Window/History Mocking
// Used for URL sync tests
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { search: '', pathname: '/', href: 'http://localhost/' },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

// PATTERN 8: Immutability Verification
// Used for reducer tests
it('should not mutate original state', () => {
  const state: FormStackReducerState = { stack: [] };
  const originalStack = state.stack;

  const result = formStackReducer(state, { type: 'PUSH_FORM', entry });

  expect(result.stack).not.toBe(originalStack);
  expect(originalStack).toHaveLength(0);
});
```

---

## Implementation Blueprint

### Verification Tasks (ordered by priority)

```yaml
Task 1: VERIFY all unit tests pass
  - COMMAND: npm run test
  - EXPECTED: 16 test files, 186 tests, all passing
  - TIMING: < 2 seconds
  - VALIDATION: Exit code 0, no failures

Task 2: VERIFY type checking passes
  - COMMAND: npm run type-check
  - EXPECTED: Zero TypeScript errors
  - VALIDATION: Exit code 0

Task 3: VERIFY build succeeds
  - COMMAND: npm run build
  - EXPECTED: dist/ directory with JS and .d.ts files
  - VALIDATION: Files exist in dist/

Task 4: REVIEW test coverage gaps (optional)
  - INSTALL: npm install -D @vitest/coverage-v8
  - COMMAND: npm run test:coverage
  - EXPECTED: Coverage report for src/ files
  - TARGET: 85%+ coverage for utilities and hooks

Task 5: FIX act() warnings (optional enhancement)
  - MODIFY: src/hooks/__tests__/useFormStackActions.test.tsx
  - MODIFY: src/hooks/__tests__/useFormStack.test.tsx
  - PATTERN: Wrap openForm() calls in act() when testing return type
  - VALIDATION: No stderr warnings in test output

Task 6: DOCUMENT test patterns (complete)
  - OUTPUT: This PRP serves as documentation
  - COVERS: All 8 test patterns used in codebase
  - VALIDATION: Patterns documented in "Test Patterns Used" section
```

### Test Files Overview

| File | Purpose | Key Patterns |
|------|---------|--------------|
| `createDeferredPromise.test.ts` | Deferred promise utility | AAA, async/await |
| `urlEncoding.test.ts` | URL encode/decode utilities | beforeEach/afterEach, window mocking |
| `formStackReducer.test.ts` | Reducer state transitions | Mock helpers, immutability checks |
| `useFormStackState.test.tsx` | State context hook | renderHook wrapper, error throwing |
| `useFormStackActions.test.tsx` | Actions context hook | renderHook wrapper, stability |
| `useFormStack.test.tsx` | Combined hook | renderHook wrapper, composition |
| `useFormStackURLSync.test.tsx` | URL sync hook | Comprehensive mocking, events |

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Verify TypeScript compiles all test files
npm run type-check

# Expected: Zero errors
# If errors: Check imports, type assertions in test files
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run all unit tests
npm run test

# Expected output (summarized):
# ✓ src/utils/__tests__/createDeferredPromise.test.ts (10 tests)
# ✓ src/context/__tests__/formStackReducer.test.ts (12 tests)
# ✓ src/utils/__tests__/urlEncoding.test.ts (35 tests)
# ✓ src/hooks/__tests__/useFormStackState.test.tsx (6 tests)
# ✓ src/hooks/__tests__/useFormStackActions.test.tsx (5 tests)
# ✓ src/hooks/__tests__/useFormStack.test.tsx (7 tests)
# ✓ src/hooks/__tests__/useFormStackURLSync.test.tsx (20 tests)
# + component tests (79 tests)
# + setup tests (2 tests)
# + type tests (10 tests)
# Test Files  16 passed (16)
# Tests  186 passed (186)
# Duration  ~1s

# Run specific test file for debugging
npm run test -- src/utils/__tests__/createDeferredPromise.test.ts -v

# Run tests in watch mode for development
npm run test:watch
```

### Level 3: Coverage Analysis (Optional)

```bash
# Install coverage dependency (if not present)
npm install -D @vitest/coverage-v8

# Run tests with coverage
npm run test:coverage

# Expected: Coverage report in terminal and html/
# Target coverage:
#   - src/utils/: 95%+
#   - src/context/: 90%+
#   - src/hooks/: 90%+
```

### Level 4: Build Verification

```bash
# Verify build includes test-validated code
npm run build

# Check output files exist
ls -la dist/

# Expected files:
#   - dist/index.js (ESM)
#   - dist/index.cjs (CommonJS)
#   - dist/index.d.ts (TypeScript declarations)
```

---

## Final Validation Checklist

### Technical Validation

- [x] `npm run type-check` passes with zero errors
- [x] `npm run test` passes all 186 tests
- [x] `npm run build` generates dist/ files
- [x] All test files created and populated during P1-P3

### Feature Validation (P4.M1 Scope)

- [x] `createDeferredPromise` utility tested (10 tests)
- [x] `urlEncoding` utilities tested (35 tests)
- [x] `formStackReducer` tested (12 tests)
- [x] `useFormStackState` hook tested (6 tests)
- [x] `useFormStackActions` hook tested (5 tests)
- [x] `useFormStack` hook tested (7 tests)
- [x] `useFormStackURLSync` hook tested (20 tests)

### Test Quality Validation

- [x] Tests follow AAA pattern (Arrange-Act-Assert)
- [x] Tests use proper renderHook wrapper pattern
- [x] Tests verify error conditions (outside provider)
- [x] Tests verify reference stability (memoization)
- [x] Tests verify state immutability (reducer)
- [x] Tests use mock helpers for consistent test data
- [x] Tests properly mock browser APIs (window, history)

### Documentation & Deployment

- [x] Test patterns documented in this PRP
- [x] Test file locations documented
- [x] Known issues documented (act() warnings)
- [x] Coverage targets documented

---

## Anti-Patterns to Avoid

- **DON'T** destructure `result.current` before state updates - loses reactivity
- **DON'T** forget the wrapper when testing hooks that need context
- **DON'T** test hook errors by calling hook directly - use renderHook
- **DON'T** skip cleanup - vitest.setup.ts handles this automatically
- **DON'T** mock more than necessary - prefer minimal mocking
- **DON'T** test implementation details - test public API behavior
- **DON'T** ignore act() warnings indefinitely - they indicate potential issues

---

## Confidence Score

**10/10** - All tests already exist and pass

**Rationale:**
- All 186 unit tests already implemented during P1-P3 phases
- Tests pass with `npm run test` in ~1 second
- Comprehensive coverage of utilities, reducer, and hooks
- Well-documented test patterns followed consistently
- Type checking passes with zero errors
- Build succeeds with declarations

**This milestone is a verification checkpoint** confirming that test-driven development practices during P1-P3 resulted in comprehensive unit test coverage. No new test implementation is required.

---

## Quick Verification Commands

```bash
# Full verification (run all commands)
npm run type-check && npm run test && npm run build

# Individual verification
npm run test                           # All 186 tests
npm run test -- --grep "createDeferred"  # Specific tests
npm run test:watch                     # Development mode

# Test file summary
npm run test -- --reporter=dot         # Compact output

# Coverage (requires @vitest/coverage-v8)
npm install -D @vitest/coverage-v8 && npm run test:coverage
```

**Expected verification time:** < 30 seconds for full test suite.

---

## Future Enhancements (Out of Scope)

1. **Install Coverage Tooling**: `npm install -D @vitest/coverage-v8`
2. **Fix act() Warnings**: Wrap state-updating calls in act() in hook tests
3. **Add Mutation Testing**: Consider Stryker for mutation testing
4. **CI Integration**: Add GitHub Actions workflow for automated testing
5. **Snapshot Tests**: Consider snapshot tests for component rendering

---

## References

### Internal Documentation
- `plan/P1M4/PRP.md` - Hook and utility implementation with test patterns
- `vitest.config.ts` - Test runner configuration
- `vitest.setup.ts` - Test environment setup

### External Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library - renderHook](https://testing-library.com/docs/react-testing-library/api#renderhook)
- [Testing React Hooks - Best Practices](https://kentcdodds.com/blog/how-to-test-custom-react-hooks)
- [Vitest Coverage with v8](https://vitest.dev/guide/coverage.html)
