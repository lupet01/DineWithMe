"use server";

import { revalidatePath } from "next/cache";
import {
  restaurantRepository,
  restaurantClosureRequestRepository,
  auditLogger,
} from "@dinewithme/db";
import { requireAuthUser } from "@/lib/auth/server";
import { track, AnalyticsEvents } from "@dinewithme/analytics";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Owner-only auth boundary for this file - deliberately not shared with
 * admin/ops/restaurants/actions.ts's PLATFORM_ADMIN checks (§16.5 pattern):
 * different security boundaries stay in different files.
 */
async function requireOwner(restaurantId: string) {
  const user = await requireAuthUser();
  const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);
  if (!isOwner) {
    throw new Error("You do not have permission to manage this restaurant");
  }
  return user;
}

/**
 * Self-serve pause - instant and reversible, unlike closure (§16.7). Only
 * an ACTIVE restaurant can be paused.
 */
export async function pauseRestaurantSelfServe(
  restaurantId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const user = await requireOwner(restaurantId);
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }
    if (restaurant.status !== "ACTIVE") {
      return { success: false, error: "Only an active restaurant can be paused" };
    }

    await restaurantRepository.pause(restaurantId);

    track(AnalyticsEvents.RESTAURANT_PAUSED, {
      restaurantId,
      restaurantName: restaurant.name,
      pausedBy: user.id,
      pauserEmail: user.email,
      reason,
      timestamp: new Date().toISOString(),
    });
    await auditLogger.restaurantPaused(user.id, restaurantId, {
      restaurantName: restaurant.name,
      reason,
      selfServe: true,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[Settings] Error pausing restaurant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to pause restaurant",
    };
  }
}

/**
 * Self-serve reactivate - only a PAUSED restaurant can be reactivated this
 * way. Reuses restaurantRepository.approve() (clears pausedAt) but does not
 * touch liveMomentSeenAt, since this restaurant already had its one-time
 * "You're Live!" moment on its original approval.
 */
export async function reactivateRestaurantSelfServe(
  restaurantId: string
): Promise<ActionResult> {
  try {
    const user = await requireOwner(restaurantId);
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }
    if (restaurant.status !== "PAUSED") {
      return { success: false, error: "Only a paused restaurant can be reactivated" };
    }

    await restaurantRepository.approve(restaurantId);

    await auditLogger.restaurantApproved(user.id, restaurantId, {
      restaurantName: restaurant.name,
      selfServe: true,
      previousStatus: "PAUSED",
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[Settings] Error reactivating restaurant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reactivate restaurant",
    };
  }
}

/**
 * Submits a closure request for Platform Ops review - never changes status
 * directly (§4.5.5, §16.7). At most one PENDING request per restaurant.
 */
export async function requestRestaurantClosure(
  restaurantId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const user = await requireOwner(restaurantId);
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }
    if (restaurant.status === "ARCHIVED") {
      return { success: false, error: "This restaurant is already closed" };
    }
    if (!reason.trim()) {
      return { success: false, error: "Please tell us why you're closing" };
    }

    const existing = await restaurantClosureRequestRepository.findPendingByRestaurant(restaurantId);
    if (existing) {
      return { success: false, error: "A closure request is already pending review" };
    }

    await restaurantClosureRequestRepository.create({
      restaurant: { connect: { id: restaurantId } },
      requestedBy: { connect: { id: user.id } },
      reason: reason.trim(),
    });

    await auditLogger.restaurantClosureRequested(user.id, restaurantId, {
      restaurantName: restaurant.name,
      reason: reason.trim(),
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[Settings] Error requesting restaurant closure:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit closure request",
    };
  }
}

/**
 * Lets an owner withdraw their own closure request before Platform Ops
 * reviews it - a request already APPROVED/REJECTED can't be cancelled.
 */
export async function cancelRestaurantClosureRequest(requestId: string): Promise<ActionResult> {
  try {
    const user = await requireAuthUser();
    const request = await restaurantClosureRequestRepository.findById(requestId);
    if (!request) {
      return { success: false, error: "Request not found" };
    }

    const isOwner = await restaurantRepository.isUserOwner(request.restaurantId, user.id);
    if (!isOwner) {
      return { success: false, error: "You do not have permission to cancel this request" };
    }
    if (request.status !== "PENDING") {
      return { success: false, error: "This request has already been reviewed" };
    }

    await restaurantClosureRequestRepository.delete(requestId);

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[Settings] Error cancelling closure request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel request",
    };
  }
}
