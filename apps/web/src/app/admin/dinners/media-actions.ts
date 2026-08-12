"use server";

import {
  restaurantRepository,
  restaurantGalleryItemRepository,
  dinnerRepository,
  dinnerMediaRepository,
  mediaAssetRepository,
} from "@dinewithme/db";
import { requireAuthUser } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

async function requireOwner(restaurantId: string) {
  const user = await requireAuthUser();
  const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);
  if (!isOwner) {
    return { error: "You do not have permission to manage this restaurant's dinners" as const };
  }
  return { user };
}

/**
 * Listing photos are picked from the restaurant's existing Media Library
 * pool, not uploaded fresh here - a dinner doesn't exist yet during Create
 * Dinner, so there's nowhere to attach a brand-new upload to until the
 * dinner is saved. Picking from the pool sidesteps that ordering problem
 * entirely and avoids duplicate uploads of the same photo.
 */
export async function getRestaurantPhotoPool(
  restaurantId: string
): Promise<ActionResult<{ photos: Array<{ id: string; url: string; caption: string | null }> }>> {
  const authResult = await requireOwner(restaurantId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const items = await restaurantGalleryItemRepository.findByRestaurant(restaurantId);
    return {
      success: true,
      data: {
        photos: items.map((item) => ({
          id: item.mediaAsset.id,
          url: item.mediaAsset.url,
          caption: item.mediaAsset.caption,
        })),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load photos",
    };
  }
}

async function requireDinnerOwner(dinnerId: string) {
  const dinner = await dinnerRepository.findById(dinnerId);
  if (!dinner) {
    return { error: "Dinner not found" as const };
  }
  const authResult = await requireOwner(dinner.restaurantId);
  if ("error" in authResult) {
    return { error: authResult.error };
  }
  return { user: authResult.user, restaurantId: dinner.restaurantId };
}

/**
 * Replaces this dinner's full set of listing photos in one call - simpler
 * and less error-prone than diffing add/remove/reorder against whatever
 * was there before, and Create Dinner / the Listing Photos editor only
 * ever need to save "here is the current full set" anyway.
 * mediaAssetIds[0] becomes the header photo (displayOrder 0), matching the
 * §16.21 convention that the header photo is just the first listing photo.
 */
export async function saveDinnerListingPhotos(
  dinnerId: string,
  mediaAssetIds: string[]
): Promise<ActionResult> {
  const authResult = await requireDinnerOwner(dinnerId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    // Re-scope the child media assets to the authorized restaurant: every id
    // being connected must be one of this restaurant's own assets. Without
    // this, dinner ownership alone would let an owner attach another
    // restaurant's media asset by id.
    if (mediaAssetIds.length > 0) {
      const ownedAssets = await mediaAssetRepository.findByRestaurant(authResult.restaurantId);
      const ownedIds = new Set(ownedAssets.map((a) => a.id));
      if (mediaAssetIds.some((id) => !ownedIds.has(id))) {
        return { success: false, error: "One or more photos don't belong to this restaurant" };
      }
    }

    const existing = await dinnerMediaRepository.findByDinner(dinnerId, "DINNER_LISTING");

    await Promise.all(existing.map((item) => dinnerMediaRepository.delete(item.id)));

    await Promise.all(
      mediaAssetIds.map((mediaAssetId, index) =>
        dinnerMediaRepository.create({
          dinner: { connect: { id: dinnerId } },
          mediaAsset: { connect: { id: mediaAssetId } },
          kind: "DINNER_LISTING",
          displayOrder: index,
        })
      )
    );

    revalidatePath("/admin/dinners");
    revalidatePath(`/admin/dinners/${dinnerId}`);
    revalidatePath("/discover");
    revalidatePath(`/dinner/${dinnerId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save listing photos",
    };
  }
}

export async function getDinnerListingPhotos(
  dinnerId: string
): Promise<ActionResult<{ photos: Array<{ id: string; mediaAssetId: string; url: string }> }>> {
  const authResult = await requireDinnerOwner(dinnerId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const items = await dinnerMediaRepository.findByDinner(dinnerId, "DINNER_LISTING");
    return {
      success: true,
      data: {
        photos: items.map((item) => ({
          id: item.id,
          mediaAssetId: item.mediaAsset.id,
          url: item.mediaAsset.url,
        })),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load listing photos",
    };
  }
}
