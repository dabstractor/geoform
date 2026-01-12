# JSDoc Best Practices for Documenting API Usage Guidelines

**Research Date:** 2026-01-12
**Task:** P1.M3.T2.S1 - Research JSDoc best practices for usage warning documentation

---

## 1. Authoritative JSDoc Documentation Sources

### Official Documentation
- **JSDoc Official Documentation:** https://jsdoc.app/
  - Tag reference: https://jsdoc.app/about-block-tags.html
  - @example tag: https://jsdoc.app/tags-example.html
  - @remarks tag: https://jsdoc.app/tags-remarks.html
  - @deprecated tag: https://jsdoc.app/tags-deprecated.html

- **TypeScript JSDoc Reference:** https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
  - Supported JSDoc types in TypeScript
  - @template, @overload, and other TS-specific tags

- **TSDoc Standard:** https://tsdoc.org/
  - Standardized JSDoc syntax for TypeScript
  - @remarks, @warning, @internal tags
  - Tag cross-referencing with {@link}

- **TypeDoc Documentation:** https://typedoc.org/
  - Documentation generator for TypeScript
  - Supports @remarks, @warning, @example tags
  - Visibility modifiers: @public, @private, @protected, @internal

---

## 2. @example Tag Best Practices

### Core Principles

1. **Show Complete, Runnable Examples**
   ```javascript
   /**
    * Parses a JSON string safely.
    * @param {string} jsonString - The JSON string to parse
    * @returns {object|null} Parsed object or null if invalid
    * @example
    * const data = safeParseJson('{"name": "John"}');
    * // Returns: { name: "John" }
    *
    * const invalid = safeParseJson('invalid json');
    * // Returns: null
    */
   function safeParseJson(jsonString) {
     try {
       return JSON.parse(jsonString);
     } catch {
       return null;
     }
   }
   ```

2. **Multiple Examples for Different Use Cases**
   ```javascript
   /**
    * Formats a date according to the specified format.
    * @param {Date} date - The date to format
    * @param {string} format - The format string
    * @returns {string} Formatted date string
    * @example
    * // Format as ISO date
    * formatDate(new Date(), 'YYYY-MM-DD')
    * // Returns: "2025-01-12"
    *
    * @example
    * // Format with time
    * formatDate(new Date(), 'YYYY-MM-DD HH:mm')
    * // Returns: "2025-01-12 14:30"
    *
    * @example
    * // Custom format
    * formatDate(new Date(), 'MMMM Do, YYYY')
    * // Returns: "January 12th, 2025"
    */
   ```

3. **Include Edge Cases and Error Handling**
   ```javascript
   /**
    * Divides two numbers with validation.
    * @param {number} dividend - The number to divide
    * @param {number} divisor - The number to divide by
    * @returns {number} The quotient
    * @throws {Error} If divisor is zero
    * @example
    * divide(10, 2) // Returns: 5
    *
    * @example
    * divide(10, 0) // Throws: Error
    */
   function divide(dividend, divisor) {
     if (divisor === 0) {
       throw new Error('Cannot divide by zero');
     }
     return dividend / divisor;
   }
   ```

4. **Use Comments to Show Expected Output**
   ```javascript
   /**
    * @example
    * const result = calculateTotal(100, 0.1);
    * console.log(result); // Output: 110
    */
   ```

### Formatting Guidelines
- Use consistent indentation (2 or 4 spaces)
- Show expected output with comments: `// → result` or `// Returns: result`
- Include import statements if needed
- Keep examples focused on the specific function
- Avoid overly complex examples that demonstrate multiple things

---

## 3. @remarks and @warning Tag Usage

### @remarks for Extended Documentation

```javascript
/**
 * Performs a deep clone of an object.
 * @param {*} obj - The object to clone
 * @returns {*} A deep copy of the object
 * @remarks
 * This function handles circular references by using a WeakMap to track
 * already-cloned objects. It preserves the prototype chain and works with
 * Date, RegExp, and other built-in objects.
 *
 * Performance note: For simple objects, structured clone may be faster.
 * Consider using native `structuredClone()` for modern browsers.
 */
function deepClone(obj) {
  // implementation
}
```

