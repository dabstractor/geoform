# Product Requirement Prompt (PRP): Audit Error-Throwing Test Patterns in useFormStack.test.tsx

---

## Goal

**Feature Goal**: Conduct a comprehensive audit of error-throwing test patterns in `useFormStack.test.tsx` to identify all tests using `expect().toThrow()` without proper console.error suppression.

**Deliverable**: A detailed audit report documenting:
1. All test descriptions and line numbers where error suppression needs improvement
2. Current patterns vs. recommended patterns comparison
3. Specific recommendations for each affected test

**Success Definition**: Audit is complete when `plan_bugfix/P1M1T1S1/research/test_audit_notes.md` contains:
- A complete list of all error-throwing tests in `useFormStack.test.tsx`
- Line numbers for each affected test
- Specific recommendations (pattern to apply, code example)

## User Persona (if applicable)

**Target User**: Developer/QA engineer responsible for maintaining clean test output and ensuring test quality.

**Use Case**: The test suite currently produces noisy console.error output when running tests that intentionally throw errors (e.g., provider validation tests). This audit will identify all locations where console.error suppression needs to be added.

**User Journey**: Developer runs tests → Sees cluttered console.error output → Uses this audit report to identify specific fixes needed → Applies console.error suppression patterns → Tests run with clean output

**Pain Points Addressed**:
- Noisy test output obscures actual test failures
- Developers must visually filter through expected error messages
- CI/CD logs become difficult to parse
- Inconsistent patterns across test files

## Why

- **Clean test output**: React automatically logs errors to `console.error` (React 18) or `console.warn` (React 19) even when caught by error boundaries or expected in tests. This creates noisy output that obscures real failures.
- **Consistent patterns**: Some test files in this codebase already use proper console.error suppression (e.g., `FormErrorBoundary.test.tsx`, `FormStackRenderer.test.tsx`), while others do not.
- **Best practice compliance**: Following established patterns from React Testing Library, Vitest documentation, and community best practices.

## What

This is a **research/audit task** that produces documentation, not code changes.

### Scope

**IN SCOPE**:
- Audit `src/hooks/__tests__/useFormStack.test.tsx` only
- Identify all tests using `expect().toThrow()` or `expect(() => ...).toThrow()`
- Document current patterns and recommended patterns
- Produce audit notes in `plan_bugfix/architecture/test_audit_notes.md`

**OUT OF SCOPE** (this is task P1.M1.T1.S2):
- Actually implementing console.error suppression
- Modifying test files
- Running tests to verify fixes

### Success Criteria

- [ ] All error-throwing tests in `useFormStack.test.tsx` identified with line numbers
- [ ] Each test has documented recommendation for console.error suppression
- [ ] Audit report stored at `plan_bugfix/architecture/test_audit_notes.md`
- [ ] Report references the research files for context

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this audit successfully?

**Answer**: YES - This PRP provides:
- Exact file paths to audit
- Specific patterns to look for
- Code examples from within this codebase
- External research references with specific URLs
- Output format specification

### Documentation & References

