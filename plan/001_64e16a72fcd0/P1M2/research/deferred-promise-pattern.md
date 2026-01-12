# DeferredPromise Pattern in TypeScript/JavaScript

## Overview

The DeferredPromise pattern is a design pattern that separates promise creation from promise resolution/rejection. It allows you to create a promise and capture its resolve/reject functions externally, enabling control over when the promise is settled from outside the executor function.

This pattern is particularly useful when:
- One part of your system establishes a promise while another part fulfills it
- You need to resolve/reject promises based on events, user actions, or external conditions
- You're implementing complex asynchronous workflows that don't fit standard async patterns
- Testing scenarios where you want to control when promises resolve

## Core Concept

Unlike standard ES6 Promises which immediately execute their executor function:

```typescript
// Standard Promise - executor runs immediately
const standardPromise = new Promise<number>((resolve, reject) => {
  // This code runs immediately
  resolve(42);
});
```

A DeferredPromise separates this into two phases:

```typescript
// DeferredPromise - resolution is deferred to later
const deferred = new DeferredPromise<number>();
// ... do other things ...
deferred.resolve(42); // Resolve when ready
```

## TypeScript Type Definitions

### Basic DeferredPromise Interface

```typescript
interface DeferredPromise<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}
```

### With State Tracking

```typescript
interface DeferredPromise<T> {
  promise: Promise<T>;
  state: "pending" | "fulfilled" | "rejected";
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  rejectionReason?: any;
}
```

### Class-Based Implementation

```typescript
class Defer<T> {
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
const defer = new Defer<string>();
defer.promise.then(value => console.log(value));
defer.resolve("Hello");
```

### Factory Function Implementation

```typescript
function createDeferred<T>(): DeferredPromise<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

// Usage
const { promise, resolve, reject } = createDeferred<number>();
promise.then(value => console.log(value));
resolve(42);
```

## Implementation Examples

### Example 1: Basic Deferred Promise

```typescript
interface DeferredPromise<T> {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
}

function createDeferred<T>(): DeferredPromise<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

// Example usage
const deferred = createDeferred<string>();
console.log(deferred.promise); // Promise pending
deferred.resolve("Success!");
```

### Example 2: Class-Based Defer

```typescript
class Defer<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;

  constructor() {
    let res!: (value: T | PromiseLike<T>) => void;
    let rej!: (reason?: any) => void;

    this.promise = new Promise<T>((resolve, reject) => {
      res = resolve;
      rej = reject;
    });

    this.resolve = res;
    this.reject = rej;
  }
}

// Usage
const defer = new Defer<number>();
defer.promise.then(value => console.log(`Got: ${value}`));
defer.resolve(100);
```

### Example 3: With State Tracking

```typescript
type PromiseState = "pending" | "fulfilled" | "rejected";

interface DeferredPromise<T> {
  promise: Promise<T>;
  state: PromiseState;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  rejectionReason?: any;
}

function createDeferredWithState<T>(): DeferredPromise<T> {
  let state: PromiseState = "pending";
  let rejectionReason: any = undefined;
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = (value: T | PromiseLike<T>) => {
      if (state === "pending") {
        state = "fulfilled";
        res(value);
      }
    };
    reject = (reason?: any) => {
      if (state === "pending") {
        state = "rejected";
        rejectionReason = reason;
        rej(reason);
      }
    };
  });

  return { promise, state, resolve, reject, rejectionReason };
}
```

### Example 4: Event-Based Resolution

```typescript
interface Port {
  on(event: string, callback: (port: this) => void): void;
}

function getPortAsPromise(port: Port): Promise<Port> {
  const deferred = createDeferred<Port>();

  port.on("open", (openPort) => {
    deferred.resolve(openPort);
  });

  port.on("error", (error) => {
    deferred.reject(error);
  });

  return deferred.promise;
}

// Usage
const port = getPort();
getPortAsPromise(port)
  .then(p => console.log("Port opened:", p))
  .catch(e => console.error("Port error:", e));
```

## Popular Libraries

### 1. @open-draft/deferred-promise

