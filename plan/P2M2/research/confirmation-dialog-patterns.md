# Confirmation Dialog Patterns for React

## Overview

This research document provides comprehensive guidance on implementing cancellation confirmation dialogs in vanilla React. The focus is on patterns that work without external dependencies while maintaining full accessibility compliance with WAI-ARIA standards.

## 1. React Patterns for Modal/Dialog Components

### 1.1 Core Approaches

There are three primary patterns for implementing modal dialogs in React:

#### A. Native HTML5 `<dialog>` Element (Recommended)
The modern approach leverages the native HTML5 `<dialog>` element combined with React state management.

**Advantages:**
- Native browser support with built-in backdrop and modality
- Automatic escape key handling
- Simpler implementation without third-party libraries
- Better semantic HTML
- CSS `::backdrop` pseudo-element for styling

**Key Methods:**
- `.showModal()` - Display modal dialog that makes content outside inert
- `.show()` - Display non-modal dialog (rest of page remains interactive)
- `.close()` - Close the dialog
- `onCancel` event - Fires when escape key is pressed

**React Implementation Pattern:**
```jsx
import { useEffect, useRef, useState } from 'react';

function ConfirmationDialog({ isOpen, onClose, onConfirm, title, message }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <h2 id="dialog-title">{title}</h2>
      <p id="dialog-description">{message}</p>
      <div>
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }}>Confirm</button>
      </div>
    </dialog>
  );
}
```

**Critical Pattern Note:** React state (`isOpen`) must be the source of truth. Use `useEffect` to sync with the dialog's `.showModal()` and `.close()` methods. Do NOT use the `open` attribute directly as it creates non-modal dialogs and can cause state sync issues.

#### B. Portal-Based Custom Dialog
Using `ReactDOM.createPortal` to render dialog content outside the DOM hierarchy, bypassing CSS constraints like `overflow: hidden`.

**Advantages:**
- Complete control over styling and behavior
- Escapes CSS overflow constraints
- Flexible positioning

**Implementation Pattern:**
```jsx
import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';

function PortalDialog({ isOpen, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog-content"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
```

**Key Point:** Events bubble through the React tree, not the DOM tree. An `onClick` handler on the portal wrapper will fire even if the element is rendered in `document.body`.

#### C. Controlled Component Pattern (Most React-Like)
Full React state management without relying on browser APIs.

**Pattern:**
```jsx
function ConfirmDialog({ open, onOpenChange, onConfirm, title, message }) {
  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <h2 id="dialog-title">{title}</h2>
      <p>{message}</p>
      <button onClick={() => onOpenChange(false)}>Cancel</button>
      <button onClick={() => {
        onConfirm();
        onOpenChange(false);
      }}>
        Confirm
      </button>
    </div>
  );
}
```

### 1.2 Compound Component Pattern

For better API design and flexibility:

```jsx
function Dialog({ open, onOpenChange, children }) {
  return open ? <DialogContent onClose={() => onOpenChange(false)}>{children}</DialogContent> : null;
}

function DialogTitle({ children }) {
  return <h2 id="dialog-title">{children}</h2>;
}

function DialogDescription({ children }) {
  return <p id="dialog-description">{children}</p>;
}

// Usage
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTitle>Delete Item?</DialogTitle>
  <DialogDescription>This cannot be undone.</DialogDescription>
  <button>Cancel</button>
  <button>Confirm</button>
</Dialog>
```

### 1.3 Global Modal Management

For app-level dialogs accessible from anywhere:

```jsx
// Modal context
const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modals, setModals] = useState([]);

  const openModal = (Modal, props) => {
    const id = Math.random();
    setModals(prev => [...prev, { id, Modal, props }]);
    return id;
  };

  const closeModal = (id) => {
    setModals(prev => prev.filter(m => m.id !== id));
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modals.map(({ id, Modal, props }) => (
        <Modal key={id} {...props} onClose={() => closeModal(id)} />
      ))}
    </ModalContext.Provider>
  );
}

// Usage from anywhere
const { openModal } = useContext(ModalContext);
openModal(ConfirmDialog, { title: 'Delete?', onConfirm: () => deleteItem() });
```

---

## 2. Accessible Dialog Implementation (WAI-ARIA)

### 2.1 Required ARIA Attributes

