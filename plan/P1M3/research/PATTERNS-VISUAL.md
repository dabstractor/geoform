# React Context Patterns - Visual Guide

## 1. Basic Context Flow

```
Component Tree:
├── FormStackProvider (creates context + provides value)
│   ├── Component A (useFormStack) ✓ has access
│   ├── Component B (useFormStack) ✓ has access
│   └── Component C
│       └── Component D (useFormStack) ✓ has access
│
└── Component E (useFormStack) ✗ ERROR - outside provider
```

## 2. Custom Hook Error Prevention

```
Without Custom Hook:
const context = useContext(FormStackContext);
if (!context) {
  console.log('undefined'); // ❌ Silent failure or type error
}

With Custom Hook:
const context = useFormStack();
// Throws immediately if outside provider ✓
// Type is guaranteed FormStackContextType (not null) ✓
// Clear error message ✓
```

## 3. Performance: Object Identity Problem

```
Re-render Flow (without memoization):

Render 1:
Provider creates: { count: 1, setCount } (Address A)
All consumers re-render (new object reference)

Render 2:
Provider creates: { count: 1, setCount } (Address B)
All consumers re-render AGAIN (different address, React thinks it changed)

❌ Unnecessary re-renders every time parent renders
```

## 4. Performance Solution: useMemo

```
With useMemo:

Render 1:
Provider memoizes: { count: 1, setCount } (Address A)
All consumers render

Render 2 (count didn't change):
Provider returns SAME: { count: 1, setCount } (Address A)
Consumers DON'T re-render (same object reference)

Render 3 (count changed):
Provider creates NEW: { count: 2, setCount } (Address B)
Consumers re-render (because value actually changed)

✓ Only re-renders when value actually changes
```

## 5. State + Dispatch Separation

```
Single Context (all consumers affected):
┌─────────────────────────────────────┐
│ FormStackContext                    │
│ { state, dispatch }                 │
└─────────────────────────────────────┘
     ↓                    ↓
┌─────────────┐   ┌──────────────┐
│ TodoList    │   │ TodoActions  │
│ (uses state)│   │ (uses disp.  )│
│ Re-render   │   │ Re-render    │
│ when state  │   │ when state   │
│ changes     │   │ changes ❌   │
└─────────────┘   └──────────────┘

Separated Contexts (only relevant consumers affected):
┌──────────────────────┐   ┌──────────────────────┐
│ StateContext         │   │ DispatchContext      │
│ { state }            │   │ { dispatch }         │
└──────────────────────┘   └──────────────────────┘
     ↓                             ↓
┌─────────────┐            ┌──────────────┐
│ TodoList    │            │ TodoActions  │
│ (uses state)│            │ (uses disp.  )│
│ Re-render   │            │ NO re-render │
│ when state  │            │ on state chg ✓│
│ changes     │            │              │
└─────────────┘            └──────────────┘
```

## 6. Provider Composition Pattern

```
❌ Without Composition (nested providers):
<AuthProvider>
  <ThemeProvider>
    <FormStackProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </FormStackProvider>
  </ThemeProvider>
</AuthProvider>

✓ With Composition (cleaner):
<RootProvider>
  <App />
</RootProvider>

// Where RootProvider = compose([AuthProvider, ThemeProvider, FormStackProvider, ...])
```

## 7. Error Handling in Custom Hooks

```
Component Tree with Error Boundary:

<ErrorBoundary>
  <FormStackProvider>
    <ValidComponent />     ✓ Works fine
    <InvalidComponent />   ✗ Throws useFormStack error
                              ↓ Caught by ErrorBoundary
                              → Display fallback UI
  </FormStackProvider>
</ErrorBoundary>

Without error boundary:
useFormStack throws → App crashes
With error boundary:
useFormStack throws → Caught → Fallback shown
```

## 8. TypeScript Type Safety Flow

```
Define Type:
interface FormStackContextType {
  currentStep: FormStep;
  nextStep: () => void;
}

Create Context:
const FormStackContext = createContext<FormStackContextType | null>(null);

Create Hook:
function useFormStack(): FormStackContextType {
  const context = useContext(FormStackContext);
  if (!context) throw new Error(...);
  return context;  // TypeScript knows this is FormStackContextType
}

Use in Component:
function MyComponent() {
  const { currentStep, nextStep } = useFormStack();
  // ✓ Full IDE autocomplete
  // ✓ Type errors caught at compile time
  // ✓ Runtime guaranteed (throws if outside provider)
}
```

## 9. Dependency Updates in useMemo

