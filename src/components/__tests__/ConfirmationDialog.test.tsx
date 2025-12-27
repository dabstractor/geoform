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

      // Use hidden: true because JSDOM doesn't fully support dialog accessibility
      const dialog = screen.getByRole('alertdialog', { hidden: true });
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    // Note: JSDOM doesn't fully support dialog accessibility, so we use hidden: true
    it('should have role="alertdialog"', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByRole('alertdialog', { hidden: true })).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const dialog = screen.getByRole('alertdialog', { hidden: true });
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

      const dialog = screen.getByRole('alertdialog', { hidden: true });
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

      const dialog = screen.getByRole('alertdialog', { hidden: true });
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
