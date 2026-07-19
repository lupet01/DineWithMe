import { auth } from "@clerk/nextjs/server";
import { userRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  role: Role;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

/**
 * Get authenticated user with role from database
 * Returns null if not authenticated or user not found in DB
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    // Get user from database by Clerk ID
    const dbUser = await userRepository.findByAuthProviderId(userId);

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      clerkId: dbUser.authProviderId,
      email: dbUser.email,
      role: dbUser.role as Role,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      avatarUrl: dbUser.avatarUrl,
    };
  } catch (error) {
    console.error("Error getting auth user:", error);
    return null;
  }
}

/**
 * Require authenticated user with role
 * Throws error if not authenticated or user not in DB
 */
export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  
  if (!user) {
    throw new Error("Unauthorized: User not found");
  }

  return user;
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Require user to have one of the specified roles
 * Throws error if user doesn't have required role
 */
export async function requireRole(allowedRoles: Role[]): Promise<AuthUser> {
  const user = await requireAuthUser();
  
  if (!hasRole(user, allowedRoles)) {
    throw new Error(`Forbidden: Requires one of roles: ${allowedRoles.join(", ")}`);
  }

  return user;
}