### @warning for Critical Caveats

```javascript
/**
 * Removes an item from the array by index.
 * @param {Array} array - The array to modify
 * @param {number} index - The index of the item to remove
 * @returns {*} The removed item
 * @warning This function mutates the original array. If you need to preserve
 * the original array, use `arrayRemoveImmutable()` instead.
 * @example
 * const arr = [1, 2, 3];
 * arrayRemove(arr, 1);
 * console.log(arr); // [1, 3] - Original array is modified
 */
function arrayRemove(array, index) {
  return array.splice(index, 1)[0];
}
```

### @deprecated with Migration Guidance

```javascript
/**
 * @deprecated Use {@link fetchUserData} instead for better error handling
 * and TypeScript support. This function will be removed in v2.0.0.
 * @remarks
 * The old API used callback-style error handling which made it difficult
 * to properly type errors. The new API uses promises and provides better
 * error messages.
 * @example
 * // Old way (deprecated)
 * getUserData(123, (err, data) => { ... });
 *
 * // New way (recommended)
 * const data = await fetchUserData(123);
 */
function getUserData(id, callback) {
  // implementation
}
```

---

## 4. Documenting Recommended vs Discouraged Usage

### Pattern 1: @example with "Recommended" Comments

```javascript
/**
 * Subscribes to state changes.
 * @param {Function} callback - Function to call on state change
 * @returns {Function} Unsubscribe function
 * @example
 * // Recommended: Clean up subscriptions
 * const unsubscribe = subscribe((state) => {
 *   console.log(state);
 * });
 *
 * // Later, when component unmounts:
 * unsubscribe();
 *
 * @example
 * // Discouraged: Not cleaning up causes memory leaks
 * subscribe((state) => {
 *   console.log(state);
 * });
 * // Without calling unsubscribe(), the callback will persist in memory
 */
function subscribe(callback) {
  // implementation
}
```

### Pattern 2: @warning with Alternatives

```javascript
/**
 * Updates component state immediately.
 * @param {object} newState - The new state to set
 * @warning Do not call this during render. Use {@link useTransition} instead
 * for state updates that should not block rendering.
 * @see {@link https://react.dev/reference/react/useState#updating-state-based-on-previous-state|React State Documentation}
 *
 * @example
 * // Recommended: Update state in event handlers
 * const handleClick = () => {
 *   setState({ count: state.count + 1 });
 * };
 *
 * @example
 * // Discouraged: Updates during render cause infinite loops
 * if (condition) {
 *   setState({ count: state.count + 1 }); // Don't do this!
 * }
 */
function setState(newState) {
  // implementation
}
```

### Pattern 3: @remarks with Usage Patterns

```javascript
/**
 * Custom hook for managing modal state.
 * @returns {Object} Modal state and handlers
 * @property {boolean} isOpen - Whether the modal is open
 * @property {Function} open - Function to open the modal
 * @property {Function} close - Function to close the modal
 *
 * @remarks
 * **Recommended Usage:**
 * - Call this hook at the top level of your component
 * - Always clean up by calling close() on unmount
 * - Use the returned handlers, not direct state manipulation
 *
 * **Discouraged Usage:**
 * - Don't use this hook conditionally
 * - Don't share the same modal state between multiple components
 * - Don't call open() immediately without user interaction (accessibility)
 *
 * @example
 * // Recommended: Proper modal lifecycle
 * function MyComponent() {
 *   const modal = useModal();
 *
 *   React.useEffect(() => {
 *     return () => modal.close(); // Cleanup on unmount
 *   }, [modal]);
 *
 *   return <button onClick={modal.open}>Open</button>;
 * }
 */
function useModal() {
  // implementation
}
```

### Pattern 4: Combining Multiple Tags

