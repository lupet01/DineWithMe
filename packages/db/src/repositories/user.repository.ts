import type { User, Prisma, Role } from "@prisma/client";
import { BaseRepository } from "./base";

export class UserRepository extends BaseRepository<User> {
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByAuthProviderId(authProviderId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { authProviderId },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findMany(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Server-side paginated + searchable user list, backing the platform-wide
   * Users (Ops) screen (§sec-users) - that list aggregates every user on the
   * platform and is genuinely unbounded, so it pages/searches in the DB
   * rather than loading all rows to the client. Search matches name or email,
   * case-insensitive. Returns the page plus the total matching count so the
   * caller can render "Showing X-Y of Z" and page controls.
   */
  async findManyPaginated(params: {
    skip: number;
    take: number;
    search?: string;
  }): Promise<{ users: User[]; total: number }> {
    const query = params.search?.trim();
    const where: Prisma.UserWhereInput | undefined = query
      ? {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findByRole(role: Role): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async upsertByAuthProviderId(
    authProviderId: string,
    data: Prisma.UserCreateInput
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { authProviderId },
      create: data,
      update: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: data.avatarUrl,
        status: data.status,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Update a user's role (platform admin only - enforced by callers)
   */
  async updateRole(id: string, role: Role): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        role,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Count total users grouped by role (for platform analytics)
   * Aggregated in the database via groupBy - does not load rows into memory.
   */
  async countByRole(): Promise<Record<Role, number>> {
    const results = await this.prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    const counts: Record<Role, number> = {
      DINER: 0,
      RESTAURANT_ADMIN: 0,
      PLATFORM_ADMIN: 0,
    };

    for (const result of results) {
      counts[result.role] = result._count.role;
    }

    return counts;
  }
}
