# Testing Strategy: React Hierarchical Form Stack System

## Testing Philosophy

**"Test behavior, not implementation"** - Focus on what users experience, not component internals.

## Testing Pyramid

```
           E2E Tests (10%)
         /                 \
      Integration Tests (30%)
     /                         \
  Unit Tests (60%)
```

## Unit Testing Strategy

### Test Subjects

1. **Custom Hooks**
   - `useFormStack()` - Stack operations (push, pop, update)
   - `useFormState()` - State access (active form, loading, errors)
   - `useFormRegistry()` - Form registration/unregistration

2. **Context Providers**
   - `FormStackProvider` - Context value provision
   - Memoization stability
   - Re-render optimization

3. **Utility Functions**
   - Stack manipulation helpers
   - Type guards
   - Serialization/deserialization

### Tools & Libraries
- `@testing-library/react@^14.0.0`
- `@testing-library/react-hooks@^8.0.0`
- `jest@^29.0.0`
- `@testing-library/user-event@^14.0.0`

### Example Tests

```typescript
// Hook: useFormStack stack operations
describe('useFormStack', () => {
  it('should push form onto stack', async () => {
    const { result } = renderHook(() => useFormStack())

    await act(async () => {
      await result.current.openForm({
        id: 'test-form',
        component: TestForm
      })
    })

    expect(result.current.stack).toHaveLength(1)
    expect(result.current.stack[0].id).toBe('test-form')
  })

  it('should pop form and return value', async () => {
    const { result } = renderHook(() => useFormStack())

    const promise = act(() => {
      return result.current.openForm({
        id: 'test-form',
        component: TestForm
      })
    })

    // Simulate form submission
    const resolve = result.current.stack[0].resolve
    act(() => resolve({ name: 'Test' }))

    const value = await promise
    expect(value).toEqual({ name: 'Test' })
    expect(result.current.stack).toHaveLength(0)
  })
})

// Context: FormStackProvider memoization
describe('FormStackProvider', () => {
  it('should memoize context value', () => {
    const { getByTestId } = render(
      <FormStackProvider>
        <TestChild />
      </FormStackProvider>
    )

    // Initial render
    expect(getByTestId('render-count')).toHaveTextContent('1')

    // Re-render parent with same props
    rerender(
      <FormStackProvider>
        <TestChild />
      </FormStackProvider>
    )

    // Should not re-render due to memoization
    expect(getByTestId('render-count')).toHaveTextContent('1')
  })
})
```

## Integration Testing Strategy

### Test Scenarios

1. **Multi-Step Workflows**
   - Open form A → Open form B → Submit B → Verify A resumes
   - Open form A → Open form B → Cancel B → Verify A resumes unchanged

2. **State Persistence**
   - Fill form → Open child → Close child → Verify data preserved
   - Deep nesting (3+ levels) → Verify all ancestors preserved

3. **Breadcrumb Navigation**
   - Navigate via breadcrumb → Verify intermediate forms canceled
   - Navigate with dirty forms → Verify confirmation dialog

4. **Error Boundaries**
   - Trigger error in form → Verify boundary catches it
   - Retry from error → Verify form recovers
   - Dismiss error → Verify form closes

5. **Cancellation Confirmation**
   - Dirty form cancel → Verify dialog appears
   - Confirm cancel → Verify form closes, no value returned
   - Abort cancel → Verify form remains open

### Example Tests

