# React Error Boundaries - Best Practices 2024/2025

## Strategic Placement

### DON'T: Single Global Error Boundary
Wrapping your entire application in a single error boundary might seem ideal but leads to poor UX:
- One error hides the entire application
- Users lose all functionality
- No granularity in error handling

### DO: Strategic Placement Strategy
Place error boundaries at logical boundaries:
- **Top-level routes**: Wrap route components for page-level errors
- **Feature areas**: Sidebar, main content, panels (Facebook Messenger pattern)
- **Third-party integrations**: Isolate external components
- **Dynamic content areas**: Data fetching sections
- **Independent features**: Components that can fail independently

Example structure:
```
<App>
  <ErrorBoundary> {/* App-level fallback */}
    <Header />
    <ErrorBoundary> {/* Sidebar isolation */}
      <Sidebar />
    </ErrorBoundary>
    <ErrorBoundary> {/* Main content isolation */}
      <MainContent>
        <ErrorBoundary> {/* Feature-level isolation */}
          <DataFetchingComponent />
        </ErrorBoundary>
      </MainContent>
    </ErrorBoundary>
  </ErrorBoundary>
</App>
```

## Finding the Right Balance

### Considerations for Granularity

**Too Many Error Boundaries**:
- Adds unnecessary complexity
- Scattered error messages across UI
- Harder to maintain
- Visual clutter

**Too Few Error Boundaries**:
- Large sections fail at once
- Poor isolation
- Bad user experience

**Right Balance**:
- Group related components together
- One boundary per logical feature or route
- Consider user impact if section fails
- Test error scenarios

## User-Friendly Fallback UIs

### Bad Pattern
```jsx
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// Shows: "Something went wrong"
```

### Good Pattern
```jsx
<ErrorBoundary fallback={<div className="error-container">
  <h2>Unable to Load Dashboard</h2>
  <p>We're having trouble loading your dashboard. Please try again.</p>
  <button onClick={() => window.location.reload()}>
    Reload Page
  </button>
  <a href="/help">Contact Support</a>
</div>}>
  <Dashboard />
</ErrorBoundary>
```

### Key Principles
- **Clear messaging**: Explain what went wrong, not just "Error"
- **Context-specific**: Tell users what specific feature failed
- **Actionable**: Provide clear next steps (retry, reload, contact)
- **Visual hierarchy**: Use styling appropriate to your app
- **Accessibility**: Ensure error messages are announced to screen readers
- **User retention**: Applications with clear recovery options retain 40% more users

## Error Logging & Monitoring

### Implement Proper Logging

Use `componentDidCatch` to log errors to monitoring services:

```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  // Log to Sentry
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  });

  // Log to Datadog
  DD_RUM.addError(new Error(error.message), {
    stack: errorInfo.componentStack,
  });

  // Custom logging
  logErrorToBackend({
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId(),
    route: window.location.pathname,
  });
}
```

### What to Log
- Error message and stack
- Component stack (from errorInfo)
- User context (userId, sessionId)
- Route/page information
- Timestamp
- Severity level
- Browser/device info

## Modern Library-Based Approach

### Recommendation: react-error-boundary

The `react-error-boundary` library is recommended because:

**Advantages**:
- Works with functional components via hooks
- Modern API aligned with React trends
- Built-in retry/reset functionality
- Easier to test
- Better TypeScript support
- Smaller learning curve than class components

**Key Features**:
- ErrorBoundary component
- useErrorBoundary hook
- withErrorBoundary HOC
- FallbackComponent, fallbackRender, or fallback prop
- Built-in error recovery

**Installation**:
```bash
npm install react-error-boundary
```

**Basic Usage**:
```jsx
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

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <MyComponent />
</ErrorBoundary>
```

## Testing Error Boundaries

### Testing Strategies

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
const BrokenComponent = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('displays fallback UI when error occurs', () => {
    render(
      <ErrorBoundary fallback={<div>Error!</div>}>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('logs error to service', () => {
    const logSpy = jest.fn();

    render(
      <ErrorBoundary onError={logSpy} fallback={<div>Error</div>}>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(logSpy).toHaveBeenCalled();
  });
});
```

### Testing Best Practices
- Test that fallback UI renders
- Test error logging is triggered
- Test reset functionality works
- Mock child components that throw
- Suppress console.error output during tests
- Test error propagation up the tree

## Performance Considerations

### Impact of Error Boundaries

- **Minimal runtime overhead**: Only active when catching errors
- **Zero impact on happy path**: No performance penalty when no errors occur
- **Memory**: Storing error state has negligible impact
- **Re-renders**: When error caught, tree re-renders once to show fallback

### Optimization Tips
- Don't place boundaries around performance-critical components unnecessarily
- Consider lazy error boundary boundaries for better code splitting
- Use error boundaries with React.memo or useMemo in child components
- Avoid nested error boundaries on every component (too granular)

## 2024-2025 Trends

### Statistics
- **30% uptime improvement**: Applications implementing error boundaries show 30% increase in uptime during peak usage (2024 Developer Trends Report)
- **60% crash reduction**: Well-defined recovery strategies reduce crash frequency by up to 60%
- **40% user retention**: Clear error recovery options retain 40% more users compared to generic errors

### Modern Patterns
- Shifted toward functional components with `react-error-boundary`
- Integration with monitoring services (Sentry, Datadog, LogRocket)
- Error recovery as a primary UX concern
- Combining with Suspense for better async handling
- React 19+ improved error callbacks for root-level handling

## Async Error Handling

### Event Handlers
Event handlers don't need error boundaries. React already knows what to display:

```jsx
<button onClick={() => {
  try {
    // Handle error in event handler
  } catch (error) {
    this.setState({ error });
  }
}}>
  Click me
</button>
```

### Async Operations
Use try/catch in async code AND error boundaries together:

```jsx
async handleFetch() {
  try {
    const data = await fetch('/api/data');
    this.setState({ data });
  } catch (error) {
    // Either:
    // 1. Use error boundary if in render path
    // 2. Use useErrorBoundary hook to show boundary
    // 3. Set error state locally
    this.setState({ error });
  }
}
```

## Summary Checklist

- [ ] Place error boundaries strategically, not everywhere
- [ ] Create context-specific fallback UIs
- [ ] Implement proper error logging to external services
- [ ] Use react-error-boundary for modern React apps
- [ ] Add retry/reset functionality for user recovery
- [ ] Test error scenarios thoroughly
- [ ] Consider accessibility in error messages
- [ ] Combine with Suspense for async operations
- [ ] Monitor error rates in production
- [ ] Provide user-friendly error messages
