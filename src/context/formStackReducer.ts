import type { FormStackReducerState, FormStackAction } from '../types';

/**
 * Initial state for the form stack reducer.
 * Empty stack, ready to receive form entries.
 */
export const initialFormStackState: FormStackReducerState = {
  stack: [],
};

/**
 * Reducer function for managing form stack state transitions.
 * Handles push, pop, and pop-to-index operations immutably.
 *
 * @param state - Current form stack state
 * @param action - Action to perform (PUSH_FORM, POP_FORM, POP_TO_INDEX)
 * @returns New state after action is applied
 */
export function formStackReducer(
  state: FormStackReducerState,
  action: FormStackAction
): FormStackReducerState {
  switch (action.type) {
    case 'PUSH_FORM':
      return {
        stack: [...state.stack, action.entry],
      };

    case 'POP_FORM':
      if (state.stack.length === 0) {
        return state;
      }
      return {
        stack: state.stack.slice(0, -1),
      };

    case 'POP_TO_INDEX':
      // `index === -1` is a valid sentinel meaning "keep zero forms" (clear
      // the entire stack). It is used by the URL-sync popstate handler when the
      // browser navigates back to a no-forms URL state. Indices < -1 are still
      // invalid and leave state unchanged.
      if (action.index < -1 || action.index >= state.stack.length) {
        return state;
      }
      return {
        stack: state.stack.slice(0, action.index + 1),
      };

    default:
      // Exhaustive check - TypeScript will error if we miss a case
      const _exhaustive: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(_exhaustive)}`);
  }
}
