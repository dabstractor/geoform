# Best Practices for Measuring Callback Performance Impact

## Overview
This guide covers techniques and best practices for accurately measuring the performance impact of callback functions in React applications.

## Measurement Strategies

### 1. React DevTools Profiler (Recommended)

**Setup:**
```javascript
import { Profiler } from 'react';

function measureRenderPerformance(
  id, phase, actualDuration, baseDuration,
  startTime, commitTime
) {
  const metrics = {
    component: id,
    phase, // 'mount' or 'update'
    actualTime: actualDuration.toFixed(3), // milliseconds
    baseTime: baseDuration.toFixed(3),
    overhead: (actualDuration - baseDuration).toFixed(3),
  };

  console.table(metrics);

  // Track in analytics
  if (window.performanceMetrics) {
    window.performanceMetrics.push(metrics);
  }
}

// Wrap component under test
<Profiler id="ComponentUnderTest" onRender={measureRenderPerformance}>
  <MyComponent callbacks={callbacks} />
</Profiler>
```

**Process:**
1. Start Profiler recording
2. Trigger callback interaction
3. Stop recording
4. Compare actualDuration vs baseDuration
5. Check for unnecessary re-renders

### 2. Custom Performance Hooks

**useCallbackPerformance Hook:**
```javascript
import { useCallback, useRef, useEffect } from 'react';

function useCallbackPerformance(callbackName, fn, deps) {
  const callCount = useRef(0);
  const totalTime = useRef(0);

  const measuredCallback = useCallback((...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();

    callCount.current += 1;
    totalTime.current += (end - start);

    console.log(`${callbackName}:
      - Call: ${callCount.current}
      - Duration: ${(end - start).toFixed(3)}ms
      - Avg: ${(totalTime.current / callCount.current).toFixed(3)}ms
    `);

    return result;
  }, [fn, ...deps]);

  // Log summary on unmount
  useEffect(() => {
    return () => {
      console.log(`${callbackName} Summary:
        - Total calls: ${callCount.current}
        - Total time: ${totalTime.current.toFixed(3)}ms
        - Average: ${(totalTime.current / callCount.current || 0).toFixed(3)}ms
      `);
    };
  }, [callbackName]);

  return measuredCallback;
}

// Usage
const handleClick = useCallbackPerformance('handleClick', () => {
  // callback logic
}, [deps]);
```

### 3. Benchmarking Suite

**Automated Performance Tests:**
```javascript
// performance.test.js
describe('Callback Performance', () => {
  const ITERATIONS = 1000;

  async function measureCallback(callback, setup) {
    const measurements = [];

    for (let i = 0; i < ITERATIONS; i++) {
      setup?.(); // Reset state if needed

      const start = performance.now();
      await callback();
      const end = performance.now();

      measurements.push(end - start);
    }

    return {
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      avg: measurements.reduce((a, b) => a + b) / measurements.length,
      median: measurements.sort()[Math.floor(measurements.length / 2)],
    };
  }

  test('useCallback vs inline function', async () => {
    // Test inline function
    const inlineMetrics = await measureCallback(() => {
      const callback = () => {};
      callback();
    });

    // Test useCallback
    const useCallbackMetrics = await measureCallback(() => {
      const [callback] = React.useState(() => () => {});
      callback();
    });

    console.log('Inline:', inlineMetrics);
    console.log('useCallback:', useCallbackMetrics);

    // Assert performance characteristics
    expect(useCallbackMetrics.avg).toBeLessThan(0.1); // < 0.1ms
  });
});
```

### 4. Render Count Tracking

**Track Component Renders:**
```javascript
function useRenderCount(componentName) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} render #${renderCount.current}`);
  });

  return renderCount.current;
}

