"use server";

import { restaurantRepository, seatRepository } from "@dinewithme/db";
import { requireAuthUser } from "@/lib/auth/server";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface GuestQuickViewData {
  userId: string;
  dinnersCount: number;
  attendedCount: number;
  dietaryNotes: string | null;
}

/**
 * Restaurant-admin-facing guest summary — deliberately gated: no trust
 * score, payment history, or safety-report data, enforced by simply never
 * querying those tables here. Scoped by (userId, restaurantId) together via
 * seatRepository.findByUserAndRestaurant, so it's structurally incapable of
 * returning another restaurant's data for this guest.
 */
export async function getGuestQuickView(
  userId: string,
  restaurantId: string
): Promise<ActionResult<GuestQuickViewData>> {
  try {
    const user = await requireAuthUser();

    const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);
    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to view guests for this restaurant",
      };
    }

    const seats = await seatRepository.findByUserAndRestaurant(userId, restaurantId);

    const attendedCount = seats.filter(
      (seat) => seat.status === "ATTENDED" || seat.status === "COMPLETED"
    ).length;
    const dietaryNotes = seats.find((seat) => seat.dietaryNotes)?.dietaryNotes ?? null;

    return {
      success: true,
      data: {
        userId,
        dinnersCount: seats.length,
        attendedCount,
        dietaryNotes,
      },
    };
  } catch {
    return { success: false, error: "Failed to load guest details" };
  }
}