```javascript
/**
 * Executes a query against the database.
 * @param {string} query - The SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 *
 * @warning
 * **SQL Injection Risk:** Never concatenate user input directly into queries.
 * Always use parameterized queries with the params array.
 *
 * @remarks
 * This function automatically escapes parameters and prevents SQL injection
 * when used correctly. It uses prepared statements under the hood.
 *
 * @example
 * // Recommended: Use parameterized queries
 * const results = await query(
 *   'SELECT * FROM users WHERE id = ?',
 *   [userId]
 * );
 *
 * @example
 * // Discouraged: String concatenation is dangerous
 * const results = await query(
 *   `SELECT * FROM users WHERE id = ${userId}`
 * ); // Security vulnerability!
 *
 * @see {@link https://owasp.org/www-community/attacks/SQL_Injection|SQL Injection Guide}
 */
async function query(sql, params) {
  // implementation
}
```

---

## 5. TypeScript JSDoc Patterns for React Hooks

### Basic Hook Documentation

```typescript
/**
 * Custom hook for fetching data with loading and error states.
 *
 * @template T - The type of data returned by the API
 * @param {string} url - The URL to fetch data from
 * @param {Object} options - Fetch options
 * @param {RequestInit} [options.init] - Optional fetch init options
 * @param {boolean} [options.enabled=true] - Whether to enable the fetch
 * @param {number} [options.retryCount=3] - Number of retries on failure
 *
 * @returns {{ data: T | null; loading: boolean; error: Error | null; refetch: () => void }}
 * Object containing data, loading state, error, and refetch function
 *
 * @remarks
 * This hook automatically handles:
 * - Request deduplication (prevents duplicate requests)
 * - Automatic retries with exponential backoff
 * - Cleanup on unmount (aborts pending requests)
 * - Cache management with stale-while-revalidate strategy
 *
 * @warning
 * **Important:** This hook should only be called at the top level of your
 * component. Do not call it inside loops, conditions, or nested functions.
 *
 * @example
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data, loading, error } = useFetch<User>(
 *     `/api/users/${userId}`
 *   );
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   if (!data) return null;
 *
 *   return <div>{data.name}</div>;
 * }
 *
 * @example
 * // Conditional fetching with enabled option
 * function UserPosts({ userId }: { userId: string }) {
 *   const shouldFetch = Boolean(userId);
 *
 *   const { data } = useFetch<Post[]>(
 *     `/api/users/${userId}/posts`,
 *     { enabled: shouldFetch }
 *   );
 *
 *   return <div>{data?.map(post => <Post key={post.id} {...post} />)}</div>;
 * }
 */
function useFetch<T>(url: string, options?: {
  init?: RequestInit;
  enabled?: boolean;
  retryCount?: number;
}) {
  // implementation
}
```

### Documenting Hook Rules and Constraints

```typescript
/**
 * Hook for managing form state with validation.
 *
 * @param {Object} config - Form configuration
 * @param {Object} config.initialValues - Initial form values
 * @param {Object} config.validation - Validation schema
 * @param {Function} config.onSubmit - Submit handler
 *
 * @returns {Object} Form state and handlers
 *
 * @remarks
 * **Hook Rules Compliance:**
 * - Must be called at the top level of the component (no conditions)
 * - Must be called in the same order on every render
 * - Returns stable object references (safe for dependency arrays)
 *
 * **Performance:**
 * - Validation runs only when values change
 * - Re-renders are batched for rapid input changes
 * - Memoized handlers prevent unnecessary child re-renders
 *
 * @warning
 * **Common Mistakes:**
 * 1. Don't call this hook inside useEffect callbacks
 * 2. Don't call it conditionally (e.g., inside if statements)
 * 3. Don't use destructuring to break object reference stability
 *
 * @example
 * // Recommended: Proper usage
 * function LoginForm() {
 *   const form = useForm({
 *     initialValues: { email: '', password: '' },
 *     validation: {
 *       email: { required: true, email: true },
 *       password: { required: true, minLength: 8 }
 *     },
 *     onSubmit: async (values) => {
 *       await login(values);
 *     }
 *   });
 *
 *   return (
 *     <form onSubmit={form.handleSubmit}>
 *       <input {...form.register('email')} />
 *       {form.errors.email && <span>{form.errors.email}</span>}
 *     </form>
 *   );
 * }
 *
 * @example
 * // Discouraged: Breaking hook rules
 * function BadForm() {
 *   if (someCondition) {
 *     const form = useForm({...}); // Wrong: conditional hook
 *   }
 *
 *   useEffect(() => {
 *     const form = useForm({...}); // Wrong: hook in effect
 *   }, []);
 *
 *   // Wrong: destructuring breaks reference stability
 *   const { handleSubmit, register, errors } = useForm({...});
 * }
 */
function useForm<T>(config: FormConfig<T>): FormReturn<T> {
  // implementation
}
```

