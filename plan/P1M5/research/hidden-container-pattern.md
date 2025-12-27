# Hidden Container Pattern for React State Preservation

## Overview

The hidden container pattern is a sophisticated approach to managing form stacks and complex UI hierarchies where multiple forms need to coexist in the DOM simultaneously while remaining hidden. This pattern preserves React component state, input values, and UI ephemeral state (like textarea content or scroll position) across visibility transitions without re-mounting components.

### Core Principle

All forms in a stack are rendered to the DOM at the same time, but non-active forms are hidden using CSS while remaining mounted. This approach differs from conditional rendering (which unmounts components) and provides better UX for workflows where users navigate between form steps or nested modals.

## 1. Best Practices for Implementation

### 1.1 State Location

- **Keep state mounted**: Never use conditional rendering (`{condition && <Component />}`) for forms you want to preserve
- **Render but hide**: Use CSS to hide components while keeping them in the React tree
- **Centralized management**: Use Context or a state management library to track which form is active

### 1.2 Implementation Pattern

```jsx
// Good: Preserves state when switching between forms
function FormStack({ activeForm }) {
  return (
    <>
      <div style={{ display: activeForm === 'personal' ? 'block' : 'none' }}>
        <PersonalForm />
      </div>
      <div style={{ display: activeForm === 'address' ? 'block' : 'none' }}>
        <AddressForm />
      </div>
      <div style={{ display: activeForm === 'payment' ? 'block' : 'none' }}>
        <PaymentForm />
      </div>
    </>
  );
}

// Bad: Loses state when switching between forms
function FormStack({ activeForm }) {
  return (
    <>
      {activeForm === 'personal' && <PersonalForm />}
      {activeForm === 'address' && <AddressForm />}
      {activeForm === 'payment' && <PaymentForm />}
    </>
  );
}
```

### 1.3 Context-Based Architecture

```jsx
// FormStackContext.jsx
const FormStackContext = createContext();

export function FormStackProvider({ children }) {
  const [activeFormId, setActiveFormId] = useState(0);
  const [formStack, setFormStack] = useState([]);

  return (
    <FormStackContext.Provider value={{ activeFormId, setActiveFormId, formStack, setFormStack }}>
      {children}
    </FormStackContext.Provider>
  );
}

// Usage
export function FormStackRenderer() {
  const { activeFormId, formStack } = useContext(FormStackContext);

  return (
    <div className="form-stack-container">
      {formStack.map((formId, index) => (
        <div
          key={formId}
          style={{
            display: index === activeFormId ? 'block' : 'none',
          }}
        >
          {/* Form content */}
        </div>
      ))}
    </div>
  );
}
```

### 1.4 Form Integration Patterns

#### React Hook Form Integration
```jsx
function MultiStepForm() {
  const form1 = useForm({ mode: 'onChange' });
  const form2 = useForm({ mode: 'onChange' });
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = async () => {
    if (activeStep === 0) {
      const isValid = await form1.trigger();
      if (isValid) setActiveStep(1);
    }
  };

  return (
    <>
      <form style={{ display: activeStep === 0 ? 'block' : 'none' }}>
        <input {...form1.register('email')} />
        <input {...form1.register('name')} />
      </form>
      <form style={{ display: activeStep === 1 ? 'block' : 'none' }}>
        <input {...form2.register('address')} />
        <input {...form2.register('city')} />
      </form>
      <button onClick={handleNext}>Next</button>
    </>
  );
}
```

## 2. CSS Approaches for Hiding

### 2.1 Comparison Matrix

| Property | Layout Impact | Rendering | Interaction | Accessibility | Performance | Use Case |
|----------|---|---|---|---|---|---|
| `display: none` | Removed | Element not rendered | Not focusable | Hidden from screen readers | Re-triggers layout | Complete removal |
| `visibility: hidden` | Preserved | Box rendered | Not focusable | Hidden from screen readers | Re-triggers layout | Preserve space |
| `opacity: 0` | Preserved | Box rendered | Still focusable | Visible to screen readers | GPU-accelerated | Animations |
| `position: absolute; left: -9999px` | Preserved | Box rendered | Can be focused | Varies by implementation | CPU intensive | Older method |

