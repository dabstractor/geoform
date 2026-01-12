# Vitest Console.Error Suppression Research

## Overview

This document covers best practices for suppressing `console.error` in Vitest tests when testing React components that throw errors, with focus on error boundaries and error-handling components.

## Table of Contents

1. [Official Vitest Documentation](#official-vitest-documentation)
2. [Understanding `vi.fn()` vs `vi.spyOn()`](#understanding-vifn-vs-vispyon)
3. [Setup and Teardown Patterns](#setup-and-teardown-patterns)
4. [Code Examples](#code-examples)
5. [Common Pitfalls](#common-pitfalls)
6. [React-Specific Considerations](#react-specific-considerations)

---

## Official Vitest Documentation

### Key Documentation Links

1. **[Mocking Guide](https://vitest.dev/guide/mocking)**
   - Official Vitest mocking documentation
   - Covers `vi.fn()`, `vi.mock()`, and `vi.spyOn()` methods
   - **Critical Warning**: "Always remember to clear or restore mocks before or after each test run to undo mock state changes between runs!"

2. **[Vi Utility API Reference](https://vitest.dev/api/vi)**
   - Complete API reference for all `vi.*` utilities
   - Sections on `vi.fn()`, `vi.spyOn()`, `vi.restoreAllMocks()`, `vi.clearAllMocks()`, `vi.resetAllMocks()`

3. **[Mock Functions API Reference](https://vitest.dev/api/mock)**
   - Mock-specific API documentation
   - Explains behavior differences between `vi.fn()` and `vi.spyOn()` created mocks
   - Details on `mockClear`, `mockReset`, and `mockRestore` methods

4. **[Component Testing Guide](https://vitest.dev/guide/browser/component-testing)**
   - Patterns, tools, and best practices for testing React components with Vitest

5. **[disableConsoleIntercept Config](https://vitest.dev/config/disableconsoleintercept)**
   - Vitest automatically intercepts console logging during tests for extra formatting
   - Configuration option to disable this behavior

---

## Understanding `vi.fn()` vs `vi.spyOn()`

### `vi.fn()`

**Purpose**: Creates a standalone mock function from scratch.

**Key Characteristics**:
- Creates a completely new function that doesn't exist elsewhere
- Returns a mock function that is callable
- Tracks all calls, arguments, and return values
- Allows full control over implementation

**When to Use**:
- When you need to replace `console.error` entirely with a mock function
- When testing code that calls a function and you want to verify it was called
- When you want complete control over what the function does

**Example**:
```typescript
const consoleErrorSpy = vi.fn()
console.error = consoleErrorSpy
// Now console.error is completely replaced
```

### `vi.spyOn(console, 'error')`

**Purpose**: Spies on an existing method while preserving the original functionality.

**Key Characteristics**:
- Wraps an existing method on an object
- Can track calls without changing behavior
- Can optionally override behavior with `mockImplementation()`
- **Can be restored** to the original implementation with `.mockRestore()`
- Returns a `MockInstance` that is also a spy

**When to Use**:
- When you want to spy on `console.error` but may want to call through to the original
- When you need to restore the original implementation after testing
- When testing that a method was called with specific arguments

**Example**:
```typescript
const consoleErrorSpy = vi.spyOn(console, 'error')
// console.error still works, but calls are tracked

// To suppress error output:
consoleErrorSpy.mockImplementation(() => {})
// Now it's suppressed

// To restore:
consoleErrorSpy.mockRestore()
// Back to original console.error
```

### Critical Differences

| Feature | `vi.fn()` | `vi.spyOn()` |
|---------|-----------|--------------|
| **Creates new function** | Yes | No (wraps existing) |
| **Preserves original** | N/A | Yes |
| **Can be restored** | No (manual restore) | Yes (`.mockRestore()`) |
| **Tracks calls** | Yes | Yes |
| **Type safety** | Excellent | Good |
| **Best for console.error** | Manual replacement | Recommended |

---

## Setup and Teardown Patterns

### Pattern 1: beforeEach/afterEach with vi.spyOn() (Recommended)

This is the **recommended pattern** for console.error suppression:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Component with error handling', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Spy on console.error before each test
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Suppress console.error output during tests
    })
  })

  afterEach(() => {
    // Restore original console.error after each test
    consoleErrorSpy.mockRestore()
  })

  it('handles errors gracefully', () => {
    // Your test here - console.error won't spam output
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
```

### Pattern 2: beforeEach/afterEach with vi.restoreAllMocks()

For multiple spies, use the global restore function:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Component with multiple spies', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restores ALL mocks to their original implementations
    vi.restoreAllMocks()
  })

  it('handles errors gracefully', () => {
    // Test code here
  })
})
```

### Pattern 3: Configuration-Based Auto-Restore

Enable auto-restore in your Vitest config:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    restoreMocks: true, // Automatically restore mocks after each test
  },
})
```

Then in tests:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Component with auto-restore', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // No need for afterEach - config handles it
  })

  it('handles errors gracefully', () => {
    // Test code here
  })
})
```

---

## Code Examples

### Example 1: Testing Error Boundaries

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Suppress React's console.error calls during error boundary tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('catches errors and displays fallback UI', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    render(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    // Verify that console.error WAS called (React logged it)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error: Test error')
    )
  })

  it('renders children when there is no error', () => {
    const NoError = () => <div>No error here</div>

    render(
      <ErrorBoundary fallback={<div>Fallback</div>}>
        <NoError />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error here')).toBeInTheDocument()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
```

### Example 2: Testing Component That Throws Validation Errors

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UserForm } from './UserForm'

describe('UserForm validation', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Suppress console.error for expected validation errors
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('throws error for invalid email format', () => {
    // This component throws an error for invalid emails
    // React will log this to console.error, but we suppress it
    expect(() => {
      render(<UserForm email="invalid-email" />)
    }).toThrow('Invalid email format')

    // Optionally verify console.error was called
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
  })
})
```

### Example 3: Selective Error Suppression Based on Content

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Selective error suppression', () => {
  const originalConsoleError = console.error
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      // Suppress only React warnings, show everything else
      const message = args[0]
      if (
        typeof message === 'string' &&
        (message.includes('Warning:') || message.includes('Error:'))
      ) {
        // Suppress React warnings
        return
      }
      // Call through for other errors
      originalConsoleError(...args)
    })
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('suppresses React warnings but shows other errors', () => {
    // React warnings suppressed
    console.error('Warning: Some React warning')
    expect(consoleErrorSpy).toHaveBeenCalled()

    // Other errors still show
    // (though in tests you typically don't want ANY console output)
  })
})
```

### Example 4: Testing Error Logging Behavior

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logError } from './errorUtils'

describe('Error logging', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error')
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('logs errors with proper formatting', () => {
    const error = new Error('Test error')

    logError(error)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[ERROR]',
      'Test error',
      error.stack
    )
  })

  it('logs errors even when suppressed in UI', () => {
    // Suppress output but verify the call was made
    consoleErrorSpy.mockImplementation(() => {})

    logError(new Error('Test'))

    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
```

### Example 5: Using with `vi.fn()` for Manual Replacement

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Manual console replacement', () => {
  let originalConsoleError: typeof console.error
  let mockConsoleError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Store original
    originalConsoleError = console.error

    // Create mock and replace
    mockConsoleError = vi.fn()
    console.error = mockConsoleError
  })

  afterEach(() => {
    // Manually restore (less safe than mockRestore)
    console.error = originalConsoleError
  })

  it('completely replaces console.error', () => {
    console.error('test error')

    expect(mockConsoleError).toHaveBeenCalledWith('test error')
  })
})
```

---

## Common Pitfalls

### Pitfall 1: Forgetting to Restore Mocks

**Problem**: Mocks persist across tests, causing unexpected behavior.

```typescript
// ❌ BAD - No restoration
describe('Bad example', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  // Missing afterEach - console.error stays suppressed!
})

