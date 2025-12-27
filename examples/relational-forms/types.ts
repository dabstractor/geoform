/**
 * Type definitions for the Relational Forms example.
 *
 * This file defines a 3-level entity hierarchy:
 * Organization -> Team -> User
 *
 * Each level demonstrates how to structure TypeScript interfaces
 * for use with geoform's FormProps<T> generic.
 */

/**
 * User data structure - leaf node in the hierarchy.
 *
 * Users are the simplest entity: they have no children,
 * making them ideal for demonstrating a basic FormProps<T> implementation.
 */
export interface User {
  /** Unique identifier - generated when user is created */
  id: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** User's role within the team */
  role: 'admin' | 'member' | 'viewer';
}

/**
 * Team data structure - middle node containing users.
 *
 * Teams demonstrate parent-child relationships: a team can open
 * UserForm to add members, collecting results via Promise<T>.
 */
export interface Team {
  /** Unique identifier - generated when team is created */
  id: string;
  /** Team name */
  name: string;
  /** Optional team description */
  description: string;
  /** Team members - populated by opening UserForm for each */
  members: User[];
}

/**
 * Organization data structure - top-level node containing teams.
 *
 * Organizations are the root of our hierarchy. They open TeamForm
 * to add teams, which in turn can open UserForm to add users.
 * This demonstrates the full 3-level nesting capability.
 */
export interface Organization {
  /** Unique identifier - generated when organization is created */
  id: string;
  /** Organization name */
  name: string;
  /** Industry sector */
  industry: string;
  /** Organization's teams - each team contains its members */
  teams: Team[];
}

/**
 * Form input type for creating new users.
 * Excludes 'id' since it's generated on submission.
 *
 * Use this as the type parameter for UserForm:
 * `FormProps<NewUser>`
 */
export type NewUser = Omit<User, 'id'>;

/**
 * Form input type for creating new teams.
 * Excludes 'id' since it's generated on submission.
 *
 * Note: members array contains full User objects (with IDs)
 * because users are created with IDs when added to the team.
 *
 * Use this as the type parameter for TeamForm:
 * `FormProps<NewTeam>`
 */
export type NewTeam = Omit<Team, 'id'>;

/**
 * Form input type for creating new organizations.
 * Excludes 'id' since it's generated on submission.
 *
 * Note: teams array contains full Team objects (with IDs)
 * because teams are created with IDs when added to the organization.
 *
 * Use this as the type parameter for OrganizationForm:
 * `FormProps<NewOrganization>`
 */
export type NewOrganization = Omit<Organization, 'id'>;
