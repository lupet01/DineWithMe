import { NextRequest, NextResponse } from "next/server";
import { trustProfileRepository } from "@dinewithme/db";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { handleApiError } from "@/app/api/lib/error-handler";
import { requireRole, isErrorResponse } from "@/lib/auth";
import { Role } from "@dinewithme/shared";

export interface TrustRecalculateResponse {
  success: boolean;
  data?: {
    totalEvaluated: number;
    flaggedCount: number;
    flaggedUsers: Array<{
      userId: string;
      email: string;
      trustScore: number;
      attendanceRate: number;
      negativeEventCount: number;
      uniqueDinnerCount: number;
    }>;
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * POST /api/trust/recalculate
 * 
 * Recalculate trust profiles for all users (admin only)
 * 
 * Pattern detection logic:
 * - If user has 3+ NEGATIVE_FEEDBACK or REPORTED events
 * - Across 3+ separate dinners
 * - Flag user in TrustProfile.flagged = true
 * 
 * Also recalculates:
 * - Trust scores (already updated on feedback submission)
 * - Attendance rates
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireRole([Role.PLATFORM_ADMIN], request);
    if (isErrorResponse(authResult)) {
      return authResult.error;
    }
    const { user } = authResult;

    // Recalculate all trust profiles
    const results = await trustProfileRepository.recalculateAll();

    // Track analytics
    try {
      await track(AnalyticsEvents.TRUST_RECALCULATED, {
        adminUserId: user.id,
        adminEmail: user.email,
        totalEvaluated: results.totalEvaluated,
        flaggedCount: results.flaggedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to track trust_recalculated:", error);
    }

    const response: TrustRecalculateResponse = {
      success: true,
      data: results,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
