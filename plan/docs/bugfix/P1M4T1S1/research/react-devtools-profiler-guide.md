# React DevTools Profiler: Measuring Re-renders

## Overview
React DevTools Profiler is a powerful tool for measuring component render performance and identifying optimization opportunities.

## Installation and Setup

### Chrome/Edge/Firefox
```bash
# Install React Developer Tools extension
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
# Firefox: https://addons.mozilla.org/firefox/addon/react-devtools/
```

### Accessing the Profiler
1. Open browser DevTools (F12)
2. Navigate to "Profiler" tab
3. Click "Record" (circle button)
4. Interact with your application
5. Click "Stop" to analyze

## Key Profiler Features

### 1. Flame Graph
Shows hierarchical view of component renders:
- **Width**: Component's render duration
- **Height**: Call stack depth
- **Colors**: Render reasons (why did it render?)

**Reading the Flame Graph:**
```
┌─────────────────────────────────────┐
│          App (50ms)                 │
│  ┌──────────┐  ┌─────────────────┐ │
│  │Header(5ms)│  │MainContent(45ms) │ │
│  │          │  │ ┌─────┐ ┌────┐  │ │
│  │          │  │ │List(30ms)│ │Btn(2ms)│ │ │
│  └──────────┘  │ └─────┘ └────┘  │ │
│                └─────────────────┘ │
└─────────────────────────────────────┘
```

### 2. Ranked Chart
Shows components sorted by render time:
- **Worst offenders first**
- **Easy to identify optimization targets**
- **Group by component name**

### 3. Why Did You Render?
Shows render reasons:
- **Props changed**: Which props?
- **State changed**: Which state?
- **Parent rendered**: Cascading re-renders
- **Hooks changed**: Which hook dependencies?

## Measuring Re-render Impact

### Step-by-Step Profiling

#### 1. Baseline Measurement
```javascript
// Record typical user interaction
// Example: Click a button, type in input, navigate
```

**In Profiler:**
1. Click "Record"
2. Perform action (e.g., click button)
3. Click "Stop"
4. Select the commit in timeline
5. Note render times

#### 2. Identify Problematic Renders
Look for:
- **Repeated renders** of same component
- **Long render durations** (>16ms for 60fps)
- **Cascading re-renders** (parent causing children to re-render)
- **Unnecessary renders** (no actual changes)

#### 3. Compare Before/After Optimization
```javascript
// BEFORE: No memoization
function TodoList({ todos, onToggle }) {
  return todos.map(todo => (
    <TodoItem
      key={todo.id}
      todo={todo}
      onToggle={() => onToggle(todo.id)}  // New function
    />
  ));
}

// AFTER: With memoization
function TodoList({ todos, onToggle }) {
  const handleToggle = useCallback((id) => onToggle(id), [onToggle]);
  return todos.map(todo => (
    <TodoItem
      key={todo.id}
      todo={todo}
      onToggle={handleToggle}  // Stable reference
    />
  ));
}
```

**Measure difference:**
1. Profile BEFORE version
2. Note: TodoItem renders = todos.length (e.g., 100 items)
3. Apply optimization
4. Profile AFTER version
5. Note: TodoItem renders = 1 (only clicked item)
6. **Performance gain: 99% reduction in renders**

## Advanced Profiling Techniques

### 1. Programmatic Profiling
```javascript
import { Profiler } from 'react';

function onRenderCallback(
  id,              // Component name
  phase,           // 'mount' or 'update'
  actualDuration,  // Actual render time (ms)
  baseDuration,    // Estimated render time without memoization
  startTime,       // When render started
  commitTime,      // When render committed
  interactions     // Interaction IDs
) {
  console.log({
    component: id,
    phase,
    actualTime: actualDuration.toFixed(2),
    baseTime: baseDuration.toFixed(2),
    wastedTime: (actualDuration - baseDuration).toFixed(2),
  });
}

// Wrap components
<Profiler id="ExpensiveComponent" onRender={onRenderCallback}>
  <ExpensiveComponent {...props} />
</Profiler>
```

### 2. Measuring Specific Interactions
```javascript
// Profile specific user actions
function trackInteraction(name, fn) {
  return async (...args) => {
    performance.mark(`${name}-start`);
    const result = await fn(...args);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const measure = performance.getEntriesByName(name)[0];
    console.log(`${name} interaction: ${measure.duration.toFixed(2)}ms`);

    return result;
  };
}

// Usage
const handleClick = trackInteraction('buttonClick', async () => {
  await fetchData();
  updateUI();
});
```

