# Architecture Context for closeForm Enhancement

## System Context Overview

**Source**: `plan/architecture/system_context.md`

### Key Architectural Patterns

#### 1. Context Splitting Pattern
- `FormStackStateContext` - Read-only access to stack state
- `FormStackActionsContext` - Dispatch operations (including closeForm)
- Purpose: Minimize re-renders for components that only dispatch actions

#### 2. Hidden Container Pattern
- Forms are never actually unmounted when hidden
- Active forms use `display: block`, inactive forms use `display: none`
- State is preserved because React components remain mounted
- Core architectural principle: no explicit cleanup needed

#### 3. Async Imperative API Pattern
```typescript
openForm<T>(options): Promise<T | undefined>
```
- When `openForm()` is called, a deferred promise is created and pushed onto the stack
- Forms close by resolving their deferred promise (submit) or resolving with undefined (cancel)
- `closeForm()` is designed to directly dispatch a `POP_FORM` action to the reducer

#### 4. Form Lifecycle Management

**Form Opening**:
1. `openForm()` creates a deferred promise
2. Promise is pushed onto the stack
3. Form renders and receives `onSubmit`/`onCancel` props from FormStackRenderer

**Form Closing (Recommended Pattern)**:
1. Form calls `onSubmit(data)` or `onCancel()`
2. FormStackRenderer's callback resolves the deferred promise
3. FormStackRenderer calls `onClose()` which triggers `closeForm()`
4. `closeForm()` dispatches `POP_FORM` action

**Form Closing (Direct closeForm Pattern - Discouraged)**:
1. Component calls `closeForm()` directly
2. `closeForm()` dispatches `POP_FORM` action immediately
3. Deferred promise is NOT resolved (bypasses Promise pattern)

## closeForm Function Context

### Public API Documentation Issues

The system context document specifically mentions:
> "closeForm() API: Public but 'typically used internally' - unclear when consumers should call directly"

### Test Results Document Issues

The TEST_RESULTS.md documents:
> **Expected Behavior**: The public API should only expose methods intended for consumer use.
> **Actual Behavior**: `closeForm()` is exported in the public API but documented as "typically used internal; forms use onSubmit/onCancel instead."

### Suggested Fixes from Documentation

1. Either remove `closeForm` from the public API (make it internal-only)
2. Or create clear guidelines on when to use it vs. when not to use it
3. Improve documentation to explain when programmatic closure is appropriate

## Key Insights for PRP

### Architecture Mismatch
The current implementation exposes `closeForm` in the public API but treats it as an "internal" function with complex usage patterns. This PRP task (P1.M3.T2.S1) addresses option 2: creating clear usage guidelines.

### Promise Pattern Importance
- Forms should close by resolving their deferred promise (through onSubmit/onCancel)
- `closeForm()` bypasses this pattern entirely
- Direct calls break the parent's `await openForm()` expectation

### Use Case Clarity Needed
The documentation shows `closeForm` is intended for:
- Emergency/disaster recovery scenarios
- Programmatic closure from outside the form stack
- Custom navigation scenarios

But consumers need clearer guidance on when these scenarios actually apply.

### Hidden Container Impact
Since forms are never unmounted (CSS-based hiding):
- Direct `closeForm()` calls don't need to worry about cleanup patterns
- State preservation is automatic
- This simplifies the "proper form cleanup" consideration

## References

| Document | Location | Relevant Section |
|----------|----------|------------------|
| System Context | plan/architecture/system_context.md | Lines 1-142 |
| closeForm JSDoc | src/hooks/useFormStack.ts | Lines 24-90 |
| FormStackRenderer | src/components/FormStackRenderer.tsx | Lines 52-77 |
| FormStackProvider | src/components/FormStackProvider.tsx | Lines 99-121 |
