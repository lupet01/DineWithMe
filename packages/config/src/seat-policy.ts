/**
 * Seat Cancellation Policy Configuration
 * 
 * Defines rules for when diners can cancel their confirmed seats.
 */

export const seatCancellationPolicy = {
  /**
   * Cancellation cutoff in hours before dinner starts
   * 
   * Diners can cancel their seat if the dinner starts more than
   * this many hours in the future.
   * 
   * Default: 6 hours
   * 
   * Examples:
   * - Dinner at 7:00 PM, cutoff is 6 hours
   * - Can cancel until 1:00 PM same day
   * - After 1:00 PM, cancellation is denied
   */
  cutoffHours: 6,

  /**
   * Whether to make cancelled seats immediately available
   * 
   * true: Seat becomes AVAILABLE for new bookings
   * false: Seat stays CANCELLED (requires manual intervention)
   * 
   * Default: true (auto-release)
   */
  autoReleaseCancelledSeats: true,

  /**
   * Whether to retain confirmedByUserId for audit trail
   * 
   * true: Keep confirmedByUserId even after cancellation
   * false: Clear confirmedByUserId on cancellation
   * 
   * Default: true (retain for audit)
   */
  retainConfirmedUserOnCancel: true,
} as const;

/**
 * Calculate if cancellation is allowed based on policy
 * 
 * @param dinnerStartsAt - When the dinner starts
 * @param now - Current time (defaults to Date.now())
 * @returns Object with allowed flag and reason if denied
 */
export function isCancellationAllowed(
  dinnerStartsAt: Date,
  now: Date = new Date()
): { allowed: boolean; reason?: string; hoursUntilDinner?: number } {
  const msUntilDinner = dinnerStartsAt.getTime() - now.getTime();
  const hoursUntilDinner = msUntilDinner / (1000 * 60 * 60);

  if (hoursUntilDinner < 0) {
    return {
      allowed: false,
      reason: "Dinner has already started or passed",
      hoursUntilDinner,
    };
  }

  if (hoursUntilDinner < seatCancellationPolicy.cutoffHours) {
    return {
      allowed: false,
      reason: `Cancellation cutoff has passed. Must cancel at least ${seatCancellationPolicy.cutoffHours} hours before dinner starts`,
      hoursUntilDinner,
    };
  }

  return {
    allowed: true,
    hoursUntilDinner,
  };
}

/**
 * Get the cancellation deadline for a dinner
 * 
 * @param dinnerStartsAt - When the dinner starts
 * @returns Date object representing the cancellation deadline
 */
export function getCancellationDeadline(dinnerStartsAt: Date): Date {
  const deadline = new Date(dinnerStartsAt);
  deadline.setHours(deadline.getHours() - seatCancellationPolicy.cutoffHours);
  return deadline;
}


/**
 * Check-in Policy Configuration
 * 
 * Defines rules for when diners can check in to their confirmed seats.
 */

export const checkInPolicy = {
  /**
   * Minutes before dinner start when check-in opens
   * 
   * Default: 30 minutes
   * 
   * Example:
   * - Dinner at 7:00 PM
   * - Check-in opens at 6:30 PM
   */
  earlyCheckInMinutes: 30,

  /**
   * Minutes after dinner start when check-in closes
   * 
   * Default: 30 minutes
   * 
   * Example:
   * - Dinner at 7:00 PM
   * - Check-in closes at 7:30 PM
   */
  lateCheckInMinutes: 30,
} as const;

/**
 * Calculate if check-in is allowed based on policy
 * 
 * @param dinnerStartsAt - When the dinner starts
 * @param now - Current time (defaults to Date.now())
 * @returns Object with allowed flag and reason if denied
 */
export function isCheckInAllowed(
  dinnerStartsAt: Date,
  now: Date = new Date()
): { allowed: boolean; reason?: string; minutesUntilStart?: number } {
  const msUntilStart = dinnerStartsAt.getTime() - now.getTime();
  const minutesUntilStart = msUntilStart / (1000 * 60);

  // Check if too early
  if (minutesUntilStart > checkInPolicy.earlyCheckInMinutes) {
    return {
      allowed: false,
      reason: `Check-in opens ${checkInPolicy.earlyCheckInMinutes} minutes before dinner starts`,
      minutesUntilStart,
    };
  }

  // Check if too late
  if (minutesUntilStart < -checkInPolicy.lateCheckInMinutes) {
    return {
      allowed: false,
      reason: `Check-in closed ${checkInPolicy.lateCheckInMinutes} minutes after dinner started`,
      minutesUntilStart,
    };
  }

  return {
    allowed: true,
    minutesUntilStart,
  };
}

/**
 * Get the check-in window for a dinner
 * 
 * @param dinnerStartsAt - When the dinner starts
 * @returns Object with opens and closes times
 */
export function getCheckInWindow(dinnerStartsAt: Date): {
  opens: Date;
  closes: Date;
} {
  const opens = new Date(dinnerStartsAt);
  opens.setMinutes(opens.getMinutes() - checkInPolicy.earlyCheckInMinutes);

  const closes = new Date(dinnerStartsAt);
  closes.setMinutes(closes.getMinutes() + checkInPolicy.lateCheckInMinutes);

  return { opens, closes };
}
