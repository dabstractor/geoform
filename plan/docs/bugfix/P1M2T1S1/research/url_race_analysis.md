# URL Sync Race Condition Analysis

**Analysis Date:** 2026-01-11
**Component:** `useFormStackURLSync.ts`
**Severity:** HIGH - State desynchronization under rapid user interaction

---

## Executive Summary

The current `useFormStackURLSync` implementation contains a **critical race condition** where the `syncToUrl` effect (lines 226-247) does not check the `isRestoringRef` flag before syncing state to URL. This allows URL updates to race with popstate handlers during rapid form open/close operations combined with browser navigation, causing state desynchronization.

**Failure Mode:** Browser back button may navigate to incorrect state or cause infinite update loops.

---

## Current Implementation Analysis

### State Tracking Variables

| Variable | Purpose | Location |
|----------|---------|----------|
| `isRestoringRef` | Prevents sync during restoration | Line 110 |
| `prevStackRef` | Detects stack changes | Line 112 |
| `isInitializedRef` | One-time initialization guard | Line 114 |

### Protected Code Paths

```typescript
// syncStackToUrl callback - PROTECTED by isRestoringRef check
const syncStackToUrl = useCallback(
  (formIds: readonly string[], usePushState: boolean = true) => {
    if (typeof window === 'undefined') return;
    if (isRestoringRef.current) return; // ✅ Guard present

    const url = buildFormStackUrl(formIds, paramName);
    // ... history API calls
  },
  [paramName]
);
```

### Vulnerable Code Path

```typescript
// syncToUrl effect - MISSING guard at lines 226-247
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!syncToUrl) return;
  if (!isInitializedRef.current) return;

  // ❌ MISSING: if (isRestoringRef.current) return;

  const currentIds = getStackIds();
  const prevIds = prevStackRef.current.map((e) => e.id);

  if (
    currentIds.length !== prevIds.length ||
    currentIds.some((id, i) => id !== prevIds[i])
  ) {
    const isAdding = currentIds.length > prevIds.length;
    syncStackToUrl(currentIds, isAdding); // May race
  }

  prevStackRef.current = stack;
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);
```

---

## Race Condition Scenario

### Sequence Diagram: The Failure Case

```
TIME  | Component State        | URL State              | isRestoringRef
------|------------------------|------------------------|---------------
T0    | [] (empty)            | ?forms=                | false
      | User opens Form A     |                        |
T1    | [A]                   | ?forms=A (pushState)   | false
      | User opens Form B     |                        |
T2    | [A,B]                 | ?forms=A,B (pushState) | false
      | User clicks BACK      |                        |
T3    | popstate fires        | ?forms=A               | true (set in handler)
      | popToIndex(0) called  |                        |
      | ...effect queued...   |                        |
T4    | State becomes [A]     |                        | false (setTimeout 0)
      | ❌ syncToUrl effect   |                        |
      |    runs with STALE    |                        |
      |    prevStackRef=[A,B] |                        |
      |    currentIds=[A]     |                        |
      |    Detects change!    |                        |
      |    syncStackToUrl([A])|                        |
T5    | [A]                   | ?forms=A (replace)     | false
      | WRONG STATE: History  |                        |
      | entry duplicated!     |                        |
```

### The Bug Explained

1. **T3**: User clicks back button → `popstate` fires
2. **T3**: `handlePopstate` sets `isRestoringRef.current = true`
3. **T3**: `popToIndex(0)` called to update React state
4. **T4**: React re-renders with new state `[A]`
5. **T4**: `setTimeout(..., 0)` fires, resetting `isRestoringRef.current = false`
6. **T4**: `syncToUrl` effect runs (triggered by stack change from `[A,B]` to `[A]`)
7. **T4**: **BUG** - Effect does NOT check `isRestoringRef` before syncing
8. **T4**: Effect compares `currentIds=[A]` with `prevStackRef.current=[A,B]`
9. **T4**: Detects difference! Calls `syncStackToUrl([A])`
10. **T5**: `replaceState` called with `?forms=A` - **duplicate history entry created**

### Alternative Failure: Infinite Loop

```
T3    | popstate fires        | ?forms=A               | true
      | popToIndex(0)         |                        |
      | ...                   |                        |
T4    | State=[A]             |                        | false
      | syncToUrl runs        |                        |
      | Calls syncStackToUrl  |                        |
      | ...replaceState...    | ?forms=A               |
      | (replaceState doesn't |                        |
      |  trigger popstate)    |                        |
T5    | prevStackRef updated  |                        |
      | to [A]                |                        |
      |                      |                        |
      | If ANY other state    |                        |
      | change occurs now     |                        |
      | (unrelated to forms)  |                        |
      | syncToUrl may see     |                        |
      | "change" and update   |                        |
      | URL again             |                        |
```

---

## Root Cause

The `syncToUrl` effect depends on:
- `stack` (triggers when form stack changes)
- `syncToUrl` boolean flag
- `getStackIds` callback
- `syncStackToUrl` callback

