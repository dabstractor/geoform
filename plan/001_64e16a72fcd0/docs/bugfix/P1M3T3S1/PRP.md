---
name: "P1.M3.T3.S1 - Add JSDoc and comment documentation for retry behavior"
description: |

---

## Goal

**Feature Goal**: Enhance the FormErrorBoundary component's documentation to clearly explain the retry mechanism and its limitations, preventing user confusion about when retry is effective versus when form dismissal is required.

**Deliverable**: Enhanced JSDoc documentation in `src/components/FormErrorBoundary.tsx` including:
1. A prominent "## Retry Behavior" section in the component's JSDoc explaining the four key retry concepts
2. Expanded JSDoc for the `handleRetry` method with "## When Retry Works" and "## When Retry Won't Work" sections
3. Inline comment at the `handleRetry` method reinforcing that children receive the same props

**Success Definition**:
- Component JSDoc includes "## Retry Behavior" section with four bullet points (how it works, props handling, retryable errors, non-retryable errors)
- `handleRetry` JSDoc includes detailed sections explaining when retry is effective vs ineffective
- Inline comment at `handleRetry` states "Children receive same props - structural errors will recur"
- Two `@example` tags showing transient vs structural error scenarios
- IDE hover tooltips show comprehensive retry guidance

## User Persona

**Target User**: Developers using geoform to build form-based applications who encounter rendering errors in their forms.

**Use Case**: A developer's form throws an error during rendering. The error boundary displays with "Try Again" and "Dismiss" buttons. The developer needs to understand when clicking "Try Again" will fix the problem versus when they need to use "Dismiss" and fix the underlying issue.

**User Journey**:
1. Developer encounters a form rendering error
2. Developer hovers over FormErrorBoundary or sees the error UI
3. Developer reads documentation explaining retry behavior
4. Developer makes informed decision: click "Try Again" for transient errors or "Dismiss" for structural errors

**Pain Points Addressed**:
- Developers clicking "Try Again" repeatedly for structural errors that will never resolve
- Confusion about why retry doesn't fix certain types of errors
- Lack of clarity about what changes during retry (same props, fresh internal state)

## Why

- **User Impact**: Prevents developer frustration from ineffective retry attempts, reducing time spent debugging structural errors
- **Integration with Existing Features**: Complements the error boundary implementation added in prior work; provides essential documentation for the retry/dismiss UX
- **Problems Solved**: Clarifies that retry increments `retryCount` to force remount but doesn't fix structural problems like invalid props

## What

Add comprehensive JSDoc and inline comment documentation explaining the FormErrorBoundary retry mechanism.

### Current State (Before Implementation)

The `FormErrorBoundary` component has basic JSDoc but lacks:
- Any explanation of how the retry mechanism works
- Distinction between transient and structural errors
- Guidance on when to use retry vs dismiss
- Inline comments at `handleRetry` reinforcing the same props behavior

### Target State (After Implementation)

The `FormErrorBoundary` component will have:

1. **Component JSDoc Enhancement**: Add "## Retry Behavior" section with four bullet points:
   - **How it works**: Incrementing `retryCount` triggers React state update for remount
   - **Props handling**: Children receive EXACT SAME props as before error
   - **Retryable errors**: Transient failures (network, rendering bugs, race conditions)
   - **Non-retryable errors**: Structural problems (invalid props, type mismatches, missing data)

2. **handleRetry Method JSDoc Expansion**: Add detailed documentation with:
   - "## When Retry Works" section listing transient error scenarios
   - "## When Retry Won't Work" section listing structural error scenarios
   - Clear guidance to use Dismiss for structural errors
   - `@see` reference to `handleDismiss`

3. **Inline Comment Addition**: Add comment at `handleRetry` stating:
   ```typescript
   // Increment retryCount to force React re-render and child remount
   // Note: Children receive same props - structural errors will recur
   ```

4. **Additional Examples**: Add two `@example` tags:
   - Transient error scenario: `<UserForm userId={userId} /> // Network fetch failed`
   - Structural error scenario: `<UserForm userId={undefined} /> // Invalid prop`

### Success Criteria

- [ ] Component JSDoc includes "## Retry Behavior" section after line 41
- [ ] Four bullet points explain: how it works, props handling, retryable errors, non-retryable errors
- [ ] Two `@example` tags show transient vs structural error scenarios
- [ ] `handleRetry` JSDoc includes "## When Retry Works" section
- [ ] `handleRetry` JSDoc includes "## When Retry Won't Work" section
- [ ] Inline comment at `handleRetry` mentions same props limitation
- [ ] `@see` tag links to `handleDismiss` as alternative

