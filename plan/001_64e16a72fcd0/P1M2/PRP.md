# PRP: Core Type Definitions (P1.M2)

**Milestone:** P1.M2 - Core Type Definitions
**Project:** React Hierarchical Form Stack System (geoform)
**Status:** Foundation type definitions for form stack management
**Estimated Story Points:** 5 SP
**Dependencies:** P1.M1 (Complete) - Project configuration and directory structure

---

## Goal

**Feature Goal**: Define comprehensive TypeScript interfaces that establish the type contract for the entire form stack system, enabling type-safe form operations, promise-based async APIs, and dual-context state management.

**Deliverable**:
- `src/types/form.ts` - FormProps<T> and DeferredPromise<T> interfaces
- `src/types/stack.ts` - StackEntry, OpenFormOptions<T>, and InternalStackEntry<T> interfaces
- `src/types/context.ts` - FormStackState, FormStackActions, FormStackAction union, and FormStackReducerState
- `src/types/index.ts` - Barrel export consolidating all type exports

**Success Definition**:
1. All types pass TypeScript strict mode validation (`npm run type-check`)
2. Types are properly exported and importable from `src/types`
3. Generic constraints work correctly with type inference
4. Build succeeds (`npm run build`) with types included in declarations
5. Types follow existing codebase conventions (CamelCase interfaces, readonly where appropriate)

---

## User Persona

**Target User**: Library developer consuming this form stack system

**Use Case**: Implementing type-safe forms that participate in the form stack with proper TypeScript inference

**User Journey**:
1. Import FormProps<T> to type their form component props
2. Use OpenFormOptions<T> with openForm() for type-safe form opening
3. Receive properly typed Promise<T | undefined> from openForm()
4. Access typed stack via useFormStack().stack

**Pain Points Addressed**:
- Type-unsafe form callbacks causing runtime errors
- No TypeScript intellisense for form stack operations
- Generic form values without proper type inference

---

## Why

- **Foundation for All Implementation**: P1.M3-P1.M5 depend on these type definitions
- **Type Safety**: Ensures compile-time catching of form contract violations
- **Developer Experience**: Enables IDE autocomplete and inline documentation
- **API Contract**: Defines the public API surface that consumers will depend on
- **Maintainability**: Centralized types prevent type drift across modules

---

## What

### Success Criteria

- [ ] FormProps<T> interface with onSubmit, onCancel, onError callbacks
- [ ] DeferredPromise<T> interface enabling externally-controlled promises
- [ ] StackEntry interface for public stack visibility (breadcrumbs)
- [ ] OpenFormOptions<T> interface for openForm() API input
- [ ] InternalStackEntry<T> extending StackEntry with internal properties
- [ ] FormStackState interface for state context (readonly stack)
- [ ] FormStackActions interface for actions context (openForm, closeForm)
- [ ] FormStackAction discriminated union for reducer actions
- [ ] FormStackReducerState for internal reducer state
- [ ] All types exported from src/types/index.ts barrel
- [ ] npm run type-check passes with zero errors
- [ ] npm run build succeeds with types in declarations

---

## All Needed Context

### Context Completeness Check

_This PRP provides everything needed to implement the core type definitions, including exact interface definitions, file organization, and validation commands. An implementer with no prior codebase knowledge can create all types successfully._

### Documentation & References

```yaml
# MUST READ - Core type specifications
- docfile: PRD.md
  why: Sections 5.2 and 6 define the public API contract and form interface
  section: "5.2 useFormStack()" and "6. Form Contract"
  critical: |
    FormProps<T = any> with onSubmit(value: T), onCancel(), onError?(error: unknown)
    openForm<T>(): Promise<T | undefined>
    Stack returns Array<{ id: string, label?: string }>

- docfile: plan/architecture/system_context.md
  why: Documents dual-context pattern and architectural decisions
  section: "Technical Stack Decisions" and "Key Architectural Patterns"
  critical: |
    Context splitting for performance (state vs actions)
    Generic type constraints pattern: <T = unknown>
    DeferredPromise pattern for async openForm API

- docfile: tasks.json
  why: Contains exact context_scope for each subtask with implementation contracts
  section: P1.M2 subtasks (P1.M2.T1.S1 through P1.M2.T2.S2)
  critical: |
    Each subtask has CONTRACT DEFINITION with INPUT/LOGIC/OUTPUT specifications
    Exact field names and type annotations specified

# Pattern references
- file: src/__tests__/setup.test.tsx
  why: Shows existing TypeScript and React component patterns
  pattern: TSX component syntax, Vitest test structure
  gotcha: Uses globals: true pattern (describe/it/expect without imports)

- file: src/types/index.ts
  why: Current barrel export file (empty placeholder)
  pattern: Will export all types from subdomain files

# Architecture context
- docfile: plan/architecture/testing_strategy.md
  why: Testing patterns for hooks and context
  section: "Unit Testing Strategy" and "Example Tests"
  critical: renderHook pattern, context consumer testing
```

