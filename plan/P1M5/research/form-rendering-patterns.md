# React Form Stack Rendering Patterns Research

## Overview

This document consolidates best practices and patterns for rendering form stacks in React, with focus on component visibility control, promise integration, state preservation, and accessibility.

---

## 1. Component Rendering Patterns

### 1.1 Rendering Multiple Components with Visibility Control

#### Conditional Rendering vs CSS Visibility

**Conditional Rendering (Recommended for Stacks)**
```javascript
// Components are added/removed from DOM based on condition
{isFormVisible && <FormComponent {...props} />}
```
- Completely removes component from DOM when hidden
- Cleans up event listeners and timers
- Better for modal/stack patterns where forms come and go
- Memory efficient for large stacks

**CSS-Based Visibility (For State Preservation)**
```javascript
// Components stay in DOM but are hidden visually
<div style={{ display: condition ? null : 'none' }}>
  <FormComponent {...props} />
</div>
```
- Preserves component state while hidden
- Maintains DOM state (scroll, focus, input position)
- Keep component mounted in parent while child is active
- Useful when returning to parent form should restore its exact state

#### Stack Rendering Pattern
```javascript
function FormStack({ stack }) {
  return (
    <div className="form-stack">
      {stack.map((form, index) => {
        const isActive = index === stack.length - 1;
        return (
          <FormWrapper
            key={form.id}
            form={form}
            isActive={isActive}
            style={{ display: isActive ? 'block' : 'none' }}
          >
            {React.createElement(form.component, form.props)}
          </FormWrapper>
        );
      })}
    </div>
  );
}
```

### 1.2 Props Injection Pattern for Form Callbacks

#### Dependency Injection with Higher-Order Components
```javascript
function withFormCallbacks(Component, onSubmit, onCancel) {
  return function WrappedComponent(props) {
    return (
      <Component
        {...props}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );
  };
}
```

#### Direct Props Injection Using createElement
```javascript
// Create form element with injected callbacks
const formElement = React.createElement(
  FormComponent,
  {
    ...formProps,
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    onError: handleError
  }
);

// Or using spread operator
const injectedProps = {
  ...originalProps,
  onSubmit: resolvePromise,
  onCancel: () => resolvePromise(undefined)
};
const element = React.createElement(FormComponent, injectedProps);
```

#### Render Props Pattern for Form Injection
```javascript
function FormStack({ renderForm }) {
  return renderForm({
    onSubmit: handleSubmit,
    onCancel: handleCancel
  });
}

// Usage
<FormStack
  renderForm={({ onSubmit, onCancel }) => (
    <MyForm onSubmit={onSubmit} onCancel={onCancel} />
  )}
/>
```

### 1.3 ComponentType<Props> Rendering: createElement vs JSX

#### Equivalence
Both approaches produce identical React elements:
```javascript
// JSX syntax
<Greeting name="Taylor" />

// createElement syntax
React.createElement(Greeting, { name: 'Taylor' })

// Both produce the same object
```

#### When to Use createElement for Form Stacks

**Advantages of createElement for Dynamic Components:**
- Useful when component type is determined at runtime
- Enables programmatic props injection
- Cleaner when constructing from data structures

```typescript
// Stack entry data structure
interface StackEntry<T = any> {
  id: string;
  component: React.ComponentType<T>;
  props: T;
}

// Render using createElement
function renderStackEntry(entry: StackEntry, callbacks: FormCallbacks) {
  return React.createElement(
    entry.component,
    {
      ...entry.props,
      ...callbacks,
      key: entry.id
    }
  );
}
```

**Advantages of JSX:**
- More readable and maintainable
- Easier to see component hierarchy
- Clearer which closing tag matches opening tag
- Preferred for static or mostly-static components

