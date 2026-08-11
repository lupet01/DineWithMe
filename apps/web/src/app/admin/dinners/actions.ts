"use server";

import { auth } from "@clerk/nextjs/server";
import { dinnerRepository, seatRepository, userRepository, auditLogger, AuditAction, AuditEntity } from "@dinewithme/db";
import { revalidatePath } from "next/cache";
import { track } from "@dinewithme/analytics";
import { AnalyticsEvents } from "@dinewithme/analytics";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Update dinner status (SCHEDULED -> LIVE -> COMPLETED)
 */
export async function updateDinnerStatus(
  dinnerId: string,
  newStatus: "LIVE" | "COMPLETED"
): Promise<ActionResult> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get database user ID from Clerk ID
    const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check authorization
    const isAuthorized = await dinnerRepository.isAuthorizedToManage(dinnerId, dbUser.id);
    if (!isAuthorized) {
      return { success: false, error: "You don't have permission to manage this dinner" };
    }

    // Get current dinner
    const dinner = await dinnerRepository.findByIdWithRestaurant(dinnerId);
    if (!dinner) {
      return { success: false, error: "Dinner not found" };
    }

    const oldStatus = dinner.status;

    // Update status
    await dinnerRepository.updateStatus(dinnerId, newStatus);

    // Track analytics
    track(AnalyticsEvents.DINNER_STATUS_CHANGED, {
      dinnerId,
      restaurantId: dinner.restaurantId,
      restaurantName: dinner.restaurant.name,
      userId: dbUser.id,
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString(),
    });

    // Log audit trail
    await auditLogger.dinnerStatusChanged(dbUser.id, dinnerId, {
      oldStatus,
      newStatus,
      restaurantId: dinner.restaurantId,
      theme: dinner.theme,
    });

    // Revalidate the dinners page
    revalidatePath("/admin/dinners");

    return { success: true };
  } catch (error) {
    console.error("Error updating dinner status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update dinner status",
    };
  }
}

/**
 * Publish a DRAFT dinner — flips it to SCHEDULED, making it visible on
 * Discover and bookable. A distinct, deliberate action taken from the
 * Dinners list row rather than bundled into the edit form: once published,
 * a dinner's content (date/price/seats/description) locks for good.
 */
export async function publishDinner(dinnerId: string): Promise<ActionResult> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const isAuthorized = await dinnerRepository.isAuthorizedToManage(dinnerId, dbUser.id);
    if (!isAuthorized) {
      return { success: false, error: "You don't have permission to manage this dinner" };
    }

    const dinner = await dinnerRepository.findByIdWithRestaurant(dinnerId);
    if (!dinner) {
      return { success: false, error: "Dinner not found" };
    }

    if (dinner.status !== "DRAFT") {
      return { success: false, error: "Only a draft dinner can be published" };
    }

    await dinnerRepository.updateStatus(dinnerId, "SCHEDULED");

    track(AnalyticsEvents.DINNER_STATUS_CHANGED, {
      dinnerId,
      restaurantId: dinner.restaurantId,
      restaurantName: dinner.restaurant.name,
      userId: dbUser.id,
      oldStatus: "DRAFT",
      newStatus: "SCHEDULED",
      timestamp: new Date().toISOString(),
    });

    await auditLogger.dinnerStatusChanged(dbUser.id, dinnerId, {
      oldStatus: "DRAFT",
      newStatus: "SCHEDULED",
      restaurantId: dinner.restaurantId,
      theme: dinner.theme,
    });

    revalidatePath("/admin/dinners");
    revalidatePath("/discover");

    return { success: true };
  } catch (error) {
    console.error("Error publishing dinner:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish dinner",
    };
  }
}

/**
 * Delete a draft dinner outright. Only ever available for DRAFT rows —
 * anything published should be Cancelled instead (a guest may already be
 * looking at or booking it), never hard-deleted.
 */
export async function deleteDinner(dinnerId: string): Promise<ActionResult> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Unauthorized" };
    }

    const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const isAuthorized = await dinnerRepository.isAuthorizedToManage(dinnerId, dbUser.id);
    if (!isAuthorized) {
      return { success: false, error: "You don't have permission to manage this dinner" };
    }

    const dinner = await dinnerRepository.findByIdWithRestaurant(dinnerId);
    if (!dinner) {
      return { success: false, error: "Dinner not found" };
    }

    if (dinner.status !== "DRAFT") {
      return { success: false, error: "Only a draft dinner can be deleted — cancel it instead" };
    }

    await dinnerRepository.delete(dinnerId);

    await auditLogger.log(
      dbUser.id,
      AuditAction.DINNER_UPDATED,
      AuditEntity.DINNER,
      dinnerId,
      { restaurantId: dinner.restaurantId, deleted: true }
    );

    revalidatePath("/admin/dinners");

    return { success: true };
  } catch (error) {
    console.error("Error deleting dinner:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete dinner",
    };
  }
}

/**
 * Cancel a dinner and release all seats. `reason` is restaurant-admin-facing
 * context for the cancellation (required by the UI) — stored in the audit
 * log only for now; there's no guest-facing notification or automatic
 * refund flow wired up yet, so the confirmation copy that triggers this
 * deliberately doesn't promise either.
 */
export async function cancelDinner(dinnerId: string, reason?: string): Promise<ActionResult> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get database user ID from Clerk ID
    const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check authorization
    const isAuthorized = await dinnerRepository.isAuthorizedToManage(dinnerId, dbUser.id);
    if (!isAuthorized) {
      return { success: false, error: "You don't have permission to manage this dinner" };
    }

    // Get current dinner
    const dinner = await dinnerRepository.findByIdWithRestaurant(dinnerId);
    if (!dinner) {
      return { success: false, error: "Dinner not found" };
    }

    // Cannot cancel already completed dinners
    if (dinner.status === "COMPLETED") {
      return { success: false, error: "Cannot cancel a completed dinner" };
    }

    // Cannot cancel already cancelled dinners
    if (dinner.status === "CANCELLED") {
      return { success: false, error: "Dinner is already cancelled" };
    }

    const [heldCount, confirmedCount] = await Promise.all([
      seatRepository.countByDinnerAndStatus(dinnerId, "HELD"),
      seatRepository.countByDinnerAndStatus(dinnerId, "CONFIRMED"),
    ]);
    const releasedSeats = heldCount + confirmedCount;

    // Cancel dinner (sets status to CANCELLED, releases held/confirmed seats)
    await dinnerRepository.cancelDinner(dinnerId);

    // Track analytics
    track(AnalyticsEvents.DINNER_CANCELLED, {
      dinnerId,
      restaurantId: dinner.restaurantId,
      restaurantName: dinner.restaurant.name,
      userId: dbUser.id,
      scheduledAt: dinner.startsAt.toISOString(),
      releasedSeats,
      timestamp: new Date().toISOString(),
    });

    // Log audit trail
    await auditLogger.dinnerCancelled(dbUser.id, dinnerId, {
      restaurantId: dinner.restaurantId,
      theme: dinner.theme,
      scheduledAt: dinner.startsAt.toISOString(),
      releasedSeats,
      reason,
    });

    // Revalidate the dinners page
    revalidatePath("/admin/dinners");

    return { success: true };
  } catch (error) {
    console.error("Error cancelling dinner:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel dinner",
    };
  }
}
