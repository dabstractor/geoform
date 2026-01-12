# PRP: Form Rendering Engine (P1.M5)

**Milestone:** P1.M5 - Form Rendering Engine
**Project:** React Hierarchical Form Stack System (geoform)
**Status:** Implementation-ready
**Estimated Story Points:** 6 SP
**Dependencies:** P1.M4 (Complete) - Promise Utility and Hooks

---

## Goal

**Feature Goal**: Implement the FormStackRenderer component with hidden container pattern that renders all stack forms simultaneously (hidden via CSS), injects form callbacks (onSubmit, onCancel), and wires deferred promises so that `openForm()` returns a promise resolving when forms submit/cancel.

**Deliverable**:
- `src/components/FormStackRenderer.tsx` - Component that renders the form stack with hidden container pattern
- Updated `src/components/FormStackProvider.tsx` - Full `openForm` implementation using `createDeferredPromise`
- Unit tests for FormStackRenderer component
- Integration of promise resolution with form lifecycle

**Success Definition**:
1. FormStackRenderer renders all stack entries with CSS `display: none` for inactive forms
2. Active form (top of stack) is visible with `display: block`
3. Forms receive injected `onSubmit` and `onCancel` callbacks
4. `onSubmit(value)` resolves the deferred promise with the value and pops the form
5. `onCancel()` resolves the deferred promise with `undefined` and pops the form
6. `npm run type-check` passes with zero errors
7. `npm run test` passes all tests
8. `npm run build` succeeds
9. Parent form state is preserved while child forms are active (CSS hiding keeps components mounted)

---

## User Persona

**Target User**: React developer consuming the form stack library

**Use Case**: Building hierarchical forms where users can create dependent data (e.g., Organization → Team → User) without losing parent form state

**User Journey**:
1. Developer wraps app with `<FormStackProvider>`
2. Any component calls `const result = await openForm({ id, component, label })`
3. The new form appears, parent form is hidden but state preserved
4. User interacts with new form
5. Form calls `onSubmit(data)` → promise resolves with `data`
6. Form calls `onCancel()` → promise resolves with `undefined`
7. Parent form reappears with state intact, receives result

**Pain Points Addressed**:
- Losing parent form state when opening child forms (solved by hidden container)
- Complex promise wiring for async form results (solved by deferred promise pattern)
- Manual callback injection to form components (solved by FormStackRenderer)

---

## Why

- **State Preservation**: Hidden container pattern keeps parent forms mounted, preserving all internal state
- **Promise-Based API**: Enables clean async/await usage: `const user = await openForm({ ... })`
- **Separation of Concerns**: Forms don't know about the stack system - they just call onSubmit/onCancel
- **Foundation**: Required by P2 features (Breadcrumbs, Cancellation Confirmation, Error Boundaries)
- **PRD Requirement**: "Parent forms remain mounted but hidden" (PRD Section 10)

---

## What

### Success Criteria

- [ ] FormStackRenderer renders all stack entries as children
- [ ] Only the topmost (active) form is visible (`display: block`)
- [ ] All inactive forms are hidden (`display: none`) but remain mounted
- [ ] Each form receives injected `onSubmit` callback that resolves deferred promise
- [ ] Each form receives injected `onCancel` callback that resolves with undefined
- [ ] `openForm` creates a deferred promise and pushes form to stack
- [ ] `openForm` returns the deferred promise for caller to await
- [ ] Forms are rendered using `React.createElement(entry.component, injectedProps)`
- [ ] Stable keys prevent unnecessary re-renders (use entry.id)
- [ ] Hidden forms have `aria-hidden="true"` for accessibility
- [ ] Tests verify promise resolution on submit
- [ ] Tests verify promise resolves undefined on cancel
- [ ] Tests verify parent form stays mounted when child opens
- [ ] `npm run type-check` passes
- [ ] `npm run test` passes
- [ ] `npm run build` generates declarations

---

## All Needed Context

### Context Completeness Check

_This PRP provides everything needed for an implementer with no prior codebase knowledge. All patterns are explicitly specified with complete code examples and references to existing implementations._

### Documentation & References

