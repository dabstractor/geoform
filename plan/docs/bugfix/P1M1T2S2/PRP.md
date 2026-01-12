# PRP: Verify All Test Suites Produce Clean Output

## Goal

**Feature Goal**: Validate that the full test suite runs cleanly with zero error artifacts after error suppression improvements from P1.M1.T1.S2 and P1.M1.T2.S1

**Deliverable**: Validation report at `plan/bugfix/architecture/test_validation.md` confirming clean test output

**Success Definition**:
- All 260 tests across 23 test files pass
- Zero "uncaught error" or "Uncaught" messages in stderr output
- Only expected test output appears (no console.error artifacts from expected error tests)

## User Persona

**Target User**: Developer maintaining the test suite and running tests in CI/CD pipelines

**Use Case**: Running `npm test` should produce clean output without expected error messages cluttering the logs, making it easy to spot real issues

**User Journey**: Developer runs `npm test` → Tests execute → Clean output shows only test results, not expected error artifacts

**Pain Points Addressed**: Expected error messages from hook validation tests were cluttering test output, making it harder to spot real issues

## Why

- **Developer Experience**: Clean test output improves debugging by eliminating noise from expected errors
- **CI/CD Clarity**: Automated test runs produce readable logs for failure triage
- **Validation Completeness**: Confirms that previous subtasks (P1.M1.T1.S2, P1.M1.T2.S1) successfully suppressed error output
- **Best Practice**: Following testing strategy principle: "Error boundary tests should verify fallback UI appears, not that errors are thrown"

## What

Validate that the full test suite produces clean output after applying console.error suppression to tests that intentionally trigger errors. This is a verification task to confirm the work from previous subtasks.

### Success Criteria

- [ ] All 260 tests pass when running `npm test`
- [ ] Zero "uncaught error" or "Uncaught" messages in stderr
- [ ] Zero console.error artifacts from useFormStack and useFormStackURLSync tests
- [ ] Validation report created at `plan/bugfix/architecture/test_validation.md`

## All Needed Context

### Context Completeness Check

_Validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**YES** - This PRP includes: exact test command, expected test count, validation patterns, grep commands, file locations, and success criteria.

### Documentation & References

```yaml
# MODIFIED TEST FILES - Previously Modified in P1.M1.T1.S2 and P1.M1.T2.S1
- file: src/hooks/__tests__/useFormStack.test.tsx
  why: Contains error suppression pattern applied in P1.M1.T1.S2
  pattern: Lines 60-70 - console.error suppression with beforeEach/afterEach
  section: describe('when used outside FormStackProvider') block
  gotcha: Suppression is scoped to the describe block, not globally

- file: src/hooks/__tests__/useFormStackURLSync.test.tsx
  why: Contains error suppression pattern applied in P1.M1.T2.S1
  pattern: Lines 373-390 - console.error suppression with beforeEach/afterEach
  section: describe('error handling') block
  gotcha: Suppression is scoped to the describe block, not globally

# SIMILAR PATTERNS - Other Test Files with Suppression
- file: src/components/__tests__/FormErrorBoundary.test.tsx
  why: Another example of the same suppression pattern
  pattern: Lines 22-31 - describe block level suppression
  gotcha: Same pattern used across multiple test files

- file: src/components/__tests__/FormStackRenderer.test.tsx
  why: Additional example of suppression in error boundary tests
  pattern: Lines 217-226 - describe block level suppression
  gotcha: Shows pattern applied to integration-style tests

# TEST CONFIGURATION
- file: vitest.setup.ts
  why: Global test setup file - uses vi.clearAllMocks() not vi.restoreAllMocks()
  gotcha: Setup file clears mocks but doesn't restore implementations

- file: vitest.config.ts
  why: Vitest configuration with restoreMocks not enabled
  gotcha: restoreMocks: false means manual restoration is required

- file: package.json
  why: Test scripts and configuration
  pattern: "test": "vitest run" - runs tests once (not watch mode)

# EXTERNAL RESEARCH - Vitest Output Patterns
- url: https://vitest.dev/guide/cli.html#filters
  why: Understanding Vitest CLI output filtering
  critical: stderr vs stdout separation in Vitest

- url: https://vitest.dev/guide/reporters.html
  why: Test reporter configuration options
  critical: How to interpret test output format

# REFERENCE PRPs - Previous Subtasks
- file: plan/docs/bugfix/P1M1T2S1_PRP.md
  why: PRP for P1.M1.T2.S1 error suppression implementation
  pattern: Contains detailed explanation of error suppression approach
  gotcha: This task validates that the PRP implementation was successful
```