Based on [W3C WAI-ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/):

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `role="dialog"` | Identifies element as dialog | Standard dialogs |
| `role="alertdialog"` | Special dialog for urgent messages | Confirmation dialogs |
| `aria-modal="true"` | Indicates content outside is inert | All modal dialogs |
| `aria-labelledby` | References visible title | `aria-labelledby="dialog-title"` |
| `aria-describedby` | Optional: references description | `aria-describedby="dialog-desc"` |
| `aria-label` | When no visible title exists | `aria-label="Confirm deletion"` |

**Implementation:**
```jsx
<div
  role="alertdialog"
  aria-modal="true"
  aria-labelledby="confirm-title"
  aria-describedby="confirm-desc"
>
  <h2 id="confirm-title">Delete Item?</h2>
  <p id="confirm-desc">This action cannot be undone.</p>
  <button>Cancel</button>
  <button>Confirm</button>
</div>
```

**Special Case for Alert Dialogs:**
The `alertdialog` role is designed specifically for dialogs that interrupt to show important messages. Use this for confirmation dialogs and critical actions.

### 2.2 Focus Management Requirements

#### Initial Focus
When a dialog opens, focus must move to an element inside it. The placement depends on content:

1. **For semantic structures** (lists, tables): Focus static element with `tabindex="-1"` at start
2. **For large content**: Focus dialog title to prevent unnecessary scrolling
3. **For high-stakes actions** (delete, transaction): Focus the least destructive button (usually "Cancel")

**Pattern for confirmation dialogs (focusing cancel button):**
```jsx
function ConfirmationDialog({ onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    // Focus cancel button on mount for destructive action
    cancelRef.current?.focus();
  }, []);

  return (
    <div role="alertdialog" aria-modal="true">
      <p>Are you sure?</p>
      <button ref={cancelRef} onClick={onCancel}>Cancel</button>
      <button onClick={onConfirm}>Delete</button>
    </div>
  );
}
```

#### Focus Restoration
When dialog closes, focus must return to the element that opened it:

```jsx
function DialogWithFocusRestore({ isOpen, onClose, triggerRef }) {
  const dialogRef = useRef(null);

  const handleClose = () => {
    // Restore focus to trigger element
    triggerRef.current?.focus();
    onClose();
  };

  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true">
      {/* content */}
      <button onClick={handleClose}>Close</button>
    </div>
  );
}
```

### 2.3 Keyboard Interaction Requirements

Based on WAI-ARIA pattern, these are **mandatory**:

| Key | Behavior |
|-----|----------|
| `Tab` | Cycle forward through focusable elements; wrap from last to first |
| `Shift + Tab` | Cycle backward; wrap from first to last |
| `Escape` | Close dialog and return focus to trigger |

**Focus Trapping Implementation:**
```jsx
function useFocusTrap(ref, isActive) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const dialog = ref.current;
    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab on first element -> focus last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab on last element -> focus first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [ref, isActive]);
}
```

**Usage:**
```jsx
function AccessibleDialog({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={dialogRef} role="alertdialog" aria-modal="true">
      {/* content */}
    </div>
  );
}
```

### 2.4 Screen Reader Considerations

- Use semantic HTML (`<h2>` for title, `<p>` for description)
- Reference visible text with `aria-labelledby` (not generic `aria-label`)
- Avoid overly complex structures; simpler is more accessible
- Announce dialog state to screen readers via `aria-modal="true"`
- For semantic content (lists, paragraphs), omit `aria-describedby` and let screen reader read naturally

---

## 3. React 18+ Patterns for Portal-Based Modals

### 3.1 Using `createPortal`

