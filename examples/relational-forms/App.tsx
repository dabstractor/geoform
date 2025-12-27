import { useState } from 'react';
import { FormStackProvider, Breadcrumbs, useFormStack } from '../../src';
import type { NewOrganization, Organization } from './types';
import { OrganizationForm } from './OrganizationForm';

/**
 * Relational Forms Example Application
 *
 * This example demonstrates the complete geoform library usage for
 * managing hierarchical, relational data through nested forms.
 *
 * ## Form Hierarchy
 *
 * ```
 * OrganizationForm (top level)
 *   └── TeamForm (opened to add teams)
 *         └── UserForm (opened to add team members)
 * ```
 *
 * ## Key Features Demonstrated
 *
 * 1. **FormStackProvider**: Required wrapper that enables form stack functionality
 * 2. **Breadcrumbs**: Navigation showing current form path (e.g., "Home > New Org > Add Team")
 * 3. **useFormStack**: Hook to open forms and await their results
 * 4. **FormProps<T>**: Type-safe interface for form components
 * 5. **State Preservation**: Parent forms maintain state while children are open
 * 6. **confirmOnCancel**: Confirmation dialog to prevent accidental data loss
 * 7. **Promise-based API**: async/await pattern for collecting form results
 *
 * ## Running This Example
 *
 * This example can be integrated into a Vite or other React development server:
 *
 * ```tsx
 * // In your main.tsx or index.tsx:
 * import React from 'react';
 * import ReactDOM from 'react-dom/client';
 * import App from './examples/relational-forms/App';
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
 * 1. Click "Create Organization" to open OrganizationForm
 * 2. Fill in org details, click "+ Add Team" to open TeamForm
 * 3. Fill in team details, click "+ Add Team Member" to open UserForm
 * 4. Fill in user details, click "Add User" - returns to TeamForm with user added
 * 5. TeamForm state (name, description) preserved, user appears in list
 * 6. Add more users or click "Create Team" - returns to OrganizationForm
 * 7. OrganizationForm state preserved, team (with users) appears in list
 * 8. Click "Create Organization" - returns to main view with complete org data
 *
 * At any point:
 * - Click breadcrumbs to navigate back (cancels intermediate forms)
 * - Click "Cancel" to close current form (with confirmation if confirmOnCancel)
 */

/**
 * ExampleContent - Main content area using the form stack.
 *
 * This component uses useFormStack() to open forms and collect results.
 * It must be rendered inside a FormStackProvider.
 */
function ExampleContent() {
  const { openForm } = useFormStack();
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  /**
   * Open the organization creation flow.
   *
   * This starts the 3-level form hierarchy:
   * 1. OrganizationForm opens (this call)
   * 2. User can open TeamForm from OrganizationForm
   * 3. User can open UserForm from TeamForm
   * 4. When OrganizationForm submits, we receive the complete data
   */
  const handleCreateOrganization = async () => {
    const newOrg = await openForm<NewOrganization>({
      id: 'create-organization',
      component: OrganizationForm,
      label: 'New Organization',
      // Protect against accidental cancellation at the top level too
      confirmOnCancel: true,
    });

    if (newOrg) {
      // Form submitted - add the new organization with a generated ID
      const orgWithId: Organization = {
        ...newOrg,
        id: crypto.randomUUID(),
      };
      setOrganizations((prev) => [...prev, orgWithId]);
    }
    // If newOrg is undefined, user cancelled - no action needed
  };

  return (
    <div className="example-app">
      <header>
        <h1>Geoform Example: Relational Forms</h1>
        <p>
          Demonstrates 3-level nested forms: Organization &rarr; Team &rarr; User
        </p>
        {/* Breadcrumbs show navigation path through nested forms */}
        <nav aria-label="Form navigation">
          <Breadcrumbs separator=" > " />
        </nav>
      </header>

      <main>
        <section>
          <h2>Organizations</h2>

          {organizations.length > 0 ? (
            <ul className="org-list">
              {organizations.map((org) => (
                <li key={org.id} className="org-item">
                  <h3>{org.name}</h3>
                  {org.industry && <p>Industry: {org.industry}</p>}
                  <p>Teams: {org.teams.length}</p>
                  <p>
                    Total Members:{' '}
                    {org.teams.reduce((sum, t) => sum + t.members.length, 0)}
                  </p>

                  {/* Show team details */}
                  {org.teams.length > 0 && (
                    <details>
                      <summary>View Teams</summary>
                      <ul>
                        {org.teams.map((team) => (
                          <li key={team.id}>
                            <strong>{team.name}</strong>
                            {team.description && <span> - {team.description}</span>}
                            <span> ({team.members.length} members)</span>
                            {team.members.length > 0 && (
                              <ul>
                                {team.members.map((member) => (
                                  <li key={member.id}>
                                    {member.name} ({member.email}) - {member.role}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">
              No organizations yet. Create one to get started!
            </p>
          )}

          {/* This button starts the nested form flow */}
          <button onClick={handleCreateOrganization}>
            Create Organization
          </button>
        </section>
      </main>
    </div>
  );
}

/**
 * App - Root component with FormStackProvider wrapper.
 *
 * FormStackProvider must wrap any component that uses:
 * - useFormStack() hook
 * - useFormStackState() hook
 * - useFormStackActions() hook
 *
 * The provider manages the form stack state and renders the
 * FormStackRenderer component which displays the active form.
 */
export default function App() {
  return (
    <FormStackProvider>
      <ExampleContent />
    </FormStackProvider>
  );
}