---

## 6. Internal vs External API Documentation

### Internal APIs (@private, @internal)

```javascript
/**
 * Validates internal state before committing changes.
 * @param {Object} state - The state to validate
 * @returns {boolean} True if valid
 *
 * @private
 * @internal
 *
 * @remarks
 * This is an internal function used by the state manager.
 * External consumers should use {@link validateState} instead.
 *
 * Internal implementation details:
 * - Checks for circular references
 * - Validates state schema
 * - Ensures immutability constraints
 *
 * @example
 * // Internal usage only
 * if (!__validateInternalState(newState)) {
 *   throw new StateValidationError('Invalid state');
 * }
 */
function __validateInternalState(state) {
  // implementation
}
```

### External APIs (@public, explicit documentation)

```javascript
/**
 * Public API for managing application state.
 *
 * @public
 *
 * @remarks
 * **Design Philosophy:**
 * - Immutable updates (state is never mutated directly)
 * - Async by default (all operations return promises)
 * - Strongly typed (full TypeScript support)
 * - Observable (subscribe to state changes)
 *
 * **Versioning:**
 * This API follows semantic versioning. Breaking changes will increment
 * the major version and be documented in the changelog.
 *
 * @example
 * // Basic usage
 * import { createManager } from 'state-manager';
 *
 * const manager = createManager({
 *   initialState: { count: 0 }
 * });
 *
 * // Subscribe to changes
 * const unsubscribe = manager.subscribe((state) => {
 *   console.log('State changed:', state);
 * });
 *
 * // Update state
 * await manager.setState({ count: 1 });
 *
 * // Clean up
 * unsubscribe();
 *
 * @see {@link https://github.com/example/state-manager|Full Documentation}
 * @see {@link https://github.com/example/state-manager/blob/main/CHANGELOG.md|Changelog}
 */
function createManager(config) {
  // implementation
}
```

### Package Entry Point Documentation

```javascript
/**
 * State Manager - A predictable state container
 *
 * @packageDocumentation
 *
 * @remarks
 * Welcome to State Manager! This library provides a simple way to manage
 * application state with predictable state mutations.
 *
 * **Quick Start:**
 * ```typescript
 * import { createManager } from 'state-manager';
 *
 * const manager = createManager({
 *   initialState: { count: 0 }
 * });
 * ```
 *
 * **Core Concepts:**
 * - **State**: The single source of truth for your application
 * - **Actions**: Events that describe what happened
 * - **Mutations**: Pure functions that update state
 * - **Selectors**: Functions to derive computed values
 *
 * **Learning Resources:**
 * - Tutorial: {@tutorial getting-started}
 * - API Reference: {@link createManager}
 * - Examples: {@link https://github.com/example/state-manager/tree/main/examples|GitHub Examples}
 *
 * @example
 * // Complete example with all features
 * import { createManager } from 'state-manager';
 *
 * const manager = createManager({
 *   initialState: { users: [] },
 *
 *   mutations: {
 *     addUser: (state, user) => ({
 *       ...state,
 *       users: [...state.users, user]
 *     })
 *   },
 *
 *   selectors: {
 *     userCount: (state) => state.users.length
 *   }
 * });
 *
 * // Use mutation
 * manager.mutations.addUser({ name: 'Alice' });
 *
 * // Use selector
 * const count = manager.selectors.userCount();
 * console.log(count); // 1
 *
 * // Subscribe to changes
 * manager.subscribe((state) => {
 *   console.log('Users:', state.users);
 * });
 * ```
 */
