import type { TeamInvite, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export class TeamInviteRepository extends BaseRepository<TeamInvite> {
  async findById(id: string): Promise<TeamInvite | null> {
    return this.prisma.teamInvite.findUnique({
      where: { id },
    });
  }

  async findMany(): Promise<TeamInvite[]> {
    return this.prisma.teamInvite.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findByToken(token: string): Promise<TeamInvite | null> {
    return this.prisma.teamInvite.findUnique({
      where: { token },
    });
  }

  /**
   * A restaurant's team invites (restaurantId set) - used by the
   * Restaurant Team screen's pending-invites list.
   */
  async findByRestaurant(restaurantId: string): Promise<TeamInvite[]> {
    return this.prisma.teamInvite.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Platform-wide invites (restaurantId null) - used by the Platform Team
   * screen's pending-invites list.
   */
  async findPlatformInvites(): Promise<TeamInvite[]> {
    return this.prisma.teamInvite.findMany({
      where: { restaurantId: null },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Any still-pending, unexpired invite for this email at this scope
   * (same restaurantId, or both null for a platform invite) - used to
   * block sending a duplicate invite to someone already invited.
   */
  async findActiveByEmail(email: string, restaurantId: string | null): Promise<TeamInvite | null> {
    return this.prisma.teamInvite.findFirst({
      where: {
        email,
        restaurantId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });
  }

  async create(data: Prisma.TeamInviteCreateInput): Promise<TeamInvite> {
    return this.prisma.teamInvite.create({
      data,
    });
  }

  async update(id: string, data: Prisma.TeamInviteUpdateInput): Promise<TeamInvite> {
    return this.prisma.teamInvite.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<TeamInvite> {
    return this.prisma.teamInvite.delete({
      where: { id },
    });
  }
}
