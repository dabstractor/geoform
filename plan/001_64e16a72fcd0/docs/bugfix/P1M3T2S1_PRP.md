name: "P1.M3.T2.S1: Enhance closeForm JSDoc with usage guidelines"
description: |

---

## Goal

**Feature Goal**: Expand the JSDoc documentation for the `closeForm` function to provide clear guidance on when to use it versus when to use `onSubmit`/`onCancel` props, including warnings about improper usage and code examples showing recommended vs discouraged patterns.

**Deliverable**: Enhanced JSDoc documentation in `src/hooks/useFormStack.ts` for the `closeForm` function in the `UseFormStackReturn` interface (lines 24-28).

**Success Definition**:
- JSDoc clearly explains primary use case (internal use, forms should use onSubmit/onCancel)
- JSDoc documents direct use cases (programmatic closure from outside form stack, advanced custom navigation)
- JSDoc includes warning about improper usage
- JSDoc includes code example showing recommended vs discouraged usage
- Documentation follows existing JSDoc patterns in the codebase
- TypeScript compilation passes with no errors

---

## User Persona

**Target User**: Library consumer/developer using the geoform library to build form workflows

**Use Case**: A developer is exploring the `useFormStack` API and encounters the `closeForm` function. They need to understand whether they should call `closeForm` directly in their form components or use the `onSubmit`/`onCancel` props passed by the framework.

**User Journey**:
1. Developer reads `useFormStack` type definitions or IDE autocomplete
2. Sees `closeForm: () => void` in the `UseFormStackReturn` interface
3. Reads enhanced JSDoc which clearly explains when to use vs not use closeForm
4. Developer understands that form components should use `onSubmit`/`onCancel` props
5. Developer only uses `closeForm` for advanced scenarios (programmatic closure from parent, custom navigation)

**Pain Points Addressed**:
- **Current minimal documentation** ("Typically used internally") doesn't explain WHY or WHEN
- **Developers may incorrectly call closeForm directly in forms**, breaking the Promise-based pattern
- **No clear guidance** on what "advanced custom navigation" means
- **No examples** showing proper vs improper usage

---

## Why

- **API Clarity**: Current documentation "Typically used internally; forms use onSubmit/onCancel instead" is too brief and doesn't explain the underlying architecture
- **Prevent Misuse**: Direct closeForm calls in form components break the Promise-based async/await pattern
- **Architectural Understanding**: Developers need to understand the FormStackRenderer injection pattern to use the library correctly
- **Consistency**: Other functions like `popToIndex` have comprehensive JSDoc with usage examples (P1.M3.T1.S1)
- **Onboarding**: New developers to the codebase need clear guidance on proper form lifecycle patterns
- **Type Safety**: The Promise return type of `openForm()` relies on forms using `onSubmit`/`onCancel` - direct `closeForm` bypasses this

---

## What

### Success Criteria

- [ ] Enhanced JSDoc added to `closeForm` in `UseFormStackReturn` interface (src/hooks/useFormStack.ts lines 24-28)
- [ ] JSDoc explains primary use: forms should use onSubmit/onCancel props passed from FormStackRenderer
- [ ] JSDoc documents direct use cases: programmatic closure from outside form stack, advanced custom navigation
- [ ] JSDoc includes warning about improper usage (calling closeForm without proper form cleanup)
- [ ] JSDoc includes code example showing recommended vs discouraged usage
- [ ] Documentation follows existing JSDoc patterns from the codebase (multi-line descriptions, @example blocks, @see tags)
- [ ] TypeScript compilation passes with no errors

### Implementation Contract

The enhanced JSDoc should follow this structure:

