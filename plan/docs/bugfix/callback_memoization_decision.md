# FormStackRenderer Callback Memoization Decision

**Date**: 2025-01-11
**Task**: P1.M4.T1.S2
**Decision**: NO CODE CHANGE - Current implementation is optimal

---

## Executive Summary

Based on P1.M4.T1.S1 performance analysis, callback memoization in FormStackRenderer is **NOT warranted**. The current inline callback pattern is architecturally sound and performance-optimal for this use case.

**Decision**: Document current implementation as correct - no useCallback implementation needed.

---

## Decision

**Status**: No implementation needed - current implementation with inline callbacks is optimal

---

## Rationale

### 1. CSS Visibility Isolation

Hidden forms use `display: none` which prevents visual re-renders. When the active form's state changes, hidden forms have no reason to re-render because:

1. Their props haven't changed (callbacks are unique per entry)
2. They're hidden with `display: none` (visual isolation)
3. User forms aren't memoized by default

```typescript
// FormStackRenderer.tsx:73
style={{ display: isActive ? 'block' : 'none' }}
```

**Key insight**: CSS `display: none` does NOT trigger re-renders. Elements only re-render if their props, state, or context change.

### 2. Per-Entry Callback Architecture

Each form receives unique callback instances that close over its own `entry.deferred`:

