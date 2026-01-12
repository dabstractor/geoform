# React Error Boundaries - TypeScript Patterns

## Basic Types and Interfaces

### Error Boundary Props
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorInfo {
  componentStack: string;
}
```

## Pattern 1: Basic Typed Error Boundary

```typescript
import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught:', error, errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## Pattern 2: Error Boundary with Callbacks

```typescript
import React, { Component, ReactNode, ErrorInfo, FC } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | FC<{ error: Error }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error reporting service
    logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback, children } = this.props;
      const { error } = this.state;

      if (typeof fallback === 'function') {
        return fallback({ error: error! });
      }

      return fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}

// Helper function with proper typing
function logErrorToService(
  error: Error,
  errorInfo: ErrorInfo
): void {
  console.error('Error logged:', {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
  });
}
```

## Pattern 3: Fallback Component with Error Props

```typescript
import React, { FC, ReactNode } from 'react';

interface ErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  resetErrorBoundary?: () => void;
}

const ErrorFallback: FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetErrorBoundary,
}) => {
  return (
    <div role="alert" className="error-fallback">
      <h2>Something went wrong</h2>
      <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
        {error?.toString()}
        {'\n\n'}
        {errorInfo?.componentStack}
      </details>
      {resetErrorBoundary && (
        <button onClick={resetErrorBoundary}>Try again</button>
      )}
    </div>
  );
};

export default ErrorFallback;
```

## Pattern 4: Advanced Typed Error Boundary

```typescript
import React, {
  Component,
  ComponentType,
  ReactNode,
  ErrorInfo,
  FC,
} from 'react';

// Custom error type
interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, unknown>;
}

interface ErrorBoundaryProps<T = {}> {
  children: ReactNode;
  fallback?: ReactNode | FC<ErrorFallbackProps<T>>;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: Array<unknown>;
  context?: T;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorFallbackProps<T = {}> {
  error: AppError;
  resetErrorBoundary: () => void;
  context?: T;
}

export class ErrorBoundary<T = {}> extends Component<
  ErrorBoundaryProps<T>,
  ErrorBoundaryState
> {
  private previousResetKeys: Array<unknown> = [];

  constructor(props: ErrorBoundaryProps<T>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: AppError): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: AppError, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(
    prevProps: ErrorBoundaryProps<T>,
    _prevState: ErrorBoundaryState
  ): void {
    const { resetKeys = [] } = this.props;
    const hasResetKeyChanged = resetKeys.some(
      (key, index) => key !== this.previousResetKeys[index]
    );

    if (hasResetKeyChanged && this.state.hasError) {
      this.resetErrorBoundary();
    }

    this.previousResetKeys = resetKeys;
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { fallback, children, context } = this.props;

    if (hasError && error) {
      if (typeof fallback === 'function') {
        return fallback({
          error,
          resetErrorBoundary: this.resetErrorBoundary,
          context,
        });
      }

      return fallback || <div>Something went wrong</div>;
    }

    return children;
  }
}
```

## Pattern 5: Higher-Order Component with TypeScript

```typescript
import React, { ComponentType, ReactNode } from 'react';

interface WithErrorBoundaryProps {
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  errorBoundaryProps?: WithErrorBoundaryProps
) {
  const Wrapped = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  Wrapped.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return Wrapped;
}

// Usage
const MyComponent = () => <div>My Component</div>;

export default withErrorBoundary(MyComponent, {
  fallback: <div>Error loading component</div>,
  onError: (error) => console.error(error),
});
```

## Pattern 6: Custom Error Types

```typescript
// Custom error types for specific scenarios
class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class ValidationError extends Error {
  constructor(
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

type AppError = NetworkError | ValidationError | AuthenticationError | Error;

interface ErrorFallbackProps {
  error: AppError;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const getErrorMessage = (err: AppError): string => {
    if (err instanceof NetworkError) {
      return 'Network connection error. Please check your internet connection.';
    }
    if (err instanceof ValidationError) {
      return `Validation error: ${err.message}`;
    }
    if (err instanceof AuthenticationError) {
      return 'Your session has expired. Please log in again.';
    }
    return 'An unexpected error occurred.';
  };

  return (
    <div role="alert">
      <h2>Error</h2>
      <p>{getErrorMessage(error)}</p>
      {error instanceof ValidationError && error.fields && (
        <ul>
          {Object.entries(error.fields).map(([field, msg]) => (
            <li key={field}>{`${field}: ${msg}`}</li>
          ))}
        </ul>
      )}
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
};
```

## Pattern 7: React-Error-Boundary TypeScript

```typescript
import {
  ErrorBoundary,
  FallbackProps,
  useErrorBoundary,
} from 'react-error-boundary';
import React, { FC } from 'react';

// Typed fallback component
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

// Typed error logger
function errorHandler(error: Error, errorInfo: { componentStack: string }) {
  console.error('Error caught:', error, errorInfo);

  // Send to error tracking service
  logToSentry({
    error,
    componentStack: errorInfo.componentStack,
  });
}

// Component that can throw errors
const RiskyComponent: FC = () => {
  const { showBoundary } = useErrorBoundary();

  const handleAsyncError = async () => {
    try {
      await fetch('/api/data');
    } catch (error) {
      showBoundary(error);
    }
  };

  return <button onClick={handleAsyncError}>Fetch Data</button>;
};

// Usage
const App: FC = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback} onError={errorHandler}>
    <RiskyComponent />
  </ErrorBoundary>
);
```

## Pattern 8: Error Boundary with Redux (TypeScript)