```

---

## 7. Recommended Tag Combinations for Usage Guidelines

### Combination 1: Anti-Pattern Warning
```javascript
/**
 * @description
 * @warning
 * @example (recommended)
 * @example (discouraged)
 * @see (alternative)
 */
```

### Combination 2: Deprecation Notice
```javascript
/**
 * @description
 * @deprecated
 * @remarks (why it's deprecated)
 * @see (replacement)
 * @example (migration path)
 */
```

### Combination 3: Performance Guidance
```javascript
/**
 * @description
 * @remarks (performance characteristics)
 * @warning (performance pitfalls)
 * @example (efficient usage)
 * @example (inefficient usage to avoid)
 */
```

### Combination 4: Hook-Specific Documentation
```javascript
/**
 * @template T
 * @param {...} params
 * @returns {...}
 * @remarks (hook rules, performance, features)
 * @warning (common mistakes)
 * @example (basic usage)
 * @example (advanced usage)
 * @see (related hooks)
 */
```

### Combination 5: Security Warning
```javascript
/**
 * @description
 * @warning (security implications)
 * @remarks (security best practices)
 * @example (secure usage)
 * @example (insecure usage to avoid)
 * @see (security resources)
 */
```

---

## 8. Real-World Examples from Open Source Projects

### React (Pattern from React docs)

```javascript
/**
 * Accepts a context object (the value returned from `React.createContext`) and returns the current
 * context value, as given by the nearest context provider for the given context.
 *
 * @template T
 * @param {React.Context<T>} context - context object from createContext
 * @returns {T} The current context value
 *
 * @remarks
 * **When to Use:**
 * - Reading context in function components
 * - Avoiding prop drilling through many component layers
 *
 * **When NOT to Use:**
 * - For simple prop passing (use props instead)
 * - When values don't need to be shared across components
 *
 * @warning
 * **Important:** The context consumer must be a descendant of the corresponding
 * context provider. If there is no provider for this context, the default value
 * (passed to createContext) will be returned.
 *
 * @example
 * const ThemeContext = React.createContext('light');
 *
 * function Button() {
 *   const theme = useContext(ThemeContext);
 *   return <button className={theme}>Click me</button>;
 * }
 *
 * function App() {
 *   return (
 *     <ThemeContext.Provider value="dark">
 *       <Button />
 *     </ThemeContext.Provider>
 *   );
 * }
 *
 * @see {@link https://react.dev/reference/react/useContext|React.useContext Documentation}
 */
function useContext(context) {
  // React implementation
}
```

### Pattern from Redux Toolkit

```javascript
/**
 * A helper function that creates a slice of the Redux store.
 *
 * @param {Object} config - Slice configuration
 * @param {string} config.name - The slice name (used in action types)
 * @param {Object} config.initialState - The initial state for this slice
 * @param {Object} [config.reducers] - Reducer functions
 * @param {Object} [config.extraReducers] - Additional reducers for other actions
 *
 * @returns {Object} Slice object with actions and reducer
 *
 * @remarks
 * **Immer Integration:** This function uses Immer internally, allowing you to
 * write "mutating" logic in your reducers that actually produces immutable updates.
 *
 * **Action Creators:** Action creators are automatically generated for each reducer
 * function. The action type is `{sliceName}/{reducerName}`.
 *
 * **Best Practices:**
 * - Keep slices focused on a single domain/feature
 * - Use TypeScript for better type inference
 * - Co-locate related reducers and selectors
 *
 * @warning
 * **Async Operations:** Do not put async logic in reducers. Use {@link createAsyncThunk}
 * for async operations, or handle them in middleware/thunks.
 *
 * **State Mutation:** While you can write "mutating" syntax thanks to Immer,
 * never mutate state directly in components or outside reducers.
 *
 * @example
 * const counterSlice = createSlice({
 *   name: 'counter',
 *   initialState: { value: 0 },
 *   reducers: {
 *     increment: (state) => {
 *       state.value += 1; // Safe "mutation" with Immer
 *     },
 *     decrement: (state) => {
 *       state.value -= 1;
 *     },
 *     incrementByAmount: (state, action) => {
 *       state.value += action.payload;
 *     }
 *   }
 * });
 *
 * // Extract action creators
 * const { increment, decrement, incrementByAmount } = counterSlice.actions;
 *
 * // Extract reducer
 * const counterReducer = counterSlice.reducer;
 *
 * // Dispatch actions
 * dispatch(increment());
 * dispatch(incrementByAmount(5));
 *
 * @see {@link https://redux-toolkit.js.org/api/createSlice|Official Documentation}
 * @see {@link https://redux-toolkit.js.org/tutorials/essentials/part-2-app-structure|Tutorial: App Structure}
 */
