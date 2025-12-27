/**
 * React Hierarchical Form Stack System (geoform)
 *
 * A batteries-included React system for managing infinitely nestable
 * hierarchical forms where users may create required relational data
 * at any point without enforced order.
 *
 * ## Quick Start
 *
 * ```tsx
 * import { FormStackProvider, useFormStack, type FormProps } from 'geoform';
 *
 * function App() {
 *   return (
 *     <FormStackProvider>
 *       <YourApp />
 *     </FormStackProvider>
 *   );
 * }
 *
 * function CreateButton() {
 *   const { openForm } = useFormStack();
 *
 *   const handleClick = async () => {
 *     const result = await openForm({
 *       id: 'create-user',
 *       component: UserForm,
 *       label: 'Create User',
 *     });
 *     if (result) console.log('Created:', result);
 *   };
 *
 *   return <button onClick={handleClick}>Create User</button>;
 * }
 * ```
 *
 * ## Core Concepts
 *
 * - **Form Stack**: A stack of suspended form components where only the top is visible
 * - **State Preservation**: Parent forms remain mounted (hidden) while children are active
 * - **Promise-Based API**: `openForm()` returns a Promise that resolves when form closes
 * - **Breadcrumb Navigation**: Click breadcrumbs to cancel intermediate forms
 * - **Error Isolation**: Each form is wrapped in an error boundary
 *
 * ## Architecture
 *
 * - {@link FormStackProvider} - Wrap your app to enable form stack
 * - {@link useFormStack} - Primary hook for form interactions
 * - {@link FormProps} - Interface all forms must implement
 * - {@link Breadcrumbs} - Optional navigation component
 *
 * @packageDocumentation
 * @module geoform
 */

// ===== Components =====

/**
 * Provider component that enables form stack functionality.
 * Wrap your application with this component to use useFormStack.
 *
 * @see {@link useFormStack} - Primary hook for form interactions
 * @see {@link useFormStackState} - Read-only state access
 * @see {@link useFormStackActions} - Actions-only access
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

/**
 * Breadcrumbs component for displaying form stack navigation.
 * Clicking a breadcrumb navigates to that form, cancelling all deeper forms.
 *
 * @see {@link useFormStackState} - Hook used internally to read stack
 * @see {@link StackEntry} - Entry type displayed in breadcrumbs
 *
 * @example
 * ```tsx
 * import { Breadcrumbs } from 'geoform';
 *
 * function Header() {
 *   return (
 *     <header>
 *       <Breadcrumbs separator=" › " />
 *     </header>
 *   );
 * }
 * ```
 */
export { Breadcrumbs } from './components';

/**
 * Props for Breadcrumbs component.
 */
export type { BreadcrumbsProps } from './components';

/**
 * Confirmation dialog component for cancellation confirmation.
 * Displays accessible modal dialog when forms with confirmOnCancel are cancelled.
 *
 * @example
 * ```tsx
 * import { ConfirmationDialog } from 'geoform';
 *
 * function CustomConfirmDialog() {
 *   return (
 *     <ConfirmationDialog
 *       isOpen={showConfirm}
 *       title="Discard Changes?"
 *       message="Your unsaved changes will be lost."
 *       onConfirm={handleConfirm}
 *       onCancel={handleCancel}
 *     />
 *   );
 * }
 * ```
 */
export { ConfirmationDialog } from './components';

/**
 * Props for ConfirmationDialog component.
 */
export type { ConfirmationDialogProps } from './components';

/**
 * Error boundary component for form error isolation.
 * Automatically wraps forms in FormStackProvider.
 * Export for advanced customization use cases.
 *
 * @example
 * ```tsx
 * import { FormErrorBoundary } from 'geoform';
 *
 * // Custom wrapper with additional error handling
 * function CustomFormWrapper({ children }) {
 *   return (
 *     <FormErrorBoundary
 *       formId="custom-form"
 *       onDismiss={handleDismiss}
 *       onError={(error, info) => logToService(error)}
 *     >
 *       {children}
 *     </FormErrorBoundary>
 *   );
 * }
 * ```
 */
export { FormErrorBoundary } from './components';

/**
 * Props for FormErrorBoundary component.
 */
export type { FormErrorBoundaryProps } from './components';

// ===== Hooks =====

/**
 * Primary hook for interacting with the form stack.
 * Returns stack state and actions (openForm, closeForm).
 *
 * @see {@link FormStackProvider} - Required wrapper component
 * @see {@link FormProps} - Interface forms must implement
 * @see {@link OpenFormOptions} - Options for openForm()
 * @see {@link useFormStackState} - State-only hook (more performant)
 * @see {@link useFormStackActions} - Actions-only hook (more performant)
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
 *
 * @see {@link useFormStack} - Combined hook for state + actions
 * @see {@link useFormStackActions} - Actions-only hook
 * @see {@link FormStackState} - Return type interface
 */
export { useFormStackState } from './hooks';

/**
 * Hook for accessing form stack actions only.
 * Use when component only needs to dispatch actions.
 * More performant than useFormStack when state reading isn't needed.
 *
 * @see {@link useFormStack} - Combined hook for state + actions
 * @see {@link useFormStackState} - State-only hook
 * @see {@link FormStackActions} - Return type interface
 */
export { useFormStackActions } from './hooks';

/**
 * Return type for useFormStack hook.
 */
export type { UseFormStackReturn } from './hooks';

/**
 * Hook for bidirectional sync between form stack and URL query parameters.
 * Enables shareable URLs, bookmarking, and browser back/forward navigation.
 *
 * @example
 * ```tsx
 * import { FormStackProvider, useFormStackURLSync } from 'geoform';
 *
 * function App() {
 *   return (
 *     <FormStackProvider>
 *       <URLSyncedApp />
 *     </FormStackProvider>
 *   );
 * }
 *
 * function URLSyncedApp() {
 *   // Enable URL sync - forms now appear in URL as ?forms=form1,form2
 *   useFormStackURLSync();
 *
 *   // Rest of your app
 *   return <YourApp />;
 * }
 * ```
 */
export { useFormStackURLSync } from './hooks';

/**
 * Options for useFormStackURLSync hook.
 */
export type { UseFormStackURLSyncOptions } from './hooks';

/**
 * Return type for useFormStackURLSync hook.
 */
export type { UseFormStackURLSyncReturn } from './hooks';

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
 *
 * @see {@link useFormStack} - Hook providing openForm()
 * @see {@link FormProps} - Interface forms must implement
 */
export type { OpenFormOptions } from './types';

/**
 * Public view of a stack entry for breadcrumb rendering.
 * Consumers see this via useFormStack().stack
 *
 * @see {@link useFormStackState} - Returns stack as readonly StackEntry[]
 * @see {@link Breadcrumbs} - Component that renders StackEntry array
 */
export type { StackEntry } from './types';

/**
 * Read-only state exposed by useFormStackState.
 *
 * @see {@link useFormStackState} - Hook that returns this type
 * @see {@link FormStackActions} - Actions counterpart
 */
export type { FormStackState } from './types';

/**
 * Actions exposed by useFormStackActions.
 *
 * @see {@link useFormStackActions} - Hook that returns this type
 * @see {@link FormStackState} - State counterpart
 */
export type { FormStackActions } from './types';
