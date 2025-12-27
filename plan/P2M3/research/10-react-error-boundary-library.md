# React Error Boundary Library - react-error-boundary

## Overview

**Library**: `react-error-boundary`
**Author**: Brian Vaughn
**Repository**: https://github.com/bvaughn/react-error-boundary
**NPM**: https://www.npmjs.com/package/react-error-boundary
**Latest Stats**: 7.8k GitHub stars, 237k dependent packages

### Why Use It?

| Feature | Class Component | react-error-boundary |
|---------|-----------------|----------------------|
| **Works with hooks** | ✗ No | ✓ Yes |
| **Functional components** | ✗ No | ✓ Yes |
| **Easy to test** | ~ Moderate | ✓ Easy |
| **Boilerplate** | ✗ High | ✓ Low |
| **Modern React patterns** | ✗ No | ✓ Yes |
| **TypeScript support** | ✓ Yes | ✓ Excellent |
| **Error recovery** | ~ Manual | ✓ Built-in |
| **Async error handling** | ✗ No | ✓ useErrorBoundary hook |

## Installation

```bash
npm install react-error-boundary
# or
yarn add react-error-boundary
# or
pnpm add react-error-boundary
```

## Core Components

### 1. ErrorBoundary Component

The main component that catches errors.

**Props:**
```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<FallbackProps>;
  fallbackRender?: (fallbackProps: FallbackProps) => ReactElement;
  fallback?: ReactElement;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: (details: ResetDetails) => void;
  resetKeys?: Array<string | number>;
}

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}
```

### 2. FallbackProps

Props passed to fallback components.

```typescript
interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}
```

### 3. useErrorBoundary Hook

Allows functional components to interact with Error Boundaries.

```typescript
interface UseErrorBoundaryReturn {
  showBoundary(error: Error): void;
  resetBoundary(): void;
}
```

## Usage Patterns

### Pattern 1: FallbackComponent

Component-based approach (recommended for reusability).

```jsx
import { ErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div role="alert">
    <h2>Something went wrong</h2>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Pattern 2: fallbackRender

Render function approach (for inline UIs).

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert">
          <h2>Error: {error.message}</h2>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Pattern 3: fallback

Static fallback UI (simplest).

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Advanced Patterns

### Pattern 4: With Error Logging

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function logErrorToService(error, errorInfo) {
  // Send to Sentry, Datadog, etc.
  fetch('/api/log-error', {
    method: 'POST',
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    }),
  });
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>An error occurred</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={logErrorToService}
      onReset={() => window.location.href = '/'}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Pattern 5: useErrorBoundary Hook for Async Errors

```jsx
import { useErrorBoundary } from 'react-error-boundary';

function MyComponent() {
  const [data, setData] = React.useState(null);
  const { showBoundary } = useErrorBoundary();

  React.useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(setData)
      .catch(showBoundary); // Pass async error to boundary
  }, [showBoundary]);

  return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>;
}
```

### Pattern 6: resetKeys for Auto-Recovery

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <div>
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search..."
      />

      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          // Clear any state that might have caused the error
        }}
        resetKeys={[searchQuery]} // Auto-reset when query changes
      >
        <SearchResults query={searchQuery} />
      </ErrorBoundary>
    </div>
  );
}
```

### Pattern 7: withErrorBoundary HOC

```jsx
import { withErrorBoundary } from 'react-error-boundary';

function MyComponent() {
  return <div>My component</div>;
}

const MyComponentWithErrorBoundary = withErrorBoundary(MyComponent, {
  FallbackComponent: ErrorFallback,
  onError(error, errorInfo) {
    console.error('Error caught:', error);
  },
});

export default MyComponentWithErrorBoundary;
```

