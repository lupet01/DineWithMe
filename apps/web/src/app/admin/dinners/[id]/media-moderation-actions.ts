"use server";

import { auth } from "@clerk/nextjs/server";
import { actionFailure, type ActionResult, Role } from "@dinewithme/shared";
import { userRepository, dinnerMediaRepository } from "@dinewithme/db";
import { revalidatePath } from "next/cache";

async function requirePlatformAdmin() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: "Unauthorized" as const };
  }
  const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
  if (!dbUser || dbUser.role !== Role.PLATFORM_ADMIN) {
    return { error: "Only platform admins can moderate photos" as const };
  }
  return { user: dbUser };
}

/**
 * Approving reclassifies the table photo into a listing photo - it moves
 * from PAST_DINNER_HIGHLIGHT/PAST_DINNER_PRIVATE to DINNER_LISTING and gets
 * appended after any existing listing photos, rather than creating a
 * duplicate row, since promotionStatus already carries the audit trail of
 * "this was a promoted table photo."
 */
export async function approvePhotoPromotion(dinnerMediaId: string): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const item = await dinnerMediaRepository.findById(dinnerMediaId);
    if (!item) {
      return { success: false, error: "Photo not found" };
    }
    if (item.promotionStatus !== "PENDING") {
      return { success: false, error: "This photo is not awaiting review" };
    }

    const existingListing = await dinnerMediaRepository.findByDinner(item.dinnerId, "DINNER_LISTING");

    await dinnerMediaRepository.update(dinnerMediaId, {
      kind: "DINNER_LISTING",
      promotionStatus: "APPROVED",
      displayOrder: existingListing.length,
    });

    revalidatePath(`/admin/dinners/${item.dinnerId}`);
    revalidatePath("/discover");
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to approve photo");
  }
}

export async function rejectPhotoPromotion(dinnerMediaId: string): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const item = await dinnerMediaRepository.findById(dinnerMediaId);
    if (!item) {
      return { success: false, error: "Photo not found" };
    }
    if (item.promotionStatus !== "PENDING") {
      return { success: false, error: "This photo is not awaiting review" };
    }

    await dinnerMediaRepository.update(dinnerMediaId, { promotionStatus: "REJECTED" });

    revalidatePath(`/admin/dinners/${item.dinnerId}`);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to reject photo");
  }
}
