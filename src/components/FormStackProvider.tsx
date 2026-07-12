import { useReducer, useMemo, useCallback, useState, useEffect, useRef, type ReactNode } from 'react';
import { formStackReducer, initialFormStackState } from '../context/formStackReducer';
import {
  FormStackStateContext,
  FormStackActionsContext,
  FormStackViewportContext,
  FormStackViewportMountContext,
} from '../context/FormStackContext';
import { FormStackViewport } from './FormStackViewport';
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
  /**
   * Whether the provider renders the form-stack viewport itself (as a sibling
   * of `children`). Defaults to `true` (current behavior).
   *
   * Set to `false` to host the viewport yourself — e.g. inside a single shared
   * modal — by rendering `<FormStackViewport/>` where you want the stacked form
   * bodies to appear.
   *
   * The cancel-confirmation `<ConfirmationDialog/>` is always rendered
   * regardless of this setting; only the form viewport is affected.
   *
   * @default true
   *
   * @see {@link FormStackViewport} - Placeable viewport for a host window
   */
  autoRender?: boolean;
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
export function FormStackProvider({ children, autoRender = true }: FormStackProviderProps) {
  const [state, dispatch] = useReducer(formStackReducer, initialFormStackState);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  // Tracks whether a <FormStackViewport/> is currently mounted (for the
  // dev-mode "forgotten host" warning when autoRender={false}).
  const [viewportMounted, setViewportMounted] = useState(false);

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
    // Development-mode usage warning
    if (typeof process !== "undefined" && process.env?.NODE_ENV === 'development') {
      console.warn(
        'closeForm() was called directly. Most forms should use onSubmit/onCancel props instead. ' +
        'Use closeForm() only for programmatic closure from outside the form stack.\n\n' +
        'Example (DISCOURAGED - direct call in form):\n' +
        '  function MyForm({ closeForm }) {\n' +
        '    const handleSave = () => {\n' +
        '      onSubmit(data);\n' +
        '      closeForm(); // DON\'T DO THIS\n' +
        '    };\n' +
        '  }\n\n' +
        'Example (RECOMMENDED - use onSubmit):\n' +
        '  function MyForm({ onSubmit }) {\n' +
        '    const handleSave = () => {\n' +
        '      onSubmit(data); // FormStackRenderer handles closure\n' +
        '    };\n' +
        '  }'
      );
    }
    dispatch({ type: 'POP_FORM' });
  }, []);

  /**
   * Navigates to a specific form in the stack by index.
   * All forms after the target index are cancelled (resolved with undefined).
   * Used by Breadcrumbs component for direct navigation.
   *
   * @param index - Zero-based index of the target form. Must be >= 0 and < stack.length.
   * @throws {RangeError} In development mode, when index is negative or >= stack.length.
   *                      Production silently ignores invalid indices (graceful degradation).
   */
  const popToIndex = useCallback(async (index: number) => {
    // Development-mode error throwing for debugging
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
      if (index < 0 || index >= state.stack.length) {
        throw new RangeError(
          `popToIndex: Invalid index ${index}. Stack length is ${state.stack.length}.`
        );
      }
    }

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

  /**
   * Cancels the top form through the proper lifecycle: confirmation (when
   * `confirmOnCancel`) then promise resolution, so a host modal can wire
   * Escape/backdrop/close to "cancel the top form" without bypassing either.
   * No-op when the stack is empty.
   */
  const cancelForm = useCallback(async () => {
    const top = state.stack[state.stack.length - 1];
    if (!top) return;
    const confirmed = await handleCancelRequest(top);
    if (!confirmed) return;
    top.deferred.resolve(undefined);
    dispatch({ type: 'POP_FORM' });
  }, [state.stack, handleCancelRequest]);

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
    cancelForm,
  }), [openForm, closeForm, popToIndex, cancelForm]);

  // Viewport context value. Null when the stack is empty (or outside a
  // provider) so <FormStackViewport/> and useFormStackViewport() render/return
  // nothing. Structurally identical to FormStackRendererProps.
  const viewportValue = useMemo(
    () =>
      state.stack.length === 0
        ? null
        : {
            stack: state.stack,
            onClose: closeForm,
            onCancelRequest: handleCancelRequest,
          },
    [state.stack, closeForm, handleCancelRequest],
  );

  // Dev-mode guard: warn when autoRender={false} and a form is open but no
  // <FormStackViewport/> has mounted (a forgotten host). Fires at most once per
  // "forgotten" episode and resets once a viewport mounts or the stack clears.
  const warnedForgottenHostRef = useRef(false);
  useEffect(() => {
    const forgotten = !autoRender && state.stack.length > 0 && !viewportMounted;
    if (forgotten) {
      if (
        !warnedForgottenHostRef.current &&
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          '[FormStackProvider] autoRender is false and a form is open, but no ' +
            '<FormStackViewport/> is mounted. Render <FormStackViewport/> inside ' +
            'your host (e.g. your shared modal) so the form is visible.'
        );
        warnedForgottenHostRef.current = true;
      }
    } else {
      warnedForgottenHostRef.current = false;
    }
  }, [autoRender, state.stack.length, viewportMounted]);

  return (
    <FormStackStateContext.Provider value={stateValue}>
      <FormStackActionsContext.Provider value={actionsValue}>
        <FormStackViewportContext.Provider value={viewportValue}>
          <FormStackViewportMountContext.Provider value={setViewportMounted}>
            {children}
            {autoRender && <FormStackViewport />}
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
          </FormStackViewportMountContext.Provider>
        </FormStackViewportContext.Provider>
      </FormStackActionsContext.Provider>
    </FormStackStateContext.Provider>
  );
}
