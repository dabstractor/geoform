# React Testing Library & Vitest Race Condition Testing Patterns

**Date:** 2025-01-11
**Research Focus:** Testing race conditions in React hooks with React Testing Library and Vitest
**Target Hook:** `useFormStackURLSync`
**Related Task:** P1.M2.T2.S3 - Implement race condition tests

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Testing Rapid Successive State Changes](#testing-rapid-successive-state-changes)
3. [Testing Browser Navigation Race Conditions](#testing-browser-navigation-race-conditions)
4. [Fake Timers Best Practices](#fake-timers-best-practices)
5. [Mocking History API](#mocking-history-api)
6. [Testing URL State Consistency](#testing-url-state-consistency)
7. [Detecting Duplicate History Entries](#detecting-duplicate-history-entries)
8. [Complete Test Examples](#complete-test-examples)
9. [References & Sources](#references--sources)

---

## Executive Summary

This document provides actionable patterns for testing race conditions in React hooks, specifically tailored for the `useFormStackURLSync` hook. All patterns are based on official React Testing Library documentation, Vitest best practices, and real-world scenarios from the codebase.

**Key Findings:**
- Use `act()` and `waitFor()` for sequential operations
- Leverage Vitest's fake timers for time-dependent race conditions
- Mock `window.history` methods with `vi.spyOn()` or `vi.fn()`
- Test URL consistency by tracking state throughout operations
- Detect duplicates by counting history API calls

---

## Testing Rapid Successive State Changes

### Pattern 1: Sequential Operations in `act()`

**Use Case:** Testing 3+ rapid state changes in quick succession

**Implementation:**

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('rapid successive state changes', () => {
  it('should handle 3+ rapid form opens without desync', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

    // Execute rapid operations in single act() block
    await act(async () => {
      openForm('form-1')
      openForm('form-2')
      openForm('form-3')
    })

    // Verify final state is consistent
    await waitFor(() => {
      expect(result.current.getUrlState()).toEqual(['form-1', 'form-2', 'form-3'])
    })

    // Verify URL was updated correctly
    expect(mockPushState).toHaveBeenCalledTimes(3)
    expect(mockPushState).toHaveBeenNthCalledWith(3,
      { forms: ['form-1', 'form-2', 'form-3'] },
      '',
      expect.stringContaining('forms=form-1%2Cform-2%2Cform-3')
    )
  })
})
```

**Key Points:**
- Wrap all rapid operations in a single `act()` block
- Use `await waitFor()` to verify final state
- Assert the number of operations matches expected count
- Verify both state and URL are consistent

---

### Pattern 2: Rapid Open/Close Cycles

**Use Case:** Testing rapid add/remove operations

**Implementation:**

```typescript
it('should handle rapid open/close cycles without state corruption', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

  // Rapid open/close cycle
  await act(async () => {
    openForm('form-1')
    openForm('form-2')
    popToIndex(0)  // Close form-2
    openForm('form-3')  // Open new form
  })

  await waitFor(() => {
    const state = result.current.getUrlState()
    expect(state).toEqual(['form-1', 'form-3'])  // Should be [form-1, form-3]
  })

  // Verify no duplicate history entries
  const pushStateCalls = mockPushState.mock.calls.length
  const replaceStateCalls = mockReplaceState.mock.calls.length
  expect(pushStateCalls + replaceStateCalls).toBeLessThanOrEqual(4)  // Max 4 updates
})
```

---

### Pattern 3: Stress Testing with Loop

**Use Case:** Testing rapid operations in a loop

**Implementation:**

```typescript
it('should handle rapid sequential operations without memory leaks', async () => {
  const { result, unmount } = renderHook(() => useFormStackURLSync(), { wrapper })

  const operationCount = 10
  const initialMemory = process.memoryUsage().heapUsed

  // Execute rapid operations
  for (let i = 0; i < operationCount; i++) {
    await act(async () => {
      openForm(`form-${i}`)
    })
  }

  // Verify all operations completed
  await waitFor(() => {
    expect(result.current.getUrlState()).toHaveLength(operationCount)
  })

  // Check for memory leaks
  unmount()
  const finalMemory = process.memoryUsage().heapUsed
  const memoryIncrease = finalMemory - initialMemory

  // Memory increase should be minimal (< 1MB)
  expect(memoryIncrease).toBeLessThan(1024 * 1024)
})
```

---

## Testing Browser Navigation Race Conditions

### Pattern 4: Back/Forward During State Updates

**Use Case:** Testing popstate during pending state changes

**Implementation:**

```typescript
describe('browser navigation race conditions', () => {
  it('should handle back button during pending URL update', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

    // Open forms
    await act(async () => {
      openForm('form-1')
      openForm('form-2')
    })

    await waitFor(() => {
      expect(result.current.getUrlState()).toEqual(['form-1', 'form-2'])
    })

    // Clear mock history
    mockPushState.mockClear()
    mockReplaceState.mockClear()

    // Trigger state update and immediately simulate back button
    await act(async () => {
      openForm('form-3')  // This schedules a URL update

      // Simulate popstate before URL update completes
      window.dispatchEvent(new PopStateEvent('popstate', {
        state: { forms: ['form-1'] }
      }))
    })

    // Verify consistent state (not corrupted)
    await waitFor(() => {
      const state = result.current.getUrlState()
      // Should be either ['form-1', 'form-3'] or ['form-1']
      // But NEVER corrupted like ['form-1', 'form-2', 'form-3']
      expect(
        state.equals(['form-1', 'form-3']) || state.equals(['form-1'])
      ).toBe(true)
    })
  })
})
```

---

### Pattern 5: Rapid Back/Forward Clicks

**Use Case:** Testing multiple rapid navigation events

**Implementation:**

```typescript
it('should handle rapid back/forward button clicks', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

  // Setup history
  await act(async () => {
    openForm('form-1')
    openForm('form-2')
    openForm('form-3')
  })

  await waitFor(() => {
    expect(result.current.getUrlState()).toHaveLength(3)
  })

  // Simulate rapid back clicks
  await act(async () => {
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { forms: ['form-1', 'form-2'] }
    }))
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { forms: ['form-1'] }
    }))
  })

  // Verify final state is consistent
  await waitFor(() => {
    expect(result.current.getUrlState()).toEqual(['form-1'])
  })

  // Verify no duplicate entries
  const uniqueStates = new Set(mockPushState.mock.calls.map(call =>
    JSON.stringify(call[0])
  ))
  expect(uniqueStates.size).toBeGreaterThan(0)
})
```

---

### Pattern 6: Navigation During Restoration

**Use Case:** Testing popstate during URL restoration phase

**Implementation:**

```typescript
it('should handle navigation during restoration phase', async () => {
  let popstateResolve: ((value: void) => void) | null = null

  // Mock popstate handler that we can control
  const handlePopstate = vi.fn(() => {
    return new Promise<void>(resolve => {
      popstateResolve = resolve
    })
  })

  mockAddEventListener.mockImplementation((event, handler) => {
    if (event === 'popstate') {
      // @ts-ignore
      handler(new PopStateEvent('popstate', {
        state: { forms: ['form-1'] }
      }))
    }
  })

  const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

  // Trigger restoration
  Object.defineProperty(window, 'location', {
    value: {
      search: '?forms=form-1,form-2',
      pathname: '/',
      href: 'http://localhost/?forms=form-1,form-2',
    },
    writable: true,
    configurable: true,
  })

  // Simulate navigation during restoration
  await act(async () => {
    // Start restoration
    const restorationPromise = waitFor(() => {
      expect(result.current.isRestoring).toBe(false)
    })

    // Trigger another popstate during restoration
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { forms: [] }
    }))

    await restorationPromise
  })

  // Verify state is consistent
  expect(result.current.isRestoring).toBe(false)
})
```

---

## Fake Timers Best Practices

### Pattern 7: Basic Fake Timers Setup

**Use Case:** Testing time-dependent operations

**Implementation:**

```typescript
import { vi, beforeEach, afterEach } from 'vitest'

