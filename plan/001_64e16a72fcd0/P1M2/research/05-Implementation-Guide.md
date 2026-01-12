# React TypeScript Patterns - Implementation Guide

## Quick Start Examples

This document provides copy-paste ready implementations for the most common patterns in your React TypeScript projects.

---

## 1. Type-Safe Context Setup

### Complete Context Setup (Copy-Paste Ready)

```typescript
// types/AppContext.ts
import React, { createContext, useContext, ReactNode, useState } from 'react';

// 1. Define your types
interface User {
  id: string;
  name: string;
  email: string;
}

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
}

// 2. Create context
const AppContext = createContext<AppContextType | null>(null);

// 3. Custom hook (with validation)
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return context;
};

// 4. Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const value: AppContextType = {
    user,
    isLoading,
    error,
    setUser,
    setLoading,
    setError,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
```

### Usage in Components

```typescript
// components/UserProfile.tsx
import React from 'react';
import { useAppContext } from '../types/AppContext';

export const UserProfile: React.FC = () => {
  const { user, isLoading, error } = useAppContext();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>No user logged in</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};
```

---

## 2. Context with useReducer (State + Actions)

### Complete Setup

```typescript
// types/TodoContext.ts
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// 1. Define types
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

// 2. Define actions with discriminated union
type TodoAction =
  | { type: 'add_todo'; payload: { text: string } }
  | { type: 'toggle_todo'; payload: string }
  | { type: 'delete_todo'; payload: string }
  | { type: 'set_filter'; payload: TodoState['filter'] }
  | { type: 'set_loading'; payload: boolean }
  | { type: 'reset' };

// 3. Initial state
const initialTodoState: TodoState = {
  todos: [],
  filter: 'all',
  isLoading: false,
};

// 4. Reducer function
const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  switch (action.type) {
    case 'add_todo':
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: Date.now().toString(),
            text: action.payload.text,
            completed: false,
          },
        ],
      };

    case 'toggle_todo':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      };

    case 'delete_todo':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
      };

    case 'set_filter':
      return { ...state, filter: action.payload };

    case 'set_loading':
      return { ...state, isLoading: action.payload };

    case 'reset':
      return initialTodoState;

    default:
      const _exhaustive: never = action;
      return _exhaustive;
  }
};

// 5. Context types
interface TodoContextValue {
  state: TodoState;
  dispatch: React.Dispatch<TodoAction>;
}

// 6. Create contexts
const TodoStateContext = createContext<TodoState | null>(null);
const TodoDispatchContext = createContext<React.Dispatch<TodoAction> | null>(null);

// 7. Custom hooks
export const useTodoState = (): TodoState => {
  const context = useContext(TodoStateContext);
  if (!context) {
    throw new Error('useTodoState must be used within TodoProvider');
  }
  return context;
};

export const useTodoDispatch = (): React.Dispatch<TodoAction> => {
  const context = useContext(TodoDispatchContext);
  if (!context) {
    throw new Error('useTodoDispatch must be used within TodoProvider');
  }
  return context;
};

// 8. Provider
interface TodoProviderProps {
  children: ReactNode;
}

export const TodoProvider: React.FC<TodoProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(todoReducer, initialTodoState);

  return (
    <TodoStateContext.Provider value={state}>
      <TodoDispatchContext.Provider value={dispatch}>
        {children}
      </TodoDispatchContext.Provider>
    </TodoStateContext.Provider>
  );
};
```

### Usage

```typescript
// components/TodoApp.tsx
import React from 'react';
import { useTodoState, useTodoDispatch } from '../types/TodoContext';

export const TodoApp: React.FC = () => {
  const { todos, filter } = useTodoState();
  const dispatch = useTodoDispatch();

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const handleAddTodo = (text: string) => {
    dispatch({ type: 'add_todo', payload: { text } });
  };

  const handleToggleTodo = (id: string) => {
    dispatch({ type: 'toggle_todo', payload: id });
  };

  return (
    <div>
      <TodoForm onAdd={handleAddTodo} />
      <TodoList
        todos={filteredTodos}
        onToggle={handleToggleTodo}
      />
    </div>
  );
};
```

---

## 3. Generic List Component

### Complete Implementation

```typescript
// components/List.tsx
import React from 'react';

interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  renderEmpty?: () => React.ReactNode;
  className?: string;
}

export const List = React.forwardRef<
  HTMLUListElement,
  ListProps<any>
>(({ items, renderItem, keyExtractor, renderEmpty, className }, ref) => {
  if (items.length === 0 && renderEmpty) {
    return <>{renderEmpty()}</>;
  }

  return (
    <ul ref={ref} className={className}>
      {items.map((item, index) => (
        <li key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
});

List.displayName = 'List';
```

### Usage

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const users: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
];

