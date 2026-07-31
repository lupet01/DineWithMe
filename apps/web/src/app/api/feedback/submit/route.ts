import { NextRequest, NextResponse } from "next/server";
import type { TrustEventType } from "@prisma/client";
import {
  feedbackRepository,
  mutualInterestRepository,
  trustEventRepository,
  trustProfileRepository,
  userRepository,
  dinnerRepository,
  seatRepository,
  safetyReportRepository
} from "@dinewithme/db";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { handleApiError } from "@/app/api/lib/error-handler";
import { requireAuth, isErrorResponse } from "@/lib/auth";
import { createFeedbackSchema } from "@dinewithme/shared";

export interface FeedbackSubmitRequest {
  dinnerId: string;
  overallSentiment: "GREAT" | "GOOD" | "NEUTRAL" | "UNCOMFORTABLE";
  comfortLevel: "FULL" | "MOSTLY" | "LOW";
  wouldDineAgain?: boolean | null;
  notes?: string | null;
  rating?: number | null;
  vibeTags?: string[];
  // Reason category from the Post-Dinner "Report Something" screen. Only
  // meaningful when comfortLevel === "LOW"; falls back to SAFETY_CONCERN
  // below when omitted (e.g. requests from older clients).
  reportReason?: "MADE_UNCOMFORTABLE" | "INAPPROPRIATE_BEHAVIOR" | "SAFETY_CONCERN" | "OTHER" | null;
  // Who the report is about, from the "Report Something" screen's attendee
  // picker. Never trusted as-is - cross-checked below against this dinner's
  // actual confirmed attendees before being written to the SafetyReport.
  reportedUserId?: string | null;
  personSignals?: Array<{
    targetUserId: string;
    wouldDineAgain: boolean;
  }>;
}

export interface FeedbackSubmitResponse {
  success: boolean;
  data?: {
    feedbackId: string;
    mutualInterestsCreated: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * POST /api/feedback/submit
 * 
 * Submit post-dinner feedback
 * 
 * Creates:
 * - Table-level feedback record
 * - Per-person feedback records (if provided)
 * - Mutual interest records (if both users said yes)
 * - Trust events based on sentiment
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: FeedbackSubmitRequest = await request.json();

    // Validate with Zod schema
    const validation = createFeedbackSchema.safeParse({
      dinnerId: body.dinnerId,
      overallSentiment: body.overallSentiment,
      comfortLevel: body.comfortLevel,
      wouldDineAgain: body.wouldDineAgain,
      notes: body.notes,
      rating: body.rating,
      vibeTags: body.vibeTags,
      reportReason: body.reportReason,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: validation.error.errors[0]?.message || "Invalid input",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    // Check if dinner exists and is completed
    const dinner = await dinnerRepository.findByIdWithDetails(body.dinnerId);
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

    if (dinner.status !== "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Dinner is not completed yet",
            code: "DINNER_NOT_COMPLETED",
          },
        },
        { status: 400 }
      );
    }

    // Check if user attended the dinner
    const userSeats = await seatRepository.findByDinnerAndUser(body.dinnerId, dbUser.id);
    const hasEligibleSeat = userSeats.some(
      seat => seat.status === "CONFIRMED" || seat.status === "ATTENDED" || seat.status === "COMPLETED"
    );

