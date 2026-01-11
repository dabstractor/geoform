name: "PRP: Verify All Test Suites Produce Clean Output (P1.M1.T2.S2)"
description: |

---

## Goal

**Feature Goal**: Validate that the entire test suite produces clean output with no error artifacts after applying console.error suppression to useFormStack and useFormStackURLSync tests.

**Deliverable**: Confirmation document at `plan/bugfix/architecture/test_validation.md` verifying that all tests pass with clean output.

**Success Definition**:
- All 249 tests across 21 test files pass successfully
- No "uncaught error" or "Uncaught" messages in stderr output
- Only expected test output appears (PASS/FAIL summaries, no console.error spam)
- Visual or automated inspection confirms clean test run

## User Persona

**Target User**: Developer/QA ensuring code quality and CI/CD pipeline integrity

**Use Case**: Validate that test output modifications from previous subtasks (P1.M1.T1.S2, P1.M1.T2.S1) successfully eliminate console.error noise without breaking tests

**User Journey**:
1. Run full test suite with `npm test`
2. Inspect output for error artifacts
3. Confirm clean output with validation script
4. Document results for team visibility

**Pain Points Addressed**:
- Noisy test output obscuring real failures
- False positives from expected errors in error boundary tests
- CI/CD pipelines cluttered with console.error spam

## Why

- **Test Quality**: Clean output ensures real test failures are immediately visible
- **CI/CD Integrity**: Automated validation prevents regression of test output artifacts
- **Developer Experience**: Clear test results improve debugging velocity
- **Codebase Hygiene**: Maintains standard for all future test additions

## What

Run the full test suite and validate clean output after console.error suppression was applied to:
- `src/hooks/__tests__/useFormStack.test.tsx` (modified in P1.M1.T1.S2)
- `src/hooks/__tests__/useFormStackURLSync.test.tsx` (modified in P1.M1.T2.S1)

### Success Criteria

- [ ] All 249 tests pass (verified by exit code 0)
- [ ] No "uncaught error" messages in output
- [ ] No "Uncaught" messages in output
- [ ] No unexpected console.error messages
- [ ] Validation document created at `plan/bugfix/architecture/test_validation.md`

## All Needed Context

### Context Completeness Check

_Before executing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

Yes - this PRP provides complete context on test structure, validation commands, and expected outcomes.

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://vitest.dev/guide/cli
  why: Vitest CLI options for running tests and capturing output
  critical: Use `vitest run --silent` for cleaner output, `--reporter=verbose` for detailed output

- url: https://vitest.dev/guide/mocking
  why: Understanding vi.fn() and vi.spyOn() patterns used for console.error suppression
  critical: The beforeEach/afterEach restoration pattern is critical for test isolation

- url: https://stackoverflow.com/questions/44467657/better-way-to-disable-console-inside-unit-tests
  why: Community patterns for console suppression in tests
  critical: Alternative patterns using vi.spyOn() vs direct replacement

- file: src/hooks/__tests__/useFormStack.test.tsx
  why: Modified test file with console.error suppression pattern (lines 61-70)
  pattern: beforeEach/afterEach with console.error = vi.fn()
  gotcha: Import must include `vi, beforeEach, afterEach` from vitest

- file: src/hooks/__tests__/useFormStackURLSync.test.tsx
  why: Modified test file with console.error suppression pattern (lines 309-319)
  pattern: Identical suppression pattern for error handling tests
  gotcha: Scope suppression only to describe blocks that throw errors

- file: vitest.config.ts
  why: Test runner configuration
  pattern: jsdom environment, setupFiles, restoreMocks option
  gotcha: enable `restoreMocks: true` for automatic cleanup

- file: vitest.setup.ts
  why: Global test setup for cleanup and mock clearing
  pattern: afterEach cleanup() and vi.clearAllMocks()
  gotcha: Order matters - cleanup before mock clearing

- file: package.json
  why: Available test scripts
  pattern: "test": "vitest run", "test:watch": "vitest"
  gotcha: Use `npm test` for single run, `npm run test:watch` for development

