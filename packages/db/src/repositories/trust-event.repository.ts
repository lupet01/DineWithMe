import type { TrustEvent, Prisma, TrustEventType } from "@prisma/client";
import { BaseRepository } from "./base";

/**
 * Trust Event Repository
 * 
 * Manages trust events that affect user reputation/trust scores.
 * Events can be positive (attendance, good reviews) or negative (no-shows, cancellations).
 */
export class TrustEventRepository extends BaseRepository<TrustEvent> {
  async findById(id: string): Promise<TrustEvent | null> {
    return this.prisma.trustEvent.findUnique({
      where: { id },
    });
  }

  async findMany(): Promise<TrustEvent[]> {
    return this.prisma.trustEvent.findMany();
  }

  async findByUser(userId: string): Promise<TrustEvent[]> {
    return this.prisma.trustEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByType(type: TrustEventType): Promise<TrustEvent[]> {
    return this.prisma.trustEvent.findMany({
      where: { type },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find trust events for a dinner
   */
  async findByDinner(dinnerId: string): Promise<TrustEvent[]> {
    return this.prisma.trustEvent.findMany({
      where: { sourceDinnerId: dinnerId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: Prisma.TrustEventCreateInput): Promise<TrustEvent> {
    return this.prisma.trustEvent.create({
      data,
    });
  }

  /**
   * Create a no-show trust event
   * 
   * @param userId - ID of the user who didn't show up
   * @param seatId - ID of the seat
   * @param dinnerId - ID of the dinner
   * @param weight - Negative weight (e.g., -10)
   * @returns Created trust event
   */
  async createNoShowEvent(
    userId: string,
    seatId: string,
    dinnerId: string,
    weight: number = -10
  ): Promise<TrustEvent> {
    return this.create({
      user: { connect: { id: userId } },
      type: "NO_SHOW",
      weight,
      sourceDinnerId: dinnerId,
      metadata: {
        seatId,
        dinnerId,
        markedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Create a confirmed attendance trust event
   * 
   * @param userId - ID of the user who attended
   * @param seatId - ID of the seat
   * @param dinnerId - ID of the dinner
   * @param weight - Positive weight (e.g., +5)
   * @returns Created trust event
   */
  async createAttendanceEvent(
    userId: string,
    seatId: string,
    dinnerId: string,
    weight: number = 5
  ): Promise<TrustEvent> {
    return this.create({
      user: { connect: { id: userId } },
      type: "ATTENDED",
      weight,
      sourceDinnerId: dinnerId,
      metadata: {
        seatId,
        dinnerId,
        completedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Create a positive feedback trust event
   */
  async createPositiveFeedbackEvent(
    userId: string,
    feedbackId: string,
    dinnerId: string,
    weight: number = 3
  ): Promise<TrustEvent> {
    return this.create({
      user: { connect: { id: userId } },
      type: "POSITIVE_FEEDBACK",
      weight,
      sourceDinnerId: dinnerId,
      metadata: {
        feedbackId,
        dinnerId,
        createdAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Create a negative feedback trust event
   */
  async createNegativeFeedbackEvent(
    userId: string,
    feedbackId: string,
    dinnerId: string,
    weight: number = -5
  ): Promise<TrustEvent> {
    return this.create({
      user: { connect: { id: userId } },
      type: "NEGATIVE_FEEDBACK",
      weight,
      sourceDinnerId: dinnerId,
      metadata: {
        feedbackId,
        dinnerId,
        createdAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Calculate trust score for a user
   * 
   * @param userId - ID of the user
   * @returns Total trust score (sum of all event weights)
   */
  async calculateTrustScore(userId: string): Promise<number> {
    const events = await this.findByUser(userId);
    return events.reduce((sum, event) => sum + event.weight, 0);
  }

  /**
   * Get trust statistics for a user
   * 
   * @param userId - ID of the user
   * @returns Object with counts and score
   */
  async getUserTrustStats(userId: string): Promise<{
    totalScore: number;
    noShowCount: number;
    attendanceCount: number;
    eventCount: number;
  }> {
    const events = await this.findByUser(userId);
    
    return {
      totalScore: events.reduce((sum, event) => sum + event.weight, 0),
      noShowCount: events.filter(e => e.type === "NO_SHOW").length,
      attendanceCount: events.filter(e => e.type === "CONFIRMED_ATTENDANCE").length,
      eventCount: events.length,
    };
  }

  async update(id: string, data: Prisma.TrustEventUpdateInput): Promise<TrustEvent> {
    return this.prisma.trustEvent.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<TrustEvent> {
    return this.prisma.trustEvent.delete({
      where: { id },
    });
  }
}
