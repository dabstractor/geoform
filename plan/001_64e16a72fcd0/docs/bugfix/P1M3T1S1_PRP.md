# P1.M3.T1.S1: Development-Only Error for Invalid popToIndex - Product Requirement Prompt

**Subtask**: P1.M3.T1.S1
**Title**: Implement development-only error for invalid popToIndex
**Status**: Ready for Implementation
**Story Points**: 1
**Confidence Score**: 10/10 for one-pass implementation success

---

## Goal

**Feature Goal**: Add development-mode error throwing for invalid `popToIndex` indices to catch programming errors early while maintaining graceful degradation in production.

**Deliverable**: Modified `src/components/FormStackProvider.tsx` with:
1. Development-only `RangeError` thrown for invalid indices (negative or >= stack.length)
2. JSDoc comment explaining the dev-only behavior and graceful degradation
3. No changes to production behavior (silent returns for invalid indices)

**Success Definition**:
- Invalid indices throw descriptive `RangeError` in development mode (`process.env.NODE_ENV === 'development'`)
- Production behavior unchanged (silent return for invalid indices)
- JSDoc clearly documents the error throwing behavior
- TypeScript compilation passes with no errors
- No existing tests broken (P1.M3.T1.S2 will add new tests)

---

## User Persona

**Target User**: Library developer debugging form stack navigation issues

**Use Case**: When a developer calls `popToIndex` with an invalid index (due to off-by-one errors, race conditions, or incorrect state assumptions), they need immediate feedback to diagnose the problem

**User Journey**:
1. Developer writes code that calls `popToIndex(invalidIndex)`
2. In development mode: Clear `RangeError` is thrown with stack length context
3. Developer reads error message, realizes the index calculation bug, fixes it
4. In production: Invalid calls silently fail (graceful degradation)
5. End users don't see crashes in production due to edge cases

**Pain Points Addressed**:
- **Without dev-only error**: Invalid `popToIndex` calls silently fail, making bugs extremely difficult to debug
- **With always-throwing**: Production crashes from edge cases hurt user experience
- **With this solution**: Best of both worlds - early debugging + production resilience

---

## Why

- **Debuggability**: Silent failures make off-by-one errors and race conditions nearly impossible to diagnose
- **Developer Experience**: Clear error messages with context (index value, stack length) accelerate debugging
- **Production Safety**: Graceful degradation prevents crashes from edge cases or timing issues
- **Consistency**: Matches existing error patterns in `useFormStackState` and `useFormStackActions` hooks
- **TypeScript Strict Mode**: Runtime validation catches bugs that TypeScript can't catch at compile time
- **Consumer Safety**: Breadcrumbs component validates indices, but other consumers may not

---

## What

### Success Criteria

- [ ] Development-mode `RangeError` thrown for negative indices
- [ ] Development-mode `RangeError` thrown for indices >= stack.length
- [ ] Error message includes both invalid index value and current stack length
- [ ] Production behavior unchanged (silent return)
- [ ] JSDoc comment documents dev-only error throwing
- [ ] TypeScript compilation passes
- [ ] Existing tests still pass

### Implementation Contract

```typescript
// ADD to popToIndex function (lines 104-136 in FormStackProvider.tsx)
// Place immediately after the function declaration, before existing validation:

/**
 * Navigates to a specific form in the stack by index.
 * All forms after the target index are cancelled (resolved with undefined).
 *
 * @param index - Zero-based index of the target form
 * @throws {RangeError} In development mode, when index is negative or >= stack length.
 *                      Production silently ignores invalid indices (graceful degradation).
 */
const popToIndex = useCallback(async (index: number) => {
  // Development-mode error throwing for debugging
  if (process.env.NODE_ENV === 'development') {
    if (index < 0 || index >= state.stack.length) {
      throw new RangeError(
        `popToIndex: Invalid index ${index}. Stack length is ${state.stack.length}.`
      );
    }
  }

  // Existing validation (preserved for production)
  if (index < 0 || index >= state.stack.length) {
    return;
  }

  // ... rest of existing implementation unchanged
}, [state.stack, requestConfirmation]);
```

