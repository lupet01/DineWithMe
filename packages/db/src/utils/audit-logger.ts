// Import the repository class and prisma client directly (not the barrel
// `../repositories` index) — that barrel re-exports seat.repository, which
// pulls in services/seat-state-machine, which imports this very file. Going
// through the barrel here creates a circular dependency between
// utils <-> repositories <-> services that only "works" by accident of
// module-evaluation order in some bundlers.
import { AuditLogRepository } from "../repositories/audit-log.repository";
import { prisma } from "../client";

const auditLogRepository = new AuditLogRepository(prisma);

/**
 * Action types for audit logging
 */
export const AuditAction = {
  // Restaurant actions
  RESTAURANT_CREATED: "restaurant_created",
  RESTAURANT_UPDATED: "restaurant_updated",
  RESTAURANT_APPROVED: "restaurant_approved",
  RESTAURANT_PAUSED: "restaurant_paused",
  
  // Media actions
  MEDIA_UPLOADED: "media_uploaded",
  MEDIA_DELETED: "media_deleted",
  
  // Dinner actions
  DINNER_CREATED: "dinner_created",
  DINNER_UPDATED: "dinner_updated",
  DINNER_CANCELLED: "dinner_cancelled",
  DINNER_STATUS_CHANGED: "dinner_status_changed",
  
  // Seat actions
  SEAT_HELD: "seat_held",
  SEAT_CONFIRMED: "seat_confirmed",
  SEAT_RELEASED: "seat_released",
  SEAT_CANCELLED: "seat_cancelled",
  SEAT_ATTENDED: "seat_attended",
  SEAT_COMPLETED: "seat_completed",
  SEAT_NO_SHOW: "seat_no_show",
  SEAT_LEFT_EARLY: "seat_left_early",
  SEAT_EXPIRED: "seat_expired",
  SEAT_REFUNDED: "seat_refunded",
  
  // Theme actions
  THEME_ENABLED: "theme_enabled",
  THEME_DISABLED: "theme_disabled",

  // User actions
  USER_ROLE_CHANGED: "user_role_changed",
} as const;

/**
 * Entity types for audit logging
 */
export const AuditEntity = {
  RESTAURANT: "restaurant",
  MEDIA: "media",
  DINNER: "dinner",
  SEAT: "seat",
  USER: "user",
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];
export type AuditEntityType = typeof AuditEntity[keyof typeof AuditEntity];

/**
 * Simple audit logger utility
 * 
 * Usage:
 * await auditLogger.log(userId, AuditAction.RESTAURANT_CREATED, AuditEntity.RESTAURANT, restaurantId, {
 *   name: restaurant.name,
 *   cuisine: restaurant.cuisine
 * });
 */
export const auditLogger = {
  /**
   * Log an action
   */
  async log(
    actorUserId: string,
    actionType: AuditActionType,
    entityType: AuditEntityType,
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await auditLogRepository.log(
        actorUserId,
        actionType,
        entityType,
        entityId,
        metadata
      );
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      console.error("[AuditLogger] Failed to log action:", error);
    }
  },

  /**
   * Log restaurant created
   */
  async restaurantCreated(
    actorUserId: string,
    restaurantId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.RESTAURANT_CREATED,
      AuditEntity.RESTAURANT,
      restaurantId,
      metadata
    );
  },

  /**
   * Log restaurant updated
   */
  async restaurantUpdated(
    actorUserId: string,
    restaurantId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.RESTAURANT_UPDATED,
      AuditEntity.RESTAURANT,
      restaurantId,
      metadata
    );
  },

  /**
   * Log restaurant approved
   */
  async restaurantApproved(
    actorUserId: string,
    restaurantId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.RESTAURANT_APPROVED,
      AuditEntity.RESTAURANT,
      restaurantId,
      metadata
    );
  },

  /**
   * Log restaurant paused
   */
  async restaurantPaused(
    actorUserId: string,
    restaurantId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.RESTAURANT_PAUSED,
      AuditEntity.RESTAURANT,
      restaurantId,
      metadata
    );
  },

  /**
   * Log media uploaded
   */
  async mediaUploaded(
    actorUserId: string,
    mediaId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.MEDIA_UPLOADED,
      AuditEntity.MEDIA,
      mediaId,
      metadata
    );
  },

  /**
   * Log media deleted
   */
  async mediaDeleted(
    actorUserId: string,
    mediaId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.MEDIA_DELETED,
      AuditEntity.MEDIA,
      mediaId,
      metadata
    );
  },

  /**
   * Log dinner created
   */
  async dinnerCreated(
    actorUserId: string,
    dinnerId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.DINNER_CREATED,
      AuditEntity.DINNER,
      dinnerId,
      metadata
    );
  },

  /**
   * Log dinner cancelled
   */
  async dinnerCancelled(
    actorUserId: string,
    dinnerId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.DINNER_CANCELLED,
      AuditEntity.DINNER,
      dinnerId,
      metadata
    );
  },

  /**
   * Log dinner status changed
   */
  async dinnerStatusChanged(
    actorUserId: string,
    dinnerId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.DINNER_STATUS_CHANGED,
      AuditEntity.DINNER,
      dinnerId,
      metadata
    );
  },

  /**
   * Log seat held
   */
  async logSeatHeld(
    actorUserId: string,
    seatId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.SEAT_HELD,
      AuditEntity.SEAT,
      seatId,
      metadata
    );
  },

  /**
   * Log seat confirmed
   */
  async logSeatConfirmed(
    actorUserId: string,
    seatId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.SEAT_CONFIRMED,
      AuditEntity.SEAT,
      seatId,
      metadata
    );
  },

  /**
   * Log seat cancelled
   */
  async seatCancelled(
    actorUserId: string,
    seatId: string,
    dinnerId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.SEAT_CANCELLED,
      AuditEntity.SEAT,
      seatId,
      { ...metadata, dinnerId }
    );
  },

  /**
   * Log seat check-in
   */
  async seatCheckedIn(
    actorUserId: string,
    seatId: string,
    dinnerId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.SEAT_CONFIRMED, // Reuse SEAT_CONFIRMED or add SEAT_CHECKED_IN
      AuditEntity.SEAT,
      seatId,
      { ...metadata, dinnerId, action: "checked_in" }
    );
  },

  /**
   * Log seat released
   */
  async logSeatReleased(
    actorUserId: string,
    seatId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.SEAT_RELEASED,
      AuditEntity.SEAT,
      seatId,
      metadata
    );
  },

  /**
   * Log seat cancelled
   */
  async logSeatCancelled(
    actorUserId: string,
    seatId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.SEAT_CANCELLED,
      AuditEntity.SEAT,
      seatId,
      metadata
    );
  },

  /**
   * Log a user's role being changed by a platform admin
   */
  async userRoleChanged(
    actorUserId: string,
    targetUserId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log(
      actorUserId,
      AuditAction.USER_ROLE_CHANGED,
      AuditEntity.USER,
      targetUserId,
      metadata
    );
  },
};