```yaml
# MUST READ - Existing type definitions
- file: src/types/form.ts
  why: Contains FormProps<T>, DeferredPromise<T> interfaces
  pattern: FormProps has onSubmit, onCancel, onError - inject these to each form
  critical: |
    DeferredPromise<T> has promise, resolve, reject
    resolve(value) for submit, resolve(undefined) for cancel

- file: src/types/stack.ts
  why: Contains InternalStackEntry<T>, OpenFormOptions<T>
  pattern: InternalStackEntry has component, deferred, confirmOnCancel
  critical: |
    InternalStackEntry extends StackEntry with internal details
    component is ComponentType<FormProps<T>>
    deferred is DeferredPromise<T>

- file: src/types/context.ts
  why: Contains FormStackReducerState, FormStackAction
  pattern: PUSH_FORM action requires InternalStackEntry<unknown>
  critical: |
    FormStackReducerState.stack is InternalStackEntry<unknown>[]
    Use this for rendering, not the public FormStackState

- file: src/utils/createDeferredPromise.ts
  why: Creates deferred promise for async form resolution
  pattern: Call createDeferredPromise<T>() to get {promise, resolve, reject}
  critical: |
    Called in openForm to create the promise BEFORE pushing to stack
    resolve is called in onSubmit/onCancel injected callbacks
    The promise is returned to caller immediately

- file: src/context/formStackReducer.ts
  why: Reducer handles PUSH_FORM, POP_FORM, POP_TO_INDEX
  pattern: PUSH_FORM appends entry to stack immutably
  critical: Entry must include component, deferred, confirmOnCancel

- file: src/context/FormStackContext.ts
  why: Contains dual contexts for state/actions
  pattern: FormStackStateContext for reading, FormStackActionsContext for dispatch
  critical: Provider already exists, FormStackRenderer uses internal state

- file: src/components/FormStackProvider.tsx
  why: Current provider has placeholder openForm - MUST UPDATE
  pattern: Nested dual contexts, uses useReducer
  critical: |
    openForm is currently a placeholder returning Promise.resolve(undefined)
    Must be updated to use createDeferredPromise and dispatch PUSH_FORM

# MUST READ - Research documentation
- docfile: plan/P1M5/research/hidden-container-pattern.md
  why: Complete guide on CSS hiding for state preservation
  section: "CSS Approaches for Hiding" and "Accessibility Concerns"
  critical: |
    Use display: none (not visibility: hidden)
    Add aria-hidden="true" to hidden containers
    Do NOT add tabindex="-1" to inputs (display:none handles focus)

- docfile: plan/P1M5/research/form-rendering-patterns.md
  why: Promise wiring patterns for form callbacks
  section: "Wiring Deferred Promises to Form Callbacks"
  critical: |
    onSubmit(data) → deferred.resolve(data) → pop form
    onCancel() → deferred.resolve(undefined) → pop form

- docfile: plan/P1M5/research/conditional-rendering-patterns.md
  why: Performance and memoization patterns
  section: "React.memo for Form Components"
  critical: Key prop must be stable (use entry.id)

# Testing patterns
- file: src/hooks/__tests__/useFormStackActions.test.tsx
  why: Shows testing pattern with FormStackProvider wrapper
  pattern: Use renderHook with wrapper component
  gotcha: Must wrap with FormStackProvider for context access

- file: src/context/__tests__/formStackReducer.test.ts
  why: Shows createMockEntry helper for tests
  pattern: AAA pattern, describe blocks for organization
  critical: Mock entries need all InternalStackEntry fields
```

### Current Codebase Tree

```bash
geoform-opus/
├── src/
│   ├── index.ts              # Main barrel (placeholder)
│   ├── types/
│   │   ├── index.ts          # Exports all types ✓
│   │   ├── form.ts           # FormProps<T>, DeferredPromise<T> ✓
│   │   ├── stack.ts          # StackEntry, OpenFormOptions<T>, InternalStackEntry<T> ✓
│   │   ├── context.ts        # FormStackState, FormStackActions, FormStackAction ✓
│   │   └── __tests__/types.test.ts ✓
│   ├── hooks/
│   │   ├── index.ts          # Exports all hooks ✓
│   │   ├── useFormStack.ts   # Combined hook ✓
│   │   ├── useFormStackState.ts ✓
│   │   ├── useFormStackActions.ts ✓
│   │   └── __tests__/ (3 test files) ✓
│   ├── components/
│   │   ├── index.ts          # Exports FormStackProvider ✓
│   │   └── FormStackProvider.tsx  # Provider with placeholder openForm ✓
│   ├── context/
│   │   ├── index.ts          # Exports reducer and contexts ✓
│   │   ├── formStackReducer.ts ✓
│   │   ├── FormStackContext.ts ✓
│   │   └── __tests__/formStackReducer.test.ts ✓
│   ├── utils/
│   │   ├── index.ts          # Exports createDeferredPromise ✓
│   │   ├── createDeferredPromise.ts ✓
│   │   └── __tests__/createDeferredPromise.test.ts ✓
│   └── __tests__/
│       └── setup.test.tsx    # Test setup verification ✓
├── plan/
│   ├── architecture/
│   └── P1M5/
│       ├── PRP.md            # This file
│       └── research/
│           ├── README.md
│           ├── hidden-container-pattern.md
│           ├── form-rendering-patterns.md
│           ├── conditional-rendering-patterns.md
│           └── implementation-quick-reference.md
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── PRD.md
```

