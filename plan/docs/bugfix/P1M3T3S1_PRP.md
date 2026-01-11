# PRP: P1.M3.T3.S1 - Add JSDoc and Comment Documentation for Retry Behavior

---

## Goal

**Feature Goal**: Enhance documentation in `FormErrorBoundary.tsx` to clearly explain the retry mechanism's behavior, limitations, and intended use cases.

**Deliverable**: Updated JSDoc comments in `src/components/FormErrorBoundary.tsx` explaining:
1. How the retry mechanism works (retryCount forcing child remount)
2. That children receive the same props on retry
3. What types of errors are retryable vs non-retryable
4. When users should dismiss vs retry

**Success Definition**: A developer reading the FormErrorBoundary documentation understands exactly when retry will succeed vs fail, and can make informed decisions about error handling in their forms.

## User Persona

**Target User**: Library consumers (React developers) using geoform to build hierarchical form systems.

**Use Case**: A developer's form throws an error; they see the "Try Again" button and need to understand whether retrying will help or if they should dismiss the form.

**User Journey**:
1. User's form throws an error during rendering
2. FormErrorBoundary catches the error and shows fallback UI with "Try Again" and "Dismiss" buttons
3. Developer reads documentation to understand the retry behavior
4. Developer makes informed decision based on error type (transient vs structural)

**Pain Points Addressed**:
- Ambiguity about when retry will succeed vs fail
- Unclear what happens to props/state on retry
- No guidance on which error types are retryable

## Why

- **Developer confidence**: Clear documentation prevents confusion about retry behavior
- **Better error handling**: Understanding retry limitations helps developers build more resilient forms
- **Consistency**: Matches the documentation quality of other lifecycle methods in the same component
- **Prevents bug reports**: Users won't file issues about "retry not working" when the error is structural

## What

Add comprehensive JSDoc documentation and inline comments explaining the retry behavior in `FormErrorBoundary.tsx`:

### Changes Required

1. **Add retry behavior section to component-level JSDoc** explaining:
   - How `retryCount` forces child remount
   - Children receive same props as before error
   - Transient errors (network, temporary bugs) are retryable
   - Structural errors (bad props) will recur and require form closure

2. **Enhance `handleRetry` method JSDoc** with detailed explanation of:
   - The retry mechanism
   - What types of errors it can/cannot fix
   - When to use dismiss instead

3. **Add inline comments** at `handleRetry` implementation reinforcing the behavior

### Success Criteria

- [ ] Component JSDoc includes prominent "Retry Behavior" section
- [ ] `handleRetry` JSDoc explains retryable vs non-retryable errors
- [ ] Inline comments at handleRetry reinforce the documentation
- [ ] Documentation follows existing JSDoc patterns in codebase
- [ ] Examples demonstrate transient vs structural error scenarios

## All Needed Context

### Context Completeness Check

**Before writing this PRP, validate**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

✅ The FormErrorBoundary.tsx file has been fully analyzed
✅ Existing JSDoc patterns in codebase have been documented
✅ React error boundary best practices have been researched
✅ The exact lines requiring modification have been identified

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/components/FormErrorBoundary.tsx
  why: Target file for documentation enhancements; contains current JSDoc patterns to follow
  pattern: Class-level JSDoc with @example, @see tags; method JSDoc with @param, @returns, CRITICAL notes
  gotcha: This is the only class component in geoform (error boundaries require class components)

- file: src/hooks/useFormStack.ts
  why: Example of comprehensive JSDoc with @template, @example, @throws tags
  pattern: Detailed documentation with usage examples and error conditions

- file: src/components/FormStackRenderer.tsx
  why: Shows how FormErrorBoundary is used; provides context for retry behavior
  pattern: Component rendering patterns

- docfile: plan/architecture/system_context.md
  why: Architecture context showing error boundary per form pattern
  section: "Error Boundary Per Form" section explaining isolation strategy

# EXTERNAL REFERENCES
- url: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
  why: Official React error boundary documentation for authoritative context
  critical: Error boundaries only catch errors during rendering, not event handlers or async code

- url: https://react.dev/reference/react/Component#static-getderivedstatefromerror
  why: Official docs for getDerivedStateFromError lifecycle method
  critical: No side effects allowed in render phase methods

- url: https://legacy.reactjs.org/docs/error-boundaries.html
  why: Legacy React docs with additional error boundary context
  critical: Lists what errors are NOT caught by error boundaries
```

### Current Codebase Tree

```bash
geoform/
├── src/
│   ├── components/
│   │   ├── FormErrorBoundary.tsx    # TARGET FILE - only class component in codebase
│   │   ├── FormStackRenderer.tsx    # Uses FormErrorBoundary
│   │   └── __tests__/               # Test files
│   ├── hooks/
│   │   ├── useFormStack.ts          # Comprehensive JSDoc examples
│   │   └── ...
│   └── types/
│       └── form.ts                  # FormProps interface
├── plan/
│   ├── bugfix/
│   │   └── P1M3T3S1/                # PRP output directory
│   └── architecture/
│       └── system_context.md        # Architecture context
```

### Desired Codebase Tree with Files to be Added

```bash
# No new files - this is a documentation-only change
# Modified: src/components/FormErrorBoundary.tsx
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: FormErrorBoundary is the ONLY class component in geoform
// React error boundaries require getDerivedStateFromError and componentDidCatch
// which are only available in class components (not hooks)

