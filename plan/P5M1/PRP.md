# PRP: API Documentation (P5.M1)

**Milestone:** P5.M1 - API Documentation
**Project:** React Hierarchical Form Stack System (geoform)
**Status:** Implementation Required
**Estimated Story Points:** 2 SP total (T1.S1: 1, T1.S2: 1)
**Dependencies:** P4.M2 (Complete) - Integration Tests

---

## Goal

**Feature Goal**: Add comprehensive JSDoc comments to all public APIs, ensuring complete documentation coverage with proper type parameter documentation, cross-references, usage examples, and error documentation.

**Deliverable**:
- Enhanced JSDoc documentation in `src/index.ts` (package-level docs)
- Enhanced JSDoc in `src/components/FormStackProvider.tsx` (main provider)
- Enhanced JSDoc in `src/hooks/useFormStack.ts`, `useFormStackState.ts`, `useFormStackActions.ts`
- Enhanced JSDoc in `src/types/form.ts`, `src/types/stack.ts`, `src/types/context.ts`
- Cross-references (`@see`) linking related APIs
- All public exports documented with `@example` blocks

**Success Definition**:
1. Every public export has a JSDoc comment with description
2. All generic types use `@template` with meaningful descriptions
3. All hooks document return values with individual property descriptions
4. All components document props with property descriptions
5. `@throws` documents all error conditions
6. `@see` links related APIs (e.g., useFormStack references FormStackProvider)
7. `@example` blocks show realistic usage patterns
8. `npm run type-check` passes with zero errors
9. Build succeeds with `npm run build`

---

## User Persona

**Target User**: Library consumers (React developers integrating geoform into their applications)

**Use Case**: Reading API documentation via IDE IntelliSense or generated documentation sites

**User Journey**:
1. Developer installs geoform package
2. Developer hovers over `useFormStack` in their IDE to see documentation
3. Documentation explains what the hook does, what it returns, and shows example usage
4. Developer can click @see links to navigate to related APIs
5. Developer understands type parameters when working with generic types

**Pain Points Addressed**:
- Unclear API usage patterns
- Missing context about related functions
- Confusion about generic type parameters
- Unknown error conditions
- Missing examples for complex patterns

---

## Why

- **Developer Experience**: Good documentation reduces time-to-integration for library consumers
- **IDE Integration**: JSDoc powers VS Code IntelliSense tooltips, providing instant documentation
- **Type Safety Understanding**: Generic types need explanation for proper usage
- **Error Handling**: Developers need to know what errors to catch
- **Discoverability**: @see tags help developers find related functionality
- **Maintainability**: Self-documenting code is easier to maintain

---

## What

### Success Criteria

- [ ] All public exports in `src/index.ts` have JSDoc with `@example`
- [ ] All generic interfaces use `@template` with descriptions
- [ ] All hooks document `@returns` with property breakdown
- [ ] All hooks document `@throws` for context errors
- [ ] All components document props interface
- [ ] Cross-references with `@see` link related APIs
- [ ] Package-level `@packageDocumentation` enhanced in `src/index.ts`

---

## All Needed Context

### Context Completeness Check

_"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes - this PRP includes the current documentation state, specific files to modify, patterns to follow, and exact JSDoc tags to add.

### Documentation & References

```yaml
# MUST READ - JSDoc Best Practices Research
- file: plan/P5M1/research/jsdoc-best-practices.md
  why: Comprehensive JSDoc patterns for React/TypeScript
  sections:
    - "1. JSDoc Syntax for TypeScript" - @param, @returns, @template, @throws, @see
    - "2. JSDoc for React Components" - Props documentation patterns
    - "3. Documenting Generic Types" - @template usage for FormProps<T>
    - "6. Documenting Callback Functions" - onSubmit, onCancel patterns
    - "8. Common Pitfalls" - Hook documentation best practices

# Reference - Official Documentation
- url: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
  why: TypeScript JSDoc official reference
  critical: Type annotations are inferred from code, focus on descriptions

- url: https://jsdoc.app/tags-example.html
  why: @example tag syntax with captions
  critical: Use <caption> for multiple examples

- url: https://jsdoc.app/tags-see.html
  why: @see cross-reference syntax
  critical: Use for linking related APIs

# Existing Patterns - Files with Good JSDoc
- file: src/utils/urlEncoding.ts
  why: Excellent example of module-level docs and function docs
  pattern: @module tag, @param with descriptions, @returns, @example blocks

- file: src/utils/createDeferredPromise.ts
  why: Good @template documentation pattern
  pattern: Generic type documented with @template T description

- file: src/hooks/useFormStackState.ts
  why: Hook documentation with @throws
  pattern: @returns, @throws, @example with realistic usage
```

