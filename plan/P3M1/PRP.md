# P3.M1: URL Sync Plugin - Product Requirement Prompt

**Milestone**: P3.M1 - URL Sync Plugin
**Story Points**: 4 total (2 + 2)
**Status**: Ready for Implementation
**Confidence Score**: 8/10 for one-pass implementation success

---

## Goal

**Feature Goal**: Create an optional hook for bidirectional synchronization between the form stack state and URL query parameters, enabling shareable URLs, bookmarking, and browser back/forward navigation through form states.

**Deliverable**:
1. `useFormStackURLSync` - A React hook that synchronizes form stack state with URL query parameters
2. URL encoding utilities for stack serialization/deserialization
3. Integration with existing `FormStackProvider` and `useFormStack` hooks

**Success Definition**:
- Form stack state is encoded in URL query parameters (e.g., `?forms=org-form,team-form`)
- Opening a form updates the URL with `pushState`
- Closing a form updates the URL with `replaceState`
- Browser back/forward buttons navigate through form stack history
- Users can share URLs that restore the exact form stack state
- Users can bookmark form stack positions
- Hook is optional - existing functionality works without it
- All existing tests pass, new tests cover URL sync scenarios

---

## User Persona

**Target User**: React developers building hierarchical form systems who want URL-based state persistence

**Use Case**: When users need to:
- Share a link to a specific form state with colleagues
- Bookmark their progress in a multi-step form workflow
- Use browser back/forward buttons to navigate form history
- Recover form state after page refresh

**User Journey**:
1. Developer wraps their app with `FormStackProvider`
2. Developer calls `useFormStackURLSync()` at the app level
3. User opens forms - URL updates automatically (e.g., `?forms=org-form,team-form`)
4. User shares the URL with colleague
5. Colleague opens the URL and sees the same form stack restored
6. User clicks back button - form closes and URL updates
7. User bookmarks the URL for later

**Pain Points Addressed**:
- Form state lost on page refresh (now persisted in URL)
- Unable to share form progress with others (now shareable via URL)
- No browser navigation support (now back/forward works)
- Cannot deep-link to specific form states (now possible via URL)

---

## Why

- **Shareability**: Users can share URLs with exact form stack state
- **Bookmarkability**: Users can save and return to specific form positions
- **Browser Integration**: Back/forward buttons work intuitively for form navigation
- **Deep Linking**: Direct links to specific form states enable workflows
- **State Recovery**: Form stack survives page refresh
- **PRD Compliance**: Implements Section 11 "Query String Integration" requirement
- **Optional Plugin Architecture**: Follows PRD principle of "URL handling is pluggable, not mandatory"

---

## What

Implement a bidirectional URL sync hook that:

1. **Encodes form stack to URL** - Serialize form IDs to query parameter
2. **Decodes URL to form stack** - Parse query parameter to restore stack on mount
3. **Handles browser navigation** - Listen to `popstate` for back/forward
4. **Integrates with existing hooks** - Uses `useFormStackActions` for stack manipulation
5. **Provides restore-only option** - Allow URL restoration without continuous sync

### Success Criteria

- [ ] `useFormStackURLSync` hook created with configurable options
- [ ] Form IDs encoded as comma-separated query parameter: `?forms=id1,id2,id3`
- [ ] Opening a form calls `pushState` (creates history entry)
- [ ] Closing/canceling a form calls `replaceState` (updates current entry)
- [ ] Browser back button closes the top form
- [ ] Browser forward button re-opens previously closed form
- [ ] URL restoration works on page load
- [ ] Hook is fully optional - FormStackProvider works without it
- [ ] TypeScript types properly defined and exported
- [ ] Unit tests cover encoding/decoding, popstate handling
- [ ] Integration tests verify back/forward navigation
- [ ] All existing tests pass (no regressions)

---

## All Needed Context

### Context Completeness Check

