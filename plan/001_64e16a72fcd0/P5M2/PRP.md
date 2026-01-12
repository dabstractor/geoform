# PRP: Example Application (P5.M2)

**Milestone:** P5.M2 - Example Application
**Project:** React Hierarchical Form Stack System (geoform)
**Status:** Implementation Required
**Estimated Story Points:** 3 SP total (T1.S1: 2, T1.S2: 1)
**Dependencies:** P5.M1 (Complete) - API Documentation

---

## Goal

**Feature Goal**: Create a realistic example application demonstrating nested forms with relational data (Organization → Team → User hierarchy) that showcases all key features of the geoform library.

**Deliverable**:
- `examples/relational-forms/OrganizationForm.tsx` - Top-level organization form
- `examples/relational-forms/TeamForm.tsx` - Nested team form with user creation
- `examples/relational-forms/UserForm.tsx` - Nested user form (leaf level)
- `examples/relational-forms/types.ts` - TypeScript interfaces for Organization, Team, User
- `examples/relational-forms/App.tsx` - Example app entry point with FormStackProvider

**Success Definition**:
1. Example demonstrates 3-level form nesting (Organization → Team → User)
2. Forms properly implement `FormProps<T>` interface from the library
3. Example showcases state preservation when child forms are opened
4. Breadcrumb navigation works throughout the nested form stack
5. TypeScript types are strict and well-documented
6. Example can be run and tested: `npm run example` (if dev script added)
7. Code serves as documentation for library users

---

## User Persona

**Target User**: Developers evaluating or learning the geoform library

**Use Case**: Understanding how to implement nested, relational forms using the form stack system

**User Journey**:
1. Developer reads example code to understand the pattern
2. Developer runs the example to see the behavior
3. Developer copies patterns into their own application
4. Developer understands promise-based API for form results

**Pain Points Addressed**:
- Unclear how to structure nested forms with this library
- No reference implementation for relational data patterns
- Difficulty understanding parent-child form data flow
- Confusion about TypeScript typing for form components

---

## Why

- **Learning Resource**: Example code is often the first thing developers look at when evaluating a library
- **Pattern Demonstration**: Shows the canonical way to use all library features together
- **Integration Example**: Demonstrates how multiple forms interact in a realistic scenario
- **Copy-Paste Foundation**: Provides a starting point developers can adapt
- **Validation**: Proves the library works for its intended use case (hierarchical relational data)

---

## What

### Success Criteria

- [ ] Organization form can open Team forms inline (not navigating away)
- [ ] Team form can open User forms inline
- [ ] Parent forms preserve input state when child forms are active
- [ ] Submitting child form returns value to parent
- [ ] Canceling child form returns undefined to parent
- [ ] Breadcrumbs show navigation path and allow jumping back
- [ ] All forms use proper TypeScript generics with FormProps<T>
- [ ] Example demonstrates confirmOnCancel option
- [ ] Code is well-commented for educational purposes

---

## All Needed Context

### Context Completeness Check

_"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

**Answer**: Yes - this PRP includes the library's public API, complete type definitions, existing test patterns to reference, and specific code examples for each form component.

### Documentation & References

