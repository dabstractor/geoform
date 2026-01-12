# URL Sync Race Condition Mitigation Pattern Decision

**Date:** 2026-01-11
**Task:** P1.M2.T1.S2 - Select optimal race condition mitigation pattern
**Status:** DECISION MADE

---

## Executive Summary

After comprehensive evaluation of three React race condition mitigation patterns against the specific use case of URL synchronization with browser history API, **the useRef-based pending update tracking pattern is selected** as the optimal solution.

**Decision:** Use `useRef` with `requestAnimationFrame` for pending update coalescing, combined with `isMountedRef` for unmount safety and a state machine for sync direction tracking.

**Confidence:** 10/10 - This is the only pattern that satisfies all URL synchronization requirements.

---

## The Three Patterns Evaluated

### Pattern A: useRef for Tracking Pending Operations

**Description:** Use refs to track pending async operations, with operation IDs and requestAnimationFrame for batching.

**Source:** https://react.dev/learn/referencing-values-with-refs

### Pattern B: useDeferredValue for Non-blocking Updates

**Description:** Defer UI updates by keeping a previous value and scheduling a re-render with the new value when React has time.

**Source:** https://react.dev/reference/react/useDeferredValue

### Pattern C: useTransition for Coordinated Updates

**Description:** Mark state updates as "transitions" (non-urgent), allowing React to interrupt them if more urgent updates come in.

**Source:** https://react.dev/reference/react/useTransition

---

## Evaluation Criteria

For URL synchronization with browser history API, the following requirements are critical:

| Requirement | Importance | Description |
|-------------|------------|-------------|
| **No URL Lag** | 🔴 CRITICAL | URL must update immediately with state changes |
| **Atomic Operations** | 🔴 CRITICAL | pushState/replaceState must complete or not execute |
| **Reliable Completion** | 🔴 CRITICAL | Updates cannot be interrupted or abandoned |
| **Bookmark Safety** | 🔴 CRITICAL | User bookmarks must capture correct state |
| **Race Prevention** | 🔴 CRITICAL | Prevent concurrent history API calls |
| **Unmount Safety** | 🟡 HIGH | Prevent updates after component unmount |

---

## Pattern Comparison Matrix

| Criteria | useRef + RAF | useDeferredValue | useTransition |
|----------|--------------|------------------|--------------|
| **No URL Lag** | ✅ YES (~16ms) | ❌ NO (variable) | ❌ NO (unpredictable) |
| **Atomic Operations** | ✅ YES | ⚠️ PARTIAL | ❌ NO |
| **Reliable Completion** | ✅ YES | ⚠️ MOSTLY | ❌ NO |
| **Bookmark Safety** | ✅ YES | ❌ NO | ❌ NO |
| **Race Prevention** | ✅ YES | ⚠️ PARTIAL | ⚠️ PARTIAL |
| **Unmount Safety** | ✅ YES (with pattern) | ✅ YES | ✅ YES |
| **React Version** | Any | 18+ | 18+ |
| **Complexity** | Low | Low | Medium |
| **Memory Overhead** | Minimal | Low | Medium |

---

## Detailed Analysis

### useRef + requestAnimationFrame ✅ SELECTED

**How it works:**
```typescript
const pendingUpdateRef = useRef<number>(0);
const latestStackRef = useRef<readonly string[]>([]);

const syncStackToUrl = useCallback((formIds: readonly string[]) => {
  latestStackRef.current = formIds;
  const updateId = ++pendingUpdateRef.current;

  requestAnimationFrame(() => {
    if (updateId === pendingUpdateRef.current) {
      window.history.pushState({ formIds }, '', url);
    }
  });
}, []);
```

**Pros:**
- ✅ URL updates within same frame (~16ms) - perceived as instant
- ✅ Atomic operations - completes or doesn't execute
- ✅ Version tracking prevents race conditions
- ✅ Works with all React versions
- ✅ Simple mental model
- ✅ Minimal overhead

**Cons:**
- ⚠️ Manual cleanup required (add isMountedRef pattern)
- ⚠️ Requires careful timing (use double-RAF for state stabilization)

**Verdict:** ✅ **SELECTED** - Only pattern that satisfies URL sync requirements

---

### useDeferredValue ❌ REJECTED

**How it works:**
```typescript
const deferredStack = useDeferredValue(stack);

useEffect(() => {
  syncStackToUrl(deferredStack);
}, [deferredStack]);
```

**Pros:**
- ✅ Reduces render blocking for expensive UI
- ✅ Simple API
- ✅ Built-in React 18+

**Cons:**
- ❌ **URL lag is unacceptable** - User sees state change but URL doesn't update
- ❌ **Bookmarking broken** - User bookmarks before URL updates, gets wrong state
- ❌ **Sharing broken** - Copy URL before it updates, shares wrong state
- ❌ **Back/forward broken** - History entries don't match state changes
- ❌ Requires React 18+

**Failure Scenario:**
```
1. User opens Form A
2. State updates immediately → Form A visible
3. URL still shows old state (deferred, lag)
4. User bookmarks page
5. Bookmark has wrong URL (Form A not included)
6. Recipient opens bookmark → Form A not shown
```

**Verdict:** ❌ **REJECTED** - URL lag breaks core user expectations

---

### useTransition ❌ REJECTED

**How it works:**
```typescript
const [isPending, startTransition] = useTransition();

const syncStackToUrl = useCallback((formIds: readonly string[]) => {
  startTransition(() => {
    window.history.pushState({ formIds }, '', url);
  });
}, []);
```

**Pros:**
- ✅ Non-blocking updates
- ✅ User priority - urgent updates take precedence
- ✅ Coordinated batches

