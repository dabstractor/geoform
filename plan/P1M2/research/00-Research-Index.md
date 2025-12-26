# React TypeScript Type Definition Patterns - 2025 Research Index

## Executive Summary

This research provides comprehensive guidance on modern React TypeScript patterns for 2025, covering:
- **React Context** with null initial values and context splitting
- **Generic Interfaces** for flexible React components
- **Promise-based APIs** with advanced patterns
- **Reducer patterns** with discriminated unions

All patterns include production-ready code examples, best practices, and links to authoritative sources.

---

## Research Documents

### 1. React Context TypeScript Patterns
**File:** `01-React-Context-TypeScript-Patterns.md`

**Key Topics:**
- Creating context with null initial values (5 patterns)
- Complex context value types (state + functions)
- Context splitting for performance optimization
- Selector pattern for fine-grained subscriptions
- Best practices table and recommendations

**Code Examples:**
- Pattern 1: Union type with null
- Pattern 2: Custom hook with runtime validation (RECOMMENDED)
- Pattern 3-5: Non-null assertion, type assertion, generic wrapper
- State/Actions splitting pattern
- Selector-based context pattern

**Best Recommendation:**
Use custom hooks with runtime validation for production applications. This pattern combines type safety with clear error messages.

```typescript
const useCurrentUser = (): CurrentUserContextType => {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within provider');
  }
  return context;
};
```

---

### 2. Generic Interfaces for React Components
**File:** `02-Generic-Interfaces-React-Components.md`

**Key Topics:**
- Basic generic components with TypeScript
- ComponentType<Props> typing with generics
- Generic constraints: `T extends unknown` vs `T extends any`
- Interface vs Type debate for React props
- Polymorphic components
- Advanced generic patterns

**Code Examples:**
- List component with generics
- Table with multiple type parameters
- ComponentType with constrained generics
- Form component patterns
- Type unions vs interfaces comparison
- Polymorphic component patterns
- Generic component wrappers

**Best Recommendation:**
Use `interface` for simple component props and library APIs. Use `type` for unions, intersections, and complex transformations. Consistency matters more than the specific choice.

```typescript
// Good for component props
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

// Use <T extends unknown> in TSX files
const List = <T extends unknown>(props: ListProps<T>) => {
  // implementation
};
```

---

### 3. Promise-Based API Patterns
**File:** `03-Promise-Based-API-Patterns.md`

**Key Topics:**
- Promise constructor type definitions
- Resolve and reject callback typing
- Promise<T | undefined> patterns
- DeferredPromise implementation (externally controlled promises)
- Promise utility types
- Async/await with proper typing
- Promise cancellation pattern
- Race and all with type safety

**Code Examples:**
- Basic promise constructor typing
- Typed resolve/reject callbacks
- Simple and advanced Deferred implementations
- DeferredWithTimeout for time-bound operations
- Promise.all with heterogeneous tuples
- Promise.race with type safety
- Retry pattern with typing
- Cancellable promise wrapper

**Best Recommendation:**
Use explicit return types on async functions. Prefer discriminated unions over `Promise<T | undefined>` for error handling. For external promise resolution, implement a Deferred wrapper class.

```typescript
// Good
async function fetchUser(id: string): Promise<FetchResult<User>> {
  // ...
  return { success: true, data: user };
}

// Avoid
async function fetchUser(id: string): Promise<User | undefined> {
  // ...
}
```

---

### 4. Reducer Pattern TypeScript Patterns
**File:** `04-Reducer-Pattern-Types.md`

**Key Topics:**
- Discriminated union patterns for actions
- Action factory pattern
- State organization with discriminated unions
- useReducer hook typing
- Combining Context + Reducer
- Immer integration for immutable updates
- Reducer with middleware pattern

**Code Examples:**
- Simple todo reducer with discriminated unions
- Named union types for actions
- Action factory with type inference
- Const assertion for action types
- State as discriminated union (AsyncState pattern)
- Context + Reducer combination
- Immer-integrated reducers
- Middleware for reducers

**Best Recommendation:**
Use discriminated unions for actions with a clear `type` property. Create action factories to prevent typos. Implement exhaustive checking using `never` type. Combine with Context for global state management.

```typescript
type TodoAction =
  | { type: 'add_todo'; payload: { id: string; text: string } }
  | { type: 'toggle_todo'; payload: string }
  | { type: 'delete_todo'; payload: string }
  | { type: 'reset' };

const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  switch (action.type) {
    case 'add_todo':
      // TypeScript knows action has payload
      return { ...state, todos: [...state.todos, action.payload] };
    // ... other cases
    default:
      const _exhaustive: never = action; // Ensures all cases handled
      return _exhaustive;
  }
};
```

---

## Cross-Document Patterns

### Pattern: Combining Context + Reducer + Generics

```typescript
// 1. Generic state type
interface AppState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// 2. Discriminated union actions
type AppAction<T> =
  | { type: 'load_start' }
  | { type: 'load_success'; payload: T }
  | { type: 'load_error'; payload: Error };

// 3. Generic reducer
const appReducer = <T,>(
  state: AppState<T>,
  action: AppAction<T>
): AppState<T> => {
  switch (action.type) {
    case 'load_start':
      return { ...state, loading: true, error: null };
    case 'load_success':
      return { ...state, data: action.payload, loading: false };
    case 'load_error':
      return { ...state, error: action.payload, loading: false };
  }
};

// 4. Typed context
const AppContext = createContext<AppState<any> | null>(null);
const AppDispatch = createContext<React.Dispatch<AppAction<any>> | null>(null);

// 5. Generic provider
function AppProvider<T>({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    appReducer<T>,
    { data: null, loading: false, error: null }
  );

  return (
    <AppContext.Provider value={state}>
      <AppDispatch.Provider value={dispatch}>
        {children}
      </AppDispatch.Provider>
    </AppContext.Provider>
  );
}
```