The most modern and well-maintained deferred promise library.

**Installation:**
```bash
npm install @open-draft/deferred-promise
```

**Features:**
- Extends native Promise directly
- State tracking (pending/fulfilled/rejected)
- Full Promises/A+ compliance
- Zero dependencies
- Node.js-inspired patterns

**Usage:**
```typescript
import { DeferredPromise } from "@open-draft/deferred-promise";

const deferred = new DeferredPromise<string>();

console.log(deferred.state); // "pending"

deferred.promise.then(value => {
  console.log(value);
  console.log(deferred.state); // "fulfilled"
});

deferred.resolve("Hello!");

// Can also await
await deferred.promise;
```

**With Rejection:**
```typescript
const deferred = new DeferredPromise<string>();

deferred.promise
  .then(value => console.log(value))
  .catch(reason => console.error("Rejected:", reason));

deferred.reject(new Error("Something went wrong"));
console.log(deferred.state); // "rejected"
console.log(deferred.rejectionReason); // Error object
```

**API Reference:**
- `promise` - The underlying Promise<T>
- `state` - Current state ("pending" | "fulfilled" | "rejected")
- `resolve(value: T | PromiseLike<T>)` - Resolve the promise
- `reject(reason?: any)` - Reject the promise
- `rejectionReason` - Access the rejection reason

**Links:**
- NPM: https://www.npmjs.com/package/@open-draft/deferred-promise
- GitHub: https://github.com/open-draft/deferred-promise
- README: https://github.com/open-draft/deferred-promise/blob/main/README.md

### 2. ts-deferred

A very simple TypeScript deferred implementation.

**Installation:**
```bash
npm install ts-deferred
```

**Usage:**
```typescript
import { Deferred } from "ts-deferred";

const deferred = new Deferred<string>();

deferred.promise.then(text => console.log(text));

deferred.resolve("Hello World!");
```

**Links:**
- NPM: https://www.npmjs.com/package/ts-deferred
- GitHub: https://github.com/shogogg/ts-deferred

### 3. typescript-deferred

A Promises/A+ compliant implementation with zero dependencies.

**Installation:**
```bash
npm install typescript-deferred
```

**Usage:**
```typescript
import * as tsd from "typescript-deferred";

// Method 1: Using tsd.create()
const deferred = tsd.create<number>();
deferred.promise.then(value => console.log(value));
deferred.resolve(42);

// Method 2: Using tsd.when()
const promise = tsd.when(42);
promise.then(value => console.log(value));
```

**Links:**
- NPM: https://www.npmjs.com/package/typescript-deferred
- GitHub: https://github.com/DirtyHairy/typescript-deferred

## React Integration

### React Hook Implementation

```typescript
type DeferredPromise<T> = {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
};

function useDeferred<T>(): [
  defer: () => DeferredPromise<T>,
  deferRef: React.MutableRefObject<DeferredPromise<T> | null>
] {
  const deferRef = useRef<DeferredPromise<T> | null>(null);

  const defer = useCallback(() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: any) => void;

    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const deferred: DeferredPromise<T> = { promise, resolve, reject };
    deferRef.current = deferred;
    return deferred;
  }, []);

  return [defer, deferRef];
}

// Usage Example: Confirmation Dialog
function TaskItem({ id, onRemove }: { id: string; onRemove: (id: string) => void }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [defer, deferRef] = useDeferred<boolean>();

  const handleRemoveClick = async () => {
    setShowConfirm(true);
    const { promise } = defer();

    const confirmed = await promise;
    if (confirmed) {
      onRemove(id);
    }
    setShowConfirm(false);
  };

  const handleConfirm = () => {
    deferRef.current?.resolve(true);
  };

  const handleCancel = () => {
    deferRef.current?.resolve(false);
  };

  return (
    <>
      <button onClick={handleRemoveClick}>Remove</button>
      {showConfirm && (
        <Dialog>
          <p>Are you sure?</p>
          <button onClick={handleConfirm}>Yes</button>
          <button onClick={handleCancel}>No</button>
        </Dialog>
      )}
    </>
  );
}
```

