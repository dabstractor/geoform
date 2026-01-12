# Integration Testing Patterns Summary

## Research conducted for P4.M2 Integration Tests

### Existing Test Patterns in Codebase

#### 1. FormStackProvider.integration.test.tsx
- 4 tests covering openForm lifecycle and nested forms
- Key pattern: TestConsumer component wraps useFormStack hook
- Uses vi.fn() for result callbacks
- act() wrapping for all fireEvent operations
- waitFor() for promise resolution assertions

#### 2. Breadcrumbs.integration.test.tsx
- 3 tests covering navigation and display updates
- Opens multiple forms sequentially
- Tests breadcrumb click cancels deeper forms
- Verifies onResult called with undefined for cancelled forms

#### 3. ConfirmationDialog.integration.test.tsx
- 8 tests covering confirmation flows
- Mocks HTMLDialogElement.prototype.showModal/close for JSDOM
- Tests confirmOnCancel: true vs false behavior
- Verifies Keep Editing vs Discard button actions

#### 4. FormErrorBoundary.test.tsx
- 22 tests covering error catching and recovery
- ErrorThrowingComponent throws during render
- console.error suppression pattern
- Tests retry (state reset) and dismiss (onDismiss callback)

### Key Testing Utilities

```typescript
// vitest imports
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// React Testing Library imports
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
```

### AAA Pattern (Arrange-Act-Assert)

All tests follow this structure:
1. Arrange - Set up components, mocks, render
2. Act - Perform user interactions
3. Assert - Verify expected outcomes

### Critical Gotchas

1. **act() is required** for all state-updating operations
2. **waitFor()** for async promise resolution verification
3. **HTMLDialogElement mocks** needed for JSDOM
4. **console.error suppression** for expected error boundary errors
5. **Hidden container pattern** - use toBeInTheDocument() + toHaveStyle('display: none')

### Test Count Summary

| Category | Files | Tests |
|----------|-------|-------|
| Unit Tests (existing) | 9 | 95 |
| Component Tests (existing) | 7 | 79 |
| Integration Tests (existing) | 3 | 15 |
| Integration Tests (new P4.M2) | 5 | ~30 |
| **TOTAL** | 24 | ~220 |

## External Research Sources

- Vitest async testing: https://vitest.dev/api/vi
- React Testing Library best practices: https://testing-library.com/docs/react-testing-library/api
- Testing Library user-event: https://testing-library.com/docs/user-event/intro
- Error boundary testing: https://kentcdodds.com/blog/how-to-test-custom-react-hooks
