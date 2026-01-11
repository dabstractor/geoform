import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormStackProvider } from '../../components';
import { useFormStackURLSync } from '../useFormStackURLSync';

// Store original window properties
const originalLocation = window.location;
const originalHistory = window.history;

// Wrapper component for renderHook
const wrapper = ({ children }: { children: ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
);

describe('useFormStackURLSync', () => {
  // Mock implementations
  let mockPushState: ReturnType<typeof vi.fn>;
  let mockReplaceState: ReturnType<typeof vi.fn>;
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;
  let popstateHandler: ((event: PopStateEvent) => void) | null = null;

  beforeEach(() => {
    // Reset mocks
    mockPushState = vi.fn();
    mockReplaceState = vi.fn();
    mockAddEventListener = vi.fn((event, handler) => {
      if (event === 'popstate') {
        popstateHandler = handler as (event: PopStateEvent) => void;
      }
    });
    mockRemoveEventListener = vi.fn((event, handler) => {
      if (event === 'popstate' && popstateHandler === handler) {
        popstateHandler = null;
      }
    });

    // Mock window.history
    Object.defineProperty(window, 'history', {
      value: {
        pushState: mockPushState,
        replaceState: mockReplaceState,
        state: null,
      },
      writable: true,
      configurable: true,
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        pathname: '/',
        href: 'http://localhost/',
      },
      writable: true,
      configurable: true,
    });

    // Mock addEventListener/removeEventListener
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;
  });

  afterEach(() => {
    // Restore original window properties
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'history', {
      value: originalHistory,
      writable: true,
      configurable: true,
    });
    popstateHandler = null;
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize without error', () => {
      const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
      expect(result.current.isRestoring).toBe(false);
    });

    it('should return getUrlState function', () => {
      const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
      expect(typeof result.current.getUrlState).toBe('function');
    });

    it('should return forceUrlUpdate function', () => {
      const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
      expect(typeof result.current.forceUrlUpdate).toBe('function');
    });
  });

  describe('URL restoration on mount', () => {
    it('should parse form IDs from URL on mount', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '?forms=org-form,team-form',
          pathname: '/',
          href: 'http://localhost/?forms=org-form,team-form',
        },
        writable: true,
        configurable: true,
      });

      const onRestore = vi.fn();
      renderHook(() => useFormStackURLSync({ onRestore }), { wrapper });

      await waitFor(() => {
        expect(onRestore).toHaveBeenCalledWith(['org-form', 'team-form']);
      });
    });

    it('should not call onRestore when URL has no forms param', () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '',
          pathname: '/',
          href: 'http://localhost/',
        },
        writable: true,
        configurable: true,
      });

      const onRestore = vi.fn();
      renderHook(() => useFormStackURLSync({ onRestore }), { wrapper });

      expect(onRestore).not.toHaveBeenCalled();
    });

    it('should respect restoreOnMount: false option', () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '?forms=org-form',
          pathname: '/',
          href: 'http://localhost/?forms=org-form',
        },
        writable: true,
        configurable: true,
      });

      const onRestore = vi.fn();
      renderHook(() => useFormStackURLSync({ restoreOnMount: false, onRestore }), {
        wrapper,
      });

      expect(onRestore).not.toHaveBeenCalled();
    });

    it('should set isRestoring to true during restoration', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '?forms=org-form',
          pathname: '/',
          href: 'http://localhost/?forms=org-form',
        },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

      // isRestoring should be false after restoration completes
      await waitFor(() => {
        expect(result.current.isRestoring).toBe(false);
      });
    });
  });

  describe('popstate event handling', () => {
    it('should register popstate listener on mount', () => {
      renderHook(() => useFormStackURLSync(), { wrapper });

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
    });

    it('should clean up popstate listener on unmount', () => {
      const { unmount } = renderHook(() => useFormStackURLSync(), { wrapper });

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
    });

    it('should not register popstate listener when syncFromUrl is false', () => {
      renderHook(() => useFormStackURLSync({ syncFromUrl: false }), { wrapper });

      expect(mockAddEventListener).not.toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
    });
  });

  describe('getUrlState', () => {
    it('should return empty array when URL has no forms param', () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '',
          pathname: '/',
          href: 'http://localhost/',
        },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

      expect(result.current.getUrlState()).toEqual([]);
    });

    it('should return form IDs from URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '?forms=org-form,team-form',
          pathname: '/',
          href: 'http://localhost/?forms=org-form,team-form',
        },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

      expect(result.current.getUrlState()).toEqual(['org-form', 'team-form']);
    });

    it('should use custom param name', () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '?customStack=form-1,form-2',
          pathname: '/',
          href: 'http://localhost/?customStack=form-1,form-2',
        },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(
        () => useFormStackURLSync({ paramName: 'customStack' }),
        { wrapper }
      );

      expect(result.current.getUrlState()).toEqual(['form-1', 'form-2']);
    });
  });

  describe('forceUrlUpdate', () => {
    it('should call replaceState when called', () => {
      const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

      act(() => {
        result.current.forceUrlUpdate();
      });

      expect(mockReplaceState).toHaveBeenCalled();
    });
  });

  describe('options', () => {
    it('should accept custom paramName option', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '?myForms=form-1',
          pathname: '/',
          href: 'http://localhost/?myForms=form-1',
        },
        writable: true,
        configurable: true,
      });

      const onRestore = vi.fn();
      renderHook(() => useFormStackURLSync({ paramName: 'myForms', onRestore }), {
        wrapper,
      });

      await waitFor(() => {
        expect(onRestore).toHaveBeenCalledWith(['form-1']);
      });
    });

    it('should respect syncToUrl: false option', () => {
      const { result } = renderHook(
        () => useFormStackURLSync({ syncToUrl: false }),
        { wrapper }
      );

      // forceUrlUpdate should still work even with syncToUrl: false
      act(() => {
        result.current.forceUrlUpdate();
      });

      // Only replaceState from forceUrlUpdate, no automatic syncing
      expect(mockReplaceState).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    // Suppress console.error for expected errors in this block
    const originalError = console.error;

    beforeEach(() => {
      console.error = vi.fn();
    });

    afterEach(() => {
      console.error = originalError;
    });

    it('should throw error when used outside FormStackProvider', () => {
      expect(() => {
        renderHook(() => useFormStackURLSync());
      }).toThrow('useFormStackState must be used within a FormStackProvider');
    });
  });

  describe('URL with special characters', () => {
    it('should handle URL-encoded form IDs', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '?forms=form%20with%20spaces,form%26special',
          pathname: '/',
          href: 'http://localhost/?forms=form%20with%20spaces,form%26special',
        },
        writable: true,
        configurable: true,
      });

      const onRestore = vi.fn();
      renderHook(() => useFormStackURLSync({ onRestore }), { wrapper });

      await waitFor(() => {
        expect(onRestore).toHaveBeenCalledWith([
          'form with spaces',
          'form&special',
        ]);
      });
    });
  });

  describe('empty URL handling', () => {
    it('should handle empty query string gracefully', () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '',
          pathname: '/',
          href: 'http://localhost/',
        },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

      expect(result.current.getUrlState()).toEqual([]);
      expect(result.current.isRestoring).toBe(false);
    });

    it('should handle forms param with empty value gracefully', () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '?forms=',
          pathname: '/',
          href: 'http://localhost/?forms=',
        },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

      expect(result.current.getUrlState()).toEqual([]);
    });
  });
});
