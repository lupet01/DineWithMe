import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { seatRepository, userRepository, auditLogger } from "@dinewithme/db";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { holdSeatForDinnerSchema } from "@dinewithme/shared";
import { handleApiError } from "../../lib/error-handler";
import { withRateLimit, withCors } from "../../lib/middleware";
import { RateLimitPresets } from "@/lib/rate-limit";

// POST /api/seats/hold - Hold a seat for a dinner
async function handlePOST(request: NextRequest) {
  try {
    // Verify authentication
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
    const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
    
    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "User not found in database",
            code: "USER_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = holdSeatForDinnerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid request data",
            code: "VALIDATION_ERROR",
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { dinnerId, holdDurationMinutes } = validation.data;

    // Emit analytics: seat hold requested
    await track(AnalyticsEvents.SEAT_HOLD_REQUESTED, {
      userId: dbUser.id,
      dinnerId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Atomically hold a seat for the dinner
      const heldSeat = await seatRepository.holdSeatForDinner(
        dbUser.id,
        dinnerId,
        holdDurationMinutes
      );

      // Log audit event
      await auditLogger.logSeatHeld(dbUser.id, heldSeat.id, {
        dinnerId,
        holdExpiresAt: heldSeat.holdExpiresAt,
      });

      // Emit analytics: seat held success
      await track(AnalyticsEvents.SEAT_HELD_SUCCESS, {
        userId: dbUser.id,
        dinnerId,
        seatId: heldSeat.id,
        holdExpiresAt: heldSeat.holdExpiresAt?.toISOString() || "",
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: {
          seatId: heldSeat.id,
          dinnerId: heldSeat.dinnerId,
          status: heldSeat.status,
          holdExpiresAt: heldSeat.holdExpiresAt,
          message: "Seat held successfully",
        },
      });
    } catch (error) {
      // Emit analytics: seat held failed
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await track(AnalyticsEvents.SEAT_HELD_FAILED, {
        userId: dbUser.id,
        dinnerId,
        reason: errorMessage,
        timestamp: new Date().toISOString(),
      });

      // Re-throw to be handled by outer catch
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// Apply rate limiting (strict: 10 requests per 10 seconds) and CORS
export const POST = withCors(withRateLimit(handlePOST, RateLimitPresets.STRICT));
