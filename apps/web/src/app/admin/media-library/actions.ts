"use server";

import { restaurantRepository, mediaAssetRepository, restaurantGalleryItemRepository } from "@dinewithme/db";
import { getStorage } from "@dinewithme/storage";
import { requireAuthUser } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

const ALLOWED_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

async function requireOwner(restaurantId: string) {
  const user = await requireAuthUser();
  const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);
  if (!isOwner) {
    return { error: "You do not have permission to manage media for this restaurant" as const };
  }
  return { user };
}

export async function requestMediaUploadUrl(
  restaurantId: string,
  filename: string,
  contentType: string
): Promise<ActionResult<{ uploadUrl: string; key: string; publicUrl: string }>> {
  const authResult = await requireOwner(restaurantId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  if (!ALLOWED_IMAGE_CONTENT_TYPES.includes(contentType)) {
    return { success: false, error: "Unsupported file type. Upload a JPG, PNG, or WEBP." };
  }

  try {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `restaurants/${restaurantId}/media-library/${timestamp}-${sanitized}`;

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to prepare upload",
    };
  }
}

/**
 * Uploads to the Media Library always create a MediaAsset + a GALLERY
 * RestaurantGalleryItem together - a photo only becomes a candidate for
 * other uses (dish photo, dinner listing photo) by being picked from this
 * pool afterward, it's never "unattached."
 */
export async function saveMediaAsset(
  restaurantId: string,
  key: string,
  url: string
): Promise<ActionResult<{ mediaAssetId: string; galleryItemId: string }>> {
  const authResult = await requireOwner(restaurantId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const mediaAsset = await mediaAssetRepository.create({
      restaurant: { connect: { id: restaurantId } },
      url,
      key,
    });

    const galleryItem = await restaurantGalleryItemRepository.create({
      restaurant: { connect: { id: restaurantId } },
      mediaAsset: { connect: { id: mediaAsset.id } },
      role: "GALLERY",
    });

    revalidatePath("/admin/media-library");

    return { success: true, data: { mediaAssetId: mediaAsset.id, galleryItemId: galleryItem.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save photo",
    };
  }
}

export async function setFeaturedPhoto(restaurantId: string, mediaAssetId: string): Promise<ActionResult> {
  const authResult = await requireOwner(restaurantId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    await restaurantGalleryItemRepository.setFeaturedByMediaAsset(restaurantId, mediaAssetId);
    revalidatePath("/admin/media-library");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set featured photo",
    };
  }
}

export async function deleteMediaAsset(
  mediaAssetId: string,
  restaurantId: string
): Promise<ActionResult> {
  const authResult = await requireOwner(restaurantId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const mediaAsset = await mediaAssetRepository.findById(mediaAssetId);
    if (!mediaAsset || mediaAsset.restaurantId !== restaurantId) {
      return { success: false, error: "Photo not found" };
    }

    const storage = getStorage();
    await storage.deleteObject(mediaAsset.key);

    // Deletes the gallery item too via onDelete: Cascade on MediaAsset
    await mediaAssetRepository.delete(mediaAssetId);

    revalidatePath("/admin/media-library");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete photo",
    };
  }
}