#### Type-Safe Props Handling
```typescript
interface FormStackEntry<P> {
  component: React.ComponentType<P & FormCallbacks>;
  props: P;
  id: string;
}

function renderFormEntry<P>(
  entry: FormStackEntry<P>,
  callbacks: FormCallbacks
): React.ReactElement {
  return React.createElement(entry.component, {
    ...entry.props,
    ...callbacks,
    key: entry.id
  });
}
```

### 1.4 Key Prop Management for Stack Entries

#### Key Stability Requirements

**Best Practices:**
- Use stable, unique identifiers (database IDs, UUIDs)
- Never use array indices as keys in dynamic lists
- Keys must remain consistent across renders

```javascript
// Good: Stable UUID
const stackEntry = {
  id: 'uuid-1234', // Generated once and persists
  component: FormComponent,
  props: {}
};

// Bad: Array index
{forms.map((form, index) => (
  <Form key={index} {...form} /> // Index changes when list reorders
))}

// Good: Stable ID
{forms.map((form) => (
  <Form key={form.id} {...form} /> // ID doesn't change
))}
```

#### Key Impact on Component Lifecycle
```javascript
// When key changes, React:
// 1. Unmounts the old component instance
// 2. Clears all internal state
// 3. Mounts a fresh component instance
// 4. Runs componentDidMount / useEffect

// Example: Form in stack
const form1 = { id: 'form-1', ... };
// Stack: [form1]
// React creates Form instance for form1

// Add new form
const form2 = { id: 'form-2', ... };
// Stack: [form1, form2]
// React keeps form1 instance (key unchanged)
// React creates new Form instance for form2

// Remove form2
// Stack: [form1]
// React keeps form1 instance (key unchanged)
// React removes form2 instance
```

#### Multi-Level Keying Strategy
```javascript
// For complex nested stacks
function useFormStack() {
  const [stack, setStack] = useState<StackEntry[]>([]);

  const pushForm = (component, props) => {
    const entry: StackEntry = {
      id: generateUUID(), // Unique per stack entry
      componentId: component.name, // For debugging
      timestamp: Date.now(), // Optional: for ordering
      component,
      props
    };
    setStack([...stack, entry]);
    return entry.id;
  };

  return {
    stack,
    pushForm,
    // Render maintains stable keys
    render: () => (
      <div>
        {stack.map(entry => (
          <div key={entry.id}>
            {React.createElement(entry.component, entry.props)}
          </div>
        ))}
      </div>
    )
  };
}
```

---

## 2. Promise Resolution Integration

### 2.1 Deferred Promise Pattern

#### Basic Implementation
```typescript
interface DeferredPromise<T> {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
}

export function useDeferredPromise<T>(): {
  defer: () => DeferredPromise<T>;
  deferRef: DeferredPromise<T> | null;
} {
  const deferRef = useRef<DeferredPromise<T> | null>(null);

  const defer = () => {
    const deferred = {} as DeferredPromise<T>;

    const promise = new Promise<T>((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });

    deferred.promise = promise;
    deferRef.current = deferred;
    return deferRef.current;
  };

  return { defer, deferRef: deferRef.current };
}
```

#### Using Deferred Promise in Form Stack
```javascript
function useFormStackWithPromises() {
  const [stack, setStack] = useState([]);
  const deferredRef = useRef(null);

  const pushForm = (component, props) => {
    const { defer } = useDeferredPromise();
    const deferred = defer();

    const entry = {
      id: generateUUID(),
      component,
      props,
      deferred
    };

    setStack(prev => [...prev, entry]);
    return deferred.promise; // Return promise immediately
  };

  const popForm = () => {
    if (stack.length === 0) return;
    const removed = stack[stack.length - 1];
    setStack(prev => prev.slice(0, -1));
    return removed;
  };

  return { stack, pushForm, popForm };
}
```

### 2.2 Wiring Deferred Promises to Form Callbacks

