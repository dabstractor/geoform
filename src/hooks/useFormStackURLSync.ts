import { useEffect, useRef, useCallback, useState } from 'react';
import { useFormStackState } from './useFormStackState';
import { useFormStackActions } from './useFormStackActions';
import { buildFormStackUrl, parseFormStackUrl } from '../utils';

/**
 * Options for URL sync hook
 */
export interface UseFormStackURLSyncOptions {
  /**
   * Query parameter name for form stack
   * @default 'forms'
   */
  paramName?: string;

  /**
   * Whether to restore form stack from URL on mount
   * @default true
   */
  restoreOnMount?: boolean;

  /**
   * Whether to continuously sync stack changes to URL
   * @default true
   */
  syncToUrl?: boolean;

  /**
   * Whether to sync URL changes (back/forward) to stack
   * @default true
   */
  syncFromUrl?: boolean;

  /**
   * Callback when stack is restored from URL
   * Useful for loading form components dynamically
   */
  onRestore?: (formIds: string[]) => void;
}

/**
 * Return type for useFormStackURLSync hook
 */
export interface UseFormStackURLSyncReturn {
  /**
   * Whether the hook is currently restoring from URL
   */
  isRestoring: boolean;

  /**
   * Get the current URL representation of the stack
   */
  getUrlState: () => string[];

  /**
   * Manually trigger a URL update (for edge cases)
   */
  forceUrlUpdate: () => void;
}

/**
 * Hook for bidirectional sync between form stack and URL query parameters.
 *
 * Enables:
 * - Shareable URLs that restore form stack state
 * - Browser back/forward navigation through form history
 * - Bookmarking form stack positions
 *
 * @param options Configuration options
 * @returns Object with sync state and utility methods
 *
 * @example
 * ```tsx
 * import { FormStackProvider, useFormStackURLSync } from 'geoform';
 *
 * function App() {
 *   return (
 *     <FormStackProvider>
 *       <URLSyncedApp />
 *     </FormStackProvider>
 *   );
 * }
 *
 * function URLSyncedApp() {
 *   // Enable URL sync - forms now appear in URL as ?forms=form1,form2
 *   useFormStackURLSync();
 *
 *   // Rest of your app
 *   return <YourApp />;
 * }
 * ```
 */
export function useFormStackURLSync(
  options: UseFormStackURLSyncOptions = {}
): UseFormStackURLSyncReturn {
  const {
    paramName = 'forms',
    restoreOnMount = true,
    syncToUrl = true,
    syncFromUrl = true,
    onRestore,
  } = options;

  const { stack } = useFormStackState();
  const { popToIndex } = useFormStackActions();

  const [isRestoring, setIsRestoring] = useState(false);

  // Track whether we're in the middle of a restoration to prevent loops
  const isRestoringRef = useRef(false);
  // Track previous stack to detect changes
  const prevStackRef = useRef<readonly { id: string }[]>([]);
  // Track initialization
  const isInitializedRef = useRef(false);

  // Get form IDs from stack
  const getStackIds = useCallback(() => {
    return stack.map((entry) => entry.id);
  }, [stack]);

  // Get form IDs from URL
  const getUrlState = useCallback(() => {
    if (typeof window === 'undefined') return [];
    return parseFormStackUrl(paramName);
  }, [paramName]);

  // Update URL with current stack
  const syncStackToUrl = useCallback(
    (formIds: readonly string[], usePushState: boolean = true) => {
      if (typeof window === 'undefined') return;
      if (isRestoringRef.current) return;

      const url = buildFormStackUrl(formIds, paramName);
      const historyState = { [paramName]: [...formIds] };

      if (usePushState) {
        window.history.pushState(historyState, '', url);
      } else {
        window.history.replaceState(historyState, '', url);
      }
    },
    [paramName]
  );

  // Force URL update (utility method)
  const forceUrlUpdate = useCallback(() => {
    syncStackToUrl(getStackIds(), false);
  }, [syncStackToUrl, getStackIds]);

  // Restore stack from URL
  const restoreFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;

    const urlFormIds = getUrlState();

    if (urlFormIds.length > 0) {
      setIsRestoring(true);
      isRestoringRef.current = true;

      // Call onRestore callback if provided
      onRestore?.(urlFormIds);

      // Set up the initial history state
      window.history.replaceState(
        { [paramName]: urlFormIds },
        '',
        window.location.href
      );

      // Reset restoration flag after a tick
      setTimeout(() => {
        isRestoringRef.current = false;
        setIsRestoring(false);
      }, 0);
    }
  }, [getUrlState, paramName, onRestore]);

  // Handle popstate (browser back/forward)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!syncFromUrl) return;

    const handlePopstate = (event: PopStateEvent) => {
      isRestoringRef.current = true;

      // Get form IDs from event state or parse URL
      const formIds: string[] =
        event.state?.[paramName] ?? parseFormStackUrl(paramName);

      // Compare with current stack and adjust
      const currentIds = getStackIds();

      if (formIds.length < currentIds.length) {
        // Forms were closed via back button - pop to the right index
        const targetIndex = formIds.length - 1;
        if (targetIndex >= 0) {
          popToIndex(targetIndex);
        } else {
          // All forms closed - pop all
          popToIndex(-1);
        }
      }
      // Note: Forward navigation (adding forms) would need form registry to work

      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    };

    window.addEventListener('popstate', handlePopstate);
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, [syncFromUrl, paramName, getStackIds, popToIndex]);

  // Initialize from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitializedRef.current) return;
    if (!restoreOnMount) return;

    isInitializedRef.current = true;
    restoreFromUrl();
  }, [restoreOnMount, restoreFromUrl]);

  // Sync stack changes to URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!syncToUrl) return;
    if (!isInitializedRef.current) return;

    const currentIds = getStackIds();
    const prevIds = prevStackRef.current.map((e) => e.id);

    // Detect if stack changed
    if (
      currentIds.length !== prevIds.length ||
      currentIds.some((id, i) => id !== prevIds[i])
    ) {
      const isAdding = currentIds.length > prevIds.length;

      // Use pushState when adding forms, replaceState when removing
      syncStackToUrl(currentIds, isAdding);
    }

    prevStackRef.current = stack;
  }, [stack, syncToUrl, getStackIds, syncStackToUrl]);

  return {
    isRestoring,
    getUrlState,
    forceUrlUpdate,
  };
}
