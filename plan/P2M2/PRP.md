# PRP: Cancellation Confirmation (P2.M2)

**Milestone:** P2.M2 - Cancellation Confirmation
**Project:** React Hierarchical Form Stack System (geoform)
**Status:** Implementation-ready
**Estimated Story Points:** 3 SP
**Dependencies:** P2.M1 (Complete) - Breadcrumb Navigation

---

## Goal

**Feature Goal**: Implement a confirmation dialog system that intercepts form cancellation when `confirmOnCancel: true` is passed to `openForm()`. Users must explicitly confirm before a form is cancelled and its data discarded.

**Deliverable**:
- `src/components/ConfirmationDialog.tsx` - Accessible modal dialog component
- Updated `src/components/FormStackRenderer.tsx` - Integrate confirmation before cancel
- Updated `src/components/FormStackProvider.tsx` - Handle confirmation for popToIndex breadcrumb navigation
- Updated `src/index.ts` - Export ConfirmationDialog and ConfirmationDialogProps
- Unit tests for ConfirmationDialog component
- Integration tests for confirmation flow

**Success Definition**:
1. Forms opened with `confirmOnCancel: true` show confirmation dialog before cancelling
2. Clicking "Cancel" in dialog returns user to form (no cancellation occurs)
3. Clicking "Confirm" in dialog proceeds with cancellation (promise resolves with `undefined`)
4. Breadcrumb navigation to earlier forms triggers confirmation for any forms with `confirmOnCancel: true`
5. Dialog is fully accessible with proper ARIA attributes (`role="alertdialog"`, `aria-modal`, focus management)
6. Escape key closes confirmation dialog without cancelling the form
7. `npm run type-check` passes with zero errors
8. `npm run test` passes all tests
9. `npm run build` succeeds

---

## User Persona

**Target User**: React developer building forms with unsaved data that should prompt before discarding

**Use Case**: Applications where forms contain important user input that could be accidentally lost through cancel actions or breadcrumb navigation

**User Journey**:
1. Developer opens form with `confirmOnCancel: true`:
   ```tsx
   await openForm({
     id: 'edit-user',
     component: EditUserForm,
     label: 'Edit User',
     confirmOnCancel: true,
   });
   ```
2. User fills out the form with data
3. User clicks Cancel button or navigates via breadcrumb
4. Confirmation dialog appears: "Discard Changes? Your unsaved changes will be lost."
5. User clicks "Keep Editing" → returns to form with data intact
6. Or user clicks "Discard" → form closes, promise resolves with `undefined`

**Pain Points Addressed**:
- Accidental data loss from misclicks or navigation
- No warning before discarding important form input
- Frustration from having to re-enter data after accidental cancellation

---

## Why

- **PRD Requirement**: "If `confirmOnCancel` is true: Canceling shows a confirmation dialog" (PRD Section 8)
- **PRD Requirement**: "Confirmation dialog applies if any popped form is dirty" (PRD Section 7)
- **Data Protection**: Prevents accidental loss of user input
- **UX Best Practice**: Standard pattern for destructive actions
- **Foundation**: Uses existing `confirmOnCancel` option already defined in types but not implemented

---

## What

### Success Criteria

- [ ] ConfirmationDialog component renders accessible modal
- [ ] Dialog has `role="alertdialog"` for screen reader announcement
- [ ] Dialog has `aria-modal="true"` to indicate modal behavior
- [ ] Dialog has `aria-labelledby` referencing the title
- [ ] Dialog has `aria-describedby` referencing the message
- [ ] Focus moves to "Keep Editing" button when dialog opens (safe default)
- [ ] Tab/Shift+Tab cycles through focusable elements within dialog
- [ ] Escape key closes dialog without cancelling form
- [ ] Clicking backdrop (if present) does NOT close dialog (destructive confirmation pattern)
- [ ] When form cancel triggered with `confirmOnCancel: true`, dialog appears
- [ ] "Keep Editing" button closes dialog and returns to form
- [ ] "Discard" button closes dialog and proceeds with cancellation
- [ ] Breadcrumb navigation checks all affected forms for `confirmOnCancel`
- [ ] If multiple forms have `confirmOnCancel`, one confirmation covers all
- [ ] Component exported from `src/index.ts`
- [ ] Props interface exported as type
- [ ] `npm run type-check` passes
- [ ] `npm run test` passes
- [ ] `npm run build` generates declarations

---

## All Needed Context

### Context Completeness Check

_This PRP provides everything needed for an implementer with no prior codebase knowledge. The `confirmOnCancel` option is already stored in `InternalStackEntry` but is completely unused. We need to create the dialog component and integrate it at the two cancellation points: `handleCancel` in FormStackRenderer and `popToIndex` in FormStackProvider._

### Documentation & References