---

## All Needed Context

### Context Completeness Check

_This PRP provides exact file location, line numbers, complete code to add, JSDoc format to follow, existing patterns reference, and validation commands. An implementer with no prior knowledge can complete this task using only this document._

### Documentation & References

```yaml
# MUST READ - Primary Implementation File
- file: src/components/FormStackProvider.tsx
  why: The file containing popToIndex function to modify
  pattern: |
    Lines 104-136: popToIndex implementation
    Lines 106-108: Current silent return validation (to be enhanced)
    Line 162-166: actionsValue useMemo (popToIndex is a dependency)
  gotcha: popToIndex is wrapped in useCallback and must remain stable
  critical: |
    Current implementation:
    ```typescript
    const popToIndex = useCallback(async (index: number) => {
      // Validate index bounds
      if (index < 0 || index >= state.stack.length) {
        return;  // Silent failure - ISSUE
      }
      // ... rest of function
    }, [state.stack, requestConfirmation]);
    ```

# MUST READ - Type Definition
- file: src/types/context.ts
  why: Contains FormStackActions interface with popToIndex type signature
  pattern: Line 48: `popToIndex: (index: number) => void;`
  gotcha: Type signature shows void return - error throwing doesn't change this

# MUST READ - Existing Error Pattern for Context
- file: src/hooks/useFormStackState.ts
  why: Reference for error throwing pattern when context is null
  pattern: Lines 27-31
  critical: |
    ```typescript
    if (context === null) {
      throw new Error(
        'useFormStackState must be used within a FormStackProvider. ' +
        'Wrap your component tree with <FormStackProvider>.'
      );
    }
    ```

# MUST READ - Existing Error Pattern for Actions
- file: src/hooks/useFormStackActions.ts
  why: Reference for consistent error message formatting
  pattern: Lines 36-40
  critical: |
    ```typescript
    if (context === null) {
      throw new Error(
        'useFormStackActions must be used within a FormStackProvider. ' +
        'Wrap your component tree with <FormStackProvider>.'
      );
    }
    ```

# MUST READ - JSDoc Patterns in FormStackProvider
- file: src/components/FormStackProvider.tsx
  why: Reference for JSDoc comment formatting in this file
  pattern: Lines 9-17 (PendingConfirmation interface), Lines 19-30 (FormStackProviderProps interface)
  critical: |
    Use JSDoc with:
    - Description on first line
    - @param tag for parameters
    - @throws tag for exceptions (with "In development mode" qualifier)
    - Empty line after description before tags

# MUST READ - Consumer Component (Breadcrumbs)
- file: src/components/Breadcrumbs.tsx
  why: Shows how popToIndex is called in practice
  pattern: Lines 46-53 (handleClick function)
  gotcha: Breadcrumbs validates before calling (checks for current form), but doesn't check bounds
  critical: |
    ```typescript
    const handleClick = (index: number, event: MouseEvent) => {
      event.preventDefault();
      // Don't navigate if clicking current form
      if (index === stack.length - 1) {
        return;
      }
      popToIndex(index);  // No bounds validation - relies on FormStackProvider
    };
    ```

# MUST READ - URL Sync Hook Usage
- file: src/hooks/useFormStackURLSync.ts
  why: Another consumer of popToIndex
  pattern: Lines 316, 319
  gotcha: Calls popToIndex(-1) for "close all" - currently rejected by validation
  critical: This may be an existing bug; our dev-only error will expose it

# RESEARCH - Development-Only Error Patterns
- docfile: plan/docs/bugfix/P1M2T2S3/research/development_only_error_patterns.md
  why: Comprehensive React/TypeScript patterns for dev-only errors
  section: "NODE_ENV Guard Patterns", "RangeError for Invalid Ranges"
  critical: |
    - Use `process.env.NODE_ENV === 'development'` check
    - RangeError for invalid indices/parameters
    - Descriptive messages with context (values, bounds)
    - Graceful degradation in production

# EXTERNAL - React Error Patterns
- url: https://react.dev/reference/react/useRef#avoiding-race-conditions-with-refs
  why: React guidance on defensive programming with refs
  section: "Using refs to track if an effect should skip work"

# EXTERNAL - MDN RangeError
- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RangeError
  why: Understanding when to use RangeError vs Error
  critical: RangeError is for numeric values outside expected bounds

# EXTERNAL - TypeScript Strict Mode
- url: https://www.typescriptlang.org/tsconfig#strict
  why: Understanding runtime validation need even with strict mode
  section: NoImplicitAny, StrictNullChecks explanations
```

