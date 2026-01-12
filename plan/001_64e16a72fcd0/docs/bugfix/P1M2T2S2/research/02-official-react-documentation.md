# Official React Documentation on Preventing Updates After Unmount

## Key Official React Resources

### 1. Synchronizing with Effects
**URL**: https://react.dev/learn/synchronizing-with-effects

**Key Concepts**:
- Effects let you synchronize components with external systems
- Each effect represents a separate synchronization process
- Effects should always return a cleanup function if they create side effects

**Official Pattern Example**:
```javascript
useEffect(() => {
  const connection = createConnection(serverUrl, roomId);
  connection.connect();

  return () => {
    connection.disconnect();
  };
}, [serverUrl, roomId]);
```

### 2. Removing Effects (Cleanup)
**URL**: https://react.dev/learn/removing-effects

**Key Concepts**:
- Cleanup function runs before component unmounts
- Cleanup function runs before re-running the effect
- Essential for preventing memory leaks

**Official Cleanup Example**:
```javascript
useEffect(() => {
  const intervalId = setInterval(() => {
    console.log('tick');
  }, 1000);

  return () => clearInterval(intervalId);
}, []);
```

### 3. You Might Not Need an Effect
**URL**: https://react.dev/learn/you-might-not-need-an-effect

**Key Concepts**:
- Many uses of effects can be replaced with simpler patterns
- State updates during render can cause issues
- Transforming data during render is preferred over effects

### 4. Effect Lifecycle
**URL**: https://react.dev/learn/lifecycle-of-reactive-effects

**Key Concepts**:
- Effects run after the browser paints
- Cleanup runs before effects run again
- Understanding when effects run helps prevent bugs

## Official React Stance on isMounted

React's official documentation does NOT recommend the `isMounted` pattern as a primary solution. Instead, they recommend:

1. **Proper Cleanup**: Always return cleanup functions from effects
2. **AbortController**: Use for cancellable operations like fetch
3. **Race Condition Handling**: Handle cleanup within effects themselves

## Official Examples from React Docs

### Fetching Data with Cleanup
```javascript
useEffect(() => {
  let ignore = false;

  async function startFetching() {
    const url = 'https://jsonplaceholder.typicode.com/users';
    const response = await fetch(url);
    const users = await response.json();

    if (!ignore) {
      setUsers(users);
    }
  }

  startFetching();

  return () => {
    ignore = true;
  };
}, []);
```

*Source: React Team examples for data fetching*

### Using AbortController
```javascript
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then(response => response.json())
    .then(data => setData(data))
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    });

  return () => controller.abort();
}, [url]);
```

*Source: Modern React patterns documentation*

## React 18+ Specific Considerations

### Strict Mode Double Invocation
React 18's Strict Mode mounts, unmounts, and remounts components in development to help find cleanup issues:

```javascript
// In React 18 Strict Mode (development only):
// 1. Component mounts
// 2. Effect runs
// 3. Component unmounts (cleanup runs)
// 4. Component mounts again
// 5. Effect runs again
```

This means:
- Cleanup functions MUST be idempotent
- Effects must handle being called multiple times
- Resources should be properly cleaned up and recreated

### Automatic Batching
React 18 automatically batches state updates, which means:
- Multiple state updates in a single effect are batched
- Cleanup functions run before the next effect execution
- Reduces the likelihood of certain race conditions

## Official Recommendations Summary

1. **DO**: Use cleanup functions in `useEffect`
2. **DO**: Use `AbortController` for fetch requests
3. **DO**: Handle cleanup-specific error cases (like `AbortError`)
4. **DON'T**: Rely solely on `isMounted` ref as the primary solution
5. **DON'T**: Set state in cleanup functions
6. **DON'T**: Leave resources hanging without cleanup

## Additional Official Resources

- [useEffect Reference](https://react.dev/reference/react/useEffect)
- [useRef Reference](https://react.dev/reference/react/useRef)
- [Managing State](https://react.dev/learn/managing-state)
- [Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs)
