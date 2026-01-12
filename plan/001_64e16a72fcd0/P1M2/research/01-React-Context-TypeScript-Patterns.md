# React Context TypeScript Patterns - 2025 Research

## Overview
This document covers best practices for typing React Context with TypeScript, including handling null initial values, complex context value types, and context splitting patterns.

---

## 1. Creating Context with Null Initial Values

### Pattern 1: Union Type with Null (Recommended for Simple Cases)

When you don't have a meaningful default value, use `null` as the default and type the context as a union:

```typescript
interface CurrentUserContextType {
  username: string;
  email: string;
  id: string;
}

// Create context with null default
const CurrentUserContext = createContext<CurrentUserContextType | null>(null);
```

**Pros:**
- Forces explicit null-checking at usage sites
- Clear intent that context may not be available
- Type-safe with proper narrowing

**Cons:**
- Consumers must check for null before accessing properties
- Requires null checks on every context usage

---

### Pattern 2: Custom Hook with Runtime Validation (Recommended - Best Practice)

This is the recommended approach by React documentation and TypeScript best practices:

```typescript
interface CurrentUserContextType {
  username: string;
  email: string;
  id: string;
}

const CurrentUserContext = createContext<CurrentUserContextType | null>(null);

// Custom hook with runtime validation
const useCurrentUser = (): CurrentUserContextType => {
  const context = useContext(CurrentUserContext);

  if (!context) {
    throw new Error(
      'useCurrentUser must be used within <CurrentUserContext.Provider>'
    );
  }

  return context;
};

// Usage
function UserProfile() {
  const user = useCurrentUser(); // No null check needed
  return <div>{user.username}</div>;
}
```

**Pros:**
- Eliminates null-checking in components
- Clear error messages for debugging
- Type-safe: return type is non-nullable
- Graceful failure at runtime

**Cons:**
- Requires creating custom hooks for each context
- Throws error if provider is missing

---

### Pattern 3: Non-Null Assertion (Less Recommended)

Using the non-null assertion operator `!`:

```typescript
const CurrentUserContext = createContext<CurrentUserContextType>(null!);
```

**Pros:**
- Simple syntax
- No null checks needed in components

**Cons:**
- Less type-safe than runtime validation
- Suppresses TypeScript errors
- Runtime errors can occur if context is not provided
- Not recommended by React documentation

---

### Pattern 4: Default Value as Type Assertion

Using an empty object cast to the expected type:

```typescript
const CurrentUserContext = createContext<CurrentUserContextType>(
  {} as CurrentUserContextType
);
```

**Pros:**
- Provides a fallback value

**Cons:**
- Empty object doesn't match actual shape
- Can mask missing providers
- Not recommended

---

### Pattern 5: Generic createCtx Wrapper Function

Create a reusable wrapper for context creation:

```typescript
interface Deferred<T> {
  value: T | undefined;
}

function createCtx<T>() {
  const ctx = createContext<T | undefined>(undefined);

  const useCtx = () => {
    const context = useContext(ctx);
    if (!context) {
      throw new Error('Context not provided - must wrap with Provider');
    }
    return context;
  };

  return [useCtx, ctx] as const;
}

// Usage
const [useUser, UserContext] = createCtx<CurrentUserContextType>();

// In provider
function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUserContextType | null>(null);

  return (
    <UserContext.Provider value={user || undefined}>
      {children}
    </UserContext.Provider>
  );
}

// In component
function MyComponent() {
  const user = useUser(); // Type is CurrentUserContextType, not nullable
  return <div>{user.username}</div>;
}
```

**Pros:**
- DRY principle - reusable pattern
- Combines benefits of Patterns 1 and 2
- Type-safe

---

## 2. Complex Context Value Types

### Context with State and Functions

```typescript
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoContextType {
  // State
  todos: TodoItem[];
  filter: 'all' | 'active' | 'completed';
  isLoading: boolean;

  // Functions
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
}

const TodoContext = createContext<TodoContextType | null>(null);

const useTodos = (): TodoContextType => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within TodoProvider');
  }
  return context;
};
```

### Context with Async Functions and Promises

