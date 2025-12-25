# PRD: React Hierarchical Form Stack System (v1)

## 1. Purpose

Provide a **batteries-included, composable React system** for managing **infinitely nestable hierarchical forms** where users may create required relational data at any point without enforced order.

The system acts as a **UI shell** that:

* Manages form stacking, transitions, breadcrumbs, cancellation, and error boundaries
* Treats forms as **black-box React components**
* Preserves parent form state while child forms are active
* Returns values from child forms to parents via a simple async API

---

## 2. Explicit Non-Goals

* No persistence
* No hydration or rehydration
* No schema awareness
* No validation orchestration
* No form registry
* No framework abstraction
* No performance safeguards for extreme nesting
* No routing mandate (query-string support only)

---

## 3. Core UX Rules (Non-Negotiable)

1. Forms may be entered at **any hierarchy level**
2. Parent forms are **paused**, not destroyed
3. Only one form is visible at a time
4. Breadcrumbs show nesting depth
5. Canceling a form:

   * Wipes its data
   * Returns **no value**
6. Submitting a form:

   * Returns an opaque value
   * Automatically resumes the parent
7. Forms are infinitely nestable

---

## 4. Mental Model

This system behaves like a **stack of suspended React components**.

* Opening a form pushes it onto the stack
* Closing resolves or cancels it
* Parent resumes with state intact
* The stack—not the form—controls visibility

---

## 5. Public API

### 5.1 `FormStackProvider`

```tsx
<FormStackProvider>
  {app}
</FormStackProvider>
```

Responsibilities:

* Owns the form stack
* Renders active form
* Injects callbacks
* Renders breadcrumbs
* Manages cancellation confirmation
* Provides error boundaries

---

### 5.2 `useFormStack()`

```ts
const { openForm, closeForm, stack } = useFormStack()
```

#### `openForm`

```ts
openForm<T>(options: {
  id: string
  component: React.ComponentType<FormProps<T>>
  label?: string
  confirmOnCancel?: boolean
}): Promise<T | undefined>
```

Behavior:

* Pushes a new form onto the stack
* Suspends the parent form
* Injects callbacks automatically
* Resolves on submit
* Returns `undefined` on cancel

No render props.
No parent references.
No registry.

---

#### `closeForm`

```ts
closeForm()
```

Closes the current form without returning data (internal use only).

---

#### `stack`

```ts
Array<{
  id: string
  label?: string
}>
```

Read-only stack state for breadcrumbs/UI.

---

## 6. Form Contract

All forms **must accept**:

```ts
interface FormProps<T = any> {
  onSubmit: (value: T) => void
  onCancel: () => void
  onError?: (error: unknown) => void
}
```

Rules:

* Forms own all internal state
* Forms own persistence
* Forms decide when to submit/cancel
* Returned values are opaque to the framework

---

## 7. Breadcrumbs

* Derived directly from stack
* Default behavior: informational
* Optional navigation:

  * Clicking a breadcrumb pops all deeper forms
  * All popped forms are canceled (no values returned)
* Confirmation dialog applies if any popped form is dirty

---

## 8. Cancellation & Dirty State

* Forms may signal dirtiness via an optional hook or prop
* If `confirmOnCancel` is true:

  * Canceling shows a confirmation dialog
* On cancel:

  * Form is unmounted
  * Promise resolves `undefined`
  * Parent resumes untouched

---

## 9. Error Handling

* Each form is wrapped in an error boundary
* `onError(error)` may be called by the form
* Errors do not mutate stack state automatically
* Provider may display:

  * Inline error UI
  * Retry action
  * Dismiss action

---

## 10. Rendering Behavior

* Only the top form is visible
* Parent forms remain mounted but hidden
* No portals required
* Transitions optional and provider-owned

---

## 11. Query String Integration (Initial Use Case)

* Stack may optionally sync to query string
* URL reflects current form stack
* Back/forward navigation supported
* URL handling is **pluggable**, not mandatory

---

## 12. Example Consumer Usage

```ts
const { openForm } = useFormStack()

const handleCreate = async () => {
  const value = await openForm({
    id: 'CreateOrganization',
    component: CreateOrganizationForm,
    label: 'Organization',
    confirmOnCancel: true
  })

  if (value) setOrganization(value)
}
```

No knowledge of:

* Parent form
* Rendering mechanics
* Breadcrumbs
* Stack depth

---

## 13. Design Principles

* Sharp primitives
* Imperative API
* Zero schema coupling
* Zero registries
* Composable UX
* Predictable cancellation
* No magic data flow

---

## 14. Success Criteria

* Users can create relational data in any order
* Parent state is preserved across nesting
* API feels trivial to use
* No consumer needs to understand the stack internals
* Forms remain fully reusable outside the system

---

## 15. Open Questions (Deferred by Design)

* Vue/Svelte parity
* State serialization
* Cross-tab recovery
* Performance constraints
* Schema-aware helpers

