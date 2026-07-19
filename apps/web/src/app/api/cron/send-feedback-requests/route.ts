import { NextRequest, NextResponse } from "next/server";
import { dinnerRepository, seatRepository, userRepository } from "@dinewithme/db";
import { emailService } from "@dinewithme/email";
import { track, AnalyticsEvents } from "@dinewithme/analytics";

/**
 * Cron job to send feedback requests after dinners
 * 
 * Schedule: Daily at 10:00 AM
 * Vercel Cron: 0 10 * * *
 * 
 * Sends feedback requests to diners who checked in to dinners
 * that ended in the last 24 hours
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find dinners that ended in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get dinners that ended yesterday
    const recentDinners = await dinnerRepository.findPublicDinners({
      from: yesterday,
      to: today,
    });

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const dinner of recentDinners) {
      // Only send feedback for dinners that have ended
      if (new Date(dinner.endsAt) > new Date()) {
        continue;
      }

      // Get all seats for this dinner
      const seats = await seatRepository.findByDinner(dinner.id);
      
      // Only send to diners who checked in
      const checkedInSeats = seats.filter(s => s.checkedInAt !== null);

      for (const seat of checkedInSeats) {
        if (!seat.confirmedByUserId) continue;
        
        // Get user details
        const user = await userRepository.findById(seat.confirmedByUserId);
        if (!user) continue;

        // Send feedback request email
        const result = await emailService.sendFeedbackRequest({
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          dinnerTitle: dinner.theme?.title || "Dinner Experience",
          restaurantName: dinner.restaurant.name,
          feedbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dinner/${dinner.id}/post-dinner`,
        });

        if (result.success) {
          emailsSent++;
        } else {
          emailsFailed++;
          console.error(`Failed to send feedback request to ${user.email}:`, result.error);
        }

        // Track analytics
        await track(AnalyticsEvents.EMAIL_SENT, {
          emailType: "feedback_request",
          recipient: user.email,
          success: result.success,
          dinnerId: dinner.id,
          userId: user.id,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        dinnersProcessed: recentDinners.length,
        emailsSent,
        emailsFailed,
      },
    });
  } catch (error) {
    console.error("Error sending feedback requests:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
