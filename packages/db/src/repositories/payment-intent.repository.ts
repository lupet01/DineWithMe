import type { PaymentIntent, Prisma, PaymentProvider, PaymentStatus } from "@prisma/client";
import { BaseRepository } from "./base";

export type PaymentIntentWithRelations = PaymentIntent & {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  dinner: {
    id: string;
    startsAt: Date;
    restaurant: {
      id: string;
      name: string;
    };
  };
  seat: {
    id: string;
    status: string;
  };
};

export class PaymentIntentRepository extends BaseRepository<PaymentIntent> {
  /**
   * Find payment intent by ID
   */
  async findById(id: string): Promise<PaymentIntent | null> {
    return this.prisma.paymentIntent.findUnique({
      where: { id },
    });
  }

  /**
   * Find payment intent by ID with relations
   */
  async findByIdWithRelations(id: string): Promise<PaymentIntentWithRelations | null> {
    return this.prisma.paymentIntent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        dinner: {
          select: {
            id: true,
            startsAt: true,
            restaurant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        seat: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Find all payment intents
   */
  async findMany(): Promise<PaymentIntent[]> {
    return this.prisma.paymentIntent.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find payment intents by user
   */
  async findByUser(userId: string): Promise<PaymentIntent[]> {
    return this.prisma.paymentIntent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find payment intents by dinner
   */
  async findByDinner(dinnerId: string): Promise<PaymentIntent[]> {
    return this.prisma.paymentIntent.findMany({
      where: { dinnerId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find payment intent by seat
   */
  async findBySeat(seatId: string): Promise<PaymentIntent | null> {
    return this.prisma.paymentIntent.findFirst({
      where: { seatId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find payment intent by provider reference
   */
  async findByProviderReference(providerReference: string): Promise<PaymentIntent | null> {
    return this.prisma.paymentIntent.findFirst({
      where: { providerReference },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find payment intents by status
   */
  async findByStatus(status: PaymentStatus): Promise<PaymentIntent[]> {
    return this.prisma.paymentIntent.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find payment intents by user and status
   */
  async findByUserAndStatus(userId: string, status: PaymentStatus): Promise<PaymentIntent[]> {
    return this.prisma.paymentIntent.findMany({
      where: {
        userId,
        status,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create a payment intent
   * 
   * @param data - Payment intent creation data
   * @returns Created payment intent
   */
  async createPaymentIntent(data: {
    userId: string;
    dinnerId: string;
    seatId: string;
    amount: number;
    currency?: string;
    provider: PaymentProvider;
    providerReference?: string;
  }): Promise<PaymentIntent> {
    return this.prisma.paymentIntent.create({
      data: {
        userId: data.userId,
        dinnerId: data.dinnerId,
        seatId: data.seatId,
        amount: data.amount,
        currency: data.currency || "ZAR",
        provider: data.provider,
        providerReference: data.providerReference,
        status: "CREATED",
      },
    });
  }

  /**
   * Mark payment as succeeded
   * 
   * @param id - Payment intent ID
   * @param providerReference - Reference from payment provider
   * @returns Updated payment intent
   */
  async markPaymentSucceeded(
    id: string,
    providerReference?: string
  ): Promise<PaymentIntent> {
    return this.prisma.paymentIntent.update({
      where: { id },
      data: {
        status: "SUCCEEDED",
        providerReference: providerReference || undefined,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark payment as failed
   * 
   * @param id - Payment intent ID
   * @returns Updated payment intent
   */
  async markPaymentFailed(id: string): Promise<PaymentIntent> {
    return this.prisma.paymentIntent.update({
      where: { id },
      data: {
        status: "FAILED",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark payment as requiring action
   * 
   * @param id - Payment intent ID
   * @param providerReference - Reference from payment provider
   * @returns Updated payment intent
   */
  async markPaymentRequiresAction(
    id: string,
    providerReference?: string
  ): Promise<PaymentIntent> {
    return this.prisma.paymentIntent.update({
      where: { id },
      data: {
        status: "REQUIRES_ACTION",
        providerReference: providerReference || undefined,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Atomically claim a payment intent for refunding.
   *
   * This must be called BEFORE calling out to the payment provider's refund
   * API, not after. The previous implementation read the status, called
   * Paystack, and only then wrote "REFUNDED" — two concurrent requests could
   * both pass the read-only status check before either wrote, so both would
   * call Paystack's live refund endpoint for the same payment. Claiming first
   * via a guarded `updateMany` closes that window: only one concurrent caller
   * can win the claim, the other gets a clean rejection immediately and never
   * touches the provider. If the provider call subsequently fails, the caller
   * must call `revertRefundClaim` to release the claim back to SUCCEEDED.
   *
   * @param id - Payment intent ID
   * @returns The claimed (now REFUNDED) payment intent
   * @throws Error if the payment intent doesn't exist or isn't SUCCEEDED
   *   (including if another request already claimed/refunded it)
   */
  async refundPayment(id: string): Promise<PaymentIntent> {
    const { count } = await this.prisma.paymentIntent.updateMany({
      where: { id, status: "SUCCEEDED" },
      data: {
        status: "REFUNDED",
        updatedAt: new Date(),
      },
    });

    if (count === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error("Payment intent not found");
      }
      throw new Error(`Cannot refund payment with status: ${existing.status}`);
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Payment intent not found after refund claim");
    }
    return updated;
  }

  /**
   * Release a refund claim back to SUCCEEDED.
   *
   * Call this if `refundPayment` claimed the payment intent but the
   * subsequent call to the payment provider's refund API then failed —
   * otherwise the payment would be stuck marked REFUNDED with no actual
   * refund having happened, and nobody could retry it.
   */
  async revertRefundClaim(id: string): Promise<PaymentIntent> {
    return this.prisma.paymentIntent.update({
      where: { id },
      data: {
        status: "SUCCEEDED",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Create a payment intent (generic create method)
   */
  async create(data: Prisma.PaymentIntentCreateInput): Promise<PaymentIntent> {
    return this.prisma.paymentIntent.create({
      data,
    });
  }

  /**
   * Update a payment intent
   */
  async update(id: string, data: Prisma.PaymentIntentUpdateInput): Promise<PaymentIntent> {
    return this.prisma.paymentIntent.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a payment intent
   */
  async delete(id: string): Promise<PaymentIntent> {
    return this.prisma.paymentIntent.delete({
      where: { id },
    });
  }

  /**
   * Get payment statistics for a user
   */
  async getUserPaymentStats(userId: string): Promise<{
    totalPayments: number;
    succeededPayments: number;
    failedPayments: number;
    refundedPayments: number;
    totalAmountPaid: number;
  }> {
    const payments = await this.findByUser(userId);

    const totalPayments = payments.length;
    const succeededPayments = payments.filter((p) => p.status === "SUCCEEDED").length;
    const failedPayments = payments.filter((p) => p.status === "FAILED").length;
    const refundedPayments = payments.filter((p) => p.status === "REFUNDED").length;
    const totalAmountPaid = payments
      .filter((p) => p.status === "SUCCEEDED")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPayments,
      succeededPayments,
      failedPayments,
      refundedPayments,
      totalAmountPaid,
    };
  }

  /**
   * Get payment statistics for a dinner
   */
  async getDinnerPaymentStats(dinnerId: string): Promise<{
    totalPayments: number;
    succeededPayments: number;
    failedPayments: number;
    totalAmountCollected: number;
  }> {
    const payments = await this.findByDinner(dinnerId);

    const totalPayments = payments.length;
    const succeededPayments = payments.filter((p) => p.status === "SUCCEEDED").length;
    const failedPayments = payments.filter((p) => p.status === "FAILED").length;
    const totalAmountCollected = payments
      .filter((p) => p.status === "SUCCEEDED")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPayments,
      succeededPayments,
      failedPayments,
      totalAmountCollected,
    };
  }

  /**
   * Sum the amount of all SUCCEEDED payment intents (for platform analytics
   * total revenue). Aggregated in the database via aggregate() - does not
   * load rows into memory.
   */
  async sumSucceededAmount(): Promise<number> {
    const result = await this.prisma.paymentIntent.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amount: true },
    });

    return result._sum.amount ?? 0;
  }

  /**
   * Sum the amount of SUCCEEDED payment intents created since a given
   * date (for the admin Cockpit's rolling revenue stat). Aggregated in
   * the database via aggregate() - does not load rows into memory.
   */
  async sumSucceededAmountSince(since: Date): Promise<number> {
    const result = await this.prisma.paymentIntent.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: since } },
      _sum: { amount: true },
    });

    return result._sum.amount ?? 0;
  }

  /**
   * Sum SUCCEEDED payment intents for a single restaurant (for Restaurant
   * Analytics), joined through Dinner.restaurantId since PaymentIntent has
   * no restaurantId column of its own. Aggregated in the database - does
   * not load rows into memory.
   */
  async sumSucceededAmountForRestaurant(restaurantId: string): Promise<number> {
    const result = await this.prisma.paymentIntent.aggregate({
      where: { status: "SUCCEEDED", dinner: { restaurantId } },
      _sum: { amount: true },
    });

    return result._sum.amount ?? 0;
  }

  /**
   * Sum SUCCEEDED payment intents for a single restaurant created since a
   * given date (for the restaurant admin Dashboard's "Revenue (30d)"
   * stat) - same restaurant scoping as sumSucceededAmountForRestaurant,
   * plus the createdAt lower bound from sumSucceededAmountSince. Aggregated
   * in the database - does not load rows into memory.
   */
  async sumSucceededAmountForRestaurantSince(restaurantId: string, since: Date): Promise<number> {
    const result = await this.prisma.paymentIntent.aggregate({
      where: { status: "SUCCEEDED", createdAt: { gte: since }, dinner: { restaurantId } },
      _sum: { amount: true },
    });

    return result._sum.amount ?? 0;
  }

  /**
   * Sum SUCCEEDED payment intents for a restaurant within a bounded
   * window - used to compute the prior-period comparison for the
   * Dashboard's revenue range picker (§16.11 wireframe's "vs prior
   * period" caption). `until` is exclusive so back-to-back windows never
   * double-count a payment created exactly on the boundary.
   */
  async sumSucceededAmountForRestaurantBetween(
    restaurantId: string,
    since: Date,
    until: Date
  ): Promise<number> {
    const result = await this.prisma.paymentIntent.aggregate({
      where: {
        status: "SUCCEEDED",
        createdAt: { gte: since, lt: until },
        dinner: { restaurantId },
      },
      _sum: { amount: true },
    });

    return result._sum.amount ?? 0;
  }
}
