/**
 * Props interface that all form components must implement.
 * Forms receive these callbacks from FormStackProvider.
 *
 * @template T - The type of value returned when form submits via onSubmit.
 *               This type flows through to the Promise returned by openForm().
 *               Use `unknown` for forms that don't return meaningful data.
 *
 * @see {@link OpenFormOptions} - Options passed to openForm()
 * @see {@link useFormStack} - Hook to open forms with these props
 *
 * @example
 * ```tsx
 * interface UserData { name: string; email: string; }
 *
 * function UserForm({ onSubmit, onCancel }: FormProps<UserData>) {
 *   const handleSubmit = () => {
 *     onSubmit({ name: 'John', email: 'john@example.com' });
 *   };
 *   return (
 *     <form>
 *       <button type="button" onClick={handleSubmit}>Save</button>
 *       <button type="button" onClick={onCancel}>Cancel</button>
 *     </form>
 *   );
 * }
 * ```
 */
export interface FormProps<T = unknown> {
  /** Called when form submits with the form's return value */
  onSubmit: (value: T) => void;
  /** Called when form is canceled (returns undefined to parent) */
  onCancel: () => void;
  /** Optional error handler for form-level errors */
  onError?: (error: unknown) => void;
}

/**
 * Externally-controlled promise pattern.
 * Enables openForm() to return a promise that resolves when form submits/cancels.
 *
 * This pattern allows the FormStackProvider to resolve the promise from outside
 * the promise executor, enabling async form workflows.
 *
 * @template T - The type of value the promise resolves with.
 *               Matches the FormProps<T> type parameter of the opened form.
 *
 * @see {@link createDeferredPromise} - Factory function to create instances
 * @see {@link InternalStackEntry} - Uses DeferredPromise for async resolution
 *
 * @example
 * ```tsx
 * // Internal usage pattern (not typically used directly)
 * const deferred = createDeferredPromise<UserData>();
 *
 * // Later, when form submits:
 * deferred.resolve({ name: 'John', email: 'john@example.com' });
 *
 * // Or when form cancels:
 * deferred.resolve(undefined);
 * ```
 */
export interface DeferredPromise<T> {
  /** The promise that consumers await */
  promise: Promise<T | undefined>;
  /** Resolves the promise with a value (submit) or undefined (cancel) */
  resolve: (value: T | undefined) => void;
  /** Rejects the promise with an error */
  reject: (reason?: unknown) => void;
}
