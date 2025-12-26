import { createContext } from 'react';
import type { FormStackState, FormStackActions } from '../types';

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
