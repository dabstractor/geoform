# System Context — geoform Bug Fix (Adversarial QA Remediation)

## Baseline at Audit Time

- `npx tsc --noEmit` → exit 0 (clean)
- `npx vitest run` → **294 / 294** tests pass across **26** files (0 failures)
- Source root: `src/`
- Build output: `dist/` (tsup, entry `src/index.ts`)
- Test framework: Vitest 2.1 + @testing-library/react 16 + jsdom 25
- React peer dep: `^18.0.0 || ^19.0.0` (dev uses `@types/react@^19`)

## Architecture Overview

### Dual-Context Pattern

The system splits state from actions to minimize re-renders:

```
FormStackProvider
├── FormStackStateContext      → { stack: readonly StackEntry[] }  (re-renders on change)
├── FormStackActionsContext    → { openForm, closeForm, popToIndex, cancelForm }  (stable refs)
├── FormStackViewportContext   → internal renderer props | null    (re-renders on change)
└── FormStackViewportMountContext → (delta: number) => void        (mount tracking)
```

### Key Files & Responsibilities

| File | Role |
|------|------|
| `src/components/FormStackProvider.tsx` | Main provider. `useReducer` + `useState`. Contains `openForm`, `closeForm`, `popToIndex`, `cancelForm`, `requestConfirmation`, confirmation handlers. |
| `src/components/FormStackRenderer.tsx` | Renders stack with hidden-container pattern. Creates inline `handleSubmit`/`handleCancel`/`handleError` per entry. Keys by `entry.id`. |
| `src/components/FormErrorBoundary.tsx` | Class-component error boundary with Retry/Dismiss. Catches *render*-phase errors only (React limitation). |
| `src/components/FormStackViewport.tsx` | Zero-prop component. Reads viewport context, spreads onto `<FormStackRenderer>`. |
| `src/components/Breadcrumbs.tsx` | Navigation component. Keys by `entry.id`. |
| `src/components/ConfirmationDialog.tsx` | Native `<dialog>` element. Confirm/Cancel buttons. |
| `src/context/formStackReducer.ts` | Pure reducer: PUSH_FORM, POP_FORM, POP_TO_INDEX. |
| `src/types/stack.ts` | `StackEntry` ({id, label?}), `InternalStackEntry` (adds component, confirmOnCancel, deferred), `OpenFormOptions`. |
| `src/types/context.ts` | `FormStackState`, `FormStackActions`, `FormStackViewportValue`, `FormStackAction`, `FormStackReducerState`. |
| `src/types/form.ts` | `FormProps<T>` (onSubmit, onCancel, onError?), `DeferredPromise<T>`. |
| `src/hooks/useFormStackViewport.ts` | Public low-level hook. Currently returns context value directly (leaks internals). |
| `src/utils/createDeferredPromise.ts` | Factory for `{ promise, resolve, reject }`. |

### Type Hierarchy

```
StackEntry (public)            → { id: string; label?: string }
InternalStackEntry<T> (internal) → extends StackEntry + { component, confirmOnCancel, deferred }
DeferredPromise<T>             → { promise, resolve, reject }
```

`FormStackState.stack` = `readonly StackEntry[]` (sanitized) ✓
`FormStackViewportValue.stack` = `InternalStackEntry<unknown>[]` (LEAKS — Issue 3) ✗
`FormStackRendererProps.stack` = `InternalStackEntry<unknown>[]` (internal, correct)

### Error Handling — Two Channels (Currently Inconsistent)

1. **Render error** (thrown during render): Caught by `FormErrorBoundary.getDerivedStateFromError`. Shows Retry/Dismiss UI. Does NOT auto-pop stack. `openForm()` stays pending. **Compliant with PRD §9.** ✓

2. **Form-invoked `onError`** (called by form component via injected prop): Currently handled by `FormStackRenderer.handleError` which **rejects the deferred AND calls onClose()** (pops stack). **Non-compliant with PRD §9.** ✗ (Issue 1)

### Confirmation System

`FormStackProvider` uses a **single** `useState<PendingConfirmation | null>` slot:
- `requestConfirmation(affectedForms)` → creates a Promise, stores `{ affectedForms, resolve }`
- `handleConfirmationConfirm` → calls `pendingConfirmation.resolve(true)`, clears slot
- `handleConfirmationCancel` → calls `pendingConfirmation.resolve(false)`, clears slot

Both `cancelForm()` and `popToIndex()` call `requestConfirmation`. A second request **overwrites** the slot, orphaning the first `resolve`. **Issue 2.**

## Documentation Targets

| File | Sections Affected |
|------|-------------------|
| `README.md` | Error Boundaries (§~737), FormStackViewportValue (§~603), FormProps (§~496), FormErrorBoundary (§~245) |
| `src/types/form.ts` | `FormProps.onError` JSDoc |
| `src/types/context.ts` | `FormStackViewportValue` JSDoc |
| `src/components/FormErrorBoundary.tsx` | JSDoc (new `showError` method) |

## Test Conventions

- Integration tests use `render()` + `screen` + `fireEvent`/`userEvent` from @testing-library/react
- Hook tests use `renderHook()` + `act()`
- Unit tests for reducer/deferred use plain Vitest
- Pattern: Arrange → Act → Assert with inline comments
- `console.error` is suppressed/mocked for expected error boundary tests
- Test files: `__tests__/` subdirectory co-located with source
