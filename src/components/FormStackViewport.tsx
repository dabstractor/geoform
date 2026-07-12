import { useContext, useEffect, type ReactElement } from 'react';
import { FormStackViewportContext, FormStackViewportMountContext } from '../context';
import { FormStackRenderer } from './FormStackRenderer';

/**
 * Renders the form-stack viewport (the stacked form bodies: top visible,
 * parents mounted-but-hidden) wherever it is placed. Reads the stack from
 * context, so it requires **no props**. Intended for consumers who set
 * `<FormStackProvider autoRender={false}>` and want to host the viewport
 * inside their own window chrome (e.g. a single shared `<Dialog>`). Renders
 * nothing when the stack is empty.
 *
 * Internally renders {@link FormStackRenderer} with the provider's internal
 * stack, `onClose`, and `onCancelRequest`. Consumers do not need to touch
 * `InternalStackEntry`.
 *
 * @see {@link FormStackProvider} - Set `autoRender={false}` to host this yourself
 * @see {@link useFormStackViewport} - Low-level hook alternative
 * @see {@link FormStackRenderer} - The chrome-less renderer this wraps
 *
 * @example
 * ```tsx
 * import { FormStackProvider, FormStackViewport, useFormStackState } from 'geoform';
 *
 * function App() {
 *   return (
 *     <FormStackProvider autoRender={false}>
 *       <SharedModalHost />
 *     </FormStackProvider>
 *   );
 * }
 *
 * // One shared modal hosts every form in the stack, no matter how deep.
 * function SharedModalHost() {
 *   const { stack } = useFormStackState();
 *   return (
 *     <Dialog open={stack.length > 0}>
 *       <FormStackViewport />
 *     </Dialog>
 *   );
 * }
 * ```
 */
export function FormStackViewport(): ReactElement | null {
  const viewport = useContext(FormStackViewportContext);
  const setMounted = useContext(FormStackViewportMountContext);

  // Register with the provider so it can warn (in dev) when autoRender={false}
  // and a form is open but no viewport is mounted. Runs once per mount.
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, [setMounted]);

  // Nothing to render when outside a provider or when the stack is empty.
  if (!viewport) {
    return null;
  }

  return <FormStackRenderer {...viewport} />;
}
