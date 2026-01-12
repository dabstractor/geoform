# Implementation Guide: Development Warnings Based on External Best Practices

## Quick Reference: GitHub URLs and Implementation Patterns

### 1. React Router Implementation
**Repository:** https://github.com/remix-run/react-router

**Key File:** `packages/react-router/lib/utils.ts`
**URL:** https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/utils.ts

**Implementation:**
```typescript
// React Router's invariant pattern
function invariant(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

// Usage with context
if (process.env.NODE_ENV !== 'production') {
  invariant(
    typeof params.pageNum === 'string',
    `Page number must be a string, received: ${typeof params.pageNum}`
  );
}
```

---

### 2. Redux Toolkit Implementation
**Repository:** https://github.com/reduxjs/redux-toolkit

**Key File:** `src/utils/devModeChecks.ts`
**URL:** https://github.com/reduxjs/redux-toolkit/blob/master/src/utils/devModeChecks.ts

**Implementation:**
```typescript
// Redux Toolkit's development mode checks
if (process.env.NODE_ENV !== 'production') {
  const isPlainObject = (value: any) => {
    return (
      typeof value === 'object' &&
      value !== null &&
      Object.getPrototypeOf(value) === Object.prototype
    );
  };

  if (!isPlainObject(state)) {
    console.warn(
      `A plain object was expected but received: ${typeof state}. ` +
      `This may cause unexpected behavior with immer.`
    );
  }
}
```

---

### 3. React Query Implementation
**Repository:** https://github.com/TanStack/query

**Key File:** `packages/react-query/src/useQuery.ts`
**URL:** https://github.com/TanStack/query/blob/main/packages/react-query/src/useQuery.ts

**Implementation:**
```typescript
// React Query's validation with documentation links
if (process.env.NODE_ENV === 'development') {
  if (!options.queryKey) {
    console.error(
      'useQuery requires a queryKey. ' +
      'See https://tanstack.com/query/latest/docs/react/guides/query-keys'
    );
  }
}
```

---

### 4. React Implementation
**Repository:** https://github.com/facebook/react

**Key File:** `packages/react/src/React.js`
**URL:** https://github.com/facebook/react/blob/main/packages/react/src/React.js

**Search Query for Warnings:**
```
https://github.com/facebook/react/search?q=console.warn+language%3Ajavascript&type=code
```

**Implementation:**
```javascript
// React's warning deduplication pattern
const didWarnAboutInvalidValueType = new Set<any>();

function processValue(value: any) {
  if (__DEV__) {
    if (typeof value === 'function' && !didWarnAboutInvalidValueType.has(value)) {
      didWarnAboutInvalidValueType.add(value);
      console.warn(
        'Received a function as a value. This is likely a mistake. ' +
        'Functions should be passed as callbacks, not values.'
      );
    }
  }
}
```

---

## Pattern Comparison: How Major Libraries Handle Warnings

### Console Message Structure

| Library | Pattern | Example |
|---------|---------|---------|
| **React Router** | Simple invariant | `throw new Error(message)` |
| **Redux Toolkit** | Detailed warning with context | `console.warn(\`Expected ${type}, got ${actual}\`)` |
| **React Query** | Warning + documentation link | `console.error('Message. See: https://...')` |
| **React** | Deduplicated warning | `if (!didWarn.has(value)) { warn() }` |
| **Zustand** | Branded warnings | `console.warn('[Zustand] message')` |

---

## Implementation Templates

### Template 1: Context Hook Warning (Most Common)

**Use Case:** Hook must be used within provider

```typescript
/**
 * Hook that must be used within provider
 * @throws {Error} In development mode, when used outside provider
 */
export function useMyHook(): MyContextValue {
  const context = useContext(MyContext);

  if (process.env.NODE_ENV !== 'production') {
    if (context === null) {
      throw new Error(
        'useMyHook must be used within MyProvider. ' +
        '\n\n' +
        'Wrap your component tree with <MyProvider>:\n' +
        '\n' +
        '  <MyProvider>\n' +
        '    <App />\n' +
        '  </MyProvider>\n' +
        '\n' +
        'See: https://yourdocs.com/api/useMyHook'
      );
    }
  }

  return context;
}
```

**Similar Implementations:**
- React Router: `useNavigate()`
- React Query: `useQueryClient()`
- Zustand: `useStore()`

---

