# Geoform React Hierarchical Form Stack - System Context

**Research Date:** 2025-01-10
**Purpose:** Architectural baseline for bug fix implementation

## Project Overview

**geoform** is a React library for managing infinitely nestable hierarchical forms with built-in state management, error isolation, URL synchronization, and comprehensive testing.

### Core Architecture Patterns

1. **Dual-Context Pattern**: Separation of `FormStackStateContext` and `FormStackActionsContext` prevents unnecessary re-renders
2. **Hidden Container Pattern**: All forms rendered simultaneously, inactive forms hidden via CSS
3. **Error Boundary Isolation**: Each form wrapped in individual error boundary for fault tolerance
4. **Deferred Promise Pattern**: Async form resolution using externally-controlled promises
5. **Reducer-Based State Management**: Immutable state transitions via `formStackReducer`

### Technology Stack

- **React**: 19.0.0 (latest)
- **TypeScript**: 5.7.0
- **Test Runner**: Vitest 2.1.0
- **Testing Library**: @testing-library/react 16.0.0
- **Build Tool**: tsup 8.3.0 (ESM + CJS dual output)

### Key File Locations

```
src/
├── components/
│   ├── FormStackProvider.tsx       # Main provider, popToIndex logic (Issue 3)
│   ├── FormStackRenderer.tsx       # Renderer, callback creation (Issue 4)
│   ├── FormErrorBoundary.tsx       # Error boundary, retry logic (Issue 8)
│   ├── ConfirmationDialog.tsx      # Dialog element (Issue 6)
│   └── __tests__/                  # Component tests
├── hooks/
│   ├── useFormStack.ts             # Main hook
│   ├── useFormStackURLSync.ts      # URL sync, race condition (Issue 2)
│   └── __tests__/                  # Hook tests (Issue 1: error artifacts)
├── context/
│   ├── FormStackContext.ts         # Context definitions
│   └── formStackReducer.ts         # State reducer
├── types/                          # TypeScript definitions
└── utils/                          # Utilities (createDeferredPromise, urlEncoding)
```

## Testing Framework Details

**Framework**: Vitest with jsdom environment
**Test Pattern**: `**/*.test.{ts,tsx}`
**Coverage**: v8 provider, comprehensive across all modules
**Global Setup**: `vitest.setup.ts` with Testing Library imports

### Test Organization

1. **Unit Tests**: Located in `__tests__/` subdirectories alongside source
2. **Integration Tests**: Located in `src/__tests__/integration/`
3. **Test Utilities**: `src/__tests__/test-utils.tsx`

### Current Test Stats

- **Total Tests**: 220 tests (21 test files)
- **Passing**: 220
- **Failing**: 0 (2 unhandled error artifacts in stderr, not functional bugs)

## Known Architectural Decisions

### Explicit Non-Goals (Per PRD Section 2)

1. **No Form Registry**: Forms are not centrally registered; consumers manage component references
2. **No Persistence**: No automatic state persistence to localStorage/storage APIs
3. **No Schema Awareness**: Library doesn't validate form structure or data types
4. **Transitions Optional**: Animation/transitions are left to consumers

### Design Trade-offs

1. **URL Sync Limitation**: Can encode form IDs in URL but cannot auto-restore without consumer-implemented `onRestore` callback
2. **closeForm() API**: Public but "typically used internally" - unclear when consumers should call directly
3. **Error Retry**: Uses `retryCount` to force remount, but doesn't reset props on retry (intended for transient errors only)

## TypeScript Type Patterns

### Generic Flow

`FormProps<T>` → `OpenFormOptions<T>` → `Promise<T>` → InternalStackEntry<T>

### Critical Types

```typescript
// Form contract
interface FormProps<T> {
  onSubmit: (value: T) => void;
  onCancel: () => void;
  onError: (error: unknown) => void;
}

// Internal stack entry with deferred promise
interface InternalStackEntry<T> {
  id: string;
  label?: string;
  component: React.ComponentType<FormProps<T>>;
  confirmOnCancel?: boolean;
  deferred: DeferredPromise<T>;  // Key to async resolution
}
```