```typescript
/**
 * Closes the current form without returning data.
 *
 * **When NOT to use:** In form components - forms should use the `onSubmit` and `onCancel` props
 * passed by FormStackRenderer instead. Direct `closeForm()` calls bypass the Promise resolution
 * pattern and can cause unexpected behavior.
 *
 * **When to use:**
 * - Programmatic form closure from a parent component (outside the form stack)
 * - Advanced custom navigation scenarios where you need to dismiss forms without user interaction
 * - Emergency/disaster recovery scenarios
 *
 * @remarks
 * The `closeForm` function dispatches a `POP_FORM` action directly to the reducer. This is
 * different from the form lifecycle pattern where FormStackRenderer injects `onSubmit`/`onCancel`
 * callbacks that properly resolve the Promise returned by `openForm()`.
 *
 * @throws {Error} When used outside FormStackProvider context
 *
 * @see {@link FormProps} - Interface forms should implement instead of calling closeForm
 * @see {@link FormStackRenderer} - Component that injects onSubmit/onCancel into forms
 * @see {@link openForm} - Returns a Promise that resolves via form's onSubmit/onCancel
 *
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
 *
 * @example
 * ```tsx
 * // RECOMMENDED: Use onSubmit/onCancel props in form components
 * function MyForm({ onSubmit, onCancel }: FormProps<Data>) {
 *   const handleSave = () => {
 *     onSubmit(data); // FormStackRenderer will call closeForm() internally
 *   };
 *
 *   const handleCancel = () => {
 *     onCancel(); // FormStackRenderer will call closeForm() internally
 *   };
 * }
 * ```
 *
 * @example
 * ```tsx
 * // VALID: Programmatic closure from parent component (outside form stack)
 * function ParentComponent() {
 *   const { closeForm, stack } = useFormStack();
 *
 *   // Emergency close all forms scenario
 *   const handleEmergencyClose = () => {
 *     while (stack.length > 0) {
 *       closeForm();
 *     }
 *   };
 * }
 * ```
 */
closeForm: () => void;
```

---

## All Needed Context

### Context Completeness Check

_Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

✓ Source file (useFormStack.ts) fully analyzed
✓ Current closeForm JSDoc documented (minimal)
✓ FormStackRenderer injection pattern analyzed
✓ Proper form usage examples found (UserForm.tsx)
✓ Existing JSDoc patterns researched (popToIndex, useFormStackActions)
✓ TypeScript configuration verified (strict mode)
✓ Architecture context understood (Promise-based pattern)

### Documentation & References

