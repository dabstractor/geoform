# Common Pitfalls and Anti-Patterns with isMounted

## Critical Anti-Patterns

### Anti-Pattern 1: Using isMounted for Logic Control

**Problem**: Using isMounted to control business logic instead of just cleanup.

```javascript
// ❌ BAD
function UserProfile({ userId }) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadData = async () => {
    const data = await fetchUser(userId);

    // Don't use isMounted for conditional logic
    if (isMountedRef.current) {
      if (data.premium) {
        showPremiumFeatures();
      } else {
        showBasicFeatures();
      }
    }
  };

  return <div>...</div>;
}
```

**Better Approach**:
```javascript
// ✅ GOOD
function UserProfile({ userId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    fetchUser(userId, { signal: abortController.signal })
      .then(data => {
        if (!abortController.signal.aborted) {
          setData(data);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          handleError(err);
        }
      });

    return () => abortController.abort();
  }, [userId]);

  // Handle logic in render, not with isMounted
  if (data?.premium) {
    return <PremiumFeatures />;
  }
  return <BasicFeatures />;
}
```

### Anti-Pattern 2: Setting State in Cleanup Function

**Problem**: Setting state after unmount has started.

```javascript
// ❌ BAD - This will cause warnings
useEffect(() => {
  const timer = setTimeout(() => {
    setState('done');
  }, 1000);

  return () => {
    clearTimeout(timer);
    setState('cleanup'); // ❌ Never set state in cleanup!
  };
}, []);
```

**Correct Approach**:
```javascript
// ✅ GOOD
useEffect(() => {
  const timer = setTimeout(() => {
    setState('done');
  }, 1000);

  return () => {
    clearTimeout(timer);
    // No setState here - just cleanup
  };
}, []);
```

### Anti-Pattern 3: Missing isMounted Checks

**Problem**: Forgetting to check isMounted before some state updates but not others.

```javascript
// ❌ BAD
function DataComponent() {
  const isMountedRef = useRef(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const result = await apiCall();
      if (isMountedRef.current) {
        setData(result); // ✅ Checked
      }
      setLoading(false); // ❌ Forgot to check!
    };

    fetchData();
  }, []);

  return <div>{data}</div>;
}
```

**Correct Approach**:
```javascript
// ✅ GOOD - Check before ALL state updates
function DataComponent() {
  const isMountedRef = useRef(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiCall();
        if (isMountedRef.current) {
          setData(result);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, []);

  return <div>{data}</div>;
}
```

### Anti-Pattern 4: Global isMounted

**Problem**: Using a single ref for multiple effects.

```javascript
// ❌ BAD
function Component() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Multiple effects using the same ref
  useEffect(() => {
    fetchData().then(data => {
      if (isMountedRef.current) setData1(data);
    });
  }, []);

  useEffect(() => {
    fetchOtherData().then(data => {
      if (isMountedRef.current) setData2(data);
    });
  }, []);
}
```

**Better Approach**: Use separate cleanup per effect.

```javascript
// ✅ GOOD
function Component() {
  useEffect(() => {
    let cancelled = false;
    fetchData().then(data => {
      if (!cancelled) setData1(data);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchOtherData().then(data => {
      if (!cancelled) setData2(data);
    });
    return () => { cancelled = true; };
  }, []);
}
```

### Anti-Pattern 5: Stale Closure Problems

**Problem**: isMounted ref gets stuck in closures.

```javascript
// ❌ BAD
function Component({ id }) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadData = useCallback(async () => {
    // This closure captures isMountedRef
    const data = await fetchData(id);
    if (isMountedRef.current) {
      setData(data);
    }
  }, [id]); // Dependency on id

  useEffect(() => {
    loadData();
  }, [loadData]);
}
```

**Better Approach**: Proper dependency management or AbortController.

```javascript
// ✅ GOOD
function Component({ id }) {
  useEffect(() => {
    const abortController = new AbortController();

    fetchData(id, { signal: abortController.signal })
      .then(data => {
        if (!abortController.signal.aborted) {
          setData(data);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          handleError(err);
        }
      });

    return () => abortController.abort();
  }, [id]);
}
```

