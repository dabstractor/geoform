# Product Requirement Prompt (PRP): Add development-mode warning for direct closeForm calls

**Work Item**: P1.M3.T2.S2
**Status**: Implementation Ready
**Confidence Score**: 9/10

---

## Goal

**Feature Goal**: Add a development-mode console warning to the `closeForm` function that alerts developers when they call `closeForm()` directly instead of using the recommended `onSubmit`/`onCancel` props pattern.

**Deliverable**: Enhanced `closeForm` function in `FormStackProvider.tsx` with development-mode console.warn that provides actionable guidance.

**Success Definition**:
- Development mode: `console.warn` displays when `closeForm()` is called directly (not via FormStackRenderer's internal `onClose` prop)
- Production mode: No warning, no performance impact (code tree-shaken)
- Test suite validates both development and production behavior
- Warning message is clear, actionable, and includes usage examples

---

## User Persona

**Target User**: Developer integrating the geoform library into their application.

**Use Case**: A developer calls `useFormStack().closeForm()` directly within a form component, bypassing the Promise resolution pattern.

**User Journey**:
1. Developer creates a form component using `FormProps<Data>` interface
2. Instead of calling `onSubmit(data)` or `onCancel()`, developer directly calls `closeForm()`
3. In development mode, console warning appears explaining the issue
4. Developer updates code to use `onSubmit`/`onCancel` props correctly

**Pain Points Addressed**:
- **Silent API misuse**: Direct `closeForm()` calls break the Promise pattern but don't error
- **Uncorrected behavior**: Parent awaiting `openForm()` Promise hangs indefinitely
- **Documentation gap**: Even with JSDoc (from P1.M3.T2.S1), runtime feedback helps catch mistakes

---

## Why

**Business value and user impact**:
- Prevents a common API misuse pattern that breaks Promise-based form resolution
- Provides runtime feedback complementary to compile-time JSDoc documentation
- Follows React 19 best practices for development-mode feedback
- Zero production cost (tree-shaken in builds)

**Integration with existing features**:
- Builds on enhanced JSDoc from P1.M3.T2.S1
- Follows the same development-mode pattern as `popToIndex` error from P1.M3.T1.S1
- Consistent with React 19's `console.warn` patterns for API feedback

**Problems this solves**:
- **Problem**: Developers calling `closeForm()` directly causes parent's `await openForm()` to hang
- **Solution**: Development warning guides developers to use `onSubmit`/`onCancel` props
- **Scope**: This is a non-breaking addition - existing code continues to work, with added guidance

---

## What

Add a development-mode `console.warn` to `closeForm()` that fires when the function is called. The warning should:

1. **Check environment**: Only warn in development mode (`process.env.NODE_ENV === 'development'`)
2. **Provide guidance**: Explain that `onSubmit`/`onCancel` should be used instead
3. **Include examples**: Show the recommended pattern
4. **Avoid spam**: Consider warning deduplication (optional but recommended)

### Success Criteria

- [ ] `closeForm()` displays console.warn in development mode when called
- [ ] No warning appears in production mode
- [ ] Warning message includes clear guidance and code examples
- [ ] Test suite validates both development and production behavior
- [ ] Implementation follows the established `popToIndex` pattern from P1.M3.T1.S1
- [ ] No performance impact in production (verified via tree-shaking)

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: Yes. This PRP provides:
- Exact file locations and line numbers
- Complete code patterns to follow
- Test framework setup
- Validation commands
- External documentation URLs

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/components/FormStackProvider.tsx
  why: Contains the closeForm implementation to modify (lines 99-101)
  pattern: The useCallback pattern for closeForm that needs enhancement
  gotcha: closeForm is simple - just dispatches POP_FORM action. No Promise logic.

- file: src/components/FormStackProvider.tsx
  why: Contains the popToIndex development-mode pattern to follow (lines 114-120)
  pattern: if (typeof process !== "undefined" && process.env?.NODE_ENV === 'development')
  gotcha: Use typeof check for SSR safety, then console.warn not throw (different from popToIndex)

- file: src/hooks/useFormStack.ts
  why: Contains enhanced JSDoc from P1.M3.T2.S1 that explains the closeForm pattern (lines 24-90)
  pattern: Comprehensive JSDoc with DISCOURAGED/RECOMMENDED/VALID examples
  gotcha: The JSDoc already warns about direct usage - this adds runtime feedback

- file: src/components/__tests__/FormStackProvider.test.tsx
  why: Contains test patterns for development-mode behavior (popToIndex tests)
  pattern: beforeEach with vi.stubEnv, vi.spyOn on console, describe blocks for dev/prod
  gotcha: Tests need both environment setup AND console.warn spy

- url: https://react.dev/warnings
  why: React's official warning patterns and best practices
  critical: React 19 changed from console.error to console.warn for warnings

- url: https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/utils.ts
  why: React Router's invariant and warning patterns (productionError, warning)
  critical: Shows real-world implementation of development warnings with deduplication

- url: https://github.com/facebook/react
  why: Search for "console.warn" to see React's internal warning patterns
  critical: Uses Set-based deduplication to prevent warning spam

- docfile: plan/research/external-best-practices-development-warnings.md
  why: External research on warning patterns from major React libraries
  section: Complete implementation guide with code templates

- docfile: plan/bugfix/architecture/system_context.md
  why: Contains React 19 specific context and development pattern guidance
  section: React 19 Changes and Development Patterns Already Implemented
```

### Current Codebase tree

```bash
geoform/
├── src/
│   ├── components/
│   │   ├── FormStackProvider.tsx       # MODIFY: closeForm function (lines 99-101)
│   │   └── __tests__/
│   │       ├── FormStackProvider.test.tsx  # MODIFY: Add closeForm warning tests
│   │       └── ...
│   ├── hooks/
│   │   ├── useFormStack.ts             # REFERENCE: Enhanced JSDoc from P1.M3.T2.S1
│   │   └── __tests__/
│   │       └── ...
│   └── types/
│       └── context.ts                  # REFERENCE: FormStackActions interface
├── plan/
│   └── bugfix/
│       ├── P1M3T2S2/                   # WORK ITEM DIRECTORY
│       │   └── PRP.md                  # THIS FILE
│       └── architecture/
│           └── system_context.md       # REFERENCE: React 19 context
└── vitest.config.ts                    # REFERENCE: Test configuration
```

### Desired Codebase tree with files to be added

```bash
# No new files - only modifications to existing files

MODIFIED:
├── src/components/FormStackProvider.tsx        # Add console.warn to closeForm
└── src/components/__tests__/FormStackProvider.test.tsx  # Add tests for warning
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Environment check must be SSR-safe
// Pattern from popToIndex (FormStackProvider.tsx:114):
if (typeof process !== "undefined" && process.env?.NODE_ENV === 'development') {
  // Development-only code here
}

// CRITICAL: closeForm is different from popToIndex
// - popToIndex throws RangeError (fatal error)
// - closeForm should use console.warn (guidance, not fatal)
// - closeForm continues execution after warning (no return/throw)

// CRITICAL: Testing requires BOTH environment setups
// The codebase uses a two-step approach:
vi.stubEnv('NODE_ENV', 'development');      // For import.meta.env
if (process?.env) {
  process.env.NODE_ENV = 'development';     // For source code checks
}

// CRITICAL: Console spy pattern for warnings
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
// Later: expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('...'));

// GOTCHA: Tree-shaking relies on process.env.NODE_ENV checks
// Production builds will remove the entire if block (zero runtime cost)
// Verify: Check production bundle doesn't contain warning string literals

// GOTCHA: closeForm is called by FormStackRenderer internally
// The warning may fire on "legitimate" internal calls
// CONTRACT NOTE: "Wrap in check to avoid warning on first call (let consumer decide)"
// This means: DON'T suppress internal calls - let all calls show warning
// The developer decides if the warning is applicable to their use case

// PATTERN: Existing popToIndex uses throw, closeForm uses warn
// popToIndex: Invalid input = throw RangeError (fatal error)
// closeForm: Potentially misused = console.warn (guidance)
```

---

## Implementation Blueprint

### Data models and structure

No new data models required. This enhancement adds only:
- Development-mode console.warn in `closeForm` function
- Test coverage for the warning behavior

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/components/FormStackProvider.tsx
  - LOCATION: closeForm function at lines 99-101
  - ADD: Development-mode console.warn before dispatch
  - FOLLOW pattern: popToIndex environment check (lines 114-120)
  - PATTERN:
    ```typescript
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
  - GOTCHA: Use console.warn not throw (different from popToIndex pattern)
  - GOTCHA: No deduplication - let every call warn (contract: "let consumer decide")

Task 2: MODIFY src/components/__tests__/FormStackProvider.test.tsx
  - ADD: New describe block for closeForm development warning
  - FOLLOW pattern: popToIndex development mode tests (existing in same file)
  - PATTERN:
    ```typescript
    describe('closeForm', () => {
      describe('development mode', () => {
        let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

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

        it('should warn when closeForm is called directly', async () => {
          const { result } = renderHook(() => useFormStackWithActions(), { wrapper });
          result.current.closeForm();
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining('closeForm() was called directly')
          );
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining('use onSubmit/onCancel props instead')
          );
        });
      });

      describe('production mode', () => {
        beforeEach(() => {
          vi.stubEnv('NODE_ENV', 'production');
          if (process?.env) {
            process.env.NODE_ENV = 'production';
          }
        });

        it('should not warn when closeForm is called', () => {
          const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
          const { result } = renderHook(() => useFormStackWithActions(), { wrapper });
          result.current.closeForm();
          expect(consoleWarnSpy).not.toHaveBeenCalled();
          consoleWarnSpy.mockRestore();
        });
      });
    });
    ```
  - DEPENDENCIES: Task 1 must be complete
  - PLACEMENT: Add after existing popToIndex tests

Task 3: VALIDATE tree-shaking effectiveness (optional but recommended)
  - RUN: npm run build (or project's build command)
  - VERIFY: Search production bundle for warning message text
  - EXPECT: Warning text should NOT appear in production bundle
  - COMMAND: grep -r "closeForm() was called directly" dist/
  - GOTCHA: Bundle may have different location, adjust command

Task 4: RUN full test suite
  - COMMAND: npm test (or vitest depending on project setup)
  - VERIFY: All existing tests still pass
  - VERIFY: New closeForm warning tests pass
  - EXPECT: No regressions in existing functionality
```

### Implementation Patterns & Key Details

```typescript
// ------------------------------------------------------------
// PATTERN 1: SSR-safe environment check
// ------------------------------------------------------------
// Location: src/components/FormStackProvider.tsx
// Pattern from: popToIndex (lines 114-120)

const closeForm = useCallback(() => {
  // PATTERN: Check process exists before accessing (SSR safety)
  if (typeof process !== "undefined" && process.env?.NODE_ENV === 'development') {
    // Development-only warning code here
    // Entire block gets tree-shaken in production builds
  }

  // Original implementation continues
  dispatch({ type: 'POP_FORM' });
}, []);

// ------------------------------------------------------------
// PATTERN 2: Console warning with actionable guidance
// ------------------------------------------------------------
// Follow React's warning structure: What + Why + How + Examples

console.warn(
  // WHAT: Clear statement of the issue
  'closeForm() was called directly. ' +

  // WHY: What the correct pattern is
  'Most forms should use onSubmit/onCancel props instead. ' +

  // WHEN: When direct usage is appropriate
  'Use closeForm() only for programmatic closure from outside the form stack.\n\n' +

  // EXAMPLES: Code showing discouraged and recommended patterns
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

// ------------------------------------------------------------
// PATTERN 3: Testing development warnings with Vitest
// ------------------------------------------------------------
// Location: src/components/__tests__/FormStackProvider.test.tsx

// Environment setup (two-step for complete coverage)
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
  if (process?.env) {
    process.env.NODE_ENV = 'development';
  }
});

// Console spy setup
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Assertion with partial string matching
expect(consoleWarnSpy).toHaveBeenCalledWith(
  expect.stringContaining('closeForm() was called directly')
);

// Cleanup
afterEach(() => {
  vi.unstubAllEnvs();
  consoleWarnSpy.mockRestore();
});

// ------------------------------------------------------------
// GOTCHA: closeForm vs popToIndex differences
// ------------------------------------------------------------
// popToIndex: Throws RangeError (fatal error for invalid input)
if (process.env.NODE_ENV === 'development') {
  throw new RangeError('Invalid index');
}

// closeForm: Uses console.warn (guidance, not fatal)
if (process.env.NODE_ENV === 'development') {
  console.warn('Usage guidance');
  // Function continues execution - no return/throw
}
```

### Integration Points

```yaml
MODIFIED_FILES:
  - file: src/components/FormStackProvider.tsx
    location: closeForm function (lines 99-101)
    change: Add development-mode console.warn
    scope: Local change, no external dependencies

  - file: src/components/__tests__/FormStackProvider.test.tsx
    location: After existing popToIndex tests
    change: Add new describe block for closeForm warning tests
    scope: Test file only, no production code

NO_CHANGES_TO:
  - src/hooks/useFormStack.ts (JSDoc already complete from P1.M3.T2.S1)
  - src/types/context.ts (interface already documented)
  - src/components/FormStackRenderer.tsx (internal caller)
  - Any other files
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file modification - fix before proceeding
npx tsc --noEmit                    # TypeScript type checking
npx eslint src/components/FormStackProvider.tsx --fix  # Lint and auto-fix
npx eslint src/components/__tests__/FormStackProvider.test.tsx --fix

# Project-wide validation
npx tsc --noEmit
npx eslint src/ --fix
npm run format  # If project has formatting script

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.

# GOTCHA: This project uses Vitest, not Jest
# Use vitest.config.ts for test configuration
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the specific changes
npm test -- FormStackProvider.test.tsx  # Run only FormStackProvider tests
npm test -- -t "closeForm"              # Run only closeForm-related tests

# Full test suite for affected area
npm test -- src/components/__tests__/  # All component tests

# Watch mode for rapid iteration
npm test -- --watch

# Coverage validation (if coverage is configured)
npm test -- --coverage

# Expected: All tests pass. If failing, debug root cause and fix implementation.

# SPECIFIC TEST CASES TO VERIFY:
# 1. Development mode: closeForm() triggers console.warn
# 2. Production mode: closeForm() does NOT trigger console.warn
# 3. Warning message contains expected guidance text
# 4. Existing functionality: closeForm() still dispatches POP_FORM action
```

### Level 3: Integration Testing (System Validation)

```bash
# Service startup validation (if applicable)
npm run dev  # Start development server
# OR
npm run build && npm run preview  # Build and preview production build

# Manual testing in development mode:
# 1. Open browser DevTools console
# 2. Trigger closeForm() call in a form component
# 3. Verify warning appears in console
# 4. Verify warning includes code examples
# 5. Verify closeForm() still functions (form closes)

# Manual testing in production mode:
# 1. Build production bundle: npm run build
# 2. Run production server
# 3. Trigger closeForm() call
# 4. Verify NO warning in console
# 5. Verify closeForm() still functions (form closes)

# Tree-shaking verification (production build check):
npm run build
grep -r "closeForm() was called directly" dist/
# Expected: No matches (warning text tree-shaken)

# Expected: All integrations working, proper console output, no regressions.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# React 19 Specific Validation:

# 1. Verify React 19 console.warn pattern compliance
# React 19 uses console.warn for warnings (not console.error)
# Check that implementation uses console.warn

# 2. Test with React 19 concurrent features (if used)
# Verify warning works correctly with startTransition, useDeferredValue, etc.

# 3. Check React DevTools integration
# Warning should appear in React DevTools console

# Performance Testing:

# 4. Development mode performance impact
# Measure closeForm() execution time with warning
# Should be negligible (< 1ms for console.warn)

# 5. Production mode performance verification
# Build production bundle and verify:
# - No warning code in bundle
# - No runtime overhead
# - Bundle size unchanged (except for negligible source code diff)

# Regression Testing:

# 6. Test all closeForm usage scenarios
# - Direct call from parent component (VALID use case - should warn)
# - Call from FormStackRenderer (internal - should warn)
# - Call within form component (DISCOURAGED - should warn)
# - Multiple rapid calls (warning should appear each time)

# 7. Test interaction with popToIndex
# Verify both development-mode patterns work independently

# Documentation Validation:

# 8. Verify warning message matches JSDoc guidance
# The console warning should reinforce what JSDoc says
# Both should point to onSubmit/onCancel pattern

# Expected: All creative validations pass, patterns match React 19 best practices.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm test`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint errors: `npx eslint src/`
- [ ] No formatting issues: `npm run format` (if applicable)

### Feature Validation

- [ ] Development mode: `console.warn` appears when `closeForm()` is called
- [ ] Production mode: No warning appears
- [ ] Warning message contains clear guidance about onSubmit/onCancel
- [ ] Warning message includes code examples
- [ ] Existing functionality preserved: `closeForm()` still dispatches POP_FORM
- [ ] Tree-shaking verified: Warning code not in production bundle

### Code Quality Validation

- [ ] Follows existing `popToIndex` development-mode pattern
- [ ] SSR-safe environment check (`typeof process !== "undefined"`)
- [ ] Console.warn not throw (appropriate for usage guidance)
- [ ] No warning deduplication (per contract: "let consumer decide")
- [ ] File placement matches existing codebase structure
- [ ] JSDoc already enhanced (from P1.M3.T2.S1) - no changes needed

### Documentation & Deployment

- [ ] Warning message aligns with existing JSDoc in `useFormStack.ts`
- [ ] Warning message aligns with documentation in `context.ts`
- [ ] Test documentation is clear about expected behavior
- [ ] No breaking changes to existing API
- [ ] Zero production performance impact (tree-shaking verified)

---

## Anti-Patterns to Avoid

- ❌ **Don't use `throw`** - This is guidance, not a fatal error like `popToIndex`
- ❌ **Don't add deduplication** - Contract says "let consumer decide" about warning frequency
- ❌ **Don't skip SSR safety check** - Must use `typeof process !== "undefined"` pattern
- ❌ **Don't modify `onClose` prop** - FormStackRenderer's internal calls should also warn (let consumer interpret)
- ❌ **Don't change function signature** - closeForm remains `() => void`
- ❌ **Don't add conditional logic** - Always warn in development, don't try to detect "valid" vs "invalid" calls
- ❌ **Don't use `console.error`** - React 19 uses `console.warn` for warnings, use that pattern
- ❌ **Don't forget cleanup in tests** - Always restore console spy and unstub envs
- ❌ **Don't skip production verification** - Actually build and check bundle for tree-shaking
- ❌ **Don't modify JSDoc** - Already enhanced in P1.M3.T2.S1, this PRP only adds runtime warning

---

## Appendix: External Research URLs

### React Documentation
- **React Warnings Reference**: https://react.dev/warnings
- **React 19 Release Notes**: https://react.dev/blog/2024/12/05/react-19

### Library Implementation Examples
- **React Router utils.ts**: https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/utils.ts
- **Redux Toolkit devModeChecks**: https://github.com/reduxjs/redux-toolkit/blob/master/src/utils/devModeChecks.ts
- **React Query useQuery**: https://github.com/TanStack/query/blob/main/packages/react-query/src/useQuery.ts
- **React Source (search console.warn)**: https://github.com/facebook/react

### Build Tools
- **Vite Environment Modes**: https://vite.dev/guide/env-and-mode.html
- **TypeScript JSDoc**: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html

### Project-Specific Documentation
- **External Best Practices Research**: `plan/research/external-best-practices-development-warnings.md`
- **System Context**: `plan/bugfix/architecture/system_context.md`
- **React 19 Console Patterns**: `plan/bugfix/P1M3T2S1/research/react-19-console-warn-patterns.md`

---

**PRP Version**: 1.0
**Last Updated**: 2026-01-11
**Status**: Ready for Implementation
**Estimated Implementation Complexity**: Low (single function modification + tests)