```typescript
import { connect, ConnectedProps } from 'react-redux';
import { Component, ReactNode, ErrorInfo } from 'react';
import { RootState } from './store';

interface OwnProps {
  children: ReactNode;
}

interface OwnState {
  hasError: boolean;
  error: Error | null;
}

const mapStateToProps = (state: RootState) => ({
  logErrors: state.settings.logErrors,
});

const mapDispatchToProps = {
  logError: (error: Error, errorInfo: ErrorInfo) =>
    ({ type: 'LOG_ERROR', payload: { error, errorInfo } } as const),
};

type Props = ConnectedProps<
  typeof connector
> & OwnProps;

class ErrorBoundary extends Component<Props, OwnState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): OwnState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.logErrors) {
      this.props.logError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}

const connector = connect(mapStateToProps, mapDispatchToProps);
export default connector(ErrorBoundary);
```

## Pattern 9: Error Boundary Factory

```typescript
import React, { Component, ReactNode, ErrorInfo, ComponentType } from 'react';

interface ErrorBoundaryConfig {
  name?: string;
  fallback?: ReactNode | ((error: Error) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

function createErrorBoundary(config: ErrorBoundaryConfig) {
  class ConfigurableErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: { children: ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      if (config.onError) {
        config.onError(error, errorInfo);
      }
    }

    handleReset = () => {
      this.setState({ hasError: false, error: null });
      if (config.onReset) {
        config.onReset();
      }
    };

    render(): ReactNode {
      if (this.state.hasError) {
        if (typeof config.fallback === 'function') {
          return config.fallback(this.state.error!);
        }
        return config.fallback || <div>Error</div>;
      }

      return this.props.children;
    }
  }

  ConfigurableErrorBoundary.displayName =
    config.name || 'ConfigurableErrorBoundary';

  return ConfigurableErrorBoundary;
}

// Usage
const DashboardErrorBoundary = createErrorBoundary({
  name: 'DashboardErrorBoundary',
  fallback: <div>Dashboard failed to load</div>,
  onError: (error) => console.error('Dashboard error:', error),
});
```

## Pattern 10: Generic Error Boundary

```typescript
import React, {
  Component,
  ReactNode,
  ErrorInfo,
  ComponentType,
  PropsWithChildren,
} from 'react';

// Generic type for fallback props
interface FallbackProps<TError extends Error = Error> {
  error: TError;
  reset: () => void;
}

// Generic Error Boundary
interface GenericErrorBoundaryProps<TError extends Error = Error> {
  children: ReactNode;
  fallback?: ComponentType<FallbackProps<TError>>;
  onError?: (error: TError, errorInfo: ErrorInfo) => void;
}

interface GenericErrorBoundaryState<TError extends Error = Error> {
  error: TError | null;
  hasError: boolean;
}

export class GenericErrorBoundary<
  TError extends Error = Error
> extends Component<
  GenericErrorBoundaryProps<TError>,
  GenericErrorBoundaryState<TError>
> {
  constructor(props: GenericErrorBoundaryProps<TError>) {
    super(props);
    this.state = {
      error: null,
      hasError: false,
    };
  }

  static getDerivedStateFromError<T extends Error>(
    error: T
  ): GenericErrorBoundaryState<T> {
    return {
      error,
      hasError: true,
    };
  }

  componentDidCatch(error: TError, errorInfo: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reset = (): void => {
    this.setState({
      error: null,
      hasError: false,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;

      if (Fallback) {
        return (
          <Fallback error={this.state.error} reset={this.reset} />
        );
      }

      return <div>An error occurred</div>;
    }

    return this.props.children;
  }
}
```

## Complete Example: Full-Featured TypeScript Error Boundary

```typescript
import React, {
  Component,
  ReactNode,
  ErrorInfo,
  FC,
  createContext,
  useContext,
} from 'react';

// Types
interface AppError extends Error {
  code: string;
  statusCode?: number;
  isDevelopment?: boolean;
}

interface ErrorBoundaryContextValue {
  error: AppError | null;
  reset: () => void;
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: FC<{ error: AppError; reset: () => void }>;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  isDevelopment?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
}

// Context
const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(
  null
);

// Hook
export function useErrorBoundary(): ErrorBoundaryContextValue {
  const context = useContext(ErrorBoundaryContext);
  if (!context) {
    throw new Error('useErrorBoundary must be used within ErrorBoundary');
  }
  return context;
}

// Component
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: AppError): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: AppError, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback: Fallback } = this.props;

    if (hasError && error) {
      return (
        <ErrorBoundaryContext.Provider
          value={{
            error,
            reset: this.reset,
            hasError,
          }}
        >
          {Fallback ? <Fallback error={error} reset={this.reset} /> : null}
        </ErrorBoundaryContext.Provider>
      );
    }

    return (
      <ErrorBoundaryContext.Provider
        value={{
          error: null,
          reset: this.reset,
          hasError: false,
        }}
      >
        {children}
      </ErrorBoundaryContext.Provider>
    );
  }
}
```

## Summary of TypeScript Patterns

| Pattern | Use Case | Complexity |
|---------|----------|-----------|
| **Pattern 1** | Simple error boundary | Low |
| **Pattern 2** | With callbacks and logging | Medium |
| **Pattern 3** | Reusable fallback components | Medium |
| **Pattern 4** | Advanced with reset keys | High |
| **Pattern 5** | HOC wrapper pattern | High |
| **Pattern 6** | Custom error types | Medium |
| **Pattern 7** | Using react-error-boundary | Medium |
| **Pattern 8** | Redux integration | High |
| **Pattern 9** | Factory pattern | High |
| **Pattern 10** | Generic types and context | High |
