/**
 * React Hierarchical Form Stack System (geoform)
 *
 * A batteries-included React system for managing infinitely nestable
 * hierarchical forms where users may create required relational data
 * at any point without enforced order.
 *
 * @packageDocumentation
 */

// ===== Components =====

/**
 * Provider component that enables form stack functionality.
 * Wrap your application with this component to use useFormStack.
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
export { FormStackProvider } from './components';

/**
 * Props for FormStackProvider component.
 */
export type { FormStackProviderProps } from './components';

// ===== Hooks =====

/**
 * Primary hook for interacting with the form stack.
 * Returns stack state and actions (openForm, closeForm).
 *
 * @example
 * ```tsx
 * import { useFormStack, type FormProps } from 'geoform';
 *
 * function MyComponent() {
 *   const { stack, openForm, closeForm } = useFormStack();
 *
 *   const handleCreate = async () => {
 *     const result = await openForm({
 *       id: 'create-user',
 *       component: CreateUserForm,
 *       label: 'Create User',
 *     });
 *
 *     if (result) {
 *       console.log('Created user:', result);
 *     }
 *   };
 *
 *   return <button onClick={handleCreate}>Create User</button>;
 * }
 * ```
 */
export { useFormStack } from './hooks';

/**
 * Hook for reading form stack state only.
 * Use when component only needs to display stack info (e.g., breadcrumbs).
 * More performant than useFormStack when actions aren't needed.
 */
export { useFormStackState } from './hooks';

/**
 * Hook for accessing form stack actions only.
 * Use when component only needs to dispatch actions.
 * More performant than useFormStack when state reading isn't needed.
 */
export { useFormStackActions } from './hooks';

/**
 * Return type for useFormStack hook.
 */
export type { UseFormStackReturn } from './hooks';

// ===== Types =====

/**
 * Props interface that all form components must implement.
 * Forms receive these callbacks from FormStackProvider.
 *
 * @typeParam T - The type of value returned by onSubmit
 *
 * @example
 * ```tsx
 * import type { FormProps } from 'geoform';
 *
 * interface UserData {
 *   name: string;
 *   email: string;
 * }
 *
 * function CreateUserForm({ onSubmit, onCancel }: FormProps<UserData>) {
 *   const handleSubmit = () => {
 *     onSubmit({ name: 'John', email: 'john@example.com' });
 *   };
 *
 *   return (
 *     <form>
 *       <input name="name" />
 *       <input name="email" />
 *       <button type="button" onClick={handleSubmit}>Save</button>
 *       <button type="button" onClick={onCancel}>Cancel</button>
 *     </form>
 *   );
 * }
 * ```
 */
export type { FormProps } from './types';

/**
 * Options passed to openForm() to open a new form.
 *
 * @typeParam T - The type of value the form will return
 */
export type { OpenFormOptions } from './types';

/**
 * Public view of a stack entry for breadcrumb rendering.
 * Consumers see this via useFormStack().stack
 */
export type { StackEntry } from './types';

/**
 * Read-only state exposed by useFormStackState.
 */
export type { FormStackState } from './types';

/**
 * Actions exposed by useFormStackActions.
 */
export type { FormStackActions } from './types';