### Desired Codebase Tree After Implementation

```bash
geoform-opus/
├── src/
│   ├── components/
│   │   ├── index.ts                    # MODIFY: Export FormStackRenderer
│   │   ├── FormStackProvider.tsx       # MODIFY: Full openForm implementation
│   │   └── FormStackRenderer.tsx       # NEW: Hidden container form rendering
│   ├── components/__tests__/
│   │   └── FormStackRenderer.test.tsx  # NEW: Renderer tests
│   └── ... (other directories unchanged)
└── ... (config files unchanged)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Hidden container pattern uses CSS display, not conditional rendering
// This preserves component state when forms are hidden
// WRONG:
{isActive && <FormComponent />}  // Unmounts when hidden, loses state!

// CORRECT:
<div style={{ display: isActive ? 'block' : 'none' }}>
  <FormComponent />
</div>

// CRITICAL: Use React.createElement for dynamic component rendering
// The component type comes from stack entry at runtime
const element = React.createElement(
  entry.component,  // ComponentType<FormProps<T>>
  {
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    onError: handleError,
  }
);

// CRITICAL: Keys must be stable - use entry.id, not array index
// Changing keys causes remount and state loss
{stack.map(entry => (
  <div key={entry.id}>  // Good: stable ID
    {/* form content */}
  </div>
))}

// CRITICAL: Resolve promise BEFORE removing from stack
// Ensures caller receives value before cleanup
const handleSubmit = (value: T) => {
  entry.deferred.resolve(value);  // First: resolve
  dispatch({ type: 'POP_FORM' }); // Then: remove from stack
};

// CRITICAL: aria-hidden for accessibility
// Hidden forms should not be accessible to screen readers
<div
  style={{ display: isActive ? 'block' : 'none' }}
  aria-hidden={!isActive}
>
  <FormComponent />
</div>

// GOTCHA: openForm must create deferred and add to entry BEFORE pushing
const openForm = <T,>(options: OpenFormOptions<T>): Promise<T | undefined> => {
  const deferred = createDeferredPromise<T>();

  const entry: InternalStackEntry<T> = {
    id: options.id,
    label: options.label,
    component: options.component,
    confirmOnCancel: options.confirmOnCancel ?? false,
    deferred,
  };

  dispatch({ type: 'PUSH_FORM', entry: entry as InternalStackEntry<unknown> });

  return deferred.promise;  // Return immediately, caller awaits
};

// GOTCHA: FormStackRenderer needs internal state, not public state
// Use a new internal context or access reducer state directly
// FormStackStateContext only exposes {stack: StackEntry[]} (no component/deferred)
// FormStackRenderer needs InternalStackEntry[] to render components

// SOLUTION: Create internal context or pass state as prop
const InternalFormStackContext = createContext<FormStackReducerState | null>(null);

// GOTCHA: TypeScript generic handling in openForm
// The entry must be cast to InternalStackEntry<unknown> for the reducer
// because FormStackAction uses InternalStackEntry<unknown>
dispatch({ type: 'PUSH_FORM', entry: entry as InternalStackEntry<unknown> });
```

---

## Implementation Blueprint

### Data Models and Structure

No new types needed. This milestone uses existing types from P1.M2:
- `InternalStackEntry<T>` - Full stack entry with component, deferred
- `OpenFormOptions<T>` - Options passed to openForm
- `FormProps<T>` - Props injected into form components
- `DeferredPromise<T>` - Promise with exposed resolve/reject

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/components/FormStackRenderer.tsx
  - IMPLEMENT: Component that renders form stack with hidden container pattern
  - FOLLOW pattern: Hidden container (CSS display: none for inactive)
  - NAMING: FormStackRenderer (PascalCase component)
  - PLACEMENT: src/components/FormStackRenderer.tsx
  - DEPENDENCIES: Requires InternalStackEntry access (internal context or prop)
  - CONTENT:
    ```typescript
    import React, { createElement, useCallback, type ReactElement } from 'react';
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
    ```
  - VALIDATION: npm run type-check passes