### Template 2: Parameter Validation Warning

**Use Case:** Validate function parameters

```typescript
/**
 * Navigate to a specific index
 * @param index - Zero-based index (must be >= 0 and < stack.length)
 * @throws {RangeError} In development mode, when index is out of bounds
 */
function popToIndex(index: number) {
  if (process.env.NODE_ENV !== 'production') {
    if (index < 0 || index >= stack.length) {
      throw new RangeError(
        `popToIndex: Invalid index ${index}. ` +
        `Stack length is ${stack.length}. ` +
        `Valid range: 0 to ${stack.length - 1}.`
      );
    }
  }

  // Actual implementation
}
```

**Similar Implementations:**
- React: Array index validation
- Redux: Action type validation
- React Query: Query key validation

---

### Template 3: Deduplicated Warning

**Use Case:** Prevent warning spam

```typescript
// Module-level Set for deduplication
const didWarnAboutInvalidType = new Set<any>();

function processData(data: any) {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof data === 'function' && !didWarnAboutInvalidType.has(data)) {
      didWarnAboutInvalidType.add(data);
      console.warn(
        'Received a function as data. This is likely a mistake. ' +
        'Pass objects or arrays as data, not functions.'
      );
    }
  }

  // Actual implementation
}
```

**Similar Implementations:**
- React: `didWarnAboutMaps`
- React Query: Query key deduplication
- Redux: Middleware warning deduplication

---

### Template 4: Deprecation Warning

**Use Case:** Warn about deprecated API

```typescript
let hasWarnedAboutDeprecation = false;

/**
 * @deprecated Use newApi() instead. Will be removed in version 3.0.0.
 */
function deprecatedApi() {
  if (process.env.NODE_ENV !== 'production') {
    if (!hasWarnedAboutDeprecation) {
      hasWarnedAboutDeprecation = true;
      console.warn(
        '[DEPRECATED] deprecatedApi() is deprecated and will be removed in version 3.0.0. ' +
        'Use newApi() instead. ' +
        'Migration guide: https://yourdocs.com/migration/deprecatedApi'
      );
    }
  }

  // Actual implementation (or delegate to newApi)
  return newApi();
}
```

**Similar Implementations:**
- React: Deprecated lifecycle methods
- React Router: Deprecated component props
- Redux: Deprecated store methods

---

### Template 5: Type-Safe Invariant

**Use Case:** Type narrowing with runtime check

```typescript
/**
 * React-style invariant that narrows TypeScript types
 * @throws {Error} In development mode, when condition is falsy
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

**Similar Implementations:**
- React Router: Internal invariant function
- React: Internal invariant checks
- Redux: State validation

---

## Warning Message Best Practices

### DO: Provide Context
```typescript
console.warn(
  `useFormStack: Cannot pop from empty stack. ` +
  `Current stack length: ${stack.length}. ` +
  `This usually means too many closeForm() calls.`
);
```

### DON'T: Vague Messages
```typescript
console.warn('Stack is empty'); // Bad - no context
```

### DO: Include Solution
```typescript
console.warn(
  `useFormStack must be used within FormStackProvider. ` +
  `Wrap your component tree with <FormStackProvider>.`
);
```

### DON'T: Problem Only
```typescript
console.warn('Missing provider'); // Bad - no solution
```

### DO: Show Code Examples
```typescript
console.warn(
  `Invalid hook call. Hooks can only be called inside of the body of a function component.` +
  '\n\n' +
  'Problem:\n' +
  '  function MyComponent() {\n' +
  '    if (condition) {\n' +
  '      useHook() // ❌ Wrong: Conditional hook call\n' +
  '    }\n' +
  '  }' +
  '\n\n' +
  'Solution:\n' +
  '  function MyComponent() {\n' +
  '    useHook() // ✅ Correct: Always called\n' +
  '  }'
);
```

### DO: Link to Documentation
```typescript
console.warn(
  `useQuery requires a queryKey. ` +
  `See https://tanstack.com/query/latest/docs/react/guides/query-keys`
);
```

---

## Testing Development Warnings

### Vitest Pattern (Your Current Setup)

```typescript
import { vi, beforeEach, afterEach, expect, test, describe } from 'vitest';

