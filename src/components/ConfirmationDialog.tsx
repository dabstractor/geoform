import { useEffect, useRef, useCallback, type ReactElement, type KeyboardEvent } from 'react';

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

  // Handle native dialog cancel event (Escape key via browser)
  const handleDialogCancel = useCallback(
    (e: Event) => {
      e.preventDefault();
      onCancel();
    },
    [onCancel]
  );

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

  // Setup native dialog event listener
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.addEventListener('cancel', handleDialogCancel);
    return () => dialog.removeEventListener('cancel', handleDialogCancel);
  }, [handleDialogCancel]);

  // Handle keyboard navigation within dialog
  const handleKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

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