### Current Codebase Tree

```bash
src/
├── components/
│   ├── FormStackProvider.tsx          # MODIFY: Add dev-only error to popToIndex (lines 104-136)
│   ├── Breadcrumbs.tsx                # READ: Consumer of popToIndex
│   └── __tests__/
│       ├── FormStackProvider.test.tsx # MODIFY: P1.M3.T1.S2 will add tests here
│       └── Breadcrumbs.test.tsx       # READ: See existing test patterns
├── hooks/
│   ├── useFormStackState.ts           # READ: Error throwing pattern reference
│   ├── useFormStackActions.ts         # READ: Error throwing pattern reference
│   └── useFormStackURLSync.ts         # READ: popToIndex(-1) usage
├── types/
│   └── context.ts                     # READ: FormStackActions.popToIndex type
└── context/
    └── formStackReducer.ts            # CONTEXT: Reducer also validates indices
```

### Desired Codebase Tree After Implementation

```bash
src/
├── components/
│   ├── FormStackProvider.tsx          # MODIFIED: popToIndex has dev-only error throwing
│   │                                  # Lines 104-136: Enhanced with NODE_ENV check
│   │                                  # JSDoc comment added explaining dev-only behavior
│   └── __tests__/
│       └── FormStackProvider.test.tsx # UNCHANGED: Tests added in P1.M3.T1.S2
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Add development check BEFORE existing validation
// WRONG - replaces existing validation (breaks production):
if (process.env.NODE_ENV === 'development' && (index < 0 || index >= state.stack.length)) {
  throw new RangeError(...);
}
// Missing: production silent return!

// CORRECT - preserves both behaviors:
if (process.env.NODE_ENV === 'development') {
  if (index < 0 || index >= state.stack.length) {
    throw new RangeError(...);
  }
}
// Existing production validation unchanged below:
if (index < 0 || index >= state.stack.length) {
  return;
}

// GOTCHA: process.env.NODE_ENV is replaced by build tools
// In production builds, the entire if block is removed (tree-shaken)
// In development, the check exists and throws
// This is the standard React pattern for dev-only code

// GOTCHA: Error message formatting must match existing pattern
// Use template literal with both values:
throw new RangeError(`popToIndex: Invalid index ${index}. Stack length is ${state.stack.length}.`);
// NOT: throw new Error("Invalid index");  // Too vague

// GOTCHA: JSDoc @throws tag should specify "In development mode"
/**
 * @throws {RangeError} In development mode, when index is invalid.
 *                       Production silently ignores invalid indices.
 */

// GOTCHA: URL sync hook calls popToIndex(-1) - line 319
// This will now throw in development, exposing a potential bug
// Our error is correct behavior - the -1 call should be fixed

// GOTCHA: useCallback dependencies must not change
// Adding process.env.NODE_ENV check doesn't affect deps
// [state.stack, requestConfirmation] remains correct dependency array

// GOTCHA: TypeScript strict mode is enabled
// Check tsconfig.json - strict: true
// Runtime validation needed because TypeScript can't catch:
// - Index calculated from user input
// - Race conditions between stack length and popToIndex call
// - Off-by-one errors in calculations

// GOTCHA: Breadcrumbs component doesn't validate bounds
// It only checks for "current form" (index === stack.length - 1)
// Relies on FormStackProvider for bounds validation
// Our dev-only error will catch any Breadcrumbs bugs too
```