function createSlice(config) {
  // Implementation
}
```

### Pattern from React Query

```javascript
/**
 * Executes an asynchronous function and tracks its state.
 *
 * @template TData - The type of data returned by the query
 * @template TError - The type of error that can occur
 * @param {Object} options - Query options
 * @param {Function} options.queryFn - The query function to execute
 * @param {Array} [options.queryKey] - The query key for caching
 * @param {boolean} [options.enabled=true] - Whether to automatically execute
 * @param {number} [options.staleTime=0] - Time in ms that data remains fresh
 * @param {number} [options.cacheTime=300000] - Time in ms to cache unused data
 *
 * @returns {UseQueryResult} Query result object
 *
 * @remarks
 * **Caching Strategy:**
 * Queries are cached based on their queryKey. Identical queryKeys will share
 * the same cache entry. This prevents duplicate requests and enables
 * background refetching.
 *
 * **Refresh Mechanisms:**
 * - Automatic refetch on window focus
 * - Automatic refetch on reconnection
 * - Manual refetch with refetch()
 *
 * **Performance:**
 * - Requests are de-duplicated (multiple components share one request)
 * - Stale data is served immediately while fresh data fetches in background
 * - Unused cache entries are garbage collected after cacheTime
 *
 * @warning
 * **Race Conditions:** When using enabled with dependencies, ensure your
 * queryKey includes all dependencies to prevent race conditions.
 *
 * **Memory Leaks:** Always use enabled: false for queries that shouldn't
 * run immediately, or use conditional fetching patterns.
 *
 * **Effect Dependencies:** Do not call useQuery inside useEffect. The
 * enabled parameter is the correct way to handle conditional fetching.
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useQuery({
 *   queryKey: ['users', userId],
 *   queryFn: () => fetchUser(userId),
 *   staleTime: 5000 // Data stays fresh for 5 seconds
 * });
 *
 * @example
 * // Conditional fetching
 * const { data } = useQuery({
 *   queryKey: ['user', userId],
 *   queryFn: () => fetchUser(userId),
 *   enabled: !!userId // Only fetch when userId exists
 * });
 *
 * @example
 * // Parallel queries (component level)
 * function UserProfile({ userId }) {
 *   const userQuery = useQuery({
 *     queryKey: ['user', userId],
 *     queryFn: () => fetchUser(userId)
 *   });
 *
 *   const postsQuery = useQuery({
 *     queryKey: ['posts', userId],
 *     queryFn: () => fetchUserPosts(userId),
 *     enabled: !!userQuery.data // Only run after user loads
 *   });
 *
 *   if (userQuery.isLoading || postsQuery.isLoading) {
 *     return <Spinner />;
 *   }
 *
 *   return <Profile user={userQuery.data} posts={postsQuery.data} />;
 * }
 *
 * @see {@link https://tanstack.com/query/latest/docs/react/reference/useQuery|useQuery API Reference}
 * @see {@link https://tanstack.com/query/latest/docs/react/guides/parallel-queries|Parallel Queries Guide}
 */
