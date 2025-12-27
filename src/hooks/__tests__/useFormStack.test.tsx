import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useFormStack } from '../useFormStack';
import { FormStackProvider } from '../../components';

// Wrapper component for renderHook
const wrapper = ({ children }: { children: ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
);

describe('useFormStack', () => {
  describe('when used within FormStackProvider', () => {
    it('should return stack, openForm, and closeForm', () => {
      // Arrange & Act
      const { result } = renderHook(() => useFormStack(), { wrapper });

      // Assert
      expect(result.current).toHaveProperty('stack');
      expect(result.current).toHaveProperty('openForm');
      expect(result.current).toHaveProperty('closeForm');
    });

    it('should return empty stack initially', () => {
      // Arrange & Act
      const { result } = renderHook(() => useFormStack(), { wrapper });

      // Assert
      expect(result.current.stack).toHaveLength(0);
      expect(Array.isArray(result.current.stack)).toBe(true);
    });

    it('should return working openForm and closeForm functions', () => {
      // Arrange & Act
      const { result } = renderHook(() => useFormStack(), { wrapper });

      // Assert
      expect(typeof result.current.openForm).toBe('function');
      expect(typeof result.current.closeForm).toBe('function');
    });

    it('should have openForm that returns a Promise', () => {
      // Arrange
      const { result } = renderHook(() => useFormStack(), { wrapper });

      // Act
      let returnValue: Promise<unknown>;
      act(() => {
        returnValue = result.current.openForm({
          id: 'test',
          component: () => null,
        });
      });

      // Assert
      expect(returnValue!).toBeInstanceOf(Promise);
    });
  });

  describe('when used outside FormStackProvider', () => {
    it('should throw error from useFormStackState', () => {
      // Arrange & Act & Assert
      // Combined hook uses individual hooks, so error comes from first failing hook
      expect(() => {
        renderHook(() => useFormStack());
      }).toThrow('useFormStackState must be used within a FormStackProvider');
    });
  });

  describe('return type structure', () => {
    it('should match UseFormStackReturn interface', () => {
      // Arrange & Act
      const { result } = renderHook(() => useFormStack(), { wrapper });

      // Assert - verify structure matches interface
      const returnValue = result.current;

      // stack is readonly StackEntry[]
      expect(returnValue.stack).toBeDefined();

      // openForm is function returning Promise
      expect(typeof returnValue.openForm).toBe('function');

      // closeForm is void function
      expect(typeof returnValue.closeForm).toBe('function');
    });
  });

  describe('reference stability', () => {
    it('should maintain stable references across renders', () => {
      // Arrange
      const { result, rerender } = renderHook(() => useFormStack(), { wrapper });
      const first = result.current;

      // Act
      rerender();

      // Assert
      expect(result.current.stack).toBe(first.stack);
      expect(result.current.openForm).toBe(first.openForm);
      expect(result.current.closeForm).toBe(first.closeForm);
    });
  });
});
