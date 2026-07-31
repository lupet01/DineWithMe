"use server";

import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { userRepository, teamInviteRepository } from "@dinewithme/db";
import { emailService } from "@dinewithme/email";
import { Role } from "@dinewithme/shared";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

const INVITE_EXPIRY_DAYS = 7;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requirePlatformAdmin() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: "Unauthorized" as const };
  }
  const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
  if (!dbUser || dbUser.role !== Role.PLATFORM_ADMIN) {
    return { error: "Only platform admins can manage the platform team" as const };
  }
  return { user: dbUser };
}

/**
 * Invites a genuinely new hire to become a platform admin - no
 * RestaurantMember row involved, since PLATFORM_ADMIN isn't
 * restaurant-scoped. The existing RoleSelect dropdown (ops/users/[id])
 * stays available as a lighter-weight alternative for promoting someone
 * who already has an account; this is for someone who doesn't yet.
 */
export async function invitePlatformMember(email: string): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return { success: false, error: "Enter a valid email address" };
  }

  try {
    const existingUser = await userRepository.findByEmail(trimmedEmail);
    if (existingUser?.role === Role.PLATFORM_ADMIN) {
      return { success: false, error: "This person is already a platform admin" };
    }

    const activeInvite = await teamInviteRepository.findActiveByEmail(trimmedEmail, null);
    if (activeInvite) {
      return { success: false, error: "There's already a pending invite for this email" };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await teamInviteRepository.create({
      email: trimmedEmail,
      role: "PLATFORM_ADMIN",
      token,
      expiresAt,
      invitedBy: { connect: { id: authResult.user.id } },
    });

    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/invite/${token}`;
    await emailService.sendTeamInvite({
      inviteeEmail: trimmedEmail,
      inviterName: `${authResult.user.firstName ?? ""} ${authResult.user.lastName ?? ""}`.trim() || "A DineWithMe platform admin",
      role: "PLATFORM_ADMIN",
      acceptUrl,
      expiresAt: expiresAt.toLocaleDateString("en-ZA", { month: "long", day: "numeric", year: "numeric" }),
    });

    revalidatePath("/admin/ops/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send invite",
    };
  }
}

export async function revokePlatformInvite(inviteId: string): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const invite = await teamInviteRepository.findById(inviteId);
    if (!invite || invite.restaurantId !== null) {
      return { success: false, error: "Invite not found" };
    }

    await teamInviteRepository.update(inviteId, { status: "REVOKED" });
    revalidatePath("/admin/ops/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke invite",
    };
  }
}
