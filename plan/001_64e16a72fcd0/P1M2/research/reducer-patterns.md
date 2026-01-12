# TypeScript Patterns for React Reducers and Discriminated Unions

**Research Date:** December 26, 2025
**Topic:** Type-safe reducer patterns in React using TypeScript discriminated unions
**Status:** Comprehensive research completed

---

## Table of Contents

1. [Discriminated Union Action Types](#discriminated-union-action-types)
2. [useReducer Typing Patterns](#usereducer-typing-patterns)
3. [Action Creator Patterns](#action-creator-patterns)
4. [Practical Examples](#practical-examples)
5. [Best Practices Summary](#best-practices-summary)
6. [Sources](#sources)

---

## Discriminated Union Action Types

### What Are Discriminated Unions?

A **discriminated union** (also called a tagged union) is a TypeScript pattern where:
- A union type contains multiple related shapes
- Each shape has a common property with a **literal type** value (the "discriminant")
- TypeScript automatically narrows the type when the discriminant is checked

The discriminant is typically the `type` property using string literal types.

### Defining Action Types with Discriminated Unions

**Pattern:**
```typescript
type Action =
  | { type: 'PUSH_FORM'; entry: T }
  | { type: 'POP_FORM' }
  | { type: 'POP_TO_INDEX'; index: number };
```

**Why This Works:**
- Each action has a unique `type` literal value
- TypeScript ensures you can only dispatch valid action shapes
- Adding new actions requires updating the union—no missed cases

**Complete Example:**
```typescript
// Define state shape
interface FormStackState {
  forms: any[];
  currentIndex: number;
}

// Define action types with discriminated union
type FormStackAction =
  | { type: 'PUSH_FORM'; entry: any }
  | { type: 'POP_FORM' }
  | { type: 'POP_TO_INDEX'; index: number }
  | { type: 'RESET' };

// Reducer with exhaustiveness checking
function formStackReducer(state: FormStackState, action: FormStackAction): FormStackState {
  switch (action.type) {
    case 'PUSH_FORM':
      return {
        ...state,
        forms: [...state.forms, action.entry],
        currentIndex: state.forms.length,
      };
    case 'POP_FORM':
      return {
        ...state,
        forms: state.forms.slice(0, -1),
        currentIndex: Math.max(0, state.currentIndex - 1),
      };
    case 'POP_TO_INDEX':
      if (action.index < 0 || action.index >= state.forms.length) {
        return state;
      }
      return {
        ...state,
        forms: state.forms.slice(0, action.index + 1),
        currentIndex: action.index,
      };
    case 'RESET':
      return {
        forms: [],
        currentIndex: -1,
      };
    default:
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
  }
}
```

### Best Practices for the Discriminant

**1. Use `type` as the Discriminant Property**
- Industry standard (Redux, React Hooks, most libraries)
- Immediately recognizable to developers
- Works with exhaustiveness checking

**2. Use String Literals, Not Enums**
```typescript
// GOOD: String literals are simple and work with type narrowing
type Action = { type: 'ADD' } | { type: 'REMOVE' };

// AVOID: Enums add unnecessary complexity
enum ActionType {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}
type Action = { type: ActionType };
```

**3. Use `as const` for Action Creators (Optional)**
```typescript
const actions = {
  push: (entry: any) => ({ type: 'PUSH_FORM' as const, entry }),
  pop: () => ({ type: 'POP_FORM' as const }),
  popToIndex: (index: number) => ({ type: 'POP_TO_INDEX' as const, index }),
};
```

### Type Narrowing in Switch Statements

**How It Works:**
When you check `action.type` in a switch statement, TypeScript automatically narrows the type:

```typescript
switch (action.type) {
  case 'PUSH_FORM':
    // TypeScript knows action has properties: type, entry
    console.log(action.entry); // OK
    console.log(action.index); // ERROR: 'index' does not exist
    break;

  case 'POP_TO_INDEX':
    // TypeScript knows action has properties: type, index
    console.log(action.index); // OK
    console.log(action.entry); // ERROR: 'entry' does not exist
    break;
}
```

**Exhaustiveness Checking:**
TypeScript can verify you've handled all action types using the `never` type:

```typescript
switch (action.type) {
  case 'PUSH_FORM':
    return handlePush(state, action);
  case 'POP_FORM':
    return handlePop(state);
  case 'POP_TO_INDEX':
    return handlePopToIndex(state, action);
  default:
    // If you're missing a case, this will error
    const _exhaustiveCheck: never = action;
    return _exhaustiveCheck; // ERROR if action type not handled
}
```

**Benefits:**
- Compile-time verification all cases are handled
- No need for a generic `default` case (unless you need one)
- Adding new action types immediately breaks compilation in all places that need updating

---

## useReducer Typing Patterns

### Type Inference in useReducer

**The Signature:**
```typescript
function useReducer<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S,
  init?: (initial: S) => S
): [S, Dispatch<A>];
```

TypeScript infers types based on the reducer function:
- `S` is inferred from the reducer's first parameter and initialState
- `A` is inferred from the reducer's second parameter
- `dispatch` will only accept actions of type `A`

### Typing the Reducer Function

**Pattern 1: Explicit Type Annotations (Recommended)**
```typescript
// Define types explicitly
interface State {
  count: number;
  loading: boolean;
}

type Action =
  | { type: 'INCREMENT'; payload: number }
  | { type: 'DECREMENT'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean };

// Reducer with explicit types
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + action.payload };
    case 'DECREMENT':
      return { ...state, count: state.count - action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
  }
}

// Usage: TypeScript infers correct types
const [state, dispatch] = useReducer(reducer, { count: 0, loading: false });
// state is typed as State
// dispatch is typed as (action: Action) => void
```

**Pattern 2: Using const Reducer Functions**
```typescript
const formStackReducer = (state: FormStackState, action: FormStackAction): FormStackState => {
  // implementation
};

const [state, dispatch] = useReducer(formStackReducer, initialState);
```

### State Type Definitions

**Key Principles:**
1. Define your state interface explicitly
2. Use interface or type depending on extensibility needs
3. Keep state structure normalized and minimal

**Example Patterns:**

```typescript
// Simple state
interface CounterState {
  count: number;
}

// Complex state with nested objects
interface TodoAppState {
  todos: {
    id: number;
    text: string;
    completed: boolean;
  }[];
  filter: 'all' | 'active' | 'completed';
  selectedTodoId: number | null;
}

// State with discriminated unions (state machine pattern)
interface FormState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: any | null;
  error: string | null;
}

// Async operation state
type AsyncState<T> =
  | { status: 'idle'; data: null }
  | { status: 'loading'; data: null }
  | { status: 'success'; data: T }
  | { status: 'error'; data: null; error: string };
```

### useReducer with Initialization

**Pattern: Init Function**
```typescript
interface State {
  count: number;
  history: number[];
}

function init(initialCount: number): State {
  return {
    count: initialCount,
    history: [initialCount],
  };
}

function reducer(state: State, action: Action): State {
  // ...
}

const [state, dispatch] = useReducer(reducer, 5, init);
// Calls init(5) to create initial state
```

---

## Action Creator Patterns

### To Use or Not to Use Action Creators?

**Discriminated Unions Are Sufficient:**
With TypeScript discriminated unions, you can often skip action creators entirely:

```typescript
// Without action creators - simple and type-safe
dispatch({ type: 'PUSH_FORM', entry: newForm });
dispatch({ type: 'POP_FORM' });

// TypeScript ensures compile-time correctness
```

**When Action Creators Are Useful:**

1. **Reducing Boilerplate** - When creating the same action repeatedly
   ```typescript
   const pushForm = (entry: any) => ({ type: 'PUSH_FORM' as const, entry });
   dispatch(pushForm(newForm));
   ```

2. **Async Operations** - With middleware or async thunks
   ```typescript
   const fetchUser = (id: string) => async (dispatch: Dispatch) => {
     dispatch({ type: 'FETCH_START' });
     try {
       const data = await api.getUser(id);
       dispatch({ type: 'FETCH_SUCCESS', payload: data });
     } catch (error) {
       dispatch({ type: 'FETCH_ERROR', error });
     }
   };
   ```

3. **Complex Payload Transformations**
   ```typescript
   const updateForm = (formId: string, changes: Partial<Form>) => ({
     type: 'UPDATE_FORM' as const,
     payload: {
       formId,
       changes,
       timestamp: Date.now(),
     },
   });
   ```

### Type-Safe Action Creator Pattern

**Simple Pattern:**
```typescript
// Define action creators as simple functions
const formActions = {
  pushForm: (entry: any) => ({ type: 'PUSH_FORM' as const, entry }),
  popForm: () => ({ type: 'POP_FORM' as const }),
  popToIndex: (index: number) => ({ type: 'POP_TO_INDEX' as const, index }),
};

// Extract the union of all action return types
type FormAction = ReturnType<typeof formActions[keyof typeof formActions]>;

// TypeScript knows all valid actions
dispatch(formActions.pushForm(myForm)); // OK
dispatch(formActions.popToIndex(5)); // OK
dispatch({ type: 'INVALID' }); // ERROR
```

**Advanced Pattern with Factories:**
```typescript
// Factory function for creating action creators
function createAction<Type extends string, Payload = undefined>(
  type: Type
): Payload extends undefined
  ? () => { type: Type }
  : (payload: Payload) => { type: Type; payload: Payload } {
  return ((payload?: Payload) => ({
    type,
    ...(payload !== undefined ? { payload } : {}),
  })) as any;
}

// Usage
const push = createAction<'PUSH_FORM', any>('PUSH_FORM');
const pop = createAction<'POP_FORM'>('POP_FORM');

const action1 = push({ id: 1 }); // { type: 'PUSH_FORM', payload: { id: 1 } }
const action2 = pop(); // { type: 'POP_FORM' }
```

### Redux Toolkit Approach (For Reference)

If using Redux or Redux Toolkit:

```typescript
import { createAction } from '@reduxjs/toolkit';

const pushForm = createAction<any>('PUSH_FORM');
const popForm = createAction('POP_FORM');
const popToIndex = createAction<number>('POP_TO_INDEX');

// RTK actions have a .match() method for type predicates
if (pushForm.match(action)) {
  // TypeScript knows action.payload exists
  console.log(action.payload);
}
```

---

## Practical Examples

### Example 1: Form Stack Reducer (Your Use Case)

```typescript
// Types
interface FormStackState<T = any> {
  forms: T[];
  currentIndex: number;
}

type FormStackAction<T = any> =
  | { type: 'PUSH_FORM'; entry: T }
  | { type: 'POP_FORM' }
  | { type: 'POP_TO_INDEX'; index: number }
  | { type: 'RESET' }
  | { type: 'REPLACE_FORM'; index: number; entry: T };

// Reducer with full type safety
function formStackReducer<T>(
  state: FormStackState<T>,
  action: FormStackAction<T>
): FormStackState<T> {
  switch (action.type) {
    case 'PUSH_FORM': {
      const newForms = [...state.forms, action.entry];
      return {
        forms: newForms,
        currentIndex: newForms.length - 1,
      };
    }
    case 'POP_FORM': {
      if (state.forms.length === 0) return state;
      return {
        forms: state.forms.slice(0, -1),
        currentIndex: Math.max(0, state.currentIndex - 1),
      };
    }
    case 'POP_TO_INDEX': {
      const { index } = action;
      if (index < -1 || index >= state.forms.length) return state;
      return {
        forms: state.forms.slice(0, index + 1),
        currentIndex: Math.max(0, index),
      };
    }
    case 'RESET': {
      return {
        forms: [],
        currentIndex: -1,
      };
    }
    case 'REPLACE_FORM': {
      if (action.index < 0 || action.index >= state.forms.length) return state;
      const newForms = [...state.forms];
      newForms[action.index] = action.entry;
      return {
        forms: newForms,
        currentIndex: state.currentIndex,
      };
    }
    default:
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
  }
}

// Usage in component
function FormStack() {
  const [state, dispatch] = useReducer(formStackReducer, {
    forms: [],
    currentIndex: -1,
  });

  return (
    <div>
      <button onClick={() => dispatch({ type: 'PUSH_FORM', entry: {} })}>
        Push Form
      </button>
      <button onClick={() => dispatch({ type: 'POP_FORM' })}>Pop Form</button>
    </div>
  );
}
```

### Example 2: Async State Pattern

```typescript
type AsyncState<T, E = string> =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: E };

type AsyncAction<T, E = string> =
  | { type: 'REQUEST' }
  | { type: 'SUCCESS'; payload: T }
  | { type: 'ERROR'; payload: E }
  | { type: 'RESET' };

function asyncReducer<T, E = string>(
  state: AsyncState<T, E>,
  action: AsyncAction<T, E>
): AsyncState<T, E> {
  switch (action.type) {
    case 'REQUEST':
      return { status: 'loading', data: null, error: null };
    case 'SUCCESS':
      return { status: 'success', data: action.payload, error: null };
    case 'ERROR':
      return { status: 'error', data: null, error: action.payload };
    case 'RESET':
      return { status: 'idle', data: null, error: null };
    default:
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
  }
}
```

### Example 3: Typed Action Creators

```typescript
const createFormStackActions = <T,>() => ({
  push: (entry: T) => ({ type: 'PUSH_FORM' as const, entry }),
  pop: () => ({ type: 'POP_FORM' as const }),
  popToIndex: (index: number) => ({ type: 'POP_TO_INDEX' as const, index }),
  reset: () => ({ type: 'RESET' as const }),
  replace: (index: number, entry: T) =>
    ({ type: 'REPLACE_FORM' as const, index, entry }),
});

// Usage
const formActions = createFormStackActions<FormData>();
type FormStackAction = ReturnType<typeof formActions[keyof typeof formActions]>;

// Now dispatch with type safety
dispatch(formActions.push(newForm));
dispatch(formActions.popToIndex(2));
```

---

## Best Practices Summary

### 1. Always Use Discriminated Unions for Actions
- Use `type` as the literal discriminant
- Include specific payload shapes for each action
- Avoid optional properties when possible

### 2. Explicit Type Annotations
- Define State and Action types before the reducer
- Use explicit parameter types on reducer functions
- Leverage TypeScript's type inference for `useReducer` return types

### 3. Exhaustiveness Checking
- Use the `never` type in default cases
- This catches missing action handlers at compile time
- Add new action types with confidence

### 4. Keep Actions Simple
- Discriminated unions with inline objects often sufficient
- Action creators useful for complex transformations or repeated patterns
- Consider action creators for consistency with team standards

### 5. Async Operations
- Consider combining `useReducer` with `useEffect` for async workflows
- Use async middleware (Redux) or custom hooks for more complex flows
- Maintain discriminated unions for loading states: `idle | loading | success | error`

### 6. Organization Patterns
```typescript
// Organize by concern:
// 1. Types
interface State { ... }
type Action = { type: 'A' } | { type: 'B' };

// 2. Reducer
function reducer(state: State, action: Action): State { ... }

// 3. Action creators (optional)
const actions = { ... };

// 4. Initial state
const initialState: State = { ... };

// 5. Custom hook (optional)
function useMyReducer() {
  return useReducer(reducer, initialState);
}
```

---

## Sources

- [Type-checking React useReducer in TypeScript | Ben Ilegbodu](https://www.benmvp.com/blog/type-checking-react-usereducer-typescript/)
- [React 18.x & TypeScript | Fabio Biondi](https://www.fabiobiondi.dev/blog/2023-01/how-to-safely-type-usereducer-in-react-and-typescript/)
- [How to Simplify Your Code with TypeScript Discriminated Union Types | DEV Community](https://dev.to/keyurparalkar/make-your-life-easy-with-discriminated-union-types-2moi)
- [Discriminated Unions | TypeScript Deep Dive](https://basarat.gitbook.io/typescript/type-system/discriminated-unions)
- [Discriminated Unions | React with TypeScript | Steve Kinney](https://stevekinney.com/courses/react-typescript/typescript-discriminated-unions)
- [Do not create union types with Redux Action Types | Lenz Weber-Tronic](https://phryneas.de/redux-typescript-no-discriminating-union)
- [TypeScript: Documentation - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Redux Fundamentals, Part 3: State, Actions, and Reducers](https://redux.js.org/tutorials/fundamentals/part-3-state-actions-reducers)
- [GitHub - typesafe-actions](https://github.com/piotrwitek/typesafe-actions)
- [GitHub - typescript-fsa](https://github.com/aikoven/typescript-fsa)
- [Usage With TypeScript | Redux Toolkit](https://redux-toolkit.js.org/usage/usage-with-typescript)
- [Using the useReducer Hook in React with TypeScript | DEV Community](https://dev.to/craigaholliday/using-the-usereducer-hook-in-react-with-typescript-27m1)

---

## Key Takeaways

1. **Discriminated unions are the foundation** of type-safe React reducers
2. **Exhaustiveness checking prevents bugs** by forcing you to handle all action types
3. **TypeScript infers types from reducer functions**, so explicit annotations are powerful
4. **Action creators are optional**—discriminated unions with inline objects often sufficient
5. **Async state best represented** as discriminated unions: `idle | loading | success | error`
6. **Form stack pattern** (your use case) maps perfectly to this discriminated union approach