```typescript
interface DataContextType {
  data: Record<string, unknown> | null;
  loading: boolean;
  error: Error | null;

  // Async functions
  fetchData: (id: string) => Promise<void>;
  updateData: (id: string, data: Record<string, unknown>) => Promise<void>;
  clearData: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
```

---

## 3. Context Splitting Pattern (State vs Actions)

### Why Split Context?

Splitting contexts by update frequency prevents unnecessary re-renders. Components consuming only state won't re-render when actions are updated.

### Implementation

```typescript
// 1. Define state interface
interface AppState {
  user: CurrentUserContextType | null;
  todos: TodoItem[];
  filter: 'all' | 'active' | 'completed';
  isLoading: boolean;
}

// 2. Define actions interface
interface AppActions {
  setUser: (user: CurrentUserContextType | null) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  setFilter: (filter: AppState['filter']) => void;
  setLoading: (loading: boolean) => void;
}

// 3. Create separate contexts
const AppStateContext = createContext<AppState | null>(null);
const AppActionsContext = createContext<AppActions | null>(null);

// 4. Custom hooks
const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
};

const useAppActions = (): AppActions => {
  const context = useContext(AppActionsContext);
  if (!context) {
    throw new Error('useAppActions must be used within AppProvider');
  }
  return context;
};

// 5. Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions: AppActions = useMemo(() => ({
    setUser: (user) => dispatch({ type: 'SET_USER', payload: user }),
    addTodo: (text) => dispatch({ type: 'ADD_TODO', payload: text }),
    toggleTodo: (id) => dispatch({ type: 'TOGGLE_TODO', payload: id }),
    deleteTodo: (id) => dispatch({ type: 'DELETE_TODO', payload: id }),
    setFilter: (filter) => dispatch({ type: 'SET_FILTER', payload: filter }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
  }), []);

  return (
    <AppStateContext.Provider value={state}>
      <AppActionsContext.Provider value={actions}>
        {children}
      </AppActionsContext.Provider>
    </AppStateContext.Provider>
  );
}
```

### Selective Context Usage

```typescript
// Component that only cares about state
function TodoList() {
  const { todos, filter } = useAppState(); // Won't re-render on action changes
  return (
    <ul>
      {todos
        .filter(t => filter === 'all' || (filter === 'completed') === t.completed)
        .map(todo => <TodoItem key={todo.id} todo={todo} />)
      }
    </ul>
  );
}

// Component that only cares about actions
function TodoForm() {
  const { addTodo } = useAppActions(); // Won't re-render on state changes
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTodo(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a todo..."
      />
      <button type="submit">Add</button>
    </form>
  );
}
```

---

## 4. Advanced Pattern: Context with Selectors

Prevents component re-renders by only subscribing to needed properties:

```typescript
// Selector-based context pattern
interface UseAppStateOptions<T> {
  selector?: (state: AppState) => T;
}

const useAppStateWithSelector = <T,>(options?: UseAppStateOptions<T>) => {
  const state = useAppState();

  if (options?.selector) {
    return useMemo(() => options.selector(state), [state, options.selector]);
  }

  return state;
};

// Usage
function TodoItem({ id }: { id: string }) {
  const todos = useAppStateWithSelector({
    selector: (state) => state.todos.find(t => t.id === id),
  });

  return <div>{todos?.text}</div>;
}
```

---

## 5. Best Practices Summary

| Pattern | Use Case | Recommendation |
|---------|----------|-----------------|
| Union with Null | Simple contexts with no default | Good for learning |
| Custom Hook with Validation | Production applications | RECOMMENDED |
| Non-Null Assertion | Quick prototypes only | Avoid in production |
| Type Assertion | Legacy code only | Avoid |
| Generic Wrapper | Reusable context patterns | Good for large apps |
| Selector Pattern | Performance-critical apps | Use with context splitting |

---

## Key Takeaways

1. **Prefer runtime validation** over type assertions
2. **Always create custom hooks** for context access
3. **Split contexts** by update frequency for performance
4. **Use discriminated unions** for action types in combined contexts
5. **Test context providers** thoroughly to ensure provider presence

---

## References

- [React TypeScript Cheatsheet - Context](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/)
- [React Official Documentation - createContext](https://react.dev/reference/react/createContext)
- [LogRocket: How to use React Context with TypeScript](https://blog.logrocket.com/how-to-use-react-context-typescript/)
- [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
