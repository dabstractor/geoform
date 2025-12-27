# PRP: Public API Export (P1.M6)

**Milestone:** P1.M6 - Public API Export
**Project:** React Hierarchical Form Stack System (geoform)
**Status:** Implementation-ready
**Estimated Story Points:** 1 SP
**Dependencies:** P1.M5 (Complete) - Form Rendering Engine

---

## Goal

**Feature Goal**: Create the main library entry point (`src/index.ts`) that exports all public APIs for consumers, following TypeScript library best practices with explicit named exports and proper type-only exports for optimal tree-shaking.

**Deliverable**:
- Complete `src/index.ts` with all public API exports
- Verified build output generates correct type declarations
- All exports tested via build verification

**Success Definition**:
1. `src/index.ts` exports all public APIs (components, hooks, types)
2. Internal implementation details are NOT exported
3. `npm run type-check` passes with zero errors
4. `npm run build` generates `dist/index.d.ts` with all public types
5. `npm run test` passes all existing tests
6. Consumers can import everything they need from `'geoform'`

---

## User Persona

**Target User**: React developer consuming the geoform library

**Use Case**: Importing library components, hooks, and types to build hierarchical forms

**User Journey**:
1. Install package: `npm install geoform`
2. Import provider: `import { FormStackProvider } from 'geoform'`
3. Import hook: `import { useFormStack } from 'geoform'`
4. Import types: `import type { FormProps, OpenFormOptions } from 'geoform'`
5. Build application with full TypeScript support

**Pain Points Addressed**:
- Single import source (no need to import from subpaths)
- All types available for TypeScript consumers
- Tree-shakeable exports (only imported code bundled)

---

## Why

- **Developer Experience**: Single import source for all public APIs
- **TypeScript Support**: Complete type definitions for IDE autocomplete
- **Tree-Shaking**: Explicit exports enable optimal bundle optimization
- **API Boundaries**: Clear separation of public vs internal APIs
- **PRD Completion**: Final step of Phase 1 Foundation

---

## What

### Success Criteria

- [ ] `FormStackProvider` component exported
- [ ] `FormStackProviderProps` type exported
- [ ] `useFormStack` hook exported
- [ ] `useFormStackState` hook exported
- [ ] `useFormStackActions` hook exported
- [ ] `UseFormStackReturn` type exported
- [ ] `FormProps<T>` type exported
- [ ] `OpenFormOptions<T>` type exported
- [ ] `StackEntry` type exported
- [ ] `FormStackState` type exported
- [ ] `FormStackActions` type exported
- [ ] Internal APIs NOT exported (FormStackRenderer, createDeferredPromise, etc.)
- [ ] `npm run type-check` passes
- [ ] `npm run test` passes
- [ ] `npm run build` generates declarations

---

## All Needed Context

### Context Completeness Check

_This PRP provides everything needed for an implementer with no prior codebase knowledge. All patterns are explicitly specified with complete code examples and references to existing implementations._

### Documentation & References

```yaml
# MUST READ - Existing barrel exports to consolidate
- file: src/components/index.ts
  why: Contains FormStackProvider, FormStackProviderProps exports
  pattern: "export { FormStackProvider } from './FormStackProvider'"
  critical: Do NOT export FormStackRenderer (internal component)

- file: src/hooks/index.ts
  why: Contains all hook exports
  pattern: "export { useFormStack } from './useFormStack'"
  critical: All hooks should be re-exported

- file: src/types/index.ts
  why: Contains all type exports
  pattern: "export type { FormProps } from './form'"
  critical: Do NOT export InternalStackEntry, FormStackAction, FormStackReducerState

- file: src/utils/index.ts
  why: Contains createDeferredPromise
  pattern: "export { createDeferredPromise } from './createDeferredPromise'"
  critical: Do NOT export (internal utility)

- file: src/context/index.ts
  why: Contains reducer and context exports
  pattern: "export { formStackReducer } from './formStackReducer'"
  critical: Do NOT export anything (all internal)

# PRD Reference
- file: PRD.md
  why: Defines public API in Section 5
  section: "5. Public API"
  critical: |
    Public API includes:
    - FormStackProvider component
    - useFormStack() hook returning { openForm, closeForm, stack }
    - FormProps<T> interface

# Research documentation
- docfile: plan/P1M6/research/typescript-library-exports.md
  why: Best practices for TypeScript library exports
  section: "7. Example Final Export Structure"
  critical: |
    Use explicit exports (not wildcards)
    Use 'export type' for type-only exports
    Group by category (Components, Hooks, Types)

# Package configuration
- file: package.json
  why: Defines entry points and exports field
  pattern: 'exports' field restricts subpath imports
  critical: |
    "main": "./dist/index.cjs"
    "module": "./dist/index.mjs"
    "types": "./dist/index.d.ts"
    Build entry is src/index.ts

- file: tsup.config.ts
  why: Build configuration
  pattern: entry: ['src/index.ts']
  critical: dts: true generates type declarations
```

