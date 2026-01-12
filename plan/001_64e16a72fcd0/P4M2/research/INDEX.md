# React Integration Testing with Vitest and React Testing Library - Complete Research Guide

## Quick Navigation

1. [Testing React Context](#1-testing-react-context)
2. [Testing Async Operations](#2-testing-async-operations)
3. [Testing User Interactions](#3-testing-user-interactions)
4. [Testing Error Boundaries](#4-testing-error-boundaries)
5. [Testing Router Integration](#5-testing-router-integration)
6. [Testing Multi-Step Forms](#6-testing-multi-step-forms)
7. [Testing Component Lifecycle](#7-testing-component-lifecycle)

---

## 1. Testing React Context

**File**: `1-testing-react-context.md`

### Key Points:
- Wrap components with context providers, don't mock context
- Create custom render functions for frequently used providers
- Test provider and consumer together as a unit
- Use the `wrapper` option for complex provider hierarchies

### Quick Example:
```typescript
const customRender = (ui, { providerProps = {}, ...options }) => {
  return render(
    <MyContext.Provider value={providerProps}>
      {ui}
    </MyContext.Provider>,
    options
  )
}
```

### Documentation Links:
- [React Context - Testing Library](https://testing-library.com/docs/example-react-context/)
- [Testing React Context - Ultimate Guide](https://www.upbeatcode.com/react/testing-react-context-ultimate-guide/)
- [Mocking Context with RTL](https://polvara.me/posts/mocking-context-with-react-testing-library/)

---

## 2. Testing Async Operations and Promises

**File**: `2-testing-async-operations.md`

### Key Points:
- Use `findBy` for single elements that appear after async operations
- Use `waitFor` for complex async scenarios
- Mock async functions with `vi.mock()` (Vitest doesn't auto-mock)
- Use `mockResolvedValue` and `mockRejectedValue` for promises
- Test both success and error states

### Quick Example:
```typescript
test('displays user data after fetch', async () => {
  render(<UserProfile />)
  const user = await screen.findByText(/John Doe/)
  expect(user).toBeInTheDocument()
})
```

### Documentation Links:
- [Vitest API Reference](https://vitest.dev/api/)
- [React Testing Library - Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async)
- [Vitest Component Testing Guide](https://vitest.dev/guide/browser/component-testing)

---

## 3. Testing User Interactions and State Changes

**File**: `3-testing-user-interactions.md`

### Key Points:
- Use `userEvent.setup()` before rendering components
- Always use `userEvent` over `fireEvent` (simulates real behavior)
- `await` all user interactions (they return Promises)
- Test user-visible behavior, not implementation details
- Use semantic queries like `getByRole()`

### Quick Example:
```typescript
test('submits form', async () => {
  const user = userEvent.setup()
  render(<LoginForm />)

  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))

  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument()
  })
})
```

### Common userEvent Methods:
- `user.click()` - Click elements
- `user.type()` - Type text into inputs
- `user.hover()` - Hover over elements
- `user.selectOptions()` - Select dropdown options
- `user.keyboard()` - Simulate keyboard input
- `user.upload()` - Upload files

### Documentation Links:
- [userEvent Documentation](https://testing-library.com/docs/user-event/intro/)
- [userEvent GitHub](https://github.com/testing-library/user-event)
- [fireEvent vs userEvent Comparison](https://blog.mimacom.com/react-testing-library-fireevent-vs-userevent/)

---

## 4. Testing Error Boundaries

**File**: `4-testing-error-boundaries.md`

### Key Points:
- Error boundaries only catch render-time errors, not event handlers
- Suppress `console.error` in tests with `vi.spyOn()`
- Test both happy path (no errors) and error path (exceptions caught)
- Test recovery/retry functionality
- Use granular error boundaries for better isolation

### Quick Example:
```typescript
test('error boundary catches render errors', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

  render(
    <ErrorBoundary>
      <BrokenComponent />
    </ErrorBoundary>
  )

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  spy.mockRestore()
})
```

### Error Boundary Implementation Pattern:
```typescript
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div role="alert">Error: {this.state.error.message}</div>
    }
    return this.props.children
  }
}
```

### Documentation Links:
- [Error Boundary Testing (James Shakespeare)](https://jshakespeare.com/react-error-boundary-testing-rtl/)
- [React Error Boundaries (Chris Boakes)](https://chrisboakes.com/testing-react-component-error-boundaries/)
- [react-error-boundary Library](https://blog.logrocket.com/react-error-handling-react-error-boundary/)

---

## 5. Testing Router Integration

**File**: `5-testing-router-integration.md`

### Key Points:
- Use official `createRoutesStub` for React Router v7+
- Use `MemoryRouter` with `initialEntries` for full integration testing
- Create test utilities to wrap components consistently
- Test route parameters and search params
- Avoid mocking router hooks unless testing isolated logic

### Quick Example:
```typescript
test('navigate to dashboard', async () => {
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
      <Navigation />
    </MemoryRouter>
  )

  await user.click(screen.getByRole('link', { name: /dashboard/i }))
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})
```

### Test Utilities Pattern:
```typescript
export function renderWithRouter(
  ui: React.ReactElement,
  { initialRoute = '/' } = {}
) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {ui}
    </MemoryRouter>
  )
}
```

### Documentation Links:
- [React Router Testing Guide](https://reactrouter.com/start/framework/testing)
- [Testing React Router with RTL](https://javascript.plainenglish.io/testing-react-router-with-react-testing-library-8e24f7bdca18)
- [React Router Vitest Example](https://akoskm.com/react-router-vitest-example/)
- [Vitest + React Router Guide](https://patelvivek.dev/blog/testing-react-router-vitest)

---

## 6. Best Practices for Testing Multi-Step Forms

**File**: `6-testing-multi-step-forms.md`

### Key Points:
- Validate at each step before allowing progress
- Preserve form data when navigating backward
- Show clear progress indicators
- Test navigation in both directions
- Test validation for each field
- Test submission with complete data
- Test error states and recovery

### Form Architecture Patterns:
1. **Context-Based**: Use `createContext` with step management
2. **useState-Based**: Manage state in parent component

### Quick Example:
```typescript
test('multi-step form validation and submission', async () => {
  const user = userEvent.setup()
  const handleSubmit = vi.fn()

  render(<MultiStepForm onSubmit={handleSubmit} />)

  // Step 1: Fill personal info
  await user.type(screen.getByLabelText(/name/i), 'John Doe')
  await user.type(screen.getByLabelText(/email/i), 'john@example.com')
  await user.click(screen.getByRole('button', { name: /next/i }))

  // Step 2: Fill address
  await user.type(screen.getByLabelText(/street/i), '123 Main St')
  await user.type(screen.getByLabelText(/city/i), 'Springfield')
  await user.click(screen.getByRole('button', { name: /next/i }))

  // Step 3: Review and submit
  await user.click(screen.getByRole('button', { name: /submit/i }))

  expect(handleSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'John Doe',
      email: 'john@example.com',
      street: '123 Main St',
      city: 'Springfield'
    })
  )
})
```

### Testing Checklist:
- Navigate forward through all steps
- Navigate backward and preserve data
- Validate required fields at each step
- Prevent progress with invalid data
- Show validation error messages
- Submit form with all data collected
- Show loading state during submission
- Handle submission errors gracefully

### Documentation Links:
- [Multi-step Form Example (GitHub)](https://github.com/ArinzeGit/Multi-step-Form)
- [Testing React Hook Form](https://claritydev.net/blog/testing-react-hook-form-with-react-testing-library/)
- [Real-Dev-Squad TDD Practice](https://github.com/Real-Dev-Squad/react-tests-tdd)

---

## 7. Testing Component Lifecycle (Mount/Unmount)

**File**: `7-testing-component-lifecycle.md`

### Key Points:
- Test that setup runs on mount
- Test that cleanup runs on unmount
- Verify effects respond correctly to dependency changes
- Use `vi.useFakeTimers()` for timer testing
- Clean up event listeners, timers, and subscriptions
- Prevent state updates after unmount

### useEffect Cleanup Pattern:
```typescript
function Component() {
  React.useEffect(() => {
    // Setup
    const handler = () => console.log('Event')
    window.addEventListener('resize', handler)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handler)
    }
  }, []) // Runs on mount, cleanup on unmount
}
```

### Quick Example:
```typescript
test('timer cleanup on unmount', () => {
  vi.useFakeTimers()
  const { unmount } = render(<TimerComponent />)

  expect(screen.getByText('Seconds: 0')).toBeInTheDocument()

  vi.advanceTimersByTime(3000)
  expect(screen.getByText('Seconds: 3')).toBeInTheDocument()

  unmount()

  vi.advanceTimersByTime(1000) // No updates after unmount
  expect(true).toBe(true) // No error

  vi.useRealTimers()
})
```

### Async Cleanup Pattern:
```typescript
function AsyncComponent() {
  React.useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      const data = await fetch('/api')
      if (isMounted) {
        setState(data)
      }
    }

    fetchData()

    return () => {
      isMounted = false // Prevent state updates after unmount
    }
  }, [])
}
```

### Documentation Links:
- [Testing Unmounting](https://www.testingjavascript.com/lessons/react-test-unmounting-a-react-component-with-react-testing-library-372eab3b)
- [React Lifecycle of Effects](https://react.dev/learn/lifecycle-of-reactive-effects)
- [React Hook Cleanup Best Practices](https://www.dhiwise.com/post/react-hook-on-unmount-best-practices)

---

## General Best Practices

### Query Priority (in order of preference)
1. `getByRole()` - Most accessible
2. `getByLabelText()` - For form inputs
3. `getByPlaceholderText()` - For text inputs
4. `getByText()` - For other elements
5. `getByTestId()` - Last resort

### Async Pattern
```typescript
// Wait for single element to appear
const element = await screen.findByText('Expected text')

// Wait for complex async scenario
await waitFor(() => {
  expect(screen.getByText('Final state')).toBeInTheDocument()
})

// Always await user interactions
const user = userEvent.setup()
await user.click(button)
await user.type(input, 'text')
```

### Test Structure
```typescript
test('description of behavior', async () => {
  // Setup
  const user = userEvent.setup()
  render(<Component />)

  // Act
  await user.interact()

  // Assert
  expect(screen.getByText('result')).toBeInTheDocument()
})
```

### Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: true
  }
})

// vitest.setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

---

## Common Testing Mistakes to Avoid

1. **Using fireEvent instead of userEvent** - fireEvent doesn't simulate real user behavior
2. **Not awaiting async operations** - Causes race conditions and flaky tests
3. **Mocking Context directly** - Use providers instead
4. **Testing implementation details** - Focus on behavior and output
5. **Forgetting to clean up mocks** - Use `vi.resetAllMocks()` or `vi.clearAllMocks()`
6. **Not testing error paths** - Test success AND failure scenarios
7. **Leaving timers running** - Always clean up with `clearInterval()` or `clearTimeout()`
8. **Ignoring act() warnings** - Usually means something is happening after test completes

---

## Recommended Reading Order

1. Start with **User Interactions** to understand testing philosophy
2. Learn **Async Operations** for realistic testing scenarios
3. Master **Context Testing** for state management
4. Study **Router Integration** for navigation testing
5. Deep dive into **Multi-Step Forms** for complex components
6. Understand **Error Boundaries** for error handling
7. Master **Component Lifecycle** for cleanup and side effects

---

## Research Methodology

This research compiled information from:
- Official documentation (Vitest, React Testing Library, React Router)
- Community best practices and guides
- Real-world examples and GitHub repositories
- Testing JavaScript course materials
- Blog posts and articles from testing experts

### Sources:
- [Component Testing - Vitest](https://vitest.dev/guide/browser/component-testing)
- [React Context - Testing Library](https://testing-library.com/docs/example-react-context/)
- [userEvent - Testing Library](https://testing-library.com/docs/user-event/intro/)
- [React Router Testing](https://reactrouter.com/start/framework/testing)
- [Testing JavaScript - Kent C. Dodds](https://testingjavascript.com/)
- [Common Testing Mistakes - Kent C. Dodds](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library/)

---

## File Structure

```
plan/P4M2/research/
├── INDEX.md                           (This file)
├── 1-testing-react-context.md         (Context testing patterns)
├── 2-testing-async-operations.md      (Async/Promise testing)
├── 3-testing-user-interactions.md     (User interactions & state)
├── 4-testing-error-boundaries.md      (Error handling)
├── 5-testing-router-integration.md    (Router & navigation)
├── 6-testing-multi-step-forms.md      (Complex form testing)
└── 7-testing-component-lifecycle.md   (Mount/unmount/cleanup)
```

---

## Next Steps for Implementation

Based on this research, consider:

1. **Update test utilities** - Create centralized test helpers for providers, router, etc.
2. **Establish testing standards** - Define preferred patterns and anti-patterns
3. **Create component test templates** - Start with patterns from this guide
4. **Review existing tests** - Refactor to use userEvent, waitFor, etc.
5. **Set up test configuration** - Configure Vitest, jsdom, and setupFiles
6. **Add ESLint rules** - Use eslint-plugin-testing-library to enforce best practices
7. **Document testing patterns** - Create team-specific testing guidelines

---

Last Updated: 2025-12-27
Research Completed: Comprehensive guide with examples and references for all major testing scenarios