// CRITICAL: retryCount mechanism explanation
// The retryCount state variable increments on each retry attempt.
// React detects state change → triggers re-render → children remount with fresh state.
// This is sufficient for most components, but NOT guaranteed for all:
// - Components with internal state will reset that state
// - Components with useEffect will re-run those effects
// - Components receive the SAME props as before the error

// GOTCHA: Error boundaries do NOT catch:
// - Event handlers (use try-catch instead)
// - Asynchronous code (setTimeout, Promise callbacks)
// - Server-side rendering errors
// - Errors in the error boundary itself

// PATTERN: JSDoc formatting in this codebase uses:
// - /** */ for multiline comments
// - @example with ```tsx code blocks
// - @see tags for cross-references
// - @param, @returns for methods
// - CRITICAL: prefix for important implementation notes
```

## Implementation Blueprint

### Data Models and Structure

No data model changes - this is documentation-only.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ANALYZE current documentation state
  - READ: src/components/FormErrorBoundary.tsx lines 31-56 (current class JSDoc)
  - READ: src/components/FormErrorBoundary.tsx lines 107-116 (current handleRetry JSDoc)
  - IDENTIFY: Where to insert retry behavior section
  - OUTPUT: Understanding of documentation structure

Task 2: MODIFY component-level JSDoc (FormErrorBoundary class)
  - ADD: "## Retry Behavior" section after existing description (before @example)
  - EXPLAIN: retryCount forces child remount by triggering React state update
  - EXPLAIN: Children receive same props; retry does NOT fix prop-related errors
  - DISTINGUISH: Transient errors (retryable) vs structural errors (non-retryable)
  - EXAMPLE: Add retry behavior example showing transient vs structural error
  - FOLLOW pattern: Existing JSDoc uses clear sections, @example, @see tags
  - NAMING: Use "Retry Behavior" as section heading for discoverability

Task 3: ENHANCE handleRetry method JSDoc
  - EXPAND: Current one-line comment to full JSDoc
  - DOCUMENT: State updates (hasError: false, error: null, retryCount + 1)
  - EXPLAIN: How retryCount increment forces remount
  - LIST: Retryable error types (network failures, temporary rendering bugs)
  - LIST: Non-retryable error types (bad props, type errors, structural issues)
  - ADVISE: When to use dismiss instead for structural errors
  - FOLLOW pattern: getDerivedStateFromError JSDoc (CRITICAL notes, detailed @param)

Task 4: ADD inline comments at handleRetry implementation
  - ADD: Comment above setState explaining the retry mechanism
  - REINFORCE: retryCount purpose for forcing remount
  - REMIND: Same props passed to children - structural errors will recur
  - FOLLOW pattern: Line 179 comment style ("retryCount is kept in state...")

Task 5: VERIFY documentation consistency
  - CHECK: All retry-related documentation is consistent
  - CHECK: JSDoc formatting matches codebase patterns
  - CHECK: Examples use TypeScript/tsx syntax
  - CHECK: @see tags reference correct components/methods
```

### Implementation Patterns & Key Details

```typescript
/**
 * CURRENT CLASS-LEVEL JSDOC STRUCTURE (lines 31-56):
 *
 * 1. Brief description (what it does)
 * 2. Technical context (only class component, why)
 * 3. Architecture context (each form wrapped separately)
 * 4. @see tags for cross-references
 * 5. @example with code
 *
 * ADDITION REQUIRED: Insert "Retry Behavior" section between step 3 and @see
 */

/**
 * PROPOSED RETRY BEHAVIOR SECTION (insert around line 41):
 *
 * ## Retry Behavior
 *
 * The retry mechanism uses `retryCount` to force child component remount:
 *
 * - **How it works**: Incrementing `retryCount` triggers a React state update,
 *   causing the error boundary to re-render and display its children again
 * - **Props handling**: Children receive the EXACT SAME props as before the error
 * - **Retryable errors**: Transient failures like network issues, temporary
 *   rendering bugs, or race conditions
 * - **Non-retryable errors**: Structural problems like invalid props, type
 *   mismatches, or missing data will recur and require form dismissal
 *
 * @example
 * // Transient error - retry may succeed
 * <UserForm userId={userId} />  // Network fetch failed, retry might work
 *
 * @example
 * // Structural error - retry will fail, use Dismiss instead
 * <UserForm userId={undefined} />  // Invalid prop, will always throw
 */

/**
 * PROPOSED handleRetry JSDoc (replace lines 107-109):
 *
 * Reset error state and increment retry count to force child remount.
 *
 * This method clears the error state and increments `retryCount`, which
 * triggers a React re-render and causes child components to remount with
 * fresh internal state (but the SAME props).
 *
 * ## When Retry Works
 *
 * Retry is effective for TRANSIENT errors that may resolve on remount:
 * - Network failures that may succeed on retry
 * - Temporary rendering bugs or race conditions
 * - Component state corruption that resets on remount
 *
 * ## When Retry Won't Work
 *
 * Retry is INEFFECTIVE for STRUCTURAL errors that will recur:
 * - Invalid or malformed props passed to the child
 * - Type mismatches or missing required data
 * - Logic errors in the child component's render method
 *
 * For structural errors, users should click "Dismiss" instead to close
 * the form and fix the underlying issue.
 *
 * @returns void
 *
 * @see {@link handleDismiss} - Alternative for structural errors
 */
private handleRetry = (): void => {
  // Increment retryCount to force React re-render and child remount
  // Note: Children receive same props - structural errors will recur
  this.setState(prevState => ({
    hasError: false,
    error: null,
    retryCount: prevState.retryCount + 1,
  }));
};
```

