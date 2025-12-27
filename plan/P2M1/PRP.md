# PRP: Breadcrumb Navigation (P2.M1)

**Milestone:** P2.M1 - Breadcrumb Navigation
**Project:** React Hierarchical Form Stack System (geoform)
**Status:** Implementation-ready
**Estimated Story Points:** 3 SP
**Dependencies:** P1.M6 (Complete) - Public API Export

---

## Goal

**Feature Goal**: Implement a Breadcrumbs component that displays the form hierarchy and enables clickable navigation. When a user clicks a breadcrumb item, all forms deeper in the stack are cancelled (resolved with `undefined`) and the clicked form becomes active.

**Deliverable**:
- `src/components/Breadcrumbs.tsx` - Component displaying form hierarchy with clickable navigation
- Updated `src/types/context.ts` - Add `popToIndex` to `FormStackActions` interface
- Updated `src/components/FormStackProvider.tsx` - Implement `popToIndex` action
- Updated `src/hooks/useFormStackActions.ts` - Expose `popToIndex` via hook
- Updated `src/index.ts` - Export Breadcrumbs component
- Unit tests for Breadcrumbs component
- Integration tests for breadcrumb navigation

**Success Definition**:
1. Breadcrumbs component renders stack as clickable links with proper ARIA attributes
2. Clicking a breadcrumb cancels all deeper forms (resolves their promises with `undefined`)
3. After navigation, the clicked form becomes the active (visible) form
4. Current form is displayed as non-clickable text with `aria-current="page"`
5. Component uses `useFormStackState` for read-only stack access
6. Component uses `useFormStackActions` for navigation dispatch
7. `npm run type-check` passes with zero errors
8. `npm run test` passes all tests
9. `npm run build` succeeds

---

## User Persona

**Target User**: React developer consuming the form stack library

**Use Case**: Applications with nested forms where users need to navigate back to previous forms without losing context of where they are in the hierarchy

**User Journey**:
1. Developer wraps app with `<FormStackProvider>`
2. Developer adds `<Breadcrumbs />` to their layout (typically in a header or toolbar)
3. User opens multiple nested forms (e.g., Organization -> Team -> User)
4. Breadcrumbs display: `Organization / Team / User`
5. User clicks "Organization" breadcrumb
6. "Team" and "User" forms are cancelled (promises resolve with `undefined`)
7. "Organization" form becomes visible with its state preserved
8. Parent forms that had awaited child results receive `undefined` and can handle accordingly

**Pain Points Addressed**:
- Users getting lost in deeply nested forms
- No visual indication of form hierarchy depth
- Tedious back-button clicking to return to earlier forms
- Needing to cancel multiple forms one-by-one

---

## Why

- **PRD Requirement**: "Breadcrumbs show nesting depth" (PRD Section 3.4)
- **PRD Behavior**: "Clicking a breadcrumb pops all deeper forms. All popped forms are canceled (no values returned)" (PRD Section 7)
- **UX Improvement**: Users can see where they are in the form hierarchy at a glance
- **Navigation Efficiency**: One-click return to any ancestor form
- **Accessibility**: Standard breadcrumb pattern with proper ARIA attributes
- **Foundation for P2.M2**: Cancellation confirmation will hook into breadcrumb navigation

---

## What

### Success Criteria

- [ ] Breadcrumbs renders ordered list with proper `<nav aria-label>` wrapper
- [ ] Each stack entry is rendered as a list item
- [ ] Non-current items are clickable links
- [ ] Current item (last) has `aria-current="page"` and is non-clickable
- [ ] Separators are decorative (CSS-based or `aria-hidden="true"`)
- [ ] `popToIndex` method added to `FormStackActions` interface
- [ ] `popToIndex` cancels all forms from index+1 to end (resolves with `undefined`)
- [ ] `popToIndex` dispatches `POP_TO_INDEX` reducer action
- [ ] Clicking breadcrumb at index N calls `popToIndex(N)`
- [ ] Empty stack renders nothing (or can render optional "Home" prop)
- [ ] Single-item stack renders just the current item (no links)
- [ ] Component is exported from main `src/index.ts` barrel
- [ ] Tests verify navigation cancels deeper forms
- [ ] Tests verify promise resolution with undefined
- [ ] Tests verify accessibility attributes
- [ ] `npm run type-check` passes
- [ ] `npm run test` passes
- [ ] `npm run build` generates declarations

---

## All Needed Context

### Context Completeness Check

_This PRP provides everything needed for an implementer with no prior codebase knowledge. The `POP_TO_INDEX` reducer action already exists and is tested - we need to expose it via the public API and build the Breadcrumbs UI component._

### Documentation & References

