# Product Requirement Prompt (PRP): useRef-based Pending Update Tracking for Race Condition Fix

**Work Item**: P1.M2.T2.S1
**Task**: Implement useRef-based pending update tracking
**Status**: READY FOR IMPLEMENTATION
**Confidence Score**: 9/10 for one-pass implementation success

---

## Goal

**Feature Goal**: Implement useRef-based pending update tracking to prevent race conditions in `useFormStackURLSync` hook when multiple URL updates occur in rapid succession.

**Deliverable**: Modified `src/hooks/useFormStackURLSync.ts` with new refs (`isUpdatingRef`, `pendingUpdateRef`), coalesced `syncStackToUrl` function using `requestAnimationFrame`, and popstate handler that respects the update flag.

**Success Definition**:
- Multiple rapid `syncStackToUrl` calls are coalesced into a single URL update
- Only the latest stack state is synchronized to the URL
- No overlapping `pushState`/`replaceState` calls occur
- All existing functionality (URL restoration, popstate handling, initialization) remains unchanged
- Existing tests continue to pass with no behavior changes to user-facing features

## User Persona (if applicable)

**Target User**: End users who rapidly open/close multiple forms in succession

**Use Case**: A user quickly opens several modal forms (e.g., Organization → Team → User) in rapid succession, or rapidly closes multiple forms using the browser back button

**User Journey**:
1. User opens Form A
2. Before URL update completes, user opens Form B
3. Before URL update completes, user opens Form C
4. Without fix: Multiple overlapping `pushState` calls create inconsistent history
5. With fix: Only one URL update occurs with all three forms (A, B, C) in the correct order

**Pain Points Addressed**:
- Browser history becomes desynchronized from actual form stack state
- Bookmarking captures incorrect/incomplete state
- Sharing URLs doesn't reproduce the expected form state
- Browser back/forward navigation produces unexpected results

## Why

- **Business value**: Ensures reliable shareable URLs and browser navigation for form workflows
- **Integration**: Builds on existing `isRestoringRef` pattern already in the codebase
- **Problems solved**: Race condition between multiple concurrent URL sync operations, history API conflicts

---

## What

### Technical Implementation

Modify `src/hooks/useFormStackURLSync.ts` to add:

1. **Two new refs**:
   - `isUpdatingRef: RefObject<boolean>` - Tracks when a URL update is in progress
   - `pendingUpdateRef: RefObject<number>` - Version counter to identify the latest update

2. **Modified `syncStackToUrl` function**:
   - Check `isUpdatingRef.current` to detect if update is in progress
   - Increment `pendingUpdateRef.current` to create new version ID
   - Use `requestAnimationFrame` to coalesce rapid updates
   - Only apply URL update if version ID still matches latest

3. **Updated popstate handler**:
   - Check `isUpdatingRef.current` before processing
   - Skip handling if URL sync is in progress

### Success Criteria

- [ ] `isUpdatingRef` and `pendingUpdateRef` are added to the hook
- [ ] `syncStackToUrl` uses version-based coalescing with `requestAnimationFrame`
- [ ] Popstate handler checks `isUpdatingRef.current` before processing
- [ ] All existing tests pass without modification
- [ ] URL updates complete within ~16ms (single frame)
- [ ] No functional changes to URL restoration, initialization, or force update features

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Complete current implementation with line numbers
- Exact pattern to follow from architecture documentation
- External references with specific URLs
- Test framework details and patterns
- All integration points and dependencies
- Known gotchas specific to this codebase

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://react.dev/learn/referencing-values-with-refs
  why: Official React documentation on useRef pattern for tracking async operations
  critical: Shows how to use refs with requestAnimationFrame for batching updates

- url: https://react.dev/learn/synchronizing-with-effects
  why: Official React documentation on effect cleanup and preventing race conditions
  critical: Cleanup patterns and ref management in useEffect

- url: https://developer.mozilla.org/en-US/docs/Web/API/History_API
  why: MDN documentation on pushState/replaceState and popstate event
  critical: Understanding browser history API behavior and timing