// ✅ GOOD - Proper restoration
describe('Good example', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks() // or spy.mockRestore()
  })
})
```

### Pitfall 2: Using `vi.clearAllMocks()` Instead of `vi.restoreAllMocks()`

**Problem**: `clearAllMocks()` only clears call history, doesn't restore implementations.

```typescript
// ❌ BAD - clearAllMocks doesn't restore
afterEach(() => {
  vi.clearAllMocks() // console.error is still suppressed!
})

// ✅ GOOD - restoreAllMocks restores original
afterEach(() => {
  vi.restoreAllMocks() // Restores original console.error
})
```

**Difference**:
- `vi.clearAllMocks()`: Clears `.mock.calls`, `.mock.instances`, etc.
- `vi.restoreAllMocks()`: Restores original implementations AND clears state

### Pitfall 3: Spying on the Wrong Console Method

**Problem**: Some errors go to `console.warn` instead of `console.error`.

```typescript
// ❌ BAD - Only spying on error
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

// ✅ GOOD - Spy on both if needed
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
```

### Pitfall 4: Race Conditions with React Error Logging

**Problem**: React's error logging might happen asynchronously.

```typescript
// ❌ BAD - Assertion happens before React logs
it('should log error', () => {
  const spy = vi.spyOn(console, 'error')
  render(<ErrorThrowingComponent />)
  expect(spy).toHaveBeenCalled() // Might fail!
})