### Current Codebase Tree (Files to Modify)

```bash
src/
├── index.ts                           # MODIFY: Enhance @packageDocumentation, @see links
├── components/
│   ├── FormStackProvider.tsx          # MODIFY: Add @see links, enhance internal docs
│   ├── Breadcrumbs.tsx               # REVIEW: Already has good docs
│   ├── ConfirmationDialog.tsx        # REVIEW: Already has good docs
│   ├── FormErrorBoundary.tsx         # MODIFY: Document class methods better
│   └── FormStackRenderer.tsx         # REVIEW: Internal component, basic docs ok
├── hooks/
│   ├── useFormStack.ts               # MODIFY: Add @see, enhance return docs
│   ├── useFormStackState.ts          # REVIEW: Already has good docs
│   ├── useFormStackActions.ts        # REVIEW: Already has good docs
│   └── useFormStackURLSync.ts        # REVIEW: Already has good docs
├── types/
│   ├── form.ts                       # MODIFY: Enhance @template descriptions
│   ├── stack.ts                      # MODIFY: Enhance @template descriptions
│   └── context.ts                    # MODIFY: Add @see links, enhance action docs
├── context/
│   ├── FormStackContext.ts           # REVIEW: Already has good docs
│   └── formStackReducer.ts           # REVIEW: Already has good docs
└── utils/
    ├── createDeferredPromise.ts      # REVIEW: Already has good docs
    └── urlEncoding.ts                # REVIEW: Already has good docs
```

### Current Documentation State Analysis

**Already Well-Documented (No Changes Needed):**
- `src/utils/urlEncoding.ts` - Complete with @module, @param, @returns, @example
- `src/utils/createDeferredPromise.ts` - Complete with @template, @example
- `src/context/FormStackContext.ts` - Complete with context purpose docs
- `src/context/formStackReducer.ts` - Complete with @param, @returns

**Needs Enhancement:**
- `src/index.ts` - Add @see links between related exports
- `src/types/form.ts` - Enhance @template T descriptions
- `src/types/stack.ts` - Enhance @template T descriptions
- `src/types/context.ts` - Add @see links to hooks
- `src/hooks/useFormStack.ts` - Add @see FormStackProvider
- `src/components/FormStackProvider.tsx` - Add @see hooks, enhance internal method docs
- `src/components/FormErrorBoundary.tsx` - Document getDerivedStateFromError, componentDidCatch better

### Known Gotchas & Best Practices