[React 18 Portal Documentation](https://react.dev/reference/react-dom/createPortal)

**Basic syntax:**
```jsx
import { createPortal } from 'react-dom';

function Modal({ children }) {
  return createPortal(
    children,
    document.getElementById('modal-root')
  );
}
```

**Setup:**
1. Add portal container to HTML:
```html
<div id="root"></div>
<div id="modal-root"></div>
```

2. Render modal using portal:
```jsx
{isOpen && createPortal(
  <DialogContent onClose={onClose} />,
  document.getElementById('modal-root')
)}
```

### 3.2 Portal Event Bubbling

**Important:** Events bubble through the **React tree**, not the DOM tree:

```jsx
// onClick handler fires even though portal is in document.body
<div onClick={handler}>
  {createPortal(<Child />, document.body)}
</div>
```

This is usually desirable for event handling but requires careful implementation to avoid unintended captures.

### 3.3 Portal with HTML5 Dialog

Combining native dialog element with portal:

```jsx
function DialogPortal({ open, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  return createPortal(
    <dialog ref={dialogRef} onCancel={onClose}>
      {children}
    </dialog>,
    document.body
  );
}
```

### 3.4 Context Preservation with Portals

Portals maintain React context even when rendered in different DOM locations:

```jsx
function MyApp() {
  return (
    <ThemeProvider>
      <MainContent />
      {/* Portal has access to ThemeProvider context */}
      {showDialog && createPortal(
        <Dialog />,
        document.body
      )}
    </ThemeProvider>
  );
}
```

---

## 4. Async Confirmation Flows

### 4.1 Promise-Based Async Pattern (Recommended)

The core pattern uses Promises to allow awaiting user confirmation before proceeding:

**Hook Implementation:**
```jsx
export function useConfirmation() {
  const [pendingPromise, setPendingPromise] = useState(null);
  const [config, setConfig] = useState(null);

  const confirm = (confirmConfig) => {
    return new Promise((resolve) => {
      setPendingPromise({ resolve });
      setConfig(confirmConfig);
    });
  };

  const handleConfirm = () => {
    if (pendingPromise) {
      pendingPromise.resolve(true);
      setPendingPromise(null);
      setConfig(null);
    }
  };

  const handleCancel = () => {
    if (pendingPromise) {
      pendingPromise.resolve(false);
      setPendingPromise(null);
      setConfig(null);
    }
  };

  return {
    confirm,
    handleConfirm,
    handleCancel,
    config,
    isPending: !!pendingPromise,
  };
}
```

**Usage in Component:**
```jsx
function MyComponent() {
  const { confirm, handleConfirm, handleCancel, config, isPending } = useConfirmation();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Item?',
      message: 'This cannot be undone.',
    });

    if (confirmed) {
      // Perform deletion
      deleteItem();
    }
  };

  return (
    <>
      <button onClick={handleDelete}>Delete</button>

      {isPending && (
        <ConfirmDialog
          title={config.title}
          message={config.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
```

### 4.2 Provider-Based Global Confirmation

For app-level confirmation accessible anywhere:

```jsx
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const confirmationHook = useConfirmation();

  return (
    <ConfirmContext.Provider value={confirmationHook}>
      {children}
      {confirmationHook.isPending && (
        <GlobalConfirmDialog {...confirmationHook} />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmProvider');
  }
  return context.confirm;
}

// Usage anywhere in app:
function SomeComponent() {
  const confirm = useConfirmDialog();

  const handleAction = async () => {
    const confirmed = await confirm({
      title: 'Proceed?',
      message: 'Continue with this action?',
    });

    if (confirmed) {
      // Do action
    }
  };

  return <button onClick={handleAction}>Action</button>;
}
```

### 4.3 Action Interception Pattern

Intercepting an action and showing confirmation before execution:

**Higher-Order Pattern:**
```jsx
export function withConfirmation(action, confirmConfig) {
  return async (...args) => {
    const confirmed = await confirm(confirmConfig);
    if (confirmed) {
      return action(...args);
    }
  };
}
```

**Usage:**
```jsx
const deleteWithConfirmation = withConfirmation(
  (id) => deleteItem(id),
  { title: 'Delete?', message: 'Confirm deletion' }
);

<button onClick={() => deleteWithConfirmation(itemId)}>Delete</button>
```

**Hook Pattern (More Flexible):**
```jsx
export function useConfirmedAction(action, confirmConfig) {
  const confirm = useConfirmDialog();

  return async (...args) => {
    const confirmed = await confirm(confirmConfig);
    if (confirmed) {
      return action(...args);
    }
  };
}

// Usage:
function DeleteButton({ itemId }) {
  const confirmedDelete = useConfirmedAction(
    (id) => deleteItem(id),
    { title: 'Delete Item?', message: 'This action cannot be undone.' }
  );

  return (
    <button onClick={() => confirmedDelete(itemId)}>
      Delete
    </button>
  );
}
```

### 4.4 Async Validation During Dialog

For long-running operations during confirmation:

```jsx
function ConfirmDialogWithLoading({ title, message, onConfirm, onCancel, isLoading }) {
  return (
    <dialog open role="alertdialog" aria-modal="true">
      <h2>{title}</h2>
      <p>{message}</p>
      <button onClick={onCancel} disabled={isLoading}>
        Cancel
      </button>
      <button onClick={onConfirm} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Confirm'}
      </button>
    </dialog>
  );
}

// Hook for managing async confirmation:
export function useAsyncConfirmation() {
  const [isLoading, setIsLoading] = useState(false);
  const { confirm, ...rest } = useConfirmation();

  const confirmAsync = async (config, asyncAction) => {
    const confirmed = await confirm(config);
    if (confirmed) {
      setIsLoading(true);
      try {
        await asyncAction();
      } finally {
        setIsLoading(false);
      }
    }
  };

  return { confirmAsync, isLoading, ...rest };
}
```

---

## 5. State Management Patterns for Dialogs

### 5.1 Controlled vs Uncontrolled Dialogs

#### Controlled Dialog (Recommended for Complex Scenarios)
Parent component manages all state:

```jsx
function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={() => { /* action */ }}
      />
    </>
  );
}

function ConfirmDialog({ open, onOpenChange, onConfirm }) {
  return open ? (
    <dialog>
      {/* content */}
      <button onClick={() => onOpenChange(false)}>Cancel</button>
      <button onClick={() => {
        onConfirm();
        onOpenChange(false);
      }}>
        Confirm
      </button>
    </dialog>
  ) : null;
}
```

**Pros:**
- Single source of truth
- Easy to coordinate multiple dialogs
- Predictable behavior

**Cons:**
- More boilerplate in parent
- Prop drilling

#### Uncontrolled Dialog (Simpler Cases)
Dialog manages its own state:

```jsx
function SelfManagedDialog({ onConfirm, onCancel, title, message }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && (
        <dialog
          open={true}
          onCancel={() => setIsOpen(false)}
        >
          <h2>{title}</h2>
          <p>{message}</p>
          <button onClick={() => setIsOpen(false)}>Cancel</button>
          <button onClick={handleConfirm}>Confirm</button>
        </dialog>
      )}
    </>
  );
}
```

**Pros:**
- Simpler component API
- Less parent involvement

**Cons:**
- Harder to coordinate multiple dialogs
- Parent can't easily check if dialog is open

### 5.2 Reducer Pattern for Complex State

For dialogs with multiple states (idle, confirming, loading, error):

```jsx
const dialogReducer = (state, action) => {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

function ConfirmDialog() {
  const [state, dispatch] = useReducer(dialogReducer, {
    isOpen: false,
    isLoading: false,
    error: null,
  });

  const handleConfirm = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await performAction();
      dispatch({ type: 'CLOSE' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <dialog open={state.isOpen}>
      <h2>Confirm Action</h2>
      {state.error && <p className="error">{state.error}</p>}
      <button
        onClick={handleConfirm}
        disabled={state.isLoading}
      >
        {state.isLoading ? 'Loading...' : 'Confirm'}
      </button>
      <button onClick={() => dispatch({ type: 'CLOSE' })}>
        Cancel
      </button>
    </dialog>
  );
}
```

### 5.3 Combination: Controlled + Async

Recommended pattern for most cases:

```jsx
function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await deleteItem();
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Delete</button>
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </>
  );
}
```

---

## 6. Library Patterns to Follow (Headless UI, Radix, etc.)

### 6.1 Radix Primitives Dialog Pattern

[Radix Dialog Documentation](https://www.radix-ui.com/primitives/docs/components/dialog)

**Key Features to Replicate:**
- Automatically manages focus (traps and restores)
- Handles Escape key
- Sets ARIA attributes automatically
- Supports controlled and uncontrolled modes
- Accessible descriptions and titles

**Vanilla Implementation Inspired by Radix:**
```jsx
const DialogContext = createContext(null);

export function Dialog({ open, defaultOpen = false, onOpenChange, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const actualOpen = open !== undefined ? open : isOpen;
  const handleOpenChange = onOpenChange || setIsOpen;

  return (
    <DialogContext.Provider value={{ isOpen: actualOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogContent({ children }) {
  const context = useContext(DialogContext);
  const contentRef = useRef(null);

  useFocusTrap(contentRef, context.isOpen);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        context.onOpenChange(false);
      }
    };

    if (context.isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [context.isOpen, context.onOpenChange]);

  if (!context.isOpen) return null;

  return (
    <div
      ref={contentRef}
      role="dialog"
      aria-modal="true"
      className="dialog"
    >
      {children}
    </div>
  );
}

export function DialogTitle({ children, id = 'dialog-title' }) {
  return <h2 id={id}>{children}</h2>;
}

export function DialogClose({ children, asChild = false }) {
  const context = useContext(DialogContext);
  const Element = asChild ? Fragment : 'button';

  return (
    <Element onClick={() => context.onOpenChange(false)}>
      {children}
    </Element>
  );
}

// Usage:
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogTitle>Delete Item?</DialogTitle>
    <p>This cannot be undone.</p>
    <DialogClose>Cancel</DialogClose>
    <button onClick={onConfirm}>Confirm</button>
  </DialogContent>
</Dialog>
```

### 6.2 Headless UI Dialog Pattern

[Headless UI Dialog Documentation](https://headlessui.com/react/dialog)

**Key Features to Replicate:**
- Simple controlled API with `open` and `onClose`
- Automatic portal rendering
- Built-in transition support
- Focus management
- Keyboard navigation

**Vanilla Implementation Inspired by Headless UI:**
```jsx
function Dialog({ open, onClose, children }) {
  const contentRef = useRef(null);

  useFocusTrap(contentRef, open);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        ref={contentRef}
        className="dialog-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
```

### 6.3 Base UI Dialog Pattern

**Key Features to Replicate:**
- Uncontrolled by default with optional control
- `open` and `onOpenChange` props for controlled mode
- Focus management built-in
- Escape key handling

**Vanilla Implementation:**
```jsx
function Dialog({
  open: controlledOpen,
  onOpenChange: onOpenChangeHandler,
  defaultOpen = false,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = (newOpen) => {
    if (onOpenChangeHandler) {
      onOpenChangeHandler(newOpen);
    }
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
  };

  return (
    <DialogContext.Provider value={{ isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}
```

---

## 7. Testing Patterns for Dialogs

### 7.1 Testing with React Testing Library

[Testing Library Modal Documentation](https://testing-library.com/docs/example-react-modal/)

**Basic Test Pattern:**
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ConfirmDialog', () => {
  it('should render when open', () => {
    render(<ConfirmDialog open={true} title="Delete?" />);
    expect(screen.getByText('Delete?')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button clicked', async () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmDialog
        open={true}
        onConfirm={onConfirm}
        title="Delete?"
      />
    );

    const confirmButton = screen.getByText('Confirm');
    await userEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button clicked', async () => {
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        open={true}
        onCancel={onCancel}
        title="Delete?"
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  it('should close on escape key', async () => {
    const onOpenChange = jest.fn();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Delete?"
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
```

### 7.2 Testing Focus Management

```jsx
describe('Focus Management', () => {
  it('should focus cancel button on open (for destructive action)', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete?"
      />
    );

    const cancelButton = screen.getByText('Cancel');
    expect(document.activeElement).toBe(cancelButton);
  });

  it('should restore focus to trigger element on close', async () => {
    const { rerender } = render(
      <>
        <button data-testid="trigger">Open</button>
        <ConfirmDialog
          open={false}
          title="Delete?"
        />
      </>
    );

    const trigger = screen.getByTestId('trigger');
    trigger.focus();

    // Open dialog
    rerender(
      <>
        <button data-testid="trigger">Open</button>
        <ConfirmDialog
          open={true}
          title="Delete?"
        />
      </>
    );

    // Close dialog
    rerender(
      <>
        <button data-testid="trigger">Open</button>
        <ConfirmDialog
          open={false}
          title="Delete?"
        />
      </>
    );

    expect(document.activeElement).toBe(trigger);
  });

  it('should trap focus within dialog', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open={true}
        title="Delete?"
      />
    );

    const buttons = screen.getAllByRole('button');
    const lastButton = buttons[buttons.length - 1];

    lastButton.focus();

    // Tab from last button should go to first button
    await user.tab();

    expect(document.activeElement).toBe(buttons[0]);
  });
});
```

### 7.3 Testing Async Confirmation

```jsx
describe('Async Confirmation', () => {
  it('should resolve to true when confirmed', async () => {
    const promise = confirm({
      title: 'Delete?',
      message: 'Confirm deletion'
    });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    const result = await promise;
    expect(result).toBe(true);
  });

  it('should resolve to false when cancelled', async () => {
    const promise = confirm({
      title: 'Delete?',
      message: 'Confirm deletion'
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    const result = await promise;
    expect(result).toBe(false);
  });

  it('should allow awaiting confirmation in async flow', async () => {
    const handleDelete = jest.fn();

    render(
      <DeleteButton onDelete={handleDelete} />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    const confirmButton = await screen.findByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(handleDelete).toHaveBeenCalled();
    });
  });
});
```

### 7.4 Testing Portal Rendering

When using portals, be aware that elements render in a different DOM container:

```jsx
it('should render modal in portal', () => {
  const { container } = render(
    <App />
  );

  // Modal renders in body, not in main container
  const modal = document.body.querySelector('[role="dialog"]');
  expect(modal).toBeInTheDocument();
});

// Use baseElement to access portals:
it('should find modal content in baseElement', () => {
  const { baseElement } = render(
    <ConfirmDialog open={true} title="Delete?" />
  );

  const title = baseElement.querySelector('[role="dialog"] h2');
  expect(title).toHaveTextContent('Delete?');
});
```

### 7.5 Testing with Native Dialog Element

Note: JSDOM doesn't fully support native dialog element methods (`showModal()`, `close()`):

```jsx
describe('Native Dialog Testing', () => {
  it('should render dialog element', () => {
    render(
      <ConfirmDialog open={true} title="Delete?" />
    );

    // Dialog element exists
    const dialog = document.querySelector('dialog');
    expect(dialog).toBeInTheDocument();
  });

  // For testing showModal() and close(), may need:
  // - jest-dom custom matchers
  // - Mock HTMLDialogElement methods
  // - Use E2E testing for full native dialog testing

  beforeEach(() => {
    // Mock showModal and close if testing native dialog methods
    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();
  });
});
```

---

## 8. Implementation Checklist

### Accessibility Requirements
- [ ] Dialog has `role="dialog"` or `role="alertdialog"`
- [ ] Dialog has `aria-modal="true"`
- [ ] Dialog has `aria-labelledby` referencing visible title
- [ ] Focus moves into dialog on open (preferably cancel button for destructive actions)
- [ ] Focus trapped within dialog (Tab/Shift+Tab cycle)
- [ ] Escape key closes dialog
- [ ] Focus restored to trigger element on close
- [ ] Dialog announced to screen readers
- [ ] All interactive elements are keyboard accessible

### Functionality
- [ ] Dialog opens when requested
- [ ] Dialog closes on cancel
- [ ] Dialog closes on confirm
- [ ] Dialog closes on escape key
- [ ] Dialog closes on overlay click (if applicable)
- [ ] Confirmation action executes only after user confirms
- [ ] Loading state displayed during async operations
- [ ] Error messages displayed if operations fail

### Testing
- [ ] Dialog renders when open
- [ ] Dialog doesn't render when closed
- [ ] Callbacks fire on confirm/cancel
- [ ] Keyboard navigation works
- [ ] Focus management works
- [ ] Async confirmation pattern works
- [ ] Accessibility attributes present

---

## References and Sources

- [W3C WAI-ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [W3C Modal Dialog Example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/)
- [MDN: WAI-ARIA Basics](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/WAI-ARIA_basics)
- [React: createPortal](https://react.dev/reference/react-dom/createPortal)
- [React: Portals](https://legacy.reactjs.org/docs/portals.html)
- [MDN: HTMLDialogElement.showModal()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal)
- [MDN: dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
- [Radix Primitives: Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Headless UI: Dialog](https://headlessui.com/react/dialog)
- [Testing Library: Modals](https://testing-library.com/docs/example-react-modal/)
- [React Testing Library: Portal Modal Testing](https://medium.com/@manojmukherjee777/react-testing-library-portal-modal-b05aaeb5dda7)
- [DEV Community: Control Dialog Asynchronously with React Hooks](https://dev.to/metamodal/control-a-dialog-box-asynchronously-using-react-hooks-4ik7)
- [Medium: React Custom Confirmation Box](https://daveteu.medium.com/react-custom-confirmation-box-458cceba3f7b)
- [Building an Accessible Modal Dialog in React](https://clhenrick.io/blog/react-a11y-modal-dialog/)
- [LogRocket: Creating Reusable Pop-up Modal in React](https://blog.logrocket.com/creating-reusable-pop-up-modal-react/)
- [LogRocket: Build Modal with React Portals](https://blog.logrocket.com/build-modal-with-react-portals/)
- [Medium: useConfirm Hook](https://medium.com/@kch062522/useconfirm-a-custom-react-hook-to-prompt-confirmation-before-action-f4cb746ebd4e)
- [Dev.to: Add Confirmation Dialog to React Events](https://itnext.io/add-confirmation-dialog-to-react-events-f50a40d9a30d)