Task 2: MODIFY src/components/FormStackProvider.tsx
  - IMPLEMENT: Full openForm implementation with createDeferredPromise
  - FOLLOW pattern: Existing provider structure, add FormStackRenderer
  - NAMING: Keep existing function names
  - PLACEMENT: Modify existing file
  - DEPENDENCIES: createDeferredPromise from utils, FormStackRenderer from Task 1
  - CHANGES:
    1. Import createDeferredPromise from '../utils'
    2. Import FormStackRenderer from './FormStackRenderer'
    3. Replace placeholder openForm with full implementation
    4. Render FormStackRenderer inside providers
  - CONTENT (updated openForm):
    ```typescript
    import { useReducer, useMemo, useCallback, type ReactNode } from 'react';
    import { formStackReducer, initialFormStackState } from '../context/formStackReducer';
    import { FormStackStateContext, FormStackActionsContext } from '../context/FormStackContext';
    import { FormStackRenderer } from './FormStackRenderer';
    import { createDeferredPromise } from '../utils';
    import type { FormStackState, FormStackActions, OpenFormOptions, InternalStackEntry } from '../types';

    export interface FormStackProviderProps {
      children: ReactNode;
    }

    export function FormStackProvider({ children }: FormStackProviderProps) {
      const [state, dispatch] = useReducer(formStackReducer, initialFormStackState);

      // Convert internal stack to public stack view
      const stateValue = useMemo<FormStackState>(() => ({
        stack: state.stack.map(entry => ({
          id: entry.id,
          label: entry.label,
        })),
      }), [state.stack]);

      // Full openForm implementation with deferred promise
      const openForm = useCallback(<T,>(options: OpenFormOptions<T>): Promise<T | undefined> => {
        // Create deferred promise for async resolution
        const deferred = createDeferredPromise<T>();

        // Create internal stack entry
        const entry: InternalStackEntry<T> = {
          id: options.id,
          label: options.label,
          component: options.component,
          confirmOnCancel: options.confirmOnCancel ?? false,
          deferred,
        };

        // Push form onto stack (cast to unknown for reducer type compatibility)
        dispatch({ type: 'PUSH_FORM', entry: entry as InternalStackEntry<unknown> });

        // Return promise immediately - caller awaits
        return deferred.promise;
      }, []);

      const closeForm = useCallback(() => {
        dispatch({ type: 'POP_FORM' });
      }, []);

      const actionsValue = useMemo<FormStackActions>(() => ({
        openForm,
        closeForm,
      }), [openForm, closeForm]);

      return (
        <FormStackStateContext.Provider value={stateValue}>
          <FormStackActionsContext.Provider value={actionsValue}>
            {children}
            <FormStackRenderer
              stack={state.stack}
              onClose={closeForm}
            />
          </FormStackActionsContext.Provider>
        </FormStackStateContext.Provider>
      );
    }
    ```
  - VALIDATION: npm run type-check passes

Task 3: MODIFY src/components/index.ts
  - IMPLEMENT: Export FormStackRenderer from barrel
  - NAMING: Standard barrel export pattern
  - PLACEMENT: Modify existing file
  - CONTENT:
    ```typescript
    export { FormStackProvider } from './FormStackProvider';
    export type { FormStackProviderProps } from './FormStackProvider';

    export { FormStackRenderer } from './FormStackRenderer';
    export type { FormStackRendererProps } from './FormStackRenderer';
    ```
  - VALIDATION: Imports work from 'src/components'

