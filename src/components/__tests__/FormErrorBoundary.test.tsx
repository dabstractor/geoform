import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import { FormErrorBoundary } from '../FormErrorBoundary';

// Component that throws an error during render
const ErrorThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div data-testid="child">Child rendered successfully</div>;
};

// Controllable component for retry testing
const ControllableErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Controlled error');
  }
  return <div data-testid="recovered-child">Recovered successfully</div>;
};

describe('FormErrorBoundary', () => {
  // Suppress console.error for expected errors
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('when no error occurs', () => {
    it('should render children normally', () => {
      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <div data-testid="child">Normal child content</div>
        </FormErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Normal child content')).toBeInTheDocument();
    });

    it('should not show fallback UI', () => {
      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <div>Normal content</div>
        </FormErrorBoundary>
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('when error occurs', () => {
    it('should catch error and display fallback UI', () => {
      render(
        <FormErrorBoundary formId="test-form" onDismiss={vi.fn()}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should display the error message', () => {
      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should display default message when error has no message', () => {
      const NoMessageError = () => {
        const error = new Error();
        error.message = '';
        throw error;
      };

      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <NoMessageError />
        </FormErrorBoundary>
      );

      expect(screen.getByText('An unexpected error occurred while loading this form.')).toBeInTheDocument();
    });

    it('should display Try Again and Dismiss buttons', () => {
      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    });

    it('should set data-testid with formId', () => {
      render(
        <FormErrorBoundary formId="my-form-123" onDismiss={vi.fn()}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary-my-form-123')).toBeInTheDocument();
    });
  });

  describe('onError callback', () => {
    it('should call onError when error is caught', () => {
      const onError = vi.fn();

      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()} onError={onError}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should pass the correct error to onError callback', () => {
      const onError = vi.fn();

      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()} onError={onError}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      expect(onError.mock.calls[0]?.[0]?.message).toBe('Test error message');
    });

    it('should work without onError callback', () => {
      // Should not throw when onError is not provided
      expect(() =>
        render(
          <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
            <ErrorThrowingComponent />
          </FormErrorBoundary>
        )
      ).not.toThrow();
    });
  });

  describe('Dismiss button', () => {
    it('should call onDismiss when clicked', () => {
      const onDismiss = vi.fn();

      render(
        <FormErrorBoundary formId="test" onDismiss={onDismiss}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should have autoFocus on dismiss button', () => {
      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
      // React renders autoFocus as a prop, we verify the button is the focused element
      expect(document.activeElement).toBe(dismissButton);
    });
  });

  describe('Try Again button', () => {
    it('should reset error state and attempt to re-render child on click', () => {
      // First render with error
      const { rerender } = render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <ControllableErrorComponent shouldThrow={true} />
        </FormErrorBoundary>
      );

      // Initially shows error
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Controlled error')).toBeInTheDocument();

      // Simulate fixing the issue by re-rendering with no error before clicking retry
      rerender(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <ControllableErrorComponent shouldThrow={false} />
        </FormErrorBoundary>
      );

      // Still shows error (error state not cleared yet)
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Click retry to clear error state
      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      // Should now show recovered child
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByTestId('recovered-child')).toBeInTheDocument();
    });

    it('should show error again if child still throws after retry', () => {
      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <ErrorThrowingComponent shouldThrow={true} />
        </FormErrorBoundary>
      );

      // Initially shows error
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();

      // Click retry - child still throws
      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      // Error should still be shown (component still throws)
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('custom fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()} fallback={customFallback}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should not render default fallback UI with custom fallback', () => {
      const customFallback = <div>Custom</div>;

      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()} fallback={customFallback}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have role="alert"', () => {
      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have aria-live="assertive"', () => {
      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have title with id for labelling', () => {
      render(
        <FormErrorBoundary formId="my-form" onDismiss={vi.fn()}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      const title = screen.getByText('Something went wrong');
      expect(title).toHaveAttribute('id', 'error-title-my-form');
    });

    it('should have message with aria-describedby', () => {
      render(
        <FormErrorBoundary formId="my-form" onDismiss={vi.fn()}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      const message = screen.getByText('Test error message');
      expect(message).toHaveAttribute('aria-describedby', 'error-title-my-form');
    });

    it('should have proper button types', () => {
      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      const dismissButton = screen.getByRole('button', { name: 'Dismiss' });

      expect(retryButton).toHaveAttribute('type', 'button');
      expect(dismissButton).toHaveAttribute('type', 'button');
    });
  });

  describe('CSS classes', () => {
    it('should apply BEM class names', () => {
      render(
        <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
          <ErrorThrowingComponent />
        </FormErrorBoundary>
      );

      const container = screen.getByRole('alert');
      expect(container).toHaveClass('form-error-boundary');

      expect(container.querySelector('.form-error-boundary__container')).toBeInTheDocument();
      expect(container.querySelector('.form-error-boundary__title')).toBeInTheDocument();
      expect(container.querySelector('.form-error-boundary__message')).toBeInTheDocument();
      expect(container.querySelector('.form-error-boundary__actions')).toBeInTheDocument();
      expect(container.querySelector('.form-error-boundary__retry-button')).toBeInTheDocument();
      expect(container.querySelector('.form-error-boundary__dismiss-button')).toBeInTheDocument();
    });
  });

  describe('imperative showError', () => {
    it('shows the fallback UI when showError() is called via ref', () => {
      const ref = createRef<FormErrorBoundary>();

      render(
        <FormErrorBoundary ref={ref} formId="test" onDismiss={vi.fn()}>
          <div data-testid="child">Child</div>
        </FormErrorBoundary>
      );

      // Initially no error UI and children are visible
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByTestId('child')).toBeInTheDocument();

      // Imperatively trigger the fallback (setState outside a React handler -> act())
      act(() => {
        ref.current!.showError(new Error('boom'));
      });

      // Fallback appears with the error message; children are hidden
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('boom')).toBeInTheDocument();
      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    });

    it('does not call onError for imperatively-set errors', () => {
      const onError = vi.fn();
      const ref = createRef<FormErrorBoundary>();

      render(
        <FormErrorBoundary ref={ref} formId="test" onDismiss={vi.fn()} onError={onError}>
          <div data-testid="child" />
        </FormErrorBoundary>
      );

      act(() => {
        ref.current!.showError(new Error('boom'));
      });

      // componentDidCatch never ran (no render throw), so onError is NOT invoked.
      // Callers must perform any logging BEFORE calling showError.
      expect(onError).not.toHaveBeenCalled();
    });

    it('clears the error and re-renders children when Try Again is clicked after showError', () => {
      const ref = createRef<FormErrorBoundary>();

      render(
        <FormErrorBoundary ref={ref} formId="test" onDismiss={vi.fn()}>
          <div data-testid="child">Child</div>
        </FormErrorBoundary>
      );

      act(() => {
        ref.current!.showError(new Error('boom'));
      });

      // Fallback is showing
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Click Try Again -> clears error state and re-renders children
      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('calls onDismiss when Dismiss is clicked after showError', () => {
      const onDismiss = vi.fn();
      const ref = createRef<FormErrorBoundary>();

      render(
        <FormErrorBoundary ref={ref} formId="test" onDismiss={onDismiss}>
          <div data-testid="child">Child</div>
        </FormErrorBoundary>
      );

      act(() => {
        ref.current!.showError(new Error('boom'));
      });

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