// Usage in component
function MyComponent({ onClick }) {
  useRenderCount('MyComponent');

  return <button onClick={onClick}>Click me</button>;
}
```

## Measuring Specific Scenarios

### Scenario 1: Callback in Memoized Child

**Test Setup:**
```javascript
// Parent component
function Parent({ items }) {
  const [selectedId, setSelectedId] = useState(null);

  // Version A: Without useCallback
  const handleSelectA = (id) => setSelectedId(id);

  // Version B: With useCallback
  const handleSelectB = useCallback((id) => setSelectedId(id), []);

  return (
    <>
      {items.map(item => (
        <MemoizedChild
          key={item.id}
          item={item}
          onSelect={handleSelectB} // or handleSelectA
        />
      ))}
    </>
  );
}

// Memoized child
const MemoizedChild = React.memo(function Child({ item, onSelect }) {
  const renderCount = useRenderCount(`Child-${item.id}`);

  return (
    <div onClick={() => onSelect(item.id)}>
      {item.name} (renders: {renderCount})
    </div>
  );
});
```

**Measurement:**
1. Record baseline renders with inline callback
2. Record with useCallback
3. Compare render counts per child
4. Calculate total render time difference

**Expected Results:**
- Without useCallback: N children render on each parent update
- With useCallback: Only affected children render
- Improvement: ~80-95% reduction in renders

### Scenario 2: Callback in useEffect Dependencies

**Test Setup:**
```javascript
function Component({ userId }) {
  const [data, setData] = useState(null);

  // Version A: Inline function (causes effect re-run)
  useEffect(() => {
    const fetchData = async () => {
      const result = await api.getUser(userId);
      setData(result);
    };
    fetchData();
  }, [fetchData, userId]); // fetchData changes every render

  // Version B: useCallback (stable reference)
  const fetchData = useCallback(async () => {
    const result = await api.getUser(userId);
    setData(result);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, userId]); // fetchData only changes when userId changes
}
```

**Measurement:**
1. Count API calls per component render
2. Measure network request overhead
3. Calculate unnecessary request cost

**Expected Results:**
- Without useCallback: 1 API call per render (wasteful)
- With useCallback: 1 API call per userId change (optimal)
- Improvement: Eliminates duplicate requests

### Scenario 3: Event Handler Performance

**Test Setup:**
```javascript
function Button({ onClick, label }) {
  const handleClick = useCallback((event) => {
    performance.mark(`${label}-click-start`);
    onClick(event);
    performance.mark(`${label}-click-end`);
    performance.measure(label, `${label}-click-start`, `${label}-click-end`);

    const measure = performance.getEntriesByName(label)[0];
    console.log(`${label} click handler: ${measure.duration.toFixed(3)}ms`);
  }, [onClick, label]);

  return <button onClick={handleClick}>{label}</button>;
}
```

**Measurement:**
1. Measure click handler execution time
2. Track re-render propagation
3. Measure perceived latency (click → UI update)

## Statistical Analysis

**Multiple Runs for Reliability:**
```javascript
async function runPerformanceTest(testFn, runs = 100) {
  const results = [];

  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await testFn();
    const end = performance.now();
    results.push(end - start);
  }

  const stats = {
    mean: results.reduce((a, b) => a + b) / results.length,
    median: results.sort()[Math.floor(results.length / 2)],
    stdDev: Math.sqrt(
      results.map(x => Math.pow(x - stats.mean, 2))
        .reduce((a, b) => a + b) / results.length
    ),
    min: Math.min(...results),
    max: Math.max(...results),
    p95: results.sort()[Math.floor(results.length * 0.95)],
    p99: results.sort()[Math.floor(results.length * 0.99)],
  };

  return stats;
}

// Usage
const stats = await runPerformanceTest(() => {
  // trigger callback
});

console.table(stats);
```

## Common Pitfalls in Measurement

### 1. Measuring in Development Mode
```javascript
// BAD: Development builds are 2-10x slower
npm start

// GOOD: Measure production builds
npm run build
npm run serve
```

### 2. Ignoring Browser Variance
```javascript
// Test across multiple browsers
const browsers = ['chrome', 'firefox', 'safari', 'edge'];

browsers.forEach(browser => {
  console.log(`Testing in ${browser}`);
  // Run tests...
});
```

### 3. Small Sample Sizes
```javascript
// BAD: Single measurement
const time = measureOnce();