```yaml
# MUST READ - Library public API
- file: src/index.ts
  why: Understand all public exports to use in example
  pattern: FormStackProvider, useFormStack, Breadcrumbs, FormProps<T>, OpenFormOptions
  critical: Only import from library public API, not internal files

- file: src/types/form.ts
  why: FormProps<T> interface that all forms must implement
  pattern: |
    interface FormProps<T = unknown> {
      onSubmit: (value: T) => void;
      onCancel: () => void;
      onError?: (error: unknown) => void;
    }
  gotcha: Forms receive these callbacks injected by FormStackRenderer, don't define them yourself

- file: src/types/stack.ts
  why: OpenFormOptions interface for openForm calls
  pattern: |
    interface OpenFormOptions<T = unknown> {
      id: string;
      component: ComponentType<FormProps<T>>;
      label?: string;
      confirmOnCancel?: boolean;
    }
  gotcha: id must be unique, label appears in breadcrumbs

- file: src/hooks/useFormStack.ts
  why: Primary hook API for opening forms
  pattern: |
    const { openForm, closeForm, stack } = useFormStack();
    const result = await openForm({ id, component, label });
  critical: openForm returns Promise<T | undefined>, undefined means cancelled

# MUST READ - Existing test form patterns
- file: src/__tests__/integration/test-utils.tsx
  why: Canonical examples of forms implementing FormProps<T>
  pattern: StatefulTestForm, ParentFormWithChild, NestableForm
  critical: Follow useState pattern for internal form state

# Component references
- file: src/components/FormStackProvider.tsx
  why: Understand provider setup pattern
  pattern: Wrap app in FormStackProvider, it manages stack state

- file: src/components/Breadcrumbs.tsx
  why: Include breadcrumbs in example for navigation
  pattern: <Breadcrumbs separator=" › " />

# PRD for scope verification
- file: PRD.md
  why: Section 12 shows example consumer usage pattern
  pattern: |
    const { openForm } = useFormStack()
    const value = await openForm({
      id: 'CreateOrganization',
      component: CreateOrganizationForm,
      label: 'Organization',
      confirmOnCancel: true
    })
    if (value) setOrganization(value)
```

### Current Codebase Tree

```bash
geoform-opus/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── components/
│   │   ├── FormStackProvider.tsx   # Provider component
│   │   ├── FormStackRenderer.tsx   # Renders form stack
│   │   ├── Breadcrumbs.tsx         # Navigation breadcrumbs
│   │   ├── ConfirmationDialog.tsx  # Cancel confirmation
│   │   └── FormErrorBoundary.tsx   # Per-form error boundary
│   ├── hooks/
│   │   ├── useFormStack.ts         # Combined hook
│   │   ├── useFormStackState.ts    # Read-only state
│   │   └── useFormStackActions.ts  # Actions only
│   ├── types/
│   │   ├── form.ts                 # FormProps<T>, DeferredPromise
│   │   ├── stack.ts                # StackEntry, OpenFormOptions
│   │   └── context.ts              # FormStackState, FormStackActions
│   ├── context/
│   │   └── formStackReducer.ts     # Stack state reducer
│   └── utils/
│       └── createDeferredPromise.ts
├── examples/                        # NEW: Example applications
│   └── relational-forms/            # NEW: This example
└── package.json
```

### Desired Codebase Tree with Files to Add