- file: /home/dustin/projects/geoform/plan/docs/bugfix/P1M2T1S2/MITIGATION_DECISION.md
  why: Decision document selecting useRef pattern with implementation sketch
  critical: Contains approved implementation pattern with code examples
  section: Lines 218-320 (Implementation Sketch)

- file: /home/dustin/projects/geoform/plan/docs/architecture/testing_best_practices.md
  why: Architecture documentation with useRef race condition pattern
  critical: Section 2.2 contains exact pattern for isUpdatingRef, pendingUpdateRef, updateURL coalescing
  section: Section 2.2 (useRef Pattern for Race Conditions)

- file: /home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts
  why: Target file for modification - must understand current implementation
  pattern: Existing isRestoringRef pattern (lines 110-111, 131, 158, 172)
  gotcha: setTimeout(0) is used for async flag clearing - RAF is preferred for this pattern
  line_range: 1-250 (entire file)

- file: /home/dustin/projects/geoform/src/hooks/__tests__/useFormStackURLSync.test.tsx
  why: Existing test patterns to follow - ensures no regressions
  pattern: Vitest + React Testing Library, renderHook wrapper pattern, waitFor for async
  section: Full file for understanding test structure

- file: /home/dustin/projects/geoform/src/utils/urlEncoding.ts
  why: Utility functions used for URL encoding/decoding
  pattern: buildFormStackUrl, parseFormStackUrl functions
  gotcha: Functions handle encoding/decoding and special characters

- file: /home/dustin/projects/geoform/vitest.config.ts
  why: Test configuration - verify test commands work
  pattern: jsdom environment, global setup, coverage settings

- file: /home/dustin/projects/geoform/package.json
  why: Project scripts and dependencies
  pattern: "test": "vitest", "type-check": "tsc --noEmit"
  critical: Run tests with `npm test` or `vitest`, type-check with `npm run type-check`
```

### Current Codebase Tree

```bash
geoform/
├── src/
│   ├── hooks/
│   │   ├── useFormStackURLSync.ts        # TARGET FILE - Modify this
│   │   ├── useFormStack.ts
│   │   ├── useFormStackState.ts
│   │   ├── useFormStackActions.ts
│   │   └── __tests__/
│   │       ├── useFormStackURLSync.test.tsx  # Existing tests
│   │       ├── useFormStack.test.tsx
│   │       └── ...
│   ├── utils/
│   │   └── urlEncoding.ts                # buildFormStackUrl, parseFormStackUrl
│   └── ...
├── plan/
│   ├── bugfix/
│   │   └── P1M2T2S1/
│   │       └── PRP.md                    # This file
│   └── docs/
│       ├── architecture/
│       │   └── testing_best_practices.md # Section 2.2 useRef pattern
│       └── bugfix/
│           └── P1M2T1S2/
│               └── MITIGATION_DECISION.md
├── vitest.config.ts
├── package.json
└── tsconfig.json
```

### Desired Codebase Tree with Changes

```bash
# No new files - only modifications to existing file
src/hooks/useFormStackURLSync.ts  # MODIFIED: Add isUpdatingRef, pendingUpdateRef, coalescing
```

### Known Gotchas of This Codebase & Library Quirks

```typescript
// CRITICAL: Server-side rendering check required
// The hook must check `typeof window === 'undefined'` before any browser API usage
// Pattern: if (typeof window === 'undefined') return;
// Location: Lines 130, 152, 178, 218, 228 in current implementation

// CRITICAL: isRestoringRef timing uses setTimeout(0)
// Current implementation: setTimeout(() => { isRestoringRef.current = false; }, 0);
// For new pattern: Use requestAnimationFrame instead for better frame-aligned timing
// Reason: RAF ensures updates happen after React commits, within same ~16ms frame

// CRITICAL: Ref naming convention is {verb}{noun}Ref
// Examples: isRestoringRef, prevStackRef, isInitializedRef
// New refs should follow: isUpdatingRef, pendingUpdateRef

// CRITICAL: syncStackToUrl has two modes
// usePushState=true: uses window.history.pushState (creates history entry)
// usePushState=false: uses window.history.replaceState (replaces current entry)
// Preserve this behavior in new implementation

