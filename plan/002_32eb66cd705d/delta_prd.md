# Delta PRD: Hostable Viewport (Single Shared Modal) — 0.2.0

> Delta against PRD v1 (sections 1–15, implemented in session `001_64e16a72fcd0`).
> Captures the additive 0.2.0 change documented in the current PRD (§5.1 `autoRender`,
> §5.2 `cancelForm`/`popToIndex`, §10.1 Consumer-Hosted Viewport, §16 Changelog).

## 1. Purpose of This Delta

Add an **additive, fully backwards-compatible** capability: a consumer may host
the entire form stack inside **one shared window** (e.g. an MUI `<Dialog>`)
instead of each form opening its own. Defaults preserve 0.1.1 behavior exactly
(zero migration). geoform itself stays **chrome-less** — it still imposes no
window of its own.

## 2. What Actually Changed (Diff)

Substantive PRD delta is ~107 lines, all additive. (Whitespace-only
normalization of nested bullets in §8/§9 is cosmetic and ignored.)

| Area | Change | Type |
|---|---|---|
| §5.1 `FormStackProvider` | New `autoRender?: boolean` prop (default `true`) + dev-mode "forgotten host" guard | New feature |
| §5.2 `closeForm` | Doc tweak: "Bypasses the promise resolution pattern — see §8" | Clarification |
| §5.2 `cancelForm` | New `cancelForm(): Promise<void>` action | New feature |
| §5.2 `popToIndex` | New `popToIndex(index: number): void` action | New feature |
| §10 Rendering | "hidden" clarified as `display: none`; renderer is explicitly chrome-less | Clarification |
| §10.1 | New section "Consumer-Hosted Viewport (Single Shared Modal)" | New feature |
| §16 | New Changelog section (0.2.0) | New docs |

**Size class:** medium feature addition → one phase, focused scope.

## 3. Implementation Status (IMPORTANT — do NOT re-implement)

The codebase **already ships this feature**. Before creating implementation
tasks, the breakdown agent MUST verify against the existing files rather than
writing from scratch:

- `src/components/FormStackProvider.tsx` — `autoRender` prop (default `true`),
  `cancelForm()` and `popToIndex()` actions, dev-mode forgotten-host guard.
- `src/components/FormStackViewport.tsx` — zero-prop placeable viewport.
- `src/hooks/useFormStackViewport.ts` — returns `FormStackViewportValue | null`.
- `src/types/context.ts` — `FormStackViewportValue` interface.
- `src/index.ts` — all new symbols exported (`FormStackViewport`,
  `useFormStackViewport`, `FormStackViewportValue`); `useFormStack` /
  `useFormStackActions` now surface `cancelForm` / `popToIndex`.
- **Tests:** 286/286 passing, including `FormStackProvider.autoRender.test.tsx`
  (13), `FormStackViewport.test.tsx` (8), `useFormStackViewport.test.tsx` (5).
- `CHANGELOG.md` — "hostable viewport for single-shared-modal form hosting"
  entry present (commit `1e09499`).

**Conclusion:** implementation + unit/integration tests + Mode-A JSDoc +
changelog are **complete**. Remaining work is **verification + one
documentation gap** (see §4).

## 4. Scope of Remaining Work

### Requirement D1 — Conformance audit (code → finalized PRD)

The PRD text was finalized *after* the code shipped. Verify the existing
implementation matches the now-authoritative PRD on the precise behaviors the
spec calls out, and tighten only where there is a genuine mismatch:

- `cancelForm()` is a **no-op on an empty stack** and resolves the top form's
  deferred with `undefined` (so the parent `await openForm()` resolves
  `undefined`).
- `cancelForm()` honors `confirmOnCancel` (confirmation → resolve → pop).
- `popToIndex(index)` cancels all deeper forms (used by `<Breadcrumbs/>`).
- Dev-mode guard warns at most once per mount when `autoRender={false}` + open
  form + no mounted `<FormStackViewport/>`.
- `FormStackViewportValue` is structurally assignable to `FormStackRendererProps`
  (no internal-type leakage).
- Promise contract of `openForm()` is unchanged (additive only).

Output: a short audit note (file under `plan/002_32eb66cd705d/`); fix any
mismatch in the existing file. No new modules.

### Requirement D2 — Sync changeset-level documentation (Mode B)

**This is the one real gap.** `README.md` has **zero** mentions of
`autoRender`, `FormStackViewport`, `cancelForm`, `useFormStackViewport`,
`FormStackViewportValue`, or the shared-modal pattern (verified by grep).
`examples/` has no shared-modal demonstration. The code shipped without the
consumer-facing docs catching up.

Update `README.md` to reflect 0.2.0:

- **Features** (§Features) — add a one-line bullet for the hostable viewport /
  single shared modal.
- **API Reference → `FormStackProvider`** — document the `autoRender` prop
  (`true` default; `false` hosts the viewport yourself) and the dev-mode guard.
- **API Reference → Actions** — document `cancelForm(): Promise<void>` and
  `popToIndex(index)`.
- **API Reference → Components** — add `<FormStackViewport/>`.
- **API Reference → Hooks / Types** — add `useFormStackViewport()` and
  `FormStackViewportValue`.
- **Advanced Usage** — add a "Hostable Viewport (Single Shared Modal)" section
  with the `<FormStackProvider autoRender={false}>` + `<FormStackViewport/>`
  pattern and the shared-modal example from PRD §10.1.
- **Common Pitfalls** — add "Forgetting `<FormStackViewport/>` with
  `autoRender={false}`" (the dev guard exists for this).

Optional (nice-to-have, not blocking): a small `examples/shared-modal/` demo.

## 5. Documentation Impact

- **Mode A (doc-with-work):** **Complete — no action.** JSDoc is already present
  on `FormStackProvider` (`autoRender`), `cancelForm`, `popToIndex`,
  `FormStackViewport`, `useFormStackViewport`, and `FormStackViewportValue` in
  `src/index.ts` and their source files.
- **Mode B (changeset-level):** **Applies → Requirement D2.** `README.md` feature
  blurbs, API reference, and the Advanced Usage / Common Pitfalls sections are
  stale relative to shipped code. This is the substantive task of the delta.

## 6. Non-Goals (This Delta)

- No changes to the `FormProps` contract, `openForm()` promise semantics, or
  `FormStackRenderer`'s signature (PRD §16 reaffirms these as unchanged).
- No new window chrome inside geoform (stays chrome-less).
- No Vue/Svelte parity, state serialization, or cross-tab recovery (still
  deferred per §15).
- No re-implementation of already-shipped code.

## 7. Success Criteria

- Existing implementation verified against the finalized PRD; any gaps closed in
  the existing files (no new modules).
- `README.md` documents every 0.2.0 public symbol and the shared-modal pattern;
  grep for each new symbol returns hits in README.
- Full test suite (286+) continues to pass; `npm run build` /
  `npm run typecheck` green.
- A consumer reading only the README can adopt `autoRender={false}` +
  `<FormStackViewport/>` correctly.

## 8. Suggested Breakdown Shape

One phase, two milestones:

- **Milestone D-A — Conformance audit** (Requirement D1): 1 task, audit existing
  files against PRD, fix mismatches in place. No new code modules.
- **Milestone D-B — README + docs sync** (Requirement D2): 1 task covering the
  README sections enumerated in D2; optional example subtask.

(Proportional to a medium, already-implemented additive feature. Do not expand
into multi-phase implementation work.)