// ✅ GOOD - Use waitFor for async operations
it('should log error', async () => {
  const spy = vi.spyOn(console, 'error')
  render(<ErrorThrowingComponent />)

  await waitFor(() => {
    expect(spy).toHaveBeenCalled()
  })
})
```

### Pitfall 5: Not Checking What Was Logged

**Problem**: Suppressing all errors means you might miss unexpected errors.

```typescript
// ❌ BAD - Suppresses everything blindly
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

// ✅ GOOD - Verify expected errors were logged
it('logs expected error', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

  // Test code that should trigger specific error
  render(<ComponentWithKnownIssue />)

  // Verify the RIGHT error was logged
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining('Expected error message')
  )
})
```

### Pitfall 6: Using `vi.mock()` Instead of `vi.spyOn()` for Console

**Problem**: `vi.mock()` is hoisted and doesn't work well for global objects like console.

```typescript
// ❌ BAD - vi.mock is hoisted and doesn't work for console
vi.mock('console', () => ({
  error: vi.fn(),
}))

// ✅ GOOD - Use vi.spyOn for console methods
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

### Pitfall 7: Mocking After Component Import

**Problem**: In some cases, the component might have already cached console methods.

```typescript
// ❌ BAD - Spying too late
import { Component } from './Component'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  // Component might have already referenced console.error
})

// ✅ GOOD - Use setup files or mock in the test itself
```

---

## React-Specific Considerations

### React's Error Logging Behavior

React logs errors to `console.error` in several scenarios:

1. **Error Boundaries**: When a component throws an error
2. **Warnings**: Deprecated APIs, invalid prop types
3. **Hydration Mismatches**: Server/client content differences
4. **Effect Cleanup**: When useEffect cleanup functions throw errors

### Testing Error Boundaries: Complete Example

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Component that throws errors
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Component error')
  }
  return <div>No error</div>
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

