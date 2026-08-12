"use server";

import { revalidatePath } from "next/cache";
import { actionFailure, type ActionResult } from "@dinewithme/shared";
import type { ConversationStyle } from "@prisma/client";
import {
  dinnerRepository,
  restaurantRepository,
  themeRepository,
  mealRepository,
  seatRepository,
  auditLogger,
  AuditAction,
  AuditEntity,
} from "@dinewithme/db";
import { requireAuthUser } from "@/lib/auth/server";
import { track } from "@dinewithme/analytics";


interface CreateDinnerInput {
  restaurantId: string;
  themeId: string;
  mealId?: string;
  pricePerSeatCents?: number;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  description?: string;
  seatCount: number;
  conversationStyle?: ConversationStyle;
  /** DRAFT (default) is invisible on Discover and not bookable, and stays
   * editable. SCHEDULED ("Publish") makes it live and locks its content —
   * see dinnerRepository/DinnerStatus and the wireframe's §6.3/§6.4 notes. */
  status?: "DRAFT" | "SCHEDULED";
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

    if (!input.conversationStyle) {
      return { success: false, error: "Conversation Style is required" };
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
      conversationStyle: input.conversationStyle ?? null,
      status: input.status ?? "DRAFT",
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
    return actionFailure(error, "Failed to create dinner");
  }
}

interface UpdateDinnerInput {
  dinnerId: string;
  themeId: string;
  mealId?: string;
  pricePerSeatCents?: number;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  description?: string;
  seatCount: number;
  conversationStyle?: ConversationStyle;
}

/**
 * Update an existing dinner. Reuses the same Create Dinner form in edit
 * mode (§16.3 wireframe - the standalone Edit Dinner page is retired in
 * favor of one component, mode="create"/"edit"). Seat count can't drop
 * below however many seats are already CONFIRMED/ATTENDED/COMPLETED -
 * shrinking below that would orphan a paying guest's booking.
 */
export async function updateDinner(
  input: UpdateDinnerInput
): Promise<ActionResult<{ dinnerId: string }>> {
  try {
    const user = await requireAuthUser();

    if (!input.dinnerId || !input.themeId || !input.startsAt || !input.endsAt || !input.seatCount) {
      return { success: false, error: "Missing required fields" };
    }

    if (!input.conversationStyle) {
      return { success: false, error: "Conversation Style is required" };
    }

    if (input.seatCount < 2 || input.seatCount > 20) {
      return { success: false, error: "Seat count must be between 2 and 20" };
    }

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
      return { success: false, error: "Invalid date format" };
    }

    if (startsAt >= endsAt) {
      return { success: false, error: "End time must be after start time" };
    }

    const existingDinner = await dinnerRepository.findById(input.dinnerId);
    if (!existingDinner) {
      return { success: false, error: "Dinner not found" };
    }

    const isOwner = await restaurantRepository.isUserOwner(existingDinner.restaurantId, user.id);
    if (!isOwner) {
      return { success: false, error: "You do not have permission to edit dinners for this restaurant" };
    }

    // Only a DRAFT dinner's content is editable — once Publish flips it to
    // SCHEDULED, a guest may already be looking at or booking it, so its
    // date/price/seats/description lock for good. Status itself can still
    // change after that (Mark Live/Complete/Cancel), just not content.
    if (existingDinner.status !== "DRAFT") {
      return { success: false, error: `Cannot edit a dinner that is ${existingDinner.status.toLowerCase()} — only drafts can be edited.` };
    }

    const theme = await themeRepository.findById(input.themeId);
    if (!theme) {
      return { success: false, error: "Theme not found" };
    }

    const isThemeEnabled = await themeRepository.isEnabledForRestaurant(existingDinner.restaurantId, input.themeId);
    if (!isThemeEnabled) {
      return {
        success: false,
        error: `The "${theme.title}" theme is not enabled for your restaurant. Please enable it in your restaurant settings first.`,
      };
    }

    if (input.mealId) {
      const meal = await mealRepository.findById(input.mealId);
      if (!meal || meal.restaurantId !== existingDinner.restaurantId) {
        return { success: false, error: "Meal not found for this restaurant" };
      }
    }

    if (
      input.pricePerSeatCents !== undefined &&
      (!Number.isInteger(input.pricePerSeatCents) || input.pricePerSeatCents < 0)
    ) {
      return { success: false, error: "Price per seat must be a non-negative amount" };
    }

    // Seat count floor: can't shrink below seats already booked by a guest.
    const [confirmedCount, attendedCount, completedCount] = await Promise.all([
      seatRepository.countByDinnerAndStatus(input.dinnerId, "CONFIRMED"),
      seatRepository.countByDinnerAndStatus(input.dinnerId, "ATTENDED"),
      seatRepository.countByDinnerAndStatus(input.dinnerId, "COMPLETED"),
    ]);
    const bookedSeats = confirmedCount + attendedCount + completedCount;
    if (input.seatCount < bookedSeats) {
      return {
        success: false,
        error: `${bookedSeats} seats are already booked — cannot reduce below ${bookedSeats}.`,
      };
    }

    // Grow/shrink the seat pool to match the new seat count. Only ever
    // touches AVAILABLE seats - booked ones are never removed, and the
    // floor check above guarantees seatCount >= bookedSeats.
    if (input.seatCount !== existingDinner.seatCount) {
      await dinnerRepository.resizeSeatPool(input.dinnerId, input.seatCount);
    }

    await dinnerRepository.update(input.dinnerId, {
      theme: { connect: { id: input.themeId } },
      ...(input.mealId ? { meal: { connect: { id: input.mealId } } } : { meal: { disconnect: true } }),
      startsAt,
      endsAt,
      description: input.description || null,
      seatCount: input.seatCount,
      pricePerSeatCents: input.pricePerSeatCents ?? null,
      conversationStyle: input.conversationStyle ?? null,
    });

    await auditLogger.log(
      user.id,
      AuditAction.DINNER_UPDATED,
      AuditEntity.DINNER,
      input.dinnerId,
      { restaurantId: existingDinner.restaurantId, themeId: input.themeId, seatCount: input.seatCount }
    );

    revalidatePath("/admin/dinners");
    revalidatePath(`/admin/dinners/${input.dinnerId}`);
    revalidatePath("/discover");
    revalidatePath(`/dinner/${input.dinnerId}`);

    return { success: true, data: { dinnerId: input.dinnerId } };
  } catch (error) {
    console.error("[Dinner] Error updating dinner:", error);
    return actionFailure(error, "Failed to update dinner");
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
    return actionFailure(error, "Failed to fetch themes");
  }
}
