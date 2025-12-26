import { useFormStackState } from './useFormStackState';
import { useFormStackActions } from './useFormStackActions';
import type { StackEntry, OpenFormOptions } from '../types';

/**
 * Return type for useFormStack hook.
 * Combines state and actions for convenience.
 */
export interface UseFormStackReturn {
  /** Current form stack (read-only) */
  stack: readonly StackEntry[];
  /** Opens a new form and returns a promise resolving to its result */
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  /** Closes the current form without returning data */
  closeForm: () => void;
}

/**
 * Combined hook providing both form stack state and actions.
 * Use this when a component needs to both read state AND dispatch actions.
 *
 * For optimal performance, prefer useFormStackState or useFormStackActions
 * when only one is needed.
 *
 * @returns UseFormStackReturn with stack, openForm, and closeForm
 * @throws Error if used outside FormStackProvider
 *
 * @example
 * ```typescript
 * function FormManager() {
 *   const { stack, openForm, closeForm } = useFormStack();
 *
 *   return (
 *     <div>
 *       <span>Forms open: {stack.length}</span>
 *       <button onClick={() => openForm({ id: 'new', component: MyForm })}>
 *         Open Form
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFormStack(): UseFormStackReturn {
  const { stack } = useFormStackState();
  const { openForm, closeForm } = useFormStackActions();

  return { stack, openForm, closeForm };
}
