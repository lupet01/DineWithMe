import type { PrismaClient } from "@prisma/client";

const BOOKED_SEAT_STATUSES = ["CONFIRMED", "ATTENDED", "COMPLETED"] as const;
const ATTENDED_SEAT_STATUSES = ["ATTENDED", "COMPLETED"] as const;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Recomputes MealPerformance for one Meal from its COMPLETED dinners -
 * reads directly from Dinner/Seat/Feedback/MutualInterest rather than
 * through DinnerContext, since DinnerContext's population job doesn't
 * exist (same gap Theme's own equivalent has). Call this any time a
 * dinner referencing this meal transitions to COMPLETED.
 */
export async function recomputeMealPerformance(prisma: PrismaClient, mealId: string): Promise<void> {
  const dinners = await prisma.dinner.findMany({
    where: { mealId, status: "COMPLETED" },
    include: {
      seats: true,
      feedback: true,
      mutualInterests: true,
    },
  });

  if (dinners.length === 0) {
    await prisma.mealPerformance.deleteMany({ where: { mealId } });
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

  await prisma.mealPerformance.upsert({
    where: { mealId },
    create: {
      mealId,
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
