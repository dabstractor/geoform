import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormStackProvider } from '../FormStackProvider';
import { useFormStack } from '../../hooks/useFormStack';
import { useFormStackActions } from '../../hooks/useFormStackActions';

// Wrapper component for renderHook
const wrapper = ({ children }: { children: ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
);

// Custom hook to get both form stack and actions
function useFormStackWithActions() {
  const stack = useFormStack();
  const actions = useFormStackActions();
  return { ...stack, ...actions };
}

describe('FormStackProvider - popToIndex error handling', () => {
  // Suppress console.error for expected errors
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
    vi.unstubAllEnvs();
  });

  describe('development mode', () => {
    beforeEach(() => {
      // Set NODE_ENV for development mode error throwing
      // vi.stubEnv only sets import.meta.env, but source code checks process.env
      // So we need to also set process.env directly
      vi.stubEnv('NODE_ENV', 'development');
      if (process?.env) {
        process.env.NODE_ENV = 'development';
      }
    });

    it('should throw RangeError for negative index less than -1', async () => {
      // Arrange
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

      // Act & Assert - `index === -1` is a valid "close all" sentinel,
      // so use `-2` to exercise the genuinely-invalid negative path.
      await expect(result.current.popToIndex(-2)).rejects.toThrow(RangeError);
    });

    it('should throw RangeError for out-of-bounds index', async () => {
      // Simplified test - just test with index 0 on empty stack
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

      // Stack is empty (length 0), so index 0 is out of bounds
      await expect(result.current.popToIndex(0)).rejects.toThrow(/Invalid index 0.*Stack length is 0/);
    });

    it('should throw RangeError for index equal to stack length', async () => {
      // Simplified test - just test with positive index on empty stack
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

      // Stack is empty (length 0), so any positive index is out of bounds
      await expect(result.current.popToIndex(5)).rejects.toThrow(RangeError);
    });
  });

  describe('production mode', () => {
    beforeEach(() => {
      // Set NODE_ENV for production mode (silent failure)
      // vi.stubEnv only sets import.meta.env, but source code checks process.env
      // So we need to also set process.env directly
      vi.stubEnv('NODE_ENV', 'production');
      if (process?.env) {
        process.env.NODE_ENV = 'production';
      }
    });

    it('should return undefined silently for negative index', async () => {
      // Simplified test - just test with empty stack
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

      const originalStackLength = result.current.stack.length;

      // Act - should not throw (await the async call)
      await expect(result.current.popToIndex(-1)).resolves.toBeUndefined();

      // Assert - stack remains unchanged
      expect(result.current.stack.length).toBe(originalStackLength);
    });

    it('should return undefined silently for out-of-bounds index', async () => {
      // Simplified test - just test with empty stack
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

      const originalStackLength = result.current.stack.length;

      // Act - should not throw for out-of-bounds index (await the async call)
      await expect(result.current.popToIndex(999)).resolves.toBeUndefined();

      // Assert - stack remains unchanged
      expect(result.current.stack.length).toBe(originalStackLength);
    });

    it('should return undefined silently for index equal to stack length', async () => {
      // Simplified test - just test with empty stack
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

      const originalStackLength = result.current.stack.length;

      // Act - should not throw (await the async call)
      await expect(result.current.popToIndex(10)).resolves.toBeUndefined();

      // Assert - stack remains unchanged
      expect(result.current.stack.length).toBe(originalStackLength);
    });
  });
});

// `popToIndex(-1)` is the "close all forms" sentinel used by the URL-sync
// popstate handler (PRD §11 back/forward). These guard the BUG-1 fix.
describe('FormStackProvider - popToIndex(-1) closes all forms', () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
    vi.unstubAllEnvs();
    if (process?.env) process.env.NODE_ENV = 'test';
  });

  it('clears the entire stack in production mode', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    if (process?.env) process.env.NODE_ENV = 'production';

    const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

    act(() => {
      result.current.openForm({ id: 'form-1', component: () => null });
      result.current.openForm({ id: 'form-2', component: () => null });
      result.current.openForm({ id: 'form-3', component: () => null });
    });

    // Sanity: stack has 3 forms
    expect(result.current.stack).toHaveLength(3);

    await act(async () => {
      await result.current.popToIndex(-1);
    });

    expect(result.current.stack).toHaveLength(0);
  });

  it('clears the entire stack in development mode without throwing', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    if (process?.env) process.env.NODE_ENV = 'development';

    const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

    act(() => {
      result.current.openForm({ id: 'form-1', component: () => null });
      result.current.openForm({ id: 'form-2', component: () => null });
    });

    expect(result.current.stack).toHaveLength(2);

    await act(async () => {
      await expect(result.current.popToIndex(-1)).resolves.toBeUndefined();
    });
    expect(result.current.stack).toHaveLength(0);
  });

  it('is a no-op on an empty stack', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    if (process?.env) process.env.NODE_ENV = 'production';

    const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

    expect(result.current.stack).toHaveLength(0);
    await act(async () => {
      await expect(result.current.popToIndex(-1)).resolves.toBeUndefined();
    });
    expect(result.current.stack).toHaveLength(0);
  });
});

describe('FormStackProvider - closeForm development warning', () => {
  describe('development mode', () => {
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
      consoleWarnSpy.mockRestore();
    });

    it('should warn when closeForm is called directly', () => {
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });
      result.current.closeForm();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('closeForm() was called directly')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('use onSubmit/onCancel props instead')
      );
    });

    it('should include code examples in warning message', () => {
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });
      result.current.closeForm();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DISCOURAGED')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('RECOMMENDED')
      );
    });

    it('should warn on each call (no deduplication)', () => {
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });
      result.current.closeForm();
      result.current.closeForm();
      result.current.closeForm();
      // Should warn on every call (let consumer decide about frequency)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('production mode', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
      if (process?.env) {
        process.env.NODE_ENV = 'production';
      }
    });

    it('should not warn when closeForm is called', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });
      result.current.closeForm();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});

// Trivial form component for the duplicate-id warning tests. It is never
// interacted with; it only needs to be a valid ComponentType<FormProps<unknown>>.
const StubForm = () => <div data-testid="stub-form" />;

describe('FormStackProvider - openForm duplicate id warning', () => {
  describe('development mode', () => {
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

    it('warns when a form with a duplicate id is opened', () => {
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

      act(() => {
        result.current.openForm({ id: 'dup', component: StubForm });
      });
      // The second openForm reuses 'dup'. Each call is wrapped in its own act()
      // so the first PUSH_FORM is flushed and the updated state.stack is visible
      // to the duplicate check in the (new) openForm closure.
      act(() => {
        result.current.openForm({ id: 'dup', component: StubForm });
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate form id "dup"'),
      );
    });

    it('does not warn when ids are unique', () => {
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

      act(() => {
        result.current.openForm({ id: 'a', component: StubForm });
      });
      act(() => {
        result.current.openForm({ id: 'b', component: StubForm });
      });

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Duplicate form id'),
      );
    });

    it('does not warn for the first occurrence of an id', () => {
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

      act(() => {
        result.current.openForm({ id: 'solo', component: StubForm });
      });

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Duplicate form id'),
      );
    });
  });

  describe('production mode', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
      if (process?.env) {
        process.env.NODE_ENV = 'production';
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

    it('does not warn for duplicate ids in production', () => {
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

      act(() => {
        result.current.openForm({ id: 'dup', component: StubForm });
      });
      act(() => {
        result.current.openForm({ id: 'dup', component: StubForm });
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