| Property | Description |
|----------|-------------|
| Callback creation | Per-entry in `map()` loop |
| Closure | Each callback closes over `entry.deferred` |
| Uniqueness | Different entries have different callback instances |
| Stability | `entry.deferred` is stable (doesn't change after creation) |

**Implication**: When the active form (e.g., form-9) re-renders due to state change, forms 0-8 have no reason to re-render because their callbacks and props are unchanged.

```typescript
// Each form gets unique callbacks closing over its own entry.deferred
stack.map((entry, index) => {
  const handleSubmit = (value: unknown) => {
    entry.deferred.resolve(value);  // Unique closure per form
    onClose();
  };
  // ...
})
```

### 3. Decision Framework Application

Per `testing_best_practices.md` Section 3.6 decision tree:

```
Should FormStackRenderer callbacks be memoized with useCallback?
│
├─ Is the function passed to a memoized child?
│  ├─ No → User form components are NOT memoized by default
│  └─ Continue
│
├─ Is the function used in another hook's dependency array?
│  ├─ No → Callbacks are passed directly to createElement, not used in hooks
│  └─ Continue
│
├─ Is the function exported from context?
│  ├─ No → These are per-entry callbacks, not shared actions
│  └─ Continue
│
└─ DECISION: Don't memoize (current implementation is correct)
```

**Result**: useCallback is NOT warranted for FormStackRenderer callbacks.

### 4. Cost-Benefit Analysis

| Metric | Value |
|--------|-------|
| useCallback overhead | 0.01ms per callback |
| Total overhead (10 forms × 3 callbacks) | 0.3ms per FormStackRenderer render |
| Benefit | 0ms (hidden forms don't re-render due to CSS isolation) |
| ROI | **Negative** (premature optimization) |

**Break-even threshold**: useCallback is only worthwhile when it prevents 100+ re-renders. Current behavior: Hidden forms DON'T re-render (CSS isolation), so break-even is never met.

### 5. React 19 Compiler Consideration

React 19 Compiler auto-memoizes by default:

> "React Compiler ensures that all code is memoized by default, not just the 8% where developers explicitly apply memoization."

**Implication**: When React Compiler is enabled, it will automatically optimize callback references. Manual useCallback becomes unnecessary in most cases.

**Recommendation**: Consider enabling React Compiler for automatic optimization instead of manual memoization.

---

## Comparison with FormStackProvider

FormStackProvider uses useCallback for its action handlers, which is correct because:

| Aspect | FormStackProvider | FormStackRenderer |
|--------|-------------------|-------------------|
| **Callback type** | Shared actions for ALL forms | Per-entry callbacks for EACH form |
| **Export** | Exported via context | Passed directly to user components |
| **Stability need** | Multiple consumers depend on references | Each form gets unique callbacks |
| **useCallback?** | **Yes** - needed for stable refs | **No** - not needed |

```typescript
// FormStackProvider: useCallback IS appropriate
const openForm = useCallback(<T,>(options: OpenFormOptions<T>): Promise<T | undefined> => {
  // Shared action for all forms
  // Exported via context - needs stable reference
  // Multiple components depend on this reference
}, []);

// FormStackRenderer: useCallback NOT appropriate
stack.map((entry, index) => {
  // Inline callback per form entry
  // Closes over entry.deferred (stable reference)
  // Not exported, not used as dependency
  const handleSubmit = (value: unknown) => {
    entry.deferred.resolve(value);
    onClose();
  };
  // ...
});
```

---

## Expected Behavior

### Initial Mount (10 forms)
| Form Index | Render Count | Notes |
|------------|--------------|-------|
| 0 (oldest) | 1 | Hidden, mounted once |
| 1-8 | 1 each | Hidden, mounted once |
| 9 (active) | 1 | Visible, mounted once |
| **Total** | **10** | All forms mount on initial render |

### Active Form State Change
When user types in form-9's input field:

| Form Index | Render Count | Notes |
|------------|--------------|-------|
| 0-8 | 1 (unchanged) | Hidden, should NOT re-render |
| 9 (active) | 2 | Visible, re-renders due to state change |
| **Total** | **11** | Only active form re-renders |

### Total Render Time Estimate
- Initial mount (10 forms): ~5-10ms
- Active form state change: ~0.5-1ms (only form-9)
- **Total**: ~11ms for full scenario
- **User-perceivable**: NO (well below 100ms threshold)

---

## References

### Internal Documentation
- **P1.M4.T1.S1 Analysis**: `plan/docs/architecture/callback_performance_analysis.md`
  - Executive Summary: CSS display: none isolation prevents hidden form re-renders
  - Recommendation: SKIP OPTIMIZATION
  - Break-even threshold: 100+ prevented re-renders needed
  - Per-entry callbacks: Each form has unique callbacks with stable closures

- **Decision Framework**: `plan/docs/architecture/testing_best_practices.md` (Section 3.6)
  - Lines 609-626: Decision tree for when to use useCallback
  - Use useCallback when: passed to memoized child, used in dependency array, exported from context
  - Don't use when: only used locally, child not memoized, function inexpensive to recreate

- **Research Documents**: `plan/docs/bugfix/P1M4T1S1/research/`
  - `memoization-worth-it-analysis.md`: Cost-benefit analysis framework
  - `useCallback-overhead-analysis.md`: Performance benchmarks (0.01ms per callback)
  - `react-19-compiler-auto-memoization.md`: React Compiler impact

### External Documentation
- [React useCallback Reference](https://react.dev/reference/react/useCallback)
- [React Compiler Documentation](https://react.dev/learn/react-compiler)
- [React Profiler Guide](https://react.dev/learn/react-developer-tools)

---

## Variations That Would Change This Decision

| Factor | Current | If Changed | Impact |
|--------|---------|------------|--------|
| User forms are memoized | No | Yes (React.memo) | useCallback becomes beneficial |
| React Compiler enabled | No | Yes | Manual useCallback unnecessary |
| Frequent stack changes | ~1/sec | > 10/sec | Consider optimization |
| Complex form rendering | < 1ms | > 10ms per form | Memoization may help |

---

## Conclusion

The current implementation with inline callbacks is **architecturally sound and performance-optimal**. No code changes are needed.

**Key Reasons**:
1. CSS visibility isolation prevents hidden form re-renders
2. Per-entry callback architecture means callbacks are unique per form
3. Decision framework confirms useCallback is not warranted
4. Cost-benefit analysis shows negative ROI (0.3ms overhead for 0ms benefit)
5. React 19 Compiler provides auto-memoization if needed

**Action**: Document this decision for future maintainers and proceed with P1.M4.T1.S2 complete.