### Current Codebase Tree

```bash
geoform-opus/
├── src/
│   ├── index.ts              # Main barrel (placeholder: export {})
│   ├── types/
│   │   └── index.ts          # Types barrel (placeholder: export {})
│   ├── hooks/
│   │   └── index.ts          # Hooks barrel (placeholder)
│   ├── components/
│   │   └── index.ts          # Components barrel (placeholder)
│   ├── context/
│   │   └── index.ts          # Context barrel (placeholder)
│   ├── utils/
│   │   └── index.ts          # Utils barrel (placeholder)
│   └── __tests__/
│       └── setup.test.tsx    # Test setup verification
├── plan/
│   ├── architecture/
│   │   ├── system_context.md # Dual-context pattern documentation
│   │   └── testing_strategy.md
│   ├── P1M1/
│   │   └── PRP.md            # Reference for PRP format
│   └── P1M2/
│       ├── PRP.md            # This file
│       └── research/         # External research findings
├── package.json              # React 18/19 peer deps, TypeScript 5.7
├── tsconfig.json             # Strict mode, jsx: react-jsx
├── tsup.config.ts            # dts: true for type generation
├── vitest.config.ts          # globals: true, jsdom environment
├── vitest.setup.ts           # Testing Library setup
└── PRD.md                    # Core requirements
```

### Desired Codebase Tree After Implementation

```bash
geoform-opus/
├── src/
│   ├── index.ts              # Unchanged (populated in P1.M6)
│   ├── types/
│   │   ├── index.ts          # MODIFY: Barrel export for all types
│   │   ├── form.ts           # NEW: FormProps<T>, DeferredPromise<T>
│   │   ├── stack.ts          # NEW: StackEntry, OpenFormOptions<T>, InternalStackEntry<T>
│   │   └── context.ts        # NEW: FormStackState, FormStackActions, FormStackAction, FormStackReducerState
│   └── ... (other directories unchanged)
├── dist/                     # GENERATED: Will include type declarations
│   ├── index.d.ts            # TypeScript declarations
│   └── ...
└── ... (config files unchanged)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Use T = unknown for safety, not T = any
// T = unknown forces type narrowing before use
// T = any allows unsafe operations
interface FormProps<T = unknown> { ... }  // CORRECT
interface FormProps<T = any> { ... }      // AVOID - loses type safety

// CRITICAL: React.ComponentType requires import from React
import type { ComponentType } from 'react';
// NOT: import { ComponentType } from 'react';  // imports value

// CRITICAL: readonly for public state prevents mutations
interface FormStackState {
  stack: readonly StackEntry[];  // CORRECT - prevents stack.push()
  // NOT: stack: StackEntry[];   // allows mutation
}

// CRITICAL: DeferredPromise resolve signature
// resolve(value: T | undefined) - allows both value and undefined
// NOT: resolve(value: T) - can't resolve with undefined for cancel

// CRITICAL: Discriminated union requires literal type string
type FormStackAction =
  | { type: 'PUSH_FORM'; entry: InternalStackEntry }  // string literal
  // NOT: | { type: string; entry: InternalStackEntry }  // no narrowing

// GOTCHA: Generic constraints propagate through interfaces
// If OpenFormOptions<T> has component: ComponentType<FormProps<T>>
// Then calling openForm<MyType>() infers MyType for form component props

// GOTCHA: tsconfig.json has noUnusedParameters: true
// All generic parameters must be used or prefixed with underscore
interface UnusedGeneric<_T> { ... }  // OK with underscore prefix
```

