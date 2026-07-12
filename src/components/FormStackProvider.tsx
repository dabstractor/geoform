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
  /** Form names/IDs that would be cancelled (merged across concurrent requests) */
  affectedForms: string[];
  /** All concurrent waiters — resolved together when the user responds */
  resolvers: Set<(confirmed: boolean) => void>;
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
  // Tracks how many <FormStackViewport/> are currently mounted (for the
  // dev-mode "forgotten host" and "duplicate viewport" warnings when
  // autoRender={false}). The mount channel sends a +1/-1 delta per mount.
  const [viewportMountCount, setViewportMountCount] = useState(0);
  const applyViewportMountDelta = useCallback((delta: number) => {
    setViewportMountCount((prev) => Math.max(0, prev + delta));
  }, []);

  // Request confirmation from user - returns Promise that resolves when user responds.
  // Coalesces concurrent requests: a second call while a dialog is open merges
  // its resolver (and affected forms) into the existing pending confirmation so
  // every waiter settles on a single user response (Issue 2 fix).
  const requestConfirmation = useCallback((affectedForms: string[]): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingConfirmation((prev) => {
        if (prev) {
          // Coalesce: merge into the existing pending confirmation so all
          // concurrent waiters are resolved together (Issue 2 fix).
          return {
            affectedForms: [...new Set([...prev.affectedForms, ...affectedForms])],
            resolvers: new Set([...prev.resolvers, resolve]),
          };
        }
        return { affectedForms, resolvers: new Set([resolve]) };
      });
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
    // Development-mode guard: warn when a duplicate id is pushed onto the stack.
    // Duplicate ids collide on React `key` in FormStackRenderer and Breadcrumbs
    // (PRD §5.2 documents id as "Unique identifier for this form instance").
    // Uniqueness remains a consumer responsibility — the form is still pushed;
    // this is a diagnostic warning, not a guard. Production is unaffected.
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      if (state.stack.some((e) => e.id === options.id)) {
        console.warn(
          `[FormStack] Duplicate form id "${options.id}" detected. ` +
          'Form IDs should be unique on the stack to avoid React key collisions ' +
          'in FormStackRenderer and Breadcrumbs (PRD §5.2: "Unique identifier for this form instance").'
        );
      }
    }

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
  }, [state.stack]);

  const closeForm = useCallback(() => {
    // Development-mode usage warning
    if (typeof process !== "undefined" && process.env?.NODE_ENV === 'development') {
      console.warn(
        'closeForm() was called directly. Most forms should use onSubmit/onCancel props instead. ' +
        'Use closeForm() only for programmatic closure from outside the form stack.\n\n' +
        'Example (DISCOURAGED - treating injected callbacks like legacy close helpers):\n' +
        '  function MyForm({ onCancel }) {\n' +
        '    const handleSave = () => {\n' +
        '      // ...persist data, then call onCancel to close the form.\n' +
        '      onCancel(); // DON\'T DO THIS - use onSubmit(data) so openForm() resolves with the value.\n' +
        '    };\n' +
        '  }\n\n' +
        'Example (RECOMMENDED - use onSubmit):\n' +
        '  function MyForm({ onSubmit }) {\n' +
        '    const handleSave = () => {\n' +
        '      onSubmit(data); // FormStackRenderer handles closure and promise resolution.\n' +
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
   * The special value `-1` means "close all forms" (keep zero forms). It is
   * used by the URL-sync popstate handler when the browser back-button
   * navigates to a history entry with no open forms.
   *
   * @param index - Zero-based index of the target form, or `-1` to close all.
   *                Must be `>= -1` and `< stack.length`.
   * @throws {RangeError} In development mode, when index is `< -1` or `>= stack.length`.
   *                      Production silently ignores invalid indices (graceful degradation).
   */
  const popToIndex = useCallback(async (index: number) => {
    // Development-mode error throwing for debugging.
    // `index === -1` is a valid "close all" sentinel and is permitted even when
    // the stack is empty (it becomes a no-op).
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
      if (index < -1 || index >= state.stack.length) {
        throw new RangeError(
          `popToIndex: Invalid index ${index}. Stack length is ${state.stack.length}.`
        );
      }
    }

    // Validate index bounds (`-1` is allowed and means "close all")
    if (index < -1 || index >= state.stack.length) {
      return;
    }

    // Get forms that will be cancelled (everything after the target index;
    // for `index === -1` that is the entire stack)
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

  // Confirmation dialog handlers. Resolve ALL coalesced waiters inside the
  // functional setState updater (reads the current `prev`, defeats stale
  // closures) and clear the slot atomically by returning null. The handlers
  // read nothing from closure, so deps are [] — they are stable.
  const handleConfirmationConfirm = useCallback(() => {
    setPendingConfirmation((prev) => {
      prev?.resolvers.forEach((resolver) => resolver(true));
      return null;
    });
  }, []);

  const handleConfirmationCancel = useCallback(() => {
    setPendingConfirmation((prev) => {
      prev?.resolvers.forEach((resolver) => resolver(false));
      return null;
    });
  }, []);

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
  // Also warns when more than one <FormStackViewport/> is mounted at once
  // (each open form would render multiple times). Fires at most once per
  // "duplicate" episode and resets when the count drops back to <= 1.
  const warnedForgottenHostRef = useRef(false);
  const warnedDuplicateViewportRef = useRef(false);
  useEffect(() => {
    if (
      typeof process === 'undefined' ||
      process.env?.NODE_ENV !== 'development'
    ) {
      return;
    }

    const forgotten = !autoRender && state.stack.length > 0 && viewportMountCount === 0;
    if (forgotten) {
      if (!warnedForgottenHostRef.current) {
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

    const duplicate = viewportMountCount > 1;
    if (duplicate) {
      if (!warnedDuplicateViewportRef.current) {
        // eslint-disable-next-line no-console
        console.warn(
          `[FormStackProvider] ${viewportMountCount} <FormStackViewport/> ` +
            'components are mounted at once. PRD §10.1 requires exactly one. ' +
            'Each open form renders once per viewport, so duplicates produce ' +
            'redundant DOM, double event wiring, and an inconsistent React tree. ' +
            'Remove the extra <FormStackViewport/>.'
        );
        warnedDuplicateViewportRef.current = true;
      }
    } else {
      warnedDuplicateViewportRef.current = false;
    }
  }, [autoRender, state.stack.length, viewportMountCount]);

  return (
    <FormStackStateContext.Provider value={stateValue}>
      <FormStackActionsContext.Provider value={actionsValue}>
        <FormStackViewportContext.Provider value={viewportValue}>
          <FormStackViewportMountContext.Provider value={applyViewportMountDelta}>
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