Task 4: CREATE src/components/__tests__/FormStackRenderer.test.tsx
  - IMPLEMENT: Unit tests for FormStackRenderer
  - FOLLOW pattern: AAA (Arrange-Act-Assert), describe blocks, Testing Library
  - NAMING: FormStackRenderer.test.tsx
  - PLACEMENT: src/components/__tests__/
  - CONTENT:
    ```typescript
    import { describe, it, expect, vi } from 'vitest';
    import { render, screen, fireEvent } from '@testing-library/react';
    import { FormStackRenderer } from '../FormStackRenderer';
    import type { InternalStackEntry, FormProps, DeferredPromise } from '../../types';

    // Helper to create mock deferred promise
    const createMockDeferred = <T,>(): DeferredPromise<T> => {
      let resolveRef: (value: T | undefined) => void;
      let rejectRef: (reason?: unknown) => void;

      const promise = new Promise<T | undefined>((resolve, reject) => {
        resolveRef = resolve;
        rejectRef = reject;
      });

      return {
        promise,
        resolve: resolveRef!,
        reject: rejectRef!,
      };
    };

    // Helper to create mock stack entry
    const createMockEntry = (
      id: string,
      label?: string,
      deferred?: DeferredPromise<unknown>
    ): InternalStackEntry<unknown> => ({
      id,
      label,
      component: ({ onSubmit, onCancel }: FormProps<unknown>) => (
        <div data-testid={`form-${id}`}>
          <span>Form: {id}</span>
          <button onClick={() => onSubmit({ value: id })} data-testid={`submit-${id}`}>
            Submit
          </button>
          <button onClick={onCancel} data-testid={`cancel-${id}`}>
            Cancel
          </button>
        </div>
      ),
      confirmOnCancel: false,
      deferred: deferred ?? createMockDeferred(),
    });

    describe('FormStackRenderer', () => {
      describe('when stack is empty', () => {
        it('should render nothing', () => {
          // Arrange
          const onClose = vi.fn();

          // Act
          const { container } = render(
            <FormStackRenderer stack={[]} onClose={onClose} />
          );

          // Assert
          expect(container.firstChild).toBeNull();
        });
      });

      describe('when stack has one form', () => {
        it('should render the form as visible', () => {
          // Arrange
          const stack = [createMockEntry('form-1', 'Form 1')];
          const onClose = vi.fn();

          // Act
          render(<FormStackRenderer stack={stack} onClose={onClose} />);

          // Assert
          expect(screen.getByTestId('form-form-1')).toBeInTheDocument();
          const formContainer = screen.getByTestId('form-form-1').parentElement;
          expect(formContainer).toHaveStyle('display: block');
          expect(formContainer).toHaveAttribute('aria-hidden', 'false');
        });
      });

      describe('when stack has multiple forms', () => {
        it('should render only the top form as visible', () => {
          // Arrange
          const stack = [
            createMockEntry('form-1', 'Form 1'),
            createMockEntry('form-2', 'Form 2'),
          ];
          const onClose = vi.fn();

          // Act
          render(<FormStackRenderer stack={stack} onClose={onClose} />);

          // Assert - both forms are in DOM
          expect(screen.getByTestId('form-form-1')).toBeInTheDocument();
          expect(screen.getByTestId('form-form-2')).toBeInTheDocument();

          // First form is hidden
          const form1Container = screen.getByTestId('form-form-1').parentElement;
          expect(form1Container).toHaveStyle('display: none');
          expect(form1Container).toHaveAttribute('aria-hidden', 'true');

          // Second form (top) is visible
          const form2Container = screen.getByTestId('form-form-2').parentElement;
          expect(form2Container).toHaveStyle('display: block');
          expect(form2Container).toHaveAttribute('aria-hidden', 'false');
        });

        it('should render three-level stack correctly', () => {
          // Arrange
          const stack = [
            createMockEntry('form-1'),
            createMockEntry('form-2'),
            createMockEntry('form-3'),
          ];
          const onClose = vi.fn();

          // Act
          render(<FormStackRenderer stack={stack} onClose={onClose} />);

          // Assert - only form-3 visible
          expect(screen.getByTestId('form-form-1').parentElement).toHaveStyle('display: none');
          expect(screen.getByTestId('form-form-2').parentElement).toHaveStyle('display: none');
          expect(screen.getByTestId('form-form-3').parentElement).toHaveStyle('display: block');
        });
      });

      describe('form callbacks', () => {
        it('should resolve deferred promise on submit', async () => {
          // Arrange
          const deferred = createMockDeferred<{ value: string }>();
          const resolveSpy = vi.spyOn(deferred, 'resolve');
          const stack = [createMockEntry('form-1', 'Form 1', deferred as DeferredPromise<unknown>)];
          const onClose = vi.fn();

          // Act
          render(<FormStackRenderer stack={stack} onClose={onClose} />);
          fireEvent.click(screen.getByTestId('submit-form-1'));

          // Assert
          expect(resolveSpy).toHaveBeenCalledWith({ value: 'form-1' });
          expect(onClose).toHaveBeenCalled();
        });

        it('should resolve deferred promise with undefined on cancel', async () => {
          // Arrange
          const deferred = createMockDeferred<unknown>();
          const resolveSpy = vi.spyOn(deferred, 'resolve');
          const stack = [createMockEntry('form-1', 'Form 1', deferred)];
          const onClose = vi.fn();

          // Act
          render(<FormStackRenderer stack={stack} onClose={onClose} />);
          fireEvent.click(screen.getByTestId('cancel-form-1'));

          // Assert
          expect(resolveSpy).toHaveBeenCalledWith(undefined);
          expect(onClose).toHaveBeenCalled();
        });
      });

      describe('key stability', () => {
        it('should use entry.id as key', () => {
          // Arrange
          const stack = [
            createMockEntry('unique-id-1', 'Form 1'),
            createMockEntry('unique-id-2', 'Form 2'),
          ];
          const onClose = vi.fn();

          // Act
          render(<FormStackRenderer stack={stack} onClose={onClose} />);

          // Assert - check data-form-id attribute matches id
          expect(screen.getByTestId('form-unique-id-1').parentElement).toHaveAttribute(
            'data-form-id',
            'unique-id-1'
          );
          expect(screen.getByTestId('form-unique-id-2').parentElement).toHaveAttribute(
            'data-form-id',
            'unique-id-2'
          );
        });
      });
    });
    ```
  - VALIDATION: npm run test passes

