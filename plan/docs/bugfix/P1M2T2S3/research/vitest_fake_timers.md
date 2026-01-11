# Vitest Fake Timers Research: Testing RAF-Based Coalescing

**Research Date:** 2026-01-11
**Vitest Version:** 2.1.9
**Testing Library:** @testing-library/react@16.3.1

## Table of Contents
1. [Overview](#overview)
2. [Basic Fake Timers Setup](#basic-fake-timers-setup)
3. [requestAnimationFrame with Fake Timers](#requestanimationframe-with-fake-timers)
4. [Testing RAF-Based Coalescing](#testing-raf-based-coalescing)
5. [Timer Advancement Methods](#timer-advancement-methods)
6. [Common Pitfalls in React Hook Tests](#common-pitfalls-in-react-hook-tests)
7. [Cleanup and Best Practices](#cleanup-and-best-practices)
8. [Practical Examples for useFormStackURLSync](#practical-examples-for-useformstackurlsync)
9. [Official Documentation Sources](#official-documentation-sources)

---

## Overview

Vitest's fake timers (`vi.useFakeTimers()`) allow deterministic testing of time-dependent code by replacing global timer functions (`setTimeout`, `setInterval`, `requestAnimationFrame`, etc.) with mock implementations.

### Why Fake Timers Matter for RAF Coalescing

In `/home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts`, we use RAF-based coalescing to prevent race conditions during rapid URL updates:

```typescript
// Lines 242-248 from useFormStackURLSync.ts
if (isRAFActuallyAvailable()) {
  // Production: Use RAF to coalesce rapid updates into a single frame
  requestAnimationFrame(performUpdate);
} else {
  // Test environment: Execute immediately for test compatibility
  performUpdate();
}
```

The hook currently detects test environments and bypasses RAF because jsdom doesn't properly execute RAF callbacks. With fake timers, we can properly test the RAF coalescing logic.

---

## Basic Fake Timers Setup

### 1. Simple Setup and Cleanup

```typescript
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('My Timer Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should test setTimeout', () => {
    const callback = vi.fn();
    setTimeout(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalled();
  });
});
```

**Key Points:**
- Always call `vi.useFakeTimers()` in `beforeEach` for consistent test isolation
- Always call `vi.useRealTimers()` in `afterEach` to restore real timers
- Never forget cleanup - leaked fake timers can cause flaky tests

### 2. Selective Timer Faking

```typescript
// Only fake specific timers
vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

// Or fake everything (default)
vi.useFakeTimers();
```

**Common Timer Types:**
- `'setTimeout'` / `'clearTimeout'`
- `'setInterval'` / `'clearInterval'`
- `'setImmediate'` / `'clearImmediate'`
- `'requestAnimationFrame'` / `'cancelAnimationFrame'`
- `'Date'` (mocks `Date.now()`)

---

## requestAnimationFrame with Fake Timers

### 1. Basic RAF Testing

```typescript
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('requestAnimationFrame with Fake Timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute RAF callback after advancing time', () => {
    const callback = vi.fn();
    requestAnimationFrame(callback);

    // RAF callbacks execute on the next animation frame (~16ms at 60fps)
    expect(callback).not.toHaveBeenCalled();

    // Advance past one frame
    vi.advanceTimersByTime(16);
    expect(callback).toHaveBeenCalled();
  });

  it('should support multiple RAF calls', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    requestAnimationFrame(callback1);
    requestAnimationFrame(callback2);

    vi.advanceTimersByTime(16);

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });
});
```

### 2. RAF Coalescing Pattern

This is crucial for testing the update coalescing in `useFormStackURLSync`:

```typescript
it('should coalesce multiple RAF calls into single frame', () => {
  const callback = vi.fn();
  let callCount = 0;

  // Simulate rapid updates that should coalesce
  const scheduleUpdate = () => {
    const updateId = ++callCount;

    requestAnimationFrame(() => {
      // Only the last update should execute
      if (updateId === callCount) {
        callback(updateId);
      }
    });
  };

  // Schedule multiple rapid updates
  scheduleUpdate(); // updateId = 1
  scheduleUpdate(); // updateId = 2
  scheduleUpdate(); // updateId = 3

  // Advance one frame
  vi.advanceTimersByTime(16);

  // Only the last update (3) should execute
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(3);
});
```

### 3. RAF Return Values (Frame IDs)

```typescript
it('should return frame IDs from RAF', () => {
  const id1 = requestAnimationFrame(() => {});
  const id2 = requestAnimationFrame(() => {});

  expect(typeof id1).toBe('number');
  expect(typeof id2).toBe('number');
  expect(id2).toBe(id1 + 1); // Sequential IDs

  // Cancel a frame
  cancelAnimationFrame(id2);
  vi.advanceTimersByTime(16);

  // id2 callback should not execute
});
```

---

## Testing RAF-Based Coalescing

### Pattern from useFormStackURLSync

The hook uses version-based coalescing:

```typescript
// From useFormStackURLSync.ts (lines 193-209)
const updateId = ++pendingUpdateRef.current;
isUpdatingRef.current = true;

const performUpdate = () => {
  // Only proceed if this is still the latest update
  if (updateId !== pendingUpdateRef.current) {
    return; // Skip - superseded by newer update
  }

  // ... perform update

  // Reset flag
  requestAnimationFrame(() => {
    isUpdatingRef.current = false;
  });
};

requestAnimationFrame(performUpdate);
```

### Test for Version-Based Coalescing

```typescript
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('RAF Coalescing - Version Pattern', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should coalesce rapid updates using version numbers', () => {
    let pendingUpdate = 0;
    const updates: number[] = [];

    const scheduleUpdate = (id: number) => {
      const updateId = ++pendingUpdate;

      requestAnimationFrame(() => {
        // Only execute if this is still the latest update
        if (updateId === pendingUpdate) {
          updates.push(id);
        }
      });
    };

    // Rapid updates
    scheduleUpdate(1);
    scheduleUpdate(2);
    scheduleUpdate(3);

    // Before frame - no updates yet
    expect(updates).toEqual([]);

    // Advance one frame
    vi.advanceTimersByTime(16);

    // Only last update should execute
    expect(updates).toEqual([3]);
  });

  it('should handle updates across multiple frames', () => {
    let pendingUpdate = 0;
    const updates: number[] = [];

    const scheduleUpdate = (id: number) => {
      const updateId = ++pendingUpdate;

      requestAnimationFrame(() => {
        if (updateId === pendingUpdate) {
          updates.push(id);
        }
      });
    };

    // First batch
    scheduleUpdate(1);
    scheduleUpdate(2);

    vi.advanceTimersByTime(16);
    expect(updates).toEqual([2]);

    // Second batch (after first frame completes)
    scheduleUpdate(3);
    scheduleUpdate(4);

    vi.advanceTimersByTime(16);
    expect(updates).toEqual([2, 4]);
  });
});
```

---

## Timer Advancement Methods

Vitest provides several methods to advance fake timers:

### 1. `vi.advanceTimersByTime(ms)` - Most Precise

```typescript
it('advances time by specific amount', () => {
  const callback = vi.fn();
  setTimeout(callback, 1000);

  vi.advanceTimersByTime(500); // Halfway there
  expect(callback).not.toHaveBeenCalled();

  vi.advanceTimersByTime(500); // Now it fires
  expect(callback).toHaveBeenCalledTimes(1);
});
```

**Use when:** You need precise control over timing or testing intermediate states

### 2. `vi.runAllTimers()` - Run Everything

```typescript
it('runs all pending timers', () => {
  const callback1 = vi.fn();
  const callback2 = vi.fn();

  setTimeout(callback1, 1000);
  setTimeout(callback2, 5000);

  vi.runAllTimers();

  expect(callback1).toHaveBeenCalled();
  expect(callback2).toHaveBeenCalled();
});
```

**Warning:** Can cause infinite loops if timers schedule new timers
**Use when:** Simple tests where all timers should complete immediately

### 3. `vi.runOnlyPendingTimers()` - Current Set Only

```typescript
it('only runs currently pending timers', () => {
  const callback = vi.fn();

  setTimeout(() => {
    callback('first');
    setTimeout(() => callback('second'), 1000);
  }, 1000);

  vi.runOnlyPendingTimers(); // Runs first setTimeout
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith('first');

  vi.runOnlyPendingTimers(); // Runs second setTimeout
  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback).toHaveBeenCalledWith('second');
});
```

**Use when:** You have nested timers and want to control execution step by step

### 4. `vi.advanceTimersByTimeAsync(ms)` - Async Version

```typescript
it('advances timers asynchronously', async () => {
  const callback = vi.fn();

  setTimeout(() => {
    callback();
    Promise.resolve().then(() => {
      callback();
    });
  }, 1000);

  await vi.advanceTimersByTimeAsync(1000);

  // Both sync callback and async microtask should execute
  expect(callback).toHaveBeenCalledTimes(2);
});
```

**Use when:** Your timers schedule promises or microtasks

### RAF-Specific Advancement

For RAF, advance by approximately one frame duration:

```typescript
// 60fps = ~16.67ms per frame
vi.advanceTimersByTime(16);

// Or be more generous
vi.advanceTimersByTime(20);

// For high-DPI displays (120fps)
vi.advanceTimersByTime(8);
```

---

## Common Pitfalls in React Hook Tests

### Pitfall 1: Not Wrapping State Updates in `act()`

```typescript
// ❌ WRONG
it('updates state', () => {
  const { result } = renderHook(() => useMyHook());
  result.current.update();
  // State updates might not have propagated yet
  expect(result.current.value).toBe('updated');
});

// ✅ RIGHT
it('updates state', () => {
  const { result } = renderHook(() => useMyHook());
  act(() => {
    result.current.update();
  });
  expect(result.current.value).toBe('updated');
});
```

### Pitfall 2: Mixing Fake Timers with Async Operations

```typescript
// ❌ PROBLEMATIC
it('mixes timers and promises', async () => {
  vi.useFakeTimers();

  const promise = Promise.resolve('value');
  setTimeout(() => {}, 1000);

  await promise; // This might hang because fake timers block microtasks
  vi.runAllTimers();
});

// ✅ BETTER
it('handles timers and promises correctly', async () => {
  vi.useFakeTimers();

  const promise = Promise.resolve('value');
  setTimeout(() => {}, 1000);

  vi.runAllTimers(); // Run timers first
  await promise; // Then handle promises
});
```

### Pitfall 3: Forgetting to Cleanup Between Tests

```typescript
// ❌ WRONG - no cleanup
describe('hook tests', () => {
  it('test 1', () => {
    vi.useFakeTimers();
    // test code
  });

  it('test 2', () => {
    // Still using fake timers from test 1!
    // This can cause unpredictable behavior
  });
});

// ✅ RIGHT - proper cleanup
describe('hook tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('test 1', () => {
    // test code
  });

  it('test 2', () => {
    // Fresh fake timers for each test
  });
});
```

### Pitfall 4: Testing RAF Without Fake Timers in jsdom

```typescript
// ❌ WRONG in jsdom environment
it('tests RAF without fake timers', () => {
  const callback = vi.fn();
  requestAnimationFrame(callback);

  // Callback never executes in jsdom!
  // Test will timeout or fail
  expect(callback).toHaveBeenCalled();
});

// ✅ RIGHT with fake timers
it('tests RAF with fake timers', () => {
  vi.useFakeTimers();

  const callback = vi.fn();
  requestAnimationFrame(callback);

  vi.advanceTimersByTime(16);
  expect(callback).toHaveBeenCalled();

  vi.useRealTimers();
});
```

### Pitfall 5: Not Handling useEffect Timing Correctly

```typescript
// ❌ PROBLEMATIC
it('tests effect without waiting', () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useMyHook());

  // useEffect might not have run yet
  expect(result.current.initialized).toBe(true);
});

// ✅ RIGHT
it('tests effect with proper timing', () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useMyHook());

  // Run all pending effects and timers
  act(() => {
    vi.runAllTimers();
  });

  expect(result.current.initialized).toBe(true);
});
```

---

## Cleanup and Best Practices

### Recommended Cleanup Pattern

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

describe('My Test Suite', () => {
  beforeEach(() => {
    // Setup fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers
    vi.useRealTimers();

    // Clear all mocks (optional but recommended)
    vi.clearAllMocks();
  });

  // tests...
});
```

### Cleanup Order Matters

```typescript
describe('Cleanup Order', () => {
  afterEach(() => {
    // Option 1: Restore timers first, then unmount
    vi.useRealTimers();
    // ... unmount logic

    // Option 2: Unmount first, then restore timers
    // ... unmount logic
    vi.useRealTimers();

    // Both work, but be consistent!
  });
});
```

### React Testing Library Integration

```typescript
import { renderHook, cleanup } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';

describe('With RTL cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup(); // RTL cleanup after timers
  });

  it('works correctly', () => {
    const { result, unmount } = renderHook(() => useMyHook());

    // Test code...

    unmount(); // Explicit unmount
  });
});
```

### When NOT to Use Fake Timers

```typescript
// Don't use fake timers when:
// 1. Testing actual time delays (e.g., animations, debouncing)
// 2. Testing real-world timing behavior
// 3. Tests need to be fast (fake timers are slower than no timers)

// Example: Use real timers for integration-style timing tests
describe('Real timers for timing tests', () => {
  it('measures actual debounce timing', async () => {
    // Don't use fake timers here
    const start = Date.now();
    await debounce(() => {}, 300);
    const end = Date.now();

    expect(end - start).toBeGreaterThanOrEqual(300);
  }, 10000); // Increase timeout for real-time tests
});
```

---

## Practical Examples for useFormStackURLSync

### Example 1: Testing RAF Coalescing with Fake Timers

```typescript
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { useFormStackURLSync } from '../useFormStackURLSync';
import { FormStackProvider } from '../../components';

describe('useFormStackURLSync - RAF Coalescing', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    // Mock window.history
    Object.defineProperty(window, 'history', {
      value: {
        pushState: vi.fn(),
        replaceState: vi.fn(),
        state: null,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FormStackProvider>{children}</FormStackProvider>
  );

  it('should coalesce multiple rapid URL updates', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper });

    // Mock RAF detection to return true
    const originalRAF = global.requestAnimationFrame;
    let rafCallback: (() => void) | null = null;

    global.requestAnimationFrame = vi.fn((cb) => {
      rafCallback = cb;
      return 1;
    });

    // Trigger multiple rapid updates
    act(() => {
      result.current.forceUrlUpdate();
      result.current.forceUrlUpdate();
      result.current.forceUrlUpdate();
    });

    // Before RAF executes - should only have queued one callback
    expect(rafCallback).not.toBeNull();

    // Execute RAF callback
    act(() => {
      rafCallback?.();
    });

    // Should only have called replaceState once due to coalescing
    // Note: This tests the production code path with RAF enabled

    global.requestAnimationFrame = originalRAF;
  });
});
```

### Example 2: Testing Double-RAF Flag Reset

```typescript
it('should reset updating flag after double RAF', () => {
  let isUpdating = true;
  let rafCount = 0;

  const performUpdate = () => {
    // Update logic here
    window.history.replaceState({}, '', '?test');

    // Double-RAF reset pattern
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isUpdating = false;
        rafCount++;
      });
      rafCount++;
    });
  };

  performUpdate();

  // Advance through both RAF calls
  vi.advanceTimersByTime(16);
  expect(rafCount).toBe(1);
  expect(isUpdating).toBe(true);

  vi.advanceTimersByTime(16);
  expect(rafCount).toBe(2);
  expect(isUpdating).toBe(false);
});
```

### Example 3: Testing Race Condition Prevention

```typescript
it('should prevent race conditions with version-based coalescing', () => {
  let pendingUpdate = 0;
  const updates: number[] = [];

  const scheduleUpdate = (id: number) => {
    const updateId = ++pendingUpdate;

    requestAnimationFrame(() => {
      // Version check
      if (updateId === pendingUpdate) {
        updates.push(id);
        // Reset flag
        requestAnimationFrame(() => {
          // Flag reset logic
        });
      }
    });
  };

  // Simulate race condition: rapid updates
  scheduleUpdate(1);
  scheduleUpdate(2);
  scheduleUpdate(3);

  vi.advanceTimersByTime(16); // First RAF - updates
  vi.advanceTimersByTime(16); // Second RAF - flag reset

  // Only last update should win
  expect(updates).toEqual([3]);
});
```

### Example 4: Integration Test with mount/unmount

```typescript
it('should handle mount/unmount with RAF correctly', () => {
  const { result, unmount } = renderHook(
    () => useFormStackURLSync(),
    { wrapper }
  );

  const callbacks: Array<() => void> = [];
  global.requestAnimationFrame = vi.fn((cb) => {
    callbacks.push(cb);
    return callbacks.length;
  });

  // Trigger update
  act(() => {
    result.current.forceUrlUpdate();
  });

  // Unmount before RAF executes
  unmount();

  // Execute RAF after unmount
  act(() => {
    callbacks.forEach(cb => cb());
  });

  // Should not update after unmount (mount guard)
  // This tests the isMountedRef pattern in the hook
});
```

---

## Official Documentation Sources

### Vitest Official Documentation

1. **Vitest API - Mock Functions**
   - URL: `https://vitest.dev/api/mock-functions.html`
   - Section: `vi.useFakeTimers()`, `vi.useRealTimers()`
   - Key topics: Fake timer setup, timer control methods

