# URL Synchronization Race Conditions: Research & Mitigation Strategies

**Date:** 2025-01-11
**Research Focus:** Race conditions in bidirectional URL synchronization implementations
**Related Issue:** P1.M2.T1.S1 - URL sync race condition analysis

---

## Executive Summary

URL synchronization race conditions occur when there are timing conflicts between:
- **State updates** (React state changes)
- **URL updates** (pushState/replaceState calls)
- **Browser navigation events** (popstate events)

This document analyzes common race condition scenarios, failure modes, and mitigation strategies based on real-world patterns, React Router's approach, and community solutions.

---

## Table of Contents

1. [Race Condition Scenarios](#race-condition-scenarios)
2. [Common Failure Modes](#common-failure-modes)
3. [Analysis of Current Implementation](#analysis-of-current-implementation)
4. [Mitigation Strategies](#mitigation-strategies)
5. [React Router's Approach](#react-routers-approach)
6. [Community Patterns & Solutions](#community-patterns--solutions)
7. [Testing Race Conditions](#testing-race-conditions)
8. [Recommendations](#recommendations)

---

## Race Condition Scenarios

### Scenario 1: Rapid State Updates + Browser Navigation

**Description:** User rapidly opens multiple forms while simultaneously clicking back/forward.

**Sequence of Events:**
```
1. User opens Form A → pushState(forms=[A])
2. User opens Form B → pushState(forms=[A,B])
3. User clicks back before pushState(B) completes → popstate fires
4. Race: popstate handler runs的同时 pushState(B) is in progress
```

**Problem:** The popstate handler may read stale state or overwrite the pending pushState.

**Current Code Analysis (useFormStackURLSync.ts:179-214):**
```typescript
const handlePopstate = (event: PopStateEvent) => {
  isRestoringRef.current = true;

  const formIds: string[] =
    event.state?.[paramName] ?? parseFormStackUrl(paramName);

  const currentIds = getStackIds();

  if (formIds.length < currentIds.length) {
    const targetIndex = formIds.length.length - 1;
    if (targetIndex >= 0) {
      popToIndex(targetIndex);  // ⚠️ This triggers state update
    }
  }

  setTimeout(() => {
    isRestoringRef.current = false;
  }, 0);
};
```

**Issue:** The `isRestoringRef` flag is set to `true` synchronously, but `popToIndex` triggers a state update that may not complete before `setTimeout` resets the flag. This creates a window where URL sync can re-engage prematurely.

---

### Scenario 2: Multiple State Updates Queue Before Browser Processing

**Description:** Multiple rapid form operations queue before the browser processes history changes.

**Sequence of Events:**
```
1. Component renders → syncToUrl effect scheduled
2. User opens Form A → stack update #1 scheduled
3. User opens Form B → stack update #2 scheduled
4. React batches updates → single re-render with stack=[A,B]
5. syncToUrl effect runs → pushState(forms=[A,B])
6. BUT: User clicked back during step 3 → popstate event queued
7. Race: Which runs first - pushState or popstate?
```

**Current Code Analysis (useFormStackURLSync.ts:227-247):**
```typescript
useEffect(() => {
  if (!syncToUrl) return;
  if (!isInitializedRef.current) return;

  const currentIds = getStackIds();
  const prevIds = prevStackRef.current.map((e) => e.id);

  if (
    currentIds.length !== prevIds.length ||
    currentIds.some((id, i) => id !== prevIds[i])
  ) {
    const isAdding = currentIds.length > prevIds.length;
    syncStackToUrl(currentIds, isAdding);  // ⚠️ No lock check here
  }

  prevStackRef.current = stack;
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);
```

**Issue:** The effect doesn't check `isRestoringRef.current` before calling `syncStackToUrl`. If popstate is processing, this effect can still trigger and overwrite the URL.

---

### Scenario 3: Component Unmounts During Async URL Update

**Description:** Component unmounts while a URL update is in progress.

**Sequence of Events:**
```
1. User opens Form A → stack changes
2. syncToUrl effect triggered
3. syncStackToUrl called (not yet executed)
4. Parent component unmounts (user navigates away)
5. syncStackToUrl finally executes → attempts to update URL of unmounted component
```

**Current Code Analysis (useFormStackURLSync.ts:128-143):**
```typescript
const syncStackToUrl = useCallback(
  (formIds: readonly string[], usePushState: boolean = true) => {
    if (typeof window === 'undefined') return;
    if (isRestoringRef.current) return;  // ✅ Checks restore flag

    const url = buildFormStackUrl(formIds, paramName);
    const historyState = { [paramName]: [...formIds] };

    if (usePushState) {
      window.history.pushState(historyState, '', url);
    } else {
      window.history.replaceState(historyState, '', url);
    }
  },
  [paramName]
);
```

**Issue:** No mounted state check. The callback can execute after unmount, causing:
- Memory leaks (closure references)
- Updates to incorrect URL state
- React warnings about state updates on unmounted components

---

## Common Failure Modes

### Failure Mode 1: Popstate Fires Before URL Sync Effect

**Symptoms:**
- URL shows correct state, but component shows stale state
- Back button appears to do nothing
- State desync between URL and UI

**Example from current implementation:**
```typescript
// User opens form A
stack = [A]
syncToUrl effect scheduled → NOT YET RUN

// User clicks back IMMEDIATELY
popstate fires → handles navigation
syncToUrl effect runs → OVERWRITES the popstate update!
```

**Root Cause:** Missing guard in syncToUrl effect:
```typescript
useEffect(() => {
  // ❌ Missing: if (isRestoringRef.current) return;
  const currentIds = getStackIds();
  // ... sync logic
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);
```

---

### Failure Mode 2: Infinite Update Loop

**Symptoms:**
- Browser hangs
- Console shows "Maximum update depth exceeded"
- URL flickers between states

**Example Scenario:**
```typescript
// popstate handler
const handlePopstate = (event) => {
  setFormStack(event.state.formStack);  // Triggers state update
};

// syncToUrl effect
useEffect(() => {
  syncStackToUrl(formStack);  // Calls pushState
}, [formStack]);

// If pushState somehow triggers another state update:
// popstate → setState → effect → pushState → popstate → ...
```

**Root Cause:** Circular dependency between state and URL.

**Current Implementation Protection:**
```typescript
const syncStackToUrl = useCallback(
  (formIds, usePushState = true) => {
    if (isRestoringRef.current) return;  // ✅ Prevents loop
    // ...
  },
  [paramName]
);
```

**Gap:** The syncToUrl *effect* doesn't check this flag:
```typescript
useEffect(() => {
  // ❌ No check for isRestoringRef.current
  syncStackToUrl(currentIds, isAdding);
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);
```

---

### Failure Mode 3: Stale Closure References

**Symptoms:**
- URL updates with old state values
- Back button restores wrong state
- State appears "stuck" in time

**Example Scenario:**
```typescript
// Mount: stack = []
const getStackIds = useCallback(() => {
  return stack.map((entry) => entry.id);  // ❌ Captures stack in closure
}, [stack]);

// Later: stack = [A, B]
syncStackToUrl(getStackIds(), true);  // ✅ Uses latest stack

// But in popstate handler:
useEffect(() => {
  const handlePopstate = (event) => {
    const currentIds = getStackIds();  // ⚠️ Uses closure from effect mount time
    // ...
  };
}, [getStackIds]);  // Dependency includes getStackIds
```

**Current Implementation Status:** ✅ **PROTECTED**
- `getStackIds` is in dependency array
- Effect re-runs when stack changes
- Fresh closure captured each time

---

### Failure Mode 4: Race Between Multiple Hooks/Components

**Symptoms:**
- URL flickers between different states
- Last write wins unpredictably
- Console errors about conflicting updates

**Example Scenario:**
```typescript
// Component 1: FormStack with paramName='forms'
useFormStackURLSync({ paramName: 'forms' });

// Component 2: FilterStack with paramName='forms' (CONFLICT!)
useFormStackURLSync({ paramName: 'forms' });

// Both try to sync to same URL parameter:
// Component 1: pushState({ forms: ['form-A'] }, '', '?forms=form-A')
// Component 2: pushState({ forms: ['filter-x'] }, '', '?forms=filter-x')
// Race: Which URL wins?
```

**Current Implementation:** No conflict detection. Assumes single instance per paramName.

---

## Analysis of Current Implementation

### File: `/home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts`

#### Identified Race Condition Risks

| Risk | Severity | Status | Description |
|------|----------|--------|-------------|
| **Missing guard in syncToUrl effect** | 🔴 HIGH | **VULNERABLE** | Effect doesn't check `isRestoringRef` before syncing |
| **setTimeout delay flag reset** | 🟡 MEDIUM | **AT RISK** | Using `setTimeout(..., 0)` may not guarantee order |
| **No mounted state tracking** | 🟡 MEDIUM | **VULNERABLE** | Updates can execute after unmount |
| **Stale closure in popstate handler** | 🟢 LOW | **PROTECTED** | Dependencies properly tracked |
| **Multiple instance conflicts** | 🟡 MEDIUM | **VULNERABLE** | No singleton enforcement per paramName |

#### Code Analysis: Critical Sections

**1. syncToUrl Effect (Lines 227-247) - VULNERABLE**
```typescript
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!syncToUrl) return;
  if (!isInitializedRef.current) return;

  // ❌ MISSING: if (isRestoringRef.current) return;

  const currentIds = getStackIds();
  const prevIds = prevStackRef.current.map((e) => e.id);

  if (currentIds.length !== prevIds.length ||
      currentIds.some((id, i) => id !== prevIds[i])) {
    const isAdding = currentIds.length > prevIds.length;
    syncStackToUrl(currentIds, isAdding);  // ⚠️ Can run during popstate
  }

  prevStackRef.current = stack;
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);
```

**Race Condition:**
```
Timeline:
T0: User clicks back button
T1: popstate fires, sets isRestoringRef.current = true
T2: popstate calls popToIndex(0) → triggers stack change
T3: syncToUrl effect runs (stack changed)
T4: ❌ syncStackToUrl called WITHOUT checking isRestoringRef
T5: pushState overwrites the popstate navigation
T6: setTimeout(() => { isRestoringRef.current = false }, 0) executes
```

**2. popstate Handler (Lines 179-214) - AT RISK**
```typescript
const handlePopstate = (event: PopStateEvent) => {
  isRestoringRef.current = true;

  const formIds: string[] =
    event.state?.[paramName] ?? parseFormStackUrl(paramName);

  const currentIds = getStackIds();

  if (formIds.length < currentIds.length) {
    const targetIndex = formIds.length - 1;
    if (targetIndex >= 0) {
      popToIndex(targetIndex);  // ⚠️ Async state update
    }
  }

  setTimeout(() => {
    isRestoringRef.current = false;
  }, 0);  // ⚠️ Flag reset before popToIndex completes
};
```

**Race Condition:**
```
Timeline:
T0: popstate fires
T1: isRestoringRef.current = true
T2: popToIndex(0) called → setState queued
T3: setTimeout(() => { flag = false }, 0) queued
T4: setTimeout executes BEFORE setState completes
T5: flag = false, but state not yet updated
T6: syncToUrl effect runs (sees stack change)
T7: ❌ pushState overwrites popstate result
```

**3. syncStackToUrl Callback (Lines 128-143) - PROTECTED**
```typescript
const syncStackToUrl = useCallback(
  (formIds: readonly string[], usePushState: boolean = true) => {
    if (typeof window === 'undefined') return;
    if (isRestoringRef.current) return;  // ✅ Guard present

    const url = buildFormStackUrl(formIds, paramName);
    const historyState = { [paramName]: [...formIds] };

    if (usePushState) {
      window.history.pushState(historyState, '', url);
    } else {
      window.history.replaceState(historyState, '', url);
    }
  },
  [paramName]
);
```

**Status:** ✅ Has restoration guard, but vulnerable to timing window.

---

## Mitigation Strategies

### Strategy 1: Transaction-Based Locking

**Concept:** Treat URL updates as transactions with exclusive locks.

**Implementation Pattern:**
```typescript
export function useFormStackURLSync(options = {}) {
  const [isRestoring, setIsRestoring] = useState(false);
  const isRestoringRef = useRef(false);
  const pendingUpdateRef = useRef(null);
  const isMountedRef = useRef(true);

  // Enhanced sync with transaction locking
  const syncStackToUrl = useCallback(
    (formIds, usePushState = true) => {
      if (typeof window === 'undefined') return;
      if (!isMountedRef.current) return;  // ✅ Mount check
      if (isRestoringRef.current) {
        // ✅ Queue update if restoring
        pendingUpdateRef.current = { formIds, usePushState };
        return;
      }

      const url = buildFormStackUrl(formIds, paramName);
      const historyState = { [paramName]: [...formIds] };

      if (usePushState) {
        window.history.pushState(historyState, '', url);
      } else {
        window.history.replaceState(historyState, '', url);
      }
    },
    [paramName]
  );

  // Enhanced popstate handler
  useEffect(() => {
    const handlePopstate = (event) => {
      if (isRestoringRef.current) return;  // ✅ Prevent re-entrancy

      isRestoringRef.current = true;
      setIsRestoring(true);

      const formIds: string[] =
        event.state?.[paramName] ?? parseFormStackUrl(paramName);

      const currentIds = getStackIds();

      if (formIds.length < currentIds.length) {
        const targetIndex = formIds.length - 1;
        if (targetIndex >= 0) {
          popToIndex(targetIndex);
        }
      }

      // ✅ Wait for state to stabilize before releasing lock
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isRestoringRef.current = false;
          setIsRestoring(false);

          // ✅ Process pending update
          if (pendingUpdateRef.current) {
            const { formIds, usePushState } = pendingUpdateRef.current;
            pendingUpdateRef.current = null;
            syncStackToUrl(formIds, usePushState);
          }
        });
      });
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [paramName, getStackIds, popToIndex, syncStackToUrl]);

  // ✅ Guard in syncToUrl effect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!syncToUrl) return;
    if (!isInitializedRef.current) return;
    if (isRestoringRef.current) return;  // ✅ Added guard

    const currentIds = getStackIds();
    const prevIds = prevStackRef.current.map((e) => e.id);

    if (
      currentIds.length !== prevIds.length ||
      currentIds.some((id, i) => id !== prevIds[i])
    ) {
      const isAdding = currentIds.length > prevIds.length;
      syncStackToUrl(currentIds, isAdding);
    }

    prevStackRef.current = stack;
  }, [stack, syncToUrl, getStackIds, syncStackToUrl]);

  // ✅ Mount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    isRestoring,
    getUrlState,
    forceUrlUpdate,
  };
}
```

**Benefits:**
- ✅ Prevents concurrent URL updates
- ✅ Queues updates during restoration
- ✅ Prevents updates after unmount
- ✅ Double-RAF ensures state stabilization

**Trade-offs:**
- Slight delay in URL updates (2 frames)
- More complex state management
- Potential for queued updates to pile up

---

### Strategy 2: Versioned State

**Concept:** Track state versions to detect and reject stale updates.

**Implementation Pattern:**
```typescript
export function useFormStackURLSync(options = {}) {
  const [stateVersion, setStateVersion] = useState(0);
  const urlVersionRef = useRef(0);

  const syncStackToUrl = useCallback(
    (formIds, usePushState, expectedVersion) => {
      if (typeof window === 'undefined') return;

      // ✅ Reject if state has moved on
      if (expectedVersion !== stateVersion) {
        console.warn('Stale URL update rejected');
        return;
      }

      const url = buildFormStackUrl(formIds, paramName);
      const historyState = {
        [paramName]: [...formIds],
        _version: expectedVersion
      };

      if (usePushState) {
        window.history.pushState(historyState, '', url);
      } else {
        window.history.replaceState(historyState, '', url);
      }

      urlVersionRef.current = expectedVersion;
    },
    [paramName, stateVersion]
  );

  // Track state changes
  useEffect(() => {
    setStateVersion(v => v + 1);
  }, [stack]);

  // Sync with version check
  useEffect(() => {
    if (!syncToUrl) return;
    if (!isInitializedRef.current) return;

    const currentIds = getStackIds();
    const prevIds = prevStackRef.current.map((e) => e.id);

    if (
      currentIds.length !== prevIds.length ||
      currentIds.some((id, i) => id !== prevIds[i])
    ) {
      const isAdding = currentIds.length > prevIds.length;
      // ✅ Pass current version
      syncStackToUrl(currentIds, isAdding, stateVersion);
    }

    prevStackRef.current = stack;
  }, [stack, syncToUrl, getStackIds, syncStackToUrl, stateVersion]);

  const handlePopstate = (event) => {
    const urlVersion = event.state?._version;
    const currentVersion = urlVersionRef.current;

    // ✅ Ignore if popstate is older than current URL state
    if (urlVersion < currentVersion) {
      console.warn('Stale popstate ignored');
      return;
    }

    // ... handle popstate
  };
}
```

**Benefits:**
- ✅ Detects and rejects stale updates
- ✅ Prevents rollback to older states
- ✅ Provides debug logging

**Trade-offs:**
- Doesn't prevent concurrent updates, only detects them
- Requires version tracking overhead
- May lose legitimate updates in some race scenarios

---

### Strategy 3: Debounced URL Updates

**Concept:** Batch rapid state changes into single URL update.

**Implementation Pattern:**
```typescript
export function useFormStackURLSync(options = {}) {
  const syncTimerRef = useRef(null);
  const pendingStackRef = useRef(null);

  const syncStackToUrl = useCallback(
    (formIds, usePushState = true) => {
      if (typeof window === 'undefined') return;
      if (isRestoringRef.current) return;

      // ✅ Clear pending update
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      // ✅ Store pending state
      pendingStackRef.current = { formIds, usePushState };

      // ✅ Debounce by 100ms
      syncTimerRef.current = setTimeout(() => {
        const pending = pendingStackRef.current;
        if (!pending) return;

        const url = buildFormStackUrl(pending.formIds, paramName);
        const historyState = { [paramName]: [...pending.formIds] };

        if (pending.usePushState) {
          window.history.pushState(historyState, '', url);
        } else {
          window.history.replaceState(historyState, '', url);
        }

        pendingStackRef.current = null;
        syncTimerRef.current = null;
      }, 100);
    },
    [paramName]
  );

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  return { /* ... */ };
}
```

**Benefits:**
- ✅ Reduces URL update frequency
- ✅ Batches rapid changes naturally
- ✅ Prevents intermediate states from polluting history

**Trade-offs:**
- UI state temporarily ahead of URL state
- Back button behavior may feel "laggy"
- 100ms delay may be noticeable

---

### Strategy 4: Request-Response Pattern

**Concept:** Treat URL updates as async operations with completion callbacks.

**Implementation Pattern:**
```typescript
export function useFormStackURLSync(options = {}) {
  const updateQueueRef = useRef([]);
  const isUpdatingRef = useRef(false);

  const syncStackToUrl = useCallback(
    (formIds, usePushState = true) => {
      return new Promise((resolve) => {
        // ✅ Queue update
        updateQueueRef.current.push({ formIds, usePushState, resolve });

        // ✅ Process queue
        processUpdateQueue();
      });
    },
    [paramName]
  );

  const processUpdateQueue = useCallback(async () => {
    if (isUpdatingRef.current) return;
    if (updateQueueRef.current.length === 0) return;

    isUpdatingRef.current = true;

    while (updateQueueRef.current.length > 0) {
      const update = updateQueueRef.current.shift();
      const { formIds, usePushState, resolve } = update;

      const url = buildFormStackUrl(formIds, paramName);
      const historyState = { [paramName]: [...formIds] };

      if (usePushState) {
        window.history.pushState(historyState, '', url);
      } else {
        window.history.replaceState(historyState, '', url);
      }

      // ✅ Wait for browser to process
      await new Promise(r => requestAnimationFrame(r));

      resolve();
    }

    isUpdatingRef.current = false;
  }, [paramName]);

  // Use in effect
  useEffect(() => {
    if (!syncToUrl) return;

    const currentIds = getStackIds();
    const prevIds = prevStackRef.current.map((e) => e.id);

    if (
      currentIds.length !== prevIds.length ||
      currentIds.some((id, i) => id !== prevIds[i])
    ) {
      const isAdding = currentIds.length > prevIds.length;
      // ✅ Async update
      syncStackToUrl(currentIds, isAdding).then(() => {
        prevStackRef.current = stack;
      });
    }
  }, [stack, syncToUrl, getStackIds, syncStackToUrl]);
}
```

**Benefits:**
- ✅ Serializes URL updates
- ✅ Prevents concurrent modifications
- ✅ Provides completion guarantees

**Trade-offs:**
- Complex async flow
- Effects become async (React anti-pattern)
- Error handling complexity

---

## React Router's Approach

### How React Router v6 Handles URL Sync

**Key Implementation Pattern:**
```typescript
// Simplified React Router v6 pattern
function BrowserRouter({ children }) {
  const [location, setLocation] = useState(window.location);

  useEffect(() => {
    // ✅ Single popstate listener for entire app
    const handlePopstate = () => {
      setLocation(window.location);
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  // ✅ Navigation updates state synchronously
  const navigate = (to, options) => {
    if (options.replace) {
      window.history.replaceState(null, '', to);
    } else {
      window.history.pushState(null, '', to);
    }
    // ✅ Synchronous state update
    setLocation(createLocation(to));
  };

  return (
    <RouterContext.Provider value={{ location, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}
```

**Key Strategies:**
1. **Single source of truth** - Location state is the only source
2. **Synchronous updates** - State and URL updated together
3. **Centralized listener** - One popstate handler for entire app
4. **No bidirectional sync** - URL → State only, not State → URL (except navigation)

**Why This Avoids Race Conditions:**
- ✅ No separate "sync to URL" logic that can race with popstate
- ✅ State changes are always initiated by navigation (explicit)
- ✅ No automatic background syncing

**Applicability to Form Stack:**
This pattern doesn't directly apply because form stacks require automatic bidirectional sync (state changes should update URL automatically).

---

### React Router's useSearchParams Pattern

**Implementation:**
```typescript
function useSearchParams() {
  const { location } = useLocation();
  const navigate = useNavigate();

  const setSearchParams = useCallback(
    (init, options) => {
      const newSearchParams = createSearchParams(init);
      const newSearch = newSearchParams.toString();

      // ✅ Updates both URL and state atomically
      navigate(
        { ...location, search: newSearch },
        options
      );
    },
    [location, navigate]
  );

  // ✅ Derived state, not synced back
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  return [searchParams, setSearchParams];
}
```

**Key Insights:**
1. **Explicit updates only** - No automatic sync
2. **Atomic operations** - Each update is explicit and complete
3. **Derived state** - Search params derived from location, not stored separately

---

## Community Patterns & Solutions

### Pattern 1: nuqs Library (2024)

**Source:** https://nuqs.dev

**Approach:** Type-safe URL state with built-in debouncing and key isolation.

**Key Features:**
```typescript
import { useQueryState, parseAsString } from 'nuqs';

function SearchPage() {
  const [query, setQuery] = useQueryState(
    'q',
    parseAsString.withDefault('')
  );

  // ✅ Automatic debouncing (300ms default)
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

**Race Condition Prevention:**
1. **Debouncing** - Prevents rapid updates
2. **Key isolation** - Each param managed independently
3. **Batch updates** - Multiple params updated together
4. **Mount guard** - Checks component mounted state

**Implementation Snippet (simplified):**
```typescript
export function useQueryState(key, parser) {
  const [value, setValue] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parser.decode(params.get(key));
  });

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isMountedRef.current) return;

    // ✅ Debounced update
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);

      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, parser.encode(value));
      }

      const newUrl = `${window.location.pathname}?${params.toString()}`;

      // ✅ Uses transition for non-blocking updates
      startTransition(() => {
        window.history.replaceState(null, '', newUrl);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [key, value, parser]);

  useEffect(() => {
    const handlePopstate = () => {
      const params = new URLSearchParams(window.location.search);
      setValue(parser.decode(params.get(key)));
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [key, parser]);

  return [value, setValue];
}
```

---

### Pattern 2: serialize-query-params Library

**Source:** https://github.com/pbeshai/serialize-query-params

**Approach:** Explicit URL update management with encoding schemas.

**Key Features:**
```typescript
import { useQueryParams, StringParam, ArrayParam } from 'use-query-params';

function FilterPage() {
  const [query, setQuery] = useQueryParams({
    search: StringParam,
    tags: ArrayParam,
  });

  // ✅ Explicit updates, no automatic sync
  return (
    <button onClick={() => setQuery({ search: 'react' }, 'push')}>
      Search
    </button>
  );
}
```

**Race Condition Handling:**
1. **Explicit updates** - No automatic sync to race
2. **History method control** - Push vs replace is explicit
3. **Batch updates** - Multiple params updated atomically

---

### Pattern 3: Custom Hook with Transition Lock

**Community Solution from Stack Overflow:**
**Source:** https://stackoverflow.com/questions/71908094

**Pattern:**
```typescript
function useUrlState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) ?? initialValue;
  });

  const isTransitioningRef = useRef(false);

  useEffect(() => {
    const handlePopstate = () => {
      // ✅ Block updates during popstate
      isTransitioningRef.current = true;

      const params = new URLSearchParams(window.location.search);
      setValue(params.get(key) ?? initialValue);

      // ✅ Release lock after render
      requestAnimationFrame(() => {
        isTransitioningRef.current = false;
      });
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [key, initialValue]);

  useEffect(() => {
    // ✅ Skip during popstate
    if (isTransitioningRef.current) return;

    const params = new URLSearchParams(window.location.search);

    if (value === null || value === initialValue) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [key, value, initialValue]);

  return [value, setValue];
}
```

**Key Insights:**
1. **Transition flag** - Prevents sync during popstate
2. **Double RAF** - Ensures state stabilizes before releasing lock
3. **Simple and effective** - Minimal complexity

---

### Pattern 4: AbortController Pattern

**Modern Approach (2024):**
```typescript
function useUrlStateWithAbort(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const handlePopstate = () => {
      // ✅ Abort pending URL update
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const params = new URLSearchParams(window.location.search);
      setValue(params.get(key) ?? initialValue);
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [key, initialValue]);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (controller.signal.aborted) return;

    const params = new URLSearchParams(window.location.search);

    if (value !== null && value !== initialValue) {
      params.set(key, String(value));
    } else {
      params.delete(key);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;

    // ✅ Check aborted before update
    if (!controller.signal.aborted) {
      window.history.replaceState(null, '', newUrl);
    }

    return () => controller.abort();
  }, [key, value, initialValue]);

  return [value, setValue];
}
```

**Benefits:**
- ✅ Cancels stale updates immediately
- ✅ Modern API (AbortController)
- ✅ Clean cancellation semantics

---

## Testing Race Conditions

### Test Strategy 1: Rapid Sequential Operations

**Test Case:**
```typescript
describe('useFormStackURLSync race conditions', () => {
  it('should handle rapid form opens without desync', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

    // Rapidly open multiple forms
    act(() => {
      openForm('form-1');
      openForm('form-2');
      openForm('form-3');
    });

    await waitFor(() => {
      expect(result.current.getUrlState()).toEqual(['form-1', 'form-2', 'form-3']);
    });
  });

  it('should handle rapid form closes without desync', async () => {
    // Setup: Open 3 forms
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

    act(() => {
      openForm('form-1');
      openForm('form-2');
      openForm('form-3');
    });

    await waitFor(() => {
      expect(result.current.getUrlState()).toHaveLength(3);
    });

    // Rapidly close all forms
    act(() => {
      popToIndex(0);
      popToIndex(-1);
    });

    await waitFor(() => {
      expect(result.current.getUrlState()).toEqual([]);
    });
  });
});
```

---

### Test Strategy 2: Concurrent Navigation and State Updates

**Test Case:**
```typescript
it('should not lose state updates during popstate', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

  // Open forms
  act(() => {
    openForm('form-1');
    openForm('form-2');
  });

  await waitFor(() => {
    expect(result.current.getUrlState()).toEqual(['form-1', 'form-2']);
  });

  // Simulate back button while state update pending
  act(() => {
    // Queue state update
    openForm('form-3');

    // Immediately trigger popstate (before effect runs)
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { forms: ['form-1'] }
    }));
  });

  await waitFor(() => {
    // Should either be form-3 (state update won) or form-1 (popstate won)
    // But NOT corrupted state
    const state = result.current.getUrlState();
    expect(
      state.equals(['form-1', 'form-3']) ||
      state.equals(['form-1'])
    ).toBe(true);
  });
});
```

---

### Test Strategy 3: Component Unmount During Update

**Test Case:**
```typescript
it('should not update URL after unmount', async () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  const { unmount } = renderHook(() => useFormStackURLSync(), { wrapper });

  act(() => {
    openForm('form-1');
    openForm('form-2');
  });

  // Unmount before URL sync completes
  unmount();

  await waitFor(() => {
    // Should not error about updating unmounted component
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  consoleSpy.mockRestore();
});
```

---

### Test Strategy 4: Stress Test with Random Timing

**Test Case:**
```typescript
it('should handle random timing of operations', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

  // Perform random sequence of operations
  const operations = [];
  for (let i = 0; i < 20; i++) {
    const op = Math.random();
    if (op < 0.33) {
      operations.push(() => openForm(`form-${i}`));
    } else if (op < 0.66) {
      operations.push(() => popToIndex(Math.floor(Math.random() * 3)));
    } else {
      operations.push(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    }
  }

  // Execute with random delays
  for (const op of operations) {
    act(() => {
      op();
    });
    await new Promise(r => setTimeout(r, Math.random() * 50));
  }

  // Final state should be consistent
  await waitFor(() => {
    const state = result.current.getUrlState();
    const stack = getFormStack();
    expect(state).toEqual(stack.map(f => f.id));
  });
});
```

---

## Recommendations

### Immediate Fixes (Priority: HIGH)

#### Fix 1: Add Guard to syncToUrl Effect

**File:** `/home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts`
**Lines:** 227-247

**Change:**
```typescript
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!syncToUrl) return;
  if (!isInitializedRef.current) return;
  if (isRestoringRef.current) return;  // ✅ ADD THIS LINE

  const currentIds = getStackIds();
  // ... rest of effect
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);
```

**Rationale:** Prevents URL updates from racing with popstate handler.

---

#### Fix 2: Improve popstate Flag Reset Timing

**File:** `/home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts`
**Lines:** 179-214

**Change:**
```typescript
const handlePopstate = (event: PopStateEvent) => {
  if (isRestoringRef.current) return;  // ✅ Prevent re-entrancy

  isRestoringRef.current = true;
  setIsRestoring(true);

  const formIds: string[] =
    event.state?.[paramName] ?? parseFormStackUrl(paramName);

  const currentIds = getStackIds();

  if (formIds.length < currentIds.length) {
    const targetIndex = formIds.length - 1;
    if (targetIndex >= 0) {
      popToIndex(targetIndex);
    }
  }

  // ✅ Use double-RAF to ensure state stabilizes
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isRestoringRef.current = false;
      setIsRestoring(false);
    });
  });
};
```

**Rationale:** Ensures state update completes before releasing lock.

---

#### Fix 3: Add Mounted State Tracking

**File:** `/home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts`

**Add:**
```typescript
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;
  return () => {
    isMountedRef.current = false;
  };
}, []);

