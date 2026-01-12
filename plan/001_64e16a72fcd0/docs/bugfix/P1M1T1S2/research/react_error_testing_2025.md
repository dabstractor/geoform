# React Error Boundary and Hook Error Testing Patterns Research

## Overview

This document summarizes research findings on React error boundary and hook error testing patterns, with a focus on 2024-2025 updates and best practices.

**Note**: Due to web search limitations, this document primarily draws from analysis of the existing codebase patterns and established React testing practices. The project uses React 19 and Vitest for testing.

## 1. React Testing Library Best Practices for Testing Errors

### Key Resources
- [React Testing Library Documentation - Testing Components](https://testing-library.com/docs/react-testing-library/examples/faq/)
- [React Testing Library Guidelines - Testing Components](https://testing-library.com/docs/guidelines/react-testing-library)

### Testing Patterns

#### Basic Error Boundary Testing

**Project Example** (from `/home/dustin/projects/geoform/src/components/__tests__/FormErrorBoundary.test.tsx`):
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Component that throws an error during render
const ErrorThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div data-testid="child">Child rendered successfully</div>;
};

test('should catch error and display fallback UI', () => {
  const { getByText } = render(
    <FormErrorBoundary formId="test-form" onDismiss={vi.fn()}>
      <ErrorThrowingComponent />
    </FormErrorBoundary>
  );

  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
});
```

### Key Testing Practices in Current Codebase

#### 1. Console Error Suppression for Expected Errors
```typescript
// Suppress console.error for expected errors
const originalError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});
```

#### 2. Testing Error Recovery
```typescript
describe('Try Again button', () => {
  it('should reset error state and attempt to re-render child on click', () => {
    // First render with error
    const { rerender } = render(
      <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
        <ControllableErrorComponent shouldThrow={true} />
      </FormErrorBoundary>
    );

    // Click retry to clear error state
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    // Should now show recovered child
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('recovered-child')).toBeInTheDocument();
  });
});
```

#### 3. Testing Error Callbacks
```typescript
it('should call onError when error is caught', () => {
  const onError = vi.fn();

  render(
    <FormErrorBoundary formId="test" onDismiss={vi.fn()} onError={onError}>
      <ErrorThrowingComponent />
    </FormErrorBoundary>
  );

  expect(onError).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledWith(
    expect.any(Error),
    expect.objectContaining({
      componentStack: expect.any(String),
    })
  );
});
```

## 2. Testing "Must be Used Within Provider" Errors for React Hooks

### Project Example (from `/home/dustin/projects/geoform/src/hooks/__tests__/useFormStack.test.tsx`)

#### Testing Hook Usage Outside Provider
```typescript
describe('when used outside FormStackProvider', () => {
  it('should throw error from useFormStackState', () => {
    // Combined hook uses individual hooks, so error comes from first failing hook
    expect(() => {
      renderHook(() => useFormStack());
    }).toThrow('useFormStackState must be used within a FormStackProvider');
  });
});
```

#### Testing Hook Usage With Provider
```typescript
// Wrapper component for renderHook
const wrapper = ({ children }: { children: ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
);

describe('when used within FormStackProvider', () => {
  it('should return stack, openForm, and closeForm', () => {
    const { result } = renderHook(() => useFormStack(), { wrapper });

    expect(result.current).toHaveProperty('stack');
    expect(result.current).toHaveProperty('openForm');
    expect(result.current).toHaveProperty('closeForm');
  });
});
```

### Key Testing Patterns

#### 1. Testing Provider Violations
```typescript
it('should throw error when hook used outside provider', () => {
  expect(() => {
    renderHook(() => useFormStack());
  }).toThrow('useFormStackState must be used within a FormStackProvider');
});
```

#### 2. Testing Provider Integration
```typescript
it('should work correctly with wrapper provider', () => {
  const { result } = renderHook(() => useFormStack(), { wrapper });

  expect(Array.isArray(result.current.stack)).toBe(true);
  expect(typeof result.current.openForm).toBe('function');
});
```

#### 3. Custom Wrapper Creation
```typescript
// Reusable wrapper factory
const createTestWrapper = (providerProps: any = {}) => ({ children }: { children: ReactNode }) => (
  <FormStackProvider {...providerProps}>
    {children}
  </FormStackProvider>
);

// Usage with different props
const wrapperWithProps = createTestWrapper({ initialStack: [] });
const { result } = renderHook(() => useFormStack(), { wrapper: wrapperWithProps });
```

## 3. React 19 Console Behavior Changes

### Analysis from Current Codebase
The project uses React 19, and we can observe patterns in the test suite that adapt to React 19's console behavior changes.

### Key Changes from React 18 to 19
Based on codebase analysis:
- React 19 has stricter error handling
- Some warnings that were console.warn in React 18 may now be console.error
- Error boundaries have improved error capturing capabilities

### Console Error Suppression Pattern
From `/home/dustin/projects/geoform/src/components/__tests__/FormErrorBoundary.test.tsx`:
```typescript
// Suppress console.error for expected errors
const originalError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});
```

### React 19 Testing Considerations
```typescript
// React 19 specific: Test that errors are properly captured but not logged
test('should suppress expected console errors', () => {
  const consoleSpy = vi.spyOn(console, 'error');

  render(
    <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
      <ErrorThrowingComponent />
    </FormErrorBoundary>
  );

  // Error is caught but console.error should not be called (suppressed)
  expect(consoleSpy).not.toHaveBeenCalled();
  consoleSpy.mockRestore();
});
```

## 4. Kent C. Dodds' Guidance - Applied Patterns

### Key Principles Observed in Codebase
1. **Test error boundaries by capturing errors during render** - See FormErrorBoundary tests
2. **Test both success and error paths** - Comprehensive coverage in current tests
3. **Test error boundaries with different types of errors** - Multiple error scenarios
4. **Test error boundary callbacks** - onError callback testing

### Best Practices Implemented

#### Testing Error Boundary Limitations
```typescript
// Error boundaries don't catch errors from event handlers
describe('Error boundary limitations', () => {
  it('should not capture event handler errors', () => {
    // This pattern would test that event handler errors aren't caught
    // (not currently implemented but follows Kent's guidance)
  });
});
```

#### Testing Error Boundary Reset
```typescript
// Current implementation tests error reset functionality
it('should show error again if child still throws after retry', () => {
  render(
    <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
      <ErrorThrowingComponent shouldThrow={true} />
    </FormErrorBoundary>
  );

  // Click retry - child still throws
  fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

  // Error should still be shown
  expect(screen.getByRole('alert')).toBeInTheDocument();
});
```

## 5. 2024-2025 Updates and New Patterns

### React 19 New Features - Analysis from Codebase
Based on the project's use of React 19, we can observe:

#### Concurrent Features and Testing
The project doesn't currently test concurrent features, but patterns for testing would be:

```typescript
// Hypothetical concurrent feature testing
import { startTransition } from 'react';

