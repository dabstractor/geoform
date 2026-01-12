# Research: isMountedRef Patterns in React for Preventing State Updates After Unmount

## Overview

This document consolidates research findings on isMountedRef patterns and best practices for preventing "update after unmount" React warnings, conducted to support PRP P1.M2.T2.S2.

## Geoform Codebase Analysis

### useFormStackURLSync Implementation Patterns

The Geoform codebase demonstrates sophisticated patterns for preventing race conditions and update-after-unmount warnings:

#### Pattern 1: RAF-based URL Update Coalescing

```typescript
// Location: src/hooks/useFormStackURLSync.ts (lines 171-227)

const syncStackToUrl = useCallback(
  (formIds: readonly string[], usePushState: boolean = true) => {
    if (typeof window === 'undefined') return;
    if (isRestoringRef.current) return;

    // Store latest stack value for RAF callback access
    latestStackRef.current = formIds;

    // Create version ID for this update
    const updateId = ++pendingUpdateRef.current;

    // Set updating flag to prevent concurrent updates
    isUpdatingRef.current = true;

    // URL update function (with version-based coalescing)
    const performUpdate = () => {
      // Only proceed if this is still the latest update
      if (updateId !== pendingUpdateRef.current) {
        return;
      }

      // Build URL and history state using latest stack value
      const url = buildFormStackUrl(latestStackRef.current, paramName);
      const historyState = { [paramName]: [...latestStackRef.current] };

      // Apply URL update
      if (usePushState) {
        window.history.pushState(historyState, '', url);
      } else {
        window.history.replaceState(historyState, '', url);
      }

      // Reset updating flag
      if (isRAFActuallyAvailable()) {
        requestAnimationFrame(() => {
          isUpdatingRef.current = false;
        });
      } else {
        // Synchronous reset for test environments
        isUpdatingRef.current = false;
      }
    };

    // Schedule update based on RAF availability
    if (isRAFActuallyAvailable()) {
      requestAnimationFrame(performUpdate);
    } else {
      performUpdate();
    }
  },
  [paramName]
);
```

**Key Features**:
- Version-based coalescing (prevents race conditions)
- RAF-based batching for performance
- Test environment detection and fallback
- Proper cleanup with RAF cancellation

#### Pattern 2: Multiple Ref-Based State Tracking

```typescript
// Location: src/hooks/useFormStackURLSync.ts (lines 147-157)

// Track whether we're in the middle of a restoration to prevent loops
const isRestoringRef = useRef(false);
// Track previous stack to detect changes
const prevStackRef = useRef<readonly { id: string }[]>([]);
// Track initialization
const isInitializedRef = useRef(false);
// Track whether URL update is in progress (race condition prevention)
const isUpdatingRef = useRef(false);
// Track latest update version for coalescing rapid updates
const pendingUpdateRef = useRef(0);
// Store latest stack value for RAF callback access
const latestStackRef = useRef<readonly string[]>([]);
```

#### Pattern 3: setTimeout for Asynchronous Flag Reset

```typescript
// Location: src/hooks/useFormStackURLSync.ts (lines 254-258)

// Reset restoration flag after a tick
setTimeout(() => {
  isRestoringRef.current = false;
  setIsRestoring(false);
}, 0);
```

This pattern avoids "setState on unmounted component" warnings by deferring state updates until after the current render cycle.

## The Problem: Stale Closures and Update After Unmount

### Common Scenarios

1. **Async Operations in useEffect**
   ```typescript
   useEffect(() => {
     fetchData().then(setData); // ❌ Warning: setData after unmount
   }, []);
   ```

2. **Timer-based Updates**
   ```typescript
   useEffect(() => {
     const timer = setInterval(setCount, 1000); // ❌ Warning after unmount
     return () => clearInterval(timer);
   }, []);
   ```

3. **requestAnimationFrame Operations**
   ```typescript
   useEffect(() => {
     const animate = () => {
       updateAnimation(); // ❌ Warning after unmount
       requestAnimationFrame(animate);
     };
     requestAnimationFrame(animate);
     // Missing cleanup
   }, []);
   ```

## The Solution: isMountedRef Pattern

### Basic Implementation

```typescript
import { useRef, useEffect } from 'react';

function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

// Usage in components
function MyComponent() {
  const isMounted = useIsMounted();

  useEffect(() => {
    fetchData().then(data => {
      if (isMounted.current) {
        setData(data); // ✅ Safe from update after unmount
      }
    });
  }, []);
}
```

### Advanced: Custom Hook with Cleanup

```typescript
function useSafeAsync() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeSetState = (updater) => {
    if (isMounted.current) {
      updater();
    }
  };

  const safeFetch = async (promise, onSuccess, onError) => {
    try {
      const result = await promise;
      if (isMounted.current && onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      if (isMounted.current && onError) {
        onError(error);
      }
    }
  };

  return { isMounted: isMounted.current, safeSetState, safeFetch };
}
```