### Current Codebase Tree

```bash
geoform-opus/
├── src/
│   ├── index.ts              # MODIFY: Replace placeholder with exports
│   ├── components/
│   │   ├── index.ts          # Exports FormStackProvider, FormStackRenderer
│   │   ├── FormStackProvider.tsx
│   │   ├── FormStackRenderer.tsx
│   │   └── __tests__/
│   ├── hooks/
│   │   ├── index.ts          # Exports useFormStack, useFormStackState, useFormStackActions
│   │   ├── useFormStack.ts
│   │   ├── useFormStackState.ts
│   │   ├── useFormStackActions.ts
│   │   └── __tests__/
│   ├── types/
│   │   ├── index.ts          # Exports all types
│   │   ├── form.ts           # FormProps, DeferredPromise
│   │   ├── stack.ts          # StackEntry, OpenFormOptions, InternalStackEntry
│   │   ├── context.ts        # FormStackState, FormStackActions, etc.
│   │   └── __tests__/
│   ├── context/
│   │   ├── index.ts          # Internal: reducer, contexts
│   │   ├── formStackReducer.ts
│   │   ├── FormStackContext.ts
│   │   └── __tests__/
│   └── utils/
│       ├── index.ts          # Internal: createDeferredPromise
│       ├── createDeferredPromise.ts
│       └── __tests__/
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

### Desired Codebase Tree After Implementation

```bash
geoform-opus/
├── src/
│   ├── index.ts              # MODIFIED: Complete public API exports
│   └── ... (other files unchanged)
└── dist/                      # Generated by npm run build
    ├── index.mjs             # ESM bundle
    ├── index.cjs             # CommonJS bundle
    ├── index.d.ts            # Type declarations (VERIFY exports)
    └── index.d.mts           # ESM type declarations
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Use explicit exports, NOT wildcards
// Wildcards break tree-shaking and obscure public API

// WRONG:
export * from './components';
export * from './hooks';
export * from './types';

// CORRECT:
export { FormStackProvider } from './components';
export type { FormStackProviderProps } from './components';
export { useFormStack, useFormStackState, useFormStackActions } from './hooks';

// CRITICAL: Use 'export type' for type-only exports
// Ensures types are erased at runtime (zero bundle impact)

// DO:
export type { FormProps, OpenFormOptions, StackEntry } from './types';

// DON'T (values where types expected):
export { FormProps } from './types';  // Error if FormProps is only a type

// CRITICAL: Internal types to EXCLUDE from public API
// These are implementation details that should not be exposed:
// - InternalStackEntry<T> - has component/deferred (internal)
// - DeferredPromise<T> - internal promise utility type
// - FormStackAction - reducer action discriminated union
// - FormStackReducerState - internal reducer state
// - FormStackStateContext / FormStackActionsContext - internal contexts
// - formStackReducer / initialFormStackState - internal reducer

// CRITICAL: Internal components/utils to EXCLUDE
// - FormStackRenderer - internal rendering (consumers don't need)
// - FormStackRendererProps - internal props type
// - createDeferredPromise - internal utility function

// GOTCHA: tsup generates .d.ts from src/index.ts exports
// Only exports in src/index.ts appear in dist/index.d.ts
// This is correct behavior - controls public API surface
```

---

## Implementation Blueprint

### Data Models and Structure

No new types needed. This milestone only re-exports existing types.

**Public Types to Export:**
```typescript
// From types/form.ts
FormProps<T>              // Form contract interface

