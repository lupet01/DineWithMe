import { dinnerRepository, seatRepository, userRepository } from "@dinewithme/db";
import { emailService } from "@dinewithme/email";
import { inngest } from "../client";

/**
 * The reminder Vercel Cron can't deliver: api/cron/send-reminders only runs
 * once daily at 9am and sends a "24h before" batch (confirmed against that
 * route directly) - the wireframe promises "30 minutes before," which needs
 * a job scheduled for each individual dinner's actual start time, not a
 * fixed daily sweep.
 *
 * Triggered by a "seat/confirmed" event (emitted from
 * api/seats/[seatId]/confirm/route.ts on successful confirmation).
 * step.sleepUntil is durable - if the server restarts or redeploys during
 * the wait, Inngest resumes this run from where it left off rather than
 * losing it, which a setTimeout-based approach could not guarantee.
 */
export const dinnerReminder30Min = inngest.createFunction(
  { id: "dinner-reminder-30-min" },
  { event: "seat/confirmed" },
  async ({ event, step }) => {
    const { seatId, dinnerId, userId } = event.data;

    const dinner = await step.run("load-dinner", async () => {
      return dinnerRepository.findByIdWithRestaurant(dinnerId);
    });
    if (!dinner) return { skipped: "dinner-not-found" };

    // dinner.startsAt comes back as a string here, not a Date - step.run()
    // results are JSON-serialized for durability/replay across the wait.
    const reminderTime = new Date(new Date(dinner.startsAt).getTime() - 30 * 60 * 1000);

    // If the seat was confirmed less than 30 minutes before the dinner
    // starts (a last-minute booking), there's no reminder window left.
    if (reminderTime.getTime() <= Date.now()) {
      return { skipped: "too-close-to-start" };
    }

    await step.sleepUntil("wait-until-30-min-before", reminderTime);

    // Re-check the seat is still confirmed right before sending - it may
    // have been cancelled during the wait, and a reminder for a cancelled
    // booking would be actively wrong, not just unnecessary.
    const seat = await step.run("verify-seat-still-confirmed", async () => {
      return seatRepository.findById(seatId);
    });
    if (!seat || seat.status !== "CONFIRMED") {
      return { skipped: "seat-no-longer-confirmed" };
    }

    const user = await step.run("load-user", async () => {
      return userRepository.findById(userId);
    });
    if (!user) return { skipped: "user-not-found" };

    await step.run("send-reminder-email", async () => {
      await emailService.sendDinnerReminder({
        userEmail: user.email,
        userName: user.firstName || user.email,
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
        dinnerUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/dinner/${dinner.id}`,
      });
    });

    return { sent: true };
  }
);
