import { NextRequest, NextResponse } from "next/server";
import { prisma, releaseDuePayouts } from "@dinewithme/db";

/**
 * GET /api/cron/release-payouts
 * Authorization: Bearer CRON_SECRET
 *
 * Moves every HELD payout whose post-dinner hold window (§16.5,
 * payout-policy.ts) has closed to READY - the point at which Platform
 * Ops can actually process it via "Process Selected Payouts". Runs on a
 * much slower cadence than complete-dinners since the hold window itself
 * is measured in business days, not minutes.
 *
 * This endpoint should be called by a cron job once a day.
 */
export async function GET(request: NextRequest) {
  try {
    const expectedToken = process.env.CRON_SECRET;
    if (!expectedToken) {
      return NextResponse.json(
        { success: false, error: { message: "Cron secret not configured", code: "CONFIGURATION_ERROR" } },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid or missing token", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const releasedCount = await releaseDuePayouts(prisma);

    return NextResponse.json({
      success: true,
      data: { payoutsReleased: releasedCount },
    });
  } catch (error) {
    console.error("Error releasing payouts:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : "Failed to release payouts", code: "INTERNAL_ERROR" },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/release-payouts
 *
 * Alternative POST endpoint for cron services that prefer POST
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
