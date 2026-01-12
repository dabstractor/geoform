# PRP: Promise Utility and Hooks (P1.M4)

**Milestone:** P1.M4 - Promise Utility and Hooks
**Project:** React Hierarchical Form Stack System (geoform)
**Status:** Foundation for async form resolution and context consumption
**Estimated Story Points:** 4 SP
**Dependencies:** P1.M3 (Complete) - Dual Context Implementation

---

## Goal

**Feature Goal**: Implement the `createDeferredPromise` utility function and custom hooks (`useFormStackState`, `useFormStackActions`, `useFormStack`) for type-safe consumption of the form stack contexts, enabling components to access stack state and actions with proper error handling when used outside the provider.

**Deliverable**:
- `src/utils/createDeferredPromise.ts` - Factory function returning a deferred promise with resolve/reject methods
- `src/hooks/useFormStackState.ts` - Hook for consuming FormStackStateContext with null-check
- `src/hooks/useFormStackActions.ts` - Hook for consuming FormStackActionsContext with null-check
- `src/hooks/useFormStack.ts` - Combined convenience hook returning both state and actions
- Updated barrel exports in `src/hooks/index.ts` and `src/utils/index.ts`
- Comprehensive unit tests for all utilities and hooks

**Success Definition**:
1. `createDeferredPromise<T>()` returns `{ promise, resolve, reject }` with proper TypeScript typing
2. `useFormStackState()` throws descriptive error when used outside FormStackProvider
3. `useFormStackActions()` throws descriptive error when used outside FormStackProvider
4. `useFormStack()` returns `{ stack, openForm, closeForm }` with proper typing
5. All hooks pass unit tests with renderHook
6. `npm run type-check` passes with zero errors
7. `npm run test` passes all tests
8. `npm run build` succeeds

---

## User Persona

**Target User**: React developers consuming the geoform library

**Use Case**: Accessing form stack state and actions from any component within the FormStackProvider

**User Journey**:
1. Import `useFormStack` hook from the library
2. Call hook inside a component wrapped by FormStackProvider
3. Access `stack` to display breadcrumbs or current form info
4. Call `openForm()` to push a new form onto the stack
5. Receive a promise that resolves when the form submits or cancels

**Pain Points Addressed**:
- Boilerplate context consumption code (solved by custom hooks)
- Missing error messages when provider is missing (solved by descriptive errors)
- Complex promise management for async form resolution (solved by createDeferredPromise)

---

## Why

- **Developer Experience**: Custom hooks hide context complexity and provide clear API
- **Error Prevention**: Descriptive errors when hooks used outside provider catch mistakes early
- **Async Form Resolution**: createDeferredPromise enables the promise-based openForm() API
- **Type Safety**: Full TypeScript typing prevents runtime errors
- **Performance**: Separate hooks allow components to subscribe only to what they need (state vs actions)
- **Foundation**: Required by P1.M5 (FormStackRenderer) which wires openForm to createDeferredPromise

---

## What

### Success Criteria

- [ ] `createDeferredPromise<T>()` returns object with `promise`, `resolve`, `reject` properties
- [ ] `createDeferredPromise` properly types `resolve(value: T | undefined)`
- [ ] `useFormStackState()` returns `FormStackState` with readonly stack array
- [ ] `useFormStackState()` throws "useFormStackState must be used within FormStackProvider" outside provider
- [ ] `useFormStackActions()` returns `FormStackActions` with `openForm` and `closeForm`
- [ ] `useFormStackActions()` throws "useFormStackActions must be used within FormStackProvider" outside provider
- [ ] `useFormStack()` returns combined `{ stack, openForm, closeForm }`
- [ ] All hooks have proper TypeScript types
- [ ] Unit tests verify hook behavior with renderHook wrapper pattern
- [ ] Unit tests verify error throwing outside provider
- [ ] `npm run type-check` passes
- [ ] `npm run test` passes
- [ ] `npm run build` generates declarations

---

## All Needed Context

### Context Completeness Check

_This PRP provides everything needed for an implementer with no prior codebase knowledge to successfully implement the createDeferredPromise utility and context consumption hooks. All patterns are explicitly specified with complete code examples._

### Documentation & References

