import type { Payout, PayoutStatus, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export type PayoutWithDinner = Payout & {
  dinner: { id: string; startsAt: Date; endsAt: Date; theme: { title: string } | null };
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
    return this.prisma.payout.findUnique({
      where: { id },
      include: {
        dinner: {
          select: { id: true, startsAt: true, endsAt: true, theme: { select: { title: true } } },
        },
      },
    });
  }

  async findMany(): Promise<Payout[]> {
    return this.prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<PayoutWithDinner[]> {
    return this.prisma.payout.findMany({
      where: { restaurantId },
      include: {
        dinner: {
          select: { id: true, startsAt: true, endsAt: true, theme: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByStatus(status: PayoutStatus): Promise<PayoutWithDinnerAndRestaurant[]> {
    return this.prisma.payout.findMany({
      where: { status },
      include: {
        dinner: {
          select: { id: true, startsAt: true, endsAt: true, theme: { select: { title: true } } },
        },
        restaurant: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  /**
   * Every payout across every restaurant, regardless of status - backs
   * Payout Settlement's Ready/Held/Paid tabs, which filter client-side
   * over one fetch rather than three separate queries.
   */
  async findAllWithRestaurant(): Promise<PayoutWithDinnerAndRestaurant[]> {
    return this.prisma.payout.findMany({
      include: {
        dinner: {
          select: { id: true, startsAt: true, endsAt: true, theme: { select: { title: true } } },
        },
        restaurant: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
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