```yaml
# MUST READ - Existing type definitions
- file: src/types/context.ts
  why: Contains FormStackActions interface to extend with popToIndex
  pattern: Add popToIndex method following openForm/closeForm pattern
  critical: |
    FormStackAction already has 'POP_TO_INDEX' type
    FormStackActions needs popToIndex: (index: number) => void

- file: src/types/stack.ts
  why: Contains StackEntry interface used by Breadcrumbs
  pattern: StackEntry has id and optional label - use label for display, fallback to id
  gotcha: label is optional, always provide fallback

- file: src/context/formStackReducer.ts
  why: POP_TO_INDEX action already implemented - verify behavior
  pattern: slice(0, index + 1) keeps entries UP TO AND INCLUDING index
  critical: |
    Line 37-43: POP_TO_INDEX keeps entries 0 through index (inclusive)
    Boundary checks: returns unchanged state if index invalid

- file: src/context/__tests__/formStackReducer.test.ts
  why: Shows POP_TO_INDEX is already tested
  pattern: Test edge cases - negative index, out of bounds, middle index
  critical: See lines 114-191 for existing POP_TO_INDEX test coverage

- file: src/components/FormStackProvider.tsx
  why: Provider needs popToIndex implementation
  pattern: Follow openForm/closeForm pattern with useCallback
  critical: |
    Must resolve promises for ALL cancelled forms before dispatching
    Access internal stack (state.stack) to resolve deferred promises
    Order: resolve promises THEN dispatch POP_TO_INDEX

- file: src/hooks/useFormStackActions.ts
  why: Hook already returns FormStackActions - will automatically include popToIndex
  pattern: No changes needed if FormStackActions interface is updated
  gotcha: Hook type-checks against FormStackActions interface

# MUST READ - Research documentation
- docfile: plan/P2M1/research/breadcrumb-accessibility-patterns.md
  why: Complete accessibility and implementation patterns
  section: "WCAG/WAI-ARIA Standards" and "State-Driven Breadcrumb Pattern"
  critical: |
    Use <nav aria-label="Breadcrumb"> wrapper
    Use <ol role="list"> for Safari/VoiceOver
    Use aria-current="page" on current item
    Separators must be aria-hidden or CSS-only

# Testing patterns
- file: src/components/__tests__/FormStackRenderer.test.tsx
  why: Shows component testing patterns with mocks
  pattern: createMockEntry helper, createMockDeferred helper
  gotcha: Use vi.spyOn to verify promise resolution

- file: src/components/__tests__/FormStackProvider.integration.test.tsx
  why: Shows integration testing with FormStackProvider
  pattern: Nested component testing, act() for async updates
  critical: Use waitFor for async assertions
```

### Current Codebase Tree

```bash
geoform-opus/
├── src/
│   ├── index.ts                    # Main barrel export
│   ├── types/
│   │   ├── index.ts
│   │   ├── form.ts                 # FormProps<T>, DeferredPromise<T>
│   │   ├── stack.ts                # StackEntry, OpenFormOptions, InternalStackEntry
│   │   ├── context.ts              # FormStackState, FormStackActions (MODIFY)
│   │   └── __tests__/types.test.ts
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useFormStack.ts
│   │   ├── useFormStackState.ts
│   │   ├── useFormStackActions.ts  # Returns FormStackActions (auto-includes popToIndex)
│   │   └── __tests__/ (3 test files)
│   ├── components/
│   │   ├── index.ts                # Barrel exports (MODIFY to add Breadcrumbs)
│   │   ├── FormStackProvider.tsx   # Provider implementation (MODIFY)
│   │   ├── FormStackRenderer.tsx
│   │   └── __tests__/ (2 test files)
│   ├── context/
│   │   ├── index.ts
│   │   ├── formStackReducer.ts     # POP_TO_INDEX already implemented
│   │   ├── FormStackContext.ts
│   │   └── __tests__/formStackReducer.test.ts
│   ├── utils/
│   │   ├── index.ts
│   │   ├── createDeferredPromise.ts
│   │   └── __tests__/createDeferredPromise.test.ts
│   └── __tests__/setup.test.tsx
├── plan/
│   └── P2M1/
│       ├── PRP.md                  # This file
│       └── research/
│           └── breadcrumb-accessibility-patterns.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── PRD.md
```

### Desired Codebase Tree After Implementation

