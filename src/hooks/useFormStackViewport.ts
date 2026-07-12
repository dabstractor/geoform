import { useContext, useMemo } from 'react';
import { FormStackViewportContext } from '../context';
import type { FormStackViewportValue } from '../types';

/**
 * Returns a **sanitized**, read-only view of the form-stack viewport: the open forms as
 * a `{ id, label? }[]` ({@link StackEntry} array) and the `onClose` callback. Use this
 * when you want to read the open forms for custom rendering (e.g. a host header or
 * summary) without mounting the renderer yourself.
 *
 * This hook is the **public** counterpart to the internal context value
 * ({@link FormStackViewportContextValue}) carried by {@link FormStackViewportContext}. It
 * deliberately exposes **only** `{ id, label }` entries and `onClose` — never the
 * internal stack-entry fields (`component`, `deferred`, `confirmOnCancel`) or
 * `onCancelRequest` — so a consumer cannot hijack a form's promise resolution
 * (`entry.deferred.resolve(...)`) or mount forms directly (PRD §10.1 "no internal-type
 * leakage").
 *
 * Returns `null` when the stack is empty (or when used outside a
 * {@link FormStackProvider}), so the natural guard is
 * `const viewport = useFormStackViewport(); if (!viewport) return null;`.
 *
 * Most consumers should use {@link FormStackViewport} (the zero-prop component) instead —
 * it renders the stacked form bodies for you. This hook is for advanced consumers who only
 * need the safe, display-oriented fields.
 *
 * @returns The sanitized {@link FormStackViewportValue} (`{ stack: readonly StackEntry[];
 * onClose }`), or `null` when there is nothing to render.
 * @throws {Error} Never throws — returns `null` outside a provider.
 *
 * @see {@link FormStackViewport} - The recommended, no-prop component form
 * @see {@link FormStackViewportValue} - The sanitized return type
 * @see {@link StackEntry} - The public entry type (`{ id, label? }`)
 *
 * @example
 * ```tsx
 * import { useFormStackViewport } from 'geoform';
 *
 * function OpenFormsSummary() {
 *   const viewport = useFormStackViewport();
 *   if (!viewport) return null;
 *   // Only safe, display-oriented fields are reachable:
 *   return (
 *     <ul>
 *       {viewport.stack.map((entry) => (
 *         <li key={entry.id}>{entry.label ?? entry.id}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useFormStackViewport(): FormStackViewportValue | null {
  const internal = useContext(FormStackViewportContext);
  return useMemo(() => {
    if (!internal) return null;
    return {
      stack: internal.stack.map(({ id, label }) => ({ id, label })),
      onClose: internal.onClose,
    };
  }, [internal]);
}
