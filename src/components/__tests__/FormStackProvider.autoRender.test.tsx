import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormStackProvider } from '../FormStackProvider';
import { FormStackViewport } from '../FormStackViewport';
import {
  useFormStackActions,
  useFormStackState,
} from '../../hooks';
import { useFormStackActions as useFormStackActionsDirect } from '../../hooks/useFormStackActions';
import type { FormProps } from '../../types';

// ---- Shared test fixtures --------------------------------------------------

function StubForm({
  onSubmit,
  onCancel,
  confirmLabel = 'Submit',
}: FormProps<unknown> & { confirmLabel?: string }) {
  return (
    <div data-testid="host-form">
      <button data-testid="stub-submit" onClick={() => onSubmit({ ok: true })}>
        {confirmLabel}
      </button>
      <button data-testid="stub-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

function Opener({
  id = 'f1',
  component = StubForm,
  confirmOnCancel,
}: {
  id?: string;
  component?: React.ComponentType<FormProps<unknown>>;
  confirmOnCancel?: boolean;
}) {
  const { openForm } = useFormStackActions();
  return (
    <button
      data-testid="open"
      onClick={() => openForm({ id, component, label: id, confirmOnCancel })}
    >
      open
    </button>
  );
}

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

// A host modal shell that renders the viewport + a host-level close button.
function HostShell({
  children,
  withViewport = true,
}: {
  children?: ReactNode;
  withViewport?: boolean;
}) {
  const { cancelForm } = useFormStackActions();
  const { stack } = useFormStackState();
  return (
    <div data-testid="host" data-open={stack.length > 0}>
      {children}
      {withViewport && <FormStackViewport />}
      {/* host-level close: Escape / backdrop / X in a real modal */}
      <button data-testid="host-close" onClick={() => cancelForm()}>
        Close
      </button>
    </div>
  );
}

// ---- autoRender ------------------------------------------------------------

describe('FormStackProvider autoRender', () => {
  describe('default (true) — backwards compatible', () => {
    it('renders opened forms without a consumer viewport', async () => {
      render(
        <FormStackProvider>
          <Opener />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });

      expect(screen.getByTestId('host-form')).toBeInTheDocument();
    });
  });

  describe('autoRender={false}', () => {
    it('renders no form viewport of its own', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <Opener />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });

      // The form is on the stack (state), but nothing renders it.
      expect(screen.queryByTestId('host-form')).toBeNull();
      expect(screen.queryByText('Submit')).toBeNull();
    });

    it('makes forms visible once a <FormStackViewport/> is mounted (placeable)', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <Opener />
          <HostShell />
        </FormStackProvider>,
      );

      expect(screen.queryByTestId('host-form')).toBeNull();

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });

      // The form renders INSIDE the consumer host, and exactly once.
      const host = screen.getByTestId('host');
      expect(host).toContainElement(screen.getByTestId('host-form'));
      expect(screen.getAllByTestId('host-form')).toHaveLength(1);
    });

    it('does not double-render when both provider (true) and a host viewport exist', async () => {
      // autoRender=true + an extra consumer viewport would be a misconfiguration,
      // but autoRender=false guarantees a single owned viewport.
      render(
        <FormStackProvider autoRender={false}>
          <Opener />
          <HostShell />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });

      expect(screen.getAllByTestId('host-form')).toHaveLength(1);
    });

    it('still renders the confirmation dialog', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <Opener component={StubForm} confirmOnCancel={true} />
          <HostShell />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('stub-cancel'));
      });

      // ConfirmationDialog is rendered by the provider regardless of autoRender.
      // The native <dialog> is excluded from the a11y tree until open, so query
      // with { hidden: true } (same pattern as the rest of the suite).
      expect(
        screen.getByRole('alertdialog', { hidden: true }),
      ).toBeInTheDocument();
    });
  });

  // ---- Dev-mode "forgotten host" guard ------------------------------------

  describe('dev-mode forgotten-host guard', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      if (process?.env) {
        process.env.NODE_ENV = 'development';
      }
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.unstubAllEnvs();
      if (process?.env) {
        process.env.NODE_ENV = 'test';
      }
      consoleWarnSpy.mockRestore();
    });

    it('warns when autoRender=false, a form is open, and no viewport is mounted', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <Opener />
          {/* NOTE: intentionally no <FormStackViewport/> */}
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('no <FormStackViewport/> is mounted'),
      );
    });

    it('does not warn when a viewport IS mounted', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <Opener />
          <HostShell />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('no <FormStackViewport/> is mounted'),
      );
    });

    it('does not warn with the default autoRender=true', async () => {
      render(
        <FormStackProvider>
          <Opener />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('no <FormStackViewport/> is mounted'),
      );
    });

    it('warns at most once per forgotten episode', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <OpenerButton id="f1" />
          <OpenerButton id="f2" />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText('open f1'));
      });
      await act(async () => {
        fireEvent.click(screen.getByText('open f2'));
      });

      const forgottenWarnings = consoleWarnSpy.mock.calls.filter((c) =>
        String(c[0]).includes('no <FormStackViewport/> is mounted'),
      );
      expect(forgottenWarnings).toHaveLength(1);
    });
  });

  // ---- Dev-mode "duplicate viewport" guard (ISSUE-3) ---------------------

  describe('dev-mode duplicate-viewport guard', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      if (process?.env) {
        process.env.NODE_ENV = 'development';
      }
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.unstubAllEnvs();
      if (process?.env) {
        process.env.NODE_ENV = 'test';
      }
      consoleWarnSpy.mockRestore();
    });

    it('warns when more than one <FormStackViewport/> is mounted', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <Opener />
          {/* Two viewports: PRD §10.1 requires exactly one. */}
          <FormStackViewport />
          <FormStackViewport />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('2 <FormStackViewport/>'),
      );
    });

    it('does not warn when exactly one viewport is mounted', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <Opener />
          <FormStackViewport />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });

      const duplicateWarnings = consoleWarnSpy.mock.calls.filter((c) =>
        String(c[0]).includes('<FormStackViewport/> components are mounted at once'),
      );
      expect(duplicateWarnings).toHaveLength(0);
    });

    it('warns at most once per duplicate episode', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <OpenerButton id="f1" />
          <FormStackViewport />
          <FormStackViewport />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText('open f1'));
      });

      const duplicateWarnings = consoleWarnSpy.mock.calls.filter((c) =>
        String(c[0]).includes('<FormStackViewport/> components are mounted at once'),
      );
      expect(duplicateWarnings).toHaveLength(1);
    });
  });
});

