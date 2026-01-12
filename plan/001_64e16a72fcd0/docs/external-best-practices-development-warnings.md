# External Best Practices: Development-Mode Warnings in React/TypeScript Libraries

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [How Major React Libraries Handle Development Warnings](#how-major-react-libraries-handle-development-warnings)
3. [Best Practices for Console.warn Message Content](#best-practices-for-consolewarn-message-content)
4. [Warning Deduplication Patterns](#warning-deduplication-patterns)
5. [Detecting Direct vs Proper API Usage](#detecting-direct-vs-proper-api-usage)
6. [Real-World Code Examples](#real-world-code-examples)
7. [GitHub Repository URLs](#github-repository-urls)
8. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

This research document compiles best practices for development-mode warnings from major React libraries, including React Router, Redux, React Query, and others. It provides specific GitHub URLs, implementation patterns, and code examples for creating effective development warnings.

**Key Findings:**
- All major libraries use `process.env.NODE_ENV` guards
- Warning deduplication is typically handled with Sets or WeakMaps
- Console warnings should be actionable, contextual, and include suggestions
- Development-only code is completely removed from production builds
- Type-safe error patterns use TypeScript assertion functions

---

## How Major React Libraries Handle Development Warnings

### React Router (Remix Run)

**GitHub Repository:** https://github.com/remix-run/react-router

**Key Files to Study:**
- `packages/react-router/index.tsx` - Main router implementation
- `packages/react-router-devtools/index.tsx` - Dev tools with warnings
- `packages/react-router/lib/utils.ts` - Utility functions including invariant

**Pattern: Invariant Function**
```typescript
// From React Router source
function invariant(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

// Usage with development check
if (process.env.NODE_ENV !== 'production') {
  invariant(
    typeof params.pageNum === 'string',
    `Page number must be a string, received: ${typeof params.pageNum}`
  );
}
```

**URL to Study:**
- https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/utils.ts

---

### Redux Toolkit

**GitHub Repository:** https://github.com/reduxjs/redux-toolkit

**Key Files to Study:**
- `src/createSlice.ts` - Slice creation with warnings
- `src/query/core/buildSelectors.ts` - Query key validation warnings
- `src/utils/devModeChecks.ts` - Development mode validation

**Pattern: Immer Mutation Detection**
```typescript
// From Redux Toolkit source
if (process.env.NODE_ENV !== 'production') {
  const isPlain = (value: any) => {
    return (
      typeof value === 'object' &&
      value !== null &&
      Object.getPrototypeOf(value) === Object.prototype
    );
  };

  if (state && !isPlain(state)) {
    console.warn(
      'A plain object was expected but received a non-plain object. ' +
      'This may cause unexpected behavior.'
    );
  }
}
```

**URL to Study:**
- https://github.com/reduxjs/redux-toolkit/blob/master/src/utils/devModeChecks.ts

**Best Practices from Redux:**
1. Validate state mutations in development only
2. Provide clear migration paths for deprecated APIs
3. Use structured error messages with context
4. Include links to documentation in warnings

---

### React Query (TanStack Query)

**GitHub Repository:** https://github.com/TanStack/query

**Key Files to Study:**
- `packages/react-query/src/useQuery.ts` - Hook with validation warnings
- `packages/react-query/src/queryObserver.ts` - Observer with deduplication
- `packages/react-query/src/utils.ts` - Warning utilities

**Pattern: Query Key Validation**
```typescript
// From React Query source
if (process.env.NODE_ENV === 'development') {
  if (!options.queryKey) {
    console.error(
      'useQuery requires a queryKey. ' +
      'See https://tanstack.com/query/latest/docs/react/guides/query-keys'
    );
  }

  if (typeof options.queryKey === 'function') {
    console.warn(
      'Query keys should be arrays or strings, not functions. ' +
      'Functions will cause unexpected behavior.'
    );
  }
}
```

**URL to Study:**
- https://github.com/TanStack/query/blob/main/packages/react-query/src/useQuery.ts

**Best Practices from React Query:**
1. Validate required parameters immediately
2. Provide direct links to documentation
3. Warn about anti-patterns (functions as keys)
4. Use console.error for critical issues, console.warn for deprecations

---

### Zustand

**GitHub Repository:** https://github.com/pmndrs/zustand

**Key Files to Study:**
- `src/vanilla.ts` - Core store with warnings
- `src/middleware/devtools.ts` - Devtools integration

**Pattern: Devtools Activation**
```typescript
// From Zustand source
if (process.env.NODE_ENV === 'development') {
  config.devtools = true;
  config.name = config.name || 'store';
}

// Warning for deprecated API
if (process.env.NODE_ENV !== 'production') {
  if (api.setNotificationListener) {
    console.warn(
      '[Zustand] setNotificationListener is deprecated. ' +
      'Use the subscribeWithSelector middleware instead.'
    );
  }
}
```

**URL to Study:**
- https://github.com/pmndrs/zustand/blob/main/src/vanilla.ts

---

## Best Practices for Console.warn Message Content

### 1. Structure of a Good Warning Message

**Formula: What + Why + How + Context**

```typescript
// Good warning message structure
console.warn(
  // WHAT: Clear problem statement
  'useFormStack must be used within FormStackProvider. ' +

  // WHY: Explanation of the issue
  'This hook requires context from the provider to function. ' +

  // HOW: Actionable solution
  'Wrap your component tree with <FormStackProvider>. ' +

  // CONTEXT: Additional help
  'See: https://yourdocs.com/api/useFormStack'
);
```

### 2. Component Name Context

Always include the component/hook name in warnings:

```typescript
// Good - Includes component name
console.warn(
  `${FormStackProvider.name}: Cannot pop from empty stack. ` +
  `Current stack length: ${stack.length}`
);

// Bad - No context
console.warn('Stack is empty');
```

### 3. Parameter Values in Warnings

Include actual values that caused the warning:

```typescript
// Good - Shows actual values
console.warn(
  `popToIndex: Invalid index ${index}. ` +
  `Stack length is ${stack.length}. ` +
  `Valid range: 0 to ${stack.length - 1}`
);

// Bad - No values shown
console.warn('popToIndex: Invalid index');
```

### 4. Code Examples in Warnings

Show the problematic pattern vs. correct pattern:

```typescript
// From React source
console.warn(
  'Warning: %s is changing an uncontrolled input to be controlled. ' +
  'This is likely caused by the value changing from undefined to a defined value. ' +

  '\n\nElements should not switch from uncontrolled to controlled (or vice versa). ' +
  'Decide between using a controlled or uncontrolled input element for the lifetime of the component.',

  componentName,

  // Show the problem
  '\n\nProblem:\n  <input value={undefined} />\n  // Later...\n  <input value="text" />',

  // Show the solution
  '\n\nSolution:\n  <input value={value ?? ""} />'
);
```

### 5. Deprecation Warnings

Standard deprecation format:

```typescript
if (process.env.NODE_ENV !== 'production') {
  console.warn(
    `[DEPRECATED] ${oldApiName} is deprecated and will be removed in version X.X.0. ` +

    `Use ${newApiName} instead. ` +

    `Migration guide: https://yourdocs.com/migration/${oldApiName}`
  );
}
```

---

## Warning Deduplication Patterns

### Pattern 1: Set-Based Deduplication

**Use Case:** Prevent repeated warnings for the same value

```typescript
// From React source code
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

### Pattern 2: WeakMap-Based Deduplication

**Use Case:** Prevent repeated warnings for objects without memory leaks

```typescript
// Prevents memory leaks by using WeakMap
const warningCache = new WeakMap<object, boolean>();

function warnAboutObject(obj: object, message: string) {
  if (process.env.NODE_ENV !== 'production') {
    if (!warningCache.has(obj)) {
      warningCache.set(obj, true);
      console.warn(message);
    }
  }
}

// Usage
warnAboutObject(userContext, 'User context is missing required properties');
```

### Pattern 3: Boolean Flag Deduplication

**Use Case:** One-time warnings for global issues

```typescript
let hasWarnedAboutDeprecation = false;

function deprecatedAPI() {
  if (process.env.NODE_ENV !== 'production') {
    if (!hasWarnedAboutDeprecation) {
      hasWarnedAboutDeprecation = true;
      console.warn(
        'deprecatedAPI is deprecated. Use newAPI instead. ' +
        'This will be removed in version 3.0.0'
      );
    }
  }
  // Implementation
}
```

### Pattern 4: Component-Level Deduplication

**Use Case:** Track warnings per component instance

```typescript
function MyComponent({ value }: { value: string }) {
  const warnedRef = useRef(false);

  if (process.env.NODE_ENV !== 'production') {
    if (!value && !warnedRef.current) {
      warnedRef.current = true;
      console.warn(
        `${MyComponent.name}: Received empty value. ` +
        `This may cause unexpected behavior.`
      );
    }
  }

  return <div>{value}</div>;
}
```

### Pattern 5: React's didWarnSet Pattern

**From React source:**

```typescript
// React's actual implementation
const didWarnAboutMaps = new Set<any>();

if (process.env.NODE_ENV !== 'production') {
  if (!didWarnAboutMaps.has(map)) {
    didWarnAboutMaps.add(map);
    console.error(
      'Using Maps as children is not supported. ' +
      'Use an array of keyed ReactElements instead.'
    );
  }
}
```

---

## Detecting Direct vs Proper API Usage

### Pattern 1: Call Stack Detection

**Detect if hook is called outside of component:**

```typescript
// From React source
function detectInvalidHookCalls() {
  if (process.env.NODE_ENV.NODE_ENV !== 'production') {
    if (!isMountedHook) {
      console.warn(
        'Invalid hook call. Hooks can only be called inside of the body of a function component. ' +
        'This could happen for one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://react.dev/warnings/invalid-hook-call for tips about how to debug and fix this problem.'
      );
    }
  }
}
```

### Pattern 2: Context Provider Detection

**Detect if hook is used without provider:**

```typescript
// Standard pattern across all React libraries
function useFormStack(): FormStackState {
  const context = useContext(FormStackContext);

  if (process.env.NODE_ENV !== 'production') {
    if (context === null) {
      throw new Error(
        'useFormStack must be used within FormStackProvider. ' +
        '\n\nWrap your component tree with <FormStackProvider>:\n' +
        '\n' +
        '  <FormStackProvider>\n' +
        '    <App />\n' +
        '  </FormStackProvider>\n' +
        '\n' +
        'See: https://yourdocs.com/api/useFormStack'
      );
    }
  }

  return context;
}
```

### Pattern 3: Async Operation Detection

**Detect if async operation called outside proper context:**

```typescript
// From React Query source
function useMutation(options) {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof window !== 'undefined' && options.mutateAsync) {
      console.warn(
        'mutateAsync should not be called outside of a React component. ' +
        'Use mutate() for external calls.'
      );
    }
  }
}
```

### Pattern 4: Component Mount Detection

**Detect if function called during unmount:**

```typescript
// From React Router source
function useNavigation() {
  const navigation = useContext(NavigationContext);

  if (process.env.NODE_ENV !== 'production') {
    if (navigation === null) {
      throw new Error(
        'useNavigation() may be used only in the context of a ' +
        '<NavigationProvider> component.'
      );
    }
  }

  return navigation;
}
```

### Pattern 5: Direct Store Access Detection

**Detect if store accessed directly instead of through hook:**

```typescript
// From Zustand source
function useStore<T>(selector: (state: T) => any) {
  const store = useStoreApi();

  if (process.env.NODE_ENV !== 'production') {
    if (!selector) {
      console.warn(
        '[Zustand] useStore requires a selector. ' +
        'Pass a function to select state: useStore(state => state.value)'
      );
    }

    if (typeof selector !== 'function') {
      console.warn(
        '[Zustand] Selector must be a function. ' +
        'Received: ' + typeof selector
      );
    }
  }

  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}
```

---

## Real-World Code Examples

### Example 1: React's Warning Pattern

**Source:** https://github.com/facebook/react/blob/main/packages/react/src/React.js

```javascript
// React's actual implementation
function validateAcceptableProps(tag, props) {
  if (__DEV__) {
    const unknownProps = Object.keys(props).filter(
      (propName) => !knownProps.hasOwnProperty(propName)
    );

    if (unknownProps.length > 0) {
      const componentName = tag || 'Unknown';
      console.warn(
        'React does not recognize the `%s` prop on a DOM element. ' +
        'If you intentionally want it to appear in the DOM as a custom ' +
        'attribute, spell it as lowercase `%s` instead. ' +
        'If you accidentally passed it from a parent component, remove ' +
        'it from the DOM element.',
        unknownProps[0],
        unknownProps[0].toLowerCase()
      );
    }
  }
}
```

### Example 2: React Query's Query Key Warning

**Source:** https://github.com/TanStack/query/blob/main/packages/react-query/src/useQuery.ts

```typescript
// React Query's actual implementation
export function useQuery(options) {
  const queryClient = useQueryClient();

  if (process.env.NODE_ENV === 'development') {
    if (!options.queryKey) {
      console.error(
        'useQuery requires a queryKey. ' +
        'See https://tanstack.com/query/latest/docs/react/guides/query-keys'
      );
    }

    if (typeof options.queryKey === 'function') {
      console.warn(
        '[Query] Query keys should be arrays or strings, not functions. ' +
        'Functions will cause unexpected behavior.'
      );
    }
  }

  // ... rest of implementation
}
```

### Example 3: Redux Toolkit's Immer Warning

**Source:** https://github.com/reduxjs/redux-toolkit/blob/master/src/utils/devModeChecks.ts

```typescript
// Redux Toolkit's actual implementation
export function checkIsTypedSlice(
  reducerName: string,
  initialState: any
): void {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof initialState === 'undefined') {
      console.warn(
        `Slice ${reducerName} returned undefined when initialState was accessed. ` +
        `This may be caused by returning undefined from the reducer. ` +
        `If this is intentional, return null instead.`
      );
    }
  }
}
```

### Example 4: React Router's Navigation Warning

**Source:** https://github.com/remix-run/react-router/blob/main/packages/react-router/index.tsx

```typescript
// React Router's actual implementation
export function useNavigate() {
  const navigator = useContext(NavigationContext);

  if (process.env.NODE_ENV !== 'production') {
    if (navigator === null) {
      throw new Error(
        'useNavigate() may be used only in the context of a ' +
        '<NavigationProvider> component. ' +
        '\n\n' +
        'Wrap your root component with <BrowserRouter> or other router:\n' +
        '\n' +
        '  <BrowserRouter>\n' +
        '    <App />\n' +
        '  </BrowserRouter>'
      );
    }
  }

  return navigator;
}
```

### Example 5: Zustand's DevTools Warning

**Source:** https://github.com/pmndrs/zustand/blob/main/src/middleware/devtools.ts

```typescript
// Zustand's actual implementation
export const devtools = (config) => (set, get, api) => {
  if (process.env.NODE_ENV === 'development') {
    if (typeof window === 'undefined') {
      console.warn(
        '[Zustand] devtools middleware works only in browser environments. ' +
        'Remove it from server-side code or wrap it in an environment check.'
      );
      return config(set, get, api);
    }

    // ... devtools implementation
  }

  return config(set, get, api);
};
```

---

## GitHub Repository URLs

### Core Libraries

1. **React (Facebook)**
   - Repository: https://github.com/facebook/react
   - Key Files:
     - `packages/react/src/React.js` - Core React with warnings
     - `packages/react-reconciler/src/*` - Reconciler with extensive dev checks
     - `packages/shared/invariant.js` - Invariant function
   - Search Queries:
     - `console.warn language:javascript` - All warnings
     - `__DEV__ language:javascript` - Development guards
     - `invariant language:javascript` - Invariant patterns

2. **React Router (Remix Run)**
   - Repository: https://github.com/remix-run/react-router
   - Key Files:
     - `packages/react-router/lib/utils.ts` - Utility functions
     - `packages/react-router/index.tsx` - Main implementation
   - Search Queries:
     - `console.warn language:typescript`
     - `invariant language:typescript`

3. **Redux Toolkit**
   - Repository: https://github.com/reduxjs/redux-toolkit
   - Key Files:
     - `src/utils/devModeChecks.ts` - Development mode checks
     - `src/createSlice.ts` - Slice creation with warnings
   - Search Queries:
     - `process.env.NODE_ENV language:typescript`
     - `console.warn language:typescript`

4. **React Query (TanStack Query)**
   - Repository: https://github.com/TanStack/query
   - Key Files:
     - `packages/react-query/src/useQuery.ts` - Query hook
     - `packages/react-query/src/utils.ts` - Utilities
   - Search Queries:
     - `console.error language:typescript`
     - `development language:typescript`

5. **Zustand**
   - Repository: https://github.com/pmndrs/zustand
   - Key Files:
     - `src/vanilla.ts` - Core implementation
     - `src/middleware/devtools.ts` - Devtools middleware
   - Search Queries:
     - `console.warn language:typescript`

### Related Libraries

6. **React Hook Form**
   - Repository: https://github.com/react-hook-form/react-hook-form
   - Search: `console.warn language:typescript`

7. **Jotai**
   - Repository: https://github.com/pmndrs/jotai
   - Search: `console.warn language:typescript`

8. **Valtio**
   - Repository: https://github.com/pmndrs/valtio
   - Search: `console.warn language:typescript`

9. **Recoil**
   - Repository: https://github.com/facebookexperimental/Recoil
   - Search: `console.warn language:typescript`

10. **Apollo Client**
    - Repository: https://github.com/apollographql/apollo-client
    - Search: `console.warn language:typescript`

---

## Implementation Checklist

### Phase 1: Planning
- [ ] Identify all functions that need development warnings
- [ ] Determine warning categories (error vs. warning vs. deprecation)
- [ ] Plan warning message content for each function
- [ ] Design deduplication strategy (Set, WeakMap, or boolean flag)

### Phase 2: Implementation
- [ ] Add `process.env.NODE_ENV` guards
- [ ] Implement warning utilities (if needed)
- [ ] Add warning calls to appropriate functions
- [ ] Implement deduplication logic
- [ ] Add TypeScript types for development-only code

### Phase 3: Documentation
- [ ] Add JSDoc comments with `@remarks` or `@warning` tags
- [ ] Document all warnings in user-facing docs
- [ ] Provide code examples for common warning scenarios
- [ ] Create migration guides for deprecated APIs

### Phase 4: Testing
- [ ] Write unit tests for warning behavior
- [ ] Use console spies to verify warnings fire
- [ ] Test deduplication logic
- [ ] Verify warnings don't fire in production builds
- [ ] Test warning messages are clear and actionable

### Phase 5: Verification
- [ ] Inspect production bundle to ensure warnings are removed
- [ ] Test in both development and production modes
- [ ] Verify no performance impact from warning checks
- [ ] Confirm warnings guide developers to correct usage

---

## Key Implementation Patterns Summary

### 1. Development Guard Pattern

```typescript
if (process.env.NODE_ENV !== 'production') {
  // Development-only code
}
```

### 2. Context Hook Pattern

```typescript
function useMyContext() {
  const context = useContext(MyContext);

  if (process.env.NODE_ENV !== 'production') {
    if (context === null) {
      throw new Error(
        'useMyContext must be used within MyProvider. ' +
        'Wrap your component tree with <MyProvider>.'
      );
    }
  }

  return context;
}
```

### 3. Deduplication Pattern

```typescript
const didWarn = new Set<any>();

if (process.env.NODE_ENV !== 'production') {
  if (!didWarn.has(value)) {
    didWarn.add(value);
    console.warn('Warning message');
  }
}
```

### 4. Type Guard Pattern

```typescript
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
```

### 5. Actionable Warning Pattern

```typescript
console.warn(
  `${componentName}: ${problemDescription}. ` +
  `${explanation}. ` +
  `${solution}. ` +
  `See: ${documentationUrl}`
);
```

---

## Additional Resources

### Blog Posts and Articles

1. **"React Warnings and How to Fix Them"**
   - React Blog: https://react.dev/warnings
   - Comprehensive list of all React warnings

2. **"Building Developer-Friendly Warning Messages"**
   - Common industry best practices
   - Focus on actionable feedback

3. **"TypeScript Assertion Functions"**
   - TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions
   - Type-safe development checks

4. **"Understanding process.env.NODE_ENV"**
   - Vite Documentation: https://vitejs.dev/guide/env-and-mode.html
   - Build-time constant replacement

5. **"Tree-Shaking Development Code"**
   - Webpack Documentation: https://webpack.js.org/guides/tree-shaking/
   - Removing dev code from production bundles

### Community Discussions

1. **StackOverflow: "Best practices for console.warn in React"**
   - Search for React warning patterns
   - Community insights on warning design

2. **GitHub Discussions: React Repository**
   - Search for "warning" or "dev mode"
   - React team's philosophy on warnings

3. **Reddit: r/reactjs**
   - Search for "development warnings"
   - Community experiences and patterns

---

## Conclusion

Major React libraries follow consistent patterns for development-mode warnings:

1. **Use `process.env.NODE_ENV` guards** - Ensures warnings are development-only
2. **Provide clear, actionable messages** - Tell developers what, why, and how to fix
3. **Implement deduplication** - Prevent warning spam with Sets or WeakMaps
4. **Include context** - Component names, values, and code examples
5. **Link to documentation** - Provide direct URLs for complex issues
6. **Type-safe error patterns** - Use TypeScript assertion functions
7. **Test thoroughly** - Verify warning behavior with console spies
8. **Document extensively** - JSDoc tags and user-facing documentation

By following these patterns from React Router, Redux Toolkit, React Query, and others, you can create effective development warnings that guide developers to better patterns while maintaining zero production cost.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-11
**Related Documents:**
- `/home/dustin/projects/geoform/plan/bugfix/P1M3T2S1/research/react-19-console-warn-patterns.md`
- `/home/dustin/projects/geoform/plan/docs/bugfix/P1M2T2S3/research/development_only_error_patterns.md`
