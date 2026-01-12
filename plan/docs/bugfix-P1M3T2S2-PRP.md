# Product Requirement Prompt (PRP): Add Development-Mode Warning for Direct closeForm Calls

---

## Goal

**Feature Goal**: Add a development-mode warning when `closeForm()` is called directly, educating developers to use `onSubmit`/`onCancel` props instead for proper form lifecycle management.

**Deliverable**: Enhanced `closeForm` function with development-mode `console.warn` that provides educational feedback about the correct usage pattern, including code examples showing discouraged vs. recommended approaches.

**Success Definition**:
- Development mode: `console.warn` appears when `closeForm()` is called
- Warning message explains the recommended pattern (`onSubmit`/`onCancel` props)
- Warning includes code examples showing both discouraged and recommended usage
- Production mode: No warning appears (development-only code)
- Tests verify warning behavior in both development and production modes
- Tests verify "no deduplication" - warning appears on each call (lets consumer decide frequency)

---

## User Persona

**Target User**: Developer integrating the geoform library who may accidentally call `closeForm()` directly within form components instead of using the proper `onSubmit`/`onCancel` lifecycle pattern.

**Use Case**: A developer is building a form component and wants to close it after submission. They might be tempted to call `closeForm()` directly after handling their data, but this bypasses the Promise resolution pattern and can lead to hanging promises.

**User Journey**:
1. Developer creates form component with `closeForm` prop from `useFormStack`
2. Developer calls `closeForm()` after form submission
3. In development mode, console warning appears explaining the anti-pattern
4. Developer refactors to use `onSubmit` prop instead
5. FormStackRenderer properly handles closure and Promise resolution

**Pain Points Addressed**:
- Silent anti-pattern: Direct `closeForm()` calls work but cause Promise-related issues
- Unclear API: Without warning, developers don't realize they're using the API incorrectly
- Debugging difficulty: Hanging promises from improper `closeForm` usage are hard to trace

---

## Why

- **API Clarity**: Educates developers about the correct form lifecycle pattern
- **Prevent Bugs**: Direct `closeForm()` calls bypass Promise resolution, causing hanging promises
- **Development Experience**: Immediate feedback in development prevents production issues
- **Self-Documenting Code**: Warning message serves as inline documentation
- **Follows React Patterns**: Similar to React's development-only warnings for deprecated APIs
- **Builds on P1.M3.T2.S1**: Complements the enhanced JSDoc documentation with runtime feedback

---

## What

### Success Criteria

- [ ] `closeForm` function includes development-mode check before `console.warn`
- [ ] Warning message explains: "Most forms should use onSubmit/onCancel props instead"
- [ ] Warning message includes "DISCOURAGED" code example showing direct `closeForm()` call
- [ ] Warning message includes "RECOMMENDED" code example showing `onSubmit` usage
- [ ] Production mode: No warning appears (code is tree-shaken)
- [ ] Test verifies warning appears in development mode
- [ ] Test verifies warning includes expected message content
- [ ] Test verifies warning includes code examples (DISCOURAGED/RECOMMENDED)
- [ ] Test verifies "no deduplication" - warning appears on each call
- [ ] Test verifies no warning in production mode

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact implementation of `closeForm` with development-mode warning (already complete)
- Exact test patterns for `console.warn` verification (already complete)
- NODE_ENV mocking patterns used in the codebase
- Console warning suppression/spy patterns for testing
- The actual implementation is already done - this PRP documents it

### Documentation & References

