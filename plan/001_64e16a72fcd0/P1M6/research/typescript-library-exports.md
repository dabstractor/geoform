# TypeScript Library Export Best Practices

## Research Summary

This document compiles best practices for structuring TypeScript library exports, based on patterns from popular React libraries (TanStack Query, react-hook-form, zustand, jotai).

---

## 1. Barrel Export Patterns

### Best Practice: Explicit Named Exports (NOT Wildcards)

```typescript
// PREFERRED: Explicit exports (better for tree-shaking)
export { useQuery, useMutation } from './hooks';
export type { QueryOptions, MutationOptions } from './types';

// AVOID: Wildcard exports (obscures public API, breaks tree-shaking)
export * from './hooks';
export * from './types';
```

### Why Explicit Exports?
- **Tree-shaking**: Bundlers can analyze explicit exports more efficiently
- **Public API clarity**: Clear which exports are intentionally public
- **Documentation**: Self-documenting what the library provides

---

## 2. Type-Only Exports

### Use `export type` for Interfaces and Type Aliases

```typescript
// DO: Type-only exports (erased at runtime, zero bundle impact)
export type { FormProps, OpenFormOptions, StackEntry } from './types';

// Also valid for re-exporting:
export type { FormStackState, FormStackActions } from './context';
```

### Benefits:
- Guarantees complete erasure at runtime
- Enables bundler optimization
- Clear separation of types vs runtime code

---

## 3. Public vs Internal API

### package.json `exports` Field

The existing package.json already has proper exports configuration:

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.cjs"
      }
    }
  }
}
```

This encapsulates internals - users can only access what's exported from `src/index.ts`.

### Internal Modules Not to Export:
- `FormStackRenderer` - internal rendering component
- `createDeferredPromise` - internal utility
- `formStackReducer` - internal implementation
- `FormStackStateContext` / `FormStackActionsContext` - internal contexts
- `InternalStackEntry` - internal type with implementation details

---

## 4. Tree-Shaking Configuration

### Current package.json (Already Correct)

```json
{
  "sideEffects": false  // Enables tree-shaking
}
```

### tsup.config.ts (Already Correct)

```typescript
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  treeshake: true,
  external: ['react', 'react-dom'],
});
```

---

## 5. Recommended Export Structure for geoform

### Primary Exports (PRD Section 5)

Based on PRD Section 5 "Public API":

1. **FormStackProvider** - Main provider component
2. **useFormStack** - Primary hook (stack, openForm, closeForm)
3. **FormProps** - Form contract interface

### Secondary Exports (Developer Experience)

For advanced consumers who want fine-grained control:

4. **useFormStackState** - Read-only state hook
5. **useFormStackActions** - Actions-only hook
6. **UseFormStackReturn** - Return type for useFormStack

### Type Exports (Consumer Types)

Types consumers need for TypeScript:

7. **OpenFormOptions** - Options for openForm()
8. **StackEntry** - Stack item for breadcrumbs
9. **FormStackState** - State context type
10. **FormStackActions** - Actions context type

### Provider Props Types

11. **FormStackProviderProps** - Props for provider

---

## 6. What NOT to Export

### Internal Implementation Details:

- `FormStackRenderer` - Internal component
- `FormStackRendererProps` - Internal props
- `createDeferredPromise` - Internal utility
- `DeferredPromise` - Internal type
- `InternalStackEntry` - Internal type with component/deferred
- `FormStackAction` - Reducer action type
- `FormStackReducerState` - Internal state type
- `formStackReducer` - Internal reducer
- `initialFormStackState` - Internal state
- `FormStackStateContext` - Internal context
- `FormStackActionsContext` - Internal context

### Rationale:
- Hides implementation details from consumers
- Allows internal refactoring without breaking changes
- Reduces API surface area (simpler docs)
- Prevents misuse of internal APIs

---

## 7. Reference URLs

- [Please Stop Using Barrel Files - TkDodo](https://tkdodo.eu/blog/please-stop-using-barrel-files)
- [Building TypeScript Libraries](https://arrangeactassert.com/posts/building-typescript-libraries/)
- [Package.json Exports Guide](https://hirok.io/posts/package-json-exports)
- [TypeScript Type-Only Imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html)
- [React Hook Form package.json](https://github.com/react-hook-form/react-hook-form/blob/master/package.json)
- [TanStack Query](https://github.com/TanStack/query)
- [Zustand](https://github.com/pmndrs/zustand)

---

## 8. Example Final Export Structure

```typescript
// src/index.ts

// ===== Components =====
export { FormStackProvider } from './components';
export type { FormStackProviderProps } from './components';

// ===== Hooks =====
export { useFormStack } from './hooks';
export { useFormStackState } from './hooks';
export { useFormStackActions } from './hooks';
export type { UseFormStackReturn } from './hooks';

// ===== Types (Form Contract) =====
export type { FormProps } from './types';
export type { OpenFormOptions, StackEntry } from './types';
export type { FormStackState, FormStackActions } from './types';
```

This structure:
- Follows explicit export pattern (no wildcards)
- Uses `export type` for type-only exports
- Groups by category (Components, Hooks, Types)
- Hides all internal implementation details