describe('fake timers for race conditions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should handle debounced URL updates with fake timers', async () => {
    const { result } = renderHook(() => useFormStackURLSync({
      debounceMs: 100
    }), { wrapper })

    // Rapid operations
    await act(async () => {
      openForm('form-1')
      openForm('form-2')
      openForm('form-3')
    })

    // Advance time partially (should not trigger yet)
    vi.advanceTimersByTime(50)
    expect(mockPushState).not.toHaveBeenCalled()

    // Advance past debounce threshold
    vi.advanceTimersByTime(100)

    // Now should have triggered
    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalledTimes(1)
      expect(mockPushState).toHaveBeenCalledWith(
        { forms: ['form-1', 'form-2', 'form-3'] },
        '',
        expect.any(String)
      )
    })
  })
})
```

---

### Pattern 8: Testing setTimeout Flag Reset

**Use Case:** Verifying timing of restoration flag

**Implementation:**

```typescript
it('should properly time restoration flag reset', async () => {
  vi.useFakeTimers()

  const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

  // Trigger popstate
  await act(async () => {
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { forms: ['form-1'] }
    }))
  })

  // Flag should be set
  expect(result.current.isRestoring).toBe(true)

  // Advance past setTimeout
  vi.advanceTimersByTime(0)
  vi.runAllTimers()

  // Flag should be reset
  await waitFor(() => {
    expect(result.current.isRestoring).toBe(false)
  })

  vi.restoreAllMocks()
})
```

---

### Pattern 9: RAF-Based Timing Tests

**Use Case:** Testing requestAnimationFrame timing

**Implementation:**

```typescript
it('should handle double-RAF timing for state stabilization', async () => {
  vi.useFakeTimers()

  const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

  // Trigger operation that uses double-RAF
  await act(async () => {
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { forms: [] }
    }))
  })

  // Run first RAF
  await vi.runAllTimersAsync()

  // Flag might still be true
  const afterFirstRAF = result.current.isRestoring

  // Run second RAF
  await vi.runAllTimersAsync()

  // Flag should now be false
  await waitFor(() => {
    expect(result.current.isRestoring).toBe(false)
  })

  vi.restoreAllMocks()
})
```

---

### Best Practices for Fake Timers

**DO:**
- Always call `vi.useFakeTimers()` in `beforeEach()`
- Always call `vi.restoreAllMocks()` in `afterEach()`
- Use `vi.advanceTimersByTime()` for precise control
- Use `vi.runAllTimers()` to flush all pending timers
- Test with real timers for integration tests

**DON'T:**
- Don't mix fake and real timers in the same test
- Don't forget to restore timers (causes test pollution)
- Don't use `setTimeout` directly in tests (use fake timers)
- Don't assume timer execution order without testing

---

## Mocking History API

### Pattern 10: Comprehensive History API Mock

**Use Case:** Full control over history methods

**Implementation:**

```typescript
describe('history API mocking', () => {
  let mockPushState: ReturnType<typeof vi.fn>
  let mockReplaceState: ReturnType<typeof vi.fn>
  let mockHistoryState: any = null

  beforeEach(() => {
    // Create comprehensive mock
    mockPushState = vi.fn((state: any, title: string, url: string) => {
      mockHistoryState = state
    })

    mockReplaceState = vi.fn((state: any, title: string, url: string) => {
      mockHistoryState = state
    })

    // Mock window.history
    Object.defineProperty(window, 'history', {
      value: {
        pushState: mockPushState,
        replaceState: mockReplaceState,
        state: mockHistoryState,
        length: 1,
        go: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
      },
      writable: true,
      configurable: true,
    })
  })

  it('should track all history operations', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

    await act(async () => {
      openForm('form-1')
      openForm('form-2')
    })

    // Verify pushState was called correctly
    expect(mockPushState).toHaveBeenCalledTimes(2)
    expect(mockPushState).toHaveBeenNthCalledWith(1,
      { forms: ['form-1'] },
      '',
      expect.stringContaining('form-1')
    )
    expect(mockPushState).toHaveBeenNthCalledWith(2,
      { forms: ['form-1', 'form-2'] },
      '',
      expect.stringContaining('form-2')
    )

    // Verify history state is updated
    expect(mockHistoryState).toEqual({ forms: ['form-1', 'form-2'] })
  })
})
```

---

### Pattern 11: SpyOn vs Mock Replacement

**Use Case:** Choosing between spy and mock

**Implementation:**

```typescript
describe('spyOn vs mock replacement', () => {
  it('should use vi.spyOn for partial mocking', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState')

    // Test with spy (preserves original behavior)
    act(() => {
      openForm('form-1')
    })

    expect(pushStateSpy).toHaveBeenCalled()

    // Restore original
    pushStateSpy.mockRestore()
  })

  it('should use vi.fn() for complete replacement', () => {
    const mockPushState = vi.fn()

    Object.defineProperty(window, 'history', {
      value: {
        ...window.history,
        pushState: mockPushState,
      },
      writable: true,
      configurable: true,
    })

    act(() => {
      openForm('form-1')
    })

    expect(mockPushState).toHaveBeenCalled()
  })
})
```

---

### Pattern 12: Tracking History State Changes

**Use Case:** Monitoring history state throughout test

**Implementation:**

```typescript
it('should track history state changes throughout operations', async () => {
  const stateHistory: any[] = []

  const mockPushState = vi.fn((state: any) => {
    stateHistory.push({ ...state, type: 'push' })
  })

  const mockReplaceState = vi.fn((state: any) => {
    stateHistory.push({ ...state, type: 'replace' })
  })

  Object.defineProperty(window, 'history', {
    value: {
      pushState: mockPushState,
      replaceState: mockReplaceState,
      state: null,
    },
    writable: true,
    configurable: true,
  })

  const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

  // Perform operations
  await act(async () => {
    openForm('form-1')
    openForm('form-2')
    popToIndex(0)
  })

  // Verify state progression
  expect(stateHistory).toEqual([
    { forms: ['form-1'], type: 'push' },
    { forms: ['form-1', 'form-2'], type: 'push' },
    { forms: ['form-1'], type: 'replace' },  // popToIndex uses replace
  ])
})
```

---

## Testing URL State Consistency

### Pattern 13: State-URL Consistency Verification

**Use Case:** Ensuring state and URL stay synchronized

**Implementation:**

```typescript
describe('URL state consistency', () => {
  it('should maintain consistency throughout rapid operations', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

    // Helper to check consistency
    const checkConsistency = () => {
      const stateForms = getFormStack().map(f => f.id)
      const urlForms = result.current.getUrlState()

      expect(stateForms).toEqual(urlForms)
      expect(mockPushState.mock.calls.length).toBeGreaterThan(0)
    }

    // Perform operations and check consistency at each step
    await act(async () => {
      openForm('form-1')
    })
    checkConsistency()

    await act(async () => {
      openForm('form-2')
    })
    checkConsistency()

    await act(async () => {
      openForm('form-3')
    })
    checkConsistency()

    await act(async () => {
      popToIndex(1)
    })
    checkConsistency()

    // Final consistency check
    await waitFor(() => {
      expect(result.current.getUrlState()).toEqual(['form-1', 'form-2'])
      expect(getFormStack().map(f => f.id)).toEqual(['form-1', 'form-2'])
    })
  })
})
```

---

### Pattern 14: URL Parameter Validation

**Use Case:** Verifying URL parameters are correctly encoded

**Implementation:**

```typescript
it('should correctly encode URL parameters throughout operations', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

  // Use form IDs with special characters
  const specialIds = ['form with spaces', 'form&special', 'form=special']

  await act(async () => {
    specialIds.forEach(id => openForm(id))
  })

  // Verify URL encoding
  await waitFor(() => {
    expect(result.current.getUrlState()).toEqual(specialIds)
  })

  // Check pushState calls
  const lastCall = mockPushState.mock.calls[mockPushState.mock.calls.length - 1]
  const url = lastCall[2] as string

  // Verify encoding
  expect(url).toContain('form%20with%20spaces')
  expect(url).toContain('form%26special')
  expect(url).toContain('form%3Dspecial')

  // Verify decoding works
  expect(result.current.getUrlState()).toEqual(specialIds)
})
```

---

### Pattern 15: Cross-Tab/Window Consistency

**Use Case:** Testing storage event handling (if applicable)

**Implementation:**

```typescript
it('should handle storage events from other tabs', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

  // Simulate storage event from another tab
  await act(async () => {
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'forms',
      newValue: JSON.stringify(['form-1', 'form-2']),
      oldValue: JSON.stringify(['form-1']),
      url: window.location.href,
      storageArea: localStorage,
    }))
  })

  // Verify state updated
  await waitFor(() => {
    expect(result.current.getUrlState()).toEqual(['form-1', 'form-2'])
  })
})
```

---

## Detecting Duplicate History Entries

### Pattern 16: Counting History Operations

**Use Case:** Detecting duplicate pushState/replaceState calls

**Implementation:**

```typescript
describe('duplicate history entry detection', () => {
  it('should not create duplicate history entries during rapid operations', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

    // Track unique states
    const uniqueStates = new Set<string>()

    mockPushState.mockImplementation((state: any) => {
      const stateKey = JSON.stringify(state)
      uniqueStates.add(stateKey)
    })

    // Perform rapid operations
    await act(async () => {
      openForm('form-1')
      openForm('form-2')
      openForm('form-3')
    })

    await waitFor(() => {
      expect(result.current.getUrlState()).toEqual(['form-1', 'form-2', 'form-3'])
    })

    // Verify no duplicates
    expect(mockPushState.mock.calls.length).toBe(3)
    expect(uniqueStates.size).toBe(3)

    // Each call should be unique
    mockPushState.mock.calls.forEach((call, index) => {
      const stateKey = JSON.stringify(call[0])
      expect(uniqueStates.has(stateKey)).toBe(true)
    })
  })
})
```

---

### Pattern 17: Detecting Unnecessary ReplaceState Calls

**Use Case:** Finding redundant replaceState operations

**Implementation:**

```typescript
it('should not make unnecessary replaceState calls', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

  const replaceStateCalls: any[] = []

  mockReplaceState.mockImplementation((state: any) => {
    replaceStateCalls.push({ ...state, timestamp: Date.now() })
  })

  // Perform operations
  await act(async () => {
    openForm('form-1')
    openForm('form-2')
  })

  // Check for duplicates in replaceState calls
  const stateKeys = replaceStateCalls.map(call => JSON.stringify(call))
  const uniqueStateKeys = new Set(stateKeys)

  expect(replaceStateCalls.length).toBe(uniqueStateKeys.size)
})
```

---

### Pattern 18: History Entry Validation

**Use Case:** Ensuring history entries are sequential and correct

**Implementation:**

```typescript
it('should maintain correct history sequence', async () => {
  const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

  const historySequence: any[] = []

  mockPushState.mockImplementation((state: any, title: string, url: string) => {
    historySequence.push({
      state: { ...state },
      url,
      method: 'push',
    })
  })

  mockReplaceState.mockImplementation((state: any, title: string, url: string) => {
    historySequence.push({
      state: { ...state },
      url,
      method: 'replace',
    })
  })

  // Perform mixed operations
  await act(async () => {
    openForm('form-1')  // push
    openForm('form-2')  // push
    popToIndex(0)       // replace
    openForm('form-3')  // push
  })

  // Verify sequence
  expect(historySequence).toHaveLength(4)
  expect(historySequence[0].method).toBe('push')
  expect(historySequence[0].state.forms).toEqual(['form-1'])

  expect(historySequence[1].method).toBe('push')
  expect(historySequence[1].state.forms).toEqual(['form-1', 'form-2'])

  expect(historySequence[2].method).toBe('replace')
  expect(historySequence[2].state.forms).toEqual(['form-1'])

  expect(historySequence[3].method).toBe('push')
  expect(historySequence[3].state.forms).toEqual(['form-1', 'form-3'])
})
```

---

## Complete Test Examples

### Example 1: Comprehensive Race Condition Test Suite

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { FormStackProvider } from '../../components'
import { useFormStackURLSync } from '../useFormStackURLSync'

const wrapper = ({ children }: { children: ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
)

describe('useFormStackURLSync race conditions', () => {
  let mockPushState: ReturnType<typeof vi.fn>
  let mockReplaceState: ReturnType<typeof vi.fn>
  let mockAddEventListener: ReturnType<typeof vi.fn>
  let mockRemoveEventListener: ReturnType<typeof vi.fn>
  let popstateHandler: ((event: PopStateEvent) => void) | null = null

  beforeEach(() => {
    mockPushState = vi.fn()
    mockReplaceState = vi.fn()
    mockAddEventListener = vi.fn((event, handler) => {
      if (event === 'popstate') {
        popstateHandler = handler as (event: PopStateEvent) => void
      }
    })
    mockRemoveEventListener = vi.fn((event, handler) => {
      if (event === 'popstate' && popstateHandler === handler) {
        popstateHandler = null
      }
    })

    Object.defineProperty(window, 'history', {
      value: {
        pushState: mockPushState,
        replaceState: mockReplaceState,
        state: null,
      },
      writable: true,
      configurable: true,
    })

    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        pathname: '/',
        href: 'http://localhost/',
      },
      writable: true,
      configurable: true,
    })

    window.addEventListener = mockAddEventListener
    window.removeEventListener = mockRemoveEventListener
  })

  afterEach(() => {
    popstateHandler = null
    vi.clearAllMocks()
  })

  describe('rapid successive operations', () => {
    it('should handle 5 rapid form opens without state corruption', async () => {
      const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

      await act(async () => {
        openForm('form-1')
        openForm('form-2')
        openForm('form-3')
        openForm('form-4')
        openForm('form-5')
      })

      await waitFor(() => {
        expect(result.current.getUrlState()).toEqual([
          'form-1', 'form-2', 'form-3', 'form-4', 'form-5'
        ])
      })

      expect(mockPushState).toHaveBeenCalledTimes(5)
    })

    it('should handle rapid open/close cycles', async () => {
      const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

      await act(async () => {
        openForm('form-1')
        openForm('form-2')
        popToIndex(0)
        openForm('form-3')
        popToIndex(0)
        openForm('form-4')
      })

      await waitFor(() => {
        expect(result.current.getUrlState()).toEqual(['form-1', 'form-4'])
      })
    })
  })

  describe('browser navigation races', () => {
    it('should handle back button during pending update', async () => {
      const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

      await act(async () => {
        openForm('form-1')
        openForm('form-2')
      })

      mockPushState.mockClear()

      await act(async () => {
        openForm('form-3')

        // Simulate back button immediately
        window.dispatchEvent(new PopStateEvent('popstate', {
          state: { forms: ['form-1'] }
        }))
      })

      await waitFor(() => {
        const state = result.current.getUrlState()
        // Should be consistent (not corrupted)
        expect(
          state.equals(['form-1', 'form-3']) || state.equals(['form-1'])
        ).toBe(true)
      })
    })

    it('should handle rapid back/forward clicks', async () => {
      const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

      await act(async () => {
        openForm('form-1')
        openForm('form-2')
        openForm('form-3')
      })

      await act(async () => {
        window.dispatchEvent(new PopStateEvent('popstate', {
          state: { forms: ['form-1', 'form-2'] }
        }))
        window.dispatchEvent(new PopStateEvent('popstate', {
          state: { forms: ['form-1'] }
        }))
      })

      await waitFor(() => {
        expect(result.current.getUrlState()).toEqual(['form-1'])
      })
    })
  })

  describe('duplicate detection', () => {
    it('should not create duplicate history entries', async () => {
      const { result } = renderHook(() => useFormStackURLSync(), { wrapper })
      const uniqueStates = new Set<string>()

      mockPushState.mockImplementation((state: any) => {
        uniqueStates.add(JSON.stringify(state))
      })

      await act(async () => {
        openForm('form-1')
        openForm('form-2')
        openForm('form-3')
      })

      await waitFor(() => {
        expect(result.current.getUrlState()).toHaveLength(3)
      })

      expect(mockPushState.mock.calls.length).toBe(3)
      expect(uniqueStates.size).toBe(3)
    })
  })

  describe('unmount safety', () => {
    it('should not update URL after unmount', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { unmount } = renderHook(() => useFormStackURLSync(), { wrapper })

      await act(async () => {
        openForm('form-1')
        openForm('form-2')
      })

      unmount()

      await waitFor(() => {
        expect(consoleSpy).not.toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })
  })
})
```

