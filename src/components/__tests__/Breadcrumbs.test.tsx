import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Breadcrumbs } from '../Breadcrumbs';
import * as useFormStackStateHook from '../../hooks/useFormStackState';
import * as useFormStackActionsHook from '../../hooks/useFormStackActions';
import type { FormStackState, FormStackActions } from '../../types';

// Mock the hooks
vi.mock('../../hooks/useFormStackState');
vi.mock('../../hooks/useFormStackActions');

describe('Breadcrumbs', () => {
  const mockPopToIndex = vi.fn();
  const mockOpenForm = vi.fn();
  const mockCloseForm = vi.fn();
  const mockCancelForm = vi.fn();

  const mockActions: FormStackActions = {
    openForm: mockOpenForm,
    closeForm: mockCloseForm,
    popToIndex: mockPopToIndex,
    cancelForm: mockCancelForm,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFormStackActionsHook.useFormStackActions).mockReturnValue(mockActions);
  });

  describe('when stack is empty', () => {
    it('should render nothing', () => {
      // Arrange
      const mockState: FormStackState = { stack: [] };
      vi.mocked(useFormStackStateHook.useFormStackState).mockReturnValue(mockState);

      // Act
      const { container } = render(<Breadcrumbs />);

      // Assert
      expect(container.firstChild).toBeNull();
    });
  });

  describe('when stack has one form', () => {
    it('should render single item as current', () => {
      // Arrange
      const mockState: FormStackState = {
        stack: [{ id: 'form-1', label: 'Form 1' }],
      };
      vi.mocked(useFormStackStateHook.useFormStackState).mockReturnValue(mockState);

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText('Form 1')).toBeInTheDocument();
      expect(screen.getByText('Form 1')).toHaveAttribute('aria-current', 'page');
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should fall back to id when label is missing', () => {
      // Arrange
      const mockState: FormStackState = {
        stack: [{ id: 'form-1' }],
      };
      vi.mocked(useFormStackStateHook.useFormStackState).mockReturnValue(mockState);

      // Act
      render(<Breadcrumbs />);

      // Assert
      expect(screen.getByText('form-1')).toBeInTheDocument();
    });
  });

  describe('when stack has multiple forms', () => {
    const mockState: FormStackState = {
      stack: [
        { id: 'form-1', label: 'Form 1' },
        { id: 'form-2', label: 'Form 2' },
        { id: 'form-3', label: 'Form 3' },
      ],
    };

    beforeEach(() => {
      vi.mocked(useFormStackStateHook.useFormStackState).mockReturnValue(mockState);
    });

    it('should render all items', () => {
      render(<Breadcrumbs />);

      expect(screen.getByText('Form 1')).toBeInTheDocument();
      expect(screen.getByText('Form 2')).toBeInTheDocument();
      expect(screen.getByText('Form 3')).toBeInTheDocument();
    });

    it('should render non-current items as links', () => {
      render(<Breadcrumbs />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent('Form 1');
      expect(links[1]).toHaveTextContent('Form 2');
    });

    it('should render current item with aria-current', () => {
      render(<Breadcrumbs />);

      const current = screen.getByText('Form 3');
      expect(current).toHaveAttribute('aria-current', 'page');
    });

    it('should call popToIndex when clicking non-current breadcrumb', () => {
      render(<Breadcrumbs />);

      fireEvent.click(screen.getByText('Form 1'));

      expect(mockPopToIndex).toHaveBeenCalledWith(0);
    });

    it('should call popToIndex with correct index for middle breadcrumb', () => {
      render(<Breadcrumbs />);

      fireEvent.click(screen.getByText('Form 2'));

      expect(mockPopToIndex).toHaveBeenCalledWith(1);
    });

    it('should not call popToIndex when clicking current breadcrumb', () => {
      render(<Breadcrumbs />);

      // Current is not a link, but if we could click it somehow
      const current = screen.getByText('Form 3');
      fireEvent.click(current);

      expect(mockPopToIndex).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      vi.mocked(useFormStackStateHook.useFormStackState).mockReturnValue({
        stack: [
          { id: 'form-1', label: 'Form 1' },
          { id: 'form-2', label: 'Form 2' },
        ],
      });
    });

    it('should have nav with aria-label', () => {
      render(<Breadcrumbs />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Form navigation');
    });

    it('should allow custom aria-label', () => {
      render(<Breadcrumbs ariaLabel="Breadcrumb navigation" />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation');
    });

    it('should use ordered list with role="list"', () => {
      render(<Breadcrumbs />);

      const list = screen.getByRole('list');
      expect(list.tagName).toBe('OL');
    });

    it('should hide separators from screen readers', () => {
      render(<Breadcrumbs separator="/" />);

      const separators = document.querySelectorAll('[aria-hidden="true"]');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('customization', () => {
    beforeEach(() => {
      vi.mocked(useFormStackStateHook.useFormStackState).mockReturnValue({
        stack: [
          { id: 'form-1', label: 'Form 1' },
          { id: 'form-2', label: 'Form 2' },
        ],
      });
    });

    it('should use default separator "/"', () => {
      render(<Breadcrumbs />);

      expect(screen.getByText('/')).toBeInTheDocument();
    });

    it('should allow custom separator', () => {
      render(<Breadcrumbs separator="›" />);

      expect(screen.getByText('›')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Breadcrumbs className="my-breadcrumbs" />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('breadcrumbs', 'my-breadcrumbs');
    });
  });
});
