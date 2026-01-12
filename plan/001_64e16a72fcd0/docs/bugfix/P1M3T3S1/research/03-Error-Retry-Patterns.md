# Error Boundary Retry Documentation Patterns

## Industry Best Practices

### Transient vs Structural Error Distinction

The most important pattern for documenting retry behavior is clearly distinguishing between:
- **Transient errors**: Temporary issues that may resolve on retry
- **Structural errors**: Permanent issues that require code/prop fixes

#### Transient Errors (Retry Works)
- Network failures that may succeed on retry
- Temporary rendering bugs or race conditions
- Component state corruption that resets on remount

#### Structural Errors (Retry Won't Work)
- Invalid or malformed props passed to the child
- Type mismatches or missing required data
- Logic errors in the child component's render method

### Documentation Pattern

```typescript
/**
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
 */
```

## React Community Patterns

### react-error-boundary Library

**Repository**: https://github.com/bvaughn/react-error-boundary
- 7.8k GitHub stars, 237k dependent packages
- Industry standard for modern React error handling

Key patterns:
1. **`resetErrorBoundary()` callback** - Clear function name indicating reset action
2. **`resetKeys` prop** - Auto-reset when specific values change
3. **`onReset` callback** - Cleanup before retry
4. **`FallbackProps` interface** - Explicit typing for error and reset function

```typescript
interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}
```

### Retry Mechanism Explanation

Your documentation should explain HOW retry works:

> "The retry mechanism increments `retryCount` to force a component remount, but children receive the **exact same props** as before the error."

This is critical because users need to understand that retry doesn't fix structural problems.

## Code Example Patterns

### BAD vs GOOD Pattern

From your README.md (lines 779-809):

```markdown
**❌ BAD** - Expecting retry to fix structural errors:
```tsx
// This form will ALWAYS throw - props are invalid
<UserForm userId={undefined} />  // Component requires userId prop
```

**✅ GOOD** - Use Dismiss for structural errors:
```tsx
// Fix the underlying prop issue
<UserForm userId={validId} />  // Valid prop
```
```

### Concrete Examples

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

## Actionable Guidance

Your documentation should tell users exactly what to do:

> "For structural errors, users should click 'Dismiss' instead to close the form and fix the underlying issue."

## Additional Best Practices

### 1. Maximum Retry Limits
Consider documenting maximum retry limits to prevent infinite loops:
```typescript
/**
 * Retry will be disabled after 3 attempts to prevent infinite loops.
 */
```

### 2. User Feedback
Document how users are informed about retry attempts:
```typescript
/**
 * The retry button is disabled after maximum attempts.
 * Users should use Dismiss to close the form.
 */
```

### 3. Recovery Flow
Consider a visual decision tree for retry vs dismiss:
```
Error occurs
    ↓
Is it a transient error? (Network, race condition)
    ↓ Yes
Click "Try Again"
    ↓
Did it work?
    ↓ No
Is it a structural error? (Bad props, type mismatch)
    ↓ Yes
Click "Dismiss" and fix the underlying issue
```

## External Resources

### React Official Documentation
- https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- Official React docs on error boundaries and recovery

### react-error-boundary Library
- Repository: https://github.com/bvaughn/react-error-boundary
- Examples: https://github.com/bvaughn/react-error-boundary#examples

### Related Research in This Project
- `/home/dustin/projects/geoform/plan/P2M3/research/05-error-recovery-retry.md`
- `/home/dustin/projects/geoform/README.md` lines 779-809 (Common Pitfalls section)

## Summary of Key Patterns

1. **Distinguish transient vs structural errors** - Document which errors are retryable
2. **Explain the retry mechanism** - How it works, what changes, what stays the same
3. **Provide concrete examples** - BAD vs GOOD code comparisons
4. **Give actionable guidance** - Tell users exactly what to do
5. **Link to alternatives** - Use `@see` tags to connect to related methods
6. **Include React documentation links** - Reference official React docs