```bash
geoform-opus/
├── src/
│   ├── index.ts                              # MODIFY: Export Breadcrumbs
│   ├── types/
│   │   ├── context.ts                        # MODIFY: Add popToIndex to FormStackActions
│   │   └── ...
│   ├── hooks/
│   │   ├── useFormStackActions.ts            # Auto-updated via FormStackActions interface
│   │   └── ...
│   ├── components/
│   │   ├── index.ts                          # MODIFY: Export Breadcrumbs
│   │   ├── FormStackProvider.tsx             # MODIFY: Implement popToIndex
│   │   ├── Breadcrumbs.tsx                   # NEW: Breadcrumbs component
│   │   └── __tests__/
│   │       ├── Breadcrumbs.test.tsx          # NEW: Unit tests
│   │       └── Breadcrumbs.integration.test.tsx  # NEW: Integration tests
│   └── ...
└── ...
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Resolve ALL cancelled form promises BEFORE dispatching POP_TO_INDEX
// Forms from index+1 to end need their deferred.resolve(undefined) called
const popToIndex = useCallback((index: number) => {
  // Cancel all forms after the target index
  for (let i = state.stack.length - 1; i > index; i--) {
    const entry = state.stack[i];
    if (entry) {
      entry.deferred.resolve(undefined);  // Cancel = resolve with undefined
    }
  }
  // Then dispatch the action
  dispatch({ type: 'POP_TO_INDEX', index });
}, [state.stack]);

// CRITICAL: Prevent click on current breadcrumb
// The current form (last in stack) should not be clickable
const handleClick = (index: number, e: React.MouseEvent) => {
  e.preventDefault();
  if (index === stack.length - 1) return;  // Don't navigate to current
  popToIndex(index);
};

// CRITICAL: Safari/VoiceOver requires role="list" on <ol>
// Without this, VoiceOver may not announce the list
<ol role="list" className="breadcrumbs__list">

// CRITICAL: Use aria-current="page" for screen readers
// This tells assistive tech which breadcrumb represents current location
{isCurrent && <span aria-current="page">{label}</span>}

// CRITICAL: Separators must be decorative
// Option 1: CSS ::before pseudo-element (preferred)
// Option 2: <span aria-hidden="true">/</span>

// GOTCHA: Label fallback to id
// StackEntry.label is optional, always provide fallback
const displayText = entry.label ?? entry.id;

// GOTCHA: Empty stack should render null
// No breadcrumbs to show when stack is empty
if (stack.length === 0) return null;

// GOTCHA: Single form - still render but no navigation
// Show as current item only, no link needed
if (stack.length === 1) {
  // Render just current item with aria-current="page"
}
```

---

## Implementation Blueprint

### Data Models and Structure

No new types needed. This milestone extends existing types:

