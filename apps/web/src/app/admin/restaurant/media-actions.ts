"use server";

import { revalidatePath } from "next/cache";
import { restaurantRepository, mediaRepository, auditLogger } from "@dinewithme/db";
import { getStorage } from "@dinewithme/storage";
import { requireAuthUser } from "@/lib/auth/server";
import { track, AnalyticsEvents } from "@dinewithme/analytics";

import { actionFailure, type ActionResult } from "@dinewithme/shared";

/**
 * Save media record after successful upload
 */
export async function saveMediaRecord(
  restaurantId: string,
  key: string,
  url: string,
  type: "HERO" | "GALLERY"
): Promise<ActionResult<{ mediaId: string }>> {
  try {
    const user = await requireAuthUser();

    // Verify ownership
    const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);
    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to upload media for this restaurant",
      };
    }

    // Get restaurant for analytics
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      return {
        success: false,
        error: "Restaurant not found",
      };
    }

    // Create media record
    const media = await mediaRepository.create({
      restaurant: {
        connect: { id: restaurantId },
      },
      type,
      url,
      key,
    });

    // If hero image, update restaurant heroImageUrl
    if (type === "HERO") {
      await restaurantRepository.update(restaurantId, {
        heroImageUrl: url,
      });
    }

    // Emit analytics event
    await track(AnalyticsEvents.RESTAURANT_MEDIA_UPLOADED, {
      restaurantId,
      restaurantName: restaurant.name,
      userId: user.id,
      mediaType: type,
      mediaId: media.id,
      timestamp: new Date().toISOString(),
    });

    // Log audit trail
    await auditLogger.mediaUploaded(user.id, media.id, {
      restaurantId,
      type,
      key,
    });

    revalidatePath("/admin/restaurant");

    return {
      success: true,
      data: { mediaId: media.id },
    };
  } catch (error) {
    console.error("[Media] Error saving media record:", error);
    return actionFailure(error, "Failed to save media record");
  }
}

/**
 * Delete media
 */
export async function deleteMedia(
  mediaId: string
): Promise<ActionResult> {
  try {
    const user = await requireAuthUser();

    // Get media record
    const media = await mediaRepository.findById(mediaId);
    if (!media) {
      return {
        success: false,
        error: "Media not found",
      };
    }

    // Verify ownership
    const isOwner = await restaurantRepository.isUserOwner(media.restaurantId, user.id);
    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to delete this media",
      };
    }

    // Get restaurant for analytics
    const restaurant = await restaurantRepository.findById(media.restaurantId);
    if (!restaurant) {
      return {
        success: false,
        error: "Restaurant not found",
      };
    }

    // Delete from storage
    const storage = getStorage();
    await storage.deleteObject(media.key);

    // Delete from database
    await mediaRepository.delete(mediaId);

    // If hero image, clear restaurant heroImageUrl
    if (media.type === "HERO" && restaurant.heroImageUrl === media.url) {
      await restaurantRepository.update(media.restaurantId, {
        heroImageUrl: null,
      });
    }

    // Emit analytics event
    await track(AnalyticsEvents.RESTAURANT_MEDIA_DELETED, {
      restaurantId: media.restaurantId,
      restaurantName: restaurant.name,
      userId: user.id,
      mediaType: media.type,
      mediaId: media.id,
      timestamp: new Date().toISOString(),
    });

    // Log audit trail
    await auditLogger.mediaDeleted(user.id, media.id, {
      restaurantId: media.restaurantId,
      type: media.type,
      key: media.key,
    });

    revalidatePath("/admin/restaurant");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("[Media] Error deleting media:", error);
    return actionFailure(error, "Failed to delete media");
  }
}
