import { useContext } from 'react';
import { FormStackStateContext } from '../context';
import type { FormStackState } from '../types';

/**
 * Hook to access form stack state (read-only).
 * Components using this hook will re-render when stack changes.
 *
 * @returns FormStackState containing the current stack array
 * @throws Error if used outside FormStackProvider
 *
 * @example
 * ```typescript
 * function Breadcrumbs() {
 *   const { stack } = useFormStackState();
 *   return (
 *     <nav>
 *       {stack.map(entry => <span key={entry.id}>{entry.label}</span>)}
 *     </nav>
 *   );
 * }
 * ```
 */
export function useFormStackState(): FormStackState {
  const context = useContext(FormStackStateContext);

  if (context === null) {
    throw new Error(
      'useFormStackState must be used within a FormStackProvider. ' +
      'Wrap your component tree with <FormStackProvider>.'
    );
  }

  return context;
}
