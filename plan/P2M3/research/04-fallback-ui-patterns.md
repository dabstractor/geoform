# React Error Boundaries - Fallback UI Patterns

## Fundamental Principles

### What Makes a Good Fallback UI
1. **Clear Communication**: Explains what went wrong
2. **Context-Specific**: Related to the failed feature
3. **Actionable**: Provides next steps for the user
4. **Non-Intrusive**: Doesn't dominate the entire page
5. **Accessible**: Works with screen readers and keyboard navigation
6. **Consistent**: Matches app's design language
7. **Helpful**: Offers recovery options

## Pattern 1: Simple Fallback Component

### Basic Implementation
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>Please try again later.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### With Retry Button
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Oops! Something went wrong</h2>
          <p>We encountered an unexpected error.</p>
          <button onClick={this.handleReset} className="btn-primary">
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Pattern 2: Separate Fallback Component

### Recommended Approach
```jsx
// ErrorFallback.jsx
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="error-container" role="alert">
      <div className="error-icon">⚠️</div>
      <h2>Something went wrong</h2>
      <p className="error-message">{error?.message}</p>

      <div className="error-actions">
        <button
          onClick={resetErrorBoundary}
          className="btn btn-primary"
        >
          Try Again
        </button>
        <a href="/" className="btn btn-secondary">
          Go Home
        </a>
      </div>
    </div>
  );
};

// App.jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## Pattern 3: Context-Specific Fallback

### Different Fallbacks for Different Features

```jsx
const getErrorFallback = (context) => {
  switch (context) {
    case 'dashboard':
      return (
        <div className="error-fallback dashboard-error">
          <h3>Dashboard Loading Failed</h3>
          <p>Unable to load your dashboard. Your data is safe.</p>
        </div>
      );
    case 'search':
      return (
        <div className="error-fallback search-error">
          <h3>Search Unavailable</h3>
          <p>We're having trouble searching right now.</p>
        </div>
      );
    case 'payment':
      return (
        <div className="error-fallback payment-error">
          <h3>Payment Processing Error</h3>
          <p>Your payment was not processed. Your card has not been charged.</p>
        </div>
      );
    default:
      return <div className="error-fallback">Something went wrong.</div>;
  }
};

class FeatureErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return getErrorFallback(this.props.context);
    }

    return this.props.children;
  }
}
```

## Pattern 4: react-error-boundary Integration

### With FallbackComponent Prop
```jsx
import { ErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div role="alert" className="error-boundary-fallback">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.href = '/'}
    >
      <MyApp />
    </ErrorBoundary>
  );
}
```

### With fallbackRender Prop
```jsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert">
          <p>Something went wrong:</p>
          <pre>{error.message}</pre>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      <MyApp />
    </ErrorBoundary>
  );
}
```

### With fallback Prop (Static)
```jsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<div>An error occurred</div>}>
      <MyApp />
    </ErrorBoundary>
  );
}
```

## Pattern 5: Expandable Error Details (Development)

```jsx
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="error-container">
      <h2>An Error Occurred</h2>
      <p className="error-summary">
        {error?.message || 'Something went wrong'}
      </p>

      {isDev && (
        <details className="error-details">
          <summary>Error Details (Development Only)</summary>
          <pre className="error-stack">
            {error?.stack}
          </pre>
        </details>
      )}

      <div className="error-actions">
        <button
          onClick={resetErrorBoundary}
          className="btn btn-primary"
        >
          Try Again
        </button>
        {isDev && (
          <button
            onClick={() => console.error('Full error:', error)}
            className="btn btn-secondary"
          >
            Log to Console
          </button>
        )}
      </div>
    </div>
  );
};
```

## Pattern 6: Error Fallback with Recovery Data

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      recoveryData: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Store some recovery data
    const recoveryData = {
      lastValidState: this.getLastValidState(),
      userAction: this.getLastUserAction(),
      timestamp: new Date().toISOString(),
    };

    this.setState({ recoveryData });

    // Log error
    this.logError(error, errorInfo, recoveryData);
  }

  handleRecover = () => {
    const { recoveryData } = this.state;

    // Restore from recovery data if available
    if (recoveryData?.lastValidState) {
      this.restoreState(recoveryData.lastValidState);
    }

    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Application Error</h2>
          <p>We've encountered an error, but we can try to recover.</p>
          <button onClick={this.handleRecover} className="btn-primary">
            Recover
          </button>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }

  // Helper methods
  private getLastValidState() {
    // Retrieve from localStorage or Redux store
    return null;
  }

  private getLastUserAction() {
    // Track what user was doing
    return null;
  }

  private restoreState(state: any) {
    // Restore application state
  }

  private logError(error: Error, info: any, recovery: any) {
    console.error('Error with recovery data:', {
      error: error.message,
      componentStack: info.componentStack,
      recovery,
    });
  }
}
```

## Pattern 7: Animated Error Boundary