### Current Codebase Tree

```bash
geoform/
├── src/
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   ├── useFormStack.test.tsx          # Modified in P1.M1.T1.S2 (has suppression)
│   │   │   ├── useFormStackURLSync.test.tsx   # Modified in P1.M1.T2.S1 (has suppression)
│   │   │   ├── useFormStackState.test.tsx
│   │   │   └── useFormStackActions.test.tsx
│   └── components/
│       └── __tests__/
│           ├── FormErrorBoundary.test.tsx     # Has suppression
│           └── FormStackRenderer.test.tsx     # Has suppression
├── vitest.setup.ts                             # Global test setup
├── vitest.config.ts                            # Vitest configuration
├── package.json
└── plan/
    ├── architecture/
    │   └── test_validation.md                 # OUTPUT LOCATION - Create this
    └── bugfix/
        └── P1M1T2S2/
            └── PRP.md                          # This file
```

### Desired Codebase Tree

```bash
# No new files - validation and documentation only
# plan/bugfix/architecture/test_validation.md will be created with validation results
```

### Known Gotchas of Our Codebase & Library Quirks

```bash
# CRITICAL: Actual test count is 260, not 220 as stated in original system_context.md
# The system_context.md file may have outdated information - use actual count from test run

# CRITICAL: "An update to FormStackProvider inside a test was not wrapped in act(...)"
# warnings are NOT the target of this validation - these are React development warnings
# The task specifically looks for "uncaught error" or "Uncaught" messages

# CRITICAL: Use grep -i for case-insensitive matching when searching for errors
# Vitest output may use "Uncaught" or "uncaught" interchangeably

# CRITICAL: Vitest separates stdout (test results) from stderr (errors/warnings)
# Use 2>&1 to capture both streams when validating output

# CRITICAL: The project uses Vitest, not Jest
# npm test runs "vitest run" which exits after completion (not watch mode)

# CRITICAL: console.error suppression is scoped to describe blocks
# Global suppression is NOT used - only tests that throw expected errors have suppression
```

## Implementation Blueprint

### Data Models and Structure

No data models - this is a validation and documentation task only.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: RUN FULL TEST SUITE
  - COMMAND: npm test
  - CAPTURE: Full output to a file or variable for analysis
  - VERIFY: All tests pass (expected: 260 tests)
  - DEPENDENCIES: None

Task 2: CHECK FOR UNCAUGHT ERRORS
  - COMMAND: npm test 2>&1 | grep -i "uncaught" || echo "No uncaught errors found"
  - VERIFY: Zero "uncaught error" or "Uncaught" messages in output
  - DEPENDENCIES: Task 1

Task 3: CHECK FOR CONSOLE.ERROR ARTIFACTS
  - COMMAND: npm test 2>&1 | grep "console.error" | grep -E "(useFormStack|useFormStackURLSync)" || echo "No console.error artifacts from target tests"
  - VERIFY: Zero console.error artifacts from modified test files
  - DEPENDENCIES: Task 1

Task 4: VERIFY SPECIFIC TEST FILES HAVE SUPPRESSION
  - CHECK: src/hooks/__tests__/useFormStack.test.tsx lines 60-70
  - CHECK: src/hooks/__tests__/useFormStackURLSync.test.tsx lines 373-390
  - VERIFY: Both have console.error suppression pattern with beforeEach/afterEach
  - DEPENDENCIES: None

Task 5: DOCUMENT VALIDATION RESULTS
  - CREATE: plan/bugfix/architecture/test_validation.md
  - CONTENTS: Test results, counts, clean output confirmation, timestamp
  - FORMAT: Markdown with clear sections for results
  - DEPENDENCIES: Tasks 1, 2, 3, 4

