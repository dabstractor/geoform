# Test Patterns & Conventions

## Framework Stack
- **Vitest** 2.1 (describe/it/expect/vi)
- **@testing-library/react** 16 (render, screen, fireEvent, act, waitFor)
- **@testing-library/user-event** 14
- **jsdom** 25

## File Organization
- Tests co-located in `__tests__/` subdirectory next to source
- Unit tests: `<Name>.test.tsx`
- Integration tests: `<Name>.integration.test.tsx`

## Key Patterns Used in This Codebase

### Renderer Unit Tests (FormStackRenderer.test.tsx)
- Create mock `InternalStackEntry` via `createMockEntry(id, label, deferred?)` helper
- Create mock `DeferredPromise` via `createMockDeferred<T>()` helper
- `onCancelRequest` mocked as `vi.fn().mockResolvedValue(true/false)`
- Spy on `deferred.resolve` to verify it was called with expected values
- `console.error` suppressed for error boundary tests via `beforeEach/afterEach`

### Provider Integration Tests (FormStackProvider.integration.test.tsx)
- Test consumer component uses `useFormStack()` to open forms
- `onResult` callback via `vi.fn()` captures `openForm()` resolution
- `screen.getByTestId('stack-length')` to verify stack depth
- Uses `act(async () => { fireEvent.click(...) })` for async interactions
- `waitFor(() => expect(...))` for promise resolution assertions

### Hook Tests (useFormStackViewport.test.tsx)
- `renderHook()` with wrapper component providing `<FormStackProvider>`
- `act()` to trigger state updates from hook actions
- Type-level contracts verified via compile-time assertions (assignability checks)

### Confirmation Dialog Tests
- The `ConfirmationDialog` is rendered by `FormStackProvider` always
- Tests click "Keep Editing" (cancel) / "Discard" (confirm) buttons
- Uses `screen.getByRole('button', { name: 'Keep Editing' })` etc.

## Patterns Required for New Tests

### Issue 1: Form-invoked `onError` Integration Test
```
1. Render provider with a form that has an onError-triggering button
2. openForm() without try/catch (matching PRD §12 pattern)
3. Fire onError
4. Assert: stack-length unchanged (form still mounted)
5. Assert: openForm() promise did NOT reject (track rejection)
6. Assert: error boundary fallback UI is visible (getByRole('alert'))
7. Assert: no unhandledRejection event
```
Track `openForm()` rejection:
```ts
let rejected = false;
const result = openForm(...).catch(() => { rejected = true; return undefined; });
```

### Issue 2: Concurrent Confirmation Test
```
1. Open a confirmOnCancel: true form
2. Call cancelForm() twice rapidly (two promises in flight)
3. Track both promises
4. Click "Keep Editing" once
5. Assert: BOTH promises settled (neither hangs forever)
```
Track promises:
```ts
const settled = [false, false];
const p1 = cancelForm().finally(() => { settled[0] = true; });
const p2 = cancelForm().finally(() => { settled[1] = true; });
```
Use `waitFor(() => expect(settled).toEqual([true, true]))` with a timeout.

### Issue 3: Sanitized Viewport Value Test
```
1. Open a form via useFormStackActions
2. Read useFormStackViewport() value
3. Assert: entry has ONLY { id, label } — no 'component', no 'deferred'
4. Assert: value.onClose is a function
5. Assert: no 'onCancelRequest' on the public type
```

### Issue 4: Duplicate ID Warning Test
```
1. Spy on console.warn
2. Open form with id: 'same'
3. Open another form with id: 'same'
4. Assert: console.warn called with duplicate-id message
5. Assert: no warning when IDs are unique
```

## Environment Notes
- `process.env.NODE_ENV` is 'test' in Vitest. Dev-mode guards check `=== 'development'`.
  Tests that need to exercise dev-mode behavior may need `vi.stubEnv('NODE_ENV', 'development')`.
  However, the duplicate-ID warning (Issue 4) and dev-mode RangeError checks use
  `process.env?.NODE_ENV === 'development'`, so tests must stub the env.
- `act()` is required for any state update triggered by user events or async operations.
