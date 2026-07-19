import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { seatRepository, userRepository, dinnerRepository, auditLogger } from "@dinewithme/db";
import { checkInSchema, verifyCheckInToken } from "@dinewithme/shared";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { emailService } from "@dinewithme/email";
import { handleApiError } from "../../lib/error-handler";

/**
 * Best-effort - a failed confirmation email must not fail the check-in
 * itself, which has already succeeded.
 */
async function sendCheckInEmail(userId: string, dinnerId: string, checkedInAt: Date | null) {
  try {
    const [user, dinner] = await Promise.all([
      userRepository.findById(userId),
      dinnerRepository.findByIdWithRestaurant(dinnerId),
    ]);
    if (!user || !dinner) return;

    await emailService.sendCheckInConfirmation({
      userEmail: user.email,
      userName: user.firstName || user.email,
      dinnerTitle: dinner.theme?.title || "your dinner",
      restaurantName: dinner.restaurant.name,
      checkInTime: (checkedInAt ?? new Date()).toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    });
  } catch (error) {
    console.error("Failed to send check-in confirmation email:", error);
  }
}

/**
 * POST /api/seats/check-in
 * 
 * Check in to a confirmed seat
 * 
 * Request body:
 * {
 *   "seatId": "cmm7xxx...",
 *   "token": "optional-qr-token" // For QR code check-in
 * }
 * 
 * Policy:
 * - Check-in window: 30 minutes before to 30 minutes after dinner starts
 * - User must own the confirmed seat
 * - Seat must be CONFIRMED status
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "seatId": "cmm7xxx...",
 *     "dinnerId": "cmm7xxx...",
 *     "status": "ATTENDED",
 *     "checkedInAt": "2026-03-01T19:00:00.000Z",
 *     "message": "Checked in successfully",
 *     "minutesUntilStart": -5
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Check if using QR token
    if (body.token) {
      return await handleQRCheckIn(body.token);
    }

    // Regular authenticated check-in
    return await handleAuthenticatedCheckIn(body);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Handle QR code check-in (token-based)
 */
async function handleQRCheckIn(token: string) {
  try {
    // Verify token
    const tokenResult = verifyCheckInToken(token);
    
    if (!tokenResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: tokenResult.reason || "Invalid token",
            code: "INVALID_TOKEN",
          },
        },
        { status: 400 }
      );
    }

    const { seatId, dinnerId } = tokenResult;

    if (!seatId || !dinnerId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid token data",
            code: "INVALID_TOKEN",
          },
        },
        { status: 400 }
      );
    }

    // Get seat to find user
    const seat = await seatRepository.findById(seatId);
    if (!seat) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Seat not found",
            code: "SEAT_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    if (!seat.confirmedByUserId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Seat is not confirmed",
            code: "SEAT_NOT_CONFIRMED",
          },
        },
        { status: 400 }
      );
    }

    // Check in the seat
    try {
      const result = await seatRepository.checkIn(seatId, seat.confirmedByUserId);

      // Emit analytics event: success
      await track(AnalyticsEvents.SEAT_CHECK_IN_SUCCESS, {
        userId: seat.confirmedByUserId,
        dinnerId: result.seat.dinnerId,
        seatId: result.seat.id,
        minutesUntilStart: result.policyResult.minutesUntilStart || 0,
        timestamp: new Date().toISOString(),
      });

      // Log audit event
      await auditLogger.seatCheckedIn(
        seat.confirmedByUserId,
        result.seat.id,
        result.seat.dinnerId,
        { method: "qr_token" }
      );

      await sendCheckInEmail(seat.confirmedByUserId, result.seat.dinnerId, result.seat.checkedInAt);

      return NextResponse.json({
        success: true,
        data: {
          seatId: result.seat.id,
          dinnerId: result.seat.dinnerId,
          status: result.seat.status,
          checkedInAt: result.seat.checkedInAt,
          message: "Checked in successfully",
          minutesUntilStart: result.policyResult.minutesUntilStart,
        },
      });
    } catch (error) {
      // Policy denied or other validation error
      const errorMessage = error instanceof Error ? error.message : "Check-in failed";

      // Emit analytics event: denied
      await track(AnalyticsEvents.SEAT_CHECK_IN_DENIED, {
        userId: seat.confirmedByUserId,
        dinnerId: seat.dinnerId,
        seatId: seat.id,
        reason: errorMessage,
        minutesUntilStart: 0,
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

/**
 * Handle authenticated check-in (user logged in)
 */
async function handleAuthenticatedCheckIn(body: unknown) {
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

    // Validate request body
    const validatedData = checkInSchema.parse(body);

    // Check in the seat
    try {
      const result = await seatRepository.checkIn(validatedData.seatId, user.id);

      // Emit analytics event: success
      await track(AnalyticsEvents.SEAT_CHECK_IN_SUCCESS, {
        userId: user.id,
        dinnerId: result.seat.dinnerId,
        seatId: result.seat.id,
        minutesUntilStart: result.policyResult.minutesUntilStart || 0,
        timestamp: new Date().toISOString(),
      });

      // Log audit event
      await auditLogger.seatCheckedIn(
        user.id,
        result.seat.id,
        result.seat.dinnerId,
        { method: "authenticated" }
      );

      await sendCheckInEmail(user.id, result.seat.dinnerId, result.seat.checkedInAt);

      return NextResponse.json({
        success: true,
        data: {
          seatId: result.seat.id,
          dinnerId: result.seat.dinnerId,
          status: result.seat.status,
          checkedInAt: result.seat.checkedInAt,
          message: "Checked in successfully",
          minutesUntilStart: result.policyResult.minutesUntilStart,
        },
      });
    } catch (error) {
      // Policy denied or other validation error
      const errorMessage = error instanceof Error ? error.message : "Check-in failed";

      // Emit analytics event: denied
      await track(AnalyticsEvents.SEAT_CHECK_IN_DENIED, {
        userId: user.id,
        dinnerId: "", // Unknown at this point
        seatId: validatedData.seatId,
        reason: errorMessage,
        minutesUntilStart: 0,
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