## All Needed Context

### Context Completeness Check

**Question**: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"

**Answer**: Yes. This PRP provides:
- Exact file location and current JSDoc state
- Line numbers for precise modification
- Complete code examples of target JSDoc structure
- Patterns from existing codebase to follow
- External documentation references

### Documentation & References

```yaml
# MUST READ - Include these in your context window

- file: src/components/FormErrorBoundary.tsx
  why: This is the target file for documentation enhancement
  pattern: |
    ## Current JSDoc Structure (before enhancement):
    - Component JSDoc at lines 32-50: Has basic description but no "## Retry Behavior" section
    - handleRetry JSDoc at line 127: Currently only has "Reset error state and increment retry count to force child remount."
    - handleRetry implementation at lines 153-160: Has setState with retryCount increment

- file: src/components/FormErrorBoundary.tsx (lines 32-76)
  why: TARGET PATTERN - This is what the component JSDoc should look like AFTER enhancement
  pattern: |
    Use "## Retry Behavior" section with markdown headers and bold bullet points:
    ## Retry Behavior

    The retry mechanism uses `retryCount` to force child component remount:

    - **How it works**: Incrementing `retryCount` triggers a React state update,
      causing the error boundary to re-render and display its children again
    - **Props handling**: Children receive the EXACT SAME props as before the error
    - **Retryable errors**: Transient failures like network issues, temporary
      rendering bugs, or race conditions
    - **Non-retryable errors**: Structural problems like invalid props, type
      mismatches, or missing data will recur and require form dismissal

- file: src/components/FormErrorBoundary.tsx (lines 127-161)
  why: TARGET PATTERN - This is what handleRetry JSDoc should look like AFTER enhancement
  pattern: |
    Use "## When Retry Works" and "## When Retry Won't Work" sections:
    ## When Retry Works

    Retry is effective for TRANSIENT errors that may resolve on remount:
    - Network failures that may succeed on retry
    - Temporary rendering bugs or race conditions
    - Component state corruption that resets on remount

    ## When Retry Won't Work

    Retry is INEFFECTIVE for STRUCTURAL errors that will recur:
    - Invalid or malformed props passed to the child
    - Type mismatches or missing required data
    - Logic errors in the child component's render method

    For structural errors, users should click "Dismiss" instead to close
    the form and fix the underlying issue.

- file: src/hooks/useFormStack.ts
  why: Example of comprehensive JSDoc with @throws, @see, and multiple examples
  pattern: |
    Shows @throws tag for error conditions:
    @throws {Error} When used outside FormStackProvider.
            Error message: "useFormStackState must be used within a FormStackProvider"

- file: src/components/FormStackProvider.tsx
  why: Example of component JSDoc with comprehensive cross-references via @see tags
  pattern: |
    Multiple @see tags showing component relationships:
    @see {@link useFormStack} - Primary hook for form interactions
    @see {@link useFormStackState} - Read-only state access
    @see {@link useFormStackActions} - Actions without state subscription

- file: src/types/form.ts
  why: Example of interface JSDoc with @template and @example tags
  pattern: |
    @template T - The type of value returned when form submits via onSubmit.
                  This type flows through to the Promise returned by openForm().

- url: https://jsdoc.app/tags-example.html
  why: Official JSDoc documentation for @example tag usage
  critical: Use ```tsx code blocks for TypeScript React examples

- url: https://jsdoc.app/tags-see.html
  why: Official JSDoc documentation for @see tag usage
  critical: Use {@link SymbolName} for internal references, plain URLs for external docs

- url: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
  why: Official React documentation on error boundaries and recovery
  critical: Reference this in @see tags for authoritative source

- docfile: plan/bugfix/P1M3T3S1/research/01-JSDoc-Patterns-in-Codebase.md
  why: Complete JSDoc patterns found in the codebase with specific line numbers
  section: Component-Level Pattern and Method-Level Pattern sections

- docfile: plan/bugfix/P1M3T3S1/research/02-JSDoc-Best-Practices.md
  why: JSDoc best practices for React class components including lifecycle methods
  section: Component-Level Documentation Structure and Documenting Class Component Methods