```yaml
# MUST READ - Existing type definitions
- file: src/types/form.ts
  why: Contains DeferredPromise<T> interface to implement
  pattern: |
    interface DeferredPromise<T> {
      promise: Promise<T | undefined>;
      resolve: (value: T | undefined) => void;
      reject: (reason?: unknown) => void;
    }
  critical: resolve accepts T | undefined (undefined for cancel case)

- file: src/types/context.ts
  why: Contains FormStackState and FormStackActions interfaces for hook return types
  pattern: |
    FormStackState.stack is readonly StackEntry[]
    FormStackActions has openForm<T> and closeForm methods
  critical: Use these exact types for hook return values

- file: src/context/FormStackContext.ts
  why: Contains the contexts that hooks will consume
  pattern: |
    FormStackStateContext: Context<FormStackState | null>
    FormStackActionsContext: Context<FormStackActions | null>
  critical: Both have null default values requiring null-check in hooks

# MUST READ - Existing implementation patterns
- file: src/components/FormStackProvider.tsx
  why: Shows current provider implementation and context usage
  pattern: Uses useReducer, useMemo for state, useCallback for actions
  critical: Hooks consume the contexts provided by this component

- file: src/context/__tests__/formStackReducer.test.ts
  why: Shows existing test patterns with Vitest (describe/it/expect structure)
  pattern: Uses createMockEntry helper, AAA pattern (Arrange-Act-Assert)
  critical: Follow same test structure for hook tests

# Research documentation
- docfile: plan/P1M2/research/deferred-promise-pattern.md
  why: Comprehensive guide on DeferredPromise implementation
  section: "Factory Function Implementation" and "TypeScript Type Definitions"
  critical: |
    Use factory function (not class) for simplicity
    resolve/reject captured from Promise executor
    Always specify generic type parameter for type safety

- docfile: plan/P1M3/research/context-provider-patterns.md
  why: Custom hooks pattern for context consumption
  section: "Custom Hooks Pattern" and "Error Handling"
  critical: |
    Custom hooks wrap useContext with null-check
    Throw descriptive errors mentioning the provider name
    Set context.displayName for React DevTools

- docfile: plan/P1M3/research/dual-context-pattern.md
  why: Understanding dual-context consumption
  section: "Custom Hooks with Selector Pattern" and "Common Pitfalls"
  critical: |
    Separate hooks for state and actions optimize re-renders
    Combined hook is convenience for components needing both

# Architecture context
- docfile: PRD.md
  why: Understanding the useFormStack API requirements
  section: "5.2 useFormStack()"
  critical: |
    Returns { openForm, closeForm, stack }
    openForm returns Promise<T | undefined>
    stack is read-only for breadcrumb rendering
```

### Current Codebase Tree

```bash
geoform-opus/
├── src/
│   ├── index.ts                       # Main barrel (placeholder)
│   ├── types/
│   │   ├── index.ts                   # Exports all types
│   │   ├── form.ts                    # FormProps<T>, DeferredPromise<T>
│   │   ├── stack.ts                   # StackEntry, OpenFormOptions<T>, InternalStackEntry<T>
│   │   ├── context.ts                 # FormStackState, FormStackActions, FormStackAction
│   │   └── __tests__/
│   │       └── types.test.ts          # Type verification tests
│   ├── context/
│   │   ├── index.ts                   # Exports reducer and contexts
│   │   ├── formStackReducer.ts        # Pure reducer function
│   │   ├── FormStackContext.ts        # Dual context definitions
│   │   └── __tests__/
│   │       └── formStackReducer.test.ts  # Reducer unit tests
│   ├── components/
│   │   ├── index.ts                   # Exports FormStackProvider
│   │   └── FormStackProvider.tsx      # Provider component
│   ├── hooks/
│   │   └── index.ts                   # Placeholder (to be populated)
│   ├── utils/
│   │   └── index.ts                   # Placeholder (to be populated)
│   └── __tests__/
│       └── setup.test.tsx             # Test setup verification
├── plan/
│   ├── P1M4/
│   │   ├── PRP.md                     # This file
│   │   └── research/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── vitest.setup.ts
```

### Desired Codebase Tree After Implementation

```bash
geoform-opus/
├── src/
│   ├── utils/
│   │   ├── index.ts                       # MODIFY: Export createDeferredPromise
│   │   ├── createDeferredPromise.ts       # NEW: Deferred promise factory
│   │   └── __tests__/
│   │       └── createDeferredPromise.test.ts  # NEW: Utility tests
│   ├── hooks/
│   │   ├── index.ts                       # MODIFY: Export all hooks
│   │   ├── useFormStackState.ts           # NEW: State context hook
│   │   ├── useFormStackActions.ts         # NEW: Actions context hook
│   │   ├── useFormStack.ts                # NEW: Combined hook
│   │   └── __tests__/
│   │       ├── useFormStackState.test.tsx     # NEW: State hook tests
│   │       ├── useFormStackActions.test.tsx   # NEW: Actions hook tests
│   │       └── useFormStack.test.tsx          # NEW: Combined hook tests
│   └── ... (other directories unchanged)
└── ... (config files unchanged)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Promise executor runs synchronously
// resolve and reject are captured immediately
function createDeferredPromise<T>(): DeferredPromise<T> {
  let resolve!: (value: T | undefined) => void;
  let reject!: (reason?: unknown) => void;

  // The executor runs SYNCHRONOUSLY - resolve/reject assigned before return
  const promise = new Promise<T | undefined>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

// CRITICAL: Use definite assignment assertion (!) for resolve/reject
// TypeScript needs this because it can't see the synchronous assignment
let resolve!: (value: T | undefined) => void;  // Note the !
let reject!: (reason?: unknown) => void;       // Note the !

// CRITICAL: resolve accepts T | undefined, not just T
// undefined represents the cancel case (no value returned)
resolve: (value: T | undefined) => void;
// NOT: resolve: (value: T) => void;

// CRITICAL: Context null-check pattern for hooks
// useContext returns null when no provider exists
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

// GOTCHA: Check for null specifically, not falsy
// if (!context) would be incorrect if context could be a valid falsy value
if (context === null) { ... }

// CRITICAL: Combined hook destructures from separate hooks
// Don't call useContext directly - reuse the validated hooks
export function useFormStack() {
  const { stack } = useFormStackState();
  const { openForm, closeForm } = useFormStackActions();

  return { stack, openForm, closeForm };
}

// GOTCHA: renderHook needs wrapper for provider testing
import { renderHook } from '@testing-library/react';
import { FormStackProvider } from '../../components';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
);

const { result } = renderHook(() => useFormStack(), { wrapper });

// CRITICAL: Testing hooks that throw requires try/catch or expect pattern
// Method 1: expect(...).toThrow()
expect(() => {
  renderHook(() => useFormStackState());
}).toThrow('useFormStackState must be used within a FormStackProvider');

// GOTCHA: React 18+ strict mode may cause double renders in tests
// This is expected behavior and tests should account for it
```

