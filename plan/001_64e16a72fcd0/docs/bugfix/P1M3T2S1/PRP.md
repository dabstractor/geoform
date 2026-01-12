# Product Requirement Prompt (PRP): Enhance closeForm JSDoc with Usage Guidelines

---

## Goal

**Feature Goal**: Enhance the JSDoc documentation for the `closeForm` function to provide clearer usage guidelines, distinguishing between recommended patterns (using onSubmit/onCancel props) and valid direct use cases (programmatic closure from outside form stack).

**Deliverable**: Enhanced JSDoc comment in `src/hooks/useFormStack.ts` for the `closeForm` function (UseFormStackReturn interface, lines 24-90) with:
1. Expanded usage guidelines explaining primary use vs. direct use cases
2. Code examples showing recommended vs. discouraged usage
3. Warning about improper form cleanup behavior
4. Cross-references to related interfaces and components

**Success Definition**: The enhanced JSDoc should enable developers to:
- Immediately understand when NOT to use closeForm (in form components)
- Identify valid scenarios for direct closeForm usage (programmatic closure)
- Find clear examples of both discouraged and recommended patterns
- Navigate to related documentation via @see tags

## Why

**User Impact**: The `closeForm` function is exported in the public API but documented as "typically used internally." This creates confusion about when consumers should call it directly vs. using the onSubmit/onCancel pattern.

**Integration with Existing Features**:
- **P1.M3.T2.S2**: Complements the development-mode warning implementation (already complete in FormStackProvider.tsx)
- **Architecture Decision**: Respects the Context Splitting Pattern (closeForm available via FormStackActionsContext)
- **Promise Pattern**: Clarifies that direct closeForm() calls bypass the Promise resolution pattern

**Problems This Solves**:
- Addresses the API clarity issue identified in system_context.md: "closeForm() API: Public but 'typically used internally' - unclear when consumers should call directly"
- Reduces accidental misuse of closeForm in form components
- Provides clear guidance for advanced use cases (emergency recovery, programmatic closure)

## What

Modify the JSDoc comment for `closeForm` in `src/hooks/useFormStack.ts` (UseFormStackReturn interface) to:

1. **Expand "When NOT to use" section**: Clarify that forms should use onSubmit/onCancel props from FormStackRenderer
2. **Enhance "When to use" section**: Provide more specific scenarios for direct closeForm usage
3. **Add warning about improper usage**: Explain that calling closeForm() without proper form cleanup may cause unexpected behavior
4. **Add/improve code examples**:
   - Discouraged: Direct closeForm call in form component
   - Recommended: Using onSubmit/onCancel props
   - Valid: Programmatic closure from parent component

### Success Criteria

- [ ] JSDoc includes clear "When NOT to use" and "When to use" sections with bold formatting
- [ ] @example tags show both discouraged and recommended patterns
- [ ] @see tags cross-reference FormProps, FormStackRenderer, and openForm
- [ ] @remarks section explains technical implementation details
- [ ] Warning explains the Promise pattern bypass behavior
- [ ] Documentation follows existing codebase JSDoc conventions

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Exact file location and line numbers for the target JSDoc
- Current JSDoc state for comparison
- Existing JSDoc style conventions from codebase analysis
- JSDoc best practices from external research
- Specific code examples to include in documentation
- Cross-references to related files

### Documentation & References