Task 5: CREATE src/components/__tests__/FormStackProvider.integration.test.tsx
  - IMPLEMENT: Integration tests for full form lifecycle
  - FOLLOW pattern: Integration testing with actual components
  - NAMING: FormStackProvider.integration.test.tsx
  - PLACEMENT: src/components/__tests__/
  - CONTENT:
    ```typescript
    import { describe, it, expect, vi } from 'vitest';
    import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
    import { FormStackProvider } from '../FormStackProvider';
    import { useFormStack } from '../../hooks';
    import type { FormProps } from '../../types';

    // Test form component
    function TestForm({ onSubmit, onCancel }: FormProps<{ name: string }>) {
      return (
        <div data-testid="test-form">
          <button
            data-testid="submit-btn"
            onClick={() => onSubmit({ name: 'Test User' })}
          >
            Submit
          </button>
          <button
            data-testid="cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      );
    }

    // Test component that uses the hook
    function TestConsumer({ onResult }: { onResult: (val: unknown) => void }) {
      const { openForm, stack } = useFormStack();

      const handleOpenForm = async () => {
        const result = await openForm({
          id: 'test-form',
          component: TestForm,
          label: 'Test Form',
        });
        onResult(result);
      };

      return (
        <div>
          <span data-testid="stack-length">{stack.length}</span>
          <button data-testid="open-form" onClick={handleOpenForm}>
            Open Form
          </button>
        </div>
      );
    }

    describe('FormStackProvider Integration', () => {
      describe('openForm lifecycle', () => {
        it('should add form to stack when openForm is called', async () => {
          // Arrange
          const onResult = vi.fn();

          // Act
          render(
            <FormStackProvider>
              <TestConsumer onResult={onResult} />
            </FormStackProvider>
          );

          expect(screen.getByTestId('stack-length')).toHaveTextContent('0');

          await act(async () => {
            fireEvent.click(screen.getByTestId('open-form'));
          });

          // Assert - form is in stack and visible
          expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
          expect(screen.getByTestId('test-form')).toBeInTheDocument();
        });

        it('should resolve promise with value on submit', async () => {
          // Arrange
          const onResult = vi.fn();

          render(
            <FormStackProvider>
              <TestConsumer onResult={onResult} />
            </FormStackProvider>
          );

          // Act - open form
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-form'));
          });

          // Act - submit form
          await act(async () => {
            fireEvent.click(screen.getByTestId('submit-btn'));
          });

          // Assert
          await waitFor(() => {
            expect(onResult).toHaveBeenCalledWith({ name: 'Test User' });
          });
          expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
        });

        it('should resolve promise with undefined on cancel', async () => {
          // Arrange
          const onResult = vi.fn();

          render(
            <FormStackProvider>
              <TestConsumer onResult={onResult} />
            </FormStackProvider>
          );

          // Act - open form
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-form'));
          });

          // Act - cancel form
          await act(async () => {
            fireEvent.click(screen.getByTestId('cancel-btn'));
          });

          // Assert
          await waitFor(() => {
            expect(onResult).toHaveBeenCalledWith(undefined);
          });
          expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
        });
      });

      describe('nested forms', () => {
        it('should preserve parent form in DOM while child is active', async () => {
          // Arrange
          function ParentForm({ onSubmit, onCancel }: FormProps<string>) {
            const { openForm } = useFormStack();

            const handleOpenChild = async () => {
              const childResult = await openForm({
                id: 'child-form',
                component: ChildForm,
                label: 'Child',
              });
              // After child closes, parent can use result
            };

            return (
              <div data-testid="parent-form">
                <span>Parent Form</span>
                <button data-testid="open-child" onClick={handleOpenChild}>
                  Open Child
                </button>
                <button onClick={() => onSubmit('parent-result')}>Submit Parent</button>
              </div>
            );
          }

          function ChildForm({ onSubmit, onCancel }: FormProps<string>) {
            return (
              <div data-testid="child-form">
                <span>Child Form</span>
                <button data-testid="submit-child" onClick={() => onSubmit('child-result')}>
                  Submit Child
                </button>
              </div>
            );
          }

          function TestApp() {
            const { openForm } = useFormStack();

            return (
              <button
                data-testid="open-parent"
                onClick={() => openForm({ id: 'parent', component: ParentForm })}
              >
                Open Parent
              </button>
            );
          }

          render(
            <FormStackProvider>
              <TestApp />
            </FormStackProvider>
          );

          // Act - open parent
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-parent'));
          });

          expect(screen.getByTestId('parent-form')).toBeInTheDocument();

          // Act - open child from parent
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-child'));
          });

          // Assert - both forms in DOM
          expect(screen.getByTestId('parent-form')).toBeInTheDocument();
          expect(screen.getByTestId('child-form')).toBeInTheDocument();

          // Parent is hidden, child is visible
          expect(screen.getByTestId('parent-form').parentElement).toHaveStyle('display: none');
          expect(screen.getByTestId('child-form').parentElement).toHaveStyle('display: block');
        });
      });
    });
    ```
  - VALIDATION: npm run test passes
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Hidden Container for State Preservation
// All forms rendered to DOM, inactive ones hidden with CSS
{stack.map((entry, index) => {
  const isActive = index === stack.length - 1;
  return (
    <div
      key={entry.id}
      style={{ display: isActive ? 'block' : 'none' }}
      aria-hidden={!isActive}
    >
      {React.createElement(entry.component, injectedProps)}
    </div>
  );
})}

