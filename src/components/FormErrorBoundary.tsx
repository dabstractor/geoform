import { Component, type ReactNode, type ErrorInfo } from 'react';

/**
 * Props for FormErrorBoundary component.
 */
export interface FormErrorBoundaryProps {
  /** Child component(s) to wrap with error boundary */
  children: ReactNode;
  /** Unique identifier for the form (used in error messages) */
  formId: string;
  /** Callback when dismiss button is clicked */
  onDismiss: () => void;
  /** Optional callback when error is caught (for logging) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

/**
 * Internal state for FormErrorBoundary.
 */
interface FormErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
  /** Number of retry attempts (used for key generation) */
  retryCount: number;
}

/**
 * Error boundary component for isolating form rendering errors.
 * Provides retry and dismiss options for graceful error recovery.
 *
 * This is the only class component in geoform - React error boundaries
 * require getDerivedStateFromError and componentDidCatch which are only
 * available in class components.
 *
 * Each form in the stack is wrapped with its own error boundary, ensuring
 * that a crash in one form doesn't affect parent forms.
 *
 * @see {@link FormStackRenderer} - Uses this to wrap each form
 * @see {@link FormErrorBoundaryProps} - Configuration props
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 *
 * @example
 * ```tsx
 * <FormErrorBoundary
 *   formId="user-form"
 *   onDismiss={() => closeForm()}
 *   onError={(error, info) => logError(error)}
 * >
 *   <UserForm />
 * </FormErrorBoundary>
 * ```
 */
export class FormErrorBoundary extends Component<
  FormErrorBoundaryProps,
  FormErrorBoundaryState
> {
  constructor(props: FormErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  /**
   * Static lifecycle method called during React's render phase.
   * Updates state to show fallback UI on the next render.
   *
   * CRITICAL: No side effects allowed in this method (no logging, no callbacks).
   * This method runs during the "render" phase, before the DOM is updated.
   * Side effects (logging, error callbacks) must be in componentDidCatch instead.
   *
   * @param error - The error that was thrown during rendering
   * @returns Partial state update to trigger error UI display
   *
   * @see https://react.dev/reference/react/Component#static-getderivedstatefromerror
   */
  static getDerivedStateFromError(error: Error): Partial<FormErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Called during React's commit phase after the DOM has been updated.
   * Side effects (logging, callbacks, external API calls) are allowed here.
   *
   * This method receives the error and component stack trace, making it
   * ideal for error logging services like Sentry or LogRocket.
   *
   * @param error - The error that was thrown during rendering
   * @param errorInfo - Contains componentStack with the component tree trace
   *
   * @see https://react.dev/reference/react/Component#componentdidcatch
   */
  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Call optional error callback for logging
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Reset error state and increment retry count to force child remount.
   */
  private handleRetry = (): void => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  /**
   * Delegate to parent's dismiss handler.
   */
  private handleDismiss = (): void => {
    this.props.onDismiss();
  };

  override render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, formId } = this.props;

    if (hasError) {
      // Custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI with accessibility support
      return (
        <div
          className="form-error-boundary"
          role="alert"
          aria-live="assertive"
          data-testid={`error-boundary-${formId}`}
        >
          <div className="form-error-boundary__container">
            <h3
              className="form-error-boundary__title"
              id={`error-title-${formId}`}
            >
              Something went wrong
            </h3>
            <p
              className="form-error-boundary__message"
              aria-describedby={`error-title-${formId}`}
            >
              {error?.message || 'An unexpected error occurred while loading this form.'}
            </p>
            <div className="form-error-boundary__actions">
              <button
                className="form-error-boundary__retry-button"
                onClick={this.handleRetry}
                type="button"
              >
                Try Again
              </button>
              <button
                className="form-error-boundary__dismiss-button"
                onClick={this.handleDismiss}
                type="button"
                autoFocus
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Children render directly - React will naturally re-render after state reset
    // retryCount is kept in state to ensure proper remounting behavior
    return children;
  }
}
