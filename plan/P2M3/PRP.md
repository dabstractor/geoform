# P2.M3: Error Boundaries - Product Requirement Prompt

**Milestone**: P2.M3 - Error Boundaries
**Story Points**: 3 total (2 + 1)
**Status**: Ready for Implementation
**Confidence Score**: 9/10 for one-pass implementation success

---

## Goal

**Feature Goal**: Wrap each form in the stack with an individual error boundary to isolate rendering errors and provide graceful recovery options (retry/dismiss) without affecting other forms.

**Deliverable**:
1. `FormErrorBoundary` - A React class component that catches rendering errors from child form components
2. Integration of `FormErrorBoundary` into `FormStackRenderer` to wrap each form's `createElement` call

**Success Definition**:
- When a form component throws an error during rendering, the error is caught by its individual boundary
- The error boundary displays a fallback UI with retry and dismiss buttons
- Other forms in the stack remain unaffected (error isolation)
- Dismiss resolves the form's deferred promise with `undefined` and pops the form
- Retry re-mounts the form component to attempt recovery
- All existing tests pass, new tests cover error scenarios

---

## User Persona

**Target User**: React developers using geoform to build hierarchical form systems

**Use Case**: When a form component throws a rendering error (e.g., accessing undefined property, component logic failure), the user should see a helpful error UI instead of crashing the entire form stack. They should be able to retry or dismiss the erroring form.

**User Journey**:
1. User opens a nested form that has a rendering bug
2. Instead of seeing a white screen or crashed app, they see an error fallback UI
3. User clicks "Try Again" to retry loading the form, OR
4. User clicks "Dismiss" to close the erroring form and return to the parent form
5. Parent form remains fully functional with preserved state

**Pain Points Addressed**:
- Prevents entire form stack crashes from single form errors
- Provides user-friendly recovery options
- Maintains parent form state during child form errors

---

## Why

- **Error Isolation**: Prevents cascade failures where one broken form crashes the entire application
- **User Experience**: Provides clear, actionable recovery options instead of white screens
- **Developer Experience**: Error boundaries capture component stack traces for easier debugging
- **Integration**: Completes P2 Enhanced Features phase, enabling robust error handling before P4 testing phase
- **Reliability**: Production-ready error handling is essential for the library's core value proposition

---

## What

Implement per-form error boundaries that wrap each form component rendered by `FormStackRenderer`. The error boundary must:

1. Catch errors thrown during render, lifecycle methods, and constructors
2. Display a fallback UI with error details (in development) and recovery actions
3. Provide "Try Again" button to reset error state and re-render the form
4. Provide "Dismiss" button to close the form gracefully (resolve with `undefined`)
5. Call optional `onError` callback for error logging/reporting
6. Maintain accessibility standards (role="alert", focus management)

### Success Criteria

- [ ] `FormErrorBoundary` class component created with `getDerivedStateFromError` and `componentDidCatch`
- [ ] Error boundary wraps each form in `FormStackRenderer` rendering loop
- [ ] Fallback UI displays with "Try Again" and "Dismiss" buttons
- [ ] "Try Again" resets error state and remounts the child component
- [ ] "Dismiss" calls `entry.deferred.resolve(undefined)` and triggers form close
- [ ] Parent forms remain functional when child forms error
- [ ] Unit tests cover error catching, retry, and dismiss flows
- [ ] Integration tests verify error isolation across forms
- [ ] All existing tests pass (no regressions)
- [ ] TypeScript types properly defined and exported

---

## All Needed Context

### Context Completeness Check

_This PRP provides: exact file paths, line numbers, code patterns to follow, TypeScript interfaces, test patterns, and validation commands. An implementer unfamiliar with the codebase can successfully implement using only this document._

### Documentation & References

