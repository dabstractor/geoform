import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { FormStackProvider } from '../../components/FormStackProvider';
import { useFormStack } from '../../hooks';
import type { FormProps } from '../../types';

describe('StatePreservation Integration', () => {
  describe('parent input value preservation', () => {
    it('should preserve parent input value when child opens', async () => {
      function ChildForm({ onSubmit }: FormProps<string>) {
        return (
          <div data-testid="child-form">
            <button data-testid="submit-child" onClick={() => onSubmit('child-result')}>
              Submit Child
            </button>
          </div>
        );
      }

      function ParentForm({ onSubmit }: FormProps<string>) {
        const { openForm } = useFormStack();
        const [parentValue, setParentValue] = useState('');

        const handleOpenChild = async () => {
          await openForm({
            id: 'child',
            component: ChildForm,
            label: 'Child',
          });
        };

        return (
          <div data-testid="parent-form">
            <input
              data-testid="parent-input"
              value={parentValue}
              onChange={(e) => setParentValue(e.target.value)}
            />
            <button data-testid="open-child" onClick={handleOpenChild}>
              Open Child
            </button>
            <button data-testid="submit-parent" onClick={() => onSubmit(parentValue)}>
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

      // Type in parent input
      fireEvent.change(screen.getByTestId('parent-input'), {
        target: { value: 'parent-data' },
      });

      expect(screen.getByTestId('parent-input')).toHaveValue('parent-data');

      // Open child
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-child'));
      });

      // Parent should still be in DOM with value preserved
      expect(screen.getByTestId('parent-form')).toBeInTheDocument();
      expect(screen.getByTestId('parent-input')).toHaveValue('parent-data');

      // Parent should be hidden, child visible
      expect(screen.getByTestId('parent-form').parentElement).toHaveStyle('display: none');
      expect(screen.getByTestId('child-form').parentElement).toHaveStyle('display: block');
    });

    it('should preserve parent input value after child submits', async () => {
      function ChildForm({ onSubmit }: FormProps<string>) {
        return (
          <div data-testid="child-form">
            <button data-testid="submit-child" onClick={() => onSubmit('child-result')}>
              Submit Child
            </button>
          </div>
        );
      }

      function ParentForm({ onSubmit }: FormProps<string>) {
        const { openForm } = useFormStack();
        const [parentValue, setParentValue] = useState('');

        return (
          <div data-testid="parent-form">
            <input
              data-testid="parent-input"
              value={parentValue}
              onChange={(e) => setParentValue(e.target.value)}
            />
            <button
              data-testid="open-child"
              onClick={() =>
                openForm({
                  id: 'child',
                  component: ChildForm,
                  label: 'Child',
                })
              }
            >
              Open Child
            </button>
            <button data-testid="submit-parent" onClick={() => onSubmit(parentValue)}>
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

      // Open parent and enter data
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });

      fireEvent.change(screen.getByTestId('parent-input'), {
        target: { value: 'parent-data' },
      });

      // Open child
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-child'));
      });

      // Submit child
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-child'));
      });

      // Parent should be visible again with preserved value
      await waitFor(() => {
        expect(screen.getByTestId('parent-form').parentElement).toHaveStyle('display: block');
      });
      expect(screen.getByTestId('parent-input')).toHaveValue('parent-data');
    });

    it('should preserve parent input value after child cancels', async () => {
      function ChildForm({ onCancel }: FormProps<string>) {
        return (
          <div data-testid="child-form">
            <button data-testid="cancel-child" onClick={onCancel}>
              Cancel Child
            </button>
          </div>
        );
      }

      function ParentForm({ onSubmit }: FormProps<string>) {
        const { openForm } = useFormStack();
        const [parentValue, setParentValue] = useState('');

        return (
          <div data-testid="parent-form">
            <input
              data-testid="parent-input"
              value={parentValue}
              onChange={(e) => setParentValue(e.target.value)}
            />
            <button
              data-testid="open-child"
              onClick={() =>
                openForm({
                  id: 'child',
                  component: ChildForm,
                  label: 'Child',
                })
              }
            >
              Open Child
            </button>
            <button data-testid="submit-parent" onClick={() => onSubmit(parentValue)}>
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

      // Open parent and enter data
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });

      fireEvent.change(screen.getByTestId('parent-input'), {
        target: { value: 'parent-data' },
      });

      // Open and cancel child
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-child'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-child'));
      });

      // Parent should be visible again with preserved value
      await waitFor(() => {
        expect(screen.getByTestId('parent-form').parentElement).toHaveStyle('display: block');
      });
      expect(screen.getByTestId('parent-input')).toHaveValue('parent-data');
    });
  });

  describe('parent useState preservation', () => {
    it('should preserve parent useState state across child lifecycle', async () => {
      function ChildForm({ onSubmit }: FormProps<{ childValue: string }>) {
        const [childInput, setChildInput] = useState('');

        return (
          <div data-testid="child-form">
            <input
              data-testid="child-input"
              value={childInput}
              onChange={(e) => setChildInput(e.target.value)}
            />
            <button
              data-testid="submit-child"
              onClick={() => onSubmit({ childValue: childInput })}
            >
              Submit Child
            </button>
          </div>
        );
      }

      function ParentForm({ onSubmit }: FormProps<{ parentValue: string; counter: number }>) {
        const { openForm } = useFormStack();
        const [parentValue, setParentValue] = useState('');
        const [counter, setCounter] = useState(0);

        return (
          <div data-testid="parent-form">
            <input
              data-testid="parent-input"
              value={parentValue}
              onChange={(e) => setParentValue(e.target.value)}
            />
            <span data-testid="counter">{counter}</span>
            <button data-testid="increment" onClick={() => setCounter((c) => c + 1)}>
              Increment
            </button>
            <button
              data-testid="open-child"
              onClick={() =>
                openForm({
                  id: 'child',
                  component: ChildForm,
                  label: 'Child',
                })
              }
            >
              Open Child
            </button>
            <button
              data-testid="submit-parent"
              onClick={() => onSubmit({ parentValue, counter })}
            >
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

      // Set up parent state
      fireEvent.change(screen.getByTestId('parent-input'), {
        target: { value: 'parent-data' },
      });
      fireEvent.click(screen.getByTestId('increment'));
      fireEvent.click(screen.getByTestId('increment'));
      fireEvent.click(screen.getByTestId('increment'));

      expect(screen.getByTestId('parent-input')).toHaveValue('parent-data');
      expect(screen.getByTestId('counter')).toHaveTextContent('3');

      // Open child
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-child'));
      });

      // Submit child
      fireEvent.change(screen.getByTestId('child-input'), {
        target: { value: 'child-data' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-child'));
      });

      // Parent state should be preserved
      await waitFor(() => {
        expect(screen.getByTestId('parent-form').parentElement).toHaveStyle('display: block');
      });
      expect(screen.getByTestId('parent-input')).toHaveValue('parent-data');
      expect(screen.getByTestId('counter')).toHaveTextContent('3');
    });
  });

  describe('parent receives child value', () => {
    it('should update parent with child result after child submits', async () => {
      function ChildForm({ onSubmit }: FormProps<{ childValue: string }>) {
        const [childInput, setChildInput] = useState('');

        return (
          <div data-testid="child-form">
            <input
              data-testid="child-input"
              value={childInput}
              onChange={(e) => setChildInput(e.target.value)}
            />
            <button
              data-testid="submit-child"
              onClick={() => onSubmit({ childValue: childInput })}
            >
              Submit Child
            </button>
          </div>
        );
      }

      function ParentForm({ onSubmit }: FormProps<{ parentValue: string; childResult: unknown }>) {
        const { openForm } = useFormStack();
        const [parentValue, setParentValue] = useState('');
        const [childResult, setChildResult] = useState<unknown>(undefined);

        const handleOpenChild = async () => {
          const result = await openForm({
            id: 'child',
            component: ChildForm,
            label: 'Child',
          });
          setChildResult(result);
        };

        return (
          <div data-testid="parent-form">
            <input
              data-testid="parent-input"
              value={parentValue}
              onChange={(e) => setParentValue(e.target.value)}
            />
            <span data-testid="child-result">
              {childResult !== undefined ? JSON.stringify(childResult) : 'no-result'}
            </span>
            <button data-testid="open-child" onClick={handleOpenChild}>
              Open Child
            </button>
            <button
              data-testid="submit-parent"
              onClick={() => onSubmit({ parentValue, childResult })}
            >
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

      fireEvent.change(screen.getByTestId('parent-input'), {
        target: { value: 'parent-data' },
      });

      // Initial child result
      expect(screen.getByTestId('child-result')).toHaveTextContent('no-result');

      // Open child and submit with value
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-child'));
      });

      fireEvent.change(screen.getByTestId('child-input'), {
        target: { value: 'child-submitted-value' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-child'));
      });

      // Parent should now have child result
      await waitFor(() => {
        expect(screen.getByTestId('child-result')).toHaveTextContent(
          '{"childValue":"child-submitted-value"}'
        );
      });

      // Parent input still preserved
      expect(screen.getByTestId('parent-input')).toHaveValue('parent-data');
    });
  });
});
