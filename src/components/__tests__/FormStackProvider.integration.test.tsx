import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { FormStackProvider } from '../FormStackProvider';
import { useFormStack } from '../../hooks';
import type { FormProps } from '../../types';

// Test form component
function TestForm({ onSubmit, onCancel }: FormProps<{ name: string }>) {
  return (
    <div data-testid="test-form">
      <button
        data-testid="submit-btn"
        onClick={() => onSubmit({ name: 'Test User' })}
      >
        Submit
      </button>
      <button
        data-testid="cancel-btn"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

// Test component that uses the hook
function TestConsumer({ onResult }: { onResult: (val: unknown) => void }) {
  const { openForm, stack } = useFormStack();

  const handleOpenForm = async () => {
    const result = await openForm({
      id: 'test-form',
      component: TestForm,
      label: 'Test Form',
    });
    onResult(result);
  };

  return (
    <div>
      <span data-testid="stack-length">{stack.length}</span>
      <button data-testid="open-form" onClick={handleOpenForm}>
        Open Form
      </button>
    </div>
  );
}

describe('FormStackProvider Integration', () => {
  describe('openForm lifecycle', () => {
    it('should add form to stack when openForm is called', async () => {
      // Arrange
      const onResult = vi.fn();

      // Act
      render(
        <FormStackProvider>
          <TestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      expect(screen.getByTestId('stack-length')).toHaveTextContent('0');

      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      // Assert - form is in stack and visible
      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
      expect(screen.getByTestId('test-form')).toBeInTheDocument();
    });

    it('should resolve promise with value on submit', async () => {
      // Arrange
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <TestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Act - open form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      // Act - submit form
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-btn'));
      });

      // Assert
      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith({ name: 'Test User' });
      });
      expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
    });

    it('should resolve promise with undefined on cancel', async () => {
      // Arrange
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <TestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Act - open form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      // Act - cancel form
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-btn'));
      });

      // Assert
      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(undefined);
      });
      expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
    });
  });

  describe('nested forms', () => {
    it('should preserve parent form in DOM while child is active', async () => {
      // Arrange
      function ChildForm({ onSubmit }: FormProps<string>) {
        return (
          <div data-testid="child-form">
            <span>Child Form</span>
            <button data-testid="submit-child" onClick={() => onSubmit('child-result')}>
              Submit Child
            </button>
          </div>
        );
      }

      function ParentForm({ onSubmit }: FormProps<string>) {
        const { openForm } = useFormStack();

        const handleOpenChild = async () => {
          await openForm({
            id: 'child-form',
            component: ChildForm,
            label: 'Child',
          });
        };

        return (
          <div data-testid="parent-form">
            <span>Parent Form</span>
            <button data-testid="open-child" onClick={handleOpenChild}>
              Open Child
            </button>
            <button onClick={() => onSubmit('parent-result')}>Submit Parent</button>
          </div>
        );
      }

      function TestApp() {
        const { openForm } = useFormStack();

        return (
          <button
            data-testid="open-parent"
            onClick={() => openForm({ id: 'parent', component: ParentForm })}
          >
            Open Parent
          </button>
        );
      }

      render(
        <FormStackProvider>
          <TestApp />
        </FormStackProvider>
      );

      // Act - open parent
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-parent'));
      });

      expect(screen.getByTestId('parent-form')).toBeInTheDocument();

      // Act - open child from parent
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-child'));
      });

      // Assert - both forms in DOM
      expect(screen.getByTestId('parent-form')).toBeInTheDocument();
      expect(screen.getByTestId('child-form')).toBeInTheDocument();

      // Parent is hidden, child is visible
      expect(screen.getByTestId('parent-form').parentElement).toHaveStyle('display: none');
      expect(screen.getByTestId('child-form').parentElement).toHaveStyle('display: block');
    });
  });
});
