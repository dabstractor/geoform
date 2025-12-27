# Browser History API Research: Bidirectional URL Sync

**Date:** 2025-12-27
**Purpose:** Implementing a React hook that syncs a form stack (array of form IDs) with URL query parameters for browser back/forward navigation support.

## Table of Contents
1. [Overview](#overview)
2. [pushState vs replaceState](#pushstate-vs-replacestate)
3. [Popstate Event Handling](#popstate-event-handling)
4. [Listening for URL Changes](#listening-for-url-changes)
5. [State Serialization Best Practices](#state-serialization-best-practices)
6. [Browser Compatibility](#browser-compatibility)
7. [Memory Management](#memory-management)
8. [Hash vs Pathname vs Query String](#hash-vs-pathname-vs-query-string)
9. [React Hook Implementation Pattern](#react-hook-implementation-pattern)
10. [Code Examples](#code-examples)
11. [References](#references)

---

## Overview

The Browser History API provides methods to interact with the browser's session history stack. It enables single-page applications (SPAs) to maintain proper back/forward button functionality and allow users to share URLs representing specific application states.

**Key Methods:**
- `history.pushState(state, "", url)` - Adds new history entry
- `history.replaceState(state, "", url)` - Updates current history entry
- `window.addEventListener("popstate", callback)` - Listens for back/forward navigation

**Core Use Case:** When users navigate through your app (opening/closing forms), you push/update URLs so that back/forward buttons restore the previous form state.

---

## pushState vs replaceState

### pushState() - When to Use

**Creates a NEW history entry.** Each call adds to the browser's back button stack.

**Use pushState when:**
- Opening a new form in the stack (significant state change)
- User action creates a distinct, bookmarkable state
- The page's main content changes significantly
- You want users to be able to navigate back to this state with the back button
- Example: Article list → Click article → View article (each is a distinct state)

**Example Scenario for Form Stack:**
```javascript
// User opens first form
history.pushState({ formStack: ['form-1'] }, "", "?forms=form-1");

// User opens nested form
history.pushState({ formStack: ['form-1', 'form-2'] }, "", "?forms=form-1,form-2");
```

**Advantages:**
- Users can navigate back to previous form states
- Creates natural browser history
- Back button has expected behavior

**Disadvantages:**
- Clutters history stack with intermediate states
- Multiple back clicks needed to return to original page

---

### replaceState() - When to Use

**Updates the CURRENT history entry.** Does not create new back button entries.

**Use replaceState when:**
- Minor filtering, sorting, or display options change
- Closing a form (modifying the current stack)
- Updating state without adding history
- Initial page load (setting up initial state)
- Data re-ordering, filtering, or visual changes
- Intermediate state changes that users don't need to navigate back to individually

**Example Scenario for Form Stack:**
```javascript
// User closes a form - update current stack without new history entry
history.replaceState({ formStack: ['form-1'] }, "", "?forms=form-1");

// User filters within same form - update without history
history.replaceState({ formStack: ['form-1'], filter: 'active' }, "", "?forms=form-1&filter=active");
```

**Advantages:**
- Keeps history stack clean
- Fewer back clicks to navigate away
- Good for non-critical state changes

**Disadvantages:**
- Users can't navigate back through intermediate states
- Less explicit navigation history

---

### Best Practices for Form Stack Context

| Scenario | Method | Reason |
|----------|--------|--------|
| User opens new form | `pushState` | Distinct, bookmarkable state |
| User closes last form | `replaceState` | Return to base state, clean history |
| User closes middle form | `pushState` | Reverting to previous state is a user action |
| Filter/search within form | `replaceState` | Non-critical state change |
| Initial page load | `replaceState` | Set up initial state |
| User navigates back/forward | Listen to `popstate` | Restore state from event |

---

## Popstate Event Handling

### When Popstate Fires

The `popstate` event fires when the **active history entry changes**. This happens when:

✅ User clicks back button
✅ User clicks forward button
✅ `history.back()` is called
✅ `history.forward()` is called
✅ `history.go(n)` is called

❌ `history.pushState()` is called (does NOT trigger popstate)
❌ `history.replaceState()` is called (does NOT trigger popstate)

**Important:** You must manually call your state update logic when calling pushState/replaceState yourself.

### Basic Implementation

```javascript
window.addEventListener("popstate", (event) => {
  // event.state contains the state object from pushState/replaceState
  console.log("New state:", event.state);

  if (event.state) {
    // Restore component state from event.state
    restoreFormStack(event.state.formStack);
  } else {
    // No state object - user navigated to initial page
    resetToDefaultState();
  }
});
```

### Event Properties

**`event.state`** (Read-only)
- Contains a copy of the state object passed to `pushState()` or `replaceState()`
- Returns `null` if no state was set
- Arrives after page loads but before some cleanup operations

### Timing Considerations

The `popstate` event fires near the end of navigation:
1. New URL loads
2. `pageshow` event fires
3. **`popstate` event fires** ← Your listener runs here
4. `hashchange` event fires (if hash changed)

**Race Condition:** `window.location` reflects the new URL immediately, but `document` state might not be fully updated. Use `setTimeout(..., 0)` if you need DOM to be ready:

```javascript
window.addEventListener("popstate", (event) => {
  // URL is ready now
  console.log("URL:", window.location.href);

  // But DOM might need a tick to update
  setTimeout(() => {
    // Now DOM is guaranteed to be updated
    restoreFormStack(event.state);
  }, 0);
});
```

### Browser-Specific Behaviors

| Browser | Behavior |
|---------|----------|
| Chrome | Fires `popstate` on initial page load |
| Safari | Fires `popstate` on initial page load |
| Firefox | Does NOT fire `popstate` on initial page load |

**Implication:** Initialize form stack on component mount AND in popstate handler to cover all browsers.

### Security Limitations

Browsers restrict `popstate` firing to prevent malicious scripts from hijacking navigation without user action. Some browsers (WebKit-based) only fire popstate if the history entry was created through user interaction.

---

## Listening for URL Changes

### The Challenge

The History API provides a `popstate` event for detecting back/forward navigation, but there's **no built-in event for detecting `pushState()` or `replaceState()` calls**.

### Solutions

#### 1. Manual Calls (Recommended)
When you call `pushState()` or `replaceState()` yourself, immediately update your component state:

```javascript
const handleOpenForm = (formId) => {
  const newStack = [...formStack, formId];
  setFormStack(newStack);  // Update React state

  // Then update URL
  const queryParams = newStack.join(',');
  window.history.pushState(
    { formStack: newStack },
    "",
    `?forms=${queryParams}`
  );
};
```

#### 2. Monkey Patching (Advanced)
Wrap `pushState()` and `replaceState()` to add custom events:

```javascript
// Create custom events for history changes
const pushStateEvent = new Event('pushstate');
const replaceStateEvent = new Event('replacestate');

// Monkey patch history methods
const originalPushState = history.pushState;
history.pushState = function(...args) {
  originalPushState.apply(history, args);
  window.dispatchEvent(pushStateEvent);
};

const originalReplaceState = history.replaceState;
history.replaceState = function(...args) {
  originalReplaceState.apply(history, args);
  window.dispatchEvent(replaceStateEvent);
};

// Listen for custom events
window.addEventListener('pushstate', () => {
  console.log("pushState was called");
});

window.addEventListener('replacestate', () => {
  console.log("replaceState was called");
});
```

**Caveat:** Monkey patching must occur before any code holds a reference to the history object. Not reliable in all contexts.

#### 3. Third-Party Widget Detection Pattern
If you need to detect URL changes from external code or third-party widgets:

```javascript
// Store current URL
let lastUrl = window.location.href;

// Poll for changes (not ideal but works)
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    console.log("URL changed to:", lastUrl);
    // Handle URL change
  }
}, 100);
```

**Note:** Polling is inefficient. Prefer detecting popstate and managing pushState/replaceState yourself.

### Recommended Approach for Form Stack Hook

1. Keep React state as source of truth
2. Call `pushState`/`replaceState` after state changes
3. Listen to `popstate` to restore state when user navigates back/forward
4. Parse URL query params as fallback on initial load

---

## State Serialization Best Practices

### What Can Be Serialized

The state object passed to `pushState()`/`replaceState()` must be serializable to JSON. This means:

✅ **Allowed:**
- Primitives: strings, numbers, booleans, null
- Objects and arrays of primitives
- Nested objects/arrays
- Simple objects from data structures

❌ **Not Allowed:**
- Functions
- DOM elements
- Circular references
- Symbol primitives
- undefined (becomes null in JSON)
- Class instances (custom prototypes)

### Size Limitations

**Firefox:** 640KB character limit for serialized state object
- State is saved to disk for session recovery
- Very large form stacks could hit this limit

**Best Practice:** Keep state objects minimal
```javascript
// GOOD - minimal serialization
const state = { formStack: ['form-1', 'form-2'] };

// OKAY - some metadata
const state = {
  formStack: ['form-1', 'form-2'],
  timestamp: Date.now(),
  userId: 'user-123'
};

// AVOID - verbose data duplication
const state = {
  formStack: ['form-1', 'form-2'],
  formData: { /* entire form contents */ },
  userData: { /* entire user object */ },
  // ... megabytes of data
};
```

### Serialization Strategies

#### 1. Minimal State in history.state
Store only IDs and minimal metadata in the history state object:

```javascript
// Push minimal state to history
history.pushState(
  { formStack: ['form-1', 'form-2'] },  // Minimal
  "",
  `?forms=${formStack.join(',')}`
);

// Store detailed form data in React state or sessionStorage
const formDataMap = {
  'form-1': { /* detailed data */ },
  'form-2': { /* detailed data */ }
};
```

#### 2. URL as Primary Source
Use URL query parameters as the actual state representation:

```javascript
// When restoring from history, parse URL
const formStack = new URLSearchParams(window.location.search)
  .get('forms')
  ?.split(',') ?? [];

// This way, history.state is just a copy for convenience
const state = { formStack };
```

#### 3. Hybrid Approach (Recommended)
Combine history.state (for popstate event) with URL (for bookmarking/sharing):

```javascript
const pushFormState = (formId) => {
  const newStack = [...formStack, formId];

  // 1. Update React state
  setFormStack(newStack);

  // 2. Update URL (primary source for bookmarking)
  const url = `?forms=${newStack.join(',')}`;

  // 3. Push to history with minimal state (convenience copy)
  history.pushState({ formStack: newStack }, "", url);
};

const handlePopstate = (event) => {
  // Prefer URL parsing over event.state for reliability
  const urlParams = new URLSearchParams(window.location.search);
  const formStack = urlParams.get('forms')?.split(',') ?? [];
  setFormStack(formStack);
};
```

### Schema Validation

When deserializing state, validate structure:

```javascript
const validateFormStackState = (state) => {
  if (!state || typeof state !== 'object') return null;
  if (!Array.isArray(state.formStack)) return null;
  if (!state.formStack.every(id => typeof id === 'string')) return null;
  return state.formStack;
};

window.addEventListener('popstate', (event) => {
  const validStack = validateFormStackState(event.state);
  if (validStack) {
    setFormStack(validStack);
  }
});
```

---

## Browser Compatibility

### Current Status (2025)

**Excellent support.** History API (pushState, replaceState, popstate) has been supported across all modern browsers since **July 2015**.

### Coverage by Browser

| Browser | pushState | replaceState | popstate | Notes |
|---------|-----------|--------------|----------|-------|
| Chrome | ✅ | ✅ | ✅ | Full support, fires popstate on page load |
| Firefox | ✅ | ✅ | ✅ | Full support, does NOT fire popstate on page load |
| Safari | ✅ | ✅ | ✅ | Full support, fires popstate on page load |
| Edge | ✅ | ✅ | ✅ | Full support (Chromium-based) |
| iOS Safari | ✅ | ✅ | ✅ | Restricted: only fires with user interaction |
| Android Chrome | ✅ | ✅ | ✅ | Full support |

### Feature Matrix

| Feature | IE11 | IE Edge | All Modern |
|---------|------|---------|-----------|
| history.pushState() | ❌ | ✅ | ✅ |
| history.replaceState() | ❌ | ✅ | ✅ |
| popstate event | ❌ | ✅ | ✅ |
| history.state | ❌ | ✅ | ✅ |

**Note:** All browsers except Safari currently ignore the title parameter in pushState/replaceState (second parameter).

### Fallback Strategy for Legacy Support

If you need to support IE11 or old browsers, use the [History.js](https://github.com/browserstate/history.js) polyfill, which provides graceful degradation using hash-based routing.

### Important Notes

- The History API is **only available on the main thread**, not in Web Workers or Worklets
- Origin restriction: Can only push/replace URLs from the same origin
- Browsers may have limits on history stack size (typically not an issue for most apps)

---

## Memory Management

### History State Size Concerns

#### Firefox's 640KB Limit
- **What:** Firefox serializes history entries to disk for session restoration
- **Limit:** 640,000 characters per state object
- **Impact:** Very large form stacks with verbose state could hit this limit
- **Mitigation:** Keep state minimal (IDs only, not full data)

```javascript
// DON'T DO THIS - will fail in Firefox with large data
history.pushState({
  formStack: ['form-1', 'form-2'],
  completeFormData: { /* megabytes */ }
}, "", url);

// DO THIS - minimal state
history.pushState({
  formStack: ['form-1', 'form-2']
}, "", url);

// Store large data in React state, sessionStorage, or IndexedDB
```

#### Browser Memory Limits
- **Chrome (64-bit):** 4GB per tab
- **Chrome (32-bit):** 1-2GB per tab
- **Safari/iOS:** Varies by device (iPhone 7: ~2GB)
- **History stack:** Typically not a bottleneck for most apps

### Garbage Collection Impact

JavaScript's automatic garbage collection can be impacted by:
- **Stale references:** Closures holding old state
- **Event listeners:** Not cleaning up old listeners
- **Memory leaks:** References preventing cleanup

### Best Practices

#### 1. Clean Up Event Listeners
```javascript
useEffect(() => {
  const handlePopstate = (event) => {
    // Handle navigation
  };

  window.addEventListener('popstate', handlePopstate);

  // IMPORTANT: Clean up on unmount
  return () => {
    window.removeEventListener('popstate', handlePopstate);
  };
}, []);
```

#### 2. Don't Store Large Objects in State
```javascript
// BAD: Large data in history state
const largeState = {
  formStack: ['form-1', 'form-2'],
  userProfiles: { /* 10MB of data */ }
};
history.pushState(largeState, "", url);

// GOOD: Minimal state in history, large data elsewhere
history.pushState({ formStack: ['form-1', 'form-2'] }, "", url);
// userProfiles in React state, sessionStorage, or database
```

#### 3. Monitor History Stack Size
```javascript
const getHistoryEstimate = () => {
  // Estimate via URL and stored state
  const urlSize = window.location.href.length;
  const stateSize = JSON.stringify(history.state).length;
  return urlSize + stateSize;
};

// Typical minimal entry: 50-200 bytes
// With 640KB limit: Support 3,000-12,000 history entries
```

#### 4. Prevent Memory Leaks from Closures
```javascript
// BAD: Closure captures large state
const handleClick = () => {
  const largeData = { /* big object */ };
  history.pushState({ formStack }, "", url);
  // largeData stays in memory due to closure
};

// GOOD: Limited scope
const handleClick = () => {
  const formStack = getCurrentFormStack();
  history.pushState({ formStack }, "", url);
  // No large data in closure
};
```

---

## Hash vs Pathname vs Query String

### Three URL Strategies

#### 1. Hash-Based Routing (Fragment)

**URL Format:** `http://example.com/#/forms/form-1`

**How It Works:**
- Content after `#` is the "fragment" or "anchor"
- Fragment changes don't reload the page
- Fragment is NOT sent to the server
- Fragment can trigger page scroll to element IDs

**Pros:**
- Works in older browsers (pre-HTML5)
- No server-side routing needed
- Fallback for browsers without History API

**Cons:**
- Not semantic (was meant for page anchors, not routing)
- Harder to read URLs
- SEO less favorable
- According to RFC: hash should come AFTER query string

**For Form Stack:**
```javascript
// Hash approach
history.pushState({ formStack }, "", "#forms=form-1,form-2");

// Listen for hash changes
window.addEventListener('hashchange', (event) => {
  const hash = window.location.hash.slice(1); // Remove #
  const params = new URLSearchParams(hash);
  // Parse form stack from hash
});
```

**Limitations:**
- Hash-only changes don't trigger `popstate` event (they trigger `hashchange`)
- Can cause issues with accessibility and bookmarking
- Creates additional history entries for hash-only changes

---

#### 2. Pathname-Based Routing (Path)

**URL Format:** `http://example.com/forms/form-1/form-2`

**How It Works:**
- URL path represents the state structure
- Path changes typically require server routing
- Must use History API (pushState/replaceState) to avoid page reload
- Server can serve different content based on path

**Pros:**
- Semantic and readable
- SEO-friendly (search engines understand paths)
- Looks "normal" to users
- Deep linking works naturally

**Cons:**
- Server must handle all paths (return SPA index.html)
- Can't change pathname without special routing setup
- Less flexible for complex state (limited to URL structure)

**For Form Stack:**
```javascript
// Pathname approach
history.pushState({ formStack }, "", "/forms/form-1/form-2");

// Server config needed: all /forms/* routes → return index.html
// Client-side router parses /forms/form-1/form-2
```

**Server Setup (Express example):**
```javascript
// Must return SPA for all form routes
app.get('/forms/*', (req, res) => {
  res.sendFile('index.html');
});
```

---

#### 3. Query String Approach (Recommended for Form Stack)

**URL Format:** `http://example.com/?forms=form-1,form-2`

**How It Works:**
- State encoded in query parameters after `?`
- Query string is sent to server (affects caching)
- Can be generated dynamically from application state
- Preserves pathname (good for SEO)

**Pros:**
- Flexible and composable (easy to add multiple params)
- No server-side routing needed
- Bookmarkable and shareable
- Works well with History API
- Easy to parse: `URLSearchParams`
- Can combine multiple concerns (filters, page, forms, etc.)

**Cons:**
- URL can get long and ugly
- Less semantic than pathname
- Affects HTTP caching (different query = different resource)

**For Form Stack (Best Choice):**
```javascript
// Query string approach
const formStack = ['form-1', 'form-2'];
history.pushState(
  { formStack },
  "",
  `?forms=${formStack.join(',')}`
);

// Parsing
const params = new URLSearchParams(window.location.search);
const formStack = params.get('forms')?.split(',') ?? [];
```

**Extendable:**
```javascript
// Easy to add more parameters
const url = new URLSearchParams({
  forms: 'form-1,form-2',
  filter: 'active',
  sort: 'date-desc',
  page: '1'
}).toString();

history.pushState({ formStack, filter, sort }, "", `?${url}`);
```

---

### Comparison Table

| Feature | Hash | Pathname | Query String |
|---------|------|----------|--------------|
| URL Pattern | `/#path` | `/path` | `?key=value` |
| Semantic | ❌ | ✅ | ⚠️ |
| SEO Friendly | ❌ | ✅ | ✅ |
| Server Config | Not needed | Required | Not needed |
| Readability | ⚠️ | ✅ | ✅ |
| Flexibility | ⚠️ | ⚠️ | ✅ |
| Works in Old Browsers | ✅ | ❌ | ❌ |
| Triggers hashchange | ✅ | ❌ | ❌ |
| Triggers popstate | ❌ | ✅ | ✅ |

---

### Recommendation for Form Stack Hook

**Use query string approach** (`?forms=form-1,form-2`) because:

1. **No server setup needed** - works with static hosting
2. **Flexible** - easy to extend with additional params
3. **Composable** - multiple independent parameters
4. **Works with History API** - proper popstate support
5. **Bookmarkable and shareable** - exact state reproducible
6. **Readable URLs** - form IDs clearly visible
7. **No deep nesting issues** - avoids pathname depth problems

```javascript
// Recommended pattern
const syncFormStackToUrl = (formStack) => {
  const query = new URLSearchParams();
  query.set('forms', formStack.join(','));
  history.pushState({ formStack }, "", `?${query.toString()}`);
};

const restoreFormStackFromUrl = () => {
  const query = new URLSearchParams(window.location.search);
  return query.get('forms')?.split(',').filter(Boolean) ?? [];
};
```

---

## React Hook Implementation Pattern

### Hook Design Overview

The custom hook should:
1. Initialize form stack from URL query params
2. Sync form stack changes to URL (pushState/replaceState)
3. Listen to browser back/forward (popstate)
4. Return methods to manipulate form stack
5. Clean up event listeners on unmount

### Complete Hook Implementation

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFormStackReturn {
  formStack: string[];
  openForm: (formId: string) => void;
  closeForm: () => void;
  popToIndex: (index: number) => void;
  isLoading: boolean;
}

export const useFormStack = (): UseFormStackReturn => {
  const [formStack, setFormStack] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  // Parse form stack from URL query params
  const getFormStackFromUrl = useCallback((): string[] => {
    const params = new URLSearchParams(window.location.search);
    const formsParam = params.get('forms');
    return formsParam ? formsParam.split(',').filter(Boolean) : [];
  }, []);

  // Sync form stack to URL (with minimal state in history)
  const syncToUrl = useCallback(
    (newStack: string[], isReplacing: boolean = false) => {
      const query = new URLSearchParams();
      if (newStack.length > 0) {
        query.set('forms', newStack.join(','));
      }
      const url = newStack.length > 0 ? `?${query.toString()}` : window.location.pathname;

      if (isReplacing) {
        window.history.replaceState({ formStack: newStack }, '', url);
      } else {
        window.history.pushState({ formStack: newStack }, '', url);
      }
    },
    []
  );

  // Initialize from URL on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initialStack = getFormStackFromUrl();
    setFormStack(initialStack);

    // Set initial history state (important for first back navigation)
    if (window.history.state === null) {
      window.history.replaceState({ formStack: initialStack }, '', window.location.href);
    }

    setIsLoading(false);
  }, [getFormStackFromUrl]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopstate = (event: PopStateEvent) => {
      // Use event.state if available, otherwise parse URL
      if (event.state?.formStack) {
        setFormStack(event.state.formStack);
      } else {
        const urlStack = getFormStackFromUrl();
        setFormStack(urlStack);
      }
    };

    window.addEventListener('popstate', handlePopstate);
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, [getFormStackFromUrl]);

  // Open a new form (push to stack)
  const openForm = useCallback(
    (formId: string) => {
      setFormStack((prevStack) => {
        const newStack = [...prevStack, formId];
        syncToUrl(newStack, false); // Use pushState
        return newStack;
      });
    },
    [syncToUrl]
  );

  // Close top form (pop from stack)
  const closeForm = useCallback(() => {
    setFormStack((prevStack) => {
      if (prevStack.length === 0) return prevStack;
      const newStack = prevStack.slice(0, -1);
      syncToUrl(newStack, true); // Use replaceState (closing is not navigation-worthy)
      return newStack;
    });
  }, [syncToUrl]);

  // Pop to specific index in stack
  const popToIndex = useCallback(
    (index: number) => {
      setFormStack((prevStack) => {
        if (index < 0 || index >= prevStack.length) return prevStack;
        const newStack = prevStack.slice(0, index + 1);
        syncToUrl(newStack, true); // Use replaceState
        return newStack;
      });
    },
    [syncToUrl]
  );

  return {
    formStack,
    openForm,
    closeForm,
    popToIndex,
    isLoading,
  };
};
```

### Hook Usage Example

```typescript
import { useFormStack } from './hooks/useFormStack';

function FormStackComponent() {
  const { formStack, openForm, closeForm, popToIndex, isLoading } = useFormStack();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {formStack.length > 0 ? (
        <div>
          {formStack.map((formId, index) => (
            <Form
              key={formId}
              formId={formId}
              onClose={index === formStack.length - 1 ? closeForm : () => popToIndex(index)}
            />
          ))}
          <button onClick={closeForm}>Close Form</button>
        </div>
      ) : (
        <div>
          <h1>Select a Form</h1>
          <button onClick={() => openForm('form-1')}>Open Form 1</button>
          <button onClick={() => openForm('form-2')}>Open Form 2</button>
        </div>
      )}
    </div>
  );
}
```

### Key Implementation Details

#### 1. URL as Primary Source
Always derive form stack from URL first, then use history.state as secondary source. This ensures bookmarks and shared links work correctly.

#### 2. Race Condition Handling
Use `useRef` with `isInitialized` flag to ensure initialization happens only once, avoiding duplicate effects.

#### 3. Push vs Replace Decision
- `openForm` → `pushState` (navigating forward, should create history)
- `closeForm` → `replaceState` (modifying current state, not creating new history point)
- `popToIndex` → `replaceState` (jumping, not sequential navigation)

#### 4. History State Setup on Mount
Set initial history state on mount if it doesn't exist. This ensures the first back navigation has valid state.

#### 5. Minimal State in history.state
Only store form stack ID array in history.state, not full form data. This keeps serialized state small and efficient.

#### 6. Event Listener Cleanup
Always return cleanup function from useEffect to remove popstate listener on unmount.

---

## Code Examples

### Example 1: Basic Form Stack with URL Sync

```typescript
// app.tsx
import { useFormStack } from './hooks/useFormStack';

export function App() {
  const { formStack, openForm, closeForm } = useFormStack();

  return (
    <div className="app">
      {formStack.length === 0 ? (
        <HomePage onSelectForm={openForm} />
      ) : (
        <FormStack formIds={formStack} onClose={closeForm} />
      )}
    </div>
  );
}
```

### Example 2: Handling Complex State with URL Params

```typescript
// Extending the basic hook to support filters, etc.
const useFormStackWithParams = () => {
  const [formStack, setFormStack] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const syncToUrl = (stack: string[], newFilters: Record<string, string>) => {
    const params = new URLSearchParams();
    if (stack.length > 0) params.set('forms', stack.join(','));
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(`filter_${key}`, value);
    });

    const url = params.toString() ? `?${params.toString()}` : '/';
    window.history.pushState(
      { formStack: stack, filters: newFilters },
      '',
      url
    );
  };

  return { formStack, filters, syncToUrl };
};
```

### Example 3: Handling Form Data with Session Storage

```typescript
// For larger form data, use sessionStorage + minimal history state
const useFormStackWithData = () => {
  const [formStack, setFormStack] = useState<string[]>([]);

  // Get form data from sessionStorage (survives page refresh)
  const getFormData = (formId: string) => {
    const stored = sessionStorage.getItem(`form_${formId}`);
    return stored ? JSON.parse(stored) : null;
  };

  // Save form data to sessionStorage
  const setFormData = (formId: string, data: any) => {
    sessionStorage.setItem(`form_${formId}`, JSON.stringify(data));
  };

  const openForm = (formId: string, initialData?: any) => {
    setFormStack((prev) => [...prev, formId]);
    if (initialData) {
      setFormData(formId, initialData);
    }
  };

  return { formStack, openForm, getFormData, setFormData };
};
```

### Example 4: Async Form Loading with URL Restoration

```typescript
const useFormStackWithAsync = () => {
  const [formStack, setFormStack] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const formsParam = params.get('forms');
    if (formsParam) {
      const stack = formsParam.split(',');
      // Async load form definitions
      loadFormDefinitions(stack).then(() => {
        setFormStack(stack);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Listen to popstate for back/forward
  useEffect(() => {
    const handlePopstate = async (event: PopStateEvent) => {
      if (event.state?.formStack) {
        await loadFormDefinitions(event.state.formStack);
        setFormStack(event.state.formStack);
      }
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  return { formStack, isLoading };
};
```

---

## References

### Official MDN Documentation

1. **History API Overview**
   [https://developer.mozilla.org/en-US/docs/Web/API/History_API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)

2. **Working with the History API**
   [https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)

3. **history.pushState() Method**
   [https://developer.mozilla.org/en-US/docs/Web/API/History/pushState](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)

4. **history.replaceState() Method**
   [https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)

5. **Window: popstate Event**
   [https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event](https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event)

6. **URL: pathname Property**
   [https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname](https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname)

7. **History API Browser Compatibility**
   [https://caniuse.com/mdn-api_history](https://caniuse.com/mdn-api_history)

### Secondary Sources

8. **pushState and replaceState Best Practices - ThatWare**
   [https://thatware.co/pushstate-vs-replacestate/](https://thatware.co/pushstate-vs-replacestate/)

9. **When to Use pushState vs replaceState - Nick Colley**
   [https://nickcolley.co.uk/2018/06/11/pushstate-vs-replacestate/](https://nickcolley.co.uk/2018/06/11/pushstate-vs-replacestate/)

10. **Advanced React State Management Using URL Parameters - LogRocket**
    [https://blog.logrocket.com/advanced-react-state-management-using-url-parameters/](https://blog.logrocket.com/advanced-react-state-management-using-url-parameters/)

11. **Using React Hooks to Sync Component State with URL - Medium**
    [https://medium.com/swlh/using-react-hooks-to-sync-your-component-state-with-the-url-query-string-81ccdfcb174f](https://medium.com/swlh/using-react-hooks-to-sync-your-component-state-with-the-url-query-string-81ccdfcb174f)

12. **Custom React Hook for URL State - DEV Community**
    [https://dev.to/mr_mornin_star/custom-react-hook-to-sync-state-with-the-url-4b6p](https://dev.to/mr_mornin_star/custom-react-hook-to-sync-state-with-the-url-4b6p)

13. **Single Page Application Routing: Hash vs URL - TheDevDrawer**
    [https://thedevdrawer.medium.com/single-page-application-routing-using-hash-or-url-d6d1e2adcde](https://thedevdrawer.medium.com/single-page-application-routing-using-hash-or-url-d6d1e2adcde)

14. **Preserving Form State with Browser History - Dev Community**
    [https://dev.to/schniz/preserving-form-state-in-refreshes-and-navigation-with-react-257j](https://dev.to/schniz/preserving-form-state-in-refreshes-and-navigation-with-react-257j)

15. **Syncing React Application State with the URL - Carlo Gino**
    [https://carlogino.com/blog/react-sync-state-with-url](https://carlogino.com/blog/react-sync-state-with-url)

16. **History.js - Polyfill for Legacy Browser Support**
    [https://github.com/browserstate/history.js/](https://github.com/browserstate/history.js/)

17. **Browser Memory Limits - textplain**
    [https://textslashplain.com/2020/09/15/browser-memory-limits/](https://textslashplain.com/2020/09/15/browser-memory-limits/)

### React Router & Framework-Specific

18. **React Router State Management**
    [https://reactrouter.com/explanation/state-management](https://reactrouter.com/explanation/state-management)

19. **React Router Documentation**
    [https://reactrouter.com](https://reactrouter.com)

---

## Summary & Recommendations

### For Your Form Stack Hook

**Architecture Decision Summary:**
- **URL Strategy:** Query parameters (`?forms=form-1,form-2`)
- **State Organization:** URL as source of truth, React state for immediate reactivity
- **History Method:** `pushState()` for opening forms, `replaceState()` for closing
- **Event Handling:** `popstate` listener for back/forward, manual updates for pushState/replaceState
- **Serialization:** Minimal state (form IDs only), store detailed form data in React state

**Implementation Approach:**
1. Initialize form stack from URL on component mount
2. Listen to `popstate` events for browser navigation
3. Manually sync to URL after state changes (pushState for new, replaceState for modifications)
4. Always parse URL as fallback, prefer history.state as convenience copy
5. Clean up event listeners on unmount

**Benefits:**
- Bookmarkable form stacks
- Shareable URLs
- Back/forward button support
- No server-side routing required
- Works with static hosting
- SEO-friendly (not using hash fragments)
- Extensible for additional parameters

**Edge Cases to Handle:**
- Firefox doesn't fire popstate on page load → Initialize on mount AND popstate handler
- Chrome/Safari fire popstate on page load → Use initialization guard
- Race condition between URL and DOM → Use setTimeout if DOM update needed
- Very large form stacks → Keep serialized state under 640KB in Firefox

See the complete hook implementation above for production-ready code.
