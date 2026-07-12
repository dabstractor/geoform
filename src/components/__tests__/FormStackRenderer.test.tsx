import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FormStackRenderer } from '../FormStackRenderer';
import type { InternalStackEntry, FormProps, DeferredPromise } from '../../types';

// Default mock for onCancelRequest - always confirms
const createMockCancelRequest = () => vi.fn().mockResolvedValue(true);

// Helper to create mock deferred promise
const createMockDeferred = <T,>(): DeferredPromise<T> => {
  let resolveRef: (value: T | undefined) => void;
  let rejectRef: (reason?: unknown) => void;

  const promise = new Promise<T | undefined>((resolve, reject) => {
    resolveRef = resolve;
    rejectRef = reject;
  });

  return {
    promise,
    resolve: resolveRef!,
    reject: rejectRef!,
  };
};

// Helper to create mock stack entry
const createMockEntry = (
  id: string,
  label?: string,
  deferred?: DeferredPromise<unknown>
): InternalStackEntry<unknown> => ({
  id,
  label,
  component: ({ onSubmit, onCancel }: FormProps<unknown>) => (
    <div data-testid={`form-${id}`}>
      <span>Form: {id}</span>
      <button onClick={() => onSubmit({ value: id })} data-testid={`submit-${id}`}>
        Submit
      </button>
      <button onClick={onCancel} data-testid={`cancel-${id}`}>
        Cancel
      </button>
    </div>
  ),
  confirmOnCancel: false,
  deferred: deferred ?? createMockDeferred(),
});

