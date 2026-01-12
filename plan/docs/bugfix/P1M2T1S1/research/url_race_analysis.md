# URL Sync Race Condition Analysis

**Analysis Date:** 2026-01-12
**Component:** `useFormStackURLSync.ts`
**Severity:** HIGH - State desynchronization under rapid form operations combined with browser navigation
**Related Issue:** P1.M2.T1.S1 - URL sync race condition analysis

***

## Executive Summary

The current `useFormStackURLSync` implementation contains a **critical race condition** where the `syncToUrl` effect (lines 345-369) does not check the `isRestoringRef` flag before syncing state to URL, while the `syncStackToUrl` callback it calls DOES have this check (line 187). This inconsistency allows URL updates to race with popstate handlers during rapid form open/close operations combined with browser navigation, causing state desynchronization.

**Failure Mode:** Browser back button may create duplicate history entries or cause incorrect state to be displayed.

**Bug Location:** `src/hooks/useFormStackURLSync.ts` lines 345-369 - missing `isRestoringRef` check before calling `syncStackToUrl`.

***

## Current Implementation Analysis

### State Tracking Variables

| Variable            | Purpose                               | Declared At |
| ------------------- | ------------------------------------- | ----------- |
| `isRestoringRef`    | Prevents sync during restoration      | Line 147    |
| `prevStackRef`      | Detects stack changes                 | Line 149    |
| `isInitializedRef`  | One-time initialization guard         | Line 151    |
| `isUpdatingRef`     | Track URL update in progress          | Line 153    |
| `pendingUpdateRef`  | Latest update version for coalescing  | Line 155    |
| `latestStackRef`    | Latest stack value for RAF callback   | Line 157    |
| `isMountedRef`      | Component mount status for unmount    | Line 159    |

### Protected Code Path: syncStackToUrl Callback

**Location:** Lines 184-251

```typescript
const syncStackToUrl = useCallback(
  (formIds: readonly string[], usePushState: boolean = true) => {
    if (typeof window === 'undefined') return;
    if (isRestoringRef.current) return; // ✅ Guard present at line 187

    // Store latest stack value for RAF callback access
    latestStackRef.current = formIds;

    // Create version ID for this update
    const updateId = ++pendingUpdateRef.current;

    // Set updating flag to prevent concurrent updates
    isUpdatingRef.current = true;

    // URL update function (with version-based coalescing)
    const performUpdate = () => {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      // Only proceed if this is still the latest update
      if (updateId !== pendingUpdateRef.current) {
        // Flag reset will be handled by the winning update
        return;
      }

      // Build URL and history state using latest stack value
      const url = buildFormStackUrl(latestStackRef.current, paramName);
      const historyState = { [paramName]: [...latestStackRef.current] };

      // Apply URL update (with mount guard)
      if (isMountedRef.current) {
        if (usePushState) {
          window.history.pushState(historyState, "", url);
        } else {
          window.history.replaceState(historyState, "", url);
        }
      }

      // Reset updating flag with RAF for state stabilization
      if (isRAFActuallyAvailable()) {
        requestAnimationFrame(() => {
          if (isMountedRef.current) {
            isUpdatingRef.current = false;
          }
        });
      } else {
        // Synchronous reset for test environments
        if (isMountedRef.current) {
          isUpdatingRef.current = false;
        }
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

**Protections in place:**
- ✅ `isRestoringRef` guard (line 187)
- ✅ RAF-based pending update coalescing (lines 192-249)
- ✅ Version-based update rejection (line 206-209)
- ✅ Mount state checks (lines 201, 216, 229, 235)

### Vulnerable Code Path: syncToUrl Effect

**Location:** Lines 345-369

```typescript
// Sync stack changes to URL
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!syncToUrl) return;
  if (!isInitializedRef.current) return;

  // Optional guard - skip if update in progress (RAF coalescing makes this less critical)
  if (isUpdatingRef.current) return;  // Line 352 - isUpdatingRef check

  // ❌ CRITICAL BUG: Missing check for isRestoringRef.current
  // The effect does NOT check isRestoringRef before calling syncStackToUrl

  const currentIds = getStackIds();
  const prevIds = prevStackRef.current.map((e) => e.id);

  // Detect if stack changed
  if (
    currentIds.length !== prevIds.length ||
    currentIds.some((id, i) => id !== prevIds[i])
  ) {
    const isAdding = currentIds.length > prevIds.length;

    // Use pushState when adding forms, replaceState when removing
    syncStackToUrl(currentIds, isAdding);  // Line 365 - calls protected callback
  }

  prevStackRef.current = stack;
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);
```

**The Problem:** The effect checks `isUpdatingRef` at line 352, but this happens BEFORE the stack change detection at line 358. When a stack change is detected, the effect calls `syncStackToUrl` which checks `isRestoringRef`, but by that time the `setTimeout` in the popstate handler may have already reset `isRestoringRef.current = false`.

### popstate Handler

**Location:** Lines 294-333

```typescript
// Handle popstate (browser back/forward)
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!syncFromUrl) return;

  const handlePopstate = (event: PopStateEvent) => {
    // Skip if URL update is in progress
    if (isUpdatingRef.current) return;

    isRestoringRef.current = true;  // Line 303 - Set restoration flag

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

    setTimeout(() => {
      isRestoringRef.current = false;  // Line 325 - Reset flag with setTimeout
    }, 0);
  };

  window.addEventListener("popstate", handlePopstate);
  return () => {
    window.removeEventListener("popstate", handlePopstate);
  };
}, [syncFromUrl, paramName, getStackIds, popToIndex]);
```

**The Timing Issue:** `setTimeout(..., 0)` releases the restoration lock BEFORE React has finished processing the state update triggered by `popToIndex`. This creates a race condition window.

***

## Race Condition Scenario

### Sequence Diagram: The Failure Case

```
TIME  | Component State        | URL State              | isRestoringRef | Notes
------|------------------------|------------------------|----------------|-------
T0    | [] (empty)            | ?forms=                | false          | Initial state
T1    | User opens Form A     | ?forms=A (pushState)   | false          | Normal operation
      | stack = [A]           |                        |                |
