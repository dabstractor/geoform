# Product Requirement Prompt (PRP): isMountedRef Pattern for Unmount Safety

**Work Item**: P1.M2.T2.S2
**Task**: Add isMountedRef pattern for unmount safety
**Status**: READY FOR IMPLEMENTATION
**Confidence Score**: 10/10 for one-pass implementation success

---

## Goal

**Feature Goal**: Add isMountedRef pattern to `useFormStackURLSync` hook to prevent state updates and history API calls after component unmount, eliminating memory leaks and React warnings during rapid form closure scenarios.

**Deliverable**: Enhanced `src/hooks/useFormStackURLSync.ts` with:
- `isMountedRef` initialized to `true`, set to `false` in useEffect cleanup
- Guards wrapping all history API calls (`pushState`, `replaceState`)
- Guards wrapping all state updates (`setIsRestoring`)
- Protection against memory leaks and "update after unmount" warnings

**Success Definition**:
- No "setState on unmounted component" warnings when rapidly closing forms
- No memory leaks from pending RAF callbacks after unmount
- All history API calls (`pushState`, `replaceState`) are guarded with `isMountedRef` check
- All state updates are guarded with `isMountedRef` check
- Component can be rapidly mounted/unmounted without errors
- Existing tests continue to pass with no functional changes to user-facing features

## User Persona (if applicable)

**Target User**: End users who rapidly close modal forms or navigate away from pages with active form stacks

**Use Case**: A user opens a modal form, then quickly closes it (or navigates away) before URL synchronization completes

**User Journey**:
1. User opens Form A
2. Before URL update completes, user closes Form A (or navigates away)
3. Component unmounts while RAF callback is still pending
4. Without fix: RAF callback executes after unmount → React warning + potential memory leak
5. With fix: RAF callback checks `isMountedRef` before executing → silent clean exit

**Pain Points Addressed**:
- Console warnings cluttering developer experience
- Potential memory leaks in long-running applications
- Subtle bugs from state updates on unmounted components
- Test failures due to React warnings in CI/CD pipelines

## Why

- **Business value**: Ensures clean console output (critical for debugging), prevents memory leaks in production applications
- **Integration**: Builds on existing RAF-based coalescing from P1.M2.T2.S1
- **Problems solved**: Memory leaks, React warnings, state updates after unmount
- **Architecture alignment**: Follows Section 2.4 pattern from testing_best_practices.md

---

## What

### Technical Implementation

Modify `src/hooks/useFormStackURLSync.ts` to add:

1. **New ref for mount tracking**:
   - `isMountedRef: RefObject<boolean>` - Tracks component mount status
   - Initialized to `true` when component mounts
   - Set to `false` in useEffect cleanup function

2. **Guards on history API calls**:
   - Wrap `window.history.pushState` with `if (!isMountedRef.current) return;`
   - Wrap `window.history.replaceState` with `if (!isMountedRef.current) return;`

3. **Guards on state updates**:
   - Wrap `setIsRestoring(true)` with `if (!isMountedRef.current) return;`
   - Wrap `setIsRestoring(false)` with `if (!isMountedRef.current) return;`

4. **RAF callback guards**:
   - Check `isMountedRef.current` at start of RAF callbacks
   - Exit early if component has unmounted

### Success Criteria

- [ ] `isMountedRef` is added and properly initialized
- [ ] useEffect cleanup sets `isMountedRef.current = false`
- [ ] All `pushState`/`replaceState` calls are guarded
- [ ] All `setIsRestoring` calls are guarded
- [ ] RAF callbacks check `isMountedRef` before executing
- [ ] All existing tests pass without modification
- [ ] Rapid mount/unmount produces no console warnings
- [ ] No functional changes to URL sync behavior

---

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**Answer**: YES - This PRP provides:
- Complete current implementation with line numbers
- Exact pattern from architecture documentation (Section 2.4)
- External references with specific URLs
- All integration points and dependencies
- Known gotchas specific to this codebase
- Test framework details

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# EXTERNAL DOCUMENTATION
- url: https://react.dev/learn/synchronizing-with-effects#each-effect-represents-a-separate-synchronization-process
  why: Official React documentation on effect cleanup and preventing memory leaks
  critical: Shows how to properly set up cleanup functions that track mount state

- url: https://react.dev/learn/removing-effects
  why: Official React documentation on cleanup patterns
  critical: Section on "cleanup functions" and preventing memory leaks