```typescript
// src/types/context.ts - ADD to FormStackActions interface
interface FormStackActions {
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  closeForm: () => void;
  /** Navigate to a specific form in the stack, cancelling all deeper forms */
  popToIndex: (index: number) => void;  // NEW
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: MODIFY src/types/context.ts
  - IMPLEMENT: Add popToIndex method to FormStackActions interface
  - FOLLOW pattern: Existing openForm/closeForm signatures
  - NAMING: popToIndex (matches reducer action)
  - PLACEMENT: After closeForm in interface
  - CONTENT:
    ```typescript
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
      /**
       * Navigates to a specific form in the stack by index.
       * All forms after the target index are cancelled (resolved with undefined).
       * Used by Breadcrumbs component for direct navigation.
       * @param index - Zero-based index of the target form
       */
      popToIndex: (index: number) => void;
    }
    ```
  - VALIDATION: npm run type-check (will fail until Task 2 complete)

Task 2: MODIFY src/components/FormStackProvider.tsx
  - IMPLEMENT: popToIndex callback that cancels deeper forms and dispatches action
  - FOLLOW pattern: Existing openForm/closeForm implementations
  - NAMING: popToIndex matches interface
  - PLACEMENT: After closeForm definition
  - DEPENDENCIES: Task 1 (interface update)
  - CHANGES:
    1. Add popToIndex useCallback implementation
    2. Add popToIndex to actionsValue memo
  - CONTENT (add after closeForm):
    ```typescript
    // Navigate to specific form, cancelling all deeper forms
    const popToIndex = useCallback((index: number) => {
      // Validate index bounds
      if (index < 0 || index >= state.stack.length) {
        return;
      }

      // Cancel all forms after the target index (resolve with undefined)
      // Iterate in reverse to maintain correct order
      for (let i = state.stack.length - 1; i > index; i--) {
        const entry = state.stack[i];
        if (entry) {
          entry.deferred.resolve(undefined);
        }
      }

      // Dispatch the action to update stack
      dispatch({ type: 'POP_TO_INDEX', index });
    }, [state.stack]);

    // Update actionsValue to include popToIndex
    const actionsValue = useMemo<FormStackActions>(() => ({
      openForm,
      closeForm,
      popToIndex,
    }), [openForm, closeForm, popToIndex]);
    ```
  - VALIDATION: npm run type-check passes

Task 3: CREATE src/components/Breadcrumbs.tsx
  - IMPLEMENT: Accessible breadcrumbs component using form stack
  - FOLLOW pattern: WCAG/WAI-ARIA breadcrumb standards
  - NAMING: Breadcrumbs (PascalCase component)
  - PLACEMENT: src/components/Breadcrumbs.tsx
  - DEPENDENCIES: Task 1-2 (popToIndex available)
  - CONTENT:
    ```typescript
    import type { ReactElement, ReactNode, MouseEvent } from 'react';
    import { useFormStackState } from '../hooks/useFormStackState';
    import { useFormStackActions } from '../hooks/useFormStackActions';

    /**
     * Props for Breadcrumbs component.
     */
    export interface BreadcrumbsProps {
      /** Custom separator between breadcrumb items (default: "/") */
      separator?: ReactNode;
      /** CSS class name for the nav element */
      className?: string;
      /** aria-label for the navigation element (default: "Form navigation") */
      ariaLabel?: string;
    }

    /**
     * Displays the form stack as navigable breadcrumbs.
     * Clicking a breadcrumb navigates to that form, cancelling all deeper forms.
     *
     * @example
     * ```tsx
     * // Basic usage
     * <Breadcrumbs />
     *
     * // Custom separator
     * <Breadcrumbs separator="›" />
     *
     * // With custom styling
     * <Breadcrumbs className="my-breadcrumbs" />
     * ```
     */
    export function Breadcrumbs({
      separator = '/',
      className = '',
      ariaLabel = 'Form navigation',
    }: BreadcrumbsProps): ReactElement | null {
      const { stack } = useFormStackState();
      const { popToIndex } = useFormStackActions();

      // Nothing to render if stack is empty
      if (stack.length === 0) {
        return null;
      }

      const handleClick = (index: number, event: MouseEvent) => {
        event.preventDefault();
        // Don't navigate if clicking current form
        if (index === stack.length - 1) {
          return;
        }
        popToIndex(index);
      };

      return (
        <nav
          aria-label={ariaLabel}
          className={`breadcrumbs ${className}`.trim()}
        >
          <ol role="list" className="breadcrumbs__list">
            {stack.map((entry, index) => {
              const isCurrent = index === stack.length - 1;
              const displayText = entry.label ?? entry.id;

              return (
                <li key={entry.id} className="breadcrumbs__item">
                  {isCurrent ? (
                    <span
                      className="breadcrumbs__current"
                      aria-current="page"
                    >
                      {displayText}
                    </span>
                  ) : (
                    <>
                      <a
                        href="#"
                        className="breadcrumbs__link"
                        onClick={(e) => handleClick(index, e)}
                      >
                        {displayText}
                      </a>
                      {separator && (
                        <span
                          className="breadcrumbs__separator"
                          aria-hidden="true"
                        >
                          {separator}
                        </span>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      );
    }
    ```
  - VALIDATION: npm run type-check passes

Task 4: MODIFY src/components/index.ts
  - IMPLEMENT: Export Breadcrumbs from barrel
  - NAMING: Standard barrel export pattern
  - PLACEMENT: After existing exports
  - CONTENT:
    ```typescript
    export { FormStackProvider } from './FormStackProvider';
    export type { FormStackProviderProps } from './FormStackProvider';

    export { FormStackRenderer } from './FormStackRenderer';
    export type { FormStackRendererProps } from './FormStackRenderer';

    export { Breadcrumbs } from './Breadcrumbs';
    export type { BreadcrumbsProps } from './Breadcrumbs';
    ```
  - VALIDATION: Imports work from 'src/components'

Task 5: MODIFY src/index.ts
  - IMPLEMENT: Export Breadcrumbs from main barrel
  - PLACEMENT: In components section
  - CONTENT (add to existing exports):
    ```typescript
    // Add to components exports section
    export { Breadcrumbs } from './components/Breadcrumbs';
    export type { BreadcrumbsProps } from './components/Breadcrumbs';
    ```
  - VALIDATION: npm run build passes

Task 6: CREATE src/components/__tests__/Breadcrumbs.test.tsx
  - IMPLEMENT: Unit tests for Breadcrumbs component
  - FOLLOW pattern: AAA, describe blocks, Testing Library patterns
  - NAMING: Breadcrumbs.test.tsx
  - PLACEMENT: src/components/__tests__/
  - CONTENT:
    ```typescript
    import { describe, it, expect, vi, beforeEach } from 'vitest';
    import { render, screen, fireEvent } from '@testing-library/react';
    import { Breadcrumbs } from '../Breadcrumbs';
    import * as useFormStackStateHook from '../../hooks/useFormStackState';
    import * as useFormStackActionsHook from '../../hooks/useFormStackActions';
    import type { FormStackState, FormStackActions } from '../../types';

    // Mock the hooks
    vi.mock('../../hooks/useFormStackState');
    vi.mock('../../hooks/useFormStackActions');

    describe('Breadcrumbs', () => {
      const mockPopToIndex = vi.fn();
      const mockOpenForm = vi.fn();
      const mockCloseForm = vi.fn();

      const mockActions: FormStackActions = {
        openForm: mockOpenForm,
        closeForm: mockCloseForm,
        popToIndex: mockPopToIndex,
      };

      beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useFormStackActionsHook.useFormStackActions).mockReturnValue(mockActions);
      });

      describe('when stack is empty', () => {
        it('should render nothing', () => {
          // Arrange
          const mockState: FormStackState = { stack: [] };
          vi.mocked(useFormStackStateHook.useFormStackState).mockReturnValue(mockState);

          // Act
          const { container } = render(<Breadcrumbs />);

          // Assert
          expect(container.firstChild).toBeNull();
        });
      });

      describe('when stack has one form', () => {
        it('should render single item as current', () => {
          // Arrange
          const mockState: FormStackState = {
            stack: [{ id: 'form-1', label: 'Form 1' }],
          };
          vi.mocked(useFormStackStateHook.useFormStackState).mockReturnValue(mockState);

          // Act
          render(<Breadcrumbs />);

          // Assert
          expect(screen.getByText('Form 1')).toBeInTheDocument();
          expect(screen.getByText('Form 1')).toHaveAttribute('aria-current', 'page');
          expect(screen.queryByRole('link')).not.toBeInTheDocument();
        });

        it('should fall back to id when label is missing', () => {
          // Arrange
          const mockState: FormStackState = {
            stack: [{ id: 'form-1' }],
          };
          vi.mocked(useFormStackStateHook.useFormStackState).mockReturnValue(mockState);

          // Act
          render(<Breadcrumbs />);

          // Assert
          expect(screen.getByText('form-1')).toBeInTheDocument();
        });
      });

      describe('when stack has multiple forms', () => {
        const mockState: FormStackState = {
          stack: [
            { id: 'form-1', label: 'Form 1' },
            { id: 'form-2', label: 'Form 2' },
            { id: 'form-3', label: 'Form 3' },
          ],
        };

        beforeEach(() => {
          vi.mocked(useFormStackStateHook.useFormStackState).mockReturnValue(mockState);
        });

        it('should render all items', () => {
          render(<Breadcrumbs />);

          expect(screen.getByText('Form 1')).toBeInTheDocument();
          expect(screen.getByText('Form 2')).toBeInTheDocument();
          expect(screen.getByText('Form 3')).toBeInTheDocument();
        });

        it('should render non-current items as links', () => {
          render(<Breadcrumbs />);

          const links = screen.getAllByRole('link');
          expect(links).toHaveLength(2);
          expect(links[0]).toHaveTextContent('Form 1');
          expect(links[1]).toHaveTextContent('Form 2');
        });

        it('should render current item with aria-current', () => {
          render(<Breadcrumbs />);

          const current = screen.getByText('Form 3');
          expect(current).toHaveAttribute('aria-current', 'page');
        });

        it('should call popToIndex when clicking non-current breadcrumb', () => {
          render(<Breadcrumbs />);

          fireEvent.click(screen.getByText('Form 1'));

          expect(mockPopToIndex).toHaveBeenCalledWith(0);
        });

        it('should call popToIndex with correct index for middle breadcrumb', () => {
          render(<Breadcrumbs />);

          fireEvent.click(screen.getByText('Form 2'));

          expect(mockPopToIndex).toHaveBeenCalledWith(1);
        });

        it('should not call popToIndex when clicking current breadcrumb', () => {
          render(<Breadcrumbs />);

          // Current is not a link, but if we could click it somehow
          const current = screen.getByText('Form 3');
          fireEvent.click(current);

          expect(mockPopToIndex).not.toHaveBeenCalled();
        });
      });

      describe('accessibility', () => {
        beforeEach(() => {
          vi.mocked(useFormStackStateHook.useFormStackState).mockReturnValue({
            stack: [
              { id: 'form-1', label: 'Form 1' },
              { id: 'form-2', label: 'Form 2' },
            ],
          });
        });

        it('should have nav with aria-label', () => {
          render(<Breadcrumbs />);

          const nav = screen.getByRole('navigation');
          expect(nav).toHaveAttribute('aria-label', 'Form navigation');
        });

        it('should allow custom aria-label', () => {
          render(<Breadcrumbs ariaLabel="Breadcrumb navigation" />);

          const nav = screen.getByRole('navigation');
          expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation');
        });

        it('should use ordered list with role="list"', () => {
          render(<Breadcrumbs />);

          const list = screen.getByRole('list');
          expect(list.tagName).toBe('OL');
        });

        it('should hide separators from screen readers', () => {
          render(<Breadcrumbs separator="/" />);

          const separators = document.querySelectorAll('[aria-hidden="true"]');
          expect(separators.length).toBeGreaterThan(0);
        });
      });

      describe('customization', () => {
        beforeEach(() => {
          vi.mocked(useFormStackStateHook.useFormStackState).mockReturnValue({
            stack: [
              { id: 'form-1', label: 'Form 1' },
              { id: 'form-2', label: 'Form 2' },
            ],
          });
        });

        it('should use default separator "/"', () => {
          render(<Breadcrumbs />);

          expect(screen.getByText('/')).toBeInTheDocument();
        });

        it('should allow custom separator', () => {
          render(<Breadcrumbs separator="›" />);

          expect(screen.getByText('›')).toBeInTheDocument();
        });

        it('should apply custom className', () => {
          render(<Breadcrumbs className="my-breadcrumbs" />);

          const nav = screen.getByRole('navigation');
          expect(nav).toHaveClass('breadcrumbs', 'my-breadcrumbs');
        });
      });
    });
    ```
  - VALIDATION: npm run test passes

Task 7: CREATE src/components/__tests__/Breadcrumbs.integration.test.tsx
  - IMPLEMENT: Integration tests for breadcrumb navigation flow
  - FOLLOW pattern: FormStackProvider.integration.test.tsx patterns
  - NAMING: Breadcrumbs.integration.test.tsx
  - PLACEMENT: src/components/__tests__/
  - CONTENT:
    ```typescript
    import { describe, it, expect, vi } from 'vitest';
    import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
    import { FormStackProvider } from '../FormStackProvider';
    import { Breadcrumbs } from '../Breadcrumbs';
    import { useFormStack } from '../../hooks';
    import type { FormProps } from '../../types';

    // Simple test form component
    function TestForm({ onSubmit, onCancel }: FormProps<string>) {
      return (
        <div data-testid="test-form">
          <button data-testid="submit-btn" onClick={() => onSubmit('submitted')}>
            Submit
          </button>
          <button data-testid="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      );
    }

    // Test consumer that opens nested forms
    function TestConsumer({ onResults }: { onResults: (results: (string | undefined)[]) => void }) {
      const { openForm, stack } = useFormStack();
      const results: (string | undefined)[] = [];

      const openLevel = async (level: number) => {
        const result = await openForm({
          id: `form-${level}`,
          label: `Form ${level}`,
          component: TestForm,
        });
        results.push(result);
        onResults([...results]);
      };

      return (
        <div>
          <span data-testid="stack-length">{stack.length}</span>
          <button data-testid="open-level-1" onClick={() => openLevel(1)}>
            Open Level 1
          </button>
          <button data-testid="open-level-2" onClick={() => openLevel(2)}>
            Open Level 2
          </button>
          <button data-testid="open-level-3" onClick={() => openLevel(3)}>
            Open Level 3
          </button>
        </div>
      );
    }

    describe('Breadcrumbs Integration', () => {
      describe('navigation behavior', () => {
        it('should cancel deeper forms when navigating to earlier form', async () => {
          // Arrange
          const onResults = vi.fn();

          render(
            <FormStackProvider>
              <Breadcrumbs />
              <TestConsumer onResults={onResults} />
            </FormStackProvider>
          );

          // Open 3 nested forms
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-1'));
          });
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-2'));
          });
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-3'));
          });

          // Verify 3 forms in stack
          expect(screen.getByTestId('stack-length')).toHaveTextContent('3');

          // Click on Form 1 breadcrumb (index 0)
          await act(async () => {
            fireEvent.click(screen.getByText('Form 1'));
          });

          // Verify stack reduced to 1
          expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

          // Verify results received undefined for cancelled forms
          await waitFor(() => {
            expect(onResults).toHaveBeenLastCalledWith([undefined, undefined]);
          });
        });

        it('should navigate to middle form correctly', async () => {
          const onResults = vi.fn();

          render(
            <FormStackProvider>
              <Breadcrumbs />
              <TestConsumer onResults={onResults} />
            </FormStackProvider>
          );

          // Open 3 nested forms
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-1'));
          });
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-2'));
          });
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-3'));
          });

          // Click on Form 2 breadcrumb (index 1)
          await act(async () => {
            fireEvent.click(screen.getByText('Form 2'));
          });

          // Verify stack reduced to 2
          expect(screen.getByTestId('stack-length')).toHaveTextContent('2');

          // Form 3 was cancelled
          await waitFor(() => {
            expect(onResults).toHaveBeenLastCalledWith([undefined]);
          });
        });
      });

      describe('breadcrumb display', () => {
        it('should update breadcrumbs as stack changes', async () => {
          render(
            <FormStackProvider>
              <Breadcrumbs />
              <TestConsumer onResults={() => {}} />
            </FormStackProvider>
          );

          // Initially no breadcrumbs
          expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

          // Open first form
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-1'));
          });

          // Now breadcrumbs visible
          expect(screen.getByRole('navigation')).toBeInTheDocument();
          expect(screen.getByText('Form 1')).toHaveAttribute('aria-current', 'page');

          // Open second form
          await act(async () => {
            fireEvent.click(screen.getByTestId('open-level-2'));
          });

          // Form 1 is now a link, Form 2 is current
          expect(screen.getByRole('link', { name: 'Form 1' })).toBeInTheDocument();
          expect(screen.getByText('Form 2')).toHaveAttribute('aria-current', 'page');
        });
      });
    });
    ```
  - VALIDATION: npm run test passes
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: popToIndex must cancel forms before dispatching
// This ensures promises resolve correctly
const popToIndex = useCallback((index: number) => {
  // Validate
  if (index < 0 || index >= state.stack.length) return;

  // Cancel forms (reverse order for correctness)
  for (let i = state.stack.length - 1; i > index; i--) {
    state.stack[i]?.deferred.resolve(undefined);
  }

  // Then dispatch
  dispatch({ type: 'POP_TO_INDEX', index });
}, [state.stack]);

// PATTERN: Breadcrumbs consumes both contexts
// State for reading stack, Actions for popToIndex
const { stack } = useFormStackState();
const { popToIndex } = useFormStackActions();

// PATTERN: Accessible breadcrumb structure
<nav aria-label="Form navigation">
  <ol role="list">
    <li>
      <a href="#">Link Text</a>
      <span aria-hidden="true">/</span>
    </li>
    <li>
      <span aria-current="page">Current</span>
    </li>
  </ol>
</nav>

// PATTERN: Prevent default on anchor clicks
// Since we're not actually navigating, prevent default behavior
const handleClick = (index: number, e: MouseEvent) => {
  e.preventDefault();
  if (index === stack.length - 1) return;
  popToIndex(index);
};

// PATTERN: Label fallback to id
// Always provide displayable text
const displayText = entry.label ?? entry.id;
```