### Pattern 8: Multiple Error Boundaries

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={AppErrorFallback}
      onReset={() => window.location.href = '/'}
    >
      <Header />

      <ErrorBoundary
        FallbackComponent={SidebarErrorFallback}
        onReset={() => {}}
      >
        <Sidebar />
      </ErrorBoundary>

      <ErrorBoundary
        FallbackComponent={MainErrorFallback}
        onReset={() => {}}
      >
        <MainContent />
      </ErrorBoundary>

      <Footer />
    </ErrorBoundary>
  );
}
```

### Pattern 9: Error Boundary with Retry Logic

```jsx
import { ErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Simulate recovery action
      await new Promise(resolve => setTimeout(resolve, 1000));
      resetErrorBoundary();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button
        onClick={handleRetry}
        disabled={isRetrying}
      >
        {isRetrying ? 'Retrying...' : 'Try Again'}
      </button>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Pattern 10: Contextual Error Fallbacks

```jsx
import { ErrorBoundary } from 'react-error-boundary';

const getErrorFallback = (context) => {
  switch (context) {
    case 'dashboard':
      return (
        <div>
          <h2>Dashboard Error</h2>
          <p>Unable to load dashboard</p>
        </div>
      );
    case 'form':
      return (
        <div>
          <h2>Form Error</h2>
          <p>Unable to submit form</p>
        </div>
      );
    default:
      return <div>An error occurred</div>;
  }
};

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div>{getErrorFallback('dashboard')}</div>
      )}
    >
      <Dashboard />
    </ErrorBoundary>
  );
}
```

## TypeScript Support

### Typed FallbackComponent

```typescript
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { FC } from 'react';

const ErrorFallback: FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => (
  <div role="alert">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

export default ErrorFallback;
```

### Typed useErrorBoundary

```typescript
import { useErrorBoundary } from 'react-error-boundary';

function MyComponent() {
  const { showBoundary, resetBoundary } =
    useErrorBoundary();

  const handleAsyncError = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      if (error instanceof Error) {
        showBoundary(error);
      }
    }
  };

  return (
    <div>
      <button onClick={handleAsyncError}>Fetch</button>
      <button onClick={resetBoundary}>Reset</button>
    </div>
  );
}
```

## Comparison with Native Error Boundaries

### Native (Class Component)
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Error</div>;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

### react-error-boundary
```jsx
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div role="alert">
    <p>Error: {error.message}</p>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

// Usage
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={logToService}
>
  <MyComponent />
</ErrorBoundary>
```

**Advantages of react-error-boundary:**
- Cleaner syntax
- Better TypeScript support
- Built-in retry/reset
- Works with hooks
- Easier to test
- Less boilerplate

## Testing with react-error-boundary

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { FC } from 'react';

// Component that throws error
const BrokenComponent = () => {
  throw new Error('Test error');
};

// Fallback component
const ErrorFallback: FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => (
  <div>
    <p role="alert">Error: {error.message}</p>
    <button onClick={resetErrorBoundary}>Reset</button>
  </div>
);

// Tests
describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('displays fallback UI when error occurs', () => {
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Error: Test error');
  });

  it('resets when reset button is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <BrokenComponent />
      </ErrorBoundary>
    );

    const resetButton = screen.getByRole('button', { name: 'Reset' });
    userEvent.click(resetButton);

    // After reset, component should attempt to render again
    // (will throw again, unless component is fixed)
  });

  it('calls onError callback', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={onError}
      >
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toHaveProperty('message', 'Test error');
  });
});
```

## React 19 Client Component Limitation

**Important**: ErrorBoundary is a client component. In Next.js or other frameworks using Server Components:

```tsx
// pages/app.tsx
'use client'; // Required!

import { ErrorBoundary } from 'react-error-boundary';

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Migration from Native to react-error-boundary

### Before (Native)
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorUI />;
    }
    return this.props.children;
  }
}

<ErrorBoundary>
  <MyApp />
</ErrorBoundary>
```

### After (react-error-boundary)
```jsx
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

const ErrorFallback = (props: FallbackProps) => <ErrorUI {...props} />;

<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={logErrorToService}
>
  <MyApp />
</ErrorBoundary>
```

## Key Advantages Summary

1. **Modern Syntax** - No need for class components
2. **Hook Support** - Use useErrorBoundary for async errors
3. **Better Testing** - Easier to test with standard patterns
4. **TypeScript** - Excellent type definitions
5. **Built-in Recovery** - resetKeys for automatic recovery
6. **Flexible** - Multiple fallback patterns
7. **Production Ready** - 237k dependent packages, actively maintained
8. **Developer Experience** - Less boilerplate, more intuitive

## When to Use react-error-boundary

- Modern React projects
- New applications
- Projects using hooks
- Team familiar with modern React patterns
- Need for easier testing
- TypeScript projects

## When to Use Native Error Boundaries

- Legacy projects
- Class-heavy codebases
- Minimal dependencies preference
- Very simple error handling needs

## Recommendation

**Use react-error-boundary** for 2024/2025 projects. It's the community standard, actively maintained, and provides a better developer experience.