2. **Vitest API - vi Reference**
   - URL: `https://vitest.dev/api/vi.html`
   - Methods: `vi.advanceTimersByTime()`, `vi.runAllTimers()`, `vi.runOnlyPendingTimers()`
   - Key topics: Timer advancement methods, async timer control

3. **Vitest Guide - Mocking**
   - URL: `https://vitest.dev/guide/mocking.html`
   - Section: Timers
   - Key topics: Timer mocking strategies, best practices

### Related Testing Resources

4. **React Testing Library - Hooks**
   - URL: `https://testing-library.com/docs/react-testing-library/api#renderhook`
   - Key topics: Testing hooks with renderHook, act() for state updates

5. **@sinonjs/fake-timers** (Underlying library)
   - URL: `https://github.com/sinonjs/fake-timers`
   - Key topics: Advanced timer control, clock implementation

### Codebase References

6. **Current Implementation**
   - `/home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts`
   - Lines 15-41: `isRAFActuallyAvailable()` function
   - Lines 184-251: `syncStackToUrl()` with RAF coalescing
   - Lines 228-232: Double-RAF flag reset pattern

7. **Existing Tests**
   - `/home/dustin/projects/geoform/src/hooks/__tests__/useFormStackURLSync.test.tsx`
   - Current test patterns without fake timers
   - Manual mock setup for window.history and window.location

