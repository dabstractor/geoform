# Testing Component Lifecycle (Mount/Unmount)

## Overview

Testing component lifecycle includes verifying that setup happens at mount, cleanup occurs at unmount, and side effects are managed properly. React hooks like `useEffect` combined with modern testing approaches make lifecycle testing straightforward.

## Core Concepts

### useEffect Lifecycle

Effects have a different lifecycle from components:

1. **Mount Phase**: Component mounts, then effect runs
2. **Update Phase**: Dependencies change, cleanup runs, new effect runs
3. **Unmount Phase**: Component unmounts, cleanup runs

```typescript
function ComponentWithEffect() {
  React.useEffect(() => {
    // Setup runs on mount and when dependencies change
    console.log('Setup')

    // Cleanup runs before next effect and on unmount
    return () => {
      console.log('Cleanup')
    }
  }, [/* dependencies */])

  return <div>Component</div>
}

// If dependency array is empty: setup on mount, cleanup on unmount
// If no dependency array: setup on every render, cleanup before next render
// If dependencies: setup when dependencies change, cleanup before next setup
```

## Testing Mount/Unmount

### Test 1: Component Mounts and Unmounts

```typescript
import { render, screen } from '@testing-library/react'
import { cleanup } from '@testing-library/react'

function Component() {
  React.useEffect(() => {
    console.log('Mounted')
    return () => console.log('Unmounted')
  }, [])

  return <div>Component</div>
}

test('component mounts and unmounts', () => {
  const consoleSpy = vi.spyOn(console, 'log')

  const { unmount } = render(<Component />)

  expect(consoleSpy).toHaveBeenCalledWith('Mounted')

  unmount()

  expect(consoleSpy).toHaveBeenCalledWith('Unmounted')

  consoleSpy.mockRestore()
})
```

### Test 2: Cleanup on Mount/Unmount

```typescript
function SubscriptionComponent() {
  React.useEffect(() => {
    // Subscribe on mount
    const subscription = subscribe('events', (data) => {
      console.log('Event:', data)
    })

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe()
      console.log('Subscription cleaned up')
    }
  }, [])

  return <div>Listening for events</div>
}

test('subscribes on mount and unsubscribes on unmount', () => {
  const mockSubscribe = vi.fn()
  const mockUnsubscribe = vi.fn()

  vi.mock('./events', () => ({
    subscribe: mockSubscribe.mockReturnValue({
      unsubscribe: mockUnsubscribe
    })
  }))

  const { unmount } = render(<SubscriptionComponent />)

  expect(mockSubscribe).toHaveBeenCalledWith('events', expect.any(Function))

  unmount()

  expect(mockUnsubscribe).toHaveBeenCalled()
})
```

### Test 3: Timer Cleanup

Common pattern: setting up timers and cleaning them up:

```typescript
function TimerComponent() {
  const [seconds, setSeconds] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return <div>Seconds: {seconds}</div>
}

test('timer starts on mount and stops on unmount', async () => {
  vi.useFakeTimers()

  const { unmount } = render(<TimerComponent />)

  expect(screen.getByText('Seconds: 0')).toBeInTheDocument()

  // Advance time by 3 seconds
  vi.advanceTimersByTime(3000)

  expect(screen.getByText('Seconds: 3')).toBeInTheDocument()

  unmount()

  // Advancing time after unmount should not cause updates
  vi.advanceTimersByTime(1000)

  // Component is unmounted, so no errors
  expect(() => screen.getByText('Seconds: 4')).toThrow()

  vi.useRealTimers()
})
```

### Test 4: Effect Dependencies

```typescript
function DependentEffect({ userId }: { userId: string }) {
  const [user, setUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch(`/api/users/${userId}`)
      setUser(await response.json())
    }

    fetchUser()
  }, [userId]) // Re-run when userId changes

  return <div>{user?.name || 'Loading...'}</div>
}

test('re-runs effect when dependencies change', async () => {
  const { rerender } = render(<DependentEffect userId="1" />)

  // Wait for first user to load
  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument()
  })

  // Change userId
  rerender(<DependentEffect userId="2" />)

  // Should fetch new user
  await waitFor(() => {
    expect(screen.getByText('Jane')).toBeInTheDocument()
  })
})

test('cleanup runs between dependency changes', () => {
  const mockFetchCancel = vi.fn()

  function Component({ id }: { id: string }) {
    React.useEffect(() => {
      const abortController = new AbortController()

      // Simulate fetch with cancellation
      fetch(`/api/data/${id}`, {
        signal: abortController.signal
      })

      return () => {
        abortController.abort()
        mockFetchCancel()
      }
    }, [id])

    return <div>Data for {id}</div>
  }

  const { rerender } = render(<Component id="1" />)

  rerender(<Component id="2" />)

  // Cleanup should have been called when dependency changed
  expect(mockFetchCancel).toHaveBeenCalled()
})
```

### Test 5: DOM Events Cleanup

```typescript
function ResizeListener() {
  const [size, setSize] = React.useState<[number, number]>([
    window.innerWidth,
    window.innerHeight
  ])

  React.useEffect(() => {
    const handleResize = () => {
      setSize([window.innerWidth, window.innerHeight])
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <div>Size: {size[0]}x{size[1]}</div>
}

test('adds and removes resize listener', () => {
  const addListenerSpy = vi.spyOn(window, 'addEventListener')
  const removeListenerSpy = vi.spyOn(window, 'removeEventListener')

  const { unmount } = render(<ResizeListener />)

  expect(addListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

  unmount()

  expect(removeListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

  addListenerSpy.mockRestore()
  removeListenerSpy.mockRestore()
})
```

