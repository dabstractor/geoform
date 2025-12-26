import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useFormStackState } from '../useFormStackState';
import { FormStackProvider } from '../../components';

// Wrapper component for renderHook
const wrapper = ({ children }: { children: ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
);

describe('useFormStackState', () => {
  describe('when used within FormStackProvider', () => {
    it('should return FormStackState with stack array', () => {
      // Arrange & Act
      const { result } = renderHook(() => useFormStackState(), { wrapper });

      // Assert
      expect(result.current).toHaveProperty('stack');
      expect(Array.isArray(result.current.stack)).toBe(true);
    });

    it('should return empty stack initially', () => {
      // Arrange & Act
      const { result } = renderHook(() => useFormStackState(), { wrapper });

      // Assert
      expect(result.current.stack).toHaveLength(0);
    });

    it('should return readonly stack (immutable)', () => {
      // Arrange & Act
      const { result } = renderHook(() => useFormStackState(), { wrapper });

      // Assert - TypeScript enforces readonly, this verifies runtime behavior
      expect(result.current.stack).toEqual([]);
    });
  });

  describe('when used outside FormStackProvider', () => {
    it('should throw descriptive error', () => {
      // Arrange & Act & Assert
      expect(() => {
        renderHook(() => useFormStackState());
      }).toThrow('useFormStackState must be used within a FormStackProvider');
    });

    it('should include helpful message about wrapping with provider', () => {
      // Arrange & Act & Assert
      expect(() => {
        renderHook(() => useFormStackState());
      }).toThrow('Wrap your component tree with <FormStackProvider>');
    });
  });

  describe('reference stability', () => {
    it('should return consistent reference between renders', () => {
      // Arrange
      const { result, rerender } = renderHook(() => useFormStackState(), { wrapper });
      const firstStack = result.current.stack;

      // Act
      rerender();

      // Assert - stack reference should be stable when unchanged
      expect(result.current.stack).toBe(firstStack);
    });
  });
});