describe('popToIndex warnings', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original console methods
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('should warn in development for invalid index', () => {
    // Mock development mode
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      // Perform action that should trigger warning
      expect(() => {
        popToIndex(999); // Invalid index
      }).toThrow(RangeError);

      // Verify warning was called
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid index')
      );
    } finally {
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    }
  });

  test('should not warn in production', () => {
    // Mock production mode
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      // Perform action that would normally warn
      const result = popToIndex(999);

      // Verify no warning was called
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      // Production should handle gracefully
      expect(result).toBeUndefined();
    } finally {
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    }
  });
});
```

---

## Common Warning Scenarios

### Scenario 1: Hook Used Outside Provider
**From:** React Router, React Query, Zustand

```typescript
export function useMyHook() {
  const context = useContext(MyContext);

  if (process.env.NODE_ENV !== 'production') {
    if (!context) {
      throw new Error(
        'useMyHook must be used within MyProvider. ' +
        'Wrap your component tree with <MyProvider>.'
      );
    }
  }

  return context;
}
```

### Scenario 2: Invalid Parameter Type
**From:** React Query, Redux Toolkit

```typescript
function validateQueryKey(queryKey: unknown) {
  if (process.env.NODE_ENV !== 'production') {
    if (!queryKey) {
      console.error(
        'queryKey is required. ' +
        'Pass an array or string: useQuery(["user", id], ...) ' +
        'See: https://tanstack.com/query/latest/docs/react/guides/query-keys'
      );
    }

    if (typeof queryKey === 'function') {
      console.warn(
        'Query keys should be arrays or strings, not functions. ' +
        'Functions will cause unexpected behavior.'
      );
    }
  }
}
```

### Scenario 3: Array Index Out of Bounds
**From:** React, Your geoform library

```typescript
function popToIndex(index: number) {
  if (process.env.NODE_ENV !== 'production') {
    if (index < 0 || index >= stack.length) {
      throw new RangeError(
        `popToIndex: Invalid index ${index}. ` +
        `Stack length is ${stack.length}. ` +
        `Valid range: 0 to ${stack.length - 1}`
      );
    }
  }

  // Implementation
}
```

### Scenario 4: Async Operation in Wrong Context
**From:** React Query, React Router

```typescript
function useMutation() {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof window === 'undefined') {
      console.warn(
        'useMutation should only be used in client components. ' +
        'It cannot be used in Server Components or server-side code.'
      );
    }
  }

  // Implementation
}
```

---

## Production Bundle Verification

### Verify Warnings Are Removed

After building your production bundle, verify warnings are removed:

```bash
# Search for warning code in production bundle
grep -r "console.warn" dist/
grep -r "console.error" dist/
grep -r "process.env.NODE_ENV" dist/

# Should return no results if tree-shaking worked correctly
```

### Build Tool Configuration

**Vite:**
```typescript
// vite.config.ts
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
});
```

**Webpack:**
```javascript
// webpack.config.js
module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
};
```

---

## Quick Implementation Checklist

For each function that needs warnings:

- [ ] Add `process.env.NODE_ENV !== 'production'` guard
- [ ] Choose appropriate error type (Error, RangeError, TypeError)
- [ ] Write clear, actionable message with:
  - [ ] What happened
  - [ ] Why it's a problem
  - [ ] How to fix it
  - [ ] Context (values, component names)
- [ ] Add deduplication if needed (Set, WeakMap, boolean flag)
- [ ] Include documentation link for complex issues
- [ ] Add JSDoc with `@throws` or `@warning` tag
- [ ] Write unit test with console spy
- [ ] Verify production build removes warning code

---

## Key Takeaways from Major Libraries

1. **React Router**: Simple invariant pattern, clear error messages
2. **Redux Toolkit**: Detailed validation with immer, state mutation warnings
3. **React Query**: Documentation links in every warning, parameter validation
4. **React**: Extensive deduplication with Sets, component name context
5. **Zustand**: Branded warnings with `[Zustand]` prefix, devtools warnings

**Common Patterns Across All Libraries:**
- Development mode guards are mandatory
- Messages include component/function names
- Solutions are provided, not just problems
- Deduplication prevents console spam
- Type-safe error throwing with TypeScript
- Console.warn for non-critical, console.error for critical
- Documentation URLs for complex issues

---

**Document Version:** 1.0
**Last Updated:** 2025-01-11
**Related:** `/home/dustin/projects/geoform/plan/research/external-best-practices-development-warnings.md`
