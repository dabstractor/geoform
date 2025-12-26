# React Context Provider Patterns - Research Collection

Research compilation for implementing library-quality React Context providers with TypeScript, focused on building the `useFormStack` pattern for geoform-opus.

## Documents in This Collection

### 1. **context-provider-patterns.md** (31 KB)
Comprehensive guide covering all aspects of React Context implementation:
- Core context creation with default values
- Custom hooks pattern (useFormStack pattern)
- Error handling when context is used outside provider
- Performance optimization (useMemo, useCallback)
- Composing multiple providers
- Library implementations (React Query, Zustand, Jotai)
- TypeScript best practices
- Implementation checklist

**Best for:** Deep dive understanding, implementation patterns, library comparisons

### 2. **quick-reference.md** (8.7 KB)
Quick lookup guide with ready-to-use code templates:
- Library-quality provider template
- State + Dispatch separation pattern
- useFormStack pattern example
- Provider composition
- Performance rules
- Error handling pattern
- TypeScript best practices
- Testing patterns
- Library comparison table

**Best for:** Quick code lookup, copy-paste templates, reference during coding

### 3. **dual-context-pattern.md** (29 KB)
Focused guide on separating state and dispatch contexts:
- Problem with monolithic context providers
- Dual context solution explained
- Implementation examples
- Performance benefits
- Refactoring guide
- Testing dual contexts
- Advanced patterns

**Best for:** Understanding performance optimization, when to split contexts

### 4. **useReducer-patterns.md** (25 KB)
Detailed guide on useReducer patterns for complex state:
- useReducer fundamentals
- Reducer patterns and best practices
- TypeScript reducer typing
- Complex state management
- Action creators
- Combining with Context API
- Testing reducers

**Best for:** Complex state management, understanding useReducer

## Key Research Findings

### Performance Optimization

The most important finding for React Context: **Create new object references on every render unless memoized**.

```typescript
// Bad - creates new object every render
<MyContext.Provider value={{ count, setCount }}>

// Good - stable object reference
const value = useMemo(() => ({ count, setCount }), [count, setCount]);
<MyContext.Provider value={value}>
```

### Custom Hook Pattern

Always use custom hooks for context consumption:

```typescript
export function useFormStack(): FormStackContextType {
  const context = useContext(FormStackContext);
  if (!context) {
    throw new Error('useFormStack must be used within <FormStackProvider>');
  }
  return context;
}
```

Benefits:
- Type safety
- Clear error messages when used incorrectly
- Easier to refactor or migrate
- Better IDE support

### State + Dispatch Separation

When performance matters, split contexts:

```typescript
<StateContext.Provider value={state}>
  <DispatchContext.Provider value={dispatch}>
    {children}
  </DispatchContext.Provider>
</StateContext.Provider>
```

Components using only dispatch don't re-render when state changes.

### Provider Composition

Clean multiple providers with a composition function:

```typescript
const RootProvider = composeProviders(
  AuthProvider,
  ThemeProvider,
  FormStackProvider
);
```

## Official Documentation URLs