---

## Implementation Blueprint

### Data Models and Structure

This milestone defines pure TypeScript interfaces - no runtime code or React components.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/types/form.ts
  - IMPLEMENT: FormProps<T> and DeferredPromise<T> interfaces
  - NAMING: PascalCase for interfaces, camelCase for properties
  - PLACEMENT: New file in src/types/
  - CONTENT:
    ```typescript
    /**
     * Props interface that all form components must implement.
     * Forms receive these callbacks from FormStackProvider.
     * @template T - The type of value returned by onSubmit
     */
    export interface FormProps<T = unknown> {
      /** Called when form submits with the form's return value */
      onSubmit: (value: T) => void;
      /** Called when form is canceled (returns undefined to parent) */
      onCancel: () => void;
      /** Optional error handler for form-level errors */
      onError?: (error: unknown) => void;
    }

    /**
     * Externally-controlled promise pattern.
     * Enables openForm() to return a promise that resolves when form submits/cancels.
     * @template T - The type of value the promise resolves with
     */
    export interface DeferredPromise<T> {
      /** The promise that consumers await */
      promise: Promise<T | undefined>;
      /** Resolves the promise with a value (submit) or undefined (cancel) */
      resolve: (value: T | undefined) => void;
      /** Rejects the promise with an error */
      reject: (reason?: unknown) => void;
    }
    ```
  - VALIDATION: npm run type-check passes

Task 2: CREATE src/types/stack.ts
  - IMPLEMENT: StackEntry, OpenFormOptions<T>, InternalStackEntry<T>
  - DEPENDENCIES: Requires FormProps and DeferredPromise from Task 1
  - NAMING: PascalCase for interfaces
  - PLACEMENT: New file in src/types/
  - CONTENT:
    ```typescript
    import type { ComponentType } from 'react';
    import type { FormProps, DeferredPromise } from './form';

    /**
     * Public view of a stack entry for breadcrumb rendering.
     * Consumers see this via useFormStack().stack
     */
    export interface StackEntry {
      /** Unique identifier for the form */
      id: string;
      /** Optional display label for breadcrumbs */
      label?: string;
    }

    /**
     * Options passed to openForm() to open a new form.
     * @template T - The type of value the form will return
     */
    export interface OpenFormOptions<T = unknown> {
      /** Unique identifier for this form instance */
      id: string;
      /** The form component to render (must accept FormProps<T>) */
      component: ComponentType<FormProps<T>>;
      /** Optional label displayed in breadcrumbs */
      label?: string;
      /** If true, shows confirmation dialog before cancel */
      confirmOnCancel?: boolean;
    }

    /**
     * Internal representation of a stack entry.
     * Extends StackEntry with implementation details (not exposed publicly).
     * @template T - The type of value the form will return
     */
    export interface InternalStackEntry<T = unknown> extends StackEntry {
      /** The form component to render */
      component: ComponentType<FormProps<T>>;
      /** Whether to show confirmation before cancel (default: false) */
      confirmOnCancel: boolean;
      /** Deferred promise for async openForm resolution */
      deferred: DeferredPromise<T>;
    }
    ```
  - VALIDATION: npm run type-check passes

Task 3: CREATE src/types/context.ts
  - IMPLEMENT: FormStackState, FormStackActions, FormStackAction, FormStackReducerState
  - DEPENDENCIES: Requires types from Task 1 and Task 2
  - NAMING: PascalCase for interfaces and types
  - PLACEMENT: New file in src/types/
  - CONTENT:
    ```typescript
    import type { StackEntry, OpenFormOptions, InternalStackEntry } from './stack';

    /**
     * Read-only state exposed by FormStackStateContext.
     * Used by components that need to read stack state (e.g., Breadcrumbs).
     */
    export interface FormStackState {
      /** Current form stack (read-only to prevent mutations) */
      stack: readonly StackEntry[];
    }

    /**
     * Actions exposed by FormStackActionsContext.
     * Separated from state to minimize re-renders (context splitting pattern).
     */
    export interface FormStackActions {
      /**
       * Opens a new form and returns a promise that resolves when the form closes.
       * @template T - The type of value the form will return
       * @param options - Configuration for the form to open
       * @returns Promise resolving to form value (submit) or undefined (cancel)
       */
      openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
      /**
       * Closes the current form (internal use - forms use onSubmit/onCancel instead).
       */
      closeForm: () => void;
    }

    /**
     * Discriminated union of all reducer actions.
     * Uses 'type' field as discriminant for TypeScript narrowing.
     */
    export type FormStackAction =
      | { type: 'PUSH_FORM'; entry: InternalStackEntry<unknown> }
      | { type: 'POP_FORM' }
      | { type: 'POP_TO_INDEX'; index: number };

    /**
     * Internal state managed by formStackReducer.
     * Contains full InternalStackEntry array (not just public StackEntry).
     */
    export interface FormStackReducerState {
      /** Internal stack with full entry data including components and deferred promises */
      stack: InternalStackEntry<unknown>[];
    }
    ```
  - VALIDATION: npm run type-check passes