```yaml
# MUST READ - External Documentation
- url: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
  why: Official React documentation on error boundary implementation
  critical: |
    - Must be a class component (not functional)
    - getDerivedStateFromError is STATIC and called during RENDER phase (no side effects)
    - componentDidCatch is called during COMMIT phase (side effects allowed)
    - Error boundaries don't catch: event handlers, async code, SSR, boundary's own errors

- url: https://legacy.reactjs.org/docs/error-boundaries.html
  why: Comprehensive error boundary guide with examples
  critical: Use getDerivedStateFromError to render fallback, componentDidCatch to log errors

# MUST READ - Codebase Files
- file: src/components/FormStackRenderer.tsx
  why: This is WHERE the error boundary integration happens (line 76)
  pattern: |
    - Each form is rendered via `createElement(entry.component, formProps)`
    - Wrap this createElement call with <FormErrorBoundary>
    - Pass entry.id as key for proper reset on retry
    - Pass callbacks for dismiss and error handling
  gotcha: The handleError callback (line 56-59) already exists for form-initiated errors

- file: src/components/ConfirmationDialog.tsx
  why: Reference for accessibility patterns (dialog, role="alertdialog", aria-*)
  pattern: |
    - Uses role="alertdialog" for modal dialogs
    - Implements aria-labelledby, aria-describedby
    - Focus management with useRef and useEffect
    - Escape key handling
  gotcha: JSDOM doesn't fully support <dialog>, tests mock showModal/close

- file: src/types/form.ts
  why: Existing FormProps interface with onError callback
  pattern: FormProps<T> has optional `onError?: (error: unknown) => void`

- file: src/types/stack.ts
  why: InternalStackEntry interface for accessing deferred promise
  pattern: InternalStackEntry has `deferred: DeferredPromise<T>` with resolve/reject

- file: src/components/__tests__/FormStackRenderer.test.tsx
  why: Test patterns for FormStackRenderer - mock factories, assertions
  pattern: |
    - createMockEntry() factory for stack entries
    - createMockDeferred() factory for promise mocking
    - vi.spyOn(deferred, 'resolve') for assertion
    - data-testid="form-{id}" for DOM queries

- file: src/components/__tests__/ConfirmationDialog.test.tsx
  why: Test patterns for accessible dialog components
  pattern: |
    - Mock HTMLDialogElement.prototype.showModal/close
    - Use role queries with { hidden: true } for dialogs
    - Test aria attributes

# RESEARCH - TypeScript Patterns
- docfile: plan/P2M3/research/06-typescript-patterns.md
  why: TypeScript error boundary patterns (Pattern 1-2 are most relevant)
  section: "Pattern 2: Error Boundary with Callbacks"

# RESEARCH - Lifecycle Methods
- docfile: plan/P2M3/research/03-lifecycle-methods-implementation.md
  why: Deep understanding of getDerivedStateFromError vs componentDidCatch
  section: "Key Differences Summary" table
```

### Current Codebase Tree

```bash
src/
├── components/
│   ├── Breadcrumbs.tsx
│   ├── ConfirmationDialog.tsx
│   ├── FormStackProvider.tsx
│   ├── FormStackRenderer.tsx          # MODIFY: wrap forms with error boundary
│   ├── index.ts                        # MODIFY: export FormErrorBoundary
│   └── __tests__/
│       ├── Breadcrumbs.integration.test.tsx
│       ├── Breadcrumbs.test.tsx
│       ├── ConfirmationDialog.integration.test.tsx
│       ├── ConfirmationDialog.test.tsx
│       ├── FormStackProvider.integration.test.tsx
│       └── FormStackRenderer.test.tsx  # MODIFY: add error boundary tests
├── types/
│   ├── context.ts
│   ├── form.ts
│   ├── index.ts
│   └── stack.ts
├── hooks/
│   └── ...
├── context/
│   └── ...
├── utils/
│   └── ...
└── index.ts                            # MODIFY: export FormErrorBoundary types
```

### Desired Codebase Tree (Files to Add)

