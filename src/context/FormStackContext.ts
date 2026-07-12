import { createContext } from 'react';
import type { FormStackState, FormStackActions, FormStackViewportValue } from '../types';

/**
 * Context for reading form stack state.
 * Consumers of this context will re-render when stack changes.
 * Separated from actions context to minimize re-renders.
 */
export const FormStackStateContext = createContext<FormStackState | null>(null);
FormStackStateContext.displayName = 'FormStackStateContext';

/**
 * Context for dispatching form stack actions.
 * Consumers of this context will NOT re-render when stack changes.
 * Actions (openForm, closeForm) are stable references.
 */
export const FormStackActionsContext = createContext<FormStackActions | null>(null);
FormStackActionsContext.displayName = 'FormStackActionsContext';

/**
 * Carries the props required by {@link FormStackRenderer} (internal stack,
 * `onClose`, `onCancelRequest`) so a consumer-placed {@link FormStackViewport}
 * can render the stacked form bodies without exposing `InternalStackEntry`.
 *
 * The provider sets this to `null` when the stack is empty (and it is `null`
 * outside any provider), so {@link FormStackViewport} and
 * {@link useFormStackViewport} render/return nothing in those cases.
 */
export const FormStackViewportContext = createContext<FormStackViewportValue | null>(null);
FormStackViewportContext.displayName = 'FormStackViewportContext';

/**
 * Mount-tracking channel used only by {@link FormStackViewport} to register
 * itself with the provider. This powers the dev-mode diagnostics:
 *   - "forgotten host" warning: `autoRender={false}`, a form is open, but no
 *     viewport has mounted (count === 0).
 *   - "duplicate viewport" warning: more than one `<FormStackViewport/>` is
 *     mounted at once (count > 1), which renders the same form body multiple
 *     times.
 *
 * The callback receives a mount delta (`+1` on mount, `-1` on unmount) so the
 * provider can maintain an accurate count.
 *
 * @internal
 */
export const FormStackViewportMountContext = createContext<(delta: number) => void>(
  () => {},
);
FormStackViewportMountContext.displayName = 'FormStackViewportMountContext';