Task 4: MODIFY src/types/index.ts
  - IMPLEMENT: Barrel export consolidating all type exports
  - DEPENDENCIES: All types from Tasks 1-3 must exist
  - NAMING: Standard barrel export pattern
  - PLACEMENT: Modify existing file
  - CONTENT:
    ```typescript
    // Form contract types
    export type { FormProps, DeferredPromise } from './form';

    // Stack entry types
    export type { StackEntry, OpenFormOptions, InternalStackEntry } from './stack';

    // Context types
    export type {
      FormStackState,
      FormStackActions,
      FormStackAction,
      FormStackReducerState,
    } from './context';
    ```
  - VALIDATION: Types importable from 'src/types'

Task 5: CREATE src/types/__tests__/types.test.ts
  - IMPLEMENT: Type-level tests to verify type contracts
  - DEPENDENCIES: All types from Tasks 1-4
  - NAMING: types.test.ts for type verification tests
  - PLACEMENT: src/types/__tests__/
  - CONTENT:
    ```typescript
    import { describe, it, expect } from 'vitest';
    import type {
      FormProps,
      DeferredPromise,
      StackEntry,
      OpenFormOptions,
      InternalStackEntry,
      FormStackState,
      FormStackActions,
      FormStackAction,
      FormStackReducerState,
    } from '../index';

    /**
     * Type-level tests to verify type definitions compile correctly.
     * These tests verify that:
     * 1. All types are exported and importable
     * 2. Generic constraints work as expected
     * 3. Type inference functions correctly
     */
    describe('Type Definitions', () => {
      describe('FormProps<T>', () => {
        it('should accept form component with typed value', () => {
          // Type-level test: verify the type compiles
          type TestForm = (props: FormProps<{ name: string }>) => JSX.Element;

          // Runtime assertion to make test pass
          expect(true).toBe(true);
        });

        it('should use unknown as default generic', () => {
          // FormProps without generic uses unknown
          type DefaultForm = (props: FormProps) => JSX.Element;

          expect(true).toBe(true);
        });
      });

      describe('DeferredPromise<T>', () => {
        it('should have promise, resolve, and reject', () => {
          // Verify structure compiles
          const createMockDeferred = (): DeferredPromise<string> => ({
            promise: Promise.resolve('test'),
            resolve: (_value: string | undefined) => {},
            reject: (_reason?: unknown) => {},
          });

          const deferred = createMockDeferred();
          expect(deferred.promise).toBeInstanceOf(Promise);
        });
      });

      describe('StackEntry', () => {
        it('should have id and optional label', () => {
          const entry: StackEntry = { id: 'test' };
          const entryWithLabel: StackEntry = { id: 'test', label: 'Test Label' };

          expect(entry.id).toBe('test');
          expect(entryWithLabel.label).toBe('Test Label');
        });
      });

      describe('OpenFormOptions<T>', () => {
        it('should require id and component', () => {
          const MockForm = (_props: FormProps<{ data: string }>) => null;

          const options: OpenFormOptions<{ data: string }> = {
            id: 'test-form',
            component: MockForm,
          };

          expect(options.id).toBe('test-form');
        });
      });

      describe('FormStackAction', () => {
        it('should be a discriminated union', () => {
          // Type narrowing test
          const handleAction = (action: FormStackAction) => {
            switch (action.type) {
              case 'PUSH_FORM':
                // TypeScript knows action.entry exists here
                return action.entry.id;
              case 'POP_FORM':
                // TypeScript knows no payload here
                return 'popped';
              case 'POP_TO_INDEX':
                // TypeScript knows action.index exists here
                return action.index;
            }
          };

          const result = handleAction({ type: 'POP_FORM' });
          expect(result).toBe('popped');
        });
      });

      describe('FormStackState', () => {
        it('should have readonly stack', () => {
          const state: FormStackState = {
            stack: [{ id: 'form-1' }],
          };

          expect(state.stack).toHaveLength(1);
          // @ts-expect-error - stack is readonly
          // state.stack.push({ id: 'invalid' });
        });
      });
    });
    ```
  - VALIDATION: npm run test passes
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Generic interface with default parameter
// Use T = unknown instead of T = any for type safety
export interface FormProps<T = unknown> {
  onSubmit: (value: T) => void;
  onCancel: () => void;
  onError?: (error: unknown) => void;
}