// GOOD: Statistical significance
const times = measureMany(100);
const avg = average(times);
```

### 4. Not Controlling Variables
```javascript
// Control for:
- CPU throttling (DevTools > Performance > Throttling)
- Network conditions
- Initial cache state
- Background processes
```

### 5. Measuring Wrong Things
```javascript
// BAD: Measuring micro-optimizations
const overhead = useCallback ? 0.01ms : 0ms;

// GOOD: Measuring user impact
const timeToInteractive = measureFromClickToUIUpdate();
```

## Measurement Checklist

### Before Measuring
- [ ] Use production build
- [ ] Clear browser cache
- [ ] Close unnecessary tabs
- [ ] Disable browser extensions
- [ ] Set consistent CPU throttling
- [ ] Warm up the application

### During Measuring
- [ ] Run multiple iterations (≥100)
- [ ] Record all relevant metrics
- [ ] Test realistic scenarios
- [ ] Include edge cases
- [ ] Document test environment

### After Measuring
- [ ] Calculate statistics (mean, median, p95)
- [ ] Compare before/after optimization
- [ ] Verify statistical significance
- [ ] Document findings
- [ ] Make data-driven decisions

## Tools and Libraries

### Built-in Browser APIs
```javascript
// Performance API
performance.now()
performance.mark()
performance.measure()
performance.getEntries()

// User Timing API
performance.mark('start');
// ... code ...
performance.mark('end');
performance.measure('duration', 'start', 'end');
```

### React-Specific Tools
```javascript
// React DevTools Profiler
import { Profiler } from 'react';

// Why Did You Render
import whyDidYouRender from '@welldone-software/why-did-you-render';
whyDidYouRender(React, { trackAllPureComponents: true });
```

### Third-Party Libraries
```javascript
// Web Vitals (Core Web Vitals)
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Benchmark.js
import Benchmark from 'benchmark';
const suite = new Benchmark.Suite;

suite.add('useCallback', () => {
  // test code
})
.add('inline', () => {
  // test code
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': true });
```

## Real-World Example: Optimizing a Search Input

### Before Optimization
```javascript
function SearchInput({ onSearch }) {
  const [query, setQuery] = useState('');

  return (
    <input
      value={query}
      onChange={(e) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value); // Triggers re-renders
      }}
    />
  );
}

// Profiler shows: 15ms render on every keystroke
```

### After Optimization
```javascript
function SearchInput({ onSearch }) {
  const [query, setQuery] = useState('');

  // Debounce + memoization
  const debouncedSearch = useMemo(
    () => debounce(onSearch, 300),
    [onSearch]
  );

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  return (
    <input value={query} onChange={handleChange} />
  );
}

// Profiler shows: 2ms render, search runs once after 300ms
```

**Results:**
- Render time: 15ms → 2ms (87% improvement)
- Search calls: 10 keystrokes = 10 calls → 1 call (90% reduction)
- Perceived performance: Much snappier

## Decision Framework

**When to Measure Callback Performance:**
1. Component renders >60 times/second
2. User reports sluggish interactions
3. Lists with 50+ items using callbacks
4. Animations or real-time updates
5. Mobile/low-end device targeting

**When to Skip Measurement:**
1. Simple components with infrequent updates
2. Callbacks not passed to memoized children
3. Prototype/MVP development
4. Performance is not a constraint

## Official Documentation
- **React Profiler**: https://react.dev/reference/react/Profiler
- **Performance API**: https://developer.mozilla.org/en-US/docs/Web/API/Performance
- **Web Vitals**: https://web.dev/vitals/

## Sources to Verify
1. React performance measurement guides
2. Browser Performance API documentation
3. Web Vitals official documentation
4. React DevTools Profiler guides
5. Performance benchmarking best practices

## Key Takeaways
1. **Profile first, optimize second** - Always measure
2. **Use production builds** - Dev mode is misleading
3. **Run multiple iterations** - Account for variance
4. **Focus on user impact** - Perceived performance
5. **Document your findings** - Make data-driven decisions