// From types/stack.ts
StackEntry                // Public stack item for breadcrumbs
OpenFormOptions<T>        // Options for openForm()

// From types/context.ts
FormStackState            // Read-only state type
FormStackActions          // Actions type
```

**Types to NOT Export (Internal):**
```typescript
// Internal implementation types
DeferredPromise<T>        // Internal utility type
InternalStackEntry<T>     // Has component/deferred fields
FormStackAction           // Reducer action union
FormStackReducerState     // Internal reducer state
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/index.ts
  - IMPLEMENT: Complete public API barrel export
  - FOLLOW pattern: Explicit named exports, type-only for types
  - NAMING: Standard ES module export syntax
  - PLACEMENT: Replace existing placeholder content
  - CONTENT:
    ```typescript
    /**
     * React Hierarchical Form Stack System (geoform)
     *
     * A batteries-included React system for managing infinitely nestable
     * hierarchical forms where users may create required relational data
     * at any point without enforced order.
     *
     * @packageDocumentation
     */

    // ===== Components =====

    /**
     * Provider component that enables form stack functionality.
     * Wrap your application with this component to use useFormStack.
     *
     * @example
     * ```tsx
     * import { FormStackProvider } from 'geoform';
     *
     * function App() {
     *   return (
     *     <FormStackProvider>
     *       <YourApp />
     *     </FormStackProvider>
     *   );
     * }
     * ```
     */
    export { FormStackProvider } from './components';

    /**
     * Props for FormStackProvider component.
     */
    export type { FormStackProviderProps } from './components';

    // ===== Hooks =====

    /**
     * Primary hook for interacting with the form stack.
     * Returns stack state and actions (openForm, closeForm).
     *
     * @example
     * ```tsx
     * import { useFormStack, type FormProps } from 'geoform';
     *
     * function MyComponent() {
     *   const { stack, openForm, closeForm } = useFormStack();
     *
     *   const handleCreate = async () => {
     *     const result = await openForm({
     *       id: 'create-user',
     *       component: CreateUserForm,
     *       label: 'Create User',
     *     });
     *
     *     if (result) {
     *       console.log('Created user:', result);
     *     }
     *   };
     *
     *   return <button onClick={handleCreate}>Create User</button>;
     * }
     * ```
     */
    export { useFormStack } from './hooks';

    /**
     * Hook for reading form stack state only.
     * Use when component only needs to display stack info (e.g., breadcrumbs).
     * More performant than useFormStack when actions aren't needed.
     */
    export { useFormStackState } from './hooks';

    /**
     * Hook for accessing form stack actions only.
     * Use when component only needs to dispatch actions.
     * More performant than useFormStack when state reading isn't needed.
     */
    export { useFormStackActions } from './hooks';

    /**
     * Return type for useFormStack hook.
     */
    export type { UseFormStackReturn } from './hooks';

    // ===== Types =====

    /**
     * Props interface that all form components must implement.
     * Forms receive these callbacks from FormStackProvider.
     *
     * @typeParam T - The type of value returned by onSubmit
     *
     * @example
     * ```tsx
     * import type { FormProps } from 'geoform';
     *
     * interface UserData {
     *   name: string;
     *   email: string;
     * }
     *
     * function CreateUserForm({ onSubmit, onCancel }: FormProps<UserData>) {
     *   const handleSubmit = () => {
     *     onSubmit({ name: 'John', email: 'john@example.com' });
     *   };
     *
     *   return (
     *     <form>
     *       <input name="name" />
     *       <input name="email" />
     *       <button type="button" onClick={handleSubmit}>Save</button>
     *       <button type="button" onClick={onCancel}>Cancel</button>
     *     </form>
     *   );
     * }
     * ```
     */
    export type { FormProps } from './types';

    /**
     * Options passed to openForm() to open a new form.
     *
     * @typeParam T - The type of value the form will return
     */
    export type { OpenFormOptions } from './types';

    /**
     * Public view of a stack entry for breadcrumb rendering.
     * Consumers see this via useFormStack().stack
     */
    export type { StackEntry } from './types';

    /**
     * Read-only state exposed by useFormStackState.
     */
    export type { FormStackState } from './types';

    /**
     * Actions exposed by useFormStackActions.
     */
    export type { FormStackActions } from './types';
    ```
  - VALIDATION: npm run type-check passes