### 2.2 CSS Implementation Patterns

#### display: none (Most Common for Hidden Container Pattern)
```css
.form-hidden {
  display: none;
}

.form-visible {
  display: block;
}
```

Pros:
- Complete removal from layout (no space wasted)
- Effectively hidden from screen readers
- Best for forms that shouldn't contribute to layout

Cons:
- Requires CSS or inline style changes
- May affect layout when toggling

```jsx
<div className={activeForm === 'form1' ? 'form-visible' : 'form-hidden'}>
  <Form1 />
</div>
```

#### visibility: hidden
```css
.form-hidden {
  visibility: hidden;
}

.form-visible {
  visibility: visible;
}
```

Pros:
- Preserves layout space (stable layout)
- No re-trigger of layout calculations for siblings
- Useful when you need consistent spacing

Cons:
- Maintains empty space (visual waste)
- Still uses browser memory for hidden elements

```jsx
<div style={{ visibility: activeForm === 'form1' ? 'visible' : 'hidden' }}>
  <Form1 />
</div>
```

#### opacity: 0 (For Animations)
```css
.form-hidden {
  opacity: 0;
  pointer-events: none; /* Prevent interactions */
}

.form-visible {
  opacity: 1;
  pointer-events: auto;
}
```

Pros:
- GPU-accelerated (smooth animations)
- Can be transitioned smoothly
- Excellent for fade in/out effects

Cons:
- Element remains interactive without `pointer-events: none`
- Takes layout space
- More memory usage than display: none

```jsx
<div
  style={{
    opacity: activeForm === 'form1' ? 1 : 0,
    pointerEvents: activeForm === 'form1' ? 'auto' : 'none',
    transition: 'opacity 0.3s ease-in-out',
  }}
>
  <Form1 />
</div>
```

#### position: absolute; left: -9999px (Legacy)
```css
.form-hidden {
  position: absolute;
  left: -9999px;
}

.form-visible {
  position: relative;
  left: 0;
}
```

Pros:
- Accessible to screen readers
- Component can receive focus (useful for testing)

Cons:
- Deprecated approach (mostly replaced by opacity or display)
- Creates layout issues if not carefully managed
- Can cause scroll position problems

### 2.3 Recommended Approach for Hidden Container Pattern

For most form stacks, use **`display: none`** with CSS classes:

```css
.form-stack__form {
  display: none;
}

.form-stack__form--active {
  display: block;
}

/* Optional: Add transitions using visibility + opacity */
.form-stack__form {
  display: block;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
}

.form-stack__form--active {
  opacity: 1;
  visibility: visible;
}
```

This hybrid approach:
- Removes from layout when hidden (`display: none`)
- Provides smooth transitions (`opacity` + `visibility`)
- Maintains clean semantics

## 3. Performance Considerations

### 3.1 Memory Impact

When all forms are mounted simultaneously:
- **Fiber nodes remain in memory**: React keeps the virtual tree structure
- **DOM nodes remain in memory**: Hidden elements still consume browser memory
- **State instances exist**: Each form's useState hooks occupy memory
- **Scale concerns**: With 3-5 forms, impact is negligible; 20+ forms becomes problematic

### 3.2 Re-rendering Impact

```jsx
// All forms re-render when activeForm changes (even hidden ones)
function FormStack({ activeForm, data }) {
  return (
    <>
      <div style={{ display: activeForm === 0 ? 'block' : 'none' }}>
        <ExpensiveForm data={data} /> {/* Re-renders even when hidden */}
      </div>
      <div style={{ display: activeForm === 1 ? 'block' : 'none' }}>
        <AnotherForm data={data} /> {/* Re-renders even when hidden */}
      </div>
    </>
  );
}
```