```
Context value setup:

const value = useMemo(() => ({
  currentStep,
  nextStep,
  prevStep,
  canGoBack,
  canGoForward
}), [currentStep, nextStep, prevStep, canGoBack, canGoForward]);
    ↑ List all values that might change

How useMemo works:
1. Initial render → Calculate and return value
2. Re-render → Check if ANY dependency changed
3. All deps same → Return cached value (same object)
4. Any dep different → Calculate new value

Remember:
- Functions from useCallback are dependencies
- State values are dependencies
- Constants from outside are NOT dependencies
```

## 10. Library Decision Tree

```
Do you need Context?
│
├─ "Simple component-tree prop passing"
│  └─ React Context ✓
│
├─ "Global app state (theme, auth, etc.)"
│  ├─ "Mostly read, few updates"
│  │  └─ React Context ✓
│  ├─ "Complex state logic"
│  │  └─ Zustand or Jotai ✓
│  └─ "Frequent updates, many consumers"
│     └─ Split contexts or Zustand ✓
│
├─ "Server state (fetched data)"
│  └─ React Query ✓
│
└─ "Atomic granular state"
   └─ Jotai or Recoil ✓
```

## 11. FormStack Pattern Architecture

```
App Root:
  <FormStackProvider steps={[step1, step2, step3]}>
    <MultiStepForm />
  </FormStackProvider>

MultiStepForm Component:
  ├─ Step 1
  │  └─ useFormStack() → render step 1
  ├─ Step 2
  │  └─ useFormStack() → render step 2
  ├─ Step 3
  │  └─ useFormStack() → render step 3
  │
  └─ Navigation Controls
     ├─ <NextButton /> → useFormStack().nextStep()
     ├─ <PrevButton /> → useFormStack().prevStep()
     └─ <GoToStep /> → useFormStack().goToStep(id)

Context Value:
{
  currentStep: { id: 'step1', title: '...' },
  steps: [...all steps...],
  nextStep: () => {},
  prevStep: () => {},
  goToStep: (id) => {},
  canGoBack: false,
  canGoForward: true
}
```

## 12. Testing Patterns

```
Without Provider (Error Expected):
test('throws when used outside provider', () => {
  expect(() => render(<MyComponent />))
    .toThrow('useFormStack must be used within...');
});

With Provider (Normal Flow):
function renderWithProvider(component) {
  return render(
    <FormStackProvider steps={testSteps}>
      {component}
    </FormStackProvider>
  );
}

test('navigates to next step', () => {
  const { getByText } = renderWithProvider(<MyComponent />);
  fireEvent.click(getByText('Next'));
  expect(getByText('Step 2')).toBeInTheDocument();
});
```

---

## Performance Profile Visualization

```
Before Optimization (with new object every render):
Provider Re-renders: [████████████] 12 times
All Consumers Re-render: [████████████] 12 times
Total Re-renders: 24

After Optimization (with memoization):
Provider Re-renders: [████████████] 12 times
All Consumers Re-render: [████] 3 times (only when value changed)
Total Re-renders: 15

Savings: 37.5% reduction in re-renders
```

## Memory Layout Visualization

```
Without Split Contexts:
┌──────────────────────────────┐
│ FormStackContext             │
├──────────────────────────────┤
│ ├─ currentStep (4KB)         │
│ ├─ steps (12KB)              │
│ ├─ nextStep (function)       │
│ ├─ prevStep (function)       │
│ ├─ goToStep (function)       │
│ ├─ canGoBack (boolean)       │
│ └─ canGoForward (boolean)    │
│ Total: ~16KB                 │
│                              │
│ ⚠️ ANY change = all consumers │
│   re-render                  │
└──────────────────────────────┘

With Split Contexts:
┌──────────────────┐  ┌──────────────────┐
│ StateContext     │  │ DispatchContext  │
├──────────────────┤  ├──────────────────┤
│ ├─ currentStep   │  │ ├─ nextStep      │
│ ├─ steps         │  │ ├─ prevStep      │
│ ├─ canGoBack     │  │ ├─ goToStep      │
│ └─ canGoForward  │  │ └─ reset         │
│ Total: ~12KB     │  │ Total: ~1KB      │
│                  │  │                  │
│ Consumers that   │  │ Consumers that   │
│ read state       │  │ dispatch only    │
│ re-render        │  │ DON'T re-render  │
│ on state change  │  │ on state change  │
└──────────────────┘  └──────────────────┘
```

---

## Summary: Pattern Comparison

| Pattern | Bundle Size | Performance | Complexity | When to Use |
|---------|---|---|---|---|
| Basic Context | ~1KB | Good (with memo) | Low | Simple state |
| Split Contexts | ~2KB | Excellent | Medium | Complex state |
| State + Dispatch | ~1.5KB | Very Good | Low-Medium | Frequent updates |
| Custom Hooks | ~500B | Good | Low | Always (improves DX) |
| Provider Composition | ~300B | Good | Medium | Multiple providers |

