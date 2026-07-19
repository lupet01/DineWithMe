import { NextRequest, NextResponse } from "next/server";
import { seatRepository, auditLogger } from "@dinewithme/db";
import { handleApiError } from "../../../lib/error-handler";
import { getCurrentUser } from "@/lib/auth";
import { track, AnalyticsEvents } from "@dinewithme/analytics";

/**
 * POST /api/seats/[seatId]/confirm
 * 
 * Confirm a held seat (transition from HELD to CONFIRMED)
 * This is called after payment is verified or for free dinners
 * 
 * Body:
 * - dinnerId: string (for validation)
 * 
 * Returns:
 * - seat: Seat object with CONFIRMED status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { seatId: string } }
) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { seatId } = params;
    const body = await request.json();
    const { dinnerId } = body;

    if (!dinnerId) {
      return NextResponse.json(
        { error: "dinnerId is required" },
        { status: 400 }
      );
    }

    // Track confirmation attempt
    await track(AnalyticsEvents.SEAT_CONFIRM_REQUESTED, {
      userId: user.id,
      seatId,
      dinnerId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Confirm the held seat (requires a SUCCEEDED payment intent)
      const confirmedSeat = await seatRepository.confirmSeat(seatId, user.id);

      // Verify the seat belongs to the correct dinner
      if (confirmedSeat.dinnerId !== dinnerId) {
        throw new Error("Seat does not belong to this dinner");
      }

      // Log audit event
      await auditLogger.logSeatConfirmed(user.id, seatId, {
        dinnerId,
        confirmedAt: new Date().toISOString(),
      });

      // Track success
      await track(AnalyticsEvents.SEAT_CONFIRMED, {
        userId: user.id,
        dinnerId,
        seatId,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: {
          seat: confirmedSeat,
          message: "Seat confirmed successfully",
        },
      });
    } catch (error) {
      // Track failure
      await track(AnalyticsEvents.SEAT_CONFIRM_FAILED, {
        userId: user.id,
        seatId,
        reason: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  } catch (error) {
    console.error("Seat confirmation error:", error);
    return handleApiError(error);
  }
}