```yaml
# MUST READ - closeForm implementation with development-mode warning
- file: src/components/FormStackProvider.tsx
  why: Contains the closeForm function with development-mode console.warn
  lines: 99-121
  pattern: Development-mode check: `if (typeof process !== "undefined" && process.env?.NODE_ENV === 'development')`
  critical: |
    The function warns on EVERY call (no deduplication)
    Warning includes detailed message with code examples
    Shows DISCOURAGED pattern (direct closeForm call in form)
    Shows RECOMMENDED pattern (use onSubmit prop)

# MUST READ - Tests for closeForm development warning
- file: src/components/__tests__/FormStackProvider.test.tsx
  why: Shows comprehensive test patterns for console.warn verification
  lines: 121-186
  pattern: Uses vi.spyOn(console, 'warn') to verify warning appears
  gotcha: Test at lines 160-167 verifies "no deduplication" - warns on each call
  critical: |
    beforeEach sets NODE_ENV to 'development'
    afterEach restores with vi.unstubAllEnvs()
    Uses vi.spyOn(console, 'warn') for warning verification
    Production mode test verifies no warning appears

# MUST READ - Related implementation: popToIndex development-mode error
- file: src/components/FormStackProvider.tsx
  why: Shows similar development-mode pattern for error throwing (P1.M3.T1.S1)
  lines: 132-140
  pattern: Same environment check: `typeof process !== "undefined" && process.env?.NODE_ENV === 'development'`
  gotcha: popToIndex throws errors, closeForm only warns

# MUST READ - closeForm JSDoc from P1.M3.T2.S1
- file: src/hooks/useFormStack.ts
  why: Contains comprehensive JSDoc explaining when NOT to use closeForm
  lines: 24-95
  pattern: Detailed documentation with @remarks sections
  critical: |
    Explains: forms should use onSubmit/onCancel props
    Direct use cases: programmatic closure from outside form stack
    Promise Pattern Bypass Warning section

# MUST READ - Testing best practices
- docfile: plan/docs/architecture/testing_best_practices.md
  why: Contains testing patterns for console.warn verification
  section: "1.2 Best Practice: Suppress Console Error During Tests"
  critical: |
    Use vi.spyOn(console, 'warn') for warning verification
    Use mockImplementation(() => {}) to suppress output during tests
    Always restore with mockRestore() in afterEach

# EXTERNAL DOCUMENTATION - Specific URLs
- url: https://react.dev/reference/react/useReducer
  why: React useReducer documentation for understanding reducer-based state management
  critical: closeForm dispatches POP_FORM action to reducer

- url: https://vitest.dev/api/vi#spyon
  why: Official Vitest documentation on vi.spyOn() for console spying
  critical: Use vi.spyOn(console, 'warn').mockImplementation(() => {})

- url: https://vitest.dev/api/expect#tohavebeencalledwith
  why: Official Vitest documentation on toHaveBeenCalledWith() for message verification
  critical: Use expect.stringContaining() for partial message matching

- url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else
  why: MDN documentation on conditional statements for development-mode checks
  critical: process.env.NODE_ENV check pattern
```

### Current Codebase Tree

```bash
src/
├── components/
│   ├── FormStackProvider.tsx           # Contains closeForm with development-mode warning (lines 99-121)
│   ├── FormStackRenderer.tsx           # Calls closeForm via onClose prop after resolving promises
│   ├── ConfirmationDialog.tsx
│   ├── FormErrorBoundary.tsx
│   ├── index.ts
│   └── __tests__/
│       ├── FormStackProvider.test.tsx  # Contains closeForm warning tests (lines 121-186)
│       │   # Lines 121-186: "closeForm development warning" describe block
│       │   # Lines 122-136: beforeEach with console.warn spy
│       │   # Lines 138-147: Development mode test
│       │   # Lines 149-158: Code examples test
│       │   # Lines 160-167: No deduplication test
│       │   # Lines 170-185: Production mode test
│       ├── FormErrorBoundary.test.tsx
│       └── FormStackRenderer.test.tsx
├── hooks/
│   ├── useFormStack.ts                 # Contains closeForm JSDoc from P1.M3.T2.S1
│   ├── useFormStackState.ts
│   └── useFormStackActions.ts
├── context/
│   ├── FormStackContext.ts
│   └── formStackReducer.ts             # Handles POP_FORM action
└── types/
    └── index.ts

plan/bugfix/P1M3T2S2/
├── PRP.md                              # This file
└── research/                           # External research (to be populated)
```

### Desired Codebase Tree After Implementation