---

## Implementation Blueprint

### Data Models and Structure

This milestone implements utility functions and hooks - no additional data models beyond existing types.

Key types from previous milestones being used:
- `DeferredPromise<T>` from `src/types/form.ts` - interface for deferred promise
- `FormStackState` from `src/types/context.ts` - hook return type for state
- `FormStackActions` from `src/types/context.ts` - hook return type for actions

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/utils/createDeferredPromise.ts
  - IMPLEMENT: Factory function creating deferred promise
  - FOLLOW pattern: Factory function (not class) returning object
  - NAMING: createDeferredPromise (camelCase function)
  - PLACEMENT: src/utils/createDeferredPromise.ts
  - CONTENT:
    ```typescript
    import type { DeferredPromise } from '../types';

    /**
     * Creates a deferred promise with externally accessible resolve/reject functions.
     * Used by openForm() to create promises that resolve when forms submit or cancel.
     *
     * @template T - The type of value the promise resolves with
     * @returns DeferredPromise<T> with promise, resolve, and reject properties
     *
     * @example
     * ```typescript
     * const deferred = createDeferredPromise<User>();
     *
     * // Later, when form submits:
     * deferred.resolve(userData);
     *
     * // Or when form cancels:
     * deferred.resolve(undefined);
     * ```
     */
    export function createDeferredPromise<T>(): DeferredPromise<T> {
      // Use definite assignment assertion since executor runs synchronously
      let resolve!: (value: T | undefined) => void;
      let reject!: (reason?: unknown) => void;

      const promise = new Promise<T | undefined>((res, rej) => {
        resolve = res;
        reject = rej;
      });

      return { promise, resolve, reject };
    }
    ```
  - VALIDATION: npm run type-check passes

Task 2: CREATE src/hooks/useFormStackState.ts
  - IMPLEMENT: Custom hook consuming FormStackStateContext with validation
  - FOLLOW pattern: useContext with null-check and descriptive error
  - NAMING: useFormStackState (camelCase hook)
  - PLACEMENT: src/hooks/useFormStackState.ts
  - CONTENT:
    ```typescript
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
    ```
  - VALIDATION: npm run type-check passes

Task 3: CREATE src/hooks/useFormStackActions.ts
  - IMPLEMENT: Custom hook consuming FormStackActionsContext with validation
  - FOLLOW pattern: useContext with null-check and descriptive error
  - NAMING: useFormStackActions (camelCase hook)
  - PLACEMENT: src/hooks/useFormStackActions.ts
  - CONTENT:
    ```typescript
    import { useContext } from 'react';
    import { FormStackActionsContext } from '../context';
    import type { FormStackActions } from '../types';

    /**
     * Hook to access form stack actions (dispatch).
     * Components using this hook will NOT re-render when stack changes.
     * Optimizes performance for components that only need to dispatch actions.
     *
     * @returns FormStackActions containing openForm and closeForm functions
     * @throws Error if used outside FormStackProvider
     *
     * @example
     * ```typescript
     * function CreateButton() {
     *   const { openForm } = useFormStackActions();
     *
     *   const handleClick = async () => {
     *     const result = await openForm({
     *       id: 'create-user',
     *       component: UserForm,
     *       label: 'Create User',
     *     });
     *     if (result) {
     *       console.log('User created:', result);
     *     }
     *   };
     *
     *   return <button onClick={handleClick}>Create User</button>;
     * }
     * ```
     */
    export function useFormStackActions(): FormStackActions {
      const context = useContext(FormStackActionsContext);

      if (context === null) {
        throw new Error(
          'useFormStackActions must be used within a FormStackProvider. ' +
          'Wrap your component tree with <FormStackProvider>.'
        );
      }

      return context;
    }
    ```
  - VALIDATION: npm run type-check passes

