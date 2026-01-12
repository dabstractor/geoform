# Research: Testing React Error Boundaries and Error-Throwing Components

> Research compiled on: 2025-01-10
> Focus: Best practices for testing React error boundaries with React Testing Library

---

## Executive Summary

When testing React error boundaries, the primary challenge is that **React automatically logs all errors to `console.error`** (React 18) or `console.warn`** (React 19), even when those errors are caught by an error boundary. This creates noisy test output that can obscure actual test failures.

The solution is to **temporarily suppress console output during error boundary tests** using `jest.spyOn()` (Jest) or `vi.spyOn()` (Vitest), while carefully distinguishing between "expected" errors (testing error boundaries) and "unexpected" errors (actual bugs).

---

## 1. How to Properly Test Error Boundary Behavior Without Cluttering Console Output

### The Problem

React's default behavior is to log errors to the console **regardless of whether an error boundary catches them**. This is intentional for development debugging, but it creates problems in tests:

- Tests that pass will still show red error logs
- Test output becomes cluttered and hard to read
- Difficult to distinguish between expected test errors and actual failures

### The Solution: Suppress Console Output During Tests

The recommended pattern from **Kent C. Dodds' TestingJavaScript.com** and the **React Testing Library FAQ** is to spy on `console.error` and mock it with an empty function:

```javascript
// Jest pattern
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

```javascript
// Vitest pattern
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

---

## 2. The @testing-library/react Recommendations for Error Testing

### Official Documentation Source

The [React Testing Library FAQ](https://testing-library.com/docs/react-testing-library/faq/#how-do-i-test-error-boundaries) provides the official guidance:

> "To test if an error boundary successfully catches an error, you should make sure that the fallback of the boundary is displayed when a child threw."

### Key Pattern from Official Docs

```javascript
import React from 'react'
import {render, screen} from '@testing-library/react'

class ErrorBoundary extends React.Component {
  state = {error: null}
  static getDerivedStateFromError(error) {
    return {error}
  }
  render() {
    const {error} = this.state
    if (error) {
      return <div>Something went wrong</div>
    }
    return this.props.children
  }
}

test('error boundary catches error', () => {
  const {container} = render(
    <ErrorBoundary>
      <BrokenComponent />
    </ErrorBoundary>,
  )
  expect(container.textContent).toEqual('Something went wrong.')
})
```

### React 18 vs React 19 Console Behavior

> **Note from React Testing Library FAQ:**
> - **React 18**: Will call `console.error` with an extended error message
> - **React 19**: Will call `console.warn` with an extended error message

> **For React 19**, you can disable the additional `console.warn` call by providing a custom `onCaughtError` callback:
> ```javascript
> render(<App />, {onCaughtError: () => {}})
> ```
> Note: `onCaughtError` is not supported in React 18.

---

## 3. Common Patterns for Suppressing React's console.error During Error Testing

### Pattern 1: Basic Spy (Most Common)

From [James Shakespeare's guide](https://jshakespeare.com/react-error-boundary-testing-rtl/):

```javascript
import React from 'react';
import MyErrorBoundary from './MyErrorBoundary';
import { render, screen } from '@testing-library/react';

describe('MyErrorBoundary', () => {
  // A component that throws an error
  const ThrowError = () => {
    throw new Error('Test');
  };

  // Temporarily suppress console errors
  const realError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = realError;
  });

  it('shows an apologetic error message when an unhandled exception is thrown', () => {
    render(
      <MyErrorBoundary>
        <ThrowError />
        <p>Everything is fine</p>
      </MyErrorBoundary>
    );

    expect(screen.queryByText(/Everything is fine/i)).not.toBeInTheDocument();
    expect(screen.getByText(/sorry/i)).toBeInTheDocument();
  });
});
```

### Pattern 2: Using jest.spyOn (Recommended)

From [TestingJavaScript.com](https://www.testingjavascript.com/lessons/react-hide-console-error-logs-when-testing-error-boundaries-with-jest-spyon):

```javascript
describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

### Pattern 3: Vitest Equivalent

```javascript
import { vi } from 'vitest';

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // tests...
});
```

### Pattern 4: Custom Helper Function

Create a reusable helper for cleaner tests:

```javascript
// test-utils.js
export function suppressConsoleErrors() {
  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });
}

// Usage in test file
import { suppressConsoleErrors } from './test-utils';

suppressConsoleErrors();