## Common Pitfalls

### Pitfall 1: Not Cleaning Up Subscriptions

```javascript
// ❌ BAD
function ChatComponent() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    chatClient.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
  }, []);
}
```

```javascript
// ✅ GOOD
function ChatComponent() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const handleMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
    };

    chatClient.on('message', handleMessage);

    return () => {
      chatClient.off('message', handleMessage);
    };
  }, []);
}
```

### Pitfall 2: Memory Leaks with Timers

```javascript
// ❌ BAD
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
  }, []);
}
```

```javascript
// ✅ GOOD
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);
}
```

### Pitfall 3: Race Conditions with Rapid Updates

```javascript
// ❌ BAD - Shows wrong data if requests finish out of order
function UserSearch({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query) {
      searchUsers(query).then(setResults);
    }
  }, [query]);
}
```

```javascript
// ✅ GOOD - Handles race conditions
function UserSearch({ query }) {
  const [results, setResults] = useState([]);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    if (query) {
      searchUsers(query).then(data => {
        if (requestId === requestIdRef.current) {
          setResults(data);
        }
      });
    }
  }, [query]);
}
```

### Pitfall 4: Double Execution in React 18 Strict Mode

```javascript
// ❌ BAD - Causes double subscriptions
function Component() {
  useEffect(() => {
    let isMounted = true;

    api.subscribe((data) => {
      if (isMounted) {
        setState(data);
      }
    });

    // Missing cleanup!
  }, []);
}
```

```javascript
// ✅ GOOD - Proper cleanup for Strict Mode
function Component() {
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = api.noop;

    const subscription = api.subscribe((data) => {
      if (isMounted) {
        setState(data);
      }
    });
    unsubscribe = subscription.unsubscribe;

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);
}
```

### Pitfall 5: Not Handling AbortError

```javascript
// ❌ BAD
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then(res => res.json())
    .then(setData)
    .catch(err => {
      setError(err); // This catches AbortError too!
    });

  return () => controller.abort();
}, [url]);
```

```javascript
// ✅ GOOD
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then(res => res.json())
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') {
        setError(err);
      }
      // Silently ignore AbortError - it's expected
    });

  return () => controller.abort();
}, [url]);
```

## Warning Signs You're Using Anti-Patterns

1. **Console Warnings**: "Can't perform a React state update on an unmounted component"
2. **Memory Leaks**: Memory usage grows over time
3. **Stale Data**: Showing old data after rapid updates
4. **Double Executions**: Effects running twice in development (React 18 Strict Mode)
5. **Error Cascades**: Errors from cancelled operations being treated as real errors

## Testing for Anti-Patterns

```javascript
// Test to catch isMounted issues
describe('Component cleanup', () => {
  it('should not update state after unmount', async () => {
    const { unmount } = render(<MyComponent />);

    // Unmount before async operation completes
    act(() => {
      unmount();
    });

    // Wait for operations to complete
    await waitFor(() => {
      // Should not cause errors
    });

    expect(console.error).not.toHaveBeenCalled();
  });
});
```

## Linting Rules

Consider using ESLint rules to catch these issues:
- `react-hooks/exhaustive-deps`: Ensures proper dependencies
- `react-hooks/rules-of-hooks`: Enforces hooks rules
- Custom rules for detecting missing cleanup

## Summary Checklist

- [ ] All effects have cleanup functions when needed
- [ ] No state updates in cleanup functions
- [ ] All state updates after async ops check isMounted or use AbortController
- [ ] AbortError is handled separately from other errors
- [ ] No shared isMounted refs across unrelated effects
- [ ] Timers are cleared in cleanup
- [ ] Subscriptions are unsubscribed in cleanup
- [ ] Race conditions are handled with request IDs or similar
- [ ] Code works correctly in React 18 Strict Mode
- [ ] Tests verify cleanup prevents state updates after unmount