    if (!hasEligibleSeat) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "You did not attend this dinner",
            code: "NOT_ATTENDED",
          },
        },
        { status: 403 }
      );
    }

    // Check if user has already submitted feedback
    const hasSubmittedFeedback = await feedbackRepository.hasFeedbackForDinner(
      dbUser.id,
      body.dinnerId
    );

    if (hasSubmittedFeedback) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "You have already submitted feedback for this dinner",
            code: "ALREADY_SUBMITTED",
          },
        },
        { status: 400 }
      );
    }

    // Create table-level feedback
    const tableFeedback = await feedbackRepository.create({
      dinner: { connect: { id: body.dinnerId } },
      author: { connect: { id: dbUser.id } },
      overallSentiment: body.overallSentiment,
      comfortLevel: body.comfortLevel,
      wouldDineAgain: body.wouldDineAgain,
      notes: body.notes,
      rating: body.rating ?? undefined,
      vibeTags: body.vibeTags ?? undefined,
    });

    // Process per-person signals and collect target user IDs for trust events
    const targetUserIds: string[] = [];
    let mutualInterestsCreated = 0;
    
    if (body.personSignals && body.personSignals.length > 0) {
      for (const signal of body.personSignals) {
        // Create per-person feedback
        await feedbackRepository.create({
          dinner: { connect: { id: body.dinnerId } },
          author: { connect: { id: dbUser.id } },
          target: { connect: { id: signal.targetUserId } },
          overallSentiment: body.overallSentiment,
          comfortLevel: body.comfortLevel,
          wouldDineAgain: signal.wouldDineAgain,
        });

        targetUserIds.push(signal.targetUserId);

        // Check if target user also said yes for mutual interest
        if (signal.wouldDineAgain) {
          const targetFeedback = await feedbackRepository.findByAuthorTargetAndDinner(
            signal.targetUserId,
            dbUser.id,
            body.dinnerId
          );
          const targetSaidYes = targetFeedback?.wouldDineAgain === true;

          if (targetSaidYes) {
            const exists = await mutualInterestRepository.exists(
              dbUser.id,
              signal.targetUserId,
              body.dinnerId
            );

            if (!exists) {
              await mutualInterestRepository.createMutualInterest(
                dbUser.id,
                signal.targetUserId,
                body.dinnerId
              );
              mutualInterestsCreated++;

              // Track mutual interest creation
              await track(AnalyticsEvents.MUTUAL_INTEREST_CREATED, {
                userAId: dbUser.id,
                userBId: signal.targetUserId,
                dinnerId: body.dinnerId,
                dinnerTheme: dinner.theme?.title || null,
                timestamp: new Date().toISOString(),
              });

              await track(AnalyticsEvents.FEEDBACK_PERSON_SIGNAL_RECORDED, {
                userId: dbUser.id,
                dinnerId: body.dinnerId,
                targetUserId: signal.targetUserId,
                wouldDineAgain: true,
                mutualInterest: true,
                timestamp: new Date().toISOString(),
              });
            }
          } else {
            await track(AnalyticsEvents.FEEDBACK_PERSON_SIGNAL_RECORDED, {
              userId: dbUser.id,
              dinnerId: body.dinnerId,
              targetUserId: signal.targetUserId,
              wouldDineAgain: signal.wouldDineAgain,
              mutualInterest: false,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    // "I want to report something" in the Safety Check step sends
    // wouldDineAgain: false with LOW comfort (see safety-flag-step.tsx) -
    // creates a SafetyReport for the Trust & Safety admin queue. The step
    // doesn't collect which specific person, so this is a table/dinner-level
    // report (reportedUserId stays unset). The dedicated "Report Something"
    // screen now collects a reason category (reportReason); fall back to
    // SAFETY_CONCERN for older clients that only send free text.
    if (body.comfortLevel === "LOW" && body.wouldDineAgain === false) {
      // Never trust body.reportedUserId as-is - only accept it if it names
      // someone who actually had a confirmed seat at this exact dinner.
      const isRealAttendee =
        !!body.reportedUserId &&
        body.reportedUserId !== dbUser.id &&
        dinner.seats.some((seat) => seat.confirmedByUser?.id === body.reportedUserId);

      await safetyReportRepository.create({
        reporter: { connect: { id: dbUser.id } },
        dinner: { connect: { id: body.dinnerId } },
        reason: body.reportReason || "SAFETY_CONCERN",
        reasonDetail: body.notes || null,
        ...(isRealAttendee
          ? { reportedUser: { connect: { id: body.reportedUserId! } } }
          : {}),
      });
    }

    // Create trust events based on EPIC 5.4 rules
    const trustUpdates: Array<{ userId: string; weightDelta: number; eventType: TrustEventType }> = [];

    // Rule 1: POSITIVE_FEEDBACK if sentiment is GREAT/GOOD and comfort is not LOW
    if (
      (body.overallSentiment === "GREAT" || body.overallSentiment === "GOOD") &&
      body.comfortLevel !== "LOW"
    ) {
      // Apply to all target users (per-person feedback)
      for (const targetUserId of targetUserIds) {
        trustUpdates.push({
          userId: targetUserId,
          weightDelta: 0.05,
          eventType: "POSITIVE_FEEDBACK",
        });
      }
    }

    // Rule 2: NEGATIVE_FEEDBACK if sentiment is UNCOMFORTABLE
    if (body.overallSentiment === "UNCOMFORTABLE") {
      // Apply to all target users
      for (const targetUserId of targetUserIds) {
        trustUpdates.push({
          userId: targetUserId,
          weightDelta: -0.1,
          eventType: "NEGATIVE_FEEDBACK",
        });
      }
    }

    // Rule 3: REPORTED if safety flag selected (wouldDineAgain = false with LOW comfort)
    if (body.comfortLevel === "LOW" && body.wouldDineAgain === false) {
      // Apply to all target users
      for (const targetUserId of targetUserIds) {
        trustUpdates.push({
          userId: targetUserId,
          weightDelta: -0.2,
          eventType: "REPORTED",
        });
      }
    }

    // Create trust events and update trust scores
    for (const update of trustUpdates) {
      // Create trust event
      await trustEventRepository.create({
        user: { connect: { id: update.userId } },
        type: update.eventType,
        weight: update.weightDelta,
        sourceDinnerId: body.dinnerId,
        metadata: {
          feedbackId: tableFeedback.id,
          authorId: dbUser.id,
          sentiment: body.overallSentiment,
          comfortLevel: body.comfortLevel,
        },
      });

      // Update trust score with bounded function
      await trustProfileRepository.updateTrustScore(update.userId, update.weightDelta);
    }

    // Track feedback submission
    await track(AnalyticsEvents.FEEDBACK_SUBMITTED, {
      userId: dbUser.id,
      dinnerId: body.dinnerId,
      dinnerTheme: dinner.theme?.title || null,
      overallSentiment: body.overallSentiment,
      comfortLevel: body.comfortLevel,
      wouldDineAgain: body.wouldDineAgain,
      personSignalsCount: body.personSignals?.length || 0,
      mutualInterestsCreated,
      timestamp: new Date().toISOString(),
    });

    const response: FeedbackSubmitResponse = {
      success: true,
      data: {
        feedbackId: tableFeedback.id,
        mutualInterestsCreated,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