### Integration Points

```yaml
TYPES:
  - Modify: src/types/context.ts
  - Add: popToIndex to FormStackActions interface
  - Pattern: Matches existing method signatures

HOOKS:
  - No changes needed to hook files
  - useFormStackActions automatically returns updated FormStackActions
  - TypeScript will enforce popToIndex is implemented

PROVIDER:
  - Modify: src/components/FormStackProvider.tsx
  - Add: popToIndex useCallback
  - Add: popToIndex to actionsValue memo
  - Access: state.stack for deferred promise resolution

BARREL_EXPORTS:
  - Modify: src/components/index.ts (add Breadcrumbs export)
  - Modify: src/index.ts (add Breadcrumbs export)

BUILD:
  - npm run build generates updated declarations
  - Breadcrumbs and BreadcrumbsProps exported
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After modifying types and provider, verify compilation
npm run type-check

# Expected: Zero errors
# If errors: Check popToIndex signature matches interface

# After creating Breadcrumbs, verify compilation again
npm run type-check

# Expected: Zero errors
# If errors: Check import paths, verify hooks usage
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run Breadcrumbs unit tests
npm run test -- src/components/__tests__/Breadcrumbs.test.tsx

# Expected output:
# ✓ Breadcrumbs > when stack is empty > should render nothing
# ✓ Breadcrumbs > when stack has one form > should render single item as current
# ✓ Breadcrumbs > when stack has one form > should fall back to id when label is missing
# ✓ Breadcrumbs > when stack has multiple forms > should render all items
# ✓ Breadcrumbs > when stack has multiple forms > should render non-current items as links
# ✓ Breadcrumbs > when stack has multiple forms > should render current item with aria-current
# ✓ Breadcrumbs > when stack has multiple forms > should call popToIndex when clicking non-current
# ✓ Breadcrumbs > when stack has multiple forms > should call popToIndex with correct index
# ✓ Breadcrumbs > when stack has multiple forms > should not call popToIndex when clicking current
# ✓ Breadcrumbs > accessibility > should have nav with aria-label
# ✓ Breadcrumbs > accessibility > should allow custom aria-label
# ✓ Breadcrumbs > accessibility > should use ordered list with role="list"
# ✓ Breadcrumbs > accessibility > should hide separators from screen readers
# ✓ Breadcrumbs > customization > should use default separator "/"
# ✓ Breadcrumbs > customization > should allow custom separator
# ✓ Breadcrumbs > customization > should apply custom className
```