```yaml
# MUST READ - Primary Implementation File
- file: /home/dustin/projects/geoform/src/hooks/useFormStack.ts
  why: The file containing the closeForm JSDoc to enhance (lines 24-28 in UseFormStackReturn interface)
  pattern: |
    Lines 13-29: UseFormStackReturn interface definition
    Lines 24-28: Current closeForm JSDoc (minimal: "Typically used internally; forms use onSubmit/onCancel instead.")
  critical: |
    Current implementation:
    ```typescript
    export interface UseFormStackReturn {
      stack: readonly StackEntry[];
      openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
      /**
       * Closes the current form without returning data.
       * Typically used internally; forms use onSubmit/onCancel instead.
       */
      closeForm: () => void;
    }
    ```

# MUST READ - closeForm Implementation
- file: /home/dustin/projects/geoform/src/components/FormStackProvider.tsx
  why: Shows the actual closeForm implementation (dispatches POP_FORM action)
  pattern: Lines 99-101
  critical: |
    ```typescript
    const closeForm = useCallback(() => {
      dispatch({ type: 'POP_FORM' });
    }, []);
    ```
    This is a simple reducer dispatch - no Promise resolution, no form cleanup.

# MUST READ - FormStackRenderer Injection Pattern
- file: /home/dustin/projects/geoform/src/components/FormStackRenderer.tsx
  why: Shows how onSubmit/onCancel are injected into forms and why they should be used
  pattern: Lines 42-67
  critical: |
    ```typescript
    // Create callbacks that resolve the deferred promise
    const handleSubmit = (value: unknown) => {
      entry.deferred.resolve(value);  // Resolves the openForm() Promise
      onClose();  // Calls closeForm internally
    };

    const handleCancel = async () => {
      const confirmed = await onCancelRequest(entry);
      if (!confirmed) return;
      entry.deferred.resolve(undefined);  // Resolves Promise with undefined
      onClose();  // Calls closeForm internally
    };

    // Inject callbacks into the form component
    const formProps: FormProps<unknown> = {
      onSubmit: handleSubmit,
      onCancel: handleCancel,
      onError: handleError,
    };
    ```
    This is the PROPER pattern - forms receive these props and should use them.

# MUST READ - Proper Form Usage Example
- file: /home/dustin/projects/geoform/examples/relational-forms/UserForm.tsx
  why: Shows the recommended pattern for forms using onSubmit/onCancel
  pattern: Lines 33-111
  critical: |
    ```typescript
    export function UserForm({ onSubmit, onCancel }: FormProps<NewUser>) {
      const handleSubmit = () => {
        if (!name.trim() || !email.trim()) return;
        onSubmit({ name: name.trim(), email: email.trim(), role });
        // No closeForm() call! onSubmit handles everything
      };

      return (
        <div className="form user-form">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" onClick={handleSubmit}>Add User</button>
        </div>
      );
    }
    ```

# MUST READ - FormProps Interface
- file: /home/dustin/projects/geoform/src/types/form.ts
  why: Shows the interface forms must implement
  pattern: Lines 29-36
  critical: |
    ```typescript
    export interface FormProps<T = unknown> {
      /** Called when form submits with the form's return value */
      onSubmit: (value: T) => void;
      /** Called when form is canceled (returns undefined to parent) */
      onCancel: () => void;
      /** Optional error handler for form-level errors */
      onError?: (error: unknown) => void;
    }
    ```

# MUST READ - FormStackActions Interface (parallel JSDoc location)
- file: /home/dustin/projects/geoform/src/types/context.ts
  why: The closeForm function is also documented here (lines 39-40) - should be consistent
  pattern: Line 39-40
  critical: |
    ```typescript
    /**
     * Closes the current form (internal use - forms use onSubmit/onCancel instead).
     */
    closeForm: () => void;
    ```
    NOTE: This is a separate location that may also need updating for consistency.

# REFERENCE - Comprehensive JSDoc Pattern (popToIndex)
- file: /home/dustin/projects/geoform/src/components/FormStackProvider.tsx
  why: Example of comprehensive JSDoc with @throws, development/production behavior
  pattern: Lines 103-111
  critical: |
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

# REFERENCE - Hook Documentation Pattern
- file: /home/dustin/projects/geoform/src/hooks/useFormStackActions.ts
  why: Shows pattern for hook JSDoc with performance notes and examples
  pattern: Lines 5-32
  critical: |
    ```typescript
    /**
     * Hook to access form stack actions (dispatch).
     * Components using this hook will NOT re-render when stack changes.
     * Optimizes performance for components that only need to dispatch actions.
     *
     * @returns FormStackActions containing openForm and closeForm functions
     * @throws Error if used outside FormStackProvider
     *
     * @example
     * ```typescript
     * function CreateButton() {
     *   const { openForm } = useFormStackActions();
     *   const handleClick = async () => {
     *     const result = await openForm({...});
     *   };
     * }
     * ```
     */
    ```

# REFERENCE - Multiple @example Blocks Pattern
- file: /home/dustin/projects/geoform/src/types/stack.ts
  why: Shows pattern for multiple @example blocks with detailed comments
  pattern: Lines 60-82 (OpenFormOptions JSDoc)
  critical: Uses multiple @example blocks to show different scenarios

# CONFIGURATION - TypeScript Settings
- file: /home/dustin/projects/geoform/tsconfig.json
  why: Verify TypeScript strict mode is enabled (affects type checking)
  pattern: Line 7: "strict": true
  gotcha: No unused parameters allowed - JSDoc must be accurate

# EXTERNAL - JSDoc Best Practices
- url: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
  why: TypeScript JSDoc reference for supported tags and syntax
  section: @example, @throws, @see, @remarks

# EXTERNAL - TSDoc Specification
- url: https://tsdoc.org/
  why: Standard documentation format for TypeScript
  section: "@example blocks, @remarks for additional notes"

# EXTERNAL - Documenting React with JSDoc
- url: https://schof.co/writing-jsdoc-for-react-components/
  why: Best practices for React component and hook documentation
  critical: Use multiple @example blocks with <caption> tags for different scenarios

# RESEARCH - Existing JSDoc Patterns
- docfile: /home/dustin/projects/geoform/plan/P5M1/research/jsdoc-best-practices.md
  why: Project-specific JSDoc conventions and patterns
  section: Entire document - comprehensive reference
```

### Current Codebase Tree

```bash
src/
├── hooks/
│   ├── useFormStack.ts              # MODIFY: Enhance closeForm JSDoc (lines 24-28)
│   ├── useFormStackActions.ts       # READ: Reference for JSDoc patterns
│   └── useFormStackState.ts         # READ: Reference for JSDoc patterns
├── components/
│   ├── FormStackProvider.tsx        # READ: closeForm implementation (lines 99-101)
│   └── FormStackRenderer.tsx        # READ: onSubmit/onCancel injection pattern (lines 42-67)
├── types/
│   ├── context.ts                   # NOTE: closeForm also documented here (line 39-40)
│   ├── form.ts                      # READ: FormProps interface definition
│   └── stack.ts                     # READ: OpenFormOptions JSDoc patterns
└── examples/
    └── relational-forms/
        └── UserForm.tsx             # READ: Proper form usage example
```

### Desired Codebase Tree After Implementation

