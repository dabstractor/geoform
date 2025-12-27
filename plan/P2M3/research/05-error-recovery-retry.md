# React Error Boundaries - Error Recovery & Retry Functionality

## Recovery Fundamentals

### Why Recovery Matters
- **30% uptime improvement**: Applications with recovery see 30% increase in uptime
- **60% crash reduction**: Well-defined recovery strategies reduce crashes by 60%
- **40% better retention**: Clear recovery options retain 40% more users

### Types of Recovery
1. **Immediate Retry**: Try the operation again immediately
2. **Delayed Retry**: Wait and retry with exponential backoff
3. **State Restoration**: Restore from last known good state
4. **User Action Required**: Ask user to confirm recovery
5. **Graceful Degradation**: Show partial functionality

## Pattern 1: Simple Retry with Error Boundary

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>Error: {this.state.error?.message}</p>
          <button onClick={this.handleRetry}>
            Try Again (Attempt {this.state.retryCount + 1})
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Pattern 2: Exponential Backoff Retry

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      retryDelay: 1000,
      isRetrying: false,
    };
    this.retryTimeoutId = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Attempt automatic retry after delay
    this.scheduleRetry();
  }

  scheduleRetry = () => {
    const { retryCount, retryDelay } = this.state;
    const maxRetries = 3;

    if (retryCount < maxRetries) {
      this.setState({ isRetrying: true });

      // Exponential backoff: 1s, 2s, 4s
      const nextDelay = retryDelay * Math.pow(2, retryCount);

      this.retryTimeoutId = setTimeout(() => {
        this.handleRetry();
      }, nextDelay);
    }
  };

  handleRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.setState(prevState => ({
      hasError: false,
      isRetrying: false,
      retryCount: prevState.retryCount + 1,
      retryDelay: prevState.retryDelay * 2,
    }));
  };

  handleManualRetry = () => {
    this.setState({
      hasError: false,
      isRetrying: false,
      retryCount: 0,
      retryDelay: 1000,
    });
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const { hasError, error, isRetrying, retryCount } = this.state;

    if (hasError) {
      return (
        <div className="error-fallback">
          <h2>Error Encountered</h2>
          <p>{error?.message}</p>

          {isRetrying ? (
            <div className="retrying">
              <p>Retrying... (Attempt {retryCount + 1})</p>
              <div className="spinner" />
            </div>
          ) : (
            <button onClick={this.handleManualRetry}>
              Try Again
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Pattern 3: react-error-boundary with Reset

```jsx
import { ErrorBoundary, useErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Simulate recovery action (e.g., fetch data)
      await new Promise(resolve => setTimeout(resolve, 1000));
      resetErrorBoundary();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div role="alert" className="error-fallback">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className="btn-primary"
      >
        {isRetrying ? 'Retrying...' : 'Try Again'}
      </button>
      <button onClick={() => window.location.href = '/'}>
        Go Home
      </button>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Clear any state that might have caused the error
        window.location.href = window.location.href;
      }}
    >
      <MyApp />
    </ErrorBoundary>
  );
}
```

## Pattern 4: useErrorBoundary Hook for Async Errors

```jsx
import { useErrorBoundary } from 'react-error-boundary';

const DataFetcher = () => {
  const [data, setData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { showBoundary } = useErrorBoundary();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const json = await response.json();
      setData(json);
    } catch (error) {
      // Pass error to nearest Error Boundary
      showBoundary(error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (!data) return null;

  return <div>{JSON.stringify(data)}</div>;
};

// Usage with Error Boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <DataFetcher />
</ErrorBoundary>
```

## Pattern 5: Context-Based Recovery

```jsx
import { createContext, useContext, useState } from 'react';

const RecoveryContext = createContext();

const RecoveryProvider = ({ children }) => {
  const [lastValidState, setLastValidState] = useState(null);
  const [recoveryData, setRecoveryData] = useState(null);

  const saveState = (state) => {
    setLastValidState(state);
    localStorage.setItem('lastValidState', JSON.stringify(state));
  };

  const getLastValidState = () => {
    if (lastValidState) return lastValidState;

    const stored = localStorage.getItem('lastValidState');
    return stored ? JSON.parse(stored) : null;
  };

  const clearRecoveryData = () => {
    setLastValidState(null);
    localStorage.removeItem('lastValidState');
  };

  return (
    <RecoveryContext.Provider
      value={{
        lastValidState,
        saveState,
        getLastValidState,
        clearRecoveryData,
      }}
    >
      {children}
    </RecoveryContext.Provider>
  );
};

const useRecovery = () => {
  const context = useContext(RecoveryContext);
  if (!context) {
    throw new Error('useRecovery must be used within RecoveryProvider');
  }
  return context;
};

// Error Boundary with Recovery
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  handleRecover = () => {
    const { getLastValidState, clearRecoveryData } = this.props.recovery;
    const validState = getLastValidState();

    if (validState) {
      // Restore from recovery data
      this.props.onRestore(validState);
      this.setState({ hasError: false });
    }

    clearRecoveryData();
  };

  render() {
    if (this.state.hasError) {
      const hasValidState = this.props.recovery.getLastValidState() !== null;

      return (
        <div className="error-fallback">
          <h2>An error occurred</h2>

          {hasValidState ? (
            <>
              <p>We found a recent valid state. Would you like to restore it?</p>
              <button onClick={this.handleRecover} className="btn-primary">
                Restore
              </button>
            </>
          ) : (
            <p>Please refresh the page.</p>
          )}

          <button
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Pattern 6: Retry with Reset Keys

```jsx
import { ErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div role="alert">
    <p>Something went wrong:</p>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

function MyComponent() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [data, setData] = React.useState(null);

  return (
    <div>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
      />

      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => setData(null)}
        // Reset boundary when search query changes
        resetKeys={[searchQuery]}
      >
        <SearchResults query={searchQuery} data={data} />
      </ErrorBoundary>
    </div>
  );
}
```

## Pattern 7: Conditional Retry with Max Attempts

```jsx
class ResilientComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      maxRetries: 3,
      nextRetryTime: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Don't retry critical errors
    if (this.isCriticalError(error)) {
      return;
    }

    // Schedule retry
    this.scheduleRetry();
  }

  isCriticalError = (error) => {
    const criticalMessages = [
      'Authentication failed',
      'Unauthorized',
      'Forbidden',
    ];
    return criticalMessages.some(msg => error.message.includes(msg));
  };

  scheduleRetry = () => {
    const { retryCount, maxRetries } = this.state;

    if (retryCount < maxRetries) {
      const delay = 1000 * Math.pow(2, retryCount);
      const nextRetryTime = Date.now() + delay;

      this.setState({ nextRetryTime });

      setTimeout(() => {
        this.handleRetry();
      }, delay);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleGiveUp = () => {
    // Navigate away or show permanent error state
    window.location.href = '/error';
  };

  render() {
    const { hasError, error, retryCount, maxRetries, nextRetryTime } = this.state;

    if (hasError) {
      const canRetry = retryCount < maxRetries;
      const isCritical = this.isCriticalError(error);
      const secondsUntilRetry = nextRetryTime
        ? Math.ceil((nextRetryTime - Date.now()) / 1000)
        : 0;

      return (
        <div className="error-boundary" role="alert">
          <h2>Error: {error?.message}</h2>

          {isCritical && (
            <p className="critical-message">
              This is a critical error. Please refresh the page.
            </p>
          )}

          {!isCritical && (
            <>
              <p>
                Retrying... Attempt {retryCount + 1} of {maxRetries}
                {secondsUntilRetry > 0 && ` (${secondsUntilRetry}s)`}
              </p>

              {canRetry ? (
                <button onClick={this.handleRetry} disabled>
                  Retrying...
                </button>
              ) : (
                <>
                  <p className="warning">
                    Maximum retry attempts reached.
                  </p>
                  <button onClick={this.handleGiveUp}>
                    Go to Error Page
                  </button>
                </>
              )}
            </>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Pattern 8: Network-Aware Recovery

```jsx
class NetworkAwareErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isOnline: navigator.onLine,
    };
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleOnline = () => {
    this.setState({ isOnline: true });
    // Automatically retry if error was network-related
    if (this.state.hasError) {
      this.handleRetry();
    }
  };

  handleOffline = () => {
    this.setState({ isOnline: false });
  };

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    const { hasError, isOnline, error } = this.state;

    if (hasError) {
      if (!isOnline) {
        return (
          <div className="error-fallback offline">
            <h2>You are offline</h2>
            <p>Your connection was lost. Waiting to reconnect...</p>
            <p className="error-detail">{error?.message}</p>
          </div>
        );
      }

      return (
        <div className="error-fallback online">
          <h2>Error occurred</h2>
          <p>{error?.message}</p>
          <button onClick={this.handleRetry}>Try Again</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Pattern 9: Stateful Recovery with Hooks

```jsx
import { useState, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

const useRetry = (maxRetries = 3) => {
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);

  const retry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(c => c + 1);
      return true;
    }
    return false;
  }, [retryCount, maxRetries]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setLastError(null);
  }, []);

  const getBackoffDelay = useCallback(() => {
    // Exponential backoff: 1s, 2s, 4s, 8s
    return 1000 * Math.pow(2, retryCount);
  }, [retryCount]);

  return {
    retryCount,
    canRetry: retryCount < maxRetries,
    lastError,
    retry,
    reset,
    getBackoffDelay,
  };
};

const RetryableComponent = ({ onLoad }) => {
  const { retryCount, canRetry, retry, reset } = useRetry(3);

  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div>
          <p>Error: {error.message}</p>
          <p>Attempt: {retryCount + 1}/3</p>
          {canRetry ? (
            <button onClick={resetErrorBoundary}>Try Again</button>
          ) : (
            <p>Max retries reached</p>
          )}
        </div>
      )}
    >
      <AsyncComponent onLoad={onLoad} />
    </ErrorBoundary>
  );
};
```

## Recovery Strategy Selection

| Scenario | Strategy | When to Use |
|----------|----------|------------|
| **Network timeout** | Exponential backoff | Temporary network issues |
| **Rate limited** | Delayed retry | API rate limiting |
| **Invalid state** | Restore from backup | Data corruption detected |
| **Feature unavailable** | Graceful degradation | Third-party service down |
| **User action error** | User retry | Requires user intervention |
| **Critical error** | Give up | Authentication, permission issues |
| **Async operation** | Use useErrorBoundary | Promise rejection in event handler |

## Best Practices

1. **Always have a maximum retry limit** - Prevent infinite loops
2. **Use exponential backoff** - Don't hammer servers on retries
3. **Log retry attempts** - Track what's failing in production
4. **Inform the user** - Show retry progress and messages
5. **Differentiate error types** - Handle different errors differently
6. **Test recovery paths** - Ensure retry logic actually works
7. **Monitor recovery success rate** - Track if recovery is effective
8. **Provide manual override** - Let users force retry or give up
