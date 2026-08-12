"use server";

import { auth } from "@clerk/nextjs/server";
import { userRepository, trustProfileRepository, auditLogger } from "@dinewithme/db";
import { Role, actionFailure, type ActionResult } from "@dinewithme/shared";
import { revalidatePath } from "next/cache";
import { track, AnalyticsEvents } from "@dinewithme/analytics";


async function requirePlatformAdmin() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: "Unauthorized" as const };
  }
  const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
  if (!dbUser || dbUser.role !== Role.PLATFORM_ADMIN) {
    return { error: "Only platform admins can flag users" as const };
  }
  return { dbUser };
}

export async function setUserFlagged(userId: string, flagged: boolean): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    if (flagged) {
      await trustProfileRepository.flagUser(userId);
    } else {
      await trustProfileRepository.unflagUser(userId);
    }
    revalidatePath(`/admin/ops/users/${userId}`);
    revalidatePath("/admin/ops/users");
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to update user");
  }
}

export async function updateUserRole(targetUserId: string, newRole: Role): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }
  const { dbUser } = authResult;

  // A platform admin demoting themselves would lock them out of /admin/ops.
  if (targetUserId === dbUser.id && newRole !== Role.PLATFORM_ADMIN) {
    return { success: false, error: "You cannot remove your own platform admin role" };
  }

  try {
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    const previousRole = targetUser.role;
    if (previousRole === newRole) {
      return { success: true };
    }

    await userRepository.updateRole(targetUserId, newRole);

    await track(AnalyticsEvents.USER_ROLE_CHANGED, {
      targetUserId,
      targetEmail: targetUser.email,
      previousRole,
      newRole,
      changedBy: dbUser.id,
      changerEmail: dbUser.email,
      timestamp: new Date().toISOString(),
    });

    await auditLogger.userRoleChanged(dbUser.id, targetUserId, {
      targetEmail: targetUser.email,
      previousRole,
      newRole,
    });

    revalidatePath(`/admin/ops/users/${targetUserId}`);
    revalidatePath("/admin/ops/users");
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to update user role");
  }
}
