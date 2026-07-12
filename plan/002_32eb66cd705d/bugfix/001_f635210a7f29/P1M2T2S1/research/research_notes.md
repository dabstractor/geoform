# Research — P1.M2.T2.S1: Dev-mode duplicate-ID warning in FormStackProvider.openForm (Issue 4)

Source: direct file reads of the target source + existing dev-warning tests + the
authoritative issue_analysis.md §Issue 4 + test_patterns.md. No external research
needed (React duplicate-key behavior is well-established and already documented in
the issue analysis).

## 1. Authoritative fix strategy (issue_analysis.md §Issue 4)

- Add a `console.warn` at the START of `openForm` (before `dispatch PUSH_FORM`) when
  `options.id` already exists on `state.stack`.
- Change `openForm`'s `useCallback` deps from `[]` → `[state.stack]`.
- Reference-stability change is ACCEPTED: openForm is called imperatively (onClick),
  not used as a useEffect dep. AND it's consistent with `cancelForm`/`popToIndex`,
  which ALREADY depend on `[state.stack]` — so `actionsValue` already recomputes on
  stack change. Adding openForm to that set introduces NO NEW re-render regression.

## 2. The exact dev-mode guard idiom used in THIS file (FormStackProvider.tsx)

Three existing guards, all in the same component:
- `closeForm`:  `if (typeof process !== "undefined" && process.env?.NODE_ENV === 'development')`
- `popToIndex`: `if (typeof process !== "undefined" && process.env?.NODE_ENV === "development")`
- viewport useEffect: `if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'development')`

Quoting is inconsistent across the file. The CONTRACT (item description LOGIC) specifies
single quotes: `if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')`.
Use the contract's exact form.

## 3. The console.warn MESSAGE (verbatim from the contract)

```ts
console.warn(
  `[FormStack] Duplicate form id "${options.id}" detected. ` +
  'Form IDs should be unique on the stack to avoid React key collisions ' +
  'in FormStackRenderer and Breadcrumbs (PRD §5.2: "Unique identifier for this form instance").'
);
```
Note the trailing space in the first line: `` `[FormStack] Duplicate form id "${options.id}" detected. ` ``.

## 4. The test env-stubbing gotcha (CRITICAL — mirrors existing tests)

`vi.stubEnv('NODE_ENV', 'development')` ONLY sets `import.meta.env`, but the SOURCE
checks `process.env.NODE_ENV`. So tests MUST do BOTH:
```ts
vi.stubEnv('NODE_ENV', 'development');
if (process?.env) process.env.NODE_ENV = 'development';
```
And restore BOTH in afterEach: `vi.unstubAllEnvs();` + `if (process?.env) process.env.NODE_ENV = 'test';`.
This is the exact pattern in FormStackProvider.test.tsx (closeForm warning block) and
FormStackProvider.autoRender.test.tsx (forgotten-host / duplicate-viewport blocks).

## 5. The act()-between-calls subtlety (test correctness)

After the fix, `openForm` closes over `state.stack` (deps `[state.stack]`). For the
SECOND `openForm({ id: 'dup' })` to SEE the first push in its duplicate check, React
must have re-rendered (flushed the first PUSH_FORM) so `result.current.openForm` is the
NEW closure. Therefore each `openForm` call MUST be wrapped in its own `act()`:
```ts
act(() => { result.current.openForm({ id: 'dup', component: StubForm }); });
act(() => { result.current.openForm({ id: 'dup', component: StubForm }); });
```
Without per-call act(), both calls use the SAME (pre-render) closure with an empty stack
→ no duplicate detected → test fails. This is the single most important test detail.

## 6. Why the default wrapper (autoRender=true) is the right test host

- autoRender=true (the existing `wrapper`): the pushed forms render; React emits a
  duplicate-key warning to **console.error** (harmless — my spy is on console.warn).
  The "forgotten host" guard does NOT fire (it requires autoRender=false). Clean.
- autoRender=false + no viewport: would ALSO fire the "forgotten host" console.warn,
  polluting the spy. Avoid.

So: reuse the existing `wrapper` (autoRender=true) + a trivial `StubForm`. Only my new
duplicate-id warning lands on console.warn.

## 7. Where the new test lives

FormStackProvider.test.tsx already hosts the `closeForm development warning` and the
`popToIndex` dev-mode blocks — the closest analogs. Append a new
`describe('FormStackProvider - openForm duplicate id warning', ...)` at the END of the
file (after the closeForm production test). The file's imports (`renderHook, act`,
`useFormStackWithActions`, `wrapper`) are reused; only a trivial `StubForm` must be added.
No parallel task edits this file (S2 edits useFormStackViewport + its test).

## 8. Mode A docs target (src/types/stack.ts)

Current `OpenFormOptions.id` JSDoc is a one-liner: `/** Unique identifier for this form instance */`.
Add a paragraph: duplicate IDs produce a development-mode warning and can cause React key
collisions in FormStackRenderer/Breadcrumbs; uniqueness is a consumer responsibility;
production unchanged.

## 9. Scope isolation from parallel S2 (P1.M2.T1.S2)

S2 edits: `src/hooks/useFormStackViewport.ts` + `src/hooks/__tests__/useFormStackViewport.test.tsx`.
My task edits: `src/components/FormStackProvider.tsx` + `src/types/stack.ts` +
`src/components/__tests__/FormStackProvider.test.tsx`. ZERO file overlap. Both can land
independently.
