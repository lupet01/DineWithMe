import type { Seat, SeatStatus, PrismaClient } from "@prisma/client";
import { track } from "@dinewithme/analytics";
import { AnalyticsEvents } from "@dinewithme/analytics";
import { auditLogger, AuditAction } from "../utils/audit-logger";

/**
 * Valid seat status transitions
 * Maps from current status to allowed next statuses
 * 
 * IMPORTANT: As of EPIC 7 (Payment System):
 * - HELD → CONFIRMED transition requires successful payment
 * - This transition should ONLY happen via payment webhook
 * - Direct confirmation is not allowed
 */
const VALID_TRANSITIONS: Record<SeatStatus, SeatStatus[]> = {
  AVAILABLE: ["HELD"],
  HELD: ["CONFIRMED", "AVAILABLE", "EXPIRED"], // CONFIRMED only via payment webhook
  CONFIRMED: ["ATTENDED", "CANCELLED", "NO_SHOW", "AVAILABLE"], // AVAILABLE for immediate release on cancellation
  ATTENDED: ["COMPLETED", "LEFT_EARLY"],
  COMPLETED: [], // Terminal state
  CANCELLED: ["AVAILABLE"], // Can be released back to available
  EXPIRED: ["AVAILABLE"], // Expired holds become available
  NO_SHOW: [], // Terminal state
  LEFT_EARLY: [], // Terminal state
};

/**
 * Metadata for state transitions
 */
export interface TransitionMetadata {
  userId?: string; // User performing the action
  dinnerId?: string; // Associated dinner
  reason?: string; // Reason for transition (e.g., cancellation reason)
  holdExpiresAt?: Date; // For HELD transitions
  checkedInAt?: Date; // For ATTENDED transitions
  checkedOutAt?: Date; // For COMPLETED/LEFT_EARLY transitions
  heldByUserId?: string | null; // User holding the seat
  confirmedByUserId?: string | null; // User confirming the seat
  holdDurationMinutes?: number; // Duration of hold
  dietaryNotes?: string | null; // Optional dietary notes captured at hold time
  hoursUntilDinner?: number; // For cancellation policy
  minutesUntilStart?: number; // For check-in timing
  minutesAfterStart?: number; // For no-show marking
  dinnerTheme?: string; // For analytics context
  restaurantId?: string; // For analytics context
  [key: string]: any; // Allow additional metadata
}

/**
 * Result of a state transition
 */
export interface TransitionResult {
  seat: Seat;
  fromStatus: SeatStatus;
  toStatus: SeatStatus;
  metadata: TransitionMetadata;
}

/**
 * Central seat state machine
 * 
 * Ensures:
 * 1. Only valid transitions are allowed
 * 2. Every transition emits analytics event
 * 3. Every transition creates audit log entry
 * 4. Consistent error handling
 */
export class SeatStateMachine {
  constructor(private prisma: PrismaClient) {}

  /**
   * Validate if a transition is allowed
   */
  isValidTransition(from: SeatStatus, to: SeatStatus): boolean {
    const allowedTransitions = VALID_TRANSITIONS[from];
    return allowedTransitions.includes(to);
  }

  /**
   * Get all valid transitions from a status
   */
  getValidTransitions(from: SeatStatus): SeatStatus[] {
    return VALID_TRANSITIONS[from];
  }

