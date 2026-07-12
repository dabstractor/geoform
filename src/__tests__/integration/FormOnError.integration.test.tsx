import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FormStackProvider } from '../../components/FormStackProvider';
import { useFormStack } from '../../hooks';
import type { FormProps } from '../../types';

describe('FormOnError Integration', () => {
  // Suppress console.error for expected errors (handleError logs; RTL/React may too)
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('routes form-invoked onError to the boundary: no reject, no unhandledRejection, stack unchanged', async () => {
    // Track unhandled rejections (defense-in-depth)
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);

    // Form that calls onError on click
    function ErrorCallingForm({ onError }: FormProps<string>): ReactNode {
      return (
        <div data-testid="error-calling-form">
          <button data-testid="fire-onerror" onClick={() => onError!(new Error('boom'))}>
            Fire Error
          </button>
        </div>
      );
    }

    let settled: 'resolved' | 'rejected' | undefined;
    function TestApp() {
      const { openForm, stack } = useFormStack();
      const start = async () => {
        const p = openForm({ id: 'error-form', component: ErrorCallingForm, label: 'Error Form' });
        // Track settlement (also makes the promise "handled" → deterministic)
        p.then(
          () => {
            settled = 'resolved';
          },
          () => {
            settled = 'rejected';
          }
        );
      };
      return (
        <div>
          <span data-testid="stack-length">{stack.length}</span>
          <button data-testid="start" onClick={start}>
            Start
          </button>
        </div>
      );
    }

    try {
      render(
        <FormStackProvider>
          <TestApp />
        </FormStackProvider>
      );

      // Open the form
      await act(async () => {
        fireEvent.click(screen.getByTestId('start'));
      });
      expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

      // Fire the form-invoked onError
      await act(async () => {
        fireEvent.click(screen.getByTestId('fire-onerror'));
      });
      // Flush microtasks so any latent rejection/unhandledRejection would surface
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      // Contract assertions (PRD §5.2/§6/§9)
      expect(settled).toBeUndefined(); // neither resolved nor rejected
      expect(unhandled).toHaveLength(0); // no unhandled rejection
      expect(screen.getByTestId('stack-length')).toHaveTextContent('1'); // stack unchanged
      expect(screen.getByRole('alert')).toBeInTheDocument(); // boundary fallback visible
      expect(screen.getByText('boom')).toBeInTheDocument();
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('clears the boundary fallback on Retry (form remounts, deferred still pending)', async () => {
    function ErrorCallingForm({ onError }: FormProps<string>): ReactNode {
      return (
        <div data-testid="error-calling-form">
          <button data-testid="fire-onerror" onClick={() => onError!(new Error('boom'))}>
            Fire Error
          </button>
        </div>
      );
    }

    let settled: 'resolved' | 'rejected' | undefined;
    function TestApp() {
      const { openForm, stack } = useFormStack();
      const start = async () => {
        const p = openForm({ id: 'error-form', component: ErrorCallingForm, label: 'Error Form' });
        p.then(
          () => {
            settled = 'resolved';
          },
          () => {
            settled = 'rejected';
          }
        );
      };
      return (
        <div>
          <span data-testid="stack-length">{stack.length}</span>
          <button data-testid="start" onClick={start}>
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

    await act(async () => {
      fireEvent.click(screen.getByTestId('start'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('fire-onerror'));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Click Retry — fallback clears, form remounts, deferred still pending
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('error-calling-form')).toBeInTheDocument();
    expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
    expect(settled).toBeUndefined();
  });

  it('resolves the form (cancel) on Dismiss after a form-invoked onError', async () => {
    function ErrorCallingForm({ onError }: FormProps<string>): ReactNode {
      return (
        <div data-testid="error-calling-form">
          <button data-testid="fire-onerror" onClick={() => onError!(new Error('boom'))}>
            Fire Error
          </button>
        </div>
      );
    }

    let settled: 'resolved' | 'rejected' | undefined;
    let resolvedValue: unknown = 'unset';
    function TestApp() {
      const { openForm, stack } = useFormStack();
      const start = async () => {
        const p = openForm({ id: 'error-form', component: ErrorCallingForm, label: 'Error Form' });
        p.then((v) => {
          resolvedValue = v;
          settled = 'resolved';
        });
      };
      return (
        <div>
          <span data-testid="stack-length">{stack.length}</span>
          <button data-testid="start" onClick={start}>
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

    await act(async () => {
      fireEvent.click(screen.getByTestId('start'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('fire-onerror'));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Click Dismiss — cancel semantics: resolves undefined, pops the stack
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    });

    expect(settled).toBe('resolved');
    expect(resolvedValue).toBeUndefined();
    expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
  });
});
