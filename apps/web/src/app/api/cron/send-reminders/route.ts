import { NextRequest, NextResponse } from "next/server";
import { dinnerRepository, seatRepository, userRepository } from "@dinewithme/db";
import { emailService } from "@dinewithme/email";
import { track, AnalyticsEvents } from "@dinewithme/analytics";

/**
 * Cron job to send dinner reminders 24 hours before
 * 
 * Schedule: Daily at 9:00 AM
 * Vercel Cron: 0 9 * * *
 * 
 * Usage:
 * - Add to vercel.json crons configuration
 * - Set CRON_SECRET environment variable
 * - Vercel will call this endpoint automatically
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

    // Find dinners starting in 24 hours (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const upcomingDinners = await dinnerRepository.findPublicDinners({
      from: tomorrow,
      to: dayAfter,
    });

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const dinner of upcomingDinners) {
      // Get all confirmed seats for this dinner
      const seats = await seatRepository.findByDinner(dinner.id);
      const confirmedSeats = seats.filter(s => s.status === "CONFIRMED");

      for (const seat of confirmedSeats) {
        if (!seat.confirmedByUserId) continue;
        
        // Get user details
        const user = await userRepository.findById(seat.confirmedByUserId);
        if (!user) continue;

        // Send reminder email
        const result = await emailService.sendDinnerReminder({
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          dinnerTitle: dinner.theme?.title || "Dinner Experience",
          restaurantName: dinner.restaurant.name,
          dinnerDate: new Date(dinner.startsAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          dinnerTime: new Date(dinner.startsAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          restaurantAddress: dinner.restaurant.address || "",
          mapUrl: dinner.restaurant.address 
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dinner.restaurant.address)}`
            : undefined,
          dinnerUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dinner/${dinner.id}`,
        });

        if (result.success) {
          emailsSent++;
        } else {
          emailsFailed++;
          console.error(`Failed to send reminder to ${user.email}:`, result.error);
        }

        // Track analytics
        await track(AnalyticsEvents.EMAIL_SENT, {
          emailType: "dinner_reminder",
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
        dinnersProcessed: upcomingDinners.length,
        emailsSent,
        emailsFailed,
      },
    });
  } catch (error) {
    console.error("Error sending dinner reminders:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