Task 4: CREATE src/hooks/useFormStack.ts
  - IMPLEMENT: Combined hook providing both state and actions
  - FOLLOW pattern: Compose from useFormStackState and useFormStackActions
  - NAMING: useFormStack (camelCase hook)
  - PLACEMENT: src/hooks/useFormStack.ts
  - DEPENDENCIES: Requires hooks from Tasks 2-3
  - CONTENT:
    ```typescript
    import { useFormStackState } from './useFormStackState';
    import { useFormStackActions } from './useFormStackActions';
    import type { StackEntry, OpenFormOptions } from '../types';

    /**
     * Return type for useFormStack hook.
     * Combines state and actions for convenience.
     */
    export interface UseFormStackReturn {
      /** Current form stack (read-only) */
      stack: readonly StackEntry[];
      /** Opens a new form and returns a promise resolving to its result */
      openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
      /** Closes the current form without returning data */
      closeForm: () => void;
    }

    /**
     * Combined hook providing both form stack state and actions.
     * Use this when a component needs to both read state AND dispatch actions.
     *
     * For optimal performance, prefer useFormStackState or useFormStackActions
     * when only one is needed.
     *
     * @returns UseFormStackReturn with stack, openForm, and closeForm
     * @throws Error if used outside FormStackProvider
     *
     * @example
     * ```typescript
     * function FormManager() {
     *   const { stack, openForm, closeForm } = useFormStack();
     *
     *   return (
     *     <div>
     *       <span>Forms open: {stack.length}</span>
     *       <button onClick={() => openForm({ id: 'new', component: MyForm })}>
     *         Open Form
     *       </button>
     *     </div>
     *   );
     * }
     * ```
     */
    export function useFormStack(): UseFormStackReturn {
      const { stack } = useFormStackState();
      const { openForm, closeForm } = useFormStackActions();

      return { stack, openForm, closeForm };
    }
    ```
  - VALIDATION: npm run type-check passes

Task 5: MODIFY src/utils/index.ts
  - IMPLEMENT: Export createDeferredPromise from barrel
  - NAMING: Standard barrel export pattern
  - PLACEMENT: Modify existing file
  - CONTENT:
    ```typescript
    export { createDeferredPromise } from './createDeferredPromise';
    ```
  - VALIDATION: Imports work from 'src/utils'

Task 6: MODIFY src/hooks/index.ts
  - IMPLEMENT: Export all hooks from barrel
  - NAMING: Standard barrel export pattern
  - PLACEMENT: Modify existing file
  - CONTENT:
    ```typescript
    export { useFormStackState } from './useFormStackState';
    export { useFormStackActions } from './useFormStackActions';
    export { useFormStack } from './useFormStack';
    export type { UseFormStackReturn } from './useFormStack';
    ```
  - VALIDATION: Imports work from 'src/hooks'

Task 7: CREATE src/utils/__tests__/createDeferredPromise.test.ts
  - IMPLEMENT: Unit tests for deferred promise utility
  - FOLLOW pattern: AAA (Arrange-Act-Assert), async/await for promises
  - NAMING: createDeferredPromise.test.ts
  - PLACEMENT: src/utils/__tests__/
  - CONTENT:
    ```typescript
    import { describe, it, expect, vi } from 'vitest';
    import { createDeferredPromise } from '../createDeferredPromise';

    describe('createDeferredPromise', () => {
      describe('structure', () => {
        it('should return an object with promise, resolve, and reject', () => {
          // Arrange & Act
          const deferred = createDeferredPromise<string>();

          // Assert
          expect(deferred).toHaveProperty('promise');
          expect(deferred).toHaveProperty('resolve');
          expect(deferred).toHaveProperty('reject');
          expect(deferred.promise).toBeInstanceOf(Promise);
          expect(typeof deferred.resolve).toBe('function');
          expect(typeof deferred.reject).toBe('function');
        });
      });

      describe('resolve', () => {
        it('should resolve promise with value', async () => {
          // Arrange
          const deferred = createDeferredPromise<string>();

          // Act
          deferred.resolve('test value');
          const result = await deferred.promise;

          // Assert
          expect(result).toBe('test value');
        });

        it('should resolve promise with undefined (cancel case)', async () => {
          // Arrange
          const deferred = createDeferredPromise<string>();

          // Act
          deferred.resolve(undefined);
          const result = await deferred.promise;

          // Assert
          expect(result).toBeUndefined();
        });

        it('should resolve with complex object', async () => {
          // Arrange
          interface User {
            id: string;
            name: string;
          }
          const deferred = createDeferredPromise<User>();
          const user: User = { id: '1', name: 'Test User' };

          // Act
          deferred.resolve(user);
          const result = await deferred.promise;

          // Assert
          expect(result).toEqual(user);
        });

        it('should only resolve once (first value wins)', async () => {
          // Arrange
          const deferred = createDeferredPromise<string>();

          // Act
          deferred.resolve('first');
          deferred.resolve('second');
          const result = await deferred.promise;

          // Assert
          expect(result).toBe('first');
        });
      });

      describe('reject', () => {
        it('should reject promise with error', async () => {
          // Arrange
          const deferred = createDeferredPromise<string>();
          const error = new Error('test error');

          // Act
          deferred.reject(error);

          // Assert
          await expect(deferred.promise).rejects.toThrow('test error');
        });

        it('should reject promise with string reason', async () => {
          // Arrange
          const deferred = createDeferredPromise<string>();

          // Act
          deferred.reject('something went wrong');

          // Assert
          await expect(deferred.promise).rejects.toBe('something went wrong');
        });

        it('should not resolve after rejection', async () => {
          // Arrange
          const deferred = createDeferredPromise<string>();
          const error = new Error('rejected');

          // Act
          deferred.reject(error);
          deferred.resolve('value');

          // Assert
          await expect(deferred.promise).rejects.toThrow('rejected');
        });
      });

      describe('generic type safety', () => {
        it('should work with number type', async () => {
          // Arrange
          const deferred = createDeferredPromise<number>();

          // Act
          deferred.resolve(42);
          const result = await deferred.promise;

          // Assert
          expect(result).toBe(42);
        });

        it('should work with array type', async () => {
          // Arrange
          const deferred = createDeferredPromise<string[]>();

          // Act
          deferred.resolve(['a', 'b', 'c']);
          const result = await deferred.promise;

          // Assert
          expect(result).toEqual(['a', 'b', 'c']);
        });
      });
    });
    ```
  - VALIDATION: npm run test passes

