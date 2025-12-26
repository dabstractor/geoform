import { useReducer, useMemo, useCallback, type ReactNode } from 'react';
import { formStackReducer, initialFormStackState } from '../context/formStackReducer';
import { FormStackStateContext, FormStackActionsContext } from '../context/FormStackContext';
import type { FormStackState, FormStackActions, OpenFormOptions } from '../types';

/**
 * Props for FormStackProvider component.
 */
export interface FormStackProviderProps {
  /** Child components that will have access to form stack context */
  children: ReactNode;
}

/**
 * Provider component for the form stack system.
 * Uses dual-context pattern to separate state from actions,
 * minimizing re-renders for components that only dispatch actions.
 *
 * @example
 * ```tsx
 * <FormStackProvider>
 *   <App />
 * </FormStackProvider>
 * ```
 */
export function FormStackProvider({ children }: FormStackProviderProps) {
  const [state, dispatch] = useReducer(formStackReducer, initialFormStackState);

  // Convert internal stack to public stack view (without internal details)
  const stateValue = useMemo<FormStackState>(() => ({
    stack: state.stack.map(entry => ({
      id: entry.id,
      label: entry.label,
    })),
  }), [state.stack]);

  // Placeholder implementations for openForm and closeForm
  // Will be fully implemented in P1.M4/P1.M5 with createDeferredPromise
  const openForm = useCallback(<T,>(_options: OpenFormOptions<T>): Promise<T | undefined> => {
    // TODO: P1.M5 - Implement with createDeferredPromise
    // For now, dispatch PUSH_FORM and return a resolved promise
    // This placeholder allows the type system to work correctly
    console.warn('openForm not fully implemented - see P1.M5');
    return Promise.resolve(undefined);
  }, []);

  const closeForm = useCallback(() => {
    dispatch({ type: 'POP_FORM' });
  }, []);

  // Memoize actions value to prevent re-renders
  const actionsValue = useMemo<FormStackActions>(() => ({
    openForm,
    closeForm,
  }), [openForm, closeForm]);

  return (
    <FormStackStateContext.Provider value={stateValue}>
      <FormStackActionsContext.Provider value={actionsValue}>
        {children}
      </FormStackActionsContext.Provider>
    </FormStackStateContext.Provider>
  );
}
