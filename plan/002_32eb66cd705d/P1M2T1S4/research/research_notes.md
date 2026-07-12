# Research Notes — P1.M2.T1.S4

## Task
Add `#### useFormStackViewport` hook + `#### FormStackViewportValue` type entries
to `README.md` (Mode B — docs-only). Closes `readme_gap_map.md` §3.5 and §3.6.

## Verified Facts (direct source reads, 2026-07-12)

### Hook contract — `src/hooks/useFormStackViewport.ts`
- Signature: `export function useFormStackViewport(): FormStackViewportValue | null`
- Body: `return useContext(FormStackViewportContext);` — no args.
- Returns `null` when stack empty OR outside provider.
- JSDoc (authoritative prose): "Returns the props required by FormStackRenderer
  ... For consumers who want to forward custom props to FormStackRenderer or wrap
  it. Most consumers should use FormStackViewport instead."
- `@example` snippet: `const viewport = useFormStackViewport(); if (!viewport)
  return null; return <FormStackRenderer {...viewport} />;` — reuse verbatim.

### Type contract — `src/types/context.ts:10-22`
```ts
export interface FormStackViewportValue {
  /** Internal stack entries to render (top visible, parents mounted-hidden) */
  stack: InternalStackEntry<unknown>[];
  /** Callback when a form closes (pops the top form from the stack) */
  onClose: () => void;
  /** Request confirmation before cancelling an entry; resolves true if confirmed */
  onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>;
}
```
- JSDoc above: "Structurally identical to FormStackRendererProps ... without
  leaking internal types (component/deferred) into the public API."

### Assignability claim — `src/components/FormStackRenderer.tsx:8-14`
```ts
export interface FormStackRendererProps {
  stack: InternalStackEntry<unknown>[];
  onClose: () => void;
  onCancelRequest: (entry: InternalStackEntry<unknown>) => Promise<boolean>;
}
```
- CONFIRMED: field-for-field identical to FormStackViewportValue → assignable.
- This validates the "assignable to FormStackRendererProps" phrasing in both entries.

### Public exports — `src/index.ts`
- Line 317: `export { useFormStackViewport } from './hooks';`
- Line 407: `export type { FormStackViewportValue } from './types';`
- `InternalStackEntry` is NOT exported → internal type → needs the note.

## Insertion anchors (CONTENT-based — line numbers drifted)

### Hook anchor (after useFormStackURLSync, before `### Types`)
README line numbers drifted from gap map's "~394" to ~459 (README now 1151 lines).
Unique anchor text:
```
| `forceUrlUpdate` | `() => void` | Manually trigger URL update |

---

### Types
```
`forceUrlUpdate` appears exactly once in README → verified unique.

### Type anchor (after FormStackActions, before `## Advanced Usage`)
Drifted from gap map's "~501" to ~567. Unique anchor text:
```
interface FormStackActions {
  openForm: <T>(options: OpenFormOptions<T>) => Promise<T | undefined>;
  closeForm: () => void;
  popToIndex: (index: number) => void;
  cancelForm: () => Promise<void>;
}
```

## Advanced Usage
```
NOTE: currently NO `---` between FormStackActions and `## Advanced Usage`
(last type connects directly to the `##` heading). When inserting after it,
ADD a `---` after FormStackActions and let the new entry connect directly.

## House-style templates (from readme_gap_map.md)
- (b) Hook: `#### Name` → desc → ```tsx → `**Returns:**` table → `---`.
- (c) Type: `#### Name` → desc → `**Definition:**` ```tsx interface → `---`.
- Returns table union pipes escaped as `\|` (e.g. `Promise<T \| undefined>`).

## Separator conventions (observed)
- Hooks: every hook entry (incl. last) ends with `---` before next `###`.
- Types: inter-entry `---`; the LAST type before `##` has NO trailing `---`.

## Current grep counts (baseline before this task)
- `useFormStackViewport`: 0 hits  → target ≥ 1
- `FormStackViewportValue`: 0 hits → target ≥ 1

## Parallel-safety analysis
- Sibling S3 (`#### FormStackViewport` component) edits the COMPONENTS section
  (above `### Hooks`). This task edits HOOKS + TYPES sections (below `### Hooks`).
  ZERO overlap — both PRPs apply independently.
- Sibling S2 (Complete) finalized the FormStackActions block body; this task only
  APPENDS after it (adds `---` + new entry), never edits the body.

## Validation commands (verified present in package.json)
- `npm run type-check` → `tsc --noEmit`
- `npm test` → `vitest run`
- `npm run build` → `tsup`