---

## Implementation Blueprint

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ src/components/FormStackProvider.tsx (lines 104-136)
  - UNDERSTAND: Current popToIndex implementation
  - IDENTIFY: Lines 106-108 (validation that silently returns)
  - NOTE: useCallback dependencies [state.stack, requestConfirmation]
  - NOTE: Existing JSDoc at lines 103-108 (in FormStackActions interface)

Task 2: ADD development-mode error throwing (immediately after line 104)
  - INSERT: New development check before existing validation
  - CODE: |
    ```typescript
    const popToIndex = useCallback(async (index: number) => {
      // Development-mode error throwing for debugging
      if (process.env.NODE_ENV === 'development') {
        if (index < 0 || index >= state.stack.length) {
          throw new RangeError(
            `popToIndex: Invalid index ${index}. Stack length is ${state.stack.length}.`
          );
        }
      }

      // Validate index bounds (production)
      if (index < 0 || index >= state.stack.length) {
        return;
      }
      // ... rest of function unchanged
    }, [state.stack, requestConfirmation]);
    ```
  - PRESERVE: All existing code below line 108
  - PRESERVE: useCallback dependencies

Task 3: ADD JSDoc comment to popToIndex (before useCallback)
  - INSERT: Above the popToIndex useCallback declaration
  - CODE: |
    ```typescript
    /**
     * Navigates to a specific form in the stack by index.
     * All forms after the target index are cancelled (resolved with undefined).
     * Used by Breadcrumbs component for direct navigation.
     *
     * @param index - Zero-based index of the target form. Must be >= 0 and < stack.length.
     * @throws {RangeError} In development mode, when index is negative or >= stack length.
     *                      Production silently ignores invalid indices (graceful degradation).
     */
    const popToIndex = useCallback(async (index: number) => {
      // ... implementation
    }, [state.stack, requestConfirmation]);
    ```
  - FOLLOW: Existing JSDoc style in FormStackProvider (lines 9-30, 46-57)
  - INCLUDE: @param with description
  - INCLUDE: @throws with "In development mode" qualifier

Task 4: VERIFY TypeScript compilation
  - RUN: npm run type-check (or npx tsc --noEmit)
  - EXPECTED: Zero errors
  - CHECK: RangeError is recognized (built-in type)

Task 5: VERIFY existing tests still pass
  - RUN: npm run test
  - EXPECTED: All tests pass
  - NOTE: P1.M3.T1.S2 will add new tests for error throwing

Task 6: VERIFY production build succeeds
  - RUN: npm run build
  - EXPECTED: Build succeeds, dist/ generated
  - VERIFY: Dev-only code is tree-shaken in production (check dist output)
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Development-mode validation before production validation
const popToIndex = useCallback(async (index: number) => {
  // Step 1: Development-only error (tree-shaken in production)
  if (process.env.NODE_ENV === 'development') {
    if (index < 0 || index >= state.stack.length) {
      throw new RangeError(
        `popToIndex: Invalid index ${index}. Stack length is ${state.stack.length}.`
      );
    }
  }

  // Step 2: Production validation (silent return)
  if (index < 0 || index >= state.stack.length) {
    return;
  }

  // ... rest of implementation unchanged

}, [state.stack, requestConfirmation]); // Dependencies unchanged

// PATTERN: JSDoc with @throws for dev-only errors
/**
 * @param index - Zero-based index of the target form. Must be >= 0 and < stack.length.
 * @throws {RangeError} In development mode, when index is negative or >= stack length.
 *                      Production silently ignores invalid indices (graceful degradation).
 */

// PATTERN: Error message includes both invalid value and bounds
`popToIndex: Invalid index ${index}. Stack length is ${state.stack.length}.`
// NOT: "Invalid index"  // Too vague
// NOT: `Index ${index} is out of bounds`  // Missing stack length context

