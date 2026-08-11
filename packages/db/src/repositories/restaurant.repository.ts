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

  /** Owner or Manager - the two roles that exist (§sec-team). Used for
   * actions the wireframe scopes to "any team member", like Restaurant
   * Profile's Edit Profile, as opposed to isUserOwner's stricter gate for
   * Owner-only actions (Danger Zone, bank details). */
  async isUserMember(restaurantId: string, userId: string): Promise<boolean> {
    const member = await this.getUserRole(restaurantId, userId);
    return member !== null;
  }

  /**
   * Adds an already-existing User to a restaurant's team - used by Accept
   * Invite once the invitee has a real User row (see TeamInvite's own
   * doc comment for why an invite can't create one up front). No-ops if
   * the user is already a member rather than throwing the unique
   * constraint error, since an invite can be accepted at most once but
   * this stays safe to call defensively.
   */
  async addMember(
    restaurantId: string,
    userId: string,
    role: "OWNER" | "MANAGER"
  ): Promise<RestaurantMember> {
    const existing = await this.getUserRole(restaurantId, userId);
    if (existing) return existing;

    return this.prisma.restaurantMember.create({
      data: { restaurantId, userId, role },
    });
  }

  /**
   * Changes a team member's role. Only ever called on a MANAGER row - the
   * Team screen's Owner row has no select at all, since there's always
   * exactly one restaurant creator. Promoting a Manager to Owner is
   * therefore an ownership *transfer*, not an addition: the previous
   * Owner is demoted to Manager in the same transaction so the
   * exactly-one-Owner invariant never breaks, even for a moment.
   * Demoting a Manager back to Manager (a no-op) or setting one back to
   * MANAGER explicitly both skip the transfer path.
   */
  async updateMemberRole(
    restaurantId: string,
    memberUserId: string,
    newRole: "OWNER" | "MANAGER"
  ): Promise<void> {
    if (newRole === "MANAGER") {
      await this.prisma.restaurantMember.updateMany({
        where: { restaurantId, userId: memberUserId, role: "MANAGER" },
        data: { role: "MANAGER" },
      });
      return;
    }

    await this.prisma.$transaction([
      this.prisma.restaurantMember.updateMany({
        where: { restaurantId, role: "OWNER" },
        data: { role: "MANAGER" },
      }),
      this.prisma.restaurantMember.updateMany({
        where: { restaurantId, userId: memberUserId, role: "MANAGER" },
        data: { role: "OWNER" },
      }),
    ]);
  }

  /**
   * Removes a team member. Deliberately cannot remove an OWNER through
   * this path - the Team screen's remove action only ever targets
   * MANAGER rows, protecting a restaurant from being left ownerless.
   */
  async removeMember(restaurantId: string, memberUserId: string): Promise<void> {
    await this.prisma.restaurantMember.deleteMany({
      where: { restaurantId, userId: memberUserId, role: "MANAGER" },
    });
  }

  /**
   * Update restaurant status
   */
  async updateStatus(id: string, status: "PENDING" | "ACTIVE" | "PAUSED" | "ARCHIVED"): Promise<Restaurant> {
    return this.prisma.restaurant.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Approve a restaurant (set status to ACTIVE) - also used to reactivate
   * a PAUSED restaurant, clearing pausedAt either way (a no-op if it was
   * already null, e.g. the PENDING -> ACTIVE approval path).
   */
  async approve(id: string): Promise<Restaurant> {
    return this.prisma.restaurant.update({
      where: { id },
      data: { status: "ACTIVE", pausedAt: null, updatedAt: new Date() },
    });
  }

  /**
   * Pause a restaurant (set status to PAUSED) - self-serve and instantly
   * reversible via approve(), unlike archive() (§16.7).
   */
  async pause(id: string): Promise<Restaurant> {
    return this.prisma.restaurant.update({
      where: { id },
      data: { status: "PAUSED", pausedAt: new Date(), updatedAt: new Date() },
    });
  }

  async updateNotificationPreferences(
    restaurantId: string,
    prefs: { notifyNewBooking?: boolean; notifyCancellation?: boolean; notifyLowFillRateWarning?: boolean }
  ): Promise<Restaurant> {
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: prefs,
    });
  }

  /**
   * Permanently closes a restaurant - only ever called from an approved
   * RestaurantClosureRequest, never directly from a button (§4.5.5).
   */
  async archive(id: string): Promise<Restaurant> {
    return this.updateStatus(id, "ARCHIVED");
  }

  /**
   * Marks the Dashboard's one-time "You're Live!" moment as shown. Called
   * client-side on actual display, not on approval - mirrors the icebreaker
   * usage-tracking pattern of only recording a signal when it's genuinely
   * been seen, not merely become eligible.
   */
  async markLiveMomentSeen(id: string): Promise<Restaurant> {
    return this.prisma.restaurant.update({
      where: { id },
      data: { liveMomentSeenAt: new Date() },
    });
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
      ARCHIVED: 0,
    };

    for (const result of results) {
      counts[result.status] = result._count.status;
    }

    return counts;
  }
}
