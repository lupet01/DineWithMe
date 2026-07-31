/**
 * Payment Configuration
 * 
 * Defines payment-related constants and policies
 */

export const paymentConfig = {
  /**
   * Commitment amount in cents (ZAR) - fallback charge for a dinner that
   * has no Dinner.pricePerSeatCents set yet (legacy dinners predating the
   * Meals/pricing system, §16.5/§16.6). Real, priced dinners use
   * getCheckoutAmount() instead, which charges the actual food price.
   * Default: R50.00
   */
  commitmentAmount: 5000,

  /**
   * Platform booking fee in cents (ZAR), charged on top of the food price
   * for every priced dinner - the platform keeps all of this, none of it
   * flows into a restaurant's Payout (§16.5). Named for the first time as
   * a separate line item on the Payment Portal ("Food R450" + "Booking fee
   * R25" = "Total R475"); every price shown before checkout is food-only.
   * Default: R25.00
   */
  bookingFeeCents: 2500,

  /**
   * Default currency
   */
  currency: "ZAR",

  /**
   * Payment provider
   */
  defaultProvider: "PAYSTACK" as const,

  /**
   * Paystack configuration
   */
  paystack: {
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
    secretKey: process.env.PAYSTACK_SECRET_KEY || "",
    baseUrl: "https://api.paystack.co",
  },

  /**
   * Refund policy
   * Uses same cutoff as seat cancellation policy
   */
  refund: {
    /**
     * Hours before dinner start when refunds are allowed
     * Must match seat cancellation policy
     */
    cutoffHours: 24,

    /**
     * Refund reasons
     */
    reasons: {
      USER_CANCELLED: "user_cancelled",
      DINNER_CANCELLED: "dinner_cancelled",
      NO_SHOW: "no_show", // No refund for no-shows
    } as const,
  },
} as const;

/**
 * Get commitment amount for a dinner
 *
 * @param dinnerId - Dinner ID (for future dynamic pricing)
 * @returns Amount in cents
 */
export function getCommitmentAmount(dinnerId?: string): number {
  // For MVP, return fixed amount
  // Future: could vary by dinner, theme, restaurant, etc.
  return paymentConfig.commitmentAmount;
}

/**
 * The real amount a diner is charged at checkout: food price + booking
 * fee (§16.5). Falls back to the flat commitmentAmount for a dinner with
 * no pricePerSeatCents set - legacy dinners created before Meals/pricing
 * existed, or a restaurant that hasn't priced a dinner yet, still need to
 * be bookable rather than blocked.
 *
 * @param dinner - object with the dinner's pricePerSeatCents (null if unset)
 * @returns Amount in cents
 */
export function getCheckoutAmount(dinner: { pricePerSeatCents: number | null }): number {
  if (dinner.pricePerSeatCents == null) {
    return paymentConfig.commitmentAmount;
  }
  return dinner.pricePerSeatCents + paymentConfig.bookingFeeCents;
}

/**
 * Format amount for display - thousands-grouped, cents only shown when
 * non-zero (matches the wireframe's "R 8,100" / "R 450" convention rather
 * than always forcing two decimal places).
 *
 * @param amountInCents - Amount in cents
 * @returns Formatted string (e.g., "R 8,100", "R 75.50")
 */
export function formatAmount(amountInCents: number): string {
  const rands = amountInCents / 100;
  const hasCents = amountInCents % 100 !== 0;
  const formatted = rands.toLocaleString("en-US", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `R ${formatted}`;
}

/**
 * Convert amount to cents
 * 
 * @param amountInRands - Amount in rands
 * @returns Amount in cents
 */
export function toCents(amountInRands: number): number {
  return Math.round(amountInRands * 100);
}

/**
 * Convert amount to rands
 * 
 * @param amountInCents - Amount in cents
 * @returns Amount in rands
 */
export function toRands(amountInCents: number): number {
  return amountInCents / 100;
}

/**
 * Check if refund is allowed based on dinner start time
 * 
 * @param dinnerStartTime - Dinner start time
 * @returns Object with allowed status and reason
 */
export function isRefundAllowed(dinnerStartTime: Date): {
  allowed: boolean;
  reason?: string;
  hoursUntilDinner?: number;
} {
  const now = new Date();
  const hoursUntilDinner = (dinnerStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilDinner < 0) {
    return {
      allowed: false,
      reason: "Dinner has already started",
      hoursUntilDinner: Math.abs(hoursUntilDinner),
    };
  }

  if (hoursUntilDinner < paymentConfig.refund.cutoffHours) {
    return {
      allowed: false,
      reason: `Refunds must be requested at least ${paymentConfig.refund.cutoffHours} hours before dinner`,
      hoursUntilDinner,
    };
  }

  return {
    allowed: true,
    hoursUntilDinner,
  };
}