```bash
src/
├── hooks/
│   └── useFormStack.ts              # MODIFIED: Enhanced closeForm JSDoc
```

**File Responsibility:**
- `useFormStack.ts` - Enhanced JSDoc for closeForm function in UseFormStackReturn interface

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: closeForm is documented in TWO locations
// Location 1: src/hooks/useFormStack.ts (line 24-28) - PRIMARY TARGET
// Location 2: src/types/context.ts (line 39-40) - Consider updating for consistency

// CRITICAL: The Promise-based architecture relies on proper form lifecycle
// When a form calls onSubmit(value), FormStackRenderer:
// 1. Resolves the Promise with the value: entry.deferred.resolve(value)
// 2. Calls closeForm internally: onClose()
// If a form calls closeForm() directly without calling onSubmit/onCancel:
// - The Promise from openForm() never resolves
// - The parent awaiting openForm() hangs indefinitely

// CRITICAL: FormStackRenderer injects callbacks, forms don't import them
// Form components receive onSubmit/onCancel via props from FormStackRenderer
// They are NOT imported from hooks - they're injected by the framework

// GOTCHA: closeForm vs onCancel - different purposes
// onCancel: Form prop that triggers confirmation dialog, then resolves Promise with undefined
// closeForm: Direct dispatch of POP_FORM action, no confirmation, no Promise resolution

// GOTCHA: Multiple @example blocks are supported and recommended
// Use @example blocks to show:
// 1. Discouraged pattern (direct closeForm in form)
// 2. Recommended pattern (onSubmit/onCancel props)
// 3. Valid external usage (programmatic closure)

// PATTERN: Use @remarks for additional warnings/guidance
// @remarks is for notes that don't fit in @param or @returns
// Perfect for "When NOT to use" warnings

// PATTERN: @see tags for cross-references
// Link to FormProps, FormStackRenderer, openForm for context
// Helps developers understand the architecture

// GOTCHA: TypeScript strict mode with noUnusedParameters
// All parameters in JSDoc @param tags must match actual function signature
// closeForm: () => void has no parameters, so no @param tags needed

// GOTCHA: @throws should document the Error condition
// closeForm throws when used outside FormStackProvider
// This is inherited from the useContext null check in useFormStackActions

// STYLE: Multi-line descriptions for complex guidance
// The "When NOT to use" and "When to use" sections should be formatted clearly
// Use **bold** for emphasis, code formatting for function names

// REFERENCE: popToIndex JSDoc style (P1.M3.T1.S1)
// Clear description, @param with bounds, @throws with development/production distinction
// Similar pattern should be followed for closeForm
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models. This is a documentation-only change.

The data structure being documented is:

```typescript
export interface UseFormStackReturn {
  stack: readonly StackEntry[];
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  closeForm: () => void;  // Target of enhancement
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ src/hooks/useFormStack.ts (lines 24-28)
  - UNDERSTAND: Current closeForm JSDoc location and format
  - IDENTIFY: Line 24-28 in UseFormStackReturn interface
  - NOTE: Current minimal documentation: "Typically used internally; forms use onSubmit/onCancel instead."

Task 2: READ related documentation for consistency
  - READ: src/types/context.ts line 39-40 (parallel closeForm documentation)
  - READ: src/components/FormStackRenderer.tsx lines 42-67 (injection pattern)
  - READ: examples/relational-forms/UserForm.tsx (proper usage example)
  - READ: src/components/FormStackProvider.tsx lines 103-111 (popToIndex JSDoc pattern)

Task 3: ENHANCE closeForm JSDoc in UseFormStackReturn interface
  - REPLACE: Current minimal JSDoc with comprehensive documentation
  - ADD: "When NOT to use" section explaining forms should use onSubmit/onCancel
  - ADD: "When to use" section documenting valid external use cases
  - ADD: @remarks explaining the POP_FORM dispatch pattern
  - ADD: @throws documenting the Error when used outside provider
  - ADD: @see tags linking to FormProps, FormStackRenderer, openForm
  - ADD: Multiple @example blocks showing discouraged/recommended/valid patterns
  - FOLLOW: Existing JSDoc style from popToIndex (lines 103-111 in FormStackProvider.tsx)
  - PRESERVE: Function signature (closeForm: () => void;)

Task 4: VERIFY TypeScript compilation
  - RUN: npx tsc --noEmit or npm run type-check
  - EXPECTED: Zero errors
  - CHECK: JSDoc formatting is valid TypeScript

Task 5: CONSIDER updating src/types/context.ts for consistency
  - OPTIONAL: Update line 39-40 to match enhanced documentation
  - DECISION: If updated, ensure consistency between both locations
  - NOTE: This is secondary - primary target is useFormStack.ts

Task 6: VERIFY documentation renders correctly in IDE
  - TEST: Hover over closeForm in TypeScript IDE
  - VERIFY: All @example blocks display correctly
  - VERIFY: @see links are clickable
  - VERIFY: @remarks and warnings are visible
```

