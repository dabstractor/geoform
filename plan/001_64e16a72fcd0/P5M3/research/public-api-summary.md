# Geoform Public API Summary

## Overview

Geoform is a batteries-included React system for managing infinitely nestable hierarchical forms where users may create required relational data at any point without enforced order.

## Exported Components

### FormStackProvider

- **Purpose**: Provider component that enables form stack functionality
- **Props**: `children: ReactNode`
- **Usage**: Wrap application to enable useFormStack hooks

### Breadcrumbs

- **Purpose**: Displays form stack as navigable breadcrumbs
- **Props**: `separator?: ReactNode`, `className?: string`, `ariaLabel?: string`
- **CSS Classes**: `.breadcrumbs`, `.breadcrumbs__list`, `.breadcrumbs__item`, `.breadcrumbs__link`, `.breadcrumbs__current`, `.breadcrumbs__separator`

### ConfirmationDialog

- **Purpose**: Accessible confirmation dialog for cancellation
- **Props**: `isOpen`, `title`, `message`, `confirmLabel`, `cancelLabel`, `onConfirm`, `onCancel`
- **CSS Classes**: `.confirmation-dialog`, `.confirmation-dialog__content`, `.confirmation-dialog__title`, `.confirmation-dialog__message`, `.confirmation-dialog__actions`, `.confirmation-dialog__button`, `.confirmation-dialog__button--cancel`, `.confirmation-dialog__button--confirm`

### FormErrorBoundary

- **Purpose**: Error boundary for form error isolation
- **Props**: `children`, `formId`, `onDismiss`, `onError?`, `fallback?`
- **CSS Classes**: `.form-error-boundary`, `.form-error-boundary__container`, `.form-error-boundary__title`, `.form-error-boundary__message`, `.form-error-boundary__actions`, `.form-error-boundary__retry-button`, `.form-error-boundary__dismiss-button`

## Exported Hooks

### useFormStack

- **Returns**: `{ stack, openForm, closeForm }`
- **Purpose**: Primary hook for form interactions
- **Re-renders**: On stack changes

### useFormStackState

- **Returns**: `{ stack }`
- **Purpose**: Read-only state access
- **Re-renders**: On stack changes

### useFormStackActions

- **Returns**: `{ openForm, closeForm, popToIndex }`
- **Purpose**: Actions-only access
- **Re-renders**: Never (stable references)

### useFormStackURLSync

- **Options**: `paramName?`, `restoreOnMount?`, `syncToUrl?`, `syncFromUrl?`, `onRestore?`
- **Returns**: `{ isRestoring, getUrlState, forceUrlUpdate }`
- **Purpose**: Bidirectional URL sync

## Exported Types

### FormProps<T>

```typescript
interface FormProps<T = unknown> {
  onSubmit: (value: T) => void;
  onCancel: () => void;
  onError?: (error: unknown) => void;
}
```

### OpenFormOptions<T>

```typescript
interface OpenFormOptions<T = unknown> {
  id: string;
  component: ComponentType<FormProps<T>>;
  label?: string;
  confirmOnCancel?: boolean;
}
```

### StackEntry

```typescript
interface StackEntry {
  id: string;
  label?: string;
}
```

### FormStackState

```typescript
interface FormStackState {
  stack: readonly StackEntry[];
}
```

### FormStackActions

```typescript
interface FormStackActions {
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  closeForm: () => void;
  popToIndex: (index: number) => void;
}
```

## Architecture Notes

### Dual-Context Pattern

- `FormStackStateContext` - state, triggers re-renders
- `FormStackActionsContext` - actions, stable references

### Promise-Based API

- `openForm()` returns `Promise<T | undefined>`
- Resolves with `T` on submit, `undefined` on cancel

### Hidden Container Pattern

- All forms rendered to DOM
- Inactive forms hidden with CSS (`display: none`)
- Preserves React state across form lifecycle
