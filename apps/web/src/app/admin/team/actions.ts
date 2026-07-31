"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { restaurantRepository, teamInviteRepository, userRepository } from "@dinewithme/db";
import { emailService } from "@dinewithme/email";
import { requireAuthUser } from "@/lib/auth/server";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

const INVITE_EXPIRY_DAYS = 7;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireOwner(restaurantId: string) {
  const user = await requireAuthUser();
  const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);
  if (!isOwner) {
    return { error: "Only the restaurant owner can manage the team" as const };
  }
  return { user };
}

export async function inviteMember(
  restaurantId: string,
  email: string,
  role: "OWNER" | "MANAGER"
): Promise<ActionResult> {
  const authResult = await requireOwner(restaurantId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return { success: false, error: "Enter a valid email address" };
  }

  try {
    const existingUser = await userRepository.findByEmail(trimmedEmail);
    if (existingUser) {
      const alreadyMember = await restaurantRepository.getUserRole(restaurantId, existingUser.id);
      if (alreadyMember) {
        return { success: false, error: "This person is already on your team" };
      }
    }

    const activeInvite = await teamInviteRepository.findActiveByEmail(trimmedEmail, restaurantId);
    if (activeInvite) {
      return { success: false, error: "There's already a pending invite for this email" };
    }

    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await teamInviteRepository.create({
      email: trimmedEmail,
      restaurant: { connect: { id: restaurantId } },
      role,
      token,
      expiresAt,
      invitedBy: { connect: { id: authResult.user.id } },
    });

    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/invite/${token}`;
    await emailService.sendTeamInvite({
      inviteeEmail: trimmedEmail,
      inviterName: `${authResult.user.firstName ?? ""} ${authResult.user.lastName ?? ""}`.trim() || "A DineWithMe team member",
      restaurantName: restaurant.name,
      role,
      acceptUrl,
      expiresAt: expiresAt.toLocaleDateString("en-ZA", { month: "long", day: "numeric", year: "numeric" }),
    });

    revalidatePath("/admin/team");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send invite",
    };
  }
}

export async function revokeInvite(restaurantId: string, inviteId: string): Promise<ActionResult> {
  const authResult = await requireOwner(restaurantId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const invite = await teamInviteRepository.findById(inviteId);
    if (!invite || invite.restaurantId !== restaurantId) {
      return { success: false, error: "Invite not found" };
    }

    await teamInviteRepository.update(inviteId, { status: "REVOKED" });
    revalidatePath("/admin/team");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to revoke invite",
    };
  }
}

export async function removeMember(restaurantId: string, memberUserId: string): Promise<ActionResult> {
  const authResult = await requireOwner(restaurantId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    await restaurantRepository.removeMember(restaurantId, memberUserId);
    revalidatePath("/admin/team");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove team member",
    };
  }
}