```yaml
# MUST READ - Current cancellation implementation
- file: src/components/FormStackRenderer.tsx
  why: Contains handleCancel() that needs to check confirmOnCancel before resolving
  pattern: |
    Lines 44-47: Current handleCancel directly resolves undefined
    Need to make async and await confirmation if entry.confirmOnCancel is true
  critical: |
    handleCancel currently:
      entry.deferred.resolve(undefined);
      onClose();
    Must become:
      if (entry.confirmOnCancel) {
        const confirmed = await showConfirmation();
        if (!confirmed) return; // User cancelled, stay on form
      }
      entry.deferred.resolve(undefined);
      onClose();

- file: src/components/FormStackProvider.tsx
  why: Contains popToIndex() that needs confirmation for breadcrumb navigation
  pattern: |
    Lines 65-82: popToIndex cancels all forms after target index
    Must check if ANY cancelled forms have confirmOnCancel
    If so, show confirmation before proceeding
  critical: |
    Must check: state.stack.slice(index + 1).some(e => e.confirmOnCancel)
    If true, show confirmation before resolving promises
    One confirmation for all affected forms (not per-form)

- file: src/types/stack.ts
  why: Shows confirmOnCancel is already defined and stored
  pattern: |
    Line 27: OpenFormOptions has confirmOnCancel?: boolean
    Line 39: InternalStackEntry has confirmOnCancel: boolean (required, defaults false)
  gotcha: confirmOnCancel is stored but completely unused until this implementation

- file: src/types/context.ts
  why: Shows FormStackRendererProps interface to understand onClose callback
  pattern: FormStackRenderer receives stack and onClose from provider
  gotcha: onClose is synchronous but we need async confirmation - handle in renderer

# MUST READ - Research documentation
- docfile: plan/P2M2/research/confirmation-dialog-patterns.md
  why: Complete accessibility and implementation patterns for confirmation dialogs
  section: "4. Async Confirmation Flows" and "2. Accessible Dialog Implementation"
  critical: |
    Use role="alertdialog" for confirmation dialogs
    Focus on safe button (Keep Editing) not destructive button
    Escape key should NOT confirm, only close dialog safely
    Use native HTML5 <dialog> element for browser modality support

# Testing patterns
- file: src/components/__tests__/FormStackRenderer.test.tsx
  why: Shows component testing patterns with mocks
  pattern: createMockEntry helper, createMockDeferred helper, vi.spyOn
  critical: Need to add tests for confirmOnCancel: true entries

- file: src/components/__tests__/FormStackProvider.integration.test.tsx
  why: Shows integration testing with FormStackProvider
  pattern: TestConsumer component pattern, act() for async, waitFor assertions
  critical: Need similar pattern for confirmation dialog integration

- file: src/components/__tests__/Breadcrumbs.integration.test.tsx
  why: Shows testing popToIndex behavior
  pattern: Open multiple forms, click breadcrumb, verify cancellation
  critical: Need to add tests where cancelled forms have confirmOnCancel
```

### Current Codebase Tree

```bash
geoform-opus/
├── src/
│   ├── index.ts                    # Main barrel export
│   ├── types/
│   │   ├── index.ts
│   │   ├── form.ts                 # FormProps<T>, DeferredPromise<T>
│   │   ├── stack.ts                # StackEntry, OpenFormOptions (has confirmOnCancel), InternalStackEntry
│   │   ├── context.ts              # FormStackState, FormStackActions
│   │   └── __tests__/types.test.ts
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useFormStack.ts
│   │   ├── useFormStackState.ts
│   │   ├── useFormStackActions.ts
│   │   └── __tests__/ (3 test files)
│   ├── components/
│   │   ├── index.ts                # Barrel exports (MODIFY to add ConfirmationDialog)
│   │   ├── FormStackProvider.tsx   # Provider (MODIFY for popToIndex confirmation)
│   │   ├── FormStackRenderer.tsx   # Renderer (MODIFY for handleCancel confirmation)
│   │   ├── Breadcrumbs.tsx
│   │   └── __tests__/ (4 test files)
│   ├── context/
│   │   ├── index.ts
│   │   ├── formStackReducer.ts
│   │   ├── FormStackContext.ts
│   │   └── __tests__/formStackReducer.test.ts
│   ├── utils/
│   │   ├── index.ts
│   │   ├── createDeferredPromise.ts
│   │   └── __tests__/createDeferredPromise.test.ts
│   └── __tests__/setup.test.tsx
├── plan/
│   └── P2M2/
│       ├── PRP.md                  # This file
│       └── research/
│           └── confirmation-dialog-patterns.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── PRD.md
```

### Desired Codebase Tree After Implementation

```bash
geoform-opus/
├── src/
│   ├── index.ts                              # MODIFY: Export ConfirmationDialog
│   ├── components/
│   │   ├── index.ts                          # MODIFY: Export ConfirmationDialog
│   │   ├── FormStackProvider.tsx             # MODIFY: Add confirmation state and popToIndex confirmation
│   │   ├── FormStackRenderer.tsx             # MODIFY: Add confirmation for handleCancel
│   │   ├── ConfirmationDialog.tsx            # NEW: Accessible confirmation dialog
│   │   └── __tests__/
│   │       ├── ConfirmationDialog.test.tsx   # NEW: Unit tests
│   │       └── ConfirmationDialog.integration.test.tsx  # NEW: Integration tests
│   └── ...
└── ...
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Confirmation is async but callbacks are sync
// handleCancel is called synchronously by form component
// Must convert to async pattern that waits for user response

// PATTERN: Promise-based confirmation hook
interface PendingConfirmation {
  formId: string;
  resolve: (confirmed: boolean) => void;
}

// State to track pending confirmation
const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

// Function to request confirmation (returns Promise)
const requestConfirmation = (formId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setPendingConfirmation({ formId, resolve });
  });
};

// CRITICAL: Focus management for accessibility
// When dialog opens, focus the SAFE button (Keep Editing), not destructive button
// This prevents accidental confirmation via Enter key

// CRITICAL: Escape key behavior
// Escape should close dialog WITHOUT confirming cancellation
// User is returned to form with data intact
// This is the safe default for destructive actions

// CRITICAL: popToIndex confirmation covers multiple forms
// If navigating from index 3 to index 0, forms 1, 2, 3 might be cancelled
// Only show ONE confirmation if ANY of those forms have confirmOnCancel
// Message: "Discard changes to X form(s)?"

// GOTCHA: Dialog rendered by FormStackProvider, not FormStackRenderer
// This allows confirmation for both handleCancel AND popToIndex
// FormStackRenderer passes cancellation request UP to provider
// Provider shows dialog and resolves based on user choice

// GOTCHA: Native <dialog> element with showModal()
// Use ref.current.showModal() for true modal behavior
// Do NOT use open attribute directly - it creates non-modal dialog
// React state controls visibility, useEffect syncs with showModal()

// GOTCHA: JSDOM doesn't support showModal()
// In tests, mock HTMLDialogElement.prototype.showModal
// Or use controlled pattern that doesn't rely on native methods
```

---

## Implementation Blueprint

### Data Models and Structure

