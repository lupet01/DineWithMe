"use server";

import { auth } from "@clerk/nextjs/server";
import { userRepository, auditLogger } from "@dinewithme/db";
import { revalidatePath } from "next/cache";
import { track } from "@dinewithme/analytics";
import { AnalyticsEvents } from "@dinewithme/analytics";
import { Role } from "@dinewithme/shared";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

const VALID_ROLES = new Set<string>(Object.values(Role));

/**
 * Update a user's role (PLATFORM_ADMIN only)
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: Role
): Promise<ActionResult> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get database user (the actor performing this action)
    const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check if user is PLATFORM_ADMIN
    if (dbUser.role !== Role.PLATFORM_ADMIN) {
      return { success: false, error: "Only platform admins can change user roles" };
    }

    // Validate the requested role is a real role
    if (!VALID_ROLES.has(newRole)) {
      return { success: false, error: "Invalid role" };
    }

    // Safety check: prevent a platform admin from demoting themselves out of
    // PLATFORM_ADMIN - this would lock them out of /admin/ops entirely.
    if (targetUserId === dbUser.id && newRole !== Role.PLATFORM_ADMIN) {
      return {
        success: false,
        error: "You cannot remove your own platform admin role",
      };
    }

    // Get target user
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    const previousRole = targetUser.role;

    // No-op if role is unchanged
    if (previousRole === newRole) {
      return { success: true };
    }

    // Update role
    await userRepository.updateRole(targetUserId, newRole);

    // Track analytics
    track(AnalyticsEvents.USER_ROLE_CHANGED, {
      targetUserId,
      targetEmail: targetUser.email,
      previousRole,
      newRole,
      changedBy: dbUser.id,
      changerEmail: dbUser.email,
      timestamp: new Date().toISOString(),
    });

    // Log audit trail
    await auditLogger.userRoleChanged(dbUser.id, targetUserId, {
      targetEmail: targetUser.email,
      previousRole,
      newRole,
    });

    // Revalidate pages
    revalidatePath("/admin/ops/users");

    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user role",
    };
  }
}
