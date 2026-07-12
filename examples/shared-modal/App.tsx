import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  FormStackProvider,
  FormStackViewport,
  Breadcrumbs,
  useFormStackState,
  useFormStackActions,
} from '../../src';
import type { NewOrganization, Organization } from '../relational-forms/types';
import { OrganizationForm } from '../relational-forms/OrganizationForm';

/**
 * Shared Modal (Hostable Viewport) Example Application
 *
 * This example demonstrates the **single-shared-modal** / **hostable viewport**
 * pattern from PRD §10.1 and the README "Hostable Viewport (Single Shared
 * Modal)" Advanced-Usage subsection.
 *
 * Instead of letting the provider auto-render the stacked form bodies
 * (the default v1 behavior), we set `<FormStackProvider autoRender={false}>`
 * and host **exactly one** `<FormStackViewport/>` inside our own window — a
 * zero-dependency inline modal. The entire form stack
 * (OrganizationForm → TeamForm → UserForm, reused unchanged from the
 * relational-forms example) renders inside that one modal, so you get
 * unbounded nesting in a single window.
 *
 * The host (this modal) owns the **window close gesture**: Escape and a
 * backdrop click both call `cancelForm()` from `useFormStackActions()`, which
 * cancels the top form (honoring `confirmOnCancel`) and leaves deeper forms
 * intact. The header is `<Breadcrumbs/>` so users can navigate back.
 *
 * This is an illustrative example and is **not** part of the published package
 * (it lives under `examples/`, which is excluded from `package.json` "files",
 * `tsup` entry, `tsconfig` include, and vitest include). It reuses the
 * relational-forms form components via relative import — it does **not** copy
 * them.
 *
 * ## Running This Example
 *
 * This example can be integrated into a Vite (or other) React + TypeScript app.
 * It has **zero extra dependencies** beyond React and the geoform source — no
 * MUI, no portal library. The cancel-confirmation dialog paints above the modal
 * automatically because geoform renders a native `<dialog>` via `showModal()`
 * (top layer).
 *
 * ```tsx
 * // In your main.tsx or index.tsx:
 * import React from 'react';
 * import ReactDOM from 'react-dom/client';
 * import App from './examples/shared-modal/App';
 *
 * ReactDOM.createRoot(document.getElementById('root')!).render(
 *   <React.StrictMode>
 *     <App />
 *   </React.StrictMode>
 * );
 * ```
 *
 * ## Expected Behavior
 *
 * 1. Click "Create Organization" → one modal opens with OrganizationForm.
 * 2. Click "+ Add Team" → the modal body swaps to TeamForm (OrganizationForm
 *    stays mounted-but-hidden, its state preserved).
 * 3. Click "+ Add Team Member" → the body swaps to UserForm (3-deep nesting
 *    inside the same single modal).
 * 4. Press Escape on a `confirmOnCancel` form → the native confirmation dialog
 *    appears **above** the modal; confirming cancels the top form only.
 * 5. Click a breadcrumb → navigates back (cancels deeper forms).
 * 6. Click the backdrop → cancels the top form (same as Escape).
 */

// --- Inline style objects (examples ship no CSS) ---------------------------
// A plain fixed-position div overlay works without a portal library because the
// provider's <ConfirmationDialog/> uses a native <dialog> (top layer) that
// paints above this z-index overlay.
const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const panelStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  minWidth: 420,
  maxWidth: 640,
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #eee',
};

const bodyStyle: CSSProperties = {
  padding: 16,
  overflow: 'auto',
};

/**
 * SharedModalHost — the consumer-hosted window that renders the whole stack.
 *
 * Reads `stack` from `useFormStackState()` to decide whether the window is open,
 * renders `<Breadcrumbs/>` as the header and **exactly one** `<FormStackViewport/>`
 * as the body, and wires Escape + backdrop click to `cancelForm()`.
 */
function SharedModalHost() {
  const { stack } = useFormStackState();
  const { cancelForm } = useFormStackActions();

  // Escape cancels the top form (honors confirmOnCancel). Active only while open.
  useEffect(() => {
    if (stack.length === 0) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        void cancelForm(); // async; fire-and-forget is fine
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [stack.length, cancelForm]);

  // Window is closed when the stack is empty.
  if (stack.length === 0) return null;

  // Backdrop click = host close gesture → cancelForm.
  // The panel stops propagation so clicks inside the modal don't cancel.
  return (
    <div style={backdropStyle} onClick={cancelForm}>
      <div
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header style={headerStyle}>
          <Breadcrumbs separator=" › " />
        </header>
        <div style={bodyStyle}>
          {/* EXACTLY ONE viewport — renders the stacked form bodies */}
          <FormStackViewport />
        </div>
      </div>
    </div>
  );
}

/**
 * ExampleContent — the app body with a launch button.
 *
 * Uses `openForm` to start the OrganizationForm flow. Because the provider has
 * `autoRender={false}`, the form bodies render inside `<SharedModalHost/>`
 * rather than being auto-rendered by the provider.
 */
function ExampleContent() {
  const { openForm } = useFormStackActions();
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const handleCreateOrganization = async () => {
    const newOrg = await openForm<NewOrganization>({
      id: 'create-organization',
      component: OrganizationForm,
      label: 'New Organization',
      // Demonstrates the confirmation dialog stacking above the modal on cancel.
      confirmOnCancel: true,
    });

    if (newOrg) {
      setOrganizations((prev) => [
        ...prev,
        { ...newOrg, id: crypto.randomUUID() },
      ]);
    }
    // If newOrg is undefined, the user cancelled — no action needed.
  };

  return (
    <div>
      <h1>Geoform Example: Shared Modal (Hostable Viewport)</h1>
      <p>
        The entire form stack (Organization → Team → User) renders inside one
        consumer-hosted modal using <code>autoRender={'{false}'}</code> and a
        single <code>&lt;FormStackViewport/&gt;</code>.
      </p>

      <section>
        <h2>Organizations</h2>

        {organizations.length > 0 ? (
          <ul>
            {organizations.map((org) => (
              <li key={org.id}>
                <strong>{org.name}</strong>
                {org.industry && <span> — {org.industry}</span>}
                <span> ({org.teams.length} teams)</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No organizations yet. Create one to open the shared modal.</p>
        )}

        {/* This button starts the nested form flow inside the shared modal. */}
        <button onClick={handleCreateOrganization}>Create Organization</button>
      </section>
    </div>
  );
}

/**
 * App — Root component.
 *
 * The provider is set to `autoRender={false}` so it renders **no** viewport
 * itself. Both `ExampleContent` (the app body) and `SharedModalHost` (the
 * window that hosts the single `<FormStackViewport/>`) are children of the
 * provider. The `<ConfirmationDialog/>` is always rendered by the provider
 * regardless of `autoRender`.
 */
export default function App() {
  return (
    <FormStackProvider autoRender={false}>
      <ExampleContent />
      <SharedModalHost />
    </FormStackProvider>
  );
}
