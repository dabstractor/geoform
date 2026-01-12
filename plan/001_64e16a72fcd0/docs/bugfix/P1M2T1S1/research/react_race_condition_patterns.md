# React Race Condition Mitigation Patterns for URL Synchronization

**Research Date:** 2026-01-11
**Context:** P1.M2.T1.S1 - URL sync race condition bug in useFormStackURLSync hook
**Goal:** Document authoritative patterns for preventing race conditions in React URL synchronization hooks

---

## Table of Contents

1. [useRef-based Pending Update Tracking](#1-useref-based-pending-update-tracking)
2. [useTransition for Coordinated Updates](#2-usetransition-for-coordinated-updates)
3. [useDeferredValue for Non-blocking Updates](#3-usedeferredvalue-for-non-blocking-updates)
4. [isMountedRef Pattern for Unmount Safety](#4-ismountedref-pattern-for-unmount-safety)
5. [Pending Update Coalescing Patterns](#5-pending-update-coalescing-patterns)
6. [URL Sync Specific Patterns](#6-url-sync-specific-patterns)
7. [Current Codebase Analysis](#7-current-codebase-analysis)
8. [Recommended Implementation](#8-recommended-implementation)

---

## 1. useRef-based Pending Update Tracking

### Pattern Description

Use `useRef` to track pending async operations and prevent race conditions by checking if an operation is still relevant before updating state. This is particularly useful for preventing duplicate operations and ensuring only the latest result is applied.

### When to Use

- Tracking in-flight async operations (fetch, timers, promises)
- Preventing duplicate requests from rapid state changes
- Ensuring only the latest operation completes and updates state
- Operations that can be superseded by newer operations

### Code Examples

#### Basic Pending Operation Tracking

```typescript
import { useRef, useEffect, useState, useCallback } from 'react';

function usePendingOperation<T>() {
  const pendingOpRef = useRef<number | null>(null);
  const [data, setData] = useState<T | null>(null);

  const executeOperation = useCallback(async (input: string) => {
    // Increment operation ID to track this specific operation
    const operationId = ++(pendingOpRef.current ?? 0);
    pendingOpRef.current = operationId;

    try {
      const result = await fetchData(input);

      // Only update if this is still the latest operation
      if (operationId === pendingOpRef.current) {
        setData(result);
      }
    } catch (error) {
      // Only handle error if this is still the latest operation
      if (operationId === pendingOpRef.current) {
        console.error(error);
      }
    }
  }, []);

  return { data, executeOperation };
}
```

#### URL Sync with Pending Update Tracking

```typescript
function useFormStackURLSync(options) {
  const pendingUpdateRef = useRef<number>(0);
  const latestStackRef = useRef<readonly string[]>([]);

  const syncStackToUrl = useCallback((formIds: readonly string[]) => {
    // Store the latest stack
    latestStackRef.current = formIds;

    // Increment pending counter
    const updateId = ++pendingUpdateRef.current;

    // Use requestAnimationFrame to batch updates
    requestAnimationFrame(() => {
      // Only proceed if this is still the latest update
      if (updateId === pendingUpdateRef.current) {
        const url = buildFormStackUrl(latestStackRef.current, paramName);
        window.history.pushState({ formIds }, '', url);
      }
    });
  }, [paramName]);

  return { syncStackToUrl };
}
```

#### AbortController with useRef (Best Practice)

```typescript
function useAbortableFetch() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (url: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });
      return await response.json();
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
      // Request was aborted, silently ignore
      return null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { fetchData };
}
```

### Key Benefits

1. **Operation Deduplication**: Prevents multiple concurrent operations
2. **Staleness Prevention**: Ensures only latest results are applied
3. **Memory Safety**: Proper cleanup prevents memory leaks
4. **Cancellation Support**: Can abort superseded operations

### Authoritative Sources

- **React Documentation - Synchronizing with Effects**: https://react.dev/learn/synchronizing-with-effects#each-effect-represents-a-separate-synchronization-process
- **React Blog - You Might Not Need an Effect**: https://react.dev/blog/2023/06/15/react-labs-what-we-have-been-working-on-june-2023 (Effects cleanup patterns)
- **Kent C. Dodds - How to use React useEffect Effectively**: https://kentcdodds.com/blog/useeffect-is-not-the-lifecycle-method-you-think-it-is (Cleanup functions)
- **Dan Abramov - Overreacted - Making setInterval Declarative**: https://overreacted.io/making-setinterval-declarative/ (Ref patterns for intervals)

---

## 2. useTransition for Coordinated Updates

### Pattern Description

`useTransition` is a React 18+ concurrent feature that marks state updates as non-urgent "transitions", allowing React to interrupt them if more urgent updates (like user input) come in. This prevents UI blocking and helps manage race conditions by allowing stale updates to be abandoned.

### When to Use

- Expensive UI updates that might block user interactions
- Filtering/searching large lists
- Navigation between routes
- Real-time search suggestions
- Any update that can be delayed without harming UX

### Code Examples

#### Basic useTransition Usage

```typescript
import { useTransition, useState } from 'react';

function SearchComponent({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    // Urgent update - update input immediately
    setQuery(value);

    // Non-urgent update - filter in transition
    startTransition(() => {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
    });
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isPending ? <Spinner /> : <ResultsList items={filteredItems} />}
    </div>
  );
}
```

#### URL Sync with useTransition

```typescript
function useFormStackURLSync(options) {
  const [stack] = useFormStackState();
  const [isPending, startTransition] = useTransition();

  const syncStackToUrl = useCallback((formIds: readonly string[]) => {
    // Mark URL update as transition to prevent blocking
    startTransition(() => {
      const url = buildFormStackUrl(formIds, paramName);
      window.history.pushState({ formIds }, '', url);
    });
  }, [paramName]);

  useEffect(() => {
    if (!syncToUrl) return;

    // Sync in transition to prevent blocking
    startTransition(() => {
      const currentIds = stack.map(e => e.id);
      syncStackToUrl(currentIds);
    });
  }, [stack, syncToUrl, syncStackToUrl]);

  return { isUrlUpdatePending: isPending };
}
```

#### Coordinated Multiple Updates

```typescript
function useCoordinatedUrlSync(stack, otherState) {
  const [isPending, startTransition] = useTransition();

  const syncAllState = useCallback(() => {
    startTransition(() => {
      // All updates in this transition are coordinated
      // If user types, all can be interrupted
      syncStackToUrl(stack);
      syncOtherStateToUrl(otherState);
      updateDerivedData(stack);
    });
  }, [stack, otherState]);

  return { syncAllState, isPending };
}
```

### Key Benefits

1. **Non-blocking Updates**: Keeps UI responsive during expensive operations
2. **Interruption**: Stale transitions can be abandoned for new updates
3. **User Priority**: Urgent updates (typing, clicking) take precedence
4. **Coordinated Batches**: Multiple updates can be grouped atomically

### Authoritative Sources

- **React Documentation - useTransition**: https://react.dev/reference/react/useTransition
- **React Documentation - Concurrent Rendering**: https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react
- **React Blog - React Labs: What We Have Been Working On**: https://react.dev/blog/2023/06/15/react-labs-what-we-have-been-working-on-june-2023
- **Dan Abramov - React Conf Keynote**: https://www.youtube.com/watch?v=fn_PHJ5lwfE (Concurrent features explanation)

---

## 3. useDeferredValue for Non-blocking Updates

### Pattern Description

`useDeferredValue` defers updating a part of the UI by keeping a previous value and scheduling a re-render with the new value when React has time. This is ideal for expensive computations or renders that don't need to block user input.

### When to Use

- Expensive computations based on user input
- Rendering large lists or trees
- Search/filtering operations
- Derived state that can lag behind source state
- Preventing input lag in complex UIs

### Code Examples

#### Basic useDeferredValue Usage

```typescript
import { useDeferredValue, useMemo } from 'react';

function ExpensiveList({ items, query }: { items: Item[]; query: string }) {
  // Defer the query to prevent blocking during typing
  const deferredQuery = useDeferredValue(query);

  // Expensive computation uses deferred value
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(deferredQuery.toLowerCase())
    );
  }, [items, deferredQuery]);

  return (
    <div>
      {/* Input uses immediate value */}
      <input value={query} onChange={e => setQuery(e.target.value)} />

      {/* List uses deferred value */}
      <ul>
        {filteredItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### URL Sync with useDeferredValue

```typescript
function useFormStackURLSync(options) {
  const [stack] = useFormStackState();

  // Defer stack updates to prevent blocking
  const deferredStack = useDeferredValue(stack);

  useEffect(() => {
    // Only sync when deferred value updates
    if (!syncToUrl) return;

    const currentIds = deferredStack.map(e => e.id);
    const url = buildFormStackUrl(currentIds, paramName);
    window.history.pushState({ formIds: currentIds }, '', url);
  }, [deferredStack, syncToUrl, paramName]);

  // Can show a loading state when deferred value is stale
  const isStale = stack !== deferredStack;

  return { isUrlUpdateStale: isStale };
}
```

#### Combined with useMemo for Expensive Operations

```typescript
function useOptimizedUrlSync(stack) {
  const deferredStack = useDeferredValue(stack);

  const urlState = useMemo(() => {
    // Expensive URL building only runs when deferred value changes
    return buildFormStackUrl(
      deferredStack.map(e => e.id),
      'forms'
    );
  }, [deferredStack]);

  useEffect(() => {
    window.history.pushState({ stack: deferredStack }, '', urlState);
  }, [urlState, deferredStack]);

  return { isStale: stack !== deferredStack };
}
```

### Key Benefits

1. **Input Responsiveness**: Keeps input fields responsive during expensive renders
2. **Gradual Updates**: Shows stale data while preparing new data
3. **Automatic Prioritization**: React automatically prioritizes urgent updates
4. **Simple API**: Less boilerplate than manual debouncing/throttling

### Authoritative Sources

- **React Documentation - useDeferredValue**: https://react.dev/reference/react/useDeferredValue
- **React Documentation - Optimizing Performance**: https://react.dev/learn/render-and-commit#optimizing-performance
- **React Blog - React 18: Concurrent Features**: https://react.dev/blog/2022/03/29/react-v18

---

## 4. isMountedRef Pattern for Unmount Safety

### Pattern Description

Track component mount status with a ref to prevent state updates after component unmounts. This prevents the "Can't perform a React state update on an unmounted component" warning and potential memory leaks.

### When to Use

- Async operations that might complete after unmount
- Subscriptions that need cleanup
- Timers that might fire after unmount
- Any side effect that outlives component lifecycle

### Code Examples

#### Basic isMountedRef Pattern

```typescript
import { useRef, useEffect } from 'react';

function useSafeAsync() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;

    // Cleanup function - runs on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((setter) => {
    if (isMountedRef.current) {
      setter();
    }
  }, []);

  return { safeSetState };
}
```

#### Modern Pattern with AbortController (Recommended)

```typescript
function useAbortableEffect(effect: (signal: AbortSignal) => void | (() => void), deps: any[]) {
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const cleanup = effect(signal);

    return () => {
      abortController.abort();
      if (cleanup) cleanup();
    };
  }, deps);
}

// Usage
useAbortableEffect((signal) => {
  const fetchData = async () => {
    try {
      const response = await fetch(url, { signal });
      const data = await response.json();
      if (!signal.aborted) {
        setState(data);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    }
  };

  fetchData();
}, [url]);
```

#### URL Sync with Unmount Safety

```typescript
function useFormStackURLSync(options) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const syncStackToUrl = useCallback((formIds: readonly string[]) => {
    // Use requestAnimationFrame for safety
    requestAnimationFrame(() => {
      if (!isMountedRef.current) return;

      const url = buildFormStackUrl(formIds, paramName);
      if (typeof window !== 'undefined') {
        window.history.pushState({ formIds }, '', url);
      }
    });
  }, [paramName]);

  const restoreFromUrl = useCallback(() => {
    const urlFormIds = getUrlState();

    if (urlFormIds.length > 0 && isMountedRef.current) {
      setIsRestoring(true);
      onRestore?.(urlFormIds);

      // Ensure we don't update if unmounted during async operation
      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          setIsRestoring(false);
        }
      });
    }
  }, [getUrlState, onRestore]);

  return { syncStackToUrl, restoreFromUrl };
}
```

#### Cleanup Pattern for Event Listeners

```typescript
function useUrlSync() {
  const popStateHandlerRef = useRef<((event: PopStateEvent) => void) | null>(null);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Handle popstate
    };

    popStateHandlerRef.current = handlePopState;
    window.addEventListener('popstate', handlePopState);

    return () => {
      // Cleanup: remove the specific listener we added
      if (popStateHandlerRef.current) {
        window.removeEventListener('popstate', popStateHandlerRef.current);
      }
    };
  }, []);
}
```

### Key Benefits

1. **Prevents Warnings**: Eliminates "update on unmounted component" warnings
2. **Memory Safety**: Prevents memory leaks from orphaned operations
3. **Clean Shutdown**: Proper cleanup of resources
4. **Predictable Behavior**: Component unmount is clean and reliable

### Authoritative Sources

- **React Documentation - Removing Event Listeners**: https://react.dev/learn/synchronizing-with-effects#removing-event-listeners
- **React Documentation - Effect Cleanup**: https://react.dev/learn/synchronizing-with-effects#each-effect-represents-a-separate-synchronization-process
- **Kent C. Dodds - How to Avoid Memory Leaks in React**: https://kentcdodds.com/blog/useeffect-is-not-the-lifecycle-method-you-think-it-is
- **Dan Abramov - Throwing Away the isMounted Anti-Pattern**: https://overreacted.io/a-complete-guide-to-useeffect/#-but-i-cant-put-a-function-in-a-ref-but-i-need-to (Note: isMounted is discouraged, but refs for tracking are still useful)

---

## 5. Pending Update Coalescing Patterns

### Pattern Description

Batch multiple rapid updates into a single update to reduce redundant operations and prevent race conditions. This is especially important for URL updates which can be expensive.

### When to Use

- Rapid state changes (typing, dragging, resizing)
- Multiple dependent state updates
- Expensive sync operations (URL, localStorage, network)
- High-frequency events (scroll, mousemove, resize)

### Code Examples

#### Basic Coalescing with requestAnimationFrame

```typescript
function useCoalescedUpdate<T>(updateFn: (value: T) => void) {
  const pendingUpdateRef = useRef<T | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const scheduleUpdate = useCallback((value: T) => {
    // Store the latest value
    pendingUpdateRef.current = value;

    // Cancel any pending update
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Schedule new update
    rafIdRef.current = requestAnimationFrame(() => {
      if (pendingUpdateRef.current !== null) {
        updateFn(pendingUpdateRef.current);
        pendingUpdateRef.current = null;
      }
      rafIdRef.current = null;
    });
  }, [updateFn]);

  useEffect(() => {
    return () => {
      // Cleanup: cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return scheduleUpdate;
}
```

#### Debounced URL Updates

```typescript
function useDebouncedUrlSync(stack: readonly { id: string }[], delay: number = 100) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStackRef = useRef<readonly string[]>([]);

  useEffect(() => {
    // Store latest stack
    latestStackRef.current = stack.map(e => e.id);

    // Clear existing timeout
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new update
    timeoutRef.current = setTimeout(() => {
      const url = buildFormStackUrl(latestStackRef.current, 'forms');
      window.history.replaceState({ formIds: latestStackRef.current }, '', url);
      timeoutRef.current = null;
    }, delay);

    return () => {
      // Cleanup
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stack, delay]);
}
```

#### Batched Updates with useState Queue

```typescript
function useBatchedUpdates<T>(batchDelay: number = 0) {
  const [batch, setBatch] = useState<T[]>([]);
  const batchRef = useRef<T[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToBatch = useCallback((item: T) => {
    batchRef.current.push(item);

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setBatch([...batchRef.current]);
      batchRef.current = [];
      timeoutRef.current = null;
    }, batchDelay);
  }, [batchDelay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { batch, addToBatch };
}
```

#### Throttled Updates for High-Frequency Events

```typescript
function useThrottledUpdate<T>(updateFn: (value: T) => void, throttleMs: number = 100) {
  const lastUpdateRef = useRef<number>(0);
  const pendingValueRef = useRef<T | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const throttledUpdate = useCallback((value: T) => {
    const now = Date.now();
    pendingValueRef.current = value;

    if (now - lastUpdateRef.current >= throttleMs) {
      // Enough time has passed, update immediately
      updateFn(value);
      lastUpdateRef.current = now;
      pendingValueRef.current = null;
    } else {
      // Schedule update for later
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (pendingValueRef.current !== null) {
          updateFn(pendingValueRef.current);
          lastUpdateRef.current = Date.now();
          pendingValueRef.current = null;
        }
        timeoutRef.current = null;
      }, throttleMs - (now - lastUpdateRef.current));
    }
  }, [updateFn, throttleMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledUpdate;
}
```

### Key Benefits

1. **Performance**: Reduces redundant operations
2. **Race Condition Prevention**: Only the latest update is applied
3. **Resource Efficiency**: Fewer DOM mutations, repaints, and network requests
4. **Smooth UX**: Prevents UI thrashing from rapid updates

### Authoritative Sources

- **React Documentation - You Might Not Need an Effect**: https://react.dev/blog/2023/06/15/react-labs-what-we-have-been-working-on-june-2023 (Batching patterns)
- **MDN - requestAnimationFrame**: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
- **React Documentation - Manipulating the DOM with Refs**: https://react.dev/learn/referencing-values-with-refs (Ref patterns for coalescing)

---

## 6. URL Sync Specific Patterns

### Pattern Description

URL synchronization has unique challenges: browser history API, popstate events, back/forward navigation, and the need to keep URL and state in sync without creating loops.

### When to Use

- Any hook that syncs state with URL query parameters
- Multi-step wizards with shareable URLs
- Filter/search state persistence
- Form state that should be bookmarkable

### Code Examples

#### URL Sync with Lock Pattern

```typescript
function useFormStackURLSync(options) {
  const syncLockRef = useRef(false);
  const [stack] = useFormStackState();

  const syncStackToUrl = useCallback((formIds: readonly string[]) => {
    // Check lock to prevent loops
    if (syncLockRef.current) return;

    const url = buildFormStackUrl(formIds, paramName);
    const historyState = { [paramName]: [...formIds] };

    syncLockRef.current = true;
    try {
      window.history.pushState(historyState, '', url);
    } finally {
      // Release lock in next tick
      requestAnimationFrame(() => {
        syncLockRef.current = false;
      });
    }
  }, [paramName]);

  const handlePopstate = useCallback((event: PopStateEvent) => {
    // Set lock to prevent sync back to URL
    syncLockRef.current = true;

    const formIds = event.state?.[paramName] ?? parseFormStackUrl(paramName);

    // Update state from URL
    // ... state update logic

    requestAnimationFrame(() => {
      syncLockRef.current = false;
    });
  }, [paramName]);

  useEffect(() => {
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [handlePopstate]);
}
```

#### Version-Based Update Tracking

```typescript
function useFormStackURLSync(options) {
  const updateVersionRef = useRef(0);
  const urlVersionRef = useRef(0);

  const syncStackToUrl = useCallback((formIds: readonly string[]) => {
    // Increment update version
    const currentVersion = ++updateVersionRef.current;

    // Schedule URL update
    requestAnimationFrame(() => {
      // Only proceed if this is still the latest version
      if (currentVersion === updateVersionRef.current) {
        const url = buildFormStackUrl(formIds, paramName);
        window.history.pushState({ version: currentVersion, formIds }, '', url);
        urlVersionRef.current = currentVersion;
      }
    });
  }, [paramName]);

  const handlePopstate = useCallback((event: PopStateEvent) => {
    const stateVersion = event.state?.version ?? 0;

    // Only process if this is a new version
    if (stateVersion !== urlVersionRef.current) {
      urlVersionRef.current = stateVersion;
      const formIds = event.state?.formIds ?? parseFormStackUrl(paramName);
      // Update state from URL
    }
  }, [paramName]);
}
```

#### Dual Direction Sync with State Machine

```typescript
type SyncState = 'IDLE' | 'SYNCING_TO_URL' | 'SYNCING_FROM_URL';

function useFormStackURLSync(options) {
  const [syncState, setSyncState] = useState<SyncState>('IDLE');
  const syncStateRef = useRef<SyncState>('IDLE');
  const [stack] = useFormStackState();

  // Keep ref in sync
  useEffect(() => {
    syncStateRef.current = syncState;
  }, [syncState]);

  const syncStackToUrl = useCallback((formIds: readonly string[]) => {
    // Only sync if idle
    if (syncStateRef.current !== 'IDLE') return;

    setSyncState('SYNCING_TO_URL');

    requestAnimationFrame(() => {
      const url = buildFormStackUrl(formIds, paramName);
      window.history.pushState({ formIds }, '', url);
      setSyncState('IDLE');
    });
  }, [paramName]);

  const handlePopstate = useCallback((event: PopStateEvent) => {
    // Only process if idle
    if (syncStateRef.current !== 'IDLE') return;

    setSyncState('SYNCING_FROM_URL');

    const formIds = event.state?.formIds ?? parseFormStackUrl(paramName);

    // Update state from URL
    // ...

    requestAnimationFrame(() => {
      setSyncState('IDLE');
    });
  }, [paramName]);
}
```

### Key Benefits

1. **Loop Prevention**: Prevents infinite sync loops
2. **Direction Awareness**: Knows which direction (state→URL or URL→state) is syncing
3. **Version Tracking**: Can detect and handle stale updates
4. **State Machine**: Clear states prevent race conditions

### Authoritative Sources

- **React Router Documentation - Navigation State**: https://reactrouter.com/en/main/guides/navigation (URL state patterns)
- **MDN - History API**: https://developer.mozilla.org/en-US/docs/Web/API/History_API
- **React Documentation - Integrating with External Systems**: https://react.dev/learn/synchronizing-with-effects#integrating-with-third-party-systems

---

## 7. Current Codebase Analysis

### Existing Implementation (useFormStackURLSync.ts)

**Location**: `/home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts`

**Current Race Condition Mitigation**:
1. ✅ Uses `isRestoringRef` to prevent updates during restoration
2. ✅ Uses `setTimeout(..., 0)` for async cleanup
3. ⚠️  No pending operation coalescing for rapid stack changes
4. ⚠️  No AbortController for cancellation
5. ⚠️  No version tracking for update ordering
6. ⚠️  No useTransition/useDeferredValue for concurrent rendering

**Identified Issues**:

1. **Race Condition in syncStackToUrl** (lines 128-143):
   - No cancellation of pending URL updates
   - Rapid stack changes could cause multiple URL updates
   - Only prevents updates during `isRestoringRef`

2. **Race Condition in restoreFromUrl** (lines 151-176):
   - Uses `setTimeout(..., 0)` which is not guaranteed order
   - No cleanup if component unmounts during restoration
   - No AbortController for cancellation

3. **Race Condition in popstate handler** (lines 179-214):
   - Uses `setTimeout(..., 0)` for cleanup
   - No protection against rapid back/forward clicks
   - No version tracking to detect stale events

4. **Missing Coalescing** (lines 227-247):
   - Every stack change triggers immediate URL update
   - No debouncing/throttling for rapid changes
   - No requestAnimationFrame batching

**Current Ref Usage**:
```typescript
const isRestoringRef = useRef(false);        // Prevents updates during restoration
const prevStackRef = useRef<readonly { id: string }[]>([]);  // Previous stack for diffing
const isInitializedRef = useRef(false);      // Track initialization
```

---

## 8. Recommended Implementation

### Combined Pattern for useFormStackURLSync

```typescript
import { useEffect, useRef, useCallback, useState, useTransition } from 'react';
import { useFormStackState } from './useFormStackState';
import { useFormStackActions } from './useFormStackActions';
import { buildFormStackUrl, parseFormStackUrl } from '../utils';

export function useFormStackURLSync(
  options: UseFormStackURLSyncOptions = {}
): UseFormStackURLSyncReturn {
  const {
    paramName = 'forms',
    restoreOnMount = true,
    syncToUrl = true,
    syncFromUrl = true,
    onRestore,
  } = options;

  const { stack } = useFormStackState();
  const { popToIndex } = useFormStackActions();

  const [isRestoring, setIsRestoring] = useState(false);
  const [isPending, startTransition] = useTransition();

  // === PATTERN 1: Pending Update Tracking ===
  const pendingUpdateRef = useRef<number>(0);
  const latestStackRef = useRef<readonly string[]>([]);

  // === PATTERN 2: isMountedRef for Unmount Safety ===
  const isMountedRef = useRef(true);

  // === PATTERN 3: Sync State Machine ===
  type SyncState = 'IDLE' | 'SYNCING_TO_URL' | 'SYNCING_FROM_URL';
  const syncStateRef = useRef<SyncState>('IDLE');

  // Track initialization
  const isInitializedRef = useRef(false);

  // === PATTERN 4: AbortController for Cancellation ===
  const abortControllerRef = useRef<AbortController | null>(null);

  // === MOUNT SAFETY ===
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cancel any pending operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Get form IDs from stack
  const getStackIds = useCallback(() => {
    return stack.map((entry) => entry.id);
  }, [stack]);

  // Get form IDs from URL
  const getUrlState = useCallback(() => {
    if (typeof window === 'undefined') return [];
    return parseFormStackUrl(paramName);
  }, [paramName]);

  // === PATTERN 5: Coalesced URL Update ===
  const syncStackToUrl = useCallback(
    (formIds: readonly string[], usePushState: boolean = true) => {
      if (typeof window === 'undefined') return;

      // Don't sync if syncing from URL
      if (syncStateRef.current === 'SYNCING_FROM_URL') return;

      // Store the latest stack
      latestStackRef.current = formIds;

      // Increment update counter
      const updateId = ++pendingUpdateRef.current;

      // Use requestAnimationFrame to coalesce rapid updates
      requestAnimationFrame(() => {
        // Only proceed if still mounted and this is the latest update
        if (!isMountedRef.current) return;
        if (updateId !== pendingUpdateRef.current) return;

        // Mark as syncing
        syncStateRef.current = 'SYNCING_TO_URL';

        // Use transition for non-blocking update
        startTransition(() => {
          const url = buildFormStackUrl(formIds, paramName);
          const historyState = { [paramName]: [...formIds], version: updateId };

          if (usePushState) {
            window.history.pushState(historyState, '', url);
          } else {
            window.history.replaceState(historyState, '', url);
          }

          // Reset sync state
          requestAnimationFrame(() => {
            if (isMountedRef.current) {
              syncStateRef.current = 'IDLE';
            }
          });
        });
      });
    },
    [paramName]
  );

  // Force URL update (utility method)
  const forceUrlUpdate = useCallback(() => {
    syncStackToUrl(getStackIds(), false);
  }, [syncStackToUrl, getStackIds]);

  // === PATTERN 6: Safe Restore from URL ===
  const restoreFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Cancel any pending operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const urlFormIds = getUrlState();

    if (urlFormIds.length > 0 && isMountedRef.current) {
      syncStateRef.current = 'SYNCING_FROM_URL';
      setIsRestoring(true);

      // Call onRestore callback if provided
      onRestore?.(urlFormIds);

      // Set up the initial history state
      window.history.replaceState(
        { [paramName]: urlFormIds, version: pendingUpdateRef.current },
        '',
        window.location.href
      );

      // Use requestAnimationFrame for safe async cleanup
      requestAnimationFrame(() => {
        if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
          setIsRestoring(false);
          syncStateRef.current = 'IDLE';
        }
      });
    }
  }, [getUrlState, paramName, onRestore, pendingUpdateRef]);

  // === PATTERN 7: Safe popstate Handler ===
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!syncFromUrl) return;

    const handlePopstate = (event: PopStateEvent) => {
      // Don't process if syncing to URL
      if (syncStateRef.current === 'SYNCING_TO_URL') return;

      // Don't process if not mounted
      if (!isMountedRef.current) return;

      syncStateRef.current = 'SYNCING_FROM_URL';

      // Get form IDs from event state or parse URL
      const formIds: string[] =
        event.state?.[paramName] ?? parseFormStackUrl(paramName);

      // Compare with current stack and adjust
      const currentIds = getStackIds();

      if (formIds.length < currentIds.length) {
        // Forms were closed via back button - pop to the right index
        const targetIndex = formIds.length - 1;
        if (targetIndex >= 0) {
          popToIndex(targetIndex);
        } else {
          // All forms closed - pop all
          popToIndex(-1);
        }
      }

      // Safe async cleanup
      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          syncStateRef.current = 'IDLE';
        }
      });
    };

    window.addEventListener('popstate', handlePopstate);
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, [syncFromUrl, paramName, getStackIds, popToIndex]);

  // Initialize from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitializedRef.current) return;
    if (!restoreOnMount) return;

    isInitializedRef.current = true;
    restoreFromUrl();
  }, [restoreOnMount, restoreFromUrl]);

  // Sync stack changes to URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!syncToUrl) return;
    if (!isInitializedRef.current) return;

    const currentIds = getStackIds();

    // Use coalesced sync
    syncStackToUrl(currentIds, true);
  }, [stack, syncToUrl, getStackIds, syncStackToUrl]);

  return {
    isRestoring,
    getUrlState,
    forceUrlUpdate,
    isUrlUpdatePending: isPending,
  };
}
```

### Key Improvements

1. **✅ Pending Update Coalescing**: Uses `requestAnimationFrame` and version tracking
2. **✅ Unmount Safety**: `isMountedRef` prevents updates after unmount
3. **✅ Cancellation**: `AbortController` for cancelling operations
4. **✅ State Machine**: Clear sync states prevent race conditions
5. **✅ Concurrent Rendering**: `useTransition` for non-blocking updates
6. **✅ Loop Prevention**: Direction-aware sync prevents infinite loops

---

## Summary and Recommendations

### Pattern Selection Guide

| Pattern | Use Case | Complexity | React Version |
|---------|----------|------------|---------------|
| useRef Pending Update | General async operations | Low | Any |
| useTransition | Expensive UI updates, user interactions | Medium | 18+ |
| useDeferredValue | Expensive computations, search/filter | Low | 18+ |
| isMountedRef | Unmount safety for async ops | Low | Any |
| AbortController | Fetch cancellation, cleanup | Low | Any |
| RequestAnimationFrame | UI coalescing, batching | Medium | Any |
| State Machine | Complex bidirectional sync | High | Any |

### For useFormStackURLSync

**Recommended Combination**:
1. ✅ `isMountedRef` - Required for unmount safety
2. ✅ `pendingUpdateRef` + `requestAnimationFrame` - For coalescing rapid updates
3. ✅ `syncStateRef` (State Machine) - For preventing sync loops
4. ✅ `useTransition` - For non-blocking URL updates
5. ✅ `AbortController` - For cleanup and cancellation

### Testing Strategy

```typescript
describe('useFormStackURLSync Race Conditions', () => {
  it('should coalesce rapid stack changes', async () => {
    // Test rapid updates
  });

  it('should not update URL after unmount', async () => {
    // Test unmount safety
  });

  it('should handle rapid back/forward navigation', async () => {
    // Test popstate coalescing
  });

  it('should prevent sync loops', async () => {
    // Test state machine
  });

  it('should cancel pending operations on unmount', async () => {
    // Test AbortController
  });
});
```

---

## Additional Resources

### React Documentation
- [React 18 Concurrent Features](https://react.dev/blog/2022/03/29/react-v18)
- [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [useTransition Reference](https://react.dev/reference/react/useTransition)
- [useDeferredValue Reference](https://react.dev/reference/react/useDeferredValue)
- [Effect Cleanup](https://react.dev/learn/synchronizing-with-effects#removing-event-listeners)

### Community Resources
- [Kent C. Dodds - React Hooks](https://kentcdodds.com/blog/useeffect-is-not-the-lifecycle-method-you-think-it-is)
- [Dan Abramov - Overreacted](https://overreacted.io/a-complete-guide-to-useeffect/)
- [MDN - Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)

### URL Sync Specific
- [History API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
- [React Router Navigation](https://reactrouter.com/en/main/guides/navigation)
- [URL State Management Patterns](https://reactrouter.com/en/main/guides/navigation#url-state)

---

**Last Updated**: 2026-01-11
**Document Version**: 1.0
**Status**: Ready for Implementation