## Best Practices

### 1. Use Sparingly

Deferred promises add complexity. Use them only when necessary:

```typescript
// Good: Complex event-driven scenario
function waitForUserConfirmation(): Promise<boolean> {
  const deferred = createDeferred<boolean>();

  showDialog({
    onConfirm: () => deferred.resolve(true),
    onCancel: () => deferred.resolve(false),
  });

  return deferred.promise;
}

// Avoid: Simple async operation
// Bad - use async/await instead
// function fetchUser() {
//   const deferred = createDeferred<User>();
//   fetch('/api/user')
//     .then(r => r.json())
//     .then(user => deferred.resolve(user))
//     .catch(e => deferred.reject(e));
//   return deferred.promise;
// }

// Good
async function fetchUser(): Promise<User> {
  const response = await fetch('/api/user');
  return response.json();
}
```

### 2. Memory Leak Prevention

Always ensure deferred promises are settled:

```typescript
// Risky: promise may never settle
function startAnimation() {
  const deferred = createDeferred<void>();
  // If animation never completes, promise hangs
  element.addEventListener("animationend", () => deferred.resolve());
  return deferred.promise;
}

// Better: Add timeout fallback
function startAnimation(timeoutMs = 5000) {
  const deferred = createDeferred<void>();

  const timeout = setTimeout(
    () => deferred.reject(new Error("Animation timeout")),
    timeoutMs
  );

  element.addEventListener("animationend", () => {
    clearTimeout(timeout);
    deferred.resolve();
  });

  return deferred.promise;
}
```

### 3. Clear Naming

Use descriptive names that indicate intent:

```typescript
// Better naming
class UserConfirmationDialog {
  private confirmationDeferred = createDeferred<boolean>();

  onConfirm() {
    this.confirmationDeferred.resolve(true);
  }

  getConfirmation(): Promise<boolean> {
    return this.confirmationDeferred.promise;
  }
}

// Avoid generic names
// const d = createDeferred<boolean>(); // What is this?
// const p = createDeferred<string>(); // What does it do?
```

### 4. Error Handling

Always include error handlers:

```typescript
const deferred = createDeferred<string>();

deferred.promise
  .then(value => {
    console.log("Success:", value);
  })
  .catch(reason => {
    console.error("Error:", reason);
  });

// Reject with proper Error objects
deferred.reject(new Error("Something failed"));
```

## Edge Cases and Gotchas

### 1. Multiple Resolutions

Only the first resolution/rejection matters:

```typescript
const deferred = createDeferred<string>();

deferred.resolve("first");
deferred.resolve("second"); // Ignored

deferred.promise.then(value => {
  console.log(value); // Logs "first"
});
```

### 2. Resolving with Promises

Resolve can accept another promise:

```typescript
const deferred = createDeferred<string>();
const innerPromise = Promise.resolve("inner value");

deferred.resolve(innerPromise);

deferred.promise.then(value => {
  console.log(value); // "inner value" (unwrapped)
});
```

### 3. Type Safety with Generics

Always specify the generic type parameter:

```typescript
// Good
const deferred = createDeferred<{ id: string; name: string }>();
deferred.resolve({ id: "1", name: "John" });

// Avoid
// const deferred = createDeferred();
// deferred.resolve({ id: "1", name: "John" }); // No type checking
```

### 4. Undefined is a Valid Value

Be careful with optional types:

```typescript
interface User {
  id: string;
  name?: string; // Optional
}

const deferred = createDeferred<User | undefined>();

deferred.resolve(undefined); // Valid
deferred.promise.then(user => {
  console.log(user); // undefined
});
```

### 5. Rejection Propagation

Rejections require proper error handling:

```typescript
const deferred = createDeferred<string>();

// Unhandled rejection warning if not caught
deferred.promise
  .then(value => console.log(value))
  .catch(error => console.error(error));

deferred.reject(new Error("Failed"));
```

## Common Use Cases

### 1. Event-Based API Control