```bash
src/
├── components/
│   ├── FormErrorBoundary.tsx           # NEW: Error boundary class component
│   ├── FormStackRenderer.tsx           # MODIFY: import and use FormErrorBoundary
│   ├── index.ts                        # MODIFY: export FormErrorBoundary
│   └── __tests__/
│       └── FormErrorBoundary.test.tsx  # NEW: Unit tests for error boundary
└── index.ts                            # MODIFY: export FormErrorBoundaryProps type
```

### Known Gotchas of Codebase & Library Quirks

```typescript
// CRITICAL: Error boundaries MUST be class components
// React hooks cannot implement getDerivedStateFromError/componentDidCatch
// This is the ONLY class component in this codebase - that's intentional

// CRITICAL: getDerivedStateFromError is STATIC - no `this` access
// Use it ONLY to return state updates, NO side effects
static getDerivedStateFromError(error: Error): Partial<State> {
  return { hasError: true, error }; // Pure - no logging here
}

// Side effects go in componentDidCatch (called after render)
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  this.props.onError?.(error, errorInfo); // OK to call props here
}

// GOTCHA: Error boundaries DON'T catch:
// - Event handler errors (use try/catch in handlers)
// - Async errors (use try/catch in async code)
// - Server-side rendering errors
// - Errors thrown in the error boundary itself

// GOTCHA: resetKeys pattern for retry
// Changing the `key` prop on error boundary's child forces remount
// Use entry.id + retryCount to create unique keys

// GOTCHA: JSDOM dialog limitation (from ConfirmationDialog tests)
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

// GOTCHA: Existing handleError in FormStackRenderer
// Line 56-59 already handles form-initiated errors (via onError prop)
// Error boundary handles RENDERING errors (throws during render)
// Both should result in form closure, but via different paths
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// src/components/FormErrorBoundary.tsx

import { Component, type ReactNode, type ErrorInfo } from 'react';

/**
 * Props for FormErrorBoundary component.
 */
export interface FormErrorBoundaryProps {
  /** Child component(s) to wrap with error boundary */
  children: ReactNode;
  /** Unique identifier for the form (used in error messages) */
  formId: string;
  /** Callback when dismiss button is clicked */
  onDismiss: () => void;
  /** Optional callback when error is caught (for logging) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

/**
 * Internal state for FormErrorBoundary.
 */
interface FormErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
  /** Number of retry attempts (used for key generation) */
  retryCount: number;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/components/FormErrorBoundary.tsx
  - IMPLEMENT: FormErrorBoundary class component
  - FOLLOW pattern: TypeScript Pattern 2 from research/06-typescript-patterns.md
  - INCLUDE:
    - FormErrorBoundaryProps interface (exported)
    - FormErrorBoundaryState interface (internal)
    - static getDerivedStateFromError(error) - returns { hasError: true, error }
    - componentDidCatch(error, errorInfo) - calls props.onError if provided
    - handleRetry method - increments retryCount, resets hasError/error
    - handleDismiss method - calls props.onDismiss
    - render() - shows fallback UI or children
  - ACCESSIBILITY:
    - role="alert" on error container
    - aria-live="assertive" for error message
    - aria-describedby for error details
    - Button focus on error (Dismiss button should receive focus)
  - STYLING: Use BEM classes matching existing pattern:
    - form-error-boundary
    - form-error-boundary__container
    - form-error-boundary__title
    - form-error-boundary__message
    - form-error-boundary__actions
    - form-error-boundary__retry-button
    - form-error-boundary__dismiss-button
  - NAMING: FormErrorBoundary class, handleRetry/handleDismiss methods
  - PLACEMENT: src/components/FormErrorBoundary.tsx
  - EXPORT: Named export (not default)

Task 2: CREATE src/components/__tests__/FormErrorBoundary.test.tsx
  - IMPLEMENT: Unit tests for FormErrorBoundary
  - FOLLOW pattern: src/components/__tests__/ConfirmationDialog.test.tsx
  - TEST CASES:
    - Renders children when no error
    - Catches error and shows fallback UI
    - Displays error message in fallback
    - Calls onError callback when error caught
    - "Try Again" button resets error state and remounts child
    - "Dismiss" button calls onDismiss callback
    - Accessibility: role="alert", aria-live
    - Multiple retries increment counter
    - Custom fallback prop renders instead of default
  - MOCKING:
    - Create ErrorThrowingComponent that throws on render
    - Mock console.error to suppress expected errors
    - vi.fn() for onError and onDismiss callbacks
  - NAMING: describe('FormErrorBoundary'), it('should...')
  - PLACEMENT: src/components/__tests__/FormErrorBoundary.test.tsx

Task 3: MODIFY src/components/FormStackRenderer.tsx
  - INTEGRATE: Import FormErrorBoundary
  - WRAP: Each form's createElement with FormErrorBoundary
  - LOCATION: Lines 68-78 (the map callback return statement)
  - CHANGE FROM:
    ```tsx
    return (
      <div key={entry.id} ...>
        {createElement(entry.component, formProps)}
      </div>
    );
    ```
  - CHANGE TO:
    ```tsx
    return (
      <div key={entry.id} ...>
        <FormErrorBoundary
          formId={entry.id}
          onDismiss={() => {
            entry.deferred.resolve(undefined);
            onClose();
          }}
          onError={(error, errorInfo) => {
            // Log error but don't close - let user choose retry/dismiss
            console.error(`[FormStack] Error in form ${entry.id}:`, error);
            console.error('Component stack:', errorInfo.componentStack);
          }}
        >
          {createElement(entry.component, formProps)}
        </FormErrorBoundary>
      </div>
    );
    ```
  - DEPENDENCIES: Import FormErrorBoundary from './FormErrorBoundary'
  - PRESERVE: All existing props and behavior

Task 4: MODIFY src/components/__tests__/FormStackRenderer.test.tsx
  - ADD: Test cases for error boundary integration
  - NEW TEST CASES:
    - "should catch error and display fallback when form throws"
    - "should call onClose when dismiss is clicked after error"
    - "should allow retry after error"
    - "should resolve deferred with undefined on dismiss"
    - "should not affect other forms when one form errors"
  - CREATE: ErrorThrowingForm component for testing
  - FOLLOW pattern: Existing test structure in file

Task 5: MODIFY src/components/index.ts
  - ADD: Export FormErrorBoundary component
  - ADD: Export FormErrorBoundaryProps type
  - PATTERN: Follow existing export pattern in file
  - ADD lines:
    ```typescript
    export { FormErrorBoundary } from './FormErrorBoundary';
    export type { FormErrorBoundaryProps } from './FormErrorBoundary';
    ```

Task 6: MODIFY src/index.ts (public API)
  - ADD: Export FormErrorBoundary for advanced users
  - ADD: Export FormErrorBoundaryProps type
  - LOCATION: After ConfirmationDialog exports (around line 87)
  - ADD documentation comment explaining use case
  - PATTERN: Follow existing component export pattern with JSDoc
```

