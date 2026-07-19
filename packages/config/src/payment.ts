/**
 * Payment Configuration
 * 
 * Defines payment-related constants and policies
 */

export const paymentConfig = {
  /**
   * Commitment amount in cents (ZAR)
   * Default: R50.00
   */
  commitmentAmount: 5000,

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
 * Format amount for display
 * 
 * @param amountInCents - Amount in cents
 * @returns Formatted string (e.g., "R75.00")
 */
export function formatAmount(amountInCents: number): string {
  return `R${(amountInCents / 100).toFixed(2)}`;
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