- docfile: plan/architecture/system_context.md
  why: Overall project context and testing strategy
  section: Testing Strategy (lines 87-91)

- file: bug_fix_tasks.json
  why: Task context for P1.M1.T2.S2 and related subtasks
  pattern: Task hierarchy and completion status
  gotcha: Understanding dependency chain (P1.M1.T1.S2 → P1.M1.T2.S1 → P1.M1.T2.S2)
```

### Current Codebase Tree (test structure)

```bash
src/
├── __tests__/
│   └── integration/
│       └── test-utils.tsx              # Test fixtures and utilities
├── components/
│   └── __tests__/
│       ├── FormErrorBoundary.test.tsx  # Has console.error suppression
│       └── FormStackRenderer.test.tsx  # Has console.error suppression
├── context/
│   └── __tests__/
│       ├── FormStackContext.test.tsx
│       └── FormStateContext.test.tsx
├── hooks/
│   └── __tests__/
│       ├── useFormStack.test.tsx       # MODIFIED: Added suppression (P1.M1.T1.S2)
│       ├── useFormStackURLSync.test.tsx # MODIFIED: Added suppression (P1.M1.T2.S1)
│       └── useFormStackState.test.tsx
├── types/
│   └── __tests__/
│       └── types.test.ts
└── utils/
    └── __tests__/
        └── form-types.test.ts
```

**Test Statistics:**
- Total tests: **249** (not 220 as originally noted)
- Test files: **21**
- Test runner: **Vitest** with jsdom environment

### Desired Codebase Tree (output validation)

```bash
plan/
├── bugfix/
│   ├── P1M1T2S2/
│   │   └── PRP.md                      # This file
│   └── architecture/
│       └── test_validation.md          # OUTPUT: Test validation results
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: Vitest requires explicit import of vi, beforeEach, afterEach
// Missing imports cause "ReferenceError: vi is not defined"
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// CRITICAL: console.error must be restored in afterEach
// Without restoration, console.error remains mocked for subsequent tests
afterEach(() => {
  console.error = originalError;
});

// GOTCHA: React 19 uses console.error for validation errors
// React 18-19 automatic error logging cannot be disabled globally
// Must be suppressed per-test with the pattern shown above

// GOTCHA: vitest.run --silent still outputs console.error
// Use grep/awk filtering for validation, don't rely on --silent flag alone

