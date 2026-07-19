import type { Restaurant, RestaurantMember, RestaurantMedia, RestaurantStatus, User, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export type RestaurantWithMembers = Restaurant & {
  members: (RestaurantMember & { user: User })[];
};

export type RestaurantWithMedia = Restaurant & {
  media: RestaurantMedia[];
};

export type RestaurantCreateData = Omit<
  Prisma.RestaurantCreateInput,
  "members"
>;

export class RestaurantRepository extends BaseRepository<Restaurant> {
  async findById(id: string): Promise<Restaurant | null> {
    return this.prisma.restaurant.findUnique({
      where: { id },
    });
  }

  async findByIdWithMembers(
    id: string
  ): Promise<RestaurantWithMembers | null> {
    return this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByIdWithMedia(id: string): Promise<RestaurantWithMedia | null> {
    return this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  async findMany(): Promise<Restaurant[]> {
    return this.prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find all restaurants with members (for admin ops page)
   * Single query with includes - avoids N+1 query problem
   */
  async findManyWithMembers(): Promise<RestaurantWithMembers[]> {
    return this.prisma.restaurant.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findManyForUser(userId: string): Promise<RestaurantWithMembers[]> {
    return this.prisma.restaurant.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: RestaurantCreateData): Promise<Restaurant> {
    return this.prisma.restaurant.create({
      data,
    });
  }

  async createWithOwner(
    data: RestaurantCreateData,
    ownerUserId: string
  ): Promise<RestaurantWithMembers> {
    return this.prisma.restaurant.create({
      data: {
        ...data,
        members: {
          create: {
            userId: ownerUserId,
            role: "OWNER",
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.RestaurantUpdateInput
  ): Promise<Restaurant> {
    return this.prisma.restaurant.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Restaurant> {
    return this.prisma.restaurant.delete({
      where: { id },
    });
  }

  async getUserRole(
    restaurantId: string,
    userId: string
  ): Promise<RestaurantMember | null> {
    return this.prisma.restaurantMember.findUnique({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId,
        },
      },
    });
  }

  async isUserOwner(restaurantId: string, userId: string): Promise<boolean> {
    const member = await this.getUserRole(restaurantId, userId);
    return member?.role === "OWNER";
  }

  /**
   * Update restaurant status
   */
  async updateStatus(id: string, status: "PENDING" | "ACTIVE" | "PAUSED"): Promise<Restaurant> {
    return this.prisma.restaurant.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Approve a restaurant (set status to ACTIVE)
   */
  async approve(id: string): Promise<Restaurant> {
    return this.updateStatus(id, "ACTIVE");
  }

  /**
   * Pause a restaurant (set status to PAUSED)
   */
  async pause(id: string): Promise<Restaurant> {
    return this.updateStatus(id, "PAUSED");
  }

  /**
   * Find all pending restaurants (for platform admin review)
   */
  async findPending(): Promise<RestaurantWithMembers[]> {
    return this.prisma.restaurant.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Count restaurants grouped by status (for platform analytics)
   * Aggregated in the database via groupBy - does not load rows into memory.
   */
  async countByStatus(): Promise<Record<RestaurantStatus, number>> {
    const results = await this.prisma.restaurant.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const counts: Record<RestaurantStatus, number> = {
      PENDING: 0,
      ACTIVE: 0,
      PAUSED: 0,
    };

    for (const result of results) {
      counts[result.status] = result._count.status;
    }

    return counts;
  }
}