<List<User>
  items={users}
  renderItem={(user) => (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  )}
  keyExtractor={(user) => user.id}
  renderEmpty={() => <p>No users found</p>}
/>
```

---

## 4. Deferred Promise Hook

### Complete Implementation

```typescript
// hooks/useDeferred.ts
import { useRef, useCallback } from 'react';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

interface UseDeferredReturn<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  reset: () => void;
}

export const useDeferred = <T,>(): UseDeferredReturn<T> => {
  const deferredRef = useRef<Deferred<T>>(createDeferred<T>());

  const reset = useCallback(() => {
    deferredRef.current = createDeferred<T>();
  }, []);

  return {
    promise: deferredRef.current.promise,
    resolve: deferredRef.current.resolve,
    reject: deferredRef.current.reject,
    reset,
  };
};
```

### Usage

```typescript
// components/DataFetcher.tsx
import React, { useEffect } from 'react';
import { useDeferred } from '../hooks/useDeferred';

interface User {
  id: string;
  name: string;
}

export const DataFetcher: React.FC = () => {
  const { promise, resolve, reject } = useDeferred<User>();
  const [user, setUser] = React.useState<User | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  useEffect(() => {
    promise
      .then(setUser)
      .catch(setError);

    // Simulate API call
    const timer = setTimeout(() => {
      resolve({ id: '1', name: 'Alice' });
    }, 1000);

    return () => clearTimeout(timer);
  }, [promise, resolve]);

  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Loading...</div>;

  return <div>{user.name}</div>;
};
```

---

## 5. Async State Management Hook

### Complete Implementation

```typescript
// hooks/useAsyncState.ts
import { useReducer, useCallback } from 'react';

interface AsyncState<T, E = Error> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T | null;
  error: E | null;
}

type AsyncAction<T, E = Error> =
  | { type: 'start' }
  | { type: 'success'; payload: T }
  | { type: 'error'; payload: E };

export const useAsyncState = <T, E = Error>(
  initialData: T | null = null
) => {
  const [state, dispatch] = useReducer(
    (state: AsyncState<T, E>, action: AsyncAction<T, E>): AsyncState<T, E> => {
      switch (action.type) {
        case 'start':
          return { status: 'loading', data: null, error: null };
        case 'success':
          return { status: 'success', data: action.payload, error: null };
        case 'error':
          return { status: 'error', data: null, error: action.payload };
        default:
          return state;
      }
    },
    {
      status: 'idle' as const,
      data: initialData,
      error: null,
    }
  );

  const execute = useCallback(
    async <R,>(fn: () => Promise<R>) => {
      dispatch({ type: 'start' });
      try {
        const result = await fn();
        dispatch({ type: 'success', payload: result as T });
        return result;
      } catch (error) {
        dispatch({ type: 'error', payload: error as E });
        throw error;
      }
    },
    []
  );

  return { ...state, execute };
};
```

### Usage

```typescript
// components/UserLoader.tsx
import React from 'react';
import { useAsyncState } from '../hooks/useAsyncState';

interface User {
  id: string;
  name: string;
}

export const UserLoader: React.FC<{ userId: string }> = ({ userId }) => {
  const { status, data: user, error, execute } = useAsyncState<User>();

  const loadUser = async () => {
    await execute(() =>
      fetch(`/api/users/${userId}`).then(r => r.json())
    );
  };

  return (
    <div>
      <button onClick={loadUser} disabled={status === 'loading'}>
        Load User
      </button>

      {status === 'loading' && <p>Loading...</p>}
      {status === 'error' && <p>Error: {error?.message}</p>}
      {status === 'success' && user && (
        <div>
          <h2>{user.name}</h2>
        </div>
      )}
    </div>
  );
};
```

---

## 6. Form Hook with Type Safety

### Complete Implementation

```typescript
// hooks/useForm.ts
import { useState, useCallback } from 'react';

interface UseFormProps<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormProps<T>): UseFormReturn<T> => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    if (validate) {
      const newErrors = validate(values);
      setErrors(newErrors);
    }
  }, [values, validate]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (validate) {
        const newErrors = validate(values);
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit, validate]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
};
```

### Usage

```typescript
interface LoginFormValues {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const { values, errors, handleChange, handleSubmit } =
    useForm<LoginFormValues>({
      initialValues: { email: '', password: '' },
      validate: (values) => {
        const errors: Partial<Record<keyof LoginFormValues, string>> = {};
        if (!values.email) errors.email = 'Email is required';
        if (!values.password) errors.password = 'Password is required';
        return errors;
      },
      onSubmit: async (values) => {
        await fetch('/api/login', {
          method: 'POST',
          body: JSON.stringify(values),
        });
      },
    });

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
      />
      {errors.email && <p>{errors.email}</p>}

      <input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
      />
      {errors.password && <p>{errors.password}</p>}

