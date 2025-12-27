import { useFormStackState } from './useFormStackState';
import { useFormStackActions } from './useFormStackActions';
import type { StackEntry, OpenFormOptions } from '../types';

/**
 * Return type for useFormStack hook.
 * Combines state and actions for convenience.
 *
 * @see {@link useFormStack} - Hook that returns this type
 * @see {@link FormStackState} - State portion of this return type
 * @see {@link FormStackActions} - Actions portion of this return type
 */
export interface UseFormStackReturn {
  /**
   * Current form stack (read-only).
   * Each entry contains id and optional label for breadcrumb display.
   */
  stack: readonly StackEntry[];
  /**
   * Opens a new form and returns a Promise.
   * Promise resolves with form value on submit, undefined on cancel.
   */
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  /**
   * Closes the current form without returning data.
   * Typically used internally; forms use onSubmit/onCancel instead.
   */
  closeForm: () => void;
}

/**
 * Combined hook providing both form stack state and actions.
 * Use this when a component needs to both read state AND dispatch actions.
 *
 * For optimal performance, prefer useFormStackState or useFormStackActions
 * when only one is needed (reduces unnecessary re-renders).
 *
 * @returns Object containing stack state and form actions
 *
 * @throws {Error} When used outside FormStackProvider.
 *         Error message: "useFormStackState must be used within a FormStackProvider"
 *
 * @see {@link FormStackProvider} - Required wrapper component
 * @see {@link FormProps} - Interface forms must implement
 * @see {@link useFormStackState} - State-only hook (more performant)
 * @see {@link useFormStackActions} - Actions-only hook (more performant)
 * @see {@link OpenFormOptions} - Options passed to openForm()
 *
 * @example
 * ```tsx
 * function FormManager() {
 *   const { stack, openForm, closeForm } = useFormStack();
 *
 *   const handleCreate = async () => {
 *     const result = await openForm({
 *       id: 'create-user',
 *       component: CreateUserForm,
 *       label: 'Create User',
 *     });
 *     if (result) {
 *       console.log('Created user:', result);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <span>Forms open: {stack.length}</span>
 *       <button onClick={handleCreate}>Create User</button>
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