No new types file needed. Add confirmation state to FormStackProvider:

```typescript
// State for pending confirmation (in FormStackProvider)
interface PendingConfirmation {
  /** Form IDs that would be cancelled */
  affectedForms: string[];
  /** Callback when user responds */
  resolve: (confirmed: boolean) => void;
}

// ConfirmationDialog Props (in ConfirmationDialog.tsx)
export interface ConfirmationDialogProps {
  /** Whether dialog is visible */
  isOpen: boolean;
  /** Title displayed in dialog header */
  title?: string;
  /** Message body explaining the action */
  message?: string;
  /** Label for the confirm/destructive button */
  confirmLabel?: string;
  /** Label for the cancel/safe button */
  cancelLabel?: string;
  /** Called when user confirms (destructive action) */
  onConfirm: () => void;
  /** Called when user cancels (safe action - return to form) */
  onCancel: () => void;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/components/ConfirmationDialog.tsx
  - IMPLEMENT: Accessible confirmation dialog component
  - FOLLOW pattern: Native HTML5 <dialog> with React state sync (research doc section 1.1)
  - NAMING: ConfirmationDialog, ConfirmationDialogProps
  - PLACEMENT: src/components/ConfirmationDialog.tsx
  - CONTENT:
    ```typescript
    import { useEffect, useRef, type ReactElement, type KeyboardEvent } from 'react';

    /**
     * Props for ConfirmationDialog component.
     */
    export interface ConfirmationDialogProps {
      /** Whether dialog is visible */
      isOpen: boolean;
      /** Title displayed in dialog header */
      title?: string;
      /** Message body explaining the action */
      message?: string;
      /** Label for the confirm/destructive button */
      confirmLabel?: string;
      /** Label for the cancel/safe button */
      cancelLabel?: string;
      /** Called when user confirms (destructive action) */
      onConfirm: () => void;
      /** Called when user cancels (safe action - return to form) */
      onCancel: () => void;
    }

    /**
     * Accessible confirmation dialog for cancellation confirmation.
     * Uses native HTML5 <dialog> element for proper modal behavior.
     *
     * @example
     * ```tsx
     * <ConfirmationDialog
     *   isOpen={showConfirmation}
     *   title="Discard Changes?"
     *   message="Your unsaved changes will be lost."
     *   confirmLabel="Discard"
     *   cancelLabel="Keep Editing"
     *   onConfirm={handleConfirm}
     *   onCancel={handleCancel}
     * />
     * ```
     */
    export function ConfirmationDialog({
      isOpen,
      title = 'Discard Changes?',
      message = 'Your unsaved changes will be lost.',
      confirmLabel = 'Discard',
      cancelLabel = 'Keep Editing',
      onConfirm,
      onCancel,
    }: ConfirmationDialogProps): ReactElement | null {
      const dialogRef = useRef<HTMLDialogElement>(null);
      const cancelButtonRef = useRef<HTMLButtonElement>(null);

      // Sync React state with native dialog
      useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
          // showModal() may not exist in JSDOM, handle gracefully
          if (typeof dialog.showModal === 'function') {
            dialog.showModal();
          }
          // Focus the safe button (cancel/keep editing)
          cancelButtonRef.current?.focus();
        } else {
          if (typeof dialog.close === 'function') {
            dialog.close();
          }
        }
      }, [isOpen]);

      // Handle escape key via native dialog cancel event
      const handleDialogCancel = (e: Event) => {
        e.preventDefault();
        onCancel();
      };

      // Handle keyboard navigation within dialog
      const handleKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      };

      // Setup native dialog event listener
      useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        dialog.addEventListener('cancel', handleDialogCancel);
        return () => dialog.removeEventListener('cancel', handleDialogCancel);
      }, [onCancel]);

      if (!isOpen) {
        return null;
      }

      return (
        <dialog
          ref={dialogRef}
          className="confirmation-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirmation-dialog-title"
          aria-describedby="confirmation-dialog-description"
          onKeyDown={handleKeyDown}
        >
          <div className="confirmation-dialog__content">
            <h2
              id="confirmation-dialog-title"
              className="confirmation-dialog__title"
            >
              {title}
            </h2>
            <p
              id="confirmation-dialog-description"
              className="confirmation-dialog__message"
            >
              {message}
            </p>
            <div className="confirmation-dialog__actions">
              <button
                ref={cancelButtonRef}
                type="button"
                className="confirmation-dialog__button confirmation-dialog__button--cancel"
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className="confirmation-dialog__button confirmation-dialog__button--confirm"
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </dialog>
      );
    }
    ```
  - VALIDATION: npm run type-check passes

Task 2: MODIFY src/components/FormStackProvider.tsx
  - IMPLEMENT: Add confirmation state and logic for popToIndex
  - FOLLOW pattern: Promise-based async confirmation (research doc section 4.1)
  - NAMING: pendingConfirmation state, requestConfirmation function
  - PLACEMENT: Within FormStackProvider component
  - DEPENDENCIES: Task 1 (ConfirmationDialog exists)
  - CHANGES:
    1. Add PendingConfirmation interface (or inline type)
    2. Add useState for pendingConfirmation
    3. Add confirmation logic to popToIndex
    4. Render ConfirmationDialog based on pendingConfirmation state
    5. Add onCancelRequest callback prop for FormStackRenderer
  - CONTENT:
    ```typescript
    // Add import at top
    import { ConfirmationDialog } from './ConfirmationDialog';

    // Add interface inside file (before component)
    interface PendingConfirmation {
      affectedForms: string[];
      resolve: (confirmed: boolean) => void;
    }

    // Inside FormStackProvider component, add state after existing state:
    const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

    // Add request confirmation function
    const requestConfirmation = useCallback((affectedForms: string[]): Promise<boolean> => {
      return new Promise((resolve) => {
        setPendingConfirmation({ affectedForms, resolve });
      });
    }, []);

    // Modify popToIndex to check confirmOnCancel
    const popToIndex = useCallback(async (index: number) => {
      // Validate index bounds
      if (index < 0 || index >= state.stack.length) {
        return;
      }

      // Get forms that will be cancelled
      const formsToCancel = state.stack.slice(index + 1);

      // Check if any require confirmation
      const formsNeedingConfirmation = formsToCancel.filter(e => e.confirmOnCancel);

      if (formsNeedingConfirmation.length > 0) {
        const confirmed = await requestConfirmation(
          formsNeedingConfirmation.map(f => f.label ?? f.id)
        );
        if (!confirmed) {
          return; // User cancelled, don't proceed
        }
      }

      // Cancel all forms after the target index (resolve with undefined)
      for (let i = state.stack.length - 1; i > index; i--) {
        const entry = state.stack[i];
        if (entry) {
          entry.deferred.resolve(undefined);
        }
      }

      dispatch({ type: 'POP_TO_INDEX', index });
    }, [state.stack, requestConfirmation]);

    // Add handler for confirmation from FormStackRenderer
    const handleCancelRequest = useCallback(async (entry: InternalStackEntry<unknown>): Promise<boolean> => {
      if (entry.confirmOnCancel) {
        return requestConfirmation([entry.label ?? entry.id]);
      }
      return true; // No confirmation needed
    }, [requestConfirmation]);

    // Add confirmation dialog handlers
    const handleConfirmationConfirm = useCallback(() => {
      if (pendingConfirmation) {
        pendingConfirmation.resolve(true);
        setPendingConfirmation(null);
      }
    }, [pendingConfirmation]);

    const handleConfirmationCancel = useCallback(() => {
      if (pendingConfirmation) {
        pendingConfirmation.resolve(false);
        setPendingConfirmation(null);
      }
    }, [pendingConfirmation]);

    // Update FormStackRenderer props
    <FormStackRenderer
      stack={state.stack}
      onClose={closeForm}
      onCancelRequest={handleCancelRequest}
    />

    // Add ConfirmationDialog render before closing tag
    <ConfirmationDialog
      isOpen={pendingConfirmation !== null}
      title={
        pendingConfirmation && pendingConfirmation.affectedForms.length > 1
          ? `Discard Changes to ${pendingConfirmation.affectedForms.length} Forms?`
          : 'Discard Changes?'
      }
      message="Your unsaved changes will be lost."
      onConfirm={handleConfirmationConfirm}
      onCancel={handleConfirmationCancel}
    />
    ```
  - VALIDATION: npm run type-check (may fail until Task 3 complete)

Task 3: MODIFY src/components/FormStackRenderer.tsx
  - IMPLEMENT: Update to use onCancelRequest for confirmation
  - FOLLOW pattern: Async callback before resolving promise
  - NAMING: onCancelRequest prop
  - PLACEMENT: Update existing component
  - DEPENDENCIES: Task 2 (provider exposes onCancelRequest)
  - CHANGES:
    1. Add onCancelRequest prop to FormStackRendererProps
    2. Make handleCancel async and call onCancelRequest
    3. Only resolve promise if confirmation returned true
  - CONTENT:
    ```typescript
    // Update interface
    export interface FormStackRendererProps {
      /** Internal stack entries to render */
      stack: InternalStackEntry<unknown>[];
      /** Callback when form is closed (pops from stack) */
      onClose: () => void;
      /** Request confirmation before cancelling - returns true if confirmed */
      onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>;
    }

    // Update function signature
    export function FormStackRenderer({
      stack,
      onClose,
      onCancelRequest,
    }: FormStackRendererProps): ReactElement | null {

    // Update handleCancel (inside the map)
    const handleCancel = async () => {
      // Check if confirmation is needed
      const confirmed = await onCancelRequest(entry);
      if (!confirmed) {
        return; // User cancelled confirmation, stay on form
      }
      entry.deferred.resolve(undefined);
      onClose();
    };
    ```
  - VALIDATION: npm run type-check passes

Task 4: MODIFY src/components/index.ts
  - IMPLEMENT: Export ConfirmationDialog from barrel
  - NAMING: Standard barrel export pattern
  - PLACEMENT: After existing exports
  - CONTENT:
    ```typescript
    export { FormStackProvider } from './FormStackProvider';
    export type { FormStackProviderProps } from './FormStackProvider';

    export { FormStackRenderer } from './FormStackRenderer';
    export type { FormStackRendererProps } from './FormStackRenderer';

    export { Breadcrumbs } from './Breadcrumbs';
    export type { BreadcrumbsProps } from './Breadcrumbs';

    export { ConfirmationDialog } from './ConfirmationDialog';
    export type { ConfirmationDialogProps } from './ConfirmationDialog';
    ```
  - VALIDATION: Imports work from 'src/components'

Task 5: MODIFY src/index.ts
  - IMPLEMENT: Export ConfirmationDialog from main barrel
  - PLACEMENT: In components section
  - CONTENT (add to existing exports):
    ```typescript
    // Add to components exports section
    export { ConfirmationDialog } from './components/ConfirmationDialog';
    export type { ConfirmationDialogProps } from './components/ConfirmationDialog';
    ```
  - VALIDATION: npm run build passes

Task 6: CREATE src/components/__tests__/ConfirmationDialog.test.tsx
  - IMPLEMENT: Unit tests for ConfirmationDialog component
  - FOLLOW pattern: AAA, describe blocks, Testing Library patterns
  - NAMING: ConfirmationDialog.test.tsx
  - PLACEMENT: src/components/__tests__/
  - CONTENT:
    ```typescript
    import { describe, it, expect, vi, beforeEach } from 'vitest';
    import { render, screen, fireEvent } from '@testing-library/react';
    import { ConfirmationDialog } from '../ConfirmationDialog';

    // Mock HTMLDialogElement methods for JSDOM
    beforeEach(() => {
      HTMLDialogElement.prototype.showModal = vi.fn();
      HTMLDialogElement.prototype.close = vi.fn();
    });

    describe('ConfirmationDialog', () => {
      describe('when closed', () => {
        it('should render nothing when isOpen is false', () => {
          const { container } = render(
            <ConfirmationDialog
              isOpen={false}
              onConfirm={vi.fn()}
              onCancel={vi.fn()}
            />
          );

          expect(container.firstChild).toBeNull();
        });
      });

      describe('when open', () => {
        it('should render dialog with default content', () => {
          render(
            <ConfirmationDialog
              isOpen={true}
              onConfirm={vi.fn()}
              onCancel={vi.fn()}
            />
          );

          expect(screen.getByText('Discard Changes?')).toBeInTheDocument();
          expect(screen.getByText('Your unsaved changes will be lost.')).toBeInTheDocument();
          expect(screen.getByText('Keep Editing')).toBeInTheDocument();
          expect(screen.getByText('Discard')).toBeInTheDocument();
        });

        it('should render custom title and message', () => {
          render(
            <ConfirmationDialog
              isOpen={true}
              title="Custom Title"
              message="Custom message here"
              onConfirm={vi.fn()}
              onCancel={vi.fn()}
            />
          );

          expect(screen.getByText('Custom Title')).toBeInTheDocument();
          expect(screen.getByText('Custom message here')).toBeInTheDocument();
        });

        it('should render custom button labels', () => {
          render(
            <ConfirmationDialog
              isOpen={true}
              confirmLabel="Yes, Delete"
              cancelLabel="No, Go Back"
              onConfirm={vi.fn()}
              onCancel={vi.fn()}
            />
          );

          expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
          expect(screen.getByText('No, Go Back')).toBeInTheDocument();
        });
      });

      describe('user interactions', () => {
        it('should call onConfirm when confirm button clicked', () => {
          const onConfirm = vi.fn();
          render(
            <ConfirmationDialog
              isOpen={true}
              onConfirm={onConfirm}
              onCancel={vi.fn()}
            />
          );

          fireEvent.click(screen.getByText('Discard'));

          expect(onConfirm).toHaveBeenCalledTimes(1);
        });

        it('should call onCancel when cancel button clicked', () => {
          const onCancel = vi.fn();
          render(
            <ConfirmationDialog
              isOpen={true}
              onConfirm={vi.fn()}
              onCancel={onCancel}
            />
          );

          fireEvent.click(screen.getByText('Keep Editing'));

          expect(onCancel).toHaveBeenCalledTimes(1);
        });

        it('should call onCancel when escape key pressed', () => {
          const onCancel = vi.fn();
          render(
            <ConfirmationDialog
              isOpen={true}
              onConfirm={vi.fn()}
              onCancel={onCancel}
            />
          );

          const dialog = screen.getByRole('alertdialog');
          fireEvent.keyDown(dialog, { key: 'Escape' });

          expect(onCancel).toHaveBeenCalledTimes(1);
        });
      });

      describe('accessibility', () => {
        it('should have role="alertdialog"', () => {
          render(
            <ConfirmationDialog
              isOpen={true}
              onConfirm={vi.fn()}
              onCancel={vi.fn()}
            />
          );

          expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        });

        it('should have aria-modal="true"', () => {
          render(
            <ConfirmationDialog
              isOpen={true}
              onConfirm={vi.fn()}
              onCancel={vi.fn()}
            />
          );

          const dialog = screen.getByRole('alertdialog');
          expect(dialog).toHaveAttribute('aria-modal', 'true');
        });

        it('should have aria-labelledby referencing title', () => {
          render(
            <ConfirmationDialog
              isOpen={true}
              onConfirm={vi.fn()}
              onCancel={vi.fn()}
            />
          );

          const dialog = screen.getByRole('alertdialog');
          expect(dialog).toHaveAttribute('aria-labelledby', 'confirmation-dialog-title');

          const title = document.getElementById('confirmation-dialog-title');
          expect(title).toHaveTextContent('Discard Changes?');
        });

        it('should have aria-describedby referencing message', () => {
          render(
            <ConfirmationDialog
              isOpen={true}
              onConfirm={vi.fn()}
              onCancel={vi.fn()}
            />
          );

          const dialog = screen.getByRole('alertdialog');
          expect(dialog).toHaveAttribute('aria-describedby', 'confirmation-dialog-description');

          const desc = document.getElementById('confirmation-dialog-description');
          expect(desc).toHaveTextContent('Your unsaved changes will be lost.');
        });

        it('should call showModal when opened', () => {
          render(
            <ConfirmationDialog
              isOpen={true}
              onConfirm={vi.fn()}
              onCancel={vi.fn()}
            />
          );

          expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
        });
      });
    });
    ```
  - VALIDATION: npm run test passes

Task 7: CREATE src/components/__tests__/ConfirmationDialog.integration.test.tsx
  - IMPLEMENT: Integration tests for confirmation flow with FormStackProvider
  - FOLLOW pattern: FormStackProvider.integration.test.tsx patterns
  - NAMING: ConfirmationDialog.integration.test.tsx
  - PLACEMENT: src/components/__tests__/
  - CONTENT:
    ```typescript
    import { describe, it, expect, vi, beforeEach } from 'vitest';
    import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
    import { FormStackProvider } from '../FormStackProvider';
    import { useFormStack } from '../../hooks';
    import type { FormProps } from '../../types';

    // Mock HTMLDialogElement methods for JSDOM
    beforeEach(() => {
      HTMLDialogElement.prototype.showModal = vi.fn();
      HTMLDialogElement.prototype.close = vi.fn();
    });

    // Test form component
    function TestForm({ onSubmit, onCancel }: FormProps<{ name: string }>) {
      return (
        <div data-testid="test-form">
          <button data-testid="submit-btn" onClick={() => onSubmit({ name: 'Test' })}>
            Submit
          </button>
          <button data-testid="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      );
    }

    // Test consumer
    function TestConsumer({
      onResult,
      confirmOnCancel = false,
    }: {
      onResult: (val: unknown) => void;
      confirmOnCancel?: boolean;
    }) {
      const { openForm, stack } = useFormStack();

      const handleOpenForm = async () => {
        const result = await openForm({
          id: 'test-form',
          component: TestForm,
          label: 'Test Form',
          confirmOnCancel,
        });
        onResult(result);
      };

      return (
        <div>
          <span data-testid="stack-length">{stack.length}</span>
          <button data-testid="open-form" onClick={handleOpenForm}>
            Open Form
          </button>
        </div>
      );
    }

    describe('Confirmation Dialog Integration', () => {
      describe('when confirmOnCancel is false', () => {
        it('should cancel immediately without confirmation', async () => {
          const onResult = vi.fn();

          render(
            <FormStackProvider>
              <TestConsumer onResult={onResult} confirmOnCancel={false} />
            </FormStackProvider>
          );

          // Open form
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-form'));
          });

          expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

          // Cancel form - should not show confirmation
          await act(async () => {
            fireEvent.click(screen.getByTestId('cancel-btn'));
          });

          // Should cancel immediately
          expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
          expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

          await waitFor(() => {
            expect(onResult).toHaveBeenCalledWith(undefined);
          });
        });
      });

      describe('when confirmOnCancel is true', () => {
        it('should show confirmation dialog on cancel', async () => {
          const onResult = vi.fn();

          render(
            <FormStackProvider>
              <TestConsumer onResult={onResult} confirmOnCancel={true} />
            </FormStackProvider>
          );

          // Open form
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-form'));
          });

          expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

          // Cancel form - should show confirmation
          await act(async () => {
            fireEvent.click(screen.getByTestId('cancel-btn'));
          });

          // Confirmation dialog should appear
          expect(screen.getByRole('alertdialog')).toBeInTheDocument();
          expect(screen.getByText('Discard Changes?')).toBeInTheDocument();

          // Form should still be in stack
          expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
        });

        it('should keep form open when user clicks Keep Editing', async () => {
          const onResult = vi.fn();

          render(
            <FormStackProvider>
              <TestConsumer onResult={onResult} confirmOnCancel={true} />
            </FormStackProvider>
          );

          await act(async () => {
            fireEvent.click(screen.getByTestId('open-form'));
          });

          await act(async () => {
            fireEvent.click(screen.getByTestId('cancel-btn'));
          });

          // Click Keep Editing
          await act(async () => {
            fireEvent.click(screen.getByText('Keep Editing'));
          });

          // Dialog should close
          expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

          // Form should still be open
          expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
          expect(screen.getByTestId('test-form')).toBeInTheDocument();

          // onResult should NOT have been called
          expect(onResult).not.toHaveBeenCalled();
        });

        it('should cancel form when user clicks Discard', async () => {
          const onResult = vi.fn();

          render(
            <FormStackProvider>
              <TestConsumer onResult={onResult} confirmOnCancel={true} />
            </FormStackProvider>
          );

          await act(async () => {
            fireEvent.click(screen.getByTestId('open-form'));
          });

          await act(async () => {
            fireEvent.click(screen.getByTestId('cancel-btn'));
          });

          // Click Discard
          await act(async () => {
            fireEvent.click(screen.getByText('Discard'));
          });

          // Dialog should close
          expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

          // Form should be cancelled
          expect(screen.getByTestId('stack-length')).toHaveTextContent('0');

          await waitFor(() => {
            expect(onResult).toHaveBeenCalledWith(undefined);
          });
        });
      });

      describe('breadcrumb navigation with confirmOnCancel', () => {
        function NestedTestConsumer({ onResult }: { onResult: (result: unknown, level: number) => void }) {
          const { openForm, stack } = useFormStack();

          const openLevel = async (level: number, confirmOnCancel: boolean) => {
            const result = await openForm({
              id: `form-${level}`,
              label: `Form ${level}`,
              component: TestForm,
              confirmOnCancel,
            });
            onResult(result, level);
          };

          return (
            <div>
              <span data-testid="stack-length">{stack.length}</span>
              <button data-testid="open-level-1" onClick={() => openLevel(1, false)}>
                Open Level 1
              </button>
              <button data-testid="open-level-2" onClick={() => openLevel(2, true)}>
                Open Level 2 (confirm)
              </button>
              <button data-testid="open-level-3" onClick={() => openLevel(3, true)}>
                Open Level 3 (confirm)
              </button>
            </div>
          );
        }

        it('should show confirmation when navigating past form with confirmOnCancel', async () => {
          const onResult = vi.fn();

          // Import Breadcrumbs here to avoid circular dependency issues
          const { Breadcrumbs } = await import('../Breadcrumbs');

          render(
            <FormStackProvider>
              <Breadcrumbs />
              <NestedTestConsumer onResult={onResult} />
            </FormStackProvider>
          );

          // Open 3 forms (level 2 and 3 have confirmOnCancel)
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-1'));
          });
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-2'));
          });
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-3'));
          });

          expect(screen.getByTestId('stack-length')).toHaveTextContent('3');

          // Click Form 1 breadcrumb (would cancel forms 2 and 3)
          await act(async () => {
            fireEvent.click(screen.getByRole('link', { name: 'Form 1' }));
          });

          // Confirmation dialog should appear
          expect(screen.getByRole('alertdialog')).toBeInTheDocument();
          // Should mention multiple forms
          expect(screen.getByText(/Discard Changes/)).toBeInTheDocument();

          // Stack should still have 3 forms
          expect(screen.getByTestId('stack-length')).toHaveTextContent('3');
        });

        it('should cancel all forms when confirmed via breadcrumb', async () => {
          const onResult = vi.fn();
          const { Breadcrumbs } = await import('../Breadcrumbs');

          render(
            <FormStackProvider>
              <Breadcrumbs />
              <NestedTestConsumer onResult={onResult} />
            </FormStackProvider>
          );

          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-1'));
          });
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-2'));
          });
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-3'));
          });

          await act(async () => {
            fireEvent.click(screen.getByRole('link', { name: 'Form 1' }));
          });

          // Confirm discarding
          await act(async () => {
            fireEvent.click(screen.getByText('Discard'));
          });

          // Stack should be reduced to 1
          expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

          // Forms 2 and 3 should have been cancelled
          await waitFor(() => {
            expect(onResult).toHaveBeenCalledWith(undefined, 2);
            expect(onResult).toHaveBeenCalledWith(undefined, 3);
          });
        });

        it('should not cancel forms when cancelled via breadcrumb confirmation', async () => {
          const onResult = vi.fn();
          const { Breadcrumbs } = await import('../Breadcrumbs');

          render(
            <FormStackProvider>
              <Breadcrumbs />
              <NestedTestConsumer onResult={onResult} />
            </FormStackProvider>
          );

          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-1'));
          });
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-2'));
          });
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-3'));
          });

          await act(async () => {
            fireEvent.click(screen.getByRole('link', { name: 'Form 1' }));
          });

          // Click Keep Editing
          await act(async () => {
            fireEvent.click(screen.getByText('Keep Editing'));
          });

          // Stack should still have 3 forms
          expect(screen.getByTestId('stack-length')).toHaveTextContent('3');

          // onResult should NOT have been called
          expect(onResult).not.toHaveBeenCalled();
        });
      });
    });
    ```
  - VALIDATION: npm run test passes
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Promise-based confirmation
// The key insight is that cancellation becomes async when confirmation is needed

// In FormStackProvider:
const requestConfirmation = useCallback((affectedForms: string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    setPendingConfirmation({ affectedForms, resolve });
  });
}, []);

// When dialog is answered, resolve the pending promise:
const handleConfirmationConfirm = () => {
  pendingConfirmation?.resolve(true);
  setPendingConfirmation(null);
};

const handleConfirmationCancel = () => {
  pendingConfirmation?.resolve(false);
  setPendingConfirmation(null);
};

// PATTERN: Async handleCancel in FormStackRenderer
const handleCancel = async () => {
  const confirmed = await onCancelRequest(entry);
  if (!confirmed) return; // User cancelled, stay on form
  entry.deferred.resolve(undefined);
  onClose();
};

// PATTERN: Check multiple forms for popToIndex
const formsNeedingConfirmation = formsToCancel.filter(e => e.confirmOnCancel);
if (formsNeedingConfirmation.length > 0) {
  const confirmed = await requestConfirmation(
    formsNeedingConfirmation.map(f => f.label ?? f.id)
  );
  if (!confirmed) return;
}

// PATTERN: Native dialog with React state sync
useEffect(() => {
  if (isOpen) {
    dialogRef.current?.showModal();
    cancelButtonRef.current?.focus(); // Focus safe button
  } else {
    dialogRef.current?.close();
  }
}, [isOpen]);

// PATTERN: Escape key handling
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    onCancel(); // Safe action - return to form
  }
};
```