Task 2: VERIFY build generates correct declarations
  - IMPLEMENT: Build and check dist/index.d.ts contents
  - FOLLOW pattern: All public exports should appear in declarations
  - VALIDATION:
    - Run: npm run build
    - Check: dist/index.d.ts exists
    - Verify: FormStackProvider, useFormStack, FormProps exported
    - Verify: InternalStackEntry, createDeferredPromise NOT exported
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: Explicit exports (tree-shakeable)
export { ComponentName } from './path';
export type { TypeName } from './path';

// PATTERN: JSDoc for public API documentation
/**
 * Description of what this export does.
 * @example
 * ```tsx
 * // Example usage
 * ```
 */
export { SomeThing } from './path';

// PATTERN: Grouping by category
// Components first, then hooks, then types
// Makes it easy to scan and understand API

// PATTERN: Type-only exports
// Use 'export type' for interfaces and type aliases
// Ensures zero runtime impact
export type { FormProps, OpenFormOptions } from './types';
```

### Integration Points

```yaml
TSUP_BUILD:
  - Entry point: src/index.ts
  - Output: dist/index.mjs, dist/index.cjs, dist/index.d.ts
  - Verify: dts: true in tsup.config.ts

PACKAGE_JSON:
  - exports field already configured correctly
  - sideEffects: false enables tree-shaking
  - types field points to dist/index.d.ts

SUBDIRECTORY_BARRELS:
  - src/components/index.ts - re-export from
  - src/hooks/index.ts - re-export from
  - src/types/index.ts - re-export from
  - src/context/index.ts - DO NOT re-export (internal)
  - src/utils/index.ts - DO NOT re-export (internal)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After modifying src/index.ts, verify TypeScript compiles
npm run type-check

# Expected: Zero errors
# If errors: Check import paths and export syntax

# Common errors:
# - "Module has no exported member" - check submodule barrel exports
# - "Cannot find module" - check relative path
# - "Re-export of type requires 'export type'" - add 'type' keyword
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run all existing tests (should still pass)
npm run test

# Expected: All tests pass
# This validates no breaking changes to existing code

# Specific test files to verify:
npm run test -- src/components/__tests__/
npm run test -- src/hooks/__tests__/
npm run test -- src/types/__tests__/
```

### Level 3: Build Validation (System Validation)

```bash
# Build the library
npm run build

# Verify output files exist
ls -la dist/

# Expected output:
# dist/index.mjs      - ESM bundle
# dist/index.cjs      - CommonJS bundle
# dist/index.d.ts     - Type declarations
# dist/index.d.mts    - ESM type declarations (may vary)

# Verify type declarations contain public exports
grep -E "FormStackProvider|useFormStack|FormProps" dist/index.d.ts

# Expected: All public exports found

# Verify internal APIs are NOT exported
grep -E "InternalStackEntry|createDeferredPromise|formStackReducer" dist/index.d.ts

# Expected: No matches (these should be internal)
```

### Level 4: Manual Import Verification

```bash
# Create a temporary test file to verify imports work
cat > /tmp/import-test.ts << 'EOF'
// Test all public imports compile correctly
import {
  FormStackProvider,
  useFormStack,
  useFormStackState,
  useFormStackActions,
} from './dist/index.mjs';

import type {
  FormStackProviderProps,
  UseFormStackReturn,
  FormProps,
  OpenFormOptions,
  StackEntry,
  FormStackState,
  FormStackActions,
} from './dist/index.mjs';

// This should work (public API)
const Test1: React.FC = () => {
  const { stack, openForm, closeForm } = useFormStack();
  return null;
};

// These should be the only exports
// Internal APIs should NOT be accessible
EOF

