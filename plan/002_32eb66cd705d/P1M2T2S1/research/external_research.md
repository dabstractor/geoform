# External Research — P1.M2.T2.S1 (Hostable Viewport README subsection)

Scope: verify the illustrative MUI `<Dialog>` example and the GitHub heading-anchor
slugs used for intra-README cross-linking. No source files touched.

## 1. MUI `<Dialog>` canonical API (illustrative example)

- `<Dialog open={boolean} onClose={(event, reason) => void}>` — `open` is a boolean;
  `onClose` receives an event + a `reason` string.
- Reasons: `'escapeKeyDown'` (Escape key) and `'backdropClick'` (click outside) — BOTH
  fire `onClose` by default. One handler covers both.
- Ignoring the args (`onClose={() => someAction()}`) is idiomatic and valid (MUI's own
  docs example: `const handleClose = () => setOpen(false)`).
- `<DialogTitle>` and `<DialogContent>` are presentational wrappers with no required
  props (just `children`).

URLs:
- https://mui.com/material-ui/api/dialog/  (`onClose` signature + `reason` values)
- https://mui.com/material-ui/react-dialog/  (idiomatic `handleClose` ignoring args)
- https://mui.com/material-ui/api/dialog-title/
- https://mui.com/material-ui/api/dialog-content/

Implication for the PRP §10.1 example: `<Dialog open={stack.length > 0} onClose={cancelForm}>`
is correct and idiomatic — one `onClose` covers both Escape and backdrop.

## 2. GitHub heading-anchor (slug) rules

Algorithm (github-slugger): lowercase → strip punctuation that is not a letter/number/
space/hyphen (so `() <> {} / =` are REMOVED, not converted) → collapse whitespace/
hyphen/underscore runs to a single hyphen → trim leading/trailing hyphens.

GOTCHA: JSX/JS punctuation (`/`, `=`, `{`, `}`, `<`, `>`) is stripped WITHOUT inserting a
word boundary. So `autoRender={false}` collapses to the single token `autorenderfalse`.

URLs:
- https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
- https://github.com/Flet/github-slugger

## 3. Computed slugs (CRITICAL for cross-links)

- (a) Our heading `### Hostable Viewport (Single Shared Modal)`
  → **`#hostable-viewport-single-shared-modal`**
  → CONFIRMED matches the existing cross-links already placed by siblings S1 (FormStackProvider
    `autoRender` prop row) and S3 (`#### FormStackViewport` note). The heading text MUST be
    exactly `### Hostable Viewport (Single Shared Modal)` or those anchors break.

- (b) Sibling P1.M2.T2.S2's planned heading
  `### Forgetting <FormStackViewport/> with autoRender={false}`
  → **`#forgetting-formstackviewport-with-autorenderfalse`**
  → FRAGILE: depends on S2's EXACT final heading (S2 is Planned, not yet implemented). If S2
    chooses a different heading, this slug MUST be recomputed. The PRP handles this with a
    Coordination Note and prefers a robust cross-link.

## 4. Intra-README anchors

`[text](#heading-slug)` is standard GFM; renders correctly on both GitHub and npm (npm renders
the package README as GFM and resolves same-document `#slug` anchors).

## Sources kept
- MUI Dialog API (mui.com/material-ui/api/dialog) — `onClose` + reasons.
- MUI Dialog demo (mui.com/material-ui/react-dialog) — idiomatic arg-ignoring handler.
- MUI DialogTitle / DialogContent APIs.
- GitHub basic-writing-and-formatting-syntax — section linking.
- github-slugger — exact slug algorithm.

## Sources dropped
- Generic blog/tutorial SEO pages — non-authoritative, redundant.