### 3.3 Optimization Strategies

#### Strategy 1: useMemo for Hidden Forms
```jsx
const hiddenForm = useMemo(() => {
  return activeForm === 0 ? null : <Form1 />;
}, [activeForm]);

const visibleForm = useMemo(() => {
  return activeForm === 0 ? <Form1 /> : null;
}, [activeForm]);
```

#### Strategy 2: React.memo for Form Components
```jsx
const Form1 = React.memo(function Form1({ data }) {
  console.log('Form1 renders');
  return <form>{/* ... */}</form>;
});

// Only re-renders if props actually change
```

#### Strategy 3: Separate Context for Each Form
```jsx
function FormStack() {
  return (
    <>
      <Form1Provider>
        <div style={{ display: activeForm === 0 ? 'block' : 'none' }}>
          <Form1Container />
        </div>
      </Form1Provider>
      <Form2Provider>
        <div style={{ display: activeForm === 1 ? 'block' : 'none' }}>
          <Form2Container />
        </div>
      </Form2Provider>
    </>
  );
}
```

#### Strategy 4: React 19 Activity Component
```jsx
// New React 19 feature - manages visibility and performance automatically
<Activity mode={activeForm === 0 ? 'visible' : 'hidden'}>
  <Form1 />
</Activity>

<Activity mode={activeForm === 1 ? 'visible' : 'hidden'}>
  <Form2 />
</Activity>
```

### 3.4 Performance Recommendations

1. **Limit form stack depth**: Keep to 3-7 forms maximum
2. **Use lazy loading**: Load form content only when about to become visible
3. **Implement Activity component**: Use React 19's Activity for optimized state preservation
4. **Monitor bundle size**: Large forms should be code-split
5. **Track memory usage**: Use DevTools to identify memory leaks

## 4. Accessibility Concerns

### 4.1 The Hidden Container Challenge

Hidden forms present several accessibility issues:

1. **Focus management**: Hidden focusable elements can be reached via keyboard
2. **Screen reader exposure**: Hidden content may still be announced
3. **Semantic confusion**: Users can't tell if hidden forms exist

### 4.2 Making Hidden Containers Accessible

#### Best Practice: Combine CSS with ARIA Attributes

```jsx
<div
  role="tabpanel"
  aria-labelledby={`tab-${id}`}
  hidden={activeForm !== id} // Use native hidden attribute
  style={{ display: activeForm !== id ? 'none' : 'block' }}
>
  <Form />
</div>
```

#### Preventing Focus on Hidden Elements

```jsx
function FormContainer({ isVisible, formId, children }) {
  return (
    <div
      style={{ display: isVisible ? 'block' : 'none' }}
      aria-hidden={!isVisible} // Hides from screen readers
    >
      {children}
    </div>
  );
}

// All focusable elements in hidden form must have tabindex="-1"
<button tabIndex={isVisible ? 0 : -1}>
  Submit Form
</button>
```

#### Comprehensive Accessible Implementation