---

### Example 2: Fake Timers Test Suite

```typescript
describe('useFormStackURLSync with fake timers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should handle debounced updates', async () => {
    const { result } = renderHook(
      () => useFormStackURLSync({ debounceMs: 100 }),
      { wrapper }
    )

    await act(async () => {
      openForm('form-1')
      openForm('form-2')
      openForm('form-3')
    })

    // Should not have triggered yet
    vi.advanceTimersByTime(50)
    expect(mockPushState).not.toHaveBeenCalled()

    // Should trigger after debounce
    vi.advanceTimersByTime(100)

    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle restoration flag timing', async () => {
    const { result } = renderHook(() => useFormStackURLSync(), { wrapper })

    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate', {
        state: { forms: ['form-1'] }
      }))
    })

    expect(result.current.isRestoring).toBe(true)

    vi.advanceTimersByTime(0)
    vi.runAllTimers()

    await waitFor(() => {
      expect(result.current.isRestoring).toBe(false)
    })
  })
})
```

---

## References & Sources

### Official Documentation

1. **React Testing Library**
   - Async Utilities: https://testing-library.com/docs/dom-testing-library/api-async
   - Using `waitFor`: https://testing-library.com/docs/dom-testing-library/api-async#waitfor
   - `act()` documentation: https://testing-library.com/docs/react-testing-library/api#act
   - Hook Testing: https://testing-library.com/docs/react-testing-library/intro#using-renderhook

