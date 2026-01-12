# useReducer Patterns for Complex State Management in React

**Research Date**: 2025-12-26
**Focus**: Stack-based data structures with TypeScript

---

## 1. useReducer with TypeScript - Proper Typing

### 1.1 Basic TypeScript Setup

`useReducer` is a generic function in React that can infer types based on the reducer function signature. The key is to type your reducer function properly.

**Official React Documentation**: [useReducer – React](https://react.dev/reference/react/useReducer)

#### State Definition

```typescript
// Define your state interface
interface StackState {
  items: FormStep[];
  currentIndex: number;
  history: FormStep[][];
}

interface FormStep {
  id: string;
  label: string;
  completed: boolean;
}
```

#### Reducer Function Typing

```typescript
// Type the reducer function directly
const stackReducer = (state: StackState, action: StackAction): StackState => {
  // TypeScript infers the state and dispatch types from this signature
  switch (action.type) {
    // ... cases
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
};

// useReducer infers types from the reducer
const [state, dispatch] = useReducer(stackReducer, initialState);
// state is StackState
// dispatch is (action: StackAction) => void
```

**Reference**: [Type-checking React useReducer in TypeScript](https://www.benmvp.com/blog/type-checking-react-usereducer-typescript/)

### 1.2 Dispatch Type Inference

React exports a `Dispatch` type that you can use when passing dispatch functions to child components:

```typescript
import { Dispatch } from 'react';

interface ChildProps {
  dispatch: Dispatch<StackAction>;
  state: StackState;
}

function ChildComponent({ dispatch, state }: ChildProps) {
  return (
    <button onClick={() => dispatch({ type: 'push', step: newStep })}>
      Add Step
    </button>
  );
}
```

---

## 2. Discriminated Union Patterns for Action Types

### 2.1 What is a Discriminated Union?

A discriminated union (also called tagged unions) is a TypeScript pattern where each action has a unique `type` property that helps TypeScript narrow the type to the specific action variant.

**Key Benefit**: Within each case statement, TypeScript knows exactly which properties exist on that action variant, eliminating the need for type guards.

**Reference**: [Type React's useReducer and Context API with discriminated union of Typescript](https://medium.com/@mohsentaleb/elegantly-type-reacts-usereducer-and-context-api-with-discriminated-union-of-typescript-855ff475cafe)

### 2.2 Stack-Based Action Types

For a stack-based form system, define actions as a discriminated union:

```typescript
// Define all valid action types for a stack reducer
type StackAction =
  // Push: Add a new item to the stack
  | { type: 'push'; step: FormStep }
  // Pop: Remove the last item from the stack
  | { type: 'pop' }
  // Pop to Index: Remove all items after a specific index
  | { type: 'popToIndex'; index: number }
  // Replace: Replace current top of stack
  | { type: 'replace'; step: FormStep }
  // Clear: Empty the entire stack
  | { type: 'clear' }
  // Set Index: Change current position in stack
  | { type: 'setIndex'; index: number }
  // Update Current: Modify the current item
  | { type: 'updateCurrent'; updates: Partial<FormStep> };
```

### 2.3 Type Safety Benefits

TypeScript ensures three things:

1. **Exhaustiveness Checking**: All action types must be handled in the switch statement
2. **Property Validation**: You can only access properties that exist on each action variant
3. **Return Type Enforcement**: The reducer must return a complete State object

```typescript
const stackReducer = (state: StackState, action: StackAction): StackState => {
  switch (action.type) {
    case 'push': {
      // TypeScript knows action.step exists here
      return {
        ...state,
        items: [...state.items, action.step],
        currentIndex: state.items.length,
      };
    }
    case 'pop': {
      // action.step doesn't exist here - TypeScript error if you try to access it
      if (state.items.length === 0) return state;
      return {
        ...state,
        items: state.items.slice(0, -1),
        currentIndex: Math.max(0, state.currentIndex - 1),
      };
    }
    case 'popToIndex': {
      // TypeScript knows action.index exists here
      if (action.index < 0 || action.index >= state.items.length) {
        return state;
      }
      return {
        ...state,
        items: state.items.slice(0, action.index + 1),
        currentIndex: action.index,
      };
    }
    default:
      // This exhaustiveness check ensures all cases are covered
      const _exhaustive: never = action;
      throw new Error(`Unknown action: ${_exhaustive}`);
  }
};
```

### 2.4 Creating Action Creators (Optional)

For better DX, you can create action creator functions:

```typescript
// Action creators with proper typing
const stackActions = {
  push: (step: FormStep): StackAction => ({
    type: 'push',
    step,
  }),
  pop: (): StackAction => ({
    type: 'pop',
  }),
  popToIndex: (index: number): StackAction => ({
    type: 'popToIndex',
    index,
  }),
  replace: (step: FormStep): StackAction => ({
    type: 'replace',
    step,
  }),
  clear: (): StackAction => ({
    type: 'clear',
  }),
} as const;

// Usage with type safety
dispatch(stackActions.push({ id: '1', label: 'Step 1', completed: false }));
```

---

## 3. Reducer Best Practices for Array/Stack Operations

### 3.1 Immutability Principles

**Official React Docs**: [Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)

The most critical rule: **Reducers must be pure functions**. Never mutate state directly.

```typescript
// ❌ WRONG - Mutates state
case 'push':
  state.items.push(action.step);  // Mutation!
  return state;

// ✅ CORRECT - Creates new array
case 'push':
  return {
    ...state,
    items: [...state.items, action.step],
  };
```

### 3.2 Immutable Array Operations for Stack

Reference: [Immutable Update Patterns - Redux](https://redux.js.org/usage/structuring-reducers/immutable-update-patterns)

#### Push Operation (Add to End)

```typescript
case 'push': {
  return {
    ...state,
    items: [...state.items, action.step],
    currentIndex: state.items.length,
    // Save current state to history for undo
    history: [...state.history, state.items],
  };
}
```

#### Pop Operation (Remove from End)

```typescript
case 'pop': {
  if (state.items.length === 0) return state;

  // Immutable pop: return all but the last element
  return {
    ...state,
    items: state.items.slice(0, -1),
    currentIndex: Math.max(0, state.currentIndex - 1),
    history: [...state.history, state.items],
  };
}
```

#### Pop to Index (Remove Multiple from End)

```typescript
case 'popToIndex': {
  const { index } = action;
  if (index < 0 || index >= state.items.length) {
    return state;
  }

  // Keep items up to and including the specified index
  return {
    ...state,
    items: state.items.slice(0, index + 1),
    currentIndex: index,
    history: [...state.history, state.items],
  };
}
```

#### Insert at Index

```typescript
case 'insertAt': {
  const { index, step } = action;
  if (index < 0 || index > state.items.length) {
    return state;
  }

  // Use slice to create new array with insertion
  return {
    ...state,
    items: [
      ...state.items.slice(0, index),
      step,
      ...state.items.slice(index),
    ],
  };
}
```

#### Replace Specific Item

```typescript
case 'updateCurrent': {
  if (state.currentIndex < 0) return state;

  const newItems = [...state.items];
  newItems[state.currentIndex] = {
    ...newItems[state.currentIndex],
    ...action.updates,
  };

  return {
    ...state,
    items: newItems,
  };
}
```

### 3.3 Using Immer for Simpler Syntax

For complex nested updates, consider using the `use-immer` package:

```typescript
import { useImmerReducer } from 'use-immer';

const stackReducer = (draft: Draft<StackState>, action: StackAction) => {
  switch (action.type) {
    case 'push': {
      // Can mutate draft directly - Immer handles immutability
      draft.items.push(action.step);
      draft.currentIndex = draft.items.length - 1;
      draft.history.push([...draft.items]);
      break;
    }
    case 'pop': {
      if (draft.items.length > 0) {
        draft.history.push([...draft.items]);
        draft.items.pop();
        draft.currentIndex = Math.max(0, draft.currentIndex - 1);
      }
      break;
    }
    case 'popToIndex': {
      if (action.index >= 0 && action.index < draft.items.length) {
        draft.history.push([...draft.items]);
        draft.items.splice(action.index + 1);
        draft.currentIndex = action.index;
      }
      break;
    }
  }
};

const [state, dispatch] = useImmerReducer(stackReducer, initialState);
```

**Reference**: [Immutable Update Patterns - LogRocket Blog](https://blog.logrocket.com/redux-immutable-update-patterns/)

### 3.4 Copy-On-Write Pattern

Always copy the entire object when making updates:

```typescript
// ✅ CORRECT - Full object copy
case 'setIndex': {
  return {
    ...state,  // Don't forget this!
    currentIndex: action.index,
  };
}

// ❌ WRONG - Forgot to spread state
case 'setIndex': {
  return {
    currentIndex: action.index,
    // Loses other properties!
  };
}
```

---

## 4. Integration with React Context

### 4.1 Context Setup

**Official React Docs**: [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)

Create separate contexts for state and dispatch to allow more granular component subscriptions:

```typescript
import { createContext, ReactNode } from 'react';

// Context for reading state
export const StackStateContext = createContext<StackState | null>(null);

// Context for dispatching actions
export const StackDispatchContext = createContext<Dispatch<StackAction> | null>(
  null
);
```

### 4.2 Provider Component

Create a provider component that wraps the reducer setup:

```typescript
import { useReducer } from 'react';

interface StackProviderProps {
  children: ReactNode;
  initialState?: StackState;
}

export function StackProvider({ children, initialState }: StackProviderProps) {
  const [state, dispatch] = useReducer(
    stackReducer,
    initialState || DEFAULT_STACK_STATE
  );

  return (
    <StackStateContext value={state}>
      <StackDispatchContext value={dispatch}>
        {children}
      </StackDispatchContext>
    </StackStateContext>
  );
}
```

### 4.3 Custom Hooks for Cleaner Usage

Export custom hooks for consuming the context:

```typescript
import { useContext } from 'react';

// Hook to read stack state
export function useStackState(): StackState {
  const context = useContext(StackStateContext);
  if (!context) {
    throw new Error('useStackState must be used within StackProvider');
  }
  return context;
}

// Hook to dispatch stack actions
export function useStackDispatch(): Dispatch<StackAction> {
  const context = useContext(StackDispatchContext);
  if (!context) {
    throw new Error('useStackDispatch must be used within StackProvider');
  }
  return context;
}

// Combined hook for convenience
export function useStack() {
  return {
    state: useStackState(),
    dispatch: useStackDispatch(),
  };
}
```

### 4.4 Usage in Components

```typescript
function FormStep() {
  const { state, dispatch } = useStack();

  const handleNext = () => {
    const nextStep = {
      id: generateId(),
      label: `Step ${state.items.length + 1}`,
      completed: false,
    };
    dispatch({ type: 'push', step: nextStep });
  };

  const handleBack = () => {
    dispatch({ type: 'pop' });
  };

  return (
    <div>
      <h2>{state.items[state.currentIndex]?.label}</h2>
      <button onClick={handleBack} disabled={state.currentIndex === 0}>
        Back
      </button>
      <button onClick={handleNext}>Next</button>
      <p>
        Step {state.currentIndex + 1} of {state.items.length}
      </p>
    </div>
  );
}
```

### 4.5 Performance Optimization

Split contexts to prevent unnecessary re-renders:

```typescript
// Components only subscribed to dispatch won't re-render when state changes
function ButtonComponent() {
  const dispatch = useStackDispatch();  // Only re-renders when dispatch function changes (never)
  return <button onClick={() => dispatch({ type: 'pop' })}>Back</button>;
}

// Components only subscribed to state won't re-render when dispatch is updated
function DisplayComponent() {
  const state = useStackState();  // Only re-renders when state changes
  return <p>Current step: {state.currentIndex + 1}</p>;
}
```

---

## 5. Testing Reducer Functions with Vitest

### 5.1 Testing Setup

**Reference**: [Testing Library - useReducer](https://testing-library.com/docs/example-react-hooks-usereducer/)

Reducers are pure functions, making them ideal for unit testing. Test them independently from React:

```typescript
// stackReducer.test.ts
import { describe, it, expect } from 'vitest';
import { stackReducer, StackState, StackAction } from './stackReducer';

const initialState: StackState = {
  items: [],
  currentIndex: -1,
  history: [],
};
```

### 5.2 AAA Pattern for Reducer Tests

Use Arrange-Act-Assert (AAA) pattern:

```typescript
describe('stackReducer', () => {
  describe('push action', () => {
    it('should add a new step to the stack', () => {
      // Arrange
      const state: StackState = {
        items: [{ id: '1', label: 'Step 1', completed: false }],
        currentIndex: 0,
        history: [],
      };
      const newStep = { id: '2', label: 'Step 2', completed: false };
      const action: StackAction = { type: 'push', step: newStep };

      // Act
      const result = stackReducer(state, action);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.items[1]).toEqual(newStep);
      expect(result.currentIndex).toBe(1);
    });

    it('should add to history when pushing', () => {
      // Arrange
      const state: StackState = {
        items: [{ id: '1', label: 'Step 1', completed: false }],
        currentIndex: 0,
        history: [],
      };
      const action: StackAction = {
        type: 'push',
        step: { id: '2', label: 'Step 2', completed: false },
      };

      // Act
      const result = stackReducer(state, action);

      // Assert
      expect(result.history).toHaveLength(1);
      expect(result.history[0]).toEqual(state.items);
    });

    it('should not mutate original state', () => {
      // Arrange
      const state: StackState = {
        items: [{ id: '1', label: 'Step 1', completed: false }],
        currentIndex: 0,
        history: [],
      };
      const originalItems = state.items;
      const action: StackAction = {
        type: 'push',
        step: { id: '2', label: 'Step 2', completed: false },
      };

      // Act
      const result = stackReducer(state, action);

      // Assert
      expect(result.items).not.toBe(originalItems);
      expect(originalItems).toHaveLength(1);
    });
  });

  describe('pop action', () => {
    it('should remove the last item from the stack', () => {
      // Arrange
      const state: StackState = {
        items: [
          { id: '1', label: 'Step 1', completed: false },
          { id: '2', label: 'Step 2', completed: false },
        ],
        currentIndex: 1,
        history: [],
      };
      const action: StackAction = { type: 'pop' };

      // Act
      const result = stackReducer(state, action);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('1');
      expect(result.currentIndex).toBe(0);
    });

    it('should handle pop on empty stack', () => {
      // Arrange
      const state: StackState = {
        items: [],
        currentIndex: -1,
        history: [],
      };
      const action: StackAction = { type: 'pop' };

      // Act
      const result = stackReducer(state, action);

      // Assert
      expect(result).toEqual(state);
    });

    it('should handle pop when currentIndex is at top', () => {
      // Arrange
      const state: StackState = {
        items: [
          { id: '1', label: 'Step 1', completed: false },
          { id: '2', label: 'Step 2', completed: false },
        ],
        currentIndex: 1,
        history: [],
      };
      const action: StackAction = { type: 'pop' };

      // Act
      const result = stackReducer(state, action);

      // Assert
      expect(result.currentIndex).toBe(0);
    });
  });

  describe('popToIndex action', () => {
    it('should remove all items after specified index', () => {
      // Arrange
      const state: StackState = {
        items: [
          { id: '1', label: 'Step 1', completed: false },
          { id: '2', label: 'Step 2', completed: false },
          { id: '3', label: 'Step 3', completed: false },
        ],
        currentIndex: 2,
        history: [],
      };
      const action: StackAction = { type: 'popToIndex', index: 0 };

      // Act
      const result = stackReducer(state, action);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('1');
      expect(result.currentIndex).toBe(0);
    });

    it('should handle invalid indices gracefully', () => {
      // Arrange
      const state: StackState = {
        items: [
          { id: '1', label: 'Step 1', completed: false },
          { id: '2', label: 'Step 2', completed: false },
        ],
        currentIndex: 1,
        history: [],
      };

      // Act with negative index
      const negativeResult = stackReducer(state, {
        type: 'popToIndex',
        index: -1,
      });

      // Act with out-of-bounds index
      const outOfBoundsResult = stackReducer(state, {
        type: 'popToIndex',
        index: 10,
      });

      // Assert
      expect(negativeResult).toEqual(state);
      expect(outOfBoundsResult).toEqual(state);
    });
  });

  describe('updateCurrent action', () => {
    it('should update the current step', () => {
      // Arrange
      const state: StackState = {
        items: [
          { id: '1', label: 'Step 1', completed: false },
          { id: '2', label: 'Step 2', completed: false },
        ],
        currentIndex: 1,
        history: [],
      };
      const action: StackAction = {
        type: 'updateCurrent',
        updates: { completed: true },
      };

      // Act
      const result = stackReducer(state, action);

      // Assert
      expect(result.items[1].completed).toBe(true);
      expect(result.items[1].id).toBe('2');
    });

    it('should handle update when no current item exists', () => {
      // Arrange
      const state: StackState = {
        items: [],
        currentIndex: -1,
        history: [],
      };
      const action: StackAction = {
        type: 'updateCurrent',
        updates: { completed: true },
      };

      // Act
      const result = stackReducer(state, action);

      // Assert
      expect(result).toEqual(state);
    });
  });
});
```

### 5.3 Testing with Context (Integration Tests)

For testing the reducer integrated with React Context:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('StackProvider Integration', () => {
  it('should provide state and dispatch through context', () => {
    // Arrange
    const TestComponent = () => {
      const { state, dispatch } = useStack();

      return (
        <div>
          <p data-testid="count">{state.items.length}</p>
          <button
            onClick={() =>
              dispatch({
                type: 'push',
                step: {
                  id: '1',
                  label: 'Test',
                  completed: false,
                },
              })
            }
          >
            Add
          </button>
        </div>
      );
    };

    // Act
    render(
      <StackProvider>
        <TestComponent />
      </StackProvider>
    );

    // Assert
    expect(screen.getByTestId('count')).toHaveTextContent('0');

    // Act - Click button
    userEvent.click(screen.getByRole('button', { name: /add/i }));

    // Assert
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});
```

### 5.4 Best Practices for Testing

1. **Test pure reducer functions independently** - No React context needed
2. **Test action creators** if you use them
3. **Test edge cases** - empty arrays, invalid indices, boundary conditions
4. **Verify immutability** - ensure original state isn't mutated
5. **Test integration with React** only when necessary

```typescript
describe('stackReducer - best practices', () => {
  it('should be deterministic', () => {
    const state = { items: [], currentIndex: -1, history: [] };
    const action = {
      type: 'push' as const,
      step: { id: '1', label: 'Step 1', completed: false },
    };

    // Same input should always produce same output
    const result1 = stackReducer(state, action);
    const result2 = stackReducer(state, action);

    expect(result1).toEqual(result2);
  });

  it('should not have side effects', () => {
    const dispatch = vi.fn();
    const state = { items: [], currentIndex: -1, history: [] };

    // Calling reducer should not trigger side effects
    stackReducer(state, { type: 'push', step: testStep });

    expect(dispatch).not.toHaveBeenCalled();
  });
});
```

**Reference**: [Redux - Writing Tests](https://redux.js.org/usage/writing-tests)

---

## Summary Table: Stack Operations

| Operation | Action | Pattern | Example |
|-----------|--------|---------|---------|
| **Push** | Add to end | `[...state.items, newItem]` | Add new form step |
| **Pop** | Remove from end | `state.items.slice(0, -1)` | Go back one step |
| **Pop to Index** | Remove after index | `state.items.slice(0, index + 1)` | Jump to specific step |
| **Insert at Index** | Add at position | `[...arr.slice(0, i), item, ...arr.slice(i)]` | Insert step in middle |
| **Replace Current** | Update top item | Spread operator on item | Mark step completed |
| **Update by Index** | Modify specific item | Spread operator on item | Update form values |

---

## Key Resources

### Official Documentation
- [useReducer – React](https://react.dev/reference/react/useReducer)
- [Scaling Up with Reducer and Context – React](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [Extracting State Logic into a Reducer – React](https://react.dev/learn/extracting-state-logic-into-a-reducer)

### TypeScript Patterns
- [Type-checking React useReducer in TypeScript - Ben Ilegbodu](https://www.benmvp.com/blog/type-checking-react-usereducer-typescript/)
- [Type React's useReducer and Context API with discriminated union of Typescript - Medium](https://medium.com/@mohsentaleb/elegantly-type-reacts-usereducer-and-context-api-with-discriminated-union-of-typescript-855ff475cafe)
- [Add types for the useReducer Hook - Total TypeScript](https://www.totaltypescript.com/tutorials/react-with-typescript/hooks/typing-state-and-actions-for-usereducer/solution)

### Immutability & Array Operations
- [Immutable Update Patterns - Redux](https://redux.js.org/usage/structuring-reducers/immutable-update-patterns)
- [Redux immutable update patterns - LogRocket Blog](https://blog.logrocket.com/redux-immutable-update-patterns/)
- [Immutability in React and Redux: The Complete Guide - Dave Ceddia](https://daveceddia.com/react-redux-immutability-guide/)

### Testing
- [Testing Library - useReducer](https://testing-library.com/docs/example-react-hooks-usereducer/)
- [Redux - Writing Tests](https://redux.js.org/usage/writing-tests/)
- [A Beginner's Guide to Unit Testing with Vitest - Better Stack Community](https://betterstack.com/community/guides/testing/vitest-explained/)
- [How to test React custom hooks and components with Vitest - This Dot Labs](https://www.thisdot.co/blog/how-to-test-react-custom-hooks-and-components-with-vitest)

### Stack-Based Patterns
- [The State Reducer Pattern with React Hooks - Kent C. Dodds](https://kentcdodds.com/blog/the-state-reducer-pattern-with-react-hooks)
- [Complex state management in React with reducer pattern - Creowis](https://www.creowis.com/blog/complex-state-management-in-react-with-reducer-pattern)
- [GitHub - react-layers-stack](https://github.com/DAB0mB/react-layers-stack)

---

## Next Steps for Implementation

1. **Define Your Stack Types** - Use the discriminated union pattern for type safety
2. **Implement Core Reducer** - Start with push/pop, add other operations as needed
3. **Create Context Provider** - Wrap with useReducer and create custom hooks
4. **Write Reducer Tests** - Test pure reducer function independently
5. **Integrate with Components** - Use custom hooks in your form components
6. **Add Integration Tests** - Test the full flow with React Context and components

---

**Document Version**: 1.0
**Last Updated**: 2025-12-26
**Author**: Research Documentation
