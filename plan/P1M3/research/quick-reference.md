# Context Provider Patterns - Quick Reference

## Template: Library-Quality Provider

```typescript
// my-context.ts
import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';

// 1. Define your context type
interface MyContextType {
  // State
  value: string;
  isLoading: boolean;
  // Actions
  setValue: (value: string) => void;
  reset: () => void;
}

// 2. Create context (null default if no sensible default exists)
const MyContext = createContext<MyContextType | null>(null);
MyContext.displayName = 'MyContext';

// 3. Create Provider component
interface MyProviderProps {
  children: ReactNode;
  initialValue?: string;
}

export function MyProvider({ children, initialValue = '' }: MyProviderProps) {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  // 4. Wrap action handlers with useCallback
  const reset = useCallback(() => {
    setValue(initialValue);
    setIsLoading(false);
  }, [initialValue]);

  // 5. Memoize context value
  const contextValue = useMemo<MyContextType>(() => ({
    value,
    isLoading,
    setValue,
    reset
  }), [value, isLoading, reset]);

  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  );
}

// 6. Export custom hook for consuming context
export function useMyContext(): MyContextType {
  const context = useContext(MyContext);

  if (!context) {
    throw new Error(
      'useMyContext must be used within <MyProvider>. ' +
      'Make sure your component is wrapped with MyProvider at a higher level.'
    );
  }

  return context;
}

export { MyContext };
```

## Pattern: State + Dispatch Separation (Performance)

```typescript
// Split contexts for better performance
const StateContext = createContext<State | null>(null);
const DispatchContext = createContext<(action: Action) => void | null>(null);

export function MyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const stateValue = useMemo(() => state, [state]);
  const dispatchValue = useCallback((action: Action) => dispatch(action), []);

  return (
    <StateContext.Provider value={stateValue}>
      <DispatchContext.Provider value={dispatchValue}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useMyState(): State {
  const context = useContext(StateContext);
  if (!context) throw new Error('useMyState must be used within <MyProvider>');
  return context;
}

export function useMyDispatch(): (action: Action) => void {
  const context = useContext(DispatchContext);
  if (!context) throw new Error('useMyDispatch must be used within <MyProvider>');
  return context;
}
```

## Pattern: useFormStack

```typescript
// form-stack-context.ts
interface FormStackContextType {
  currentStep: FormStep | null;
  steps: FormStep[];
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepId: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

const FormStackContext = createContext<FormStackContextType | null>(null);

export function FormStackProvider({
  children,
  steps
}: {
  children: ReactNode;
  steps: FormStep[];
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = steps[currentStepIndex] || null;
  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < steps.length - 1;

  const nextStep = useCallback(() => {
    if (canGoForward) setCurrentStepIndex(prev => prev + 1);
  }, [canGoForward]);

  const prevStep = useCallback(() => {
    if (canGoBack) setCurrentStepIndex(prev => prev - 1);
  }, [canGoBack]);

  const goToStep = useCallback((stepId: string) => {
    const index = steps.findIndex(s => s.id === stepId);
    if (index !== -1) setCurrentStepIndex(index);
  }, [steps]);

  const value = useMemo(() => ({
    currentStep,
    steps,
    nextStep,
    prevStep,
    goToStep,
    canGoBack,
    canGoForward
  }), [currentStep, steps, nextStep, prevStep, goToStep, canGoBack, canGoForward]);

  return (
    <FormStackContext.Provider value={value}>
      {children}
    </FormStackContext.Provider>
  );
}

export function useFormStack(): FormStackContextType {
  const context = useContext(FormStackContext);
  if (!context) {
    throw new Error('useFormStack must be used within <FormStackProvider>');
  }
  return context;
}
```

## Pattern: Composing Multiple Providers