T2    | User opens Form B     | ?forms=A,B (pushState) | false          | Normal operation
      | stack = [A,B]         |                        |                |
T3    | User clicks BACK      | ?forms=A (URL already) | true           | popstate fires
      | popstate fires        |                        |                | handler runs
      | isRestoringRef=true   |                        |                |
      | popToIndex(0) called  |                        |                |
      | setState queued       |                        |                |
      | setTimeout queued     |                        |                |
T4    | State becomes [A]     | ?forms=A               | false          | setTimeout fires
      | React re-renders      |                        |                | BEFORE setState!
      | syncToUrl effect runs |                        |                |
      | with STALE prevStack  |                        |                |
      | prevStackRef=[A,B]    |                        |                |
      | currentIds=[A]        |                        |                |
      | Detects change!       |                        |                |
      | syncStackToUrl([A])   |                        |                |
      | (isRestoringRef=false)│                        |                |
T5    | [A]                   | ?forms=A (replaceState)| false          | WRONG: History
      | State stable now      |                        |                | entry duplicated!
```

### The Bug Explained (Step-by-Step)

1. **T3**: User clicks back button → `popstate` event fires
2. **T3**: `handlePopstate` sets `isRestoringRef.current = true` (line 303)
3. **T3**: `popToIndex(0)` called to update React state (line 316 or 319)
4. **T3**: `setTimeout(() => { isRestoringRef.current = false }, 0)` queued (line 324-326)
5. **T4**: `setTimeout(..., 0)` fires **before** React state update completes
6. **T4**: `isRestoringRef.current = false`
7. **T4**: React state update completes, `stack` changes from `[A,B]` to `[A]`
8. **T4**: `syncToUrl` effect runs (triggered by stack change)
9. **T4**: Effect checks `isUpdatingRef.current` (false at this point)
10. **T4**: Effect compares `currentIds=[A]` with `prevStackRef.current=[A,B]`
11. **T4**: Detects difference! Calls `syncStackToUrl([A], false)` (replaceState)
12. **T5**: `syncStackToUrl` checks `isRestoringRef` (now false, so proceeds)
13. **T5**: `replaceState` called with `?forms=A`
14. **T5**: **Duplicate history entry created** - the URL was already `?forms=A` from the back button

### Why the Existing isUpdatingRef Check Doesn't Prevent This

The `isUpdatingRef` check at line 352 only prevents the effect from running if a URL update is actively in progress. However:

1. The popstate handler doesn't touch the URL (it reads from URL, updates state)
2. Therefore `isUpdatingRef.current` is `false` when the effect runs
3. The race happens between the `setTimeout` releasing `isRestoringRef` and the React state update completing

**The bug is that the effect never checks `isRestoringRef` - it only checks `isUpdatingRef`.**

***

## Root Cause

**Primary Root Cause:** Missing `isRestoringRef.current` check in the `syncToUrl` effect (lines 345-369)

The `syncStackToUrl` callback HAS the guard at line 187:
```typescript
if (isRestoringRef.current) return; // ✅ Guard present in callback
```

But the `syncToUrl` effect does NOT have this guard before calling the callback:
```typescript
useEffect(() => {
  // ... various checks
  // ❌ MISSING: if (isRestoringRef.current) return;
  syncStackToUrl(currentIds, isAdding);
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);
```

**Secondary Root Cause:** `setTimeout(..., 0)` timing issue (line 324)

The `setTimeout` callback resets `isRestoringRef.current = false` before React has committed the state changes. This creates a timing window where:
- The restoration flag is false
- But the state update hasn't completed yet
- When the state update completes, it triggers the effect
- The effect sees no restoration flag and proceeds with URL sync

**Correct Pattern:** Use double-RAF (requestAnimationFrame twice) to ensure React has committed changes:
```typescript
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    isRestoringRef.current = false;
  });
});
```

***

## Current Mitigation Gaps

| Gap                                                      | Severity  | Location | Status         | Mitigation Needed                                       |
| -------------------------------------------------------- | --------- | -------- | -------------- | -------------------------------------------------------- |
| Missing `isRestoringRef` check in `syncToUrl` effect     | **CRITICAL** | Line 345  | **VULNERABLE** | Add guard: `if (isRestoringRef.current) return;`        |
| `setTimeout(..., 0)` releases restoration lock too early | **HIGH**     | Line 324  | **AT RISK**    | Use double-RAF pattern for state stabilization           |
| `isUpdatingRef` check placement (runs before diff check) | **MEDIUM**  | Line 352  | **AT RISK**    | Move check after diff detection, or add isRestoringRef   |

### Already Implemented (Not Gaps)

The following protections are already in place and working correctly:

| Protection                  | Location | Status  | Notes                                              |
| --------------------------- | -------- | ------- | -------------------------------------------------- |
| `isMountedRef` lifecycle    | 159-170  | ✅ DONE | Properly implemented with cleanup on unmount        |
| RAF-based update coalescing | 192-249  | ✅ DONE | Uses version-based rejection for rapid updates     |
| Version-based update tracking | 193-209 | ✅ DONE | `pendingUpdateRef` ensures only latest update runs |
| Mount guards in async ops   | 201, 216 | ✅ DONE | All async operations check isMountedRef            |

***

## Recommended Mitigation Strategies

### Option 1: Minimal Fix (5 minutes)

**Add the missing guard to the `syncToUrl` effect:**

```typescript
// Sync stack changes to URL
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!syncToUrl) return;
  if (!isInitializedRef.current) return;
  if (isRestoringRef.current) return;  // ✅ ADD THIS LINE

  // Optional guard - skip if update in progress (RAF coalescing makes this less critical)
  if (isUpdatingRef.current) return;

  const currentIds = getStackIds();
  const prevIds = prevStackRef.current.map((e) => e.id);

  // ... rest of effect
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);
```

**Location:** Add at line 351 (after the `isInitializedRef` check, before the `isUpdatingRef` check)

**Pros:**
- Single line change
- Directly addresses the root cause
- No refactoring needed

**Cons:**
- Doesn't address the `setTimeout` timing issue
- Effect may still run unnecessarily during restoration (just exits early)

---

### Option 2: Complete Fix (30 minutes)

**1. Add missing guard to `syncToUrl` effect** (same as Option 1)

**2. Fix `setTimeout` timing with double-RAF:**

```typescript
// In popstate handler (line 324)
// OLD:
setTimeout(() => {
  isRestoringRef.current = false;
}, 0);