### Implementation Patterns & Key Details

```typescript
// TARGET LOCATION: src/hooks/useFormStack.ts, lines 24-28

// BEFORE (current minimal documentation):
export interface UseFormStackReturn {
  stack: readonly StackEntry[];
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  /**
   * Closes the current form without returning data.
   * Typically used internally; forms use onSubmit/onCancel instead.
   */
  closeForm: () => void;
}

// AFTER (enhanced documentation):
export interface UseFormStackReturn {
  stack: readonly StackEntry[];
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  /**
   * Closes the current form without returning data.
   *
   * **When NOT to use:** In form components - forms should use the `onSubmit` and `onCancel` props
   * passed by FormStackRenderer instead. Direct `closeForm()` calls bypass the Promise resolution
   * pattern and can cause unexpected behavior.
   *
   * **When to use:**
   * - Programmatic form closure from a parent component (outside the form stack)
   * - Advanced custom navigation scenarios where you need to dismiss forms without user interaction
   * - Emergency/disaster recovery scenarios
   *
   * @remarks
   * The `closeForm` function dispatches a `POP_FORM` action directly to the reducer. This is
   * different from the form lifecycle pattern where FormStackRenderer injects `onSubmit`/`onCancel`
   * callbacks that properly resolve the Promise returned by `openForm()`.
   *
   * @throws {Error} When used outside FormStackProvider context
   *
   * @see {@link FormProps} - Interface forms should implement instead of calling closeForm
   * @see {@link FormStackRenderer} - Component that injects onSubmit/onCancel into forms
   * @see {@link openForm} - Returns a Promise that resolves via form's onSubmit/onCancel
   *
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
   *
   * @example
   * ```tsx
   * // RECOMMENDED: Use onSubmit/onCancel props in form components
   * function MyForm({ onSubmit, onCancel }: FormProps<Data>) {
   *   const handleSave = () => {
   *     onSubmit(data); // FormStackRenderer will call closeForm() internally
   *   };
   *
   *   const handleCancel = () => {
   *     onCancel(); // FormStackRenderer will call closeForm() internally
   *   };
   * }
   * ```
   *
   * @example
   * ```tsx
   * // VALID: Programmatic closure from parent component (outside form stack)
   * function ParentComponent() {
   *   const { closeForm, stack } = useFormStack();
   *
   *   // Emergency close all forms scenario
   *   const handleEmergencyClose = () => {
   *     while (stack.length > 0) {
   *       closeForm();
   *     }
   *   };
   * }
   * ```
   */
  closeForm: () => void;
}

// PATTERN: JSDoc structure for comprehensive function documentation
// 1. Single-line summary
// 2. Blank line
// 3. Detailed multi-line description with **bold** for emphasis
// 4. Blank line before @remarks
// 5. @remarks for additional technical details
// 6. @throws for error conditions
// 7. @see tags for cross-references
// 8. Multiple @example blocks with clear captions

// PATTERN: Multi-line JSDoc formatting
// Each section (summary, when not to use, when to use, remarks) separated by blank lines
// Use **bold** for emphasis on key phrases
// Use code formatting (backticks) for function names and technical terms

// GOTCHA: @example blocks must be valid TypeScript/TSX
// Code in @example blocks is not type-checked but should be syntactically correct
// Import statements in examples can be abbreviated for clarity

// GOTCHA: @see {@link symbol} syntax for cross-references
// Use {@link SymbolName} for clickable links in IDE
// Include description after link: {@link FormProps} - Interface forms should implement

// PATTERN: Warning formatting in JSDoc
// Use **bold** for "When NOT to use" and "When to use" headers
// Clear distinction between discouraged and recommended patterns
// Explain WHY a pattern is discouraged (bypasses Promise pattern)
```

### Integration Points