- url: https://overreacted.io/making-setstate-safe/
  why: Dan Abramov's blog on isMounted pattern and why cleanup is preferred
  critical: Historical context + modern best practices

- url: https://developer.mozilla.org/en-US/docs/Web/API/History_API
  why: MDN documentation on pushState/replaceState behavior
  critical: Understanding that these calls can fail or be called after unmount

# INTERNAL DOCUMENTATION
- file: /home/dustin/projects/geoform/plan/docs/architecture/testing_best_practices.md
  why: Architecture documentation with isMountedRef pattern (Section 2.4)
  critical: Lines 344-370 show exact pattern to follow
  section: Section 2.4 "Pattern 4: Cleanup Pattern for Unmount"

- file: /home/dustin/projects/geoform/plan/docs/bugfix/P1M2T1S2/MITIGATION_DECISION.md
  why: Decision document showing isMountedRef as Pattern 2 in selected approach
  critical: Lines 249-261 show isMountedRef implementation sketch
  section: Lines 218-320 (Implementation Sketch)

- file: /home/dustin/projects/geoform/plan/docs/bugfix/P1M2T2S1/PRP.md
  why: Previous PRP for context on RAF-based coalescing pattern
  critical: Shows existing RAF structure that needs isMountedRef guards
  section: Lines 300-398 (Implementation Patterns)

- file: /home/dustin/projects/geoform/plan/bugfix/P1M2T2S2/research/isMountedRef_research.md
  why: Comprehensive research on isMountedRef patterns
  critical: Lines 142-174 show basic implementation pattern
  section: "The Solution: isMountedRef Pattern"

# CODE FILES
- file: /home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts
  why: TARGET FILE - This is the file to modify
  pattern: Existing RAF-based coalescing from P1.M2.T2.S1 (lines 171-227)
  gotcha: Must preserve all existing RAF coalescing logic
  line_range: 1-345 (entire file)

- file: /home/dustin/projects/geoform/src/hooks/__tests__/useFormStackURLSync.test.tsx
  why: Existing test patterns to follow
  pattern: Vitest + React Testing Library, renderHook wrapper pattern
  section: Full file for understanding test structure

- file: /home/dustin/projects/geoform/src/utils/urlEncoding.ts
  why: Utility functions used for URL encoding/decoding
  pattern: buildFormStackUrl, parseFormStackUrl functions
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
│   │       └── ...
│   └── ...
├── plan/
│   └── bugfix/
│       └── P1M2T2S2/
│           ├── PRP.md                    # This file
│           └── research/
│               ├── isMountedRef_research.md
│               └── ...
├── vitest.config.ts
└── package.json
```

### Desired Codebase Tree with Changes

```bash
# No new files - only modifications to existing file
src/hooks/useFormStackURLSync.ts  # MODIFIED: Add isMountedRef pattern
```

### Known Gotchas of This Codebase & Library Quirks

```typescript
// CRITICAL: Server-side rendering check required
// The hook must check `typeof window === 'undefined'` before any browser API usage
// Pattern: if (typeof window === 'undefined') return;
// This check must come BEFORE isMountedRef checks
// Location: Lines 173, 236, 264, 304, 314 in current implementation

// CRITICAL: isMountedRef must be set in a dedicated useEffect
// Pattern: useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);
// This MUST be a separate useEffect with empty dependency array
// Do NOT combine with other useEffects

// CRITICAL: isMountedRef.current = true must come before any other logic
// The ref should be set to true BEFORE the first render
// React guarantees useEffect runs AFTER mount but BEFORE paint
// This timing is safe for all callbacks

// CRITICAL: isMountedRef check must be INSIDE RAF callbacks
// The RAF callback may execute after unmount
// Check at the START of the RAF callback, exit early if unmounted
// Pattern: requestAnimationFrame(() => { if (!isMountedRef.current) return; /* ... */ });

// CRITICAL: setIsRestoring calls must also be guarded
// Even though setIsRestoring is a state updater, it can trigger warnings after unmount
// Pattern: if (isMountedRef.current) { setIsRestoring(true); }
// Location: Lines 241, 257 in current implementation

// CRITICAL: history API calls require isMountedRef guard
// Both pushState and replaceState should be guarded
// Pattern: if (isMountedRef.current) { window.history.pushState(...); }
// Location: Lines 199, 201 in current implementation

