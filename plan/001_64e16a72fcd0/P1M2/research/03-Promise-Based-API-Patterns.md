# Promise-Based API Patterns with TypeScript - 2025 Research

## Overview
This document covers advanced Promise patterns in TypeScript, including the DeferredPromise pattern, generic Promise types, and proper typing of resolve/reject callbacks.

---

## 1. Promise Constructor Type Definitions

### Basic Promise Type Structure

```typescript
// TypeScript's Promise constructor signature:
declare class Promise<T> {
  constructor(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void
    ) => void
  );
}
```

### Understanding Generic Type Parameters

```typescript
// Promise<T> where T is the resolved value type
const stringPromise: Promise<string> = new Promise((resolve) => {
  resolve('hello');
});

const numberPromise: Promise<number> = new Promise((resolve) => {
  resolve(42);
});

// Chaining infers types correctly
stringPromise.then(str => str.toUpperCase()); // str is string
stringPromise.then(str => ({ length: str.length })); // returns Promise<{ length: number }>
```

---

## 2. Resolve and Reject Callback Types

### Proper Typing of Callbacks

```typescript
// Resolve callback accepts T or PromiseLike<T>
type ResolveCallback<T> = (value: T | PromiseLike<T>) => void;

// Reject callback accepts any reason
type RejectCallback = (reason?: any) => void;

// Full executor signature
type PromiseExecutor<T> = (
  resolve: ResolveCallback<T>,
  reject: RejectCallback
) => void;

// Implementation example
function createPromise<T>(executor: PromiseExecutor<T>): Promise<T> {
  return new Promise(executor);
}

// Usage
const myPromise = createPromise<string>((resolve, reject) => {
  if (Math.random() > 0.5) {
    resolve('success');
  } else {
    reject(new Error('failed'));
  }
});
```

### Promise.resolve() with Generics

```typescript
// Promise.resolve() with explicit type
const resolved: Promise<number> = Promise.resolve(42);
const withValue = Promise.resolve<string>('hello');

// Promise.resolve() with Promise-returning value
const chainedPromise: Promise<string> = Promise.resolve(
  Promise.resolve('hello')
);

// Type inference works across PromiseLike
interface PromiseLike<T> {
  then<TResult1, TResult2>(
    onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): PromiseLike<TResult1 | TResult2>;
}
```

---

## 3. Promise<T | undefined> Pattern

### When to Use Union with Undefined

```typescript
// Use when a promise might not return a meaningful value
type OptionalPromise<T> = Promise<T | undefined>;

// Example: optional data fetch
async function fetchUserOptionally(id: string): OptionalPromise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (response.ok) {
      return response.json();
    }
    return undefined; // User not found
  } catch {
    return undefined; // Error occurred
  }
}

// Usage with type narrowing
const user = await fetchUserOptionally('123');
if (user) {
  console.log(user.name);
} else {
  console.log('User not found');
}

// Better: Use discriminated union (see later pattern)
type FetchResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function fetchUser(id: string): Promise<FetchResult<User>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (response.ok) {
      return { success: true, data: await response.json() };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

### Avoid Promise<T | undefined> Pitfall

```typescript
// AVOID: This is confusing
type BadPromise<T> = Promise<T | undefined>;

// When resolve() is called, TypeScript behavior:
const promise: BadPromise<string> = new Promise((resolve) => {
  resolve('hello'); // Accepted
  resolve(undefined); // Also accepted (confusing!)
});

// BETTER: Use discriminated union or explicit optional handling
interface AsyncResult<T> {
  data: T | undefined;
}

const promise2: Promise<AsyncResult<string>> = Promise.resolve({
  data: undefined,
});