## Best Practices and Patterns

### Pattern 1: useRef with useEffect Cleanup

```typescript
function useAsyncState<T>(initialState: T): [T, (newValue: T) => void] {
  const [state, setState] = useState<T>(initialState);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeSetState = (newValue: T) => {
    if (isMounted.current) {
      setState(newValue);
    }
  };

  return [state, safeSetState];
}
```

### Pattern 2: AbortController for Fetch Operations

```typescript
function useFetchData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    abortController.current = new AbortController();

    fetch('/api/data', {
      signal: abortController.current.signal
    })
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => {
        if (error.name !== 'AbortError') {
          setError(error);
        }
      });

    return () => {
      abortController.current?.abort();
    };
  }, []);

  return { data, error };
}
```

### Pattern 3: requestAnimationFrame with Cleanup

```typescript
function useAnimation() {
  const [animationFrame, setAnimationFrame] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const animate = () => {
      if (!mounted) return;

      // Animation logic here
      updateAnimation();

      const frame = requestAnimationFrame(animate);
      setAnimationFrame(frame);
    };

    const frame = requestAnimationFrame(animate);
    setAnimationFrame(frame);

    return () => {
      mounted = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);
}
```

## Official React Documentation

### useEffect Cleanup

> "The function returned by useEffect will be executed when the component unmounts. This is where you should perform any cleanup: subscriptions, timers, or other cleanup that should not persist between renders."

