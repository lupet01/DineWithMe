import { Role } from "./roles";
import { Action } from "./actions";

// User type for permission checks
export interface UserWithRole {
  id: string;
  role: Role;
  email?: string;
}

// Permission matrix: which roles can perform which actions
const PERMISSIONS: Record<Action, Role[]> = {
  // User actions - all roles
  [Action.VIEW_PROFILE]: [Role.DINER, Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
  [Action.EDIT_PROFILE]: [Role.DINER, Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
  [Action.DELETE_ACCOUNT]: [Role.DINER, Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],

  // Dinner actions - all roles
  [Action.CREATE_DINNER]: [Role.DINER, Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
  [Action.EDIT_DINNER]: [Role.DINER, Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
  [Action.DELETE_DINNER]: [Role.DINER, Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
  [Action.JOIN_DINNER]: [Role.DINER, Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
  [Action.LEAVE_DINNER]: [Role.DINER, Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],

  // Restaurant actions - restaurant admins and platform admins
  [Action.CREATE_RESTAURANT]: [Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
  [Action.EDIT_RESTAURANT]: [Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
  [Action.DELETE_RESTAURANT]: [Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
  [Action.VIEW_RESTAURANT_ANALYTICS]: [Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],

  // Platform admin actions - platform admins only
  [Action.VIEW_ADMIN_PANEL]: [Role.PLATFORM_ADMIN],
  [Action.MANAGE_USERS]: [Role.PLATFORM_ADMIN],
  [Action.MANAGE_RESTAURANTS]: [Role.PLATFORM_ADMIN],
  [Action.VIEW_PLATFORM_ANALYTICS]: [Role.PLATFORM_ADMIN],
  [Action.ASSIGN_ROLES]: [Role.PLATFORM_ADMIN],
};

/**
 * Check if user can perform a specific action
 */
export function canPerform(action: Action, user: UserWithRole): boolean {
  const allowedRoles = PERMISSIONS[action];
  return allowedRoles.includes(user.role);
}

/**
 * Check if user can access admin panel
 */
export function canAccessAdmin(user: UserWithRole): boolean {
  return user.role === Role.PLATFORM_ADMIN;
}

/**
 * Check if user can access restaurant portal
 */
export function canAccessRestaurantPortal(user: UserWithRole): boolean {
  return user.role === Role.RESTAURANT_ADMIN || user.role === Role.PLATFORM_ADMIN;
}

/**
 * Check if user is a diner
 */
export function isDiner(user: UserWithRole): boolean {
  return user.role === Role.DINER;
}

/**
 * Check if user is a restaurant admin
 */
export function isRestaurantAdmin(user: UserWithRole): boolean {
  return user.role === Role.RESTAURANT_ADMIN;
}

/**
 * Check if user is a platform admin
 */
export function isPlatformAdmin(user: UserWithRole): boolean {
  return user.role === Role.PLATFORM_ADMIN;
}

/**
 * Get all actions a user can perform
 */
export function getUserPermissions(user: UserWithRole): Action[] {
  return Object.entries(PERMISSIONS)
    .filter(([_, roles]) => roles.includes(user.role))
    .map(([action]) => action as Action);
}