- docfile: plan/bugfix/P1M3T3S1/research/03-Error-Retry-Patterns.md
  why: Industry patterns for documenting retry behavior with transient vs structural error distinction
  section: Industry Best Practices and Documentation Pattern sections
```

### Current Codebase tree (relevant sections only)

```bash
geoform/
├── src/
│   ├── components/
│   │   ├── FormErrorBoundary.tsx  # TARGET FILE - Documentation enhancement
│   │   ├── FormStackProvider.tsx  # Reference for @see tag patterns
│   │   ├── FormStackRenderer.tsx  # Referenced in @see tags
│   │   └── Breadcrumbs.tsx        # Reference for component JSDoc pattern
│   ├── hooks/
│   │   └── useFormStack.ts        # Reference for @throws pattern
│   └── types/
│       └── form.ts                # Reference for @template pattern
└── plan/
    └── bugfix/
        └── P1M3T3S1/
            ├── PRP.md              # This document
            └── research/
                ├── 00-Research-Index.md
                ├── 01-JSDoc-Patterns-in-Codebase.md
                ├── 02-JSDoc-Best-Practices.md
                └── 03-Error-Retry-Patterns.md
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: FormErrorBoundary is the ONLY class component in geoform
// React error boundaries require getDerivedStateFromError and componentDidCatch
// which are only available in class components, not functional components

// CRITICAL: When adding JSDoc, preserve the existing JSDoc structure
// The component JSDoc is a single multi-line comment block - don't create separate blocks

// GOTCHA: TypeScript interface properties use /** */ comments, not JSDoc @param tags
// See FormErrorBoundaryProps interface for example of correct prop documentation

// GOTCHA: The component uses "override" keyword for lifecycle methods
// This is a TypeScript 4.3+ feature for better type checking
// Preserve this when working with componentDidCatch

// GOTCHA: retryCount is in state but not used as a React key
// The state update itself triggers re-render, not the key value
// Don't be tempted to add key={retryCount} - that's not how this works

// PATTERN: Use markdown ## headers WITHIN JSDoc comments for section organization
// Example: ## Retry Behavior, ## When Retry Works, ## When Retry Won't Work
// This improves readability in IDE hover tooltips

// PATTERN: Use ALL CAPS for emphasis within documentation
// Example: TRANSIENT errors, EXACT SAME props, STRUCTURAL errors
// This makes key concepts stand out in long documentation blocks
```

## Implementation Blueprint

### Data models and structure

N/A - This task is documentation-only. No data model changes are required.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ src/components/FormErrorBoundary.tsx
  - EXAMINE: Current JSDoc structure for component class (lines 32-50)
  - EXAMINE: Current handleRetry JSDoc (line 127-129)
  - EXAMINE: handleRetry implementation (lines 153-160)
  - IDENTIFY: Where "## Retry Behavior" section should be inserted (after line 41)
  - PLACEMENT: Documentation changes only, no new files

Task 2: MODIFY Component JSDoc - Add ## Retry Behavior section
  - LOCATION: src/components/FormErrorBoundary.tsx, after line 41 (after "Each form in the stack..." paragraph)
  - INSERT: "## Retry Behavior" section with blank line before and after
  - CONTENT: Four bullet points with bold headers:
    1. **How it works**: Incrementing retryCount triggers React state update
    2. **Props handling**: Children receive EXACT SAME props (use ALL CAPS emphasis)
    3. **Retryable errors**: List transient error types
    4. **Non-retryable errors**: List structural error types, mention form dismissal
  - FORMAT: Use markdown bullet points with - prefix, bold text with **text**
  - PRESERVE: All existing JSDoc content (@see tags, @example tags, description)

Task 3: MODIFY Component JSDoc - Add transient/structural error examples
  - LOCATION: src/components/FormErrorBoundary.tsx, before existing @example block
  - INSERT: Two new @example tags showing transient vs structural errors
  - CONTENT:
    @example
    // Transient error - retry may succeed
    <UserForm userId={userId} />  // Network fetch failed, retry might work

    @example
    // Structural error - retry will fail, use Dismiss instead
    <UserForm userId={undefined} />  // Invalid prop, will always throw
  - FORMAT: Use @example tag with inline code comment (no ```tsx block needed for inline examples)

