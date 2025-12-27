# PRP: Integration Tests (P4.M2)

**Milestone:** P4.M2 - Integration Tests
**Project:** React Hierarchical Form Stack System (geoform)
**Status:** Implementation Required
**Estimated Story Points:** 9 SP total (T1: 3, T2: 2, T3: 2, T4: 2)
**Dependencies:** P4.M1 (Complete) - Unit Tests

---

## Goal

**Feature Goal**: Create comprehensive integration tests that verify complete workflows across multiple components working together: multi-step forms, state preservation across nested form lifecycles, breadcrumb navigation with cancellation, and error boundary isolation.

**Deliverable**:
- `src/__tests__/integration/FormLifecycle.integration.test.tsx` - Complete form open/submit/cancel workflows
- `src/__tests__/integration/StatePreservation.integration.test.tsx` - Parent state preserved across child lifecycle
- `src/__tests__/integration/DeepNesting.integration.test.tsx` - 3+ level nesting with state preservation
- `src/__tests__/integration/BreadcrumbNavigation.integration.test.tsx` - Breadcrumb click cancels intermediate forms
- `src/__tests__/integration/ErrorBoundaryIsolation.integration.test.tsx` - Error isolation across forms

**Success Definition**:
1. All new integration tests pass: `npm run test -- src/__tests__/integration/`
2. Tests verify realistic user workflows with FormStackProvider
3. Tests verify parent state preservation with actual React state (useState)
4. Tests verify deep nesting (3+ levels) with observable state changes
5. Tests verify breadcrumb navigation cancels forms and resolves promises with undefined
6. Tests verify error in one form doesn't affect sibling or parent forms
7. No React act() warnings in test output
8. `npm run type-check` passes with zero errors

---

## User Persona

**Target User**: Library maintainers and contributors

**Use Case**: Ensuring library reliability through integration testing of complete user workflows

**User Journey**:
1. User opens parent form and enters data
2. User opens child form, enters data, submits
3. Parent receives child value, retains its own state
4. User can navigate via breadcrumbs to any ancestor
5. Errors in one form don't crash the entire form stack

**Pain Points Addressed**:
- Regression prevention in complex multi-form workflows
- Confidence that state preservation works in real-world scenarios
- Verification that error isolation prevents cascade failures

---

## Why

- **Workflow Verification**: Unit tests verify components in isolation; integration tests verify they work together correctly
- **State Preservation Confidence**: The "hidden container" pattern must preserve parent state - integration tests prove this
- **Error Isolation Guarantee**: Error boundaries must isolate failures to individual forms
- **Breadcrumb Navigation Contract**: Clicking breadcrumbs must cancel intermediate forms and resolve promises correctly
- **User Experience Validation**: Real users interact with complete workflows, not individual components

---

## What

### Success Criteria

- [ ] Form lifecycle tests pass (open, submit, cancel, promise resolution)
- [ ] State preservation tests verify parent form state survives child lifecycle
- [ ] Deep nesting tests verify 3-level nesting with all state intact
- [ ] Breadcrumb tests verify navigation cancels intermediate forms
- [ ] Error boundary tests verify error isolation across forms
- [ ] All tests use realistic test components with observable state

---

## All Needed Context

### Context Completeness Check

_"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes - this PRP includes complete file paths, existing patterns to follow, specific test scenarios, and code examples for every test case.

### Documentation & References

