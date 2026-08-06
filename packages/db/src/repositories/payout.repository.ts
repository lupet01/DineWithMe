import type { Payout, PayoutStatus, Prisma, SeatStatus } from "@prisma/client";
import { BaseRepository } from "./base";

// Mirrors packages/db/src/services/payout.ts's BOOKED_SEAT_STATUSES - what
// actually counts as a paying seat for "(N seats)" display purposes.
const BOOKED_SEAT_STATUSES: SeatStatus[] = ["CONFIRMED", "ATTENDED", "COMPLETED"];

export type PayoutWithDinner = Payout & {
  dinner: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    theme: { title: string } | null;
    bookedSeatCount: number;
  };
};

export type PayoutWithDinnerAndRestaurant = PayoutWithDinner & {
  restaurant: { id: string; name: string };
};

export class PayoutRepository extends BaseRepository<Payout> {
  async findById(id: string): Promise<Payout | null> {
    return this.prisma.payout.findUnique({
      where: { id },
    });
  }

  async findByIdWithDinner(id: string): Promise<PayoutWithDinner | null> {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: {
        dinner: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            theme: { select: { title: true } },
            seats: { where: { status: { in: BOOKED_SEAT_STATUSES } }, select: { id: true } },
          },
        },
      },
    });
    return payout ? withBookedSeatCount(payout) : null;
  }

  async findMany(): Promise<Payout[]> {
    return this.prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<PayoutWithDinner[]> {
    const payouts = await this.prisma.payout.findMany({
      where: { restaurantId },
      include: {
        dinner: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            theme: { select: { title: true } },
            seats: { where: { status: { in: BOOKED_SEAT_STATUSES } }, select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return payouts.map(withBookedSeatCount);
  }

  async findByStatus(status: PayoutStatus): Promise<PayoutWithDinnerAndRestaurant[]> {
    const payouts = await this.prisma.payout.findMany({
      where: { status },
      include: {
        dinner: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            theme: { select: { title: true } },
            seats: { where: { status: { in: BOOKED_SEAT_STATUSES } }, select: { id: true } },
          },
        },
        restaurant: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
    return payouts.map(withBookedSeatCount);
  }

  /**
   * Every payout across every restaurant, regardless of status - backs
   * Payout Settlement's Ready/Held/Paid tabs, which filter client-side
   * over one fetch rather than three separate queries.
   */
  async findAllWithRestaurant(): Promise<PayoutWithDinnerAndRestaurant[]> {
    const payouts = await this.prisma.payout.findMany({
      include: {
        dinner: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            theme: { select: { title: true } },
            seats: { where: { status: { in: BOOKED_SEAT_STATUSES } }, select: { id: true } },
          },
        },
        restaurant: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
    return payouts.map(withBookedSeatCount);
  }

  async findByDinnerId(dinnerId: string): Promise<Payout | null> {
    return this.prisma.payout.findUnique({
      where: { dinnerId },
    });
  }

  async create(data: Prisma.PayoutCreateInput): Promise<Payout> {
    return this.prisma.payout.create({
      data,
    });
  }

  async update(id: string, data: Prisma.PayoutUpdateInput): Promise<Payout> {
    return this.prisma.payout.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Payout> {
    return this.prisma.payout.delete({
      where: { id },
    });
  }

  /**
   * Every HELD payout whose scheduledAt has passed - the query the
   * HELD->READY cron runs.
   */
  async findDueForRelease(now: Date = new Date()): Promise<Payout[]> {
    return this.prisma.payout.findMany({
      where: { status: "HELD", scheduledAt: { lte: now } },
    });
  }

  /**
   * Marks a batch of READY payouts PAID in one transaction - backs
   * "Process Selected Payouts". Only ever moves READY -> PAID; a payout
   * not currently READY is silently skipped rather than erroring, so a
   * stale selection (e.g. one row already processed by someone else)
   * doesn't fail the whole batch.
   */
  async markPaid(payoutIds: string[]): Promise<number> {
    const result = await this.prisma.payout.updateMany({
      where: { id: { in: payoutIds }, status: "READY" },
      data: { status: "PAID", paidAt: new Date() },
    });
    return result.count;
  }
}

type DinnerWithBookedSeats = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  theme: { title: string } | null;
  seats: { id: string }[];
};

/**
 * Collapses the filtered `seats` relation (loaded solely to count booked
 * seats) into a plain `bookedSeatCount` number, so callers never see the
 * raw seat rows - matches the "(N seats)" wireframe copy without leaking
 * seat-level detail into payout list views.
 */
function toBookedSeatCount(dinner: DinnerWithBookedSeats) {
  const { seats, ...rest } = dinner;
  return { ...rest, bookedSeatCount: seats.length };
}

function withBookedSeatCount<T extends { dinner: DinnerWithBookedSeats }>(
  payout: T
): Omit<T, "dinner"> & { dinner: ReturnType<typeof toBookedSeatCount> } {
  return {
    ...payout,
    dinner: toBookedSeatCount(payout.dinner),
  } as Omit<T, "dinner"> & { dinner: ReturnType<typeof toBookedSeatCount> };
}
