import type { StackEntry, OpenFormOptions, InternalStackEntry } from './stack';

/**
 * Read-only state exposed by FormStackStateContext.
 * Used by components that need to read stack state (e.g., Breadcrumbs).
 */
export interface FormStackState {
  /** Current form stack (read-only to prevent mutations) */
  stack: readonly StackEntry[];
}

/**
 * Actions exposed by FormStackActionsContext.
 * Separated from state to minimize re-renders (context splitting pattern).
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