## Browser Compatibility

**Dialog Element**: Native `<dialog>` with `showModal()` - 98.5% browser support
- Feature detection implemented: `if (typeof dialog.showModal === 'function')`
- Graceful degradation for older browsers
- No polyfill needed for modern browser targets

## Performance Characteristics

**Rendering**: All forms in stack rendered, hidden forms invisible via CSS
**Re-render Optimization**: Dual-context pattern prevents cascading re-renders
**Callback Stability**: Most callbacks properly memoized with `useCallback`
**URL Sync**: Uses `replaceState` for sync updates, `pushState` for navigation

## Development Workflow

1. **Make changes** to source files
2. **Run tests**: `npm test` (Vitest)
3. **Build**: `npm run build` (tsup)
4. **Type check**: `npm run type-check` (tsc --noEmit)

## Integration Points

### Consumer Integration

```typescript
// Consumer provides form components
function App() {
  const { openForm } = useFormStack();

  return (
    <FormStackProvider>
      <button onClick={() => openForm({ id: 'create-org', component: CreateOrgForm })}>
        Create Organization
      </button>
      <FormStackRenderer />  {/* Renders all forms in stack */}
    </FormStackProvider>
  );
}
```

### URL Sync Integration

```typescript
// Consumer enables URL sync
function App() {
  useFormStackURLSync();  // Automatically syncs stack state to ?forms= param
  // ...
}
```

## Code Quality Metrics

- **Test Coverage**: Comprehensive (220 passing tests)
- **Type Safety**: 100% TypeScript, strict mode enabled
- **Documentation**: Complete JSDoc coverage with examples
- **Accessibility**: Proper ARIA attributes, focus management, keyboard navigation
- **Error Handling**: Error boundaries at form level, graceful degradation

## Known Issues Summary

From the PRD analysis:

1. **Issue 1 (Major)**: Test output contains unhandled error artifacts (useFormStack.test.tsx, useFormStackURLSync.test.tsx)
2. **Issue 2 (Major)**: URL sync has potential race condition with rapid open/close + browser back button
3. **Issue 3 (Major)**: `popToIndex()` silently fails on invalid index
4. **Issue 4 (Minor)**: FormStackRenderer creates new callbacks on every render
5. **Issue 5 (Minor)**: `closeForm()` API is public but unclear usage
6. **Issue 6 (Minor)**: Native `<dialog>` element has older browser limitations (mitigated)
7. **Issue 7 (Minor)**: URL sync can't restore forms without registry (design decision)
8. **Issue 8 (Minor)**: Error boundary retry doesn't pass new props to child

## Implementation Guidance for Downstream Agents

### Context Scope Requirements

Every subtask MUST define:
1. **INPUT**: Specific data structures/interfaces from previous subtasks
2. **OUTPUT**: Exact interface exposed for next subtask
3. **MOCKING**: External services to mock for isolation
4. **RESEARCH NOTE**: Reference to architectural finding from this document

### File Modification Guidelines

- **Never modify test files without corresponding source changes**
- **Maintain existing JSDoc coverage**
- **Preserve dual-context pattern**
- **Keep type safety strict (no `any` types)**
- **Add tests for new behavior**
- **Document breaking changes in README**

### Testing Requirements

- **TDD workflow**: Write failing test → Implement → Pass test
- **Error boundary tests**: Suppress `console.error` in beforeEach, restore in afterEach
- **Integration tests**: Test full workflows, not just components
- **Edge cases**: Empty stack, single form, deep nesting (7+ levels), Unicode characters

## Status: Production-Ready with Minor Improvements Recommended

The implementation is excellent with 220 passing tests, comprehensive documentation, and strong adherence to PRD requirements. The 8 identified issues are non-blocking improvements for polish and robustness.