```bash
# No changes needed - implementation is complete

# Current state (lines 99-121 of FormStackProvider.tsx):
const closeForm = useCallback(() => {
  // Development-mode usage warning
  if (typeof process !== "undefined" && process.env?.NODE_ENV === 'development') {
    console.warn(
      'closeForm() was called directly. Most forms should use onSubmit/onCancel props instead. ' +
      'Use closeForm() only for programmatic closure from outside the form stack.\n\n' +
      'Example (DISCOURAGED - direct call in form):\n' +
      '  function MyForm({ closeForm }) {\n' +
      '    const handleSave = () => {\n' +
      '      onSubmit(data);\n' +
      '      closeForm(); // DON\'T DO THIS\n' +
      '    };\n' +
      '  }\n\n' +
      'Example (RECOMMENDED - use onSubmit):\n' +
      '  function MyForm({ onSubmit }) {\n' +
      '    const handleSave = () => {\n' +
      '      onSubmit(data); // FormStackRenderer handles closure\n' +
      '    };\n' +
      '  }'
    );
  }
  dispatch({ type: 'POP_FORM' });
}, []);
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Use typeof process check for browser compatibility
// In browser environments, 'process' may not be defined
if (typeof process !== "undefined" && process.env?.NODE_ENV === 'development') {
  // Development-only code
}

// CRITICAL: Use optional chaining (?.) for safe environment access
// process.env might be undefined in some environments
process.env?.NODE_ENV === 'development'

// GOTCHA: closeForm dispatches POP_FORM action
// The reducer handles the actual stack manipulation
dispatch({ type: 'POP_FORM' });

// CRITICAL: Warning appears on EVERY call (no deduplication)
// This is intentional - lets consumer decide about warning frequency
// Test at lines 160-167 verifies this behavior
result.current.closeForm();
result.current.closeForm();
result.current.closeForm();
// Expect: console.warn called 3 times

// GOTCHA: closeForm bypasses Promise resolution
// Forms should use onSubmit/onCancel so FormStackRenderer can resolve promises
// Direct closeForm calls leave the parent's await hanging indefinitely

// CRITICAL: FormStackRenderer calls closeForm via onClose prop
// This is the "internal" call pattern that should still show warning
// The warning educates developers regardless of call context

// CRITICAL: Testing requires both vi.stubEnv() and process.env assignment
// vi.stubEnv() only sets import.meta.env, but source code checks process.env
vi.stubEnv('NODE_ENV', 'development');
if (process?.env) {
  process.env.NODE_ENV = 'development';
}

// CRITICAL: Use vi.spyOn for console verification in tests
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
// ... run tests ...
consoleWarnSpy.mockRestore();

// CRITICAL: Use expect.stringContaining() for partial message matching
expect(consoleWarnSpy).toHaveBeenCalledWith(
  expect.stringContaining('closeForm() was called directly')
);

// GOTCHA: useCallback with empty dependency array
// closeForm is stable - doesn't depend on any external values
const closeForm = useCallback(() => {
  // ...
}, []); // Empty deps = stable reference
```

---

## Implementation Blueprint

### Data Models and Structure

No data models are created in this task. This enhances the existing `closeForm` function with development-mode feedback.

