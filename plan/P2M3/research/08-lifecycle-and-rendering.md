# React Error Boundaries - Lifecycle & Rendering Interaction

## Error Propagation Model

### How Errors Flow Through React

```
Child Component Error
        ↓
React catches during render
        ↓
Walks up component tree
        ↓
Finds nearest Error Boundary
        ↓
Calls getDerivedStateFromError() [Render Phase]
        ↓
Re-renders with fallback UI
        ↓
Calls componentDidCatch() [Commit Phase]
        ↓
Error Boundary displays fallback
        ↓
If no boundary found: Unmount entire tree (React 16+)
```

## Render Phase vs Commit Phase

### Render Phase
**Timing**: Synchronous, happens before DOM updates
**Properties**:
- Must be pure (no side effects)
- Can be paused and resumed
- Might be called multiple times
- No DOM access

**Called Methods**:
- `getDerivedStateFromError()`
- `render()`
- `constructor()`
- `static getDerivedStateFromProps()`

```jsx
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    // Called during render phase
    // Pure function - NO side effects
    // Can't call setState, console.log, fetch, etc.
    return { hasError: true };
  }

  render() {
    // Also part of render phase
    // Must be pure
    if (this.state.hasError) {
      return <div>Fallback UI</div>;
    }
    return this.props.children;
  }
}
```

### Commit Phase
**Timing**: After render, synchronous, after DOM updates
**Properties**:
- Side effects allowed
- Can modify DOM directly
- Can use refs
- Can call setState (but usually shouldn't)
- DOM is now updated

**Called Methods**:
- `componentDidMount()`
- `componentDidUpdate()`
- `componentWillUnmount()`
- `componentDidCatch()`

```jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Called during commit phase
    // Side effects ARE allowed
    // Use for logging, error reporting, etc.

    // Log to console
    console.error('Error:', error);

    // Send to error service
    fetch('/api/log-error', {
      method: 'POST',
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }),
    });

    // Update external services
    Sentry.captureException(error);
  }
}
```

## Complete Lifecycle Sequence

### 1. Normal (No Error) Sequence
```
Parent.render()
  └─ Child.constructor()
     Child.getDerivedStateFromProps()
     Child.render()
     └─ Grandchild.constructor()
        Grandchild.render()
     Grandchild.componentDidMount()
  Child.componentDidMount()
Parent.componentDidMount()
```

### 2. Error During Render Sequence
```
Parent.render()
  └─ Child.render() ❌ THROWS ERROR

React catches error
  ↓
Walks up to find Error Boundary
  ↓
ErrorBoundary.getDerivedStateFromError() ← RENDER PHASE
  ├─ Returns new state
  └─ Triggers re-render
  ↓
ErrorBoundary.render() (with new state)
  └─ Returns fallback UI
  ↓
ErrorBoundary.componentDidCatch() ← COMMIT PHASE
  └─ Logs error, sends to service
```

### 3. Error During componentDidMount Sequence
```
Child.componentDidMount() ❌ THROWS ERROR

React catches error
  ↓
ErrorBoundary.getDerivedStateFromError() [RE-RENDER]
  ↓
ErrorBoundary.render() [Fallback UI]
  ↓
ErrorBoundary.componentDidCatch()
  └─ Logs error
```

## Error Boundary Placement Impact

### Single Top-Level Boundary
```jsx
<ErrorBoundary>
  <Header />      {/* If throws, hides ALL */}
  <Sidebar />     {/* If throws, hides ALL */}
  <MainContent /> {/* If throws, hides ALL */}
  <Footer />      {/* If throws, hides ALL */}
</ErrorBoundary>

// Result: Any error hides entire application
```

### Multiple Granular Boundaries
```jsx
<ErrorBoundary>        {/* App level: Last resort */}
  <ErrorBoundary>      {/* Header level */}
    <Header />
  </ErrorBoundary>

  <ErrorBoundary>      {/* Sidebar level */}
    <Sidebar />
  </ErrorBoundary>

  <ErrorBoundary>      {/* Content level */}
    <MainContent />
  </ErrorBoundary>

  <Footer />           {/* Unprotected but safe */}
</ErrorBoundary>

// Result: Only affected section shows error
```

## Error Catching by Lifecycle Phase

### Errors Caught During Different Phases

```jsx
class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    // ERROR: Caught ✓
    if (props.shouldThrow) throw new Error('Constructor');
  }

  static getDerivedStateFromProps(props, state) {
    // ERROR: Caught ✓
    if (props.shouldThrow) throw new Error('getDerivedStateFromProps');
    return state;
  }

  render() {
    // ERROR: Caught ✓
    if (this.props.shouldThrow) throw new Error('Render');
    return <div>Content</div>;
  }

  componentDidMount() {
    // ERROR: Caught ✓ (if thrown synchronously)
    if (this.props.shouldThrow) throw new Error('componentDidMount');

    // ERROR: NOT caught ✗ (if in callback)
    setTimeout(() => {
      throw new Error('setTimeout in componentDidMount');
    }, 0);

    // ERROR: NOT caught ✗ (if in Promise)
    Promise.reject(new Error('Promise rejection'));
  }

  componentDidUpdate(prevProps) {
    // ERROR: Caught ✓
    if (this.props.shouldThrow) throw new Error('componentDidUpdate');
  }

  onClick = () => {
    // ERROR: NOT caught ✗
    throw new Error('Event handler');
  };

  render() {
    return <button onClick={this.onClick}>Click</button>;
  }
}
```

## State Update During Error Recovery

### getDerivedStateFromError Execution
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // This gets previous state as closure variable
    // CANNOT access this.state
    // CANNOT use setState
    // MUST return state object

    return {
      hasError: true,
      // Note: errorCount will be 0 here, updated in componentDidCatch
    };
  }

  componentDidCatch(error, errorInfo) {
    // Can update state here (though not recommended)
    // This is called AFTER getDerivedStateFromError
    // After this state update, no re-render happens

    this.setState(prevState => ({
      errorCount: prevState.errorCount + 1,
    }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          Error occurred (Count: {this.state.errorCount})
        </div>
      );
    }

    return this.props.children;
  }
}
```

### State Update Timing
```
1. Error thrown
   ↓
