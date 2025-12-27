# React Conditional Rendering & Component Visibility Patterns Research

**Date:** 2025-12-27
**Focus:** Best practices for conditional rendering, state preservation, and performance optimization in React form stacks

---

## 1. Conditional Rendering Approaches

### 1.1 Ternary Operator (`? :`)

**Pattern:**
```javascript
{isVisible ? <Component /> : null}
{isVisible ? <ComponentA /> : <ComponentB />}
```

**When to Use:**
- Simple binary conditions with different JSX outputs
- Clear, readable when nesting is minimal
- Best balance of conciseness and clarity

**Pros:**
- Avoids component duplication
- Works well for nested conditional rendering
- Inline conditions for simple decisions

**Cons:**
- Can become hard to read with multiple nesting levels
- Complex logic becomes less maintainable

**Key Insight:** This is the **unmounting approach** - the component is completely removed from the DOM when the condition is false, and recreated when true.

---

### 1.2 Logical AND Operator (`&&`)

**Pattern:**
```javascript
{name} {isPacked && '✅'}
{shouldRender && <Component />}
```

**When to Use:**
- Rendering something OR nothing
- Simple inclusion/exclusion without else branch
- Very concise for single conditions

**Pros:**
- Most concise syntax for simple cases
- Clean for adding conditional elements

**Cons:**
- Can render unexpected values (e.g., `0 && <p>Text</p>` renders `0`)
- Not suitable for multiple branching paths

**Pitfall Warning:** Avoid using with numbers on left side:
```javascript
// ❌ Bad - renders "0" if messageCount is 0
{messageCount && <p>Messages</p>}

// ✅ Good - explicitly check for > 0
{messageCount > 0 && <p>Messages</p>}
```

---

### 1.3 CSS Display Hiding

**Pattern:**
```javascript
<Component style={{display: isActive ? 'block' : 'none'}} />
```

**When to Use:**
- Frequent toggling of visibility
- Need to preserve component state
- Simple UIs with light hidden trees
- Performance is less critical than state preservation

**Pros:**
- Component remains in DOM and mounted
- Preserves all internal state
- Faster switching between visible/hidden states
- No remount/unmount lifecycle events

**Cons:**
- Hidden DOM still uses memory
- Poor performance with many hidden components or complex trees
- React still reconciles hidden components during updates
- Can cause stale state issues in complex scenarios

**Performance Warning:** "The Good: State preservation! The Bad: Performance suicide. Even though the user can't see the Settings tab, it is still fully mounted in the DOM. If Settings contains a heavy data grid or complex charts, the browser is still paying the memory cost for those DOM nodes."

---

### 1.4 If/Else Statements with Early Returns

**Pattern:**
```javascript
function Item({ name, isPacked }) {
  if (isPacked) {
    return <li className="item">{name} ✅</li>;
  }
  return <li className="item">{name}</li>;
}
```

**When to Use:**
- Complex logic with multiple conditions
- Multiple branches with different behaviors
- Improving readability of intricate conditionals

**Pros:**
- Explicit and easy to understand
- Handles complex scenarios well
- Easy to extend with more conditions

**Cons:**
- More verbose
- Can lead to code duplication

---

### 1.5 Variable Assignment

**Pattern:**
```javascript
function Item({ name, isPacked }) {
  let itemContent = name;
  if (isPacked) {
    itemContent = name + " ✅";
  }
  return <li className="item">{itemContent}</li>;
}
```

**When to Use:**
- Complex conditional logic before rendering
- Building UI incrementally based on conditions
- When refactoring from ternary operators for clarity

**Pros:**
- Highly readable
- Easy to extend with more conditions
- Groups related logic together
- Reduces JSX complexity

**Cons:**
- More verbose than ternary
- Requires variable declaration

---

### 1.6 Comparison Matrix

| Approach | Best For | Complexity | Readability | Unmounts |
|----------|----------|-----------|-------------|----------|
| **Ternary** | Two options, different JSX | Low-Medium | Good | Yes |
| **Logical &&** | Show something or nothing | Very Low | Good | Yes |
| **CSS display** | Frequent toggling, state preservation | Low | Good | No |
| **If/Else** | Complex logic, multiple branches | Medium-High | Excellent | Yes |
| **Variables** | Complex logic before render | Medium | Very Good | Yes |

