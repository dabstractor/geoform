# React Error Boundaries - Common Pitfalls & Gotchas

## Pitfall 1: Try/Catch Doesn't Work for Component Rendering

### The Problem
JavaScript's try/catch blocks only work in imperative code. They don't catch errors that happen during React's declarative rendering.

### WRONG
```jsx
// This WILL NOT catch rendering errors
try {
  return (
    <div>
      <MyComponent />
    </div>
  );
} catch (error) {
  console.log('Caught:', error); // Never runs for rendering errors
}
```

### RIGHT
```jsx
// Use Error Boundary instead
<ErrorBoundary fallback={<div>Error!</div>}>
  <MyComponent />
</ErrorBoundary>
```

### Why?
When you write JSX, React doesn't immediately call your component. It creates a description of what should be rendered. The actual execution happens later when React walks the component tree. By then, the try/catch has already exited.

### Exception: Constructor Errors
Try/catch CAN catch errors in the constructor, but Error Boundaries are still recommended:

```jsx
class Component extends React.Component {
  constructor(props) {
    super(props);
    try {
      this.state = this.initializeState(); // Caught by try/catch
    } catch (error) {
      console.error('Constructor error:', error);
      this.state = { error };
    }
  }
}
```

## Pitfall 2: Uncaught Errors Crash Entire App

### The Problem
In React 16+, if an error is not caught by any Error Boundary, the entire component tree unmounts. This is a deliberate design decision to avoid leaving corrupted UI.

### Scenario
```jsx
function App() {
  return (
    <Header /> {/* Safe */}
    <MainContent> {/* Error here... */}
      <BrokenComponent /> {/* throws error */}
    </MainContent>
    <Footer /> {/* Never renders */}
  );
}
```

### Solution
Wrap at appropriate boundaries:

```jsx
function App() {
  return (
    <ErrorBoundary fallback={<ErrorUI />}>
      <Header />
    </ErrorBoundary>

    <ErrorBoundary fallback={<MainContentError />}>
      <MainContent>
        <BrokenComponent />
      </MainContent>
    </ErrorBoundary>

    <ErrorBoundary fallback={<FooterError />}>
      <Footer />
    </ErrorBoundary>
  );
}
```

## Pitfall 3: Event Handler Errors Not Caught

### The Problem
Error Boundaries do NOT catch errors in event handlers. React already knows what's on screen, so it doesn't need Error Boundaries for those.

### WRONG - Won't be caught
```jsx
class MyComponent extends React.Component {
  handleClick = () => {
    throw new Error('Event handler error'); // NOT caught by Error Boundary
  };

  render() {
    return <button onClick={this.handleClick}>Click me</button>;
  }
}
```

### RIGHT - Use try/catch
```jsx
class MyComponent extends React.Component {
  handleClick = () => {
    try {
      // Do something that might fail
      this.riskyOperation();
    } catch (error) {
      this.setState({ error: error.message });
      // Or use useErrorBoundary hook to pass to nearest boundary
    }
  };

  render() {
    if (this.state?.error) {
      return <div>Error: {this.state.error}</div>;
    }

    return <button onClick={this.handleClick}>Click me</button>;
  }
}
```

### RIGHT - Using react-error-boundary Hook
```jsx
import { useErrorBoundary } from 'react-error-boundary';

function MyComponent() {
  const { showBoundary } = useErrorBoundary();

  const handleClick = () => {
    try {
      // Do something
    } catch (error) {
      showBoundary(error); // Pass to nearest Error Boundary
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## Pitfall 4: Async Code Errors

### The Problem
Errors in async code (Promise rejections, setTimeout callbacks) are not caught by Error Boundaries.

### WRONG
```jsx
class MyComponent extends React.Component {
  componentDidMount() {
    // These errors are NOT caught
    setTimeout(() => {
      throw new Error('Timeout error'); // Not caught!
    }, 1000);

    fetch('/api/data').catch(error => {
      throw error; // Not caught!
    });

    Promise.reject('Async error'); // Not caught!
  }

  render() {
    return <div>Data loading...</div>;
  }
}
```

### RIGHT - Use try/catch in async
```jsx
class MyComponent extends React.Component {
  componentDidMount() {
    this.loadData();
  }

  loadData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      this.setState({ data });
    } catch (error) {
      this.setState({ error }); // Set local state
      // OR pass to boundary if available
    }
  };

  render() {
    const { error, data } = this.state || {};

    if (error) {
      return <div>Error: {error.message}</div>;
    }

    return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>;
  }
}
```

### RIGHT - With react-error-boundary
```jsx
import { useErrorBoundary } from 'react-error-boundary';

function MyComponent() {
  const [data, setData] = React.useState(null);
  const { showBoundary } = useErrorBoundary();

  React.useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(setData)
      .catch(showBoundary); // Pass to boundary
  }, [showBoundary]);

  return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>;
}
```

## Pitfall 5: Error Boundary Can't Catch Its Own Errors

### The Problem
An Error Boundary cannot catch errors within itself. Only parent boundaries can catch errors from child boundaries.

### WRONG - This error won't be caught
```jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    throw new Error('Error in error handler!'); // Not caught!
  }

  render() {
    if (this.state.hasError) {
      // Error in this fallback won't be caught
      throw new Error('Fallback error');
    }

    return this.props.children;
  }
}
```

### RIGHT - Nest boundaries
```jsx
const SafeFallback = ({ error }) => (
  <div>Something went wrong: {error.message}</div>
);