```yaml
# MUST READ - Internal Codebase Patterns
- file: src/hooks/__tests__/useFormStack.test.tsx
  why: TARGET FILE FOR AUDIT - Contains error-throwing tests that need console.error suppression
  pattern: Look for expect().toThrow() patterns without beforeEach/afterEach console.error mocking
  gotcha: Line 61-67 has "should throw error from useFormStackState" test without suppression

- file: src/components/__tests__/FormErrorBoundary.test.tsx
  why: GOOD PATTERN EXAMPLE - Shows proper beforeEach/afterEach console.error suppression (lines 22-31)
  pattern: Uses vi.spyOn(console, 'error').mockImplementation(() => {}) pattern
  gotcha: This is the pattern to recommend for useFormStack tests

- file: src/components/__tests__/FormStackRenderer.test.tsx
  why: GOOD PATTERN EXAMPLE - Shows console.error suppression in error boundary integration tests (lines 217-226)
  pattern: Nested describe block with beforeEach/afterEach for error-throwing tests
  gotcha: Notice pattern: only suppress in describe blocks that actually throw errors

- file: src/hooks/__tests__/useFormStackState.test.tsx
  why: COMPARATIVE ANALYSIS - Has similar error-throwing tests (lines 41-46, 48-53) WITHOUT suppression
  pattern: Similar to useFormStack.test.tsx - both need same fix
  gotcha: These tests also produce console.error output

- file: src/hooks/__tests__/useFormStackURLSync.test.tsx
  why: COMPARATIVE ANALYSIS - Has error-throwing test (lines 310-314) WITHOUT suppression
  pattern: Same issue as useFormStack - should throw error when used outside FormStackProvider
  gotcha: Multiple hook test files have the same pattern issue

# MUST READ - External Research (stored in plan_bugfix/P1M1T1S1/research/)
- docfile: plan_bugfix/P1M1T1S1/research/vitest_error_suppression.md
  why: Complete Vitest console.error suppression patterns with code examples
  section: "Setup and Teardown Patterns" shows beforeEach/afterEach pattern
  critical: Use vi.spyOn() not vi.fn() - vi.spyOn() can be restored with mockRestore()

- docfile: plan_bugfix/P1M1T1S1/research/react_error_testing.md
  why: React-specific error testing patterns and React Testing Library recommendations
  section: "Common Patterns for Suppressing React's console.error During Error Testing"
  critical: React 18 uses console.error, React 19 uses console.warn - this project uses React 19

- docfile: plan_bugfix/P1M1T1S1/research/tothrow_patterns.md
  why: Best practices for expect().toThrow() with React hooks and context providers
  section: "Testing 'Must Be Used Within Provider' Errors"
  critical: Always suppress console.error when testing "must be used within provider" errors

# EXTERNAL DOCUMENTATION - Specific URLs with Section Anchors
- url: https://vitest.dev/guide/mocking
  why: Official Vitest mocking documentation - core concepts for vi.spyOn()
  critical: "Always remember to clear or restore mocks before or after each test run!"

- url: https://vitest.dev/api/vi
  why: Complete vi.* utility API reference - sections on vi.spyOn(), vi.restoreAllMocks()
  critical: Difference between clearAllMocks() and restoreAllMocks() - clear doesn't restore implementation

- url: https://testing-library.com/docs/react-testing-library/faq/#how-do-i-test-error-boundaries
  why: React Testing Library official guidance on error testing
  critical: Note about React 18 (console.error) vs React 19 (console.warn) behavior

- url: https://jshakespeare.com/react-error-boundary-testing-rtl/
  why: Clear, practical guide with code examples for error boundary testing
  critical: Shows the beforeEach/afterEach pattern with console.error replacement

- url: https://www.testingjavascript.com/lessons/react-hide-console-error-logs-when-testing-error-boundaries-with-jest-spyon
  why: Kent C. Dodds' dedicated lesson on suppressing console output (applies to Vitest too)
  critical: The recommended pattern that works across Jest and Vitest

- url: https://vitest.dev/api/expect.html
  why: Vitest expect API documentation - toThrow() matcher specifics
  critical: Understanding how toThrow() works with error messages

- url: https://kentcdodds.com/blog/how-to-use-react-context-effectively
  why: Kent C. Dodds on React Context best practices, including error testing
  critical: Context on when to throw errors for missing providers
```

### Current Codebase Tree