```typescript
// CRITICAL: In TypeScript, don't duplicate types in JSDoc - they're inferred
// BAD:
/**
 * @param {string} value - The value
 */
function example(value: string) {}

// GOOD:
/**
 * @param value - The value to process
 */
function example(value: string) {}

// CRITICAL: Use @template for generic type parameters
/**
 * Props interface for forms in the stack.
 * @template T - The type of value returned when form submits
 */
export interface FormProps<T> { ... }

// CRITICAL: Document hook return properties individually
/**
 * @returns Object with stack state and actions
 * @returns stack - Current form stack (read-only)
 * @returns openForm - Opens a new form, returns promise
 * @returns closeForm - Closes current form
 */

// CRITICAL: Use @see for cross-referencing
/**
 * @see {@link FormStackProvider} - Required wrapper component
 * @see {@link FormProps} - Interface forms must implement
 */

// CRITICAL: @throws for context-dependent hooks
/**
 * @throws {Error} When used outside FormStackProvider
 */
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models needed - this task enhances existing JSDoc documentation.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ENHANCE src/types/form.ts
  - ADD: Enhanced @template T description for FormProps
  - ADD: Enhanced @template T description for DeferredPromise
  - FOLLOW pattern: plan/P5M1/research/jsdoc-best-practices.md Section 3
  - EXAMPLE:
    /**
     * Props interface that all form components must implement.
     * Forms receive these callbacks from FormStackProvider.
     *
     * @template T - The type of value returned when form submits via onSubmit.
     *               This type flows through to the Promise returned by openForm().
     *
     * @see {@link OpenFormOptions} - Options passed to openForm()
     * @see {@link useFormStack} - Hook to open forms
     */

Task 2: ENHANCE src/types/stack.ts
  - ADD: Enhanced @template T descriptions for OpenFormOptions, InternalStackEntry
  - ADD: @see links to related types
  - FOLLOW pattern: Task 1 style
  - EXAMPLE:
    /**
     * Options passed to openForm() to open a new form.
     *
     * @template T - The type of value the form will return. Must match the
     *               component's FormProps<T> type parameter.
     *
     * @see {@link FormProps} - Props interface the component must accept
     * @see {@link StackEntry} - Public view of stack entries
     */

Task 3: ENHANCE src/types/context.ts
  - ADD: @see links from FormStackActions to hooks
  - ADD: Enhanced @param descriptions for action methods
  - EXAMPLE:
    /**
     * Actions exposed by FormStackActionsContext.
     * Separated from state to minimize re-renders (context splitting pattern).
     *
     * @see {@link useFormStackActions} - Hook to access these actions
     * @see {@link useFormStack} - Combined hook for state + actions
     */

Task 4: ENHANCE src/hooks/useFormStack.ts
  - ADD: @see link to FormStackProvider
  - ADD: @see link to FormProps
  - ADD: Enhanced return value documentation
  - VERIFY: @throws already present
  - EXAMPLE:
    /**
     * Combined hook providing both form stack state and actions.
     * Use this when a component needs to both read state AND dispatch actions.
     *
     * For optimal performance, prefer useFormStackState or useFormStackActions
     * when only one is needed.
     *
     * @returns Object containing stack state and form actions
     * @property {readonly StackEntry[]} stack - Current form stack (read-only)
     * @property {function} openForm - Opens a new form, returns Promise<T | undefined>
     * @property {function} closeForm - Closes current form without returning data
     *
     * @throws {Error} If used outside FormStackProvider
     *
     * @see {@link FormStackProvider} - Required wrapper component
     * @see {@link FormProps} - Interface forms must implement
     * @see {@link useFormStackState} - State-only hook (more performant)
     * @see {@link useFormStackActions} - Actions-only hook (more performant)
     *
     * @example
     * ```tsx
     * function FormManager() {
     *   const { stack, openForm, closeForm } = useFormStack();
     *
     *   const handleCreate = async () => {
     *     const result = await openForm({
     *       id: 'create-user',
     *       component: CreateUserForm,
     *       label: 'Create User',
     *     });
     *     if (result) {
     *       console.log('Created user:', result);
     *     }
     *   };
     *
     *   return (
     *     <div>
     *       <span>Forms open: {stack.length}</span>
     *       <button onClick={handleCreate}>Create User</button>
     *     </div>
     *   );
     * }
     * ```
     */

Task 5: ENHANCE src/components/FormStackProvider.tsx
  - ADD: @see links to hooks in component JSDoc
  - ADD: Enhanced internal method documentation for requestConfirmation, popToIndex
  - VERIFY: FormStackProviderProps already documented
  - EXAMPLE:
    /**
     * Provider component for the form stack system.
     * Uses dual-context pattern to separate state from actions,
     * minimizing re-renders for components that only dispatch actions.
     *
     * @see {@link useFormStack} - Primary hook for form interactions
     * @see {@link useFormStackState} - Read-only state access
     * @see {@link useFormStackActions} - Actions without state subscription
     * @see {@link Breadcrumbs} - Navigation component for stack
     *
     * @example
     * ```tsx
     * import { FormStackProvider } from 'geoform';
     *
     * function App() {
     *   return (
     *     <FormStackProvider>
     *       <YourApp />
     *     </FormStackProvider>
     *   );
     * }
     * ```
     */

Task 6: ENHANCE src/components/FormErrorBoundary.tsx
  - ADD: Enhanced JSDoc for getDerivedStateFromError explaining "no side effects"
  - ADD: Enhanced JSDoc for componentDidCatch explaining "commit phase"
  - ADD: @see link to FormStackRenderer
  - EXAMPLE:
    /**
     * Static lifecycle method called during render phase.
     * Updates state to show fallback UI on next render.
     *
     * CRITICAL: No side effects allowed in this method.
     * Side effects (logging, callbacks) must be in componentDidCatch.
     *
     * @param error - The error that was thrown
     * @returns Partial state update to trigger error UI
     *
     * @see https://react.dev/reference/react/Component#static-getderivedstatefromerror
     */

Task 7: ENHANCE src/index.ts
  - ADD: @see links between related exports
  - ADD: Enhanced @packageDocumentation with feature list
  - VERIFY: All exports have JSDoc
  - EXAMPLE for @packageDocumentation:
    /**
     * React Hierarchical Form Stack System (geoform)
     *
     * A batteries-included React system for managing infinitely nestable
     * hierarchical forms where users may create required relational data
     * at any point without enforced order.
     *
     * ## Quick Start
     *
     * ```tsx
     * import { FormStackProvider, useFormStack, type FormProps } from 'geoform';
     *
     * function App() {
     *   return (
     *     <FormStackProvider>
     *       <YourApp />
     *     </FormStackProvider>
     *   );
     * }
     *
     * function CreateButton() {
     *   const { openForm } = useFormStack();
     *
     *   const handleClick = async () => {
     *     const result = await openForm({
     *       id: 'create-user',
     *       component: UserForm,
     *       label: 'Create User',
     *     });
     *     if (result) console.log('Created:', result);
     *   };
     *
     *   return <button onClick={handleClick}>Create User</button>;
     * }
     * ```
     *
     * ## Core Concepts
     *
     * - **Form Stack**: A stack of suspended form components where only the top is visible
     * - **State Preservation**: Parent forms remain mounted (hidden) while children are active
     * - **Promise-Based API**: `openForm()` returns a Promise that resolves when form closes
     * - **Breadcrumb Navigation**: Click breadcrumbs to cancel intermediate forms
     * - **Error Isolation**: Each form is wrapped in an error boundary
     *
     * @packageDocumentation
     * @module geoform
     */
```