Task 4: MODIFY handleRetry JSDoc - Expand with detailed sections
  - LOCATION: src/components/FormErrorBoundary.tsx, replace lines 127-129
  - REPLACE: "Reset error state and increment retry count to force child remount."
  - WITH: Multi-paragraph JSDoc with:
    - Opening paragraph explaining retryCount mechanism
    - "## When Retry Works" section with three bullet points
    - "## When Retry Won't Work" section with three bullet points
    - Closing paragraph directing to Dismiss for structural errors
    - @see tag linking to handleDismiss
  - FORMAT: Use markdown ## headers, bullet points with - prefix

Task 5: MODIFY handleRetry implementation - Add inline comments
  - LOCATION: src/components/FormErrorBoundary.tsx, line 154 (inside handleRetry method, before setState)
  - INSERT: Two-line inline comment:
    // Increment retryCount to force React re-render and child remount
    // Note: Children receive same props - structural errors will recur
  - PRESERVE: Existing setState implementation unchanged
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Component JSDoc Enhancement
// Location: src/components/FormErrorBoundary.tsx, insert after line 41

/**
 * Error boundary component for isolating form rendering errors.
 * Provides retry and dismiss options for graceful error recovery.
 *
 * This is the only class component in geoform - React error boundaries
 * require getDerivedStateFromError and componentDidCatch which are only
 * available in class components.
 *
 * Each form in the stack is wrapped with its own error boundary, ensuring
 * that a crash in one form doesn't affect parent forms.
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
 *
 * @see {@link FormStackRenderer} - Uses this to wrap each form
 * @see {@link FormErrorBoundaryProps} - Configuration props
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 *
 * @example
 * ```tsx
 * <FormErrorBoundary
 *   formId="user-form"
 *   onDismiss={() => closeForm()}
 *   onError={(error, info) => logError(error)}
 * >
 *   <UserForm />
 * </FormErrorBoundary>
 * ```
 */
export class FormErrorBoundary extends Component<

// PATTERN: handleRetry JSDoc Expansion
// Location: src/components/FormErrorBoundary.tsx, replace lines 127-129

/**
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
 * @see {@link handleDismiss} - Alternative for structural errors
 */
