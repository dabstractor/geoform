# React Error Boundaries - Limitations & Scope

## Complete List of What Error Boundaries DON'T Catch

### 1. Event Handlers

**Why Not Caught?**
Error Boundaries only work during rendering. Event handlers don't happen during rendering. React doesn't need Error Boundaries to recover because it already knows what to display on screen.

**Example - NOT Caught:**
```jsx
class MyComponent extends React.Component {
  handleClick = () => {
    throw new Error('Click handler error'); // NOT caught
  };

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}
```

**Solution - Use try/catch:**
```jsx
class MyComponent extends React.Component {
  handleClick = () => {
    try {
      // Do something risky
      riskyOperation();
    } catch (error) {
      this.setState({ error: error.message }); // Handle locally
      logToService(error); // Log if needed
    }
  };

  render() {
    if (this.state?.error) {
      return <div>Error: {this.state.error}</div>;
    }

    return <button onClick={this.handleClick}>Click</button>;
  }
}
```

**Alternative - Use react-error-boundary Hook:**
```jsx
import { useErrorBoundary } from 'react-error-boundary';

function MyComponent() {
  const { showBoundary } = useErrorBoundary();

  const handleClick = () => {
    try {
      riskyOperation();
    } catch (error) {
      showBoundary(error); // Pass to nearest Error Boundary
    }
  };

  return <button onClick={handleClick}>Click</button>;
}
```

### 2. Asynchronous Code

**What's Not Caught:**
- `setTimeout` / `setInterval` callbacks
- `Promise.then()` / `.catch()` / `.finally()`
- `async/await` in callbacks
- `requestAnimationFrame` callbacks
- `setImmediate` callbacks

**Example - NOT Caught:**
```jsx
class MyComponent extends React.Component {
  componentDidMount() {
    // This error is NOT caught
    setTimeout(() => {
      throw new Error('Async error');
    }, 1000);

    // This error is NOT caught
    fetch('/api/data')
      .then(r => r.json())
      .catch(error => {
        throw error; // Still not caught
      });

    // This error is NOT caught
    Promise.resolve().then(() => {
      throw new Error('Promise error');
    });
  }

  render() {
    return <div>Content</div>;
  }
}
```

**Solution - Handle Async Errors Explicitly:**
```jsx
class MyComponent extends React.Component {
  state = { error: null, data: null };

  componentDidMount() {
    this.loadData();
  }

  loadData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      this.setState({ data });
    } catch (error) {
      // Store error in state OR pass to boundary
      this.setState({ error });
      // OR: this.props.showErrorBoundary(error);
    }
  };

  render() {
    if (this.state.error) {
      return <div>Error: {this.state.error.message}</div>;
    }

    if (this.state.data) {
      return <div>{JSON.stringify(this.state.data)}</div>;
    }

    return <div>Loading...</div>;
  }
}
```

**Better - Use Hooks with Error Boundary:**
```jsx
function MyComponent() {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const { showBoundary } = useErrorBoundary();

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/data');
        const json = await response.json();
        setData(json);
      } catch (err) {
        // Option 1: Store in local state
        setError(err);
        // Option 2: Pass to boundary
        showBoundary(err);
      }
    };

    loadData();
  }, [showBoundary]);

  if (error) return <div>Error loading</div>;
  if (!data) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

### 3. Server-Side Rendering (SSR)

**Why Not Caught?**
Error Boundaries are a client-side React feature. They don't exist on the server.

**Problem:**
```jsx
// Server-side code - Error Boundaries don't apply here
export async function getServerSideProps() {
  const data = await fetchData(); // If this throws, the entire page crashes
  return { props: { data } };
}

// Client-side rendering works with Error Boundary
<ErrorBoundary>
  <Component data={data} />
</ErrorBoundary>
```

**Solution - Handle SSR Errors Separately:**
```jsx
export async function getServerSideProps() {
  try {
    const data = await fetchData();
    return { props: { data } };
  } catch (error) {
    // Handle server-side error
    return {
      notFound: true, // 404 page
      // OR: redirect: { destination: '/error', permanent: false },
      // OR: return props with error
    };
  }
}

