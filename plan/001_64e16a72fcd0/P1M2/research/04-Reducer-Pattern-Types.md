# Reducer Pattern TypeScript Patterns - 2025 Research

## Overview
This document covers advanced TypeScript patterns for reducer functions, with emphasis on discriminated unions, useReducer typing, and state/action type organization.

---

## 1. Discriminated Union Pattern for Actions

### Fundamental Concepts

A **discriminated union** (also called tagged union) is a union type where each member has a common property with a literal type, allowing TypeScript to narrow down which specific type you're working with.

```typescript
// Common property: 'type' with literal values
type Action =
  | { type: 'add'; payload: string }
  | { type: 'remove'; id: number }
  | { type: 'clear' };

// TypeScript can narrow based on 'type' property
function handleAction(action: Action) {
  switch (action.type) {
    case 'add':
      console.log(action.payload); // payload is string
      break;
    case 'remove':
      console.log(action.id); // id is number
      break;
    case 'clear':
      // No extra properties
      break;
  }
}
```

### Benefits of Discriminated Unions

1. **Type Safety**: Each case has exact property types
2. **Exhaustive Checking**: Forget a case, TypeScript errors
3. **No Magic Strings**: All action types are validated
4. **IntelliSense**: Autocomplete for properties per case
5. **Impossible States**: Can't have invalid action combinations

---

## 2. Basic Reducer Pattern with Types

### Simple Todo Reducer

```typescript
// 1. Define state interface
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: TodoItem[];
  filter: 'all' | 'active' | 'completed';
  isLoading: boolean;
}

// 2. Define action types as discriminated union
type TodoAction =
  | { type: 'add_todo'; payload: { id: string; text: string } }
  | { type: 'toggle_todo'; payload: string }
  | { type: 'delete_todo'; payload: string }
  | { type: 'set_filter'; payload: 'all' | 'active' | 'completed' }
  | { type: 'set_loading'; payload: boolean }
  | { type: 'reset' };

// 3. Define initial state
const initialTodoState: TodoState = {
  todos: [],
  filter: 'all',
  isLoading: false,
};

// 4. Implement reducer with proper typing
const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  switch (action.type) {
    case 'add_todo':
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: action.payload.id,
            text: action.payload.text,
            completed: false,
          },
        ],
      };

    case 'toggle_todo':
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      };

    case 'delete_todo':
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.payload),
      };

    case 'set_filter':
      return {
        ...state,
        filter: action.payload,
      };

    case 'set_loading':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'reset':
      return initialTodoState;

    default:
      // Type checking ensures we've handled all cases
      const _exhaustive: never = action;
      return _exhaustive;
  }
};

// 5. Use with useReducer hook
function TodoComponent() {
  const [state, dispatch] = useReducer(todoReducer, initialTodoState);

  const addTodo = (text: string) => {
    dispatch({
      type: 'add_todo',
      payload: { id: Date.now().toString(), text },
    });
  };

  // TypeScript ensures only valid actions are dispatched
  // dispatch({ type: 'invalid' }); // ERROR!
  // dispatch({ type: 'add_todo', payload: 123 }); // ERROR!

  return (
    // JSX...
  );
}
```

---

## 3. Advanced Action Type Organization

### Approach 1: Named Union Types for Actions

```typescript
// Define action types separately for clarity
type AddTodoAction = {
  type: 'add_todo';
  payload: { id: string; text: string };
};

type ToggleTodoAction = {
  type: 'toggle_todo';
  payload: string;
};

type DeleteTodoAction = {
  type: 'delete_todo';
  payload: string;
};

type SetFilterAction = {
  type: 'set_filter';
  payload: 'all' | 'active' | 'completed';
};

type ResetAction = {
  type: 'reset';
};

// Union at the end
type TodoAction =
  | AddTodoAction
  | ToggleTodoAction
  | DeleteTodoAction
  | SetFilterAction
  | ResetAction;
```

**Benefits:**
- Easier to reuse individual action types
- Clearer documentation
- Simpler to extend with new actions

---

### Approach 2: Action Factory Pattern

```typescript
// Create action creators with proper typing
const todoActions = {
  addTodo: (id: string, text: string) => ({
    type: 'add_todo' as const,
    payload: { id, text },
  }),

  toggleTodo: (id: string) => ({
    type: 'toggle_todo' as const,
    payload: id,
  }),

  deleteTodo: (id: string) => ({
    type: 'delete_todo' as const,
    payload: id,
  }),

  setFilter: (filter: 'all' | 'active' | 'completed') => ({
    type: 'set_filter' as const,
    payload: filter,
  }),

  reset: () => ({
    type: 'reset' as const,
  }),
} as const;

// Infer the action type from action creators
type TodoAction = ReturnType<typeof todoActions[keyof typeof todoActions]>;

// Usage
dispatch(todoActions.addTodo('1', 'Buy milk'));
dispatch(todoActions.toggleTodo('1'));
dispatch(todoActions.reset());
```

