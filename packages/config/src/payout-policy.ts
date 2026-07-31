/**
 * Payout Policy Configuration (§16.5)
 *
 * Defines how much of a dinner's collected revenue a restaurant nets, and
 * how long a Payout sits HELD after the dinner before it's eligible to
 * move to READY. The booking fee is never part of what a restaurant is
 * owed - the platform keeps all of it, on top of the commission.
 */

export const payoutPolicy = {
  /**
   * Platform's cut of a dinner's gross seat revenue (Dinner.pricePerSeatCents
   * x confirmed seats). Restaurant nets the remaining 85%.
   */
  commissionRate: 0.15,

  /**
   * Business days after a dinner ends before its Payout is eligible to
   * move from HELD to READY - the post-dinner dispute/refund window. Does
   * not exist as a concept anywhere else in this codebase; the pre-dinner
   * cancellation cutoffs (seat-policy.ts, payment.ts refund.cutoffHours)
   * are a different, earlier window and don't cover this.
   */
  holdWindowBusinessDays: 3,
} as const;

/**
 * Commission the platform takes from a dinner's gross seat revenue.
 */
export function calculateCommission(grossAmountCents: number): number {
  return Math.round(grossAmountCents * payoutPolicy.commissionRate);
}

/**
 * Adds N business days (Mon-Fri) to a date, skipping weekends entirely -
 * a business day added on a Friday lands the following Monday, not
 * Saturday.
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remaining--;
    }
  }
  return result;
}

/**
 * The date a dinner's Payout becomes eligible to move HELD -> READY.
 */
export function getPayoutScheduledDate(dinnerEndsAt: Date): Date {
  return addBusinessDays(dinnerEndsAt, payoutPolicy.holdWindowBusinessDays);
}