describe('ErrorBoundary', () => {
  // Tests can now be written without console.error noise
});
```

---

## 4. How to Distinguish Between "Expected" vs "Unexpected" Errors

### The Key Insight from Next.js Documentation

According to [Next.js Error Handling Documentation](https://nextjs.org/docs/app/getting-started/error-handling) (updated June 2025):

> **Errors can be divided into two categories: expected errors and uncaught exceptions.**

### Expected Errors (Test with Error Boundaries)

**Expected errors** are those that occur during normal operation and should be handled gracefully:

- Network failures (API timeouts, 500 errors)
- Invalid user input (validation failures)
- Missing data (404 responses)
- **Render-time errors in components** (testing error boundaries)

**Strategy**: Use error boundaries to catch and display fallback UI

```javascript
// Example: Testing an expected error boundary scenario
it('handles network errors gracefully', () => {
  // Suppress console.error because this is an EXPECTED error
  jest.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <ErrorBoundary>
      <ComponentThatMayFail />
    </ErrorBoundary>
  );

  // Verify fallback UI is shown
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

### Unexpected Errors (Should Not Be Suppressed)

**Unexpected errors** indicate bugs or issues that should not occur during normal operation:

- TypeError: Cannot read property of undefined
- ReferenceError: variable is not defined
- Logic errors that cause crashes
- **Errors in tests themselves** (not in the component being tested)

**Strategy**: These should **NOT** be suppressed. They should fail tests and be fixed.

```javascript
// BAD: Don't suppress console.error for unexpected errors
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// This test might pass but hide real bugs!
it('renders user profile', () => {
  render(<UserProfile userId="123" />);
  // If there's a TypeError inside, we'll never see it
});
```

### Reddit Community Wisdom

From [Reddit discussion on error boundaries](https://www.reddit.com/r/reactjs/comments/17vrroj/is_it_possible_to_keep_a_react_page_when_a_crash/):

> "The only correct way is to **handle the expected errors** and to **fix all the unexpected ones**."

This highlights the philosophy:
- **Expected errors** → Handle with error boundaries (suppress console in tests)
- **Unexpected errors** → Fix at the source (don't suppress, let tests fail)

---

## 5. Complete Code Examples

### Example 1: Full Error Boundary Test Suite

```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Component rendered successfully</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for expected error boundary tests
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when no error occurs', () => {
    it('renders children normally', () => {
      render(
        <ErrorBoundary fallback={<div>Error fallback</div>}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
      expect(screen.queryByText('Error fallback')).not.toBeInTheDocument();
    });
  });

  describe('when an error occurs', () => {
    it('catches the error and displays fallback UI', () => {
      render(
        <ErrorBoundary fallback={<div>Error fallback</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Component rendered successfully')).not.toBeInTheDocument();
      expect(screen.getByText('Error fallback')).toBeInTheDocument();
    });
  });

  describe('error recovery', () => {
    it('can recover from errors', () => {
      const { rerender } = render(
        <ErrorBoundary
          fallback={<div>Error fallback</div>}
          onReset={() => {/* reset logic */}}
        >
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error state
      expect(screen.getByText('Error fallback')).toBeInTheDocument();

      // Recover
      rerender(
        <ErrorBoundary
          fallback={<div>Error fallback</div>}
          onReset={() => {/* reset logic */}}
        >
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Normal state restored
      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
    });
  });
});
```

### Example 2: Testing react-error-boundary Library

From [Kent C. Dodds' blog](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react):

```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function Bomb({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('💥 CABOOM 💥');
  }
  return <div>All good</div>;
}

describe('react-error-boundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('catches errors and displays fallback', () => {
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/💥 CABOOM 💥/)).toBeInTheDocument();
  });

  it('recovers when reset', () => {
    const { rerender } = render(
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => jest.fn()}
        resetKeys={[true]}
      >
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    rerender(
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => jest.fn()}
        resetKeys={[false]}
      >
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('All good')).toBeInTheDocument();
  });
});
```

### Example 3: Testing with Vitest

```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary (Vitest)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('catches errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary fallback={<div>Error!</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error!')).toBeInTheDocument();
  });
});
```

---

## 6. Best Practices Summary

### From Testing Library Maintainers

1. **Test from the user's perspective**
   - Verify fallback UI is displayed
   - Verify normal rendering when no error occurs
   - Don't test implementation details (like `componentDidCatch`)

2. **Always restore mocks**
   - Use `afterEach(() => jest.restoreAllMocks())`
   - Prevents test pollution and side effects

3. **Test error recovery**
   - Error boundaries should support recovery
   - Test that resetting works correctly

### From Kent C. Dodds

From [Use react-error-boundary to handle errors in React](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react):

- **Prefer `react-error-boundary`** over custom error boundary implementations
- **Use `useErrorBoundary()` hook** for handling async errors
- **Test both error states and recovery**
- **Accept console.error during development** (only an issue in development, not production)

### From Next.js Team

From [Next.js Error Handling Guide](https://nextjs.org/docs/app/getting-started/error-handling):

- **Distinguish between expected and unexpected errors**
- **Handle expected errors explicitly** (return error states)
- **Let unexpected errors throw** (caught by error boundaries)
- **Use nested error boundaries** for granular error handling

---

## 7. Important URLs and Documentation

### Official Documentation

- **[React Testing Library FAQ - Error Boundaries](https://testing-library.com/docs/react-testing-library/faq/#how-do-i-test-error-boundaries)**
  - Official guidance on testing error boundaries
  - Shows basic pattern and React 18/19 differences

- **[React Error Boundaries Documentation](https://legacy.reactjs.org/docs/error-boundaries.html)**
  - Official React docs on error boundaries
  - Lists what errors boundaries DON'T catch (event handlers, async code, etc.)

### Authoritative Guides

- **[James Shakespeare: Testing Error Boundaries with RTL](https://jshakespeare.com/react-error-boundary-testing-rtl/)**
  - Clear, practical guide with code examples
  - Shows the `beforeEach/afterEach` pattern

- **[Kent C. Dodds: Use react-error-boundary](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)**
  - Comprehensive guide to error boundary usage
  - Covers async errors and the `useErrorBoundary()` hook

- **[TestingJavaScript.com: Hide console.error Logs](https://www.testingjavascript.com/lessons/react-hide-console-error-logs-when-testing-error-boundaries-with-jest-spyon)**
  - Kent C. Dodds' dedicated lesson on suppressing console output
  - Video lesson with transcript

### Framework-Specific Guides

- **[Next.js: Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)**
  - Updated June 2025
  - Clear distinction between expected errors and uncaught exceptions
  - Covers nested error boundaries

- **[React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)**
  - Documents `onCaughtError` option for React 19
  - Explains console.warn vs console.error changes

### Community Resources

- **[Stack Overflow: How to test React ErrorBoundary](https://stackoverflow.com/questions/49220626/how-to-test-react-errorboundary)**
  - Community solutions and discussion

- **[Stack Overflow: Suppress error output from testing-library/react](https://stackoverflow.com/questions/68760763/how-to-suppress-error-output-from-testing-library-react)**
  - Specific solutions for suppressing console output

- **[GitHub: Cannot suppress error boundary output](https://github.com/facebook/react/issues/15520)**
  - React team discussion on the issue
  - Explains why React logs errors even when caught

- **[Reddit: Workflow for testing Error Boundaries](https://www.reddit.com/r/reactjs/comments/1q45gse/whats_your_workflow_for_testing_error_boundaries/)**
  - Recent community discussion (January 2025)
  - Current practices and workflows

### Additional Reading

- **[Testing React Component Error Boundaries](https://chrisboakes.com/testing-react-component-error-boundaries/)**
  - Practical testing guide with async error examples

- **[Jest Test for ErrorBoundary (Gist)](https://gist.github.com/JannisRex/758bcc645540fc717b40bcc520cd6940)**
  - Complete working example

- **[Mastering React Error Handling (Medium)](https://medium.com/@dlrnjstjs/mastering-react-error-handling-from-error-boundaries-to-global-error-management-6da6db69e2e3)**
  - Comprehensive guide with testing patterns

---

## 8. Quick Reference

### Jest Pattern

```javascript
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### Vitest Pattern

```javascript
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### React 19 Pattern

```javascript
// If using React 19, you can also use:
render(<App />, {onCaughtError: () => {}});
```

### Test Structure

```javascript
describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when no error', () => {
    // Test normal rendering
  });

  it('catches errors and shows fallback', () => {
    // Test error handling
  });

  it('recovers from errors', () => {
    // Test recovery
  });
});
```

---

## Key Takeaways

1. **Always suppress `console.error`** when testing error boundary behavior
2. **Use `jest.spyOn()` or `vi.spyOn()`** for clean, restorable mocking
3. **Distinguish expected vs unexpected errors** - only suppress expected ones
4. **Test both success and failure scenarios** for comprehensive coverage
5. **Test error recovery** to ensure boundaries can reset properly
6. **Always restore mocks** in `afterEach` to prevent test pollution
7. **Prefer `react-error-boundary` library** over custom implementations

---

## Research Sources

- React Testing Library FAQ (Official Documentation)
- Kent C. Dodds' TestingJavaScript.com
- James Shakespeare's React Testing Guide
- Next.js Error Handling Documentation (June 2025)
- React 19 Upgrade Guide
- Stack Overflow Community Discussions
- GitHub React Team Discussions
- Reddit r/reactjs Community

All URLs are provided in Section 7 for direct reference.