### Level 3: Integration Testing (System Validation)

```bash
# Run integration tests
npm run test -- src/components/__tests__/Breadcrumbs.integration.test.tsx

# Expected output:
# ✓ Breadcrumbs Integration > navigation behavior > should cancel deeper forms when navigating to earlier form
# ✓ Breadcrumbs Integration > navigation behavior > should navigate to middle form correctly
# ✓ Breadcrumbs Integration > breadcrumb display > should update breadcrumbs as stack changes

# Run all tests
npm run test

# Expected: All tests pass

# Build verification
npm run build

# Verify exports
grep -l "Breadcrumbs" dist/index.d.ts
# Expected: Found in declaration file
```

### Level 4: Manual Verification

```bash
# Create a test usage file (for mental verification)
cat << 'EOF'
// Example usage of Breadcrumbs
import { FormStackProvider, Breadcrumbs, useFormStack } from 'geoform';
import type { FormProps } from 'geoform';

function MyForm({ onSubmit, onCancel }: FormProps<{ name: string }>) {
  const { openForm } = useFormStack();

  const handleOpenChild = async () => {
    const result = await openForm({
      id: 'child-form',
      component: ChildForm,
      label: 'Child Form',
    });
    // result is undefined if user navigated away via breadcrumb
    if (!result) {
      console.log('User cancelled or navigated away');
    }
  };

  return (
    <div>
      <button onClick={handleOpenChild}>Open Child</button>
      <button onClick={() => onSubmit({ name: 'Test' })}>Submit</button>
    </div>
  );
}

function App() {
  return (
    <FormStackProvider>
      <header>
        <Breadcrumbs separator=" › " />
      </header>
      <main>
        <MyMainContent />
      </main>
    </FormStackProvider>
  );
}
EOF

echo "Manual verification: Review the example usage pattern"
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run test` passes all tests (existing + new)
- [ ] `npm run build` generates dist/index.d.ts with Breadcrumbs export
- [ ] `popToIndex` added to FormStackActions interface
- [ ] FormStackProvider implements popToIndex correctly
- [ ] Breadcrumbs component created and exported

