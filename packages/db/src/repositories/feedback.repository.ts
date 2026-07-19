import type { Feedback, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export type FeedbackWithRelations = Feedback & {
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  target?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  dinner: {
    id: string;
    theme: {
      id: string;
      key: string;
      title: string;
      shortDescription: string;
    } | null;
    startsAt: Date;
  };
};

export class FeedbackRepository extends BaseRepository<Feedback> {
  /**
   * Find many feedback records
   */
  async findMany(): Promise<Feedback[]> {
    return this.prisma.feedback.findMany();
  }

  /**
   * Find feedback by ID
   */
  async findById(id: string): Promise<Feedback | null> {
    return this.prisma.feedback.findUnique({
      where: { id },
    });
  }

  /**
   * Find feedback by ID with relations
   */
  async findByIdWithRelations(id: string): Promise<FeedbackWithRelations | null> {
    return this.prisma.feedback.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        target: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        dinner: {
          select: {
            id: true,
            theme: { select: { id: true, key: true, title: true, shortDescription: true } },
            startsAt: true,
          },
        },
      },
    });
  }

  /**
   * Find all feedback for a dinner
   */
  async findByDinner(dinnerId: string): Promise<FeedbackWithRelations[]> {
    return this.prisma.feedback.findMany({
      where: { dinnerId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        target: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        dinner: {
          select: {
            id: true,
            theme: { select: { id: true, key: true, title: true, shortDescription: true } },
            startsAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find feedback authored by a user
   */
  async findByAuthor(authorId: string): Promise<FeedbackWithRelations[]> {
    return this.prisma.feedback.findMany({
      where: { authorId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        target: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        dinner: {
          select: {
            id: true,
            theme: { select: { id: true, key: true, title: true, shortDescription: true } },
            startsAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find feedback received by a user
   */
  async findByTarget(targetUserId: string): Promise<FeedbackWithRelations[]> {
    return this.prisma.feedback.findMany({
      where: { targetUserId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        target: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        dinner: {
          select: {
            id: true,
            theme: { select: { id: true, key: true, title: true, shortDescription: true } },
            startsAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find table-level feedback for a dinner (no specific target)
   */
  async findTableFeedbackByDinner(dinnerId: string): Promise<FeedbackWithRelations[]> {
    return this.prisma.feedback.findMany({
      where: {
        dinnerId,
        targetUserId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        target: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        dinner: {
          select: {
            id: true,
            theme: { select: { id: true, key: true, title: true, shortDescription: true } },
            startsAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find specific feedback from one user targeting another in a dinner
   * Used for mutual interest detection
   */
  async findByAuthorTargetAndDinner(
    authorId: string,
    targetUserId: string,
    dinnerId: string
  ): Promise<Feedback | null> {
    return this.prisma.feedback.findFirst({
      where: { authorId, targetUserId, dinnerId },
    });
  }

  /**
   * Check if user has already submitted feedback for a dinner
   */
  async hasFeedbackForDinner(authorId: string, dinnerId: string, targetUserId?: string | null): Promise<boolean> {
    const count = await this.prisma.feedback.count({
      where: {
        authorId,
        dinnerId,
        targetUserId: targetUserId === undefined ? undefined : targetUserId,
      },
    });
    return count > 0;
  }

  /**
   * Create feedback
   */
  async create(data: Prisma.FeedbackCreateInput): Promise<Feedback> {
    return this.prisma.feedback.create({
      data,
    });
  }

  /**
   * Update feedback
   */
  async update(id: string, data: Prisma.FeedbackUpdateInput): Promise<Feedback> {
    return this.prisma.feedback.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete feedback
   */
  async delete(id: string): Promise<Feedback> {
    return this.prisma.feedback.delete({
      where: { id },
    });
  }

  /**
   * Get feedback statistics for a user
   */
  async getUserFeedbackStats(userId: string): Promise<{
    totalReceived: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
    averageComfortLevel: number;
  }> {
    const feedback = await this.prisma.feedback.findMany({
      where: { targetUserId: userId },
      select: {
        overallSentiment: true,
        comfortLevel: true,
      },
    });

    const totalReceived = feedback.length;
    const positiveCount = feedback.filter(f => 
      f.overallSentiment === "GREAT" || f.overallSentiment === "GOOD"
    ).length;
    const neutralCount = feedback.filter(f => f.overallSentiment === "NEUTRAL").length;
    const negativeCount = feedback.filter(f => f.overallSentiment === "UNCOMFORTABLE").length;

    // Calculate average comfort level (FULL=3, MOSTLY=2, LOW=1)
    const comfortLevelValues = feedback.map(f => {
      switch (f.comfortLevel) {
        case "FULL": return 3;
        case "MOSTLY": return 2;
        case "LOW": return 1;
        default: return 0;
      }
    });
    const averageComfortLevel = totalReceived > 0
      ? comfortLevelValues.reduce((sum: number, val: number) => sum + val, 0) / totalReceived
      : 0;

    return {
      totalReceived,
      positiveCount,
      neutralCount,
      negativeCount,
      averageComfortLevel,
    };
  }
}