**Source**: [React useEffect Documentation](https://react.dev/reference/react/useEffect#cleanup)

### The Stale Closure Problem

> "When you use an effect to subscribe to something, the effect function doesn't have access to the latest props and state. It only has whatever values were present when your effect ran."

**Solution**: Use the ref pattern to track mounted state.

**Source**: [React Hooks FAQ](https://react.dev/learn/synchronizing-with-effects#why-effects-run-on-every-render)

## Dan Abramov's Insights

### The isMounted Anti-Pattern

Dan Abramov explicitly warns against using `isMounted` as an anti-pattern:

> "The isMounted check is an anti-pattern because it doesn't actually solve the problem. The real issue is that you're trying to update state after the component has unmounted."

**Better Approach**: Use cleanup functions to cancel operations.

**Source**: [Dan Abramov's Blog - The Problem with isMounted](https://overreacted.io/making-setstate-safe/)

### Alternative: Cancelable Promises

```typescript
function useCancelablePromise() {
  const abortControllers = useRef(new Map());

  const cancellablePromise = (promise, key = 'default') => {
    const controller = new AbortController();
    abortControllers.current.set(key, controller);

    return promise.catch(error => {
      if (error.name === 'AbortError') {
        throw new Error('Promise was cancelled');
      }
      throw error;
    }).finally(() => {
      abortControllers.current.delete(key);
    });
  };

  const cancel = (key = 'default') => {
    const controller = abortControllers.current.get(key);
    if (controller) {
      controller.abort();
    }
  };

  useEffect(() => {
    return () => {
      // Cancel all pending promises on unmount
      abortControllers.current.forEach(controller => {
        controller.abort();
      });
    };
  }, []);

  return { cancellablePromise, cancel };
}
```

## StackOverflow Community Consensus

### Common Questions and Answers

**Question**: "How do I prevent 'setState on unmounted component' warning?"
**Best Answer**: Use cleanup functions to cancel async operations, not isMounted checks.

**Question**: "What's the proper way to handle fetch in useEffect?"
**Best Answer**: AbortController + proper cleanup pattern.

**Source**: [StackOverflow - React setState after unmount](https://stackoverflow.com/questions/53113249/react-setstate-after-unmount-warning)

## GitHub Discussions and Examples

### Pattern: Custom useAsync Hook

```typescript
function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(() => {
    setStatus('pending');
    setValue(null);
    setError(null);

    return asyncFunction()
      .then(response => {
        if (isMounted.current) {
          setValue(response);
          setStatus('success');
        }
      })
      .catch(error => {
        if (isMounted.current) {
          setError(error);
          setStatus('error');
        }
      });
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
}
```

## Pattern 4: Test Environment Detection

The Geoform codebase includes sophisticated test environment detection:

```typescript
// Location: src/hooks/useFormStackURLSync.ts (lines 15-41)

function isRAFActuallyAvailable(): boolean {
  if (rafAvailableCache !== null) {
    return rafAvailableCache;
  }

  if (typeof requestAnimationFrame !== 'function') {
    rafAvailableCache = false;
    return false;
  }

  // In test environments, we can't reliably detect if RAF works synchronously
  // We'll assume it doesn't work if we're in a test-like environment
  // This is a pragmatic choice to ensure tests pass without modification
  const isTestEnvironment =
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'test' &&
    (typeof (globalThis as any).vi !== 'undefined' ||
      typeof (globalThis as any).__vitest_worker__ !== 'undefined');

  if (isTestEnvironment) {
    rafAvailableCache = false;
    return false;
  }

  rafAvailableCache = true;
  return true;
}
```

**Key Insight**: This pattern ensures compatibility with test environments where `requestAnimationFrame` exists but doesn't execute callbacks properly.

## Common Pitfalls and Anti-Patterns

### Anti-Pattern 1: Using isMounted for everything

```typescript
// ❌ Don't do this
useEffect(() => {
  const timer = setInterval(() => {
    if (isMounted.current) {
      setCount(count + 1); // Still stale closure issue!
    }
  }, 1000);
  return () => clearInterval(timer);
}, []); // Missing count dependency
```

### Anti-Pattern 2: Ignoring cleanup

```typescript
// ❌ Missing cleanup
useEffect(() => {
  const observer = new IntersectionObserver(callback);
  observer.observe(element);
  // No return cleanup!
}, []);
```

### Anti-Pattern 3: Using isMounted instead of proper cancellation

```typescript
// ❌ Wrong approach
useEffect(() => {
  let isMounted = true;

  fetch('/api/data').then(data => {
    if (isMounted) {
      setData(data);
    }
  });

  return () => {
    isMounted = false;
  };
}, []);
```

## Recommended Patterns by Scenario

### Scenario 1: Simple Data Fetching

```typescript
function useData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const abortController = useRef(null);

  useEffect(() => {
    abortController.current = new AbortController();
    setLoading(true);

    fetch('/api/data', {
      signal: abortController.current.signal
    })
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Fetch error:', err);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      abortController.current?.abort();
    };
  }, []);

  return { data, loading };
}
```

### Scenario 2: Multiple Async Operations

```typescript
function useMultipleAsync() {
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const abortControllers = useRef({});

  useEffect(() => {
    const promises = [
      { key: 'users', fn: fetchUsers },
      { key: 'posts', fn: fetchPosts },
      { key: 'comments', fn: fetchComments }
    ];

    promises.forEach(({ key, fn }) => {
      abortControllers.current[key] = new AbortController();

      fn({ signal: abortControllers.current[key].signal })
        .then(data => setResults(prev => ({ ...prev, [key]: data })))
        .catch(error => {
          if (error.name !== 'AbortError') {
            setErrors(prev => ({ ...prev, [key]: error }));
          }
        });
    });

    return () => {
      Object.values(abortControllers.current).forEach(controller => {
        controller.abort();
      });
    };
  }, []);

  return { results, errors };
}
```

### Scenario 3: requestAnimationFrame Loop

```typescript
function useAnimationFrame(callback) {
  const requestRef = useRef();
  const previousTimeRef = useRef();

  useEffect(() => {
    let mounted = true;

    const animate = time => {
      if (mounted) {
        if (previousTimeRef.current !== undefined) {
          const deltaTime = time - previousTimeRef.current;
          callback(deltaTime);
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      mounted = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback]);

  return requestRef;
}
```

## Summary and Recommendations

### Best Practices

1. **Prefer cleanup functions** over isMounted checks
2. **Use AbortController** for fetch operations
3. **Cancel animation frames** in useEffect cleanup
4. **Clear intervals and timeouts** properly
5. **Avoid stale closures** by using proper dependencies

### When to Use isMountedRef

Only use isMountedRef when:
- You can't cancel the operation (e.g., third-party library callbacks)
- You need to track component state for multiple operations
- You're maintaining legacy code that uses this pattern

### Modern Alternatives

1. **React Query/SWR**: Built-in handling of stale data and unmounted components
2. **SWR**: Automatic caching and revalidation
3. **Zustand**: State management with built-in cleanup
4. **Jotai**: Atomic state management

### Final Recommendation

For new code, prefer:
```typescript
// Best: Cancel the operation
useEffect(() => {
  const controller = new AbortController();

  fetchData({ signal: controller.signal })
    .then(setData)
    .catch(console.error);

  return () => controller.abort();
}, []);

// Acceptable: isMounted for legacy cases
useEffect(() => {
  const isMounted = useRef(true);

  fetchData().then(data => {
    if (isMounted.current) {
      setData(data);
    }
  });

  return () => {
    isMounted.current = false;
  };
}, []);
```

## Validation Commands

```bash
# Test the patterns
npm test -- --testNamePattern="isMounted|async|fetch"

# Run with warnings enabled
npm test 2>&1 | grep -i "update.*unmount" || echo "No warnings found"
```

## References

1. [React useEffect Documentation](https://react.dev/reference/react/useEffect)
2. [React Hooks FAQ](https://react.dev/learn/synchronizing-with-effects)
3. [Dan Abramov - Making setState Safe](https://overreacted.io/making-setstate-safe/)
4. [StackOverflow - React setState after unmount](https://stackoverflow.com/questions/53113249/react-setstate-after-unmount-warning)
5. [MDN - AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
6. [React Animation Performance](https://react.dev/learn/render-and-commit#other-apis)