// OR use null explicitly
type NullablePromise<T> = Promise<T | null>;
const promise3: NullablePromise<string> = Promise.resolve(null);
```

---

## 4. DeferredPromise Pattern

### Basic Deferred Implementation

```typescript
// Simple Deferred class (externally controlled promise)
class Deferred<T> {
  promise: Promise<T>;
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

// Usage
const deferred = new Deferred<string>();

// Resolve the promise externally
setTimeout(() => {
  deferred.resolve('resolved value');
}, 1000);

// Consumer waits for resolution
deferred.promise.then(value => {
  console.log('Got:', value); // 'Got: resolved value'
});
```

### Typed Deferred with Error Handling

```typescript
interface Deferred<T, E = Error> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason: E) => void;
}

function createDeferred<T, E = Error>(): Deferred<T, E> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason: E) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

// Usage
const deferred = createDeferred<User, string>();

// Resolve
deferred.resolve({ id: 1, name: 'Alice' });

// Reject
deferred.reject('User not found');
```

---

## 5. Advanced DeferredPromise Patterns

### Deferred with State Tracking

```typescript
enum DeferredState {
  Pending = 'pending',
  Resolved = 'resolved',
  Rejected = 'rejected',
}

class AdvancedDeferred<T, E = Error> {
  private _state: DeferredState = DeferredState.Pending;
  private _value?: T;
  private _error?: E;

  promise: Promise<T>;
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (reason?: E) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = (value) => {
        if (this._state === DeferredState.Pending) {
          this._state = DeferredState.Resolved;
          this._value = value as T;
          resolve(value);
        }
      };

      this.reject = (reason?: E) => {
        if (this._state === DeferredState.Pending) {
          this._state = DeferredState.Rejected;
          this._error = reason;
          reject(reason);
        }
      };
    });
  }

  get state(): DeferredState {
    return this._state;
  }

  get isPending(): boolean {
    return this._state === DeferredState.Pending;
  }

  get value(): T | undefined {
    return this._value;
  }

  get error(): E | undefined {
    return this._error;
  }
}

// Usage
const deferred = new AdvancedDeferred<string>();
console.log(deferred.isPending); // true
deferred.resolve('done');
console.log(deferred.isPending); // false
console.log(deferred.value); // 'done'
```

### Deferred with Timeout

```typescript
class DeferredWithTimeout<T, E = Error> extends AdvancedDeferred<T, E> {
  constructor(timeoutMs?: number) {
    super();

    if (timeoutMs) {
      setTimeout(() => {
        if (this.isPending) {
          const timeout = new Error('Deferred promise timed out') as unknown as E;
          this.reject(timeout);
        }
      }, timeoutMs);
    }
  }
}

// Usage
const timedDeferred = new DeferredWithTimeout<string>(5000);

// If not resolved within 5 seconds, automatically rejects
```

---

## 6. Promise Utility Patterns

### Generic Promise Helper Types

```typescript
// Extract resolved type from promise
type Awaited<T> = T extends Promise<infer U> ? U : T;

const stringPromise: Promise<string> = Promise.resolve('hello');
type PromiseContent = Awaited<typeof stringPromise>; // string

// Create promise union type
type MaybePromise<T> = T | Promise<T>;

function handleMaybePromise<T>(value: MaybePromise<T>): Promise<T> {
  return Promise.resolve(value);
}

// Promise result type (like Rust Result)
type PromiseResult<T, E = Error> = Promise<[T, null] | [null, E]>;

function promiseResult<T>(
  promise: Promise<T>
): PromiseResult<T> {
  return promise
    .then((data) => [data, null] as const)
    .catch((error) => [null, error] as const);
}

// Usage
const result = await promiseResult(fetchData());
if (result[0] !== null) {
  console.log('Success:', result[0]);
} else {
  console.log('Error:', result[1]);
}
```

### Promise.all with Type Safety

```typescript
// Type-safe Promise.all with heterogeneous tuples
type PromiseTuple = [Promise<string>, Promise<number>, Promise<boolean>];

