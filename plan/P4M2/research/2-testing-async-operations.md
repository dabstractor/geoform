# Testing Async Operations and Promises in React

## Overview

Async operations are common in React (API calls, timers, promises). Proper testing requires understanding when to use async utilities like `findBy`, `waitFor`, and how to mock async functions.

## Key Async Testing Patterns

### 1. Using `findBy` Queries

`findBy` queries automatically wait for elements that appear after async operations:

```typescript
import { render, screen } from '@testing-library/react'

function UserProfile() {
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => setUser(data))
  }, [])

  if (!user) return <div>Loading...</div>
  return <div>{user.name}</div>
}

test('displays user data after async fetch', async () => {
  render(<UserProfile />)

  // findByText automatically waits up to 1000ms for element
  const userName = await screen.findByText(/John Doe/)
  expect(userName).toBeInTheDocument()
})
```

### 2. Using `waitFor` for Complex Async Scenarios

`waitFor` checks a callback repeatedly until it passes or times out:

```typescript
test('shows error message on failed fetch', async () => {
  // Mock fetch to reject
  global.fetch = vi.fn(() =>
    Promise.reject(new Error('Network error'))
  )

  render(<UserProfile />)

  await waitFor(() => {
    expect(screen.getByText(/Network error/)).toBeInTheDocument()
  })
})

test('multiple state updates', async () => {
  render(<ComplexAsyncComponent />)

  // Wait for loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument()

  // Wait for final state
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

### 3. Mocking Async Functions with Vitest

Vitest does not auto-mock modules like Jest. You must manually mock:

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'

vi.mock('axios')

describe('UserList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('fetches and displays users', async () => {
    const mockUsers = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]

    // Mock resolved value
    vi.mocked(axios.get).mockResolvedValue({
      data: mockUsers
    })

    render(<UserList />)

    // Wait for users to appear
    const users = await screen.findAllByRole('listitem')
    expect(users).toHaveLength(2)
  })

  test('handles fetch errors', async () => {
    // Mock rejected promise
    vi.mocked(axios.get).mockRejectedValue(
      new Error('Failed to fetch')
    )

    render(<UserList />)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
```

### 4. Testing Async Hooks

Use `renderHook` with `waitFor` for testing custom async hooks:

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useFetchUser } from './useFetchUser'

test('useFetchUser fetches and returns user', async () => {
  const { result } = renderHook(() => useFetchUser(1))

  // Initially undefined
  expect(result.current.user).toBeUndefined()
  expect(result.current.loading).toBe(true)

  // Wait for data
  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })

  expect(result.current.user).toEqual({ id: 1, name: 'John' })
})

test('useFetchUser handles errors', async () => {
  vi.mocked(fetchUser).mockRejectedValue(new Error('API Error'))

  const { result } = renderHook(() => useFetchUser(1))

  await waitFor(() => {
    expect(result.current.error).toEqual(new Error('API Error'))
  })

  expect(result.current.user).toBeUndefined()
})
```

### 5. Testing Async Form Submission

```typescript
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'

function LoginForm() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await loginAPI(email, password)
      // Navigate to dashboard
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" />
      <input type="password" />
      <button disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      {error && <div role="alert">{error}</div>}
    </form>
  )
}

test('submits form and waits for login', async () => {
  const user = userEvent.setup()
  vi.mocked(loginAPI).mockResolvedValue({ token: 'abc123' })

  render(<LoginForm />)

  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.type(screen.getByLabelText(/password/i), 'password123')
  await user.click(screen.getByRole('button', { name: /login/i }))

  // Button should show loading state
  expect(screen.getByRole('button')).toHaveTextContent('Logging in...')

  // Wait for success
  await waitFor(() => {
    expect(screen.queryByRole('button')).toHaveTextContent('Login')
  })
})
```

### 6. Using `act()` for Manual State Updates

Wrap Promise resolutions in `act()` when not using async utilities:

```typescript
import { act } from '@testing-library/react'

test('manual async state update with act', async () => {
  const { rerender } = render(<Counter />)

  let promise: Promise<void>

  act(() => {
    promise = delayedStateUpdate()
  })

  // Rerender still in loading state
  rerender(<Counter />)

  // Resolve promise
  await act(async () => {
    await promise
  })

  // Now component is updated
  expect(screen.getByText('Updated')).toBeInTheDocument()
})
```

## Best Practices

### DO:
- Use `findBy` for single elements that appear after async operations
- Use `waitFor` for complex scenarios requiring multiple checks
- Mock async functions with `vi.mock()` in Vitest
- Use `mockResolvedValue` and `mockRejectedValue` for promises
- Test both success and error states
- Clean up timers and subscriptions in tests

### DON'T:
- Rely on `setTimeout` for waiting (unreliable)
- Use `vi.useFakeTimers()` unless testing time-dependent code
- Leave promises unresolved (causes memory leaks and warnings)
- Forget to `await` async operations
- Mock at the component level when module mocking is available

## Handling React act() Warnings

React's `act()` warnings usually mean something is happening after your test completes:

```typescript
// Wrong - causes act() warning
test('updates state after unmount', async () => {
  const { unmount } = render(<Component />)
  unmount()

  // This state update happens but test has ended
  await new Promise(resolve => setTimeout(resolve, 100))
})

// Correct - wrap async operations
test('handles cleanup correctly', async () => {
  const { unmount } = render(<Component />)

  await waitFor(() => {
    expect(screen.getByText('loaded')).toBeInTheDocument()
  })

  unmount()
})
```

## Testing Concurrent Requests

```typescript
test('handles multiple concurrent requests', async () => {
  const mockUser = { id: 1, name: 'John' }
  const mockPosts = [{ id: 1, title: 'Post 1' }]

  vi.mocked(fetchUser).mockResolvedValue(mockUser)
  vi.mocked(fetchPosts).mockResolvedValue(mockPosts)

  render(<UserProfile userId={1} />)

  // Both should resolve
  const userName = await screen.findByText('John')
  const postTitle = await screen.findByText('Post 1')

  expect(userName).toBeInTheDocument()
  expect(postTitle).toBeInTheDocument()
})
```

## Key References

- **Vitest Async Testing**: https://vitest.dev/api/
- **React Testing Library Async Utilities**: https://testing-library.com/docs/dom-testing-library/api-async
- **Testing JavaScript - Async Tests**: https://testingjavascript.com/

## Summary

Use `findBy` for simple waits, `waitFor` for complex scenarios, and always mock async functions. Remember that Vitest doesn't auto-mock, so manual mocking is required. Test both success and error paths for robust async testing.
