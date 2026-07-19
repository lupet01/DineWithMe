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

    // Cancel the seat (includes policy validation)
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

      // Cancelling the seat only frees it up - it does not refund the
      // payment on its own. Attempt a refund for whatever payment was made
      // for this seat; if the dinner is too close to start for a refund
      // (a separate, stricter cutoff than the cancellation cutoff itself),
      // the seat stays cancelled but no refund is issued - the response
      // reflects the real outcome either way.
      let refund: { issued: boolean; amount?: number; currency?: string; reason?: string } = {
        issued: false,
      };
      const paymentIntent = await paymentIntentRepository.findBySeat(result.seat.id);
      if (paymentIntent && paymentIntent.status === "SUCCEEDED") {
        const refundResult = await refundPaymentIntent({
          paymentIntentId: paymentIntent.id,
          reason: "user_cancelled",
          requestingUserId: user.id,
          requestingUserRole: user.role,
        });

        refund = refundResult.ok
          ? { issued: true, amount: refundResult.amount, currency: refundResult.currency }
          : { issued: false, reason: refundResult.error };
      }

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