```typescript
class EventBus {
  private events = new Map<string, DeferredPromise<any>[]>();

  async wait<T>(eventName: string): Promise<T> {
    const deferred = createDeferred<T>();

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    this.events.get(eventName)!.push(deferred);
    return deferred.promise;
  }

  emit<T>(eventName: string, data: T) {
    const handlers = this.events.get(eventName) || [];
    handlers.forEach(handler => handler.resolve(data));
    this.events.delete(eventName);
  }
}

// Usage
const bus = new EventBus();

async function listener() {
  const data = await bus.wait<string>("user-login");
  console.log("User logged in:", data);
}

bus.emit("user-login", "john@example.com");
```

### 2. Controlled Async Testing

```typescript
interface AsyncTest<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

function createAsyncTest<T>(): AsyncTest<T> {
  return createDeferred<T>();
}

// Test usage
describe("async component", () => {
  it("handles user action", async () => {
    const test = createAsyncTest<string>();

    const component = render(<MyComponent onSuccess={test.resolve} />);

    const button = component.getByRole("button");
    fireEvent.click(button);

    const result = await test.promise;
    expect(result).toBe("success");
  });
});
```

### 3. Resource Initialization Control

```typescript
class AsyncResource<T> {
  private deferred = createDeferred<T>();

  async initialize(factory: () => Promise<T>) {
    try {
      const resource = await factory();
      this.deferred.resolve(resource);
    } catch (error) {
      this.deferred.reject(error);
    }
  }

  async get(): Promise<T> {
    return this.deferred.promise;
  }
}

// Usage
const dbResource = new AsyncResource<Database>();

// Start initialization without waiting
dbResource.initialize(() => Database.connect("localhost"));

// Later, wait for initialization
const db = await dbResource.get();
```

## Performance Considerations

1. **No Overhead Over Standard Promises**: Deferred promises have the same runtime performance as standard promises.

2. **Memory Usage**: Each deferred promise creates one additional closure for capturing resolve/reject.

3. **Avoid Nesting**: Don't create deferred promises that resolve to other deferred promises:

```typescript
// Avoid nesting
const d1 = createDeferred<DeferredPromise<string>>();

// Better: flatten structure
const d2 = createDeferred<string>();
```

## Summary

The DeferredPromise pattern is a powerful tool for managing asynchronous operations when you need external control over promise resolution. Key takeaways:

- Use when promise resolution is driven by external events or conditions
- Implement using either class-based or factory-function approaches
- Always specify generic type parameters for type safety
- Consider @open-draft/deferred-promise for a well-maintained implementation
- Use sparingly and with clear naming
- Ensure proper error handling and memory cleanup
- Follow Promise/A+ specification compliance

The pattern is particularly useful in event-driven systems, testing scenarios, and complex asynchronous workflows where standard async/await patterns don't fit naturally.

## References

- [DEV Community: Deferred Promise Pattern](https://dev.to/webduvet/deferred-promise-pattern-2j59)
- [DEV Community: Implementing a Defer Class in TypeScript](https://dev.to/shcheglov/implementing-a-defer-class-in-typescript-3ok3)
- [DEV Community: Creating a Deferred Promise Hook in React](https://dev.to/vicnovais/creating-a-deferred-promise-hook-in-react-39jh)
- [@open-draft/deferred-promise - npm](https://www.npmjs.com/package/@open-draft/deferred-promise)
- [@open-draft/deferred-promise - GitHub](https://github.com/open-draft/deferred-promise)
- [ts-deferred - npm](https://www.npmjs.com/package/ts-deferred)
- [ts-deferred - GitHub](https://github.com/shogogg/ts-deferred)
- [typescript-deferred - npm](https://www.npmjs.com/package/typescript-deferred)
- [typescript-deferred - GitHub](https://github.com/DirtyHairy/typescript-deferred)
- [xjavascript.com: Mastering Deferred Promises in TypeScript](https://www.xjavascript.com/blog/deferred-promise-typescript/)
- [Deferred - A TypeScript Promise wrapper](https://romkevandermeulen.nl/2016/09/18/deferred-typescript.html)
