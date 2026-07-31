"use server";

import { revalidatePath } from "next/cache";
import {
  dinnerRepository,
  restaurantRepository,
  themeRepository,
  mealRepository,
  auditLogger,
} from "@dinewithme/db";
import { requireAuthUser } from "@/lib/auth/server";
import { track } from "@dinewithme/analytics";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

interface CreateDinnerInput {
  restaurantId: string;
  themeId: string;
  mealId?: string;
  pricePerSeatCents?: number;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  description?: string;
  seatCount: number;
}

/**
 * Create a new dinner
 * Validates that the theme is enabled for the restaurant
 */
export async function createDinner(
  input: CreateDinnerInput
): Promise<ActionResult<{ dinnerId: string }>> {
  try {
    // Require authenticated user
    const user = await requireAuthUser();

    // Validate required fields
    if (!input.restaurantId || !input.themeId || !input.startsAt || !input.endsAt || !input.seatCount) {
      return {
        success: false,
        error: "Missing required fields",
      };
    }

    // Validate seat count
    if (input.seatCount < 2 || input.seatCount > 20) {
      return {
        success: false,
        error: "Seat count must be between 2 and 20",
      };
    }

    // Validate dates
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
      return {
        success: false,
        error: "Invalid date format",
      };
    }

    if (startsAt >= endsAt) {
      return {
        success: false,
        error: "End time must be after start time",
      };
    }

    if (startsAt < new Date()) {
      return {
        success: false,
        error: "Start time must be in the future",
      };
    }

    // Check if user is owner of the restaurant
    const isOwner = await restaurantRepository.isUserOwner(
      input.restaurantId,
      user.id
    );
    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to create dinners for this restaurant",
      };
    }

    // Verify theme exists and is active
    const theme = await themeRepository.findById(input.themeId);
    if (!theme) {
      return {
        success: false,
        error: "Theme not found",
      };
    }

    if (!theme.isActive) {
      return {
        success: false,
        error: "This theme is not currently available",
      };
    }

    // CRITICAL: Verify theme is enabled for this restaurant
    const isThemeEnabled = await themeRepository.isEnabledForRestaurant(
      input.restaurantId,
      input.themeId
    );

    if (!isThemeEnabled) {
      return {
        success: false,
        error: `The "${theme.title}" theme is not enabled for your restaurant. Please enable it in your restaurant settings first.`,
      };
    }

    // Meal is optional - verify it belongs to this restaurant if provided
    if (input.mealId) {
      const meal = await mealRepository.findById(input.mealId);
      if (!meal || meal.restaurantId !== input.restaurantId) {
        return {
          success: false,
          error: "Meal not found for this restaurant",
        };
      }
    }

    if (
      input.pricePerSeatCents !== undefined &&
      (!Number.isInteger(input.pricePerSeatCents) || input.pricePerSeatCents < 0)
    ) {
      return {
        success: false,
        error: "Price per seat must be a non-negative amount",
      };
    }

    // Get restaurant for analytics
    const restaurant = await restaurantRepository.findById(input.restaurantId);
    if (!restaurant) {
      return {
        success: false,
        error: "Restaurant not found",
      };
    }

    // Only an approved, currently-active restaurant can create dinners -
    // the Dashboard's disabled Create Dinner button is a UI hint, this is
    // the actual enforcement (§16.7 - a restaurant that's PENDING, PAUSED,
    // or ARCHIVED must not be able to bypass it by calling this directly).
    if (restaurant.status !== "ACTIVE") {
      return {
        success: false,
        error:
          restaurant.status === "PENDING"
            ? "Your restaurant is still awaiting approval"
            : restaurant.status === "PAUSED"
              ? "Your restaurant is paused - reactivate it first"
              : "This restaurant is closed and can no longer create dinners",
      };
    }

    // Create dinner
    const dinner = await dinnerRepository.create({
      restaurant: {
        connect: { id: input.restaurantId },
      },
      theme: {
        connect: { id: input.themeId },
      },
      ...(input.mealId ? { meal: { connect: { id: input.mealId } } } : {}),
      startsAt,
      endsAt,
      description: input.description || null,
      seatCount: input.seatCount,
      pricePerSeatCents: input.pricePerSeatCents ?? null,
      status: "SCHEDULED",
    });

    // Emit analytics event
    await track("dinner_created_with_theme", {
      dinnerId: dinner.id,
      restaurantId: input.restaurantId,
      restaurantName: restaurant.name,
      themeId: input.themeId,
      themeKey: theme.key,
      themeTitle: theme.title,
      seatCount: input.seatCount,
      startsAt: startsAt.toISOString(),
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    // Log audit trail
    await auditLogger.dinnerCreated(user.id, dinner.id, {
      restaurantId: input.restaurantId,
      themeId: input.themeId,
      themeKey: theme.key,
      seatCount: input.seatCount,
      startsAt: startsAt.toISOString(),
    });

    // Revalidate pages
    revalidatePath("/admin/dinners");
    revalidatePath("/discover");

    return {
      success: true,
      data: { dinnerId: dinner.id },
    };
  } catch (error) {
    console.error("[Dinner] Error creating dinner:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create dinner",
    };
  }
}

/**
 * Get enabled themes for a restaurant
 * Used by dinner creation form
 */
export async function getRestaurantEnabledThemes(
  restaurantId: string
): Promise<ActionResult<{ themes: Array<{ id: string; key: string; title: string; shortDescription: string }> }>> {
  try {
    // Require authenticated user
    const user = await requireAuthUser();

    // Check if user is owner of the restaurant
    const isOwner = await restaurantRepository.isUserOwner(
      restaurantId,
      user.id
    );
    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to view themes for this restaurant",
      };
    }

    // Get enabled themes
    const themes = await themeRepository.findByRestaurant(restaurantId);

    return {
      success: true,
      data: {
        themes: themes.map((t) => ({
          id: t.id,
          key: t.key,
          title: t.title,
          shortDescription: t.shortDescription,
        })),
      },
    };
  } catch (error) {
    console.error("[Dinner] Error fetching enabled themes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch themes",
    };
  }
}