type PromiseResults<T extends readonly Promise<any>[]> = T extends readonly [
  Promise<infer A>,
  Promise<infer B>,
  Promise<infer C>,
]
  ? [A, B, C]
  : T extends readonly [Promise<infer A>, Promise<infer B>]
  ? [A, B]
  : T extends readonly [Promise<infer A>]
  ? [A]
  : any[];

const promises = [
  Promise.resolve('hello'),
  Promise.resolve(42),
  Promise.resolve(true),
] as const;

const results: PromiseResults<typeof promises> = await Promise.all(promises);
// results is [string, number, boolean]
```

### Race with Type Safety

```typescript
type RaceResult<T extends readonly Promise<any>[]> = T extends readonly (Promise<infer U> | infer U)[]
  ? U
  : never;

const racePromises = [
  Promise.resolve<string>('fast'),
  Promise.resolve<number>(42),
] as const;

const result: RaceResult<typeof racePromises> = await Promise.race(racePromises);
// result is string | number
```

---

## 7. Async/Await with Proper Typing

### Typed Async Functions

```typescript
// Explicit return type
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// With error handling
async function fetchUserSafe(id: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// With discriminated union result
async function fetchUserResult(id: string): Promise<FetchResult<User>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (response.ok) {
      return { success: true, data: await response.json() };
    }
    return { success: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

### Generic Async Wrapper

```typescript
// Retry pattern with typed promises
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

// Usage
const user = await withRetry(
  () => fetchUser('123'),
  3,
  1000
);
```

---

## 8. Promise Cancellation Pattern

### Cancellable Promise

```typescript
interface Cancellable<T> {
  promise: Promise<T>;
  cancel: () => void;
}

function makeCancellable<T>(promise: Promise<T>): Cancellable<T> {
  let cancelled = false;

  const wrappedPromise = promise.then(
    (value) => {
      if (cancelled) {
        throw new Error('Promise cancelled');
      }
      return value;
    },
    (error) => {
      if (cancelled) {
        throw new Error('Promise cancelled');
      }
      throw error;
    }
  );

  return {
    promise: wrappedPromise,
    cancel: () => {
      cancelled = true;
    },
  };
}

// Usage
const cancellable = makeCancellable(fetchData());

setTimeout(() => {
  cancellable.cancel();
}, 5000);

try {
  await cancellable.promise;
} catch (error) {
  if ((error as Error).message === 'Promise cancelled') {
    console.log('Request was cancelled');
  }
}
```

---

## 9. Best Practices Summary

| Pattern | Use Case | Example |
|---------|----------|---------|
| Basic Promise<T> | Standard async operations | fetch, database queries |
| Promise<T \| null> | Optional results | user lookups that might not exist |
| Deferred<T> | External resolution control | event-driven async, testing |
| DeferredWithTimeout<T> | Time-bound operations | request timeouts |
| FetchResult<T> | Error handling | API responses with errors |
| Cancellable<T> | Cleanup scenarios | request cancellation |
| Promise.all with types | Multiple async operations | batch operations |

---

## 10. Key Takeaways

1. **Use explicit return types** on async functions
2. **Avoid `Promise<T | undefined>`** - use null or discriminated unions instead
3. **Deferred pattern** useful for external promise resolution
4. **Type resolve/reject callbacks** explicitly
5. **Use discriminated unions** for error handling instead of try/catch alone
6. **Leverage TypeScript's type inference** with async/await
7. **Create reusable async utility types** for common patterns

---

## References

- [TypeScript Promise Type Documentation](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [MDN - Promise.resolve()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve)
- [Implementing a Defer Class in TypeScript](https://dev.to/shcheglov/implementing-a-defer-class-in-typescript-3ok3)
- [Mastering Deferred Promises in TypeScript](https://www.xjavascript.com/blog/deferred-promise-typescript/)
- [TypeScript Promise Async/Await Guide](https://blog.bitsrc.io/keep-your-promises-in-typescript-using-async-await-7bdc57041308)
