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

**Props:** None required. Children are rendered normally.

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
| `popToIndex` | `(index: number) => void` | Navigates to form at index |

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
}
```

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

- **React**: 18.0.0 or 19.0.0
- **Browsers**: Modern browsers supporting ES2020+ (Chrome, Firefox, Safari, Edge)
- **SSR**: Safe for server-side rendering (URL sync checks for `window`)
- **Bundle Size**: Zero runtime dependencies

## Contributing

Contributions are welcome! Please:

1. Open an issue to discuss proposed changes
2. Fork the repository and create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass: `npm test`
5. Submit a pull request

## License

[MIT](./LICENSE)
