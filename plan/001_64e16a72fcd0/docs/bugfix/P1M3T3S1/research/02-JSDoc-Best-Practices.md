# JSDoc Best Practices for React Class Components

## Official Documentation Resources

### JSDoc Official Documentation
- **Main Documentation**: https://jsdoc.app/
- **@class Tag**: https://jsdoc.app/tags-class.html
- **@example Tag**: https://jsdoc.app/tags-example.html
- **@see Tag**: https://jsdoc.app/tags-see.html
- **@param Tag**: https://jsdoc.app/tags-param.html

### React Error Boundaries Documentation
- **Error Boundaries**: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- **getDerivedStateFromError**: https://react.dev/reference/react/Component#static-getderivedstatefromerror
- **componentDidCatch**: https://react.dev/reference/react/Component#componentdidcatch

### TypeScript + JSDoc
- **TypeScript JSDoc Reference**: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html

## Component-Level Documentation Structure

### Recommended Pattern

```typescript
/**
 * Brief one-line description of the component.
 *
 * Extended description providing context about the component's purpose,
 * when to use it, and any important behavioral characteristics.
 *
 * Additional paragraphs for complex behavior explanations.
 *
 * ## Feature Headers
 *
 * Use markdown headers (##, ###) within JSDoc to organize complex docs.
 * This improves readability in IDEs and generated documentation.
 *
 * @example
 * ```tsx
 * <ComponentName prop1="value" prop2={callback}>
 *   Children
 * </ComponentName>
 * ```
 *
 * @see {@link RelatedComponent} - Description of relationship
 * @see https://react.dev/reference/react/Component - Official docs reference
 */
```

## Documenting Class Component Methods

### Lifecycle Methods Pattern

```typescript
/**
 * Static lifecycle method called during React's render phase.
 * Updates state to show fallback UI on the next render.
 *
 * CRITICAL: No side effects allowed in this method (no logging, no callbacks).
 * This method runs during the "render" phase, before the DOM is updated.
 * Side effects (logging, error callbacks) must be in componentDidCatch instead.
 *
 * @param error - The error that was thrown during rendering
 * @returns Partial state update to trigger error UI display
 *
 * @see https://react.dev/reference/react/Component#static-getderivedstatefromerror
 */
static getDerivedStateFromError(error: Error): Partial<FormErrorBoundaryState> {
  return {
    hasError: true,
    error,
  };
}
```

### Private Methods Pattern

```typescript
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
  // Increment retryCount to force React re-render and child remount
  // Note: Children receive same props - structural errors will recur
  this.setState(prevState => ({
    hasError: false,
    error: null,
    retryCount: prevState.retryCount + 1,
  }));
};
```

## @example Tag Best Practices

### 1. Use Code Blocks with Language Specification
```typescript
/**
 * @example
 * ```tsx
 * <FormErrorBoundary formId="user-form" onDismiss={() => closeForm()}>
 *   <UserForm />
 * </FormErrorBoundary>
 * ```
 */
```

### 2. Show Multiple Variations
```typescript
/**
 * @example
 * // Transient error - retry may succeed
 * <UserForm userId={userId} />  // Network fetch failed, retry might work
 *
 * @example
 * // Structural error - retry will fail, use Dismiss instead
 * <UserForm userId={undefined} />  // Invalid prop, will always throw
 */
```

### 3. Include Explanatory Comments
```typescript
/**
 * @example
 * ```tsx
 * // Basic usage with error logging
 * <FormErrorBoundary
 *   formId="user-form"
 *   onDismiss={() => closeForm()}
 *   onError={(error, info) => logError(error)}  // Optional logging
 * >
 *   <UserForm />
 * </FormErrorBoundary>
 * ```
 */
```

## @see Tag Best Practices

### Internal API References
```typescript
/**
 * @see {@link FormStackRenderer} - Uses this to wrap each form
 * @see {@link FormErrorBoundaryProps} - Configuration props
 */
```

### External Documentation
```typescript
/**
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
```

### Related Methods
```typescript
/**
 * @see {@link handleDismiss} - Alternative for structural errors
 */
```

## Inline Comments vs JSDoc

### When to Use JSDoc
- Public API documentation (components, hooks, functions)
- Exported interfaces and types
- Complex behavior explanations
- Usage examples
- Cross-references between code elements
- Documentation that needs to appear in IDE hover tooltips

### When to Use Inline Comments
- Implementation details
- Why certain decisions were made
- Temporary workarounds (with TODO/FIXME markers)
- Non-obvious code behavior
- Performance optimizations
- Critical warnings or gotchas

### Critical Warnings Pattern (Use Both)
```typescript
/**
 * CRITICAL: No side effects allowed in this method (no logging, no callbacks).
 * This method runs during the "render" phase, before the DOM is updated.
 */
static getDerivedStateFromError(error: Error): Partial<FormErrorBoundaryState> {
  // No side effects allowed here - must be pure
  return { hasError: true, error };
}
```

## TypeScript Interface Documentation Pattern

```typescript
/**
 * Props interface for FormErrorBoundary component.
 *
 * Each form in the stack is wrapped with its own error boundary,
 * ensuring that a crash in one form doesn't affect parent forms.
 */
export interface FormErrorBoundaryProps {
  /** Child component(s) to wrap with error boundary */
  children: ReactNode;
  /** Unique identifier for the form (used in error messages) */
  formId: string;
  /** Callback when dismiss button is clicked */
  onDismiss: () => void;
  /** Optional callback when error is caught (for logging) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}
```

**Note**: Use TypeScript `/** */` comments for props documentation rather than JSDoc `@param` tags when using TypeScript interfaces.

## Documentation Quality Checklist

- [ ] Component has a clear one-line description
- [ ] Extended description explains purpose and usage
- [ ] Complex behavior is documented with markdown headers
- [ ] Multiple @example tags show different usage patterns
- [ ] @see tags link to related APIs and official docs
- [ ] Props are documented in TypeScript interface with /** */ comments
- [ ] Methods have JSDoc explaining behavior, parameters, and return values
- [ ] Critical warnings are prominent (CRITICAL:, IMPORTANT:, etc.)
- [ ] Retry mechanism is documented with "when it works" and "when it doesn't"
- [ ] Implementation details use inline comments
- [ ] Links to official React/TypeScript/JSDoc documentation are included
