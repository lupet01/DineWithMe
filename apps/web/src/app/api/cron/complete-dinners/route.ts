import { NextRequest, NextResponse } from "next/server";
import { prisma, recomputeMealPerformance, recomputeThemePerformance, createPayoutForDinner } from "@dinewithme/db";

/**
 * GET /api/cron/complete-dinners
 * Authorization: Bearer CRON_SECRET
 *
 * Marks SCHEDULED/LIVE dinners as COMPLETED once their end time has
 * passed - no other job in this codebase makes that transition, which
 * left MealPerformance, ThemePerformance, and Payout (§16.5) with no real
 * completion signal to key off. For each newly-completed dinner:
 * recomputes its Meal's MealPerformance (if it has one) and its Theme's
 * ThemePerformance (every dinner always has a theme) from all of that
 * Meal/Theme's completed dinners, and creates a HELD Payout for the
 * restaurant (if the dinner has a price set - see createPayoutForDinner
 * for why an unpriced dinner is skipped rather than erroring).
 *
 * This endpoint should be called by a cron job every 10-15 minutes.
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

    const dinnersToComplete = await prisma.dinner.findMany({
      where: {
        status: { in: ["SCHEDULED", "LIVE"] },
        endsAt: { lt: new Date() },
      },
      select: { id: true, mealId: true, themeId: true },
    });

    // Create the payout for each dinner BEFORE flipping it to COMPLETED. If
    // the job dies mid-run, a dinner left un-flipped is simply reprocessed on
    // the next run (createPayoutForDinner is idempotent — unique on dinnerId).
    // The old order (updateMany COMPLETED first, then the payout loop) meant a
    // crash in between left the dinner COMPLETED with no payout, and later
    // runs — which only look at SCHEDULED/LIVE — would never create it.
    let payoutsCreated = 0;
    for (const dinner of dinnersToComplete) {
      const before = await prisma.payout.count({ where: { dinnerId: dinner.id } });
      await createPayoutForDinner(prisma, dinner.id);
      const after = await prisma.payout.count({ where: { dinnerId: dinner.id } });
      if (after > before) payoutsCreated++;

      await prisma.dinner.update({
        where: { id: dinner.id },
        data: { status: "COMPLETED" },
      });
    }

    const affectedMealIds = Array.from(
      new Set(dinnersToComplete.map((d) => d.mealId).filter((id): id is string => id !== null))
    );

    for (const mealId of affectedMealIds) {
      await recomputeMealPerformance(prisma, mealId);
    }

    const affectedThemeIds = Array.from(new Set(dinnersToComplete.map((d) => d.themeId)));

    for (const themeId of affectedThemeIds) {
      await recomputeThemePerformance(prisma, themeId);
    }

    return NextResponse.json({
      success: true,
      data: {
        dinnersCompleted: dinnersToComplete.length,
        mealsRecomputed: affectedMealIds.length,
        themesRecomputed: affectedThemeIds.length,
        payoutsCreated,
      },
    });
  } catch (error) {
    console.error("Error completing dinners:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : "Failed to complete dinners", code: "INTERNAL_ERROR" },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/complete-dinners
 *
 * Alternative POST endpoint for cron services that prefer POST
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