// Client-side still has Error Boundary for runtime errors
<ErrorBoundary fallback={<ErrorUI />}>
  <Component data={data} />
</ErrorBoundary>
```

### 4. Errors Inside the Error Boundary Itself

**Why Not Caught?**
An Error Boundary cannot catch errors within itself. Only parent boundaries can catch errors from child boundaries.

**Example - NOT Caught:**
```jsx
class ErrorBoundary extends React.Component {
  render() {
    if (this.state.hasError) {
      // Error in this fallback UI is NOT caught
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }

  componentDidCatch(error, errorInfo) {
    // Error thrown here is NOT caught by this boundary
    throw new Error('Error in error handler');
  }
}
```

**Solution - Nest Error Boundaries:**
```jsx
function SafeErrorFallback({ error }) {
  // Simple, safe fallback - no complex logic
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Keep this safe - no throwing
    logErrorSafely(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <SafeErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Wrap the whole app for fallback errors
<ErrorBoundary>
  <ErrorBoundary>
    <MyApp />
  </ErrorBoundary>
</ErrorBoundary>
```

### 5. Lifecycle Hook Cleanup Functions

**What's Not Caught:**
- Errors in `componentWillUnmount`
- Errors in `useEffect` cleanup functions
- Errors in `useLayoutEffect` cleanup functions

**Example - NOT Caught:**
```jsx
class MyComponent extends React.Component {
  componentWillUnmount() {
    // Errors here are NOT caught
    riskyCleanup();
  }
}

function MyFunctionComponent() {
  React.useEffect(() => {
    return () => {
      // Errors in cleanup are NOT caught
      throw new Error('Cleanup error');
    };
  }, []);
}
```

**Solution - Handle Cleanup Errors:**
```jsx
class MyComponent extends React.Component {
  componentWillUnmount() {
    try {
      this.cleanup();
    } catch (error) {
      // Log it, but don't throw
      console.error('Cleanup error:', error);
      logToService(error);
    }
  }

  cleanup() {
    // Risky operations
  }
}

function MyFunctionComponent() {
  React.useEffect(() => {
    return () => {
      try {
        // Cleanup operations
        riskyCleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };
  }, []);
}
```

### 6. Errors in useState/useReducer/useContext

**What's Not Caught:**
- Errors thrown by state setter function callbacks
- Errors in useState/useReducer initialization
- Errors from context consumers

**Example - NOT Caught:**
```jsx
function MyComponent() {
  // These are fine - initialization is synchronous
  const [state, setState] = React.useState(initialValue);

  const handleClick = () => {
    // Errors in setState callback are NOT caught
    setState(prevState => {
      throw new Error('setState error'); // NOT caught
    });
  };

  return <button onClick={handleClick}>Update</button>;
}
```

**Solution - Handle in Callback:**
```jsx
function MyComponent() {
  const [state, setState] = React.useState(null);
  const [error, setError] = React.useState(null);

  const handleClick = () => {
    try {
      setState(prevState => {
        // Do safe computation
        return prevState + 1;
      });
    } catch (error) {
      setError(error);
    }
  };

  if (error) return <div>Error: {error.message}</div>;
  return <button onClick={handleClick}>Update</button>;
}
```

### 7. Child Component Rendering Errors in Functional Components

**Limitation:**
Functional components can't be Error Boundaries. If a child throws, the error bubbles up to the nearest class-based Error Boundary.

**This is why react-error-boundary exists** - to enable Error Boundaries in modern React with hooks.

## Limitations Summary Table

| Scenario | Error Caught | Solution |
|----------|-------------|----------|
| **Render method** | ✓ Yes | Error Boundary |
| **Constructor** | ✓ Yes | Error Boundary |
| **Lifecycle methods** | ✓ Yes | Error Boundary |
| **Event handlers** | ✗ No | try/catch |
| **setTimeout/Promise** | ✗ No | try/catch + callback |
| **Server-side rendering** | ✗ No | Server try/catch |
| **Boundary's own errors** | ✗ No | Parent boundary |
| **Cleanup functions** | ✗ No | try/catch in cleanup |
| **Effect errors** | ✗ No (async) | try/catch in effect |

## Scope: What Error Boundaries ARE Good For

### Perfect Use Cases

1. **Rendering Errors**
   - Null reference in render
   - Invalid children types
   - Component initialization failures

2. **Component Logic Errors**
   - Errors in constructor
   - Errors in lifecycle methods
   - Errors in getDerivedStateFromProps

3. **Third-Party Component Errors**
   - Isolate third-party library crashes
   - Prevent one bad component from breaking app

4. **Route-Level Error Handling**
   - Show different error UI per page
   - Isolate page-specific errors

5. **Feature-Level Error Isolation**
   - Widget errors don't affect sidebar
   - Dashboard errors don't affect header

## Scope: What to Use Instead

| Need | Use |
|------|-----|
| Event handler errors | try/catch + setState |
| API call errors | try/catch + setState or useErrorBoundary |
| Async code errors | try/catch + promise .catch |
| SSR errors | Server-side error handling |
| Global error handling | Root-level try/catch + error page |

## Best Practice: Layered Error Handling

```jsx
// Layer 1: Error Boundaries (Rendering errors)
<ErrorBoundary name="App">

  {/* Layer 2: Feature Error Boundaries */}
  <ErrorBoundary name="Dashboard">

    {/* Layer 3: Component-level try/catch (Event handlers, async) */}
    <DashboardContent />
  </ErrorBoundary>

  <ErrorBoundary name="UserProfile">
    <ProfileComponent />
  </ErrorBoundary>
</ErrorBoundary>

// Layer 4: useErrorBoundary hook (for passing async errors up)
function MyComponent() {
  const { showBoundary } = useErrorBoundary();

  const handleAsyncError = async () => {
    try {
      await riskyAsync();
    } catch (error) {
      showBoundary(error); // Pass to nearest boundary
    }
  };
}
```

## Performance Implications

### Overhead
- **No overhead when no errors** - Error Boundaries add zero runtime cost in happy path
- **Minimal overhead when catching errors** - Just rendering fallback UI
- **Memory impact negligible** - Storing error state uses minimal memory

### Optimization Tips
1. Don't wrap every single component (adds no protection, adds overhead)
2. Wrap at feature boundaries (good balance of protection and simplicity)
3. Keep fallback UIs simple and lightweight
4. Avoid complex logic in componentDidCatch

## React 19+ Improvements

### Better Error Isolation
```jsx
// React 19 distinguishes caught vs uncaught errors
const root = ReactDOM.createRoot(element, {
  onCaughtError: (error) => {
    // Boundary caught it - recoverable
    Sentry.captureException(error, { level: 'warning' });
  },
  onUncaughtError: (error) => {
    // No boundary caught it - critical
    Sentry.captureException(error, { level: 'critical' });
  },
});
```

### Automatic Error Recovery (Limited)
```jsx
// React 19 attempts to automatically recover from some errors
// If recovery succeeds, onRecoverableError is called instead
const root = ReactDOM.createRoot(element, {
  onRecoverableError: (error) => {
    // Auto-recovered - log but don't show error
    console.log('Auto-recovered from:', error);
  },
});
```

## When Not to Use Error Boundaries

1. **Error handling in forms** - Use local state instead
2. **Validation errors** - Use local state + conditional rendering
3. **Loading states** - Use Suspense or local state
4. **Network request errors** - Use try/catch in effect
5. **Global state errors** - Use state management library's error handling

## Conclusion: The Error Handling Pyramid

```
         Uncaught Errors
              ↑
     Global Error Handler
              ↑
       App-Level Boundary
              ↑
      Feature Boundaries
              ↑
   Component try/catch
              ↑
      Validation/Local State
```

Error Boundaries are best used as part of this layered approach, not as the only error handling mechanism.