2. **Vitest**
   - Fake Timers: https://vitest.dev/api/vi#vi-usefaketimers
   - Mocking: https://vitest.dev/api/vi
   - Async Testing: https://vitest.dev/guide/testing.html#testing-async-code
   - Timer Control: https://vitest.dev/api/vi#vi-advancetimersbytime

3. **React Documentation**
   - Testing Hooks: https://react.dev/learn/testing-overview
   - `act()` API: https://react.dev/reference/react/act

### Community Resources

4. **Kent C. Dodds - Testing Library**
   - Common Mistakes: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
   - How to Test Custom Hooks: https://kentcdodds.com/blog/how-to-test-custom-react-hooks

5. **Stack Overflow**
   - React URL state sync: Search for "React URL sync race condition testing"
   - History API mocking: Search for "mock window.history.pushState vitest"

### Codebase References

6. **Existing Test Patterns**
   - `/home/dustin/projects/geoform/src/hooks/__tests__/useFormStackURLSync.test.tsx`
   - `/home/dustin/projects/geoform/plan/docs/bugfix/P1M2T2S2/research/test_patterns_analysis.md`
   - `/home/dustin/projects/geoform/plan/P4M2/research/2-testing-async-operations.md`

7. **Race Condition Research**
   - `/home/dustin/projects/geoform/plan/docs/bugfix/P1M2T1S1/research/url_sync_race_conditions.md`

