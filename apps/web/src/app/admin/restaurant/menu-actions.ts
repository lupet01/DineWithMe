"use server";

import { revalidatePath } from "next/cache";
import { menuItemRepository, restaurantRepository } from "@dinewithme/db";
import { MenuCourse } from "@prisma/client";
import { requireAuthUser } from "@/lib/auth/server";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface MenuItemInput {
  course: MenuCourse;
  name: string;
  description?: string | null;
  priceCents: number;
  isAvailable: boolean;
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
  return null;
}

/**
 * Create a new menu item, appended to the end of its course.
 */
export async function createMenuItem(
  restaurantId: string,
  input: MenuItemInput
): Promise<ActionResult<{ menuItemId: string }>> {
  try {
    const user = await requireAuthUser();

    const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);
    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to manage the menu for this restaurant",
      };
    }

    const validationError = validateMenuItemInput(input);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Append the new dish to the end of its course
    const existingItems = await menuItemRepository.findByRestaurant(restaurantId);
    const positionsInCourse = existingItems
      .filter((item) => item.course === input.course)
      .map((item) => item.position);
    const nextPosition =
      positionsInCourse.length > 0 ? Math.max(...positionsInCourse) + 1 : 0;

    const menuItem = await menuItemRepository.create({
      restaurant: { connect: { id: restaurantId } },
      course: input.course,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      priceCents: input.priceCents,
      isAvailable: input.isAvailable,
      position: nextPosition,
    });

    revalidatePath("/admin/restaurant");

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
 * Update an existing menu item's details.
 */
export async function updateMenuItem(
  menuItemId: string,
  input: MenuItemInput
): Promise<ActionResult> {
  try {
    const user = await requireAuthUser();

    const existingItem = await menuItemRepository.findById(menuItemId);
    if (!existingItem) {
      return { success: false, error: "Menu item not found" };
    }

    const isOwner = await restaurantRepository.isUserOwner(
      existingItem.restaurantId,
      user.id
    );
    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to manage the menu for this restaurant",
      };
    }

    const validationError = validateMenuItemInput(input);
    if (validationError) {
      return { success: false, error: validationError };
    }

    await menuItemRepository.update(menuItemId, {
      course: input.course,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      priceCents: input.priceCents,
      isAvailable: input.isAvailable,
    });

    revalidatePath("/admin/restaurant");

    return { success: true, data: undefined };
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
    const user = await requireAuthUser();

    const existingItem = await menuItemRepository.findById(menuItemId);
    if (!existingItem) {
      return { success: false, error: "Menu item not found" };
    }

    const isOwner = await restaurantRepository.isUserOwner(
      existingItem.restaurantId,
      user.id
    );
    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to manage the menu for this restaurant",
      };
    }

    await menuItemRepository.update(menuItemId, { isAvailable });

    revalidatePath("/admin/restaurant");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[MenuItem] Error toggling menu item availability:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update availability",
    };
  }
}

/**
 * Delete a menu item.
 */
export async function deleteMenuItem(menuItemId: string): Promise<ActionResult> {
  try {
    const user = await requireAuthUser();

    const existingItem = await menuItemRepository.findById(menuItemId);
    if (!existingItem) {
      return { success: false, error: "Menu item not found" };
    }

    const isOwner = await restaurantRepository.isUserOwner(
      existingItem.restaurantId,
      user.id
    );
    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to manage the menu for this restaurant",
      };
    }

    await menuItemRepository.delete(menuItemId);

    revalidatePath("/admin/restaurant");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[MenuItem] Error deleting menu item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete menu item",
    };
  }
}