describe('FormStackRenderer', () => {
  describe('when stack is empty', () => {
    it('should render nothing', () => {
      // Arrange
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      const { container } = render(
        <FormStackRenderer stack={[]} onClose={onClose} onCancelRequest={onCancelRequest} />
      );

      // Assert
      expect(container.firstChild).toBeNull();
    });
  });

  describe('when stack has one form', () => {
    it('should render the form as visible', () => {
      // Arrange
      const stack = [createMockEntry('form-1', 'Form 1')];
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);

      // Assert
      expect(screen.getByTestId('form-form-1')).toBeInTheDocument();
      const formContainer = screen.getByTestId('form-form-1').parentElement;
      expect(formContainer).toHaveStyle('display: block');
      expect(formContainer).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('when stack has multiple forms', () => {
    it('should render only the top form as visible', () => {
      // Arrange
      const stack = [
        createMockEntry('form-1', 'Form 1'),
        createMockEntry('form-2', 'Form 2'),
      ];
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);

      // Assert - both forms are in DOM
      expect(screen.getByTestId('form-form-1')).toBeInTheDocument();
      expect(screen.getByTestId('form-form-2')).toBeInTheDocument();

      // First form is hidden
      const form1Container = screen.getByTestId('form-form-1').parentElement;
      expect(form1Container).toHaveStyle('display: none');
      expect(form1Container).toHaveAttribute('aria-hidden', 'true');

      // Second form (top) is visible
      const form2Container = screen.getByTestId('form-form-2').parentElement;
      expect(form2Container).toHaveStyle('display: block');
      expect(form2Container).toHaveAttribute('aria-hidden', 'false');
    });

    it('should render three-level stack correctly', () => {
      // Arrange
      const stack = [
        createMockEntry('form-1'),
        createMockEntry('form-2'),
        createMockEntry('form-3'),
      ];
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);

      // Assert - only form-3 visible
      expect(screen.getByTestId('form-form-1').parentElement).toHaveStyle('display: none');
      expect(screen.getByTestId('form-form-2').parentElement).toHaveStyle('display: none');
      expect(screen.getByTestId('form-form-3').parentElement).toHaveStyle('display: block');
    });
  });

  describe('form callbacks', () => {
    it('should resolve deferred promise on submit', async () => {
      // Arrange
      const deferred = createMockDeferred<{ value: string }>();
      const resolveSpy = vi.spyOn(deferred, 'resolve');
      const stack = [createMockEntry('form-1', 'Form 1', deferred as DeferredPromise<unknown>)];
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);
      fireEvent.click(screen.getByTestId('submit-form-1'));

      // Assert
      expect(resolveSpy).toHaveBeenCalledWith({ value: 'form-1' });
      expect(onClose).toHaveBeenCalled();
    });

    it('should resolve deferred promise with undefined on cancel when confirmed', async () => {
      // Arrange
      const deferred = createMockDeferred<unknown>();
      const resolveSpy = vi.spyOn(deferred, 'resolve');
      const stack = [createMockEntry('form-1', 'Form 1', deferred)];
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-form-1'));
      });

      // Assert
      expect(onCancelRequest).toHaveBeenCalled();
      expect(resolveSpy).toHaveBeenCalledWith(undefined);
      expect(onClose).toHaveBeenCalled();
    });

    it('should not resolve deferred promise when cancel is rejected', async () => {
      // Arrange
      const deferred = createMockDeferred<unknown>();
      const resolveSpy = vi.spyOn(deferred, 'resolve');
      const stack = [createMockEntry('form-1', 'Form 1', deferred)];
      const onClose = vi.fn();
      const onCancelRequest = vi.fn().mockResolvedValue(false); // Reject cancellation

      // Act
      render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-form-1'));
      });

      // Assert
      expect(onCancelRequest).toHaveBeenCalled();
      expect(resolveSpy).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('key stability', () => {
    it('should use entry.id as key', () => {
      // Arrange
      const stack = [
        createMockEntry('unique-id-1', 'Form 1'),
        createMockEntry('unique-id-2', 'Form 2'),
      ];
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);

      // Assert - check data-form-id attribute matches id
      expect(screen.getByTestId('form-unique-id-1').parentElement).toHaveAttribute(
        'data-form-id',
        'unique-id-1'
      );
      expect(screen.getByTestId('form-unique-id-2').parentElement).toHaveAttribute(
        'data-form-id',
        'unique-id-2'
      );
    });
  });

  describe('error boundary integration', () => {
    // Suppress console.error for expected errors in this block
    const originalError = console.error;

    beforeEach(() => {
      console.error = vi.fn();
    });

    afterEach(() => {
      console.error = originalError;
    });

    // Helper to create an error-throwing entry
    const createErrorThrowingEntry = (
      id: string,
      deferred?: DeferredPromise<unknown>
    ): InternalStackEntry<unknown> => ({
      id,
      label: `Error Form ${id}`,
      component: () => {
        throw new Error(`Error in form ${id}`);
      },
      confirmOnCancel: false,
      deferred: deferred ?? createMockDeferred(),
    });

    it('should catch error and display fallback when form throws', () => {
      // Arrange
      const stack = [createErrorThrowingEntry('error-form')];
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);

      // Assert
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Error in form error-form')).toBeInTheDocument();
    });

    it('should call onClose when dismiss is clicked after error', () => {
      // Arrange
      const deferred = createMockDeferred<unknown>();
      const resolveSpy = vi.spyOn(deferred, 'resolve');
      const stack = [createErrorThrowingEntry('error-form', deferred)];
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

      // Assert
      expect(resolveSpy).toHaveBeenCalledWith(undefined);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should resolve deferred with undefined on dismiss', () => {
      // Arrange
      const deferred = createMockDeferred<unknown>();
      const resolveSpy = vi.spyOn(deferred, 'resolve');
      const stack = [createErrorThrowingEntry('error-form', deferred)];
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

      // Assert
      expect(resolveSpy).toHaveBeenCalledWith(undefined);
    });

    it('should allow retry after error when component recovers', () => {
      // Arrange - use rerender to simulate recovery
      let shouldThrow = true;
      const recoveryEntry: InternalStackEntry<unknown> = {
        id: 'recovery-form',
        label: 'Recovery Form',
        component: ({ onSubmit }: FormProps<unknown>) => {
          if (shouldThrow) {
            throw new Error('Form error');
          }
          return (
            <div data-testid="recovered-form">
              <button onClick={() => onSubmit('recovered')}>Submit</button>
            </div>
          );
        },
        confirmOnCancel: false,
        deferred: createMockDeferred(),
      };
      const stack = [recoveryEntry];
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act - render and retry
      const { rerender } = render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);

      // Initially shows error
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Simulate the issue being fixed
      shouldThrow = false;

      // Trigger a rerender to pick up the change (simulating prop/state update)
      rerender(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);

      // Click retry
      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      // Assert - form recovered
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByTestId('recovered-form')).toBeInTheDocument();
    });

    it('should not affect other forms when one form errors', () => {
      // Arrange - stack with normal form and error form
      const normalEntry = createMockEntry('normal-form', 'Normal Form');
      const errorEntry = createErrorThrowingEntry('error-form');
      const stack = [normalEntry, errorEntry];
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);

      // Assert - error form shows error, normal form still exists
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByTestId('form-normal-form')).toBeInTheDocument();
    });

    it('should log error to console when form throws', () => {
      // Arrange
      const stack = [createErrorThrowingEntry('test-error-form')];
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      render(<FormStackRenderer stack={stack} onClose={onClose} onCancelRequest={onCancelRequest} />);

      // Assert - console.error was called with error info
      expect(console.error).toHaveBeenCalledWith(
        '[FormStack] Error in form test-error-form:',
        expect.any(Error)
      );
      expect(console.error).toHaveBeenCalledWith(
        'Component stack:',
        expect.any(String)
      );
    });

    it('should route form-invoked onError to the boundary without rejecting or popping', () => {
      // Arrange - a form that calls onError on a click
      const deferred = createMockDeferred<unknown>();
      const rejectSpy = vi.spyOn(deferred, 'reject');
      const resolveSpy = vi.spyOn(deferred, 'resolve');
      const entry: InternalStackEntry<unknown> = {
        id: 'onerror-form',
        label: 'OnError Form',
        component: ({ onError }: FormProps<unknown>) => (
          <div data-testid="onerror-form">
            <button data-testid="fire-error" onClick={() => onError!(new Error('boom'))}>
              Fire Error
            </button>
          </div>
        ),
        confirmOnCancel: false,
        deferred,
      };
      const onClose = vi.fn();
      const onCancelRequest = createMockCancelRequest();

      // Act
      render(
        <FormStackRenderer stack={[entry]} onClose={onClose} onCancelRequest={onCancelRequest} />
      );
      fireEvent.click(screen.getByTestId('fire-error'));

      // Assert - PRD §9: no reject, no resolve, no pop
      expect(rejectSpy).not.toHaveBeenCalled();
      expect(resolveSpy).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      // Error surfaced to the boundary fallback UI
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('boom')).toBeInTheDocument();
    });
  });
});