### Feature Validation

- [ ] Breadcrumbs renders stack entries with proper labels
- [ ] Non-current items are clickable links
- [ ] Current item has `aria-current="page"` and is not clickable
- [ ] Clicking breadcrumb calls popToIndex with correct index
- [ ] popToIndex cancels deeper forms (resolves with undefined)
- [ ] popToIndex dispatches POP_TO_INDEX action
- [ ] Empty stack renders null
- [ ] Single-item stack renders only current item
- [ ] Custom separator works
- [ ] Custom className applied
- [ ] Custom ariaLabel applied

### Accessibility Validation

- [ ] `<nav aria-label="...">` wrapper present
- [ ] `<ol role="list">` for Safari/VoiceOver
- [ ] Separators have `aria-hidden="true"`
- [ ] Current item has `aria-current="page"`
- [ ] Links are keyboard accessible (default behavior)
- [ ] No custom keyboard handlers needed

### Code Quality Validation

- [ ] Uses `import type` for type-only imports
- [ ] JSDoc comments on Breadcrumbs component
- [ ] JSDoc comments on BreadcrumbsProps interface
- [ ] JSDoc comments on popToIndex method in interface
- [ ] Follows existing naming conventions
- [ ] Uses hooks correctly (useFormStackState, useFormStackActions)
- [ ] No direct context consumption (uses hooks)