_This PRP provides: exact file paths, code patterns to follow, TypeScript interfaces, URL encoding strategy, History API usage patterns, and validation commands. An implementer unfamiliar with the codebase can successfully implement using only this document._

### Documentation & References

```yaml
# MUST READ - External Documentation
- url: https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API
  why: Core History API usage patterns for pushState/replaceState
  critical: |
    - pushState creates NEW history entry (for opening forms)
    - replaceState updates CURRENT entry (for closing forms)
    - popstate fires on back/forward, NOT on pushState/replaceState calls
    - Must manually update state when calling pushState/replaceState

- url: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
  why: URL query parameter manipulation API
  critical: |
    - Use set() to replace values, append() to add multiple
    - get() returns string | null, always convert types
    - toString() returns query string without leading ?

- url: https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event
  why: Browser back/forward navigation handling
  critical: |
    - event.state contains the state object from pushState
    - Does NOT fire when pushState/replaceState is called
    - Firefox does NOT fire popstate on initial page load
    - Chrome/Safari DO fire popstate on initial page load

# MUST READ - Codebase Files
- file: src/hooks/useFormStackActions.ts
  why: Hook that provides openForm, closeForm, popToIndex actions
  pattern: |
    - Returns { openForm, closeForm, popToIndex }
    - openForm returns Promise<T | undefined>
    - closeForm pops top form
    - popToIndex cancels forms after index
  gotcha: Actions are stable references (memoized)

- file: src/hooks/useFormStackState.ts
  why: Hook that provides read-only stack state
  pattern: |
    - Returns { stack } where stack is readonly StackEntry[]
    - StackEntry has { id: string, label?: string }
  gotcha: Causes re-render when stack changes

- file: src/types/stack.ts
  why: StackEntry interface definition
  pattern: |
    - StackEntry: { id: string; label?: string }
    - OpenFormOptions: { id, component, label?, confirmOnCancel? }
  gotcha: Only id is required; label is optional

- file: src/components/FormStackProvider.tsx
  why: Main provider - DO NOT MODIFY (URL sync should be independent)
  pattern: |
    - Manages form stack via useReducer
    - Provides dual context (state + actions)
    - Renders FormStackRenderer internally
  gotcha: URL sync hook must work alongside, not inside provider

- file: src/context/formStackReducer.ts
  why: Reducer actions that modify stack
  pattern: |
    - PUSH_FORM: adds form to stack
    - POP_FORM: removes top form
    - POP_TO_INDEX: removes forms after index
  gotcha: Actions dispatched internally, not exposed to URL sync

# RESEARCH - URL Sync Patterns
- docfile: plan/P3M1/research/url-sync-patterns.md
  why: Comprehensive patterns for URL state synchronization
  section: "Custom Hooks Without Router" pattern

- docfile: plan/P3M1/research/browser-history-api.md
  why: Detailed History API usage with React hooks
  section: "React Hook Implementation Pattern"

- docfile: plan/P3M1/research/url-encoding-strategies.md
  why: URL encoding strategies comparison
  section: "Solution 4: Compact Custom Encoding" (comma-separated)
```

### Current Codebase Tree

```bash
src/
├── components/
│   ├── Breadcrumbs.tsx
│   ├── ConfirmationDialog.tsx
│   ├── FormErrorBoundary.tsx
│   ├── FormStackProvider.tsx          # DO NOT MODIFY
│   ├── FormStackRenderer.tsx
│   └── index.ts
├── context/
│   ├── FormStackContext.ts
│   ├── formStackReducer.ts
│   └── index.ts
├── hooks/
│   ├── useFormStack.ts
│   ├── useFormStackActions.ts
│   ├── useFormStackState.ts
│   └── index.ts                        # MODIFY: export new hook
├── types/
│   ├── context.ts
│   ├── form.ts
│   ├── index.ts                        # MODIFY: export new types
│   └── stack.ts
├── utils/
│   ├── createDeferredPromise.ts
│   └── index.ts                        # MODIFY: export encoding utils
└── index.ts                            # MODIFY: export public API
```

