# geoform

React Hierarchical Form Stack System - infinitely nestable forms with state preservation.

[![npm version](https://img.shields.io/npm/v/geoform.svg)](https://www.npmjs.com/package/geoform)
[![bundle size](https://img.shields.io/bundlephobia/minzip/geoform)](https://bundlephobia.com/package/geoform)
[![license](https://img.shields.io/npm/l/geoform.svg)](https://github.com/yourusername/geoform/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Features

- **Infinitely Nestable Forms** - Stack forms within forms without limits; parent state is preserved
- **Promise-Based API** - `openForm()` returns a Promise that resolves when the form closes
- **Full TypeScript Support** - Generics flow from form definition to result handling
- **Built-in Breadcrumb Navigation** - Click any breadcrumb to navigate back through the form hierarchy
- **Error Boundaries Per Form** - Crashes in one form don't affect parent forms
- **Hostable Viewport (Single Shared Modal)** - Set `autoRender={false}` on `<FormStackProvider/>` and place `<FormStackViewport/>` to host the whole stack in one window (e.g. an MUI `<Dialog/>`); zero migration, defaults to v1 behavior

## Installation

```bash
npm install geoform
```

```bash
yarn add geoform
```

```bash
pnpm add geoform
```

**Peer Dependencies:** React 18 or 19

```bash
npm install react react-dom
```

## Quick Start

```tsx
import { useState } from 'react';
import { FormStackProvider, useFormStack, type FormProps } from 'geoform';

// 1. Define your form with FormProps<T>
interface UserData {
  name: string;
}

function UserForm({ onSubmit, onCancel }: FormProps<UserData>) {
  const [name, setName] = useState('');

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="button" onClick={() => onSubmit({ name })}>Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </div>
  );
}

// 2. Use openForm() to open forms and await results
function CreateButton() {
  const { openForm } = useFormStack();

  const handleClick = async () => {
    const result = await openForm<UserData>({
      id: 'create-user',
      component: UserForm,
      label: 'Create User',
    });

    if (result) {
      console.log('Created:', result.name);
    }
    // If undefined, user cancelled
  };

  return <button onClick={handleClick}>Create User</button>;
}

// 3. Wrap your app with FormStackProvider
function App() {
  return (
    <FormStackProvider>
      <CreateButton />
    </FormStackProvider>
  );
}
```

## Core Concepts

### Form Stack

A stack of suspended form components where only the top form is visible. When you call `openForm()`, your current form is hidden (not unmounted) and the new form appears on top.

### State Preservation

Parent forms remain mounted while children are active. All `useState`, `useRef`, and other React state is preserved automatically. When the child form closes, the parent reappears with its state intact.

### Promise-Based API

`openForm()` returns a Promise that resolves when the form closes:
- **Submit**: Resolves with the value passed to `onSubmit(value)`
- **Cancel**: Resolves with `undefined`

```tsx
const result = await openForm<UserData>({ ... });
if (result) {
  // User submitted - result is UserData
} else {
  // User cancelled - result is undefined
}
```

### Breadcrumb Navigation

The `<Breadcrumbs />` component displays the form hierarchy. Clicking a breadcrumb navigates directly to that form, cancelling all forms above it in the stack.

### Error Isolation

Each form is wrapped in an error boundary. If a form crashes, parent forms are unaffected. Users can retry or dismiss the failed form.

## API Reference

### Components

#### FormStackProvider

Enables form stack functionality. Wrap your application with this component.

```tsx
import { FormStackProvider } from 'geoform';

function App() {
  return (
    <FormStackProvider>
      <YourApp />
    </FormStackProvider>
  );
}
```

Children are rendered normally — the provider adds no wrapper DOM around them. The optional `autoRender` prop controls who renders the stacked form bodies:

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoRender` | `boolean` | `true` | When `true` (default), the provider renders the form-stack viewport itself, as a sibling of `children` (v1 behavior; zero migration). When `false`, the provider renders **no** viewport — host it yourself by rendering `<FormStackViewport/>` where you want the stacked form bodies (e.g. inside a single shared modal). The `<ConfirmationDialog/>` is always rendered regardless. See [Hostable Viewport](#hostable-viewport-single-shared-modal). |

```tsx
import { FormStackProvider, FormStackViewport } from 'geoform';

// Host the viewport yourself (e.g. inside one shared modal):
<FormStackProvider autoRender={false}>
  {app}
  {/* render <FormStackViewport/> somewhere in your host UI */}
</FormStackProvider>
```

> **Dev-mode guard:** When `autoRender={false}`, a form is open, and no `<FormStackViewport/>` has mounted, the provider logs a `console.warn` at most once per "forgotten host" episode (development only; the warning resets once a viewport mounts or the stack clears).

---

#### Breadcrumbs

Displays navigable breadcrumbs for the form stack.

```tsx
import { Breadcrumbs } from 'geoform';

<Breadcrumbs separator=" › " className="my-breadcrumbs" />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `separator` | `ReactNode` | `"/"` | Separator between breadcrumb items |
| `className` | `string` | `""` | CSS class for the nav element |
| `ariaLabel` | `string` | `"Form navigation"` | Accessibility label |

**CSS Classes:**

```css
.breadcrumbs                /* nav element container */
.breadcrumbs__list          /* ol element */
.breadcrumbs__item          /* li element for each entry */
.breadcrumbs__link          /* a element for clickable items */
.breadcrumbs__current       /* span element for current form */
.breadcrumbs__separator     /* span element for separators */
```

**Returns:** `null` when stack is empty.

---

#### ConfirmationDialog

Accessible modal dialog for cancel confirmation. Uses native HTML `<dialog>` element.

```tsx
import { ConfirmationDialog } from 'geoform';

<ConfirmationDialog
  isOpen={showConfirm}
  title="Discard Changes?"
  message="Your unsaved changes will be lost."
  confirmLabel="Discard"
  cancelLabel="Keep Editing"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Whether dialog is visible |
| `title` | `string` | `"Discard Changes?"` | Dialog title |
| `message` | `string` | `"Your unsaved changes will be lost."` | Dialog message |
| `confirmLabel` | `string` | `"Discard"` | Confirm button text |
| `cancelLabel` | `string` | `"Keep Editing"` | Cancel button text |
| `onConfirm` | `() => void` | required | Called when user confirms |
| `onCancel` | `() => void` | required | Called when user cancels |

**CSS Classes:**

```css
.confirmation-dialog
.confirmation-dialog__content
.confirmation-dialog__title
.confirmation-dialog__message
.confirmation-dialog__actions
.confirmation-dialog__button
.confirmation-dialog__button--cancel
.confirmation-dialog__button--confirm
```

---

#### FormErrorBoundary

Error boundary for isolating form rendering errors. Provides retry and dismiss options.

```tsx
import { FormErrorBoundary } from 'geoform';

<FormErrorBoundary
  formId="user-form"
  onDismiss={() => closeForm()}
  onError={(error, info) => logToService(error)}
>
  <UserForm />
</FormErrorBoundary>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Form component to wrap |
| `formId` | `string` | required | Unique form identifier |
| `onDismiss` | `() => void` | required | Called when dismiss is clicked |
| `onError` | `(error, info) => void` | - | Called when error is caught |
| `fallback` | `ReactNode` | - | Custom error UI |

**CSS Classes:**

```css
.form-error-boundary
.form-error-boundary__container
.form-error-boundary__title
.form-error-boundary__message
.form-error-boundary__actions
.form-error-boundary__retry-button
.form-error-boundary__dismiss-button
```

---

#### FormStackViewport

Zero-prop placeable viewport that renders the stacked form bodies — the top form
is visible while parent forms stay mounted but hidden (`display: none`). It reads
the stack from context, so it takes no props, and renders `null` when the stack is
empty or when it is used outside a `<FormStackProvider>`.

```tsx
import {
  FormStackProvider,
  FormStackViewport,
  useFormStackState,
} from 'geoform';

function App() {
  return (
    <FormStackProvider autoRender={false}>
      <SharedModalHost />
    </FormStackProvider>
  );
}

// Render <FormStackViewport/> wherever the stacked form bodies should appear —
// e.g. the body of a single shared modal that hosts the whole stack:
function SharedModalHost() {
  const { stack } = useFormStackState();
  return (
    <Dialog open={stack.length > 0}>
      <FormStackViewport />
    </Dialog>
  );
}
```

**Props:** None. The viewport reads everything it needs from context.

> **Note:** `<FormStackViewport/>` is only meaningful when the provider is set to
> `<FormStackProvider autoRender={false}>`. With the default `autoRender={true}`,
> the provider already renders its own viewport as a sibling of `children`, so
> mounting an additional `<FormStackViewport/>` would render the stack twice. For
> the full single-shared-modal pattern, see
> [Hostable Viewport](#hostable-viewport-single-shared-modal).

---

### Hooks

#### useFormStack

Primary hook for form stack interactions. Returns state and actions.

```tsx
import { useFormStack } from 'geoform';

function MyComponent() {
  const { stack, openForm, closeForm } = useFormStack();

  const handleCreate = async () => {
    const result = await openForm<UserData>({
      id: 'create-user',
      component: CreateUserForm,
      label: 'Create User',
      confirmOnCancel: true,
    });

    if (result) {
      console.log('Created:', result);
    }
  };

  return <button onClick={handleCreate}>Create</button>;
}
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `stack` | `readonly StackEntry[]` | Current form stack |
| `openForm` | `<T>(options) => Promise<T \| undefined>` | Opens a form and awaits result |
| `closeForm` | `() => void` | Closes the current form |
| `popToIndex` | `(index: number) => void` | Navigates to the form at `index`, cancelling all deeper forms (used by `<Breadcrumbs/>`) |
| `cancelForm` | `() => Promise<void>` | Cancels the top form (resolves its deferred with `undefined`; honors `confirmOnCancel`). No-op on an empty stack |

---

#### useFormStackState

Read-only state hook. Use when you only need to display stack info.

More performant than `useFormStack` - doesn't re-render when actions are called.

```tsx
import { useFormStackState } from 'geoform';

function StackCounter() {
  const { stack } = useFormStackState();
  return <span>Forms open: {stack.length}</span>;
}
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `stack` | `readonly StackEntry[]` | Current form stack |

---

#### useFormStackActions

Actions-only hook. Use when you only need to dispatch actions.

More performant than `useFormStack` - doesn't re-render when stack changes.

```tsx
import { useFormStackActions } from 'geoform';

function CreateButton() {
  const { openForm } = useFormStackActions();

  return <button onClick={() => openForm({ ... })}>Create</button>;
}
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `openForm` | `<T>(options) => Promise<T \| undefined>` | Opens a form |
| `closeForm` | `() => void` | Closes the current form |
| `popToIndex` | `(index: number) => void` | Navigates to the form at `index`, cancelling all deeper forms (used by `<Breadcrumbs/>`) |
| `cancelForm` | `() => Promise<void>` | Cancels the top form (resolves its deferred with `undefined`; honors `confirmOnCancel`). No-op on an empty stack |

---

#### useFormStackURLSync

Syncs form stack state with URL query parameters. Enables shareable URLs and browser back/forward navigation.

```tsx
import { FormStackProvider, useFormStackURLSync } from 'geoform';

function App() {
  return (
    <FormStackProvider>
      <URLSyncedApp />
    </FormStackProvider>
  );
}

function URLSyncedApp() {
  // Forms appear in URL as ?forms=form1,form2
  useFormStackURLSync();

  return <YourApp />;
}
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `paramName` | `string` | `"forms"` | Query parameter name |
| `restoreOnMount` | `boolean` | `true` | Restore stack from URL on mount |
| `syncToUrl` | `boolean` | `true` | Sync stack changes to URL |
| `syncFromUrl` | `boolean` | `true` | Sync URL changes to stack |
| `onRestore` | `(formIds: string[]) => void` | - | Called when restoring from URL |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `isRestoring` | `boolean` | Whether currently restoring from URL |
| `getUrlState` | `() => string[]` | Get form IDs from URL |
| `forceUrlUpdate` | `() => void` | Manually trigger URL update |

---

#### useFormStackViewport

Low-level hook that returns the props required by `<FormStackRenderer/>` — the
internal stack plus the `onClose`/`onCancelRequest` callbacks — or `null` when
there is nothing to render. The returned value is assignable to
`FormStackRendererProps`, so it can be spread directly onto the renderer.

For consumers who want to forward custom props to `<FormStackRenderer/>` or wrap
it, instead of mounting the zero-prop `<FormStackViewport/>` component. Most
consumers should use `<FormStackViewport/>`.

```tsx
import { useFormStackViewport, FormStackRenderer } from 'geoform';

function CustomHost() {
  const viewport = useFormStackViewport();
  if (!viewport) return null;
  // viewport is assignable to FormStackRendererProps
  return <FormStackRenderer {...viewport} />;
}
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `FormStackViewportValue \| null` | Renderer props (assignable to `FormStackRendererProps`), or `null` when the stack is empty or the hook is used outside a `<FormStackProvider>` |

---

### Types

#### FormProps\<T\>

Props interface that all form components must implement.

```tsx
import type { FormProps } from 'geoform';

interface UserData {
  name: string;
  email: string;
}

function UserForm({ onSubmit, onCancel, onError }: FormProps<UserData>) {
  // onSubmit expects UserData
  // onCancel takes no arguments
  // onError is optional
}
```

**Definition:**

```tsx
interface FormProps<T = unknown> {
  /** Called when form submits with the form's return value */
  onSubmit: (value: T) => void;
  /** Called when form is canceled */
  onCancel: () => void;
  /** Optional error handler for form-level errors */
  onError?: (error: unknown) => void;
}
```

---

#### OpenFormOptions\<T\>

Options passed to `openForm()`.

```tsx
const result = await openForm<UserData>({
  id: 'create-user',
  component: UserForm,
  label: 'Create User',
  confirmOnCancel: true,
});
```

**Definition:**

```tsx
interface OpenFormOptions<T = unknown> {
  /** Unique identifier for this form instance */
  id: string;
  /** The form component to render (must accept FormProps<T>) */
  component: ComponentType<FormProps<T>>;
  /** Optional label displayed in breadcrumbs */
  label?: string;
  /** If true, shows confirmation dialog before cancel */
  confirmOnCancel?: boolean;
}
```

---

#### StackEntry

Public view of a form in the stack.

```tsx
interface StackEntry {
  /** Unique identifier for the form */
  id: string;
  /** Optional display label for breadcrumbs */
  label?: string;
}
```

---

#### FormStackState

Read-only state returned by `useFormStackState`.

```tsx
interface FormStackState {
  /** Current form stack (read-only) */
  stack: readonly StackEntry[];
}
```

---

#### FormStackActions

Actions returned by `useFormStackActions`.

```tsx
interface FormStackActions {
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  closeForm: () => void;
  popToIndex: (index: number) => void;
  cancelForm: () => Promise<void>;
}
```

---

#### FormStackViewportValue

The renderer props returned by `useFormStackViewport()`. Structurally identical
to `FormStackRendererProps`, so the value can be spread directly onto
`<FormStackRenderer/>` without leaking internal types into the public API.
Consumers should never need to construct this themselves — read it via
`useFormStackViewport()` or let `<FormStackViewport/>` render it.

**Definition:**

```tsx
interface FormStackViewportValue {
  /** Internal stack entries to render (top visible, parents mounted-hidden) */
  stack: InternalStackEntry<unknown>[];
  /** Callback when a form closes (pops the top form from the stack) */
  onClose: () => void;
  /** Request confirmation before cancelling an entry; resolves true if confirmed */
  onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>;
}
```

> **Note:** `InternalStackEntry` is an **internal type** — it is not exported
> from the package entry point and is not part of the public API. It appears
> here only to document the value's shape. Consumers obtain the full value from
> `useFormStackViewport()` and never construct or name `InternalStackEntry`
> directly; the public, sanitized view of a stack entry is `StackEntry`.

## Advanced Usage

### URL Sync

Enable URL synchronization for shareable form states:

```tsx
function App() {
  return (
    <FormStackProvider>
      <URLSyncedApp />
    </FormStackProvider>
  );
}

function URLSyncedApp() {
  const { isRestoring } = useFormStackURLSync({
    paramName: 'forms',
    onRestore: (formIds) => {
      // Load form components based on IDs
      console.log('Restoring forms:', formIds);
    },
  });

  if (isRestoring) {
    return <div>Loading...</div>;
  }

  return <YourApp />;
}
```

URL format: `?forms=form1,form2,form3`

Browser back/forward buttons navigate through form history.

#### Form Restoration

The `onRestore` callback receives form IDs from the URL, but you must implement the actual form opening logic. This is intentional—geoform treats forms as black-box components managed by you, not the library.

```tsx
import { useFormStack, useFormStackURLSync, type FormProps } from 'geoform';

// Map form IDs to their components and optional labels
function getFormComponent(formId: string) {
  switch (formId) {
    case 'user-form':
      return { component: UserForm, label: 'User' };
    case 'org-form':
      return { component: OrgForm, label: 'Organization' };
    case 'team-form':
      return { component: TeamForm, label: 'Team' };
    default:
      console.warn(`Unknown form ID: ${formId}`);
      return null;
  }
}

function URLSyncedApp() {
  const { openForm } = useFormStack();
  const { isRestoring } = useFormStackURLSync({
    paramName: 'forms',
    onRestore: async (formIds) => {
      for (const formId of formIds) {
        const entry = getFormComponent(formId);
        if (entry) {
          await openForm({
            id: formId,
            component: entry.component,
            label: entry.label,
          });
        }
      }
    },
  });

  if (isRestoring) {
    return <div>Restoring forms...</div>;
  }

  return <YourApp />;
}
```

> **Note**: geoform does not include a form registry. This is an intentional design decision—forms are managed by you, not the library. Full auto-restore would require a registry pattern, which would add complexity and reduce flexibility.

**Best Practices**:

- Handle unknown form IDs gracefully (don't crash on invalid URLs)
- Show a loading state during restoration using `isRestoring`
- Remember: the URL only tracks form IDs, not form data or user input

### Confirmation Dialogs

Prevent accidental data loss with confirmation dialogs:

```tsx
const result = await openForm<UserData>({
  id: 'edit-user',
  component: EditUserForm,
  label: 'Edit User',
  confirmOnCancel: true,  // Shows dialog before cancel
});
```

The default dialog asks "Discard Changes?" with "Keep Editing" and "Discard" buttons.

### Error Boundaries

Each form is automatically wrapped in an error boundary. For custom error handling:

```tsx
// In your form component
function MyForm({ onSubmit, onCancel, onError }: FormProps<Data>) {
  // onError is called when the error boundary catches an error
  // Use it for logging to external services
}

// The error boundary provides default UI with:
// - Error message display
// - "Try Again" button (re-renders the form)
// - "Dismiss" button (closes the form)
```

### Custom Breadcrumb Styling

Style breadcrumbs with CSS using the provided class names:

```css
.breadcrumbs {
  padding: 1rem;
  background: #f5f5f5;
}

.breadcrumbs__list {
  display: flex;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumbs__link {
  color: #0066cc;
  text-decoration: none;
}

.breadcrumbs__link:hover {
  text-decoration: underline;
}

.breadcrumbs__current {
  color: #333;
  font-weight: bold;
}

.breadcrumbs__separator {
  color: #999;
}
```

### Hostable Viewport (Single Shared Modal)

By default (`autoRender={true}`), `<FormStackProvider/>` renders the stacked form
bodies itself, as a sibling of its children. For most apps that is exactly right
and needs zero setup. But when you want **one window to host the entire stack** —
for example a single modal that stays open while forms push and pop inside it —
set `autoRender={false}` and render `<FormStackViewport/>` yourself wherever the
stacked bodies should appear.

This keeps geoform **chrome-less**: the library renders the form *bodies* and
injects `onSubmit`/`onCancel`/`onError`, but it never imposes a window. The window
chrome — the shared modal, its breadcrumb header, and its body slot — is the
**consumer's** job. You get full control of the surrounding UI without forking the
renderer.

```tsx
import {
  FormStackProvider,
  FormStackViewport,
  Breadcrumbs,
  useFormStackState,
  useFormStackActions,
} from 'geoform';

// Dialog / DialogTitle / DialogContent below are illustrative — e.g. from
// @mui/material. Any window primitive that gives you an open/onClose + a body
// slot works; geoform has no hard MUI dependency.
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

A few things to notice in the host above:

- **One window, unbounded nesting.** Opening a child form replaces the visible body
  (the parent stays mounted but hidden, state preserved); the `<DialogTitle>`
  becomes breadcrumbs; nesting is unbounded (N deep).
- **Escape / backdrop cancels the top form.** The host's close gesture is wired to
  `cancelForm()`. With MUI's `<Dialog>`, a single `onClose` handler covers both the
  Escape key and the backdrop click — so closing the modal cancels the top form
  (honoring `confirmOnCancel`) while leaving deeper forms intact. The host owns the
  window's close gesture; geoform owns the stack's cancel semantics.
- **`<FormStackViewport/>` renders nothing when empty.** `Dialog open={stack.length > 0}`
  keeps the window closed until a form is actually open.

> **Guarantees:** with `autoRender={false}` and exactly one `<FormStackViewport/>`
> mounted, an open form renders **exactly once** — the renderer is not duplicated.
> The promise contract of `openForm()` is **unchanged**, so existing callers (e.g.
> `ExpandingAutocomplete`) need no edits. Mounting more than one
> `<FormStackViewport/>` while `autoRender={false}` would render the stack multiple
> times — don't.

@see the [`autoRender`](#formstackprovider) prop on `<FormStackProvider/>`, and
[Common Pitfalls > Forgetting `<FormStackViewport/>`](#forgetting-formstackviewport-with-autorenderfalse).

## Common Pitfalls

Avoid these common mistakes when working with geoform to ensure your forms work as intended.

### Calling closeForm() Directly Instead of Using onSubmit/onCancel

**Problem**: Calling `closeForm()` directly from a form component bypasses the Promise resolution pattern.

**❌ BAD** - Direct closeForm call in a form component:
```tsx
// src/components/MyForm.tsx
function MyForm({ onSubmit, onCancel }: FormProps<Data>) {
  const { closeForm } = useFormStack();

  const handleSave = () => {
    onSubmit(data);
    closeForm(); // WRONG! FormStackRenderer handles this via onSubmit
  };
}
```

**✅ GOOD** - Use onSubmit/onCancel props:
```tsx
// src/components/MyForm.tsx
function MyForm({ onSubmit, onCancel }: FormProps<Data>) {
  const handleSave = () => {
    onSubmit(data); // FormStackRenderer will call closeForm() internally
  };

  const handleCancel = () => {
    onCancel(); // FormStackRenderer will call closeForm() internally
  };
}
```

**Why it's problematic**: Direct `closeForm()` calls dispatch `POP_FORM` directly to the reducer, bypassing the Promise resolution pattern that `openForm()` returns. This breaks the parent's `await` and can cause unexpected behavior.

**Valid use case**: Programmatic form closure from a parent component (outside the form stack) is appropriate:

```tsx
// ParentComponent.tsx
function ParentComponent() {
  const { closeForm, stack } = useFormStack();

  const handleEmergencyClose = () => {
    while (stack.length > 0) {
      closeForm(); // OK: Called from outside the form stack
    }
  };
}
```

@see [API Reference > useFormStack](#useformstack) for more details.

### Expecting URL Sync to Auto-Restore Forms

**Problem**: Forms don't automatically render when sharing URLs with form stack state.

**❌ BAD** - Expecting auto-restore:
```tsx
// App.tsx
function App() {
  // ❌ This won't auto-restore forms from URL
  useFormStackURLSync();
  return <MyApp />;
}
```

**✅ GOOD** - Implementing onRestore callback:
```tsx
// App.tsx
function getFormComponent(formId: string) {
  switch (formId) {
    case 'user-form':
      return { component: UserForm, label: 'User' };
    case 'org-form':
      return { component: OrgForm, label: 'Organization' };
    default:
      console.warn(`Unknown form ID: ${formId}`);
      return null;
  }
}

function URLSyncedApp() {
  const { openForm } = useFormStack();
  const { isRestoring } = useFormStackURLSync({
    paramName: 'forms',
    onRestore: async (formIds) => {
      for (const formId of formIds) {
        const entry = getFormComponent(formId);
        if (entry) {
          await openForm({
            id: formId,
            component: entry.component,
            label: entry.label,
          });
        }
      }
    },
  });

  if (isRestoring) {
    return <div>Restoring forms...</div>;
  }

  return <MyApp />;
}
```

**Why it doesn't work**: geoform does not include a form registry. This is an intentional design decision—the library treats forms as black-box components managed by you. URL sync can encode form IDs but cannot auto-restore forms without component references.

> **Note**: A form registry would add complexity and reduce flexibility. Manual restoration keeps the library simple and gives you full control over which forms can be opened via URL.

@see [Advanced Usage > URL Sync > Form Restoration](#form-restoration) for complete implementation guide.

### Using Retry for Structural Errors vs Transient Errors

**Problem**: Clicking "Try Again" for structural errors will always fail.

**❌ BAD** - Expecting retry to fix structural errors:
```tsx
// This form will ALWAYS throw - props are invalid
<UserForm userId={undefined} />  // Component requires userId prop
```
When this form throws and the error boundary appears, clicking "Try Again" won't help—the prop is still `undefined`.

**✅ GOOD** - Use Dismiss for structural errors:
```tsx
// Fix the underlying prop issue
<UserForm userId={validId} />  // Valid prop
```
Or click "Dismiss" to close the form and fix the prop in the parent component.

**Why retry sometimes doesn't work**: The retry mechanism increments `retryCount` to force a component remount, but children receive the **exact same props** as before the error.

- **✅ Retry works for transient errors**:
  - Network failures that may succeed on retry
  - Temporary rendering bugs or race conditions
  - Component state corruption that resets on remount

- **❌ Retry won't work for structural errors**:
  - Invalid or malformed props (like `undefined` userId)
  - Type mismatches or missing required data
  - Logic errors in the component's render method

@see [API Reference > FormErrorBoundary](#formerrorboundary) for error handling patterns.

### Forgetting to Wrap App in FormStackProvider

**Problem**: All geoform hooks must be used within a `FormStackProvider`.

**❌ BAD** - Missing provider:
```tsx
// App.tsx
function App() {
  return <MyApp />;  // No provider!
}

function MyApp() {
  const { openForm } = useFormStack();  // ❌ THROWS ERROR
  // Error: useFormStackState must be used within a FormStackProvider
}
```

**✅ GOOD** - Proper provider setup:
```tsx
// App.tsx
function App() {
  return (
    <FormStackProvider>
      <MyApp />
    </FormStackProvider>
  );
}

function MyApp() {
  const { openForm } = useFormStack();  // ✅ Works!
}
```

**Error you'll see**: `useFormStackState must be used within a FormStackProvider`

@see [API Reference > FormStackProvider](#formstackprovider) for provider setup.

### Calling useFormStack Outside Provider

**Problem**: Using geoform hooks outside the provider context causes runtime errors.

**❌ BAD** - Hook outside provider:
```tsx
// utils.ts - file outside React component tree
export function openUserForm() {
  const { openForm } = useFormStack();  // ❌ THROWS ERROR
  // Error: useFormStackState must be used within a FormStackProvider
}
```

**✅ GOOD** - Hook inside provider (within React component):
```tsx
// UserButton.tsx - React component within provider tree
function UserButton() {
  const { openForm } = useFormStack();  // ✅ Works!

  const handleClick = async () => {
    const result = await openForm({
      id: 'user-form',
      component: UserForm,
      label: 'User',
    });
    if (result) {
      console.log('Created user:', result);
    }
  };

  return <button onClick={handleClick}>Create User</button>;
}
```

**Error you'll see**: `useFormStackState must be used within a FormStackProvider`

> **Note**: React hooks (including geoform hooks) can only be called from React function components or other hooks. They cannot be called from regular functions, utility modules, or class components.

### Not Handling Async Form Submission Properly

**Problem**: Not understanding the Promise-based form submission pattern.

**❌ BAD** - Not awaiting or checking result:
```tsx
// ParentComponent.tsx
function ParentComponent() {
  const { openForm } = useFormStack();

  const handleClick = () => {
    openForm<UserData>({
      id: 'create-user',
      component: UserForm,
      label: 'Create User',
    });
    // ❌ Not awaiting! Can't use result.
  };
}
```

**✅ GOOD** - Async/await with result handling:
```tsx
// ParentComponent.tsx
function ParentComponent() {
  const { openForm } = useFormStack();

  const handleClick = async () => {
    const result = await openForm<UserData>({
      id: 'create-user',
      component: UserForm,
      label: 'Create User',
    });

    if (result) {
      // User submitted - result is UserData
      console.log('Created user:', result.name);
    } else {
      // User cancelled - result is undefined
      console.log('User cancelled');
    }
  };
}
```

**How it works**: `openForm()` returns a `Promise<T | undefined>` that resolves when the form closes:
- **Submit**: Resolves with the value passed to `onSubmit(value)`
- **Cancel**: Resolves with `undefined`

The form component itself should just call `onSubmit(data)` or `onCancel()`—the Promise pattern is handled by geoform.

@see [Core Concepts > Promise-Based API](#promise-based-api) and [API Reference > useFormStack](#useformstack).

## TypeScript

### Basic Usage

TypeScript infers types automatically in most cases:

```tsx
function UserForm({ onSubmit, onCancel }: FormProps<UserData>) {
  // onSubmit is typed as (value: UserData) => void
}
```

### Typed Form Data

Define your data type and use it with `FormProps<T>`:

```tsx
interface UserData {
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

function UserForm({ onSubmit, onCancel }: FormProps<UserData>) {
  const handleSubmit = () => {
    onSubmit({
      name: 'John',
      email: 'john@example.com',
      role: 'member',  // TypeScript enforces valid values
    });
  };
}
```

### Typed openForm

Specify the type parameter to get typed results:

```tsx
const result = await openForm<UserData>({
  id: 'create-user',
  component: UserForm,
  label: 'Create User',
});

if (result) {
  // result is typed as UserData
  console.log(result.name);   // OK
  console.log(result.email);  // OK
  console.log(result.foo);    // TypeScript Error!
}
```

### Type Flow

Types flow from form definition through to result:

```
FormProps<T> → OpenFormOptions<T> → Promise<T | undefined>
```

This ensures type safety from form creation to result handling.

## Examples

See the [examples/relational-forms](./examples/relational-forms) directory for a complete working example demonstrating:

- Three-level form hierarchy: Organization → Team → User
- State preservation across nested forms
- Breadcrumb navigation
- Confirmation dialogs
- Type-safe form data flow

## Browser Support

geoform targets modern browsers with ES2020+ support. The `ConfirmationDialog` component uses the native HTML `<dialog>` element for accessible modal dialogs.

### Minimum Browser Versions

| Browser | Minimum Version | <dialog> Support | Notes |
|---------|----------------|------------------|-------|
| Chrome | 37+ | ✅ Native | Full support including showModal() |
| Firefox | 98+ | ✅ Native | Required preference flag in earlier versions |
| Safari | 15.4+ | ✅ Native | iOS Safari 15.4+ also supported |
| Edge | 79+ | ✅ Native | Chromium-based Edge |
| Opera | 24+ | ✅ Native | Based on Chromium |
| Internet Explorer | All | ❌ No | Requires polyfill |

**Global Support**: ~98.5% of users have native support ([source](https://caniuse.com/dialog))

### Feature Detection

The `ConfirmationDialog` component includes runtime feature detection:

```typescript
// Feature detection implemented in ConfirmationDialog
if (typeof dialog.showModal === 'function') {
  dialog.showModal();
}
```

This prevents errors in browsers without native `<dialog>` support—the component simply won't render the modal in those browsers.

### Polyfill for Older Browsers

If you need to support older browsers (Internet Explorer, Safari < 15.4, Firefox < 98), use the [GoogleChrome/dialog-polyfill](https://github.com/GoogleChrome/dialog-polyfill):

```bash
npm install dialog-polyfill
```

Then register the polyfill before using `ConfirmationDialog`:

```tsx
import dialogPolyfill from 'dialog-polyfill';

// In your app initialization or component
useEffect(() => {
  const dialog = dialogRef.current;
  if (dialog && typeof HTMLDialogElement === 'undefined') {
    dialogPolyfill.registerDialog(dialog);
  }
}, []);
```

### Other Requirements

- **React**: 18.0.0 or 19.0.0
- **SSR**: Safe for server-side rendering (feature detection checks for `window`)
- **Bundle Size**: Zero runtime dependencies beyond React

For current browser support statistics, see [caniuse.com/dialog](https://caniuse.com/dialog).

## Contributing

Contributions are welcome! Please:

1. Open an issue to discuss proposed changes
2. Fork the repository and create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass: `npm test`
5. Submit a pull request

## License

[MIT](./LICENSE)