// CRITICAL: popstate handler only handles BACK navigation (closing forms)
// Forward navigation (opening forms) requires form registry - NOT in scope
// Pattern: if (formIds.length < currentIds.length) { /* handle back */ }

// CRITICAL: JSDoc comments are required on all exported functions
// Follow existing pattern with @param, @returns, @example tags

// CRITICAL: TypeScript strict mode is enabled
// All refs must have proper type annotations: useRef<Type>(initialValue)

// CRITICAL: React version is 19 (peerDependency)
// All React hooks must use modern patterns (no deprecated APIs)

// GOTCHA: prevStackRef.update must happen AFTER syncStackToUrl call
// Current: syncStackToUrl(currentIds, isAdding); then prevStackRef.current = stack;
// Preserve this order to prevent sync loops

// GOTCHA: getStackIds depends on `stack` from useFormStackState
// When used in useEffect, it must be in dependency array
// Pattern: [stack, syncToUrl, getStackIds, syncStackToUrl]

// GOTCHA: restoreFromUrl uses setTimeout(0) for flag reset
// This differs from new RAF pattern - preserve existing behavior for restoration
// Only apply RAF pattern to syncStackToUrl coalescing
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - using existing TypeScript types:

```typescript
// Existing types (no changes needed)
import type { UseFormStackURLSyncOptions, UseFormStackURLSyncReturn } from './useFormStackURLSync';

// New ref types to add
const isUpdatingRef: React.MutableRefObject<boolean>;
const pendingUpdateRef: React.MutableRefObject<number>;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD new refs to useFormStackURLSync hook
  - ADD: const isUpdatingRef = useRef<boolean>(false);
  - ADD: const pendingUpdateRef = useRef<number>(0);
  - LOCATION: After line 114 (after isInitializedRef declaration)
  - NAMING: Follow existing {verb}{noun}Ref pattern
  - TYPE: Use MutableRefObject with explicit type annotations
  - DEPENDENCIES: None

Task 2: MODIFY syncStackToUrl function to use coalescing pattern
  - MODIFY: Function signature remains same: syncStackToUrl(formIds, usePushState = true)
  - ADD: Version tracking - const updateId = ++pendingUpdateRef.current;
  - ADD: Store latest stack in latestStackRef (need to add this ref too)
  - WRAP: URL update in requestAnimationFrame callback
  - CHECK: if (updateId === pendingUpdateRef.current) before applying update
  - PRESERVE: All existing logic for SSR checks, isRestoringRef check, history API calls
  - LOCATION: Lines 128-145 (current syncStackToUrl implementation)
  - PATTERN: Follow MITIGATION_DECISION.md lines 265-286

Task 3: ADD latestStackRef for storing latest stack value
  - ADD: const latestStackRef = useRef<readonly string[]>([]);
  - UPDATE: In syncStackToUrl, store: latestStackRef.current = formIds;
  - LOCATION: After pendingUpdateRef declaration (line ~116)
  - TYPE: readonly string[] matching getStackIds return type

Task 4: MODIFY syncStackToUrl to set/reset isUpdatingRef flag
  - SET: isUpdatingRef.current = true before requestAnimationFrame
  - RESET: isUpdatingRef.current = false in nested requestAnimationFrame
  - LOCATION: Inside syncStackToUrl function
  - PATTERN: Double-RAF for state stabilization (outer RAF for batching, inner RAF for completion)

Task 5: MODIFY popstate handler to check isUpdatingRef
  - ADD: if (isUpdatingRef.current) return; at start of handlePopstate
  - LOCATION: Line 184 (inside handlePopstate function)
  - PRESERVE: All existing popstate logic

Task 6: MODIFY URL sync useEffect to skip if updating
  - ADD: if (isUpdatingRef.current) return; check at start of effect
  - LOCATION: Line 228 (start of URL sync useEffect)
  - ALTERNATIVE: The RAF coalescing makes this less critical, but adds defensive guard

Task 7: VERIFY JSDoc comments remain accurate
  - REVIEW: All function JSDoc comments
  - UPDATE: If any behavior changes, update documentation
  - PRESERVE: @example tags showing usage patterns
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CRITICAL IMPLEMENTATION PATTERN - syncStackToUrl with RAF Coalescing
// ============================================================================
// This is the CORE of the race condition fix. Study this pattern carefully.

// NEW REFS TO ADD (after line 114):
const isUpdatingRef = useRef<boolean>(false);
const pendingUpdateRef = useRef<number>(0);
const latestStackRef = useRef<readonly string[]>([]);

// MODIFIED syncStackToUrl FUNCTION (replaces lines 128-145):
const syncStackToUrl = useCallback(
  (formIds: readonly string[], usePushState: boolean = true) => {
    // PRESERVE: Existing SSR protection
    if (typeof window === 'undefined') return;

    // PRESERVE: Existing restoration check
    if (isRestoringRef.current) return;

    // NEW: Store latest stack value
    latestStackRef.current = formIds;

    // NEW: Create version ID for this update
    const updateId = ++pendingUpdateRef.current;

    // NEW: Set updating flag
    isUpdatingRef.current = true;

    // NEW: Use requestAnimationFrame to coalesce rapid updates
    requestAnimationFrame(() => {
      // CHECK: Only proceed if this is still the latest update
      if (updateId !== pendingUpdateRef.current) {
        return; // A newer update has superseded this one
      }

      // PRESERVE: Existing URL building logic
      const url = buildFormStackUrl(latestStackRef.current, paramName);
      const historyState = { [paramName]: [...latestStackRef.current] };

      // PRESERVE: Existing history API calls
      if (usePushState) {
        window.history.pushState(historyState, '', url);
      } else {
        window.history.replaceState(historyState, '', url);
      }

      // NEW: Reset updating flag in next frame (double-RAF pattern)
      requestAnimationFrame(() => {
        isUpdatingRef.current = false;
      });
    });
  },
  [paramName]
);

// ============================================================================
// MODIFY popstate HANDLER (line 184)
// ============================================================================
const handlePopstate = (event: PopStateEvent) => {
  // NEW: Skip if URL update is in progress
  if (isUpdatingRef.current) return;

  // PRESERVE: All existing popstate logic
  isRestoringRef.current = true;
  // ... rest of existing handler unchanged ...
};

// ============================================================================
// MODIFY URL SYNC EFFECT (line 228)
// ============================================================================
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!syncToUrl) return;
  if (!isInitializedRef.current) return;

  // NEW: Optional guard - skip if update in progress
  // Note: RAF coalescing makes this less critical, but adds safety
  if (isUpdatingRef.current) return;

  // PRESERVE: All existing sync logic
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

// ============================================================================
// GOTCHA: Double-RAF Timing Pattern Explained
// ============================================================================
// Outer requestAnimationFrame:
//   - Batches multiple rapid calls into single browser frame
//   - Runs before next paint (~16ms later)
//   - Ensures URL updates happen after React commits state
//
// Inner requestAnimationFrame:
//   - Resets the isUpdatingRef flag AFTER the URL update completes
//   - Ensures flag stays true during the entire update operation
//   - Prevents new updates from starting while current one finishes
//
// Why double-RAF?
//   - Single RAF: Flag might reset before URL update completes
//   - Double RAF: Flag stays true until after paint, ensures completion

// ============================================================================
// GOTCHA: Version Counter Pattern Explained
// ============================================================================
// pendingUpdateRef.current acts as a "monotonically increasing counter"
//
// Example timeline:
//   t=0: syncStackToUrl(['a']) -> updateId=1, pendingUpdateRef.current=1
//   t=1: syncStackToUrl(['a','b']) -> updateId=2, pendingUpdateRef.current=2
//   t=2: syncStackToUrl(['a','b','c']) -> updateId=3, pendingUpdateRef.current=3
//   t=16: RAF callback for updateId=1 runs -> 1 !== 3, SKIPPED
//   t=16: RAF callback for updateId=2 runs -> 2 !== 3, SKIPPED
//   t=16: RAF callback for updateId=3 runs -> 3 === 3, EXECUTES
//
// Result: Only the latest update (['a','b','c']) is applied to URL

// ============================================================================
// PRESERVE: Existing ref patterns
// ============================================================================
// isRestoringRef - Preserves existing restoration lock behavior
// prevStackRef - Preserves existing change detection logic
// isInitializedRef - Preserves existing one-time init guard
```

