import { useContext } from 'react';
import { FormStackViewportContext } from '../context';
import type { FormStackViewportValue } from '../types';

/**
 * Returns the props required by {@link FormStackRenderer} (internal stack,
 * `onClose`, `onCancelRequest`). For consumers who want to forward custom
 * props to {@link FormStackRenderer} or wrap it. Most consumers should use
 * {@link FormStackViewport} instead.
 *
 * Returns `null` when the stack is empty (or when used outside a
 * {@link FormStackProvider}), so the natural guard is
 * `const viewport = useFormStackViewport(); if (!viewport) return null;`.
 *
 * @returns The {@link FormStackViewportValue} (assignable to
 * {@link FormStackRendererProps}), or `null` when there is nothing to render.
 * @throws {Error} Never throws — returns `null` outside a provider.
 *
 * @see {@link FormStackViewport} - The recommended, no-prop component form
 * @see {@link FormStackRenderer} - The low-level renderer this powers
 *
 * @example
 * ```tsx
 * import { useFormStackViewport, FormStackRenderer } from 'geoform';
 *
 * function CustomHost() {
 *   const viewport = useFormStackViewport();
 *   if (!viewport) return null;
 *   // viewport is assignable to FormStackRendererProps
 *   return <FormStackRenderer {...viewport} />;
 * }
 * ```
 */
export function useFormStackViewport(): FormStackViewportValue | null {
  return useContext(FormStackViewportContext);
}