```bash
examples/
└── relational-forms/
    ├── types.ts
    │   # Responsibility: Define Organization, Team, User interfaces
    │   # Exports: Organization, Team, User, NewOrganization, NewTeam, NewUser
    │
    ├── OrganizationForm.tsx
    │   # Responsibility: Top-level form for creating organization with teams
    │   # Pattern: Implements FormProps<Organization>
    │   # Features: Opens TeamForm to add teams, shows team list, confirmOnCancel
    │
    ├── TeamForm.tsx
    │   # Responsibility: Form for creating team with users
    │   # Pattern: Implements FormProps<Team>
    │   # Features: Opens UserForm to add users, shows user list
    │
    ├── UserForm.tsx
    │   # Responsibility: Leaf-level form for creating users
    │   # Pattern: Implements FormProps<User>
    │   # Features: Simple form with name, email, role fields
    │
    └── App.tsx
        # Responsibility: Example application entry point
        # Pattern: FormStackProvider wrapper, Breadcrumbs, trigger button
        # Features: Demonstrates complete workflow
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Forms must implement FormProps<T> interface
// The callbacks are injected by FormStackRenderer, not passed manually
interface FormProps<T = unknown> {
  onSubmit: (value: T) => void;   // Call with typed data
  onCancel: () => void;            // Call with no arguments
  onError?: (error: unknown) => void;
}

// CRITICAL: openForm returns Promise<T | undefined>
// undefined means the form was cancelled, not an error
const result = await openForm({ id: 'user', component: UserForm, label: 'Add User' });
if (result) {
  // Form was submitted with data
  setUsers([...users, result]);
} else {
  // Form was cancelled - no action needed
}

// CRITICAL: Parent forms stay mounted while child is active
// Use useState normally - React state persists because component isn't unmounted
const [formData, setFormData] = useState<OrganizationData>({ name: '', teams: [] });
// This state survives child form opening/closing

// CRITICAL: Form IDs should be unique within the stack
// Use descriptive IDs like 'create-team' or 'edit-user-123'
openForm({ id: `add-user-to-team-${teamId}`, ... })

// PATTERN: Labels appear in breadcrumbs
// Use human-readable labels
openForm({ id: 'create-org', label: 'New Organization', ... })

// PATTERN: confirmOnCancel shows dialog before cancelling
// Use for forms with unsaved data
openForm({ id: 'create-org', confirmOnCancel: true, ... })
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// examples/relational-forms/types.ts

/**
 * User data structure - leaf node in hierarchy
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

/**
 * Team data structure - contains users
 */
export interface Team {
  id: string;
  name: string;
  description: string;
  members: User[];
}

/**
 * Organization data structure - top level, contains teams
 */
export interface Organization {
  id: string;
  name: string;
  industry: string;
  teams: Team[];
}

// Form input types (without id, which is generated on submit)
export type NewUser = Omit<User, 'id'>;
export type NewTeam = Omit<Team, 'id'>;
export type NewOrganization = Omit<Organization, 'id'>;
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE examples/relational-forms/types.ts
  - IMPLEMENT: User, Team, Organization interfaces with proper typing
  - IMPLEMENT: NewUser, NewTeam, NewOrganization omit types for form input
  - FOLLOW pattern: Standard TypeScript interface definitions
  - NAMING: PascalCase for types, descriptive field names
  - PURPOSE: Establish type-safe data model for entire example

Task 2: CREATE examples/relational-forms/UserForm.tsx
  - IMPLEMENT: Leaf-level form for creating users
  - SIGNATURE: function UserForm({ onSubmit, onCancel }: FormProps<NewUser>)
  - STATE: useState for name, email, role fields
  - VALIDATION: Basic required field checks before submit
  - UI: Simple form with text inputs and select for role
  - FOLLOW pattern: src/__tests__/integration/test-utils.tsx (StatefulTestForm)
  - COMMENTS: Add JSDoc explaining this is the leaf form in hierarchy
  - PURPOSE: Demonstrate simplest FormProps<T> implementation

Task 3: CREATE examples/relational-forms/TeamForm.tsx
  - IMPLEMENT: Middle-level form for creating teams with users
  - SIGNATURE: function TeamForm({ onSubmit, onCancel }: FormProps<NewTeam>)
  - STATE: useState for team name, description, and users array
  - FEATURE: "Add User" button that calls openForm with UserForm
  - PATTERN: Capture user result, add to local users array
  - SHOW: Display list of added users with ability to remove
  - FOLLOW pattern: src/__tests__/integration/test-utils.tsx (ParentFormWithChild)
  - COMMENTS: Demonstrate parent-child form relationship
  - PURPOSE: Show mid-level nesting with async openForm usage

Task 4: CREATE examples/relational-forms/OrganizationForm.tsx
  - IMPLEMENT: Top-level form for creating organizations with teams
  - SIGNATURE: function OrganizationForm({ onSubmit, onCancel }: FormProps<NewOrganization>)
  - STATE: useState for org name, industry, and teams array
  - FEATURE: "Add Team" button that calls openForm with TeamForm
  - PATTERN: Capture team result (which includes users), add to local teams array
  - SHOW: Display nested list of teams and their users
  - OPTION: Use confirmOnCancel: true when opening child forms
  - FOLLOW pattern: src/__tests__/integration/test-utils.tsx (ParentFormWithChild)
  - COMMENTS: Demonstrate top-level orchestration of nested forms
  - PURPOSE: Show complete 3-level hierarchy pattern

Task 5: CREATE examples/relational-forms/App.tsx
  - IMPLEMENT: Example application entry point
  - PATTERN: Wrap in FormStackProvider
  - INCLUDE: Breadcrumbs component for navigation display
  - FEATURE: "Create Organization" button to start the flow
  - DISPLAY: Show created organization after form completes
  - COMMENTS: Explain the complete flow and library usage
  - PURPOSE: Runnable example that demonstrates entire library

Task 6: UPDATE package.json (optional)
  - ADD: Script to run example if desired
  - EXAMPLE: "example": "vite examples/relational-forms"
  - ALTERNATIVE: Just provide clear instructions in example file comments
```