```yaml
# MUST READ - Existing integration test patterns to follow
- file: src/components/__tests__/FormStackProvider.integration.test.tsx
  why: Primary pattern for integration testing with FormStackProvider
  pattern: TestConsumer component, openForm/submit/cancel workflow, act() wrapping
  gotcha: Always wrap fireEvent.click in act(), use waitFor for promise resolution

- file: src/components/__tests__/Breadcrumbs.integration.test.tsx
  why: Pattern for breadcrumb navigation testing
  pattern: Nested form opening, breadcrumb click verification, promise cancellation
  gotcha: Breadcrumb clicks need to verify onResult called with undefined for cancelled forms

- file: src/components/__tests__/ConfirmationDialog.integration.test.tsx
  why: Pattern for confirmation flow testing with HTMLDialogElement mocks
  pattern: confirmOnCancel option, dialog button clicks, Keep Editing vs Discard
  gotcha: Mock HTMLDialogElement.prototype.showModal and .close before tests

- file: src/components/__tests__/FormErrorBoundary.test.tsx
  why: Pattern for error boundary testing
  pattern: ErrorThrowingComponent, console.error suppression, retry/dismiss flows
  gotcha: Suppress console.error in beforeEach to avoid noisy test output

# Configuration files
- file: vitest.config.ts
  why: Test runner configuration with jsdom environment
  pattern: globals enabled, setupFiles for cleanup, coverage via v8

- file: vitest.setup.ts
  why: Automatic cleanup and mock clearing after each test
  pattern: afterEach(() => cleanup()), afterEach(() => vi.clearAllMocks())

# External documentation
- url: https://testing-library.com/docs/react-testing-library/api#renderhook
  why: Hook testing with wrapper for context providers
  critical: Use wrapper option for FormStackProvider context

- url: https://testing-library.com/docs/dom-testing-library/api-async#waitfor
  why: Async assertion waiting for promise resolution
  critical: Use waitFor for assertions after async operations

- url: https://vitest.dev/api/vi#vi-fn
  why: Mock function creation and verification
  critical: Use vi.fn() for callbacks, verify with .toHaveBeenCalledWith()
```

### Current Codebase Tree (Test Files)

```bash
geoform-opus/src/
├── __tests__/
│   ├── setup.test.tsx                    # Test environment verification
│   └── integration/                      # NEW: Integration test directory
│       ├── FormLifecycle.integration.test.tsx      # NEW (P4.M2.T1)
│       ├── StatePreservation.integration.test.tsx  # NEW (P4.M2.T2)
│       ├── DeepNesting.integration.test.tsx        # NEW (P4.M2.T3)
│       ├── BreadcrumbNavigation.integration.test.tsx # NEW (extension of existing)
│       └── ErrorBoundaryIsolation.integration.test.tsx # NEW (P4.M2.T5)
├── components/__tests__/
│   ├── FormStackProvider.integration.test.tsx  # EXISTING (4 tests) - reference
│   ├── Breadcrumbs.integration.test.tsx        # EXISTING (3 tests) - reference
│   ├── ConfirmationDialog.integration.test.tsx # EXISTING (8 tests) - reference
│   └── FormErrorBoundary.test.tsx              # EXISTING (22 tests) - reference
└── hooks/__tests__/
    └── useFormStackURLSync.test.tsx            # EXISTING - URL sync patterns
```

### Desired Codebase Tree with Files to Add

```bash
src/__tests__/integration/
├── FormLifecycle.integration.test.tsx
│   # Responsibility: Test complete form open/submit/cancel lifecycle
│   # Tests: openForm adds to stack, submit resolves promise with value,
│   #        cancel resolves with undefined, stack length changes correctly
│
├── StatePreservation.integration.test.tsx
│   # Responsibility: Test parent state preserved across child lifecycle
│   # Tests: Parent useState value survives child open/close,
│   #        parent input field value persists through child lifecycle
│
├── DeepNesting.integration.test.tsx
│   # Responsibility: Test 3-level nesting with state preservation at all levels
│   # Tests: Open A -> Open B -> Open C, submit C, B receives value,
│   #        A state preserved, all promise chains resolve correctly
│
├── BreadcrumbNavigation.integration.test.tsx
│   # Responsibility: Test breadcrumb navigation cancels intermediate forms
│   # Tests: A -> B -> C, click breadcrumb A, forms B and C cancelled,
│   #        both resolve with undefined, stack reduced correctly
│
└── ErrorBoundaryIsolation.integration.test.tsx
    # Responsibility: Test error in one form doesn't affect others
    # Tests: Open parent, open child that throws, parent still functional,
    #        dismiss error allows opening new form, retry works
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Always wrap state-updating operations in act()
await act(async () => {
  fireEvent.click(screen.getByTestId('open-form'));
});

// CRITICAL: Use waitFor for async promise resolution verification
await waitFor(() => {
  expect(onResult).toHaveBeenCalledWith({ name: 'Test User' });
});

// CRITICAL: JSDOM doesn't support HTMLDialogElement methods
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

// CRITICAL: Suppress console.error for expected error boundary errors
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

// CRITICAL: Parent forms have display: none when child is active
// Use toBeInTheDocument() to verify they're still in DOM
expect(screen.getByTestId('parent-form')).toBeInTheDocument();
expect(screen.getByTestId('parent-form').parentElement).toHaveStyle('display: none');

// CRITICAL: Breadcrumb links only appear for non-current forms
// Current form shows as span with aria-current="page"
expect(screen.getByText('Form 1')).toHaveAttribute('aria-current', 'page');
expect(screen.getByRole('link', { name: 'Form 1' })).toBeInTheDocument(); // After opening Form 2

// CRITICAL: Error throwing components must throw during render
const ErrorThrowingComponent = () => {
  throw new Error('Test error'); // Throws during render
  return <div>Never rendered</div>;
};
```

