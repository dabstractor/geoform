# Testing Error Boundaries

## Overview

Error boundaries catch JavaScript errors during rendering and provide fallback UI. Testing error boundaries requires simulating render-time errors and verifying that the boundary correctly displays error UI and supports recovery.

## Core Concepts

### What Error Boundaries Catch

Error boundaries only catch errors thrown during:
- Component render
- Lifecycle methods (componentDidMount, etc.)
- Constructors of child components

They do NOT catch:
- Event handler errors (use try/catch)
- Async code errors (callbacks, timers, promises)
- Server-side rendering errors
- Errors in the error boundary itself

## Testing Patterns

### 1. Basic Error Boundary Test

Create a component that intentionally throws:

```typescript
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

// Component that throws during render
function BrokenComponent() {
  throw new Error('This component is broken!')
}

test('error boundary catches render errors', () => {
  // Suppress console.error to keep test output clean
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

  render(
    <ErrorBoundary>
      <BrokenComponent />
    </ErrorBoundary>
  )

  // Verify fallback UI is displayed
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  expect(screen.getByText(/error occurred/i)).toBeInTheDocument()

  spy.mockRestore()
})
```

### 2. Error Boundary Component Implementation

```typescript
import React, { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 3. Testing Happy Path (No Errors)

```typescript
function WorkingComponent() {
  return <div>I work fine!</div>
}

test('error boundary renders children when no error', () => {
  render(
    <ErrorBoundary>
      <WorkingComponent />
    </ErrorBoundary>
  )

  expect(screen.getByText('I work fine!')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
```

### 4. Testing Error Recovery

```typescript
import userEvent from '@testing-library/user-event'

test('error boundary recovers when retry button clicked', async () => {
  const user = userEvent.setup()
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  const { rerender } = render(
    <ErrorBoundary>
      <BrokenComponent />
    </ErrorBoundary>
  )

  // Error is caught
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

  // User clicks retry
  await user.click(screen.getByRole('button', { name: /try again/i }))

  // Component should attempt to render again, but still fails
  // (unless component is fixed)
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

  consoleSpy.mockRestore()
})
```

### 5. Testing Async Errors with Error Boundary

Error boundaries don't catch async errors directly, but you can test components that handle them:

```typescript
function AsyncComponent() {
  const [error, setError] = React.useState<Error | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleLoad = async () => {
    try {
      setLoading(true)
      const data = await fetchData()
      // Use data
    } catch (err) {
      // Throw to error boundary
      if (err instanceof Error) {
        throw err // This WILL NOT be caught by ErrorBoundary
      }
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    throw error // Now error boundary can catch
  }

  return <button onClick={handleLoad}>Load data</button>
}

test('async error handling in component', async () => {
  const user = userEvent.setup()
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  vi.mocked(fetchData).mockRejectedValue(new Error('API Error'))

  render(
    <ErrorBoundary>
      <AsyncComponent />
    </ErrorBoundary>
  )

  await user.click(screen.getByRole('button'))

  // Note: Error might not be caught by boundary
  // Better to test error state in component directly

  consoleSpy.mockRestore()
})
```

### 6. Using react-error-boundary Library

```typescript
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert">
      <h1>Oops! Something went wrong.</h1>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>
        Try again
      </button>
    </div>
  )
}

test('error boundary with react-error-boundary', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  const onError = vi.fn()

  render(
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={onError}
    >
      <BrokenComponent />
    </ErrorBoundary>
  )

  expect(screen.getByText(/Oops/)).toBeInTheDocument()
  expect(onError).toHaveBeenCalled()

  consoleSpy.mockRestore()
})
```

### 7. Testing Error Details

```typescript
test('error boundary displays error details', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  const testError = new Error('Custom error message')

  function ComponentWithSpecificError() {
    throw testError
  }

  render(
    <ErrorBoundary>
      <ComponentWithSpecificError />
    </ErrorBoundary>
  )

  expect(screen.getByText(/Custom error message/)).toBeInTheDocument()
  expect(screen.getByRole('alert')).toBeInTheDocument()

  consoleSpy.mockRestore()
})
```

### 8. Testing Granular Error Boundaries

Wrap individual components in error boundaries for isolated handling:

```typescript
function Page() {
  return (
    <div>
      <header>
        <ErrorBoundary>
          <Header />
        </ErrorBoundary>
      </header>

      <main>
        <ErrorBoundary>
          <UserProfile />
        </ErrorBoundary>
        <ErrorBoundary>
          <Sidebar />
        </ErrorBoundary>
      </main>
    </div>
  )
}

test('granular error boundaries isolate failures', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  function FailingUserProfile() {
    throw new Error('Profile failed')
  }

  function WorkingSidebar() {
    return <div>Sidebar content</div>
  }

  render(
    <div>
      <ErrorBoundary>
        <FailingUserProfile />
      </ErrorBoundary>
      <ErrorBoundary>
        <WorkingSidebar />
      </ErrorBoundary>
    </div>
  )

  // Sidebar still works even though profile failed
  expect(screen.getByText('Sidebar content')).toBeInTheDocument()
  // Profile shows error
  expect(screen.getByText(/Profile failed/)).toBeInTheDocument()

  consoleSpy.mockRestore()
})
```

## Best Practices

### DO:
- Suppress console.error in tests with `vi.spyOn(console, 'error').mockImplementation()`
- Test both happy path and error path
- Test recovery/retry functionality
- Use granular error boundaries for better UX
- Test error message display
- Verify fallback UI renders correctly

### DON'T:
- Forget to restore console spy after test
- Test unrelated behavior in error tests
- Use error boundaries for control flow
- Expect error boundaries to catch event handler errors
- Leave errors unhandled in components
- Test async errors that bypass error boundaries

## Error Boundary Pattern Checklist

When implementing error boundaries:

```typescript
✓ getDerivedStateFromError() to update state
✓ componentDidCatch() for side effects (logging)
✓ Fallback UI with clear error message
✓ Recovery mechanism (retry button)
✓ Appropriate granularity (not too broad/narrow)
✓ Accessible error display (role="alert")
✓ Suppress console.error during testing
✓ Test both success and failure paths
```

## Key References

- **How to Test Error Boundaries (James Shakespeare)**: https://jshakespeare.com/react-error-boundary-testing-rtl/
- **Testing React Error Boundaries (Chris Boakes)**: https://chrisboakes.com/testing-react-component-error-boundaries/
- **React Error Boundary Test Example (Gist)**: https://gist.github.com/Haakh/8383f36110f58050303668b30647ce22
- **react-error-boundary Library**: https://github.com/bvaughn/react-error-boundary
- **React Error Handling Guide**: https://blog.logrocket.com/react-error-handling-react-error-boundary/

## Summary

Test error boundaries by creating components that throw errors during render, verifying fallback UI appears, and testing recovery mechanisms. Use `vi.spyOn()` to suppress console errors in tests. Test both happy path (no errors) and error path (exceptions caught). Use granular error boundaries for better isolation.
