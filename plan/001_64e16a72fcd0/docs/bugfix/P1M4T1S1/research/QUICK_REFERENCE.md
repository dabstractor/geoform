# React Performance Optimization - Quick Reference

## TL;DR - Key Numbers to Remember

| Metric | Value | Context |
|--------|-------|---------|
| useCallback overhead | ~0.01ms | Per render |
| Memoization worth it | >1ms calc OR >10 renders/sec | Break-even point |
| Target frame time | <16ms | 60fps |
| Perceivable delay | >100ms | Feels sluggish |
| Skip rate needed | >50% | Deps unchanged |

## Decision Tree (One Minute Guide)

```
Should I memoize this?

1. Is it a measured performance problem?
   NO → Skip memoization
   YES → Continue

2. Does calculation take >1ms OR prevent >2 child renders?
   NO → Skip memoization
   YES → Continue

3. Do dependencies stay same >50% of renders?
   NO → Skip memoization
   YES → Add memoization
```

## Code Patterns

### Good Memoization (High ROI)
```javascript
// Expensive calculation
const processed = useMemo(() =>
  expensiveTransform(data), // Takes >1ms
  [data]
);

// Callback for memoized child
const handleClick = useCallback((id) =>
  onSelect(id),
  [onSelect]
);

// Stable reference for useEffect
const fetchData = useCallback(async () => {
  const result = await api.get(userId);
  setData(result);
}, [userId]);
```

### Bad Memoization (Premature Optimization)
```javascript
// Simple math - DON'T
const sum = useMemo(() => a + b, [a, b]);

// Non-memoized child - DON'T
const handleClick = useCallback(() =>
  console.log('click'),
  []
);

// Always-changing deps - DON'T
const value = useMemo(() =>
  calc(timestamp),
  [timestamp] // Changes every render
);
```

## Profiling Checklist

### Before Optimizing
- [ ] Build in production mode
- [ ] Open React DevTools Profiler
- [ ] Click "Record"
- [ ] Perform user interaction
- [ ] Click "Stop"
- [ ] Note render times and counts

### After Optimizing
- [ ] Repeat profiling
- [ ] Compare before/after metrics
- [ ] Verify improvement >0.01ms
- [ ] Check for regressions
- [ ] Test on mobile/slow devices

## Measurement Commands

```javascript
// Quick performance check
console.time('operation');
// ... code ...
console.timeEnd('operation');

// React Profiler wrapper
<Profiler id="Component" onRender={onRenderCallback}>
  <Component {...props} />
</Profiler>;

// Custom measurement
const start = performance.now();
operation();
const duration = performance.now() - start;
console.log(`Operation took ${duration.toFixed(3)}ms`);
```

## Common Pitfalls (Don't Do This)

| Pitfall | Why It's Bad | Fix |
|---------|--------------|-----|
| useCallback for non-memoized child | 0.01ms cost, 0 benefit | Remove useCallback |
| useMemo for simple math | Cost > benefit | Use inline calculation |
| Missing dependencies | Stale closures bugs | Include all deps |
| Empty deps for changing value | Stale data | Add value to deps |
| Measuring in dev mode | Results 2-10x slower | Use production build |

## React Compiler Impact

### Before React Compiler
```javascript
// Manual memoization everywhere
const value = useMemo(() => expensive(data), [data]);
const callback = useCallback((id) => act(id), [act]);
const Memoized = React.memo(Component);
```

### After React Compiler
```javascript
// Compiler handles it automatically
const value = expensive(data);
const callback = (id) => act(id);
const Component = ({ data }) => {/* ... */};
```

**Note**: React Compiler is available in React 19+ and can be adopted incrementally.

## Performance Budgets

### Time Budgets (Per Interaction)
- **Instant**: < 100ms (imperceptible)
- **Acceptable**: 100-300ms (slight delay)
- **Problematic**: 300-1000ms (noticeable lag)
- **Broken**: > 1000ms (frustrating)

### Component Render Budgets
- **Leaf components**: < 1ms
- **Small components**: < 5ms
- **Medium components**: < 10ms
- **Large components**: < 16ms (60fps target)

## When to Use What

| Scenario | Solution |
|----------|----------|
| Expensive calculation | useMemo |
| Callback passed to React.memo child | useCallback |
| Callback in useEffect deps | useCallback |
| Simple inline callback | Nothing (inline is fine) |
| Non-memoized child | Nothing (won't help) |
| Frequently changing deps | Nothing (won't help) |

## File Locations (geoform project)

All research documents:
```
/home/dustin/projects/geoform/plan/bugfix/P1M4T1S1/research/
├── RESEARCH_SUMMARY.md           # Complete research overview
├── QUICK_REFERENCE.md            # This file
├── react-19-compiler-auto-memoization.md
├── useCallback-overhead-analysis.md
├── react-devtools-profiler-guide.md
├── measuring-callback-performance.md
├── memoization-worth-it-analysis.md
└── references-and-sources.md     # All documentation links
```

## URLs to Verify (When Search Available)

### Official React Docs
- https://react.dev/learn/react-compiler
- https://react.dev/reference/react/useCallback
- https://react.dev/reference/react/useMemo
- https://react.dev/reference/react/memo
- https://react.dev/reference/react/Profiler
- https://react.dev/learn/render-and-commit

### Tools & Resources
- React DevTools: Browser extension stores
- Web Vitals: https://web.dev/vitals/
- Performance API: https://developer.mozilla.org/en-US/docs/Web/API/Performance

## Key Takeaways

1. **Measure first** - Always profile before optimizing
2. **0.01ms overhead** - Confirmed useCallback cost
3. **ROI matters** - Benefit must exceed cost
4. **React Compiler** - Automatic memoization in React 19
5. **User focus** - Optimize what users feel, not what looks good in profiles
6. **Production builds** - Always measure in production mode
7. **Keep it simple** - Premature optimization is the root of all evil

## Action Items for Geoform

### Immediate (Today)
1. Profile current callback performance
2. Identify performance bottlenecks
3. Document findings

### Short-term (This Week)
1. Verify URLs in references document
2. Test React Compiler in dev environment
3. Create performance regression tests

### Long-term (Ongoing)
1. Monitor React 19 updates
2. Update team on best practices
3. Continuously profile and optimize

---

**For detailed research, see RESEARCH_SUMMARY.md**
**For documentation links, see references-and-sources.md**
**Last Updated**: 2025-01-11