### Implementation Patterns & Key Details

```typescript
// ============================================================
// PATTERN 1: @see Cross-References Between Related APIs
// ============================================================

// In hooks/useFormStack.ts:
/**
 * @see {@link FormStackProvider} - Required wrapper component
 * @see {@link FormProps} - Interface forms must implement
 */

// In types/form.ts:
/**
 * @see {@link OpenFormOptions} - Options passed to openForm()
 * @see {@link useFormStack} - Hook to open forms
 */

// ============================================================
// PATTERN 2: @template for Generic Types
// ============================================================

/**
 * Props interface that all form components must implement.
 *
 * @template T - The type of value returned when form submits via onSubmit.
 *               This type flows through to the Promise returned by openForm().
 *               Use `unknown` for forms that don't return data.
 *
 * @example
 * ```tsx
 * interface UserData { name: string; email: string; }
 *
 * function UserForm({ onSubmit, onCancel }: FormProps<UserData>) {
 *   return (
 *     <form onSubmit={() => onSubmit({ name: 'John', email: 'john@example.com' })}>
 *       ...
 *     </form>
 *   );
 * }
 * ```
 */
export interface FormProps<T = unknown> { ... }

// ============================================================
// PATTERN 3: Hook Return Value Documentation
// ============================================================

/**
 * @returns Object containing stack state and form actions
 * @property {readonly StackEntry[]} stack - Current form stack (read-only).
 *           Each entry contains id and optional label for breadcrumb display.
 * @property {function} openForm - Opens a new form and returns Promise.
 *           Promise resolves with form value on submit, undefined on cancel.
 * @property {function} closeForm - Closes current form without returning data.
 *           Typically used internally; forms use onSubmit/onCancel instead.
 */

// ============================================================
// PATTERN 4: @throws for Error Conditions
// ============================================================

/**
 * @throws {Error} When used outside FormStackProvider.
 *         Error message: "useFormStack must be used within a FormStackProvider."
 */
```