**Benefits:**
- Single source of truth for actions
- Automatic type inference
- Prevents typos in action types
- Easier to modify action payloads

---

### Approach 3: Const Assertion with Type Extraction

```typescript
// Define actions with const assertion
const TODO_ACTIONS = {
  ADD: 'add_todo',
  TOGGLE: 'toggle_todo',
  DELETE: 'delete_todo',
  RESET: 'reset',
} as const;

type TodoActionType = typeof TODO_ACTIONS[keyof typeof TODO_ACTIONS];

// Use in action types
type TodoAction =
  | { type: typeof TODO_ACTIONS.ADD; payload: { id: string; text: string } }
  | { type: typeof TODO_ACTIONS.TOGGLE; payload: string }
  | { type: typeof TODO_ACTIONS.DELETE; payload: string }
  | { type: typeof TODO_ACTIONS.RESET };

// Usage
dispatch({ type: TODO_ACTIONS.ADD, payload: { id: '1', text: 'Buy milk' } });
```

**Benefits:**
- No magic strings
- Centralized action type definitions
- Type-safe action dispatching

---

## 4. State Organization with Discriminated Unions

### State as Discriminated Union

```typescript
// Represent different states as discriminated union
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

interface FetchState {
  user: AsyncState<User>;
  todos: AsyncState<Todo[]>;
}

type FetchAction =
  | { type: 'fetch_user_start' }
  | { type: 'fetch_user_success'; payload: User }
  | { type: 'fetch_user_error'; payload: Error }
  | { type: 'fetch_todos_start' }
  | { type: 'fetch_todos_success'; payload: Todo[] }
  | { type: 'fetch_todos_error'; payload: Error };

const initialFetchState: FetchState = {
  user: { status: 'idle' },
  todos: { status: 'idle' },
};

const fetchReducer = (state: FetchState, action: FetchAction): FetchState => {
  switch (action.type) {
    case 'fetch_user_start':
      return {
        ...state,
        user: { status: 'loading' },
      };

    case 'fetch_user_success':
      return {
        ...state,
        user: { status: 'success', data: action.payload },
      };

    case 'fetch_user_error':
      return {
        ...state,
        user: { status: 'error', error: action.payload },
      };

    case 'fetch_todos_start':
      return {
        ...state,
        todos: { status: 'loading' },
      };

    case 'fetch_todos_success':
      return {
        ...state,
        todos: { status: 'success', data: action.payload },
      };

    case 'fetch_todos_error':
      return {
        ...state,
        todos: { status: 'error', error: action.payload },
      };

    default:
      const _exhaustive: never = action;
      return _exhaustive;
  }
};

// Usage with proper type narrowing
function UserComponent() {
  const [state] = useReducer(fetchReducer, initialFetchState);

  if (state.user.status === 'loading') {
    return <div>Loading user...</div>;
  }

  if (state.user.status === 'error') {
    return <div>Error: {state.user.error.message}</div>;
  }

  if (state.user.status === 'success') {
    return <div>User: {state.user.data.name}</div>;
  }

  return <div>No user loaded</div>;
}
```

---

## 5. useReducer Hook Typing

### Basic useReducer Typing

```typescript
// TypeScript infers types from reducer
const [state, dispatch] = useReducer(
  todoReducer, // Function typed as (state: TodoState, action: TodoAction) => TodoState
  initialTodoState // Initial state typed as TodoState
);

// Result:
// state is TodoState
// dispatch is (action: TodoAction) => void
```

### Explicit useReducer Type Annotation

```typescript
// Optional: explicitly specify reducer type
const [state, dispatch] = useReducer<
  Reducer<TodoState, TodoAction>,
  TodoState
>(todoReducer, initialTodoState);

// Alternative with init function
function initTodoState(initial: TodoState): TodoState {
  return {
    ...initial,
    todos: JSON.parse(localStorage.getItem('todos') || '[]'),
  };
}

const [state, dispatch] = useReducer<
  Reducer<TodoState, TodoAction>,
  TodoState,
  typeof initTodoState
>(todoReducer, initialTodoState, initTodoState);
```

### useReducer with Async Actions (Thunk Pattern)

```typescript
// For async operations, use useCallback with dispatch
interface AsyncAction<T> {
  type: 'async_start' | 'async_success' | 'async_error';
  payload?: T;
  error?: Error;
}

type TodoAsyncAction = TodoAction | AsyncAction<Todo[]>;

const todoAsyncReducer = (
  state: TodoState,
  action: TodoAsyncAction
): TodoState => {
  // Handle async and sync actions
  if ('type' in action) {
    // ... handle actions
  }
  return state;
};

function TodoComponent() {
  const [state, dispatch] = useReducer(todoAsyncReducer, initialTodoState);

  const fetchTodos = useCallback(async () => {
    dispatch({ type: 'async_start' });
    try {
      const todos = await fetch('/api/todos').then(r => r.json());
      dispatch({ type: 'async_success', payload: todos });
    } catch (error) {
      dispatch({ type: 'async_error', error: error as Error });
    }
  }, []);

  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

---

## 6. Combining Context and Reducer

### Context + Reducer Pattern

```typescript
// 1. Define state and actions
interface AppState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
}

