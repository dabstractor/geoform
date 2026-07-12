# Dev-Mode "Forgotten Host" Guard — Source of Truth

## Source code (verified)

File: `src/components/FormStackProvider.tsx` (audit_findings.md bullet 4 cites
lines ~263-283; the effect is `useEffect` keyed on
`[autoRender, state.stack.length, viewportMounted]`).

### The guard logic

```ts
const warnedForgottenHostRef = useRef(false);
useEffect(() => {
  const forgotten = !autoRender && state.stack.length > 0 && !viewportMounted;
  if (forgotten) {
    if (
      !warnedForgottenHostRef.current &&
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'development'
    ) {
      console.warn(
        '[FormStackProvider] autoRender is false and a form is open, but no ' +
          '<FormStackViewport/> is mounted. Render <FormStackViewport/> inside ' +
          'your host (e.g. your shared modal) so the form is visible.'
      );
      warnedForgottenHostRef.current = true;
    }
  } else {
    warnedForgottenHostRef.current = false;   // reset when host mounts OR stack clears
  }
}, [autoRender, state.stack.length, viewportMounted]);
```

### Behavioral facts (for the pitfall's "Why" + "Note")

1. **Trigger condition (all three):** `autoRender === false` AND a form is open
   (`stack.length > 0`) AND no `<FormStackViewport/>` has mounted
   (`viewportMounted === false`).
2. **Dev-only:** gated on `process.env.NODE_ENV === 'development'`. In production
   the guard is a no-op — an unhosted form is SILENT. (This is the key user
   gotcha: dev hides the problem behind a warning; prod has no warning at all.)
3. **At most once per "forgotten host" episode:** `warnedForgottenHostRef` latches
   after the first warn; it does NOT spam.
4. **Resets** when EITHER a viewport mounts (`viewportMounted` flips true) OR the
   stack clears (`stack.length === 0`) — i.e. the `forgotten` condition becomes
   false → the `else` branch clears the ref → a NEW forgotten episode can warn
   again.
5. **Exact warning string** (quote it in the BAD example so users recognize it):
   `[FormStackProvider] autoRender is false and a form is open, but no <FormStackViewport/> is mounted. Render <FormStackViewport/> inside your host (e.g. your shared modal) so the form is visible.`

## README phrasing already established by S1 (consistency anchor)

Sibling S1's FormStackProvider `autoRender` prop note (README ~line 163) already
uses this wording — the pitfall's Note blockquote should echo it so the docs are
self-consistent:

> **Dev-mode guard:** When `autoRender={false}`, a form is open, and no
> `<FormStackViewport/>` has mounted, the provider logs a `console.warn` at most
> once per "forgotten host" episode (development only; the warning resets once a
> viewport mounts or the stack clears).

Reuse the phrases: "at most once per 'forgotten host' episode",
"development only", "resets once a viewport mounts or the stack clears".

## What the pitfall must convey (from contract §3 LOGIC)

- Problem: `autoRender={false}` → provider renders no viewport; forgotten
  `<FormStackViewport/>` → open forms render nowhere.
- BAD: `<FormStackProvider autoRender={false}>` with NO `<FormStackViewport/>`.
- GOOD: mount EXACTLY ONE `<FormStackViewport/>` where the stack bodies go.
- Why: explain the dev-mode guard (and its dev-only → silent-in-prod nature).
- @see: FormStackViewport component entry + Hostable Viewport section.