```yaml
DOCUMENTATION_LOCATIONS:
  - primary: src/hooks/useFormStack.ts (line 24-28, UseFormStackReturn interface)
  - secondary: src/types/context.ts (line 39-40, FormStackActions interface)
  - consideration: Update secondary for consistency

CONSUMER_FILES:
  - examples/relational-forms/UserForm.tsx: Shows proper onSubmit/onCancel usage
  - examples/relational-forms/TeamForm.tsx: Shows parent component using openForm

RELATED_DOCUMENTATION:
  - src/components/FormStackProvider.tsx (lines 103-111): popToIndex JSDoc pattern
  - src/hooks/useFormStackActions.ts (lines 5-32): Hook documentation pattern
  - src/types/form.ts (lines 1-36): FormProps interface documentation

NEXT_TASK:
  - P1.M3.T2.S2: Add development-mode warning for direct closeForm calls
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After modifying JSDoc, verify TypeScript compiles
npx tsc --noEmit

# Expected: Zero errors
# If errors: Check for malformed JSDoc tags, mismatched @param types

# Run linting (if ESLint is configured)
npm run lint 2>/dev/null || npx eslint src/hooks/useFormStack.ts --fix

# Expected: No linting errors
```

### Level 2: IDE Rendering Verification (Documentation Validation)

```bash
# Manual verification in IDE (VS Code, WebStorm, etc.)
# 1. Open src/hooks/useFormStack.ts
# 2. Hover over the closeForm property in UseFormStackReturn
# 3. Verify all sections render correctly:
#    - Summary description
#    - "When NOT to use" section with **bold** formatting
#    - "When to use" section with bullet points
#    - @remarks section
#    - @throws documentation
#    - @see links (should be clickable)
#    - All @example blocks

# Expected: All documentation displays correctly in IDE hover tooltip
```

### Level 3: Documentation Consistency Check

```bash
# Verify consistency with other JSDoc in codebase

# Check popToIndex JSDoc pattern (FormStackProvider.tsx lines 103-111)
grep -A 8 "Navigates to a specific form" src/components/FormStackProvider.tsx

# Check useFormStackActions JSDoc pattern (useFormStackActions.ts lines 5-32)
head -35 src/hooks/useFormStackActions.ts

# Verify closeForm is documented in both locations
grep -B 2 "closeForm:" src/hooks/useFormStack.ts
grep -B 2 "closeForm:" src/types/context.ts

# Expected: Similar style and structure across all documentation
```

### Level 4: Developer Experience Validation

```bash
# Create a test file to verify documentation appears correctly in autocomplete
cat > /tmp/test-closeform-docs.ts << 'EOF'
import { useFormStack } from './src/hooks/useFormStack';

function TestComponent() {
  const { closeForm } = useFormStack();
  // Hover over closeForm above - documentation should appear

  return null;
}
EOF

# In your IDE:
# 1. Open /tmp/test-closeform-docs.ts
# 2. Hover over the closeForm variable
# 3. Verify the enhanced documentation appears
# 4. Verify @example blocks are formatted correctly
# 5. Verify @see links are clickable

# Expected: Complete documentation with all sections visible
```

---

## Final Validation Checklist

### Technical Validation

- [ ] File modified at `src/hooks/useFormStack.ts` (lines 24-28)
- [ ] TypeScript compilation passes: `npx tsc --noEmit`
- [ ] No linting errors: `npm run lint` (if configured)
- [ ] JSDoc follows existing codebase patterns (multi-line descriptions, @example blocks)
- [ ] All @example code is syntactically valid TypeScript/TSX

### Documentation Quality

- [ ] Summary description is clear and concise
- [ ] "When NOT to use" section clearly explains forms should use onSubmit/onCancel
- [ ] "When to use" section documents valid external use cases
- [ ] @remarks explains the technical implementation (POP_FORM dispatch)
- [ ] @throws documents Error when used outside provider
- [ ] @see tags link to FormProps, FormStackRenderer, openForm
- [ ] Multiple @example blocks show discouraged/recommended/valid patterns
- [ ] Each @example has a clear comment explaining the pattern

### Developer Experience

- [ ] Documentation renders correctly in IDE hover tooltip
- [ ] @see links are clickable and navigate to correct symbols
- [ ] Code examples are copy-pasteable and understandable
- [ ] Warnings (bold text) stand out clearly
- [ ] Distinction between internal/external usage is unambiguous

### Consistency

- [ ] Style matches existing JSDoc (popToIndex, useFormStackActions)
- [ ] Formatting (indentation, spacing) matches codebase conventions
- [ ] Consideration given to src/types/context.ts for consistency

---

## Anti-Patterns to Avoid

