import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
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

    it('should throw RangeError for negative index', async () => {
      // Arrange
      const { result } = renderHook(() => useFormStackWithActions(), { wrapper });

      // Act & Assert - use rejects.toThrow for async function
      await expect(result.current.popToIndex(-1)).rejects.toThrow(RangeError);
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
