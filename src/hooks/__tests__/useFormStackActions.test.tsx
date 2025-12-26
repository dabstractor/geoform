import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useFormStackActions } from '../useFormStackActions';
import { FormStackProvider } from '../../components';

// Wrapper component for renderHook
const wrapper = ({ children }: { children: ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
);

describe('useFormStackActions', () => {
  describe('when used within FormStackProvider', () => {
    it('should return FormStackActions with openForm and closeForm', () => {
      // Arrange & Act
      const { result } = renderHook(() => useFormStackActions(), { wrapper });

      // Assert
      expect(result.current).toHaveProperty('openForm');
      expect(result.current).toHaveProperty('closeForm');
      expect(typeof result.current.openForm).toBe('function');
      expect(typeof result.current.closeForm).toBe('function');
    });

    it('should have openForm that returns a Promise', () => {
      // Arrange
      const { result } = renderHook(() => useFormStackActions(), { wrapper });

      // Act
      const returnValue = result.current.openForm({
        id: 'test',
        component: () => null,
      });

      // Assert
      expect(returnValue).toBeInstanceOf(Promise);
    });
  });

  describe('when used outside FormStackProvider', () => {
    it('should throw descriptive error', () => {
      // Arrange & Act & Assert
      expect(() => {
        renderHook(() => useFormStackActions());
      }).toThrow('useFormStackActions must be used within a FormStackProvider');
    });

    it('should include helpful message about wrapping with provider', () => {
      // Arrange & Act & Assert
      expect(() => {
        renderHook(() => useFormStackActions());
      }).toThrow('Wrap your component tree with <FormStackProvider>');
    });
  });

  describe('reference stability', () => {
    it('should return stable function references between renders', () => {
      // Arrange
      const { result, rerender } = renderHook(() => useFormStackActions(), { wrapper });
      const firstOpenForm = result.current.openForm;
      const firstCloseForm = result.current.closeForm;

      // Act
      rerender();

      // Assert - function references should be stable (memoized)
      expect(result.current.openForm).toBe(firstOpenForm);
      expect(result.current.closeForm).toBe(firstCloseForm);
    });
  });
});
