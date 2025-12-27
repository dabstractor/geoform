import { createElement, type ReactElement } from 'react';
import type { InternalStackEntry, FormProps } from '../types';

/**
 * Props for FormStackRenderer component.
 */
export interface FormStackRendererProps {
  /** Internal stack entries to render */
  stack: InternalStackEntry<unknown>[];
  /** Callback when form is closed (pops from stack) */
  onClose: () => void;
}

/**
 * Renders the form stack with hidden container pattern.
 * All forms are rendered to DOM, inactive ones are hidden with CSS.
 * This preserves parent form state while child forms are active.
 *
 * @example
 * ```tsx
 * <FormStackRenderer
 *   stack={internalStack}
 *   onClose={() => dispatch({ type: 'POP_FORM' })}
 * />
 * ```
 */
export function FormStackRenderer({ stack, onClose }: FormStackRendererProps): ReactElement | null {
  // No forms to render
  if (stack.length === 0) {
    return null;
  }

  return (
    <div className="form-stack">
      {stack.map((entry, index) => {
        const isActive = index === stack.length - 1;

        // Create callbacks that resolve the deferred promise
        const handleSubmit = (value: unknown) => {
          entry.deferred.resolve(value);
          onClose();
        };

        const handleCancel = () => {
          entry.deferred.resolve(undefined);
          onClose();
        };

        const handleError = (error: unknown) => {
          entry.deferred.reject(error);
          onClose();
        };

        // Inject callbacks into the form component
        const formProps: FormProps<unknown> = {
          onSubmit: handleSubmit,
          onCancel: handleCancel,
          onError: handleError,
        };

        return (
          <div
            key={entry.id}
            className={`form-stack__form ${isActive ? 'form-stack__form--active' : ''}`}
            style={{ display: isActive ? 'block' : 'none' }}
            aria-hidden={!isActive}
            data-form-id={entry.id}
          >
            {createElement(entry.component, formProps)}
          </div>
        );
      })}
    </div>
  );
}