### Integration Points

```yaml
PROVIDER:
  - Modify: src/components/FormStackProvider.tsx
  - Add: pendingConfirmation state
  - Add: requestConfirmation callback
  - Add: handleCancelRequest prop for FormStackRenderer
  - Add: Confirmation logic in popToIndex
  - Add: Render ConfirmationDialog
  - Pattern: Promise-based async confirmation

RENDERER:
  - Modify: src/components/FormStackRenderer.tsx
  - Add: onCancelRequest prop
  - Modify: handleCancel to be async
  - Pattern: Await confirmation before resolving

BARREL_EXPORTS:
  - Modify: src/components/index.ts (add ConfirmationDialog)
  - Modify: src/index.ts (add ConfirmationDialog)

BUILD:
  - npm run build generates updated declarations
  - ConfirmationDialog and ConfirmationDialogProps exported
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating ConfirmationDialog, verify compilation
npm run type-check

# Expected: Zero errors (or only from pending modifications)

# After modifying provider and renderer
npm run type-check

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run ConfirmationDialog unit tests
npm run test -- src/components/__tests__/ConfirmationDialog.test.tsx

# Expected output:
# ✓ ConfirmationDialog > when closed > should render nothing
# ✓ ConfirmationDialog > when open > should render dialog with default content
# ✓ ConfirmationDialog > when open > should render custom title and message
# ✓ ConfirmationDialog > user interactions > should call onConfirm
# ✓ ConfirmationDialog > user interactions > should call onCancel
# ✓ ConfirmationDialog > user interactions > should call onCancel on escape
# ✓ ConfirmationDialog > accessibility > should have role="alertdialog"
# ✓ ConfirmationDialog > accessibility > should have aria-modal
# ✓ ConfirmationDialog > accessibility > should have aria-labelledby
# ✓ ConfirmationDialog > accessibility > should have aria-describedby
```