echo "Manual verification: Check all imports resolve correctly"
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run test` passes all tests (existing tests still work)
- [ ] `npm run build` generates dist/index.d.ts with declarations
- [ ] src/index.ts modified with complete exports

### Feature Validation

- [ ] `FormStackProvider` exported (component)
- [ ] `FormStackProviderProps` exported (type)
- [ ] `useFormStack` exported (hook)
- [ ] `useFormStackState` exported (hook)
- [ ] `useFormStackActions` exported (hook)
- [ ] `UseFormStackReturn` exported (type)
- [ ] `FormProps` exported (type)
- [ ] `OpenFormOptions` exported (type)
- [ ] `StackEntry` exported (type)
- [ ] `FormStackState` exported (type)
- [ ] `FormStackActions` exported (type)

### Internal API Exclusion

- [ ] `FormStackRenderer` NOT exported
- [ ] `FormStackRendererProps` NOT exported
- [ ] `createDeferredPromise` NOT exported
- [ ] `DeferredPromise` NOT exported
- [ ] `InternalStackEntry` NOT exported
- [ ] `FormStackAction` NOT exported
- [ ] `FormStackReducerState` NOT exported
- [ ] `formStackReducer` NOT exported
- [ ] `initialFormStackState` NOT exported
- [ ] `FormStackStateContext` NOT exported
- [ ] `FormStackActionsContext` NOT exported

### Code Quality Validation

- [ ] Uses explicit named exports (no wildcards)
- [ ] Uses `export type` for type-only exports
- [ ] JSDoc comments on all exports
- [ ] Exports grouped by category (Components, Hooks, Types)
- [ ] Examples in JSDoc for key exports

### Documentation & Deployment

- [ ] JSDoc with @example for FormStackProvider
- [ ] JSDoc with @example for useFormStack
- [ ] JSDoc with @example for FormProps
- [ ] Build succeeds with type declarations

---

## Anti-Patterns to Avoid

- **DON'T** use wildcard exports (`export * from './module'`) - breaks tree-shaking
- **DON'T** export internal implementation details - breaks encapsulation
- **DON'T** forget `export type` for type-only exports - wastes bundle size
- **DON'T** export context objects directly - consumers should use hooks
- **DON'T** export reducer functions - internal implementation detail
- **DON'T** skip JSDoc comments - poor developer experience
- **DON'T** mix up public types with internal types - API surface confusion

---

## Confidence Score

**10/10** - Very high confidence for one-pass implementation success

**Rationale:**
- All source files already exist and are tested (P1.M1-P1.M5 complete)
- Subdirectory barrel exports already in place
- Only task is consolidating exports into main index.ts
- No new functionality to implement
- Build/test infrastructure already working
- Clear distinction between public and internal APIs

**Risk Mitigation:**
- If type-check fails: Verify import paths match subdirectory barrels
- If build fails: Ensure tsup config entry points to src/index.ts
- If types missing in dist: Check subdirectory barrels export correctly

---

## Quick Start for Implementation

```bash
# 1. Open src/index.ts
# 2. Replace placeholder content with Task 1 content

# 3. Validate
npm run type-check && npm run test && npm run build

# 4. Verify exports in dist
grep -E "export.*FormStackProvider|export.*useFormStack|export.*FormProps" dist/index.d.ts

# 5. Verify internal APIs excluded
grep -E "InternalStackEntry|createDeferredPromise|formStackReducer" dist/index.d.ts
# Should return no matches

# Expected: All commands pass, Phase 1 complete
```

---

## Research References

The following research documents are available in `plan/P1M6/research/`:

1. **typescript-library-exports.md** - TypeScript library export best practices
   - Barrel export patterns
   - Type-only exports
   - Tree-shaking optimization
   - Public vs internal API boundaries
   - Real-world library examples (TanStack, zustand, react-hook-form)

Key external documentation:
- [Please Stop Using Barrel Files - TkDodo](https://tkdodo.eu/blog/please-stop-using-barrel-files)
- [Building TypeScript Libraries](https://arrangeactassert.com/posts/building-typescript-libraries/)
- [Package.json Exports Guide](https://hirok.io/posts/package-json-exports)
- [TypeScript Type-Only Imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html)