- **DON'T** make JSDoc too verbose - keep it focused and actionable
- **DON'T** skip the @example blocks - they're critical for understanding
- **DON'T** forget @see tags - cross-references help developers navigate the architecture
- **DON'T** use vague warnings - be specific about WHY closeForm shouldn't be used in forms
- **DON'T** skip explaining the Promise pattern - developers need to understand the architecture
- **DON'T** make examples too complex - keep them focused on the specific pattern being illustrated
- **DON'T** use @internal tag - closeForm is part of the public API, just not for forms
- **DON'T** add implementation details in the summary - keep @remarks for technical details
- **DON'T** forget to explain the difference between closeForm and onCancel - they serve different purposes
- **DON'T** modify any code - this is a documentation-only change

---

## Research Notes

### Key Findings from Codebase Analysis

1. **closeForm is documented in TWO locations**:
   - Primary: `src/hooks/useFormStack.ts` line 24-28 (UseFormStackReturn interface)
   - Secondary: `src/types/context.ts` line 39-40 (FormStackActions interface)
   - Consider updating both for consistency

2. **Current documentation is minimal**:
   - "Typically used internally; forms use onSubmit/onCancel instead."
   - Doesn't explain WHY or provide examples

3. **FormStackRenderer injection pattern**:
   - Forms receive `onSubmit`/`onCancel`/`onError` as props from FormStackRenderer
   - These callbacks properly resolve the Promise from `openForm()`
   - After resolving, they call `closeForm()` internally via the `onClose` prop

4. **Promise-based architecture**:
   - `openForm()` returns a `Promise<T | undefined>`
   - Forms calling `onSubmit(value)` resolve with value
   - Forms calling `onCancel()` resolve with `undefined`
   - Direct `closeForm()` bypasses this pattern

5. **Existing JSDoc patterns**:
   - `popToIndex` has comprehensive JSDoc with @throws, development/production behavior
   - `useFormStackActions` has detailed JSDoc with performance notes and @example
   - `OpenFormOptions` has multiple @example blocks with detailed comments

6. **No development-mode warnings currently**:
   - P1.M3.T2.S2 will add console warnings for direct closeForm calls
   - This JSDoc enhancement (P1.M3.T2.S1) provides static documentation

### Architecture Context

The geoform library uses a **Promise-based form stack pattern**:

1. Parent calls `openForm({ component: MyForm, ... })` - returns Promise
2. FormStackRenderer injects `onSubmit`/`onCancel` into MyForm
3. User interacts with form
4. Form calls `onSubmit(data)` or `onCancel()`
5. FormStackRenderer resolves the Promise and calls `closeForm()` internally
6. Parent's `await openForm()` resolves with the data

