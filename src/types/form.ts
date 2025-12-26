/**
 * Props interface that all form components must implement.
 * Forms receive these callbacks from FormStackProvider.
 * @template T - The type of value returned by onSubmit
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
 * @template T - The type of value the promise resolves with
 */
export interface DeferredPromise<T> {
  /** The promise that consumers await */
  promise: Promise<T | undefined>;
  /** Resolves the promise with a value (submit) or undefined (cancel) */
  resolve: (value: T | undefined) => void;
  /** Rejects the promise with an error */
  reject: (reason?: unknown) => void;
}