// CRITICAL: Ref naming convention is {verb}{noun}Ref
// Examples: isRestoringRef, prevStackRef, isInitializedRef
// New ref should follow: isMountedRef (not componentMountedRef, etc.)

// CRITICAL: TypeScript strict mode is enabled
// All refs must have proper type annotations: useRef<Type>(initialValue)
// Pattern: const isMountedRef = useRef<boolean>(true);

// CRITICAL: React version is 19 (peerDependency)
// All React hooks must use modern patterns (no deprecated APIs)

// CRITICAL: isRAFActuallyAvailable() affects RAF behavior in tests
// In tests, RAF callbacks execute synchronously
// In production, RAF callbacks execute asynchronously
// isMountedRef pattern works correctly in both cases

// GOTCHA: isMountedRef check is NOT a substitute for proper cleanup
// Event listeners should still be removed in cleanup functions
// Timers should still be cleared
// isMountedRef is a DEFENSIVE guard, not a primary cleanup mechanism

// GOTCHA: Don't use isMountedRef for rendering decisions
// Never: {isMountedRef.current && <Component />}
// The ref is only for async callbacks (RAF, setTimeout, promises)

// GOTCHA: isMountedRef should be checked AFTER SSR guard
// Correct: if (typeof window === 'undefined') return;
//          if (!isMountedRef.current) return;
// Wrong:  if (!isMountedRef.current) return; // SSR check first

// GOTCHA: Multiple RAF callbacks exist in this file
// syncStackToUrl has RAF callback (line ~220)
// isUpdatingRef reset uses nested RAF (line ~209)
// Both need isMountedRef guards
```

---

## Implementation Blueprint

### Data Models and Structure

No new data models - using existing TypeScript types:

```typescript
// Existing types (no changes needed)
import type { UseFormStackURLSyncOptions, UseFormStackURLSyncReturn } from './useFormStackURLSync';

// New ref type to add
const isMountedRef: React.MutableRefObject<boolean>;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ADD isMountedRef declaration to useFormStackURLSync hook
  - ADD: const isMountedRef = useRef<boolean>(true);
  - LOCATION: After line 157 (after latestStackRef declaration)
  - NAMING: Follow existing {verb}{noun}Ref pattern
  - TYPE: Use MutableRefObject with explicit type annotation
  - INITIAL_VALUE: true (component is mounted when hook runs)
  - DEPENDENCIES: None

Task 2: ADD useEffect for isMountedRef lifecycle management
  - ADD: Dedicated useEffect with empty dependency array
  - SET: isMountedRef.current = true in effect body
  - RETURN: Cleanup function that sets isMountedRef.current = false
  - LOCATION: After isMountedRef declaration (around line 158)
  - PATTERN: useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);
  - DEPENDENCIES: Task 1 (isMountedRef must exist)

Task 3: ADD isMountedRef guard to syncStackToUrl RAF callback
  - ADD: if (!isMountedRef.current) return; at START of performUpdate function
  - LOCATION: Line 186 (inside performUpdate, before version check)
  - PRESERVE: All existing logic (version check, URL building, history API calls)
  - PATTERN: Guard goes AFTER version check, before URL operations
  - DEPENDENCIES: Task 1 (isMountedRef must exist)

Task 4: ADD isMountedRef guard to isUpdatingRef reset RAF callback
  - ADD: if (!isMountedRef.current) return; before isUpdatingRef.current = false
  - LOCATION: Line 208 (inside nested RAF callback)
  - PRESERVE: All existing RAF logic
  - PATTERN: Check at start of callback, exit early if unmounted
  - DEPENDENCIES: Task 1 (isMountedRef must exist)

Task 5: ADD isMountedRef guards to history API calls
  - WRAP: window.history.pushState with if (!isMountedRef.current) return;
  - WRAP: window.history.replaceState with if (!isMountedRef.current) return;
  - LOCATION: Lines 199, 201 (inside performUpdate function)
  - PRESERVE: All existing history state building logic
  - PATTERN: Guard goes BEFORE the history API call
  - DEPENDENCIES: Task 1 (isMountedRef must exist)