```jsx
function AccessibleFormStack({ activeFormId, forms }) {
  return (
    <>
      <div role="tablist" aria-label="Form steps">
        {forms.map((form, index) => (
          <button
            key={form.id}
            role="tab"
            aria-selected={activeFormId === form.id}
            aria-controls={`form-panel-${form.id}`}
            onClick={() => setActiveFormId(form.id)}
          >
            {form.label}
          </button>
        ))}
      </div>

      {forms.map((form) => (
        <div
          key={form.id}
          id={`form-panel-${form.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${form.id}`}
          hidden={activeFormId !== form.id}
          style={{ display: activeFormId !== form.id ? 'none' : 'block' }}
        >
          {form.content}
        </div>
      ))}
    </>
  );
}
```

### 4.3 Critical Accessibility Rules

#### Rule 1: No Focusable Elements in aria-hidden
```jsx
// INCORRECT: Button is focusable but hidden from screen readers
<div aria-hidden="true">
  <button>This is confusing</button>
</div>

// CORRECT: Make button non-tabbable when parent is hidden
<div aria-hidden="true">
  <button tabIndex="-1">This button</button>
</div>

// BETTER: Use display: none instead
<div style={{ display: 'none' }}>
  <button>This is properly hidden</button>
</div>
```

#### Rule 2: Use native HTML hidden attribute
```jsx
// Preferred approach
<form hidden={!isActive}>
  <input type="text" />
</form>

// Equivalent to
<form aria-hidden={!isActive} style={{ display: !isActive ? 'none' : 'block' }}>
  <input type="text" />
</form>
```

#### Rule 3: Focus Restoration
```jsx
function useFormVisibilityFocus() {
  const formRef = useRef();
  const previousActiveRef = useRef(document.activeElement);

  useEffect(() => {
    if (isVisible && formRef.current) {
      // Focus first input in form
      const firstInput = formRef.current.querySelector('input');
      if (firstInput) {
        firstInput.focus();
      }
    } else {
      // Restore previous focus when hiding
      previousActiveRef.current?.focus?.();
    }
  }, [isVisible]);

  return formRef;
}
```

### 4.4 Testing for Accessibility

```jsx
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

test('hidden forms should not have focusable elements in aria-hidden', async () => {
  const { container } = render(<FormStack />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('should not tab to hidden form inputs', async () => {
  const { user } = render(<FormStack />);
  const input = screen.getByLabelText('Hidden Form Input');

  // Should skip hidden inputs
  expect(input).toHaveAttribute('tabindex', '-1');
});
```

## 5. Examples from Popular Libraries

### 5.1 Material UI Modal

Material UI uses portals with focus management and backdrop dismissal:

```jsx
// Material UI implementation approach
<Modal
  open={isOpen}
  onClose={handleClose}
  aria-labelledby="modal-title"
>
  {/* Content is portaled and focus is trapped */}
</Modal>
```

Key features:
- Portals for z-index management
- Focus trapping with FocusLock
- ARIA roles and attributes
- Backdrop click handling

### 5.2 react-modal-stack

A zero-dependency library that manages modal stacking:

```jsx
import { ModalStack, useModal } from 'react-modal-stack';

function App() {
  const { open } = useModal();

  return (
    <>
      <ModalStack>
        {/* Modals render here in stack order */}
      </ModalStack>
      <button onClick={() => open(<MyModal />)}>
        Open Modal
      </button>
    </>
  );
}
```

Features:
- Automatic stacking and z-index management
- Focus management built-in
- Clean API for nested modals

### 5.3 react-activation (Keep-Alive)

Popular in Vue ecosystems, now available for React:

```jsx
import { KeepAlive, Keeper, AliveScope } from 'react-activation';

function App() {
  return (
    <AliveScope>
      <KeepAlive when={isFormActive} name="PersonalForm">
        <PersonalForm />
      </KeepAlive>
      <KeepAlive when={isFormActive} name="AddressForm">
        <AddressForm />
      </KeepAlive>
    </AliveScope>
  );
}
```

Features:
- Moves components to hidden container instead of unmounting
- Provides lifecycle hooks: `componentDidActivate`, `componentWillUnactivate`
- Works with function components via hooks

### 5.4 React 19 Activity Component

The official React solution for state preservation:

```jsx
function TabsInterface() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <>
      <button onClick={() => setActiveTab('home')}>Home</button>
      <button onClick={() => setActiveTab('settings')}>Settings</button>

      <Activity mode={activeTab === 'home' ? 'visible' : 'hidden'}>
        <Home />
      </Activity>

      <Activity mode={activeTab === 'settings' ? 'visible' : 'hidden'}>
        <Settings />
      </Activity>
    </>
  );
}
```

Features:
- Preserves React state automatically
- Cleans up Effects when hidden
- Pre-renders content for faster switching
- Official React support

Reference: https://react.dev/reference/react/Activity

### 5.5 Chakra UI Dialog Stack

Chakra's approach using Context for z-index management:

```jsx
const DialogStack = createContext();

function DialogProvider({ children }) {
  const [dialogs, setDialogs] = useState([]);

  return (
    <DialogStack.Provider value={{ dialogs, setDialogs }}>
      {children}
      <div role="presentation">
        {/* All dialogs render here in stack order */}
        {dialogs.map((dialog, index) => (
          <div key={index} style={{ zIndex: 1300 + index }}>
            {dialog}
          </div>
        ))}
      </div>
    </DialogStack.Provider>
  );
}
```

## 6. React-Specific Considerations

### 6.1 Ref Management in Hidden Components

#### Accessing Hidden Form Values

```jsx
function FormStack({ activeForm }) {
  const form1Ref = useRef();
  const form2Ref = useRef();

  const collectFormData = () => {
    return {
      form1: form1Ref.current?.getValues?.(),
      form2: form2Ref.current?.getValues?.(),
    };
  };

  return (
    <>
      <div style={{ display: activeForm === 0 ? 'block' : 'none' }}>
        <Form1Ref ref={form1Ref} />
      </div>
      <div style={{ display: activeForm === 1 ? 'block' : 'none' }}>
        <Form2Ref ref={form2Ref} />
      </div>
      <button onClick={collectFormData}>Get All Data</button>
    </>
  );
}
```

#### useLayoutEffect for Hidden Elements

```jsx
function HiddenForm({ isVisible }) {
  const ref = useRef();

  useLayoutEffect(() => {
    if (!isVisible && ref.current) {
      // Save scroll position before hiding
      ref.current.dataset.scrollTop = ref.current.scrollTop;
    } else if (isVisible && ref.current) {
      // Restore scroll position
      ref.current.scrollTop = parseInt(ref.current.dataset.scrollTop || 0);
    }
  }, [isVisible]);

  return (
    <div
      ref={ref}
      style={{ display: isVisible ? 'block' : 'none', overflowY: 'auto' }}
    >
      {/* Form content */}
    </div>
  );
}
```

### 6.2 Context and Hidden Components

Context values are available to hidden components:

```jsx
function FormStack({ activeForm }) {
  const userData = useContext(UserContext);

  // Both forms can access userData even when hidden
  return (
    <>
      <div style={{ display: activeForm === 0 ? 'block' : 'none' }}>
        <PersonalForm userData={userData} /> {/* Has access */}
      </div>
      <div style={{ display: activeForm === 1 ? 'block' : 'none' }}>
        <AddressForm userData={userData} /> {/* Has access even when hidden */}
      </div>
    </>
  );
}
```

### 6.3 Portal vs Inline Rendering for Hidden Forms

#### Inline Rendering (Recommended for Most Cases)

```jsx
function FormStack() {
  return (
    <div className="form-stack">
      <div style={{ display: activeForm === 0 ? 'block' : 'none' }}>
        <Form1 />
      </div>
      <div style={{ display: activeForm === 1 ? 'block' : 'none' }}>
        <Form2 />
      </div>
    </div>
  );
}
```

Advantages:
- Simple and intuitive
- No extra DOM hierarchy
- Single render pass
- Context inheritance works naturally

Disadvantages:
- Limited z-index control
- Can be affected by parent overflow

#### Portal Rendering (For Complex Cases)

```jsx
function FormStack() {
  const containerRef = useRef(document.getElementById('modal-root'));

  return (
    <>
      {activeForm === 0 && ReactDOM.createPortal(
        <Form1 />,
        containerRef.current
      )}
      {activeForm === 1 && ReactDOM.createPortal(
        <Form2 />,
        containerRef.current
      )}
    </>
  );
}
```

Advantages:
- Escapes DOM hierarchy constraints
- Better z-index management
- Useful for modals and overlays
- Cleaner DOM structure

Disadvantages:
- Extra render pass
- More complex setup
- Context propagation requires care
- Higher memory usage

#### Recommendation

Use **inline rendering** with CSS hiding for form stacks in most cases. Only use portals when you need to:
- Escape overflow constraints
- Manage z-index across multiple roots
- Break out of positioning context

### 6.4 Effect Cleanup in Hidden Components

Effects run normally in hidden components (in most cases):

```jsx
function HiddenFormWithEffect({ isVisible }) {
  useEffect(() => {
    // This effect runs even when component is hidden
    const subscription = subscribe();
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div style={{ display: isVisible ? 'block' : 'none' }}>
      {/* Form content */}
    </div>
  );
}
```

With React 19 Activity:
```jsx
<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <HiddenFormWithEffect /> {/* Effects are cleaned up when hidden */}
</Activity>
```

### 6.5 useCallback and Hidden Components

Hidden components still trigger dependency changes:

```jsx
function FormContainer({ isVisible }) {
  const [data, setData] = useState();

  // This callback updates even when form is hidden
  const handleChange = useCallback((newData) => {
    setData(newData);
  }, []);

  return (
    <div style={{ display: isVisible ? 'block' : 'none' }}>
      <Form onChange={handleChange} />
    </div>
  );
}
```

Optimize with separate contexts:
```jsx
function FormContainer({ isVisible }) {
  return (
    <FormDataProvider>
      <div style={{ display: isVisible ? 'block' : 'none' }}>
        <Form />
      </div>
    </FormDataProvider>
  );
}
```

## 7. Complete Implementation Example

### 7.1 Full Multi-Step Form with Hidden Container Pattern

```jsx
// formStackContext.js
import { createContext, useState, useCallback } from 'react';

export const FormStackContext = createContext();

export function FormStackProvider({ children }) {
  const [activeFormId, setActiveFormId] = useState('personal');
  const [formData, setFormData] = useState({
    personal: {},
    address: {},
    payment: {},
  });

  const updateFormData = useCallback((formId, data) => {
    setFormData((prev) => ({
      ...prev,
      [formId]: { ...prev[formId], ...data },
    }));
  }, []);

  const nextForm = useCallback(() => {
    const forms = ['personal', 'address', 'payment'];
    const currentIndex = forms.indexOf(activeFormId);
    if (currentIndex < forms.length - 1) {
      setActiveFormId(forms[currentIndex + 1]);
    }
  }, [activeFormId]);

  const prevForm = useCallback(() => {
    const forms = ['personal', 'address', 'payment'];
    const currentIndex = forms.indexOf(activeFormId);
    if (currentIndex > 0) {
      setActiveFormId(forms[currentIndex - 1]);
    }
  }, [activeFormId]);

  return (
    <FormStackContext.Provider
      value={{
        activeFormId,
        setActiveFormId,
        formData,
        updateFormData,
        nextForm,
        prevForm,
      }}
    >
      {children}
    </FormStackContext.Provider>
  );
}

// MultiStepForm.jsx
import { useContext } from 'react';
import { FormStackContext, FormStackProvider } from './formStackContext';

function PersonalForm() {
  const { formData, updateFormData, activeFormId } = useContext(FormStackContext);

  return (
    <div style={{ display: activeFormId === 'personal' ? 'block' : 'none' }}>
      <h2>Personal Information</h2>
      <input
        type="text"
        value={formData.personal.name || ''}
        onChange={(e) =>
          updateFormData('personal', { name: e.target.value })
        }
        placeholder="Full Name"
      />
      <input
        type="email"
        value={formData.personal.email || ''}
        onChange={(e) =>
          updateFormData('personal', { email: e.target.value })
        }
        placeholder="Email"
      />
    </div>
  );
}

function AddressForm() {
  const { formData, updateFormData, activeFormId } = useContext(FormStackContext);

  return (
    <div style={{ display: activeFormId === 'address' ? 'block' : 'none' }}>
      <h2>Address Information</h2>
      <input
        type="text"
        value={formData.address.street || ''}
        onChange={(e) =>
          updateFormData('address', { street: e.target.value })
        }
        placeholder="Street"
      />
      <input
        type="text"
        value={formData.address.city || ''}
        onChange={(e) => updateFormData('address', { city: e.target.value })}
        placeholder="City"
      />
    </div>
  );
}

function PaymentForm() {
  const { formData, updateFormData, activeFormId } = useContext(FormStackContext);

  return (
    <div style={{ display: activeFormId === 'payment' ? 'block' : 'none' }}>
      <h2>Payment Information</h2>
      <input
        type="text"
        value={formData.payment.cardNumber || ''}
        onChange={(e) =>
          updateFormData('payment', { cardNumber: e.target.value })
        }
        placeholder="Card Number"
      />
    </div>
  );
}

function FormNavigation() {
  const { activeFormId, nextForm, prevForm, formData } = useContext(FormStackContext);

  return (
    <div>
      <button onClick={prevForm} disabled={activeFormId === 'personal'}>
        Previous
      </button>
      <span>Step: {['personal', 'address', 'payment'].indexOf(activeFormId) + 1} / 3</span>
      <button onClick={nextForm} disabled={activeFormId === 'payment'}>
        Next
      </button>
      <button onClick={() => console.log(formData)}>
        Submit
      </button>
    </div>
  );
}

export function MultiStepForm() {
  return (
    <FormStackProvider>
      <div className="form-container">
        <PersonalForm />
        <AddressForm />
        <PaymentForm />
        <FormNavigation />
      </div>
    </FormStackProvider>
  );
}
```

## Performance Monitoring and Optimization

### 8.1 Measuring Performance

```jsx
function useFormStackMetrics() {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`${entry.name}: ${entry.duration}ms`);
      }
    });
    observer.observe({ entryTypes: ['measure'] });
    return () => observer.disconnect();
  }, []);
}

// Usage in FormStack
useFormStackMetrics();
```

### 8.2 Memory Profiling

Use React DevTools Profiler:
1. Record interaction
2. Observe component render times
3. Identify re-renders of hidden forms
4. Apply optimizations (useMemo, React.memo)

### 8.3 Common Performance Issues and Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| All forms re-render | Lag when typing in active form | Use React.memo or split contexts |
| Large form bundles | Slow initial load | Code-split with lazy() |
| Memory leak | Growing memory usage | Proper useEffect cleanup |
| Focus issues | Focus lost when switching forms | Implement FocusManagement |
| Scroll position lost | Scroll resets on form switch | Save/restore scroll position |

## Conclusion

The hidden container pattern is a powerful approach for managing complex form workflows in React. It preserves component state across visibility changes without re-mounting, providing superior UX compared to conditional rendering.

Key takeaways:
- Render all forms, hide with CSS
- Use React 19 Activity for optimized state preservation
- Manage accessibility with proper ARIA attributes and focus management
- Monitor performance with React DevTools
- Use Context for centralized form state management
- Test accessibility with axe or similar tools

For most applications, start with inline CSS hiding and progress to React 19 Activity or react-activation libraries for more sophisticated requirements.

## References

- [React Activity Component](https://react.dev/reference/react/Activity)
- [React Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [Accessibility Insights - aria-hidden-focus](https://accessibilityinsights.io/info-examples/web/aria-hidden-focus/)
- [React Modal Stack](https://github.com/mattjennings/react-modal-stack)
- [react-activation GitHub](https://github.com/CJY0208/react-activation)
- [Floating UI Focus Management](https://floating-ui.com/docs/floatingfocusmanager)
- [CSS Display vs Visibility vs Opacity](https://thisthat.dev/display-none-vs-opacity-0-vs-visibility-hidden/)
- [Josh Comeau - Visually Hidden Components](https://www.joshwcomeau.com/snippets/react-components/visually-hidden/)