```bash
src/
├── components/
│   └── __tests__/
│       ├── FormErrorBoundary.test.tsx  # HAS console.error suppression (GOOD PATTERN)
│       └── FormStackRenderer.test.tsx  # HAS console.error suppression (GOOD PATTERN)
├── hooks/
│   └── __tests__/
│       ├── useFormStack.test.tsx       # TARGET FILE - needs audit
│       ├── useFormStackState.test.tsx  # Similar issue (lines 41-46, 48-53)
│       ├── useFormStackURLSync.test.tsx # Similar issue (lines 310-314)
│       └── useFormStackActions.test.tsx
└── __tests__/
    └── setup.test.tsx
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: React 19 uses console.warn for errors, not console.error
// Check package.json - this project uses React 19.0.0
// However, context validation errors still use console.error in React 19

// CRITICAL: This codebase uses Vitest, not Jest
// - Use vi.spyOn() not jest.spyOn()
// - Use vi.restoreAllMocks() not jest.restoreAllMocks()

// GOTCHA: FormErrorBoundary.test.tsx uses BOTH console.error patterns:
// 1. beforeEach/afterEach at file level (lines 25-31)
// 2. Nested describe blocks for error boundary tests
// The useFormStack.test.tsx file doesn't have EITHER pattern

// GOTCHA: The "must be used within provider" error comes from useFormStackState
// useFormStack is a composite hook that calls useFormStackState internally
// When testing useFormStack without provider, the error originates from the inner hook

// CRITICAL: Don't use vi.mock() for console - doesn't work properly for global objects
// From vitest_error_suppression.md: "vi.mock() is hoisted and doesn't work well for global objects like console"

// CRITICAL: Always use vi.restoreAllMocks() not vi.clearAllMocks()
// - clearAllMocks() only clears call history, doesn't restore implementations
// - restoreAllMocks() restores original implementations AND clears state
```

---

## Implementation Blueprint

### Data Models and Structure

This is an audit task - no data models are created.

The audit output will be a **Markdown document** with the following structure:

```markdown
# Test Audit Notes: Error-Throwing Patterns in useFormStack Tests

## Executive Summary
- Total tests audited: X
- Tests with error-throwing: Y
- Tests needing console.error suppression: Z

## Detailed Findings

### Test 1: [test description]
- **File**: src/hooks/__tests__/useFormStack.test.tsx
- **Line Numbers**: XX-YY
- **Current Pattern**: [code snippet]
- **Issue**: [description of why console.error is produced]
- **Recommended Pattern**: [code snippet from FormErrorBoundary.test.tsx]
- **Rationale**: [reference to external research]

## Recommended Implementation Order
[If implementing fixes, order by dependencies]

## References
- Links to research files
- Links to external documentation
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ and ANALYZE src/hooks/__tests__/useFormStack.test.tsx
  - IDENTIFY: All describe blocks and it() tests
  - FIND: All occurrences of expect().toThrow() or expect(() => ...).toThrow()
  - DOCUMENT: Test description, line numbers, current code
  - OUTPUT: Create list of affected tests in audit notes

Task 2: COMPARE with GOOD PATTERNS in existing codebase
  - READ: src/components/__tests__/FormErrorBoundary.test.tsx (lines 22-31, 217-226)
  - READ: src/components/__tests__/FormStackRenderer.test.tsx (lines 217-226)
  - EXTRACT: The exact beforeEach/afterEach pattern used
  - COMPARE: How would this pattern apply to useFormStack tests?

Task 3: CREATE audit report in plan_bugfix/architecture/test_audit_notes.md
  - STRUCTURE: Follow the template defined in "Data Models and Structure"
  - INCLUDE: For each affected test:
    * Test description (copy from source)
    * Line numbers (from Task 1)
    * Current code snippet (from source)
    * Recommended pattern (from Task 2 + research files)
    * Rationale (reference external research)
  - SAVE: As plan_bugfix/architecture/test_audit_notes.md

Task 4: VERIFY completeness of audit
  - CHECK: All expect().toThrow() tests in useFormStack.test.tsx are documented
  - VERIFY: Each entry has line numbers and specific recommendation
  - CONFIRM: Report references research files for justification
  - VALIDATE: Report format matches template structure
```

### Implementation Patterns & Key Details

