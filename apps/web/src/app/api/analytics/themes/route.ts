import { NextResponse } from "next/server";
import { analyticsRepository } from "@dinewithme/db";
import { handleApiError } from "../../lib/error-handler";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/analytics/themes
 * 
 * Get theme performance analytics
 * 
 * Returns aggregated metrics per theme:
 * - Total dinners
 * - Seat confirmation rate
 * - Attendance rate
 * - Average comfort score
 * - Report rate
 * 
 * Authorization: Platform admin only
 */
export async function GET() {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is platform admin
    if (user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Platform admin access required." },
        { status: 403 }
      );
    }

    // Get theme analytics
    const analytics = await analyticsRepository.getThemeAnalytics();

    return NextResponse.json({
      success: true,
      data: {
        themes: analytics,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
