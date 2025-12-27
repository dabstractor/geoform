import { useReducer, useMemo, useCallback, type ReactNode } from 'react';
import { formStackReducer, initialFormStackState } from '../context/formStackReducer';
import { FormStackStateContext, FormStackActionsContext } from '../context/FormStackContext';
import { FormStackRenderer } from './FormStackRenderer';
import { createDeferredPromise } from '../utils';
import type { FormStackState, FormStackActions, OpenFormOptions, InternalStackEntry } from '../types';

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

  // Full openForm implementation with deferred promise
  const openForm = useCallback(<T,>(options: OpenFormOptions<T>): Promise<T | undefined> => {
    // Create deferred promise for async resolution
    const deferred = createDeferredPromise<T>();

    // Create internal stack entry
    const entry: InternalStackEntry<T> = {
      id: options.id,
      label: options.label,
      component: options.component,
      confirmOnCancel: options.confirmOnCancel ?? false,
      deferred,
    };

    // Push form onto stack (cast to unknown for reducer type compatibility)
    dispatch({ type: 'PUSH_FORM', entry: entry as InternalStackEntry<unknown> });

    // Return promise immediately - caller awaits
    return deferred.promise;
  }, []);

  const closeForm = useCallback(() => {
    dispatch({ type: 'POP_FORM' });
  }, []);

  // Navigate to specific form, cancelling all deeper forms
  const popToIndex = useCallback((index: number) => {
    // Validate index bounds
    if (index < 0 || index >= state.stack.length) {
      return;
    }

    // Cancel all forms after the target index (resolve with undefined)
    // Iterate in reverse to maintain correct order
    for (let i = state.stack.length - 1; i > index; i--) {
      const entry = state.stack[i];
      if (entry) {
        entry.deferred.resolve(undefined);
      }
    }

    // Dispatch the action to update stack
    dispatch({ type: 'POP_TO_INDEX', index });
  }, [state.stack]);

  // Memoize actions value to prevent re-renders
  const actionsValue = useMemo<FormStackActions>(() => ({
    openForm,
    closeForm,
    popToIndex,
  }), [openForm, closeForm, popToIndex]);

  return (
    <FormStackStateContext.Provider value={stateValue}>
      <FormStackActionsContext.Provider value={actionsValue}>
        {children}
        <FormStackRenderer
          stack={state.stack}
          onClose={closeForm}
        />
      </FormStackActionsContext.Provider>
    </FormStackStateContext.Provider>
  );
}