```yaml
# MUST READ - Primary target file
- file: src/hooks/useFormStack.ts
  why: TARGET FILE - Contains the closeForm JSDoc to enhance (lines 24-90 in UseFormStackReturn interface)
  pattern: Interface property documentation with comprehensive JSDoc
  gotcha: The closeForm JSDoc is already quite complete - verify that enhancements ADD value without redundancy

# MUST READ - Current JSDoc state
- file: src/hooks/useFormStack.ts
  lines: 24-90
  why: Current JSDoc for closeForm - understand existing documentation before enhancing
  pattern: Comprehensive JSDoc with "When NOT to use", "When to use", @remarks, @throws, @see, @example
  gotcha: Current JSDoc already has examples - focus on clarity and specificity

# JSDoc Style Conventions
- file: src/hooks/useFormStack.ts
  lines: 93-135
  why: Reference for JSDoc style conventions in this codebase (useFormStack function documentation)
  pattern: Multi-line descriptions, bold emphasis, @throws with development/production distinction, @see cross-references

- file: src/hooks/useFormStackState.ts
  lines: 5-23
  why: Example of concise but complete hook JSDoc
  pattern: Clear description, @throws, @example with realistic code

- file: src/components/FormStackRenderer.tsx
  lines: 17-29
  why: Example of component JSDoc with architectural explanation
  pattern: Explains hidden container pattern clearly

- file: src/components/FormErrorBoundary.tsx
  lines: 31-76
  why: Example of comprehensive error documentation
  pattern: Multiple examples with context explanations, clear distinction between scenarios

# Form Callback Pattern (Recommended Usage)
- file: src/components/FormStackRenderer.tsx
  lines: 52-77
  why: Shows how FormStackRenderer creates onSubmit/onCancel callbacks that resolve promises and call closeForm
  pattern: Callback creation pattern: inline functions per form entry, resolve promise THEN call onClose()
  gotcha: This is the RECOMMENDED pattern - forms should never bypass this

- file: src/types/form.ts
  lines: 29-36
  why: FormProps interface definition - forms should implement this instead of calling closeForm directly
  pattern: Interface with onSubmit, onCancel, onError callbacks

# Development Warning Implementation
- file: src/components/FormStackProvider.tsx
  lines: 99-121
  why: Existing development-mode console.warn for direct closeForm usage - align JSDoc with this warning
  pattern: Comprehensive warning message with discouraged vs. recommended examples
  gotcha: The console.warn includes code examples - JSDoc should reference or mirror these

# README Documentation (Cross-Reference)
- file: README.md
  lines: 668-714
  why: Existing user-facing documentation about closeForm anti-patterns - ensure JSDoc aligns
  pattern: Explicit anti-pattern section with BAD vs. GOOD examples
  gotcha: README is more detailed - JSDoc should reference it with @see

# Test Examples (Real Usage Patterns)
- file: src/__tests__/integration/test-utils.tsx
  lines: 38-84
  why: ParentFormWithChild shows recommended pattern: parent opens child, uses onSubmit/onCancel
  pattern: Parent component uses openForm() with await, passes onSubmit/onCancel to child

- file: src/__tests__/integration/test-utils.tsx
  lines: 99-110
  why: SimpleTestForm shows minimal recommended pattern
  pattern: Form component receives onSubmit/onCancel props and calls them directly

# Architecture Context
- docfile: plan/architecture/system_context.md
  why: Core architectural patterns - Context Splitting, Hidden Container, Async Imperative API
  section: "Key Architectural Patterns" (lines 42-77)
  gotcha: Hidden Container pattern means forms preserve state with CSS - no explicit cleanup needed

- docfile: plan/bugfix/P1M3T2S1/research/architecture_context.md
  why: Detailed analysis of closeForm context and architectural mismatch
  section: "closeForm Function Context" and "Key Insights for PRP"

# JSDoc Best Practices (External Research)
- docfile: plan/bugfix/P1M3T2S1/research/jsdoc_best_practices.md
  why: Authoritative JSDoc documentation with tag usage patterns
  section: "Recommended Tag Combinations" and "Anti-Pattern Warning" pattern
  gotcha: Focus on @example, @remarks, @warning, @see tag combinations

- url: https://jsdoc.app/tags-example.html
  why: Official @example tag documentation - ensure proper syntax
  critical: Multiple @example blocks are allowed and encouraged for different scenarios

- url: https://jsdoc.app/tags-remarks.html
  why: Official @remarks tag documentation - for technical implementation details
  critical: Use @remarks for content that doesn't fit in @param/@returns

# Codebase JSDoc Patterns Analysis
- docfile: plan/bugfix/P1M3T2S1/research/codebase_jsdoc_patterns.md
  why: Summary of JSDoc conventions observed in this codebase
  section: "Reference Examples" and "Key Patterns for Usage Guidelines"

# Usage Patterns Research
- docfile: plan/bugfix/P1M3T2S1/research/usage_patterns.md
  why: Catalog of actual closeForm usage patterns throughout codebase
  section: "Usage Pattern Analysis" with file locations and line numbers
```

### Current Codebase Tree (Relevant Sections)

