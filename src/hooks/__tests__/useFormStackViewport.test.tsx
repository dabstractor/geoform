import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useFormStackViewport } from '../useFormStackViewport';
import { useFormStackActions } from '../useFormStackActions';
import { FormStackProvider } from '../../components';
import { FormStackRenderer, type FormStackRendererProps } from '../../components';
import type {
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
      expect(value.stack[0]?.confirmOnCancel).toBe(true);
      expect(typeof value.onClose).toBe('function');
      expect(typeof value.onCancelRequest).toBe('function');
    });

    it('exposes internal entry fields (component/deferred) without leaking types', () => {
      const { result } = renderHook(
        () => {
          const viewport = useFormStackViewport();
          const { openForm } = useFormStackActions();
          return { viewport, openForm };
        },
        { wrapper },
      );

      act(() => {
        result.current.openForm({ id: 'f1', component: StubForm });
      });

      const entry = (result.current.viewport as FormStackViewportValue).stack[0];
      // The hook still surfaces the internal renderer props (component/deferred)
      // so <FormStackRenderer/> can mount the form — but as a single opaque
      // value, not individual exported internals.
      expect(entry).toBeDefined();
      expect(typeof entry?.component).toBe('function');
      expect(entry?.deferred).toBeDefined();
      expect(typeof entry?.deferred.resolve).toBe('function');
    });
  });

  describe('type-level contracts', () => {
    it('FormStackViewportValue is assignable to FormStackRendererProps', () => {
      // Compile-time guard for acceptance criterion #5: the non-null return of
      // useFormStackViewport() must be spreadable onto <FormStackRenderer/>.
      const acceptRendererProps = (_p: FormStackRendererProps): null => null;
      const value: FormStackViewportValue = {
        stack: [],
        onClose: () => {},
        onCancelRequest: async () => true,
      };
      acceptRendererProps(value); // compiles only if assignable
      // <FormStackViewport/> has no required props:
      const _el = <FormStackRenderer {...value} />;
      void _el;
      expect(true).toBe(true);
    });
  });
});