### Level 3: Integration Testing (System Validation)

```bash
# Run integration tests
npm run test -- src/components/__tests__/ConfirmationDialog.integration.test.tsx

# Expected output:
# ✓ when confirmOnCancel is false > should cancel immediately
# ✓ when confirmOnCancel is true > should show confirmation dialog
# ✓ when confirmOnCancel is true > should keep form open when Keep Editing clicked
# ✓ when confirmOnCancel is true > should cancel form when Discard clicked
# ✓ breadcrumb navigation > should show confirmation when navigating past form with confirmOnCancel
# ✓ breadcrumb navigation > should cancel all forms when confirmed
# ✓ breadcrumb navigation > should not cancel forms when cancelled

# Run all tests
npm run test

# Expected: All tests pass

# Build verification
npm run build

# Verify exports
grep -l "ConfirmationDialog" dist/index.d.ts
# Expected: Found in declaration file
```

### Level 4: Manual Verification

```bash
# Example usage verification (mental test)
cat << 'EOF'
// Example: Form with confirmation on cancel
import { FormStackProvider, useFormStack } from 'geoform';
import type { FormProps } from 'geoform';

function EditUserForm({ onSubmit, onCancel }: FormProps<User>) {
  const [name, setName] = useState('');

  return (
    <form>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="button" onClick={onCancel}>Cancel</button>
      <button type="submit" onClick={() => onSubmit({ name })}>Save</button>
    </form>
  );
}

function ParentComponent() {
  const { openForm } = useFormStack();

  const handleEdit = async () => {
    const result = await openForm({
      id: 'edit-user',
      component: EditUserForm,
      label: 'Edit User',
      confirmOnCancel: true, // <-- Enables confirmation dialog
    });

    if (result) {
      console.log('User saved:', result);
    } else {
      console.log('User cancelled');
    }
  };

  return <button onClick={handleEdit}>Edit User</button>;
}

function App() {
  return (
    <FormStackProvider>
      <ParentComponent />
    </FormStackProvider>
  );
}
EOF
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run test` passes all tests (existing + new)
- [ ] `npm run build` generates dist/index.d.ts with ConfirmationDialog export
- [ ] ConfirmationDialog component created
- [ ] FormStackRenderer updated with onCancelRequest prop
- [ ] FormStackProvider updated with confirmation logic

