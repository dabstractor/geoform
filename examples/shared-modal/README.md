# Shared Modal (Hostable Viewport) Example

This example demonstrates the **hostable viewport** / **single-shared-modal**
pattern (`autoRender={false}` + `<FormStackViewport/>`): one consumer-hosted
window (a zero-dependency inline modal) hosts the entire form stack —
unbounded nesting, breadcrumb header, Escape/backdrop wired to `cancelForm()`.

It **reuses the same form components** as the
[relational-forms](../relational-forms) example — `OrganizationForm` →
`TeamForm` → `UserForm` — unchanged, via relative import. This proves the
forms are agnostic to the rendering strategy: they work under the default
auto-rendered viewport (relational-forms) **and** a consumer-hosted modal
(shared-modal) with zero edits.

## What it shows

- `<FormStackProvider autoRender={false}>` opts out of auto-rendering.
- `SharedModalHost` mounts **exactly one** `<FormStackViewport/>` as the modal
  body and `<Breadcrumbs/>` as the header.
- Escape (document `keydown`) and backdrop click both call `cancelForm()`; the
  panel stops propagation so in-modal clicks don't cancel.
- The cancel-confirmation dialog (native `<dialog>` via `showModal()`) paints
  **above** the modal with no portal library.
- 3-deep nesting inside one window: Organization → Team → User.

## Running This Example

This example has **zero extra dependencies** beyond React and the geoform
source — no MUI, no dialog library. It is illustrative and **not** part of the
published package.

Integrate it into a Vite React + TypeScript app:

```bash
npm create vite@latest shared-modal-sandbox -- --template react-ts
cd shared-modal-sandbox && npm i
```

Drop this example into the geoform repo (or copy `App.tsx` over), then render it
from your app entry:

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../geoform/examples/shared-modal/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```bash
npm run dev
```

### Expected behavior

1. Click **Create Organization** → one modal opens.
2. Click **+ Add Team** → the body swaps to `TeamForm` (parent state preserved).
3. Click **+ Add Team Member** → the body swaps to `UserForm` (3-deep in one modal).
4. Press **Escape** on a `confirmOnCancel` form → the native confirmation appears
   above the modal; confirming cancels only the top form.
5. Click a **breadcrumb** → navigates back.
6. Click the **backdrop** → cancels the top form.