---

## 2025 React TypeScript Ecosystem

### Recommended Libraries

1. **Redux Toolkit** - For large-scale state management
   - Better than plain Redux, reduces boilerplate
   - Still relevant for complex applications

2. **Zustand** - For simple global state
   - Lightweight alternative to Context
   - Good middle ground between Context and Redux

3. **TanStack Query (React Query)** - For server state
   - Separate from UI state management
   - Handles caching, pagination, infinite queries

4. **tRPC** - For end-to-end type safety
   - When both frontend and backend are TypeScript
   - Eliminates API contract issues

5. **TanStack Router** - For type-safe routing
   - Modern alternative to React Router
   - Full TypeScript support with inference

### Pattern Recommendations by Use Case

| Use Case | Pattern | Library |
|----------|---------|---------|
| Component local state | useState | None needed |
| Simple global state | Context + useReducer | None needed |
| Complex global state | Context + useReducer | Zustand for simplicity |
| Large application state | Discriminated union reducer | Redux Toolkit |
| Server data fetching | AsyncState pattern | TanStack Query |
| Form state | Separate context or library | React Hook Form |
| Type-safe APIs | Promise<Result<T, E>> | tRPC |

---

## TypeScript Best Practices Summary

### 1. Type Safety Hierarchy

```
Most Type-Safe:
1. Discriminated unions with exhaustive checking
2. Generic constraints with extends
3. Named interfaces/types
4. Implicit type inference
5. Type assertions (last resort)

Most Flexible:
```

### 2. Naming Conventions

```typescript
// Interfaces
interface ComponentProps { }
interface State { }
interface Action { }

// Types
type Status = 'idle' | 'loading' | 'success' | 'error';
type Result<T> = Success<T> | Error;
type PromiseValue<P> = P extends Promise<infer T> ? T : never;

// Generics
type Container<T>
type Mapper<TInput, TOutput>
type Handler<TEvent, TResult>

// Action constants
const ACTIONS = { ADD: 'add', REMOVE: 'remove' } as const;
```

### 3. Generic Constraint Patterns

```typescript
// Constraint to object with id
T extends { id: string | number }

// Constraint to array
T extends any[]

// Constraint to function
T extends (...args: any[]) => any

// Constraint to specific type
T extends string | number

// Multiple constraints (intersection)
T extends { id: string } & { name: string }
```

---

## Key Takeaways

1. **Context Pattern**: Use custom hooks with runtime validation
2. **Generics**: `<T extends unknown>` in TSX, interfaces for APIs
3. **Promises**: Explicit return types, discriminated unions for errors
4. **Reducers**: Discriminated unions with exhaustive checking
5. **Consistency**: Pick one approach per team/project
6. **Performance**: Split contexts by update frequency
7. **DX**: Prioritize clear error messages over silent failures
8. **Testing**: Test reducers as pure functions

---

## Research Methodology

This research was conducted through:
- Official React and TypeScript documentation analysis
- Review of comprehensive TypeScript guides
- Study of production patterns from major libraries
- Analysis of DeveloperWay, Total TypeScript, and Ben Ilegbodu resources
- Examination of real-world implementations

All code examples are based on patterns from:
- React 19+ documentation
- TypeScript 5.x+ syntax
- Modern best practices for 2025

---

## Additional Resources

### Official Documentation
- [React Documentation - TypeScript](https://react.dev/learn/typescript)
- [React API Reference - createContext](https://react.dev/reference/react/createContext)
- [React API Reference - useReducer](https://react.dev/reference/react/useReducer)
- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook - Unions and Intersections](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html)

### Learning Resources
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Total TypeScript - React with TypeScript](https://www.totaltypescript.com/courses/react-with-typescript)
- [Ben Ilegbodu - React TypeScript Blog](https://www.benmvp.com/blog/)
- [DeveloperWay - Advanced TypeScript for React](https://www.developerway.com/posts/advanced-typescript-for-react-developers-discriminated-unions)

### Tools & Utilities
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Immer - Immutable updates](https://immerjs.github.io/immer/)
- [Redux Toolkit - State management](https://redux-toolkit.js.org/)
- [Zustand - Lightweight state](https://github.com/pmndrs/zustand)
- [TanStack Query - Server state](https://tanstack.com/query/latest)
- [tRPC - End-to-end type safety](https://trpc.io/)

---

## Document Version

- **Version**: 1.0
- **Date**: December 2025
- **TypeScript Version**: 5.x+
- **React Version**: 19+
- **Status**: Production Ready

---

## Contributing

When updating these patterns:
1. Verify with official TypeScript/React documentation
2. Test all code examples
3. Include both simple and advanced examples
4. Link to authoritative sources
5. Update the index with new patterns

---

## Quick Reference

### When to Use What

**Context with null:**
```typescript
const Context = createContext<Type | null>(null);
const useHook = () => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('Missing provider');
  return ctx;
};
```

**Generic component:**
```typescript
const Component = <T extends unknown>(props: Props<T>) => {
  // implementation
};
```

**Discriminated union action:**
```typescript
type Action =
  | { type: 'add'; payload: string }
  | { type: 'remove'; id: number };
```

**Promise with error handling:**
```typescript
async function fetch(): Promise<Result<Data, Error>> {
  return { success: true, data: { } };
}
```

**Deferred promise:**
```typescript
const deferred = new Deferred<Type>();
// ... resolve later
deferred.resolve(value);
```

---

End of Research Index