### Integration Points

```yaml
NO NEW INTEGRATION POINTS:
  - This task only modifies JSDoc comments
  - No runtime code changes
  - No new dependencies
  - No configuration changes
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# TypeScript should still compile - JSDoc doesn't affect types
npm run type-check

# Expected: Zero errors
# If errors: JSDoc syntax error (unclosed comment, etc.)
```

### Level 2: Build Verification

```bash
# Ensure build still works
npm run build

# Expected: dist/ files generated
# TypeDoc/documentation should pick up new JSDoc
```

### Level 3: Visual Verification (IDE IntelliSense)

```bash
# Open VS Code and hover over:
# 1. useFormStack - should show @see links
# 2. FormProps<T> - should show @template description
# 3. FormStackProvider - should show @example

# In VS Code, use "Go to Definition" on @see links
# Links should navigate to correct symbols
```

### Level 4: Documentation Completeness Check

```bash
# Search for public exports without JSDoc
grep -rn "^export " src/ | grep -v "/\*\*"

# Expected: All exports should have preceding JSDoc
# If missing: Add JSDoc block above export
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run build` succeeds
- [ ] No JSDoc syntax errors (unclosed comments, etc.)

### Documentation Coverage

- [ ] All public exports in `src/index.ts` have JSDoc
- [ ] All hooks have @throws for context errors
- [ ] All generic types have @template with descriptions
- [ ] All hooks document return value properties

### Cross-Reference Validation

- [ ] `useFormStack` @see links to FormStackProvider, FormProps
- [ ] `FormStackProvider` @see links to hooks
- [ ] `FormProps` @see links to OpenFormOptions, useFormStack
- [ ] `OpenFormOptions` @see links to FormProps

### Example Validation

- [ ] `useFormStack` has realistic @example
- [ ] `FormStackProvider` has wrapping @example
- [ ] `FormProps` has form implementation @example

### Code Quality Validation

- [ ] JSDoc descriptions are concise and actionable
- [ ] @template descriptions explain type flow
- [ ] @example code is realistic and follows library patterns
- [ ] No duplicate documentation (types already in TypeScript)

---

## Anti-Patterns to Avoid

- **DON'T** duplicate TypeScript types in JSDoc (types are inferred)
- **DON'T** use @param {Type} in TypeScript files (type is from code)
- **DON'T** write verbose descriptions when concise ones work
- **DON'T** forget @throws for hooks that require context
- **DON'T** create @see links to internal/private APIs
- **DON'T** add @example that duplicates existing examples
- **DON'T** document internal implementation details in public API docs

---

## Confidence Score

**9/10** - High confidence for one-pass implementation

**Rationale:**
- Codebase already has substantial JSDoc coverage
- Task is enhancement, not creation from scratch
- Clear patterns established in existing files (urlEncoding.ts, createDeferredPromise.ts)
- Comprehensive research document with exact syntax examples
- No runtime code changes, only documentation
- TypeScript compiler validates JSDoc syntax

**Risk Factors:**
- IDE IntelliSense behavior may vary by editor
- @see link syntax must be exact or links won't work
- Large @example blocks may clutter tooltips

---

## Quick Implementation Commands

```bash
# Run type check after changes
npm run type-check

# Build to ensure no issues
npm run build

# Run tests to verify no regressions
npm run test

# Full validation
npm run type-check && npm run build && npm run test
```

---

## References

### Internal Documentation
- `plan/P5M1/research/jsdoc-best-practices.md` - Comprehensive JSDoc patterns
- `plan/architecture/summary.md` - Project overview and architecture

### Existing Well-Documented Files (Reference Patterns)
- `src/utils/urlEncoding.ts` - Module-level docs, @example
- `src/utils/createDeferredPromise.ts` - @template documentation
- `src/hooks/useFormStackState.ts` - Hook docs with @throws

### External Documentation
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [JSDoc @see Tag](https://jsdoc.app/tags-see.html)
- [JSDoc @example Tag](https://jsdoc.app/tags-example.html)
- [JSDoc @template Tag](https://jsdoc.app/tags-template.html)
