import type { StackEntry, OpenFormOptions, InternalStackEntry } from './stack';

/**
 * Props required to render the form-stack viewport via {@link FormStackRenderer}.
 *
 * Structurally identical to {@link FormStackRendererProps} so that
 * {@link FormStackViewport} can forward it to {@link FormStackRenderer} via
 * spread (`<FormStackRenderer {...viewport} />`) **without** leaking internal
 * types (`component`/`deferred`) into the public API. Consumers should never
 * need to construct this themselves — read it via {@link useFormStackViewport}
 * or let {@link FormStackViewport} render it.
 *
 * @see {@link FormStackViewport} - Zero-prop component that renders this value
 * @see {@link useFormStackViewport} - Hook returning this value (or null)
 * @see {@link FormStackRendererProps} - The renderer's prop interface it mirrors
 */
export interface FormStackViewportValue {
  /** Internal stack entries to render (top visible, parents mounted-hidden) */
  stack: InternalStackEntry<unknown>[];
  /** Callback when a form closes (pops the top form from the stack) */
  onClose: () => void;
  /** Request confirmation before cancelling an entry; resolves true if confirmed */
  onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>;
}

/**
 * Read-only state exposed by FormStackStateContext.
 * Used by components that need to read stack state (e.g., Breadcrumbs).
 *
 * Separated from FormStackActions to enable context splitting pattern -
 * components reading state won't re-render when actions are called.
 *
 * @see {@link useFormStackState} - Hook to access this state
 * @see {@link useFormStack} - Combined hook for state + actions
 * @see {@link Breadcrumbs} - Component that reads stack state
 */
export interface FormStackState {
  /** Current form stack (read-only to prevent mutations) */
  stack: readonly StackEntry[];
}

/**
 * Actions exposed by FormStackActionsContext.
 * Separated from state to minimize re-renders (context splitting pattern).
 *
 * Components that only dispatch actions (don't read state) can use
 * useFormStackActions to avoid re-rendering on stack changes.
 *
 * @see {@link useFormStackActions} - Hook to access these actions
 * @see {@link useFormStack} - Combined hook for state + actions
 * @see {@link FormStackProvider} - Provider that supplies these actions
 */
export interface FormStackActions {
  /**
   * Opens a new form and returns a promise that resolves when the form closes.
   * @template T - The type of value the form will return
   * @param options - Configuration for the form to open
   * @returns Promise resolving to form value (submit) or undefined (cancel)
   */
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  /**
   * Closes the current form without returning data.
   *
   * **When NOT to use:** In form components - use the `onSubmit` and `onCancel` props
   * passed by FormStackRenderer instead.
   *
   * **When to use:** Programmatic form closure from outside the form stack,
   * advanced custom navigation, or emergency scenarios.
   *
   * @throws {Error} When used outside FormStackProvider context
   *
   * @see {@link FormProps} - Interface forms should implement instead
   * @see {@link useFormStack} - Enhanced documentation available in UseFormStackReturn
   */
  closeForm: () => void;
  /**
   * Navigates to a specific form in the stack by index.
   * All forms after the target index are cancelled (resolved with undefined).
   * Used by Breadcrumbs component for direct navigation.
   * @param index - Zero-based index of the target form
   */
  popToIndex: (index: number) => void;
  /**
   * Cancels the top form on the stack through the proper lifecycle:
   *   1. If the top entry has `confirmOnCancel`, shows the confirmation dialog
   *      (the same path as the form's own injected `onCancel`).
   *   2. On confirm (or if no confirmation is needed), resolves that entry's
   *      deferred with `undefined` and pops it — so the parent's
   *      `await openForm()` resolves with `undefined`.
   *
   * No-op when the stack is empty. This is the action a host window (e.g. a
   * single shared modal) should wire to Escape / backdrop / a host-level close
   * button.
   *
   * @see {@link FormStackViewport} - Placeable viewport for a host window
   */
  cancelForm: () => Promise<void>;
}

/**
 * Discriminated union of all reducer actions.
 * Uses 'type' field as discriminant for TypeScript narrowing.
 */
export type FormStackAction =
  | { type: 'PUSH_FORM'; entry: InternalStackEntry<unknown> }
  | { type: 'POP_FORM' }
  | { type: 'POP_TO_INDEX'; index: number };

/**
 * Internal state managed by formStackReducer.
 * Contains full InternalStackEntry array (not just public StackEntry).
 */
export interface FormStackReducerState {
  /** Internal stack with full entry data including components and deferred promises */
  stack: InternalStackEntry<unknown>[];
}
