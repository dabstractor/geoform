import type { ComponentType } from 'react';
import type { FormProps, DeferredPromise } from './form';

/**
 * Public view of a stack entry for breadcrumb rendering.
 * Consumers see this read-only array via useFormStack().stack or useFormStackState().
 *
 * This is the sanitized version of InternalStackEntry - it excludes
 * implementation details like the component reference and deferred promise.
 *
 * @see {@link useFormStack} - Returns stack as readonly StackEntry[]
 * @see {@link Breadcrumbs} - Component that renders StackEntry array
 * @see {@link InternalStackEntry} - Full internal representation
 */
export interface StackEntry {
  /** Unique identifier for the form */
  id: string;
  /** Optional display label for breadcrumbs */
  label?: string;
}

/**
 * Options passed to openForm() to open a new form.
 *
 * @template T - The type of value the form will return. Must match the
 *               component's FormProps<T> type parameter. The openForm()
 *               Promise resolves with this type (or undefined on cancel).
 *
 * @see {@link FormProps} - Props interface the component must accept
 * @see {@link useFormStack} - Hook providing openForm() method
 * @see {@link StackEntry} - Public view of opened form in stack
 *
 * @example
 * ```tsx
 * interface UserData { name: string; email: string; }
 *
 * const result = await openForm<UserData>({
 *   id: 'create-user',
 *   component: UserForm,  // Must be FormProps<UserData>
 *   label: 'Create User',
 *   confirmOnCancel: true,
 * });
 *
 * if (result) {
 *   console.log('Created:', result.name); // Typed as UserData
 * }
 * ```
 */
export interface OpenFormOptions<T = unknown> {
  /**
   * Unique identifier for this form instance.
   *
   * IDs must be unique across all forms currently on the stack. Pushing a form
   * whose `id` is already present produces a **development-mode warning** (a
   * `console.warn` from `openForm`) because duplicate IDs collide on the React
   * `key` used by `FormStackRenderer` and `Breadcrumbs`, which can cause form
   * instance and state mix-ups. Production behavior is unchanged — the form is
   * still pushed — so uniqueness remains a consumer responsibility (PRD §5.2).
   */
  id: string;
  /** The form component to render (must accept FormProps<T>) */
  component: ComponentType<FormProps<T>>;
  /** Optional label displayed in breadcrumbs */
  label?: string;
  /** If true, shows confirmation dialog before cancel */
  confirmOnCancel?: boolean;
}

/**
 * Internal representation of a stack entry.
 * Extends StackEntry with implementation details (not exposed publicly).
 *
 * This is used internally by FormStackProvider to manage the form lifecycle.
 * Consumers should use the public StackEntry interface instead.
 *
 * @template T - The type of value the form will return.
 *               Flows through from OpenFormOptions<T> to DeferredPromise<T>.
 *
 * @see {@link StackEntry} - Public view (id and label only)
 * @see {@link OpenFormOptions} - Input options that create this entry
 * @see {@link DeferredPromise} - Async resolution mechanism
 *
 * @internal
 */
export interface InternalStackEntry<T = unknown> extends StackEntry {
  /** The form component to render */
  component: ComponentType<FormProps<T>>;
  /** Whether to show confirmation before cancel (default: false) */
  confirmOnCancel: boolean;
  /** Deferred promise for async openForm resolution */
  deferred: DeferredPromise<T>;
}
