import type { DeferredPromise } from '../types';

/**
 * Creates a deferred promise with externally accessible resolve/reject functions.
 * Used by openForm() to create promises that resolve when forms submit or cancel.
 *
 * @template T - The type of value the promise resolves with
 * @returns DeferredPromise<T> with promise, resolve, and reject properties
 *
 * @example
 * ```typescript
 * const deferred = createDeferredPromise<User>();
 *
 * // Later, when form submits:
 * deferred.resolve(userData);
 *
 * // Or when form cancels:
 * deferred.resolve(undefined);
 * ```
 */
export function createDeferredPromise<T>(): DeferredPromise<T> {
  // Use definite assignment assertion since executor runs synchronously
  let resolve!: (value: T | undefined) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T | undefined>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