// PATTERN: Use RangeError for invalid numeric ranges
// RangeError: For numeric values outside expected bounds
// TypeError: For wrong type (e.g., string instead of number)
// Error: For general errors

// GOTCHA: process.env.NODE_ENV is replaced at build time
// Development build: if (true) { ... throw ... }
// Production build: if (false) { ... } → entire block removed
// This is standard React/webpack behavior
```

### Integration Points

```yaml
FORMSTACK_PROVIDER_FILE:
  - modify: src/components/FormStackProvider.tsx
  - lines: 104-136 (popToIndex function)
  - add: Development-mode error throwing (after line 104)
  - add: JSDoc comment (before line 104)

TYPE_DEFINITION:
  - unchanged: src/types/context.ts (line 48)
  - popToIndex: (index: number) => void
  - note: Error throwing doesn't change void return type

CONSUMER_HIERARCHY:
  - Breadcrumbs.tsx (line 53): Calls popToIndex(index)
  - useFormStackURLSync.ts (line 316): Calls popToIndex(targetIndex)
  - useFormStackURLSync.ts (line 319): Calls popToIndex(-1) → Will now throw in dev!

TEST_FILES:
  - unchanged: src/components/__tests__/Breadcrumbs.test.tsx
  - unchanged: src/hooks/__tests__/useFormStackURLSync.test.tsx
  - note: P1.M3.T1.S2 will add tests to FormStackProvider.test.tsx
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After modifying FormStackProvider.tsx, verify TypeScript compiles
npm run type-check

# Expected: Zero errors
# If errors: Check for typos in error message, verify RangeError is built-in

# Format check (if using Prettier)
npm run format 2>/dev/null || npx prettier --check src/components/FormStackProvider.tsx

# Expected: File is formatted
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run existing tests to ensure no breakage
npm run test

# Expected: All existing tests pass
# Note: P1.M3.T1.S2 will add new tests for error throwing

# Run specific test file
npm run test -- src/components/__tests__/FormStackProvider.test.tsx

# Expected: Tests pass (no error tests yet - those are P1.M3.T1.S2)
```

### Level 3: Build Verification (Production Bundle)

```bash
# Build production bundle
npm run build

# Expected: Build succeeds, dist/ directory generated

# Verify dev-only code is tree-shaken
grep -r "process.env.NODE_ENV" dist/ || echo "Dev checks removed (tree-shaken)"

# Expected: No NODE_ENV checks in production bundle

# Verify popToIndex exists in dist
grep -r "popToIndex.*Invalid index" dist/ || echo "Error message in dev build only"

# Expected: Error message only in development, not production
```

### Level 4: Manual Verification (Development vs Production)

```bash
# Create test file to verify behavior
cat > /tmp/test-poptoindex.tsx << 'EOF'
import { renderHook } from '@testing-library/react';
import { FormStackProvider } from './src/components/FormStackProvider';
import { useFormStackActions } from './src/hooks/useFormStackActions';

// Test development mode
const wrapper = ({ children }) => <FormStackProvider>{children}</FormStackProvider>;

test('throws in development for negative index', () => {
  process.env.NODE_ENV = 'development';
  const { result } = renderHook(() => useFormStackActions(), { wrapper });

  expect(() => result.current.popToIndex(-1)).toThrow(
    RangeError
  );
  expect(() => result.current.popToIndex(-1)).toThrow(
    'popToIndex: Invalid index -1'
  );
});

test('throws in development for out-of-bounds index', () => {
  process.env.NODE_ENV = 'development';
  const { result } = renderHook(() => useFormStackActions(), { wrapper });

  expect(() => result.current.popToIndex(999)).toThrow(
    'Stack length is 0'
  );
});

test('returns silently in production for invalid index', () => {
  process.env.NODE_ENV = 'production';
  const { result } = renderHook(() => useFormStackActions(), { wrapper });

  expect(() => result.current.popToIndex(-1)).not.toThrow();
});
EOF

