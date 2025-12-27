import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { FormStackProvider } from '../FormStackProvider';
import { Breadcrumbs } from '../Breadcrumbs';
import { useFormStack } from '../../hooks';
import type { FormProps } from '../../types';

// Mock HTMLDialogElement methods for JSDOM
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

// Test form component
function TestForm({ onSubmit, onCancel }: FormProps<{ name: string }>) {
  return (
    <div data-testid="test-form">
      <button data-testid="submit-btn" onClick={() => onSubmit({ name: 'Test' })}>
        Submit
      </button>
      <button data-testid="cancel-btn" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

// Test consumer
function TestConsumer({
  onResult,
  confirmOnCancel = false,
}: {
  onResult: (val: unknown) => void;
  confirmOnCancel?: boolean;
}) {
  const { openForm, stack } = useFormStack();

  const handleOpenForm = async () => {
    const result = await openForm({
      id: 'test-form',
      component: TestForm,
      label: 'Test Form',
      confirmOnCancel,
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

describe('Confirmation Dialog Integration', () => {
  describe('when confirmOnCancel is false', () => {
    it('should cancel immediately without confirmation', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <TestConsumer onResult={onResult} confirmOnCancel={false} />
        </FormStackProvider>
      );

      // Open form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

      // Cancel form - should not show confirmation
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-btn'));
      });

      // Should cancel immediately
      expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('when confirmOnCancel is true', () => {
    it('should show confirmation dialog on cancel', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <TestConsumer onResult={onResult} confirmOnCancel={true} />
        </FormStackProvider>
      );

      // Open form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

      // Cancel form - should show confirmation
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-btn'));
      });

      // Confirmation dialog should appear (use hidden: true for JSDOM dialog support)
      expect(screen.getByRole('alertdialog', { hidden: true })).toBeInTheDocument();
      expect(screen.getByText('Discard Changes?')).toBeInTheDocument();

      // Form should still be in stack
      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
    });

    it('should keep form open when user clicks Keep Editing', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <TestConsumer onResult={onResult} confirmOnCancel={true} />
        </FormStackProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-btn'));
      });

      // Click Keep Editing
      await act(async () => {
        fireEvent.click(screen.getByText('Keep Editing'));
      });

      // Dialog should close
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

      // Form should still be open
      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
      expect(screen.getByTestId('test-form')).toBeInTheDocument();

      // onResult should NOT have been called
      expect(onResult).not.toHaveBeenCalled();
    });

    it('should cancel form when user clicks Discard', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <TestConsumer onResult={onResult} confirmOnCancel={true} />
        </FormStackProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-btn'));
      });

      // Click Discard
      await act(async () => {
        fireEvent.click(screen.getByText('Discard'));
      });

      // Dialog should close
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

      // Form should be cancelled
      expect(screen.getByTestId('stack-length')).toHaveTextContent('0');

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('breadcrumb navigation with confirmOnCancel', () => {
    function NestedTestConsumer({ onResult }: { onResult: (result: unknown, level: number) => void }) {
      const { openForm, stack } = useFormStack();

      const openLevel = async (level: number, confirmOnCancel: boolean) => {
        const result = await openForm({
          id: `form-${level}`,
          label: `Form ${level}`,
          component: TestForm,
          confirmOnCancel,
        });
        onResult(result, level);
      };

      return (
        <div>
          <span data-testid="stack-length">{stack.length}</span>
          <button data-testid="open-level-1" onClick={() => openLevel(1, false)}>
            Open Level 1
          </button>
          <button data-testid="open-level-2" onClick={() => openLevel(2, true)}>
            Open Level 2 (confirm)
          </button>
          <button data-testid="open-level-3" onClick={() => openLevel(3, true)}>
            Open Level 3 (confirm)
          </button>
        </div>
      );
    }

    it('should show confirmation when navigating past form with confirmOnCancel', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <Breadcrumbs />
          <NestedTestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Open 3 forms (level 2 and 3 have confirmOnCancel)
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-3'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('3');

      // Click Form 1 breadcrumb (would cancel forms 2 and 3)
      await act(async () => {
        fireEvent.click(screen.getByRole('link', { name: 'Form 1' }));
      });

      // Confirmation dialog should appear (use hidden: true for JSDOM dialog support)
      expect(screen.getByRole('alertdialog', { hidden: true })).toBeInTheDocument();
      // Should mention multiple forms
      expect(screen.getByText(/Discard Changes/)).toBeInTheDocument();

      // Stack should still have 3 forms
      expect(screen.getByTestId('stack-length')).toHaveTextContent('3');
    });

    it('should cancel all forms when confirmed via breadcrumb', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <Breadcrumbs />
          <NestedTestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-3'));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('link', { name: 'Form 1' }));
      });

      // Confirm discarding
      await act(async () => {
        fireEvent.click(screen.getByText('Discard'));
      });

      // Stack should be reduced to 1
      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

      // Forms 2 and 3 should have been cancelled
      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(undefined, 2);
        expect(onResult).toHaveBeenCalledWith(undefined, 3);
      });
    });

    it('should not cancel forms when cancelled via breadcrumb confirmation', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <Breadcrumbs />
          <NestedTestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-3'));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('link', { name: 'Form 1' }));
      });

      // Click Keep Editing
      await act(async () => {
        fireEvent.click(screen.getByText('Keep Editing'));
      });

      // Stack should still have 3 forms
      expect(screen.getByTestId('stack-length')).toHaveTextContent('3');

      // onResult should NOT have been called
      expect(onResult).not.toHaveBeenCalled();
    });

    it('should not show confirmation when no cancelled forms have confirmOnCancel', async () => {
      const onResult = vi.fn();

      function SimpleConsumer({ onResult }: { onResult: (result: unknown, level: number) => void }) {
        const { openForm, stack } = useFormStack();

        const openLevel = async (level: number) => {
          const result = await openForm({
            id: `form-${level}`,
            label: `Form ${level}`,
            component: TestForm,
            confirmOnCancel: false, // All forms without confirmation
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
          </div>
        );
      }

      render(
        <FormStackProvider>
          <Breadcrumbs />
          <SimpleConsumer onResult={onResult} />
        </FormStackProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('2');

      // Click Form 1 breadcrumb
      await act(async () => {
        fireEvent.click(screen.getByRole('link', { name: 'Form 1' }));
      });

      // No confirmation dialog should appear
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

      // Stack should be reduced to 1 immediately
      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(undefined, 2);
      });
    });
  });
});
