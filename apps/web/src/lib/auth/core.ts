import { auth, currentUser } from "@clerk/nextjs/server";
import { userRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { cache } from "react";

/**
 * Authenticated user with role information
 */
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
 * Get current authenticated user from database with caching
 * Returns null if not authenticated or not found in database
 * 
 * Uses React cache() to deduplicate requests within the same render cycle
 */
export const getAuthenticatedUser = cache(async (): Promise<AuthUser | null> => {
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
    console.error("[Auth] Error getting authenticated user:", error);
    return null;
  }
});

/**
 * Get or sync user from Clerk to database
 * Auto-syncs user if not found in database
 * 
 * Uses React cache() to deduplicate requests within the same render cycle
 */
export const getOrSyncUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    // Try to get user from database first
    let dbUser = await userRepository.findByAuthProviderId(userId);

    // If not found, auto-sync from Clerk
    if (!dbUser) {
      const clerkUser = await currentUser();
      
      if (!clerkUser) {
        return null;
      }

      // Validate email exists
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) {
        console.error("[Auth] Clerk user missing email address");
        return null;
      }

      dbUser = await userRepository.upsertByAuthProviderId(userId, {
        authProviderId: userId,
        email,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        avatarUrl: clerkUser.imageUrl || null,
        status: "active",
      });
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
    console.error("[Auth] Error getting or syncing user:", error);
    return null;
  }
});

/**
 * Check if user has one of the required roles
 */
export function hasRole(user: AuthUser, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Validate role at runtime (type-safe)
 */
export function validateRole(role: string): role is Role {
  return Object.values(Role).includes(role as Role);
}