// NEW:
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    isRestoringRef.current = false;
  });
});
```

**3. Optionally: Add pending update processing**

If URL updates arrive during restoration, queue them for processing after restoration completes:

```typescript
const pendingUpdateRef = useRef<{formIds: readonly string[], usePushState: boolean} | null>(null);

// In syncToUrl effect:
if (isRestoringRef.current) {
  // Queue the update for later
  pendingUpdateRef.current = { formIds: currentIds, usePushState: isAdding };
  return;
}

// In popstate handler, after resetting flag:
if (pendingUpdateRef.current) {
  const { formIds, usePushState } = pendingUpdateRef.current;
  pendingUpdateRef.current = null;
  syncStackToUrl(formIds, usePushState);
}
```

**Pros:**
- Addresses both the missing guard and the timing issue
- Double-RAF ensures React has committed changes
- Handles edge case of updates arriving during restoration

**Cons:**
- More complex than Option 1
- Requires testing of double-RAF behavior

---

### Option 3: Modern React 18+ Approach (1 hour)

**All of Option 2, plus:**

**1. Use `useTransition` for non-blocking updates:**

```typescript
import { useTransition } from 'react';

export function useFormStackURLSync(options = {}) {
  const [isPending, startTransition] = useTransition();

  const syncStackToUrl = useCallback((formIds, usePushState) => {
    if (typeof window === 'undefined') return;
    if (isRestoringRef.current) return;

    // Mark URL update as transition to prevent blocking
    startTransition(() => {
      const url = buildFormStackUrl(formIds, paramName);
      if (usePushState) {
        window.history.pushState({ formIds }, '', url);
      } else {
        window.history.replaceState({ formIds }, '', url);
      }
    });
  }, [paramName]);

  return { isRestoring, isUrlUpdatePending: isPending, getUrlState, forceUrlUpdate };
}
```

**2. Consider `AbortController` for cleanup:**

```typescript
const abortControllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  isMountedRef.current = true;
  abortControllerRef.current = new AbortController();

  return () => {
    isMountedRef.current = false;
    abortControllerRef.current?.abort();
  };
}, []);

