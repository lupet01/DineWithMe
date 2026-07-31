"use server";

import { restaurantRepository } from "@dinewithme/db";
import { requireAuthUser } from "@/lib/auth/server";

/**
 * Marks the "You're Live!" Dashboard moment as seen. Membership-checked
 * (owner or manager) so a restaurant admin can only ever clear their own
 * restaurant's flag.
 */
export async function markLiveMomentSeen(restaurantId: string): Promise<void> {
  const user = await requireAuthUser();
  const membership = await restaurantRepository.getUserRole(restaurantId, user.id);
  if (!membership) return;

  await restaurantRepository.markLiveMomentSeen(restaurantId);
}
