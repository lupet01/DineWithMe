"use server";

import {
  restaurantRepository,
  dinnerRepository,
  dinnerMediaRepository,
  mediaAssetRepository,
} from "@dinewithme/db";
import { actionFailure, type ActionResult } from "@dinewithme/shared";
import { getStorage } from "@dinewithme/storage";
import { requireAuthUser } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";

const ALLOWED_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

async function requireDinnerOwner(dinnerId: string) {
  const dinner = await dinnerRepository.findById(dinnerId);
  if (!dinner) {
    return { error: "Dinner not found" as const };
  }
  const user = await requireAuthUser();
  const isOwner = await restaurantRepository.isUserOwner(dinner.restaurantId, user.id);
  if (!isOwner) {
    return { error: "You do not have permission to manage photos for this dinner" as const };
  }
  return { user, restaurantId: dinner.restaurantId };
}

/**
 * Table Photos are photos of the actual dinner, taken and uploaded after the
 * fact - unlike Listing Photos (picked from the restaurant's curated Media
 * Library pool), these are fresh uploads scoped to one specific dinner, so
 * they get their own MediaAsset rather than being drawn from the pool.
 */
export async function getTablePhotos(
  dinnerId: string
): Promise<ActionResult<{
  photos: Array<{
    id: string;
    mediaAssetId: string;
    url: string;
    promotionStatus: string;
  }>;
}>> {
  const authResult = await requireDinnerOwner(dinnerId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const listing = await dinnerMediaRepository.findByDinner(dinnerId, "DINNER_LISTING");
    const listingIds = new Set(listing.map((item) => item.id));
    const all = await dinnerMediaRepository.findByDinner(dinnerId);

    return {
      success: true,
      data: {
        photos: all
          .filter((item) => !listingIds.has(item.id))
          .map((item) => ({
            id: item.id,
            mediaAssetId: item.mediaAsset.id,
            url: item.mediaAsset.url,
            promotionStatus: item.promotionStatus,
          })),
      },
    };
  } catch (error) {
    return actionFailure(error, "Failed to load table photos");
  }
}

export async function requestTablePhotoUploadUrl(
  dinnerId: string,
  filename: string,
  contentType: string
): Promise<ActionResult<{ uploadUrl: string; key: string; publicUrl: string }>> {
  const authResult = await requireDinnerOwner(dinnerId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  if (!ALLOWED_IMAGE_CONTENT_TYPES.includes(contentType)) {
    return { success: false, error: "Unsupported file type. Upload a JPG, PNG, or WEBP." };
  }

  try {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `restaurants/${authResult.restaurantId}/dinners/${dinnerId}/table-photos/${timestamp}-${sanitized}`;

    const storage = getStorage();
    const signature = await storage.getSignedUploadUrl(key, contentType, 3600);

    return {
      success: true,
      data: {
        uploadUrl: signature.url,
        key: signature.key,
        publicUrl: storage.getPublicUrl(key),
      },
    };
  } catch (error) {
    return actionFailure(error, "Failed to prepare upload");
  }
}

export async function saveTablePhoto(
  dinnerId: string,
  key: string,
  url: string
): Promise<ActionResult<{ dinnerMediaId: string }>> {
  const authResult = await requireDinnerOwner(dinnerId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const mediaAsset = await mediaAssetRepository.create({
      restaurant: { connect: { id: authResult.restaurantId } },
      url,
      key,
    });

    const dinnerMedia = await dinnerMediaRepository.create({
      dinner: { connect: { id: dinnerId } },
      mediaAsset: { connect: { id: mediaAsset.id } },
      kind: "PAST_DINNER_HIGHLIGHT",
    });

    revalidatePath(`/admin/dinners/${dinnerId}`);

    return { success: true, data: { dinnerMediaId: dinnerMedia.id } };
  } catch (error) {
    return actionFailure(error, "Failed to save photo");
  }
}

export async function deleteTablePhoto(dinnerId: string, mediaAssetId: string): Promise<ActionResult> {
  const authResult = await requireDinnerOwner(dinnerId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const mediaAsset = await mediaAssetRepository.findById(mediaAssetId);
    if (!mediaAsset || mediaAsset.restaurantId !== authResult.restaurantId) {
      return { success: false, error: "Photo not found" };
    }

    const storage = getStorage();
    await storage.deleteObject(mediaAsset.key);

    // Deletes the DinnerMedia row too via onDelete: Cascade on MediaAsset
    await mediaAssetRepository.delete(mediaAssetId);

    revalidatePath(`/admin/dinners/${dinnerId}`);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete photo");
  }
}

/**
 * A restaurant admin nominates one of their table photos to become a
 * listing photo. This only flips promotionStatus to PENDING - the row stays
 * a table photo (kind unchanged) until a platform admin approves it, at
 * which point it's reclassified to DINNER_LISTING.
 */
export async function requestListingPromotion(dinnerId: string, dinnerMediaId: string): Promise<ActionResult> {
  const authResult = await requireDinnerOwner(dinnerId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const item = await dinnerMediaRepository.findById(dinnerMediaId);
    if (!item || item.dinnerId !== dinnerId) {
      return { success: false, error: "Photo not found" };
    }
    if (item.promotionStatus === "PENDING") {
      return { success: false, error: "This photo is already awaiting review" };
    }

    await dinnerMediaRepository.update(dinnerMediaId, { promotionStatus: "PENDING" });

    revalidatePath(`/admin/dinners/${dinnerId}`);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to request promotion");
  }
}