Task 8: CREATE src/hooks/__tests__/useFormStackState.test.tsx
  - IMPLEMENT: Unit tests for useFormStackState hook
  - FOLLOW pattern: renderHook with wrapper for provider tests
  - NAMING: useFormStackState.test.tsx
  - PLACEMENT: src/hooks/__tests__/
  - CONTENT:
    ```tsx
    import { describe, it, expect } from 'vitest';
    import { renderHook } from '@testing-library/react';
    import type { ReactNode } from 'react';
    import { useFormStackState } from '../useFormStackState';
    import { FormStackProvider } from '../../components';

    // Wrapper component for renderHook
    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormStackProvider>{children}</FormStackProvider>
    );

    describe('useFormStackState', () => {
      describe('when used within FormStackProvider', () => {
        it('should return FormStackState with stack array', () => {
          // Arrange & Act
          const { result } = renderHook(() => useFormStackState(), { wrapper });

          // Assert
          expect(result.current).toHaveProperty('stack');
          expect(Array.isArray(result.current.stack)).toBe(true);
        });

        it('should return empty stack initially', () => {
          // Arrange & Act
          const { result } = renderHook(() => useFormStackState(), { wrapper });

          // Assert
          expect(result.current.stack).toHaveLength(0);
        });

        it('should return readonly stack (immutable)', () => {
          // Arrange & Act
          const { result } = renderHook(() => useFormStackState(), { wrapper });

          // Assert - TypeScript enforces readonly, this verifies runtime behavior
          expect(result.current.stack).toEqual([]);
        });
      });

      describe('when used outside FormStackProvider', () => {
        it('should throw descriptive error', () => {
          // Arrange & Act & Assert
          expect(() => {
            renderHook(() => useFormStackState());
          }).toThrow('useFormStackState must be used within a FormStackProvider');
        });

        it('should include helpful message about wrapping with provider', () => {
          // Arrange & Act & Assert
          expect(() => {
            renderHook(() => useFormStackState());
          }).toThrow('Wrap your component tree with <FormStackProvider>');
        });
      });

      describe('reference stability', () => {
        it('should return consistent reference between renders', () => {
          // Arrange
          const { result, rerender } = renderHook(() => useFormStackState(), { wrapper });
          const firstStack = result.current.stack;

          // Act
          rerender();

          // Assert - stack reference should be stable when unchanged
          expect(result.current.stack).toBe(firstStack);
        });
      });
    });
    ```
  - VALIDATION: npm run test passes

