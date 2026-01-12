# JSDoc Patterns in Codebase

## Target Pattern: FormErrorBoundary Component JSDoc

**File**: `/home/dustin/projects/geoform/src/components/FormErrorBoundary.tsx`

### Component-Level Pattern (Lines 32-76)

```typescript
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
```

### Method-Level Pattern: handleRetry (Lines 127-161)

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

## Key Pattern Elements

### 1. Markdown Headings Within JSDoc
Use `##` for section headers:
- `## Retry Behavior`
- `## When Retry Works`
- `## When Retry Won't Work`

### 2. Bullet Points with Bold Headers
```typescript
 * - **How it works}: Description here
 * - **Props handling**: Description here
 * - **Retryable errors**: Description here
 * - **Non-retryable errors**: Description here
```

### 3. Multiple @example Tags
Show different scenarios:
- Transient error example
- Structural error example
- Full usage example

### 4. @see Tags with Descriptions
```typescript
 * @see {@link FormStackRenderer} - Uses this to wrap each form
 * @see {@link FormErrorBoundaryProps} - Configuration props
 * @see https://react.dev/... - External documentation
```

### 5. Inline Comments for Reinforcement
```typescript
private handleRetry = (): void => {
  // Increment retryCount to force React re-render and child remount
  // Note: Children receive same props - structural errors will recur
  this.setState(prevState => ({
```

## Other Examples from Codebase

### useFormStack Hook JSDoc Pattern
**File**: `/home/dustin/projects/geoform/src/hooks/useFormStack.ts`

Shows:
- Performance considerations
- @throws documentation
- Multiple @see tags
- Detailed code example

### FormProps Interface JSDoc Pattern
**File**: `/home/dustin/projects/geoform/src/types/form.ts`

Shows:
- @template documentation
- Clear interface description
- Usage example with TypeScript

### createDeferredPromise Utility Pattern
**File**: `/home/dustin/projects/geoform/src/utils/createDeferredPromise.ts`

Shows:
- @template usage
- @returns with type
- Clear @example