---

## Implementation Blueprint

### Test Form Components (Shared Utilities)

```typescript
// src/__tests__/integration/test-utils.tsx
// Create reusable test form components with observable state

import type { FormProps } from '../../types';
import { useState } from 'react';
import { useFormStack } from '../../hooks';

/**
 * Test form with internal state that can be observed.
 * Use inputTestId to find the input and verify its value.
 */
export function StatefulTestForm({
  onSubmit,
  onCancel,
  formId = 'test',
  initialValue = ''
}: FormProps<{ value: string }> & { formId?: string; initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <div data-testid={`form-${formId}`}>
      <input
        data-testid={`input-${formId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        data-testid={`submit-${formId}`}
        onClick={() => onSubmit({ value })}
      >
        Submit
      </button>
      <button
        data-testid={`cancel-${formId}`}
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

/**
 * Form that can open a child form and capture its result.
 * Use to test parent-child form interactions.
 */
export function ParentFormWithChild({
  onSubmit,
  onCancel,
  ChildComponent,
  formId = 'parent'
}: FormProps<{ parentValue: string; childResult?: unknown }> & {
  ChildComponent: React.ComponentType<FormProps<unknown>>;
  formId?: string;
}) {
  const { openForm } = useFormStack();
  const [parentValue, setParentValue] = useState('');
  const [childResult, setChildResult] = useState<unknown>(undefined);

  const handleOpenChild = async () => {
    const result = await openForm({
      id: 'child-form',
      label: 'Child Form',
      component: ChildComponent,
    });
    setChildResult(result);
  };

  return (
    <div data-testid={`form-${formId}`}>
      <input
        data-testid={`input-${formId}`}
        value={parentValue}
        onChange={(e) => setParentValue(e.target.value)}
      />
      <span data-testid={`child-result-${formId}`}>
        {childResult ? JSON.stringify(childResult) : 'no-result'}
      </span>
      <button data-testid={`open-child-${formId}`} onClick={handleOpenChild}>
        Open Child
      </button>
      <button
        data-testid={`submit-${formId}`}
        onClick={() => onSubmit({ parentValue, childResult })}
      >
        Submit
      </button>
      <button data-testid={`cancel-${formId}`} onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

/**
 * Error-throwing form for error boundary tests.
 */
export function ErrorThrowingForm({
  shouldThrow = true
}: {
  shouldThrow?: boolean
}) {
  if (shouldThrow) {
    throw new Error('Test form error');
  }
  return <div data-testid="error-form-rendered">Form rendered successfully</div>;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/__tests__/integration/test-utils.tsx
  - IMPLEMENT: StatefulTestForm, ParentFormWithChild, ErrorThrowingForm components
  - FOLLOW pattern: src/components/__tests__/FormStackProvider.integration.test.tsx (TestForm, TestConsumer patterns)
  - PURPOSE: Reusable test components with observable internal state
  - EXPORT: Named exports for all test components

Task 2: CREATE src/__tests__/integration/FormLifecycle.integration.test.tsx
  - IMPLEMENT: Tests for P4.M2.T1 (Form Lifecycle Workflow)
  - TESTS:
    - openForm adds form to stack (stack.length increases)
    - submit resolves promise with provided value
    - cancel resolves promise with undefined
    - form is removed from stack after submit
    - form is removed from stack after cancel
    - multiple sequential opens work correctly
  - FOLLOW pattern: src/components/__tests__/FormStackProvider.integration.test.tsx
  - USE: act(), waitFor(), vi.fn() for callbacks

Task 3: CREATE src/__tests__/integration/StatePreservation.integration.test.tsx
  - IMPLEMENT: Tests for P4.M2.T2 (Parent State Preservation)
  - TESTS:
    - parent input value preserved when child opens
    - parent input value preserved after child submits
    - parent input value preserved after child cancels
    - parent useState state preserved across child lifecycle
    - parent receives child value after child submits
  - FOLLOW pattern: src/components/__tests__/FormStackProvider.integration.test.tsx (nested forms describe block)
  - KEY ASSERTION: screen.getByTestId('input-parent').value unchanged after child lifecycle

Task 4: CREATE src/__tests__/integration/DeepNesting.integration.test.tsx
  - IMPLEMENT: Tests for P4.M2.T3 (3-Level Deep Nesting)
  - TESTS:
    - open A -> open B -> open C creates stack of 3
    - submit C returns value to B, A state preserved
    - all 3 forms remain in DOM (hidden container pattern)
    - C visible, B and A hidden
    - after C submits, B becomes visible, A still hidden
    - after B submits, A becomes visible with original state
    - cancel at any level resolves with undefined
  - FOLLOW pattern: src/components/__tests__/Breadcrumbs.integration.test.tsx (multi-level opening)
  - KEY PATTERN: 3 StatefulTestForm with unique formId, each can open child

Task 5: CREATE src/__tests__/integration/BreadcrumbNavigation.integration.test.tsx
  - IMPLEMENT: Tests for P4.M2.T4 (Breadcrumb Navigation)
  - TESTS:
    - clicking breadcrumb at index N cancels forms N+1, N+2, etc.
    - cancelled forms resolve with undefined (verify via callbacks)
    - stack.length reduced to N+1 after navigation
    - with confirmOnCancel, shows dialog before cancelling
    - Keep Editing preserves all forms
    - Discard cancels all deeper forms
  - FOLLOW pattern: src/components/__tests__/Breadcrumbs.integration.test.tsx
  - USE: Breadcrumbs component rendered inside FormStackProvider

Task 6: CREATE src/__tests__/integration/ErrorBoundaryIsolation.integration.test.tsx
  - IMPLEMENT: Tests for P4.M2.T5 (Error Boundary Isolation)
  - TESTS:
    - error in child form shows error boundary fallback
    - parent form still in DOM and accessible
    - dismiss error closes child, parent becomes active
    - retry allows re-render if error condition cleared
    - new form can be opened after error is dismissed
    - error in form A doesn't affect form B (sibling isolation)
  - FOLLOW pattern: src/components/__tests__/FormErrorBoundary.test.tsx
  - SUPPRESS: console.error for expected errors
```

### Implementation Patterns & Key Details

```typescript
// ============================================================
// PATTERN 1: Integration Test Setup with FormStackProvider
// ============================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { FormStackProvider } from '../../components/FormStackProvider';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { useFormStack } from '../../hooks';
import type { FormProps } from '../../types';

// Test consumer that tracks results
function TestConsumer({ onResult }: { onResult: (val: unknown) => void }) {
  const { openForm, stack } = useFormStack();

  const handleOpen = async () => {
    const result = await openForm({
      id: 'test-form',
      component: StatefulTestForm,
      label: 'Test Form',
    });
    onResult(result);
  };

  return (
    <div>
      <span data-testid="stack-length">{stack.length}</span>
      <button data-testid="open-form" onClick={handleOpen}>Open</button>
    </div>
  );
}

// ============================================================
// PATTERN 2: Form Lifecycle Test Structure
// ============================================================
describe('FormLifecycle Integration', () => {
  it('should resolve promise with value on submit', async () => {
    // Arrange
    const onResult = vi.fn();

    render(
      <FormStackProvider>
        <TestConsumer onResult={onResult} />
      </FormStackProvider>
    );

    // Act - Open form
    await act(async () => {
      fireEvent.click(screen.getByTestId('open-form'));
    });

    // Act - Enter value and submit
    fireEvent.change(screen.getByTestId('input-test'), {
      target: { value: 'test-value' }
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-test'));
    });

    // Assert
    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith({ value: 'test-value' });
    });
    expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
  });
});

// ============================================================
// PATTERN 3: State Preservation Test
// ============================================================
describe('StatePreservation Integration', () => {
  it('should preserve parent input value across child lifecycle', async () => {
    // Arrange
    const onParentResult = vi.fn();

    function TestApp() {
      const { openForm } = useFormStack();

      const handleOpen = async () => {
        const result = await openForm({
          id: 'parent',
          component: ParentFormWithChild,
          label: 'Parent',
          // ParentFormWithChild can open its own child
        });
        onParentResult(result);
      };

      return <button data-testid="start" onClick={handleOpen}>Start</button>;
    }

    render(
      <FormStackProvider>
        <TestApp />
      </FormStackProvider>
    );

    // Act - Open parent
    await act(async () => {
      fireEvent.click(screen.getByTestId('start'));
    });

    // Act - Type in parent input
    fireEvent.change(screen.getByTestId('input-parent'), {
      target: { value: 'parent-data' }
    });

    // Act - Open child from parent
    await act(async () => {
      fireEvent.click(screen.getByTestId('open-child-parent'));
    });

    // Assert - Parent is still in DOM (hidden)
    expect(screen.getByTestId('form-parent')).toBeInTheDocument();
    expect(screen.getByTestId('form-parent').parentElement).toHaveStyle('display: none');

    // Act - Submit child
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-child-form'));
    });

    // Assert - Parent is visible again with preserved value
    await waitFor(() => {
      expect(screen.getByTestId('form-parent').parentElement).toHaveStyle('display: block');
    });
    expect(screen.getByTestId('input-parent')).toHaveValue('parent-data');
  });
});

