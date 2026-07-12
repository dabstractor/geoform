import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useFormStackViewport } from '../useFormStackViewport';
import { useFormStackActions } from '../useFormStackActions';
import { FormStackProvider } from '../../components';
import { FormStackRenderer, type FormStackRendererProps } from '../../components';
import type {
  FormStackViewportContextValue,
  FormStackViewportValue,
  FormProps,
} from '../../types';

const wrapper = ({ children }: { children: ReactNode }) => (
  <FormStackProvider autoRender={false}>{children}</FormStackProvider>
);

const StubForm = (_props: FormProps<unknown>) => (
  <div data-testid="form" />
);

describe('useFormStackViewport', () => {
  describe('outside a provider', () => {
    it('returns null without throwing', () => {
      const { result } = renderHook(() => useFormStackViewport());
      expect(result.current).toBeNull();
    });
  });

  describe('inside a provider', () => {
    it('returns null when the stack is empty', () => {
      const { result } = renderHook(() => useFormStackViewport(), { wrapper });
      expect(result.current).toBeNull();
    });

    it('returns the viewport value when a form is open', () => {
      const { result } = renderHook(
        () => {
          const viewport = useFormStackViewport();
          const { openForm } = useFormStackActions();
          return { viewport, openForm };
        },
        { wrapper },
      );

      act(() => {
        result.current.openForm({
          id: 'f1',
          component: StubForm,
          label: 'F1',
          confirmOnCancel: true,
        });
      });

      // Re-read after the state update.
      expect(result.current.viewport).not.toBeNull();
      const value = result.current.viewport as FormStackViewportValue;
      expect(value.stack).toHaveLength(1);
      expect(value.stack[0]?.id).toBe('f1');
      expect(value.stack[0]?.label).toBe('F1');
      expect(typeof value.onClose).toBe('function');
      // Sanitized: the public value exposes NO onCancelRequest callback.
      expect('onCancelRequest' in value).toBe(false);
    });

    it('returns a sanitized stack exposing only { id, label } (no internal fields)', () => {
      const { result } = renderHook(
        () => {
          const viewport = useFormStackViewport();
          const { openForm } = useFormStackActions();
          return { viewport, openForm };
        },
        { wrapper },
      );

      act(() => {
        // Open with confirmOnCancel to prove the flag stays internal.
        result.current.openForm({ id: 'f1', component: StubForm, label: 'F1', confirmOnCancel: true });
      });

      const value = result.current.viewport as FormStackViewportValue;
      expect(value.stack).toHaveLength(1);

      // The public entry carries ONLY id + label (component/deferred/confirmOnCancel dropped).
      const entry = value.stack[0]!;
      expect(Object.keys(entry).sort()).toEqual(['id', 'label']);
      expect('component' in entry).toBe(false);
      expect('deferred' in entry).toBe(false);
      expect('confirmOnCancel' in entry).toBe(false);

      // The public value exposes ONLY { stack, onClose } (no onCancelRequest).
      expect(typeof value.onClose).toBe('function');
      expect(Object.keys(value).sort()).toEqual(['onClose', 'stack']);
      expect('onCancelRequest' in value).toBe(false);
    });
  });

  describe('type-level contracts', () => {
    it('the INTERNAL context value is assignable to FormStackRendererProps (renderer spread still compiles)', () => {
      // <FormStackViewport/> spreads the internal FormStackViewportContextValue onto
      // <FormStackRenderer/>. That spread must still type-check: the internal context
      // value is structurally identical to FormStackRendererProps.
      const acceptRendererProps = (_p: FormStackRendererProps): null => null;
      const internal: FormStackViewportContextValue = {
        stack: [],
        onClose: () => {},
        onCancelRequest: async () => true,
      };
      acceptRendererProps(internal); // compiles only if assignable
      const _el = <FormStackRenderer {...internal} />;
      void _el;
      expect(true).toBe(true);
    });

    it('the PUBLIC FormStackViewportValue is NOT assignable to FormStackRendererProps (leak closed)', () => {
      // The public hook return type intentionally omits onCancelRequest (and the
      // internal stack-entry fields), so it can no longer be spread onto the renderer.
      // These conditional-type guards FAIL TO COMPILE if the leak ever returns
      // (regression guard), and assert the runtime literal value too.
      type InternalAssignable = FormStackViewportContextValue extends FormStackRendererProps ? true : false;
      type PublicAssignable = FormStackViewportValue extends FormStackRendererProps ? true : false;

      const internalAssignable: InternalAssignable = true;  // compiles => internal IS assignable
      const publicAssignable: PublicAssignable = false;     // compiles => public is NOT assignable

      expect(internalAssignable).toBe(true);
      expect(publicAssignable).toBe(false);
    });
  });
});