#### onSubmit Resolves Promise
```javascript
function renderFormWithCallbacks(entry, stack) {
  const handleSubmit = async (formData) => {
    try {
      // Optional: validate or process data
      const result = await validateData(formData);

      // Resolve promise with data
      entry.deferred.resolve(result);

      // Remove form from stack
      stack.popForm();
    } catch (error) {
      // Reject if validation fails
      entry.deferred.reject(error);
    }
  };

  const handleCancel = () => {
    // Resolve with undefined to distinguish from successful submission
    entry.deferred.resolve(undefined);
    stack.popForm();
  };

  return React.createElement(entry.component, {
    ...entry.props,
    onSubmit: handleSubmit,
    onCancel: handleCancel
  });
}
```

#### Promise Chain Pattern
```javascript
// Sequential multi-step form
async function processMultiStepForm() {
  const stack = useFormStack();

  try {
    // Step 1: Get user info
    const userInfo = await stack.pushForm(UserInfoForm, {});

    // Step 2: Get preferences (only if step 1 succeeded)
    const preferences = await stack.pushForm(PreferencesForm, {
      userName: userInfo.name
    });

    // Step 3: Confirmation
    const confirmed = await stack.pushForm(ConfirmationForm, {
      userInfo,
      preferences
    });

    if (confirmed) {
      // Submit complete form to server
      await submitForm({ userInfo, preferences });
    }
  } catch (error) {
    // Handle any form rejection
    console.error('Form failed:', error);
  }
}
```

### 2.3 Cleanup Patterns for Form Removal

#### Cleanup on Unmount
```javascript
function FormStackEntry({ entry, onComplete }) {
  useEffect(() => {
    // Setup: Form mounted and active
    console.log('Form active:', entry.id);

    return () => {
      // Cleanup: Form removed from stack
      console.log('Form unmounting:', entry.id);

      // Cancel pending operations
      // Clear subscriptions
      // Revoke object URLs
      // Stop animations
    };
  }, [entry.id]);

  return <div>{/* form content */}</div>;
}
```

#### Promise Cleanup with finally()
```javascript
async function showForm(component, props) {
  const deferred = createDeferred();
  const stackEntry = { id: uuid(), component, props, deferred };

  stack.push(stackEntry);

  try {
    const result = await deferred.promise;
    return result;
  } finally {
    // Always cleanup, whether resolved or rejected
    stack.remove(stackEntry.id);

    // Cleanup resources
    cleanup(stackEntry);
  }
}
```

#### Timeout Protection
```javascript
// Prevent hanging promises if form is forgotten
function showFormWithTimeout(component, props, timeoutMs = 30000) {
  const deferred = createDeferred();

  const timeoutId = setTimeout(() => {
    if (!deferred.resolved) {
      deferred.reject(new Error('Form timeout'));
    }
  }, timeoutMs);

  deferred.promise
    .then(result => {
      clearTimeout(timeoutId);
      return result;
    })
    .catch(error => {
      clearTimeout(timeoutId);
      throw error;
    });

  return deferred.promise;
}
```

### 2.4 Error Handling for Form Rejection

#### Try-Catch Pattern
```javascript
async function processUserFlow() {
  try {
    const userData = await showForm(UserForm, {});
    if (!userData) {
      console.log('User cancelled');
      return;
    }

    const preferences = await showForm(PreferencesForm, {
      defaultName: userData.name
    });

    const result = await submitToServer(userData, preferences);
    return result;
  } catch (error) {
    console.error('Form or submission error:', error);
    // Show error message to user
    showErrorNotification(error.message);
  }
}
```