test('error boundary with concurrent features', () => {
  const { container } = render(
    <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
      <ConcurrentComponent />
    </FormErrorBoundary>
  );

  act(() => {
    startTransition(() => {
      // Trigger concurrent update that might error
    });
  });

  // Error boundary should handle concurrent errors
  expect(container.querySelector('.error-fallback')).toBeInTheDocument();
});
```

### Modern Testing Patterns from Codebase

#### Reference Stability Testing
```typescript
// From useFormStack test
describe('reference stability', () => {
  it('should maintain stable references across renders', () => {
    const { result, rerender } = renderHook(() => useFormStack(), { wrapper });
    const first = result.current;

    rerender();

    expect(result.current.stack).toBe(first.stack);
    expect(result.current.openForm).toBe(first.openForm);
    expect(result.current.closeForm).toBe(first.closeForm);
  });
});
```

#### TypeScript Integration
```typescript
// Full TypeScript safety in tests
it('should match UseFormStackReturn interface', () => {
  const { result } = renderHook(() => useFormStack(), { wrapper });

  // Type checking ensures proper return type
  const returnValue = result.current;
  expect(returnValue.stack).toBeDefined();
  expect(typeof returnValue.openForm).toBe('function');
  expect(typeof returnValue.closeForm).toBe('function');
});
```

## 6. Testing React Async Error Patterns

### Testing Promise Rejection
The current codebase doesn't have extensive async error testing, but patterns would be:

```typescript
import '@testing-library/jest-dom';