### Feature Validation

- [ ] Form without `confirmOnCancel` cancels immediately (no dialog)
- [ ] Form with `confirmOnCancel: true` shows dialog on cancel
- [ ] "Keep Editing" button closes dialog, returns to form
- [ ] "Discard" button closes dialog, cancels form
- [ ] Escape key closes dialog without cancelling (safe default)
- [ ] Breadcrumb navigation shows confirmation if any form has `confirmOnCancel`
- [ ] One confirmation dialog for multiple forms in breadcrumb navigation
- [ ] Cancelling breadcrumb confirmation returns to current form
- [ ] Confirming breadcrumb navigation cancels all deeper forms

### Accessibility Validation

- [ ] Dialog has `role="alertdialog"`
- [ ] Dialog has `aria-modal="true"`
- [ ] Dialog has `aria-labelledby` pointing to title
- [ ] Dialog has `aria-describedby` pointing to message
- [ ] Focus moves to safe button (Keep Editing) when dialog opens
- [ ] Native `<dialog>` element used for browser modality
- [ ] Escape key triggers onCancel (safe action)

### Code Quality Validation

- [ ] Uses `import type` for type-only imports
- [ ] JSDoc comments on ConfirmationDialog component
- [ ] JSDoc comments on ConfirmationDialogProps interface
- [ ] Follows existing naming conventions
- [ ] Uses native HTML5 dialog element
- [ ] Props have sensible defaults

