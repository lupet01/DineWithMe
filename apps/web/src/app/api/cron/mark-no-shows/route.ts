import { NextRequest, NextResponse } from "next/server";
import { seatRepository, trustEventRepository } from "@dinewithme/db";
import { track, AnalyticsEvents } from "@dinewithme/analytics";

/**
 * GET /api/cron/mark-no-shows
 * Authorization: Bearer CRON_SECRET
 *
 * Automatically mark users as NO_SHOW when:
 * - Dinner has started
 * - User has CONFIRMED seat
 * - No check-in recorded by threshold (30 minutes after start)
 * 
 * Creates negative trust events for no-shows.
 * 
 * This endpoint should be called by a cron job every 5-10 minutes.
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "markedCount": 3,
 *     "seats": [...]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret via Authorization header (Vercel Cron sends this, not a query param)
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Cron secret not configured",
            code: "CONFIGURATION_ERROR",
          },
        },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid or missing token",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 }
      );
    }

    // Mark no-shows (30 minutes after dinner start)
    const noShowSeats = await seatRepository.markNoShows(30);

    // Create trust events and emit analytics for each no-show
    const trustEvents = await Promise.all(
      noShowSeats.map(async (seat) => {
        // Create negative trust event
        const trustEvent = await trustEventRepository.createNoShowEvent(
          seat.userId,
          seat.seatId,
          seat.dinnerId,
          -10 // Negative weight
        );

        // Emit analytics event
        await track(AnalyticsEvents.SEAT_NO_SHOW_MARKED, {
          userId: seat.userId,
          dinnerId: seat.dinnerId,
          seatId: seat.seatId,
          dinnerTheme: seat.dinnerTheme,
          minutesAfterStart: 30,
          timestamp: new Date().toISOString(),
        });

        return trustEvent;
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        markedCount: noShowSeats.length,
        seats: noShowSeats.map(s => ({
          seatId: s.seatId,
          userId: s.userId,
          dinnerId: s.dinnerId,
          dinnerTheme: s.dinnerTheme,
        })),
        trustEventsCreated: trustEvents.length,
      },
    });
  } catch (error) {
    console.error("Error marking no-shows:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Failed to mark no-shows",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/mark-no-shows
 * 
 * Alternative POST endpoint for cron services that prefer POST
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