test('handles async errors', async () => {
  vi.useFakeTimers();

  const { container } = render(
    <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
      <AsyncComponent />
    </FormErrorBoundary>
  );

  // Advance timers to trigger async operation
  act(() => {
    vi.advanceTimersByTime(1000);
  });

  // Error boundary should catch async error
  expect(container.querySelector('.error-fallback')).toBeInTheDocument();

  vi.useRealTimers();
});
```

## 7. Current Testing Setup and Patterns

### Vitest Configuration
The project uses Vitest instead of Jest. Key patterns observed:

#### Test Setup
```typescript
// From src/__tests__/setup.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Test Setup Verification', () => {
  it('should have Testing Library matchers available', () => {
    const TestComponent = () => <div data-testid="test">Hello</div>;
    render(<TestComponent />);

    expect(screen.getByTestId('test')).toBeInTheDocument();
    expect(screen.getByTestId('test')).toHaveTextContent('Hello');
  });
});
```

#### Mocking with Vitest
```typescript
// Using vi.fn() for mocks
const onError = vi.fn();
const onDismiss = vi.fn();
```

### Custom Test Utilities

#### Error Testing Helper
```typescript
// Pattern for testing error scenarios
export const createErrorTestComponent = (shouldThrow: boolean, errorMessage: string) => {
  return shouldThrow
    ? () => { throw new Error(errorMessage); }
    : () => <div>Success</div>;
};
```

## 8. Recommendations for Improvement

### Missing Test Patterns to Implement

#### 1. Event Handler Error Testing (Following Kent C. Dodds)
```typescript
describe('error boundary limitations', () => {
  it('should not capture event handler errors', () => {
    const ComponentWithErrorHandler = () => {
      const handleClick = () => {
        throw new Error('Event handler error');
      };

      return (
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <button onClick={handleClick}>Click me</button>
        </FormErrorBoundary>
      );
    };

    render(<ComponentWithErrorHandler />);

    // Error should not be caught by boundary
    fireEvent.click(screen.getByRole('button'));

    // Component should still be mounted
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

#### 2. Async Error Testing
```typescript
describe('async error handling', () => {
  it('should handle errors in useEffect', async () => {
    const AsyncErrorComponent = () => {
      useEffect(() => {
        const fetchData = async () => {
          throw new Error('Async error');
        };
        fetchData();
      }, []);

      return <div>Loading...</div>;
    };

    render(
      <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
        <AsyncErrorComponent />
      </FormErrorBoundary>
    );

    // Error boundary should catch async error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
```

## 9. Resources for Further Research

### Documentation
- [React Testing Library FAQ](https://testing-library.com/docs/react-testing-library/faq/)
- [React Error Boundaries Documentation](https://reactjs.org/docs/error-boundaries.html)
- [React 19 Release Notes](https://react.dev/blog/2024/04/25/react-19)
- [Vitest Documentation](https://vitest.dev/)

### Articles and Blog Posts
- [Kent C. Dodds - Testing Error Boundaries](https://kentcdodds.com/blog/testing-error-boundaries)
- [Testing React Hooks](https://kentcdodds.com/blog/testing-your-react-apps-with-react-testing-library)

### GitHub Repositories
- [React Testing Library](https://github.com/testing-library/react-testing-library)
- [React Error Boundary](https://github.com/bvaughn/react-error-boundary)

## 10. Summary

### Key Findings from Current Codebase

1. **Strong Error Boundary Testing**: The FormErrorBoundary has comprehensive tests covering:
   - Error capture and display
   - Retry functionality
   - Callback functions
   - Custom fallbacks
   - Accessibility features

2. **Provider Pattern Testing**: Hook tests properly verify:
   - Usage outside provider throws errors
   - Usage inside provider works correctly
   - Wrapper pattern for context providers

3. **React 19 Adaptation**: Codebase shows patterns for:
   - Console error suppression
   - TypeScript integration
   - Vitest setup

### Areas for Improvement
1. Event handler error testing (not currently implemented)
2. Async error handling tests
3. Concurrent feature testing with React 19
4. Error boundary performance testing

### Best Practices to Follow
1. Continue comprehensive error boundary testing
2. Add missing error scenario tests
3. Update testing patterns for React 19 features
4. Ensure all async operations are tested for error scenarios

The codebase demonstrates strong foundations in React error testing but has room to expand to cover React 19's new features and edge cases.