The `closeForm` function signature:
```typescript
closeForm: () => void;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: VERIFY closeForm function location and structure
  - CHECK: File exists at src/components/FormStackProvider.tsx
  - VERIFY: closeForm is a useCallback hook with empty dependency array
  - VERIFY: Function dispatches { type: 'POP_FORM' } action
  - OUTPUT: Confirmation of implementation location

Task 2: ADD development-mode environment check
  - IMPLEMENT: if (typeof process !== "undefined" && process.env?.NODE_ENV === 'development')
  - PLACEMENT: Before the dispatch({ type: 'POP_FORM' }) call
  - ENSURE: Check includes typeof guard for browser compatibility
  - ENSURE: Check includes optional chaining for safe property access

Task 3: ADD console.warn with educational message
  - IMPLEMENT: console.warn() with multi-line message
  - INCLUDE: Main explanation: "closeForm() was called directly. Most forms should use onSubmit/onCancel props instead."
  - INCLUDE: Context: "Use closeForm() only for programmatic closure from outside the form stack."
  - INCLUDE: Code examples showing DISCOURAGED pattern (direct closeForm call)
  - INCLUDE: Code examples showing RECOMMENDED pattern (onSubmit usage)
  - FORMAT: Use \n\n for section breaks, proper indentation for code examples

Task 4: VERIFY tree-shaking works correctly
  - ENSURE: Development code is wrapped in environment check
  - VERIFY: Production builds do not include console.warn
  - TEST: Run production build and verify warning is not present

Task 5: ADD development mode tests
  - IMPLEMENT: Describe block titled "closeForm development warning"
  - ADD: Nested describe block for "development mode"
  - ADD: beforeEach with console.warn spy and NODE_ENV setup
  - IMPLEMENT: Test "should warn when closeForm is called directly"
  - ASSERT: expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('closeForm() was called directly'))

Task 6: ADD code examples verification test
  - IMPLEMENT: Test "should include code examples in warning message"
  - ASSERT: Warning contains 'DISCOURAGED' string
  - ASSERT: Warning contains 'RECOMMENDED' string
  - VERIFY: Educational content is present

Task 7: ADD no deduplication test
  - IMPLEMENT: Test "should warn on each call (no deduplication)"
  - CALL: closeForm() three times in sequence
  - ASSERT: expect(consoleWarnSpy).toHaveBeenCalledTimes(3)
  - VERIFY: Intentional design - warning appears every time

Task 8: ADD production mode test
  - IMPLEMENT: Describe block for "production mode"
  - ADD: beforeEach setting NODE_ENV to 'production'
  - IMPLEMENT: Test "should not warn when closeForm is called"
  - ASSERT: expect(consoleWarnSpy).not.toHaveBeenCalled()

Task 9: VERIFY all tests pass
  - RUN: npm run test -- FormStackProvider.test.tsx
  - VERIFY: All 4 new tests pass
  - VERIFY: No regressions in existing tests
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Development-mode environment check (browser-safe)
if (typeof process !== "undefined" && process.env?.NODE_ENV === 'development') {
  // Development-only code (tree-shaken in production)
}

// PATTERN: Educational warning with code examples
console.warn(
  'closeForm() was called directly. Most forms should use onSubmit/onCancel props instead. ' +
  'Use closeForm() only for programmatic closure from outside the form stack.\n\n' +
  'Example (DISCOURAGED - direct call in form):\n' +
  '  function MyForm({ closeForm }) {\n' +
  '    const handleSave = () => {\n' +
  '      onSubmit(data);\n' +
  '      closeForm(); // DON\'T DO THIS\n' +
  '    };\n' +
  '  }\n\n' +
  'Example (RECOMMENDED - use onSubmit):\n' +
  '  function MyForm({ onSubmit }) {\n' +
  '    const handleSave = () => {\n' +
  '      onSubmit(data); // FormStackRenderer handles closure\n' +
  '    };\n' +
  '  }'
);

// PATTERN: useCallback for stable function reference
const closeForm = useCallback(() => {
  // ... implementation ...
}, []); // Empty deps = never recreates

// PATTERN: Console warning spy in tests
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
  if (process?.env) {
    process.env.NODE_ENV = 'development';
  }
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  consoleWarnSpy.mockRestore();
});

// PATTERN: Warning verification with partial matching
expect(consoleWarnSpy).toHaveBeenCalledWith(
  expect.stringContaining('closeForm() was called directly')
);
expect(consoleWarnSpy).toHaveBeenCalledWith(
  expect.stringContaining('use onSubmit/onCancel props instead')
);

// PATTERN: No deduplication test
it('should warn on each call (no deduplication)', () => {
  const { result } = renderHook(() => useFormStackWithActions(), { wrapper });
  result.current.closeForm();
  result.current.closeForm();
  result.current.closeForm();
  expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
});
```

### Integration Points