// Update syncStackToUrl
const syncStackToUrl = useCallback(
  (formIds: readonly string[], usePushState: boolean = true) => {
    if (typeof window === 'undefined') return;
    if (!isMountedRef.current) return;  // ✅ Add mount check
    if (isRestoringRef.current) return;

    // ... rest of function
  },
  [paramName]
);
```

**Rationale:** Prevents memory leaks and updates after unmount.

---

### Medium-Term Improvements (Priority: MEDIUM)

#### Improvement 1: Add Update Queue

Implement pending update queue from Strategy 1 to handle updates that arrive during restoration.

#### Improvement 2: Add Debouncing Option

Add optional debouncing for high-frequency updates:
```typescript
export interface UseFormStackURLSyncOptions {
  debounceMs?: number;  // Default: 0 (no debounce)
}
```

#### Improvement 3: Add Singleton Enforcement

Prevent multiple instances with same paramName:
```typescript
const activeInstances = new Map<string, symbol>();

export function useFormStackURLSync(options = {}) {
  const { paramName = 'forms' } = options;

  if (activeInstances.has(paramName)) {
    console.warn(`useFormStackURLSync: Multiple instances with paramName="${paramName}" detected. This may cause race conditions.`);
  }

  const instanceId = Symbol(paramName);
  activeInstances.set(paramName, instanceId);

  useEffect(() => {
    return () => {
      if (activeInstances.get(paramName) === instanceId) {
        activeInstances.delete(paramName);
      }
    };
  }, [paramName, instanceId]);
}
```

---

### Long-Term Considerations (Priority: LOW)

#### Consideration 1: Switch to Explicit Updates

Consider following React Router's pattern: make URL updates explicit rather than automatic. This eliminates race conditions entirely but changes the API.

**Example:**
```typescript
// Instead of automatic sync:
const { pushForm, popForm } = useFormStackURLSync();

