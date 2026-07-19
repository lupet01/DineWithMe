"use server";

import { auth } from "@clerk/nextjs/server";
import { userRepository, trustProfileRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}
