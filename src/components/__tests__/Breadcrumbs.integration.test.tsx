import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { FormStackProvider } from '../FormStackProvider';
import { Breadcrumbs } from '../Breadcrumbs';
import { useFormStack } from '../../hooks';
import type { FormProps } from '../../types';

// Simple test form component
function TestForm({ onSubmit, onCancel }: FormProps<string>) {
  return (
    <div data-testid="test-form">
      <button data-testid="submit-btn" onClick={() => onSubmit('submitted')}>
        Submit
      </button>
      <button data-testid="cancel-btn" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

// Test consumer that opens nested forms
function TestConsumer({ onResult }: { onResult: (result: string | undefined, level: number) => void }) {
  const { openForm, stack } = useFormStack();

  const openLevel = async (level: number) => {
    const result = await openForm({
      id: `form-${level}`,
      label: `Form ${level}`,
      component: TestForm,
    });
    onResult(result, level);
  };

  return (
    <div>
      <span data-testid="stack-length">{stack.length}</span>
      <button data-testid="open-level-1" onClick={() => openLevel(1)}>
        Open Level 1
      </button>
      <button data-testid="open-level-2" onClick={() => openLevel(2)}>
        Open Level 2
      </button>
      <button data-testid="open-level-3" onClick={() => openLevel(3)}>
        Open Level 3
      </button>
    </div>
  );
}

describe('Breadcrumbs Integration', () => {
  describe('navigation behavior', () => {
    it('should cancel deeper forms when navigating to earlier form', async () => {
      // Arrange
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <Breadcrumbs />
          <TestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Open 3 nested forms
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-3'));
      });

      // Verify 3 forms in stack
      expect(screen.getByTestId('stack-length')).toHaveTextContent('3');

      // Click on Form 1 breadcrumb (index 0)
      await act(async () => {
        fireEvent.click(screen.getByText('Form 1'));
      });

      // Verify stack reduced to 1
      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

      // Verify cancelled forms received undefined
      // Forms 2 and 3 should have been cancelled
      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(undefined, 2);
        expect(onResult).toHaveBeenCalledWith(undefined, 3);
      });
    });

    it('should navigate to middle form correctly', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <Breadcrumbs />
          <TestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Open 3 nested forms
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-3'));
      });

      // Click on Form 2 breadcrumb (index 1)
      await act(async () => {
        fireEvent.click(screen.getByText('Form 2'));
      });

      // Verify stack reduced to 2
      expect(screen.getByTestId('stack-length')).toHaveTextContent('2');

      // Form 3 was cancelled
      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(undefined, 3);
      });
    });
  });

  describe('breadcrumb display', () => {
    it('should update breadcrumbs as stack changes', async () => {
      render(
        <FormStackProvider>
          <Breadcrumbs />
          <TestConsumer onResult={() => {}} />
        </FormStackProvider>
      );

      // Initially no breadcrumbs
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

      // Open first form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-1'));
      });

      // Now breadcrumbs visible
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Form 1')).toHaveAttribute('aria-current', 'page');

      // Open second form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2'));
      });

      // Form 1 is now a link, Form 2 is current
      expect(screen.getByRole('link', { name: 'Form 1' })).toBeInTheDocument();
      expect(screen.getByText('Form 2')).toHaveAttribute('aria-current', 'page');
    });
  });
});
