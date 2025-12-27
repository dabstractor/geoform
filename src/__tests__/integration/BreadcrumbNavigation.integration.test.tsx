import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { FormStackProvider } from '../../components/FormStackProvider';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { useFormStack } from '../../hooks';
import type { FormProps } from '../../types';

// Mock HTMLDialogElement methods for JSDOM
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

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
function TestConsumer({
  onResult,
}: {
  onResult: (result: string | undefined, level: number) => void;
}) {
  const { openForm, stack } = useFormStack();

  const openLevel = async (level: number, confirmOnCancel = false) => {
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

describe('BreadcrumbNavigation Integration', () => {
  describe('breadcrumb click cancellation', () => {
    it('should cancel forms at index N+1, N+2, etc when clicking breadcrumb at index N', async () => {
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

      expect(screen.getByTestId('stack-length')).toHaveTextContent('3');

      // Click on Form 1 breadcrumb (index 0)
      await act(async () => {
        fireEvent.click(screen.getByRole('link', { name: 'Form 1' }));
      });

      // Stack reduced to 1
      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
    });

    it('should resolve cancelled forms with undefined via callbacks', async () => {
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

      // Click on Form 1 breadcrumb
      await act(async () => {
        fireEvent.click(screen.getByRole('link', { name: 'Form 1' }));
      });

      // Verify cancelled forms received undefined
      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(undefined, 2);
        expect(onResult).toHaveBeenCalledWith(undefined, 3);
      });
    });

    it('should reduce stack.length to N+1 after navigation to index N', async () => {
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

      expect(screen.getByTestId('stack-length')).toHaveTextContent('3');

      // Click on Form 2 breadcrumb (index 1)
      await act(async () => {
        fireEvent.click(screen.getByRole('link', { name: 'Form 2' }));
      });

      // Stack should now have 2 forms (index 0 and 1)
      expect(screen.getByTestId('stack-length')).toHaveTextContent('2');

      // Only Form 3 should have been cancelled
      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(undefined, 3);
      });
      expect(onResult).not.toHaveBeenCalledWith(undefined, 2);
    });
  });

  describe('breadcrumb navigation with confirmOnCancel', () => {
    function ConfirmTestConsumer({
      onResult,
    }: {
      onResult: (result: unknown, level: number) => void;
    }) {
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
          <button data-testid="open-level-2-confirm" onClick={() => openLevel(2, true)}>
            Open Level 2 (confirm)
          </button>
          <button data-testid="open-level-3-confirm" onClick={() => openLevel(3, true)}>
            Open Level 3 (confirm)
          </button>
        </div>
      );
    }

    it('should show confirmation dialog when navigating past form with confirmOnCancel', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <Breadcrumbs />
          <ConfirmTestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Open 3 forms (level 2 and 3 have confirmOnCancel)
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2-confirm'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-3-confirm'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('3');

      // Click Form 1 breadcrumb
      await act(async () => {
        fireEvent.click(screen.getByRole('link', { name: 'Form 1' }));
      });

      // Confirmation dialog should appear (use hidden: true for JSDOM dialog support)
      expect(screen.getByRole('alertdialog', { hidden: true })).toBeInTheDocument();
      expect(screen.getByText(/Discard Changes/)).toBeInTheDocument();

      // Stack should still have 3 forms
      expect(screen.getByTestId('stack-length')).toHaveTextContent('3');
    });

    it('should preserve all forms when Keep Editing is clicked', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <Breadcrumbs />
          <ConfirmTestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Open 3 forms
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2-confirm'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-3-confirm'));
      });

      // Click Form 1 breadcrumb
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

    it('should cancel all deeper forms when Discard is clicked', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <Breadcrumbs />
          <ConfirmTestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Open 3 forms
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2-confirm'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-3-confirm'));
      });

      // Click Form 1 breadcrumb
      await act(async () => {
        fireEvent.click(screen.getByRole('link', { name: 'Form 1' }));
      });

      // Click Discard
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
  });

  describe('breadcrumb display updates', () => {
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

      // Now breadcrumbs visible with current form
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Form 1')).toHaveAttribute('aria-current', 'page');

      // Open second form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2'));
      });

      // Form 1 is now a link, Form 2 is current
      expect(screen.getByRole('link', { name: 'Form 1' })).toBeInTheDocument();
      expect(screen.getByText('Form 2')).toHaveAttribute('aria-current', 'page');

      // Open third form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-3'));
      });

      // Forms 1 and 2 are links, Form 3 is current
      expect(screen.getByRole('link', { name: 'Form 1' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Form 2' })).toBeInTheDocument();
      expect(screen.getByText('Form 3')).toHaveAttribute('aria-current', 'page');
    });

    it('should remove breadcrumbs for cancelled forms', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <Breadcrumbs />
          <TestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Open 3 forms
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-3'));
      });

      // Navigate to Form 1
      await act(async () => {
        fireEvent.click(screen.getByRole('link', { name: 'Form 1' }));
      });

      // Forms 2 and 3 breadcrumbs should be gone
      expect(screen.queryByText('Form 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Form 3')).not.toBeInTheDocument();

      // Form 1 is now current
      expect(screen.getByText('Form 1')).toHaveAttribute('aria-current', 'page');
    });
  });
});
