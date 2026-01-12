# System Context: React Hierarchical Form Stack System

## Project State Assessment

**Date:** 2025-12-24
**Status:** Greenfield Project (No existing codebase)
**Repository:** Empty repository, no existing dependencies

## PRD Requirements Overview

This system implements a **UI shell** for managing infinitely nestable hierarchical forms with the following characteristics:

### Core Responsibilities
- Form stack management (push/pop operations)
- Component state preservation during nesting
- Async imperative API for form operations
- Breadcrumb navigation
- Cancellation confirmation dialogs
- Error boundaries per form
- Optional query string sync

### Explicit Non-Goals
- No persistence layer
- No hydration/rehydration
- No schema awareness
- No validation orchestration
- No form registry
- No framework abstraction (React-only)
- No performance safeguards for extreme nesting
- No routing mandate (query-string only)

## Technical Stack Decisions

### Core Technologies
- **React 18+** (with React 19 compatibility considerations)
- **TypeScript** (strict mode)
- **React Context API** for state management
- **React Error Boundaries** for error isolation
- **Optional:** React Router (for query string sync)

### Key Architectural Patterns

#### 1. Context Splitting Pattern
Split contexts by update frequency to minimize re-renders:
- `FormStackContext` - High frequency updates (stack operations)
- `FormStateContext` - Low frequency updates (loading, error states)

#### 2. Hidden Container Pattern
Preserve form state while hidden:
- Render all forms in DOM
- Hide non-active forms with CSS (`display: none`)
- Keep components mounted to preserve state

#### 3. Async Imperative API Pattern
Return promises from hook operations:
```typescript
openForm<T>(options): Promise<T | undefined>
```
- Suspends parent form execution
- Resolves on submit with value
- Returns undefined on cancel

#### 4. Error Boundary Per Form
Each form wrapped in individual error boundary:
- Isolates errors to single form
- Allows retry/dismiss per form
- Prevents cascade failures

#### 5. Generic Type Constraints
Use TypeScript generics for form values:
```typescript
interface FormProps<T = any> {
  onSubmit: (value: T) => void
  onCancel: () => void
  onError?: (error: unknown) => void
}
```

## Implementation Considerations

### State Management Strategy
- **Primary:** React Context (no external state library)
- **Stack Structure:** Array of form descriptors
- **Form Data:** Stored per form instance
- **Visibility:** CSS-based (no portals)

### Testing Strategy
- **Unit Tests:** Hook logic, context providers
- **Integration Tests:** Multi-step workflows, state persistence
- **E2E Tests:** User interactions, keyboard navigation
- **Tools:** React Testing Library, Jest, MSW for API mocking

### Performance Considerations
- Memoize context values with `useMemo`
- Minimize re-renders with context splitting
- Consider `React.memo` for form components
- No lazy loading in MVP (deferred optimization)

### Accessibility Requirements
- Keyboard navigation support
- ARIA labels for breadcrumbs
- Focus management on form transitions
- Error announcements for screen readers

## Success Metrics

1. ✅ Forms can be nested infinitely
2. ✅ Parent state preserved across nesting
3. ✅ API feels trivial (≤3 lines to open form)
4. ✅ No consumer knowledge of stack internals required
5. ✅ Forms reusable outside system
6. ✅ Error isolation per form
7. ✅ Cancellation with confirmation support
8. ✅ Breadcrumb navigation

## Open Questions (Deferred)

- Vue/Svelte parity (future consideration)
- State serialization (future consideration)
- Cross-tab recovery (future consideration)
- Performance constraints testing (future consideration)
- Schema-aware helpers (future consideration)

## Dependencies

### Runtime Dependencies
- `react@^18.0.0` or `^19.0.0`
- `react-dom@^18.0.0` or `^19.0.0`

### Optional Dependencies
- `react-router-dom@^6.0.0` (for query string sync)
- `history@^5.0.0` (for URL management)

### Development Dependencies
- `typescript@^5.0.0`
- `@types/react@^18.0.0` or `^19.0.0`
- `@types/react-dom@^18.0.0` or `^19.0.0`
- `@testing-library/react@^14.0.0`
- `@testing-library/react-hooks@^8.0.0`
- `jest@^29.0.0`
- `msw@^2.0.0` (for API mocking in tests)