// In syncStackToUrl:
if (abortControllerRef.current?.signal.aborted) return;
```

**Pros:**
- Leverages React 18+ concurrent features
- Non-blocking updates improve perceived performance
- Better cleanup with AbortController

**Cons:**
- Requires React 18+
- More complex implementation
- May not provide significant benefit for this specific use case

---

### Comparison Table

| Strategy | Effort | Code Changes | Coverage | React Version |
| -------- | ------ | ------------ | -------- | ------------- |
| Option 1: Minimal Fix | 5 min    | 1 line       | Critical bug only | Any |
| Option 2: Complete Fix | 30 min   | 10-20 lines  | Critical + timing | Any |
| Option 3: React 18+ | 1 hour   | 30-40 lines  | All issues | 18+ |

**Recommendation:** Start with **Option 1** for immediate fix, then implement **Option 2** for complete solution. Option 3 is optional for future enhancement.

***

## Test Cases for Validation

### TC1: Rapid Open → Back Button

**Scenario:** Open two forms in succession, then immediately click back button

**Expected Result:**
- URL should show `?forms=A` (just Form A)
- Component state should be `[A]`
- No duplicate history entries

**Test Code:**
```typescript
it('should handle rapid open → back button without duplicating history', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

  // Open Form A
  act(() => {
    openForm('form-A');
  });

  // Open Form B
  act(() => {
    openForm('form-B');
  });

  await waitFor(() => {
    expect(result.current.getUrlState()).toEqual(['form-A', 'form-B']);
  });

  // Click back button immediately
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { forms: ['form-A'] }
    }));
  });

  await waitFor(() => {
    // Should be back to just Form A
    expect(result.current.getUrlState()).toEqual(['form-A']);
  });

  // Verify no duplicate history entry
  expect(window.history.length).toBe(2); // Initial + form-A,B, not form-A,B + form-A
});
```

---

### TC2: Open → Open → Back → Forward

**Scenario:** Open two forms, click back, then click forward

**Expected Result:**
- After back: URL `?forms=A`, state `[A]`
- After forward: URL `?forms=A,B`, state `[A,B]`
- State remains consistent throughout

**Test Code:**
```typescript
it('should handle back → forward navigation correctly', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

  // Open forms
  act(() => {
    openForm('form-A');
    openForm('form-B');
  });

  await waitFor(() => {
    expect(result.current.getUrlState()).toHaveLength(2);
  });

  // Go back
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { forms: ['form-A'] }
    }));
  });

  await waitFor(() => {
    expect(result.current.getUrlState()).toEqual(['form-A']);
  });

  // Go forward
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { forms: ['form-A', 'form-B'] }
    }));
  });

  await waitFor(() => {
    expect(result.current.getUrlState()).toEqual(['form-A', 'form-B']);
  });
});
```

---

### TC3: Unmount During Update

**Scenario:** Open form, trigger navigation, unmount immediately

**Expected Result:**
- No state updates after unmount
- No memory leaks
- No "update on unmounted component" warnings

**Test Code:**
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

### TC4: Stress Test - Rapid Operations

**Scenario:** Open 5 forms rapidly (<100ms), then click back rapidly

**Expected Result:**
- No duplicate history entries
- Consistent state throughout
- No crashes or errors

**Test Code:**
```typescript
it('should handle rapid operations without state corruption', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

  // Open 5 forms rapidly
  act(() => {
    for (let i = 1; i <= 5; i++) {
      openForm(`form-${i}`);
    }
  });

  await waitFor(() => {
    expect(result.current.getUrlState()).toHaveLength(5);
  });

  // Rapid back button clicks
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { forms: ['form-1', 'form-2'] }
    }));
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { forms: ['form-1'] }
    }));
  });

  await waitFor(() => {
    const finalState = result.current.getUrlState();
    // Should be consistent - either ['form-1'] or ['form-2'], not corrupted
    expect(
      finalState.equals(['form-1']) ||
      finalState.equals(['form-2'])
    ).toBe(true);
  });
});
```

---

### Existing Test Coverage

The existing test suite at `src/hooks/__tests__/useFormStackURLSync.test.tsx` already includes:

- **Lines 463-607:** Race condition protection tests
- **Lines 737-909:** Browser navigation race condition tests

These tests should be reviewed to ensure they cover the specific bug scenario documented here.

***

## References

### Internal Documentation

- **Comprehensive Race Condition Analysis:** `plan/docs/bugfix/P1M2T1S1/research/url_race_analysis.md`
  - Detailed analysis of race condition scenarios and failure modes

- **React Race Condition Patterns:** `plan/docs/bugfix/P1M2T1S1/research/react_race_condition_patterns.md`
  - useRef-based pending update tracking
  - useTransition for coordinated updates
  - isMountedRef pattern for unmount safety
  - Pending update coalescing patterns

- **URL Sync Race Conditions:** `plan/docs/bugfix/P1M2T1S1/research/url_sync_race_conditions.md`
  - Real-world URL sync failure scenarios
  - Community solutions and patterns
  - React Router's approach

### Source Code

- **Primary File:** `src/hooks/useFormStackURLSync.ts` (377 lines)
  - Lines 147-159: Ref declarations
  - Lines 159-170: isMountedRef lifecycle management ✅
  - Lines 184-251: syncStackToUrl callback (HAS isRestoringRef guard, RAF coalescing) ✅
  - Lines 294-333: popstate handler (sets isRestoringRef, uses setTimeout)
  - Lines 345-369: syncToUrl effect (MISSING isRestoringRef guard) ❌ BUG LOCATION

### External Documentation

- **React useEffect timing:** https://react.dev/reference/react/useEffect#timing-of-effects
- **React useRef race conditions:** https://react.dev/reference/react/useRef#avoiding-race-conditions-with-refs
- **MDN History API:** https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API
- **MDN requestAnimationFrame:** https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame

***

## Summary

**Bug:** The `syncToUrl` effect (lines 345-369) is missing the `isRestoringRef` check that the `syncStackToUrl` callback has (line 187).

**Impact:** During browser back navigation, the effect may run and create duplicate history entries because the `setTimeout` in the popstate handler resets `isRestoringRef` before React state updates complete.

**Fix:** Add `if (isRestoringRef.current) return;` at line 351 in the `syncToUrl` effect.

**Already Working:** The codebase already has `isMountedRef` lifecycle management and RAF-based pending update coalescing - these are NOT gaps.

---

**Document Version:** 1.0
**Created:** 2026-01-12
**Status:** Ready for P1.M2.T1.S2 (Mitigation Selection)