#### Error Boundary Integration
```javascript
class FormStackErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error reporting service
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error">
          <h1>Form Error</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### Promise Rejection Handler
```javascript
// Global unhandled rejection handler
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason instanceof FormRejectionError) {
    // Handle form-specific rejections
    event.preventDefault();
    console.log('Form was rejected:', event.reason.message);
  }
});
```

---

## 3. State Preservation Techniques

### 3.1 Parent Form State While Child is Active

#### Strategy 1: CSS Hide Instead of Unmount
```javascript
// Keep parent mounted while child is displayed
function FormStack({ stack }) {
  const parentForm = stack[0];
  const activeForm = stack[stack.length - 1];

  return (
    <div>
      {/* Parent stays mounted, just hidden */}
      <div style={{ display: parentForm === activeForm ? 'block' : 'none' }}>
        {React.createElement(parentForm.component, parentForm.props)}
      </div>

      {/* Child forms also stay mounted but overlaid */}
      {stack.slice(1).map(form => (
        <div
          key={form.id}
          style={{ display: form === activeForm ? 'block' : 'none' }}
        >
          {React.createElement(form.component, form.props)}
        </div>
      ))}
    </div>
  );
}
```

Advantages:
- Form state (input values, validation) preserved automatically
- DOM state (scroll position, focus) maintained
- No need for explicit state management
- Component lifecycle not interrupted

#### Strategy 2: Lift State to Stack Manager
```javascript
function useFormStackWithStatePreservation() {
  const [stack, setStack] = useState([]);
  const [formStates, setFormStates] = useState({});

  const pushForm = (component, props) => {
    const id = generateUUID();
    setStack(prev => [...prev, { id, component, props }]);
    return id;
  };

  const updateFormState = (formId, state) => {
    setFormStates(prev => ({
      ...prev,
      [formId]: state
    }));
  };

  const getFormState = (formId) => formStates[formId];

  // When returning to parent, restore its state
  const popForm = () => {
    const popped = stack[stack.length - 1];
    const parentId = stack[stack.length - 2]?.id;

    setStack(prev => prev.slice(0, -1));

    // Parent can restore its state
    if (parentId) {
      return getFormState(parentId);
    }
  };

  return { stack, pushForm, updateFormState, getFormState, popForm };
}
```

Usage:
```javascript
function ParentForm({ formId, onStateChange, onPushChild }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Notify stack manager of state changes
  useEffect(() => {
    onStateChange(formId, { name, email });
  }, [name, email, formId, onStateChange]);

  const handleEditDetails = async () => {
    const detailsFormId = await onPushChild(DetailsForm, {});
    // Parent state (name, email) is preserved while child is active
  };

  return (
    <form>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={handleEditDetails}>Edit Details</button>
    </form>
  );
}
```

#### Strategy 3: Redux-Form Pattern (destroyOnUnmount: false)
```javascript
// If using form library with persistence
import { Form, Field } from 'react-final-form';

function StackedForm({ formName, onSubmit }) {
  return (
    <Form
      onSubmit={onSubmit}
      // KEY SETTING: Prevent form state destruction on unmount
      // Form state persists in external store (Redux, Context)
      initialValues={{}} // Will be rehydrated from store
      subscription={{ values: true, errors: true }}
    >
      {({ handleSubmit, values }) => (
        <form onSubmit={handleSubmit}>
          <Field name="email">
            {({ input }) => <input {...input} />}
          </Field>
        </form>
      )}
    </Form>
  );
}
```

### 3.2 React Key Stability Requirements

#### Impact on State Preservation
```javascript
// BAD: Key changes on every render
const forms = formStack.map((form, index) => (
  <Form key={index} {...form} /> // Index changes when list reorders
));
// Result: Form unmounts/remounts when siblings added/removed
// State is lost

// GOOD: Stable key from data
const forms = formStack.map(form => (
  <Form key={form.id} {...form} /> // ID stays same
));
// Result: Form instance stays alive across reorders
// State is preserved
```

#### UUID Generation for Stack Entries
```javascript
interface StackEntry {
  id: string; // Never changes after creation
  createdAt: number;
  component: React.ComponentType;
  props: any;
}

function createStackEntry(component: React.ComponentType, props: any): StackEntry {
  return {
    id: generateUUID(), // Generate once
    createdAt: Date.now(),
    component,
    props
  };
}

