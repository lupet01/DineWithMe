import type { PrismaClient } from "@prisma/client";

const BOOKED_SEAT_STATUSES = ["CONFIRMED", "ATTENDED", "COMPLETED"] as const;
const ATTENDED_SEAT_STATUSES = ["ATTENDED", "COMPLETED"] as const;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Recomputes ThemePerformance for one Theme from its COMPLETED dinners -
 * mirrors recomputeMealPerformance exactly, keyed by themeId instead of
 * mealId (every Dinner always has a Theme, unlike the optional Meal, so
 * there's no "no theme" skip case here). Deliberately does not populate
 * the byRestaurantType/byCuisine/byDayOfWeek/byPriceTier/byWeather/byCity
 * JSON breakdown fields, or byConversationStyle - "Conversation Style"
 * doesn't exist anywhere in this codebase as a real dimension (no enum,
 * no schema column), and the other breakdowns would need DinnerContext
 * population, which doesn't exist either (§16.4/§16.24). Those fields
 * stay whatever they already are; only the outcome-metric averages below
 * are real. Call this any time a dinner referencing this theme
 * transitions to COMPLETED.
 */
export async function recomputeThemePerformance(prisma: PrismaClient, themeId: string): Promise<void> {
  const dinners = await prisma.dinner.findMany({
    where: { themeId, status: "COMPLETED" },
    include: {
      seats: true,
      feedback: true,
      mutualInterests: true,
    },
  });

  if (dinners.length === 0) {
    await prisma.themePerformance.deleteMany({ where: { themeId } });
    return;
  }

  let totalSeatsBooked = 0;
  const fillRates: number[] = [];
  const attendanceRates: number[] = [];
  const connectionRates: number[] = [];
  const feedbackScores: number[] = [];
  const wouldReturnFlags: boolean[] = [];

  for (const dinner of dinners) {
    const bookedSeats = dinner.seats.filter((s) => BOOKED_SEAT_STATUSES.includes(s.status as (typeof BOOKED_SEAT_STATUSES)[number]));
    const attendedSeats = dinner.seats.filter((s) => ATTENDED_SEAT_STATUSES.includes(s.status as (typeof ATTENDED_SEAT_STATUSES)[number]));

    totalSeatsBooked += bookedSeats.length;

    if (dinner.seatCount > 0) {
      fillRates.push(bookedSeats.length / dinner.seatCount);
    }
    if (bookedSeats.length > 0) {
      attendanceRates.push(attendedSeats.length / bookedSeats.length);
    }

    if (attendedSeats.length > 0) {
      const connectedUserIds = new Set<string>();
      for (const mi of dinner.mutualInterests) {
        connectedUserIds.add(mi.userAId);
        connectedUserIds.add(mi.userBId);
      }
      connectionRates.push(connectedUserIds.size / attendedSeats.length);
    }

    for (const fb of dinner.feedback) {
      if (fb.rating !== null) feedbackScores.push(fb.rating);
      if (fb.wouldDineAgain !== null) wouldReturnFlags.push(fb.wouldDineAgain);
    }
  }

  const avgWouldReturnRate =
    wouldReturnFlags.length > 0
      ? wouldReturnFlags.filter(Boolean).length / wouldReturnFlags.length
      : null;

  await prisma.themePerformance.upsert({
    where: { themeId },
    create: {
      themeId,
      totalDinners: dinners.length,
      totalSeatsBooked,
      avgFillRate: average(fillRates),
      avgAttendanceRate: average(attendanceRates),
      avgFeedbackScore: average(feedbackScores),
      avgConnectionRate: average(connectionRates),
      avgWouldReturnRate,
    },
    update: {
      totalDinners: dinners.length,
      totalSeatsBooked,
      avgFillRate: average(fillRates),
      avgAttendanceRate: average(attendanceRates),
      avgFeedbackScore: average(feedbackScores),
      avgConnectionRate: average(connectionRates),
      avgWouldReturnRate,
    },
  });
}