Task 6: REGRESSION VERIFICATION
  - RUN: npm test -- --reporter=verbose (optional, for detailed output)
  - VERIFY: No unexpected failures or new warnings
  - DEPENDENCIES: Task 5
```

### Implementation Patterns & Key Details

```bash
# EXACT COMMANDS FOR VALIDATION:

# 1. Run full test suite and capture summary
npm test 2>&1 | tee /tmp/test_output.txt

# Expected output summary:
# Test Files  23 passed (23)
# Tests  260 passed (260)
# Duration  ~2s

# 2. Check for uncaught errors (case-insensitive)
npm test 2>&1 | grep -i "uncaught" | wc -l
# Expected: 0

# 3. Check for console.error artifacts from specific test files
npm test 2>&1 | grep "console.error" | grep -E "(useFormStack|useFormStackURLSync)" | wc -l
# Expected: 0

# 4. Verify error suppression pattern is present in files
grep -A 10 "when used outside FormStackProvider" src/hooks/__tests__/useFormStack.test.tsx | grep -q "console.error = vi.fn()"
# Expected: Exit code 0 (pattern found)

grep -A 10 "error handling" src/hooks/__tests__/useFormStackURLSync.test.tsx | grep -q "console.error = vi.fn()"
# Expected: Exit code 0 (pattern found)

# 5. Get actual test count (in case it differs from docs)
npm test 2>&1 | grep "Tests.*passed"
# Expected: "Tests  XXX passed (XXX)" where XXX is actual count
```

### Integration Points

```yaml
TEST_OUTPUT:
  - location: plan/bugfix/architecture/test_validation.md
  - format: Markdown validation report
  - contents: Test count, pass/fail status, clean output confirmation

PREVIOUS_SUBTASKS:
  - P1.M1.T1.S2: Added suppression to useFormStack.test.tsx
  - P1.M1.T2.S1: Added suppression to useFormStackURLSync.test.tsx
  - relationship: This task validates the success of those implementations

TEST_FRAMEWORK:
  - tool: Vitest (not Jest)
  - command: npm test runs "vitest run"
  - config: vitest.config.ts with jsdom environment
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# No code changes - validation only
# Skip to Level 2
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run full test suite
npm test

# Expected output:
# Test Files  23 passed (23)
# Tests  260 passed (260)
# Duration  ~2s

# If tests fail, investigate and fix before proceeding
# Expected: Zero test failures
```

### Level 3: Integration Testing (System Validation)

```bash
# Check for uncaught errors specifically
npm test 2>&1 | grep -i "uncaught" || echo "✓ No uncaught errors found"

# Check for console.error artifacts from modified test files
npm test 2>&1 | grep "console.error" | grep -E "(useFormStack|useFormStackURLSync)" || echo "✓ No console.error artifacts from target tests"

# Verify error suppression pattern is in place
grep -q "console.error = vi.fn()" src/hooks/__tests__/useFormStack.test.tsx && echo "✓ useFormStack.test.tsx has suppression"
grep -q "console.error = vi.fn()" src/hooks/__tests__/useFormStackURLSync.test.tsx && echo "✓ useFormStackURLSync.test.tsx has suppression"

# Expected: All checks pass with ✓ indicators
```

### Level 4: Output Analysis & Documentation

```bash
# Capture full test output for documentation
npm test 2>&1 > /tmp/full_test_output.txt

# Extract test summary
grep -E "(Test Files|Tests|Duration)" /tmp/full_test_output.txt

# Verify zero uncaught errors
! grep -i "uncaught" /tmp/full_test_output.txt && echo "✓ Clean output confirmed"

# Create validation report
cat > plan/bugfix/architecture/test_validation.md << 'EOF'
# Test Suite Validation Report

**Date**: [Current date from date command]
**Task**: P1.M1.T2.S2 - Verify all test suites produce clean output

## Test Suite Summary

- **Test Files**: 23 passed (23)
- **Tests**: 260 passed (260)
- **Duration**: ~2s

## Clean Output Validation

### Uncaught Error Check
- **Result**: ✓ PASS - Zero "uncaught error" or "Uncaught" messages in stderr
- **Command**: `npm test 2>&1 | grep -i "uncaught"`
- **Output**: No matches found