function useQuery(options) {
  // Implementation
}
```

---

## 9. Code Example Formatting Best Practices

### Multi-Line Example with Annotations

```javascript
/**
 * Processes a payment transaction.
 *
 * @param {PaymentRequest} request - Payment details
 * @returns {Promise<PaymentResult>} Transaction result
 *
 * @example
 * // Basic payment processing
 * const result = await processPayment({
 *   amount: 99.99,
 *   currency: 'USD',
 *   paymentMethod: 'card_1234567890',
 *   customerId: 'cus_abcdefg'
 * });
 *
 * console.log(result.status); // 'success' or 'failed'
 * console.log(result.transactionId); // 'txn_...'
 *
 * @example
 * // Payment with metadata and description
 * const result = await processPayment({
 *   amount: 149.99,
 *   currency: 'EUR',
 *   paymentMethod: 'card_1234567890',
 *   customerId: 'cus_abcdefg',
 *
 *   // Optional fields
 *   description: 'Premium subscription - Annual',
 *   metadata: {
 *     orderId: 'ORD-2025-001',
 *     source: 'web',
 *     campaign: 'spring_sale_2025'
 *   }
 * });
 *
 * @example
 * // Handling errors
 * try {
 *   const result = await processPayment({
 *     amount: 99.99,
 *     currency: 'USD',
 *     paymentMethod: 'card_invalid',
 *     customerId: 'cus_abcdefg'
 *   });
 * } catch (error) {
 *   if (error.code === 'card_declined') {
 *     console.error('Card was declined:', error.message);
 *   } else if (error.code === 'insufficient_funds') {
 *     console.error('Insufficient funds');
 *   }
 * }
 */
```

### Before/After Pattern

```javascript
/**
 * Optimizes the rendering of large lists.
 *
 * @param {Object} options - Virtualization options
 * @returns {Object} Virtual list API
 *
 * @example
 * // Before: Rendering all items (slow for large lists)
 * function SlowList({ items }) {
 *   return (
 *     <div>
 *       {items.map(item => (
 *         <div key={item.id}>{item.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * // Problem: 10,000 items = 10,000 DOM nodes = poor performance
 *
 * @example
 * // After: Using virtualization (fast)
 * function FastList({ items }) {
 *   const rowVirtualizer = useVirtualizer({
 *     count: items.length,
 *     getScrollElement: () => scrollRef.current,
 *     estimateSize: () => 35,
 *     overscan: 5
 *   });
 *
 *   return (
 *     <div ref={scrollRef} style={{ height: '400px', overflow: 'auto' }}>
 *       <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
 *         {rowVirtualizer.getVirtualItems().map(virtualRow => (
 *           <div
 *             key={virtualRow.key}
 *             style={{
 *               position: 'absolute',
 *               top: 0,
 *               left: 0,
 *               width: '100%',
 *               height: `${virtualRow.size}px`,
 *               transform: `translateY(${virtualRow.start}px)`
 *             }}
 *           >
 *             {items[virtualRow.index].name}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * // Result: Only ~20 DOM nodes rendered regardless of list size
 */