### Desired Codebase Tree (Files to Add)

```bash
src/
├── hooks/
│   ├── useFormStackURLSync.ts          # NEW: Main URL sync hook
│   ├── __tests__/
│   │   └── useFormStackURLSync.test.tsx # NEW: Unit tests
│   └── index.ts                        # MODIFY: export hook
├── utils/
│   ├── urlEncoding.ts                  # NEW: URL encoding utilities
│   ├── __tests__/
│   │   └── urlEncoding.test.ts         # NEW: Encoding tests
│   └── index.ts                        # MODIFY: export utils
├── types/
│   └── index.ts                        # MODIFY: export URLSyncOptions type
└── index.ts                            # MODIFY: export useFormStackURLSync
```

### Known Gotchas of Codebase & Library Quirks

```typescript
// CRITICAL: History API only available in browser
// Must guard for SSR/testing environments
if (typeof window === 'undefined') return; // Skip in SSR

// CRITICAL: popstate does NOT fire on pushState/replaceState
// You must manually sync state when YOU call these methods
const handleOpenForm = (formId: string) => {
  // 1. First push to history
  window.history.pushState({ forms: [...stack, formId] }, '', url);
  // 2. Then update React state (popstate won't do this for us)
  openFormOriginal(options);
};

// GOTCHA: Firefox doesn't fire popstate on initial page load
// Chrome/Safari do - use initialization guard
const isInitialized = useRef(false);
useEffect(() => {
  if (isInitialized.current) return;
  isInitialized.current = true;
  // Restore from URL only once
}, []);

// GOTCHA: URL params are always strings
// Form IDs with special chars need encoding
const encodeFormId = (id: string) => encodeURIComponent(id);
const decodeFormId = (encoded: string) => decodeURIComponent(encoded);

// GOTCHA: Empty stack should clear the query param, not set empty value
if (stack.length === 0) {
  params.delete('forms');
} else {
  params.set('forms', stack.join(','));
}

// GOTCHA: Don't create sync loops
// When restoring from URL, don't push back to URL
const isRestoringRef = useRef(false);
const syncStackToUrl = (stack) => {
  if (isRestoringRef.current) return;
  // ... sync logic
};

// GOTCHA: useFormStackActions doesn't expose internal dispatch
// URL sync must use the public openForm/closeForm/popToIndex APIs
// This means URL sync is a "wrapper" pattern, not a "replacement"
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// src/hooks/useFormStackURLSync.ts

/**
 * Options for URL sync hook
 */
export interface UseFormStackURLSyncOptions {
  /**
   * Query parameter name for form stack
   * @default 'forms'
   */
  paramName?: string;

  /**
   * Whether to restore form stack from URL on mount
   * @default true
   */
  restoreOnMount?: boolean;

  /**
   * Whether to continuously sync stack changes to URL
   * @default true
   */
  syncToUrl?: boolean;

  /**
   * Whether to sync URL changes (back/forward) to stack
   * @default true
   */
  syncFromUrl?: boolean;

  /**
   * Callback when stack is restored from URL
   * Useful for loading form components dynamically
   */
  onRestore?: (formIds: string[]) => void;
}

/**
 * Return type for useFormStackURLSync hook
 */
export interface UseFormStackURLSyncReturn {
  /**
   * Whether the hook is currently restoring from URL
   */
  isRestoring: boolean;

  /**
   * Get the current URL representation of the stack
   */
  getUrlState: () => string[];

  /**
   * Manually trigger a URL update (for edge cases)
   */
  forceUrlUpdate: () => void;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/urlEncoding.ts
  - IMPLEMENT: encodeFormStack, decodeFormStack, buildFormStackUrl, parseFormStackUrl
  - PATTERN: Comma-separated IDs with URL encoding for special characters
  - ENCODING: Use encodeURIComponent for individual IDs, join with ','
  - HANDLE: Empty stack returns empty string, invalid input returns empty array
  - TESTING: Pure functions, easy to unit test
  - NAMING: snake_case file, camelCase functions
  - PLACEMENT: src/utils/urlEncoding.ts

Task 2: CREATE src/utils/__tests__/urlEncoding.test.ts
  - IMPLEMENT: Unit tests for all encoding functions
  - FOLLOW pattern: src/utils/__tests__/createDeferredPromise.test.ts
  - TEST CASES:
    - Empty array encodes to empty string
    - Single ID encodes correctly
    - Multiple IDs encode as comma-separated
    - Special characters are URL-encoded
    - Invalid URL param returns empty array
    - Round-trip encoding/decoding preserves data
  - NAMING: describe('encodeFormStack'), describe('decodeFormStack')
  - PLACEMENT: src/utils/__tests__/urlEncoding.test.ts

Task 3: MODIFY src/utils/index.ts
  - ADD: Export urlEncoding functions
  - PATTERN: Follow existing export pattern
  - ADD lines:
    ```typescript
    export {
      encodeFormStack,
      decodeFormStack,
      buildFormStackUrl,
      parseFormStackUrl,
    } from './urlEncoding';
    ```

Task 4: CREATE src/hooks/useFormStackURLSync.ts
  - IMPLEMENT: Main URL sync hook with bidirectional synchronization
  - DEPENDENCIES: useFormStackState, useFormStackActions, urlEncoding utils
  - KEY BEHAVIORS:
    - On mount: Check URL for form IDs, restore if present
    - On stack change: Update URL (pushState for add, replaceState for remove)
    - On popstate: Sync URL state back to form stack
    - On unmount: Clean up popstate listener
  - HANDLE SSR: Guard with typeof window check
  - PREVENT LOOPS: Use ref to track restoration state
  - FOLLOW pattern: src/hooks/useFormStackState.ts (error handling, context check)
  - NAMING: useFormStackURLSync, UseFormStackURLSyncOptions, UseFormStackURLSyncReturn
  - PLACEMENT: src/hooks/useFormStackURLSync.ts

Task 5: CREATE src/hooks/__tests__/useFormStackURLSync.test.tsx
  - IMPLEMENT: Unit tests for URL sync hook
  - FOLLOW pattern: src/hooks/__tests__/useFormStack.test.tsx
  - MOCK: window.history, window.location, popstate event
  - TEST CASES:
    - Hook initializes without error
    - Restores form stack from URL on mount
    - Updates URL when form is opened (pushState)
    - Updates URL when form is closed (replaceState)
    - Handles back button (popstate triggers stack update)
    - Handles forward button
    - Respects syncToUrl: false option
    - Respects syncFromUrl: false option
    - Cleans up popstate listener on unmount
    - Handles empty URL gracefully
    - Handles malformed URL gracefully
  - MOCKING:
    ```typescript
    // Mock window.location
    const mockLocation = { search: '', pathname: '/' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    // Mock window.history
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    ```
  - NAMING: describe('useFormStackURLSync')
  - PLACEMENT: src/hooks/__tests__/useFormStackURLSync.test.tsx

Task 6: MODIFY src/hooks/index.ts
  - ADD: Export useFormStackURLSync hook and types
  - PATTERN: Follow existing export pattern
  - ADD lines:
    ```typescript
    export { useFormStackURLSync } from './useFormStackURLSync';
    export type {
      UseFormStackURLSyncOptions,
      UseFormStackURLSyncReturn,
    } from './useFormStackURLSync';
    ```

Task 7: MODIFY src/types/index.ts
  - ADD: Re-export URL sync types from hooks
  - PATTERN: Types are defined with the hook, re-exported from types for convenience
  - ADD lines:
    ```typescript
    // URL Sync types
    export type {
      UseFormStackURLSyncOptions,
      UseFormStackURLSyncReturn,
    } from '../hooks/useFormStackURLSync';
    ```

Task 8: MODIFY src/index.ts (public API)
  - ADD: Export useFormStackURLSync for public consumption
  - LOCATION: After useFormStackActions export (around line 162)
  - ADD documentation comment explaining use case
  - PATTERN: Follow existing hook export pattern with JSDoc
  - ADD lines:
    ```typescript
    /**
     * Hook for bidirectional sync between form stack and URL query parameters.
     * Enables shareable URLs, bookmarking, and browser back/forward navigation.
     *
     * @example
     * ```tsx
     * import { FormStackProvider, useFormStackURLSync } from 'geoform';
     *
     * function App() {
     *   return (
     *     <FormStackProvider>
     *       <URLSyncedApp />
     *     </FormStackProvider>
     *   );
     * }
     *
     * function URLSyncedApp() {
     *   // Enable URL sync - forms now appear in URL as ?forms=form1,form2
     *   useFormStackURLSync();
     *
     *   // Rest of your app
     *   return <YourApp />;
     * }
     * ```
     */
    export { useFormStackURLSync } from './hooks';
    export type {
      UseFormStackURLSyncOptions,
      UseFormStackURLSyncReturn,
    } from './hooks';
    ```
```

### Implementation Patterns & Key Details

```typescript
// ==========================================
// src/utils/urlEncoding.ts
// ==========================================

/**
 * Encode an array of form IDs to a URL-safe query parameter value.
 * @param formIds Array of form IDs to encode
 * @returns URL-safe string (comma-separated, URI-encoded IDs)
 */
export function encodeFormStack(formIds: readonly string[]): string {
  if (formIds.length === 0) return '';
  return formIds.map((id) => encodeURIComponent(id)).join(',');
}

/**
 * Decode a URL query parameter value to an array of form IDs.
 * @param encoded Encoded string from URL (or null/undefined)
 * @returns Array of form IDs (empty array if invalid)
 */
export function decodeFormStack(encoded: string | null | undefined): string[] {
  if (!encoded || encoded.trim() === '') return [];

  try {
    return encoded
      .split(',')
      .map((id) => decodeURIComponent(id.trim()))
      .filter((id) => id.length > 0);
  } catch {
    // Invalid URI encoding - return empty array
    return [];
  }
}

/**
 * Build a URL with form stack encoded in query parameters.
 * Preserves other existing query parameters.
 * @param formIds Form IDs to encode
 * @param paramName Query parameter name (default: 'forms')
 * @returns Full URL string
 */
export function buildFormStackUrl(
  formIds: readonly string[],
  paramName: string = 'forms'
): string {
  const url = new URL(window.location.href);

  if (formIds.length === 0) {
    url.searchParams.delete(paramName);
  } else {
    url.searchParams.set(paramName, encodeFormStack(formIds));
  }

  return url.toString();
}

/**
 * Parse form IDs from current URL query parameters.
 * @param paramName Query parameter name (default: 'forms')
 * @returns Array of form IDs from URL
 */
export function parseFormStackUrl(paramName: string = 'forms'): string[] {
  const params = new URLSearchParams(window.location.search);
  return decodeFormStack(params.get(paramName));
}

// ==========================================
// src/hooks/useFormStackURLSync.ts
// ==========================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { useFormStackState } from './useFormStackState';
import { useFormStackActions } from './useFormStackActions';
import {
  encodeFormStack,
  decodeFormStack,
  buildFormStackUrl,
  parseFormStackUrl,
} from '../utils';

export interface UseFormStackURLSyncOptions {
  paramName?: string;
  restoreOnMount?: boolean;
  syncToUrl?: boolean;
  syncFromUrl?: boolean;
  onRestore?: (formIds: string[]) => void;
}

export interface UseFormStackURLSyncReturn {
  isRestoring: boolean;
  getUrlState: () => string[];
  forceUrlUpdate: () => void;
}

/**
 * Hook for bidirectional sync between form stack and URL query parameters.
 *
 * @param options Configuration options
 * @returns Object with sync state and utility methods
 */
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

  // Track whether we're in the middle of a restoration to prevent loops
  const isRestoringRef = useRef(false);
  // Track previous stack to detect changes
  const prevStackRef = useRef<readonly { id: string }[]>([]);
  // Track initialization
  const isInitializedRef = useRef(false);

  // Get form IDs from stack
  const getStackIds = useCallback(() => {
    return stack.map((entry) => entry.id);
  }, [stack]);

  // Get form IDs from URL
  const getUrlState = useCallback(() => {
    if (typeof window === 'undefined') return [];
    return parseFormStackUrl(paramName);
  }, [paramName]);

  // Update URL with current stack
  const syncStackToUrl = useCallback(
    (formIds: string[], usePushState: boolean = true) => {
      if (typeof window === 'undefined') return;
      if (isRestoringRef.current) return;

      const url = buildFormStackUrl(formIds, paramName);
      const historyState = { [paramName]: formIds };

      if (usePushState) {
        window.history.pushState(historyState, '', url);
      } else {
        window.history.replaceState(historyState, '', url);
      }
    },
    [paramName]
  );

  // Force URL update (utility method)
  const forceUrlUpdate = useCallback(() => {
    syncStackToUrl(getStackIds(), false);
  }, [syncStackToUrl, getStackIds]);

  // Restore stack from URL
  const restoreFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;

    const urlFormIds = getUrlState();

    if (urlFormIds.length > 0) {
      setIsRestoring(true);
      isRestoringRef.current = true;

      // Call onRestore callback if provided
      onRestore?.(urlFormIds);

      // NOTE: The actual form restoration requires the consumer to handle
      // opening the forms. This hook only syncs the IDs.
      // A more complete implementation would need a form registry.

      // For now, we'll just set up the initial history state
      window.history.replaceState({ [paramName]: urlFormIds }, '', window.location.href);

      // Reset restoration flag after a tick
      setTimeout(() => {
        isRestoringRef.current = false;
        setIsRestoring(false);
      }, 0);
    }
  }, [getUrlState, paramName, onRestore]);

  // Handle popstate (browser back/forward)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!syncFromUrl) return;

    const handlePopstate = (event: PopStateEvent) => {
      isRestoringRef.current = true;

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
      // Note: Forward navigation (adding forms) would need form registry to work

      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
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
    const prevIds = prevStackRef.current.map((e) => e.id);

    // Detect if stack changed
    if (
      currentIds.length !== prevIds.length ||
      currentIds.some((id, i) => id !== prevIds[i])
    ) {
      const isAdding = currentIds.length > prevIds.length;

      // Use pushState when adding forms, replaceState when removing
      syncStackToUrl(currentIds, isAdding);
    }

    prevStackRef.current = stack;
  }, [stack, syncToUrl, getStackIds, syncStackToUrl]);

  return {
    isRestoring,
    getUrlState,
    forceUrlUpdate,
  };
}
```

### Integration Points

```yaml
EXPORTS:
  - add to: src/hooks/index.ts
  - pattern: "export { useFormStackURLSync } from './useFormStackURLSync';"
  - pattern: "export type { UseFormStackURLSyncOptions, UseFormStackURLSyncReturn } from './useFormStackURLSync';"

UTILS:
  - add to: src/utils/index.ts
  - pattern: |
      export {
        encodeFormStack,
        decodeFormStack,
        buildFormStackUrl,
        parseFormStackUrl,
      } from './urlEncoding';

PUBLIC_API:
  - add to: src/index.ts
  - location: After useFormStackActions exports (line ~162)
  - pattern: |
      /**
       * Hook for bidirectional sync between form stack and URL.
       * Enables shareable URLs and browser back/forward navigation.
       */
      export { useFormStackURLSync } from './hooks';
      export type {
        UseFormStackURLSyncOptions,
        UseFormStackURLSyncReturn,
      } from './hooks';
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
cd /home/dustin/projects/geoform-opus

# TypeScript compilation check
npx tsc --noEmit

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
cd /home/dustin/projects/geoform-opus

# Run only the new URL encoding tests
npx vitest run src/utils/__tests__/urlEncoding.test.ts

# Run only the new URL sync hook tests
npx vitest run src/hooks/__tests__/useFormStackURLSync.test.tsx

# Run all utils tests
npx vitest run src/utils/__tests__/

# Run all hook tests
npx vitest run src/hooks/__tests__/

# Expected: All tests pass. If failing, debug and fix.
```

### Level 3: Integration Testing (Full Test Suite)

```bash
cd /home/dustin/projects/geoform-opus

# Full test suite
npx vitest run

# With coverage report
npx vitest run --coverage

# Expected: All tests pass, no regressions in existing functionality.
```

### Level 4: Build Validation

```bash
cd /home/dustin/projects/geoform-opus

# Build the library
npm run build

# Verify build output exists
ls -la dist/

# Verify exports work (quick check)
node -e "import('./dist/index.mjs').then(m => console.log('useFormStackURLSync:', typeof m.useFormStackURLSync))"

# Expected: Build completes without errors, hook is exported.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] All tests pass: `npx vitest run`
- [ ] Build succeeds: `npm run build`
- [ ] No type errors in new or modified files

### Feature Validation

- [ ] `useFormStackURLSync` hook exports correctly
- [ ] Opening form updates URL with pushState
- [ ] Closing form updates URL with replaceState
- [ ] Browser back button navigates form history
- [ ] Browser forward button works (when applicable)
- [ ] URL restoration works on page load
- [ ] Empty form stack clears query parameter
- [ ] Special characters in form IDs are properly encoded
- [ ] Hook works without React Router

### Code Quality Validation

- [ ] Follows existing hook patterns (useFormStackState, useFormStackActions)
- [ ] Uses TypeScript interfaces matching existing patterns
- [ ] Tests follow existing patterns (describe/it, vi.fn, screen queries)
- [ ] JSDoc comments on exported types and functions
- [ ] No new external dependencies added
- [ ] SSR-safe (guards for typeof window)

### Documentation & Deployment

- [ ] useFormStackURLSync exported from src/hooks/index.ts
- [ ] Types exported from src/index.ts (public API)
- [ ] JSDoc documentation on hook and options interface

---

## Anti-Patterns to Avoid

- ❌ Don't modify FormStackProvider - URL sync is a separate plugin
- ❌ Don't call pushState/replaceState without updating React state manually
- ❌ Don't forget popstate doesn't fire on your own pushState/replaceState calls
- ❌ Don't create infinite loops between URL sync and state sync
- ❌ Don't assume window exists (SSR environments)
- ❌ Don't encode entire stack objects - only encode form IDs
- ❌ Don't skip URL encoding for special characters
- ❌ Don't forget to clean up popstate listener on unmount
- ❌ Don't forget initialization guard for Firefox popstate quirk
- ❌ Don't use JSON.stringify for URL encoding - use comma-separated

---

## Test Cases Reference

```typescript
// Example test patterns for urlEncoding.test.ts

import { describe, it, expect } from 'vitest';
import { encodeFormStack, decodeFormStack } from '../urlEncoding';

describe('encodeFormStack', () => {
  it('should return empty string for empty array', () => {
    expect(encodeFormStack([])).toBe('');
  });

  it('should encode single form ID', () => {
    expect(encodeFormStack(['org-form'])).toBe('org-form');
  });

  it('should encode multiple form IDs as comma-separated', () => {
    expect(encodeFormStack(['org-form', 'team-form'])).toBe('org-form,team-form');
  });

  it('should URL-encode special characters', () => {
    expect(encodeFormStack(['form with spaces', 'form&special'])).toBe(
      'form%20with%20spaces,form%26special'
    );
  });
});

describe('decodeFormStack', () => {
  it('should return empty array for null', () => {
    expect(decodeFormStack(null)).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(decodeFormStack('')).toEqual([]);
  });

  it('should decode single form ID', () => {
    expect(decodeFormStack('org-form')).toEqual(['org-form']);
  });

  it('should decode comma-separated form IDs', () => {
    expect(decodeFormStack('org-form,team-form')).toEqual(['org-form', 'team-form']);
  });

  it('should decode URL-encoded special characters', () => {
    expect(decodeFormStack('form%20with%20spaces,form%26special')).toEqual([
      'form with spaces',
      'form&special',
    ]);
  });

  it('should handle invalid encoding gracefully', () => {
    expect(decodeFormStack('%ZZ%invalid')).toEqual([]);
  });
});

// Example test patterns for useFormStackURLSync.test.tsx

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FormStackProvider } from '../../components';
import { useFormStackURLSync } from '../useFormStackURLSync';