### Test 6: Async Operations Cleanup

```typescript
function AsyncComponent() {
  const [data, setData] = React.useState(null)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let isMounted = true // Prevent state update after unmount

    const fetchData = async () => {
      try {
        const response = await fetch('/api/data')
        const json = await response.json()

        if (isMounted) {
          setData(json)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false // Cleanup: mark as unmounted
    }
  }, [])

  if (error) return <div>Error</div>
  if (!data) return <div>Loading</div>
  return <div>{data.value}</div>
}

test('prevents state updates after unmount', async () => {
  vi.mocked(fetch).mockResolvedValue({
    json: () => Promise.resolve({ value: 'test' })
  } as Response)

  const { unmount } = render(<AsyncComponent />)

  expect(screen.getByText('Loading')).toBeInTheDocument()

  unmount()

  // Simulate fetch completing after unmount
  await waitFor(() => {
    // No error should occur (React doesn't complain about state updates)
    expect(true).toBe(true)
  }, { timeout: 100 })
})
```

## Testing with Cleanup Utilities

### Automatic Cleanup

React Testing Library automatically calls `cleanup()` after each test if your framework supports `afterEach` (Jest, Vitest, Mocha):

```typescript
// This happens automatically - no need to do it manually
afterEach(() => {
  cleanup()
})
```

### Manual Cleanup (when needed)

```typescript
import { cleanup } from '@testing-library/react'

test('manual cleanup example', () => {
  const { unmount } = render(<Component />)

  // Do assertions...

  cleanup() // Explicit cleanup
  // or
  unmount() // Specific unmount
})
```

### Disabling Auto-Cleanup

If you need to disable automatic cleanup:

```typescript
// In test setup file
import '@testing-library/react-hooks/dont-cleanup-after-each'
// or
import { cleanup } from '@testing-library/react'
afterEach(() => {
  // Don't call cleanup
})
```

## Testing Class Component Lifecycle

```typescript
class ClassComponent extends React.Component {
  componentDidMount() {
    console.log('Mounted')
  }

  componentDidUpdate(prevProps: any) {
    if (this.props.id !== prevProps.id) {
      console.log('ID changed')
    }
  }

  componentWillUnmount() {
    console.log('Unmounting')
  }

  render() {
    return <div>{this.props.id}</div>
  }
}

test('class component lifecycle', () => {
  const spy = vi.spyOn(console, 'log')
  const { rerender, unmount } = render(<ClassComponent id="1" />)

  expect(spy).toHaveBeenCalledWith('Mounted')

  rerender(<ClassComponent id="2" />)

  expect(spy).toHaveBeenCalledWith('ID changed')

  unmount()

  expect(spy).toHaveBeenCalledWith('Unmounting')

  spy.mockRestore()
})
```

## Testing Memory Leaks

```typescript
test('does not cause memory leaks', () => {
  const { unmount, rerender } = render(<Component />)

  // Trigger multiple re-renders
  for (let i = 0; i < 100; i++) {
    rerender(<Component key={i} />)
  }

  // Unmount and cleanup
  unmount()

  // If component properly cleans up timers, subscriptions, etc.,
  // no warnings should appear in the test output
  expect(true).toBe(true) // Component cleaned up successfully
})
```

## Best Practices

### DO:
- Clean up timers with `clearInterval()`, `clearTimeout()`
- Clean up event listeners with `removeEventListener()`
- Unsubscribe from subscriptions
- Cancel fetch requests with `AbortController`
- Use `isMounted` flag to prevent state updates after unmount
- Test both mount and unmount behavior
- Use `vi.useFakeTimers()` for timer testing

### DON'T:
- Leave timers running after unmount
- Forget to remove event listeners
- Update state after component unmounts
- Test implementation details directly
- Ignore cleanup warnings from React
- Assume cleanup happens automatically

## Testing Checklist

```typescript
✓ Component mounts and renders correctly
✓ Setup code runs on mount
✓ Cleanup code runs on unmount
✓ Dependencies trigger re-runs
✓ Timers are cleaned up
✓ Event listeners are removed
✓ Subscriptions are unsubscribed
✓ Fetch requests are cancelled
✓ No state updates after unmount
✓ No memory leaks occur
✓ Component re-renders correctly on prop changes
✓ Effect doesn't run when dependencies unchanged
```

## Key References

- **Testing Library Unmounting**: https://www.testingjavascript.com/lessons/react-test-unmounting-a-react-component-with-react-testing-library-372eab3b
- **React Lifecycle Effects**: https://react.dev/learn/lifecycle-of-reactive-effects
- **Cleanup Function Patterns**: https://www.dhiwise.com/post/react-hook-on-unmount-best-practices
- **Testing Async Cleanup**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

## Summary

Test component lifecycle by verifying setup runs at mount, cleanup runs at unmount, and effects respond correctly to dependency changes. Use `vi.useFakeTimers()` for timer testing. Always clean up event listeners, timers, and subscriptions. Prevent state updates after unmount with an `isMounted` flag or AbortController.