When `popstate` triggers a stack change:
1. Stack changes from `[A,B]` to `[A]`
2. This triggers the `syncToUrl` effect
3. **Effect does NOT check `isRestoringRef`** (the critical missing guard)
4. Effect calls `syncStackToUrl` which DOES check `isRestoringRef`
5. By the time effect runs, `setTimeout` has already reset `isRestoringRef = false`
6. Result: Unintended URL update

---

## Secondary Issues

### Issue 1: setTimeout(..., 0) Timing Problem

```typescript
// Lines 205-207 in popstate handler
setTimeout(() => {
  isRestoringRef.current = false;
}, 0);
```

**Problem:** `setTimeout(..., 0)` releases the restoration lock **before** React has finished processing the state update. This is a classic "too early release" bug.

**Evidence from research:** The correct pattern is double-RAF (requestAnimationFrame):

```typescript
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    isRestoringRef.current = false;
  });
});
```

### Issue 2: No Mounted State Tracking

```typescript
// No isMountedRef pattern implemented
```

**Problem:** If component unmounts during async operation:
- `syncStackToUrl` may call `history.pushState` after unmount
- `isRestoringRef` reset in `setTimeout` after unmount
- Memory leak risk

**Solution:** Add `isMountedRef` pattern:

```typescript
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;
  return () => {
    isMountedRef.current = false;
  };
}, []);

// Wrap all async operations
if (!isMountedRef.current) return;
```

### Issue 3: No Pending Update Coalescing

**Problem:** Rapid form open/close (3+ forms in <100ms) creates:
- Multiple queued `syncStackToUrl` calls
- History pollution (intermediate states)
- Unnecessary re-renders

**Solution:** Pending update coalescing with `requestAnimationFrame` or debouncing.

---

## Impact Assessment

### User Impact

| Scenario | Likelihood | Severity | Impact |
|----------|------------|----------|--------|
| Rapid open → back button | Medium | High | Wrong form displayed |
| Open → open → back → forward | Low | High | State desync |
| Component unmount during update | Low | Medium | Memory leak |
| 3+ rapid form operations | Medium | Medium | History pollution |

### Technical Impact

- **State Consistency:** URL and React state may diverge
- **User Experience:** Back/forward buttons behave unexpectedly
- **Data Integrity:** Form stack position may be incorrect
- **Browser History:** Duplicate or missing history entries

---

## Current Mitigation Gaps

| Gap | Severity | Location | Mitigation Needed |
|-----|----------|----------|-------------------|
| Missing `isRestoringRef` check in `syncToUrl` effect | **CRITICAL** | Line 228 | Add guard: `if (isRestoringRef.current) return;` |
| `setTimeout(..., 0)` releases lock too early | **HIGH** | Lines 171, 205 | Use double-RAF pattern |
| No mounted state tracking | **MEDIUM** | Entire file | Add `isMountedRef` pattern |
| No pending update coalescing | **MEDIUM** | Lines 226-247 | Add RAF-based coalescing |
| No conflict detection for multiple instances | **LOW** | Entire file | Optional: Singleton enforcement |

---

## Recommended Mitigation Strategy

### Option 1: Minimal Fix (Quick - 15 minutes)

Add missing guard to `syncToUrl` effect:

```typescript
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!syncToUrl) return;
  if (!isInitializedRef.current) return;
  if (isRestoringRef.current) return; // ✅ ADD THIS LINE

  // ... rest of effect
}, [stack, syncToUrl, getStackIds, syncStackToUrl]);
```

### Option 2: Complete Fix (Recommended - 1 hour)

1. Add missing guard to `syncToUrl` effect
2. Replace `setTimeout(..., 0)` with double-RAF pattern
3. Add `isMountedRef` for unmount safety
4. Add pending update coalescing
5. Add optional debouncing for rapid changes

### Option 3: Modern React 18+ Approach (Advanced - 2 hours)

1. All of Option 2
2. Use `useTransition` for non-blocking updates
3. Use `useDeferredValue` for URL state
4. Consider `AbortController` for cleanup

---

## Test Cases to Validate Fix

### TC1: Rapid Open → Back Button
```typescript
// Open Form A, then Form B in quick succession
// Click back button
// Verify: Only one history step back, state is [A]
```

### TC2: Open → Open → Back → Forward
```typescript
// Open A, open B, click back, click forward
// Verify: State remains consistent throughout
```

### TC3: Unmount During Update
```typescript
// Open form, trigger navigation, unmount immediately
// Verify: No state updates after unmount, no memory leaks
```

### TC4: Stress Test - Rapid Operations
```typescript
// Open 5 forms in <100ms, click back rapidly
// Verify: No duplicate history entries, consistent state
```

---

## References

- Research: `/home/dustin/projects/geoform/plan/bugfix/P1M2T1S1/research/react_race_condition_patterns.md`
- Research: `/home/dustin/projects/geoform/plan/bugfix/P1M2T1S1/research/url_sync_race_conditions.md`
- Current Implementation: `/home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts`
- PRD Issue: Bug Fix Tasks P1.M2 - "Fix URL Sync Race Condition"