```yaml
FORMSTACK_PROVIDER:
  - file: src/components/FormStackProvider.tsx
  - location: closeForm useCallback hook (lines 99-121)
  - dispatches: { type: 'POP_FORM' } action

REDUCER:
  - file: src/context/formStackReducer.ts
  - action: POP_FORM removes last entry from stack
  - pattern: return { stack: state.stack.slice(0, -1) }

FORM_STACK_RENDERER:
  - file: src/components/FormStackRenderer.tsx
  - uses: onClose prop which is bound to closeForm
  - calls: onClose() after resolving promises (lines 54, 64, 69, 92)

HOOKS:
  - useFormStack.ts: Exports closeForm in return interface
  - useFormStackActions.ts: Exports closeForm separately
  - JSDoc: Enhanced in P1.M3.T2.S1 with usage guidelines

TESTS:
  - file: src/components/__tests__/FormStackProvider.test.tsx
  - location: Lines 121-186 (already complete)
  - pattern: vi.spyOn(console, 'warn') for verification
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run TypeScript check to verify implementation compiles
npm run type-check

# Expected: Zero errors
# If errors: Check environment check syntax, verify console.warn argument

# Run linting
npm run lint

# Expected: No linting errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run the closeForm warning tests
npm run test -- FormStackProvider.test.tsx -t "closeForm development warning"

# Expected output:
# ✓ FormStackProvider - closeForm development warning
#   ✓ development mode
#     ✓ should warn when closeForm is called directly
#     ✓ should include code examples in warning message
#     ✓ should warn on each call (no deduplication)
#   ✓ production mode
#     ✓ should not warn when closeForm is called

# Run all FormStackProvider tests
npm run test -- FormStackProvider.test.tsx

# Expected: All tests pass (including existing tests)
```

### Level 3: Manual Verification (Development Feedback)

```bash
# Create a test file to manually verify warning appears
cat > /tmp/test-closeform-warning.tsx << 'EOF'
import { FormStackProvider } from './src/components';
import { useFormStack } from './src/hooks/useFormStack';

function TestComponent() {
  const { closeForm } = useFormStack();

  return (
    <button onClick={closeForm}>
      Click me (check console for warning)
    </button>
  );
}

// In development mode, clicking the button should show the warning
EOF

# Build and check console output when clicking button
# Expected: Warning appears in browser console with full message
```

### Level 4: Production Build Verification (Tree-Shaking)

```bash
# Build production bundle
npm run build

# Check that console.warn is not in production build
grep -r "console.warn" dist/ || echo "No console.warn in production (expected)"

# Expected: No console.warn strings for closeForm in production output
# Development-mode code should be tree-shaken out
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run test -- FormStackProvider.test.tsx` passes (4 new tests)
- [ ] `npm run test` passes all tests (no regressions)
- [ ] `npm run build` succeeds without errors
- [ ] Production build does not include `console.warn` for closeForm
- [ ] Development build includes warning with full message

### Feature Validation

- [ ] Development mode: Warning appears when `closeForm()` is called
- [ ] Warning message contains: "closeForm() was called directly"
- [ ] Warning message contains: "use onSubmit/onCancel props instead"
- [ ] Warning includes "DISCOURAGED" code example
- [ ] Warning includes "RECOMMENDED" code example
- [ ] Production mode: No warning appears
- [ ] No deduplication: Warning appears on each call
- [ ] Environment check uses `typeof process` for browser safety
- [ ] Environment check uses optional chaining `?.`

### Code Quality Validation

- [ ] Implementation follows existing patterns (similar to popToIndex dev check)
- [ ] useCallback has correct dependency array (empty)
- [ ] Console.warn message is educational and actionable
- [ ] Code examples are properly formatted with \n and indentation
- [ ] Tests use `vi.spyOn(console, 'warn')` pattern
- [ ] Tests properly set both `vi.stubEnv()` and `process.env`
- [ ] Tests restore environment with `vi.unstubAllEnvs()`
- [ ] Tests use `expect.stringContaining()` for flexible matching

### Documentation & Deployment

