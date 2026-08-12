"use server";

import { auth } from "@clerk/nextjs/server";
import { actionFailure, type ActionResult } from "@dinewithme/shared";
import { dinnerRepository, userRepository, dinnerCancellationRequestRepository, auditLogger, AuditAction, AuditEntity } from "@dinewithme/db";
import { revalidatePath } from "next/cache";
import { track } from "@dinewithme/analytics";
import { AnalyticsEvents } from "@dinewithme/analytics";


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

    // Revalidate the dinners page — and the diner-facing surfaces, so marking
    // a dinner LIVE/COMPLETED propagates to Discover and the dinner detail page.
    revalidatePath("/admin/dinners");
    revalidatePath("/discover");
    revalidatePath(`/dinner/${dinnerId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating dinner status:", error);
    return actionFailure(error, "Failed to update dinner status");
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
    return actionFailure(error, "Failed to publish dinner");
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
    return actionFailure(error, "Failed to delete dinner");
  }
}

/**
 * Request cancellation of a dinner. A restaurant admin can't cancel directly —
 * cancelling releases paid seats and must refund guests, both higher-blast-
 * radius than a normal edit, so it files a review request for Platform Ops
 * instead (mirrors restaurant closure requests). Approval in /admin/ops/dinners
 * is what actually releases seats + refunds every paying guest, under platform
 * authority (the only role the refund service permits for dinner_cancelled).
 * `reason` is required.
 */
export async function requestDinnerCancellation(
  dinnerId: string,
  reason?: string
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

    // Cannot cancel already completed dinners
    if (dinner.status === "COMPLETED") {
      return { success: false, error: "Cannot cancel a completed dinner" };
    }

    // Cannot cancel already cancelled dinners
    if (dinner.status === "CANCELLED") {
      return { success: false, error: "Dinner is already cancelled" };
    }

    if (!reason || !reason.trim()) {
      return { success: false, error: "A reason for cancellation is required" };
    }

    // At most one pending cancellation request per dinner.
    const existing = await dinnerCancellationRequestRepository.findPendingByDinner(dinnerId);
    if (existing) {
      return {
        success: false,
        error: "A cancellation request is already pending review for this dinner",
      };
    }

    await dinnerCancellationRequestRepository.create({
      dinner: { connect: { id: dinnerId } },
      requestedBy: { connect: { id: dbUser.id } },
      reason: reason.trim(),
    });

    await auditLogger.log(
      dbUser.id,
      AuditAction.DINNER_UPDATED,
      AuditEntity.DINNER,
      dinnerId,
      { restaurantId: dinner.restaurantId, cancellationRequested: true, reason: reason.trim() }
    );

    revalidatePath("/admin/dinners");
    revalidatePath(`/admin/dinners/${dinnerId}`);
    revalidatePath("/admin/ops/dinners");

    return { success: true };
  } catch (error) {
    console.error("Error requesting dinner cancellation:", error);
    return actionFailure(error, "Failed to request cancellation");
  }
}
