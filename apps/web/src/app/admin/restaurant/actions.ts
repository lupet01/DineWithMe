"use server";

import { revalidatePath } from "next/cache";
import { restaurantRepository, auditLogger } from "@dinewithme/db";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
} from "@dinewithme/shared";
import type { CreateRestaurantInput, UpdateRestaurantInput } from "@dinewithme/shared";
import { requireAuthUser } from "@/lib/auth/server";
import { track, trackServerSide, AnalyticsEvents } from "@dinewithme/analytics";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Create a new restaurant and assign the current user as owner
 */
export async function createRestaurant(
  input: CreateRestaurantInput
): Promise<ActionResult<{ restaurantId: string }>> {
  try {
    // Require authenticated user
    const user = await requireAuthUser();

    // Validate input
    const validationResult = createRestaurantSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: validationResult.error.flatten().fieldErrors,
      };
    }

    const data = validationResult.data;

    // Check if user already has a restaurant
    const existingRestaurants = await restaurantRepository.findManyForUser(
      user.id
    );
    if (existingRestaurants.length > 0) {
      return {
        success: false,
        error: "You already have a restaurant. Please edit your existing restaurant instead.",
      };
    }

    // Create restaurant with owner
    const restaurant = await restaurantRepository.createWithOwner(
      {
        name: data.name,
        description: data.description || null,
        cuisine: data.cuisine || null,
        city: data.city || null,
        address: data.address || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        phone: data.phone || null,
        website: data.website || null,
        heroImageUrl: data.heroImageUrl || null,
      },
      user.id
    );

    // Emit analytics event (server-side only)
    await trackServerSide(AnalyticsEvents.RESTAURANT_CREATED, {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    // Log audit trail
    await auditLogger.restaurantCreated(user.id, restaurant.id, {
      name: restaurant.name,
      cuisine: data.cuisine,
      city: data.city,
    });

    // Revalidate the restaurant page
    revalidatePath("/admin/restaurant");

    return {
      success: true,
      data: { restaurantId: restaurant.id },
    };
  } catch (error) {
    console.error("[Restaurant] Error creating restaurant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create restaurant",
    };
  }
}

/**
 * Update an existing restaurant
 */
export async function updateRestaurant(
  restaurantId: string,
  input: UpdateRestaurantInput
): Promise<ActionResult> {
  try {
    // Require authenticated user
    const user = await requireAuthUser();

    // Validate input
    const validationResult = updateRestaurantSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: validationResult.error.flatten().fieldErrors,
      };
    }

    const data = validationResult.data;

    // Check if user is owner of the restaurant
    const isOwner = await restaurantRepository.isUserOwner(
      restaurantId,
      user.id
    );
    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to edit this restaurant",
      };
    }

    // Get current restaurant for comparison
    const currentRestaurant = await restaurantRepository.findById(restaurantId);
    if (!currentRestaurant) {
      return {
        success: false,
        error: "Restaurant not found",
      };
    }

    // Track which fields were updated
    const updatedFields = Object.keys(data).filter(
      (key) => data[key as keyof typeof data] !== undefined
    );

    // Update restaurant
    const updated = await restaurantRepository.update(restaurantId, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.cuisine !== undefined && { cuisine: data.cuisine || null }),
      ...(data.city !== undefined && { city: data.city || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.latitude !== undefined && { latitude: data.latitude || null }),
      ...(data.longitude !== undefined && { longitude: data.longitude || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.website !== undefined && { website: data.website || null }),
      ...(data.heroImageUrl !== undefined && { heroImageUrl: data.heroImageUrl || null }),
    });

    // Emit analytics event
    await track(AnalyticsEvents.RESTAURANT_PROFILE_UPDATED, {
      restaurantId: updated.id,
      restaurantName: updated.name,
      userId: user.id,
      fields: updatedFields,
      timestamp: new Date().toISOString(),
    });

    // Log audit trail
    await auditLogger.restaurantUpdated(user.id, restaurantId, {
      fields: updatedFields,
      changes: data,
    });

    // Revalidate the restaurant page
    revalidatePath("/admin/restaurant");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("[Restaurant] Error updating restaurant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update restaurant",
    };
  }
}
