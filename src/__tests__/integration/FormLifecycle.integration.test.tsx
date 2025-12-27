import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { FormStackProvider } from '../../components/FormStackProvider';
import { useFormStack } from '../../hooks';
import type { FormProps } from '../../types';
import { StatefulTestForm, SimpleTestForm } from './test-utils';

/**
 * Test consumer that opens forms and tracks results.
 */
function TestConsumer({ onResult }: { onResult: (val: unknown) => void }) {
  const { openForm, stack } = useFormStack();

  const handleOpen = async () => {
    const result = await openForm({
      id: 'test-form',
      component: (props: FormProps<{ value: string }>) => (
        <StatefulTestForm {...props} formId="test" />
      ),
      label: 'Test Form',
    });
    onResult(result);
  };

  return (
    <div>
      <span data-testid="stack-length">{stack.length}</span>
      <button data-testid="open-form" onClick={handleOpen}>
        Open
      </button>
    </div>
  );
}

/**
 * Test consumer for simple form tests.
 */
function SimpleTestConsumer({ onResult }: { onResult: (val: unknown) => void }) {
  const { openForm, stack } = useFormStack();

  const handleOpen = async () => {
    const result = await openForm({
      id: 'simple-form',
      component: SimpleTestForm,
      label: 'Simple Form',
    });
    onResult(result);
  };

  return (
    <div>
      <span data-testid="stack-length">{stack.length}</span>
      <button data-testid="open-form" onClick={handleOpen}>
        Open
      </button>
    </div>
  );
}

describe('FormLifecycle Integration', () => {
  describe('openForm lifecycle', () => {
    it('should add form to stack when openForm is called', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <TestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      expect(screen.getByTestId('stack-length')).toHaveTextContent('0');

      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
      expect(screen.getByTestId('form-test')).toBeInTheDocument();
    });

    it('should resolve promise with value on submit', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <TestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Open form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      // Enter value and submit
      fireEvent.change(screen.getByTestId('input-test'), {
        target: { value: 'test-value' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-test'));
      });

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith({ value: 'test-value' });
      });
      expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
    });

    it('should resolve promise with undefined on cancel', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <SimpleTestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Open form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

      // Cancel form
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-simple'));
      });

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(undefined);
      });
      expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
    });

    it('should remove form from stack after submit', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <SimpleTestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Open form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

      // Submit form
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-simple'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
      });
      expect(screen.queryByTestId('simple-form')).not.toBeInTheDocument();
    });

    it('should remove form from stack after cancel', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <SimpleTestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Open form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

      // Cancel form
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-simple'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
      });
      expect(screen.queryByTestId('simple-form')).not.toBeInTheDocument();
    });

    it('should handle multiple sequential opens correctly', async () => {
      const results: unknown[] = [];

      function MultiOpenConsumer() {
        const { openForm, stack } = useFormStack();

        const handleOpen = async (id: number) => {
          const result = await openForm({
            id: `form-${id}`,
            component: (props: FormProps<string>) => (
              <div data-testid={`form-${id}`}>
                <button
                  data-testid={`submit-${id}`}
                  onClick={() => props.onSubmit(`result-${id}`)}
                >
                  Submit
                </button>
              </div>
            ),
            label: `Form ${id}`,
          });
          results.push(result);
        };

        return (
          <div>
            <span data-testid="stack-length">{stack.length}</span>
            <button data-testid="open-1" onClick={() => handleOpen(1)}>
              Open 1
            </button>
            <button data-testid="open-2" onClick={() => handleOpen(2)}>
              Open 2
            </button>
          </div>
        );
      }

      render(
        <FormStackProvider>
          <MultiOpenConsumer />
        </FormStackProvider>
      );

      // Open first form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-1'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
      expect(screen.getByTestId('form-1')).toBeInTheDocument();

      // Submit first form
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-1'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
      });

      // Open second form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-2'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
      expect(screen.getByTestId('form-2')).toBeInTheDocument();

      // Submit second form
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-2'));
      });

      await waitFor(() => {
        expect(results).toEqual(['result-1', 'result-2']);
      });
    });
  });

  describe('form visibility', () => {
    it('should only show the active form', async () => {
      const onResult = vi.fn();

      render(
        <FormStackProvider>
          <TestConsumer onResult={onResult} />
        </FormStackProvider>
      );

      // Initially no forms visible
      expect(screen.queryByTestId('form-test')).not.toBeInTheDocument();

      // Open form
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-form'));
      });

      // Form is visible
      const form = screen.getByTestId('form-test');
      expect(form).toBeInTheDocument();
      expect(form.parentElement).toHaveStyle('display: block');
    });
  });
});