Task 9: CREATE src/hooks/__tests__/useFormStackActions.test.tsx
  - IMPLEMENT: Unit tests for useFormStackActions hook
  - FOLLOW pattern: renderHook with wrapper for provider tests
  - NAMING: useFormStackActions.test.tsx
  - PLACEMENT: src/hooks/__tests__/
  - CONTENT:
    ```tsx
    import { describe, it, expect } from 'vitest';
    import { renderHook } from '@testing-library/react';
    import type { ReactNode } from 'react';
    import { useFormStackActions } from '../useFormStackActions';
    import { FormStackProvider } from '../../components';

    // Wrapper component for renderHook
    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormStackProvider>{children}</FormStackProvider>
    );

    describe('useFormStackActions', () => {
      describe('when used within FormStackProvider', () => {
        it('should return FormStackActions with openForm and closeForm', () => {
          // Arrange & Act
          const { result } = renderHook(() => useFormStackActions(), { wrapper });

          // Assert
          expect(result.current).toHaveProperty('openForm');
          expect(result.current).toHaveProperty('closeForm');
          expect(typeof result.current.openForm).toBe('function');
          expect(typeof result.current.closeForm).toBe('function');
        });

        it('should have openForm that returns a Promise', () => {
          // Arrange
          const { result } = renderHook(() => useFormStackActions(), { wrapper });

          // Act
          const returnValue = result.current.openForm({
            id: 'test',
            component: () => null,
          });

          // Assert
          expect(returnValue).toBeInstanceOf(Promise);
        });
      });

      describe('when used outside FormStackProvider', () => {
        it('should throw descriptive error', () => {
          // Arrange & Act & Assert
          expect(() => {
            renderHook(() => useFormStackActions());
          }).toThrow('useFormStackActions must be used within a FormStackProvider');
        });

        it('should include helpful message about wrapping with provider', () => {
          // Arrange & Act & Assert
          expect(() => {
            renderHook(() => useFormStackActions());
          }).toThrow('Wrap your component tree with <FormStackProvider>');
        });
      });

      describe('reference stability', () => {
        it('should return stable function references between renders', () => {
          // Arrange
          const { result, rerender } = renderHook(() => useFormStackActions(), { wrapper });
          const firstOpenForm = result.current.openForm;
          const firstCloseForm = result.current.closeForm;

          // Act
          rerender();

          // Assert - function references should be stable (memoized)
          expect(result.current.openForm).toBe(firstOpenForm);
          expect(result.current.closeForm).toBe(firstCloseForm);
        });
      });
    });
    ```
  - VALIDATION: npm run test passes