### Integration Points

```yaml
DEPENDENCIES:
  - import: { useFormStackState } from './useFormStackState'
    reason: Reads stack state for sync
    usage: const { stack } = useFormStackState();

  - import: { useFormStackActions } from './useFormStackActions'
    reason: Uses popToIndex for back navigation
    usage: const { popToIndex } = useFormStackActions();

  - import: { buildFormStackUrl } from '../utils'
    reason: Builds URL from form IDs
    usage: const url = buildFormStackUrl(formIds, paramName);

AFFECTED_COMPONENTS:
  - components/FormStackProvider.tsx
    reason: Provider that wraps the hook
    impact: No changes needed, hook behavior is internally modified

  - examples/**/* (all example apps)
    reason: Consume useFormStackURLSync hook
    impact: No changes needed - API unchanged

TEST_FILES:
  - src/hooks/__tests__/useFormStackURLSync.test.tsx
    reason: Existing tests must continue to pass
    action: Run tests, verify no regressions
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after file modification - fix before proceeding
npm run type-check
# Expected: "No type errors found"
# If errors: Read TypeScript output and fix type issues

# Format the file
npm run format
# or: npx prettier --write src/hooks/useFormStackURLSync.ts

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test the specific hook (all tests should pass)
npm test -- src/hooks/__tests__/useFormStackURLSync.test.tsx

# Alternative: Run tests in watch mode for rapid feedback
npm test -- --watch src/hooks/__tests__/useFormStackURLSync.test.tsx

# Full test suite for hooks
npm test -- src/hooks/__tests__/

# Coverage validation (optional but recommended)
npm run test:coverage
# Check that useFormStackURLSync coverage is maintained or improved

# Expected: All tests pass. If failing, debug root cause and fix implementation.
# Common issues:
#   - isUpdatingRef not being reset properly
#   - RAF callback not executing
#   - Version comparison logic incorrect
```