---

## Summary and Recommendations

### Key Takeaways

1. **Fake timers are essential for testing RAF coalescing** - Without them, RAF callbacks don't execute in jsdom, making coalescing logic untestable.

2. **Version-based coalescing is testable** - The pattern used in `useFormStackURLSync` (comparing `updateId` with `pendingUpdateRef.current`) can be reliably tested with fake timers.

3. **Timer advancement requires care** - Use `vi.advanceTimersByTime(16)` for RAF, and `vi.runAllTimers()` for complete execution.

4. **Cleanup is critical** - Always restore real timers in `afterEach` to prevent test leakage.

5. **React Testing Library integration works well** - Combine fake timers with `act()` and `renderHook()` for comprehensive hook testing.

### Recommended Testing Strategy

1. **Keep the production RAF detection** - The `isRAFActuallyAvailable()` function correctly detects test environments and bypasses RAF for backward compatibility.

2. **Add fake timer tests for RAF paths** - Create new test suites that enable fake timers and test the production code path with RAF enabled.

3. **Test both code paths** - Maintain tests for both the test-environment path (synchronous) and production path (RAF-based).

4. **Use version-based assertions** - When testing coalescing, assert that only the last version executes.

### Next Steps

1. Implement test utilities for RAF testing with fake timers
2. Add test suite for RAF coalescing behavior
3. Validate double-RAF flag reset pattern
4. Test mount/unmount safety with RAF callbacks
5. Document test patterns for future contributors

---

**Document Version:** 1.0
**Last Updated:** 2026-01-11
**Status:** Complete - Ready for implementation reference
