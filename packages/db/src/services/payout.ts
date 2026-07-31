import type { PrismaClient } from "@prisma/client";
import { calculateCommission, getPayoutScheduledDate } from "@dinewithme/config/src/payout-policy";
import { paymentConfig } from "@dinewithme/config/src/payment";

const BOOKED_SEAT_STATUSES = ["CONFIRMED", "ATTENDED", "COMPLETED"];

/**
 * Creates a HELD Payout for a completed dinner - gross revenue is
 * confirmed seats x Dinner.pricePerSeatCents, net is gross minus the
 * platform's commission (§16.5). The booking fee is tracked separately,
 * informational only, since it's never owed to the restaurant.
 *
 * No-ops (does not throw) if:
 * - the dinner has no pricePerSeatCents (nothing was actually charged for
 *   food, so there's nothing to pay out - legacy/unpriced dinner)
 * - a Payout already exists for this dinner (idempotent - safe to call
 *   more than once for the same dinner)
 */
export async function createPayoutForDinner(prisma: PrismaClient, dinnerId: string): Promise<void> {
  const existing = await prisma.payout.findUnique({ where: { dinnerId } });
  if (existing) return;

  const dinner = await prisma.dinner.findUnique({
    where: { id: dinnerId },
    include: { seats: true },
  });
  if (!dinner || dinner.pricePerSeatCents == null) return;

  const bookedSeats = dinner.seats.filter((s) => BOOKED_SEAT_STATUSES.includes(s.status));
  const grossAmountCents = bookedSeats.length * dinner.pricePerSeatCents;
  const commissionAmountCents = calculateCommission(grossAmountCents);
  const bookingFeeCents = bookedSeats.length * paymentConfig.bookingFeeCents;

  await prisma.payout.create({
    data: {
      restaurant: { connect: { id: dinner.restaurantId } },
      dinner: { connect: { id: dinner.id } },
      grossAmountCents,
      commissionAmountCents,
      bookingFeeCents,
      netAmountCents: grossAmountCents - commissionAmountCents,
      status: "HELD",
      scheduledAt: getPayoutScheduledDate(dinner.endsAt),
    },
  });
}

/**
 * Moves every HELD payout whose post-dinner hold window has closed to
 * READY - the point at which Platform Ops can actually process it.
 */
export async function releaseDuePayouts(prisma: PrismaClient): Promise<number> {
  const result = await prisma.payout.updateMany({
    where: { status: "HELD", scheduledAt: { lte: new Date() } },
    data: { status: "READY" },
  });
  return result.count;
}