### Implementation Patterns & Key Details

```typescript
// ============================================================
// PATTERN 1: Leaf Form (UserForm.tsx)
// ============================================================
import { useState } from 'react';
import type { FormProps } from 'geoform'; // or relative import for examples
import type { NewUser } from './types';

/**
 * UserForm - Leaf-level form for creating users
 *
 * This is the simplest form in the hierarchy. It receives
 * onSubmit and onCancel callbacks injected by FormStackProvider
 * and calls them when the user completes or cancels the form.
 *
 * @example
 * // This form is opened from TeamForm like this:
 * const user = await openForm({
 *   id: 'add-user',
 *   component: UserForm,
 *   label: 'Add Team Member'
 * });
 */
export function UserForm({ onSubmit, onCancel }: FormProps<NewUser>) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');

  const handleSubmit = () => {
    // Validate required fields
    if (!name.trim() || !email.trim()) {
      return; // Could show validation errors
    }

    // Call onSubmit with the form data
    // This resolves the promise returned by openForm()
    onSubmit({ name: name.trim(), email: email.trim(), role });
  };

  return (
    <div className="form user-form">
      <h2>Add Team Member</h2>

      <div className="field">
        <label htmlFor="user-name">Name</label>
        <input
          id="user-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
        />
      </div>

      <div className="field">
        <label htmlFor="user-email">Email</label>
        <input
          id="user-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
        />
      </div>

      <div className="field">
        <label htmlFor="user-role">Role</label>
        <select
          id="user-role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'member' | 'viewer')}
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      <div className="actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" onClick={handleSubmit}>
          Add User
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PATTERN 2: Middle Form (TeamForm.tsx)
// ============================================================
import { useState } from 'react';
import type { FormProps } from 'geoform';
import { useFormStack } from 'geoform';
import type { NewTeam, NewUser, User } from './types';
import { UserForm } from './UserForm';

/**
 * TeamForm - Middle-level form for creating teams with users
 *
 * Demonstrates the key pattern: a form that can open child forms
 * and collect their results. When "Add User" is clicked, this form
 * opens UserForm and awaits the result.
 *
 * State Preservation: When UserForm is open, TeamForm remains
 * mounted but hidden. All useState values (name, description, members)
 * are preserved when the child form closes.
 */
export function TeamForm({ onSubmit, onCancel }: FormProps<NewTeam>) {
  const { openForm } = useFormStack();

  // Form state - preserved while child forms are open
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<User[]>([]);

  /**
   * Open the UserForm to add a new team member.
   * The async/await pattern is central to geoform:
   * - openForm() returns a Promise that resolves when the child form closes
   * - If user submits: promise resolves with the form data
   * - If user cancels: promise resolves with undefined
   */
  const handleAddUser = async () => {
    const newUser = await openForm<NewUser>({
      id: `add-user-${Date.now()}`, // Unique ID for this form instance
      component: UserForm,
      label: 'Add Team Member',
    });

    // Only add if user submitted (not cancelled)
    if (newUser) {
      const userWithId: User = {
        ...newUser,
        id: crypto.randomUUID(), // Generate ID on "server side"
      };
      setMembers((prev) => [...prev, userWithId]);
    }
    // If newUser is undefined, user cancelled - no action needed
  };

  const handleRemoveUser = (userId: string) => {
    setMembers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      return; // Validation
    }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      members,
    });
  };

  return (
    <div className="form team-form">
      <h2>Create Team</h2>

      <div className="field">
        <label htmlFor="team-name">Team Name</label>
        <input
          id="team-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter team name"
        />
      </div>

      <div className="field">
        <label htmlFor="team-description">Description</label>
        <textarea
          id="team-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter team description"
        />
      </div>

      {/* Team Members Section */}
      <div className="section">
        <h3>Team Members ({members.length})</h3>

        {members.length > 0 ? (
          <ul className="member-list">
            {members.map((user) => (
              <li key={user.id}>
                <span>{user.name} ({user.email}) - {user.role}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user.id)}
                  aria-label={`Remove ${user.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No members added yet</p>
        )}

        <button type="button" onClick={handleAddUser}>
          + Add Team Member
        </button>
      </div>

      <div className="actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" onClick={handleSubmit}>
          Create Team
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PATTERN 3: Top-Level Form (OrganizationForm.tsx)
// ============================================================
import { useState } from 'react';
import type { FormProps } from 'geoform';
import { useFormStack } from 'geoform';
import type { NewOrganization, NewTeam, Team } from './types';
import { TeamForm } from './TeamForm';

