"use server";

import { auth } from "@clerk/nextjs/server";
import {
  userRepository,
  dinnerRepository,
  seatRepository,
  paymentIntentRepository,
  dinnerCancellationRequestRepository,
  auditLogger,
  AuditAction,
  AuditEntity,
} from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { revalidatePath } from "next/cache";
import { refundPaymentIntent } from "@/app/api/payments/refund/service";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

async function requirePlatformAdmin() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: "Unauthorized" as const };
  }
  const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
  if (!dbUser || dbUser.role !== Role.PLATFORM_ADMIN) {
    return { error: "Only platform admins can review dinner cancellations" as const };
  }
  return { dbUser };
}

/**
 * Approve a dinner cancellation request — the ONLY path that actually cancels
 * a restaurant's dinner. Runs under platform authority, which is what lets the
 * refund service process `dinner_cancelled` refunds (it rejects that reason
 * for any non-platform-admin). Refunds every paying guest (best-effort, and
 * the refund service emails each one), releases all seats, then marks the
 * dinner CANCELLED. Refunds run BEFORE the seat release, while CONFIRMED seats
 * still carry their guest + payment.
 */
export async function approveDinnerCancellation(
  requestId: string
): Promise<ActionResult<{ refunded: number; failed: number }>> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }
  const admin = authResult.dbUser;

  try {
    const request = await dinnerCancellationRequestRepository.findById(requestId);
    if (!request) {
      return { success: false, error: "Cancellation request not found" };
    }
    if (request.status !== "PENDING") {
      return { success: false, error: "This request has already been reviewed" };
    }

    const dinner = await dinnerRepository.findByIdWithRestaurant(request.dinnerId);
    if (!dinner) {
      return { success: false, error: "Dinner not found" };
    }
    if (dinner.status === "COMPLETED") {
      return { success: false, error: "That dinner has already been completed" };
    }

    let refunded = 0;
    let failed = 0;

    // Only refund + release if the dinner isn't already cancelled (approving a
    // request for an already-cancelled dinner just resolves the request).
    if (dinner.status !== "CANCELLED") {
      const confirmedSeats = await seatRepository.findByDinnerWithStatus(request.dinnerId, "CONFIRMED");

      for (const seat of confirmedSeats) {
        try {
          const paymentIntent = await paymentIntentRepository.findBySeat(seat.id);
          if (!paymentIntent) continue; // free/unpaid seat — nothing to refund
          const result = await refundPaymentIntent({
            paymentIntentId: paymentIntent.id,
            reason: "dinner_cancelled",
            requestingUserId: admin.id,
            requestingUserRole: admin.role,
          });
          if (result.ok) {
            refunded += 1;
            await auditLogger.log(admin.id, AuditAction.SEAT_REFUNDED, AuditEntity.SEAT, seat.id, {
              dinnerId: request.dinnerId,
              amount: result.amount,
              currency: result.currency,
              viaCancellation: true,
            });
          } else {
            failed += 1;
            console.error(`Refund failed for seat ${seat.id} during dinner cancellation:`, result.error);
          }
        } catch (error) {
          failed += 1;
          console.error(`Refund threw for seat ${seat.id} during dinner cancellation:`, error);
        }
      }

      // Sets status to CANCELLED and releases held/confirmed seats.
      await dinnerRepository.cancelDinner(request.dinnerId);
    }

    await dinnerCancellationRequestRepository.update(requestId, {
      status: "APPROVED",
      reviewedBy: { connect: { id: admin.id } },
      reviewedAt: new Date(),
    });

    await auditLogger.dinnerCancelled(admin.id, request.dinnerId, {
      restaurantId: dinner.restaurantId,
      theme: dinner.theme,
      scheduledAt: dinner.startsAt.toISOString(),
      refunded,
      refundsFailed: failed,
      reason: request.reason,
      approvedViaRequest: requestId,
    });

    revalidatePath("/admin/ops/dinners");
    revalidatePath("/admin/dinners");
    revalidatePath(`/admin/dinners/${request.dinnerId}`);
    revalidatePath("/discover");
    revalidatePath(`/dinner/${request.dinnerId}`);

    return { success: true, data: { refunded, failed } };
  } catch (error) {
    console.error("Error approving dinner cancellation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve cancellation",
    };
  }
}

/**
 * Reject a cancellation request — the dinner is untouched; the restaurant can
 * submit a new request later.
 */
export async function rejectDinnerCancellation(requestId: string): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }
  const admin = authResult.dbUser;

  try {
    const request = await dinnerCancellationRequestRepository.findById(requestId);
    if (!request) {
      return { success: false, error: "Cancellation request not found" };
    }
    if (request.status !== "PENDING") {
      return { success: false, error: "This request has already been reviewed" };
    }

    await dinnerCancellationRequestRepository.update(requestId, {
      status: "REJECTED",
      reviewedBy: { connect: { id: admin.id } },
      reviewedAt: new Date(),
    });

    await auditLogger.log(admin.id, AuditAction.DINNER_UPDATED, AuditEntity.DINNER, request.dinnerId, {
      cancellationRequestRejected: requestId,
      reason: request.reason,
    });

    revalidatePath("/admin/ops/dinners");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting dinner cancellation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject cancellation",
    };
  }
}
