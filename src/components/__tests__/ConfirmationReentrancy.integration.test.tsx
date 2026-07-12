import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormStackProvider } from '../FormStackProvider';
import { FormStackViewport } from '../FormStackViewport';
import {
  useFormStackActions,
  useFormStackState,
} from '../../hooks';
import type { FormProps } from '../../types';

// Mock HTMLDialogElement methods for JSDOM (JSDOM lacks showModal/close).
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

// ---- Shared test fixtures --------------------------------------------------

function StubForm({ onSubmit, onCancel }: FormProps<unknown>) {
  return (
    <div data-testid="host-form">
      <button data-testid="stub-submit" onClick={() => onSubmit({ ok: true })}>
        Submit
      </button>
      <button data-testid="stub-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

// An opener that awaits openForm() and reports the settlement to the test.
// Mirrors CapturingOpener from FormStackProvider.autoRender.test.tsx.
function CapturingOpener({
  onResult,
  confirmOnCancel,
}: {
  onResult: (val: unknown) => void;
  confirmOnCancel?: boolean;
}) {
  const { openForm } = useFormStackActions();
  return (
    <button
      data-testid="open"
      onClick={async () => {
        const result = await openForm({
          id: 'f1',
          component: StubForm,
          label: 'F1',
          confirmOnCancel,
        });
        onResult(result);
      }}
    >
      open
    </button>
  );
}

// A host shell that renders the viewport and exposes a host-level close
// (mimics Escape/backdrop/X wired to cancelForm()). Also exposes a
// "double close" button that fires cancelForm() twice in one tick — the
// deterministic repro for the concurrent-cancel re-entrancy bug.
function DualCancelHost({
  children,
  onSettledFirst,
  onSettledSecond,
}: {
  children?: ReactNode;
  onSettledFirst: () => void;
  onSettledSecond: () => void;
}) {
  const { cancelForm } = useFormStackActions();
  const { stack } = useFormStackState();

  const fireOnce = () => {
    void cancelForm().then(onSettledFirst);
  };

  // Fire cancelForm() twice in one synchronous handler. Both promises are
  // tracked independently so the test can assert BOTH settle.
  const fireTwice = () => {
    void cancelForm().then(onSettledFirst);
    void cancelForm().then(onSettledSecond);
  };

  return (
    <div data-testid="host" data-open={stack.length > 0}>
      {children}
      <FormStackViewport />
      <button data-testid="host-close" onClick={fireOnce}>
        Close
      </button>
      <button data-testid="host-close-twice" onClick={fireTwice}>
        Close Twice
      </button>
    </div>
  );
}

// ---- Re-entrancy: concurrent cancel requests coalesce ---------------------

describe('Confirmation re-entrancy (concurrent cancelForm)', () => {
  it('shows exactly ONE dialog for two rapid cancelForm() calls', async () => {
    const onResult = vi.fn();
    const settledFirst = vi.fn();
    const settledSecond = vi.fn();

    render(
      <FormStackProvider autoRender={false}>
        <CapturingOpener onResult={onResult} confirmOnCancel />
        <DualCancelHost
          onSettledFirst={settledFirst}
          onSettledSecond={settledSecond}
        />
      </FormStackProvider>,
    );

    // Open the confirmOnCancel form.
    await act(async () => {
      fireEvent.click(screen.getByTestId('open'));
    });
    expect(screen.getByTestId('host-form')).toBeInTheDocument();

    // Fire cancelForm() twice in one tick.
    await act(async () => {
      fireEvent.click(screen.getByTestId('host-close-twice'));
    });

    // Exactly ONE confirmation dialog (native <dialog> needs { hidden: true }).
    expect(screen.getAllByRole('alertdialog', { hidden: true })).toHaveLength(1);
    expect(screen.getByText('Discard Changes?')).toBeInTheDocument();
  });

  it('Keep Editing settles BOTH cancelForm() promises (form stays open)', async () => {
    const onResult = vi.fn();
    const settledFirst = vi.fn();
    const settledSecond = vi.fn();

    render(
      <FormStackProvider autoRender={false}>
        <CapturingOpener onResult={onResult} confirmOnCancel />
        <DualCancelHost
          onSettledFirst={settledFirst}
          onSettledSecond={settledSecond}
        />
      </FormStackProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('open'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('host-close-twice'));
    });

    expect(screen.getByRole('alertdialog', { hidden: true })).toBeInTheDocument();

    // Neither promise has settled yet.
    expect(settledFirst).not.toHaveBeenCalled();
    expect(settledSecond).not.toHaveBeenCalled();

    // A single "Keep Editing" click must settle BOTH tracked promises.
    await act(async () => {
      fireEvent.click(screen.getByText('Keep Editing'));
    });

    await waitFor(() => {
      expect(settledFirst).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(settledSecond).toHaveBeenCalledTimes(1);
    });

    // Dialog closed; form still mounted; openForm() still pending.
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByTestId('host-form')).toBeInTheDocument();
    expect(onResult).not.toHaveBeenCalled();
  });

  it('Discard settles BOTH and clears the stack (openForm resolves undefined)', async () => {
    const onResult = vi.fn();
    const settledFirst = vi.fn();
    const settledSecond = vi.fn();

    render(
      <FormStackProvider autoRender={false}>
        <CapturingOpener onResult={onResult} confirmOnCancel />
        <DualCancelHost
          onSettledFirst={settledFirst}
          onSettledSecond={settledSecond}
        />
      </FormStackProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('open'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('host-close-twice'));
    });

    expect(screen.getByRole('alertdialog', { hidden: true })).toBeInTheDocument();

    // A single "Discard" click must settle BOTH tracked promises AND openForm().
    await act(async () => {
      fireEvent.click(screen.getByText('Discard'));
    });

    await waitFor(() => {
      expect(settledFirst).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(settledSecond).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(undefined);
    });

    // Stack cleared; dialog gone.
    expect(screen.queryByTestId('host-form')).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  // ---- Regression: single-request path unchanged ------------------------

  it('regression: a single cancelForm() still behaves as before', async () => {
    const onResult = vi.fn();
    const settledFirst = vi.fn();
    const settledSecond = vi.fn();

    render(
      <FormStackProvider autoRender={false}>
        <CapturingOpener onResult={onResult} confirmOnCancel />
        <DualCancelHost
          onSettledFirst={settledFirst}
          onSettledSecond={settledSecond}
        />
      </FormStackProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('open'));
    });

    // Single cancel → one dialog, one tracked waiter.
    await act(async () => {
      fireEvent.click(screen.getByTestId('host-close'));
    });

    expect(screen.getAllByRole('alertdialog', { hidden: true })).toHaveLength(1);
    expect(settledFirst).not.toHaveBeenCalled();

    // Keep Editing leaves the form open (regression of the reject path).
    await act(async () => {
      fireEvent.click(screen.getByText('Keep Editing'));
    });

    await waitFor(() => {
      expect(settledFirst).toHaveBeenCalledTimes(1);
    });
    expect(settledSecond).not.toHaveBeenCalled();
    expect(screen.getByTestId('host-form')).toBeInTheDocument();

    // A second single cancel → Discard now clears the form.
    await act(async () => {
      fireEvent.click(screen.getByTestId('host-close'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Discard'));
    });

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(undefined);
    });
    expect(screen.queryByTestId('host-form')).toBeNull();
  });
});
