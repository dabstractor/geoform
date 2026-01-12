# Codebase JSDoc Patterns Analysis

## Summary

This document summarizes the JSDoc documentation patterns found in the geoform codebase, providing reference examples for consistent documentation style.

## JSDoc Tag Conventions

### Core Tags Used
- **@param** - For documenting parameters (TypeScript types inferred from code)
- **@returns** - For documenting return values, includes TypeScript generics (`<T>`)
- **@throws** - Comprehensive error documentation with development/production behavior distinction
- **@example** - Multiple examples showing discouraged vs recommended patterns
- **@remarks** - Used for technical implementation details and additional notes
- **@see** - Extensive cross-references linking to related interfaces and components
- **@template** - For generic type parameters (`<T = unknown>`)

### Formatting Style
- Multi-line descriptions with proper spacing
- **Bold formatting** for emphasis using `**text**`
- Code examples with syntax highlighting using ```tsx
- Template literals for parameter references

## Reference Examples

### 1. Comprehensive Hook Documentation

**File**: `src/hooks/useFormStack.ts`, Lines 24-89

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
 *   // DON'T DO THIS - bypasses Promise pattern, breaks parent's await
 *   const handleSave = () => {
 *     onSubmit(data);
 *     closeForm(); // WRONG! FormStackRenderer handles this via onSubmit
 *   };
 * }
 * ```
 */
```

### 2. Simple Hook Documentation

**File**: `src/hooks/useFormStackState.ts`, Lines 5-23

```typescript
/**
 * Hook to access form stack state (read-only).
 * Components using this hook will re-render when stack changes.
 *
 * @returns FormStackState containing the current stack array
 * @throws Error if used outside FormStackProvider
 *
 * @example
 * ```typescript
 * function Breadcrumbs() {
 *   const { stack } = useFormStackState();
 *   return (
 *     <nav>
 *       {stack.map(entry => <span key={entry.id}>{entry.label}</span>)}
 *     </nav>
 *   );
 * }
 * ```
 */
```

### 3. Error Documentation with Development/Production Distinction

**File**: `src/hooks/useFormStackActions.ts` (popToIndex example)

```typescript
/**
 * @throws {RangeError} In development mode, when index is negative or >= stack.length
 *                      Production silently ignores invalid indices (graceful degradation)
 */
```

## Key Patterns for Usage Guidelines

### Recommended vs Discouraged Pattern

```typescript
/**
 * **When NOT to use:** [Bold warning about improper usage]
 *
 * **When to use:**
 * - Valid use case 1
 * - Valid use case 2
 * - Valid use case 3
 *
 * @remarks
 * Technical implementation details explaining WHY the pattern exists
 *
 * @example
 * ```tsx
 * // DISCOURAGED: [Clear label]
 * function BadExample() {
 *   // DON'T DO THIS - [explanation]
 * }
 * ```
 *
 * @example
 * ```tsx
 * // RECOMMENDED: [Clear label]
 * function GoodExample() {
 *   // Correct approach
 * }
 * ```
 */
```

### Cross-Reference Pattern

```typescript
/**
 * @see {@link FormProps} - Clear explanation of what to reference
 * @see {@link FormStackRenderer} - Clear explanation of what to reference
 * @see {@link openForm} - Clear explanation of what to reference
 */
```

## Best Practices Observed

1. **Clear Visual Hierarchy**: Use **bold** for warnings and important notes
2. **Context-Specific Documentation**: Explain WHY something shouldn't be used
3. **Cross-Referencing**: Extensive use of @see for architectural navigation
4. **Realistic Examples**: Code examples that show actual usage patterns
5. **Type Safety**: Leverage TypeScript types in JSDoc without redundant typing
6. **Development/Production Distinction**: Clear separation between dev-only and runtime errors