- [ ] JSDoc from P1.M3.T2.S1 explains closeForm usage
- [ ] Runtime warning reinforces JSDoc documentation
- [ ] Warning message is self-documenting
- [ ] Code examples show concrete anti-pattern vs. recommended pattern
- [ ] Build successfully generates type declarations

---

## Anti-Patterns to Avoid

- ❌ Don't add deduplication logic - warning should appear on every call
- ❌ Don't use `console.error` - this is guidance, not an error condition
- ❌ Don't throw an exception - closeForm should still work
- ❌ Don't skip the `typeof process` check - breaks in browser
- ❌ Don't forget optional chaining `?.` on `process.env`
- ❌ Don't use exact string matching in tests - use `expect.stringContaining()`
- ❌ Don't forget `mockRestore()` in afterEach - causes test pollution
- ❌ Don't set only `vi.stubEnv()` - also set `process.env` directly
- ❌ Don't make warning conditional on call context - warn always
- ❌ Don't place warning after dispatch - must come before

---

## Confidence Score

**One-Pass Implementation Success Likelihood: 10/10**

**Rationale**:
- Implementation is **already complete** in FormStackProvider.tsx (lines 99-121)
- Tests are **already complete** in FormStackProvider.test.tsx (lines 121-186)
- Clear patterns from similar implementation (popToIndex dev-mode error)
- All validation commands are specific and executable
- This PRP documents existing work for reference

**Status Note**:
- This task appears to be already completed
- The implementation matches all requirements from bug_fix_tasks.json
- All tests pass successfully
- This PRP serves as documentation of the completed implementation

---

## Quick Start for Implementation

```bash
# The implementation is already complete. To verify:

# 1. Run the closeForm warning tests
npm run test -- FormStackProvider.test.tsx -t "closeForm development warning"

# Expected output:
# ✓ FormStackProvider - closeForm development warning
#   ✓ development mode
#     ✓ should warn when closeForm is called directly
#     ✓ should include code examples in warning message
#     ✓ should warn on each call (no deduplication)
#   ✓ production mode
#     ✓ should not warn when closeForm is called

# 2. Run full test suite to ensure no regressions
npm run test

# Expected: All tests pass

# 3. Verify production build excludes warning
npm run build
grep -r "closeForm() was called directly" dist/ || echo "Warning excluded from production (correct)"
```

**Expected total time**: 2 minutes to verify existing implementation.

---

## References Summary

### Internal Codebase Files
1. `src/components/FormStackProvider.tsx` - closeForm implementation with warning (lines 99-121)
2. `src/components/__tests__/FormStackProvider.test.tsx` - Tests for warning (lines 121-186)
3. `src/hooks/useFormStack.ts` - JSDoc documentation from P1.M3.T2.S1 (lines 24-95)
4. `src/context/formStackReducer.ts` - POP_FORM action handler
5. `plan/docs/architecture/testing_best_practices.md` - Testing patterns

### External Documentation URLs
1. https://react.dev/reference/react/useReducer - useReducer documentation
2. https://vitest.dev/api/vi#spyon - vi.spyOn() documentation
3. https://vitest.dev/api/expect#tohavebeencalledwith - toHaveBeenCalledWith() documentation
4. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else - Conditional statements

### Related PRPs
1. `plan/bugfix/P1M3T1S2/PRP.md` - Similar development-mode error testing (reference)
2. `plan/bugfix/P1M3T2S1/` - JSDoc enhancement for closeForm (dependency)

### Related Tasks
- **P1.M3.T2.S1** (Complete): Enhance closeForm JSDoc with usage guidelines
- **P1.M3.T1.S1** (Complete): Implement development-only error for invalid popToIndex

---

**PRP Version: 1.0**
**Created: 2025-01-12**
**For: Task P1.M3.T2.S2 - Add Development-Mode Warning for Direct closeForm Calls**
**Status: Implementation Complete** - This PRP documents the already-completed work
**Related: P1.M3.T2.S1 - Enhance closeForm JSDoc with Usage Guidelines**