// Explicit updates:
pushForm('form-1');  // Updates both state and URL atomically
```

#### Consideration 2: Use URL as Source of Truth

Consider deriving all state from URL, eliminating the separate React state:
```typescript
const formStack = useMemo(() => {
  return parseFormStackUrl(paramName);
}, [window.location.search]); // React to URL changes only
```

**Trade-off:** Loses the ability to have transient state not reflected in URL.

---

## Summary of Key Findings

### Critical Issues Identified

1. **Missing guard in syncToUrl effect** (HIGH) - Can cause URL updates during popstate
2. **setTimeout flag reset timing** (MEDIUM) - May release lock before state stabilizes
3. **No mounted state tracking** (MEDIUM) - Can cause memory leaks and post-unmount updates
4. **No conflict detection** (LOW-MEDIUM) - Multiple instances can interfere

### Recommended Fix Priority

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| 🔴 HIGH | Add guard to syncToUrl effect | 5 min | Eliminates primary race condition |
| 🔴 HIGH | Improve popstate flag timing | 10 min | Ensures state stabilization |
| 🟡 MEDIUM | Add mounted state tracking | 10 min | Prevents memory leaks |
| 🟡 MEDIUM | Add update queue | 1 hour | Handles updates during restoration |
| 🟢 LOW | Add singleton enforcement | 30 min | Prevents multi-instance conflicts |
| 🟢 LOW | Add debouncing option | 1 hour | Improves performance |

### Implementation Strategy

1. **Phase 1 (Immediate):** Apply the three HIGH/MEDIUM priority fixes
2. **Phase 2 (Short-term):** Implement update queue and debouncing
3. **Phase 3 (Long-term):** Evaluate architectural changes (explicit updates, URL as source of truth)

---

## References & Sources

### Primary Sources (Codebase Analysis)

1. **Current Implementation:**
   - `/home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts`
   - `/home/dustin/projects/geoform/src/hooks/__tests__/useFormStackURLSync.test.tsx`

2. **Existing Research:**
   - `/home/dustin/projects/geoform/plan/P3M1/research/url-sync-patterns.md`
   - `/home/dustin/projects/geoform/plan/P3M1/research/browser-history-api.md`

### External Documentation

3. **React Router Documentation:**
   - React Router v6: https://reactrouter.com
   - useSearchParams API: https://reactrouter.com/api/hooks/useSearchParams
   - State Management: https://reactrouter.com/explanation/state-management

4. **MDN Web Docs:**
   - History API: https://developer.mozilla.org/en-US/docs/Web/API/History_API
   - PopStateEvent: https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event
   - URLSearchParams: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams

5. **Community Libraries:**
   - nuqs: https://nuqs.dev (Type-safe URL state with debouncing)
   - serialize-query-params: https://github.com/pbeshai/serialize-query-params
   - use-query-params: https://github.com/pbeshai/use-query-params

6. **Community Discussions:**
   - Stack Overflow: "React URL state sync race conditions"
   - GitHub Issues: React Router URL sync discussions
   - GitHub Issues: Various URL state management library issues

### Related Patterns

7. **Best Practices:**
   - LogRocket: "Advanced React state management using URL parameters"
   - DEV Community: "Custom React hook to sync state with URL"
   - Medium: "Using React Hooks to sync your component state with URL"

---

## Appendix: Code Examples

### Example 1: Complete Fixed Implementation

```typescript
import { useEffect, useRef, useCallback, useState } from 'react';
import { useFormStackState } from './useFormStackState';
import { useFormStackActions } from './useFormStackActions';
import { buildFormStackUrl, parseFormStackUrl } from '../utils';