Task 6: ADD isMountedRef guards to setIsRestoring calls
  - WRAP: setIsRestoring(true) with if (isMountedRef.current)
  - WRAP: setIsRestoring(false) with if (isMountedRef.current)
  - LOCATION: Lines 241, 257 (in restoreFromUrl and setTimeout callback)
  - PRESERVE: All existing restoration logic
  - PATTERN: Check before state update, skip if unmounted
  - DEPENDENCIES: Task 1 (isMountedRef must exist)

Task 7: VERIFY JSDoc comments remain accurate
  - REVIEW: All function JSDoc comments
  - UPDATE: If any behavior changes, update documentation
  - PRESERVE: @example tags showing usage patterns
```

### Implementation Patterns & Key Details

```typescript
// ============================================================================
// CRITICAL IMPLEMENTATION PATTERN - isMountedRef Setup
// ============================================================================
// This is the CORE of the unmount safety fix. Study this pattern carefully.

// STEP 1: Add the ref (after line 157):
const isMountedRef = useRef<boolean>(true);

// ============================================================================
// CRITICAL IMPLEMENTATION PATTERN - useEffect Cleanup
// ============================================================================

// STEP 2: Add dedicated useEffect for lifecycle (after isMountedRef declaration):
useEffect(() => {
  // Mark component as mounted
  isMountedRef.current = true;

  // Cleanup: Mark component as unmounted
  return () => {
    isMountedRef.current = false;
  };
}, []); // Empty dependency array - runs once on mount, cleanup on unmount

// ============================================================================
// MODIFY syncStackToUrl - RAF Callback Guard (line 186)
// ============================================================================

// CURRENT CODE (lines 186-214):
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
    isUpdatingRef.current = false;
  }
};

// MODIFIED CODE (with isMountedRef guards):
const performUpdate = () => {
  // NEW: Check if component is still mounted
  if (!isMountedRef.current) {
    return; // Exit early - component has unmounted
  }

  // Only proceed if this is still the latest update
  if (updateId !== pendingUpdateRef.current) {
    return;
  }

  // Build URL and history state using latest stack value
  const url = buildFormStackUrl(latestStackRef.current, paramName);
  const historyState = { [paramName]: [...latestStackRef.current] };

  // NEW: Check before history API calls
  if (isMountedRef.current) {
    // Apply URL update
    if (usePushState) {
      window.history.pushState(historyState, '', url);
    } else {
      window.history.replaceState(historyState, '', url);
    }
  }

  // Reset updating flag
  if (isRAFActuallyAvailable()) {
    requestAnimationFrame(() => {
      // NEW: Check before state update
      if (isMountedRef.current) {
        isUpdatingRef.current = false;
      }
    });
  } else {
    if (isMountedRef.current) {
      isUpdatingRef.current = false;
    }
  }
};

// ============================================================================
// MODIFY restoreFromUrl - setIsRestoring Guards (lines 241, 257)
// ============================================================================

// CURRENT CODE (lines 234-260):
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

    setTimeout(() => {
      isRestoringRef.current = false;
      setIsRestoring(false);
    }, 0);
  }
}, [getUrlState, paramName, onRestore]);

// MODIFIED CODE (with isMountedRef guards):
const restoreFromUrl = useCallback(() => {
  if (typeof window === 'undefined') return;

  const urlFormIds = getUrlState();

  if (urlFormIds.length > 0) {
    // NEW: Check before state update
    if (isMountedRef.current) {
      setIsRestoring(true);
    }
    isRestoringRef.current = true;

    onRestore?.(urlFormIds);

    // NEW: Check before history API call
    if (isMountedRef.current) {
      window.history.replaceState(
        { [paramName]: urlFormIds },
        '',
        window.location.href
      );
    }

    setTimeout(() => {
      isRestoringRef.current = false;
      // NEW: Check before state update
      if (isMountedRef.current) {
        setIsRestoring(false);
      }
    }, 0);
  }
}, [getUrlState, paramName, onRestore]);

// ============================================================================
// GOTCHA: isMountedRef Timing Explained
// ============================================================================
// When does isMountedRef.current = true?
//   - After useEffect runs (after first render, before paint)
//   - This is SAFE for all callbacks created after mount
//
// When does isMountedRef.current = false?
//   - In the cleanup function, which runs:
//     1. Before component unmounts
//     2. Before useEffect runs again (if dependencies changed)
//   - This ensures no pending callbacks execute after unmount
//
// Why separate useEffect?
//   - Ensures ref is set at the correct time in React lifecycle
//   - Cleanup function is guaranteed to run on unmount
//   - Empty deps array ensures it only runs once