```typescript
// PATTERN TO LOOK FOR (current state - problematic):
describe('when used outside FormStackProvider', () => {
  it('should throw error from useFormStackState', () => {
    // NO console.error suppression here!
    expect(() => {
      renderHook(() => useFormStack());
    }).toThrow('useFormStackState must be used within a FormStackProvider');
  });
});

// PATTERN TO RECOMMEND (from FormErrorBoundary.test.tsx):
describe('error-throwing tests', () => {
  // Add beforeEach/afterEach to suppress console.error
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('should throw error from useFormStackState', () => {
    // Now console.error won't spam output
    expect(() => {
      renderHook(() => useFormStack());
    }).toThrow('useFormStackState must be used within a FormStackProvider');
  });
});

// ALTERNATIVE PATTERN (better - using vi.spyOn):
describe('error-throwing tests', () => {
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

// GOTCHA: Check if useFormStack.test.tsx has OTHER tests that don't throw errors
// If yes, the console.error suppression should be in a NESTED describe block
// containing only the error-throwing tests, not at the top level

// EXAMPLE from FormStackRenderer.test.tsx (lines 216-227):
describe('error boundary integration', () => {
  // Suppress console.error for expected errors in this block only
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

### Integration Points

```yaml
OUTPUT_FILES:
  - create: plan_bugfix/architecture/test_audit_notes.md
  - purpose: Audit report for this task, input for P1.M1.T1.S2 (implementation task)

NO CODE CHANGES:
  - This task produces documentation only
  - No files are modified
  - No tests are run

CROSS-FILE REFERENCES:
  - useFormStack.test.tsx (source to audit)
  - FormErrorBoundary.test.tsx (pattern reference)
  - FormStackRenderer.test.tsx (pattern reference)
  - Research files in plan_bugfix/P1M1T1S1/research/
```

---

## Validation Loop

This is an audit/research task with a documentation deliverable. Validation focuses on completeness and accuracy of the audit report.

### Level 1: File Existence & Structure

```bash
# Verify the audit report was created
test -f plan_bugfix/architecture/test_audit_notes.md
echo "Audit report exists: $?"

# Verify it has the required sections
grep -q "Executive Summary" plan_bugfix/architecture/test_audit_notes.md
grep -q "Detailed Findings" plan_bugfix/architecture/test_audit_notes.md
grep -q "useFormStack.test.tsx" plan_bugfix/architecture/test_audit_notes.md

# Expected: All grep commands exit with status 0 (found)
```

### Level 2: Content Completeness

```bash
# Count error-throwing tests in the source file
grep -n "toThrow" src/hooks/__tests__/useFormStack.test.tsx

# Verify audit report has matching entries
# (Manual verification: each grep result should have a corresponding section)

# Check that line numbers are documented
grep -E "Line Numbers|line" plan_bugfix/architecture/test_audit_notes.md

# Check that patterns are included
grep -E "Current Pattern|Recommended Pattern" plan_bugfix/architecture/test_audit_notes.md
```

### Level 3: Research Validation

```bash
# Verify audit report references research files
grep -q "vitest_error_suppression.md" plan_bugfix/architecture/test_audit_notes.md
grep -q "react_error_testing.md" plan_bugfix/architecture/test_audit_notes.md
grep -q "toThrow_patterns.md" plan_bugfix/architecture/test_audit_notes.md

# Verify external documentation URLs are referenced
grep -q "vitest.dev" plan_bugfix/architecture/test_audit_notes.md
grep -q "testing-library.com" plan_bugfix/architecture/test_audit_notes.md

