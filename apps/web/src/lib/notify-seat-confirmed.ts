import { dinnerRepository, paymentIntentRepository, auditLogger } from "@dinewithme/db";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { emailService } from "@dinewithme/email";
import { inngest } from "@/inngest/client";

interface NotifySeatConfirmedParams {
  user: { id: string; email: string; firstName?: string | null };
  seatId: string;
  dinnerId: string;
}

/**
 * Everything that should happen once a seat transitions to CONFIRMED,
 * regardless of which path got it there (paid via the Paystack webhook,
 * or free via api/bookings/create) - audit log, analytics, the 30-min
 * reminder job, and the booking confirmation/receipt emails. Shared so
 * both paths behave identically instead of each reimplementing a subset.
 */
export async function notifySeatConfirmed({
  user,
  seatId,
  dinnerId,
}: NotifySeatConfirmedParams): Promise<void> {
  await auditLogger.logSeatConfirmed(user.id, seatId, {
    dinnerId,
    confirmedAt: new Date().toISOString(),
  });

  await track(AnalyticsEvents.SEAT_CONFIRMED, {
    userId: user.id,
    dinnerId,
    seatId,
    timestamp: new Date().toISOString(),
  });

  // Best-effort - scheduling the reminder must not fail the confirmation
  // itself, which has already succeeded.
  try {
    await inngest.send({
      name: "seat/confirmed",
      data: { seatId, dinnerId, userId: user.id },
    });
  } catch (error) {
    console.error("Failed to schedule dinner reminder job:", error);
  }

  // Best-effort - a failed confirmation email must not fail the
  // confirmation itself.
  try {
    const [dinner, paymentIntent] = await Promise.all([
      dinnerRepository.findByIdWithRestaurant(dinnerId),
      paymentIntentRepository.findBySeat(seatId),
    ]);

    if (dinner) {
      const startsAt = new Date(dinner.startsAt);
      const dinnerDate = startsAt.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const dinnerTime = startsAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      await emailService.sendBookingConfirmation({
        userEmail: user.email,
        userName: user.firstName || user.email,
        dinnerTitle: dinner.theme?.title || "Dinner",
        restaurantName: dinner.restaurant.name,
        dinnerDate,
        dinnerTime,
        restaurantAddress: dinner.restaurant.address ?? dinner.restaurant.city ?? "",
        totalSeats: dinner.seatCount,
        myDinnersUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/my-dinners`,
      });

      if (paymentIntent && paymentIntent.status === "SUCCEEDED") {
        await emailService.sendPaymentReceipt({
          userEmail: user.email,
          userName: user.firstName || user.email,
          dinnerTitle: dinner.theme?.title || "Dinner",
          restaurantName: dinner.restaurant.name,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          paymentDate: new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          transactionId: paymentIntent.id,
        });
      }
    }
  } catch (error) {
    console.error("Failed to send booking confirmation/receipt email:", error);
  }
}
