import type { ComponentType } from 'react';
import type { FormProps, DeferredPromise } from './form';

/**
 * Public view of a stack entry for breadcrumb rendering.
 * Consumers see this via useFormStack().stack
 */
export interface StackEntry {
  /** Unique identifier for the form */
  id: string;
  /** Optional display label for breadcrumbs */
  label?: string;
}

/**
 * Options passed to openForm() to open a new form.
 * @template T - The type of value the form will return
 */
export interface OpenFormOptions<T = unknown> {
  /** Unique identifier for this form instance */
  id: string;
  /** The form component to render (must accept FormProps<T>) */
  component: ComponentType<FormProps<T>>;
  /** Optional label displayed in breadcrumbs */
  label?: string;
  /** If true, shows confirmation dialog before cancel */
  confirmOnCancel?: boolean;
}

/**
 * Internal representation of a stack entry.
 * Extends StackEntry with implementation details (not exposed publicly).
 * @template T - The type of value the form will return
 */
export interface InternalStackEntry<T = unknown> extends StackEntry {
  /** The form component to render */
  component: ComponentType<FormProps<T>>;
  /** Whether to show confirmation before cancel (default: false) */
  confirmOnCancel: boolean;
  /** Deferred promise for async openForm resolution */
  deferred: DeferredPromise<T>;
}