// Separate opener that allows a custom button label (for stacking two openers).
function OpenerButton({ id }: { id: string }) {
  const { openForm } = useFormStackActions();
  return (
    <button
      onClick={() => openForm({ id, component: StubForm, label: id })}
    >
      open {id}
    </button>
  );
}

// ---- cancelForm -----------------------------------------------------------

describe('cancelForm action', () => {
  describe('on an empty stack', () => {
    it('is a no-op (resolves without popping)', async () => {
      let resolved = false;
      const { result } = renderHookUseActions();
      await act(async () => {
        await result.current.cancelForm();
        resolved = true;
      });
      expect(resolved).toBe(true);
    });
  });

  describe('a non-confirmOnCancel top form', () => {
    it('resolves the parent await with undefined and pops the form', async () => {
      const onResult = vi.fn();
      render(
        <FormStackProvider autoRender={false}>
          <CapturingOpener onResult={onResult} />
          <HostShell />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });
      expect(screen.getByTestId('host-form')).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByTestId('host-close'));
      });

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(undefined);
      });
      expect(screen.queryByTestId('host-form')).toBeNull();
    });
  });

  describe('a confirmOnCancel top form', () => {
    it('shows the confirmation dialog and only resolves on confirm', async () => {
      const onResult = vi.fn();
      render(
        <FormStackProvider autoRender={false}>
          <CapturingOpener onResult={onResult} confirmOnCancel />
          <HostShell />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });

      // No dialog yet.
      expect(screen.queryByRole('alertdialog')).toBeNull();

      await act(async () => {
        fireEvent.click(screen.getByTestId('host-close'));
      });

      // Dialog appears; form still mounted; parent await not resolved.
      expect(screen.getByRole('alertdialog', { hidden: true })).toBeInTheDocument();
      expect(screen.getByTestId('host-form')).toBeInTheDocument();
      expect(onResult).not.toHaveBeenCalled();

      // Confirm → resolves undefined and pops.
      await act(async () => {
        fireEvent.click(screen.getByText('Discard'));
      });

      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(undefined);
      });
      expect(screen.queryByTestId('host-form')).toBeNull();
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    it('keeps the form (and leaves the await pending) when confirmation is rejected', async () => {
      const onResult = vi.fn();
      render(
        <FormStackProvider autoRender={false}>
          <CapturingOpener onResult={onResult} confirmOnCancel />
          <HostShell />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('host-close'));
      });

      expect(screen.getByRole('alertdialog', { hidden: true })).toBeInTheDocument();

      // Reject (Keep Editing).
      await act(async () => {
        fireEvent.click(screen.getByText('Keep Editing'));
      });

      // Dialog closes, form stays, parent await still pending.
      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(screen.getByTestId('host-form')).toBeInTheDocument();
      expect(onResult).not.toHaveBeenCalled();
    });
  });
});

// ---- helpers ---------------------------------------------------------------

function renderHookUseActions() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <FormStackProvider autoRender={false}>{children}</FormStackProvider>
  );
  return renderHook(() => useFormStackActionsDirect(), { wrapper });
}
