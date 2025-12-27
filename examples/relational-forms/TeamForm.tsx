import { useState } from 'react';
import type { FormProps } from '../../src';
import { useFormStack } from '../../src';
import type { NewTeam, NewUser, User } from './types';
import { UserForm } from './UserForm';

/**
 * TeamForm - Middle-level form for creating teams with members.
 *
 * This form demonstrates the core geoform pattern of nested forms:
 * - TeamForm is opened by OrganizationForm (its parent)
 * - TeamForm can open UserForm (its child) to add team members
 * - When UserForm closes, TeamForm receives the result and updates state
 *
 * Key concepts demonstrated:
 * - useFormStack() hook to access openForm action
 * - async/await pattern for opening child forms
 * - Promise<T | undefined> handling (undefined = cancelled)
 * - State preservation: team name/description persist while UserForm is open
 * - Managing a list of collected child form results
 *
 * State Preservation:
 * When UserForm is open, TeamForm remains mounted (but hidden).
 * All useState values (name, description, members) are preserved
 * automatically by React. This is a key feature of geoform's
 * stack-based architecture.
 */
export function TeamForm({ onSubmit, onCancel }: FormProps<NewTeam>) {
  // Get the openForm action from the form stack
  const { openForm } = useFormStack();

  // Form state - all preserved while child forms are open
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<User[]>([]);

  /**
   * Open UserForm to add a new team member.
   *
   * This demonstrates the async/await pattern that is central to geoform:
   * - openForm() pushes UserForm onto the stack and returns a Promise
   * - TeamForm stays mounted but hidden while UserForm is active
   * - When UserForm calls onSubmit(data), the Promise resolves with data
   * - When UserForm calls onCancel(), the Promise resolves with undefined
   */
  const handleAddUser = async () => {
    const newUser = await openForm<NewUser>({
      // Unique ID - using timestamp ensures uniqueness for multiple adds
      id: `add-user-${Date.now()}`,
      // The component to render - must implement FormProps<NewUser>
      component: UserForm,
      // Label shown in breadcrumbs: "Add Team > Add Team Member"
      label: 'Add Team Member',
    });

    // Handle the result - undefined means user cancelled
    if (newUser) {
      // User submitted - add to our members list with a generated ID
      const userWithId: User = {
        ...newUser,
        id: crypto.randomUUID(),
      };
      setMembers((prev) => [...prev, userWithId]);
    }
    // If newUser is undefined, user cancelled - no action needed
  };

  /**
   * Remove a member from the team.
   */
  const handleRemoveUser = (userId: string) => {
    setMembers((prev) => prev.filter((u) => u.id !== userId));
  };

  /**
   * Handle form submission.
   * Calls onSubmit with the team data including all added members.
   */
  const handleSubmit = () => {
    if (!name.trim()) {
      return;
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
          autoFocus
        />
      </div>

      <div className="field">
        <label htmlFor="team-description">Description</label>
        <textarea
          id="team-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter team description"
          rows={3}
        />
      </div>

      {/* Team Members Section - shows collected child form results */}
      <div className="section">
        <h3>Team Members ({members.length})</h3>

        {members.length > 0 ? (
          <ul className="member-list">
            {members.map((user) => (
              <li key={user.id}>
                <span>
                  {user.name} ({user.email}) - {user.role}
                </span>
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

        {/* Opens UserForm as a child - demonstrates nested form opening */}
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