2. getDerivedStateFromError() returns new state
   ↓
3. React queues state update
   ↓
4. Component re-renders with new state
   ↓
5. DOM is updated
   ↓
6. componentDidCatch() is called
   ↓
7. componentDidCatch() calls setState()
   ↓
8. setState() is queued but doesn't cause re-render immediately
   ↓
9. After componentDidCatch completes, state updates might cause another render
```

## How Error Boundaries Interact with Other Features

### With Suspense
```jsx
// Error Boundary around Suspense
<ErrorBoundary fallback={<ErrorUI />}>
  <Suspense fallback={<Loading />}>
    <LazyComponent />
  </Suspense>
</ErrorBoundary>

// Scenarios:
// 1. LazyComponent fails to load: Error Boundary catches
// 2. LazyComponent throws during render: Error Boundary catches
// 3. LazyComponent suspends: Suspense shows fallback
```

### With useEffect
```jsx
function MyComponent() {
  React.useEffect(() => {
    // Errors here are NOT caught by Error Boundaries
    riskyOperation().catch(error => {
      // Must handle explicitly
      // Option 1: Use useState to show error
      setError(error);
      // Option 2: Use useErrorBoundary hook
      showBoundary(error);
    });
  }, []);

  // Error in effect cleanup is also NOT caught
  React.useEffect(() => {
    return () => {
      // Errors in cleanup NOT caught
      riskyCleanup();
    };
  }, []);
}
```

### With setState
```jsx
class MyComponent extends React.Component {
  handleClick = () => {
    this.setState(() => {
      // Errors thrown here ARE caught ✓
      if (badCondition) throw new Error('setState callback error');
      return { updated: true };
    });

    // But errors in setState callback are NOT caught
    this.setState({ count: 1 }, () => {
      throw new Error('setState callback error'); // NOT caught
    });
  };
}
```

### With React.lazy
```jsx
const LazyComponent = React.lazy(() => {
  // If this promise rejects, Error Boundary catches it
  return import('./Component').catch(error => {
    // Component failed to load
    throw error; // Caught by Error Boundary
  });
});

