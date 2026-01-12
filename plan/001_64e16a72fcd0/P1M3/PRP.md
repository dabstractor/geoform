# PRP: Dual Context Implementation (P1.M3)

**Milestone:** P1.M3 - Dual Context Implementation
**Project:** React Hierarchical Form Stack System (geoform)
**Status:** Foundation for form stack state management and context API
**Estimated Story Points:** 5 SP
**Dependencies:** P1.M2 (Complete) - Core Type Definitions

---

## Goal

**Feature Goal**: Implement the dual-context pattern with useReducer for managing hierarchical form stack state, separating read-only state access from action dispatch to optimize re-renders and provide a clean, type-safe API for form stack operations.

**Deliverable**:
- `src/context/formStackReducer.ts` - Pure reducer function handling PUSH_FORM, POP_FORM, POP_TO_INDEX actions
- `src/context/FormStackContext.ts` - Dual context definitions (FormStackStateContext, FormStackActionsContext)
- `src/components/FormStackProvider.tsx` - Provider component with useReducer, memoized contexts, and children rendering

**Success Definition**:
1. Reducer handles all three action types immutably with correct stack transitions
2. Dual contexts properly separate state from actions (context splitting pattern)
3. Provider correctly initializes reducer and provides both contexts
4. `npm run type-check` passes with zero errors
5. `npm run build` succeeds
6. Unit tests verify reducer state transitions
7. Context values are properly memoized to prevent unnecessary re-renders

---

## User Persona

**Target User**: Library developer building the form stack system

**Use Case**: Setting up the core state management infrastructure for hierarchical form stacking

**User Journey**:
1. Implement reducer to manage stack operations (push, pop, pop-to-index)
2. Create separate contexts for state (what forms are on stack) and actions (openForm, closeForm)
3. Build provider component that initializes state and provides both contexts
4. Prepare foundation for hooks and rendering components in later milestones

**Pain Points Addressed**:
- Unoptimized context causing unnecessary re-renders (context splitting solves this)
- Mutable state causing bugs (immutable reducer pattern solves this)
- Untyped actions causing runtime errors (discriminated unions solve this)

---

## Why

- **Performance Foundation**: Context splitting prevents re-renders of dispatch-only consumers when state changes
- **Type Safety**: Discriminated union actions enable exhaustive switch checking and proper type narrowing
- **Immutability**: Reducer pattern ensures predictable state transitions without mutations
- **Separation of Concerns**: Clear boundary between state reading and state modification
- **Testability**: Pure reducer function can be unit tested independently of React
- **Foundation**: Required by P1.M4 (hooks), P1.M5 (rendering), and all subsequent phases

---

## What

### Success Criteria