### Implementation Patterns & Key Details

```typescript
// ==========================================
// FormErrorBoundary.tsx - Core Implementation
// ==========================================

import { Component, type ReactNode, type ErrorInfo } from 'react';

export interface FormErrorBoundaryProps {
  children: ReactNode;
  formId: string;
  onDismiss: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
}

interface FormErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Error boundary component for isolating form rendering errors.
 * Provides retry and dismiss options for graceful error recovery.
 */
export class FormErrorBoundary extends Component<
  FormErrorBoundaryProps,
  FormErrorBoundaryState
> {
  constructor(props: FormErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  // CRITICAL: Static method - no side effects, no `this`
  static getDerivedStateFromError(error: Error): Partial<FormErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  // Called after render - side effects OK here
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Call optional error callback for logging
    this.props.onError?.(error, errorInfo);
  }

  // Reset error state and increment retry count to force remount
  private handleRetry = (): void => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  // Delegate to parent's dismiss handler
  private handleDismiss = (): void => {
    this.props.onDismiss();
  };

  render(): ReactNode {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, formId } = this.props;

    if (hasError) {
      // Custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div
          className="form-error-boundary"
          role="alert"
          aria-live="assertive"
          data-testid={`error-boundary-${formId}`}
        >
          <div className="form-error-boundary__container">
            <h3
              className="form-error-boundary__title"
              id={`error-title-${formId}`}
            >
              Something went wrong
            </h3>
            <p
              className="form-error-boundary__message"
              aria-describedby={`error-title-${formId}`}
            >
              {error?.message || 'An unexpected error occurred while loading this form.'}
            </p>
            <div className="form-error-boundary__actions">
              <button
                className="form-error-boundary__retry-button"
                onClick={this.handleRetry}
                type="button"
              >
                Try Again
              </button>
              <button
                className="form-error-boundary__dismiss-button"
                onClick={this.handleDismiss}
                type="button"
                autoFocus // Focus dismiss as "safe" action
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Use key with retryCount to force remount on retry
    // Wrapped in fragment to apply key
    return (
      <div key={`form-content-${retryCount}`} style={{ display: 'contents' }}>
        {children}
      </div>
    );
  }
}

// ==========================================
// FormStackRenderer.tsx - Integration Pattern
// ==========================================

// Import at top of file
import { FormErrorBoundary } from './FormErrorBoundary';

// In the render loop (inside map callback):
return (
  <div
    key={entry.id}
    className={`form-stack__form ${isActive ? 'form-stack__form--active' : ''}`}
    style={{ display: isActive ? 'block' : 'none' }}
    aria-hidden={!isActive}
    data-form-id={entry.id}
  >
    <FormErrorBoundary
      formId={entry.id}
      onDismiss={() => {
        // Same behavior as cancel - resolve with undefined
        entry.deferred.resolve(undefined);
        onClose();
      }}
      onError={(error, errorInfo) => {
        // Log but don't auto-close - user can retry or dismiss
        console.error(`[FormStack] Error in form ${entry.id}:`, error);
        console.error('Component stack:', errorInfo.componentStack);
      }}
    >
      {createElement(entry.component, formProps)}
    </FormErrorBoundary>
  </div>
);
```