describe('ErrorBoundary with console.error suppression', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Suppress console.error during error boundary tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('catches component errors and displays fallback', async () => {
    render(
      <ErrorBoundary fallback={<div>Error fallback</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(screen.getByText('Error fallback')).toBeInTheDocument()
    })

    // Verify console.error was called (for logging purposes)
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('renders children normally when no error', () => {
    render(
      <ErrorBoundary fallback={<div>Error fallback</div>}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
```

### React Testing Library Considerations

When using `@testing-library/react`, keep in mind:

1. **Silencing warnings**: RTL itself logs warnings for testing anti-patterns
2. **Async errors**: Some errors appear in the next tick of the event loop
3. **Cleanup**: RTL's `cleanup()` runs after each test, but doesn't affect mocks

```typescript
import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, vi, beforeEach } from 'vitest'

// RTL cleanup runs automatically, but we need our mock cleanup
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
```

---

## Summary of Best Practices

### DO ✅

1. **Always restore mocks** after tests using `vi.restoreAllMocks()` or `.mockRestore()`
2. **Use `vi.spyOn()`** instead of manually replacing console methods
3. **Set up mocks in `beforeEach`** and restore in `afterEach`
4. **Enable `restoreMocks: true`** in Vitest config for automatic restoration
5. **Verify what was logged** to ensure expected errors occurred
6. **Consider using `vi.waitFor()`** for async error logging
7. **Spy on both `console.error` and `console.warn`** if needed

### DON'T ❌

1. **Don't forget to restore** - mocks will persist across tests
2. **Don't use `vi.clearAllMocks()`** when you mean `vi.restoreAllMocks()`
3. **Don't suppress all errors blindly** - verify expected errors occur
4. **Don't use `vi.mock()` for console** - it doesn't work properly
5. **Don't mock after imports** - set up mocks before component usage
6. **Don't assume synchronous logging** - React may log errors asynchronously

---

## Quick Reference

### Essential Vitest APIs

```typescript
// Spy creation
vi.spyOn(object, methodKey)           // Create spy on existing method
vi.fn()                                // Create standalone mock function

// Mock control
.mockImplementation(fn)                // Replace implementation
.mockReturnValue(value)                // Always return this value
.mockReturnValueOnce(value)            // Return this value once
.mockResolvedValue(value)              // Return resolved Promise
.mockRejectedValue(error)              // Return rejected Promise

// Spy verification
expect(spy).toHaveBeenCalled()         // Was it called?
expect(spy).toHaveBeenCalledWith(args)  // Called with specific args?
expect(spy).toHaveBeenCalledTimes(n)   // Called N times?

// Cleanup
spy.mockRestore()                      // Restore single spy
vi.restoreAllMocks()                   // Restore ALL spies
vi.clearAllMocks()                     // Clear call history only
vi.resetAllMocks()                     // Reset to default implementation
```

### Test File Template

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Component with error handling', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Suppress console.error
    consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    // Always restore
    consoleErrorSpy.mockRestore()
  })

  it('should handle errors', () => {
    // Test code here
  })
})
```

---

## Additional Resources

### Official Documentation
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking)
- [Vitest Vi API](https://vitest.dev/api/vi)
- [Vitest Mock Functions API](https://vitest.dev/api/mock)
- [Vitest Component Testing](https://vitest.dev/guide/browser/component-testing)
- [Vitest Config: disableConsoleIntercept](https://vitest.dev/config/disableconsoleintercept)

### Community Resources
- [Hide console.error Logs when Testing Error Boundaries (TestingJavaScript.com)](https://www.testingjavascript.com/lessons/react-hide-console-error-logs-when-testing-error-boundaries-with-jest-spyon)
- [How to test an error boundary with React Testing Library (jshakespeare.com)](https://jshakespeare.com/react-error-boundary-testing-rtl/)
- [Testing thrown errors - Testing Library Docs Issue #1060](https://github.com/testing-library/testing-library-docs/issues/1060)
- [Common mistakes with React Testing Library (Kent C. Dodds)](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Better way to disable console inside unit tests (StackOverflow)](https://stackoverflow.com/questions/44467657/better-way-to-disable-console-inside-unit-tests)
- [Filter out stdout/stderr messages - Vitest Issue #1700](https://github.com/vitest-dev/vitest/issues/1700)

---

## Conclusion

The recommended approach for suppressing `console.error` in Vitest when testing React components is:

1. Use `vi.spyOn(console, 'error')` to create a spy that preserves restoration capability
2. Call `.mockImplementation(() => {})` to suppress the output
3. Always restore in `afterEach` using `.mockRestore()` or `vi.restoreAllMocks()`
4. Optionally enable `restoreMocks: true` in your Vitest config for automatic restoration
5. Verify that expected errors were logged using expect assertions

This pattern ensures clean test output while maintaining test reliability and proper cleanup.
