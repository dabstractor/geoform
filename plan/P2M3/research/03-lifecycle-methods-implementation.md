# React Error Boundaries - Lifecycle Methods Implementation

## Method Execution Timeline

### Phase 1: Render Phase
When a child component throws an error:
1. React calls `static getDerivedStateFromError(error)`
2. This happens during rendering (synchronous)
3. Pure function - NO side effects allowed
4. Return new state to trigger fallback UI

### Phase 2: Commit Phase
After rendering with new state:
1. React calls `componentDidCatch(error, errorInfo)`
2. This happens after re-rendering (asynchronous context)
3. Side effects ARE allowed
4. Use for logging and error reporting

## Method 1: `static getDerivedStateFromError(error)`

### Purpose
Update component state to display fallback UI after an error

### Characteristics
- **Timing**: Render phase (synchronous)
- **Side effects**: NOT allowed (must be pure)
- **Usage**: Update state, return new state object
- **Return**: State object or `null`

### Signature
```typescript
static getDerivedStateFromError(error: Error): State | null
```

### Parameters
- `error`: The Error instance thrown by a child component
  - Usually an Error object, but JavaScript allows throwing any value
  - Always handle non-Error values gracefully

### Basic Implementation
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error,
    };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### Advanced Implementation with Error Details
```typescript
interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
  lastErrorTime: Date | null;
}

class ErrorBoundary extends React.Component<Props, ErrorState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
      lastErrorTime: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorState> {
    return (prevState: ErrorState) => ({
      hasError: true,
      error: error,
      errorCount: prevState.errorCount + 1,
      lastErrorTime: new Date(),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorCount={this.state.errorCount}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };
}
```

### Key Rules
1. Must be a static method
2. Must be pure (no side effects)
3. Must return state or null
4. Cannot use `this` context
5. Called during render phase

## Method 2: `componentDidCatch(error, errorInfo)`

### Purpose
Log errors and perform side effects (reporting, analytics)

### Characteristics
- **Timing**: Commit phase (after rendering)
- **Side effects**: Allowed and encouraged
- **Usage**: Logging, error reporting, cleanup
- **Return**: undefined

### Signature
```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo): void
```

### Parameters

#### `error`
```typescript
error: Error
```
- The error thrown by a child component
- Standard JavaScript Error object (usually)
- Access error.message and error.stack

#### `errorInfo`
```typescript
interface ErrorInfo {
  componentStack: string;
}
```

The `componentStack` contains:
- Component tree information
- Which component threw the error
- Source locations (in development)
- Line and column numbers

Example componentStack output:
```
in FailingComponent (at App.tsx:50)
in MyComponent (at MyComponent.tsx:20)
in ErrorBoundary (at ErrorBoundary.tsx:10)
```

### Basic Implementation
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console
    console.error('Error caught:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }
}
```

### Error Reporting Service Integration
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      level: 'error',
    });

    // Also log locally for analytics
    this.logToAnalytics({
      type: 'error_boundary_caught',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.getUserId(),
    });
  }

  private logToAnalytics(data: any) {
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(err => {
      // Don't let logging errors break the app
      console.error('Failed to log error:', err);
    });
  }

  private getUserId(): string {
    // Get from your auth context/store
    return 'user-id';
  }
}
```

### React 19+ Enhanced Logging
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // React 19 also includes errorInfo.errorBoundary
    const errorBoundaryComponent = (errorInfo as any).errorBoundary;

    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
          errorBoundary: errorBoundaryComponent?.displayName || 'Unknown',
        },
      },
    });
  }
}
```

### Advanced: Error Severity Based on Source
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Determine severity based on component stack
    let severity = 'error';

    if (errorInfo.componentStack.includes('CriticalComponent')) {
      severity = 'critical';
    } else if (errorInfo.componentStack.includes('Sidebar')) {
      severity = 'warning';
    }

    this.reportError({
      error: error.message,
      stack: errorInfo.componentStack,
      severity,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      memory: (performance as any).memory?.usedJSHeapSize,
    });
  }

  private reportError(data: any) {
    // Send to backend with appropriate severity
    console.log(`[${data.severity.toUpperCase()}]`, data.error);
  }
}
```

## Complete Class Component Example

```typescript
interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to monitoring service
    this.logError(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    // Implementation depends on your monitoring service
    console.error('Error Boundary caught:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      count: this.state.errorCount,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={styles.container}>
          <h2>Something went wrong</h2>
          {process.env.NODE_ENV === 'development' && (
            <>
              <details style={styles.details}>
                <summary>Error details</summary>
                <pre style={styles.pre}>
                  {this.state.error?.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            </>
          )}
          <button onClick={this.handleReset}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
    border: '1px solid #f5c6cb',
  },
  details: {
    marginTop: '10px',
    cursor: 'pointer',
  },
  pre: {
    backgroundColor: '#fff',
    padding: '10px',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '12px',
  },
};

export default ErrorBoundary;
```

## Execution Order Visualization

```
Error thrown in child component
          ↓
React catches the error
          ↓
React calls getDerivedStateFromError() ← RENDER PHASE
├── Returns new state
└── Triggers re-render with new state
          ↓
Component re-renders with fallback UI
          ↓
React commits changes to DOM
          ↓
React calls componentDidCatch() ← COMMIT PHASE
├── Can access error details
├── Can perform side effects
└── Can send error to logging service
          ↓
ErrorBoundary displays fallback UI
```

## Key Differences Summary

| Aspect | getDerivedStateFromError | componentDidCatch |
|--------|--------------------------|------------------|
| **Phase** | Render | Commit |
| **Side Effects** | Not allowed | Allowed |
| **Timing** | Synchronous | Asynchronous |
| **Return** | State object or null | Nothing (void) |
| **Usage** | Update UI | Logging, reporting |
| **this context** | Not available (static) | Available |
| **Called** | For every error | For every error |
| **Access to error** | Yes (parameter) | Yes (parameter) |

## When to Use Each

### Use getDerivedStateFromError when:
- You need to update the UI
- You need to display a fallback component
- You need to track error state
- No side effects are needed

### Use componentDidCatch when:
- You need to log errors
- You need to send errors to a service
- You need to perform cleanup
- You need to trigger analytics
- You need to access `this` context