---

## 2. State Preservation: Unmounting vs Hiding

### 2.1 Core Principle

**React's State Location:**
> "React keeps state for as long as the same component is rendered at the same position in the tree. If it gets removed, or a different component gets rendered at the same position, React discards its state."

React doesn't store state in the component itself. Instead, it maintains state externally and associates it with components based on their **position in the render tree**.

---

### 2.2 Unmounting Causes State Loss

When conditional rendering unmounts a component, React:
1. Destroys the component instance
2. Discards all internal state (useState, useReducer values)
3. Removes associated DOM nodes
4. Clears refs and effects

**Example - State Loss:**
```javascript
function App() {
  const [isPlayerA, setIsPlayerA] = useState(true);

  return (
    <>
      <button onClick={() => setIsPlayerA(!isPlayerA)}>
        {isPlayerA ? 'Taylor' : 'Sarah'}
      </button>

      {/* ❌ State is destroyed when switching */}
      {isPlayerA && <Counter person="Taylor" />}
      {!isPlayerA && <Counter person="Sarah" />}
    </>
  );
}
```

In this pattern:
- User enters "5" in Taylor's counter
- Switch to Sarah (Taylor's component unmounts, state lost)
- Switch back to Taylor (new component instance, starts at 0)

---

### 2.3 CSS Hiding Preserves State

When components are hidden with CSS, they:
1. Stay mounted in the DOM
2. Keep their internal state intact
3. Continue to exist in React's virtual tree
4. Remain susceptible to re-renders

**Example - State Preservation:**
```javascript
function App() {
  const [isPlayerA, setIsPlayerA] = useState(true);

  return (
    <>
      <button onClick={() => setIsPlayerA(!isPlayerA)}>
        {isPlayerA ? 'Taylor' : 'Sarah'}
      </button>

      {/* ✅ State is preserved */}
      <Counter
        style={{display: isPlayerA ? 'block' : 'none'}}
        person="Taylor"
      />
      <Counter
        style={{display: !isPlayerA ? 'block' : 'none'}}
        person="Sarah"
      />
    </>
  );
}
```

Now:
- User enters "5" in Taylor's counter
- Switch to Sarah (Taylor's component stays mounted, hidden)
- Switch back to Taylor (state is preserved at "5")

---

### 2.4 Using Keys to Control State Reset

**Pattern:**
```javascript
<Chat key={to.id} contact={to} />
```

When the `key` prop changes, React:
1. Unmounts the old component instance
2. Creates a new component instance
3. Resets all state to initial values

**Use Cases:**
- Forms that should reset when data changes
- Chat interfaces where switching recipients should clear the input
- Preventing stale state when underlying data changes

**Example - Form Reset:**
```javascript
// Problem: Form input persists when switching recipients
function ChatApp({ recipient }) {
  return <ChatForm contact={recipient} />;
}

// Solution: Reset form when recipient changes
function ChatApp({ recipient }) {
  return <ChatForm key={recipient.id} contact={recipient} />;
}
```

---

### 2.5 Three Strategies for State Management

#### Strategy 1: Lift State Up (Most Common)
```javascript
function App() {
  const [messages, setMessages] = useState({});
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const handleMessage = (text) => {
    setMessages(prev => ({
      ...prev,
      [selectedRecipient.id]: text
    }));
  };

  return (
    <>
      <Sidebar onSelect={setSelectedRecipient} />
      <ChatForm
        message={messages[selectedRecipient?.id] || ''}
        onChange={handleMessage}
      />
    </>
  );
}
```

**Pros:** Clear data flow, reusable, predictable
**Cons:** Can cause unnecessary re-renders of parent

#### Strategy 2: CSS Hiding (For Simple UIs)
```javascript
{contacts.map(contact => (
  <Chat
    key={contact.id}
    contact={contact}
    style={{display: selectedId === contact.id ? 'block' : 'none'}}
  />
))}
```

**Pros:** State preserved automatically, no lifting needed
**Cons:** Performance degrades with hidden complexity

#### Strategy 3: React 19 Activity Component (New)
```javascript
<Activity mode="hidden">
  <ExpensiveForm />
</Activity>
```

Provides middle ground: state preserved, DOM detached, performance better than CSS hiding.

---

### 2.6 Trade-offs Summary

| Aspect | Unmounting (Ternary) | CSS Hiding | Lifted State | Key Reset |
|--------|---------------------|-----------|-------------|-----------|
| **State Preserved** | No | Yes | Yes | No |
| **Performance** | Better (no hidden DOM) | Worse (DOM overhead) | Best | Good |
| **Code Complexity** | Low | Low | Medium | Low |
| **Memory Usage** | Low | High | Low | Low |
| **Remount Overhead** | High | None | None | High |
| **Best For** | One-time renders | Frequent toggles | Complex apps | Form reset |

---

## 3. useRef: Persistence That Survives Re-renders

### 3.1 useRef Fundamentals

**Key Characteristic:** useRef values persist across re-renders but NOT across remounts.

```javascript
function Counter() {
  const renderCount = useRef(0);

  renderCount.current++;

  return <p>Rendered {renderCount.current} times</p>;
}
```

React internally holds onto the ref object for the entire lifetime of the component instance. On every subsequent render, the exact same object is returned.

---

### 3.2 useRef vs State

| Feature | useState | useRef |
|---------|----------|--------|
| Triggers re-render | Yes | No |
| Persists across renders | Yes | Yes |
| Persists across remounts | No | No |
| Mutable | No (immutable updates) | Yes (direct mutation) |
| Best for | UI state | Persistent values, DOM references |

---

### 3.3 Common Patterns

#### Timer Management
```javascript
function Stopwatch() {
  const intervalRef = useRef(null);
  const [seconds, setSeconds] = useState(0);

  const start = () => {
    intervalRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
  };

  return <>...</>;
}
```

**Why useRef?** Don't need to re-render when interval ID changes, and don't need it in JSX—only in cleanup.

---

#### Tracking Previous Value
```javascript
function Component({ value }) {
  const prevValueRef = useRef();

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  return <div>Current: {value}, Previous: {prevValueRef.current}</div>;
}
```

---

#### Mounted State Check (Async Safety)
```javascript
function DataFetcher({ id }) {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchData(id).then(data => {
      if (mountedRef.current) {
        setData(data);
      }
    });
  }, [id]);

  return <>...</>;
}
```

This prevents "Can't perform a React state update on an unmounted component" warnings by checking if component is still mounted before updating state.

---

### 3.4 Critical Limitation: Remounting

**useRef does NOT survive remounting:**

```javascript
// If isActive changes, the ref resets
{isActive && <Component />}

// Better: Use CSS hiding if you need ref persistence across visibility toggles
<Component style={{display: isActive ? 'block' : 'none'}} />
```

**Best Practices:**
- Avoid relying on useRef for values that need to persist across unmounts/remounts
- Use Context or state management if persistence beyond component lifecycle is needed
- Be cautious with closures capturing useRef values in async operations

---

## 4. Performance Optimization

### 4.1 React.memo for Form Components

**Purpose:** Skip re-rendering a component when its props haven't changed.

```javascript
const FormField = memo(function FormField({ value, onChange, label }) {
  console.log('Rendering:', label);
  return (
    <div>
      <label>{label}</label>
      <input value={value} onChange={onChange} />
    </div>
  );
});
```

**When to Use:**
- Component re-renders frequently with same props
- Re-rendering logic is expensive (complex calculations, large lists)
- Granular interactions (drawing editor, form with many fields)

**When NOT to Use:**
- Props are always different (new objects/functions on every render)
- No perceptible lag in current implementation
- Component doesn't have expensive rendering logic

---

### 4.2 Avoiding Prop Changes with React.memo

**Problem: Objects/Functions Change Every Render**
```javascript
function Page() {
  const [name, setName] = useState('Taylor');
  const [age, setAge] = useState(42);

  // ❌ Creates new object on every render
  return <Profile person={{ name, age }} />;
}
```

**Solution 1: useMemo**
```javascript
const person = useMemo(() => ({ name, age }), [name, age]);
return <Profile person={person} />;
```

**Solution 2: Lift Properties**
```javascript
// ✅ Pass individual primitive values instead
return <Profile name={name} age={age} />;
```

**Solution 3: useCallback for Functions**
```javascript
const handleUpdate = useCallback(() => {
  // Update logic
}, []); // Only recreated if dependencies change

return <Chart onUpdate={handleUpdate} />;
```

---

### 4.3 Comparison Functions (Rarely Needed)

```javascript
const Chart = memo(
  function Chart({ dataPoints }) {
    return <svg>...</svg>;
  },
  (oldProps, newProps) => {
    // Return true if props are "equal" (skip re-render)
    return (
      oldProps.dataPoints.length === newProps.dataPoints.length &&
      oldProps.dataPoints.every((oldPoint, index) => {
        const newPoint = newProps.dataPoints[index];
        return oldPoint.x === newPoint.x && oldPoint.y === newPoint.y;
      })
    );
  }
);
```

**Caution:** Custom comparisons are slow and should only be used with known limited-depth data structures.

---

### 4.4 React Compiler (React 19+)

With React Compiler enabled, `React.memo` becomes largely unnecessary:

```javascript
// Without compiler - need memo
const ExpensiveChild = memo(function ExpensiveChild({ name }) {
  return <div>Hello, {name}!</div>;
});

// With compiler - automatic optimization
function ExpensiveChild({ name }) {
  return <div>Hello, {name}!</div>;
}
```

The compiler automatically applies memoization throughout your component tree.

---

### 4.5 Architectural Patterns to Reduce Memoization Need

Instead of relying on memoization, consider:

1. **Accept JSX as Children**
   ```javascript
   function Parent({ children }) {
     const [count, setCount] = useState(0);
     return (
       <>
         <button onClick={() => setCount(count + 1)}>Count: {count}</button>
         {children}
       </>
     );
   }
   ```

2. **Keep State Local**
   - Don't lift state higher than necessary
   - Each component manages its own UI state

3. **Pure Rendering Logic**
   - Fix bugs instead of adding memoization
   - Ensure render functions have no side effects

4. **Clean Up Effects**
   - Remove unnecessary Effects
   - Simpler dependencies = fewer unnecessary re-renders

---

### 4.6 Performance Optimization Checklist

- [ ] Profile your app with React DevTools Profiler first
- [ ] Identify actual re-render bottlenecks
- [ ] Check if props actually change between renders
- [ ] Consider architectural improvements before memo
- [ ] Use `memo` only when perceptible lag exists
- [ ] Pair `memo` with `useCallback` for callback props
- [ ] Use `useMemo` to stabilize object/array props
- [ ] Avoid premature optimization
- [ ] Measure impact of optimizations

---

## 5. Library Patterns for Component Visibility

### 5.1 React Router: Routes and Outlet

**How It Works:**
- Route components stay mounted in the tree
- Unmatched routes are hidden (not rendered)
- URL changes control which routes render
- Nested routes use `<Outlet />`

```javascript
import { Routes, Route, Outlet } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/users" element={<Users />}>
        <Route path=":id" element={<UserDetail />} />
      </Route>
    </Routes>
  );
}

function Users() {
  return (
    <div>
      <UserList />
      <Outlet /> {/* Renders nested routes here */}
    </div>
  );
}
```

**Key Pattern:** Route components are conditionally rendered based on URL matching, providing navigation while preserving back/forward history.

---

### 5.2 React Router Modal Pattern

**Package:** `react-router-modal`

**Concept:** Layers modals on top of the current page without full navigation.

```javascript
import { ModalContainer, ModalRoute } from 'react-router-modal';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Gallery />} />
      </Routes>

      <ModalContainer>
        <ModalRoute path="/photo/:id" element={<PhotoModal />} />
      </ModalContainer>
    </>
  );
}
```

**Benefits:**
- Multiple modals can stack based on route path length
- Supports browser back/forward navigation
- Shareable URLs with modals open
- Background state preservation

---

### 5.3 Tab Libraries: Preserving Tab Content

**Pattern: CSS Hiding or Portals**

Tab libraries typically use one of two approaches:

**Approach 1: Hidden DOM (State Preservation)**
```javascript
<div>
  <button onClick={() => setActive('tab1')}>Tab 1</button>
  <button onClick={() => setActive('tab2')}>Tab 2</button>

  <div style={{display: active === 'tab1' ? 'block' : 'none'}}>
    <Tab1Content />
  </div>
  <div style={{display: active === 'tab2' ? 'block' : 'none'}}>
    <Tab2Content />
  </div>
</div>
```

**Approach 2: Lazy Mounting**
```javascript
<div>
  <button>Tab 1</button>
  <button>Tab 2</button>

  {active === 'tab1' && <Tab1Content />}
  {active === 'tab2' && <Tab2Content />}
</div>
```

**Trade-off:** Preservation vs. Performance.

---

### 5.4 Modal Libraries: Stacked Modal Pattern

**Key Strategy:** Keep modals in a render tree that doesn't dismount when switching.

**Common Implementation:**
```javascript
function ModalStack() {
  const modals = useModalStack();

  return (
    <Portal>
      {modals.map((modal, index) => (
        <ModalContainer key={modal.id} zIndex={1000 + index}>
          {modal.component}
        </ModalContainer>
      ))}
    </Portal>
  );
}
```

**Advantages:**
- Multiple modals can be displayed simultaneously
- Modals don't reset state when other modals open
- Clear z-index and stacking order management
- Can navigate between modals without losing state

---

## 6. React 18+ Advanced Patterns

### 6.1 Transitions for Non-Urgent Updates

**Purpose:** Mark updates that don't need immediate user feedback.

```javascript
import { useTransition } from 'react';

function SearchApp() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, setIsPending] = useTransition();

  const handleChange = (e) => {
    // Urgent: update cursor feedback immediately
    setInput(e.target.value);

    // Non-urgent: search in background
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input value={input} onChange={handleChange} />
      {isPending && <Spinner />}
      <Results query={query} />
    </div>
  );
}
```

**Two-Tier Update System:**
1. **Urgent:** UI feedback (cursor, input display) - immediate
2. **Non-urgent:** Search, filtering, data fetching - deferred

**Benefits:**
- UI stays responsive
- Heavy operations don't block user input
- Automatic batching of state updates

---

### 6.2 Suspense with Concurrent Rendering

**Pattern: Avoid Hiding Content During Loads**

```javascript
import { Suspense, useTransition } from 'react';

function ProfilePage({ userId }) {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      // Don't show fallback if already showing content
      // Instead, keep old UI until new data loads
    });
  };

  return (
    <Suspense fallback={<Spinner />}>
      <ProfileContent userId={userId} />
    </Suspense>
  );
}
```

**Key Insight:** When a component suspends during a transition (non-urgent update), React waits for data instead of showing the fallback. This prevents jarring UI changes.

---

### 6.3 Error Boundaries with Suspense

**Pattern: Complete Error + Loading Handling**

```javascript
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<Spinner />}>
        <Profile />
      </Suspense>
    </ErrorBoundary>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
```

**Three States Handled:**
1. **Loading:** Suspense fallback
2. **Error:** Error boundary fallback
3. **Success:** Component content

---

### 6.4 React 19: Activity Component

**New Low-Level Building Block:**

```javascript
function App() {
  const [hidden, setHidden] = useState(false);

  return (
    <>
      <button onClick={() => setHidden(!hidden)}>Toggle</button>

      <Activity mode={hidden ? 'hidden' : 'visible'}>
        <ExpensiveComponent />
      </Activity>
    </>
  );
}
```

**Behavior:**
- **visible:** Component rendered normally
- **hidden:** DOM nodes detached, Fiber tree kept in memory
- **offscreen:** Similar to hidden, for viewport-based optimization

**Benefits:**
- State preservation (like CSS hiding)
- Better performance (DOM detached)
- Automatic optimization for large lists

---

### 6.5 Concurrent Rendering Implications for Forms

**Batching:**
- React 18 automatically batches all state updates within an event handler
- Multiple setState calls become single re-render

**Form Stack Implications:**
- User input updates (input value) should be urgent
- Form validation/submission should be transitions
- Nested form handling benefits from startTransition

```javascript
function FormStack() {
  const [stack, dispatch] = useReducer(stackReducer, initialStack);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Non-urgent: process form validation and nesting
    startTransition(() => {
      dispatch({ type: 'SUBMIT', payload: formData });
    });
  };

  return <>...</>;
}
```

---

## 7. Form Stack Specific Recommendations

Based on the geoform-opus project context:

### 7.1 Conditional Rendering Strategy

**Recommended:** Ternary with memoized components

```javascript
const FormField = memo(function FormField(props) {
  return <input {...props} />;
});

function FormStack({ currentStep, steps }) {
  return (
    <div>
      {steps.map((step, index) => (
        index === currentStep && <FormField key={step.id} {...step} />
      ))}
    </div>
  );
}
```

**Rationale:**
- Clean unmounting for state reset between steps
- Minimal memory overhead
- Clear visual intent (show current step only)

### 7.2 State Preservation Across Forms

**Recommended:** Lift state to Form Stack reducer

```javascript
function useFormStack() {
  const [stack, dispatch] = useReducer(formStackReducer, initialStack);

  // Each form's state is preserved in the stack reducer
  return { stack, dispatch };
}
```

**Rationale:**
- Centralized form state management
- Easy navigation between steps
- Prevents state loss when switching forms

### 7.3 Performance for Modal Stacks

**Recommended:** Combination approach

```javascript
<div>
  {/* Active modal rendered normally */}
  {activeModal === 'form1' && <FormModal1 />}
  {activeModal === 'form2' && <FormModal2 />}

  {/* Or use CSS hiding for quick toggling */}
  <FormModal1 style={{display: activeModal === 'form1' ? 'block' : 'none'}} />
  <FormModal2 style={{display: activeModal === 'form2' ? 'block' : 'none'}} />
</div>
```

**Choose based on:**
- How often forms switch (frequent → CSS hiding)
- Form complexity (heavy → unmounting)
- Data persistence needs (preserve → CSS hiding or lifted state)

---

## 8. Key Takeaways

### For Conditional Rendering:
1. **Ternary operators** are best for most cases
2. **Logical &&** for simple include/exclude
3. **CSS display: none** only if you need state preservation in simple cases
4. **Lift state** for shared data across forms

### For State Preservation:
1. Unmounting (ternary) loses state - use keys to reset intentionally
2. CSS hiding preserves state but has performance cost
3. Lift state up for maximum control and clarity
4. React 19 Activity component offers a middle ground

### For Performance:
1. Profile before optimizing
2. Use React.memo + useCallback together
3. Pass primitive props instead of objects
4. Consider architectural improvements first
5. React Compiler makes manual memoization less necessary

### For Form Stacks:
1. Keep form state in a centralized reducer
2. Use ternary rendering for step transitions
3. Apply React.memo to form fields
4. Use transitions for non-urgent validation/submission
5. Wrap with ErrorBoundary + Suspense for complete error handling

---

## Sources

- [React Official Docs - Conditional Rendering](https://react.dev/learn/conditional-rendering)
- [React Official Docs - Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [React Official Docs - memo](https://react.dev/reference/react/memo)
- [React Official Docs - Suspense](https://react.dev/reference/react/Suspense)
- [LogRocket - React conditional rendering: 9 methods](https://blog.logrocket.com/react-conditional-rendering-9-methods/)
- [DEV Community - Understanding useRef](https://dev.to/joshi16/understanding-useref-in-react-393c)
- [LogRocket - Building React modals with React Router](https://blog.logrocket.com/building-react-modal-module-with-react-router/)
- [Sentry - Guide to Error & Exception Handling in React](https://blog.sentry.io/guide-to-error-and-exception-handling-in-react/)
