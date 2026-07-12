import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormStackProvider } from '../FormStackProvider';
import { FormStackViewport } from '../FormStackViewport';
import { useFormStackActions, useFormStackState } from '../../hooks';
import type { FormProps } from '../../types';

// A simple form with a data-testid we can locate and assert placement of.
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

// Opener that pushes a form onto the stack.
function Opener() {
  const { openForm } = useFormStackActions();
  return (
    <button
      data-testid="open"
      onClick={() =>
        openForm({ id: 'f1', component: StubForm, label: 'F1' })
      }
    >
      open
    </button>
  );
}

// A host that shows whether the stack is open and renders the viewport.
function Host({ children }: { children?: ReactNode }) {
  const { stack } = useFormStackState();
  return (
    <div data-testid="host" data-open={stack.length > 0}>
      {children}
      <FormStackViewport />
    </div>
  );
}

describe('FormStackViewport', () => {
  describe('placement & rendering', () => {
    it('renders nothing when the stack is empty', () => {
      render(
        <FormStackProvider autoRender={false}>
          <Host />
        </FormStackProvider>,
      );

      expect(screen.queryByTestId('host-form')).toBeNull();
    });

    it('renders the form inside the consumer host when opened', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <Opener />
          <Host />
        </FormStackProvider>,
      );

      expect(screen.queryByTestId('host-form')).toBeNull();

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });

      // The form renders INSIDE the consumer host.
      const host = screen.getByTestId('host');
      expect(host).toContainElement(screen.getByTestId('host-form'));
      expect(host.getAttribute('data-open')).toBe('true');
    });

    it('renders exactly one copy of an open form (no duplicates)', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <Opener />
          <Host />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });

      expect(screen.getAllByTestId('host-form')).toHaveLength(1);
    });

    it('requires no props (type-level) and renders ReactElement | null', () => {
      // This line compiles only if FormStackViewport takes no required props.
      const element = <FormStackViewport />;
      // Render to prove it produces null when empty (no provider state).
      const { container } = render(
        <FormStackProvider autoRender={false}>
          {element}
        </FormStackProvider>,
      );
      // No form body in the DOM.
      expect(container.querySelector('.form-stack')).toBeNull();
    });
  });

  describe('nested forms via the viewport', () => {
    function ChildForm({ onSubmit, onCancel }: FormProps<string>) {
      return (
        <div data-testid="child-form">
          <button data-testid="child-submit" onClick={() => onSubmit('child')}>
            Submit Child
          </button>
          <button data-testid="child-cancel" onClick={onCancel}>
            Cancel Child
          </button>
        </div>
      );
    }

    function ParentForm({ onSubmit, onCancel }: FormProps<string>) {
      const { openForm } = useFormStackActions();
      return (
        <div data-testid="parent-form">
          <button
            data-testid="open-child"
            onClick={() =>
              openForm({ id: 'child', component: ChildForm, label: 'Child' })
            }
          >
            Open Child
          </button>
          <button data-testid="parent-submit" onClick={() => onSubmit('parent')}>
            Submit Parent
          </button>
          <button data-testid="parent-cancel" onClick={onCancel}>
            Cancel Parent
          </button>
        </div>
      );
    }

    function RootOpener() {
      const { openForm } = useFormStackActions();
      return (
        <button
          data-testid="open-parent"
          onClick={() =>
            openForm({ id: 'parent', component: ParentForm, label: 'Parent' })
          }
        >
          Open Parent
        </button>
      );
    }

    it('keeps the parent mounted-hidden while the child is visible', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <RootOpener />
          <Host />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open-parent'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-child'));
      });

      // Both rendered inside the host, parent hidden, child visible.
      const host = screen.getByTestId('host');
      expect(host).toContainElement(screen.getByTestId('parent-form'));
      expect(host).toContainElement(screen.getByTestId('child-form'));
      expect(
        screen.getByTestId('parent-form').parentElement,
      ).toHaveStyle('display: none');
      expect(
        screen.getByTestId('child-form').parentElement,
      ).toHaveStyle('display: block');
    });

    it('restores the parent when the child is cancelled', async () => {
      render(
        <FormStackProvider autoRender={false}>
          <RootOpener />
          <Host />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open-parent'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('open-child'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('child-cancel'));
      });

      // Child gone, parent visible again.
      expect(screen.queryByTestId('child-form')).toBeNull();
      expect(
        screen.getByTestId('parent-form').parentElement,
      ).toHaveStyle('display: block');
    });
  });

  describe('outside a provider', () => {
    it('renders nothing and does not throw', () => {
      // No provider: both contexts fall back to safe defaults.
      const { container } = render(<FormStackViewport />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('lifecycle callbacks through the viewport', () => {
    it('resolves the form value on submit', async () => {
      const onResult = vi.fn();
      function CapturingOpener() {
        const { openForm } = useFormStackActions();
        return (
          <button
            data-testid="open"
            onClick={async () => {
              const result = await openForm({
                id: 'f1',
                component: StubForm,
                label: 'F1',
              });
              onResult(result);
            }}
          >
            open
          </button>
        );
      }

      render(
        <FormStackProvider autoRender={false}>
          <CapturingOpener />
          <Host />
        </FormStackProvider>,
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId('open'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('stub-submit'));
      });

      expect(onResult).toHaveBeenCalledWith({ ok: true });
    });
  });
});
