import type { ReactElement, ReactNode, MouseEvent } from 'react';
import { useFormStackState } from '../hooks/useFormStackState';
import { useFormStackActions } from '../hooks/useFormStackActions';

/**
 * Props for Breadcrumbs component.
 */
export interface BreadcrumbsProps {
  /** Custom separator between breadcrumb items (default: "/") */
  separator?: ReactNode;
  /** CSS class name for the nav element */
  className?: string;
  /** aria-label for the navigation element (default: "Form navigation") */
  ariaLabel?: string;
}

/**
 * Displays the form stack as navigable breadcrumbs.
 * Clicking a breadcrumb navigates to that form, cancelling all deeper forms.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Breadcrumbs />
 *
 * // Custom separator
 * <Breadcrumbs separator="›" />
 *
 * // With custom styling
 * <Breadcrumbs className="my-breadcrumbs" />
 * ```
 */
export function Breadcrumbs({
  separator = '/',
  className = '',
  ariaLabel = 'Form navigation',
}: BreadcrumbsProps): ReactElement | null {
  const { stack } = useFormStackState();
  const { popToIndex } = useFormStackActions();

  // Nothing to render if stack is empty
  if (stack.length === 0) {
    return null;
  }

  const handleClick = (index: number, event: MouseEvent) => {
    event.preventDefault();
    // Don't navigate if clicking current form
    if (index === stack.length - 1) {
      return;
    }
    popToIndex(index);
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={`breadcrumbs ${className}`.trim()}
    >
      <ol role="list" className="breadcrumbs__list">
        {stack.map((entry, index) => {
          const isCurrent = index === stack.length - 1;
          const displayText = entry.label ?? entry.id;

          return (
            <li key={entry.id} className="breadcrumbs__item">
              {isCurrent ? (
                <span
                  className="breadcrumbs__current"
                  aria-current="page"
                >
                  {displayText}
                </span>
              ) : (
                <>
                  <a
                    href="#"
                    className="breadcrumbs__link"
                    onClick={(e) => handleClick(index, e)}
                  >
                    {displayText}
                  </a>
                  {separator && (
                    <span
                      className="breadcrumbs__separator"
                      aria-hidden="true"
                    >
                      {separator}
                    </span>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
