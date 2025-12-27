import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { FormStackProvider } from '../../components/FormStackProvider';
import { useFormStack } from '../../hooks';
import type { FormProps } from '../../types';

/**
 * A form component that can open the next level in a chain.
 * Used to create 3-level deep nesting for integration tests.
 */
function LevelForm({
  onSubmit,
  onCancel,
  level,
  maxLevel,
  onResultCapture,
}: FormProps<{ value: string; childResult?: unknown }> & {
  level: number;
  maxLevel: number;
  onResultCapture?: (level: number, result: unknown) => void;
}) {
  const { openForm, stack } = useFormStack();
  const [value, setValue] = useState(`initial-level-${level}`);
  const [childResult, setChildResult] = useState<unknown>(undefined);

  const handleOpenNext = async () => {
    const nextLevel = level + 1;
    const result = await openForm({
      id: `level-${nextLevel}`,
      label: `Level ${nextLevel}`,
      component: (props: FormProps<{ value: string; childResult?: unknown }>) => (
        <LevelForm
          {...props}
          level={nextLevel}
          maxLevel={maxLevel}
          onResultCapture={onResultCapture}
        />
      ),
    });
    setChildResult(result);
    onResultCapture?.(nextLevel, result);
  };

  return (
    <div data-testid={`form-level-${level}`}>
      <input
        data-testid={`input-level-${level}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <span data-testid="current-stack-depth">{stack.length}</span>
      <span data-testid={`child-result-level-${level}`}>
        {childResult !== undefined ? JSON.stringify(childResult) : 'no-child-result'}
      </span>
      {level < maxLevel && (
        <button data-testid={`open-next-level-${level}`} onClick={handleOpenNext}>
          Open Level {level + 1}
        </button>
      )}
      <button
        data-testid={`submit-level-${level}`}
        onClick={() => onSubmit({ value, childResult })}
      >
        Submit
      </button>
      <button data-testid={`cancel-level-${level}`} onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

describe('DeepNesting Integration', () => {
  describe('3-level deep nesting', () => {
    it('should create stack of 3 forms when opening A -> B -> C', async () => {
      const capturedResults: Record<number, unknown> = {};

      function TestApp() {
        const { openForm, stack } = useFormStack();

        return (
          <div>
            <span data-testid="stack-length">{stack.length}</span>
            <button
              data-testid="start"
              onClick={() =>
                openForm({
                  id: 'level-1',
                  label: 'Level 1',
                  component: (props: FormProps<{ value: string; childResult?: unknown }>) => (
                    <LevelForm
                      {...props}
                      level={1}
                      maxLevel={3}
                      onResultCapture={(level, result) => {
                        capturedResults[level] = result;
                      }}
                    />
                  ),
                })
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

      // Open level 1
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
      expect(screen.getByTestId('form-level-1')).toBeInTheDocument();

      // Open level 2
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-1'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('2');
      expect(screen.getByTestId('form-level-2')).toBeInTheDocument();

      // Open level 3
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-2'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('3');
      expect(screen.getByTestId('form-level-3')).toBeInTheDocument();
    });

    it('should preserve all 3 forms in DOM (hidden container pattern)', async () => {
      function TestApp() {
        const { openForm } = useFormStack();

        return (
          <button
            data-testid="start"
            onClick={() =>
              openForm({
                id: 'level-1',
                label: 'Level 1',
                component: (props: FormProps<{ value: string }>) => (
                  <LevelForm {...props} level={1} maxLevel={3} />
                ),
              })
            }
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

      // Open all 3 levels
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-2'));
      });

      // All 3 forms should be in DOM
      expect(screen.getByTestId('form-level-1')).toBeInTheDocument();
      expect(screen.getByTestId('form-level-2')).toBeInTheDocument();
      expect(screen.getByTestId('form-level-3')).toBeInTheDocument();
    });

    it('should show only level 3 visible, levels 1 and 2 hidden', async () => {
      function TestApp() {
        const { openForm } = useFormStack();

        return (
          <button
            data-testid="start"
            onClick={() =>
              openForm({
                id: 'level-1',
                label: 'Level 1',
                component: (props: FormProps<{ value: string }>) => (
                  <LevelForm {...props} level={1} maxLevel={3} />
                ),
              })
            }
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

      // Open all 3 levels
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-2'));
      });

      // Level 1 and 2 hidden, Level 3 visible
      expect(screen.getByTestId('form-level-1').parentElement).toHaveStyle('display: none');
      expect(screen.getByTestId('form-level-2').parentElement).toHaveStyle('display: none');
      expect(screen.getByTestId('form-level-3').parentElement).toHaveStyle('display: block');
    });

    it('should return value to level 2 when level 3 submits, with level 1 state preserved', async () => {
      function TestApp() {
        const { openForm } = useFormStack();

        return (
          <button
            data-testid="start"
            onClick={() =>
              openForm({
                id: 'level-1',
                label: 'Level 1',
                component: (props: FormProps<{ value: string }>) => (
                  <LevelForm {...props} level={1} maxLevel={3} />
                ),
              })
            }
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

      // Open level 1 and modify state
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });
      fireEvent.change(screen.getByTestId('input-level-1'), {
        target: { value: 'L1-custom-data' },
      });

      // Open level 2 and modify state
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-1'));
      });
      fireEvent.change(screen.getByTestId('input-level-2'), {
        target: { value: 'L2-custom-data' },
      });

      // Open level 3 and modify state
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-2'));
      });
      fireEvent.change(screen.getByTestId('input-level-3'), {
        target: { value: 'L3-custom-data' },
      });

      // Submit level 3
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-level-3'));
      });

      // Level 2 should be visible with preserved state and child result
      await waitFor(() => {
        expect(screen.getByTestId('form-level-2').parentElement).toHaveStyle('display: block');
      });
      expect(screen.getByTestId('input-level-2')).toHaveValue('L2-custom-data');
      expect(screen.getByTestId('child-result-level-2')).toHaveTextContent('L3-custom-data');

      // Level 1 should still be hidden but with preserved state
      expect(screen.getByTestId('form-level-1').parentElement).toHaveStyle('display: none');
      expect(screen.getByTestId('input-level-1')).toHaveValue('L1-custom-data');
    });

    it('should show level 2 visible, level 1 hidden after level 3 submits', async () => {
      function TestApp() {
        const { openForm, stack } = useFormStack();

        return (
          <div>
            <span data-testid="stack-length">{stack.length}</span>
            <button
              data-testid="start"
              onClick={() =>
                openForm({
                  id: 'level-1',
                  label: 'Level 1',
                  component: (props: FormProps<{ value: string }>) => (
                    <LevelForm {...props} level={1} maxLevel={3} />
                  ),
                })
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

      // Open all 3 levels
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-2'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('3');

      // Submit level 3
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-level-3'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('stack-length')).toHaveTextContent('2');
      });

      // Level 2 visible, Level 1 hidden
      expect(screen.getByTestId('form-level-2').parentElement).toHaveStyle('display: block');
      expect(screen.getByTestId('form-level-1').parentElement).toHaveStyle('display: none');
    });

    it('should show level 1 visible with original state after both level 2 and 3 submit', async () => {
      function TestApp() {
        const { openForm, stack } = useFormStack();

        return (
          <div>
            <span data-testid="stack-length">{stack.length}</span>
            <button
              data-testid="start"
              onClick={() =>
                openForm({
                  id: 'level-1',
                  label: 'Level 1',
                  component: (props: FormProps<{ value: string }>) => (
                    <LevelForm {...props} level={1} maxLevel={3} />
                  ),
                })
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
      fireEvent.change(screen.getByTestId('input-level-1'), {
        target: { value: 'L1-preserved' },
      });

      // Open level 2
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-1'));
      });

      // Open level 3
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-2'));
      });

      // Submit level 3
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-level-3'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('stack-length')).toHaveTextContent('2');
      });

      // Submit level 2
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-level-2'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
      });

      // Level 1 visible with preserved state
      expect(screen.getByTestId('form-level-1').parentElement).toHaveStyle('display: block');
      expect(screen.getByTestId('input-level-1')).toHaveValue('L1-preserved');
    });

    it('should resolve with undefined when cancel is clicked at any level', async () => {
      const capturedResults: Record<number, unknown> = {};

      function TestApp() {
        const { openForm, stack } = useFormStack();

        return (
          <div>
            <span data-testid="stack-length">{stack.length}</span>
            <button
              data-testid="start"
              onClick={() =>
                openForm({
                  id: 'level-1',
                  label: 'Level 1',
                  component: (props: FormProps<{ value: string }>) => (
                    <LevelForm
                      {...props}
                      level={1}
                      maxLevel={3}
                      onResultCapture={(level, result) => {
                        capturedResults[level] = result;
                      }}
                    />
                  ),
                })
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

      // Open all 3 levels
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-next-level-2'));
      });

      expect(screen.getByTestId('stack-length')).toHaveTextContent('3');

      // Cancel level 3 (instead of submit)
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-level-3'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('stack-length')).toHaveTextContent('2');
      });

      // Level 2 should have received undefined from level 3
      expect(screen.getByTestId('child-result-level-2')).toHaveTextContent('no-child-result');
    });
  });
});