  /**
   * Transition a seat to a new status
   * 
   * This is the ONLY method that should update seat status.
   * All APIs must use this function.
   * 
   * @param seatId - ID of the seat to transition
   * @param toStatus - Target status
   * @param metadata - Additional context for analytics and audit
   * @returns Updated seat with transition details
   * @throws Error if transition is invalid or seat not found
   */
  async transitionSeatStatus(
    seatId: string,
    toStatus: SeatStatus,
    metadata: TransitionMetadata = {}
  ): Promise<TransitionResult> {
    // Fetch current seat
    const seat = await this.prisma.seat.findUnique({
      where: { id: seatId },
      include: {
        dinner: {
          select: {
            id: true,
            theme: { select: { title: true } },
            restaurantId: true,
            startsAt: true,
          },
        },
      },
    });

    if (!seat) {
      throw new Error(`Seat not found: ${seatId}`);
    }

    const fromStatus = seat.status;

    // Validate transition
    if (!this.isValidTransition(fromStatus, toStatus)) {
      throw new Error(
        `Invalid transition: ${fromStatus} -> ${toStatus}. ` +
        `Allowed transitions from ${fromStatus}: ${VALID_TRANSITIONS[fromStatus].join(", ")}`
      );
    }

    // Prepare update data
    const updateData: any = {
      status: toStatus,
      updatedAt: new Date(),
    };

    // Add status-specific fields
    switch (toStatus) {
      case "HELD":
        if (metadata.holdExpiresAt) {
          updateData.holdExpiresAt = metadata.holdExpiresAt;
        }
        if (metadata.heldByUserId !== undefined) {
          updateData.heldByUserId = metadata.heldByUserId;
        }
        if (metadata.dietaryNotes !== undefined) {
          updateData.dietaryNotes = metadata.dietaryNotes;
        }
        break;

      case "CONFIRMED":
        if (metadata.confirmedByUserId !== undefined) {
          updateData.confirmedByUserId = metadata.confirmedByUserId;
        }
        // Clear hold fields
        updateData.holdExpiresAt = null;
        break;

      case "ATTENDED":
        if (metadata.checkedInAt) {
          updateData.checkedInAt = metadata.checkedInAt;
        }
        break;

      case "COMPLETED":
      case "LEFT_EARLY":
        if (metadata.checkedOutAt) {
          updateData.checkedOutAt = metadata.checkedOutAt;
        }
        break;

      case "AVAILABLE":
        // Clear all user associations when becoming available
        updateData.heldByUserId = null;
        updateData.holdExpiresAt = null;
        // Optionally clear confirmedByUserId based on context
        if (metadata.confirmedByUserId === null) {
          updateData.confirmedByUserId = null;
        }
        break;

      case "CANCELLED":
        // Keep user IDs for audit trail unless explicitly cleared
        if (metadata.confirmedByUserId === null) {
          updateData.confirmedByUserId = null;
        }
        if (metadata.heldByUserId === null) {
          updateData.heldByUserId = null;
        }
        break;
    }

    // Update seat atomically, guarded on the status we read it as.
    // If another concurrent transition already moved the seat off `fromStatus`,
    // this matches zero rows instead of silently clobbering that write.
    const { count } = await this.prisma.seat.updateMany({
      where: { id: seatId, status: fromStatus },
      data: updateData,
    });

    if (count === 0) {
      throw new Error(
        `Seat ${seatId} was modified concurrently (expected status ${fromStatus}). Please try again.`
      );
    }

    const updatedSeat = await this.prisma.seat.findUniqueOrThrow({
      where: { id: seatId },
    });

    // Enrich metadata with dinner context
    const enrichedMetadata: TransitionMetadata = {
      ...metadata,
      dinnerId: seat.dinner.id,
      dinnerTheme: seat.dinner.theme.title,
      restaurantId: seat.dinner.restaurantId,
    };

    // Emit analytics event
    await this.emitAnalyticsEvent(
      seatId,
      fromStatus,
      toStatus,
      enrichedMetadata
    );

    // Create audit log entry
    await this.createAuditLog(
      seatId,
      fromStatus,
      toStatus,
      enrichedMetadata
    );

    return {
      seat: updatedSeat,
      fromStatus,
      toStatus,
      metadata: enrichedMetadata,
    };
  }