// Render with stable key
const rendered = entry.map(entry => (
  <FormWrapper key={entry.id}>
    {React.createElement(entry.component, entry.props)}
  </FormWrapper>
));
```

#### Detecting Key Issues
```javascript
// Add debugging to catch key problems
function FormStack({ stack }) {
  useEffect(() => {
    console.log('Current stack keys:', stack.map(e => e.id));
  }, [stack]);

  return stack.map(entry => (
    <div
      key={entry.id}
      data-form-id={entry.id} // For debugging in DevTools
    >
      {React.createElement(entry.component, entry.props)}
    </div>
  ));
}
```

### 3.3 Memory Management for Large Stacks

#### Lazy Component Loading
```javascript
// Only load component when form becomes active
const LazyFormStack = ({ stack }) => {
  const [loadedComponents, setLoadedComponents] = useState({});

  useEffect(() => {
    const activeForm = stack[stack.length - 1];
    if (activeForm && !loadedComponents[activeForm.id]) {
      // Dynamically import when needed
      activeForm.component.then(module => {
        setLoadedComponents(prev => ({
          ...prev,
          [activeForm.id]: module.default
        }));
      });
    }
  }, [stack, loadedComponents]);

  return stack.map(form => (
    <Suspense key={form.id} fallback={<div>Loading...</div>}>
      {loadedComponents[form.id] &&
        React.createElement(loadedComponents[form.id], form.props)}
    </Suspense>
  ));
};
```

#### Stack Size Limiting
```javascript
const MAX_STACK_SIZE = 10;

function useFormStack() {
  const [stack, setStack] = useState([]);

  const pushForm = (component, props) => {
    setStack(prev => {
      if (prev.length >= MAX_STACK_SIZE) {
        console.warn('Stack exceeds max size, removing oldest form');
        // Remove oldest form (usually at index 0)
        return [...prev.slice(1), { id: uuid(), component, props }];
      }
      return [...prev, { id: uuid(), component, props }];
    });
  };

  return { stack, pushForm };
}
```

#### Memory Monitoring
```javascript
// Monitor form instances in stack
function FormStackMonitor({ stack }) {
  useEffect(() => {
    const formCount = stack.length;
    const estimatedMemory = formCount * 50; // KB estimate per form

    if (estimatedMemory > 1000) {
      console.warn(`Stack memory usage high: ${estimatedMemory}KB`);
      // Could trigger cleanup or notification
    }
  }, [stack]);

  return null;
}
```

---

## 4. Focus Management

### 4.1 Focus Trapping Within Active Form

#### Using react-focus-lock Library
```javascript
import FocusLock from 'react-focus-lock';

