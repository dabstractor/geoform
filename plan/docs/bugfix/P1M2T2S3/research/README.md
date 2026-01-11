# Vitest Fake Timers Research - Summary

**Task:** P1.M2.T2.S3 - Research Vitest fake timers for testing RAF-based coalescing
**Date:** 2026-01-11
**Status:** ✅ Complete

## Research Artifacts

### 1. Main Research Document
**File:** `/home/dustin/projects/geoform/plan/bugfix/P1M2T2S3/research/vitest_fake_timers.md`

Comprehensive 22KB document covering:
- Basic fake timers setup and cleanup
- requestAnimationFrame with fake timers
- RAF-based coalescing patterns
- Timer advancement methods comparison
- Common pitfalls in React hook tests
- Cleanup and best practices
- Practical examples for useFormStackURLSync
- Official documentation sources

### 2. Executable Code Examples
**File:** `/home/dustin/projects/geoform/plan/bugfix/P1M2T2S3/research/vitest_fake_timer_examples.ts`

17KB of ready-to-run test examples organized into 8 sections:
1. Basic fake timer setup
2. requestAnimationFrame with fake timers
3. RAF coalescing patterns
4. Timer advancement methods comparison
5. React hook testing with fake timers
6. useFormStackURLSync specific patterns
7. Common pitfalls and anti-patterns
8. Testing race conditions

Run examples with:
```bash
vitest run plan/bugfix/P1M2T2S3/research/vitest_fake_timer_examples.ts
```

## Key Findings

### 1. RAF Coalescing IS Testable with Fake Timers

The version-based coalescing pattern used in `useFormStackURLSync` can be properly tested:

```typescript
// Version-based coalescing (lines 193-209 in useFormStackURLSync.ts)
const updateId = ++pendingUpdateRef.current;

requestAnimationFrame(() => {
  if (updateId === pendingUpdateRef.current) {
    // Only proceed if still the latest update
    performUpdate();
  }
});
```

**Test pattern:**
```typescript
scheduleUpdate(1);
scheduleUpdate(2);
scheduleUpdate(3);

vi.advanceTimersByTime(16);

// Only update 3 executes
expect(updates).toEqual([3]);
```

### 2. Timer Advancement Strategy

For RAF-based tests:
- **Use `vi.advanceTimersByTime(16)`** - One frame at ~60fps (16ms)
- **Use `vi.advanceTimersByTime(32)`** - Two frames (for double-RAF patterns)
- **Use `vi.runAllTimers()`** - When you want everything to complete immediately

### 3. Critical Cleanup Pattern

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();  // ALWAYS restore
  vi.clearAllMocks();  // Good practice
});
```

### 4. React Hook Testing Integration

```typescript
it('tests RAF with hooks', () => {
  const { result } = renderHook(() => useMyHook());

  act(() => {
    result.current.triggerUpdate();
    vi.advanceTimersByTime(16);
  });

  expect(result.current.value).toBe('updated');
});
```

## Official Documentation Sources

While web search was rate-limited, here are the key official sources:

1. **Vitest API - Mock Functions**
   - `https://vitest.dev/api/mock-functions.html`
   - `vi.useFakeTimers()`, `vi.useRealTimers()`

2. **Vitest API - vi Reference**
   - `https://vitest.dev/api/vi.html`
   - `vi.advanceTimersByTime()`, `vi.runAllTimers()`

3. **Vitest Guide - Mocking**
   - `https://vitest.dev/guide/mocking.html#timers`

4. **React Testing Library**
   - `https://testing-library.com/docs/react-testing-library/api#renderhook`

## Application to useFormStackURLSync

### Current Implementation
The hook uses `isRAFActuallyAvailable()` to detect test environments and bypass RAF:

```typescript
// Lines 227-248
if (isRAFActuallyAvailable()) {
  requestAnimationFrame(performUpdate);
} else {
  // Test environment: Execute immediately
  performUpdate();
}
```

### Recommended Testing Strategy

1. **Keep dual-path implementation** - Maintain both test and production code paths
2. **Add fake timer test suite** - Create tests that explicitly enable RAF
3. **Test both code paths** - Validate synchronous and RAF-based execution
4. **Focus on behavior, not implementation** - Test that coalescing works, regardless of mechanism

### Example Test for useFormStackURLSync

```typescript
describe('useFormStackURLSync - RAF Coalescing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock RAF detection to return true
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalesces multiple URL updates into one RAF frame', () => {
    const { result } = renderHook(() => useFormStackURLSync());

    // Trigger multiple rapid updates
    act(() => {
      result.current.forceUrlUpdate();
      result.current.forceUrlUpdate();
      result.current.forceUrlUpdate();
    });

    // Advance one RAF frame
    act(() => {
      vi.advanceTimersByTime(16);
    });

    // Should only update URL once
    expect(window.history.replaceState).toHaveBeenCalledTimes(1);
  });
});
```

## Common Pitfalls to Avoid

1. ❌ **Forgetting cleanup** - Always restore real timers in `afterEach`
2. ❌ **Not using `act()`** - Wrap state updates in `act()` for proper React testing
3. ❌ **Infinite loops** - Use `runOnlyPendingTimers()` instead of `runAllTimers()` for recursive timers
4. ❌ **Mixing timers and promises** - Use `advanceTimersByTimeAsync()` for async operations
5. ❌ **Testing RAF without fake timers** - RAF doesn't execute in jsdom without them

## Next Steps

1. ✅ Research complete
2. ⏭️ Implement fake timer test utilities
3. ⏭️ Add RAF coalescing test suite
4. ⏭️ Validate double-RAF flag reset pattern
5. ⏭️ Test mount/unmount safety with RAF
6. ⏭️ Document patterns for contributors

## Related Code Files

- `/home/dustin/projects/geoform/src/hooks/useFormStackURLSync.ts` - Main implementation
- `/home/dustin/projects/geoform/src/hooks/__tests__/useFormStackURLSync.test.tsx` - Current tests
- `/home/dustin/projects/geoform/plan/bugfix/P1M2T2S3/research/vitest_fake_timers.md` - This research
- `/home/dustin/projects/geoform/plan/bugfix/P1M2T2S3/research/vitest_fake_timer_examples.ts` - Code examples

---

**Research Completed By:** Claude Code (Anthropic)
**Vitest Version:** 2.1.9
**React Testing Library:** 16.3.1