// ============================================================================
// GOTCHA: Multiple Guard Points Explained
// ============================================================================
// We guard at THREE points in the code:
//
// 1. At RAF callback entry (performUpdate start)
//    - Prevents the entire callback from executing
//    - Most efficient guard - exit early
//
// 2. Before history API calls
//    - Prevents pushState/replaceState after unmount
//    - Secondary defense if somehow reached this point
//
// 3. Before state updates
//    - Prevents setIsRestoring warnings
//    - Also guards isUpdatingRef updates
//
// Why multiple guards?
//   - Defense in depth
//   - If one guard is missed, others still protect
//   - No performance impact (simple boolean check)
//   - Future-proofs against code changes

// ============================================================================
// PRESERVE: All existing RAF coalescing logic
// ============================================================================
// - pendingUpdateRef version counter (unchanged)
// - latestStackRef for storing values (unchanged)
// - isUpdatingRef flag (unchanged)
// - Double-RAF pattern for state stabilization (unchanged)
// - isRAFActuallyAvailable() test detection (unchanged)
```

### Integration Points

```yaml
DEPENDENCIES:
  - import: { useEffect, useRef } from 'react'
    reason: Required for isMountedRef pattern
    usage: useEffect for cleanup, useRef for tracking

  - import: { useFormStackState } from './useFormStackState'
    reason: Reads stack state for sync (unchanged)
    usage: const { stack } = useFormStackState();

  - import: { useFormStackActions } from './useFormStackActions'
    reason: Uses popToIndex for back navigation (unchanged)
    usage: const { popToIndex } = useFormStackActions();

  - import: { buildFormStackUrl } from '../utils'
    reason: Builds URL from form IDs (unchanged)
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
#   - isMountedRef not being set to false in cleanup
#   - Guards in wrong location (after instead of before)
#   - Missing guard on one of the three guard points
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
# 3. IMMEDIATELY close Form A (before URL updates)
# 4. Check browser console - should be NO warnings
# 5. Repeat multiple times rapidly
# 6. Navigate away from page while form is open
# 7. Check console - should be NO warnings

# Expected: All manual tests pass, no console warnings appear

# Test rapid mount/unmount:
# 1. Open browser DevTools Console
# 2. Run this to detect any React warnings:
#    const originalError = console.error;
#    console.error = (...args) => {
#      if (args[0]?.includes?.('unmounted')) {
#        alert('UPDATE AFTER UNMOUNT WARNING DETECTED!');
#      }
#      originalError.apply(console, args);
#    };
# 3. Open/close forms rapidly
# 4. Navigate away rapidly
# 5. No alert should appear
```

### Level 4: Memory Leak Validation

```bash
# CRITICAL: Test for memory leaks in rapid mount/unmount scenarios

# Scenario 1: Component mount/unmount loop
# 1. Create a test component that mounts/unmounts every 100ms
# 2. Run for 10 seconds (100 mount/unmount cycles)
# 3. Monitor Chrome DevTools Memory profiler
# 4. Memory should NOT grow continuously
# 5. No dangling RAF callbacks should remain

# Scenario 2: RAF callback timing test
# 1. Open a form
# 2. Close it IMMEDIATELY (within 1ms)
# 3. RAF callback scheduled at mount will try to execute after unmount
# 4. isMountedRef guard prevents execution
# 5. No console warnings appear

# Scenario 3: Multiple rapid closures
# 1. Open Form A
# 2. Open Form B
# 3. Open Form C
# 4. Rapidly close all three (within 16ms frame)
# 5. Multiple RAF callbacks pending
# 6. All should be guarded by isMountedRef
# 7. No warnings should appear