### 3. Highlight Updates (Chrome DevTools)
```
1. Open DevTools
2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
3. Type "Rendering"
4. Enable "Paint flashing"
5. Interact with app
6. Flashing areas indicate re-renders
```

## Interpreting Profiler Data

### Good Performance
- **Render time < 16ms** (60fps target)
- **Single render per interaction**
- **Minimal cascading**
- **Consistent timing**

### Needs Optimization
- **Render time > 16ms** (janky animations)
- **Multiple renders per interaction**
- **Deep cascading re-renders**
- **Inconsistent timing (spikes)**

### Common Issues Found

#### 1. Unnecessary Child Re-renders
```
Problem: Child renders when parent's unrelated state changes
Solution: React.memo on child, stable callbacks from parent
```

#### 2. Expensive Calculations on Every Render
```
Problem: Long baseDuration (unmemoized computation)
Solution: useMemo for expensive calculations
```

#### 3. Large Lists Without Virtualization
```
Problem: 100+ items all rendering
Solution: react-window or react-virtualized
```

#### 4. Inline Object/Array Props
```
Problem: Child re-renders due to new references
Solution: useMemo for props, or React Compiler
```

## Real-World Example: Optimizing a Form

### Before Optimization
```javascript
function Form({ onSubmit }) {
  const [values, setValues] = useState({});

  // Profiler shows: 5ms render, all fields re-render
  return (
    <form onSubmit={onSubmit}>
      {fields.map(field => (
        <Field
          key={field.name}
          field={field}
          value={values[field.name]}
          onChange={(v) => setValues({...values, [field.name]: v})}
        />
      ))}
    </form>
  );
}
```

**Profiler Results:**
- Initial render: 5ms (OK)
- Each keystroke: 4-5ms (all fields re-render)
- 100 fields × 5ms = 500ms total for typing one character

### After Optimization
```javascript
function Form({ onSubmit }) {
  const [values, setValues] = useState({});

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  // Profiler shows: 5ms render, only changed field re-renders
  return (
    <form onSubmit={onSubmit}>
      {fields.map(field => (
        <MemoizedField
          key={field.name}
          field={field}
          value={values[field.name]}
          onChange={handleChange}
        />
      ))}
    </form>
  );
}

const MemoizedField = React.memo(Field);
```

**Profiler Results:**
- Initial render: 5ms (same)
- Each keystroke: 0.5ms (only one field)
- **90% performance improvement**

## Profiler Best Practices

### DO:
1. **Profile realistic scenarios** - actual user workflows
2. **Measure consistently** - same device, same state
3. **Record multiple runs** - account for variance
4. **Focus on worst cases** - optimize slowest paths
5. **Test before/after** - verify improvements

### DON'T:
1. **Optimize micro-optimizations** - focus on user-facing impact
2. **Profile in development mode** - use production builds
3. **Ignore interaction delays** - 100ms feels sluggish
4. **Forget mobile performance** - test on slower devices
5. **Over-optimize** - complexity cost vs performance gain

## Keyboard Shortcuts
- **Ctrl/Cmd + Shift + P**: Command menu
- **Ctrl/Cmd + Shift + D**: Toggle DevTools
- **Ctrl/Cmd + [** / **]**: Switch DevTools panels

## Official Documentation
- **React DevTools Profiler Guide**: https://react.dev/learn/react-developer-tools
- **Profiler API Reference**: https://react.dev/reference/react/Profiler
- **Performance Overview**: https://react.dev/learn/render-and-commit

## Video Tutorials
- React team official Profiler walkthroughs
- "React Performance" conference talks
- DevTools updates in React blog posts

## Community Resources
- Reactiflux Discord #performance channel
- Stack Overflow [react-performance] tag
- GitHub discussions on Profiler features

## Sources to Verify
1. Official React DevTools Profiler documentation
2. React blog posts on performance profiling
3. Conference talks on React performance
4. Community guides on Profiler usage
5. Chrome DevTools Performance docs

## Key Takeaways
1. **Always profile before optimizing** - measure don't guess
2. **Focus on user-perceivable delays** - >100ms feels slow
3. **Target worst offenders first** - biggest impact
4. **Re-profile after changes** - verify improvements
5. **Consider React Compiler** - automatic optimization