### Documentation & Deployment

- [ ] Exported from src/components/index.ts
- [ ] Exported from src/index.ts
- [ ] Type declarations generated in build

---

## Anti-Patterns to Avoid

- **DON'T** focus the destructive button (Discard) on dialog open - focus the safe button
- **DON'T** make Escape key trigger confirmation - it should cancel (safe action)
- **DON'T** allow clicking backdrop to dismiss - destructive confirmations require explicit choice
- **DON'T** show multiple dialogs for multiple forms - one dialog covers all
- **DON'T** modify stack state before confirmation is complete
- **DON'T** use `open` attribute on dialog - use `showModal()` for true modality
- **DON'T** forget to sync React state with native dialog methods
- **DON'T** skip the confirmation check for popToIndex breadcrumb navigation

---

## Confidence Score

**8/10** - High confidence for one-pass implementation success

**Rationale:**
- `confirmOnCancel` option already defined in types and stored in entries
- Two clear integration points identified (handleCancel, popToIndex)
- Promise-based async pattern well-researched and documented
- Accessibility patterns well-established from WAI-ARIA
- Existing testing patterns provide clear templates
- Native HTML5 dialog element simplifies modal behavior

**Risk Factors:**
- JSDOM doesn't fully support `showModal()` - requires mocking in tests
- Async callback pattern adds complexity to FormStackRenderer
- Need to ensure breadcrumb tests account for confirmation flow
- Focus management may need tweaking for different browser behaviors