```jsx
import { useState, useEffect } from 'react';

const AnimatedErrorFallback = ({ error, resetErrorBoundary }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setShow(true);
  }, []);

  return (
    <div className={`error-fallback ${show ? 'show' : ''}`}>
      <style>{`
        .error-fallback {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s ease-in-out;
        }
        .error-fallback.show {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <div className="error-icon">
        <span role="img" aria-label="error">⚠️</span>
      </div>

      <h2>Something went wrong</h2>
      <p>{error?.message}</p>

      <button onClick={resetErrorBoundary} className="btn-primary">
        Try Again
      </button>
    </div>
  );
};
```

## Pattern 8: Error Boundary with Retry Count

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      maxRetries: 3,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    const { retryCount, maxRetries } = this.state;

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      // Show different message after max retries
      console.error('Max retries exceeded');
    }
  };

  render() {
    const { hasError, error, retryCount, maxRetries } = this.state;

    if (hasError) {
      const canRetry = retryCount < maxRetries;

      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p className="error-message">{error?.message}</p>

          <div className="retry-info">
            <p>Attempt {retryCount + 1} of {maxRetries}</p>
          </div>

          {canRetry ? (
            <button onClick={this.handleRetry} className="btn-primary">
              Try Again ({maxRetries - retryCount} left)
            </button>
          ) : (
            <>
              <p className="warning">
                We've tried multiple times but the error persists.
              </p>
              <a href="/support" className="btn btn-secondary">
                Contact Support
              </a>
            </>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Pattern 9: Fallback with Support Link

```jsx
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const errorId = Math.random().toString(36).substr(2, 9);

  return (
    <div className="error-container" role="alert">
      <h2>Oops! Something went wrong</h2>

      <p className="error-code">
        Error ID: <code>{errorId}</code>
      </p>

      <details className="error-details-section">
        <summary>What happened?</summary>
        <p>{error?.message}</p>
      </details>

      <div className="error-actions">
        <button onClick={resetErrorBoundary} className="btn btn-primary">
          Try Again
        </button>

        <a
          href={`/support?errorId=${errorId}`}
          className="btn btn-secondary"
        >
          Report Issue
        </a>

        <a href="/" className="btn btn-tertiary">
          Go Home
        </a>
      </div>

      <p className="error-footer small">
        If you continue to experience issues, please{' '}
        <a href="/help">contact our support team</a> with error ID above.
      </p>
    </div>
  );
};
```

## Pattern 10: Progressive Fallback Hierarchy

```jsx
class ErrorBoundary extends React.Component {
  render() {
    if (this.state.hasError) {
      const { errorCount } = this.state;

      // Progressive fallback based on error count
      if (errorCount === 1) {
        return <SimpleErrorMessage />;
      } else if (errorCount === 2) {
        return <DetailedErrorMessage error={this.state.error} />;
      } else {
        return <CriticalErrorMessage />;
      }
    }

    return this.props.children;
  }
}

const SimpleErrorMessage = () => (
  <div className="error-fallback simple">
    <p>Something went wrong. Please refresh the page.</p>
  </div>
);

const DetailedErrorMessage = ({ error }) => (
  <div className="error-fallback detailed">
    <h3>Error Details</h3>
    <p>{error?.message}</p>
    <button onClick={() => window.location.reload()}>Refresh</button>
  </div>
);

const CriticalErrorMessage = () => (
  <div className="error-fallback critical">
    <h2>Critical Error</h2>
    <p>Please contact support or try again later.</p>
    <a href="/support">Contact Support</a>
  </div>
);
```

## CSS Styling Examples

```css
/* Error Container */
.error-fallback {
  padding: 24px;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  margin: 20px;
}

.error-fallback.critical {
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

/* Error Icon */
.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
  text-align: center;
}

/* Error Message */
.error-message {
  color: #856404;
  font-size: 14px;
  margin: 12px 0;
}

/* Error Details */
.error-details {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 4px;
  margin: 12px 0;
}

.error-stack {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
}

/* Buttons */
.error-fallback .btn {
  margin-right: 8px;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-size: 14px;
}

.error-fallback .btn-primary {
  background-color: #007bff;
  color: white;
}

.error-fallback .btn-secondary {
  background-color: #6c757d;
  color: white;
}

/* Accessibility */
.error-fallback[role="alert"] {
  outline: 2px solid #f5c6cb;
  outline-offset: 2px;
}
```

## Summary

Choose patterns based on:
- **Simple cases**: Pattern 1-2 (basic fallback)
- **Multiple features**: Pattern 3 (context-specific)
- **Modern React**: Pattern 4 (react-error-boundary)
- **Development debugging**: Pattern 5 (expandable details)
- **Data preservation**: Pattern 6 (recovery data)
- **Better UX**: Pattern 7 (animations)
- **Resilience**: Pattern 8 (retry logic)
- **User support**: Pattern 9 (support links)
- **Graceful degradation**: Pattern 10 (progressive fallback)