# Run manual verification (optional - P1.M3.T1.S2 will add proper tests)
npm run test -- /tmp/test-poptoindex.tsx 2>/dev/null || echo "Manual test file created"
```

---

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation passes: `npm run type-check`
- [ ] Existing tests pass: `npm run test`
- [ ] Production build succeeds: `npm run build`
- [ ] Dev-only code is tree-shaken (check dist/ output)
- [ ] No new dependencies added to useCallback

### Feature Validation

- [ ] Negative indices throw `RangeError` in development mode
- [ ] Out-of-bounds indices throw `RangeError` in development mode
- [ ] Error message includes both invalid index and stack length
- [ ] Production behavior unchanged (silent return for invalid indices)
- [ ] JSDoc comment added with @throws documentation
- [ ] Breadcrumbs component still works (calls valid indices)

### Code Quality Validation

- [ ] Follows existing error throwing pattern from hooks
- [ ] Error message format matches existing patterns
- [ ] JSDoc style matches FormStackProvider conventions
- [ ] Development check is before production validation
- [ ] useCallback dependencies unchanged
- [ ] No unnecessary code changes (only popToIndex modified)

### Documentation & Deployment

- [ ] JSDoc includes @param with bounds specification
- [ ] JSDoc includes @throws with "In development mode" qualifier
- [ ] Error message explains both the problem and current state
- [ ] Code is self-documenting with clear comments

---

## Anti-Patterns to Avoid

- **DON'T** replace existing validation - add before it, not instead of it
- **DON'T** change the production behavior - silent return must remain
- **DON'T** forget to document @throws in JSDoc
- **DON'T** use vague error messages - include both index and stack length
- **DON'T** modify useCallback dependencies - they don't change
- **DON'T** throw in production - that would crash end-user applications
- **DON'T** use TypeError instead of RangeError - RangeError is for bounds
- **DON'T** skip JSDoc - future developers need to know about dev-only behavior
- **DON'T** modify other functions - only touch popToIndex
- **DON'T** add tests here - P1.M3.T1.S2 will add comprehensive tests

---

## Output Specification

### Deliverable Files

```bash
src/components/FormStackProvider.tsx  # MODIFIED
```

### Exact Changes to FormStackProvider.tsx

**Location**: Lines 104-136 (popToIndex function)

**Add before line 105** (development check):
```typescript
if (process.env.NODE_ENV === 'development') {
  if (index < 0 || index >= state.stack.length) {
    throw new RangeError(
      `popToIndex: Invalid index ${index}. Stack length is ${state.stack.length}.`
    );
  }
}
```

**Add before line 104** (JSDoc comment):
```typescript
/**
 * Navigates to a specific form in the stack by index.
 * All forms after the target index are cancelled (resolved with undefined).
 * Used by Breadcrumbs component for direct navigation.
 *
 * @param index - Zero-based index of the target form. Must be >= 0 and < stack.length.
 * @throws {RangeError} In development mode, when index is negative or >= stack.length.
 *                      Production silently ignores invalid indices (graceful degradation).
 */
```

**Preserve unchanged**: Lines 105-136 (existing implementation)

### Modified popToIndex Function (Complete)

```typescript
/**
 * Navigates to a specific form in the stack by index.
 * All forms after the target index are cancelled (resolved with undefined).
 * Used by Breadcrumbs component for direct navigation.
 *
 * @param index - Zero-based index of the target form. Must be >= 0 and < stack.length.
 * @throws {RangeError} In development mode, when index is negative or >= stack.length.
 *                      Production silently ignores invalid indices (graceful degradation).
 */