function FormStack({ stack }) {
  const activeForm = stack[stack.length - 1];

  return (
    <div>
      {stack.map(form => (
        <div key={form.id} style={{ display: form === activeForm ? 'block' : 'none' }}>
          {form === activeForm ? (
            // Focus trap only on active form
            <FocusLock>
              {React.createElement(form.component, form.props)}
            </FocusLock>
          ) : (
            // Inactive forms not wrapped
            React.createElement(form.component, form.props)
          )}
        </div>
      ))}
    </div>
  );
}
```

#### Manual Focus Trap Implementation
```javascript
function useFormFocusTrap(formRef) {
  useEffect(() => {
    if (!formRef.current) return;

    const form = formRef.current;

    // Get all focusable elements within form
    const focusableElements = form.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      // Shift+Tab on first element: go to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element: go to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    form.addEventListener('keydown', handleKeyDown);

    // Auto-focus first element
    firstElement.focus();

    return () => {
      form.removeEventListener('keydown', handleKeyDown);
    };
  }, [formRef]);
}
```

### 4.2 Restoring Focus When Returning to Parent Form

#### Focus Restoration Pattern
```javascript
function useFormStackFocus() {
  const previousFocusRef = useRef(null);

  const pushForm = (component, props) => {
    // Save currently focused element before showing new form
    previousFocusRef.current = document.activeElement;

    // Show new form
    const id = uuid();
    stack.push({ id, component, props });

    return id;
  };

  const popForm = () => {
    if (stack.length === 0) return;

    stack.pop();

    // Restore focus to element that opened the form
    if (previousFocusRef.current?.focus) {
      setTimeout(() => {
        previousFocusRef.current.focus();
      }, 0);
    }
  };

  return { pushForm, popForm, previousFocusRef };
}
```

#### Focus Management in Modal Stack
```javascript
function FormStackWithFocusManagement() {
  const [stack, setStack] = useState([]);
  const focusHistoryRef = useRef([]);

  const pushForm = (component, props) => {
    // Save the currently focused element
    focusHistoryRef.current.push({
      element: document.activeElement,
      scrollPosition: window.scrollY
    });

    const id = uuid();
    setStack(prev => [...prev, { id, component, props }]);

    // Focus trap will handle focus within new form
    return id;
  };

  const popForm = () => {
    setStack(prev => prev.slice(0, -1));

    // Restore focus and scroll
    const previousFocus = focusHistoryRef.current.pop();
    if (previousFocus) {
      setTimeout(() => {
        previousFocus.element?.focus?.();
        window.scrollTo(0, previousFocus.scrollPosition);
      }, 0);
    }
  };

  return (
    <div>
      {stack.map((form, index) => {
        const isActive = index === stack.length - 1;
        return (
          <div key={form.id} style={{ display: isActive ? 'block' : 'none' }}>
            {isActive && (
              <FocusLock>
                {React.createElement(form.component, {
                  ...form.props,
                  onClose: popForm
                })}
              </FocusLock>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### 4.3 aria-hidden for Inactive Forms

#### Complete Accessibility Setup
```javascript
function AccessibleFormStack({ stack }) {
  const activeFormId = stack[stack.length - 1]?.id;

  return (
    <div className="form-stack">
      {stack.map((form, index) => {
        const isActive = form.id === activeFormId;

        return (
          <div
            key={form.id}
            role="presentation"
            // Hide inactive forms from screen readers
            aria-hidden={!isActive}
            // Prevent interacting with inactive forms
            style={{
              display: isActive ? 'block' : 'none',
              pointerEvents: isActive ? 'auto' : 'none'
            }}
          >
            {isActive && (
              <FocusLock>
                <div role="dialog" aria-modal="true">
                  {React.createElement(form.component, form.props)}
                </div>
              </FocusLock>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

#### Aria-Hidden with Multiple Levels
```javascript
// For nested modals
function NestedFormStack({ stack, baseElement = document.body }) {
  const activeFormId = stack[stack.length - 1]?.id;

  useEffect(() => {
    // Hide all inactive forms from screen readers
    stack.forEach((form, index) => {
      const isActive = form.id === activeFormId;
      const formElement = document.getElementById(`form-${form.id}`);

      if (formElement) {
        formElement.setAttribute('aria-hidden', String(!isActive));
      }
    });

    // Optionally hide background content
    const backgroundElement = document.getElementById('main-content');
    if (backgroundElement && stack.length > 0) {
      backgroundElement.setAttribute('aria-hidden', 'true');
    }
  }, [stack, activeFormId]);

  return (
    <div className="form-stack">
      {stack.map(form => (
        <div
          key={form.id}
          id={`form-${form.id}`}
          role="dialog"
          aria-modal={form.id === activeFormId}
          style={{ display: form.id === activeFormId ? 'block' : 'none' }}
        >
          {React.createElement(form.component, form.props)}
        </div>
      ))}
    </div>
  );
}
```

---

## 5. Real-World Library Examples

### 5.1 @prezly/react-promise-modal

**Key Features:**
- Imperative modal invocation with promises
- Automatic promise wiring to callbacks
- Simple callback API: `onSubmit(value)` and `onDismiss()`

**Pattern:**
```javascript
const showModal = useModal(ConfirmDialog);

// Usage
const result = await showModal({ message: 'Continue?' });
if (result) {
  // User submitted
} else {
  // User dismissed
}
```

**Promise Wiring:**
- `onSubmit(value)` → resolves with `value`
- `onDismiss()` → resolves with `undefined`

### 5.2 react-modal-promise

**Key Features:**
- Stack-based modal rendering
- Promise-based resolution with `onResolve`/`onReject`
- Works with any styling solution

**Pattern:**
```javascript
const promise = createModal(MyModal)({
  title: 'Form'
});

promise
  .then(value => console.log('Resolved:', value))
  .catch(error => console.error('Rejected:', error));
```

### 5.3 react-use-wizard & react-step-wizard

**Key Features:**
- Linear and non-linear step navigation
- Child-based composition
- Shared header/footer components
- Form validation per step

**Pattern:**
```javascript
const { currentStep, isFirstStep, isLastStep, nextStep, previousStep } = useWizard();

// Each child is a step
<Wizard>
  <Step1 />
  <Step2 />
  <Step3 />
</Wizard>
```

---

## 6. Best Practices Summary

### Component Rendering
- **Use conditional rendering** for modal/stack patterns where forms come and go
- **Use CSS hiding** to preserve state when returning to parent form
- **Keep keys stable** using UUIDs, not array indices
- **Use React.createElement** for dynamic component types with props injection

### Promise Integration
- **Use deferred promises** to separate promise creation from resolution
- **Wire onSubmit to resolve** with data, onCancel to resolve with undefined
- **Use finally()** for guaranteed cleanup
- **Set timeouts** to prevent hanging promises

### State Preservation
- **CSS hide parent** while child form is active for automatic state preservation
- **Lift state** to stack manager for explicit state control
- **Use form libraries** with persist options (destroyOnUnmount: false)
- **Monitor stack size** for large applications to prevent memory issues

### Accessibility
- **Enable focus trap** on active form to prevent accidental background interaction
- **Restore focus** to opening element when form closes
- **Use aria-hidden** on inactive forms to hide from screen readers
- **Use role="dialog"** and aria-modal="true"** for semantic correctness

---

## 7. References

- [React createElement - react.dev](https://react.dev/reference/react/createElement)
- [React Focus Lock - GitHub](https://github.com/theKashey/react-focus-lock)
- [focus-trap-react - npm](https://www.npmjs.com/package/focus-trap-react)
- [@prezly/react-promise-modal - npm](https://www.npmjs.com/package/@prezly/react-promise-modal)
- [react-modal-promise - GitHub](https://github.com/cudr/react-modal-promise)
- [react-use-wizard - GitHub](https://github.com/devrnt/react-use-wizard)
- [react-step-wizard - npm](https://www.npmjs.com/package/react-step-wizard)
- [DEV: Creating a deferred promise hook in React](https://dev.to/vicnovais/creating-a-deferred-promise-hook-in-react-39jh)
- [Morrow Digital: Promise-Based Modals](https://www.themorrow.digital/blog/how-to-use-asynchronous-modals-for-cleaner-and-more-flexible-code)
- [React Design Patterns - LogRocket](https://blog.logrocket.com/react-design-patterns/)
- [React Key Prop Best Practices - Medium](https://medium.com/@chanukachandrayapa/react-key-prop-best-practices-from-state-mismanagement-to-optimized-rendering-cb85c62287f6)

---

## 8. Implementation Checklist for Form Stack

- [ ] Choose rendering strategy (conditional vs CSS hide)
- [ ] Implement deferred promise hook
- [ ] Set up form callback injection pattern
- [ ] Configure key management with UUID generation
- [ ] Add state preservation mechanism
- [ ] Implement focus trap with react-focus-lock or manual
- [ ] Add focus restoration on form close
- [ ] Set up aria-hidden for inactive forms
- [ ] Configure error boundary for error handling
- [ ] Add timeout protection for hanging promises
- [ ] Test with multiple nested forms
- [ ] Monitor memory usage in development
- [ ] Document component props and callbacks