// GOTCHA: 249 tests, not 220 as mentioned in some docs
// System context doc may have outdated count
```

## Implementation Blueprint

### Data Models and Structure

No new data models - this is a validation task.

The expected output structure is:

```typescript
// Test validation result structure
interface TestValidationResult {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  hasUncaughtErrors: boolean;
  hasConsoleErrors: boolean;
  outputSummary: string;
  validationStatus: "PASS" | "FAIL";
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: RUN FULL TEST SUITE
  - EXECUTE: npm test (or vitest run)
  - CAPTURE: stdout and stderr to file
  - COMMAND: npm test 2>&1 | tee test-output.log
  - TIMEOUT: 120 seconds (tests should complete within 2 minutes)

Task 2: VALIDATE TEST PASS/FAIL STATUS
  - CHECK: Exit code is 0 (all tests passed)
  - VERIFY: Test count shows 249 tests (or current count)
  - COMMAND: echo $? (check exit code after npm test)
  - EXPECTED: "Test Files  21 passed (21)"

Task 3: CHECK FOR UNCAUGHT ERROR MESSAGES
  - SEARCH: Output for "uncaught error" (case insensitive)
  - SEARCH: Output for "Uncaught" (capital U, as React logs it)
  - COMMAND: grep -i "uncaught error" test-output.log || echo "No uncaught errors found"
  - EXPECTED: No matches found

Task 4: CHECK FOR CONSOLE.ERROR MESSAGES
  - SEARCH: Output for console.error calls
  - FILTER: Exclude expected patterns from error boundary tests
  - COMMAND: grep "console.error" test-output.log | grep -v "expected" || echo "No console.errors found"
  - EXPECTED: No unexpected console.error messages

Task 5: CREATE VALIDATION DOCUMENT
  - CREATE: plan/bugfix/architecture/test_validation.md
  - CONTENT: Test run results, error counts, validation status
  - INCLUDE: Timestamp, test counts, grep command results
  - FORMAT: Markdown with clear sections

Task 6: CLEANUP (optional)
  - REMOVE: test-output.log temporary file
  - PRESERVE: test_validation.md as permanent record
  - COMMAND: rm test-output.log (after validation document created)
```

### Implementation Patterns & Key Details

```bash
# Pattern: Run tests and capture output for validation
npm test 2>&1 | tee test-output.log

# Pattern: Check exit code immediately after test run
npm test
TEST_EXIT_CODE=$?
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed"
else
  echo "❌ Tests failed with exit code $TEST_EXIT_CODE"
fi

# Pattern: Grep for specific error patterns
# Case insensitive search for "uncaught error"
grep -i "uncaught error" test-output.log

# Case sensitive search for "Uncaught" (React logs capital U)
grep "Uncaught" test-output.log

# Pattern: Count test results
grep -E "Test Files.*passed" test-output.log

# Pattern: Negative grep (pass if NOT found)
# Returns exit code 1 if found (error), 0 if not found (clean)
! grep -i "uncaught error" test-output.log

# Pattern: Comprehensive validation script
npm test 2>&1 | tee test-output.log
if grep -qi "uncaught error" test-output.log; then
  echo "❌ FAILED: Uncaught errors detected"
  exit 1
fi
if grep "Uncaught" test-output.log; then
  echo "❌ FAILED: Uncaught errors detected"
  exit 1
fi
echo "✅ PASSED: Clean test output validated"
```

### Integration Points

```yaml
NO_CODE_CHANGES:
  - This task validates previous work
  - No integration points to modify
  - Purely verification and documentation

DOCUMENTATION:
  - output: plan/bugfix/architecture/test_validation.md
  - format: Markdown with test results
  - includes: Timestamp, counts, validation status

CI_CD:
  - can be integrated into GitHub Actions
  - pattern: Add test output validation step
  - exit code 0 means clean output
```

## Validation Loop

### Level 1: Test Execution (Immediate Feedback)

```bash
# Run the full test suite
npm test

# Expected output should show:
# ✓ src/components/__tests__/FormErrorBoundary.test.tsx (N)
# ✓ src/components/__tests__/FormStackRenderer.test.tsx (N)
# ✓ src/hooks/__tests__/useFormStack.test.tsx (N)
# ✓ src/hooks/__tests__/useFormStackURLSync.test.tsx (N)
# ... all other tests
#
# Test Files  21 passed (21)
#     Tests | 249 passed (249)
#  Start at 00:00:00
#  Duration 2.45s (transform 234ms, setup 0ms, collect 89ms, tests 2.13s)
```

### Level 2: Error Artifact Detection (Output Validation)

```bash
# Run tests and capture output
npm test 2>&1 | tee test-output.log

# Check for uncaught errors (should return no matches)
grep -i "uncaught error" test-output.log
# Expected: No output (exit code 1, which we treat as success)

# Check for React Uncaught messages (should return no matches)
grep "Uncaught" test-output.log
# Expected: No output (exit code 1, which we treat as success)

# Check for console.error spam (should return no matches)
grep "console.error" test-output.log | grep -v "expected"
# Expected: No output (exit code 1, which we treat as success)
```

### Level 3: Comprehensive Validation (All Checks)

```bash
# Single comprehensive validation command
npm test 2>&1 | tee test-output.log && \
  ! grep -i "uncaught error" test-output.log && \
  ! grep "Uncaught" test-output.log && \
  ! grep "console.error" test-output.log | grep -v "expected" && \
  echo "✅ PASSED: Clean test output validated"

# Expected: All checks pass, final message displayed
# If any check fails, the chain breaks and no success message appears
```

### Level 4: Documentation Generation (Final Output)

```bash
# After successful validation, create the documentation
cat > plan/bugfix/architecture/test_validation.md << 'EOF'
# Test Output Validation Results

## Summary

**Validation Date:** $(date -Iseconds)
**Task:** P1.M1.T2.S2 - Verify all test suites produce clean output
**Status:** ✅ PASSED

## Test Run Results

### Test Statistics
- Total Test Files: 21
- Total Tests: 249
- Passed: 249
- Failed: 0
- Duration: ~2-3 seconds

### Error Artifact Checks

| Check | Pattern | Result |
|-------|---------|--------|
| Uncaught Errors (case-insensitive) | `grep -i "uncaught error"` | ✅ None found |
| React Uncaught Messages | `grep "Uncaught"` | ✅ None found |
| Console Errors | `grep "console.error"` | ✅ None found |

### Modified Test Files

The following test files had console.error suppression applied:
1. `src/hooks/__tests__/useFormStack.test.tsx` (P1.M1.T1.S2)
2. `src/hooks/__tests__/useFormStackURLSync.test.tsx` (P1.M1.T2.S1)

Both files use the pattern:
\`\`\`typescript
const originalError = console.error;
beforeEach(() => { console.error = vi.fn(); });
afterEach(() => { console.error = originalError; });
\`\`\`

### Conclusion

All tests pass with clean output. No error artifacts detected.
The console.error suppression pattern successfully eliminates React's
automatic error logging for expected errors in error boundary tests.
EOF
```

## Final Validation Checklist

### Technical Validation

- [ ] All tests pass: `npm test` returns exit code 0
- [ ] Test count verified: 249 tests across 21 files
- [ ] No uncaught errors in output: `! grep -i "uncaught error" test-output.log`
- [ ] No React Uncaught messages: `! grep "Uncaught" test-output.log`
- [ ] No unexpected console errors: Visual inspection confirms clean output

### Feature Validation

- [ ] useFormStack.test.tsx still tests error handling correctly
- [ ] useFormStackURLSync.test.tsx still tests error handling correctly
- [ ] Error boundaries still function as expected (errors are caught, just not logged)
- [ ] All other test files unaffected by previous changes

### Documentation Validation

- [ ] `plan/bugfix/architecture/test_validation.md` created
- [ ] Document includes timestamp and test counts
- [ ] Document includes validation results for all three checks
- [ ] Document lists modified test files
- [ ] Clean, professional formatting

### Code Quality Validation

- [ ] No code changes required (validation only)
- [ ] No tests modified (verification only)
- [ ] No new dependencies added
- [ ] Documentation is clear and comprehensive

---

## Anti-Patterns to Avoid

- ❌ Don't modify test code - this is a validation task only
- ❌ Don't suppress test output that indicates real failures
- ❌ Don't ignore test failures - all 249 tests must pass
- ❌ Don't skip the documentation step - create test_validation.md
- ❌ Don't rely on visual inspection alone - use grep for validation
- ❌ Don't forget to check both case-sensitive and case-insensitive patterns
- ❌ Don't validate against outdated test counts (use actual count from test run)
- ❌ Don't proceed if any test fails - fix must come before this task

## Quick Reference Commands

```bash
# Run tests
npm test

# Run tests and capture output
npm test 2>&1 | tee test-output.log

# Check for uncaught errors
grep -i "uncaught error" test-output.log

# Check for React Uncaught messages
grep "Uncaught" test-output.log

# Check exit code of last command
echo $?

# Comprehensive validation
npm test 2>&1 | tee test-output.log && \
  ! grep -i "uncaught error" test-output.log && \
  ! grep "Uncaught" test-output.log && \
  echo "✅ Clean test output validated"

# Count tests
npm test | grep "Tests |"

# View specific test file output
npm test src/hooks/__tests__/useFormStack.test.tsx
```

---

## Confidence Score

**8/10** - High confidence for one-pass implementation success

**Reasoning:**
- Clear, deterministic validation criteria
- Well-defined test structure and commands
- Previous subtasks completed successfully
- Comprehensive validation patterns provided
- Only potential issue: Test count discrepancy (220 vs 249) in documentation

**Risk Mitigation:**
- Validate actual test count during run (use observed count, not documented count)
- Use comprehensive grep patterns to catch all error artifacts
- Document both expected and actual results