<ErrorBoundary fallback={<ErrorUI />}>
  <Suspense fallback={<Loading />}>
    <LazyComponent />
  </Suspense>
</ErrorBoundary>
```

## Error Recovery Lifecycle

### Reset Keys Pattern
```jsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div>
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />

      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        resetKeys={[searchQuery]} {/* Auto-reset when query changes */}
      >
        <SearchResults query={searchQuery} />
      </ErrorBoundary>
    </div>
  );
}

// Flow:
// 1. User enters search query: setSearchQuery() → triggers re-render
// 2. React detects resetKeys change
// 3. If ErrorBoundary in error state, automatically resets
// 4. SearchResults re-mounts with new query
```

## Nested Error Boundaries Behavior

### Single Error Propagates to Nearest Ancestor
```jsx
function App() {
  return (
    <ErrorBoundary name="Root">
      <ErrorBoundary name="Middle">
        <ErrorBoundary name="Inner">
          <BrokenComponent /> {/* Throws error */}
        </ErrorBoundary>
      </ErrorBoundary>
    </ErrorBoundary>
  );
}

// Which boundary catches the error?
// Answer: Inner (closest to error)
// If Inner didn't exist: Middle
// If neither existed: Root
```

### Multiple Independent Errors
```jsx
<ErrorBoundary name="Root">
  <ErrorBoundary name="SidebarBoundary">
    <Sidebar /> {/* Error here: Caught by SidebarBoundary */}
  </ErrorBoundary>

  <ErrorBoundary name="MainBoundary">
    <MainContent /> {/* Error here: Caught by MainBoundary */}
  </ErrorBoundary>
</ErrorBoundary>

// Result: Each error caught by its own boundary
// Both sections can show their own error UI independently
```

## React 19+ Improvements

### Root-Level Error Callbacks
```jsx
const root = ReactDOM.createRoot(document.getElementById('root'), {
  onCaughtError: (error, errorInfo) => {
    // Called when Error Boundary catches an error
    console.log('Caught by boundary:', error);
    logToService('CAUGHT', error);
  },

  onUncaughtError: (error, errorInfo) => {
    // Called when error is NOT caught by any Error Boundary
    console.log('Uncaught error:', error);
    logToService('UNCAUGHT', error);
  },

  onRecoverableError: (error, errorInfo) => {
    // Called when error is thrown but automatically recovered
    console.log('Recovered from:', error);
  },
});

root.render(<App />);
```

### No More Duplicate Errors
```jsx
// React 18 and earlier: Threw same error 3 times
// 1. Original error
// 2. Retry error
// 3. console.error
// Total console spam: 3 identical errors

// React 19+: Clean error handling
// Boundary catches: 1 call to onCaughtError
// Console shows: 1 error
// Much cleaner debugging!
```

## Lifecycle Method Error Handling Matrix

| Method | Phase | Error Caught | Usage |
|--------|-------|-------------|-------|
| **constructor** | Render | ✓ Yes | Class component init |
| **getDerivedStateFromProps** | Render | ✓ Yes | Static state updates |
| **getDerivedStateFromError** | Render | ✓ Yes | Error state update |
| **render** | Render | ✓ Yes | Component rendering |
| **componentDidMount** | Commit | ✓ Yes (sync) | After mount |
| **componentDidUpdate** | Commit | ✓ Yes (sync) | After update |
| **componentWillUnmount** | Commit | ✗ No | Cleanup |
| **componentDidCatch** | Commit | ✗ No (own errors) | Error logging |
| **Event handlers** | - | ✗ No | User interactions |
| **setTimeout/Promise** | - | ✗ No | Async operations |

## Best Practices for Lifecycle Error Handling

1. **Use getDerivedStateFromError for UI updates** - Keep it pure
2. **Use componentDidCatch for side effects** - Log errors, call services
3. **Handle event handler errors with try/catch** - Not caught by boundaries
4. **Wrap async errors with try/catch** - Then pass to boundary or state
5. **Nest boundaries strategically** - Only one error catches per tree walk
6. **Reset state on recovery** - Clear error state when attempting retry
7. **Log comprehensive context** - Include componentStack for debugging
8. **Monitor error rates** - Track caught vs uncaught errors