### Console.error Artifacts Check
- **Result**: ✓ PASS - Zero console.error artifacts from useFormStack tests
- **Command**: `npm test 2>&1 | grep "console.error" | grep -E "(useFormStack|useFormStackURLSync)"`
- **Output**: No matches found

### Error Suppression Pattern Verification
- **useFormStack.test.tsx**: ✓ PASS - Suppression present at lines 60-70
- **useFormStackURLSync.test.tsx**: ✓ PASS - Suppression present at lines 373-390

## Conclusion

All validation checks passed. The test suite produces clean output with zero error artifacts. The console.error suppression implemented in P1.M1.T1.S2 and P1.M1.T2.S1 is working correctly.
EOF

# Expected: Validation report created successfully
```

## Final Validation Checklist

### Technical Validation

- [ ] All tests pass: `npm test` shows 260 tests passed
- [ ] Zero uncaught errors: `npm test 2>&1 | grep -i "uncaught"` returns nothing
- [ ] Zero console.error artifacts from target test files
- [ ] Validation report created at `plan/bugfix/architecture/test_validation.md`
- [ ] Report contains actual test count (260, not 220 from outdated docs)

### Feature Validation

- [ ] Error handling tests still validate errors are thrown (tests not broken)
- [ ] console.error suppression scoped only to error handling describe blocks
- [ ] beforeEach/afterEach properly restore console.error
- [ ] No changes to test logic - only suppression was added in previous subtasks

### Code Quality Validation

- [ ] Error suppression pattern consistent across all test files
- [ ] Comments present: "Suppress console.error for expected errors in this block"
- [ ] No global suppression - only scoped to specific describe blocks
- [ ] Pattern matches useFormStack.test.tsx and useFormStackURLSync.test.tsx implementations

### Documentation & Deployment

- [ ] Validation report includes timestamp and task reference
- [ ] Report documents actual test count (260 tests)
- [ ] Report confirms clean output with evidence
- [ ] No new dependencies or configuration changes required

---

## Anti-Patterns to Avoid

- **Don't count tests manually** - Use actual count from `npm test` output (260, not 220)
- **Don't confuse act warnings with uncaught errors** - "An update to FormStackProvider inside a test was not wrapped in act(...)" are React dev warnings, not uncaught errors
- **Don't modify test code** - This is a validation task only, no code changes
- **Don't ignore stderr** - Must capture both stdout and stderr with `2>&1`
- **Don't skip the documentation** - Must create validation report at specified location
- **Don't forget to verify previous work** - Check that P1.M1.T1.S2 and P1.M1.T2.S1 suppression is still in place

## Appendix: Research Findings

### Current State Analysis (2026-01-12)

**Test Suite Status**:
- **Total test files**: 23 passed (23)
- **Total tests**: 260 passed (260) [Note: Original docs said 220, but actual count is 260]
- **Test duration**: ~2 seconds
- **Framework**: Vitest with jsdom environment

**Error Suppression Status**:
- `useFormStack.test.tsx`: ✓ Has suppression (P1.M1.T1.S2 complete)
- `useFormStackURLSync.test.tsx`: ✓ Has suppression (P1.M1.T2.S1 complete)
- `FormErrorBoundary.test.tsx`: ✓ Has suppression
- `FormStackRenderer.test.tsx`: ✓ Has suppression

**Clean Output Validation**:
- Zero "uncaught error" or "Uncaught" messages in current output
- Zero console.error artifacts from error handling tests
- Only expected test output appears

### Pattern Consistency

All error handling tests follow the same pattern:
```typescript
describe('error handling' | 'when used outside FormStackProvider', () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('should throw error...', () => {
    // Test that validates expected error is thrown
  });
});
```

### Expected Output Format

Vitest produces output in this format:
```
 RUN  v2.1.9 /path/to/project
 ✓ src/path/to/test.test.ts (N tests) Xms
 ...
 Test Files  X passed (X)
 Tests  XXX passed (XXX)
 Duration  X.XXs
```

Stderr is interleaved with test output for errors/warnings.

---

**Confidence Score**: 10/10

**Rationale**: This is a straightforward validation task with exact commands, expected outputs, and clear success criteria. The task involves running existing tests, checking for specific patterns in output, and documenting results. No code implementation is required.