  /**
   * Emit analytics event for state transition
   */
  private async emitAnalyticsEvent(
    seatId: string,
    fromStatus: SeatStatus,
    toStatus: SeatStatus,
    metadata: TransitionMetadata
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const userId = metadata.userId || metadata.heldByUserId || metadata.confirmedByUserId || "system";
      const dinnerId = metadata.dinnerId || "unknown";

      // Map transitions to analytics events
      switch (toStatus) {
        case "HELD":
          await track(AnalyticsEvents.SEAT_HELD_SUCCESS, {
            userId,
            dinnerId,
            seatId,
            holdExpiresAt: metadata.holdExpiresAt?.toISOString() || "",
            timestamp,
          });
          break;

        case "CONFIRMED":
          await track(AnalyticsEvents.SEAT_CONFIRMED, {
            userId,
            dinnerId,
            seatId,
            timestamp,
          });
          break;

        case "CANCELLED":
          await track(AnalyticsEvents.SEAT_CANCELLED, {
            userId,
            dinnerId,
            seatId,
            hoursUntilDinner: metadata.hoursUntilDinner || 0,
            timestamp,
          });
          break;

        case "ATTENDED":
          await track(AnalyticsEvents.SEAT_CHECK_IN_SUCCESS, {
            userId,
            dinnerId,
            seatId,
            minutesUntilStart: metadata.minutesUntilStart || 0,
            timestamp,
          });
          break;

        case "NO_SHOW":
          await track(AnalyticsEvents.SEAT_NO_SHOW_MARKED, {
            userId,
            dinnerId,
            seatId,
            dinnerTheme: metadata.dinnerTheme || "",
            minutesAfterStart: metadata.minutesAfterStart || 0,
            timestamp,
          });
          break;

        case "AVAILABLE":
          // Track differently based on source
          if (fromStatus === "HELD" || fromStatus === "EXPIRED") {
            await track(AnalyticsEvents.SEAT_HOLD_EXPIRED, {
              seatId,
              dinnerId,
              userId: metadata.heldByUserId || null,
              expiredAt: timestamp,
              timestamp,
            });
          } else if (fromStatus === "CANCELLED") {
            await track(AnalyticsEvents.SEAT_RELEASED, {
              userId,
              dinnerId,
              seatId,
              timestamp,
            });
          }
          break;

        // Other transitions don't have specific analytics events yet
        default:
          // Log generic transition for monitoring
          console.log(`[SeatStateMachine] Transition: ${fromStatus} -> ${toStatus}`, {
            seatId,
            userId,
            dinnerId,
          });
      }
    } catch (error) {
      // Don't throw - analytics should not break the main flow
      console.error("[SeatStateMachine] Failed to emit analytics event:", error);
    }
  }

  /**
   * Create audit log entry for state transition
   */
  private async createAuditLog(
    seatId: string,
    fromStatus: SeatStatus,
    toStatus: SeatStatus,
    metadata: TransitionMetadata
  ): Promise<void> {
    try {
      const userId = metadata.userId || metadata.heldByUserId || metadata.confirmedByUserId || "system";

      // Map transitions to audit actions
      let auditAction: string;
      switch (toStatus) {
        case "HELD":
          auditAction = AuditAction.SEAT_HELD;
          break;
        case "CONFIRMED":
          auditAction = AuditAction.SEAT_CONFIRMED;
          break;
        case "CANCELLED":
          auditAction = AuditAction.SEAT_CANCELLED;
          break;
        case "AVAILABLE":
          auditAction = AuditAction.SEAT_RELEASED;
          break;
        default:
          auditAction = `seat_${toStatus.toLowerCase()}`;
      }

      await auditLogger.log(
        userId,
        auditAction as any,
        "seat",
        seatId,
        {
          fromStatus,
          toStatus,
          dinnerId: metadata.dinnerId,
          reason: metadata.reason,
          ...metadata,
        }
      );
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      console.error("[SeatStateMachine] Failed to create audit log:", error);
    }
  }

  /**
   * Batch transition multiple seats
   * Useful for operations like expiring holds or marking no-shows
   */
  async transitionMultipleSeats(
    transitions: Array<{
      seatId: string;
      toStatus: SeatStatus;
      metadata?: TransitionMetadata;
    }>
  ): Promise<TransitionResult[]> {
    const results: TransitionResult[] = [];

    for (const { seatId, toStatus, metadata } of transitions) {
      try {
        const result = await this.transitionSeatStatus(seatId, toStatus, metadata || {});
        results.push(result);
      } catch (error) {
        console.error(`[SeatStateMachine] Failed to transition seat ${seatId}:`, error);
        // Continue with other transitions
      }
    }

    return results;
  }
}

/**
 * Create a seat state machine instance
 */
export function createSeatStateMachine(prisma: PrismaClient): SeatStateMachine {
  return new SeatStateMachine(prisma);
}