// PATTERN: Discriminated union for reducer actions
// 'type' is the discriminant field with literal string types
// TypeScript narrows the type in switch statements automatically
type FormStackAction =
  | { type: 'PUSH_FORM'; entry: InternalStackEntry<unknown> }
  | { type: 'POP_FORM' }
  | { type: 'POP_TO_INDEX'; index: number };

// PATTERN: Interface extension for internal vs public types
// StackEntry is public (id, label)
// InternalStackEntry extends with implementation details
interface StackEntry { id: string; label?: string }
interface InternalStackEntry<T> extends StackEntry {
  component: ComponentType<FormProps<T>>;
  confirmOnCancel: boolean;
  deferred: DeferredPromise<T>;
}

// PATTERN: readonly for preventing mutations on public state
interface FormStackState {
  stack: readonly StackEntry[];  // Prevents .push(), .pop(), etc.
}

// PATTERN: export type for type-only exports (isolatedModules compatible)
export type { FormProps, DeferredPromise } from './form';
```

### Integration Points

```yaml
TYPES_BARREL:
  - Export from: src/types/index.ts
  - Pattern: "export type { TypeName } from './module'"
  - Used by: P1.M3 (context), P1.M4 (hooks), P1.M5 (renderer)

BUILD:
  - tsup with dts: true generates dist/index.d.ts
  - Types included automatically via tsconfig declaration: true

TYPE_CHECK:
  - Command: npm run type-check
  - Validates: All types in src/types/ pass strict mode
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating each file, verify TypeScript compiles
npm run type-check

# Expected: Zero errors
# If errors: Read output carefully, common issues:
# - Missing imports (ComponentType from 'react')
# - Unused generic parameters (prefix with underscore: _T)
# - Incorrect type syntax

# Build to verify types generate correctly
npm run build