private handleRetry = (): void => {

// PATTERN: Inline Comment Addition
// Location: src/components/FormErrorBoundary.tsx, line 154 (before setState)

private handleRetry = (): void => {
  // Increment retryCount to force React re-render and child remount
  // Note: Children receive same props - structural errors will recur
  this.setState(prevState => ({
    hasError: false,
    error: null,
    retryCount: prevState.retryCount + 1,
  }));
};

// CRITICAL: The same props limitation is the KEY insight
// Users MUST understand that retry doesn't fix structural problems
// Use ALL CAPS for emphasis: "EXACT SAME props", "SAME props"
```

### Integration Points

```yaml
NO_NEW_INTEGRATIONS:
  - note: "This is a documentation-only task"
  - changes: "JSDoc comments only, no runtime behavior changes"

EXISTING_INTEGRATIONS_TO_PRESERVE:
  - preserve: "@see {@link FormStackRenderer} reference"
  - preserve: "@see {@link FormErrorBoundaryProps} reference"
  - preserve: "@see https://react.dev/... external link"
  - preserve: "@example block with full usage example"
  - preserve: "Existing component description and why it's a class component"

RELATED_FILES:
  - note: "README.md already has Common Pitfalls section covering retry behavior"
  - reference: "Consider adding cross-reference to README section in @see tags"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - JSDoc is just comments, but verify no syntax errors
npm run type-check     # TypeScript should still compile (comments don't affect types)
npm run lint           # ESLint should pass (JSDoc format is valid)

# Check the JSDoc renders properly in IDE
# 1. Open src/components/FormErrorBoundary.tsx
# 2. Hover over "FormErrorBoundary" class name
# 3. Verify "## Retry Behavior" section appears in tooltip
# 4. Hover over "handleRetry" method name
# 5. Verify "## When Retry Works" and "## When Retry Won't Work" sections appear

# Expected: Zero errors. JSDoc comments don't affect runtime.
```

### Level 2: Unit Tests (Documentation Validation)

```bash
# No new tests needed - this is documentation-only
# However, verify existing tests still pass
npm test -- src/components/FormErrorBoundary.test.tsx

# Check that tests exercise the documented behavior
# Tests should cover:
# - Retry increments retryCount
# - Child receives same props on retry
# - Structural errors will recur

# Expected: All existing tests pass. Documentation aligns with test behavior.
```

### Level 3: Integration Testing (Developer Experience Validation)

```bash
# Manual validation of documentation visibility

# 1. Start the development server
npm run dev

# 2. In VS Code or your IDE:
#    a. Open src/components/FormErrorBoundary.tsx
#    b. Cmd+Click (Mac) or Ctrl+Click (Windows) on {@link FormStackRenderer}
#    c. Verify navigation works
#    d. Hover over @see links
#    e. Verify link previews show

# 3. Test hover tooltips:
#    a. Place cursor over "FormErrorBoundary" class name
#    b. Read the full JSDoc in tooltip
#    c. Verify "## Retry Behavior" section is visible
#    d. Verify @example tags show code snippets
#    e. Place cursor over "handleRetry" method
#    f. Verify "## When Retry Works" section is visible
#    g. Verify "## When Retry Won't Work" section is visible

# Expected: Documentation is readable in IDE hover tooltips, @see links work.

# 4. Generate documentation (if using TypeDoc or similar)
#    npm run docs
#    Verify retry behavior documentation appears in generated docs

# Expected: Documentation renders in generated docs site with proper formatting.
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Documentation Quality Checks

# 1. Readability Check
#    Read the JSDoc as if you're a new developer:
#    - Is the distinction between transient and structural errors clear?
#    - Do the examples make sense?
#    - Is the "same props" limitation prominent?

# 2. Cross-Reference Check
#    Verify all @see links work:
#    - {@link FormStackRenderer} - should navigate to component
#    - {@link FormErrorBoundaryProps} - should navigate to interface
#    - {@link handleDismiss} - should navigate to method
#    - https://react.dev/... - should open in browser

# 3. Alignment Check
#    Verify documentation matches actual behavior:
#    - Read handleRetry implementation
#    - Confirm it does increment retryCount
#    - Confirm children receive same props (this is React's behavior)
#    - Confirm no props are modified in the retry flow

# 4. Consistency Check
#    Compare with README.md Common Pitfalls section:
#    - Both should explain transient vs structural errors
#    - Both should mention same props limitation
#    - Terminology should be consistent

# 5. Spelling and Grammar Check
#    Run spell checker if available, or manually review:
#    - "transient" not "transient"
#    - "structural" not "structual"
#    - "recur" not "reoccur"

# Expected: Documentation is clear, accurate, consistent, and typo-free.
```

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compiles without errors: `npm run type-check`
- [ ] ESLint passes: `npm run lint`
- [ ] All existing tests pass: `npm test`
- [ ] JSDoc renders properly in IDE hover tooltips
- [ ] All @see links work (internal and external)

### Feature Validation

- [ ] Component JSDoc includes "## Retry Behavior" section
- [ ] Four bullet points cover: how it works, props handling, retryable errors, non-retryable errors
- [ ] Two @example tags show transient vs structural error scenarios
- [ ] handleRetry JSDoc includes "## When Retry Works" section
- [ ] handleRetry JSDoc includes "## When Retry Won't Work" section
- [ ] Inline comment at handleRetry mentions same props limitation
- [ ] @see {@link handleDismiss} reference is present
- [ ] Documentation aligns with actual code behavior
- [ ] Terminology is consistent with README.md

### Code Quality Validation

- [ ] JSDoc formatting matches existing patterns in codebase
- [ ] Markdown headers (##) are used correctly within JSDoc
- [ ] ALL CAPS emphasis is used sparingly and effectively
- [ ] No typos or grammatical errors
- [ ] @example code is syntactically valid TypeScript/TSX
- [ ] External URLs are correct and accessible

### Documentation & Deployment

- [ ] IDE hover tooltips show complete documentation
- [ ] Cross-reference links navigate to correct locations
- [ ] Documentation is helpful for developers unfamiliar with error boundaries
- [ ] The distinction between transient and structural errors is unambiguous

---

## Anti-Patterns to Avoid

- ❌ Don't modify the component implementation - this is documentation-only
- ❌ Don't add new @param tags - use TypeScript interface comments for props
- ❌ Don't create separate JSDoc blocks - keep everything in one block
- ❌ Don't use "```tsx" for inline examples - use plain code with // comments
- ❌ Don't remove existing @see tags or @example blocks - preserve all existing content
- ❌ Don't use abbreviations like "err" or "tmp" - write out "error" and "temporary"
- ❌ Don't duplicate content from README.md word-for-word - adapt for JSDoc context
- ❌ Don't add JSDoc to private methods except handleRetry (which is key to understanding retry)
- ❌ Don't change the component's name or class structure
- ❌ Don't add runtime validation or warnings - this is documentation only
