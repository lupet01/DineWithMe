import type { MutualInterest, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export type MutualInterestWithRelations = MutualInterest & {
  userA: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  userB: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  dinner: {
    id: string;
    theme: { title: string } | null;
    startsAt: Date;
  };
};

export class MutualInterestRepository extends BaseRepository<MutualInterest> {
  /**
   * Find many mutual interests
   */
  async findMany(): Promise<MutualInterest[]> {
    return this.prisma.mutualInterest.findMany();
  }

  /**
   * Update mutual interest (not typically used, but required by base)
   */
  async update(id: string, data: Prisma.MutualInterestUpdateInput): Promise<MutualInterest> {
    return this.prisma.mutualInterest.update({
      where: { id },
      data,
    });
  }

  /**
   * Find mutual interest by ID
   */
  async findById(id: string): Promise<MutualInterest | null> {
    return this.prisma.mutualInterest.findUnique({
      where: { id },
    });
  }

  /**
   * Find mutual interest by ID with relations
   */
  async findByIdWithRelations(id: string): Promise<MutualInterestWithRelations | null> {
    return this.prisma.mutualInterest.findUnique({
      where: { id },
      include: {
        userA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userB: {
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
            theme: { select: { title: true } },
            startsAt: true,
          },
        },
      },
    });
  }

  /**
   * Find all mutual interests for a user
   */
  async findByUser(userId: string): Promise<MutualInterestWithRelations[]> {
    return this.prisma.mutualInterest.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
      include: {
        userA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userB: {
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
            theme: { select: { title: true } },
            startsAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find mutual interests for a dinner
   */
  async findByDinner(dinnerId: string): Promise<MutualInterestWithRelations[]> {
    return this.prisma.mutualInterest.findMany({
      where: { dinnerId },
      include: {
        userA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        userB: {
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
            theme: { select: { title: true } },
            startsAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Check if mutual interest exists between two users for a dinner
   * Handles both orderings (A-B and B-A)
   */
  async exists(userAId: string, userBId: string, dinnerId: string): Promise<boolean> {
    // Sort user IDs to ensure consistent ordering
    const [sortedUserAId, sortedUserBId] = [userAId, userBId].sort();

    const count = await this.prisma.mutualInterest.count({
      where: {
        userAId: sortedUserAId,
        userBId: sortedUserBId,
        dinnerId,
      },
    });

    return count > 0;
  }

  /**
   * Create mutual interest
   * Automatically sorts user IDs to ensure unique constraint works
   */
  async createMutualInterest(userAId: string, userBId: string, dinnerId: string): Promise<MutualInterest> {
    // Sort user IDs to ensure consistent ordering
    const [sortedUserAId, sortedUserBId] = [userAId, userBId].sort();

    return this.create({
      userA: { connect: { id: sortedUserAId } },
      userB: { connect: { id: sortedUserBId } },
      dinner: { connect: { id: dinnerId } },
    });
  }

  /**
   * Create method required by base repository
   */
  async create(data: Prisma.MutualInterestCreateInput): Promise<MutualInterest> {
    return this.prisma.mutualInterest.create({
      data,
    });
  }

  /**
   * Delete mutual interest
   */
  async delete(id: string): Promise<MutualInterest> {
    return this.prisma.mutualInterest.delete({
      where: { id },
    });
  }

}