# Verify type declarations exist
ls dist/*.d.ts
# Expected: dist/index.d.ts exists
```

### Level 2: Unit Tests (Component Validation)

```bash
# After creating test file
npm run test

# Expected: All tests pass
# Output should show:
# ✓ Type Definitions > FormProps<T> > ...
# ✓ Type Definitions > DeferredPromise<T> > ...
# ✓ Type Definitions > StackEntry > ...
# etc.

# Run tests in watch mode for development
npm run test:watch
```

### Level 3: Integration Testing (System Validation)

```bash
# Verify types are importable from barrel export
# Create a temporary test file or use Node REPL:

# In src/types/__tests__/import.test.ts
import type {
  FormProps,
  DeferredPromise,
  StackEntry,
  OpenFormOptions,
  InternalStackEntry,
  FormStackState,
  FormStackActions,
  FormStackAction,
  FormStackReducerState,
} from '../index';

# If this compiles, all exports are working

# Full validation suite
npm run type-check && npm run test && npm run build
# Expected: All three commands pass
```

### Level 4: Manual Verification

```bash
# Verify generic type inference works
# Create a mock form and verify TypeScript infers types:

type TestValue = { name: string; email: string };

// This should compile and TypeScript should infer T = TestValue
const TestForm: React.FC<FormProps<TestValue>> = (props) => {
  props.onSubmit({ name: 'test', email: 'test@example.com' });
  // @ts-expect-error - wrong type should fail
  props.onSubmit({ wrong: 'field' });
  return null;
};

// OpenFormOptions should infer T from component
const options: OpenFormOptions<TestValue> = {
  id: 'test',
  component: TestForm,
};
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run test` passes all type definition tests
- [ ] `npm run build` generates dist/index.d.ts with type declarations
- [ ] All files created: form.ts, stack.ts, context.ts, index.ts (modified)

### Feature Validation

- [ ] FormProps<T> has onSubmit, onCancel, onError properties correctly typed
- [ ] DeferredPromise<T> has promise, resolve, reject properties
- [ ] StackEntry has id (required) and label (optional)
- [ ] OpenFormOptions<T> has id, component (required), label, confirmOnCancel (optional)
- [ ] InternalStackEntry<T> extends StackEntry with component, confirmOnCancel, deferred
- [ ] FormStackState has readonly stack
- [ ] FormStackActions has openForm<T> and closeForm
- [ ] FormStackAction is a discriminated union with PUSH_FORM, POP_FORM, POP_TO_INDEX
- [ ] All types exported from src/types/index.ts

### Code Quality Validation

- [ ] Uses T = unknown (not T = any) for generic defaults
- [ ] Uses readonly for public state arrays
- [ ] Uses export type for type-only exports
- [ ] Uses import type for type-only imports
- [ ] JSDoc comments on all public interfaces
- [ ] Follows PascalCase for interface names
- [ ] Follows camelCase for property names

### Documentation & Deployment

- [ ] All interfaces have JSDoc comments explaining purpose
- [ ] Type tests verify compile-time constraints
- [ ] Build succeeds and includes type declarations

---

## Anti-Patterns to Avoid

- **DON'T** use `any` as generic default - use `unknown` for type safety
- **DON'T** make public state mutable - use `readonly` modifier
- **DON'T** use `import { ... }` for types - use `import type { ... }`
- **DON'T** forget JSDoc comments - they provide IDE documentation
- **DON'T** use object type `{}` - use `Record<string, unknown>` or specific interface
- **DON'T** expose internal types (InternalStackEntry) in public API
- **DON'T** create circular dependencies between type files
- **DON'T** use string unions without literal types for discriminants

---

## Confidence Score

**9/10** - Very high confidence for one-pass implementation success

**Rationale:**
- All type definitions are explicitly specified with complete interface bodies
- Patterns are well-documented (discriminated unions, generic constraints, readonly)
- No external dependencies (pure TypeScript interfaces)
- Existing codebase has working TypeScript configuration
- Simple file structure with clear dependencies between files
- Validation commands are specific and executable

**Risk Mitigation:**
- If type-check fails: Check for missing React type imports (`import type { ComponentType } from 'react'`)
- If build fails: Verify tsup.config.ts has `dts: true` (already confirmed in P1.M1)
- If tests fail: Ensure types.test.ts is in correct location (`src/types/__tests__/`)

---

## Quick Start for Implementation

```bash
# 1. Create form.ts with FormProps and DeferredPromise
touch src/types/form.ts
# Copy content from Task 1

# 2. Create stack.ts with StackEntry, OpenFormOptions, InternalStackEntry
touch src/types/stack.ts
# Copy content from Task 2

# 3. Create context.ts with context and reducer types
touch src/types/context.ts
# Copy content from Task 3

# 4. Update index.ts barrel export
# Modify src/types/index.ts with exports from Task 4

# 5. Create test directory and type tests
mkdir -p src/types/__tests__
touch src/types/__tests__/types.test.ts
# Copy content from Task 5

# 6. Validate
npm run type-check && npm run test && npm run build

# Expected: All commands pass, types ready for P1.M3
```

**Expected total time:** 15-30 minutes for implementation.

---

## Research References

The following research was conducted for this PRP:

- **React TypeScript patterns**: Official React TypeScript cheatsheet patterns for context and generics
- **DeferredPromise pattern**: Standard pattern for externally-controlled promises (used in modals, dialogs)
- **Discriminated unions**: TypeScript handbook patterns for reducer actions
- **Context splitting**: React performance pattern separating state from actions

Research files are available in `plan/P1M2/research/` for additional context.