### Key Concepts

**waitFor vs findBy:**
- `waitFor`: For complex conditions, retries until assertion passes
- `findBy`: For finding elements that appear after async operations

**act() Usage:**
- Wrap all state updates in `act()`
- Required for React to batch updates properly
- Async operations should use `await act(async () => {...})`

**Fake Timers:**
- Use `vi.useFakeTimers()` for time-dependent tests
- Always restore with `vi.restoreAllMocks()`
- Use `vi.advanceTimersByTime()` for precision

**History API Mocking:**
- Use `vi.spyOn()` for partial mocking
- Use `vi.fn()` for complete replacement
- Track calls to detect duplicates

---

## Actionable Summary

**For useFormStackURLSync Testing:**

1. **Use `act()` for all state updates**
2. **Use `waitFor()` to verify final state**
3. **Track history API calls to detect duplicates**
4. **Test rapid operations in sequences**
5. **Simulate popstate during pending updates**
6. **Use fake timers for debounced operations**
7. **Verify state-URL consistency throughout**
8. **Test unmount safety**
9. **Check for memory leaks**
10. **Validate URL encoding/decoding**

**Priority Test Cases:**
1. Rapid form opens (5+ operations)
2. Back button during URL update
3. Multiple rapid back/forward clicks
4. Duplicate history entry detection
5. Unmount during pending update
6. State-URL consistency verification
7. Debounced URL updates
8. Special character encoding

---

**Document Version:** 1.0
**Last Updated:** 2025-01-11
**Status:** Complete - Ready for implementation
**Next Steps:** Apply these patterns to useFormStackURLSync.test.tsx
