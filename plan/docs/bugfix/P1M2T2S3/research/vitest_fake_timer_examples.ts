/**
 * Vitest Fake Timers - Practical Code Examples
 *
 * This file contains executable code examples for testing RAF-based
 * update coalescing with Vitest fake timers.
 *
 * Run examples with: vitest run vitest_fake_timer_examples.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// =============================================================================
// SECTION 1: Basic Fake Timer Setup
// =============================================================================

describe('1. Basic Fake Timer Setup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('setTimeout - basic usage', () => {
    const callback = vi.fn();
    setTimeout(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('setTimeout - multiple timers', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    setTimeout(callback1, 500);
    setTimeout(callback2, 1000);

    vi.advanceTimersByTime(500);
    expect(callback1).toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(callback2).toHaveBeenCalled();
  });

  it('setInterval - repeated execution', () => {
    const callback = vi.fn();
    setInterval(callback, 100);

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(5); // 2 + 3 more
  });
});

// =============================================================================
// SECTION 2: requestAnimationFrame with Fake Timers
// =============================================================================

describe('2. requestAnimationFrame with Fake Timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('RAF - basic execution', () => {
    const callback = vi.fn();
    requestAnimationFrame(callback);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(16); // One frame at 60fps
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('RAF - sequential frames', () => {
    const callback = vi.fn();

    requestAnimationFrame(() => callback('frame1'));
    requestAnimationFrame(() => callback('frame2'));

    vi.advanceTimersByTime(16);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('RAF - frame IDs', () => {
    const id1 = requestAnimationFrame(() => {});
    const id2 = requestAnimationFrame(() => {});
    const id3 = requestAnimationFrame(() => {});

    expect(typeof id1).toBe('number');
    expect(typeof id2).toBe('number');
    expect(typeof id3).toBe('number');
    expect(id2).toBeGreaterThan(id1);
    expect(id3).toBeGreaterThan(id2);
  });

  it('RAF - cancelAnimationFrame', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const id1 = requestAnimationFrame(callback1);
    const id2 = requestAnimationFrame(callback2);

    cancelAnimationFrame(id2);

    vi.advanceTimersByTime(16);
    expect(callback1).toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });
});

// =============================================================================
// SECTION 3: RAF Coalescing Patterns
// =============================================================================

describe('3. RAF Coalescing Patterns', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalescing - version-based pattern', () => {
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

    // Schedule multiple rapid updates
    scheduleUpdate(1);
    scheduleUpdate(2);
    scheduleUpdate(3);

    vi.advanceTimersByTime(16);

    // Only last update should execute
    expect(updates).toEqual([3]);
  });

  it('coalescing - multi-frame updates', () => {
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

    // Second batch (after first completes)
    scheduleUpdate(3);
    scheduleUpdate(4);
    vi.advanceTimersByTime(16);
    expect(updates).toEqual([2, 4]);
  });

  it('coalescing - flag reset pattern', () => {
    let isUpdating = false;
    const updates: string[] = [];

    const scheduleUpdate = (value: string) => {
      if (isUpdating) return; // Skip if already updating

      isUpdating = true;
      requestAnimationFrame(() => {
        updates.push(value);

        // Reset flag with double-RAF
        requestAnimationFrame(() => {
          isUpdating = false;
        });
      });
    };

    scheduleUpdate('first');
    scheduleUpdate('second'); // Skipped due to flag
    scheduleUpdate('third');  // Skipped due to flag

    vi.advanceTimersByTime(16);  // First RAF - execute update
    expect(updates).toEqual(['first']);
    expect(isUpdating).toBe(true);

    vi.advanceTimersByTime(16);  // Second RAF - reset flag
    expect(isUpdating).toBe(false);

    // Now can schedule again
    scheduleUpdate('fourth');
    vi.advanceTimersByTime(32); // Both RAFs
    expect(updates).toEqual(['first', 'fourth']);
  });
});

// =============================================================================
// SECTION 4: Timer Advancement Methods Comparison
// =============================================================================

describe('4. Timer Advancement Methods', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('advanceTimersByTime - precise control', () => {
    const callback = vi.fn();
    setTimeout(callback, 100);

    vi.advanceTimersByTime(50);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('runAllTimers - execute everything', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    setTimeout(callback1, 1000);
    setTimeout(callback2, 5000);

    vi.runAllTimers();

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it('runOnlyPendingTimers - step by step', () => {
    const callbacks: string[] = [];

    setTimeout(() => {
      callbacks.push('first');
      setTimeout(() => callbacks.push('nested'), 100);
    }, 100);

    vi.runOnlyPendingTimers();
    expect(callbacks).toEqual(['first']);

    vi.runOnlyPendingTimers();
    expect(callbacks).toEqual(['first', 'nested']);
  });

  it('advanceTimersByTimeAsync - with promises', async () => {
    const callbacks: string[] = [];

    setTimeout(() => {
      callbacks.push('timeout');
      Promise.resolve().then(() => {
        callbacks.push('promise');
      });
    }, 100);

    await vi.advanceTimersByTimeAsync(100);

    expect(callbacks).toEqual(['timeout', 'promise']);
  });
});

// =============================================================================
// SECTION 5: React Hook Testing with Fake Timers
// =============================================================================

describe('5. React Hook Testing with Fake Timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hook - basic timer usage', () => {
    const { result } = renderHook(() => {
      const [count, setCount] = React.useState(0);

      React.useEffect(() => {
        const timer = setTimeout(() => {
          setCount(1);
        }, 1000);

        return () => clearTimeout(timer);
      }, []);

      return count;
    });

    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(1);
  });

  it('hook - unmount during timer', () => {
    const effectCleanup = vi.fn();

    const { result, unmount } = renderHook(() => {
      React.useEffect(() => {
        const timer = setTimeout(() => {}, 1000);
        return () => {
          clearTimeout(timer);
          effectCleanup();
        };
      }, []);

      return true;
    });

    // Unmount before timer completes
    unmount();

    expect(effectCleanup).toHaveBeenCalled();
  });

  it('hook - RAF in useEffect', () => {
    const { result } = renderHook(() => {
      const [ready, setReady] = React.useState(false);

      React.useEffect(() => {
        requestAnimationFrame(() => {
          setReady(true);
        });
      }, []);

      return ready;
    });

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(16);
    });

    expect(result.current).toBe(true);
  });
});

// =============================================================================
// SECTION 6: useFormStackURLSync Specific Patterns
// =============================================================================

describe('6. useFormStackURLSync RAF Patterns', () => {
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

  it('URL sync - version-based coalescing', () => {
    let pendingUpdate = 0;
    const updates: number[] = [];

    const syncStackToUrl = (formIds: string[]) => {
      const updateId = ++pendingUpdate;

      requestAnimationFrame(() => {
        // Version check - only proceed if latest
        if (updateId === pendingUpdate) {
          updates.push(updateId);
          window.history.replaceState(
            { forms: formIds },
            '',
            `?forms=${formIds.join(',')}`
          );
        }
      });
    };

    // Simulate rapid stack changes
    syncStackToUrl(['form1']);
    syncStackToUrl(['form1', 'form2']);
    syncStackToUrl(['form1', 'form2', 'form3']);

    vi.advanceTimersByTime(16);

    // Only last update should execute
    expect(updates).toEqual([3]);
    expect(window.history.replaceState).toHaveBeenCalledTimes(1);
    expect(window.history.replaceState).toHaveBeenCalledWith(
      { forms: ['form1', 'form2', 'form3'] },
      '',
      '?forms=form1,form2,form3'
    );
  });

  it('URL sync - flag reset with double RAF', () => {
    let isUpdating = false;
    const flagStates: boolean[] = [];

    const performUpdate = () => {
      isUpdating = true;
      flagStates.push(isUpdating);

      // First RAF
      requestAnimationFrame(() => {
        flagStates.push(isUpdating);

        // Second RAF - reset flag
        requestAnimationFrame(() => {
          isUpdating = false;
          flagStates.push(isUpdating);
        });
      });
    };

    performUpdate();

    expect(flagStates).toEqual([true]);

    vi.advanceTimersByTime(16);
    expect(flagStates).toEqual([true, true]);
    expect(isUpdating).toBe(true);

    vi.advanceTimersByTime(16);
    expect(flagStates).toEqual([true, true, false]);
    expect(isUpdating).toBe(false);
  });

  it('URL sync - mount safety with RAF', () => {
    let isMounted = true;
    const updates: string[] = [];

    const scheduleUpdate = (value: string) => {
      requestAnimationFrame(() => {
        // Mount guard
        if (!isMounted) {
          updates.push('skipped-' + value);
          return;
        }

        updates.push(value);
      });
    };

    scheduleUpdate('update1');

    // Unmount before RAF executes
    isMounted = false;

    vi.advanceTimersByTime(16);

    // Update should be skipped
    expect(updates).toEqual(['skipped-update1']);
  });

  it('URL sync - isUpdating flag prevents concurrent updates', () => {
    let isUpdating = false;
    const updates: string[] = [];

    const tryUpdate = (value: string) => {
      if (isUpdating) {
        updates.push('blocked-' + value);
        return;
      }

      isUpdating = true;
      requestAnimationFrame(() => {
        updates.push(value);

        requestAnimationFrame(() => {
          isUpdating = false;
        });
      });
    };

    tryUpdate('update1');
    tryUpdate('update2'); // Should be blocked
    tryUpdate('update3'); // Should be blocked

    vi.advanceTimersByTime(32); // Both RAFs

    expect(updates).toEqual(['update1', 'blocked-update2', 'blocked-update3']);
  });
});

// =============================================================================
// SECTION 7: Common Pitfalls and Anti-Patterns
// =============================================================================

describe('7. Common Pitfalls (How NOT to do it)', () => {
  it('pitfall - missing act()', () => {
    const { result } = renderHook(() => {
      const [count, setCount] = React.useState(0);
      return { count, setCount };
    });

    // ❌ WRONG - not wrapped in act()
    // result.current.setCount(1);

    // ✅ RIGHT - wrapped in act()
    act(() => {
      result.current.setCount(1);
    });

    expect(result.current.count).toBe(1);
  });

  it('pitfall - not cleaning up fake timers', () => {
    // ❌ WRONG - no cleanup
    // vi.useFakeTimers();
    // If this fails or is skipped, fake timers leak to next test

    // ✅ RIGHT - proper setup/teardown
    vi.useFakeTimers();
    try {
      const callback = vi.fn();
      setTimeout(callback, 100);
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('pitfall - infinite loop with runAllTimers', () => {
    // ❌ DANGEROUS - infinite loop
    /*
    const callback = vi.fn();
    setInterval(() => {
      callback();
      setInterval(() => callback(), 100);
    }, 100);
    vi.runAllTimers(); // Never completes!
    */

    // ✅ SAFE - use runOnlyPendingTimers or advanceTimersByTime
    let count = 0;
    const callback = vi.fn(() => {
      if (count < 5) {
        count++;
        setTimeout(callback, 100);
      }
    });

    callback();

    // Only run pending timers
    for (let i = 0; i < 5; i++) {
      vi.runOnlyPendingTimers();
    }

    expect(callback).toHaveBeenCalledTimes(6);
  });
});

