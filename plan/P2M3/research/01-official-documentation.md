# React Error Boundaries - Official Documentation

## Official React Documentation Sources

### Current React Documentation
- **React.dev Component Reference**: https://react.dev/reference/react/Component
  - Contains official `getDerivedStateFromError` and `componentDidCatch` documentation
  - Includes error boundary best practices and limitations

### Legacy React Documentation
- **React Legacy Docs (Error Boundaries)**: https://legacy.reactjs.org/docs/error-boundaries.html
  - Comprehensive guide on error boundary concepts and usage
  - Explains what error boundaries catch and don't catch

## Official Methods for Error Boundaries

### 1. `static getDerivedStateFromError(error)`

**Purpose**: Update state to display fallback UI after an error

**Characteristics**:
- Executed during the render phase
- Must be a pure function (no side effects allowed)
- Should return an object to update component state
- Returns `null` if no state update is needed

**Signature**:
```typescript
static getDerivedStateFromError(error: Error): State | null
```

**Parameters**:
- `error`: The Error instance thrown by a child component

**Returns**: State object to update, or `null`

### 2. `componentDidCatch(error, info)`

**Purpose**: Log error information or perform side effects after an error is caught

**Characteristics**:
- Executed during the commit phase (after rendering)
- Side effects are permitted
- Called after `getDerivedStateFromError`
- Receives detailed error information

**Signature**:
```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo): void
```

**Parameters**:
- `error`: The Error instance thrown
- `info`: Object containing:
  - `componentStack`: String with component tree information showing where error occurred
  - Stack trace with component names and source locations

## Error Boundary Creation Pattern

An Error Boundary is a class component that implements at least one of:
1. `static getDerivedStateFromError()` - for UI updates
2. `componentDidCatch()` - for side effects/logging

```javascript
import * as React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log the error to an error reporting service
    logErrorToMyService(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<p>Something went wrong</p>}>
  <Profile />
</ErrorBoundary>
```

## What Error Boundaries Catch

Error boundaries catch errors that occur during:
- Rendering
- Lifecycle methods (componentDidMount, componentDidUpdate, etc.)
- Constructors of the whole tree below them
- Effects (with caveats - see limitations)

## What Error Boundaries DON'T Catch

Error boundaries **DO NOT** catch errors for:
- **Event handlers**: Must use try/catch blocks instead
- **Asynchronous code**: setTimeout, requestAnimationFrame, Promise callbacks
- **Server-side rendering (SSR)**
- **Errors inside the Error Boundary itself**: An error boundary can't catch errors within itself
- **Suspense-related errors**: Handled by Suspense boundaries instead

## Error Propagation Behavior

- Errors propagate up to the nearest Error Boundary in the component tree
- If no Error Boundary catches an error, in React 16+, the entire component tree unmounts
- An Error Boundary cannot catch errors within itself (must be handled by a parent Error Boundary)

## React 19 Improvements

React 19 (December 2024) introduced significant improvements:

### New Root Error Handlers
- `onCaughtError`: Called when React catches an error in an Error Boundary
- `onUncaughtError`: Called when an error is thrown and not caught by any Error Boundary
- `onRecoverableError`: Called when an error is thrown and automatically recovered

### Error Handling Improvements
- Removed duplicate error logging (previously threw errors 3 times)
- Better distinction between caught and uncaught errors
- Improved error recovery with Actions

### Code Example
```javascript
const root = ReactDOM.createRoot(document.getElementById('root'), {
  onCaughtError: (error, errorInfo) => {
    console.log('Error caught by boundary:', error);
  },
  onUncaughtError: (error, errorInfo) => {
    console.log('Uncaught error:', error);
  },
});
```

## Functional Component Alternative

There is **no direct equivalent** for Error Boundaries in functional components. Options:
1. Create a class component Error Boundary
2. Use the `react-error-boundary` library (recommended for modern React)

## ESLint Rules

The React ESLint plugin includes a linting rule for Error Boundaries:
- **Rule**: `error-boundaries`
- **Purpose**: Validates that try/catch is not used for component errors
- **Reference**: https://react.dev/reference/eslint-plugin-react-hooks/lints/error-boundaries