### React Docs (react.dev)
- [useContext Hook Reference](https://react.dev/reference/react/useContext)
- [useMemo Hook Reference](https://react.dev/reference/react/useMemo)
- [useCallback Hook Reference](https://react.dev/reference/react/useCallback)
- [createContext Documentation](https://react.dev/reference/react/createContext)

### Best Practices
- [Kent C. Dodds - How to Optimize Your Context Value](https://kentcdodds.com/blog/how-to-optimize-your-context-value)
- [Kent C. Dodds - How to Use React Context Effectively](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
- [React TypeScript Cheatsheet - Context](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/)

### Pattern Examples
- [Advanced Patterns with React Context API](https://mernstackdev.com/react-context-api-patterns/)
- [React Provider Pattern](https://www.patterns.dev/vanilla/provider-pattern/)
- [Composing Multiple React Providers](https://dev.to/fariasmateuss/compose-multiple-react-providers-4oc4)

### Library Implementations
- [Jotai - Atomic State Management](https://jotai.org/)
- [Zustand - Global State Manager](https://github.com/pmndrs/zustand)
- [TanStack Query (React Query)](https://tanstack.com/query/latest)
- [MUI Theme Provider](https://mui.com/material-ui/customization/theming/)

## Implementation for geoform-opus

### useFormStack Pattern

Based on this research, the `useFormStack` pattern for geoform-opus should:

1. **Create a context** with form step state:
   ```typescript
   interface FormStackContextType {
     currentStep: FormStep;
     steps: FormStep[];
     nextStep: () => void;
     prevStep: () => void;
     goToStep: (stepId: string) => void;
     canGoBack: boolean;
     canGoForward: boolean;
   }
   ```

2. **Create a provider component** with performance optimization:
   ```typescript
   export function FormStackProvider({ children, steps }: Props) {
     // State management
     const [currentStepIndex, setCurrentStepIndex] = useState(0);

     // Memoized callbacks
     const nextStep = useCallback(() => { ... }, [canGoForward]);
     const prevStep = useCallback(() => { ... }, [canGoBack]);

     // Memoized value
     const value = useMemo(() => ({
       currentStep,
       steps,
       nextStep,
       prevStep,
       goToStep,
       canGoBack,
       canGoForward
     }), [currentStep, nextStep, prevStep, goToStep]);

     return (
       <FormStackContext.Provider value={value}>
         {children}
       </FormStackContext.Provider>
     );
   }
   ```

3. **Create a custom hook** for consumption:
   ```typescript
   export function useFormStack(): FormStackContextType {
     const context = useContext(FormStackContext);
     if (!context) {
       throw new Error('useFormStack must be used within <FormStackProvider>');
     }
     return context;
   }
   ```

4. **Consider state/dispatch split** if form stack has complex actions:
   - Keep current step state in `StateContext`
   - Keep navigation actions in `DispatchContext`
   - Separates concerns and improves performance

### Integration Points

- **With Auth Provider:** Form stack navigation might depend on user authentication
- **With Notification Provider:** Submit and validation actions trigger notifications
- **With Theme Provider:** Form appearance might depend on theme
- **With Router:** Navigation between steps might affect routing

Use the composition pattern:
```typescript
const RootProvider = composeProviders(
  AuthProvider,
  ThemeProvider,
  NotificationProvider,
  FormStackProvider
);
```

## Recommended Reading Order

1. **Start here:** `quick-reference.md` - Get the templates and basic patterns
2. **Deep dive:** `context-provider-patterns.md` - Understand all aspects
3. **Performance:** `dual-context-pattern.md` - Learn optimization when needed
4. **Complex state:** `useReducer-patterns.md` - If form stack has complex logic

## Key Metrics

- **React Context size:** ~1 KB (minimal)
- **useFormStack hook overhead:** <1 KB
- **Performance impact:** None if memoized properly
- **Re-render impact:** Only consumers re-render on value change
- **TypeScript support:** Excellent with proper typing

## Common Pitfalls to Avoid

1. **Creating new object every render** - Always use useMemo
2. **Not throwing errors in custom hooks** - Makes debugging harder
3. **Using context outside provider** - Custom hook error handling prevents this
4. **Excessive nesting** - Use composition pattern
5. **Over-memoization** - Only optimize after profiling
6. **Missing display names** - Makes debugging harder in React DevTools
7. **Not typing context properly** - Can lead to runtime errors

## Performance Checklist for useFormStack

- [ ] Context value wrapped in useMemo
- [ ] All callbacks wrapped in useCallback
- [ ] Custom hook throws error when outside provider
- [ ] Display name set for React DevTools
- [ ] TypeScript types fully specified
- [ ] No new objects created in provider render
- [ ] Tested with React DevTools Profiler
- [ ] Composed with other providers cleanly
- [ ] Error boundary wrapping provider tree
- [ ] JSDoc comments on public API

---

## Document Statistics

| Document | Size | Focus | Read Time |
|----------|------|-------|-----------|
| context-provider-patterns.md | 31 KB | Comprehensive | 20-30 min |
| quick-reference.md | 8.7 KB | Templates | 5-10 min |
| dual-context-pattern.md | 29 KB | Performance | 20-25 min |
| useReducer-patterns.md | 25 KB | Advanced State | 20-25 min |
| **Total** | **~94 KB** | **Complete** | **65-90 min** |

---

**Research Compiled:** December 26, 2025
**For Project:** geoform-opus P1M3
**Focus:** useFormStack - React Context Provider pattern for multi-step forms
**Status:** Complete and ready for implementation
