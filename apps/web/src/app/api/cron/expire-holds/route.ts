import { NextResponse } from "next/server";
import { seatRepository } from "@dinewithme/db";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { handleApiError } from "../../lib/error-handler";

/**
 * Cron endpoint to expire held seats
 *
 * This endpoint should be called periodically (e.g., every minute) by:
 * - Vercel Cron (in production)
 * - Manual trigger (in development)
 * - External cron service
 *
 * Security: Requires CRON_SECRET via Authorization: Bearer header
 * (Vercel Cron sends this header automatically, not a query param)
 *
 * GET /api/cron/expire-holds
 */
export async function GET(request: Request) {
  try {
    // Validate cron secret
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      console.error("[Cron] CRON_SECRET not configured");
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
      console.warn("[Cron] Invalid or missing token");
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

    // Log cron execution
    console.log("[Cron] Expiring held seats...");
    const startTime = Date.now();

    // Expire holds
    const result = await seatRepository.expireHolds();

    const duration = Date.now() - startTime;

    // Log results
    console.log(`[Cron] Expired ${result.count} seats in ${duration}ms`);

    // Emit analytics events for each expired seat
    if (result.expiredSeats.length > 0) {
      const timestamp = new Date().toISOString();
      
      for (const seat of result.expiredSeats) {
        await track(AnalyticsEvents.SEAT_HOLD_EXPIRED, {
          seatId: seat.id,
          dinnerId: seat.dinnerId,
          userId: seat.heldByUserId,
          expiredAt: timestamp,
          timestamp,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        expiredCount: result.count,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        expiredSeats: result.expiredSeats.map((s) => ({
          seatId: s.id,
          dinnerId: s.dinnerId,
          userId: s.heldByUserId,
        })),
      },
    });
  } catch (error) {
    console.error("[Cron] Error expiring holds:", error);
    return handleApiError(error);
  }
}

// Also support POST for Vercel Cron (some services prefer POST)
export async function POST(request: Request) {
  return GET(request);
}