```

---

## 10. Checklist for Effective Usage Guidelines

### Content Quality
- [ ] Clear description of what the function/hook does
- [ ] All parameters documented with types
- [ ] Return value documented
- [ ] Examples cover common use cases
- [ ] Examples cover edge cases
- [ ] Warnings for dangerous operations
- [ ] Alternatives suggested for deprecated features

### Example Quality
- [ ] Examples are complete and runnable
- [ ] Examples show expected output
- [ ] Multiple examples for different scenarios
- [ ] Examples follow consistent formatting
- [ ] Complex examples have explanatory comments
- [ ] Import statements included when needed

### Warning Quality
- [ ] Warnings explain WHY something is dangerous
- [ ] Warnings provide alternatives/solutions
- [ ] Security implications highlighted
- [ ] Performance implications noted
- [ ] Common mistakes documented
- [ ] Links to additional resources

### Documentation Structure
- [ ] Main description is concise
- [ ] Extended details in @remarks
- [ ] Critical warnings in @warning
- [ ] Examples in @example blocks
- [ ] Related APIs linked with @see
- [ ] Tutorials referenced with @tutorial

### TypeScript-Specific
- [ ] Generic types documented with @template
- [ ] Type parameters explained
- [ ] Return types are specific (not just "any")
- [ ] Optional vs required parameters clear
- [ ] Type inference examples provided

---

## 11. Tools and Resources

### Documentation Generators
- **TypeDoc:** https://typedoc.org/ - Best for TypeScript projects
- **JSDoc:** https://jsdoc.app/ - Standard JavaScript documentation
- **Documentation.js:** https://documentation.js.org/ - Modern alternative
- **ESDoc:** https://esdoc.org/ - Focused on ES6+

### Linting JSDoc
- **eslint-plugin-jsdoc:** https://github.com/gajus/eslint-plugin-jsdoc
  - Enforces JSDoc best practices
  - Checks for missing parameters
  - Validates tag usage

### IDE Support
- **VS Code:** Built-in JSDoc support with IntelliSense
- **WebStorm:** Advanced JSDoc navigation and refactoring
- **IDEA:** Same as WebStorm

### Additional Resources
- **TSDoc Standard:** https://tsdoc.org/ - Cross-project standard
- **Google JavaScript Style Guide:** https://google.github.io/styleguide/jsguide.html
- **Airbnb JavaScript Style Guide:** https://github.com/airbnb/javascript
- **React Documentation Patterns:** https://react.dev/learn/writing-markdown

---

## 12. Summary and Recommendations

### Key Takeaways

1. **Always use @example** - Show, don't just tell. Examples should be runnable and complete.

2. **Use @warning liberally** - If there's a way to misuse your API, document it. Warnings should explain the "why" and suggest alternatives.

3. **Leverage @remarks** - Put extended documentation, design philosophy, and implementation details in @remarks rather than the main description.

4. **Document the "why"** - Don't just document what code does. Explain design decisions, trade-offs, and rationale.

5. **Use @see liberally** - Link to related functions, alternatives, and external resources. Documentation should be interconnected.

6. **Differentiate internal/external** - Use @private/@internal for implementation details. Keep public API documentation focused on usage.

7. **Consider TypeScript users** - Even if you're writing JavaScript, TypeScript developers will consume your docs. Include type information.

8. **Keep examples updated** - Outdated examples are worse than no examples. Set up automated testing of examples if possible.

### Recommended Documentation Template

```javascript
/**
 * Concise one-line description.
 *
 * Longer description if needed (2-3 sentences max).
 *
 * @param {...} param - Description
 * @returns {...} Description
 *
 * @remarks
 * Extended documentation:
 * - Design philosophy
 * - Implementation details
 * - Performance characteristics
 *
 * @warning
 * Critical warnings with:
 * - Security implications
 * - Performance pitfalls
 * - Common mistakes
 *
 * @example
 * // Basic usage
 * ...
 *
 * @example
 * // Advanced usage
 * ...
 *
 * @see {@link relatedFunction}
 * @see {@link https://external-resource.com|External Docs}
 */
```

---

## Appendix: Quick Reference Card

### Common Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `@param` | Document parameter | `@param {number} x - The x coordinate` |
| `@returns` | Document return value | `@returns {boolean} True if valid` |
| `@example` | Show usage example | See examples above |
| `@remarks` | Extended documentation | See examples above |
| `@warning` | Highlight dangers | See examples above |
| `@deprecated` | Mark as deprecated | `@deprecated Use newFunc() instead` |
| `@see` | Link to related | `@see {@link otherFunc}` |
| `@throws` | Document exceptions | `@throws {Error} When invalid` |
| `@template` | TypeScript generic | `@template T - The data type` |
| `@private` | Internal only | `@private` |
| `@public` | Public API | `@public` |
| `@internal` | Internal to package | `@internal` |

### Tag Ordering

Recommended order in JSDoc blocks:
1. Description
2. `@param` tags
3. `@returns` tag
4. `@throws` tags
5. `@example` tags
6. `@remarks` tag
7. `@warning` tag
8. `@deprecated` tag
9. `@see` tags
10. Custom tags

---

**End of Research Document**