### Documentation & Deployment

- [ ] Exported from src/components/index.ts
- [ ] Exported from src/index.ts
- [ ] Type declarations generated in build

---

## Anti-Patterns to Avoid

- **DON'T** dispatch POP_TO_INDEX before resolving promises - forms must receive undefined
- **DON'T** make current breadcrumb clickable - it should be non-interactive
- **DON'T** use `<ul>` instead of `<ol>` - breadcrumbs are ordered
- **DON'T** forget `role="list"` on `<ol>` - required for Safari/VoiceOver
- **DON'T** make separators accessible - use `aria-hidden="true"` or CSS
- **DON'T** forget label fallback to id - label is optional
- **DON'T** consume context directly - use provided hooks
- **DON'T** forget to prevent default on anchor clicks
- **DON'T** call popToIndex for current (last) breadcrumb

---

## Confidence Score

**9/10** - Very high confidence for one-pass implementation success

**Rationale:**
- POP_TO_INDEX reducer action already exists and is tested (lines 114-191 of reducer tests)
- Type system is well-established from P1 milestones
- Hook pattern is simple extension of existing FormStackActions
- Breadcrumb accessibility patterns are well-documented
- Component testing patterns established in prior milestones
- Clear separation of concerns (state read vs action dispatch)

**Risk Mitigation:**
- If type-check fails: Verify popToIndex signature in interface
- If tests fail: Check mock setup for hooks
- If navigation fails: Verify promise resolution happens BEFORE dispatch
- If accessibility fails: Double-check aria attributes and role="list"

---

## Quick Start for Implementation

```bash
# 1. Update types (Task 1)
# Modify src/types/context.ts - add popToIndex to FormStackActions

# 2. Update provider (Task 2)
# Modify src/components/FormStackProvider.tsx - implement popToIndex

# 3. Verify compilation
npm run type-check

# 4. Create Breadcrumbs component (Task 3)
touch src/components/Breadcrumbs.tsx
# Copy content from Task 3

# 5. Update barrel exports (Tasks 4-5)
# Modify src/components/index.ts
# Modify src/index.ts

# 6. Create test files (Tasks 6-7)
touch src/components/__tests__/Breadcrumbs.test.tsx
touch src/components/__tests__/Breadcrumbs.integration.test.tsx
# Copy content from Tasks 6-7

# 7. Validate
npm run type-check && npm run test && npm run build

# Expected: All commands pass
```

---

## Research References

The following research is available in `plan/P2M1/research/`:

1. **breadcrumb-accessibility-patterns.md** - Complete WCAG/WAI-ARIA guide
   - ARIA structure requirements
   - Separator handling patterns
   - CSS patterns (BEM naming)
   - TypeScript interface examples

Key external documentation:
- [W3C WAI Breadcrumb Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/)
- [W3C Breadcrumb Example](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/examples/breadcrumb/)
- [MDN aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current)
- [Material UI Breadcrumbs](https://mui.com/material-ui/react-breadcrumbs/)