```typescript
// Integration: Multi-step workflow
describe('Form Stack Workflow', () => {
  it('should preserve parent state when opening child', async () => {
    render(
      <FormStackProvider>
        <ParentForm />
      </FormStackProvider>
    )

    // Fill parent form
    await userEvent.type(screen.getByLabelText('Parent Name'), 'Parent Data')

    // Open child form
    await userEvent.click(screen.getByText('Open Child'))

    // Verify child is active
    expect(screen.getByText('Child Form')).toBeInTheDocument()
    expect(screen.queryByLabelText('Parent Name')).not.toBeInTheDocument()

    // Close child form
    await userEvent.click(screen.getByText('Cancel Child'))

    // Verify parent is restored with state
    expect(screen.getByLabelText('Parent Name')).toHaveValue('Parent Data')
  })

  it('should return value from child to parent', async () => {
    let receivedValue: any

    const ParentForm = () => {
      const { openForm } = useFormStack()

      const handleOpen = async () => {
        const value = await openForm({
          id: 'child',
          component: ChildForm
        })
        receivedValue = value
      }

      return <button onClick={handleOpen}>Open Child</button>
    }

    render(
      <FormStackProvider>
        <ParentForm />
      </FormStackProvider>
    )

    await userEvent.click(screen.getByText('Open Child'))
    await userEvent.type(screen.getByLabelText('Child Data'), 'Child Value')
    await userEvent.click(screen.getByText('Submit Child'))

    await waitFor(() => {
      expect(receivedValue).toEqual({ childData: 'Child Value' })
    })
  })
})

// Integration: Breadcrumb navigation
describe('Breadcrumb Navigation', () => {
  it('should cancel intermediate forms when navigating', async () => {
    render(
      <FormStackProvider>
        <TestApp />
      </FormStackProvider>
    )

    // Open 3 forms deep
    await openForm('form-1')
    await openForm('form-2')
    await openForm('form-3')

    // Navigate to form-1 via breadcrumb
    await userEvent.click(screen.getByText('Form 1'))

    // Verify forms 2 and 3 were canceled (no values)
    expect(screen.queryByText('Form 2')).not.toBeInTheDocument()
    expect(screen.queryByText('Form 3')).not.toBeInTheDocument()
    expect(screen.getByText('Form 1')).toBeInTheDocument()
  })
})

// Integration: Error boundary
describe('Error Boundaries', () => {
  it('should isolate errors to individual forms', async () => {
    const ThrowError = () => {
      useEffect(() => {
        throw new Error('Test error')
      }, [])
      return <div>Will Error</div>
    }

    render(
      <FormStackProvider>
        <TestForm />
      </FormStackProvider>
    )

    // Open error form
    await act(() => {
      openForm({
        id: 'error-form',
        component: ThrowError
      })
    })

    // Verify error boundary caught it
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Verify other forms still work
    await userEvent.click(screen.getByText('Open Another Form'))
    expect(screen.getByText('Another Form')).toBeInTheDocument()
  })
})
```

## End-to-End Testing Strategy

### Test Scenarios

1. **Complete User Workflows**
   - Create organization → Create team → Add users (realistic nested flow)
   - Fill multi-step form → Navigate away → Return → Verify data

2. **Accessibility**
   - Keyboard navigation through forms
   - Tab order preservation
   - Screen reader announcements

3. **URL Sync**
   - Open forms → Verify URL updates
   - Navigate back/forward → Verify state syncs

### Tools
- `@playwright/test` or `cypress` (future consideration)
- For now, integration tests with RTL are sufficient

## Performance Testing

### Metrics to Track

1. **Render Performance**
   - Time to open form (target: <100ms)
   - Time to close form (target: <100ms)
   - Re-renders per operation (target: minimal)

2. **Memory Leaks**
   - Form unmounting cleanup
   - Event listener removal
   - Promise resolution

3. **Deep Nesting**
   - Test with 10+ nested forms
   - Monitor memory usage

### Example Test

```typescript
describe('Performance', () => {
  it('should not cause unnecessary re-renders', () => {
    let renderCount = 0

    const TestForm = () => {
      renderCount++
      const { onSubmit } = useFormProps()
      return <button onClick={() => onSubmit({})}>Submit</button>
    }

    render(
      <FormStackProvider>
        <TestForm />
      </FormStackProvider>
    )

    const initialCount = renderCount

    // Perform unrelated action
    fireEvent.click(document.body)

    expect(renderCount).toBe(initialCount)
  })
})
```

## Test Coverage Goals

| Category | Target Coverage |
|----------|-----------------|
| Hooks | 90%+ |
| Context Providers | 85%+ |
| Utilities | 95%+ |
| Components | 80%+ |
| Overall | 85%+ |

## Test Organization

```
src/
  __tests__/
    unit/
      hooks/
        useFormStack.test.ts
        useFormState.test.ts
      context/
        FormStackProvider.test.tsx
    integration/
      workflows/
        multi-step-form.test.tsx
        breadcrumb-navigation.test.tsx
      error-handling/
        error-boundary.test.tsx
        cancellation.test.tsx
    fixtures/
      TestForm.tsx
      TestProvider.tsx
```

## Continuous Integration

### Pre-Commit Hooks
- Run linting
- Run unit tests
- Type checking

### Pre-Push Hooks
- Full test suite
- Coverage verification

### CI Pipeline
- All tests on PR
- Performance regression detection
- Accessibility audit

## Mock Strategy

### What to Mock
- External API calls (use MSW)
- Browser APIs (URL, history)
- Time-related functions (Date, timers)

### What NOT to Mock
- React components
- React hooks
- Context providers
- User interactions

## Example Mock Setup

```typescript
// __tests__/setup.ts
import { setupServer } from 'msw/node'
import { rest } from 'msw'

const server = setupServer(
  rest.post('/api/submit', (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Summary

**Testing Priorities:**
1. Hook behavior (push/pop/resolve/reject)
2. State preservation across nesting
3. Error isolation and recovery
4. User interaction flows
5. Type safety via TypeScript

**Testing Principles:**
- Test behavior over implementation
- Use userEvent over fireEvent
- Clean up mocks after each test
- Test accessibility alongside functionality
- Maintain high coverage, but prioritize critical paths
