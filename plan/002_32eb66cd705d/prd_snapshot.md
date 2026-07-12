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

#### `autoRender` (default `true`)

```tsx
<FormStackProvider autoRender={false}>  // host the viewport yourself
  {app}
</FormStackProvider>
```

* `true` (default): provider renders the form-stack viewport itself, as a sibling of `children` (v1 behavior; zero migration).
* `false`: provider renders **no** viewport — it still provides state/actions context and still renders the `<ConfirmationDialog/>`. The consumer renders `<FormStackViewport/>` wherever it wants the stacked bodies (e.g. inside one shared modal).
* Dev-mode guard: logs a warning when `autoRender={false}`, a form is open, and no `<FormStackViewport/>` has mounted.

See §10.1 for the single-shared-modal pattern.

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

Closes the current form without returning data (internal use only). Bypasses
the promise resolution pattern — see §8.

#### `cancelForm`

```ts
cancelForm(): Promise<void>
```

Cancels the top form through the proper lifecycle: confirmation (when
`confirmOnCancel`), then resolves its deferred with `undefined` and pops it —
so the parent's `await openForm()` resolves `undefined`. No-op on an empty
stack. This is the action a host window (§10.1) should wire to Escape /
backdrop / a host-level close button.

#### `popToIndex`

```ts
popToIndex(index: number): void
```

Navigates to a form by index, cancelling all deeper forms (used by `<Breadcrumbs/>`).

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
* Parent forms remain mounted but hidden (`display: none`)
* No portals required
* Transitions optional and provider-owned
* The renderer (`<FormStackRenderer/>`) is deliberately **chrome-less**: it renders
  the stacked form *bodies* only and injects `onSubmit`/`onCancel`/`onError`. It
  intentionally imposes no window.

### 10.1 Consumer-Hosted Viewport (Single Shared Modal)

The window chrome — one shared modal, its breadcrumb header, its body slot — is
the **consumer's** job. Two exports make the chrome-less renderer placeable
through the public API (no internal-type leakage):

* `<FormStackViewport/>` — a zero-prop component that renders the stacked bodies
  (top visible, parents mounted-hidden) wherever it is placed. Reads the stack
  from context. Renders nothing when the stack is empty.
* `useFormStackViewport()` — low-level hook returning the renderer props
  (`FormStackViewportValue`, assignable to `FormStackRendererProps`), or `null`
  when empty. For consumers who wrap or forward custom props to
  `<FormStackRenderer/>`.

Target UX: one modal hosts the entire stack. Opening a child replaces the
visible body (parent kept mounted, state preserved); the header becomes
breadcrumbs; a host-level close/Escape/backdrop calls `cancelForm()`. Nesting is
unbounded (N deep).

```tsx
<FormStackProvider autoRender={false}>
  <SharedModalHost />
</FormStackProvider>

function SharedModalHost() {
  const { stack } = useFormStackState();
  const { cancelForm } = useFormStackActions();
  return (
    <Dialog open={stack.length > 0} onClose={cancelForm}>
      <DialogTitle><Breadcrumbs /></DialogTitle>
      <DialogContent><FormStackViewport /></DialogContent>
    </Dialog>
  );
}
```

Guarantees: with `autoRender={false}` and exactly one `<FormStackViewport/>`, an
open form renders exactly once; the promise contract of `openForm()` is
unchanged, so callers like `ExpandingAutocomplete` need no edits.

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

---

## 16. Changelog

### 0.2.0 — Hostable viewport (single shared modal)

Additive, fully backwards-compatible public API (defaults preserve 0.1.1
behavior exactly). Enables a consumer to host the entire form stack inside one
shared window (e.g. an MUI `<Dialog>`) instead of each form opening its own.

* `FormStackProvider` gains `autoRender?: boolean` (default `true`).
* New `<FormStackViewport/>` zero-prop component — the placeable viewport.
* New `useFormStackViewport()` hook + `FormStackViewportValue` type (mirrors
  `FormStackRendererProps`; no internal-type leakage).
* New `cancelForm(): Promise<void>` action (cancel the top form through
  confirmation + promise resolution) on `useFormStackActions()` and
  `useFormStack()`.
* Dev-mode guard warns on a forgotten host (`autoRender={false}` + open form +
  no mounted `<FormStackViewport/>`).

Non-goals reaffirmed: geoform stays chrome-less (no built-in window); the
`FormProps` contract, `openForm()`'s promise semantics, and
`FormStackRenderer`'s existing signature are unchanged.