**Mitigation Strategies:**
- Mock HTMLDialogElement methods in test setup
- Follow promise-based pattern exactly as documented
- Run existing tests after changes to catch regressions
- Test manually in real browser for focus behavior

---

## Quick Start for Implementation

```bash
# 1. Create ConfirmationDialog component (Task 1)
touch src/components/ConfirmationDialog.tsx
# Copy content from Task 1

# 2. Verify ConfirmationDialog compiles
npm run type-check

# 3. Modify FormStackProvider (Task 2)
# Add confirmation state and handlers
# Update popToIndex for async confirmation
# Add onCancelRequest prop to FormStackRenderer

# 4. Modify FormStackRenderer (Task 3)
# Add onCancelRequest prop
# Make handleCancel async

# 5. Verify full compilation
npm run type-check

# 6. Update barrel exports (Tasks 4-5)
# Modify src/components/index.ts
# Modify src/index.ts

# 7. Create test files (Tasks 6-7)
touch src/components/__tests__/ConfirmationDialog.test.tsx
touch src/components/__tests__/ConfirmationDialog.integration.test.tsx
# Copy content from Tasks 6-7

# 8. Validate
npm run type-check && npm run test && npm run build

# Expected: All commands pass
```

---

## Research References

The following research is available in `plan/P2M2/research/`:

1. **confirmation-dialog-patterns.md** - Comprehensive guide covering:
   - React patterns for modal/dialog components
   - WAI-ARIA accessibility implementation
   - React 18+ portal patterns
   - Async confirmation flows
   - State management patterns
   - Library patterns to follow (Radix, Headless UI)
   - Testing patterns

Key external documentation:
- [W3C WAI-ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [MDN: HTMLDialogElement.showModal()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal)
- [React: createPortal](https://react.dev/reference/react-dom/createPortal)
- [Radix Primitives: Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Headless UI: Dialog](https://headlessui.com/react/dialog)
- [Testing Library: Modals](https://testing-library.com/docs/example-react-modal/)
