import { useState } from 'react';
import type { FormProps } from '../../src';
import type { NewUser } from './types';

/**
 * UserForm - Leaf-level form for creating team members.
 *
 * This is the simplest form in the hierarchy, demonstrating the core
 * geoform pattern: receive `onSubmit` and `onCancel` callbacks via
 * FormProps<T>, manage local state with useState, and call the
 * appropriate callback when the user completes the form.
 *
 * Key concepts demonstrated:
 * - FormProps<NewUser> typing for type-safe form data
 * - useState for form field state management
 * - Calling onSubmit(data) to resolve the parent's openForm() promise
 * - Calling onCancel() to resolve the promise with undefined
 *
 * @example
 * // UserForm is opened from TeamForm like this:
 * const newUser = await openForm<NewUser>({
 *   id: 'add-user',
 *   component: UserForm,
 *   label: 'Add Team Member',
 * });
 *
 * if (newUser) {
 *   // User submitted - add to team
 *   setMembers([...members, { ...newUser, id: crypto.randomUUID() }]);
 * }
 * // If newUser is undefined, user cancelled - no action needed
 */
export function UserForm({ onSubmit, onCancel }: FormProps<NewUser>) {
  // Form field state - preserved automatically by React
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');

  /**
   * Handle form submission.
   * Validates required fields, then calls onSubmit with the typed data.
   * This resolves the Promise returned by the parent's openForm() call.
   */
  const handleSubmit = () => {
    // Basic validation - could be expanded with error display
    if (!name.trim() || !email.trim()) {
      return;
    }

    // Call onSubmit with the form data
    // The parent's `await openForm()` will receive this value
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      role,
    });
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
          autoFocus
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
        {/* Cancel calls onCancel, resolving parent's promise with undefined */}
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        {/* Submit calls onSubmit with data, resolving parent's promise with the value */}
        <button type="button" onClick={handleSubmit}>
          Add User
        </button>
      </div>
    </div>
  );
}
