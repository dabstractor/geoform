import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { FormStackProvider } from '../../components/FormStackProvider';
import { useFormStack } from '../../hooks';
import type { FormProps } from '../../types';

describe('ErrorBoundaryIsolation Integration', () => {
  // Suppress console.error for expected errors
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('error isolation', () => {
    it('should show error boundary fallback when child form throws', async () => {
      function ErrorForm(): ReactNode {
        throw new Error('Child form error');
      }

      function ParentForm({ onSubmit }: FormProps<string>) {
        const { openForm } = useFormStack();
        const [value, setValue] = useState('parent-value');

        return (
          <div data-testid="parent-form">
            <input
              data-testid="parent-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              data-testid="open-error-child"
              onClick={() => openForm({ id: 'error', component: ErrorForm, label: 'Error Form' })}
            >
              Open Error Form
            </button>
            <button data-testid="submit-parent" onClick={() => onSubmit(value)}>
              Submit
            </button>
          </div>
        );
      }

      function TestApp() {
        const { openForm } = useFormStack();
        return (
          <button
            data-testid="start"
            onClick={() => openForm({ id: 'parent', component: ParentForm, label: 'Parent' })}
          >
            Start
          </button>
        );
      }

      render(
        <FormStackProvider>
          <TestApp />
        </FormStackProvider>
      );

      // Open parent
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });

      // Open error child
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-error-child'));
      });

      // Error boundary should catch it
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Child form error')).toBeInTheDocument();
    });

    it('should keep parent form in DOM and accessible when child throws', async () => {
      function ErrorForm(): ReactNode {
        throw new Error('Child form error');
      }

      function ParentForm({ onSubmit }: FormProps<string>) {
        const { openForm } = useFormStack();
        const [value, setValue] = useState('parent-value');

        return (
          <div data-testid="parent-form">
            <input
              data-testid="parent-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              data-testid="open-error-child"
              onClick={() => openForm({ id: 'error', component: ErrorForm, label: 'Error Form' })}
            >
              Open Error Form
            </button>
            <button data-testid="submit-parent" onClick={() => onSubmit(value)}>
              Submit
            </button>
          </div>
        );
      }

      function TestApp() {
        const { openForm } = useFormStack();
        return (
          <button
            data-testid="start"
            onClick={() => openForm({ id: 'parent', component: ParentForm, label: 'Parent' })}
          >
            Start
          </button>
        );
      }

      render(
        <FormStackProvider>
          <TestApp />
        </FormStackProvider>
      );

      // Open parent and set value
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });
      fireEvent.change(screen.getByTestId('parent-input'), {
        target: { value: 'safe-data' },
      });

      // Open error child
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-error-child'));
      });

      // Parent still in DOM (hidden but intact)
      expect(screen.getByTestId('parent-form')).toBeInTheDocument();
      expect(screen.getByTestId('parent-input')).toHaveValue('safe-data');
    });

    it('should make parent visible and active after dismissing error', async () => {
      function ErrorForm(): ReactNode {
        throw new Error('Child form error');
      }

      function ParentForm({ onSubmit }: FormProps<string>) {
        const { openForm } = useFormStack();
        const [value, setValue] = useState('parent-value');

        return (
          <div data-testid="parent-form">
            <input
              data-testid="parent-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              data-testid="open-error-child"
              onClick={() => openForm({ id: 'error', component: ErrorForm, label: 'Error Form' })}
            >
              Open Error Form
            </button>
            <button data-testid="submit-parent" onClick={() => onSubmit(value)}>
              Submit
            </button>
          </div>
        );
      }

      function TestApp() {
        const { openForm, stack } = useFormStack();
        return (
          <div>
            <span data-testid="stack-length">{stack.length}</span>
            <button
              data-testid="start"
              onClick={() => openForm({ id: 'parent', component: ParentForm, label: 'Parent' })}
            >
              Start
            </button>
          </div>
        );
      }

      render(
        <FormStackProvider>
          <TestApp />
        </FormStackProvider>
      );

      // Open parent and set value
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });
      fireEvent.change(screen.getByTestId('parent-input'), {
        target: { value: 'safe-data' },
      });

      // Open error child
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-error-child'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('2');

      // Dismiss error
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
      });

      // Parent visible again with preserved state
      await waitFor(() => {
        expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
      });
      expect(screen.getByTestId('parent-form').parentElement).toHaveStyle('display: block');
      expect(screen.getByTestId('parent-input')).toHaveValue('safe-data');
    });
  });

  describe('retry behavior', () => {
    it('should allow retry to re-render if error condition is cleared', async () => {
      let shouldThrow = true;

      function ControllableErrorForm() {
        if (shouldThrow) {
          throw new Error('Controlled error');
        }
        return <div data-testid="error-form-recovered">Recovered successfully</div>;
      }

      function ParentForm({ onSubmit }: FormProps<string>) {
        const { openForm } = useFormStack();

        return (
          <div data-testid="parent-form">
            <button
              data-testid="open-error-child"
              onClick={() =>
                openForm({ id: 'error', component: ControllableErrorForm, label: 'Error Form' })
              }
            >
              Open Error Form
            </button>
            <button data-testid="submit-parent" onClick={() => onSubmit('done')}>
              Submit
            </button>
          </div>
        );
      }

      function TestApp() {
        const { openForm } = useFormStack();
        return (
          <button
            data-testid="start"
            onClick={() => openForm({ id: 'parent', component: ParentForm, label: 'Parent' })}
          >
            Start
          </button>
        );
      }

      render(
        <FormStackProvider>
          <TestApp />
        </FormStackProvider>
      );

      // Open parent
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });

      // Open error child
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-error-child'));
      });

      // Error should be shown
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Controlled error')).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click retry
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
      });

      // Form should now render successfully
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByTestId('error-form-recovered')).toBeInTheDocument();
    });
  });

  describe('new form after error', () => {
    it('should allow opening new form after error is dismissed', async () => {
      function ErrorForm(): ReactNode {
        throw new Error('First form error');
      }

      function WorkingForm({ onSubmit }: FormProps<string>) {
        return (
          <div data-testid="working-form">
            <button data-testid="submit-working" onClick={() => onSubmit('worked')}>
              Submit Working
            </button>
          </div>
        );
      }

      function ParentForm({ onSubmit }: FormProps<string>) {
        const { openForm } = useFormStack();

        return (
          <div data-testid="parent-form">
            <button
              data-testid="open-error-child"
              onClick={() => openForm({ id: 'error', component: ErrorForm, label: 'Error Form' })}
            >
              Open Error Form
            </button>
            <button
              data-testid="open-working-child"
              onClick={() =>
                openForm({ id: 'working', component: WorkingForm, label: 'Working Form' })
              }
            >
              Open Working Form
            </button>
            <button data-testid="submit-parent" onClick={() => onSubmit('done')}>
              Submit
            </button>
          </div>
        );
      }

      function TestApp() {
        const { openForm, stack } = useFormStack();
        return (
          <div>
            <span data-testid="stack-length">{stack.length}</span>
            <button
              data-testid="start"
              onClick={() => openForm({ id: 'parent', component: ParentForm, label: 'Parent' })}
            >
              Start
            </button>
          </div>
        );
      }

      render(
        <FormStackProvider>
          <TestApp />
        </FormStackProvider>
      );

      // Open parent
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });

      // Open error child
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-error-child'));
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Dismiss error
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
      });

      // Open working child
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-working-child'));
      });

      // Working form should be visible
      expect(screen.getByTestId('working-form')).toBeInTheDocument();
      expect(screen.getByTestId('stack-length')).toHaveTextContent('2');
    });
  });

  describe('sibling form isolation', () => {
    it('should not affect sibling forms when one form errors', async () => {
      function ErrorForm(): ReactNode {
        throw new Error('Sibling error');
      }

      function WorkingForm({ onSubmit, onCancel }: FormProps<string>) {
        const [value, setValue] = useState('working');
        return (
          <div data-testid="working-form">
            <input
              data-testid="working-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button data-testid="submit-working" onClick={() => onSubmit(value)}>
              Submit Working
            </button>
            <button data-testid="cancel-working" onClick={onCancel}>
              Cancel
            </button>
          </div>
        );
      }

      function TestApp() {
        const { openForm, stack } = useFormStack();

        const openWorkingThenError = async () => {
          // Open working form first
          const workingPromise = openForm({
            id: 'working',
            component: WorkingForm,
            label: 'Working Form',
          });

          // Then open error form on top
          await openForm({ id: 'error', component: ErrorForm, label: 'Error Form' });

          return workingPromise;
        };

        return (
          <div>
            <span data-testid="stack-length">{stack.length}</span>
            <button data-testid="open-working" onClick={openWorkingThenError}>
              Open Forms
            </button>
          </div>
        );
      }

      render(
        <FormStackProvider>
          <TestApp />
        </FormStackProvider>
      );

      // Open both forms
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-working'));
      });

      // Error form should show error
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Sibling error')).toBeInTheDocument();

      // Working form should still be in DOM (hidden)
      expect(screen.getByTestId('working-form')).toBeInTheDocument();
      expect(screen.getByTestId('working-input')).toHaveValue('working');

      // Dismiss error
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
      });

      // Working form should now be visible and functional
      await waitFor(() => {
        expect(screen.getByTestId('working-form').parentElement).toHaveStyle('display: block');
      });
      expect(screen.getByTestId('working-input')).toHaveValue('working');

      // Can still interact with working form
      fireEvent.change(screen.getByTestId('working-input'), {
        target: { value: 'still-working' },
      });
      expect(screen.getByTestId('working-input')).toHaveValue('still-working');
    });
  });

  describe('error during stack operations', () => {
    it('should handle error in deeply nested form without affecting ancestors', async () => {
      function ErrorForm(): ReactNode {
        throw new Error('Deep error');
      }

      function Level2Form({ onSubmit }: FormProps<string>) {
        const { openForm } = useFormStack();
        const [value, setValue] = useState('level-2');

        return (
          <div data-testid="level-2-form">
            <input
              data-testid="level-2-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              data-testid="open-error"
              onClick={() => openForm({ id: 'error', component: ErrorForm, label: 'Error' })}
            >
              Open Error
            </button>
            <button data-testid="submit-level-2" onClick={() => onSubmit(value)}>
              Submit
            </button>
          </div>
        );
      }

      function Level1Form({ onSubmit }: FormProps<string>) {
        const { openForm } = useFormStack();
        const [value, setValue] = useState('level-1');

        return (
          <div data-testid="level-1-form">
            <input
              data-testid="level-1-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              data-testid="open-level-2"
              onClick={() =>
                openForm({ id: 'level-2', component: Level2Form, label: 'Level 2' })
              }
            >
              Open Level 2
            </button>
            <button data-testid="submit-level-1" onClick={() => onSubmit(value)}>
              Submit
            </button>
          </div>
        );
      }

      function TestApp() {
        const { openForm, stack } = useFormStack();
        return (
          <div>
            <span data-testid="stack-length">{stack.length}</span>
            <button
              data-testid="start"
              onClick={() =>
                openForm({ id: 'level-1', component: Level1Form, label: 'Level 1' })
              }
            >
              Start
            </button>
          </div>
        );
      }

      render(
        <FormStackProvider>
          <TestApp />
        </FormStackProvider>
      );

      // Open level 1 and set state
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });
      fireEvent.change(screen.getByTestId('level-1-input'), {
        target: { value: 'L1-preserved' },
      });

      // Open level 2 and set state
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-level-2'));
      });
      fireEvent.change(screen.getByTestId('level-2-input'), {
        target: { value: 'L2-preserved' },
      });

      // Open error form (level 3)
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-error'));
      });

      // Error should be shown
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByTestId('stack-length')).toHaveTextContent('3');

      // Ancestors still in DOM with preserved state
      expect(screen.getByTestId('level-1-form')).toBeInTheDocument();
      expect(screen.getByTestId('level-1-input')).toHaveValue('L1-preserved');
      expect(screen.getByTestId('level-2-form')).toBeInTheDocument();
      expect(screen.getByTestId('level-2-input')).toHaveValue('L2-preserved');

      // Dismiss error
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
      });

      // Level 2 should be active with preserved state
      await waitFor(() => {
        expect(screen.getByTestId('stack-length')).toHaveTextContent('2');
      });
      expect(screen.getByTestId('level-2-form').parentElement).toHaveStyle('display: block');
      expect(screen.getByTestId('level-2-input')).toHaveValue('L2-preserved');
    });
  });
});
