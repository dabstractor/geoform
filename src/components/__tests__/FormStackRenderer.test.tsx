import { describe, it, expect, vi } from 'vitest';
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
});