### Level 3: Integration Testing (System Validation)

```bash
# Start example app to test in browser
cd examples
npm install
npm run dev

# Manual testing checklist:
# 1. Open example app in browser
# 2. Open Form A
# 3. QUICKLY open Form B (before URL updates)
# 4. QUICKLY open Form C (before URL updates)
# 5. Verify URL shows ?forms=form-a,form-b,form-c
# 6. Use browser back button
# 7. Verify Form C closes, URL updates to ?forms=form-a,form-b
# 8. Bookmark the page
# 9. Open bookmark in new tab
# 10. Verify forms A and B are restored

# Expected: All manual tests pass, URL matches form state at all times

# Test rapid form closing:
# 1. Open forms A, B, C
# 2. Rapidly click back button 3 times
# 3. Verify all forms close correctly
# 4. Verify URL is empty or shows initial state
```

### Level 4: Race Condition Validation

```bash
# CRITICAL: Test the specific race condition scenario

# Scenario 1: Rapid form opening
# 1. Open browser DevTools Console
# 2. Run this test script:
#    - Simulate rapid stack changes
#    - Monitor history.pushState calls
#    - Verify only ONE pushState for all changes

# In console:
let pushStateCount = 0;
const originalPushState = history.pushState;
history.pushState = function(...args) {
  pushStateCount++;
  console.log('pushState call #' + pushStateCount, args);
  return originalPushState.apply(this, args);
};

// Then rapidly trigger form opens:
// Should see only 1 pushState for 3 rapid opens

# Scenario 2: Concurrent popstate and sync
# 1. Open forms A, B, C
# 2. Click back button WHILE URL is updating
# 3. Verify: popstate is skipped if isUpdatingRef is true
# 4. Verify: No history corruption

# Expected: Race conditions are eliminated, URL always consistent
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Type checking passes: `npm run type-check`
- [ ] All tests pass: `npm test -- src/hooks/__tests__/useFormStackURLSync.test.tsx`
- [ ] No formatting issues: `npm run format`
- [ ] Manual browser testing successful
- [ ] Race condition scenarios tested and pass

### Feature Validation

- [ ] `isUpdatingRef` tracks URL update state correctly
- [ ] `pendingUpdateRef` version counter increments properly
- [ ] `latestStackRef` stores latest stack value
- [ ] Rapid `syncStackToUrl` calls are coalesced into single URL update
- [ ] Only latest stack state is synchronized to URL
- [ ] Popstate handler respects `isUpdatingRef` flag
- [ ] URL restoration on mount still works
- [ ] Browser back/forward navigation still works
- [ ] Force URL update still works
- [ ] No regressions in existing functionality

### Code Quality Validation

- [ ] Follows existing ref naming convention (`{verb}{noun}Ref`)
- [ ] TypeScript types are explicit (`useRef<Type>(value)`)
- [ ] JSDoc comments are accurate and complete
- [ ] No new dependencies added
- [ ] SSR protection (`typeof window === 'undefined'`) preserved
- [ ] Existing `isRestoringRef` pattern still works
- [ ] Code is self-documenting with clear variable names

---

## Anti-Patterns to Avoid

- ❌ **Don't modify `isRestoringRef` behavior** - Keep existing restoration logic unchanged
- ❌ **Don't use `setTimeout(0)` for new refs** - Use `requestAnimationFrame` for frame-aligned timing
- ❌ **Don't add `isMountedRef` in this task** - That's P1.M2.T2.S2 (separate task)
- ❌ **Don't change the hook's API** - Return type and exported interface must remain same
- ❌ **Don't skip existing SSR checks** - All browser API usage needs `typeof window` guard
- ❌ **Don't use `useDeferredValue` or `useTransition`** - Decision document explicitly rejected these
- ❌ **Don't modify test files** - Existing tests should pass without changes
- ❌ **Don't add console.log** - Use browser DevTools for debugging, not console output
- ❌ **Don't use single-RAF pattern** - Must use double-RAF for proper flag timing
- ❌ **Don't forget to check version ID** - The `updateId !== pendingUpdateRef.current` check is critical

---

## Appendix: Decision Context

### Why This Pattern Was Selected

From `/plan/docs/bugfix/P1M2T1S2/MITIGATION_DECISION.md`:

**useRef + requestAnimationFrame was selected because:**
- ✅ URL updates within same frame (~16ms) - perceived as instant
- ✅ Atomic operations - completes or doesn't execute
- ✅ Version tracking prevents race conditions
- ✅ Works with all React versions
- ✅ Simple mental model
- ✅ Minimal overhead

**useDeferredValue was rejected because:**
- ❌ URL lag is unacceptable - User sees state change but URL doesn't update
- ❌ Bookmarking broken - User bookmarks before URL updates, gets wrong state
- ❌ Sharing broken - Copy URL before it updates, shares wrong state

**useTransition was rejected because:**
- ❌ Updates may be interrupted - Transition can be abandoned if user interacts
- ❌ Unpredictable completion - URL may never update
- ❌ Not for external system writes - React docs explicitly warn against this

---

## References Summary

### Internal Documentation
- `/plan/docs/bugfix/P1M2T1S2/MITIGATION_DECISION.md` - Pattern decision with implementation sketch
- `/plan/docs/architecture/testing_best_practices.md` - Section 2.2 useRef pattern

### External Documentation
- https://react.dev/learn/referencing-values-with-refs - React useRef documentation
- https://react.dev/learn/synchronizing-with-effects - Effect cleanup patterns
- https://developer.mozilla.org/en-US/docs/Web/API/History_API - History API reference

### Code Files
- `src/hooks/useFormStackURLSync.ts` - Target file for modification
- `src/hooks/__tests__/useFormStackURLSync.test.tsx` - Existing tests
- `src/utils/urlEncoding.ts` - URL encoding utilities

---

**PRP Version**: 1.0
**Last Updated**: 2026-01-11
**Status**: READY FOR IMPLEMENTATION
**Next Task**: P1.M2.T2.S2 (Add isMountedRef pattern for unmount safety)
