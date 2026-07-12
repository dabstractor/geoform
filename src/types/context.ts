import type { StackEntry, OpenFormOptions, InternalStackEntry } from './stack';

/**
 * Internal context value carried by {@link FormStackViewportContext}. Same shape the
 * provider produces (internal stack, `onClose`, `onCancelRequest`) and structurally
 * identical to {@link FormStackRendererProps}, so {@link FormStackViewport} can spread
 * it onto {@link FormStackRenderer}.
 *
 * Never exposed publicly: it carries {@link InternalStackEntry} (with
 * `component`/`deferred`/`confirmOnCancel`) and an `onCancelRequest` typed on
 * `InternalStackEntry`. The public, sanitized view is {@link FormStackViewportValue}.
 *
 * @internal
 */
export interface FormStackViewportContextValue {
  /** Internal stack entries to render (top visible, parents mounted-hidden) */
  stack: InternalStackEntry<unknown>[];
  /** Callback when a form closes (pops the top form from the stack) */
  onClose: () => void;
  /** Request confirmation before cancelling an entry; resolves true if confirmed */
  onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>;
}

/**
 * Public, sanitized value returned by {@link useFormStackViewport} (or `null` when the
 * stack is empty). A deliberately narrow view of the internal
 * {@link FormStackViewportContextValue}: a **read-only** `{ id, label }[]` stack and
 * the `onClose` callback only.
 *
 * It intentionally does **not** expose the internal stack-entry fields
 * (`component`, `deferred`, `confirmOnCancel`) or an `onCancelRequest` callback.
 * Those are internal to the renderer (see {@link FormStackRendererProps} and the
 * internal {@link FormStackViewportContextValue}); leaking them would let a consumer
 * hijack a form's promise resolution (`entry.deferred.resolve(...)`) or mount forms
 * directly. Most consumers should use {@link FormStackViewport} (the zero-prop
 * component) instead of this hook.
 *
 * @see {@link useFormStackViewport} - Hook returning this value (or null)
 * @see {@link FormStackViewport} - Zero-prop component that renders the viewport
 * @see {@link StackEntry} - The public entry type (`{ id, label? }`)
 */
export interface FormStackViewportValue {
  /** Read-only stack entries (`{ id, label? }` only — no component/deferred) */
  stack: readonly StackEntry[];
  /** Callback to close/pop the top form */
  onClose: () => void;
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
   *
   * The special value `-1` means "close all forms" (keep zero forms). It is
   * used internally by the URL-sync popstate handler when the browser
   * back-button navigates to a history entry with no open forms, and may be
   * used by consumers for a programmatic "close everything" action.
   *
   * @param index - Zero-based index of the target form, or `-1` to close all.
   *                Must be `>= -1` and `< stack.length`.
   * @throws {RangeError} In development mode, when index is `< -1` or `>= stack.length`.
   *                      Production silently ignores invalid indices (graceful degradation).
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