```bash
src/
├── hooks/
│   ├── useFormStack.ts          # TARGET FILE - closeForm JSDoc at lines 24-90
│   ├── useFormStackActions.ts   # CloseForm implementation (via context)
│   ├── useFormStackState.ts     # State-only hook (reference for JSDoc style)
│   └── index.ts
├── components/
│   ├── FormStackProvider.tsx    # closeForm implementation with dev warning (lines 99-121)
│   ├── FormStackRenderer.tsx    # Callback injection pattern (lines 52-77)
│   ├── FormErrorBoundary.tsx    # JSDoc reference (lines 31-76)
│   └── __tests__/
├── types/
│   ├── form.ts                  # FormProps interface (lines 29-36)
│   ├── context.ts               # FormStackActions interface
│   └── index.ts
└── __tests__/
    └── integration/
        └── test-utils.tsx       # Usage examples (lines 38-84, 99-110)

plan/
├── architecture/
│   └── system_context.md        # Architectural patterns documentation
└── bugfix/
    └── P1M3T2S1/
        ├── PRP.md               # This document
        └── research/
            ├── jsdoc_best_practices.md
            ├── codebase_jsdoc_patterns.md
            ├── usage_patterns.md
            └── architecture_context.md
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: closeForm JSDoc is already comprehensive (lines 24-90)
// The enhancement should FOCUS on:
// 1. Improving clarity of existing sections
// 2. Adding specific warnings about Promise pattern bypass
// 3. Ensuring @example code is syntactically correct and runnable
// 4. Aligning with the development-mode console.warn message

// CRITICAL: The current JSDoc already has three @example blocks
// Before adding new examples, verify they add NEW value
// Current examples:
// 1. DISCOURAGED: Direct closeForm call in form component
// 2. RECOMMENDED: Use onSubmit/onCancel props
// 3. VALID: Programmatic closure from parent component

// GOTCHA: Hidden Container Pattern (CSS-based hiding)
// Forms are NEVER unmounted, only hidden with display: none
// This means "proper form cleanup" warnings refer to Promise resolution, not component lifecycle
// The JSDoc should clarify that cleanup = resolving deferred promise, not unmounting

// GOTCHA: Development-mode warning already exists in FormStackProvider.tsx
// The JSDoc should reference this warning but not duplicate it exactly
// The console.warn appears when closeForm() is called directly in development

// PATTERN: Context Splitting means closeForm is available via FormStackActionsContext
// This allows components to call closeForm without subscribing to state changes
// The JSDoc should mention this architectural benefit for valid use cases

// PATTERN: @see tags use {@link SymbolName} - Description syntax
// Example: @see {@link FormProps} - Interface forms should implement
// Ensure all @see tags follow this format with clear descriptions

// GOTCHA: TypeScript types are inferred from the code
// JSDoc should NOT redundantly document parameter types that are already in the type signature
// Focus on BEHAVIOR and USAGE, not typing
```

## Implementation Blueprint

### Data Models and Structure

No data model changes - this is a documentation-only update to an existing interface property.