# Verify pattern reference files are mentioned
grep -q "FormErrorBoundary.test.tsx" plan_bugfix/architecture/test_audit_notes.md
grep -q "FormStackRenderer.test.tsx" plan_bugfix/architecture/test_audit_notes.md
```

### Level 4: Manual Review Checklist

- [ ] All `expect().toThrow()` tests in `useFormStack.test.tsx` are documented
- [ ] Each test entry includes: description, line numbers, current code
- [ ] Each test entry includes specific recommendation with code example
- [ ] Recommendations reference either internal pattern files or external research
- [ ] Report is structured and readable
- [ ] Executive summary provides overview
- [ ] No code files were modified (this is an audit-only task)

---

## Final Validation Checklist

### Technical Validation

- [ ] Audit report exists at `plan_bugfix/architecture/test_audit_notes.md`
- [ ] Report contains all sections from template
- [ ] All error-throwing tests from source file are documented
- [ ] Line numbers are accurate
- [ ] Code snippets are correctly quoted
- [ ] External references are specific with URLs

### Audit Quality Validation

- [ ] Each finding has clear "current state" documentation
- [ ] Each finding has specific, actionable recommendation
- [ ] Recommendations reference established patterns (internal or external)
- [ ] Report distinguishes between "audit findings" and "implementation suggestions"
- [ ] Report is ready for handoff to implementation task (P1.M1.T1.S2)

### Documentation & Deliverables

- [ ] Report structure matches template
- [ ] Research files are properly referenced
- [ ] External documentation URLs are included with section anchors
- [ ] No code files were modified (audit-only task)

---

## Anti-Patterns to Avoid

- ❌ Don't modify any test files during this audit - this is research only
- ❌ Don't run tests to verify fixes - that's for the implementation task
- ❌ Don't include "fixed" code in the audit report - only recommendations
- ❌ Don't audit files outside the scope (useFormStack.test.tsx only)
- ❌ Don't forget to document line numbers - critical for implementation
- ❌ Don't use generic recommendations - reference specific patterns from this codebase
- ❌ Don't ignore the context of other tests - check if suppression should be nested
- ❌ Don't assume React version - verify from package.json (React 19)
- ❌ Don't confuse Vitest APIs with Jest APIs - use vi.* not jest.*
- ❌ Don't recommend vi.mock() for console - use vi.spyOn() instead
- ❌ Don't suggest clearAllMocks() - recommend restoreAllMocks()
- ❌ Don't ignore the difference between console.error (React 18) and console.warn (React 19)

---

## Confidence Score

**One-Pass Implementation Success Likelihood: 9/10**

**Rationale**:
- Clear, focused scope (audit one file)
- Excellent pattern references within the codebase
- Comprehensive external research with specific URLs
- Well-documented expected output format
- No code changes required (documentation only)
- Clear handoff to next task (P1.M1.T1.S2)

**Risk Factors**:
- Minor risk: If useFormStack.test.tsx has unusual structure not seen in analysis
- Mitigation: Research covers multiple patterns and external best practices

---

## References Summary

### Internal Codebase Files
1. `src/hooks/__tests__/useFormStack.test.tsx` - TARGET (audit target)
2. `src/components/__tests__/FormErrorBoundary.test.tsx` - PATTERN REFERENCE
3. `src/components/__tests__/FormStackRenderer.test.tsx` - PATTERN REFERENCE
4. `src/hooks/__tests__/useFormStackState.test.tsx` - COMPARATIVE ANALYSIS
5. `src/hooks/__tests__/useFormStackURLSync.test.tsx` - COMPARATIVE ANALYSIS

### External Research Files (stored in `plan_bugfix/P1M1T1S1/research/`)
1. `vitest_error_suppression.md` - Vitest console.error suppression patterns
2. `react_error_testing.md` - React error boundary testing patterns
3. `toThrow_patterns.md` - expect().toThrow() best practices

### External Documentation URLs
1. https://vitest.dev/guide/mocking - Vitest mocking guide
2. https://vitest.dev/api/vi - vi.* API reference
3. https://testing-library.com/docs/react-testing-library/faq/ - RTL FAQ
4. https://jshakespeare.com/react-error-boundary-testing-rtl/ - Error boundary testing guide
5. https://www.testingjavascript.com/lessons/react-hide-console-error-logs-when-testing-error-boundaries-with-jest-spyon - Kent C. Dodds on console suppression
6. https://kentcdodds.com/blog/how-to-use-react-context-effectively - React Context best practices

---

**PRP Version: 1.0**
**Created: 2025-01-10**
**For: Task P1.M1.T1.S1 - Audit Error-Throwing Test Patterns**
**Next Task: P1.M1.T1.S2 - Implement Improved Error Suppression**