/**
 * OrganizationForm - Top-level form for creating organizations
 *
 * This is the root of our 3-level hierarchy:
 * OrganizationForm → TeamForm → UserForm
 *
 * Key features demonstrated:
 * - confirmOnCancel: Shows confirmation dialog when cancelling
 * - Nested team list: Each team contains its users from UserForm
 * - State preservation: All org data preserved while adding teams
 */
export function OrganizationForm({ onSubmit, onCancel }: FormProps<NewOrganization>) {
  const { openForm } = useFormStack();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);

  const handleAddTeam = async () => {
    const newTeam = await openForm<NewTeam>({
      id: `add-team-${Date.now()}`,
      component: TeamForm,
      label: 'Add Team',
      confirmOnCancel: true, // Show "Discard changes?" dialog on cancel
    });

    if (newTeam) {
      const teamWithId: Team = {
        ...newTeam,
        id: crypto.randomUUID(),
      };
      setTeams((prev) => [...prev, teamWithId]);
    }
  };

  const handleRemoveTeam = (teamId: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }
    onSubmit({
      name: name.trim(),
      industry: industry.trim(),
      teams,
    });
  };

  // Calculate total members across all teams
  const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);

  return (
    <div className="form organization-form">
      <h2>Create Organization</h2>

      <div className="field">
        <label htmlFor="org-name">Organization Name</label>
        <input
          id="org-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter organization name"
        />
      </div>

      <div className="field">
        <label htmlFor="org-industry">Industry</label>
        <input
          id="org-industry"
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g., Technology, Healthcare, Finance"
        />
      </div>

      {/* Teams Section */}
      <div className="section">
        <h3>Teams ({teams.length}) - {totalMembers} total members</h3>

        {teams.length > 0 ? (
          <ul className="team-list">
            {teams.map((team) => (
              <li key={team.id} className="team-item">
                <div className="team-header">
                  <strong>{team.name}</strong>
                  <span>({team.members.length} members)</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTeam(team.id)}
                    aria-label={`Remove ${team.name}`}
                  >
                    Remove
                  </button>
                </div>
                {team.members.length > 0 && (
                  <ul className="nested-member-list">
                    {team.members.map((member) => (
                      <li key={member.id}>
                        {member.name} - {member.role}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No teams added yet</p>
        )}

        <button type="button" onClick={handleAddTeam}>
          + Add Team
        </button>
      </div>

      <div className="actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" onClick={handleSubmit}>
          Create Organization
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PATTERN 4: App Entry Point (App.tsx)
// ============================================================
import { useState } from 'react';
import { FormStackProvider, Breadcrumbs, useFormStack } from 'geoform';
import type { NewOrganization, Organization } from './types';
import { OrganizationForm } from './OrganizationForm';

/**
 * Example Application Entry Point
 *
 * This demonstrates the complete geoform library usage:
 * 1. Wrap your app in FormStackProvider
 * 2. Include Breadcrumbs for navigation
 * 3. Use useFormStack hook to open forms
 * 4. Handle form results with async/await
 *
 * Run this example to see:
 * - 3-level nested form hierarchy
 * - State preservation across form opens
 * - Breadcrumb navigation
 * - Promise-based form result handling
 */
function ExampleContent() {
  const { openForm } = useFormStack();
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const handleCreateOrganization = async () => {
    const newOrg = await openForm<NewOrganization>({
      id: 'create-organization',
      component: OrganizationForm,
      label: 'New Organization',
      confirmOnCancel: true,
    });

    if (newOrg) {
      const orgWithId: Organization = {
        ...newOrg,
        id: crypto.randomUUID(),
      };
      setOrganizations((prev) => [...prev, orgWithId]);
    }
  };

  return (
    <div className="example-app">
      <header>
        <h1>Geoform Example: Relational Forms</h1>
        <nav aria-label="Form navigation">
          <Breadcrumbs separator=" › " />
        </nav>
      </header>

      <main>
        <section>
          <h2>Organizations</h2>

          {organizations.length > 0 ? (
            <ul className="org-list">
              {organizations.map((org) => (
                <li key={org.id}>
                  <h3>{org.name}</h3>
                  <p>Industry: {org.industry}</p>
                  <p>Teams: {org.teams.length}</p>
                  <p>
                    Total Members:{' '}
                    {org.teams.reduce((sum, t) => sum + t.members.length, 0)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No organizations yet. Create one to get started!</p>
          )}

          <button onClick={handleCreateOrganization}>
            Create Organization
          </button>
        </section>
      </main>
    </div>
  );
}

/**
 * App - Root component wrapped in FormStackProvider
 *
 * FormStackProvider must wrap any component that uses:
 * - useFormStack() hook
 * - useFormStackState() hook
 * - useFormStackActions() hook
 */
export default function App() {
  return (
    <FormStackProvider>
      <ExampleContent />
    </FormStackProvider>
  );
}
```

### Integration Points

```yaml
LIBRARY IMPORTS:
  - from: 'geoform' (or '../src' for local development)
  - imports: FormStackProvider, Breadcrumbs, useFormStack
  - types: FormProps, OpenFormOptions (from 'geoform' or '../src/types')

EXAMPLE STRUCTURE:
  - examples/relational-forms/: Self-contained example directory
  - Can be run independently with Vite or similar bundler
  - Could add to package.json scripts for easy running

TYPESCRIPT:
  - Strict mode: All types explicit
  - Generics: FormProps<T> properly parameterized
  - Imports: Separate type imports with `import type`
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Verify TypeScript compiles all example files
npx tsc --noEmit examples/**/*.ts examples/**/*.tsx

# If using project tsconfig:
npm run type-check

# Expected: Zero errors
# Common fixes: Import FormProps from correct location, ensure generics match
```

### Level 2: Unit Tests (Component Validation)

```bash
# No unit tests required for examples - they serve as documentation
# However, verify example code compiles by running the build:
npm run build

# Expected: Build completes without errors
```

### Level 3: Integration Testing (Manual Validation)

```bash
# Option 1: Add example to Vite dev server
# Add to vite.config.ts or create examples/vite.config.ts

# Option 2: Verify via import in a test file
# Create a simple test that imports all example components:
# examples/relational-forms/__tests__/imports.test.ts

# Manual testing checklist:
# - [ ] Create Organization button opens OrganizationForm
# - [ ] Add Team opens TeamForm (child of OrganizationForm)
# - [ ] Add User opens UserForm (child of TeamForm)
# - [ ] Breadcrumbs show: "New Organization › Add Team › Add Team Member"
# - [ ] Cancel in UserForm returns to TeamForm
# - [ ] Submit in UserForm adds user to TeamForm's list
# - [ ] TeamForm state preserved (name, description still there)
# - [ ] Cancel with confirmOnCancel shows confirmation dialog
# - [ ] Submitting Organization shows it in the list
```

### Level 4: Documentation Validation

```bash
# Verify comments are educational and accurate
# Check that code examples in comments work

# Verify example demonstrates all key features:
# - [ ] FormProps<T> implementation (UserForm)
# - [ ] openForm async/await pattern (TeamForm, OrganizationForm)
# - [ ] State preservation (add users, open another form, users still there)
# - [ ] Promise<T | undefined> handling (if result check)
# - [ ] Breadcrumbs integration (App.tsx)
# - [ ] confirmOnCancel usage (OrganizationForm opening TeamForm)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All TypeScript types compile without errors
- [ ] Example files follow consistent naming conventions
- [ ] Imports use correct paths (library public API or relative)
- [ ] No unused imports or variables
- [ ] Code is properly formatted

### Feature Validation

- [ ] 3-level nesting works: Organization → Team → User
- [ ] State preservation: parent data survives child form open/close
- [ ] Promise resolution: submitted data returns to parent
- [ ] Promise cancellation: undefined returns on cancel
- [ ] Breadcrumbs show navigation path
- [ ] confirmOnCancel shows confirmation dialog

### Code Quality Validation

- [ ] Comments explain the "why" not just the "what"
- [ ] JSDoc on each form component explains its role
- [ ] Code follows existing codebase patterns
- [ ] Type definitions are strict and descriptive
- [ ] Example is self-contained and runnable

### Educational Value Validation

- [ ] A developer new to geoform could understand the pattern from the example
- [ ] Comments point out key library features
- [ ] Common gotchas are mentioned in comments
- [ ] Code can be copied and adapted for real use

---

## Anti-Patterns to Avoid

- **DON'T** import from internal library files (use public API)
- **DON'T** manually pass onSubmit/onCancel props to forms
- **DON'T** forget to check if result is undefined (user cancelled)
- **DON'T** use non-unique form IDs
- **DON'T** create overly complex examples - keep it understandable
- **DON'T** add external dependencies (keep example simple)
- **DON'T** skip TypeScript generics (they're the point of the example)
- **DON'T** forget to demonstrate state preservation (that's a key feature)

---

## Confidence Score

**9/10** - High confidence for one-pass implementation

**Rationale:**
- Clear 3-level hierarchy pattern with specific types defined
- Existing test forms (test-utils.tsx) provide working patterns to follow
- Complete code examples for each file provided
- Library API is well-documented and stable
- Scope is focused - just 5 files with clear responsibilities

**Risk Factors:**
- CSS styling not specified (can use minimal inline styles)
- Example bundler setup not specified (can document in comments)
- No tests for examples themselves (acceptable for documentation code)

---

## Quick Implementation Commands

```bash
# Create example directory
mkdir -p examples/relational-forms

# After implementation, verify types:
npx tsc --noEmit examples/relational-forms/*.ts examples/relational-forms/*.tsx

# Or use project type check:
npm run type-check

# Full build verification:
npm run build
```

---

## References

### Internal Documentation
- `src/index.ts` - Public API exports (lines 1-50)
- `src/types/form.ts` - FormProps<T> interface
- `src/types/stack.ts` - OpenFormOptions interface
- `src/__tests__/integration/test-utils.tsx` - Test form patterns
- `PRD.md` - Section 12 (Example Consumer Usage)

### External Documentation
- [React TypeScript Cheatsheet - Forms](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/forms_and_events/)
- [React Patterns - Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks)
