# React Dual-Context Pattern Research

## Overview

The dual-context pattern (also known as context splitting or state/dispatch separation pattern) is a technique for optimizing React's Context API by splitting state and dispatch into two separate contexts. This pattern is recommended by the official React documentation and widely used in production applications to prevent unnecessary re-renders and improve performance.

## Table of Contents

1. [Why Split State and Dispatch](#why-split-state-and-dispatch)
2. [How It Prevents Unnecessary Re-renders](#how-it-prevents-unnecessary-re-renders)
3. [Best Practices with useReducer](#best-practices-with-usereducer)
4. [TypeScript Implementation Patterns](#typescript-implementation-patterns)
5. [Common Pitfalls and Gotchas](#common-pitfalls-and-gotchas)
6. [Code Examples](#code-examples)
7. [Performance Optimization Techniques](#performance-optimization-techniques)
8. [References](#references)

## Why Split State and Dispatch

### The Problem with Single Context

When combining state and dispatch in a single context, every component consuming that context will re-render whenever ANY part of the context value changes, regardless of whether they use that specific part.

```typescript
// ❌ NOT RECOMMENDED: Single context combining state and dispatch
const StateContext = createContext<{
  state: TaskState;
  dispatch: Dispatch<TaskAction>;
} | null>(null);
```

The issues with this approach:

1. **Unnecessary Re-renders**: Components that only need `dispatch` will re-render when `state` changes
2. **Performance Degradation**: In large applications with frequent state updates, this cascades to hundreds of re-renders
3. **Memory Overhead**: Every child component maintains watchers on the entire context value

### The Solution: Dual Contexts

By splitting into two contexts, components can subscribe only to what they need:

```typescript
// ✅ RECOMMENDED: Separate contexts for state and dispatch
const StateContext = createContext<TaskState | null>(null);
const DispatchContext = createContext<Dispatch<TaskAction> | null>(null);
```

**Benefits**:

- **Targeted Updates**: Only components using state re-render when state changes
- **Stable Dispatch Reference**: The dispatch function rarely changes, so dispatch-only consumers don't re-render on state updates
- **Performance**: Reduces re-render cascades significantly
- **Cleaner Separation of Concerns**: State readers and state writers are logically separated

### Official React Recommendation

The official React documentation explicitly teaches this pattern:

> "To pass them down the tree, you will create two separate contexts: `TasksContext` provides the current list of tasks. `TasksDispatchContext` provides the function that lets components dispatch actions."

Source: [React.dev - Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)

## How It Prevents Unnecessary Re-renders

### React's Re-render Mechanism

React re-renders a component when:
1. Its own state changes
2. Its props change
3. Its context value changes

**Critical Understanding**: When a context value changes, React re-renders ALL components that consume that context, even if they don't use the changed property.

### The Dual-Context Solution

By separating contexts:

```
State Context Changes
    ↓
    ├─ StateContext Consumers: Re-render ✓
    └─ DispatchContext Consumers: No re-render ✓

Dispatch Reference Stays Stable
    ↓
    ├─ StateContext Consumers: No re-render ✓
    └─ DispatchContext Consumers: No re-render ✓
```

### Concrete Example

```typescript
// Components that only dispatch actions
function TaskForm() {
  const dispatch = useContext(DispatchContext);

  // Component only depends on dispatch
  // Won't re-render when tasks list changes
  return (
    <form onSubmit={(e) => {
      dispatch({ type: 'ADD_TASK', payload: inputValue });
    }}>
      <input />
    </form>
  );
}

// Components that read state
function TaskList() {
  const tasks = useContext(StateContext);

  // Component only depends on state
  // Will re-render when tasks change
  return (
    <ul>
      {tasks.map(task => <li key={task.id}>{task.text}</li>)}
    </ul>
  );
}

// Mixed components
function TaskCounter() {
  const tasks = useContext(StateContext);
  const dispatch = useContext(DispatchContext);

  // Will re-render when tasks change (because it reads state)
  return (
    <div>
      Count: {tasks.length}
      <button onClick={() => dispatch({ type: 'CLEAR_TASKS' })}>Clear</button>
    </div>
  );
}
```

## Best Practices with useReducer

### When to Use useReducer

According to Kent C. Dodds:

- **Use `useState`** when managing independent pieces of state
- **Use `useReducer`** when multiple state pieces depend on each other or require complex update logic

```typescript
// ✓ Good: Simple independent state
const [name, setName] = useState('');

// ✓ Good: Complex interdependent state
const [state, dispatch] = useReducer(todoReducer, initialState);
```

### Recommended Pattern Structure

```typescript
// 1. Define types
interface Task {
  id: number;
  text: string;
  completed: boolean;
}

interface TasksState {
  tasks: Task[];
  filter: 'all' | 'completed' | 'pending';
}

type TaskAction =
  | { type: 'ADD_TASK'; payload: string }
  | { type: 'COMPLETE_TASK'; payload: number }
  | { type: 'DELETE_TASK'; payload: number }
  | { type: 'SET_FILTER'; payload: 'all' | 'completed' | 'pending' };

// 2. Create contexts
const StateContext = createContext<TasksState | null>(null);
const DispatchContext = createContext<Dispatch<TaskAction> | null>(null);

// 3. Define reducer
function tasksReducer(state: TasksState, action: TaskAction): TasksState {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, { id: Date.now(), text: action.payload, completed: false }],
      };
    case 'COMPLETE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload ? { ...task, completed: true } : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case 'SET_FILTER':
      return {
        ...state,
        filter: action.payload,
      };
    default:
      return state;
  }
}

// 4. Create provider component
const initialState: TasksState = {
  tasks: [],
  filter: 'all',
};

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tasksReducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// 5. Create custom hooks for consumption
export function useTasks() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useTasks must be used within TasksProvider');
  }
  return context;
}

export function useTasksDispatch() {
  const context = useContext(DispatchContext);
  if (!context) {
    throw new Error('useTasksDispatch must be used within TasksProvider');
  }
  return context;
}
```

### Key Best Practices

1. **Always Validate Context**: Use custom hooks that throw errors if context is undefined
2. **Keep State Local When Possible**: Only promote state to context when prop drilling becomes problematic
3. **Group Related State**: Keep state that changes together in the same reducer
4. **Expose Helper Functions**: Consider exposing dispatch wrappers for complex multi-step operations
5. **Separate State by Domain**: If something is independent, consider separate reducers
6. **Distinguish Server Cache from UI State**: These have different update patterns and should be managed separately

## TypeScript Implementation Patterns

### Pattern 1: Basic Dual Context with Strong Typing

```typescript
import { createContext, useContext, useReducer, Dispatch, ReactNode } from 'react';

// Type definitions
interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

// Discriminated union for type-safe actions
type TodoAction =
  | { type: 'ADD_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: string }
  | { type: 'REMOVE_TODO'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Create contexts with explicit types
const TodoStateContext = createContext<TodoState | null>(null);
const TodoDispatchContext = createContext<Dispatch<TodoAction> | null>(null);

// Reducer function
function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, { id: Date.now().toString(), title: action.payload, completed: false }],
      };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload ? { ...todo, completed: !todo.completed } : todo
        ),
      };
    case 'REMOVE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// Provider component
interface TodoProviderProps {
  children: ReactNode;
}

export function TodoProvider({ children }: TodoProviderProps) {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    loading: false,
    error: null,
  });

  return (
    <TodoStateContext.Provider value={state}>
      <TodoDispatchContext.Provider value={dispatch}>
        {children}
      </TodoDispatchContext.Provider>
    </TodoStateContext.Provider>
  );
}

// Custom hooks with validation
export function useTodoState(): TodoState {
  const context = useContext(TodoStateContext);
  if (!context) {
    throw new Error('useTodoState must be used within TodoProvider');
  }
  return context;
}

export function useTodoDispatch(): Dispatch<TodoAction> {
  const context = useContext(TodoDispatchContext);
  if (!context) {
    throw new Error('useTodoDispatch must be used within TodoProvider');
  }
  return context;
}

// Convenience hooks for common operations
export function useTodos() {
  const state = useTodoState();
  return state.todos;
}

export function useTodoActions() {
  const dispatch = useTodoDispatch();
  return {
    addTodo: (title: string) => dispatch({ type: 'ADD_TODO', payload: title }),
    toggleTodo: (id: string) => dispatch({ type: 'TOGGLE_TODO', payload: id }),
    removeTodo: (id: string) => dispatch({ type: 'REMOVE_TODO', payload: id }),
  };
}
```

### Pattern 2: Advanced Typing with ActionMap Generic

This pattern automatically infers payload types from action definitions:

```typescript
// Generic type for mapping action types to payloads
type ActionMap<M extends { [index: string]: any }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: M[Key];
      };
};

// Define payload shapes
interface ProductPayload {
  CREATE_PRODUCT: { name: string; price: number };
  DELETE_PRODUCT: string; // ID
}

interface CartPayload {
  ADD_PRODUCT: string; // Product ID
}

// Derive discriminated union automatically
type ProductAction = ActionMap<ProductPayload>[keyof ActionMap<ProductPayload>];
type CartAction = ActionMap<CartPayload>[keyof ActionMap<CartPayload>];

type CombinedAction = ProductAction | CartAction;

// Now dispatch is fully typed:
// dispatch({ type: 'CREATE_PRODUCT', payload: { name: 'Widget', price: 19.99 } }) ✓
// dispatch({ type: 'CREATE_PRODUCT', payload: { name: 'Widget' } }) ✗ Type error!
// dispatch({ type: 'ADD_PRODUCT', payload: 'product-123' }) ✓
```

### Pattern 3: Custom Hook with Selector (Advanced)

For large state objects, create selector hooks to prevent unnecessary re-renders:

```typescript
// Selector function type
type Selector<T, S> = (state: T) => S;

// Custom hook using useSyncExternalStore (React 18+)
export function useTodoSelector<T>(selector: Selector<TodoState, T>): T {
  const state = useTodoState();
  return selector(state);
}

// Usage - only re-renders when selected slice changes
function CompletedCount() {
  const count = useTodoSelector(state =>
    state.todos.filter(t => t.completed).length
  );
  return <div>Completed: {count}</div>;
}
```

## Common Pitfalls and Gotchas

### Pitfall 1: Creating Contexts in Component Body

```typescript
// ❌ WRONG: Creates new context instances on every render
function App() {
  const MyContext = createContext(null);

  return (
    <MyContext.Provider value={state}>
      <Child />
    </MyContext.Provider>
  );
}

// ✓ CORRECT: Create contexts at module level
const MyContext = createContext(null);

function App() {
  return (
    <MyContext.Provider value={state}>
      <Child />
    </MyContext.Provider>
  );
}
```

### Pitfall 2: Inline Objects in Context Value

```typescript
// ❌ WRONG: New object created on every render
function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// ✓ CORRECT: Contexts already separate, no need for useMemo
// The above is actually fine because state and dispatch are direct values
// but if you were combining them:

// ❌ WRONG
<Context.Provider value={{ state, dispatch }}>

// ✓ CORRECT: Use useMemo if combining is necessary
const contextValue = useMemo(() => ({ state, dispatch }), [state, dispatch]);
<Context.Provider value={contextValue}>
```

### Pitfall 3: Forgetting Null Checks in Custom Hooks

```typescript
// ❌ WRONG: Doesn't validate context exists
export function useTodos() {
  return useContext(TodoContext);
}

// ✓ CORRECT: Always validate and provide helpful error
export function useTodos() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error(
      'useTodos must be used within TodoProvider. ' +
      'Make sure your component is wrapped with <TodoProvider>.'
    );
  }
  return context;
}
```

### Pitfall 4: Overusing Context for Everything

```typescript
// ❌ WRONG: Putting all state in context
const AppContext = createContext({
  user: {},
  todos: [],
  theme: {},
  notifications: [],
  modal: {},
  // ... 50 more things
});

// ✓ CORRECT: Split by domain and update frequency
const AuthContext = createContext(null);      // Changes rarely
const TodoContext = createContext(null);      // Changes frequently
const ThemeContext = createContext(null);     // Changes rarely
const NotificationContext = createContext(null); // Ephemeral
```

### Pitfall 5: Using React.memo Without Proper Dependencies

```typescript
// ❌ WRONG: Memoization won't prevent context re-renders
const MemoizedChild = React.memo(({ children }) => {
  const state = useContext(StateContext); // Still re-renders when state changes
  return <div>{children}</div>;
});

// ✓ CORRECT: React.memo helps with prop changes, not context
// If component must avoid re-rendering on context change, extract to separate component
const MemoizedChild = React.memo(({ children }) => {
  return <div>{children}</div>;
});

function Parent() {
  const state = useContext(StateContext);
  return <MemoizedChild>{state}</MemoizedChild>; // Context consumer extracted
}
```

### Pitfall 6: Accessing Context Without Provider

```typescript
// ❌ WRONG: Using hook outside provider scope
function App() {
  const state = useTodoState(); // Error! No provider
  return <div />;
}

function RootApp() {
  return (
    <TodoProvider>
      <App /> {/* Now useTodoState works */}
    </TodoProvider>
  );
}
```

### Pitfall 7: Missing Memoization with Frequently Changing State

While the dual-context pattern helps, you still need memoization if dispatch changes frequently:

```typescript
// ⚠️ CAUTION: If dispatch function is recreated frequently
const [state, dispatch] = useReducer(reducer, initialState);

// Wrap with useMemo if necessary
const dispatchValue = useMemo(() => dispatch, []); // dispatch never changes, so this isn't needed

// But if you wrap dispatch or create helper functions:
const dispatchValue = useMemo(
  () => ({
    addTodo: (text) => dispatch({ type: 'ADD_TODO', payload: text }),
  }),
  [] // Safe to have empty deps since dispatch is stable
);
```

## Code Examples

### Complete Working Example: Todo App

```typescript
// todoContext.ts
import { createContext, useContext, useReducer, Dispatch, ReactNode } from 'react';

// Types
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  loading: boolean;
}

type TodoAction =
  | { type: 'ADD_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: string }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'SET_FILTER'; payload: TodoState['filter'] }
  | { type: 'SET_LOADING'; payload: boolean };

// Contexts
const TodoStateContext = createContext<TodoState | null>(null);
const TodoDispatchContext = createContext<Dispatch<TodoAction> | null>(null);

// Reducer
function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: Date.now().toString(),
            text: action.payload,
            completed: false,
            createdAt: new Date(),
          },
        ],
      };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      };
    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// Provider
interface TodoProviderProps {
  children: ReactNode;
}

export function TodoProvider({ children }: TodoProviderProps) {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    filter: 'all',
    loading: false,
  });

  return (
    <TodoStateContext.Provider value={state}>
      <TodoDispatchContext.Provider value={dispatch}>
        {children}
      </TodoDispatchContext.Provider>
    </TodoStateContext.Provider>
  );
}

// Custom hooks
export function useTodoState(): TodoState {
  const context = useContext(TodoStateContext);
  if (!context) {
    throw new Error('useTodoState must be used within TodoProvider');
  }
  return context;
}

export function useTodoDispatch(): Dispatch<TodoAction> {
  const context = useContext(TodoDispatchContext);
  if (!context) {
    throw new Error('useTodoDispatch must be used within TodoProvider');
  }
  return context;
}

// Convenience hook for filtered todos
export function useFilteredTodos() {
  const { todos, filter } = useTodoState();

  return todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });
}

// Convenience hook for actions
export function useTodoActions() {
  const dispatch = useTodoDispatch();

  return {
    addTodo: (text: string) => dispatch({ type: 'ADD_TODO', payload: text }),
    toggleTodo: (id: string) => dispatch({ type: 'TOGGLE_TODO', payload: id }),
    deleteTodo: (id: string) => dispatch({ type: 'DELETE_TODO', payload: id }),
    setFilter: (filter: TodoState['filter']) => dispatch({ type: 'SET_FILTER', payload: filter }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
  };
}
```

```typescript
// TodoList.tsx - Component that reads state
import React from 'react';
import { useFilteredTodos, useTodoActions } from './todoContext';

export function TodoList() {
  const todos = useFilteredTodos();
  const { toggleTodo, deleteTodo } = useTodoActions();

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
          <button onClick={() => deleteTodo(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

```typescript
// AddTodo.tsx - Component that only dispatches
import React, { useState } from 'react';
import { useTodoActions } from './todoContext';

export function AddTodo() {
  const [input, setInput] = useState('');
  const { addTodo } = useTodoActions();

  // This component only uses dispatch
  // Won't re-render when todos list changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      addTodo(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Add a todo..."
      />
      <button type="submit">Add</button>
    </form>
  );
}
```

```typescript
// FilterTodos.tsx - Component that reads filter state
import React from 'react';
import { useTodoState, useTodoActions } from './todoContext';

export function FilterTodos() {
  const { filter } = useTodoState();
  const { setFilter } = useTodoActions();

  const filters = ['all', 'active', 'completed'] as const;

  return (
    <div>
      {filters.map(f => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          style={{ fontWeight: filter === f ? 'bold' : 'normal' }}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
    </div>
  );
}
```

## Performance Optimization Techniques

### Technique 1: Stable Dispatch Reference

The dispatch function from useReducer is stable across renders, making it ideal for the dual-context pattern:

```typescript
function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // dispatch is stable - created once and never changes
  // state changes don't affect dispatch reference

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}
```

### Technique 2: useMemo for Complex Selectors

If components need to compute derived state, memoize the computation:

```typescript
export function useCompletedTodos() {
  const { todos } = useTodoState();

  // Memoize the filtered list
  return useMemo(
    () => todos.filter(t => t.completed),
    [todos]
  );
}
```

### Technique 3: React.memo for Display Components

Wrap purely presentational components that don't consume context:

```typescript
interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

// Won't re-render unless props change
export const TodoItem = React.memo(function TodoItem({
  todo,
  onToggle,
  onDelete,
}: TodoItemProps) {
  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span>{todo.text}</span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  );
});
```

### Technique 4: Split Providers by Update Frequency

```typescript
// Fast-changing state
const SearchContext = createContext<string | null>(null);
const SearchDispatchContext = createContext(null);

// Slow-changing state
const SettingsContext = createContext<Settings | null>(null);

function App() {
  return (
    <SearchProvider>
      <SettingsProvider>
        <Main />
      </SettingsProvider>
    </SearchProvider>
  );
}

// Components only subscribe to what they need
function SearchBox() {
  const dispatch = useContext(SearchDispatchContext);
  return <input onChange={e => dispatch({ type: 'SEARCH', payload: e.target.value })} />;
}

function SettingsPanel() {
  const settings = useContext(SettingsContext);
  return <div>{settings.theme}</div>;
}
```

### Technique 5: Custom Hooks with Dependency Arrays

```typescript
// Only re-render when specific todo changes
export function useTodo(todoId: string) {
  const { todos } = useTodoState();

  return useMemo(
    () => todos.find(t => t.id === todoId),
    [todos, todoId]
  );
}
```

## References

### Official React Documentation

- [React.dev - Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [React.dev - useReducer API Reference](https://react.dev/reference/react/useReducer)
- [React.dev - useContext API Reference](https://react.dev/reference/react/useContext)

### Kent C. Dodds - Best Practices and Patterns

- [How to Use React Context Effectively](https://kentcdodds.com/blog/how-to-use-react-context-effectively) - Kent's foundational guide on context patterns with custom hooks
- [How to Optimize Your Context Value](https://kentcdodds.com/blog/how-to-optimize-your-context-value) - When and how to optimize context for performance
- [Should I useState or useReducer?](https://kentcdodds.com/blog/should-i-usestate-or-usereducer) - Guidance on choosing between useState and useReducer
- [The State Reducer Pattern with React Hooks](https://kentcdodds.com/blog/the-state-reducer-pattern-with-react-hooks) - Advanced pattern for customizable reducers
- [Application State Management with React](https://kentcdodds.com/blog/application-state-management-with-react) - Comprehensive state management guide

### Performance Optimization

- [React Re-renders Guide: Preventing Unnecessary Re-renders](https://adevnadia.medium.com/react-re-renders-guide-preventing-unnecessary-re-renders-8a3d2acbdba3) by Nadia Makarevich
- [How to Write Performant React Apps with Context](https://www.developerway.com/posts/how-to-write-performant-react-apps-with-context) - DeveloperWay detailed performance analysis
- [4 Options to Prevent Extra Rerenders with React Context](https://blog.axlight.com/posts/4-options-to-prevent-extra-rerenders-with-react-context/) by Daishi Kato - Comprehensive comparison of optimization techniques
- [Optimizing React Context for Performance: Avoiding Common Re-rendering Pitfalls](https://www.tenxdeveloper.com/blog/optimizing-react-context-performance) - Common pitfalls and solutions
- [React Context and How to Avoid Repetitive Re-rendering](https://patrickdesjardins.com/blog/react-context-how-to-avoid-rendering) by Patrick Desjardins

### TypeScript Implementation

- [How to Use useContext and useReducer with TypeScript in React](https://medium.com/@ctrlaltmonique/how-to-use-usecontext-and-usereducer-with-typescript-in-react-735f6c5f27ba) - Medium guide on TypeScript patterns
- [React Context with useReducer and TypeScript](https://dev.to/elisealcala/react-context-with-usereducer-and-typescript-4obm) - DEV Community guide with ActionMap pattern
- [TypeScript for createContext and useReducer](https://medium.com/@DcKesler/typescript-for-createcontext-and-usereducer-in-react-with-custom-hooks-bc3b19a4b942) - Advanced TypeScript typing strategies

### Community Resources

- [React GitHub Issue #15156 - Preventing rerenders with React.memo and useContext](https://github.com/facebook/react/issues/15156) - Community discussion on context optimization
- [Advanced React Patterns - Kent C. Dodds GitHub](https://github.com/kentcdodds/advanced-react-patterns) - Examples and exercises from Kent's workshop

## Key Takeaways

1. **Always split state and dispatch into separate contexts** - This is the most effective way to prevent unnecessary re-renders
2. **Use custom hooks** - Wrap context access in hooks that validate the provider exists
3. **Type everything** - Use TypeScript to catch errors at compile time with discriminated unions
4. **Don't over-optimize** - Measure performance before adding complexity with useMemo
5. **Keep state local** - Only promote state to context when prop drilling is a problem
6. **Use useReducer for complex state** - When multiple state pieces depend on each other
7. **Validate context access** - Always throw helpful errors when hooks are used outside providers
8. **Split by domain** - Group related state in the same reducer, separate independent concerns