// =============================================================================
// SECTION 8: Testing Race Conditions
// =============================================================================

describe('8. Testing Race Conditions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('race condition - rapid state updates', () => {
    let state = 'initial';
    const updates: string[] = [];

    const updateState = (newState: string) => {
      requestAnimationFrame(() => {
        // Check if we're still the latest update
        if (state === newState) {
          updates.push('confirmed-' + newState);
        } else {
          updates.push('superseded-' + state);
        }
      });
      state = newState;
    };

    updateState('state1');
    updateState('state2');
    updateState('state3');

    vi.advanceTimersByTime(16);

    // All updates should see the final state
    expect(updates).toEqual([
      'superseded-state3',
      'superseded-state3',
      'confirmed-state3',
    ]);
  });

  it('race condition - concurrent URL updates', () => {
    const urlUpdates: string[] = [];
    let pendingUpdate = 0;

    const updateUrl = (path: string) => {
      const updateId = ++pendingUpdate;

      requestAnimationFrame(() => {
        if (updateId === pendingUpdate) {
          urlUpdates.push(path);
        }
      });
    };

    // Simulate concurrent updates from multiple sources
    updateUrl('/path1');
    updateUrl('/path2');
    updateUrl('/path3');

    vi.advanceTimersByTime(16);

    // Only last update should win
    expect(urlUpdates).toEqual(['/path3']);
  });
});

// =============================================================================
// TYPE IMPORTS FOR REACT
// =============================================================================

import React from 'react';