function App() {
  return (
    <ErrorBoundary fallback={<SafeFallback />}>
      <ErrorBoundary fallback={<SafeFallback />}>
        <MyComponent />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
```

## Pitfall 6: Class Components Only

### The Problem
Only class components can be Error Boundaries. There's no hook equivalent yet.

### WRONG - Functional components can't be boundaries
```jsx
// This won't work as an error boundary
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  // No getDerivedStateFromError or componentDidCatch
  // Can't catch child errors
};
```

### RIGHT - Use class component or library
```jsx
// Option 1: Class component
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    // ...
  }
}

// Option 2: Use react-error-boundary (recommended)
import { ErrorBoundary } from 'react-error-boundary';
```

## Pitfall 7: Granularity Issues

### Too Many Boundaries
```jsx
function App() {
  return (
    <ErrorBoundary>
      <ErrorBoundary>
        <Header />
      </ErrorBoundary>

      <ErrorBoundary>
        <Button />
      </ErrorBoundary>

      <ErrorBoundary>
        <Text />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
// Result: 4 error messages if anything fails - confusing!
```

### Too Few Boundaries
```jsx
function App() {
  return (
    <ErrorBoundary>
      <entire-app-here />
    </ErrorBoundary>
  );
}
// Result: Whole app disappears if any component fails
```

### RIGHT - Balanced approach
```jsx
function App() {
  return (
    <ErrorBoundary> {/* App level */}
      <Header />

      <ErrorBoundary> {/* Feature level */}
        <Dashboard />
      </ErrorBoundary>

      <ErrorBoundary> {/* Feature level */}
        <Sidebar />
      </ErrorBoundary>

      <Footer />
    </ErrorBoundary>
  );
}
```

## Pitfall 8: Debugging Difficulties

### The Problem
Error Boundaries can hide the original error source and make debugging harder.

### Issues
```jsx
// In development, you might not see which component actually threw
// ComponentStack helps but isn't always clear
// Console errors might be suppressed or duplicated
```

### Solutions
```jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Always log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Log to service in production
    logToService(error, errorInfo);
  }
}

// Use React DevTools to inspect component tree
// Use browser DevTools to set breakpoints
// Use error logging service with full context
```

## Pitfall 9: Missing Error State Management

### The Problem
Error Boundaries only handle display. They don't manage application error state.

### WRONG
```jsx
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true }; // Only shows fallback UI
    // App state is lost, no recovery mechanism
  }

  render() {
    if (this.state.hasError) {
      return <div>Error!</div>; // No way to recover
    }
    return this.props.children;
  }
}
```

### RIGHT
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      lastValidState: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Store recovery data
    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
      lastValidState: this.getLastValidState(),
    }));
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Error</h2>
          <button onClick={this.handleRetry}>
            Retry (Attempt {this.state.retryCount})
          </button>
        </div>
      );
    }

    return this.props.children;
  }

  getLastValidState() {
    return JSON.parse(localStorage.getItem('lastValidState') || 'null');
  }
}
```

## Pitfall 10: Server-Side Rendering (SSR) Issues

### The Problem
Error Boundaries are client-side only. They don't work on the server.

### WRONG
```jsx
// Server-side rendering doesn't use Error Boundaries
// Errors during SSR crash the server, not gracefully handled
export async function getServerSideProps() {
  const data = await riskyOperation(); // If this throws, SSR crashes
}
```

### RIGHT
```jsx
// Handle errors in SSR separately
export async function getServerSideProps() {
  try {
    const data = await riskyOperation();
    return { props: { data } };
  } catch (error) {
    return {
      notFound: true, // or redirect, or error props
    };
  }
}

// Use Error Boundary on client
<ErrorBoundary fallback={<ErrorUI />}>
  <MyComponent />
</ErrorBoundary>
```

## Pitfall 11: State Updates During Render

### The Problem
Setting state in render method causes infinite loops.

### WRONG
```jsx
class MyComponent extends React.Component {
  render() {
    if (someCondition) {
      this.setState({ error: true }); // WRONG! Infinite loop
    }
    return <div>Content</div>;
  }
}
```

### RIGHT - Use getDerivedStateFromError
```jsx
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    // Correct place to update state from error
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Error</div>;
    }
    return this.props.children;
  }
}
```

## Pitfall 12: React.lazy() with Error Boundaries

### Problem/Solution
```jsx
const LazyComponent = React.lazy(() => import('./Component'));

function App() {
  return (
    <ErrorBoundary fallback={<div>Failed to load</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
// If lazy import fails, Error Boundary catches it
// If component renders and throws, Error Boundary catches it
```

## Quick Reference: What's Caught vs Not Caught

| Scenario | Caught | How to Handle |
|----------|--------|--------------|
| Render errors | YES | Error Boundary |
| Lifecycle errors | YES | Error Boundary |
| Constructor errors | YES | Error Boundary |
| Event handlers | NO | try/catch |
| Promises/async | NO | try/catch + catch() |
| setTimeout | NO | try/catch |
| SSR errors | NO | Server-side try/catch |
| Error in boundary itself | NO | Parent boundary |

## Debugging Checklist

- [ ] Error Boundary only in child components
- [ ] Use react-error-boundary for easier testing
- [ ] Log errors to external service
- [ ] Test error scenarios with Jest/React Testing Library
- [ ] Check browser console for full stack traces
- [ ] Use React DevTools to inspect component tree
- [ ] Suppress console errors in tests with beforeEach hook
- [ ] Mock components that throw in tests
- [ ] Set breakpoints in componentDidCatch
- [ ] Monitor error rates in production
