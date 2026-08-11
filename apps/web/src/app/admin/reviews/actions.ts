"use server";

import { revalidatePath } from "next/cache";
import { feedbackRepository, dinnerRepository, restaurantRepository } from "@dinewithme/db";
import { requireAuthUser } from "@/lib/auth/server";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

async function requireOwnerForFeedback(feedbackId: string) {
  const feedback = await feedbackRepository.findById(feedbackId);
  if (!feedback) {
    return { error: "Review not found" as const };
  }
  const dinner = await dinnerRepository.findById(feedback.dinnerId);
  if (!dinner) {
    return { error: "Review not found" as const };
  }
  const user = await requireAuthUser();
  const isOwner = await restaurantRepository.isUserOwner(dinner.restaurantId, user.id);
  if (!isOwner) {
    return { error: "You do not have permission to manage reviews for this restaurant" as const };
  }
  return { restaurantId: dinner.restaurantId };
}

/**
 * Set or clear the restaurant's private note on a guest's review. Internal
 * only - never shown to the guest, never part of the diner-facing feedback
 * record.
 */
export async function setReviewNote(feedbackId: string, note: string): Promise<ActionResult> {
  try {
    const authResult = await requireOwnerForFeedback(feedbackId);
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

    const trimmed = note.trim();
    const ok = await feedbackRepository.setRestaurantNote(
      feedbackId,
      authResult.restaurantId,
      trimmed || null
    );
    if (!ok) {
      return { success: false, error: "Review not found" };
    }

    revalidatePath("/admin/reviews");
    return { success: true };
  } catch (error) {
    console.error("[Reviews] Error saving review note:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save note",
    };
  }
}
