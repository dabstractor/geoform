# External Dependencies Research

## React Context API Patterns

### Key Findings
1. **Context Splitting is Critical**: Split contexts by update frequency to prevent unnecessary re-renders
2. **Memoization is Mandatory**: Always use `useMemo` for context values
3. **Selective Consumption**: Only consume context in components that need specific state

### Recommended Pattern
```typescript
// Split by update frequency
const FormStackContext = createContext<StackOperations>(null!)
const FormStateContext = createContext<FormState>(null!)

// Memoize values
const value = useMemo(() => ({
  pushForm, popForm, updateForm
}), [/* deps */])
```

**Sources:**
- [Optimizing React Context API for Performance](https://www.linkedin.com/pulse/optimizing-react-context-api-performance-best-patterns-aditya-prakash-2r25c)
- [React Performance Optimization: 15 Best Practices for 2025](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9)

## Error Boundary Implementation

### Key Findings
1. **React 18+ Error Boundaries**: Support `getDerivedStateFromError` and `componentDidCatch`
2. **React 19 Enhancement**: New `onCaughtError` lifecycle for better error handling
3. **Reset Keys Pattern**: Use reset keys to reset error state when props change
4. **Error Isolation**: Wrap each form in individual error boundary

### Recommended Pattern
```typescript
class FormErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorUI />
    }
    return this.props.children
  }
}
```

**Sources:**
- [React error handling, 2025 edition — onUncaughtError](https://javascript.plainenglish.io/react-error-handling-2025-edition-onuncaughterror-boundaries-logging-ea7a679de22a)
- [React Error Boundary Testing](https://jshakespeare.com/react-error-boundary-testing-rtl/)

## Component State Preservation

### Key Findings
1. **Hidden Container Pattern**: Render all forms, hide with CSS
2. **No Unmounting**: Keep parent forms mounted while child is active
3. **CSS Hiding**: Use `display: none` or `position: absolute` with negative left
4. **State Preservation**: React preserves state when component stays mounted

### Recommended Pattern
```typescript
{forms.map(form => (
  <div
    key={form.id}
    style={{ display: form.id === activeForm ? 'block' : 'none' }}
  >
    {form.component}
  </div>
))}
```

**Alternative: Off-DOM Mounting**
```typescript
<div style={{ display: 'none', position: 'absolute', left: '-9999px' }}>
  {hiddenForms}
</div>
```

**Sources:**
- [React Keep-Alive: The Complete Guide Every Developer Needs](https://dev.to/serifcolakel/react-keep-alive-the-complete-guide-every-developer-needs-1c2m)

## Async Imperative APIs

### Key Findings
1. **Promise-Based API**: Return promises from hook operations
2. **Suspense Integration**: Use React 19's `use` hook for Suspense boundaries
3. **Manual Promise Management**: Create and resolve promises manually in hooks
4. **Abort Controllers**: Support cancellation for async operations

### Recommended Pattern
```typescript
const openForm = useCallback(<T,>(options): Promise<T | undefined> => {
  return new Promise((resolve) => {
    setStack(prev => [...prev, {
      ...options,
      resolve,
      reject: () => resolve(undefined)
    }])
  })
}, [])
```

**Sources:**
- [React 19 `use` Hook Deep Dive](https://dev.to/a1guy/react-19-use-hook-deep-dive-using-promises-directly-in-your-components-1plp)

## Query String Sync Patterns

### Key Findings
1. **React Router Integration**: Use `useSearchParams` hook for bidirectional sync
2. **Throttled Updates**: Throttle URL updates to prevent excessive history entries
3. **Serialization**: JSON-encode form data for URL storage
4. **Pluggable Architecture**: Make URL sync optional via configuration

### Recommended Pattern
```typescript
function useQuerySync(stack: FormStack[]) {
  const [searchParams, setSearchParams] = useSearchParams()

  // Sync stack → URL
  useEffect(() => {
    const params = new URLSearchParams()
    stack.forEach(form => {
      params.append('form', form.id)
    })
    setSearchParams(params)
  }, [stack, setSearchParams])

  // Sync URL → stack
  useEffect(() => {
    const forms = searchParams.getAll('form')
    // Reconstruct stack from URL
  }, [searchParams])
}
```

**Sources:**
- [Sync React State with URL Search Parameters](https://dev.to/kphr99/sync-react-state-with-url-search-parameters-using-usequeryparamsstate-hook-1pgi)

## TypeScript Generic Constraints

### Key Findings
1. **Generic Props**: Use `<T = any>` for form value types
2. **Deep Partial Types**: Support partial updates for nested form data
3. **Type Inference**: Enable type inference from generic constraints
4. **Branded Types**: Use branded types for form IDs

### Recommended Pattern
```typescript
interface FormProps<T = any> {
  onSubmit: (value: T) => void
  onCancel: () => void
}

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

function openForm<T>(options: {
  component: React.ComponentType<FormProps<T>>
  // ...
}): Promise<T | undefined>
```

**Sources:**
- [TypeScript Generics in React Components: A Complete Guide](https://dev.to/jonathanguo/typescript-generics-in-react-components-a-complete-guide-1e88)

## Testing Best Practices

### Key Findings
1. **Behavior Over Implementation**: Test what users see, not component internals
2. **User-Event Testing**: Use `@testing-library/user-event` for realistic interactions
3. **Hook Testing**: Use `@testing-library/react-hooks` for hook isolation
4. **MSW for API Mocking**: Use Mock Service Worker for network mocking
5. **Accessibility Testing**: Use proper ARIA selectors and keyboard tests

### Recommended Patterns
```typescript
// Hook testing
test('should open form and return value', async () => {
  const { result } = renderHook(() => useFormStack())

  const promise = act(() => result.current.openForm({
    id: 'test',
    component: TestForm
  }))

  await waitFor(() => {
    expect(result.current.stack).toHaveLength(1)
  })
})

// Integration testing
test('should preserve state across nesting', async () => {
  render(<FormStackProvider><TestApp /></FormStackProvider>)

  await userEvent.type(screen.getByLabelText('Name'), 'John')
  await userEvent.click(screen.getByText('Open Child'))

  await userEvent.click(screen.getByText('Close Child'))

  expect(screen.getByLabelText('Name')).toHaveValue('John')
})
```

**Sources:**
- [React Testing Library hooks testing best practices 2025](https://javascript.plainenglish.io/test-react-hooks-the-practical-way-three-patterns-that-always-work-2025-3429319daef2)
- [Testing React Components with Testing Library and MSW](https://www.stackbuilders.com/insights/testing-react-components-with-testing-library-and-mock-service-worker/)
- [React Testing Library form submission testing](https://medium.com/@entekumejeffrey/part-8-testing-forms-and-user-inputs-in-react-with-jest-a879fa799bbc)

## Summary of Architectural Decisions

| Concern | Decision | Rationale |
|---------|----------|-----------|
| State Management | React Context | No external deps, sufficient complexity |
| Form Preservation | CSS Hiding | Simple, reliable, no portals |
| API Style | Promise-Based | Familiar, enables async/await |
| Error Handling | Per-Form Boundaries | Isolation, recovery granularity |
| Type Safety | Generics with Constraints | Flexibility + type inference |
| Testing | RTL + Jest + MSW | Industry standard, React-first |
| URL Sync | Optional Plugin | Not all consumers need it |