// PATTERN: Deferred Promise Integration
// openForm creates promise, push to stack, return promise
const openForm = <T,>(options: OpenFormOptions<T>) => {
  const deferred = createDeferredPromise<T>();
  const entry = { ...options, deferred };
  dispatch({ type: 'PUSH_FORM', entry });
  return deferred.promise;
};

// PATTERN: Callback Injection
// Wrap deferred.resolve in callbacks passed to form
const handleSubmit = (value: T) => {
  entry.deferred.resolve(value);
  onClose();
};
const handleCancel = () => {
  entry.deferred.resolve(undefined);
  onClose();
};

// PATTERN: FormStackRenderer Props
// Pass internal stack and close handler
<FormStackRenderer
  stack={state.stack}  // InternalStackEntry[] with components
  onClose={closeForm}  // dispatch POP_FORM
/>
```

### Integration Points

```yaml
TYPES:
  - Import from: src/types
  - Pattern: "import type { TypeName } from '../types'"
  - Used types: FormProps, InternalStackEntry, OpenFormOptions, DeferredPromise

UTILS:
  - Import from: src/utils
  - Pattern: "import { createDeferredPromise } from '../utils'"
  - Used in: FormStackProvider.openForm

CONTEXT:
  - Import from: src/context
  - Pattern: "import { formStackReducer } from '../context'"
  - Used in: FormStackProvider for state management

COMPONENTS_BARREL:
  - Export from: src/components/index.ts
  - Pattern: "export { FormStackRenderer } from './FormStackRenderer'"
  - Used by: P1.M6 (public API)

BUILD:
  - tsup with dts: true generates declarations
  - Types included via tsconfig declaration: true
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating each file, verify TypeScript compiles
npm run type-check

# Expected: Zero errors
# If errors: Check imports, verify generic handling, ensure types match

# Format check (if configured)
npm run lint || true
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run FormStackRenderer tests
npm run test -- src/components/__tests__/FormStackRenderer.test.tsx

# Expected output:
# ✓ FormStackRenderer > when stack is empty > should render nothing
# ✓ FormStackRenderer > when stack has one form > should render the form as visible
# ✓ FormStackRenderer > when stack has multiple forms > should render only the top form as visible
# ✓ FormStackRenderer > when stack has multiple forms > should render three-level stack correctly
# ✓ FormStackRenderer > form callbacks > should resolve deferred promise on submit
# ✓ FormStackRenderer > form callbacks > should resolve deferred promise with undefined on cancel
# ✓ FormStackRenderer > key stability > should use entry.id as key

# Run integration tests
npm run test -- src/components/__tests__/FormStackProvider.integration.test.tsx

# Run all tests
npm run test

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Build to verify all exports work
npm run build

