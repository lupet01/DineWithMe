import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { seatRepository, userRepository, paymentIntentRepository, auditLogger } from "@dinewithme/db";
import { cancelSeatSchema } from "@dinewithme/shared";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { handleApiError } from "../../lib/error-handler";
import { refundPaymentIntent } from "../../payments/refund/service";

/**
 * POST /api/seats/cancel
 * 
 * Cancel a confirmed seat reservation
 * 
 * Request body:
 * {
 *   "seatId": "cmm7xxx..."
 * }
 * 
 * Policy:
 * - Must be at least 6 hours before dinner starts (configurable)
 * - User must own the confirmed seat
 * - Seat becomes AVAILABLE for rebooking (configurable)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "seatId": "cmm7xxx...",
 *     "dinnerId": "cmm7xxx...",
 *     "status": "AVAILABLE",
 *     "message": "Seat cancelled successfully",
 *     "hoursUntilDinner": 12.5
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Unauthorized",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 }
      );
    }

    // Get database user
    const user = await userRepository.findByAuthProviderId(clerkUserId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "User not found",
            code: "USER_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = cancelSeatSchema.parse(body);

    // Emit analytics event: cancel requested
    await track(AnalyticsEvents.SEAT_CANCEL_REQUESTED, {
      userId: user.id,
      seatId: validatedData.seatId,
      dinnerId: "", // Will be filled after we get the seat
      hoursUntilDinner: 0, // Will be filled after policy check
      timestamp: new Date().toISOString(),
    });

    // Attempt the refund BEFORE releasing the seat. The old order released
    // the seat first, so a payment-provider outage left the guest with no
    // seat AND no refund, with nothing to roll back. Ordering matters here
    // because the refund cutoff (24h) is stricter than the cancellation
    // cutoff (6h): any refund the provider actually accepts implies the
    // cancellation is also within policy, so refunding first can never strand
    // us in a refunded-but-uncancellable state.
    let refund: { issued: boolean; amount?: number; currency?: string; reason?: string } = {
      issued: false,
    };
    const paymentIntent = await paymentIntentRepository.findBySeat(validatedData.seatId);
    if (paymentIntent && paymentIntent.status === "SUCCEEDED") {
      const refundResult = await refundPaymentIntent({
        paymentIntentId: paymentIntent.id,
        reason: "user_cancelled",
        requestingUserId: user.id,
        requestingUserRole: user.role,
      });

      if (refundResult.ok) {
        refund = { issued: true, amount: refundResult.amount, currency: refundResult.currency };
      } else if (refundResult.status >= 500) {
        // Provider/technical failure (not a policy denial) — abort the whole
        // cancellation so the guest keeps both their seat and their money and
        // can retry, rather than losing the seat to a refund that never
        // actually happened.
        return NextResponse.json(
          {
            success: false,
            error: {
              message:
                "We couldn't process your refund right now. Your booking is unchanged — please try again shortly.",
              code: "REFUND_UNAVAILABLE",
            },
          },
          { status: 503 }
        );
      } else {
        // A legitimate no-refund outcome: policy denial (e.g. inside the 24h
        // no-refund window — the seat still cancels, just without a refund) or
        // already refunded. Fall through to release the seat; the response
        // reports refund.issued=false with the reason.
        refund = { issued: false, reason: refundResult.error };
      }
    }

    // Release the seat (also enforces the 6h cancellation cutoff).
    try {
      const result = await seatRepository.cancelSeat(validatedData.seatId, user.id);

      // Emit analytics event: cancelled
      await track(AnalyticsEvents.SEAT_CANCELLED, {
        userId: user.id,
        dinnerId: result.seat.dinnerId,
        seatId: result.seat.id,
        hoursUntilDinner: result.policyResult.hoursUntilDinner || 0,
        timestamp: new Date().toISOString(),
      });

      // Log audit event
      await auditLogger.seatCancelled(
        user.id,
        result.seat.id,
        result.seat.dinnerId
      );

      return NextResponse.json({
        success: true,
        data: {
          seatId: result.seat.id,
          dinnerId: result.seat.dinnerId,
          status: result.seat.status,
          message: "Seat cancelled successfully",
          hoursUntilDinner: result.policyResult.hoursUntilDinner,
          refund,
        },
      });
    } catch (error) {
      // Guard: if we already refunded above but releasing the seat then
      // failed (a rare race — e.g. the seat is no longer CONFIRMED), the guest
      // has their money back but the seat is in an unexpected state. Surface a
      // loud alert for reconciliation rather than losing the signal.
      if (refund.issued) {
        console.error(
          `[ALERT] refund_issued_but_seat_release_failed seatId=${validatedData.seatId} ` +
          `userId=${user.id} error="${error instanceof Error ? error.message : "Unknown"}"`
        );
      }
      // Policy denied or other validation error
      const errorMessage = error instanceof Error ? error.message : "Cancellation failed";

      // Emit analytics event: denied
      await track(AnalyticsEvents.SEAT_CANCEL_DENIED, {
        userId: user.id,
        dinnerId: "", // Unknown at this point
        seatId: validatedData.seatId,
        reason: errorMessage,
        hoursUntilDinner: 0,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            message: errorMessage,
            code: "BUSINESS_LOGIC_ERROR",
          },
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}
