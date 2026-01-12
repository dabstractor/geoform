# React/TypeScript Development-Only Error Patterns

## Table of Contents
1. [Overview](#overview)
2. [React's invariant() Pattern](#reacts-invariant-pattern)
3. [TypeScript Error Throwing Patterns](#typescript-error-throwing-patterns)
4. [NODE_ENV Guard Patterns](#node_env-guard-patterns)
5. [Popular Library Examples](#popular-library-examples)
6. [Best Practices](#best-practices)
7. [Implementation Examples](#implementation-examples)
8. [References](#references)

---

## Overview

Development-only errors are validation checks that run only during development to catch bugs early, while being completely removed from production builds for performance. This pattern is widely used in React, Redux, React Router, and other major libraries.

**Key Benefits:**
- Catch bugs early during development
- Better error messages with debugging context
- Zero runtime cost in production
- Smaller production bundle size

---

## React's invariant() Pattern

### What is invariant()?

The `invariant()` function is React's internal development-only error checking utility. It throws an error if a condition is false, but only in development builds.

### Classic invariant() Pattern

```typescript
/**
 * React's internal invariant pattern
 * Throws in development, does nothing in production
 */
function invariant(condition: any, message: string): asserts condition {
  if (process.env.NODE_ENV !== 'production') {
    if (!condition) {
      throw new Error(`Invariant failed: ${message}`);
    }
  }
}

// Usage
invariant(
  value > 0,
  'Value must be greater than 0'
);
```

### Modern TypeScript Variant with Type Guards

```typescript
/**
 * Type-safe invariant that narrows types
 */
function invariant<T>(
  condition: T | null | undefined,
  message: string
): asserts condition is T {
  if (process.env.NODE_ENV !== 'production') {
    if (condition === null || condition === undefined) {
      throw new Error(`Invariant violation: ${message}`);
    }
  }
}

// Usage - TypeScript knows value is non-null after this
const value: string | null = getValue();
invariant(value, 'value should not be null');
value.toLowerCase(); // Safe! TypeScript knows value is string
```

### React Source Code Example

From React's actual source code (simplified):

```javascript
// react-reconciler/src/ReactFiberStack.new.js
if (__DEV__) {
  if (currentFiber === null) {
    throw new Error(
      'Expected a parent fiber to be set. ' +
      'This error is likely caused by a bug in React.'
    );
  }
}
```

---

## TypeScript Error Throwing Patterns

### 1. RangeError for Invalid Ranges

Use `RangeError` when a value is outside an acceptable range.

```typescript
function validateIndex(index: number, arrayLength: number): void {
  if (process.env.NODE_ENV !== 'production') {
    if (index < 0 || index >= arrayLength) {
      throw new RangeError(
        `Index ${index} out of bounds. ` +
        `Expected: 0 <= index < ${arrayLength}`
      );
    }
  }
}

// Usage
const arr = [1, 2, 3];
validateIndex(5, arr.length); // Throws in dev only
```

### 2. TypeError for Invalid Types

Use `TypeError` when a value has the wrong type.

```typescript
function assertString(value: unknown, paramName: string): asserts value is string {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof value !== 'string') {
      throw new TypeError(
        `Parameter '${paramName}' must be a string. ` +
        `Got: ${typeof value}`
      );
    }
  }
}

// Usage
function processInput(input: unknown) {
  assertString(input, 'input');
  // TypeScript knows input is string here
  return input.toUpperCase();
}
```

### 3. Error for Invalid State

Use generic `Error` for invalid application state or logic errors.

```typescript
function assertUnreachable(x: never): never {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(
      'Unexpected object: ' + x
    );
  }
  return x;
}

// Usage in exhaustive switch
type Action = { type: 'ADD' } | { type: 'REMOVE' };

function reducer(action: Action) {
  switch (action.type) {
    case 'ADD':
      return 'added';
    case 'REMOVE':
      return 'removed';
    default:
      return assertUnreachable(action);
  }
}
```

---

## NODE_ENV Guard Patterns

### Pattern 1: Direct Check

```typescript
if (process.env.NODE_ENV !== 'production') {
  // Development-only validation
  if (!isValid(value)) {
    throw new Error('Invalid value detected');
  }
}
```

### Pattern 2: Helper Function

```typescript
const DEV = process.env.NODE_ENV !== 'production';

function devAssert(condition: boolean, message: string): void {
  if (DEV && !condition) {
    throw new Error(message);
  }
}

// Usage
devAssert(stack.length >= index, 'Index out of bounds');
```

### Pattern 3: Build-Time Constant

TypeScript configuration with DefinePlugin:

```typescript
// webpack.config.js or vite.config.ts
export default {
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
};

// TypeScript declaration
declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
  };
};
```

### Pattern 4: Tree-Shakeable Dev Checks

```typescript
// In a separate dev-only file
export function devWarning(condition: boolean, message: string): void {
  if (process.env.NODE_ENV !== 'production') {
    if (!condition) {
      console.warn(message);
    }
  }
}

// Production builds can tree-shake this entire file
```

---

## Popular Library Examples

### React Router

```typescript
// react-router-dom invariant pattern
function invariant(
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

// Usage
invariant(
  typeof params.pageNum === 'string',
  'Page number must be a string'
);
```

### Redux

```typescript
// Redux dev-only checks
if (process.env.NODE_ENV !== 'production') {
  if (typeof action.type === 'undefined') {
    throw new Error(
      'Actions may not have an undefined "type" property. ' +
      'You may have misspelled an action type string constant.'
    );
  }
}
```

### React Query

```typescript
// React Query dev warnings
if (process.env.NODE_ENV === 'development') {
  if (!options.queryKey) {
    console.error(
      'useQuery requires a queryKey. ' +
      'See https://tanstack.com/query/latest/docs/react/guides/query-keys'
    );
  }
}
```

### Zustand

```typescript
// Zustand dev-only middleware
if (process.env.NODE_ENV === 'development') {
  config.devtools = true;
}
```

---

## Best Practices

### 1. Use Descriptive Error Messages

```typescript
// Good
if (DEV && index < 0) {
  throw new Error(
    `popToIndex(${index}) failed: index cannot be negative. ` +
    `Current stack length: ${stack.length}`
  );
}

// Bad
if (DEV && index < 0) {
  throw new Error('Invalid index');
}
```

### 2. Include Context in Errors

```typescript
function validateStackOperation(operation: string, index: number, maxLength: number) {
  if (DEV) {
    if (index < 0 || index >= maxLength) {
      throw new RangeError(
        `Cannot ${operation} at index ${index}. ` +
        `Valid range: [0, ${maxLength - 1}]. ` +
        `Current stack length: ${maxLength}.`
      );
    }
  }
}
```

### 3. Use Type Assertions

```typescript
function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (DEV && value === undefined || value === null) {
    throw new Error(`Expected value to be defined, but received ${value}`);
  }
}

// Usage
const value = maybeString();
assertIsDefined(value);
console.log(value.toUpperCase()); // Safe!
```

### 4. Separate Validation from Logic

```typescript
// Good: Validation separate
function popToIndex(index: number) {
  if (DEV) {
    validatePopToIndex(index, state.stack.length);
  }
  // Actual logic
  return state.stack.slice(0, index + 1);
}

// Less ideal: Validation mixed
function popToIndex(index: number) {
  if (DEV && (index < 0 || index >= state.stack.length)) {
    throw new RangeError('Invalid index');
  }
  return state.stack.slice(0, index + 1);
}
```

### 5. Use Constants for Reusable Messages

```typescript
const ERROR_MESSAGES = {
  INVALID_INDEX: (index: number, max: number) =>
    `Index ${index} out of bounds. Must be between 0 and ${max - 1}`,
  EMPTY_STACK: 'Cannot pop from empty stack',
  MISSING_PROVIDER: (hookName: string) =>
    `${hookName} must be used within its provider`,
} as const;

if (DEV) {
  throw new Error(ERROR_MESSAGES.INVALID_INDEX(index, max));
}
```

---

## Implementation Examples

### Example 1: Context Hook with Dev-Only Error

```typescript
import { useContext } from 'react';

const FormStackContext = createContext<FormStackState | null>(null);

export function useFormStack(): FormStackState {
  const context = useContext(FormStackContext);

  if (process.env.NODE_ENV !== 'production') {
    if (context === null) {
      throw new Error(
        'useFormStack must be used within FormStackProvider. ' +
        'Wrap your component tree with <FormStackProvider>.'
      );
    }
  }

  return context;
}
```

### Example 2: Reducer with Exhaustive Check

```typescript
type FormStackAction =
  | { type: 'PUSH_FORM'; entry: FormEntry }
  | { type: 'POP_FORM' }
  | { type: 'POP_TO_INDEX'; index: number };

function formStackReducer(
  state: FormStackState,
  action: FormStackAction
): FormStackState {
  switch (action.type) {
    case 'PUSH_FORM':
      return { stack: [...state.stack, action.entry] };
    case 'POP_FORM':
      return { stack: state.stack.slice(0, -1) };
    case 'POP_TO_INDEX':
      if (process.env.NODE_ENV !== 'production') {
        if (action.index < 0 || action.index >= state.stack.length) {
          throw new RangeError(
            `POP_TO_INDEX(${action.index}) failed. ` +
            `Valid range: [0, ${state.stack.length - 1}]`
          );
        }
      }
      return { stack: state.stack.slice(0, action.index + 1) };
    default:
      if (process.env.NODE_ENV !== 'production') {
        const exhaustive: never = action;
        throw new Error(`Unknown action: ${JSON.stringify(exhaustive)}`);
      }
      return state;
  }
}
```

### Example 3: Range Validation Helper

```typescript
/**
 * Development-only range validation
 */
function validateRange(
  value: number,
  min: number,
  max: number,
  context: string
): void {
  if (process.env.NODE_ENV !== 'production') {
    if (value < min || value > max) {
      throw new RangeError(
        `${context}: value ${value} is out of range. ` +
        `Expected: ${min} <= value <= ${max}`
      );
    }
  }
}

// Usage
function popToIndex(index: number) {
  validateRange(index, 0, state.stack.length - 1, 'popToIndex');
  return { stack: state.stack.slice(0, index + 1) };
}
```

### Example 4: Invariant Utility

```typescript
/**
 * React-style invariant utility
 */
export function invariant(
  condition: any,
  message: string
): asserts condition {
  if (process.env.NODE_ENV !== 'production') {
    if (!condition) {
      throw new Error(`Invariant violation: ${message}`);
    }
  }
}

// Usage
invariant(
  stack.length > 0,
  'Cannot pop from empty stack'
);
```

### Example 5: Type Guard with Runtime Check

```typescript
/**
 * Type guard that validates at runtime in development
 */
function isNonNullable<T>(value: T): value is NonNullable<T> {
  if (process.env.NODE_ENV !== 'production') {
    if (value === null || value === undefined) {
      throw new Error(
        `Unexpected null/undefined value. ` +
        `This should never happen and indicates a bug.`
      );
    }
  }
  return value !== null && value !== undefined;
}

// Usage
function processValue(value: string | null) {
  if (isNonNullable(value)) {
    return value.toUpperCase();
  }
  return '';
}
```

---

## References

### Official React Sources
- **React Repository**: https://github.com/facebook/react
  - Search for `invariant` in the codebase
  - Look for `__DEV__` guards
  - Check `react-reconciler` package

- **React Documentation**: https://react.dev
  - Error handling sections
  - Build optimization guides

### TypeScript Resources
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/
  - Type guards and narrowing
  - Assert functions
  - Type assertions

### Popular Libraries
- **React Router**: https://github.com/remix-run/react-router
  - Invariant implementations
  - Error handling patterns

- **Redux**: https://github.com/reduxjs/redux
  - Development warnings
  - Action type validation

- **Zustand**: https://github.com/pmndrs/zustand
  - Devtools integration
  - Development middleware

- **React Query**: https://github.com/TanStack/query
  - Query key validation
  - Development warnings

### Community Resources
- **Development-Only Checks Pattern**: Common in many React libraries
- **Build Optimization**: Vite/Webpack tree-shaking for dev-only code
- **TypeScript Assert Functions**: Handbook section on assertion functions

---

## Summary

Development-only error patterns provide:

1. **Early Bug Detection**: Catch issues during development
2. **Better DX**: Helpful error messages with context
3. **Zero Production Cost**: Completely removed from builds
4. **Type Safety**: Work with TypeScript's type system
5. **Industry Standard**: Used by React, Redux, React Router, etc.

**Key Patterns:**
- `invariant()` for general assertions
- `RangeError` for invalid ranges
- `TypeError` for invalid types
- `process.env.NODE_ENV` guards
- Helper functions for reusable validation
- Type assertions with runtime checks
