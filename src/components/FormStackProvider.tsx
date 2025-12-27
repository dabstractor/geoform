import { useReducer, useMemo, useCallback, useState, type ReactNode } from 'react';
import { formStackReducer, initialFormStackState } from '../context/formStackReducer';
import { FormStackStateContext, FormStackActionsContext } from '../context/FormStackContext';
import { FormStackRenderer } from './FormStackRenderer';
import { ConfirmationDialog } from './ConfirmationDialog';
import { createDeferredPromise } from '../utils';
import type { FormStackState, FormStackActions, OpenFormOptions, InternalStackEntry } from '../types';

/**
 * State for a pending confirmation dialog.
 */
interface PendingConfirmation {
  /** Form names/IDs that would be cancelled */
  affectedForms: string[];
  /** Callback when user responds */
  resolve: (confirmed: boolean) => void;
}

/**
 * Props for FormStackProvider component.
 *
 * @see {@link FormStackProvider} - Component that accepts these props
 */
export interface FormStackProviderProps {
  /**
   * Child components that will have access to form stack context.
   * All children can use useFormStack, useFormStackState, or useFormStackActions.
   */
  children: ReactNode;
}

/**
 * Provider component for the form stack system.
 * Uses dual-context pattern to separate state from actions,
 * minimizing re-renders for components that only dispatch actions.
 *
 * Wrap your application with this component to enable form stack functionality.
 * All descendant components can then use the form stack hooks.
 *
 * @see {@link useFormStack} - Primary hook for form interactions
 * @see {@link useFormStackState} - Read-only state access
 * @see {@link useFormStackActions} - Actions without state subscription
 * @see {@link Breadcrumbs} - Navigation component for stack
 * @see {@link FormProps} - Interface forms must implement
 *
 * @example
 * ```tsx
 * import { FormStackProvider } from 'geoform';
 *
 * function App() {
 *   return (
 *     <FormStackProvider>
 *       <YourApp />
 *     </FormStackProvider>
 *   );
 * }
 * ```
 */
export function FormStackProvider({ children }: FormStackProviderProps) {
  const [state, dispatch] = useReducer(formStackReducer, initialFormStackState);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

  // Request confirmation from user - returns Promise that resolves when user responds
  const requestConfirmation = useCallback((affectedForms: string[]): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingConfirmation({ affectedForms, resolve });
    });
  }, []);

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
  const popToIndex = useCallback(async (index: number) => {
    // Validate index bounds
    if (index < 0 || index >= state.stack.length) {
      return;
    }

    // Get forms that will be cancelled
    const formsToCancel = state.stack.slice(index + 1);

    // Check if any require confirmation
    const formsNeedingConfirmation = formsToCancel.filter(e => e.confirmOnCancel);

    if (formsNeedingConfirmation.length > 0) {
      const confirmed = await requestConfirmation(
        formsNeedingConfirmation.map(f => f.label ?? f.id)
      );
      if (!confirmed) {
        return; // User cancelled, don't proceed
      }
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
  }, [state.stack, requestConfirmation]);

  // Handler for cancel confirmation from FormStackRenderer
  const handleCancelRequest = useCallback(async (entry: InternalStackEntry<unknown>): Promise<boolean> => {
    if (entry.confirmOnCancel) {
      return requestConfirmation([entry.label ?? entry.id]);
    }
    return true; // No confirmation needed
  }, [requestConfirmation]);

  // Confirmation dialog handlers
  const handleConfirmationConfirm = useCallback(() => {
    if (pendingConfirmation) {
      pendingConfirmation.resolve(true);
      setPendingConfirmation(null);
    }
  }, [pendingConfirmation]);

  const handleConfirmationCancel = useCallback(() => {
    if (pendingConfirmation) {
      pendingConfirmation.resolve(false);
      setPendingConfirmation(null);
    }
  }, [pendingConfirmation]);

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
          onCancelRequest={handleCancelRequest}
        />
        <ConfirmationDialog
          isOpen={pendingConfirmation !== null}
          title={
            pendingConfirmation && pendingConfirmation.affectedForms.length > 1
              ? `Discard Changes to ${pendingConfirmation.affectedForms.length} Forms?`
              : 'Discard Changes?'
          }
          message="Your unsaved changes will be lost."
          onConfirm={handleConfirmationConfirm}
          onCancel={handleConfirmationCancel}
        />
      </FormStackActionsContext.Provider>
    </FormStackStateContext.Provider>
  );
}