```typescript
// Target: UseFormStackReturn.closeForm property JSDoc
// Location: src/hooks/useFormStack.ts, lines 24-90

// Current state (already comprehensive):
// - "When NOT to use" section with bold warning
// - "When to use" section with bullet points
// - @remarks with technical details
// - @throws documentation
// - @see cross-references
// - Three @example blocks

// Enhancement focus areas:
// 1. Clarify the Promise pattern bypass in @remarks
// 2. Add specific warning about "without proper form cleanup"
// 3. Ensure examples are clear and syntactically correct
// 4. Consider adding "What happens when..." clarity
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ current closeForm JSDoc completely
  - LOCATION: src/hooks/useFormStack.ts, lines 24-90
  - UNDERSTAND: Existing documentation structure and content
  - IDENTIFY: Areas that need enhancement (focus on clarity, not redundancy)
  - DEPENDENCIES: None

Task 2: REVIEW development-mode console.warn
  - LOCATION: src/components/FormStackProvider.tsx, lines 102-118
  - EXTRACT: Warning message and examples
  - ALIGN: Ensure JSDoc guidance matches runtime warning
  - DEPENDENCIES: Task 1

Task 3: VERIFY @example code syntax
  - CHECK: All code examples are syntactically correct TypeScript/JSX
  - VERIFY: Examples match actual usage patterns in codebase
  - REFERENCE: test-utils.tsx for realistic examples
  - DEPENDENCIES: Task 1

Task 4: ENHANCE JSDoc with specific warning
  - ADD: Clear explanation of what "without proper form cleanup" means
  - CLARIFY: Promise pattern bypass behavior
  - REFERENCE: How FormStackRenderer handles promise resolution
  - DEPENDENCIES: Task 1, Task 2

Task 5: VERIFY @see cross-references
  - CHECK: All {@link} references resolve correctly
  - VERIFY: Descriptions are clear and helpful
  - ADD: References to README section if needed
  - DEPENDENCIES: Task 1

Task 6: VALIDATE JSDoc formatting
  - CHECK: Proper spacing and indentation
  - VERIFY: Bold formatting **text** is used consistently
  - ENSURE: @example code blocks have ```tsx or ```typescript
  - DEPENDENCIES: Task 4, Task 5
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Bold formatting for warnings
// Use **text** for emphasis on critical guidance

/**
 * **When NOT to use:** In form components - forms should use the `onSubmit` and `onCancel` props
 * passed by FormStackRenderer instead. Direct `closeForm()` calls bypass the Promise resolution
 * pattern and can cause unexpected behavior.
 */

// PATTERN: Bullet points for valid use cases
/**
 * **When to use:**
 * - Programmatic form closure from a parent component (outside the form stack)
 * - Advanced custom navigation scenarios where you need to dismiss forms without user interaction
 * - Emergency/disaster recovery scenarios
 */

// PATTERN: @remarks for technical details
/**
 * @remarks
 * The `closeForm` function dispatches a `POP_FORM` action directly to the reducer. This is
 * different from the form lifecycle pattern where FormStackRenderer injects `onSubmit`/`onCancel`
 * callbacks that properly resolve the Promise returned by `openForm()`.
 *
 * Calling `closeForm()` directly bypasses the Promise resolution pattern. When a form calls
 * `onSubmit(data)` or `onCancel()`, FormStackRenderer first resolves the deferred promise
 * (which unblocks the parent's `await openForm()`), then calls `onClose()` which triggers
 * `closeForm()`. Direct `closeForm()` calls skip the promise resolution step.
 */

// PATTERN: @see with clear descriptions
/**
 * @see {@link FormProps} - Interface forms should implement instead of calling closeForm
 * @see {@link FormStackRenderer} - Component that injects onSubmit/onCancel into forms
 * @see {@link openForm} - Returns a Promise that resolves via form's onSubmit/onCancel
 */

// PATTERN: @example with clear labels
/**
 * @example
 * ```tsx
 * // DISCOURAGED: Direct closeForm call in a form component
 * function MyForm({ onSubmit, onCancel }: FormProps<Data>) {
 *   const { closeForm } = useFormStack();
 *
 *   // DON'T DO THIS - bypasses Promise pattern, breaks parent's await
 *   const handleSave = () => {
 *     onSubmit(data);
 *     closeForm(); // WRONG! FormStackRenderer handles this via onSubmit
 *   };
 * }
 * ```
 */
```

### Integration Points

```yaml
NO_CODE_CHANGES:
  - This is a documentation-only task
  - No interface changes
  - No implementation changes
  - No test changes required

CROSS_REFERENCES:
  - FormStackProvider.tsx: Ensure JSDoc aligns with console.warn message (lines 102-118)
  - README.md: Consider adding @see reference to README anti-pattern section (lines 668-714)
  - FormProps: Ensure @see {@link FormProps} is present

CONSISTENCY_CHECK:
  - Match JSDoc style of useFormStack function (lines 93-135)
  - Follow codebase JSDoc conventions from codebase_jsdoc_patterns.md research
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after JSDoc modification - ensure no syntax errors
npx tsc --noEmit                      # TypeScript type checking
npm run lint                          # Project linting (if configured)

# Expected: Zero errors. The JSDoc modification should not affect code compilation.

# Note: This is a documentation-only change, so code execution validation is not applicable.
# However, TypeScript should still parse the JSDoc correctly.
```

### Level 2: Documentation Validation (Manual Review)

