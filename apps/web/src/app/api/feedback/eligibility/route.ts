import { NextRequest, NextResponse } from "next/server";
import { seatRepository, dinnerRepository, feedbackRepository, userRepository } from "@dinewithme/db";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { handleApiError } from "@/app/api/lib/error-handler";
import { requireAuth, isErrorResponse } from "@/lib/auth";

export interface FeedbackEligibilityResponse {
  success: boolean;
  data?: {
    eligible: boolean;
    reason?: string;
    dinnerId: string;
    dinnerTheme: string | null;
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * GET /api/feedback/eligibility?dinnerId=...
 * 
 * Check if user is eligible to submit feedback for a dinner
 * 
 * Eligibility criteria:
 * - User must have a CONFIRMED or ATTENDED seat for the dinner
 * - Dinner status must be COMPLETED
 * - User must not have already submitted feedback
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (isErrorResponse(authResult)) {
      return authResult.error;
    }
    const { user } = authResult;

    // Get database user
    const dbUser = await userRepository.findByAuthProviderId(user.clerkId);
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

    // Get dinnerId from query params
    const { searchParams } = new URL(request.url);
    const dinnerId = searchParams.get("dinnerId");

    if (!dinnerId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "dinnerId query parameter is required",
            code: "MISSING_DINNER_ID",
          },
        },
        { status: 400 }
      );
    }

    // Check if dinner exists (use findByIdWithDetails to include theme relation)
    const dinner = await dinnerRepository.findByIdWithDetails(dinnerId);
    if (!dinner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Dinner not found",
            code: "DINNER_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Check eligibility criteria
    let eligible = true;
    let reason: string | undefined;

    // 1. Check if dinner is COMPLETED
    if (dinner.status !== "COMPLETED") {
      eligible = false;
      reason = "Dinner is not completed yet";
    }

    // 2. Check if user has a CONFIRMED or ATTENDED seat
    if (eligible) {
      const userSeats = await seatRepository.findByDinnerAndUser(dinnerId, dbUser.id);
      
      const hasEligibleSeat = userSeats.some(
        seat => seat.status === "CONFIRMED" || seat.status === "ATTENDED" || seat.status === "COMPLETED"
      );

      if (!hasEligibleSeat) {
        eligible = false;
        reason = "You did not attend this dinner";
      }
    }

    // 3. Check if user has already submitted feedback
    if (eligible) {
      const hasSubmittedFeedback = await feedbackRepository.hasFeedbackForDinner(
        dbUser.id,
        dinnerId
      );

      if (hasSubmittedFeedback) {
        eligible = false;
        reason = "You have already submitted feedback for this dinner";
      }
    }

    // Track analytics
    try {
      if (eligible) {
        await track(AnalyticsEvents.FEEDBACK_PROMPT_ELIGIBLE, {
          userId: dbUser.id,
          dinnerId,
          dinnerTheme: dinner.theme?.title || null,
          timestamp: new Date().toISOString(),
        });
      } else {
        await track(AnalyticsEvents.FEEDBACK_PROMPT_NOT_ELIGIBLE, {
          userId: dbUser.id,
          dinnerId,
          dinnerTheme: dinner.theme?.title || null,
          reason: reason || "Unknown",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to track feedback eligibility:", error);
    }

    const response: FeedbackEligibilityResponse = {
      success: true,
      data: {
        eligible,
        reason: eligible ? undefined : reason,
        dinnerId,
        dinnerTheme: dinner.theme?.title || null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
