# React 19 console.warn Patterns & Development Mode Research

## Table of Contents
1. [Overview](#overview)
2. [React 19 Development Mode Detection](#react-19-development-mode-detection)
3. [console.warn Patterns in React 19](#consolewarn-patterns-in-react-19)
4. [Best Practices for Development-Only Warnings](#best-practices-for-development-only-warnings)
5. [React 19-Specific Patterns](#react-19-specific-patterns)
6. [Code Examples](#code-examples)
7. [Official Documentation Sources](#official-documentation-sources)
8. [Key Insights](#key-insights)

---

## Overview

This research document compiles React 19's console.warn patterns, development mode detection mechanisms, and best practices for implementing development-only warnings in React hooks and components.

**Key Benefits of Development-Only Warnings:**
- Catch programming errors early during development
- Provide actionable feedback without affecting production performance
- Zero runtime cost in production builds (tree-shaken)
- Better developer experience with clear, contextual error messages

---

## React 19 Development Mode Detection

### How React Detects Development Mode

React 19 uses multiple mechanisms to detect development mode:

```typescript
// Method 1: process.env.NODE_ENV (Classic pattern)
if (process.env.NODE_ENV !== 'production') {
  // Development-only code
}

// Method 2: __DEV__ global (React internal)
if (__DEV__) {
  // Development-only code
}

// Method 3: typeof process check (SSR-compatible)
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
  // Development-only code
}
```

### Build-Time Optimization

Modern build tools (Vite, Webpack, Next.js) replace `process.env.NODE_ENV` at build time:

**Development Build:**
```javascript
if ("development" !== 'production') {
  // Code included
}
// Compiles to: if (true) { ... }
```

**Production Build:**
```javascript
if ("production" !== 'production') {
  // Code excluded
}
// Compiles to: if (false) { ... } → Entire block removed by minifier
```

### React 19's __DEV__ Pattern

React 19 internally uses the `__DEV__` global variable:

```javascript
// React source code pattern
if (__DEV__) {
  if (typeof componentSignature !== 'function') {
    console.error(
      'memo: The first argument must be a component. Instead received: %s',
      componentSignature
    );
  }
}
```

The `__DEV__` variable is defined by build tools:
- **Vite**: Defines `__DEV__` as `true` in development, `false` in production
- **Next.js**: Uses webpack DefinePlugin to replace `__DEV__`
- **Create React App**: Similar pattern with `process.env.NODE_ENV`

---

## console.warn Patterns in React 19

### Pattern 1: Conditional Warning with Context

```typescript
function useMyHook(value: unknown) {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof value !== 'string') {
      console.warn(
        'useMyHook expects a string value, but received: %s. ' +
        'This may cause unexpected behavior.',
        typeof value
      );
    }
  }
  // Hook implementation
}
```

### Pattern 2: One-Time Warning with Warning Set

React uses a `didWarn` set to ensure warnings are only logged once:

```typescript
const didWarnAboutInvalidValueType = new Set<any>();

function processValue(value: any) {
  if (process.env.NODE_ENV !== 'production') {
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

### Pattern 3: Descriptive Warning with Stack Trace

React 19 provides warnings with helpful context:

```typescript
if (process.env.NODE_ENV !== 'production') {
  console.warn(
    '%s: A component is changing an uncontrolled input to be controlled. ' +
    'This is likely caused by the value changing from undefined to a defined value, ' +
    'which should not happen. Decide between using a controlled or uncontrolled input ' +
    'element for the lifetime of the component.',
    componentName
  );
}
```

### Pattern 4: Warning with Fix Suggestions

```typescript
if (process.env.NODE_ENV !== 'production') {
  if (invalidUsage) {
    console.warn(
      'Warning: %s is being used outside of %s. ' +
      'Wrap your component in a <%s> provider to fix this issue.',
      hookName,
      providerName,
      providerName
    );
  }
}
```

---

## Best Practices for Development-Only Warnings

### 1. Use Clear, Actionable Messages

**Good:**
```typescript
console.warn(
  'useFormStack must be used within FormStackProvider. ' +
  'Wrap your component tree with <FormStackProvider>.'
);
```

**Bad:**
```typescript
console.warn('Context is null');
```

### 2. Include Context in Warnings

```typescript
if (process.env.NODE_ENV !== 'production') {
  if (index < 0 || index >= array.length) {
    console.warn(
      'popToIndex: Invalid index %d. Array length is %d. ' +
      'Valid range is 0 to %d.',
      index,
      array.length,
      array.length - 1
    );
  }
}
```

### 3. Use console.warn for Non-Critical Issues

- **console.warn**: Deprecated usage, potential mistakes, non-breaking issues
- **console.error**: Critical errors that break functionality
- **console.log**: Debugging information (should be removed in production)

### 4. Implement Warning Deduplication

```typescript
// Prevent warning spam
const warningCache = new WeakMap<object, boolean>();

function warnAboutObject(obj: object, message: string) {
  if (process.env.NODE_ENV !== 'production') {
    if (!warningCache.has(obj)) {
      warningCache.set(obj, true);
      console.warn(message);
    }
  }
}
```

### 5. Use Warning Gates for Experimental Features

```typescript
const enableExperimentalWarnings = process.env.NODE_ENV !== 'production';

if (enableExperimentalWarnings) {
  if (usingExperimentalFeature) {
    console.warn(
      'Experimental feature in use: %s. ' +
      'This API may change in future versions.',
      featureName
    );
  }
}
```

---

## React 19-Specific Patterns

### Pattern 1: Concurrent Features Warnings

React 19 introduced new warnings for concurrent features:

```typescript
// Warning for improper useTransition usage
if (process.env.NODE_ENV !== 'production') {
  if (!isInTransition && isAsyncAction) {
    console.warn(
      'An async function was called outside of useTransition. ' +
      'Use startTransition to mark this update as non-urgent.'
    );
  }
}
```

### Pattern 2: Server Component Warnings

```typescript
if (process.env.NODE_ENV !== 'production') {
  if (isClientComponent && usesServerOnlyAPI) {
    console.warn(
      '%s is a Server-only API but was called from a Client Component. ' +
      'This will cause a runtime error in production.',
      apiName
    );
  }
}
```

### Pattern 3: Compiler Optimizations Warnings

React 19's React Compiler provides warnings when optimizations fail:

```typescript
if (process.env.NODE_ENV !== 'production') {
  if (!reactCompilerCanOptimize) {
    console.warn(
      'React Compiler could not optimize %s. ' +
      'Ensure your component follows React rules of hooks.',
      componentName
    );
  }
}
```

### Pattern 4: Deprecated API Warnings

```typescript
if (process.env.NODE_ENV !== 'production') {
  if (usesDeprecatedAPI) {
    console.warn(
      'Warning: %s is deprecated and will be removed in React 20. ' +
      'Use %s instead.\nSee: %s',
      oldAPI,
      newAPI,
      documentationURL
    );
  }
}
```

---

## Code Examples

### Example 1: Custom Hook with Development Warning

```typescript
import { useContext } from 'react';

const MyContext = createContext<MyContextValue | null>(null);

export function useMyContext(): MyContextValue {
  const context = useContext(MyContext);

  if (process.env.NODE_ENV !== 'production') {
    if (context === null) {
      console.warn(
        'useMyContext must be used within MyProvider. ' +
        'Wrap your component tree with <MyProvider>.'
      );
    }
  }

  return context!;
}
```

### Example 2: Development-Only Error Throwing

```typescript
function validateIndex(index: number, maxLength: number): void {
  if (process.env.NODE_ENV !== 'production') {
    if (index < 0 || index >= maxLength) {
      throw new RangeError(
        `Index ${index} out of bounds. ` +
        `Expected: 0 <= index < ${maxLength}`
      );
    }
  }
}
```

### Example 3: One-Time Warning Pattern

```typescript
let hasWarnedAboutDeprecation = false;

function deprecatedAPI() {
  if (process.env.NODE_ENV !== 'production') {
    if (!hasWarnedAboutDeprecation) {
      hasWarnedAboutDeprecation = true;
      console.warn(
        'deprecatedAPI is deprecated. Use newAPI instead.'
      );
    }
  }
  // Implementation
}
```

### Example 4: Component Lifecycle Warnings

```typescript
function MyComponent({ value }: { value: string }) {
  if (process.env.NODE_ENV !== 'production') {
    if (value === undefined) {
      console.warn(
        'MyComponent received "undefined" for the "value" prop. ' +
        'This may indicate a missing prop or incorrect data flow.'
      );
    }
  }

  return <div>{value}</div>;
}
```

---

## Official Documentation Sources

### React Documentation

**React.dev (Official React 19 Documentation)**
- URL: https://react.dev
- Sections:
  - [Warnings](https://react.dev/warnings) - Complete list of React warnings
  - [TypeScript](https://react.dev/learn/typescript) - TypeScript usage with React
  - [React Compiler](https://react.dev/learn/react-compiler) - Compiler warnings and optimization

**React 19 Release Notes**
- URL: https://react.dev/blog/2024/12/05/react-19
- Key additions: New warning patterns, concurrent features, Server Components

**React GitHub Repository**
- URL: https://github.com/facebook/react
- Search for `console.warn` and `console.error` to see actual warning implementations
- Look for `__DEV__` guards in source code
- Check `react-reconciler` package for warning patterns

### Build Tool Documentation

**Vite Development Mode**
- URL: https://vite.dev/guide/env-and-mode.html
- Documents how `process.env.NODE_ENV` is replaced at build time

**Webpack DefinePlugin**
- URL: https://webpack.js.org/plugins/define-plugin/
- Explains build-time constant replacement

**Next.js Environment Variables**
- URL: https://nextjs.org/docs/basic-features/environment-variables
- Documents `process.env.NODE_ENV` behavior in Next.js

### TypeScript Documentation

**TypeScript JSDoc Reference**
- URL: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
- Documents JSDoc tags like `@param`, `@throws`, `@example`

---

## Key Insights

### 1. React 19's Warning Philosophy

- **Developer Experience First**: Warnings are clear, actionable, and include suggestions
- **Zero Production Cost**: All development-only code is tree-shaken from production builds
- **Context-Rich Messages**: Warnings include component names, props, and suggestions
- **One-Time Warnings**: React uses sets to prevent warning spam

### 2. Development Mode Detection Best Practices

**Recommended Pattern (SSR-Compatible):**
```typescript
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
  // Development-only code
}
```

**Why this pattern:**
- Works in both browser and Node.js environments
- Compatible with server-side rendering
- Standard across the React ecosystem

### 3. Message Format Guidelines

**Structure of a good warning:**
1. **What happened**: Clear statement of the problem
2. **Why it's a problem**: Explanation of potential issues
3. **How to fix it**: Actionable suggestion or link to docs
4. **Context**: Component names, prop values, stack traces

**Example:**
```
Warning: Received `true` for a non-boolean attribute `icon`.

If you want to show an icon, use a child element instead.
This ensures proper accessibility and styling.

    <Button icon={true} />
           ^^^^^^^^^^^^

Instead use:
    <Button><Icon /></Button>
```

### 4. Performance Considerations

- **Warning checks are fast**: Simple condition checks have negligible performance impact
- **Production builds strip warnings**: Modern bundlers remove entire `if (process.env.NODE_ENV !== 'production')` blocks
- **Warning deduplication**: Use Sets or WeakMaps to prevent console spam

### 5. React 19-Specific Changes

1. **Concurrent Rendering Warnings**: New warnings for improper concurrent feature usage
2. **Server Component Warnings**: Warnings for using Server APIs in Client Components
3. **React Compiler Feedback**: Warnings when the compiler cannot optimize code
4. **Improved Messages**: More contextual information in warning messages
5. **Actionable Links**: Warnings now include direct links to relevant documentation

### 6. Testing Development Warnings

**Vitest Pattern for Testing console.warn:**
```typescript
import { vi, beforeEach, afterEach, expect, test } from 'vitest';

let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  consoleWarnSpy.mockRestore();
});

test('should warn in development for invalid usage', () => {
  // Perform action that should trigger warning
  performInvalidAction();

  expect(consoleWarnSpy).toHaveBeenCalledWith(
    expect.stringContaining('Expected warning message')
  );
});
```

### 7. Common Anti-Patterns to Avoid

**❌ Don't:**
```typescript
// Bad: No development check - runs in production
if (invalidUsage) {
  console.warn('This will run in production!');
}
```

**✅ Do:**
```typescript
// Good: Development-only check
if (process.env.NODE_ENV !== 'production') {
  if (invalidUsage) {
    console.warn('This only runs in development!');
  }
}
```

**❌ Don't:**
```typescript
// Bad: Vague warning message
console.warn('Invalid usage');
```

**✅ Do:**
```typescript
// Good: Specific, actionable warning
console.warn(
  'useFormStack must be used within FormStackProvider. ' +
  'Wrap your component tree with <FormStackProvider>.'
);
```

---

## Implementation Checklist

When implementing development-only warnings in React 19:

- [ ] Use `process.env.NODE_ENV !== 'production'` or `__DEV__` checks
- [ ] Provide clear, actionable error messages
- [ ] Include context (component names, prop values, suggestions)
- [ ] Implement warning deduplication if applicable
- [ ] Test warnings with console spy in unit tests
- [ ] Document warnings in JSDoc with `@remarks` or `@warning` tags
- [ ] Use `console.warn` for non-critical issues, `console.error` for critical errors
- [ ] Ensure production builds strip warning code (verify with bundle inspection)
- [ ] Follow React 19's warning message format and style
- [ ] Include links to documentation for complex issues

---

## Related Research

**Internal Research Documents:**
- `/home/dustin/projects/geoform/plan/docs/bugfix/P1M2T2S3/research/development_only_error_patterns.md` - Development-only error patterns with TypeScript
- `/home/dustin/projects/geoform/plan/bugfix/P1M3T1S1/PRP.md` - Development-only error for invalid popToIndex
- `/home/dustin/projects/geoform/plan/bugfix/P1M3T1S2/PRP.md` - Testing development-mode error handling

**External References:**
- [React.dev Warnings Reference](https://react.dev/warnings)
- [React 19 Blog Post](https://react.dev/blog/2024/12/05/react-19)
- [React Source Code (GitHub)](https://github.com/facebook/react)
- [Vite Environment Variables](https://vite.dev/guide/env-and-mode.html)

---

## Summary

React 19 continues React's tradition of providing excellent development feedback through console warnings. Key takeaways:

1. **Development mode detection**: Use `process.env.NODE_ENV !== 'production'` or `__DEV__`
2. **Build-time optimization**: Warnings are completely removed from production builds
3. **Message quality**: Warnings should be clear, actionable, and include context
4. **Performance impact**: Negligible in development, zero in production
5. **Testing**: Use console spies to verify warning behavior in tests
6. **React 19 additions**: New warnings for concurrent features, Server Components, and Compiler feedback

**Best Practice Pattern:**
```typescript
function myFunction(value: unknown) {
  if (process.env.NODE_ENV !== 'production') {
    if (!isValid(value)) {
      console.warn(
        'myFunction: Invalid value %s. Expected a valid input. ' +
        'This may cause unexpected behavior.',
        value
      );
    }
  }
  // Function implementation
}
```

This pattern provides excellent developer feedback while maintaining zero production runtime cost.