### Integration Points

```yaml
EXPORTS:
  - add to: src/components/index.ts
  - pattern: "export { FormErrorBoundary } from './FormErrorBoundary';"
  - pattern: "export type { FormErrorBoundaryProps } from './FormErrorBoundary';"

PUBLIC_API:
  - add to: src/index.ts
  - location: After ConfirmationDialog exports (line ~88)
  - pattern: |
      /**
       * Error boundary component for form error isolation.
       * Automatically wraps forms in FormStackProvider.
       * Export for advanced customization use cases.
       */
      export { FormErrorBoundary } from './components';
      export type { FormErrorBoundaryProps } from './components';

RENDERER_INTEGRATION:
  - modify: src/components/FormStackRenderer.tsx
  - location: Lines 68-78 (createElement call)
  - import: Add "import { FormErrorBoundary } from './FormErrorBoundary';"
  - wrap: createElement with FormErrorBoundary component
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
cd /home/dustin/projects/geoform-opus

# TypeScript compilation check
npx tsc --noEmit

# ESLint check (if configured)
npx eslint src/components/FormErrorBoundary.tsx --fix

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
cd /home/dustin/projects/geoform-opus

# Run only the new error boundary tests
npx vitest run src/components/__tests__/FormErrorBoundary.test.tsx

# Run FormStackRenderer tests (includes integration tests)
npx vitest run src/components/__tests__/FormStackRenderer.test.tsx

# Run all component tests
npx vitest run src/components/__tests__/

# Expected: All tests pass. If failing, debug and fix.
```

### Level 3: Integration Testing (Full Test Suite)

```bash
cd /home/dustin/projects/geoform-opus

# Full test suite
npx vitest run

# With coverage report
npx vitest run --coverage

# Watch mode for development
npx vitest

# Expected: All tests pass, no regressions in existing functionality.
```