Task 10: CREATE src/hooks/__tests__/useFormStack.test.tsx
  - IMPLEMENT: Unit tests for combined useFormStack hook
  - FOLLOW pattern: renderHook with wrapper for provider tests
  - NAMING: useFormStack.test.tsx
  - PLACEMENT: src/hooks/__tests__/
  - CONTENT:
    ```tsx
    import { describe, it, expect } from 'vitest';
    import { renderHook } from '@testing-library/react';
    import type { ReactNode } from 'react';
    import { useFormStack } from '../useFormStack';
    import { FormStackProvider } from '../../components';

    // Wrapper component for renderHook
    const wrapper = ({ children }: { children: ReactNode }) => (
      <FormStackProvider>{children}</FormStackProvider>
    );

    describe('useFormStack', () => {
      describe('when used within FormStackProvider', () => {
        it('should return stack, openForm, and closeForm', () => {
          // Arrange & Act
          const { result } = renderHook(() => useFormStack(), { wrapper });

          // Assert
          expect(result.current).toHaveProperty('stack');
          expect(result.current).toHaveProperty('openForm');
          expect(result.current).toHaveProperty('closeForm');
        });

        it('should return empty stack initially', () => {
          // Arrange & Act
          const { result } = renderHook(() => useFormStack(), { wrapper });

          // Assert
          expect(result.current.stack).toHaveLength(0);
          expect(Array.isArray(result.current.stack)).toBe(true);
        });

        it('should return working openForm and closeForm functions', () => {
          // Arrange & Act
          const { result } = renderHook(() => useFormStack(), { wrapper });

          // Assert
          expect(typeof result.current.openForm).toBe('function');
          expect(typeof result.current.closeForm).toBe('function');
        });

        it('should have openForm that returns a Promise', () => {
          // Arrange
          const { result } = renderHook(() => useFormStack(), { wrapper });

          // Act
          const returnValue = result.current.openForm({
            id: 'test',
            component: () => null,
          });

          // Assert
          expect(returnValue).toBeInstanceOf(Promise);
        });
      });

      describe('when used outside FormStackProvider', () => {
        it('should throw error from useFormStackState', () => {
          // Arrange & Act & Assert
          // Combined hook uses individual hooks, so error comes from first failing hook
          expect(() => {
            renderHook(() => useFormStack());
          }).toThrow('useFormStackState must be used within a FormStackProvider');
        });
      });

      describe('return type structure', () => {
        it('should match UseFormStackReturn interface', () => {
          // Arrange & Act
          const { result } = renderHook(() => useFormStack(), { wrapper });

          // Assert - verify structure matches interface
          const returnValue = result.current;

          // stack is readonly StackEntry[]
          expect(returnValue.stack).toBeDefined();

          // openForm is function returning Promise
          expect(typeof returnValue.openForm).toBe('function');

          // closeForm is void function
          expect(typeof returnValue.closeForm).toBe('function');
        });
      });

      describe('reference stability', () => {
        it('should maintain stable references across renders', () => {
          // Arrange
          const { result, rerender } = renderHook(() => useFormStack(), { wrapper });
          const first = result.current;

          // Act
          rerender();

          // Assert
          expect(result.current.stack).toBe(first.stack);
          expect(result.current.openForm).toBe(first.openForm);
          expect(result.current.closeForm).toBe(first.closeForm);
        });
      });
    });
    ```
  - VALIDATION: npm run test passes
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Deferred Promise Factory
// Captures resolve/reject from synchronous executor
function createDeferredPromise<T>(): DeferredPromise<T> {
  let resolve!: (value: T | undefined) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T | undefined>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

// PATTERN: Context Consumer Hook with Error
// Always check for null and throw descriptive error
function useFormStackState(): FormStackState {
  const context = useContext(FormStackStateContext);

  if (context === null) {
    throw new Error(
      'useFormStackState must be used within a FormStackProvider. ' +
      'Wrap your component tree with <FormStackProvider>.'
    );
  }

  return context;
}

// PATTERN: Combined Hook from Separate Hooks
// Reuse validated hooks instead of calling useContext directly
function useFormStack(): UseFormStackReturn {
  const { stack } = useFormStackState();
  const { openForm, closeForm } = useFormStackActions();

  return { stack, openForm, closeForm };
}

// PATTERN: renderHook with Provider Wrapper
const wrapper = ({ children }: { children: ReactNode }) => (
  <FormStackProvider>{children}</FormStackProvider>
);

const { result } = renderHook(() => useFormStack(), { wrapper });

// PATTERN: Testing Hook Error Throwing
expect(() => {
  renderHook(() => useFormStackState());
}).toThrow('must be used within');
```

### Integration Points

```yaml
TYPES:
  - Import from: src/types
  - Pattern: "import type { DeferredPromise, FormStackState, FormStackActions } from '../types'"
  - Used types: DeferredPromise<T>, FormStackState, FormStackActions, StackEntry, OpenFormOptions

CONTEXT:
  - Import from: src/context
  - Pattern: "import { FormStackStateContext, FormStackActionsContext } from '../context'"
  - Consumed by: useFormStackState, useFormStackActions

COMPONENTS:
  - Import from: src/components (for tests)
  - Pattern: "import { FormStackProvider } from '../../components'"
  - Used by: Test wrapper functions

HOOKS_BARREL:
  - Export from: src/hooks/index.ts
  - Pattern: "export { useFormStack, useFormStackState, useFormStackActions } from './...'"
  - Used by: P1.M6 (public API)

UTILS_BARREL:
  - Export from: src/utils/index.ts
  - Pattern: "export { createDeferredPromise } from './createDeferredPromise'"
  - Used by: P1.M5 (FormStackRenderer)

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
# If errors: Check imports, ensure types match interface definitions

# Format check (if configured)
npm run lint || true
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run utility tests
npm run test -- src/utils/__tests__/createDeferredPromise.test.ts

# Expected output:
# ✓ createDeferredPromise > structure > should return object with promise, resolve, reject
# ✓ createDeferredPromise > resolve > should resolve promise with value
# ✓ createDeferredPromise > resolve > should resolve promise with undefined
# ✓ createDeferredPromise > resolve > should resolve with complex object
# ✓ createDeferredPromise > resolve > should only resolve once
# ✓ createDeferredPromise > reject > should reject promise with error
# ✓ createDeferredPromise > reject > should reject promise with string reason
# ✓ createDeferredPromise > reject > should not resolve after rejection
# ✓ createDeferredPromise > generic type safety > should work with number type
# ✓ createDeferredPromise > generic type safety > should work with array type

# Run hook tests
npm run test -- src/hooks/__tests__/

# Expected output:
# All useFormStackState tests pass
# All useFormStackActions tests pass
# All useFormStack tests pass

# Run all tests
npm run test

# Expected: All tests pass (including previous milestone tests)
```

### Level 3: Integration Testing (System Validation)

```bash
# Build to verify all exports work
npm run build

# Verify output files exist
ls dist/*.d.ts
# Expected: dist/index.d.ts exists

# Verify declarations include new exports
grep -l "createDeferredPromise" dist/index.d.ts || echo "Check exports"
grep -l "useFormStack" dist/index.d.ts || echo "Check exports"
```

### Level 4: Manual Verification

```bash
# Create a test file to verify hook usage
cat > /tmp/test-hooks.tsx << 'EOF'
import { useFormStack, useFormStackState, useFormStackActions } from './src/hooks';
import { createDeferredPromise } from './src/utils';
import { FormStackProvider } from './src/components';

// Verify createDeferredPromise types
const deferred = createDeferredPromise<{ name: string }>();
deferred.resolve({ name: 'test' });
deferred.resolve(undefined); // Cancel case
deferred.reject(new Error('test'));

// Verify hooks return correct types
function TestComponent() {
  const { stack } = useFormStackState();
  const { openForm, closeForm } = useFormStackActions();
  const combined = useFormStack();

  // Verify stack is readonly
  const length: number = stack.length;

  // Verify openForm returns Promise
  const promise: Promise<unknown> = openForm({
    id: 'test',
    component: () => null,
  });

  // Verify closeForm returns void
  closeForm();

  return null;
}

function App() {
  return (
    <FormStackProvider>
      <TestComponent />
    </FormStackProvider>
  );
}
EOF

# Type check the test file (if possible)
npx tsc --noEmit /tmp/test-hooks.tsx 2>/dev/null || echo "Type check manual verification"
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run test` passes all tests (utility + hooks = ~25 tests)
- [ ] `npm run build` generates dist/index.d.ts with declarations
- [ ] All files created: createDeferredPromise.ts, useFormStackState.ts, useFormStackActions.ts, useFormStack.ts

### Feature Validation

- [ ] `createDeferredPromise<T>()` returns `{ promise, resolve, reject }` with correct types
- [ ] `createDeferredPromise` resolve accepts `T | undefined`
- [ ] `useFormStackState()` returns `FormStackState` with readonly stack
- [ ] `useFormStackState()` throws descriptive error outside provider
- [ ] `useFormStackActions()` returns `FormStackActions` with openForm/closeForm
- [ ] `useFormStackActions()` throws descriptive error outside provider
- [ ] `useFormStack()` returns combined `{ stack, openForm, closeForm }`
- [ ] `useFormStack()` throws error from useFormStackState when outside provider
- [ ] All function references are stable across renders (verified by tests)

### Code Quality Validation

- [ ] Uses `import type` for type-only imports
- [ ] All functions have JSDoc comments with examples
- [ ] Error messages are descriptive and mention the provider name
- [ ] Tests use AAA pattern (Arrange-Act-Assert)
- [ ] Tests use renderHook with wrapper pattern for provider tests
- [ ] Tests verify both success and error cases

### Documentation & Deployment

- [ ] JSDoc comments on createDeferredPromise
- [ ] JSDoc comments on all three hooks
- [ ] Barrel exports updated in src/hooks/index.ts
- [ ] Barrel exports updated in src/utils/index.ts
- [ ] Build succeeds with type declarations

---

## Anti-Patterns to Avoid

- **DON'T** use a class for DeferredPromise - factory function is simpler
- **DON'T** forget the definite assignment assertion (!) for resolve/reject
- **DON'T** type resolve as `(value: T) => void` - must accept `T | undefined`
- **DON'T** check for falsy context (`!context`) - check for null specifically
- **DON'T** call useContext directly in useFormStack - reuse validated hooks
- **DON'T** forget to create test wrapper for renderHook
- **DON'T** test hook error by calling hook directly - use renderHook
- **DON'T** skip testing reference stability - important for performance

---

## Confidence Score

**9/10** - Very high confidence for one-pass implementation success

**Rationale:**
- All interfaces already defined and tested (P1.M2, P1.M3 complete)
- createDeferredPromise pattern is well-documented with exact code
- Custom hook pattern is explicitly specified with error handling
- Test patterns from existing reducer tests can be followed
- renderHook wrapper pattern is standard and documented
- Edge cases (null context, undefined resolution) are documented
- Build and validation commands are specific and executable

**Risk Mitigation:**
- If type-check fails: Verify imports match exactly (type vs value imports)
- If hook tests fail: Ensure wrapper provides FormStackProvider correctly
- If build fails: Ensure all barrel exports are updated
- If reference stability fails: Check useMemo/useCallback in FormStackProvider

---

## Quick Start for Implementation

```bash
# 1. Create utility file
mkdir -p src/utils/__tests__
touch src/utils/createDeferredPromise.ts
# Copy content from Task 1

# 2. Create hook files
mkdir -p src/hooks/__tests__
touch src/hooks/useFormStackState.ts
touch src/hooks/useFormStackActions.ts
touch src/hooks/useFormStack.ts
# Copy content from Tasks 2-4

# 3. Update barrel exports
# Modify src/utils/index.ts (Task 5)
# Modify src/hooks/index.ts (Task 6)

# 4. Create test files
touch src/utils/__tests__/createDeferredPromise.test.ts
touch src/hooks/__tests__/useFormStackState.test.tsx
touch src/hooks/__tests__/useFormStackActions.test.tsx
touch src/hooks/__tests__/useFormStack.test.tsx
# Copy content from Tasks 7-10

# 5. Validate
npm run type-check && npm run test && npm run build

# Expected: All commands pass, ready for P1.M5
```

**Expected total time:** 45-60 minutes for implementation.

---

## Research References

The following research documents are available:

1. **plan/P1M2/research/deferred-promise-pattern.md** - Comprehensive guide on DeferredPromise
   - Factory function implementation
   - TypeScript type definitions
   - Best practices and common pitfalls
   - React integration patterns

2. **plan/P1M3/research/dual-context-pattern.md** - Context splitting patterns
   - Why split state and dispatch
   - Custom hooks for context consumption
   - Performance optimization techniques
   - TypeScript implementation patterns

3. **plan/P1M3/research/context-provider-patterns.md** - Provider patterns
   - Custom hooks with error handling
   - Null-check patterns
   - Reference stability patterns
   - Testing patterns

Key external documentation:
- [React.dev - useContext](https://react.dev/reference/react/useContext)
- [React Testing Library - renderHook](https://testing-library.com/docs/react-testing-library/api#renderhook)
- [Kent C. Dodds - How to Use React Context Effectively](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
- [TC39 Promise.withResolvers Proposal](https://github.com/tc39/proposal-promise-with-resolvers)
