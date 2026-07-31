"use server";

import { teamInviteRepository, restaurantRepository, userRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { requireAuthUser } from "@/lib/auth/server";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Accepts a TeamInvite for the currently signed-in user. Works for both
 * shapes: restaurantId set (adds a RestaurantMember) or null (grants
 * Role.PLATFORM_ADMIN). The invite's email must match the signed-in
 * user's real email - an invite grants access to whoever it was sent to,
 * not whoever happens to click the link.
 */
export async function acceptInvite(token: string): Promise<ActionResult<{ redirectTo: string }>> {
  const user = await requireAuthUser();

  const invite = await teamInviteRepository.findByToken(token);
  if (!invite) {
    return { success: false, error: "This invite link is invalid" };
  }
  if (invite.status !== "PENDING") {
    return { success: false, error: "This invite has already been used or revoked" };
  }
  if (invite.expiresAt < new Date()) {
    await teamInviteRepository.update(invite.id, { status: "EXPIRED" });
    return { success: false, error: "This invite has expired" };
  }
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return {
      success: false,
      error: `This invite was sent to ${invite.email}, but you're signed in as ${user.email}.`,
    };
  }

  if (invite.restaurantId) {
    const role = invite.role === "OWNER" ? "OWNER" : "MANAGER";
    await restaurantRepository.addMember(invite.restaurantId, user.id, role);
  } else {
    await userRepository.updateRole(user.id, Role.PLATFORM_ADMIN);
  }

  await teamInviteRepository.update(invite.id, { status: "ACCEPTED", acceptedAt: new Date() });

  return {
    success: true,
    data: { redirectTo: invite.restaurantId ? "/admin/restaurant" : "/admin/ops" },
  };
}

/**
 * Declines a TeamInvite - no RestaurantMember/role change happens, the
 * invite is just marked so the link shows a clear terminal state instead
 * of staying PENDING forever with no way to say "no thanks." Does not
 * require the decliner to already be signed in as the invited email -
 * declining isn't a privileged action the way accepting is.
 */
export async function declineInvite(token: string): Promise<ActionResult> {
  const invite = await teamInviteRepository.findByToken(token);
  if (!invite) {
    return { success: false, error: "This invite link is invalid" };
  }
  if (invite.status !== "PENDING") {
    return { success: false, error: "This invite has already been used or revoked" };
  }

  await teamInviteRepository.update(invite.id, { status: "DECLINED" });

  return { success: true };
}
