import type { TrustProfile, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export class TrustProfileRepository extends BaseRepository<TrustProfile> {
  /**
   * Find trust profile by ID
   */
  async findById(id: string): Promise<TrustProfile | null> {
    return this.prisma.trustProfile.findUnique({
      where: { id },
    });
  }

  /**
   * Find trust profile by user ID
   */
  async findByUserId(userId: string): Promise<TrustProfile | null> {
    return this.prisma.trustProfile.findUnique({
      where: { userId },
    });
  }

  /**
   * Find many trust profiles
   */
  async findMany(): Promise<TrustProfile[]> {
    return this.prisma.trustProfile.findMany();
  }

  /**
   * Create trust profile for user
   */
  async create(data: Prisma.TrustProfileCreateInput): Promise<TrustProfile> {
    return this.prisma.trustProfile.create({
      data,
    });
  }

  /**
   * Update trust profile
   */
  async update(id: string, data: Prisma.TrustProfileUpdateInput): Promise<TrustProfile> {
    return this.prisma.trustProfile.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete trust profile
   */
  async delete(id: string): Promise<TrustProfile> {
    return this.prisma.trustProfile.delete({
      where: { id },
    });
  }

  /**
   * Get or create trust profile for user
   * If profile doesn't exist, creates one with default trustScore of 0.5
   */
  async getOrCreate(userId: string): Promise<TrustProfile> {
    let profile = await this.findByUserId(userId);
    
    if (!profile) {
      profile = await this.create({
        user: { connect: { id: userId } },
        trustScore: 0.5, // Default starting score
      });
    }
    
    return profile;
  }

  /**
   * Update trust score with bounded function
   * Clamps the result between 0 and 1
   * 
   * @param userId - User ID
   * @param weightDelta - Weight to add (can be positive or negative)
   * @returns Updated trust profile
   */
  async updateTrustScore(userId: string, weightDelta: number): Promise<TrustProfile> {
    const profile = await this.getOrCreate(userId);
    
    // Calculate new score with bounded function: clamp(0, 1, trustScore + weight)
    const newScore = Math.max(0, Math.min(1, profile.trustScore + weightDelta));
    
    return this.update(profile.id, {
      trustScore: newScore,
      lastEvaluatedAt: new Date(),
    });
  }

  /**
   * Batch update trust scores for multiple users
   * Useful for processing feedback that affects multiple users
   * 
   * @param updates - Array of { userId, weightDelta }
   * @returns Array of updated trust profiles
   */
  async batchUpdateTrustScores(
    updates: Array<{ userId: string; weightDelta: number }>
  ): Promise<TrustProfile[]> {
    const results: TrustProfile[] = [];
    
    for (const update of updates) {
      const profile = await this.updateTrustScore(update.userId, update.weightDelta);
      results.push(profile);
    }
    
    return results;
  }

  /**
   * Get trust score statistics
   */
  async getTrustScoreStats(): Promise<{
    average: number;
    median: number;
    min: number;
    max: number;
    count: number;
  }> {
    const profiles = await this.prisma.trustProfile.findMany({
      select: { trustScore: true },
      orderBy: { trustScore: "asc" },
    });

    if (profiles.length === 0) {
      return {
        average: 0.5,
        median: 0.5,
        min: 0.5,
        max: 0.5,
        count: 0,
      };
    }

    const scores = profiles.map(p => p.trustScore);
    const sum = scores.reduce((acc, score) => acc + score, 0);
    const average = sum / scores.length;
    const median = scores[Math.floor(scores.length / 2)]!;
    const min = scores[0]!;
    const max = scores[scores.length - 1]!;

    return {
      average,
      median,
      min,
      max,
      count: profiles.length,
    };
  }

  /**
   * Calculate attendance rate for a user
   * Attendance rate = (ATTENDED + COMPLETED) / (CONFIRMED + ATTENDED + COMPLETED + NO_SHOW)
   * 
   * @param userId - User ID
   * @returns Attendance rate between 0 and 1
   */
  async calculateAttendanceRate(userId: string): Promise<number> {
    const seats = await this.prisma.seat.findMany({
      where: {
        confirmedByUserId: userId,
        status: {
          in: ["CONFIRMED", "ATTENDED", "COMPLETED", "NO_SHOW"],
        },
      },
    });

    if (seats.length === 0) {
      return 1.0; // Default to perfect attendance if no history
    }

    const attended = seats.filter(s => 
      s.status === "ATTENDED" || s.status === "COMPLETED"
    ).length;

    return attended / seats.length;
  }

  /**
   * Detect negative pattern for a user
   * Pattern: 3+ NEGATIVE_FEEDBACK or REPORTED events across 3+ separate dinners
   * 
   * @param userId - User ID
   * @returns Object with flagged status and details
   */
  async detectNegativePattern(userId: string): Promise<{
    shouldFlag: boolean;
    negativeEventCount: number;
    uniqueDinnerCount: number;
    events: Array<{ type: string; dinnerId: string | null; createdAt: Date }>;
  }> {
    // Get negative trust events
    const negativeEvents = await this.prisma.trustEvent.findMany({
      where: {
        userId,
        type: {
          in: ["NEGATIVE_FEEDBACK", "REPORTED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Count unique dinners
    const uniqueDinners = new Set(
      negativeEvents
        .filter(e => e.sourceDinnerId !== null)
        .map(e => e.sourceDinnerId)
    );

    const negativeEventCount = negativeEvents.length;
    const uniqueDinnerCount = uniqueDinners.size;

    // Flag if 3+ negative events across 3+ dinners
    const shouldFlag = negativeEventCount >= 3 && uniqueDinnerCount >= 3;

    return {
      shouldFlag,
      negativeEventCount,
      uniqueDinnerCount,
      events: negativeEvents.map(e => ({
        type: e.type,
        dinnerId: e.sourceDinnerId,
        createdAt: e.createdAt,
      })),
    };
  }

  /**
   * Evaluate and update trust profile for a user
   * Recalculates attendance rate and checks for negative patterns
   * 
   * @param userId - User ID
   * @returns Updated trust profile with evaluation results
   */
  async evaluateUser(userId: string): Promise<{
    profile: TrustProfile;
    attendanceRate: number;
    patternDetection: {
      shouldFlag: boolean;
      negativeEventCount: number;
      uniqueDinnerCount: number;
    };
  }> {
    const profile = await this.getOrCreate(userId);

    // Calculate attendance rate
    const attendanceRate = await this.calculateAttendanceRate(userId);

    // Detect negative patterns
    const patternDetection = await this.detectNegativePattern(userId);

    // Update profile
    const updatedProfile = await this.update(profile.id, {
      attendanceRate,
      flagged: patternDetection.shouldFlag,
      lastEvaluatedAt: new Date(),
    });

    return {
      profile: updatedProfile,
      attendanceRate,
      patternDetection: {
        shouldFlag: patternDetection.shouldFlag,
        negativeEventCount: patternDetection.negativeEventCount,
        uniqueDinnerCount: patternDetection.uniqueDinnerCount,
      },
    };
  }

  /**
   * Recalculate trust profiles for all users
   * Used by admin endpoint to refresh all profiles
   * 
   * @returns Summary of evaluation results
   */
  async recalculateAll(): Promise<{
    totalEvaluated: number;
    flaggedCount: number;
    flaggedUsers: Array<{
      userId: string;
      email: string;
      trustScore: number;
      attendanceRate: number;
      negativeEventCount: number;
      uniqueDinnerCount: number;
    }>;
  }> {
    // Get all users
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
      },
    });

    const flaggedUsers: Array<{
      userId: string;
      email: string;
      trustScore: number;
      attendanceRate: number;
      negativeEventCount: number;
      uniqueDinnerCount: number;
    }> = [];

    // Evaluate each user
    for (const user of users) {
      const evaluation = await this.evaluateUser(user.id);

      if (evaluation.profile.flagged) {
        flaggedUsers.push({
          userId: user.id,
          email: user.email,
          trustScore: evaluation.profile.trustScore,
          attendanceRate: evaluation.attendanceRate,
          negativeEventCount: evaluation.patternDetection.negativeEventCount,
          uniqueDinnerCount: evaluation.patternDetection.uniqueDinnerCount,
        });
      }
    }

    return {
      totalEvaluated: users.length,
      flaggedCount: flaggedUsers.length,
      flaggedUsers,
    };
  }

  /**
   * Get all flagged users
   */
  async getFlaggedUsers(): Promise<TrustProfile[]> {
    return this.prisma.trustProfile.findMany({
      where: {
        flagged: true,
      },
      orderBy: {
        trustScore: "asc",
      },
    });
  }

  /**
   * Unflag a user (admin action)
   */
  async unflagUser(userId: string): Promise<TrustProfile> {
    const profile = await this.getOrCreate(userId);
    return this.update(profile.id, {
      flagged: false,
      lastEvaluatedAt: new Date(),
    });
  }

  async flagUser(userId: string): Promise<TrustProfile> {
    const profile = await this.getOrCreate(userId);
    return this.update(profile.id, {
      flagged: true,
      lastEvaluatedAt: new Date(),
    });
  }
}