**Direct `closeForm()` calls break this pattern** because:
- No Promise resolution (parent's await hangs)
- No confirmation dialog (if `confirmOnCancel` is set)
- Bypasses the FormStackRenderer lifecycle

---

## Confidence Score

**Confidence Score**: 10/10 for one-pass implementation success

**Reasoning**:
- Single file modification with exact line numbers specified
- Complete JSDoc content provided (copy-paste ready)
- Existing patterns to follow (popToIndex, useFormStackActions)
- No code changes required - documentation only
- No new dependencies or imports
- TypeScript validation is straightforward
- Multiple @example blocks with clear patterns
- All context files documented with specific line numbers

**Why maximum confidence**:
- This is a documentation-only change - zero risk to functionality
- Complete JSDoc specification provided
- Existing patterns well-researched and documented
- No complex implementation logic required
- Clear success criteria (TypeScript compiles, documentation renders)

---

## Success Metrics

**Completion Criteria**:
1. Enhanced JSDoc added to `closeForm` in UseFormStackReturn interface
2. Documentation includes "When NOT to use" and "When to use" sections
3. Multiple @example blocks show discouraged/recommended/valid patterns
4. @see tags link to related interfaces (FormProps, FormStackRenderer, openForm)
5. TypeScript compilation passes with zero errors
6. Documentation renders correctly in IDE hover tooltips

**Quality Criteria**:
1. Documentation style matches existing patterns (popToIndex, useFormStackActions)
2. Warnings are clear and actionable
3. Code examples are syntactically correct and focused
4. Technical implementation (@remarks) is accurate
5. Developer can understand when to use vs not use closeForm after reading

**Next Step**:
After completing this documentation enhancement, proceed to **P1.M3.T2.S2: Add development-mode warning for direct closeForm calls** to add runtime warnings for improper usage.

---

## Output Specification

### Deliverable Files

```bash
src/hooks/useFormStack.ts  # MODIFIED: Enhanced closeForm JSDoc (lines 24-28)
```

### Exact Changes to useFormStack.ts

**Location**: Lines 24-28 in UseFormStackReturn interface

**Replace current minimal JSDoc**:
```typescript
/**
 * Closes the current form without returning data.
 * Typically used internally; forms use onSubmit/onCancel instead.
 */
closeForm: () => void;
```

**With enhanced JSDoc**:
```typescript
/**
 * Closes the current form without returning data.
 *
 * **When NOT to use:** In form components - forms should use the `onSubmit` and `onCancel` props
 * passed by FormStackRenderer instead. Direct `closeForm()` calls bypass the Promise resolution
 * pattern and can cause unexpected behavior.
 *
 * **When to use:**
 * - Programmatic form closure from a parent component (outside the form stack)
 * - Advanced custom navigation scenarios where you need to dismiss forms without user interaction
 * - Emergency/disaster recovery scenarios
 *
 * @remarks
 * The `closeForm` function dispatches a `POP_FORM` action directly to the reducer. This is
 * different from the form lifecycle pattern where FormStackRenderer injects `onSubmit`/`onCancel`
 * callbacks that properly resolve the Promise returned by `openForm()`.
 *
 * @throws {Error} When used outside FormStackProvider context
 *
 * @see {@link FormProps} - Interface forms should implement instead of calling closeForm
 * @see {@link FormStackRenderer} - Component that injects onSubmit/onCancel into forms
 * @see {@link openForm} - Returns a Promise that resolves via form's onSubmit/onCancel
 *
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
 *
 * @example
 * ```tsx
 * // RECOMMENDED: Use onSubmit/onCancel props in form components
 * function MyForm({ onSubmit, onCancel }: FormProps<Data>) {
 *   const handleSave = () => {
 *     onSubmit(data); // FormStackRenderer will call closeForm() internally
 *   };
 *
 *   const handleCancel = () => {
 *     onCancel(); // FormStackRenderer will call closeForm() internally
 *   };
 * }
 * ```
 *
 * @example
 * ```tsx
 * // VALID: Programmatic closure from parent component (outside form stack)
 * function ParentComponent() {
 *   const { closeForm, stack } = useFormStack();
 *
 *   // Emergency close all forms scenario
 *   const handleEmergencyClose = () => {
 *     while (stack.length > 0) {
 *       closeForm();
 *     }
 *   };
 * }
 * ```
 */
closeForm: () => void;
```

### Optional: Update Secondary Location

**Location**: `src/types/context.ts` line 39-40

For consistency, consider updating the parallel documentation:

```typescript
/**
 * Closes the current form without returning data.
 *
 * **When NOT to use:** In form components - use the `onSubmit` and `onCancel` props
 * passed by FormStackRenderer instead.
 *
 * **When to use:** Programmatic form closure from outside the form stack,
 * advanced custom navigation, or emergency scenarios.
 *
 * @throws {Error} When used outside FormStackProvider context
 *
 * @see {@link FormProps} - Interface forms should implement instead
 * @see {@link useFormStack} - Enhanced documentation available in UseFormStackReturn
 */
closeForm: () => void;
```

---

## Research References

### Internal Research

- **closeForm implementation**: `src/components/FormStackProvider.tsx` (lines 99-101)
- **FormStackRenderer injection pattern**: `src/components/FormStackRenderer.tsx` (lines 42-67)
- **Proper form usage**: `examples/relational-forms/UserForm.tsx` (lines 33-111)
- **FormProps interface**: `src/types/form.ts` (lines 29-36)
- **popToIndex JSDoc pattern**: `src/components/FormStackProvider.tsx` (lines 103-111)
- **Hook documentation pattern**: `src/hooks/useFormStackActions.ts` (lines 5-32)

### External Documentation

- **TypeScript JSDoc Reference**: [TypeScript JSDoc Supported Types](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- **TSDoc Specification**: [TSDoc Official Documentation](https://tsdoc.org/)
- **Documenting React Components**: [Writing JSDoc for React Components](https://schof.co/writing-jsdoc-for-react-components/)

### Related Work Items

- **P1.M3.T2.S2**: Add development-mode warning for direct closeForm calls (next task)
- **P1.M3.T1.S1**: Implement development-only error for invalid popToIndex (similar pattern)
- **P1.M3**: Improve Error Handling & API Clarity (parent milestone)
