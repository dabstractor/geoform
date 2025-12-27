import { useState } from 'react';
import type { FormProps } from '../../src';
import { useFormStack } from '../../src';
import type { NewOrganization, NewTeam, Team } from './types';
import { TeamForm } from './TeamForm';

/**
 * OrganizationForm - Top-level form for creating organizations with teams.
 *
 * This is the root of our 3-level form hierarchy:
 * OrganizationForm -> TeamForm -> UserForm
 *
 * This form demonstrates the complete geoform pattern:
 * - Opening TeamForm to add teams (which can in turn open UserForm)
 * - Using confirmOnCancel to protect against accidental data loss
 * - Displaying nested data (teams with their members)
 * - State preservation across multiple levels of nesting
 *
 * Key concepts demonstrated:
 * - confirmOnCancel option: shows "Discard changes?" dialog
 * - Deeply nested data collection: teams contain users
 * - Aggregate calculations: total members across teams
 * - Complex state management preserved during child form navigation
 *
 * confirmOnCancel Feature:
 * When opening TeamForm with confirmOnCancel: true, if the user
 * tries to cancel (via breadcrumb click or cancel button), they'll
 * see a confirmation dialog asking if they want to discard changes.
 * This is useful for forms where users have invested time entering data.
 */
export function OrganizationForm({ onSubmit, onCancel }: FormProps<NewOrganization>) {
  const { openForm } = useFormStack();

  // Form state - all preserved while TeamForm (and nested UserForm) are open
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);

  /**
   * Open TeamForm to add a new team.
   *
   * Note the confirmOnCancel: true option - this demonstrates the
   * confirmation dialog feature. When the user tries to cancel TeamForm
   * (or its children), they'll be prompted to confirm discarding changes.
   */
  const handleAddTeam = async () => {
    const newTeam = await openForm<NewTeam>({
      id: `add-team-${Date.now()}`,
      component: TeamForm,
      label: 'Add Team',
      // Show confirmation dialog when user tries to cancel this form
      // This is useful because teams can have many users, so cancelling
      // could mean losing significant data entry work
      confirmOnCancel: true,
    });

    if (newTeam) {
      // Team submitted - includes all users added via UserForm
      const teamWithId: Team = {
        ...newTeam,
        id: crypto.randomUUID(),
      };
      setTeams((prev) => [...prev, teamWithId]);
    }
  };

  /**
   * Remove a team from the organization.
   */
  const handleRemoveTeam = (teamId: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  /**
   * Handle form submission.
   * Calls onSubmit with the complete organization data including
   * all teams and their nested users.
   */
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

  // Calculate aggregate stats for display
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
          autoFocus
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

      {/* Teams Section - shows teams with nested member data */}
      <div className="section">
        <h3>
          Teams ({teams.length}) - {totalMembers} total members
        </h3>

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
                {/* Show nested member data collected via UserForm */}
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

        {/* Opens TeamForm with confirmOnCancel enabled */}
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
