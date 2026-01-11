# Best Practices for isMounted Pattern in React Hooks

## Pattern 1: isMounted Ref (Basic Pattern)

**When to Use**: Simple async operations that can't be cancelled

```javascript
import { useEffect, useRef, useState, useCallback } from 'react';

function DataComponent() {
  const [data, setData] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const result = await apiCall();
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setError(error);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return <div>{data}</div>;
}
```

**Pros**:
- Simple to understand
- Works with any async operation
- No API-specific knowledge needed

**Cons**:
- Operation continues in background (wasted resources)
- Requires explicit check before every state update
- Can be error-prone if checks are missed

## Pattern 2: AbortController (Modern Best Practice)

**When to Use**: Fetch requests and cancellable async operations

```javascript
import { useEffect, useState } from 'react';

function DataComponent({ url }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    fetchData(url, { signal })
      .then(data => setData(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [url]);

  return <div>{data || error}</div>;
}

// API call with AbortSignal
async function fetchData(url, { signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
```

**Pros**:
- Actually cancels the network request
- Standard web API (built into browsers)
- Clear error handling pattern
- Saves bandwidth and resources

**Cons**:
- Only works with APIs that support AbortSignal
- Requires API-level support
- Slightly more complex setup

## Pattern 3: Cleanup Flag (Simplified isMounted)

**When to Use**: Quick inline checks within a single effect

```javascript
useEffect(() => {
  let cancelled = false;

  async function load() {
    const result = await expensiveComputation();
    if (!cancelled) {
      setResult(result);
    }
  }

  load();

  return () => {
    cancelled = true;
  };
}, []);
```

**Pros**:
- Scoped to single effect
- No ref management
- Simple and straightforward

**Cons**:
- Can't be used across multiple functions
- Operation continues in background
- Less reusable

## Pattern 4: Custom Hook (Recommended for Reusability)

**When to Use**: Reusable async logic across components

```javascript
import { useEffect, useRef, useState, useCallback } from 'react';

function useAsyncOperation(asyncFn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn(...args);
      if (isMountedRef.current) {
        setData(result);
        return result;
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
        throw err;
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [asyncFn, ...deps]);

  return { data, error, loading, execute };
}

// Usage
function UserProfile({ userId }) {
  const { data: user, loading, error, execute } = useAsyncOperation(
    async (id) => {
      const response = await fetch(`/api/users/${id}`);
      return response.json();
    },
    []
  );

  useEffect(() => {
    execute(userId);
  }, [userId, execute]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{user?.name}</div>;
}
```

## Pattern 5: Race Condition Prevention

**When to Use**: Multiple rapid state updates or URL changes

```javascript
import { useEffect, useRef, useState } from 'react';

function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    async function search() {
      const response = await fetch(`/api/search?q=${query}`);
      const data = await response.json();

      // Only update if this is the latest request
      if (requestId === requestIdRef.current) {
        setResults(data);
      }
    }

    search();
  }, [query]);

  return <ul>{results.map(r => <li key={r.id}>{r.title}</li>)}</ul>;
}
```

**Key Insight**: Each request gets a unique ID; only the latest ID updates state.

## Pattern 6: Cancellation Token Pattern

**When to Use**: Complex async workflows with multiple steps

```javascript
function useCancellableEffect() {
  const cancelRef = useRef({ cancelled: false });

  useEffect(() => {
    cancelRef.current.cancelled = false;
    return () => {
      cancelRef.current.cancelled = true;
    };
  }, []);

  const cancellable = (promise) => {
    return promise.then(value => {
      if (cancelRef.current.cancelled) {
        return Promise.reject(new Error('Cancelled'));
      }
      return value;
    });
  };

  return { cancellable, isCancelled: () => cancelRef.current.cancelled };
}

// Usage
function MultiStepWorkflow() {
  const { cancellable, isCancelled } = useCancellableEffect();

  useEffect(() => {
    async function runWorkflow() {
      try {
        const step1 = await cancellable(fetchStep1());
        const step2 = await cancellable(fetchStep2(step1));
        const step3 = await cancellable(fetchStep3(step2));

        if (!isCancelled()) {
          setFinalResult(step3);
        }
      } catch (error) {
        if (!isCancelled()) {
          setError(error);
        }
      }
    }

    runWorkflow();
  }, []);

  return <div>{finalResult}</div>;
}
```

## Best Practice Summary

### DO:
1. **Always** include cleanup functions in effects
2. **Prefer** AbortController for network requests
3. **Use** refs for non-rendering state tracking
4. **Create** custom hooks for reusable async logic
5. **Handle** errors appropriately (distinguish cancelled vs real errors)
6. **Cancel** operations to save resources

### DON'T:
1. **Don't** rely solely on isMounted without cleanup
2. **Don't** set state in cleanup functions
3. **Don't** forget to check isMounted before every state update
4. **Don't** use isMounted to make decisions about what to render
5. **Don't** create cleanup functions that have side effects

### Pattern Selection Guide

| Scenario | Recommended Pattern |
|----------|---------------------|
| Simple fetch request | AbortController |
| Non-cancellable async operation | isMounted ref |
| Multiple rapid requests | Race condition ID pattern |
| Reusable async logic | Custom hook with isMounted |
| Complex multi-step workflow | Cancellation token pattern |
| Timers/intervals | Cleanup function with clearTimeout/clearInterval |

## Testing Considerations

```javascript
// Testing isMounted pattern
describe('DataComponent', () => {
  it('should not update state after unmount', async () => {
    const { unmount } = render(<DataComponent />);

    // Unmount immediately
    unmount();

    // Wait for async operation
    await waitFor(() => {
      expect(apiCall).toHaveBeenCalled();
    });

    // Should not throw "setState on unmounted component" warning
    expect(console.error).not.toHaveBeenCalled();
  });
});
```