// Mock window.history
const mockPushState = vi.fn();
const mockReplaceState = vi.fn();

beforeEach(() => {
  // Reset mocks
  mockPushState.mockReset();
  mockReplaceState.mockReset();

  // Mock history
  Object.defineProperty(window, 'history', {
    value: {
      pushState: mockPushState,
      replaceState: mockReplaceState,
      state: null,
    },
    writable: true,
  });

  // Mock location
  Object.defineProperty(window, 'location', {
    value: {
      search: '',
      pathname: '/',
      href: 'http://localhost/',
    },
    writable: true,
  });
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
);

describe('useFormStackURLSync', () => {
  it('should initialize without error', () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
    expect(result.current.isRestoring).toBe(false);
  });

  it('should return getUrlState function', () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
    expect(typeof result.current.getUrlState).toBe('function');
  });

  it('should return forceUrlUpdate function', () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });
    expect(typeof result.current.forceUrlUpdate).toBe('function');
  });

  it('should parse form IDs from URL on mount', () => {
    window.location.search = '?forms=org-form,team-form';

    const onRestore = vi.fn();
    renderHook(() => useFormStackURLSync({ onRestore }), { wrapper });

    expect(onRestore).toHaveBeenCalledWith(['org-form', 'team-form']);
  });

  it('should clean up popstate listener on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useFormStackURLSync(), { wrapper });

    expect(addSpy).toHaveBeenCalledWith('popstate', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
  });
});
```

---

## Research References

All research documents are stored in `plan/P3M1/research/`:

| Document | Purpose |
|----------|---------|
| `url-sync-patterns.md` | Comprehensive URL sync patterns and best practices |
| `browser-history-api.md` | History API usage, pushState vs replaceState |
| `url-encoding-strategies.md` | URL encoding strategies comparison |
| `README.md` | Research overview and quick reference |

---

## Limitations & Future Considerations

### Current Limitations

1. **Form Restoration Requires Consumer Handling**: The hook notifies via `onRestore` callback but cannot automatically open forms (needs form component registry). Consumer must implement restoration logic.

2. **Forward Navigation Limited**: When user clicks forward after going back, the hook can't re-open forms since it doesn't have access to form components. Only works for existing stack entries.

3. **No Label Preservation**: URL only stores form IDs, not labels. Labels must come from elsewhere on restoration.

### Future Enhancements (Out of Scope)

- Form component registry for automatic restoration
- Full forward navigation support with form registry
- Label preservation via separate encoding
- URL compression for very long stacks
- Integration with React Router for SPA routing

---

## Confidence Assessment

**Score: 8/10**

**Why high confidence:**
- Clear integration point (standalone hook using existing hooks)
- Well-documented History API patterns from research
- Simple encoding strategy (comma-separated IDs)
- Follows existing hook patterns in codebase
- No external dependencies needed
- Comprehensive research completed

**Potential risks:**
- Testing requires mocking window.history/location (documented)
- Consumer must handle form restoration (documented limitation)
- Forward navigation has limitations (documented)
- Browser quirks between Firefox/Chrome for popstate (documented)

---

**Ready for Implementation**

This PRP provides all context needed for one-pass implementation success.