type AppAction =
  | { type: 'add_todo'; payload: string }
  | { type: 'toggle_todo'; payload: string }
  | { type: 'set_filter'; payload: AppState['filter'] };

// 2. Create contexts
const AppStateContext = createContext<AppState | null>(null);
const AppDispatchContext = createContext<React.Dispatch<AppAction> | null>(null);

// 3. Custom hooks
const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
};

const useAppDispatch = () => {
  const context = useContext(AppDispatchContext);
  if (!context) throw new Error('useAppDispatch must be used within AppProvider');
  return context;
};

// 4. Provider component
function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

// 5. Usage
function TodoList() {
  const { todos, filter } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <ul>
      {todos
        .filter(t => filter === 'all' || (filter === 'completed') === t.completed)
        .map(todo => (
          <li key={todo.id} onClick={() => dispatch({ type: 'toggle_todo', payload: todo.id })}>
            {todo.text}
          </li>
        ))
      }
    </ul>
  );
}
```

---

## 7. Advanced Patterns

### Immer Integration for Immutable Updates

```typescript
import { useReducer } from 'react';
import produce from 'immer';

type TodoAction =
  | { type: 'add_todo'; payload: string }
  | { type: 'toggle_todo'; payload: string }
  | { type: 'delete_todo'; payload: string };

// Immer allows mutable-style updates that are immutable
const todoReducer = produce(
  (draft: TodoState, action: TodoAction) => {
    switch (action.type) {
      case 'add_todo':
        draft.todos.push({
          id: Date.now().toString(),
          text: action.payload,
          completed: false,
        });
        break;

      case 'toggle_todo':
        const todo = draft.todos.find(t => t.id === action.payload);
        if (todo) todo.completed = !todo.completed;
        break;

      case 'delete_todo':
        draft.todos = draft.todos.filter(t => t.id !== action.payload);
        break;
    }
  },
  initialTodoState
);

// Usage is the same
const [state, dispatch] = useReducer(todoReducer, initialTodoState);
```

---

### Reducer with Middleware

```typescript
// Type-safe middleware for reducers
type ReducerMiddleware<S, A> = (
  next: (action: A) => void,
  action: A,
  state: S
) => void;

function withMiddleware<S, A>(
  reducer: (state: S, action: A) => S,
  middlewares: ReducerMiddleware<S, A>[]
): (state: S, action: A) => S {
  return (state: S, action: A) => {
    let nextAction: A | null = action;

    middlewares.forEach(middleware => {
      middleware(
        (a: A) => {
          nextAction = a;
        },
        action,
        state
      );
    });

    if (nextAction === null) return state;
    return reducer(state, nextAction);
  };
}

// Example middleware
const loggingMiddleware: ReducerMiddleware<TodoState, TodoAction> = (
  next,
  action,
  state
) => {
  console.log('Before:', state);
  console.log('Action:', action);
  next(action);
};
```

---

## 8. Best Practices Checklist

- [ ] Use discriminated unions for actions
- [ ] Define action types as a union of named types
- [ ] Use `as const` for action type constants
- [ ] Implement exhaustive checking with `never` type
- [ ] Organize state as interfaces (or discriminated unions)
- [ ] Create action creator functions
- [ ] Type reducer as `(state: State, action: Action) => State`
- [ ] Use custom hooks to wrap useReducer
- [ ] Combine with Context for global state
- [ ] Consider Immer for complex state updates
- [ ] Test action creators and reducer logic
- [ ] Document action payload shapes

---

## Key Takeaways

1. **Discriminated unions** are the foundation of type-safe reducers
2. **Action factories** prevent typos and centralize action creation
3. **State as discriminated union** makes impossible states unrepresentable
4. **Custom hooks** simplify context + reducer combination
5. **Exhaustive checking** with `never` catches missing cases
6. **Immer** simplifies immutable updates
7. **Middleware pattern** enables cross-cutting concerns

---

## References

- [React - useReducer Documentation](https://react.dev/reference/react/useReducer)
- [Total TypeScript - Typing useReducer](https://www.totaltypescript.com/tutorials/react-with-typescript/hooks/typing-state-and-actions-for-usereducer/solution)
- [Ben Ilegbodu - Type-checking React's useReducer](https://www.benmvp.com/blog/type-checking-react-usereducer-typescript/)
- [TypeScript Handbook - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html)
- [DeveloperWay - Discriminated Unions for React](https://www.developerway.com/posts/advanced-typescript-for-react-developers-discriminated-unions)
- [React - Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
