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
   *
   * **When NOT to use:** In form components - forms should use the `onSubmit` and `onCancel` props
   * passed by FormStackRenderer instead. Direct `closeForm()` calls bypass the Promise resolution
   * pattern and can cause unexpected behavior.
   *
   * **When to use:**
   * - Programmatic form closure from a parent component (outside the form stack)
   * - Advanced custom navigation scenarios where you need to dismiss forms without user interaction
   * - Emergency/disaster recovery scenarios
   *
   * @remarks
   * The `closeForm` function dispatches a `POP_FORM` action directly to the reducer. This is
   * different from the form lifecycle pattern where FormStackRenderer injects `onSubmit`/`onCancel`
   * callbacks that properly resolve the Promise returned by `openForm()`.
   *
   * **Promise Pattern Bypass Warning:** Calling `closeForm()` directly skips the Promise resolution
   * step. When a form calls `onSubmit(data)` or `onCancel()`, FormStackRenderer first resolves the
   * deferred promise (which unblocks the parent's `await openForm()`), then calls `onClose()` which
   * triggers `closeForm()`. Direct `closeForm()` calls bypass promise resolution, leaving the parent's
   * await hanging indefinitely and causing unexpected application state.
   *
   * @throws {Error} When used outside FormStackProvider context
   *
   * @see {@link FormProps} - Interface forms should implement instead of calling closeForm
   * @see {@link FormStackRenderer} - Component that injects onSubmit/onCancel into forms
   * @see {@link openForm} - Returns a Promise that resolves via form's onSubmit/onCancel
   *
   * @example
   * ```tsx
   * // DISCOURAGED: Direct closeForm call in a form component
   * function MyForm({ onSubmit, onCancel }: FormProps<Data>) {
   *   const { closeForm } = useFormStack();
   *
   *   // DON'T DO THIS - bypasses Promise pattern, breaks parent's await
   *   const handleSave = () => {
   *     onSubmit(data);
   *     closeForm(); // WRONG! FormStackRenderer handles this via onSubmit
   *   };
   * }
   * ```
   *
   * @example
   * ```tsx
   * // RECOMMENDED: Use onSubmit/onCancel props in form components
   * function MyForm({ onSubmit, onCancel }: FormProps<Data>) {
   *   const handleSave = () => {
   *     onSubmit(data); // FormStackRenderer will call closeForm() internally
   *   };
   *
   *   const handleCancel = () => {
   *     onCancel(); // FormStackRenderer will call closeForm() internally
   *   };
   * }
   * ```
   *
   * @example
   * ```tsx
   * // VALID: Programmatic closure from parent component (outside form stack)
   * function ParentComponent() {
   *   const { closeForm, stack } = useFormStack();
   *
   *   // Emergency close all forms scenario
   *   const handleEmergencyClose = () => {
   *     while (stack.length > 0) {
   *       closeForm();
   *     }
   *   };
   * }
   * ```
   */
  closeForm: () => void;
  /**
   * Cancels the top form on the stack through the proper lifecycle
   * (confirmation when `confirmOnCancel`, then promise resolution).
   *
   * This is the action a host window (e.g. a single shared modal hosting
   * `<FormStackViewport/>`) should wire to Escape / backdrop / a host-level
   * close button. It resolves the top form's deferred with `undefined`, so the
   * parent's `await openForm()` resolves with `undefined`.
   *
   * No-op when the stack is empty.
   *
   * @see {@link FormStackViewport} - Placeable viewport for a host window
   */
  cancelForm: () => Promise<void>;
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
  const { openForm, closeForm, cancelForm } = useFormStackActions();

  return { stack, openForm, closeForm, cancelForm };
}
