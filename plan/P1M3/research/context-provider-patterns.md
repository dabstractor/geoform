# React Context Provider Implementation Patterns for Library-Quality Providers

Research compiled December 26, 2025 - Comprehensive guide for building production-grade context providers with React and TypeScript.

## Table of Contents
1. [Core Context Creation](#core-context-creation)
2. [Custom Hooks Pattern](#custom-hooks-pattern)
3. [Error Handling](#error-handling)
4. [Performance Optimization](#performance-optimization)
5. [Composing Multiple Providers](#composing-multiple-providers)
6. [Library Implementations](#library-implementations)
7. [Best Practices Summary](#best-practices-summary)

---

## Core Context Creation

### 1. Creating Contexts with Proper Default Values

#### Option A: With Meaningful Default Value

```typescript
// theme-context.ts
import { createContext, ReactNode, useState, useMemo } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Create context with a meaningful default value
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
}

export function ThemeProvider({ children, initialTheme = 'light' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = useMemo(() => ({
    theme,
    toggleTheme
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeContext };
```

#### Option B: With Null Default (When No Default Makes Sense)

```typescript
// auth-context.ts
import { createContext, ReactNode, useState, useCallback, useMemo } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const userData = await response.json();
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    logout
  }), [user, isLoading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
```

### 2. TypeScript Type Safety Patterns

```typescript
// Exporting types for consumers
export type ThemeContextType = typeof ThemeContext extends
  createContext<infer T> ? T : never;

// Or define separately for reusability
interface ContextValue {
  [key: string]: any;
}

// Generic context factory for type safety
function createContextWithDefault<T extends ContextValue>(
  defaultValue: T,
  displayName?: string
) {
  const ctx = createContext<T>(defaultValue);
  if (displayName) {
    ctx.displayName = displayName;
  }
  return ctx;
}
```

---

## Custom Hooks Pattern (useFormStack Pattern)

### The Custom Hook Consumer Pattern

This pattern is the recommended approach for library-quality providers. It ensures:
- Type safety at the consumer level
- Clear error messages when used incorrectly
- Centralized context access logic
- Easier testing and refactoring

#### Basic Implementation

```typescript
// form-context.ts
import { createContext, ReactNode, useState, useContext } from 'react';

interface FormContextType {
  values: Record<string, any>;
  errors: Record<string, string>;
  isDirty: boolean;
  setValues: (values: Record<string, any>) => void;
  setFieldError: (field: string, error: string) => void;
  reset: () => void;
}

const FormContext = createContext<FormContextType | null>(null);
FormContext.displayName = 'FormContext';

interface FormProviderProps {
  children: ReactNode;
  initialValues?: Record<string, any>;
}

export function FormProvider({ children, initialValues = {} }: FormProviderProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const setFieldError = (field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setIsDirty(false);
  };

  const value: FormContextType = {
    values,
    errors,
    isDirty,
    setValues,
    setFieldError,
    reset
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
}

// CRITICAL: The custom hook enforces provider usage
export function useFormContext(): FormContextType {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error(
      'useFormContext must be used within a <FormProvider>. ' +
      'Make sure your component is wrapped with FormProvider at a higher level.'
    );
  }

  return context;
}

export { FormContext };
```

#### Advanced Custom Hook with Selector Pattern

For performance optimization and granular access:

```typescript
// form-context.ts (extended)
import { useContext, useMemo } from 'react';

type Selector<T, U> = (state: T) => U;

export function useFormSelector<U>(selector: Selector<FormContextType, U>): U {
  const context = useFormContext();

  // Memoize the selected value to prevent unnecessary re-renders
  return useMemo(() => selector(context), [context, selector]);
}

// Consumer usage:
function MyField() {
  // Only subscribes to field value changes, not entire context
  const fieldValue = useFormSelector(context => context.values.name);

  return <input value={fieldValue} />;
}
```

#### Custom Hook for useFormStack Pattern

```typescript
// form-stack-context.ts
import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';

interface FormStep {
  id: string;
  title: string;
  isComplete: boolean;
}

interface FormStackContextType {
  currentStep: FormStep | null;
  steps: FormStep[];
  goToStep: (stepId: string) => void;
  completeStep: (stepId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

const FormStackContext = createContext<FormStackContextType | null>(null);
FormStackContext.displayName = 'FormStackContext';

interface FormStackProviderProps {
  children: ReactNode;
  steps: FormStep[];
}

export function FormStackProvider({ children, steps }: FormStackProviderProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = steps[currentStepIndex] || null;
  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < steps.length - 1;

  const goToStep = useCallback((stepId: string) => {
    const index = steps.findIndex(s => s.id === stepId);
    if (index !== -1) {
      setCurrentStepIndex(index);
    }
  }, [steps]);

  const completeStep = useCallback((stepId: string) => {
    // Mark step as complete in state management
    console.log(`Step ${stepId} completed`);
  }, []);

  const nextStep = useCallback(() => {
    if (canGoForward) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [canGoForward]);

  const prevStep = useCallback(() => {
    if (canGoBack) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [canGoBack]);

  const value = useMemo(() => ({
    currentStep,
    steps,
    goToStep,
    completeStep,
    nextStep,
    prevStep,
    canGoBack,
    canGoForward
  }), [currentStep, steps, goToStep, completeStep, nextStep, prevStep, canGoBack, canGoForward]);

  return (
    <FormStackContext.Provider value={value}>
      {children}
    </FormStackContext.Provider>
  );
}

// The key custom hook - this is what consumers use
export function useFormStack(): FormStackContextType {
  const context = useContext(FormStackContext);

  if (!context) {
    throw new Error(
      'useFormStack must be used within a <FormStackProvider>. ' +
      'Ensure your component tree is properly wrapped with FormStackProvider.'
    );
  }

  return context;
}

export { FormStackContext };
```

---

## Error Handling

### 1. Throwing Errors When Context is Undefined

```typescript
// pattern-1: Custom hook with throw
export function useMyContext(): MyContextType {
  const context = useContext(MyContext);

  if (!context) {
    throw new Error(
      'useMyContext must be used within a <MyProvider>. ' +
      'This error usually means:\n' +
      '1. Component is not wrapped by MyProvider\n' +
      '2. Provider is placed too low in the component tree\n' +
      '3. Multiple contexts with same name exist (check imports)'
    );
  }

  return context;
}
```

### 2. Separating State and Dispatch Contexts (Performance Pattern)

This prevents unnecessary re-renders of components that only dispatch actions:

```typescript
// todo-context.ts
import { createContext, useContext, ReactNode, useReducer, useCallback, useMemo } from 'react';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'done';
}

interface TodoAction {
  type: 'ADD_TODO' | 'TOGGLE_TODO' | 'REMOVE_TODO' | 'SET_FILTER';
  payload?: any;
}

// SEPARATE CONTEXTS for state and dispatch
const TodoStateContext = createContext<TodoState | null>(null);
const TodoDispatchContext = createContext<(action: TodoAction) => void | null>(null);

TodoStateContext.displayName = 'TodoStateContext';
TodoDispatchContext.displayName = 'TodoDispatchContext';

const initialState: TodoState = {
  todos: [],
  filter: 'all'
};

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, action.payload]
      };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload ? { ...todo, done: !todo.done } : todo
        )
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    default:
      return state;
  }
}

interface TodoProviderProps {
  children: ReactNode;
}

export function TodoProvider({ children }: TodoProviderProps) {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  const stateValue = useMemo(() => state, [state]);
  const dispatchValue = useCallback(dispatch, []);

  return (
    <TodoStateContext.Provider value={stateValue}>
      <TodoDispatchContext.Provider value={dispatchValue}>
        {children}
      </TodoDispatchContext.Provider>
    </TodoStateContext.Provider>
  );
}

// Separate hooks for state and dispatch
export function useTodoState(): TodoState {
  const context = useContext(TodoStateContext);
  if (!context) {
    throw new Error('useTodoState must be used within <TodoProvider>');
  }
  return context;
}

export function useTodoDispatch(): (action: TodoAction) => void {
  const context = useContext(TodoDispatchContext);
  if (!context) {
    throw new Error('useTodoDispatch must be used within <TodoProvider>');
  }
  return context;
}

// Usage:
function TodoItem({ id }: { id: string }) {
  const dispatch = useTodoDispatch(); // Only re-renders on prop changes

  return (
    <button onClick={() => dispatch({ type: 'TOGGLE_TODO', payload: id })}>
      Toggle
    </button>
  );
}

function TodoList() {
  const { todos } = useTodoState(); // Re-renders when todos change

  return (
    <ul>
      {todos.map(todo => <TodoItem key={todo.id} id={todo.id} />)}
    </ul>
  );
}
```

### 3. Reusable Context Factory with Error Handling

```typescript
// context-factory.ts
import { createContext, useContext, ReactNode, ReactElement } from 'react';

interface CreateContextOptions {
  name?: string;
  onUseOutsideProvider?: (hookName: string) => void;
}

/**
 * Creates a context with an automatic custom hook that validates provider usage
 */
function createContextWithHook<T>(
  defaultValue: T | undefined,
  options: CreateContextOptions = {}
): [React.Context<T>, () => T] {
  const { name = 'Context', onUseOutsideProvider } = options;

  const context = createContext<T | undefined>(defaultValue);
  context.displayName = name;

  function useContextValue(): T {
    const value = useContext(context);

    if (value === undefined) {
      const hookName = `use${name.replace(/Context$/, '')}`;
      const providerName = `${name.replace(/Context$/, '')}Provider`;

      onUseOutsideProvider?.(hookName);

      throw new Error(
        `${hookName} must be used within <${providerName}>. ` +
        `Make sure your component is wrapped with ${providerName}.`
      );
    }

    return value;
  }

  return [context, useContextValue];
}

// Usage:
const [FormContext, useForm] = createContextWithHook<FormContextType | undefined>(
  undefined,
  { name: 'FormContext' }
);
```

---

## Performance Optimization

### 1. Using useMemo for Context Value Stability

The most common performance issue with React Context is that every consumer re-renders whenever the context value changes, even if only one property changed.

```typescript
// Bad: Creates new object reference on every render
export function CounterProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  // Problem: new object every render
  return (
    <CounterContext.Provider value={{ count, setCount }}>
      {children}
    </CounterContext.Provider>
  );
}

// Good: Stable object reference
export function CounterProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  // Only creates new object when count or setCount changes
  const value = useMemo(() => ({ count, setCount }), [count, setCount]);

  return (
    <CounterContext.Provider value={value}>
      {children}
    </CounterContext.Provider>
  );
}
```

### 2. Combining useMemo with useCallback

```typescript
// auth-context.ts (optimized)
import { createContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Stable function reference - only changes if deps change
  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (profile: Partial<User>) => {
    // Implementation
  }, []);

  // Stable context value - only changes when functions or user change
  const value = useMemo(() => ({
    user,
    login,
    logout,
    updateProfile
  }), [user, login, logout, updateProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 3. Splitting State and Dispatch (Recommended Approach)

This is often the BEST solution because dispatch functions are stable by nature:

```typescript
// Split contexts to avoid re-renders of dispatch-only consumers
export function MyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // State context will cause all consumers to re-render
  const stateValue = useMemo(() => state, [state]);

  // Dispatch context is stable and won't cause re-renders
  // (though dispatch itself is always stable anyway)
  const dispatchValue = useCallback((action: Action) => dispatch(action), []);

  return (
    <StateContext.Provider value={stateValue}>
      <DispatchContext.Provider value={dispatchValue}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}
```

### 4. Context Selector Pattern (Advanced)

When you only need part of the context value:

```typescript
// Using a library like use-context-selector
import { createContext, useContextSelector } from 'use-context-selector';

const UserContext = createContext<UserState | null>(null);

function Component() {
  // Only re-renders if selectedValue changes
  const email = useContextSelector(UserContext, state => state?.user?.email);

  return <div>{email}</div>;
}
```

### 5. Performance Checklist

```typescript
// Complete optimized context provider template
interface ContextType {
  // State
  items: Item[];
  isLoading: boolean;
  // Actions
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

const MyContext = createContext<ContextType | null>(null);

export function MyProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Wrap event handlers with useCallback
  const addItem = useCallback((item: Item) => {
    setItems(prev => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const reset = useCallback(() => {
    setItems([]);
  }, []);

  // Memoize the context value
  const value = useMemo<ContextType>(() => ({
    items,
    isLoading,
    addItem,
    removeItem,
    reset
  }), [items, isLoading, addItem, removeItem, reset]);

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}

export function useMyContext(): ContextType {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within <MyProvider>');
  }
  return context;
}
```

---

## Composing Multiple Providers

### 1. The reduce() Composition Pattern

Clean approach for combining multiple providers:

```typescript
// providers-composer.ts
import { ReactNode, ReactElement } from 'react';

type ProviderComponent = React.ComponentType<{ children: ReactNode }>;

/**
 * Composes multiple providers into a single provider
 * @param providers Array of provider components
 * @returns A single provider component
 */
function composeProviders(...providers: ProviderComponent[]): ProviderComponent {
  return function Composed({ children }: { children: ReactNode }): ReactElement {
    let element: ReactElement = <>{children}</>;

    // Reverse to maintain correct order
    for (const Provider of [...providers].reverse()) {
      element = <Provider>{element}</Provider>;
    }

    return element;
  };
}

// Or using reduce for functional style:
function composeProvidersReduce(...providers: ProviderComponent[]): ProviderComponent {
  return providers.reverse().reduce(
    (Accumulated, Provider) => {
      return function Composed({ children }: { children: ReactNode }) {
        return (
          <Provider>
            <Accumulated>{children}</Accumulated>
          </Provider>
        );
      };
    },
    ({ children }: { children: ReactNode }) => <>{children}</>
  ) as ProviderComponent;
}

// Usage in App component:
const RootProvider = composeProviders(
  AuthProvider,
  ThemeProvider,
  FormProvider,
  NotificationProvider
);

export function App() {
  return (
    <RootProvider>
      <MainApp />
    </RootProvider>
  );
}
```

### 2. With Props Support for Individual Providers

```typescript
// providers-composer-with-props.ts
interface ProviderConfig {
  provider: React.ComponentType<any>;
  props?: Record<string, any>;
}

function composeProvidersWithProps(configs: ProviderConfig[]): React.ComponentType<{ children: ReactNode }> {
  return function ComposedProviders({ children }: { children: ReactNode }) {
    let element: ReactElement = <>{children}</>;

    for (const { provider: Provider, props = {} } of [...configs].reverse()) {
      element = <Provider {...props}>{element}</Provider>;
    }

    return element;
  };
}

// Usage:
const RootProvider = composeProvidersWithProps([
  {
    provider: AuthProvider,
    props: { storageKey: 'auth_token' }
  },
  {
    provider: ThemeProvider,
    props: { defaultTheme: 'dark' }
  },
  {
    provider: FormProvider,
    props: { validateOnChange: true }
  }
]);
```

### 3. Handling Provider Interdependencies

```typescript
// When providers depend on each other
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {/* ThemeProvider needs user context */}
      <ThemeProvider>
        <FormProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </FormProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

### 4. Provider Composition with Error Boundaries

```typescript
// error-boundary.tsx
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div>Error: {this.state.error?.message}</div>;
    }

    return this.props.children;
  }
}

// Use in composition:
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

---

## Library Implementations

### 1. React Query (TanStack Query) Pattern

React Query uses a provider pattern for managing server state:

```typescript
// Key patterns from React Query:
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MyApp />
    </QueryClientProvider>
  );
}

// Consumer pattern
function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    }
  });
}
```

**Key takeaways:**
- Separates client instance (module state) from provider
- Consumer uses custom hooks, not Context directly
- Excellent error handling and loading states

### 2. Zustand Pattern

Zustand avoids Context API but shows good state management patterns:

```typescript
// Zustand approach (not Context, but worth noting)
import { create } from 'zustand';

interface UserStore {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const useUserStore = create<UserStore>((set) => ({
  user: null,
  login: async (email, password) => {
    // Implementation
  },
  logout: () => set({ user: null })
}));

// No provider needed! Use directly:
function Component() {
  const { user, logout } = useUserStore();
  return <div>{user?.email}</div>;
}
```

**Key takeaways:**
- Module-first state management
- Automatic performance optimization
- No provider nesting needed

### 3. Jotai Pattern (Atomic State)

Jotai provides Context-like Provider but with atomic granularity:

```typescript
// Jotai approach
import { atom, Provider, useAtom } from 'jotai';

// Atoms (smallest state units)
const userAtom = atom<User | null>(null);
const isLoadingAtom = atom(false);

export function App() {
  return (
    <Provider>
      <MyApp />
    </Provider>
  );
}

// Usage
function Component() {
  const [user, setUser] = useAtom(userAtom);
  const [isLoading] = useAtom(isLoadingAtom);

  return <div>{user?.email}</div>;
}
```

**Key takeaways:**
- Bottom-up approach with atomic units
- Provider optional (uses module-level if not provided)
- Automatic optimization through atom dependency
- Can combine with React Query

### 4. MUI (Material-UI) Provider Pattern

```typescript
// MUI uses a similar provider pattern
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MyApp />
    </ThemeProvider>
  );
}
```

---

## Best Practices Summary

### Do's

✅ **Create custom hooks** for context consumption
```typescript
export function useMyContext(): MyContextType {
  const context = useContext(MyContext);
  if (!context) throw new Error('...');
  return context;
}
```

✅ **Memoize context values** using useMemo
```typescript
const value = useMemo(() => ({ ...state, ...actions }), [state, ...actions]);
```

✅ **Use useCallback** for stable function references
```typescript
const handleSubmit = useCallback(async (data) => { ... }, []);
```

✅ **Split contexts** for state and dispatch when possible
```typescript
<StateContext.Provider value={state}>
  <DispatchContext.Provider value={dispatch}>
    {children}
  </DispatchContext.Provider>
</StateContext.Provider>
```

✅ **Display names** for easier debugging
```typescript
const MyContext = createContext(null);
MyContext.displayName = 'MyContext';
```

✅ **Type-safe null checks** in custom hooks
```typescript
if (!context) {
  throw new Error('useX must be used within <XProvider>');
}
```

✅ **Compose multiple providers** cleanly
```typescript
const RootProvider = composeProviders(AuthProvider, ThemeProvider, FormProvider);
```

### Don'ts

❌ **Don't create new objects inline**
```typescript
// Bad
<MyContext.Provider value={{ count, setCount }}>

// Good
const value = useMemo(() => ({ count, setCount }), [count, setCount]);
<MyContext.Provider value={value}>
```

❌ **Don't use Context for frequently changing values** without optimization
Use Zustand, Jotai, or split contexts instead.

❌ **Don't skip error handling** when context is undefined
Always throw clear errors from custom hooks.

❌ **Don't over-memoize** without measuring
Check performance with React DevTools before optimizing.

❌ **Don't pass entire context values** to memoized components
Use selectors or split contexts instead.

❌ **Don't nest providers excessively** without composition
Use provider composition patterns.

---

## Performance Decision Tree

```
Does your context change frequently?
├─ No → Use Context API with useMemo ✅
└─ Yes
   ├─ Few components consume it → Context with optimization is fine
   └─ Many components consume it
      ├─ Can split state/dispatch? → Use separate contexts
      ├─ Is it mostly server state? → Use React Query/TanStack Query
      └─ Complex atomic state? → Use Zustand or Jotai
```

---

## TypeScript Configuration Best Practices

```typescript
// Complete setup for library-quality providers

// 1. Define clear context types
interface ContextValue {
  [key: string]: any;
}

// 2. Use generic factory
function createContextWithHook<T extends ContextValue>(
  name: string,
  defaultValue?: T
) {
  const context = createContext<T | undefined>(defaultValue);
  context.displayName = name;

  function useContext(): T {
    const value = useContext(context);
    if (!value) throw new Error(`${name} must be used within provider`);
    return value;
  }

  return { Context: context, useContext };
}

// 3. Export for consumers
export type { ContextValue };
export { createContextWithHook };
```

---

## References and Resources

### Official React Documentation
- [useContext Hook Reference](https://react.dev/reference/react/useContext)
- [useMemo Hook Reference](https://react.dev/reference/react/useMemo)
- [createContext Documentation](https://react.dev/reference/react/createContext)

### Best Practices Articles
- [How to Optimize Your Context Value by Kent C. Dodds](https://kentcdodds.com/blog/how-to-optimize-your-context-value)
- [How to Use React Context Effectively by Kent C. Dodds](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
- [React Context - TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/)

### Context Patterns
- [Advanced Patterns with React Context API](https://mernstackdev.com/react-context-api-patterns/)
- [React Context Provider Hook Pattern](https://nimblewebdeveloper.com/blog/react-context-provider-hook-pattern/)
- [Composing Multiple React Providers](https://dev.to/fariasmateuss/compose-multiple-react-providers-4oc4)

### Library Implementations
- [Jotai - Atomic State Management](https://jotai.org/)
- [Zustand - Lightweight State Manager](https://github.com/pmndrs/zustand)
- [React Query / TanStack Query](https://tanstack.com/query/latest)

### Performance Optimization
- [How to Properly Memoize Context Values in React](https://medium.com/@aadil.shaikh04/how-to-properly-memoize-context-values-in-react-and-why-it-matters-8c18518ee1be)
- [useMemo Inside Context API](https://www.agney.dev/blog/useMemo-inside-context)
- [The Problem with React's Context API](https://leewarrick.com/blog/the-problem-with-context/)

### Advanced Topics
- [React Provider Pattern](https://www.patterns.dev/vanilla/provider-pattern/)
- [Unlocking the Full Potential of React Context with Custom Hooks](https://lovetrivedi.medium.com/unlocking-the-full-potential-of-react-context-with-custom-hooks-f3d7e3a3d403)
- [Mastering React Context with TypeScript](https://medium.com/@nitinjha5121/mastering-react-context-with-typescript-a-comprehensive-tutorial-5bab5ef48a3b)

---

## Implementation Checklist for Your useFormStack Pattern

When implementing `useFormStack` for the geoform-opus project:

- [ ] Define FormStackContextType interface with all necessary form operations
- [ ] Create FormStackContext with proper default value or null
- [ ] Implement FormStackProvider with useMemo for value stability
- [ ] Create useFormStack custom hook with error handling
- [ ] Consider separating state and dispatch contexts if needed
- [ ] Add TypeScript types for better IDE support
- [ ] Test context outside provider (should throw error)
- [ ] Verify no unnecessary re-renders with React DevTools
- [ ] Document the context usage in JSDoc comments
- [ ] Export both Provider and custom hook from barrel export
- [ ] Consider composing with other providers (auth, notification, etc.)
- [ ] Add error boundaries around provider tree
- [ ] Profile performance with actual form data
- [ ] Document performance characteristics (when optimization is recommended)

---

Last Updated: December 26, 2025
Research Methodology: Web search combined with direct reference documentation
