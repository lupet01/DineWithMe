import { redirect } from "next/navigation";
import { Role } from "@dinewithme/shared";
import { getOrSyncUser, getAuthenticatedUser, hasRole, type AuthUser } from "./core";

/**
 * Get authenticated user for server components
 * Returns null if not authenticated or not found in database
 * Uses cached version to avoid duplicate queries
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  return getAuthenticatedUser();
}

/**
 * Backwards compatibility alias for getAuthUser
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  return getAuthenticatedUser();
}

/**
 * Get or auto-sync user for server components
 * Auto-syncs from Clerk if user not found in database
 * Uses cached version to avoid duplicate queries
 */
export async function getOrCreateAuthUser(): Promise<AuthUser | null> {
  return getOrSyncUser();
}

/**
 * Require authenticated user for server components
 * Redirects to sign-in if not authenticated
 */
export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

/**
 * Require user to have one of the specified roles for server components
 * Redirects to unauthorized page if user doesn't have required role
 */
export async function requireUserRole(
  allowedRoles: Role[],
  unauthorizedRedirect = "/app/unauthorized"
): Promise<AuthUser> {
  const user = await getOrCreateAuthUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!hasRole(user, allowedRoles)) {
    redirect(unauthorizedRedirect);
  }

  return user;
}

/**
 * Check if current user has required role (non-throwing)
 * Returns false if not authenticated or doesn't have role
 */
export async function checkUserRole(allowedRoles: Role[]): Promise<boolean> {
  const user = await getAuthUser();

  if (!user) {
    return false;
  }

  return hasRole(user, allowedRoles);
}