export interface UseFormStackURLSyncOptions {
  paramName?: string;
  restoreOnMount?: boolean;
  syncToUrl?: boolean;
  syncFromUrl?: boolean;
  onRestore?: (formIds: string[]) => void;
  debounceMs?: number; // ✅ New option
}

export function useFormStackURLSync(
  options: UseFormStackURLSyncOptions = {}
) {
  const {
    paramName = 'forms',
    restoreOnMount = true,
    syncToUrl = true,
    syncFromUrl = true,
    onRestore,
    debounceMs = 0, // ✅ Default no debounce
  } = options;

  const { stack } = useFormStackState();
  const { popToIndex } = useFormStackActions();

  const [isRestoring, setIsRestoring] = useState(false);

  // Track restoration
  const isRestoringRef = useRef(false);

  // ✅ Track mounted state
  const isMountedRef = useRef(true);

  // Track previous stack
  const prevStackRef = useRef<readonly { id: string }[]>([]);

  // Track initialization
  const isInitializedRef = useRef(false);

  // ✅ Track pending updates
  const pendingUpdateRef = useRef<{formIds: readonly string[], usePushState: boolean} | null>(null);

  // ✅ Track debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getStackIds = useCallback(() => {
    return stack.map((entry) => entry.id);
  }, [stack]);

  const getUrlState = useCallback(() => {
    if (typeof window === 'undefined') return [];
    return parseFormStackUrl(paramName);
  }, [paramName]);

  const syncStackToUrl = useCallback(
    (formIds: readonly string[], usePushState: boolean = true) => {
      if (typeof window === 'undefined') return;
      if (!isMountedRef.current) return; // ✅ Mount check
      if (isRestoringRef.current) {
        // ✅ Queue update if restoring
        pendingUpdateRef.current = { formIds, usePushState };
        return;
      }

      const url = buildFormStackUrl(formIds, paramName);
      const historyState = { [paramName]: [...formIds] };

      if (usePushState) {
        window.history.pushState(historyState, '', url);
      } else {
        window.history.replaceState(historyState, '', url);
      }
    },
    [paramName]
  );

  const forceUrlUpdate = useCallback(() => {
    syncStackToUrl(getStackIds(), false);
  }, [syncStackToUrl, getStackIds]);

  const restoreFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;

    const urlFormIds = getUrlState();

    if (urlFormIds.length > 0) {
      setIsRestoring(true);
      isRestoringRef.current = true;

      onRestore?.(urlFormIds);

      window.history.replaceState(
        { [paramName]: urlFormIds },
        '',
        window.location.href
      );

      // ✅ Use double-RAF for timing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isRestoringRef.current = false;
          setIsRestoring(false);

          // ✅ Process pending update
          if (pendingUpdateRef.current) {
            const { formIds, usePushState } = pendingUpdateRef.current;
            pendingUpdateRef.current = null;
            syncStackToUrl(formIds, usePushState);
          }
        });
      });
    }
  }, [getUrlState, paramName, onRestore, syncStackToUrl]);

  // Handle popstate
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!syncFromUrl) return;

    const handlePopstate = (event: PopStateEvent) => {
      if (isRestoringRef.current) return; // ✅ Prevent re-entrancy

      isRestoringRef.current = true;
      setIsRestoring(true);

      const formIds: string[] =
        event.state?.[paramName] ?? parseFormStackUrl(paramName);

      const currentIds = getStackIds();

      if (formIds.length < currentIds.length) {
        const targetIndex = formIds.length - 1;
        if (targetIndex >= 0) {
          popToIndex(targetIndex);
        }
      }

      // ✅ Double-RAF for state stabilization
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isRestoringRef.current = false;
          setIsRestoring(false);

          // ✅ Process pending update
          if (pendingUpdateRef.current) {
            const { formIds, usePushState } = pendingUpdateRef.current;
            pendingUpdateRef.current = null;
            syncStackToUrl(formIds, usePushState);
          }
        });
      });
    };

    window.addEventListener('popstate', handlePopstate);
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, [syncFromUrl, paramName, getStackIds, popToIndex, syncStackToUrl]);

  // Initialize from URL
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
    if (isRestoringRef.current) return; // ✅ CRITICAL FIX

    const currentIds = getStackIds();
    const prevIds = prevStackRef.current.map((e) => e.id);

    if (
      currentIds.length !== prevIds.length ||
      currentIds.some((id, i) => id !== prevIds[i])
    ) {
      const isAdding = currentIds.length > prevIds.length;

      // ✅ Apply debouncing if configured
      if (debounceMs > 0) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          syncStackToUrl(currentIds, isAdding);
          debounceTimerRef.current = null;
        }, debounceMs);
      } else {
        syncStackToUrl(currentIds, isAdding);
      }
    }

    prevStackRef.current = stack;
  }, [stack, syncToUrl, getStackIds, syncStackToUrl, debounceMs]);

  // ✅ Mount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;

      // ✅ Cleanup debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debounceMs]);

  return {
    isRestoring,
    getUrlState,
    forceUrlUpdate,
  };
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-11
**Next Review:** After implementing fixes
**Status:** Research complete, ready for implementation