**Cons:**
- ❌ **Updates may be interrupted** - Transition can be abandoned if user types
- ❌ **Unpredictable completion** - URL may never update if user keeps interacting
- ❌ **Bookmarking broken** - URL update may be interrupted
- ❌ **Sharing broken** - URL may never update
- ❌ **Not for external system writes** - React docs explicitly warn against this
- ❌ Requires React 18+

**Failure Scenario:**
```
1. User opens Form A
2. startTransition(() => syncStackToUrl([A])) scheduled
3. User immediately types in search box (urgent update)
4. Transition interrupted
5. URL update abandoned
6. URL still shows empty stack
7. User bookmarks page → Bookmark doesn't include Form A
```

**Verdict:** ❌ **REJECTED** - Interruptible by design, unacceptable for URL sync

---

## Critical Requirement Analysis

### Why URL Lag is Unacceptable

URL synchronization has unique requirements that differ from typical UI updates:

1. **Bookmarking:** Users expect bookmarks to capture the current page state
2. **Sharing:** Users expect share links to work correctly
3. **Back/Forward:** Browser history must match application state
4. **Refresh:** Page refreshes should restore the exact state

Both `useDeferredValue` and `useTransition` introduce lag or interruption that breaks these user expectations.

### Browser History API Requirements

```typescript
// These operations MUST complete atomically
window.history.pushState(state, '', url);
window.history.replaceState(state, '', url);
```

**Requirements:**
1. **Atomic:** Operation must complete or not execute at all
2. **Synchronous:** No acceptable delay between state change and URL update
3. **Reliable:** Must execute every time (cannot be interrupted)
4. **Order-preserving:** Must maintain order of operations

Only `useRef + RAF` satisfies all requirements.

---

## Selected Pattern Implementation

### useRef-Based Pattern with Enhancements

The selected implementation includes:

1. **Pending Update Coalescing**
   - `pendingUpdateRef` - Version counter for tracking latest update
   - `latestStackRef` - Stores the latest stack value
   - `requestAnimationFrame` - Batches updates within same frame

2. **Unmount Safety**
   - `isMountedRef` - Prevents updates after unmount
   - Cleanup in useEffect return function

3. **State Machine**
   - `syncStateRef` - Tracks 'IDLE' | 'SYNCING_TO_URL' | 'SYNCING_FROM_URL'
   - Direction-aware synchronization prevents loops

4. **Double-RAF Timing**
   - Two nested `requestAnimationFrame` calls
   - Ensures React state has committed before releasing locks

### Implementation Sketch

```typescript
export function useFormStackURLSync(options = {}) {
  // Pattern 1: Pending Update Tracking
  const pendingUpdateRef = useRef<number>(0);
  const latestStackRef = useRef<readonly string[]>([]);

  // Pattern 2: isMountedRef for Unmount Safety
  const isMountedRef = useRef(true);

  // Pattern 3: Sync State Machine
  type SyncState = 'IDLE' | 'SYNCING_TO_URL' | 'SYNCING_FROM_URL';
  const syncStateRef = useRef<SyncState>('IDLE');

  // Mount safety
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Coalesced URL update
  const syncStackToUrl = useCallback((formIds: readonly string[]) => {
    if (syncStateRef.current === 'SYNCING_FROM_URL') return;

    latestStackRef.current = formIds;
    const updateId = ++pendingUpdateRef.current;

    requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      if (updateId !== pendingUpdateRef.current) return;

      syncStateRef.current = 'SYNCING_TO_URL';

      const url = buildFormStackUrl(formIds, paramName);
      window.history.pushState({ [paramName]: [...formIds] }, '', url);

      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          syncStateRef.current = 'IDLE';
        }
      });
    });
  }, [paramName]);

  // Safe popstate handler with double-RAF
  useEffect(() => {
    const handlePopstate = (event: PopStateEvent) => {
      if (syncStateRef.current === 'SYNCING_TO_URL') return;
      if (!isMountedRef.current) return;

      syncStateRef.current = 'SYNCING_FROM_URL';

      // Handle popstate...

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (isMountedRef.current) {
            syncStateRef.current = 'IDLE';
          }
        });
      });
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  // Sync effect with guard
  useEffect(() => {
    if (syncStateRef.current === 'SYNCING_FROM_URL') return;

    syncStackToUrl(getStackIds(), true);
  }, [stack, syncStackToUrl]);

  return { isRestoring, getUrlState, forceUrlUpdate };
}
```

---

## References

### Official React Documentation
- **Referencing Values with Refs:** https://react.dev/learn/referencing-values-with-refs
- **useDeferredValue:** https://react.dev/reference/react/useDeferredValue
- **useTransition:** https://react.dev/reference/react/useTransition
- **Synchronizing with Effects:** https://react.dev/learn/synchronizing-with-effects

### Research Documents
- `/home/dustin/projects/geoform/plan/docs/bugfix/P1M2T1S1/research/react_race_condition_patterns.md`
- `/home/dustin/projects/geoform/plan/docs/bugfix/P1M2T1S1/research/url_sync_race_conditions.md`
- `/home/dustin/projects/geoform/plan/docs/architecture/testing_best_practices.md`

### Codebase Analysis
- `/home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts` - Current implementation
- `/home/dustin/projects/geoform/bug_fix_tasks.json` - Task definitions

---

## Implementation Next Steps

This decision enables the following tasks in P1.M2.T2 (Implementation):

1. **P1.M2.T2.S1:** Implement useRef-based pending update tracking
2. **P1.M2.T2.S2:** Add isMountedRef pattern for unmount safety
3. **P1.M2.T2.S3:** Write tests for race condition scenarios

---

**Decision Approved:** 2026-01-11
**Next Review:** After implementation completion
**Status:** READY FOR IMPLEMENTATION