### Level 4: Build Validation

```bash
cd /home/dustin/projects/geoform-opus

# Build the library
npm run build

# Verify build output exists
ls -la dist/

# Expected: Build completes without errors, dist/ contains output files.
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] All tests pass: `npx vitest run`
- [ ] Build succeeds: `npm run build`
- [ ] No type errors in new or modified files

### Feature Validation

- [ ] FormErrorBoundary catches render errors from child components
- [ ] Fallback UI displays with error message
- [ ] "Try Again" button resets error state and remounts child
- [ ] "Dismiss" button resolves deferred promise with `undefined`
- [ ] Error in one form doesn't affect other forms in stack
- [ ] Parent form remains functional after child form error
- [ ] Accessibility: role="alert", focus management

### Code Quality Validation

- [ ] Follows existing BEM class naming (form-error-boundary__)
- [ ] Uses TypeScript interfaces matching existing patterns
- [ ] Tests follow existing patterns (describe/it, vi.fn, screen queries)
- [ ] JSDoc comments on exported types and components
- [ ] No new dependencies added

### Documentation & Deployment

- [ ] FormErrorBoundary exported from src/components/index.ts
- [ ] FormErrorBoundaryProps exported from src/index.ts (public API)
- [ ] JSDoc documentation on FormErrorBoundary class

---

## Anti-Patterns to Avoid

- ❌ Don't use functional component - error boundaries MUST be class components
- ❌ Don't put side effects in getDerivedStateFromError - it's called during render
- ❌ Don't catch event handler errors - they're outside error boundary scope
- ❌ Don't auto-close on error - let user choose retry vs dismiss
- ❌ Don't forget to call `entry.deferred.resolve(undefined)` on dismiss
- ❌ Don't skip the retryCount key pattern - it's needed to force remount
- ❌ Don't add external dependencies - use React's built-in error boundary API
- ❌ Don't forget accessibility attributes (role="alert", aria-live)
- ❌ Don't suppress console errors in production - they help debugging
- ❌ Don't test with console.error visible - mock it to suppress expected errors

---

## Test Cases Reference

```typescript
// Example test patterns for FormErrorBoundary.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormErrorBoundary } from '../FormErrorBoundary';

// Component that throws on render
const ErrorThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="child">Child rendered</div>;
};

// Suppress console.error for expected errors
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('FormErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    render(
      <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
        <div data-testid="child">Normal child</div>
      </FormErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should catch error and display fallback UI', () => {
    render(
      <FormErrorBoundary formId="test" onDismiss={vi.fn()}>
        <ErrorThrowingComponent />
      </FormErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    render(
      <FormErrorBoundary formId="test" onDismiss={onDismiss}>
        <ErrorThrowingComponent />
      </FormErrorBoundary>
    );
    fireEvent.click(screen.getByText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // ... more test cases per Task 2
});
```

---

## Research References

All research documents are stored in `plan/P2M3/research/`:

| Document | Purpose |
|----------|---------|
| `01-official-documentation.md` | React official error boundary API |
| `03-lifecycle-methods-implementation.md` | getDerivedStateFromError vs componentDidCatch |
| `06-typescript-patterns.md` | TypeScript interface patterns |
| `07-pitfalls-and-gotchas.md` | Common mistakes to avoid |
| `RESEARCH-SUMMARY.md` | Executive summary of all research |

---

## Confidence Assessment

**Score: 9/10**

**Why high confidence:**
- Clear integration point in FormStackRenderer (line 76)
- Well-documented React error boundary API
- Comprehensive research in plan/P2M3/research/
- Existing test patterns to follow
- Simple scope (2 files to create, 3 to modify)
- No external dependencies needed

**Potential risks:**
- Testing error boundaries requires suppressing console.error (documented)
- Class component is unusual in this codebase (but required by React)
- JSDOM dialog limitations don't apply here (we don't use <dialog>)

---

**Ready for Implementation**

This PRP provides all context needed for one-pass implementation success.
