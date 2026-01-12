# React 18+ Modern Recommendations for isMounted Pattern

## React 18 Key Changes Affecting Cleanup

### 1. Strict Mode Double Invocation (Development Only)

React 18 Strict Mode now mounts, unmounts, and remounts components in development:

```javascript
// What happens in React 18 Strict Mode (dev only):

// 1. Component mounts
// 2. Effect runs
// 3. Component unmounts (cleanup runs)
// 4. Component mounts again
// 5. Effect runs again

// In production: Only runs once (steps 1, 2, 5)
```

**Implication**: Your cleanup and effects must be idempotent and handle being called multiple times.

**Example**:
```javascript
// ✅ GOOD - Handles double invocation correctly
function ChatComponent() {
  useEffect(() => {
    const subscription = chatClient.subscribe((msg) => {
      setMessage(msg);
    });

    // Cleanup runs twice in dev, once in production
    return () => {
      subscription.unsubscribe(); // Safe to call multiple times
    };
  }, []);
}
```

**Common Issue**:
```javascript
// ❌ BAD - Breaks with double invocation
function ChatComponent() {
  useEffect(() => {
    let isSubscribed = false;

    if (!isSubscribed) {
      chatClient.subscribe(handleMessage);
      isSubscribed = true;
    }

    return () => {
      // On second mount, isSubscribed is already true
      // so this cleanup won't work properly
    };
  }, []);
}
```

### 2. Automatic Batching

React 18 batches all state updates automatically:

```javascript
// Before React 18: Updates in async callbacks were NOT batched
function handleClick() {
  fetchData().then(() => {
    setState1(true);  // Separate re-renders
    setState2(false); // Separate re-renders
    setState3(null);  // Separate re-renders
  });
}

// React 18+: All updates are batched
function handleClick() {
  fetchData().then(() => {
    setState1(true);  // Single re-render
    setState2(false);
    setState3(null);
  });
}
```

**Implication for isMounted**: Fewer race conditions from rapid state updates, but cleanup is still critical.

### 3. Concurrent Features and Transitions

React 18 introduces concurrent features that may interrupt rendering:

```javascript
import { startTransition } from 'react';

function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;

    // Urgent update
    setInputValue(value);

    // Non-urgent update (can be interrupted)
    startTransition(() => {
      setResults(value);
    });
  };

  useEffect(() => {
    const abortController = new AbortController();

    // This effect might be interrupted by concurrent rendering
    search(query, { signal: abortController.signal })
      .then(data => {
        if (!abortController.signal.aborted) {
          setResults(data);
        }
      });

    return () => abortController.abort();
  }, [query]);
}
```

## Modern React 18+ Patterns

### Pattern 1: AbortController (Recommended for Fetch)

```javascript
function UserProfile({ userId }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Check if aborted before updating state
        if (!abortController.signal.aborted) {
          setProfile(data);
        }
      } catch (err) {
        // Only set error if not aborted
        if (err.name !== 'AbortError') {
          setError(err);
        }
      }
    }

    loadProfile();

    return () => {
      abortController.abort();
    };
  }, [userId]);

  return (
    <div>
      {error && <Error message={error.message} />}
      {profile && <ProfileCard data={profile} />}
    </div>
  );
}
```

### Pattern 2: Request ID for Race Conditions

```javascript
function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    // Increment request ID
    const requestId = ++requestIdRef.current;

    setLoading(true);

    search(query)
      .then(data => {
        // Only update if this is the latest request
        if (requestId === requestIdRef.current) {
          setResults(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (requestId === requestIdRef.current) {
          setError(err);
          setLoading(false);
        }
      });
  }, [query]);

  return <ResultsList data={results} loading={loading} />;
}
```

### Pattern 3: useSyncExternalStore for Subscriptions

React 18+ provides `useSyncExternalStore` for subscribing to external data:

```javascript
import { useSyncExternalStore } from 'react';

function ChatMessages() {
  const messages = useSyncExternalStore(
    // Subscribe function
    (callback) => {
      const unsubscribe = chatClient.on('message', callback);
      return () => unsubscribe();
    },
    // Get snapshot
    () => chatClient.getMessages(),
    // Server snapshot (for SSR)
    () => []
  );

  return (
    <ul>
      {messages.map(msg => (
        <li key={msg.id}>{msg.text}</li>
      ))}
    </ul>
  );
}
```

**Benefits**:
- Automatic subscription/unsubscription
- SSR support
- Handles concurrent rendering correctly
- No manual isMounted checks needed

### Pattern 4: Deferred Updates with useDeferredValue

