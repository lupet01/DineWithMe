"use server";

import { auth } from "@clerk/nextjs/server";
import { dinnerRepository, seatRepository, userRepository, paymentIntentRepository, auditLogger, AuditAction, AuditEntity } from "@dinewithme/db";
import { revalidatePath } from "next/cache";
import { refundPaymentIntent } from "@/app/api/payments/refund/service";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

async function requireDinnerManager(dinnerId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: "Unauthorized" as const };
  }

  const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
  if (!dbUser) {
    return { error: "User not found" as const };
  }

  const isAuthorized = await dinnerRepository.isAuthorizedToManage(dinnerId, dbUser.id);
  if (!isAuthorized) {
    return { error: "You don't have permission to manage this dinner" as const };
  }

  return { dbUser };
}

/**
 * Admin-initiated check-in for a guest (e.g. front-of-house checking
 * someone in manually). seatRepository.checkIn validates the seat is owned
 * by the passed userId, so this must pass the guest's own ID, not the
 * admin's - the admin is acting on the guest's behalf, not checking
 * themself in.
 */
export async function checkInGuest(dinnerId: string, seatId: string): Promise<ActionResult> {
  const authResult = await requireDinnerManager(dinnerId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const seat = await seatRepository.findById(seatId);
    if (!seat || seat.dinnerId !== dinnerId) {
      return { success: false, error: "Seat not found for this dinner" };
    }
    if (!seat.confirmedByUserId) {
      return { success: false, error: "This seat has no confirmed guest to check in" };
    }

    await seatRepository.checkIn(seatId, seat.confirmedByUserId);

    await auditLogger.log(
      authResult.dbUser.id,
      AuditAction.SEAT_ATTENDED,
      AuditEntity.SEAT,
      seatId,
      { dinnerId, checkedInBy: "admin" }
    );

    revalidatePath(`/admin/dinners/${dinnerId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check in guest",
    };
  }
}

/**
 * Check in every confirmed-but-not-yet-attended guest at once (§16.1
 * wireframe's "Check In All") - loops the same per-seat checkIn used by
 * checkInGuest above rather than a bespoke bulk query, so it stays subject
 * to the exact same state-machine/policy checks (e.g. the check-in time
 * window) as checking someone in one at a time. Best-effort: one seat
 * failing (e.g. outside the check-in window) doesn't block the rest.
 */
export async function checkInAllSeats(dinnerId: string): Promise<ActionResult<{ checkedIn: number; failed: number }>> {
  const authResult = await requireDinnerManager(dinnerId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const seats = await seatRepository.findByDinnerWithStatus(dinnerId, "CONFIRMED");
    let checkedIn = 0;
    let failed = 0;

    for (const seat of seats) {
      if (!seat.confirmedByUserId) {
        failed += 1;
        continue;
      }
      try {
        await seatRepository.checkIn(seat.id, seat.confirmedByUserId);
        await auditLogger.log(
          authResult.dbUser.id,
          AuditAction.SEAT_ATTENDED,
          AuditEntity.SEAT,
          seat.id,
          { dinnerId, checkedInBy: "admin", bulk: true }
        );
        checkedIn += 1;
      } catch {
        failed += 1;
      }
    }

    revalidatePath(`/admin/dinners/${dinnerId}`);
    return { success: true, data: { checkedIn, failed } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check in guests",
    };
  }
}

/**
 * Admin-initiated refund for a seat's payment - reuses the same
 * refundPaymentIntent used by the diner-facing refund endpoint and the
 * cancel-on-seat flow, as "dinner_cancelled" reason (bypasses the 24h
 * cutoff since this is a platform/restaurant-initiated refund, not a
 * late user cancellation).
 */
export async function refundSeat(dinnerId: string, seatId: string): Promise<ActionResult> {
  const authResult = await requireDinnerManager(dinnerId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const paymentIntent = await paymentIntentRepository.findBySeat(seatId);
    if (!paymentIntent) {
      return { success: false, error: "No payment found for this seat" };
    }

    const result = await refundPaymentIntent({
      paymentIntentId: paymentIntent.id,
      reason: "dinner_cancelled",
      requestingUserId: authResult.dbUser.id,
      requestingUserRole: authResult.dbUser.role,
    });

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    await auditLogger.log(
      authResult.dbUser.id,
      AuditAction.SEAT_REFUNDED,
      AuditEntity.SEAT,
      seatId,
      { dinnerId, amount: result.amount, currency: result.currency }
    );

    revalidatePath(`/admin/dinners/${dinnerId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to refund seat",
    };
  }
}