### Integration Points

```yaml
NONE: This is a documentation-only change with no code behavior changes
NO_MIGRATIONS: No database or API changes
NO_CONFIG: No configuration changes
NO_ROUTES: No routing changes
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after documentation changes - ensure no accidental code changes
npm run lint          # or pnpm lint / yarn lint
# Expected: No linting errors in FormErrorBoundary.tsx

# TypeScript compilation check
npm run type-check    # or npx tsc --noEmit
# Expected: No type errors

# Format check (if using prettier/ruff)
npm run format:check  # or npx prettier --check src/components/FormErrorBoundary.tsx
# Expected: No formatting issues

# Project-wide validation (optional but recommended)
npm run lint
npm run type-check
npm run format:check
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run existing FormErrorBoundary tests to ensure no behavior changes
npm test -- FormErrorBoundary
# or
npx vitest src/components/__tests__/FormErrorBoundary.test.tsx

# Expected: All existing tests pass - documentation changes shouldn't break tests

# Run test suite with coverage
npm test -- --coverage
# Expected: Same coverage as before (no code paths changed)
```

### Level 3: Integration Testing (System Validation)

```bash
# Run full test suite to ensure no regressions
npm test
# or
npx vitest run

# Expected: All tests pass

# Build the library to ensure no compilation issues
npm run build
# or
npm run compile
# Expected: Clean build with no errors
```

### Level 4: Documentation Validation

```bash
# TypeScript JSDoc type checking (if using typedoc)
npx typedoc src/components/FormErrorBoundary.tsx --emit none
# Expected: No JSDoc syntax errors

# Manual validation: Read the updated documentation
# 1. Open src/components/FormErrorBoundary.tsx
# 2. Review the Retry Behavior section
# 3. Verify handleRetry JSDoc is clear and comprehensive
# 4. Check that examples use proper TypeScript/tsx syntax
# 5. Ensure @see tags reference valid identifiers

# VSCode/IDE validation:
# Hover over FormErrorBoundary class - JSDoc should display correctly
# Hover over handleRetry method - JSDoc should display correctly
# Check for any JSDoc warnings in IDE
```

## Final Validation Checklist

### Technical Validation

- [ ] No code behavior changes (only documentation)
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Clean build: `npm run build`

### Documentation Validation

- [ ] Component JSDoc includes "Retry Behavior" section
- [ ] Retry section explains transient vs structural errors
- [ ] handleRetry JSDoc is comprehensive with examples
- [ ] Inline comments reinforce the documentation
- [ ] JSDoc formatting matches codebase patterns
- [ ] @see tags reference correct identifiers
- [ ] Examples use valid TypeScript/tsx syntax

### Feature Validation

- [ ] Documentation clearly explains retryCount mechanism
- [ ] Users understand when retry vs dismiss is appropriate
- [ ] Examples demonstrate both retryable and non-retryable scenarios
- [ ] Documentation is consistent with actual implementation behavior
- [ ] No contradictions between different sections of documentation

### Code Quality Validation

- [ ] Follows existing JSDoc patterns in codebase
- [ ] No accidental code changes (this is documentation-only)
- [ ] Comments add value beyond the obvious
- [ ] Section headers use consistent formatting
- [ ] Cross-references are accurate and helpful

---

## Anti-Patterns to Avoid

- ❌ Don't change code behavior - this is a documentation task only
- ❌ Don't add code examples that don't actually work
- ❌ Don't over-explain obvious things (e.g., "increment adds one")
- ❌ Don't duplicate information already in existing JSDoc sections
- ❌ Don't use vague language like "might work" - be specific
- ❌ Don't create new documentation patterns - follow existing ones
- ❌ Don't add @param tags for methods with no parameters
- ❌ Don't add @returns tags for void methods (unless documenting side effects)