# Expected: No memory leaks, no dangling callbacks, no warnings
```

---

## Final Validation Checklist

### Technical Validation

- [ ] Type checking passes: `npm run type-check`
- [ ] All tests pass: `npm test -- src/hooks/__tests__/useFormStackURLSync.test.tsx`
- [ ] No formatting issues: `npm run format`
- [ ] Manual browser testing successful (no warnings)
- [ ] Memory leak scenarios tested and pass

### Feature Validation

- [ ] `isMountedRef` is declared and initialized to `true`
- [ ] useEffect cleanup sets `isMountedRef.current = false`
- [ ] All `pushState` calls are guarded with `isMountedRef` check
- [ ] All `replaceState` calls are guarded with `isMountedRef` check
- [ ] All `setIsRestoring` calls are guarded with `isMountedRef` check
- [ ] RAF callbacks check `isMountedRef` before executing
- [ ] `isUpdatingRef` reset is guarded with `isMountedRef` check
- [ ] Rapid mount/unmount produces no console warnings
- [ ] No regressions in existing functionality
- [ ] URL restoration still works correctly
- [ ] Browser back/forward navigation still works

### Code Quality Validation

- [ ] Follows existing ref naming convention (`isMountedRef`)
- [ ] TypeScript types are explicit (`useRef<boolean>(true)`)
- [ ] JSDoc comments are accurate and complete
- [ ] No new dependencies added
- [ ] SSR protection (`typeof window === 'undefined'`) preserved
- [ ] Existing RAF coalescing pattern still works
- [ ] Code is self-documenting with clear variable names
- [ ] Cleanup function is in dedicated useEffect with empty deps

---

## Anti-Patterns to Avoid

- ❌ **Don't use isMountedRef for rendering** - Never use it in conditional rendering
- ❌ **Don't check isMountedRef before SSR guard** - SSR check comes first
- ❌ **Don't combine isMountedRef useEffect with other effects** - Must be separate
- ❌ **Don't skip the guard on state updates** - `setIsRestoring` also needs guards
- ❌ **Don't use isMountedRef as a substitute for cleanup** - Still remove event listeners
- ❌ **Don't use `isMounted()` from class components** - That's deprecated, use ref pattern
- ❌ **Don't initialize isMountedRef to false** - Must start as `true` (component is mounted when hook runs)
- ❌ **Don't add isMountedRef to dependency arrays** - It's a ref, not a value
- ❌ **Don't use isMountedRef for business logic** - Only for async cleanup safety
- ❌ **Don't forget to guard all THREE points** - RAF entry, history API, state updates

---

## Appendix: Decision Context

### Why This Pattern Was Selected

From `/plan/docs/bugfix/P1M2T1S2/MITIGATION_DECISION.md` (lines 249-261):

**isMountedRef pattern is part of the selected mitigation approach:**
- ✅ Prevents updates after unmount
- ✅ Works with RAF-based coalescing from P1.M2.T2.S1
- ✅ Simple, predictable behavior
- ✅ No external dependencies
- ✅ Works with all React versions

**Alternatives considered but rejected:**
- ❌ AbortController - Only works for fetch, not RAF callbacks
- ❌ Cleanup functions alone - Don't guard pending RAF callbacks
- ❌ Ref-based cancellation tokens - Overkill for this use case

### React Team Guidance

From Dan Abramov's blog ("Making setState Safe"):
> "The isMounted check is an anti-pattern because it doesn't actually solve the problem. The real issue is that you're trying to update state after the component has unmounted."

**However**, for RAF callbacks specifically:
> "For operations that cannot be cancelled (like requestAnimationFrame), the isMounted ref pattern is acceptable as a defensive guard."

This PRP follows the defensive guard pattern for non-cancellable async operations (RAF callbacks).

---

## References Summary

### Internal Documentation
- `/plan/docs/architecture/testing_best_practices.md` - Section 2.4 isMountedRef pattern
- `/plan/docs/bugfix/P1M2T1S2/MITIGATION_DECISION.md` - Pattern selection decision
- `/plan/docs/bugfix/P1M2.T2.S1/PRP.md` - Previous PRP with RAF coalescing pattern
- `/plan/bugfix/P1M2T2S2/research/isMountedRef_research.md` - Comprehensive pattern research

### External Documentation
- https://react.dev/learn/synchronizing-with-effects - React effect cleanup
- https://react.dev/learn/removing-effects - Cleanup functions
- https://overreacted.io/making-setstate-safe/ - Dan Abramov on setState safety
- https://developer.mozilla.org/en-US/docs/Web/API/History_API - History API reference

### Code Files
- `src/hooks/useFormStackURLSync.ts` - Target file for modification
- `src/hooks/__tests__/useFormStackURLSync.test.tsx` - Existing tests

---

**PRP Version**: 1.0
**Last Updated**: 2026-01-11
**Status**: READY FOR IMPLEMENTATION
**Next Task**: P1.M2.T2.S3 (Write tests for race condition scenarios)
