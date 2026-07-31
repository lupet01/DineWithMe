"use server";

import { revalidatePath } from "next/cache";
import { menuItemRepository, restaurantRepository, mediaAssetRepository } from "@dinewithme/db";
import { MenuCourse, DietaryTag } from "@prisma/client";
import { getStorage } from "@dinewithme/storage";
import { requireAuthUser } from "@/lib/auth/server";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

const ALLOWED_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export interface MenuItemInput {
  course: MenuCourse;
  name: string;
  description?: string | null;
  ingredients?: string | null;
  priceCents: number;
  isAvailable: boolean;
  mediaAssetId?: string | null;
  dietaryTags: DietaryTag[];
}

function validateMenuItemInput(input: MenuItemInput): string | null {
  if (!input.name || !input.name.trim()) {
    return "Dish name is required";
  }
  if (!Object.values(MenuCourse).includes(input.course)) {
    return "Invalid course";
  }
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
    return "Price must be a non-negative amount";
  }
  if (input.dietaryTags.some((tag) => !Object.values(DietaryTag).includes(tag))) {
    return "Invalid dietary tag";
  }
  return null;
}

async function requireOwner(restaurantId: string) {
  const user = await requireAuthUser();
  const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);
  if (!isOwner) {
    return { error: "You do not have permission to manage the dish library for this restaurant" as const };
  }
  return { user };
}

/**
 * Create a new dish, appended to the end of its course.
 */
export async function createMenuItem(
  restaurantId: string,
  input: MenuItemInput
): Promise<ActionResult<{ menuItemId: string }>> {
  try {
    const authResult = await requireOwner(restaurantId);
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

    const validationError = validateMenuItemInput(input);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const existingItems = await menuItemRepository.findByRestaurant(restaurantId);
    const positionsInCourse = existingItems
      .filter((item) => item.course === input.course)
      .map((item) => item.position);
    const nextPosition = positionsInCourse.length > 0 ? Math.max(...positionsInCourse) + 1 : 0;

    const menuItem = await menuItemRepository.create({
      restaurant: { connect: { id: restaurantId } },
      course: input.course,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      ingredients: input.ingredients?.trim() || null,
      priceCents: input.priceCents,
      isAvailable: input.isAvailable,
      position: nextPosition,
      dietaryTags: input.dietaryTags,
      ...(input.mediaAssetId ? { mediaAsset: { connect: { id: input.mediaAssetId } } } : {}),
    });

    revalidatePath("/admin/dish-library");

    return { success: true, data: { menuItemId: menuItem.id } };
  } catch (error) {
    console.error("[MenuItem] Error creating menu item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create menu item",
    };
  }
}

/**
 * Update an existing dish's details.
 */
export async function updateMenuItem(menuItemId: string, input: MenuItemInput): Promise<ActionResult> {
  try {
    const existingItem = await menuItemRepository.findById(menuItemId);
    if (!existingItem) {
      return { success: false, error: "Menu item not found" };
    }

    const authResult = await requireOwner(existingItem.restaurantId);
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

    const validationError = validateMenuItemInput(input);
    if (validationError) {
      return { success: false, error: validationError };
    }

    await menuItemRepository.update(menuItemId, {
      course: input.course,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      ingredients: input.ingredients?.trim() || null,
      priceCents: input.priceCents,
      isAvailable: input.isAvailable,
      dietaryTags: input.dietaryTags,
      mediaAsset: input.mediaAssetId
        ? { connect: { id: input.mediaAssetId } }
        : { disconnect: true },
    });

    revalidatePath("/admin/dish-library");

    return { success: true };
  } catch (error) {
    console.error("[MenuItem] Error updating menu item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update menu item",
    };
  }
}

/**
 * Quick toggle for a dish's availability, without opening the full edit form.
 */
export async function toggleMenuItemAvailability(
  menuItemId: string,
  isAvailable: boolean
): Promise<ActionResult> {
  try {
    const existingItem = await menuItemRepository.findById(menuItemId);
    if (!existingItem) {
      return { success: false, error: "Menu item not found" };
    }

    const authResult = await requireOwner(existingItem.restaurantId);
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

    await menuItemRepository.update(menuItemId, { isAvailable });

    revalidatePath("/admin/dish-library");

    return { success: true };
  } catch (error) {
    console.error("[MenuItem] Error toggling menu item availability:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update availability",
    };
  }
}

/**
 * Delete a dish. Dish still referenced by a Meal's MealCourseOption rows
 * cascades those away too - a Meal simply loses that option, it doesn't
 * block the delete (matches the "never re-enter data" principle: deleting
 * the source dish is a deliberate act the admin can always redo).
 */
export async function deleteMenuItem(menuItemId: string): Promise<ActionResult> {
  try {
    const existingItem = await menuItemRepository.findById(menuItemId);
    if (!existingItem) {
      return { success: false, error: "Menu item not found" };
    }

    const authResult = await requireOwner(existingItem.restaurantId);
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }

    await menuItemRepository.delete(menuItemId);

    revalidatePath("/admin/dish-library");

    return { success: true };
  } catch (error) {
    console.error("[MenuItem] Error deleting menu item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete menu item",
    };
  }
}

/**
 * Dish photos reuse the same shared Media Library pool as everything else
 * (§16.6) - a fresh upload here creates a MediaAsset directly usable later
 * as a Listing Photo, and vice versa.
 */
export async function requestDishPhotoUploadUrl(
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
    const key = `restaurants/${restaurantId}/dish-library/${timestamp}-${sanitized}`;

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

export async function saveDishPhoto(
  restaurantId: string,
  key: string,
  url: string
): Promise<ActionResult<{ mediaAssetId: string }>> {
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

    return { success: true, data: { mediaAssetId: mediaAsset.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save photo",
    };
  }
}