```typescript
// providers.tsx
import { ReactElement, ReactNode } from 'react';

type ProviderComponent = React.ComponentType<{ children: ReactNode }>;

function composeProviders(...providers: ProviderComponent[]): ProviderComponent {
  return function ComposedProviders({ children }: { children: ReactNode }): ReactElement {
    let element: ReactElement = <>{children}</>;

    for (const Provider of [...providers].reverse()) {
      element = <Provider>{element}</Provider>;
    }

    return element;
  };
}

// Usage
const RootProvider = composeProviders(
  AuthProvider,
  ThemeProvider,
  FormStackProvider,
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

## Key Performance Rules

1. **Memoize context values with useMemo**
   ```typescript
   const value = useMemo(() => ({ ...state, ...actions }), [state, action1, action2]);
   ```

2. **Wrap handlers with useCallback**
   ```typescript
   const handleClick = useCallback(() => { /* ... */ }, [dependencies]);
   ```

3. **Split state and dispatch contexts if needed**
   ```typescript
   // Components using only dispatch won't re-render on state changes
   <StateContext.Provider value={state}>
     <DispatchContext.Provider value={dispatch}>
       {children}
     </DispatchContext.Provider>
   </StateContext.Provider>
   ```

4. **Check with React DevTools**
   - Use Profiler tab to identify unnecessary re-renders
   - Highlight updates to see which components re-render

## Error Handling Pattern

```typescript
export function useMyContext(): MyContextType {
  const context = useContext(MyContext);

  if (!context) {
    throw new Error(
      'useMyContext must be used within a <MyProvider>. ' +
      'This error usually means:\n' +
      '1. Your component is not wrapped with MyProvider\n' +
      '2. MyProvider is placed too low in your component tree\n' +
      '3. You may have multiple contexts with the same name (check imports)'
    );
  }

  return context;
}
```

## TypeScript Best Practices

```typescript
// 1. Define types explicitly
interface ContextType {
  value: string;
  onChange: (value: string) => void;
}

// 2. Use const assertion for context creation
const MyContext = createContext<ContextType | null>(null) as const;

// 3. Display name for debugging
MyContext.displayName = 'MyContext';

// 4. Type-safe custom hooks
export function useMyContext(): ContextType {
  // Error throwing ensures type safety at runtime
  const context = useContext(MyContext);
  if (!context) throw new Error('...');
  return context;
}

// 5. Export types for library users
export type { ContextType };
```

## Testing Pattern

```typescript
// test-utils.tsx
import { render, ReactElement } from '@testing-library/react';

function renderWithProvider(element: ReactElement) {
  return render(
    <MyProvider initialValue="test">
      {element}
    </MyProvider>
  );
}

// test.tsx
import { renderWithProvider } from './test-utils';

test('uses context value', () => {
  const { getByText } = renderWithProvider(<MyComponent />);
  expect(getByText('test')).toBeInTheDocument();
});

// Test error handling
test('throws error when used outside provider', () => {
  const { getByText } = render(<MyComponent />);
  expect(() => getByText('test')).toThrow();
});
```

## Library Comparison

| Feature | React Context | Zustand | Jotai | React Query |
|---------|---|---|---|---|
| Provider Required | Yes | No | Optional | Yes |
| Performance | Needs optimization | Auto | Auto | Auto |
| TypeScript | Great | Great | Great | Great |
| Bundle Size | ~1KB | ~2KB | ~3KB | ~40KB |
| Learning Curve | Easy | Easy | Medium | Medium |
| Use Case | Simple state | Global state | Atomic state | Server state |

Choose Context when:
- Building a library component
- Simple prop-like state
- No performance critical updates

Choose Zustand/Jotai when:
- Complex global state
- Frequent updates
- Need automatic optimization

Choose React Query when:
- Managing server/remote data
- Caching and synchronization
- Data fetching focus

---

**Related Documentation:**
- Full research: `/plan/P1M3/research/context-provider-patterns.md`
- Official React Context docs: https://react.dev/reference/react/useContext
- Kent C. Dodds guide: https://kentcdodds.com/blog/how-to-optimize-your-context-value