- [ ] `formStackReducer` handles PUSH_FORM action (appends entry to stack)
- [ ] `formStackReducer` handles POP_FORM action (removes last entry from stack)
- [ ] `formStackReducer` handles POP_TO_INDEX action (slices stack to specified index)
- [ ] Reducer maintains immutability (returns new state object, doesn't mutate)
- [ ] `FormStackStateContext` created with null default value
- [ ] `FormStackActionsContext` created with null default value
- [ ] `FormStackProvider` uses useReducer with initial state `{ stack: [] }`
- [ ] Provider nests both context providers correctly
- [ ] State context value is memoized with useMemo
- [ ] Actions context value is memoized with useCallback/useMemo
- [ ] `npm run type-check` passes
- [ ] `npm run test` passes for reducer tests
- [ ] `npm run build` generates declarations

---

## All Needed Context

### Context Completeness Check

_This PRP provides everything needed for an implementer with no prior codebase knowledge to successfully implement the dual-context pattern. All patterns are explicitly specified with complete code examples._

### Documentation & References

```yaml
# MUST READ - Existing type definitions to use
- file: src/types/context.ts
  why: Contains FormStackState, FormStackActions, FormStackAction, FormStackReducerState types
  pattern: Use these exact types for reducer, context, and provider typing
  critical: |
    FormStackAction is discriminated union: 'PUSH_FORM' | 'POP_FORM' | 'POP_TO_INDEX'
    FormStackReducerState.stack is InternalStackEntry<unknown>[]
    FormStackState.stack is readonly StackEntry[] (public view)

- file: src/types/stack.ts
  why: Contains InternalStackEntry type used in reducer state
  pattern: InternalStackEntry extends StackEntry with component, confirmOnCancel, deferred
  critical: Each stack entry has a DeferredPromise for async resolution

- file: src/types/form.ts
  why: Contains DeferredPromise type for understanding entry structure
  pattern: DeferredPromise<T> has promise, resolve, reject methods

# MUST READ - Research documentation for patterns
- docfile: plan/P1M3/research/dual-context-pattern.md
  why: Comprehensive guide on context splitting pattern
  section: "Why Split State and Dispatch" and "TypeScript Implementation Patterns"
  critical: |
    Separate contexts prevent re-renders of dispatch-only consumers
    dispatch from useReducer is stable (never changes reference)
    Use null default with custom hooks that throw on null

- docfile: plan/P1M3/research/useReducer-patterns.md
  why: Reducer implementation patterns with TypeScript
  section: "Discriminated Union Patterns" and "Immutable Array Operations"
  critical: |
    Use switch with exhaustive checking (never type in default)
    PUSH: [...state.stack, entry]
    POP: state.stack.slice(0, -1)
    POP_TO_INDEX: state.stack.slice(0, index + 1)

- docfile: plan/P1M3/research/context-provider-patterns.md
  why: Provider component implementation patterns
  section: "Performance Optimization" and "Custom Hooks Pattern"
  critical: |
    Always use useMemo for context value stability
    Use useCallback for action functions (though dispatch is already stable)
    Create displayName for React DevTools debugging

# Architecture context
- docfile: plan/architecture/summary.md
  why: Overall architectural decisions and context splitting rationale
  section: "Key Architectural Decisions"
  critical: Context splitting for performance optimization

- docfile: PRD.md
  why: Understanding the form stack behavior requirements
  section: "5.2 useFormStack()" and "3. Core UX Rules"
  critical: Stack operations, form lifecycle, promise-based API

# Testing patterns
- file: src/types/__tests__/types.test.ts
  why: Shows existing Vitest test patterns and describe/it structure
  pattern: Use describe blocks for organizing tests, verify type behavior
  gotcha: Uses globals: true pattern (no imports needed for describe/it/expect)
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
│   │   ├── context.ts        # FormStackState, FormStackActions, FormStackAction, FormStackReducerState ✓
│   │   └── __tests__/
│   │       └── types.test.ts # Type verification tests ✓
│   ├── hooks/
│   │   └── index.ts          # Placeholder
│   ├── components/
│   │   └── index.ts          # Placeholder
│   ├── context/
│   │   └── index.ts          # Placeholder (to be populated)
│   ├── utils/
│   │   └── index.ts          # Placeholder
│   └── __tests__/
│       └── setup.test.tsx    # Test setup verification
├── plan/
│   ├── architecture/
│   │   ├── summary.md
│   │   └── testing_strategy.md
│   ├── P1M2/                 # Previous milestone (complete)
│   └── P1M3/
│       ├── PRP.md            # This file
│       └── research/
│           ├── dual-context-pattern.md
│           ├── useReducer-patterns.md
│           ├── context-provider-patterns.md
│           ├── quick-reference.md
│           └── README.md
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
│   ├── context/
│   │   ├── index.ts                    # MODIFY: Export reducer and contexts
│   │   ├── formStackReducer.ts         # NEW: Pure reducer function
│   │   └── FormStackContext.ts         # NEW: Dual context definitions
│   ├── components/
│   │   ├── index.ts                    # MODIFY: Export FormStackProvider
│   │   └── FormStackProvider.tsx       # NEW: Provider component
│   ├── context/__tests__/
│   │   └── formStackReducer.test.ts    # NEW: Reducer unit tests
│   └── ... (other directories unchanged)
└── ... (config files unchanged)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: dispatch from useReducer is STABLE - never changes reference
// This is key to the context splitting optimization
const [state, dispatch] = useReducer(formStackReducer, initialState);
// dispatch is the same function on every render - no need to wrap in useCallback

// CRITICAL: Memoize state context value to prevent re-renders
// State value is an object - creates new reference on every render without useMemo
const stateValue = useMemo<FormStackState>(() => ({
  stack: state.stack.map(entry => ({
    id: entry.id,
    label: entry.label,
  })),
}), [state.stack]);

// CRITICAL: Actions context needs stable function references
// Although dispatch is stable, we wrap openForm/closeForm for useMemo deps
const actionsValue = useMemo<FormStackActions>(() => ({
  openForm,  // Will be implemented in P1.M4/P1.M5
  closeForm, // Will be implemented in P1.M4/P1.M5
}), [openForm, closeForm]);

// CRITICAL: Reducer MUST be immutable - never mutate state
// WRONG:
case 'PUSH_FORM':
  state.stack.push(action.entry);  // MUTATION!
  return state;

// CORRECT:
case 'PUSH_FORM':
  return { stack: [...state.stack, action.entry] };

// CRITICAL: Use slice for pop operations, not splice (splice mutates)
// WRONG:
case 'POP_FORM':
  state.stack.splice(-1, 1);  // MUTATION!
  return state;

// CORRECT:
case 'POP_FORM':
  return { stack: state.stack.slice(0, -1) };

// CRITICAL: POP_TO_INDEX needs index + 1 for slice
// slice(0, index + 1) includes the element at index
case 'POP_TO_INDEX':
  return { stack: state.stack.slice(0, action.index + 1) };

// GOTCHA: Empty stack edge cases
// POP_FORM on empty stack should return unchanged state
if (state.stack.length === 0) return state;

// GOTCHA: Invalid index for POP_TO_INDEX
// Return unchanged state if index is out of bounds
if (action.index < 0 || action.index >= state.stack.length) return state;

// CRITICAL: Context default value must be null (not undefined)
// This allows proper null checking in custom hooks
const FormStackStateContext = createContext<FormStackState | null>(null);
// NOT: createContext<FormStackState>(undefined as any);

// CRITICAL: Set displayName for React DevTools
FormStackStateContext.displayName = 'FormStackStateContext';
FormStackActionsContext.displayName = 'FormStackActionsContext';

// GOTCHA: ReactNode import for children prop typing
import type { ReactNode } from 'react';
interface FormStackProviderProps {
  children: ReactNode;
}
```

---

## Implementation Blueprint

### Data Models and Structure

This milestone implements state management infrastructure - no additional data models beyond existing types.

Key types from P1.M2 being used:
- `FormStackReducerState` - internal reducer state with `stack: InternalStackEntry<unknown>[]`
- `FormStackAction` - discriminated union: PUSH_FORM | POP_FORM | POP_TO_INDEX
- `FormStackState` - public state with `stack: readonly StackEntry[]`
- `FormStackActions` - public actions with `openForm<T>` and `closeForm`

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/context/formStackReducer.ts
  - IMPLEMENT: formStackReducer function handling all action types
  - FOLLOW pattern: Discriminated union switch with exhaustive checking
  - NAMING: formStackReducer (camelCase function)
  - PLACEMENT: src/context/formStackReducer.ts
  - CONTENT:
    ```typescript
    import type { FormStackReducerState, FormStackAction } from '../types';

    /**
     * Initial state for the form stack reducer.
     * Empty stack, ready to receive form entries.
     */
    export const initialFormStackState: FormStackReducerState = {
      stack: [],
    };

    /**
     * Reducer function for managing form stack state transitions.
     * Handles push, pop, and pop-to-index operations immutably.
     *
     * @param state - Current form stack state
     * @param action - Action to perform (PUSH_FORM, POP_FORM, POP_TO_INDEX)
     * @returns New state after action is applied
     */
    export function formStackReducer(
      state: FormStackReducerState,
      action: FormStackAction
    ): FormStackReducerState {
      switch (action.type) {
        case 'PUSH_FORM':
          return {
            stack: [...state.stack, action.entry],
          };

        case 'POP_FORM':
          if (state.stack.length === 0) {
            return state;
          }
          return {
            stack: state.stack.slice(0, -1),
          };

        case 'POP_TO_INDEX':
          if (action.index < 0 || action.index >= state.stack.length) {
            return state;
          }
          return {
            stack: state.stack.slice(0, action.index + 1),
          };

        default:
          // Exhaustive check - TypeScript will error if we miss a case
          const _exhaustive: never = action;
          throw new Error(`Unknown action: ${JSON.stringify(_exhaustive)}`);
      }
    }
    ```
  - VALIDATION: npm run type-check passes

Task 2: CREATE src/context/FormStackContext.ts
  - IMPLEMENT: FormStackStateContext and FormStackActionsContext
  - FOLLOW pattern: Context splitting with null defaults
  - NAMING: PascalCase for context names
  - PLACEMENT: src/context/FormStackContext.ts
  - CONTENT:
    ```typescript
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
    ```
  - VALIDATION: npm run type-check passes

Task 3: CREATE src/components/FormStackProvider.tsx
  - IMPLEMENT: Provider component with useReducer and dual contexts
  - FOLLOW pattern: Context provider with memoization
  - NAMING: FormStackProvider (PascalCase component)
  - PLACEMENT: src/components/FormStackProvider.tsx
  - DEPENDENCIES: Requires formStackReducer and contexts from Tasks 1-2
  - CONTENT:
    ```typescript
    import { useReducer, useMemo, useCallback, type ReactNode } from 'react';
    import { formStackReducer, initialFormStackState } from '../context/formStackReducer';
    import { FormStackStateContext, FormStackActionsContext } from '../context/FormStackContext';
    import type { FormStackState, FormStackActions, OpenFormOptions } from '../types';

    /**
     * Props for FormStackProvider component.
     */
    export interface FormStackProviderProps {
      /** Child components that will have access to form stack context */
      children: ReactNode;
    }

    /**
     * Provider component for the form stack system.
     * Uses dual-context pattern to separate state from actions,
     * minimizing re-renders for components that only dispatch actions.
     *
     * @example
     * ```tsx
     * <FormStackProvider>
     *   <App />
     * </FormStackProvider>
     * ```
     */
    export function FormStackProvider({ children }: FormStackProviderProps) {
      const [state, dispatch] = useReducer(formStackReducer, initialFormStackState);

      // Convert internal stack to public stack view (without internal details)
      const stateValue = useMemo<FormStackState>(() => ({
        stack: state.stack.map(entry => ({
          id: entry.id,
          label: entry.label,
        })),
      }), [state.stack]);

      // Placeholder implementations for openForm and closeForm
      // Will be fully implemented in P1.M4/P1.M5 with createDeferredPromise
      const openForm = useCallback(<T,>(options: OpenFormOptions<T>): Promise<T | undefined> => {
        // TODO: P1.M5 - Implement with createDeferredPromise
        // For now, dispatch PUSH_FORM and return a resolved promise
        // This placeholder allows the type system to work correctly
        console.warn('openForm not fully implemented - see P1.M5');
        return Promise.resolve(undefined);
      }, []);

      const closeForm = useCallback(() => {
        dispatch({ type: 'POP_FORM' });
      }, []);

      // Memoize actions value to prevent re-renders
      const actionsValue = useMemo<FormStackActions>(() => ({
        openForm,
        closeForm,
      }), [openForm, closeForm]);

      return (
        <FormStackStateContext.Provider value={stateValue}>
          <FormStackActionsContext.Provider value={actionsValue}>
            {children}
          </FormStackActionsContext.Provider>
        </FormStackStateContext.Provider>
      );
    }
    ```
  - VALIDATION: npm run type-check passes, npm run build succeeds

Task 4: MODIFY src/context/index.ts
  - IMPLEMENT: Export reducer and contexts from barrel
  - NAMING: Standard barrel export pattern
  - PLACEMENT: Modify existing file
  - CONTENT:
    ```typescript
    // Reducer
    export { formStackReducer, initialFormStackState } from './formStackReducer';

    // Contexts
    export { FormStackStateContext, FormStackActionsContext } from './FormStackContext';
    ```
  - VALIDATION: Imports work from 'src/context'

Task 5: MODIFY src/components/index.ts
  - IMPLEMENT: Export FormStackProvider from barrel
  - NAMING: Standard barrel export pattern
  - PLACEMENT: Modify existing file
  - CONTENT:
    ```typescript
    export { FormStackProvider } from './FormStackProvider';
    export type { FormStackProviderProps } from './FormStackProvider';
    ```
  - VALIDATION: Imports work from 'src/components'

Task 6: CREATE src/context/__tests__/formStackReducer.test.ts
  - IMPLEMENT: Unit tests for reducer
  - FOLLOW pattern: AAA (Arrange-Act-Assert), describe blocks
  - NAMING: formStackReducer.test.ts
  - PLACEMENT: src/context/__tests__/
  - CONTENT:
    ```typescript
    import { describe, it, expect } from 'vitest';
    import { formStackReducer, initialFormStackState } from '../formStackReducer';
    import type { FormStackReducerState, FormStackAction, InternalStackEntry } from '../../types';

    // Helper to create mock stack entries
    const createMockEntry = (id: string, label?: string): InternalStackEntry<unknown> => ({
      id,
      label,
      component: () => null,
      confirmOnCancel: false,
      deferred: {
        promise: Promise.resolve(undefined),
        resolve: () => {},
        reject: () => {},
      },
    });

    describe('formStackReducer', () => {
      describe('initial state', () => {
        it('should have empty stack', () => {
          expect(initialFormStackState.stack).toEqual([]);
        });
      });

      describe('PUSH_FORM action', () => {
        it('should add entry to empty stack', () => {
          // Arrange
          const state: FormStackReducerState = { stack: [] };
          const entry = createMockEntry('form-1', 'Form 1');
          const action: FormStackAction = { type: 'PUSH_FORM', entry };

          // Act
          const result = formStackReducer(state, action);

          // Assert
          expect(result.stack).toHaveLength(1);
          expect(result.stack[0].id).toBe('form-1');
        });

        it('should append entry to existing stack', () => {
          // Arrange
          const existingEntry = createMockEntry('form-1');
          const state: FormStackReducerState = { stack: [existingEntry] };
          const newEntry = createMockEntry('form-2', 'Form 2');
          const action: FormStackAction = { type: 'PUSH_FORM', entry: newEntry };

          // Act
          const result = formStackReducer(state, action);

          // Assert
          expect(result.stack).toHaveLength(2);
          expect(result.stack[1].id).toBe('form-2');
        });

        it('should not mutate original state', () => {
          // Arrange
          const state: FormStackReducerState = { stack: [] };
          const originalStack = state.stack;
          const entry = createMockEntry('form-1');
          const action: FormStackAction = { type: 'PUSH_FORM', entry };

          // Act
          const result = formStackReducer(state, action);

          // Assert
          expect(result.stack).not.toBe(originalStack);
          expect(originalStack).toHaveLength(0);
        });
      });

      describe('POP_FORM action', () => {
        it('should remove last entry from stack', () => {
          // Arrange
          const entries = [createMockEntry('form-1'), createMockEntry('form-2')];
          const state: FormStackReducerState = { stack: entries };
          const action: FormStackAction = { type: 'POP_FORM' };

          // Act
          const result = formStackReducer(state, action);

          // Assert
          expect(result.stack).toHaveLength(1);
          expect(result.stack[0].id).toBe('form-1');
        });

        it('should return unchanged state when stack is empty', () => {
          // Arrange
          const state: FormStackReducerState = { stack: [] };
          const action: FormStackAction = { type: 'POP_FORM' };

          // Act
          const result = formStackReducer(state, action);

          // Assert
          expect(result).toBe(state);
        });

        it('should not mutate original state', () => {
          // Arrange
          const entries = [createMockEntry('form-1'), createMockEntry('form-2')];
          const state: FormStackReducerState = { stack: entries };
          const originalStack = state.stack;
          const action: FormStackAction = { type: 'POP_FORM' };

          // Act
          const result = formStackReducer(state, action);

          // Assert
          expect(result.stack).not.toBe(originalStack);
          expect(originalStack).toHaveLength(2);
        });
      });

      describe('POP_TO_INDEX action', () => {
        it('should keep entries up to and including index', () => {
          // Arrange
          const entries = [
            createMockEntry('form-1'),
            createMockEntry('form-2'),
            createMockEntry('form-3'),
          ];
          const state: FormStackReducerState = { stack: entries };
          const action: FormStackAction = { type: 'POP_TO_INDEX', index: 0 };

          // Act
          const result = formStackReducer(state, action);

          // Assert
          expect(result.stack).toHaveLength(1);
          expect(result.stack[0].id).toBe('form-1');
        });

        it('should handle middle index correctly', () => {
          // Arrange
          const entries = [
            createMockEntry('form-1'),
            createMockEntry('form-2'),
            createMockEntry('form-3'),
          ];
          const state: FormStackReducerState = { stack: entries };
          const action: FormStackAction = { type: 'POP_TO_INDEX', index: 1 };

          // Act
          const result = formStackReducer(state, action);

          // Assert
          expect(result.stack).toHaveLength(2);
          expect(result.stack[1].id).toBe('form-2');
        });

        it('should return unchanged state for negative index', () => {
          // Arrange
          const entries = [createMockEntry('form-1')];
          const state: FormStackReducerState = { stack: entries };
          const action: FormStackAction = { type: 'POP_TO_INDEX', index: -1 };

          // Act
          const result = formStackReducer(state, action);

          // Assert
          expect(result).toBe(state);
        });

        it('should return unchanged state for out-of-bounds index', () => {
          // Arrange
          const entries = [createMockEntry('form-1')];
          const state: FormStackReducerState = { stack: entries };
          const action: FormStackAction = { type: 'POP_TO_INDEX', index: 5 };

          // Act
          const result = formStackReducer(state, action);

          // Assert
          expect(result).toBe(state);
        });

        it('should not mutate original state', () => {
          // Arrange
          const entries = [createMockEntry('form-1'), createMockEntry('form-2')];
          const state: FormStackReducerState = { stack: entries };
          const originalStack = state.stack;
          const action: FormStackAction = { type: 'POP_TO_INDEX', index: 0 };

          // Act
          const result = formStackReducer(state, action);

          // Assert
          expect(result.stack).not.toBe(originalStack);
          expect(originalStack).toHaveLength(2);
        });
      });
    });
    ```
  - VALIDATION: npm run test passes
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Discriminated union switch with exhaustive checking
function formStackReducer(state: FormStackReducerState, action: FormStackAction): FormStackReducerState {
  switch (action.type) {
    case 'PUSH_FORM':
      // TypeScript knows action.entry exists here
      return { stack: [...state.stack, action.entry] };
    case 'POP_FORM':
      // TypeScript knows there's no payload
      return { stack: state.stack.slice(0, -1) };
    case 'POP_TO_INDEX':
      // TypeScript knows action.index exists here
      return { stack: state.stack.slice(0, action.index + 1) };
    default:
      // Exhaustive check catches missing cases at compile time
      const _exhaustive: never = action;
      throw new Error(`Unknown action: ${_exhaustive}`);
  }
}

// PATTERN: Context splitting for performance
// State context - changes when stack changes
const FormStackStateContext = createContext<FormStackState | null>(null);
// Actions context - never changes (dispatch is stable)
const FormStackActionsContext = createContext<FormStackActions | null>(null);

// PATTERN: Memoized context values
const stateValue = useMemo<FormStackState>(() => ({
  stack: state.stack.map(entry => ({ id: entry.id, label: entry.label })),
}), [state.stack]);

// PATTERN: Nested providers (state outside, actions inside)
return (
  <FormStackStateContext.Provider value={stateValue}>
    <FormStackActionsContext.Provider value={actionsValue}>
      {children}
    </FormStackActionsContext.Provider>
  </FormStackStateContext.Provider>
);
```

### Integration Points

```yaml
TYPES:
  - Import from: src/types
  - Pattern: "import type { TypeName } from '../types'"
  - Used types: FormStackReducerState, FormStackAction, FormStackState, FormStackActions, OpenFormOptions

CONTEXT_BARREL:
  - Export from: src/context/index.ts
  - Pattern: "export { formStackReducer } from './formStackReducer'"
  - Used by: P1.M4 (hooks), P1.M5 (rendering)

COMPONENTS_BARREL:
  - Export from: src/components/index.ts
  - Pattern: "export { FormStackProvider } from './FormStackProvider'"
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
# If errors: Check imports, ensure types match exactly

# Format check (if configured)
npm run lint || true
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run reducer tests
npm run test -- src/context/__tests__/formStackReducer.test.ts

# Expected output:
# ✓ formStackReducer > initial state > should have empty stack
# ✓ formStackReducer > PUSH_FORM action > should add entry to empty stack
# ✓ formStackReducer > PUSH_FORM action > should append entry to existing stack
# ✓ formStackReducer > PUSH_FORM action > should not mutate original state
# ✓ formStackReducer > POP_FORM action > should remove last entry from stack
# ✓ formStackReducer > POP_FORM action > should return unchanged state when stack is empty
# ✓ formStackReducer > POP_FORM action > should not mutate original state
# ✓ formStackReducer > POP_TO_INDEX action > should keep entries up to and including index
# ✓ formStackReducer > POP_TO_INDEX action > should handle middle index correctly
# ✓ formStackReducer > POP_TO_INDEX action > should return unchanged state for negative index
# ✓ formStackReducer > POP_TO_INDEX action > should return unchanged state for out-of-bounds index
# ✓ formStackReducer > POP_TO_INDEX action > should not mutate original state

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
grep -l "FormStackProvider" dist/index.d.ts || echo "Check exports"
```

### Level 4: Manual Verification

```bash
# Create a test file to verify context usage
cat > /tmp/test-context.tsx << 'EOF'
import { FormStackProvider } from './src/components';
import { FormStackStateContext, FormStackActionsContext } from './src/context';

// Verify provider renders
function TestApp() {
  return (
    <FormStackProvider>
      <div>Test</div>
    </FormStackProvider>
  );
}

// Verify context types
import { useContext } from 'react';
function TestConsumer() {
  const state = useContext(FormStackStateContext);
  const actions = useContext(FormStackActionsContext);
  return null;
}
EOF

# Type check the test file
npx tsc --noEmit /tmp/test-context.tsx 2>/dev/null || echo "Type check the manual verification"
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run test` passes all reducer tests (12+ tests)
- [ ] `npm run build` generates dist/index.d.ts with declarations
- [ ] All files created: formStackReducer.ts, FormStackContext.ts, FormStackProvider.tsx

### Feature Validation

- [ ] PUSH_FORM correctly appends entry to stack
- [ ] POP_FORM correctly removes last entry (no-op on empty stack)
- [ ] POP_TO_INDEX correctly slices stack (guards against invalid index)
- [ ] All state transitions are immutable (original state unchanged)
- [ ] FormStackStateContext has null default and displayName
- [ ] FormStackActionsContext has null default and displayName
- [ ] FormStackProvider uses useReducer with correct initial state
- [ ] State context value is memoized with useMemo
- [ ] Actions context value is memoized with useMemo
- [ ] Providers are correctly nested

### Code Quality Validation

- [ ] Uses `import type` for type-only imports
- [ ] All functions have JSDoc comments
- [ ] Reducer uses exhaustive switch checking with `never` type
- [ ] Empty stack and invalid index edge cases handled
- [ ] displayName set on both contexts for React DevTools
- [ ] Uses readonly where appropriate in public types

### Documentation & Deployment

- [ ] JSDoc comments on formStackReducer function
- [ ] JSDoc comments on FormStackProvider component
- [ ] Barrel exports updated in src/context/index.ts
- [ ] Barrel exports updated in src/components/index.ts
- [ ] Build succeeds with type declarations

---

## Anti-Patterns to Avoid

- **DON'T** mutate state in reducer - always return new objects
- **DON'T** use `splice` or `push` on arrays - use `slice` and spread
- **DON'T** forget edge cases - empty stack, invalid index
- **DON'T** create inline objects in context value - use useMemo
- **DON'T** use undefined as context default - use null for proper null checking
- **DON'T** forget displayName - hurts debugging experience
- **DON'T** combine state and actions in one context - defeats optimization
- **DON'T** wrap dispatch in useCallback - it's already stable
- **DON'T** expose internal stack entries in public state context

---

## Confidence Score

**9/10** - Very high confidence for one-pass implementation success

**Rationale:**
- All types are already defined and tested (P1.M2 complete)
- Reducer pattern is well-documented with exact code examples
- Context splitting pattern is explicitly specified
- Edge cases (empty stack, invalid index) are documented
- Test cases are provided with expected behavior
- Build and validation commands are specific and executable

**Risk Mitigation:**
- If type-check fails: Verify imports match exactly (type vs value imports)
- If tests fail: Check mock entry creation matches InternalStackEntry structure
- If build fails: Ensure all barrel exports are updated

---

## Quick Start for Implementation

```bash
# 1. Create reducer file
touch src/context/formStackReducer.ts
# Copy content from Task 1

# 2. Create context file
touch src/context/FormStackContext.ts
# Copy content from Task 2

# 3. Create provider component
touch src/components/FormStackProvider.tsx
# Copy content from Task 3

# 4. Update barrel exports
# Modify src/context/index.ts (Task 4)
# Modify src/components/index.ts (Task 5)

# 5. Create test directory and test file
mkdir -p src/context/__tests__
touch src/context/__tests__/formStackReducer.test.ts
# Copy content from Task 6

# 6. Validate
npm run type-check && npm run test && npm run build

# Expected: All commands pass, ready for P1.M4
```

**Expected total time:** 30-45 minutes for implementation.

---

## Research References

The following research documents are available in `plan/P1M3/research/`:

1. **dual-context-pattern.md** (29KB) - Comprehensive guide on context splitting
   - Why split state and dispatch
   - Performance optimization techniques
   - TypeScript implementation patterns
   - Common pitfalls and gotchas

2. **useReducer-patterns.md** (25KB) - Reducer patterns for complex state
   - Discriminated unions for action types
   - Immutable array operations (push, pop, pop-to-index)
   - Testing reducer functions with Vitest
   - Integration with React Context

3. **context-provider-patterns.md** (31KB) - Library-quality provider patterns
   - Context creation with proper defaults
   - Custom hooks for consumption
   - Performance optimization with useMemo/useCallback
   - Provider composition patterns

4. **quick-reference.md** (9KB) - Quick lookup templates
   - Ready-to-use code patterns
   - Performance rules summary
   - Testing patterns

Key external documentation:
- [React.dev - useReducer](https://react.dev/reference/react/useReducer)
- [React.dev - Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [Kent C. Dodds - How to Optimize Your Context Value](https://kentcdodds.com/blog/how-to-optimize-your-context-value)
