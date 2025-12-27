import type { StackEntry, OpenFormOptions, InternalStackEntry } from './stack';

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
   * Closes the current form (internal use - forms use onSubmit/onCancel instead).
   */
  closeForm: () => void;
  /**
   * Navigates to a specific form in the stack by index.
   * All forms after the target index are cancelled (resolved with undefined).
   * Used by Breadcrumbs component for direct navigation.
   * @param index - Zero-based index of the target form
   */
  popToIndex: (index: number) => void;
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