For expensive computations that shouldn't block updates:

```javascript
import { useDeferredValue } from 'react';

function ExpensiveList({ items }) {
  // Defer expensive computation
  const deferredItems = useDeferredValue(items);

  const processed = useMemo(() => {
    return expensiveProcess(deferredItems);
  }, [deferredItems]);

  return <List items={processed} />;
}
```

## React 18+ Specific Considerations

### 1. useEffect Timing

Effects now run after the browser paints (for better performance):

```javascript
function Component() {
  useEffect(() => {
    // This runs AFTER browser paint
    // User sees something before heavy work starts
    console.log('Effect ran');

    return () => {
      console.log('Cleanup');
    };
  }, []);
}
```

### 2. useInsertionEffect for CSS-in-JS

For style injection that must happen before layout:

```javascript
import { useInsertionEffect } from 'react';

function StyledComponent() {
  useInsertionEffect(() => {
    // Insert styles synchronously before layout
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <div>Content</div>;
}
```

**Note**: This is primarily for library authors, not typical app code.

### 3. useId for Stable IDs

```javascript
function CheckboxGroup({ options }) {
  const id = useId();

  return (
    <fieldset>
      {options.map(option => (
        <div key={option.value}>
          <input
            id={`${id}-${option.value}`}
            type="checkbox"
            name={id}
          />
          <label htmlFor={`${id}-${option.value}`}>
            {option.label}
          </label>
        </div>
      ))}
    </fieldset>
  );
}
```

## React 18+ Anti-Patterns to Avoid

### 1. Don't Use componentWillUnount Equivalent

```javascript
// ❌ BAD - Old lifecycle thinking
useEffect(() => {
  // Setup
  return () => {
    // This is NOT componentWillUnmount
    // This runs before EVERY re-run of the effect
  };
});
```

### 2. Don't Ignore Effect Dependencies

```javascript
// ❌ BAD - Missing dependencies
function UserPage({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
    // Missing userId dependency!
  }, []); // Should be [userId]
}
```

```javascript
// ✅ GOOD - Proper dependencies
function UserPage({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchUser(userId, { signal: controller.signal })
      .then(data => {
        if (!controller.signal.aborted) {
          setUser(data);
        }
      });

    return () => controller.abort();
  }, [userId]);
}
```

### 3. Don't Use isMounted for Rendering Decisions

```javascript
// ❌ BAD
function Component() {
  const isMountedRef = useRef(true);

  if (!isMountedRef.current) {
    return null; // Never do this!
  }

  return <div>Content</div>;
}
```

## Recommended Approach for React 18+

### Primary Recommendation: AbortController

```javascript
// Modern pattern for React 18+
function useFetch(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(url, {
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!abortController.signal.aborted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => abortController.abort();
  }, [url]);

  return { data, error, loading };
}
```

### Secondary: Cleanup Flag (for non-cancellable operations)

```javascript
// For operations that can't be cancelled
function useAsyncData(asyncFn) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    asyncFn()
      .then(result => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [asyncFn]);

  return { data, error };
}
```

## Migration Checklist from Pre-React 18

- [ ] Update all effects to handle double invocation (Strict Mode)
- [ ] Add AbortController to fetch requests
- [ ] Replace isMounted refs with proper cleanup
- [ ] Ensure all async operations have cleanup
- [ ] Check for missing effect dependencies
- [ ] Test with Strict Mode enabled
- [ ] Update error handling to ignore AbortError
- [ ] Remove any componentWill* equivalents
- [ ] Verify concurrent rendering compatibility
- [ ] Add tests for cleanup behavior

## Testing in React 18+

```javascript
import { render, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';

// Test with Strict Mode to catch double-invocation issues
test('handles cleanup correctly with Strict Mode', async () => {
  const cleanup = jest.fn();

  function TestComponent() {
    useEffect(() => {
      return () => cleanup();
    }, []);

    return <div>Test</div>;
  }

  render(
    <StrictMode>
      <TestComponent />
    </StrictMode>
  );

  // In Strict Mode, cleanup runs twice in development
  expect(cleanup).toHaveBeenCalledTimes(2);
});
```

## Additional React 18+ Resources

- [React 18 Announcement](https://react.dev/blog/2022/03/29/react-v18)
- [Strict Mode Double Invocations](https://react.dev/reference/react/StrictMode)
- [useSyncExternalStore Reference](https://react.dev/reference/react/useSyncExternalStore)
- [Concurrent Features](https://react.dev/blog/2022/03/29/react-v18#concurrent-features)
- [Transitions](https://react.dev/reference/react/startTransition)
