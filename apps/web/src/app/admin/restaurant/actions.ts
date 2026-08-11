"use server";

import { revalidatePath } from "next/cache";
import { restaurantRepository, auditLogger } from "@dinewithme/db";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  operatingHoursSchema,
} from "@dinewithme/shared";
import type { CreateRestaurantInput, UpdateRestaurantInput, OperatingHours } from "@dinewithme/shared";
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
        registrationNumber: data.registrationNumber,
        googleBusinessUrl: data.googleBusinessUrl || null,
        instagramHandle: data.instagramHandle || null,
        facebookUrl: data.facebookUrl || null,
        referralSource: data.referralSource || null,
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

    // Edit Profile is reachable by Owner and Manager both (§sec-restaurant-
    // profile) - stricter Owner-only gating is reserved for genuinely
    // higher-blast-radius actions (Danger Zone, bank details), not general
    // profile editing.
    const isMember = await restaurantRepository.isUserMember(
      restaurantId,
      user.id
    );
    if (!isMember) {
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

    // Archived is permanent and read-only (§16.7) - the Profile page
    // doesn't even render an edit form once archived, but this is the
    // actual enforcement in case this action is ever called directly.
    if (currentRestaurant.status === "ARCHIVED") {
      return {
        success: false,
        error: "This restaurant is closed and its profile can no longer be edited",
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
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail || null }),
      ...(data.website !== undefined && { website: data.website || null }),
      ...(data.heroImageUrl !== undefined && { heroImageUrl: data.heroImageUrl || null }),
      ...(data.registrationNumber !== undefined && { registrationNumber: data.registrationNumber || null }),
      ...(data.googleBusinessUrl !== undefined && { googleBusinessUrl: data.googleBusinessUrl || null }),
      ...(data.instagramHandle !== undefined && { instagramHandle: data.instagramHandle || null }),
      ...(data.facebookUrl !== undefined && { facebookUrl: data.facebookUrl || null }),
      ...(data.referralSource !== undefined && { referralSource: data.referralSource || null }),
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

/**
 * Restaurant Profile's Operating Hours card - its own "Save Hours" button,
 * separate save action from the Business Details/Contact Information form
 * (§6.2 wireframe), same pattern as ApplicationInfoCard's independent save.
 */
export async function updateOperatingHours(
  restaurantId: string,
  hours: OperatingHours
): Promise<ActionResult> {
  try {
    const user = await requireAuthUser();

    const validationResult = operatingHoursSchema.safeParse(hours);
    if (!validationResult.success) {
      return { success: false, error: "Invalid operating hours" };
    }

    const isMember = await restaurantRepository.isUserMember(restaurantId, user.id);
    if (!isMember) {
      return {
        success: false,
        error: "You do not have permission to edit this restaurant",
      };
    }

    const currentRestaurant = await restaurantRepository.findById(restaurantId);
    if (!currentRestaurant) {
      return { success: false, error: "Restaurant not found" };
    }
    if (currentRestaurant.status === "ARCHIVED") {
      return {
        success: false,
        error: "This restaurant is closed and its profile can no longer be edited",
      };
    }

    await restaurantRepository.update(restaurantId, {
      operatingHours: validationResult.data,
    });

    await auditLogger.restaurantUpdated(user.id, restaurantId, {
      fields: ["operatingHours"],
      changes: { operatingHours: validationResult.data },
    });

    revalidatePath("/admin/restaurant");

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save operating hours",
    };
  }
}