```bash
# Verify JSDoc renders correctly in IDE
# 1. Open src/hooks/useFormStack.ts in VS Code or similar IDE
# 2. Hover over the closeForm property in UseFormStackReturn interface
# 3. Verify:
#    - All @example code blocks are syntax highlighted
#    - @see links are clickable and resolve correctly
#    - Bold formatting renders correctly
#    - No JSDoc parsing errors in IDE

# Verify JSDoc appears correctly in IntelliSense
# 1. In a test file, type: const { closeForm } = useFormStack();
# 2. Hover over closeForm
# 3. Verify the documentation appears as expected

# Expected: Clean JSDoc rendering, no parsing errors, all links functional.
```

### Level 3: Consistency Validation

```bash
# Cross-reference validation with related documentation
grep -n "closeForm" README.md          # Check README examples align with JSDoc
grep -n "closeForm" src/components/FormStackProvider.tsx  # Check console.warn aligns with JSDoc

# Visual comparison
# 1. Compare JSDoc @example blocks with console.warn message in FormStackProvider.tsx
# 2. Verify the guidance is consistent (both discourage direct calls in forms)
# 3. Check that JSDoc examples match the pattern shown in console.warn

# Expected: Consistent guidance across JSDoc, console.warn, and README.
```

### Level 4: Generation Validation (TypeDoc)

```bash
# If TypeDoc is configured, generate documentation and verify
npm run docs                          # Generate TypeDoc documentation (if configured)

# Check generated documentation
# 1. Open generated docs/index.html or similar
# 2. Navigate to UseFormStackReturn interface
# 3. Verify closeForm documentation renders correctly
# 4. Check that all @example blocks appear formatted
# 5. Verify @see links work in generated docs

# Expected: TypeDoc renders the JSDoc correctly with all examples and references.
```

## Final Validation Checklist

### Technical Validation

- [ ] JSDoc has no syntax errors (TypeScript compiles without errors)
- [ ] All @example code is syntactically correct TypeScript/JSX
- [ ] All {@link} references resolve correctly (IDE can navigate to them)
- [ ] Bold formatting **text** is used correctly
- [ ] Code blocks use ```tsx or ```typescript language tags

### Documentation Quality Validation

- [ ] "When NOT to use" section is clear and prominent
- [ ] "When to use" section provides specific scenarios
- [ ] @remarks explains technical implementation clearly
- [ ] @example blocks show both discouraged and recommended patterns
- [ ] @see tags provide helpful cross-references
- [ ] Warning about Promise pattern bypass is clear

### Consistency Validation

- [ ] JSDoc guidance aligns with console.warn in FormStackProvider.tsx
- [ ] JSDoc guidance aligns with README.md anti-pattern section
- [ ] JSDoc follows codebase JSDoc conventions (see codebase_jsdoc_patterns.md)
- [ ] @example code matches actual usage patterns in codebase

### Completeness Validation

- [ ] Passes "No Prior Knowledge" test: Someone unfamiliar with codebase can understand when to use closeForm
- [ ] All key concepts are explained (Promise pattern, FormStackRenderer, onSubmit/onCancel)
- [ ] Both discouraged and recommended patterns are shown
- [ ] Cross-references provide navigation paths for deeper understanding

---

## Anti-Patterns to Avoid

- ❌ Don't duplicate information that's already clearly stated - enhance, don't repeat
- ❌ Don't add redundant @example blocks if existing ones already cover the scenario
- ❌ Don't use vague warnings - be specific about what "unexpected behavior" means
- ❌ Don't reference non-existent documentation - verify all @see links work
- ❌ Don't make the JSDoc too verbose - balance completeness with readability
- ❌ Don't forget to mention the Promise pattern - this is the KEY reason direct calls are discouraged
- ❌ Don't use inconsistent formatting with the rest of the codebase
- ❌ Don't add type information in JSDoc that's already in the TypeScript signature

## Confidence Score

**8/10** - High confidence for one-pass implementation success.

**Reasoning**:
- Target is well-defined (single JSDoc comment in single file)
- Comprehensive research provides all necessary context
- Existing JSDoc is already good - enhancement scope is clear
- Codebase has consistent JSDoc patterns to follow
- This is documentation-only, reducing risk of breaking changes

**Remaining risk factors**:
- Need to balance enhancement with clarity (avoid over-documentation)
- Must ensure JSDoc examples are syntactically perfect and runnable
- Should verify alignment with existing console.warn message