const popToIndex = useCallback(async (index: number) => {
  // Development-mode error throwing for debugging
  if (process.env.NODE_ENV === 'development') {
    if (index < 0 || index >= state.stack.length) {
      throw new RangeError(
        `popToIndex: Invalid index ${index}. Stack length is ${state.stack.length}.`
      );
    }
  }

  // Validate index bounds
  if (index < 0 || index >= state.stack.length) {
    return;
  }

  // Get forms that will be cancelled
  const formsToCancel = state.stack.slice(index + 1);

  // Check if any require confirmation
  const formsNeedingConfirmation = formsToCancel.filter(e => e.confirmOnCancel);

  if (formsNeedingConfirmation.length > 0) {
    const confirmed = await requestConfirmation(
      formsNeedingConfirmation.map(f => f.label ?? f.id)
    );
    if (!confirmed) {
      return; // User cancelled, don't proceed
    }
  }

  // Cancel all forms after the target index (resolve with undefined)
  // Iterate in reverse to maintain correct order
  for (let i = state.stack.length - 1; i > index; i--) {
    const entry = state.stack[i];
    if (entry) {
      entry.deferred.resolve(undefined);
    }
  }

  // Dispatch the action to update stack
  dispatch({ type: 'POP_TO_INDEX', index });
}, [state.stack, requestConfirmation]);
```

---

## Confidence Assessment

**Score: 10/10**

**Why maximum confidence:**
- Single file modification with exact line numbers specified
- Complete code provided (copy-paste ready)
- Existing pattern to follow (useFormStackState error throwing)
- No new dependencies or imports needed
- No architecture changes required
- TypeScript types already exist
- Validation commands are standard (type-check, test, build)
- Risk is minimal - only adding code, not changing existing behavior in production
- All edge cases documented (negative index, out-of-bounds, production vs development)

**Potential risks (all mitigated):**
- Risk: Breaking existing tests
  - Mitigation: Production behavior unchanged, tests should pass
- Risk: URL sync hook's popToIndex(-1) call
  - Mitigation: This is correct - exposes existing bug to be fixed
- Risk: JSDoc formatting inconsistency
  - Mitigation: Exact format provided, matches existing patterns

---

## Success Metrics

**Completion Criteria:**
1. Development-mode check added to popToIndex function
2. RangeError thrown with descriptive message for invalid indices
3. JSDoc comment documents dev-only error throwing behavior
4. TypeScript compilation passes with zero errors
5. All existing tests pass
6. Production build succeeds

**Quality Criteria:**
1. Error message matches format: `popToIndex: Invalid index ${index}. Stack length is ${state.stack.length}.`
2. JSDoc includes @throws with "In development mode" qualifier
3. Code follows existing error throwing patterns in codebase
4. Production behavior is unchanged (graceful degradation)
5. Development mode provides immediate, actionable feedback

**Next Step:**
After completing this implementation, proceed to **P1.M3.T1.S2: Add test for popToIndex error handling** to verify the dev-only error throwing behavior with proper test cases.

---

## Research References

### Internal Research

- **Existing Error Patterns**: `src/hooks/useFormStackState.ts`, `src/hooks/useFormStackActions.ts`
- **Consumer Usage**: `src/components/Breadcrumbs.tsx`, `src/hooks/useFormStackURLSync.ts`
- **Type Definitions**: `src/types/context.ts`
- **Development-Only Error Patterns**: `plan/docs/bugfix/P1M2T2S3/research/development_only_error_patterns.md`

### External Documentation

- **React Error Patterns**: [React.dev - useRef avoiding race conditions](https://react.dev/reference/react/useRef#avoiding-race-conditions-with-refs)
- **RangeError Documentation**: [MDN - RangeError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RangeError)
- **TypeScript Strict Mode**: [TypeScript - strict compiler option](https://www.typescriptlang.org/tsconfig#strict)
- **Development Build Patterns**: [Create React App - Adding Custom Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

### Related Work Items

- **P1.M3.T1.S2**: Add test for popToIndex error handling (depends on this task)
- **P1.M3.T2**: Clarify closeForm API Documentation (same milestone)
- **P1.M2.T2**: Race condition fixes (previous milestone, related to URL sync's popToIndex(-1) call)
