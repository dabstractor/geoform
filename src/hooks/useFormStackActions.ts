import { useContext } from 'react';
import { FormStackActionsContext } from '../context';
import type { FormStackActions } from '../types';

/**
 * Hook to access form stack actions (dispatch).
 * Components using this hook will NOT re-render when stack changes.
 * Optimizes performance for components that only need to dispatch actions.
 *
 * @returns FormStackActions containing openForm and closeForm functions
 * @throws Error if used outside FormStackProvider
 *
 * @example
 * ```typescript
 * function CreateButton() {
 *   const { openForm } = useFormStackActions();
 *
 *   const handleClick = async () => {
 *     const result = await openForm({
 *       id: 'create-user',
 *       component: UserForm,
 *       label: 'Create User',
 *     });
 *     if (result) {
 *       console.log('User created:', result);
 *     }
 *   };
 *
 *   return <button onClick={handleClick}>Create User</button>;
 * }
 * ```
 */
export function useFormStackActions(): FormStackActions {
  const context = useContext(FormStackActionsContext);

  if (context === null) {
    throw new Error(
      'useFormStackActions must be used within a FormStackProvider. ' +
      'Wrap your component tree with <FormStackProvider>.'
    );
  }

  return context;
}