      <button type="submit">Login</button>
    </form>
  );
};
```

---

## 7. Data Table Component

### Complete Implementation

```typescript
// components/DataTable.tsx
import React from 'react';

interface Column<T> {
  key: keyof T;
  label: string;
  width?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T extends { id: string | number }> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export const DataTable = React.forwardRef<
  HTMLTableElement,
  DataTableProps<any>
>(({
  data,
  columns,
  onRowClick,
  loading,
  emptyMessage = 'No data available',
}, ref) => {
  if (loading) {
    return <div>Loading...</div>;
  }

  if (data.length === 0) {
    return <div>{emptyMessage}</div>;
  }

  return (
    <table ref={ref}>
      <thead>
        <tr>
          {columns.map(column => (
            <th
              key={String(column.key)}
              style={{ width: column.width }}
            >
              {column.label}
              {column.sortable && <span> ⬍</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr
            key={row.id}
            onClick={() => onRowClick?.(row)}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {columns.map(column => (
              <td key={String(column.key)}>
                {column.render
                  ? column.render(row[column.key], row)
                  : String(row[column.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
});

DataTable.displayName = 'DataTable';
```

### Usage

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

const products: Product[] = [
  { id: '1', name: 'Product 1', price: 29.99, stock: 10 },
  { id: '2', name: 'Product 2', price: 39.99, stock: 5 },
];

<DataTable<Product>
  data={products}
  columns={[
    { key: 'name', label: 'Product Name', sortable: true },
    {
      key: 'price',
      label: 'Price',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      key: 'stock',
      label: 'In Stock',
      render: (stock) => (stock > 0 ? 'Yes' : 'No'),
    },
  ]}
  onRowClick={(product) => console.log('Selected:', product)}
/>
```

---

## Integration Checklist

- [ ] Create type definitions file for your context
- [ ] Implement custom hooks for context access
- [ ] Add runtime validation with meaningful error messages
- [ ] Define discriminated union action types
- [ ] Implement exhaustive checking with `never` type
- [ ] Create reusable generic components
- [ ] Add proper typing to async operations
- [ ] Document prop requirements with JSDoc
- [ ] Add unit tests for reducers
- [ ] Set up TypeScript strict mode

---

## Testing Patterns

### Testing Reducers

```typescript
// __tests__/todoReducer.test.ts
import { todoReducer, initialTodoState, TodoAction } from '../types/TodoContext';

describe('todoReducer', () => {
  it('should add a todo', () => {
    const action: TodoAction = {
      type: 'add_todo',
      payload: { text: 'Buy milk' },
    };

    const result = todoReducer(initialTodoState, action);

    expect(result.todos).toHaveLength(1);
    expect(result.todos[0].text).toBe('Buy milk');
    expect(result.todos[0].completed).toBe(false);
  });

  it('should toggle a todo', () => {
    const stateWithTodo = {
      ...initialTodoState,
      todos: [
        { id: '1', text: 'Buy milk', completed: false },
      ],
    };

    const action: TodoAction = {
      type: 'toggle_todo',
      payload: '1',
    };

    const result = todoReducer(stateWithTodo, action);

    expect(result.todos[0].completed).toBe(true);
  });
});
```

### Testing Custom Hooks

```typescript
// __tests__/useForm.test.ts
import { renderHook, act } from '@testing-library/react';
import { useForm } from '../hooks/useForm';

describe('useForm', () => {
  it('should update form values', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '', password: '' },
        onSubmit: jest.fn(),
      })
    );

    act(() => {
      const event = {
        target: { name: 'email', value: 'test@example.com' },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(event);
    });

    expect(result.current.values.email).toBe('test@example.com');
  });
});
```

---

## Common Pitfalls to Avoid

1. **Missing runtime validation** - Always check context before returning
2. **Incomplete discriminated unions** - Use `never` to ensure exhaustive checking
3. **Type assertions instead of guards** - Prefer runtime checks
4. **Unconstrained generics** - Use `extends unknown` to avoid confusion
5. **Missing error boundaries** - Wrap providers with error handling
6. **Mutable state updates** - Always spread and create new objects
7. **Forgot onSubmit in forms** - Always prevent default and handle async
8. **Memory leaks in hooks** - Clean up timers, subscriptions in useEffect return

---

## Performance Optimization

### Memoization Example

```typescript
import { useMemo, useCallback } from 'react';

const TodoApp = () => {
  const { todos, filter } = useTodoState();
  const dispatch = useTodoDispatch();

  // Memoize filtered todos
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    });
  }, [todos, filter]);

  // Memoize callbacks
  const handleToggle = useCallback(
    (id: string) => {
      dispatch({ type: 'toggle_todo', payload: id });
    },
    [dispatch]
  );

  return (
    <TodoList
      todos={filteredTodos}
      onToggle={handleToggle}
    />
  );
};
```

---

End of Implementation Guide