# Verify output files exist
ls dist/*.d.ts
# Expected: dist/index.d.ts exists

# Verify types are exported
grep -l "FormStackRenderer" dist/index.d.ts || echo "Check exports"

# Type check the built output
npx tsc --noEmit dist/index.d.ts 2>/dev/null || echo "Check declaration output"
```

### Level 4: Manual Verification

```bash
# Create a test file to verify usage pattern
cat > /tmp/test-usage.tsx << 'EOF'
import { FormStackProvider, FormStackRenderer } from './src/components';
import { useFormStack } from './src/hooks';
import type { FormProps } from './src/types';

// Test form
function MyForm({ onSubmit, onCancel }: FormProps<{ name: string }>) {
  return (
    <form>
      <input name="name" />
      <button type="button" onClick={() => onSubmit({ name: 'Test' })}>
        Submit
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}

// Test consumer
function TestApp() {
  const { openForm, stack } = useFormStack();

  const handleOpen = async () => {
    const result = await openForm({
      id: 'my-form',
      component: MyForm,
      label: 'My Form',
    });

    if (result) {
      console.log('Submitted:', result.name);
    } else {
      console.log('Cancelled');
    }
  };

  return (
    <div>
      <p>Stack depth: {stack.length}</p>
      <button onClick={handleOpen}>Open Form</button>
    </div>
  );
}

// App with provider
function App() {
  return (
    <FormStackProvider>
      <TestApp />
    </FormStackProvider>
  );
}
EOF

# Type check the test file (if in project context)
echo "Manual verification: Create test component and verify compilation"
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run test` passes all tests (existing + new)
- [ ] `npm run build` generates dist/index.d.ts with declarations
- [ ] FormStackRenderer.tsx created with correct hidden container pattern
- [ ] FormStackProvider.tsx updated with full openForm implementation

### Feature Validation

- [ ] FormStackRenderer renders empty stack as null
- [ ] FormStackRenderer renders single form as visible
- [ ] FormStackRenderer renders multiple forms with only top visible
- [ ] Inactive forms have `display: none` and `aria-hidden="true"`
- [ ] Active form has `display: block` and `aria-hidden="false"`
- [ ] onSubmit callback resolves deferred promise with value
- [ ] onCancel callback resolves deferred promise with undefined
- [ ] onClose is called after promise resolution
- [ ] openForm creates deferred promise and returns it
- [ ] openForm dispatches PUSH_FORM with full entry
- [ ] Parent form stays mounted (in DOM) when child opens
- [ ] Child closing restores parent visibility

### Code Quality Validation

- [ ] Uses `import type` for type-only imports
- [ ] All functions have JSDoc comments
- [ ] Components use stable keys (entry.id)
- [ ] FormStackRenderer receives stack as prop (not from context)
- [ ] Generic handling is correct (<T,> syntax for callbacks)
- [ ] Uses React.createElement for dynamic component rendering
- [ ] CSS hiding uses inline styles (display: block/none)
- [ ] Accessibility: aria-hidden on inactive containers

### Documentation & Deployment

- [ ] JSDoc comments on FormStackRenderer component
- [ ] JSDoc comments on FormStackRendererProps interface
- [ ] Barrel exports updated in src/components/index.ts
- [ ] Build succeeds with type declarations

---

## Anti-Patterns to Avoid

- **DON'T** use conditional rendering (`{isActive && <Form />}`) - loses state on hide
- **DON'T** forget aria-hidden - breaks accessibility for screen readers
- **DON'T** use array index as key - causes remount on stack changes
- **DON'T** resolve promise AFTER popping from stack - race condition
- **DON'T** forget to handle onError - forms should be able to reject
- **DON'T** use context for internal state in renderer - use props
- **DON'T** mutate deferred promise after resolution
- **DON'T** forget generic typing in openForm - need `<T,>` syntax

---

## Confidence Score

**9/10** - Very high confidence for one-pass implementation success

**Rationale:**
- All types already defined and tested (P1.M2, P1.M4 complete)
- createDeferredPromise utility exists and is tested
- Reducer and context infrastructure ready from P1.M3
- Hidden container pattern thoroughly researched
- Promise wiring pattern explicitly documented
- Test patterns established from prior milestones
- Build and validation commands verified working

**Risk Mitigation:**
- If type-check fails: Verify generic handling (`<T,>` vs `<T>`)
- If tests fail: Check mock entry structure matches InternalStackEntry
- If DOM assertions fail: Verify Testing Library matchers for style checks
- If build fails: Ensure barrel exports are correct

---

## Quick Start for Implementation

```bash
# 1. Create FormStackRenderer
touch src/components/FormStackRenderer.tsx
# Copy content from Task 1

# 2. Update FormStackProvider
# Modify src/components/FormStackProvider.tsx per Task 2

# 3. Update barrel exports
# Modify src/components/index.ts per Task 3

# 4. Create test directory and test files
mkdir -p src/components/__tests__
touch src/components/__tests__/FormStackRenderer.test.tsx
touch src/components/__tests__/FormStackProvider.integration.test.tsx
# Copy content from Task 4 and Task 5

# 5. Validate
npm run type-check && npm run test && npm run build

# Expected: All commands pass, ready for P1.M6
```

---

## Research References

The following research documents are available in `plan/P1M5/research/`:

1. **hidden-container-pattern.md** (28KB) - Complete guide on CSS hiding
   - CSS approaches comparison
   - Accessibility concerns and solutions
   - Performance optimization
   - Library examples (React 19 Activity, react-activation)

2. **form-rendering-patterns.md** (30KB) - Form stack rendering patterns
   - Component rendering with visibility control
   - Promise resolution integration (deferred promises)
   - State preservation techniques
   - Focus management

3. **conditional-rendering-patterns.md** (28KB) - Conditional rendering guide
   - Ternary vs CSS display comparison
   - State preservation: unmounting vs hiding
   - Performance optimization with React.memo
   - React 18+ patterns (Suspense, Transitions)

4. **implementation-quick-reference.md** (8KB) - Quick lookup templates
   - Decision trees
   - Checklists
   - Common pitfalls

Key external documentation:
- [React.dev - createElement](https://react.dev/reference/react/createElement)
- [React.dev - Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [React Focus Lock](https://github.com/theKashey/react-focus-lock)