// ============================================================
// PATTERN 4: Deep Nesting Test (3 levels)
// ============================================================
describe('DeepNesting Integration', () => {
  it('should preserve all ancestor states through 3 levels', async () => {
    const results: Record<string, unknown> = {};

    // Form that can open another level
    function NestableForm({ onSubmit, onCancel, formId }: FormProps<{ value: string }> & { formId: string }) {
      const { openForm, stack } = useFormStack();
      const [value, setValue] = useState(`initial-${formId}`);

      const handleOpenNext = async () => {
        const nextId = formId === 'level-1' ? 'level-2' : 'level-3';
        const result = await openForm({
          id: nextId,
          label: nextId,
          component: (props: FormProps<{ value: string }>) =>
            <NestableForm {...props} formId={nextId} />,
        });
        results[nextId] = result;
      };

      return (
        <div data-testid={`form-${formId}`}>
          <input
            data-testid={`input-${formId}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <span data-testid="stack-depth">{stack.length}</span>
          {formId !== 'level-3' && (
            <button data-testid={`open-next-${formId}`} onClick={handleOpenNext}>
              Open Next
            </button>
          )}
          <button data-testid={`submit-${formId}`} onClick={() => onSubmit({ value })}>
            Submit
          </button>
        </div>
      );
    }

    function TestApp() {
      const { openForm } = useFormStack();
      return (
        <button
          data-testid="start"
          onClick={() => openForm({
            id: 'level-1',
            label: 'Level 1',
            component: (props) => <NestableForm {...props} formId="level-1" />
          })}
        >
          Start
        </button>
      );
    }

    render(
      <FormStackProvider>
        <TestApp />
      </FormStackProvider>
    );

    // Open level 1
    await act(async () => {
      fireEvent.click(screen.getByTestId('start'));
    });
    fireEvent.change(screen.getByTestId('input-level-1'), { target: { value: 'L1-data' } });

    // Open level 2
    await act(async () => {
      fireEvent.click(screen.getByTestId('open-next-level-1'));
    });
    fireEvent.change(screen.getByTestId('input-level-2'), { target: { value: 'L2-data' } });

    // Open level 3
    await act(async () => {
      fireEvent.click(screen.getByTestId('open-next-level-2'));
    });

    // Assert - All forms in DOM
    expect(screen.getByTestId('stack-depth')).toHaveTextContent('3');
    expect(screen.getByTestId('form-level-1')).toBeInTheDocument();
    expect(screen.getByTestId('form-level-2')).toBeInTheDocument();
    expect(screen.getByTestId('form-level-3')).toBeInTheDocument();

    // Submit level 3
    fireEvent.change(screen.getByTestId('input-level-3'), { target: { value: 'L3-data' } });
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-level-3'));
    });

    // Assert - Level 2 visible with preserved state
    await waitFor(() => {
      expect(screen.getByTestId('input-level-2')).toHaveValue('L2-data');
    });

    // Submit level 2
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-level-2'));
    });

    // Assert - Level 1 visible with preserved state
    await waitFor(() => {
      expect(screen.getByTestId('input-level-1')).toHaveValue('L1-data');
    });
  });
});

// ============================================================
// PATTERN 5: Error Boundary Isolation Test
// ============================================================
describe('ErrorBoundaryIsolation Integration', () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('should isolate error to erroring form, parent still accessible', async () => {
    let shouldThrow = true;

    function ErrorForm() {
      if (shouldThrow) {
        throw new Error('Child form error');
      }
      return <div data-testid="error-form-ok">Error form recovered</div>;
    }

    function ParentForm({ onSubmit }: FormProps<string>) {
      const { openForm } = useFormStack();
      const [value, setValue] = useState('parent-value');

      return (
        <div data-testid="parent-form">
          <input
            data-testid="parent-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            data-testid="open-error-child"
            onClick={() => openForm({ id: 'error', component: ErrorForm })}
          >
            Open Error Form
          </button>
          <button data-testid="submit-parent" onClick={() => onSubmit(value)}>
            Submit
          </button>
        </div>
      );
    }

    function TestApp() {
      const { openForm } = useFormStack();
      return (
        <button
          data-testid="start"
          onClick={() => openForm({ id: 'parent', component: ParentForm })}
        >
          Start
        </button>
      );
    }

    render(
      <FormStackProvider>
        <TestApp />
      </FormStackProvider>
    );

    // Open parent
    await act(async () => {
      fireEvent.click(screen.getByTestId('start'));
    });
    fireEvent.change(screen.getByTestId('parent-input'), { target: { value: 'safe-data' } });

    // Open error child
    await act(async () => {
      fireEvent.click(screen.getByTestId('open-error-child'));
    });

    // Assert - Error boundary caught it
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Child form error')).toBeInTheDocument();

    // Assert - Parent still in DOM (hidden but intact)
    expect(screen.getByTestId('parent-form')).toBeInTheDocument();

    // Dismiss error
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    });

    // Assert - Parent visible again with preserved state
    await waitFor(() => {
      expect(screen.getByTestId('parent-input')).toHaveValue('safe-data');
    });
  });
});
```

### Integration Points

```yaml
COMPONENTS UNDER TEST:
  - FormStackProvider: Main context provider, manages stack via useReducer
  - FormStackRenderer: Renders all forms, implements hidden container pattern
  - Breadcrumbs: Navigation UI, uses popToIndex for breadcrumb clicks
  - ConfirmationDialog: Modal for confirmOnCancel flows
  - FormErrorBoundary: Per-form error isolation

HOOKS UNDER TEST:
  - useFormStack: Combined state + actions hook
  - useFormStackState: Read-only stack access
  - useFormStackActions: openForm, closeForm, popToIndex

KEY INTEGRATION POINTS:
  - openForm() creates DeferredPromise, pushes to stack, renders via FormStackRenderer
  - onSubmit() resolves deferred promise, pops stack
  - onCancel() resolves with undefined, pops stack (with confirmation if configured)
  - popToIndex() cancels all forms after index, resolves their promises with undefined
  - Error boundary catches errors, offers retry (reset state) or dismiss (resolve undefined)
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Verify TypeScript compiles all new test files
npm run type-check

# Expected: Zero errors
# If errors: Check imports, FormProps types, test component prop types
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run only integration tests
npm run test -- src/__tests__/integration/ -v

# Expected output:
# ✓ src/__tests__/integration/FormLifecycle.integration.test.tsx (6+ tests)
# ✓ src/__tests__/integration/StatePreservation.integration.test.tsx (5+ tests)
# ✓ src/__tests__/integration/DeepNesting.integration.test.tsx (7+ tests)
# ✓ src/__tests__/integration/BreadcrumbNavigation.integration.test.tsx (6+ tests)
# ✓ src/__tests__/integration/ErrorBoundaryIsolation.integration.test.tsx (6+ tests)

# Run full test suite
npm run test

# Expected: All ~220 tests pass (186 existing + ~30 new)
```

### Level 3: Integration Testing (System Validation)

```bash
# Run with verbose output to see test descriptions
npm run test -- src/__tests__/integration/ --reporter=verbose

# Run with coverage for integration tests
npm run test -- src/__tests__/integration/ --coverage

# Check for act() warnings (should be none)
npm run test -- src/__tests__/integration/ 2>&1 | grep -i "act("
# Expected: No output (no warnings)
```

### Level 4: Full Validation

```bash
# Complete validation sequence
npm run type-check && npm run test && npm run build

# Expected:
# - TypeScript: 0 errors
# - Vitest: ~220 tests passing
# - Build: dist/ generated successfully
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run test` passes all tests (existing + new)
- [ ] `npm run build` generates dist/ files
- [ ] No React act() warnings in test output

### Feature Validation

- [ ] **P4.M2.T1** - Form lifecycle tests verify open/submit/cancel workflows
- [ ] **P4.M2.T2** - State preservation tests verify parent state survives child lifecycle
- [ ] **P4.M2.T3** - Deep nesting tests verify 3-level nesting with all state intact
- [ ] **P4.M2.T4** - Breadcrumb tests verify navigation cancels intermediate forms
- [ ] **P4.M2.T5** - Error boundary tests verify error isolation across forms

### Test Quality Validation

- [ ] Tests follow AAA pattern (Arrange-Act-Assert)
- [ ] Tests use act() for all state-updating operations
- [ ] Tests use waitFor() for async promise assertions
- [ ] Tests use realistic components with observable state (not just mocks)
- [ ] Tests verify DOM state (visibility, values) not just callback calls
- [ ] Tests suppress expected console.error output cleanly
- [ ] Test file names follow *.integration.test.tsx pattern

### Code Quality Validation

- [ ] Test utilities are reusable (test-utils.tsx)
- [ ] No code duplication across test files
- [ ] Clear test descriptions explain the scenario
- [ ] Imports follow existing patterns

---

## Anti-Patterns to Avoid

- **DON'T** use fireEvent without act() for operations that update state
- **DON'T** assert immediately after async operations - use waitFor()
- **DON'T** mock the entire FormStackProvider - use the real component
- **DON'T** skip console.error suppression for error boundary tests
- **DON'T** use setTimeout for async waits - use waitFor() with assertions
- **DON'T** test implementation details (internal state) - test observable behavior
- **DON'T** create tests that depend on timing - use proper async patterns
- **DON'T** forget to clean up mocks in afterEach

---

## Confidence Score

**9/10** - High confidence for one-pass implementation

**Rationale:**
- Existing integration tests provide clear patterns to follow
- All test scenarios are well-defined with specific assertions
- Complete code examples provided for each test category
- Known gotchas documented (JSDOM, act(), dialog mocks)
- Test utilities design promotes reusability
- Validation loop provides clear success criteria

**Risk Factors:**
- Complex async interactions may require additional waitFor tuning
- Error boundary retry tests may need careful state management
- 3-level nesting tests are more complex but patterns are established

---

## Quick Implementation Commands

```bash
# Create integration test directory
mkdir -p src/__tests__/integration

# Run specific test file during development
npm run test -- src/__tests__/integration/FormLifecycle.integration.test.tsx --watch

# Run all integration tests with verbose output
npm run test -- src/__tests__/integration/ -v

# Full validation
npm run type-check && npm run test && npm run build
```

---

## References

### Internal Documentation
- `plan/architecture/testing_strategy.md` - Testing pyramid, patterns, coverage goals
- `plan/P4M1/PRP.md` - Unit test patterns and verification
- `plan/P2M1/PRP.md` - Breadcrumbs and popToIndex implementation details

### Existing Test Files (Primary Reference)
- `src/components/__tests__/FormStackProvider.integration.test.tsx` - Core integration patterns
- `src/components/__tests__/Breadcrumbs.integration.test.tsx` - Navigation testing
- `src/components/__tests__/ConfirmationDialog.integration.test.tsx` - Dialog testing
- `src/components/__tests__/FormErrorBoundary.test.tsx` - Error handling patterns

### External Documentation
- [React Testing Library Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async)
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
