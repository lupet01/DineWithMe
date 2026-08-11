import type { Dinner, Prisma, DinnerStatus } from "@prisma/client";
import { BaseRepository } from "./base";

export type DinnerWithRestaurant = Dinner & {
  restaurant: {
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
    cuisine?: string | null;
    heroImageUrl?: string | null;
  };
  theme?: {
    id: string;
    key: string;
    title: string;
    shortDescription: string;
  };
};

export class DinnerRepository extends BaseRepository<Dinner> {
  async findById(id: string): Promise<Dinner | null> {
    return this.prisma.dinner.findUnique({
      where: { id },
    });
  }

  async findByIdWithRestaurant(id: string): Promise<DinnerWithRestaurant | null> {
    return this.prisma.dinner.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        theme: {
          select: {
            id: true,
            key: true,
            title: true,
            shortDescription: true,
          },
        },
      },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<Dinner[]> {
    return this.prisma.dinner.findMany({
      where: { restaurantId },
      orderBy: { startsAt: "asc" },
    });
  }

  /**
   * All of a restaurant's dinners with theme titles (for Restaurant
   * Analytics' theme breakdown) - findByRestaurant intentionally stays
   * bare (its other callers don't need the join), so this is a separate
   * method rather than widening that one for every consumer.
   */
  async findByRestaurantWithTheme(
    restaurantId: string
  ): Promise<Array<Dinner & { theme: { title: string } | null }>> {
    return this.prisma.dinner.findMany({
      where: { restaurantId },
      include: { theme: { select: { title: true } } },
      orderBy: { startsAt: "desc" },
    });
  }

  async findUpcomingByRestaurant(restaurantId: string): Promise<Dinner[]> {
    return this.prisma.dinner.findMany({
      where: {
        restaurantId,
        status: {
          in: ["SCHEDULED", "LIVE"],
        },
        startsAt: {
          gte: new Date(),
        },
      },
      orderBy: { startsAt: "asc" },
    });
  }

  /**
   * Upcoming (SCHEDULED/LIVE, not-yet-started) dinners for a restaurant
   * with theme title and seat status counts, for the admin Dashboard's
   * "Upcoming Dinners" mini-table. Same filter as findUpcomingByRestaurant
   * but with the includes that table needs, in one query instead of N+1.
   */
  async findUpcomingByRestaurantWithSeatCounts(restaurantId: string): Promise<
    Array<
      Dinner & {
        theme: { title: string } | null;
        seats: Array<{ status: string }>;
        _count: { seats: number };
      }
    >
  > {
    return this.prisma.dinner.findMany({
      where: {
        restaurantId,
        // A LIVE dinner's startsAt is necessarily in the past (it already
        // began), so it must be included unconditionally - only a
        // not-yet-started SCHEDULED dinner needs the future-startsAt
        // filter. Without this OR, a dinner that just went LIVE would
        // silently vanish from its own Dashboard's "Upcoming Dinners" list.
        OR: [{ status: "LIVE" }, { status: "SCHEDULED", startsAt: { gte: new Date() } }],
      },
      include: {
        theme: { select: { title: true } },
        seats: { select: { status: true } },
        _count: { select: { seats: true } },
      },
      orderBy: { startsAt: "asc" },
    });
  }

  /**
   * The restaurant's currently-LIVE dinner, if any, with full seat+guest
   * detail for the Dashboard's "Live Now" check-in card (§16.11 wireframe).
   * At most one LIVE dinner is expected per restaurant at a time in
   * practice, so returning a single dinner (not a list) is deliberate.
   */
  async findLiveByRestaurant(restaurantId: string): Promise<
    | (Dinner & {
        theme: { title: string } | null;
        seats: Array<{
          id: string;
          status: string;
          dietaryNotes: string | null;
          confirmedByUserId: string | null;
          confirmedByUser: { id: string; firstName: string | null; lastName: string | null } | null;
        }>;
      })
    | null
  > {
    return this.prisma.dinner.findFirst({
      where: { restaurantId, status: "LIVE" },
      include: {
        theme: { select: { title: true } },
        seats: {
          select: {
            id: true,
            status: true,
            dietaryNotes: true,
            confirmedByUserId: true,
            confirmedByUser: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { startsAt: "desc" },
    });
  }

  /**
   * Most recent dinners for a restaurant (any status) with seat status
   * counts, for Restaurant Analytics' "Fill Rate - Recent Dinners" list.
   * Unlike findUpcomingByRestaurantWithSeatCounts this isn't filtered to
   * SCHEDULED/LIVE - the wireframe's fill-rate list is about dinners that
   * already happened.
   */
  async findRecentByRestaurantWithSeatCounts(
    restaurantId: string,
    limit: number
  ): Promise<
    Array<
      Dinner & {
        theme: { title: string } | null;
        seats: Array<{ status: string }>;
        _count: { seats: number };
      }
    >
  > {
    return this.prisma.dinner.findMany({
      where: { restaurantId },
      include: {
        theme: { select: { title: true } },
        seats: { select: { status: true } },
        _count: { select: { seats: true } },
      },
      orderBy: { startsAt: "desc" },
      take: limit,
    });
  }

  /**
   * Dinners for a restaurant starting within a window, with seat status
   * counts - for Restaurant Analytics' range-scoped "Dinners Hosted" /
   * "Avg Fill Rate" stats (§16.1 wireframe's range picker). Unlike
   * findRecentByRestaurantWithSeatCounts (a fixed take(5) for the fill-rate
   * list regardless of range), this is unbounded within the window so the
   * count and average are accurate for whatever range is selected.
   */
  async findByRestaurantWithSeatCountsSince(
    restaurantId: string,
    since: Date
  ): Promise<
    Array<
      Dinner & {
        seats: Array<{ status: string }>;
        _count: { seats: number };
      }
    >
  > {
    return this.prisma.dinner.findMany({
      where: { restaurantId, startsAt: { gte: since } },
      include: {
        seats: { select: { status: true } },
        _count: { select: { seats: true } },
      },
      orderBy: { startsAt: "desc" },
    });
  }

  async findMany(): Promise<Dinner[]> {
    return this.prisma.dinner.findMany({
      orderBy: { startsAt: "desc" },
    });
  }

  /**
   * All dinners with theme + restaurant, optionally scoped to one
   * restaurant. restaurantId is optional so this can still back the
   * platform-wide Dinners (Ops) list (§sec-ops-dinners), which
   * legitimately needs every restaurant's dinners - the restaurant admin
   * Dinners list (§16.3) always passes its own restaurantId.
   */
  async findManyWithTheme(restaurantId?: string): Promise<DinnerWithRestaurant[]> {
    return this.prisma.dinner.findMany({
      where: restaurantId ? { restaurantId } : undefined,
      orderBy: { startsAt: "desc" },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        theme: {
          select: {
            id: true,
            key: true,
            title: true,
            shortDescription: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.DinnerCreateInput): Promise<Dinner> {
    // Check if restaurant is active before creating dinner
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: data.restaurant.connect?.id as string },
    });

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error(
        `Cannot create dinner. Restaurant status is ${restaurant.status}. Only ACTIVE restaurants can create dinners.`
      );
    }

    // Create dinner with seats
    const dinner = await this.prisma.dinner.create({
      data,
    });

    // Create seats for the dinner
    const seatCount = typeof data.seatCount === 'number' ? data.seatCount : 0;
    if (seatCount > 0) {
      const seats = Array.from({ length: seatCount }, () => ({
        dinnerId: dinner.id,
        status: "AVAILABLE" as const,
      }));

      await this.prisma.seat.createMany({
        data: seats,
      });
    }

    return dinner;
  }

  async update(id: string, data: Prisma.DinnerUpdateInput): Promise<Dinner> {
    return this.prisma.dinner.update({
      where: { id },
      data,
    });
  }

  /**
   * Grows or shrinks a dinner's seat pool to match a new seatCount, used
   * when editing a dinner's seat count after seats already exist. Only
   * ever removes AVAILABLE seats (falling back to HELD ones if there
   * aren't enough available) - CONFIRMED/ATTENDED/COMPLETED seats are
   * never touched. Callers must independently guarantee newSeatCount is
   * not below the number of already-booked seats (see updateDinner
   * §16.3's seat-count floor).
   */
  async resizeSeatPool(dinnerId: string, newSeatCount: number): Promise<void> {
    const seats = await this.prisma.seat.findMany({
      where: { dinnerId },
      orderBy: { createdAt: "asc" },
    });
    const currentCount = seats.length;
    if (newSeatCount === currentCount) return;

    if (newSeatCount > currentCount) {
      const toAdd = newSeatCount - currentCount;
      await this.prisma.seat.createMany({
        data: Array.from({ length: toAdd }, () => ({
          dinnerId,
          status: "AVAILABLE" as const,
        })),
      });
      return;
    }

    const toRemove = currentCount - newSeatCount;
    const removable = seats
      .filter((s) => s.status === "AVAILABLE")
      .concat(seats.filter((s) => s.status === "HELD"))
      .slice(0, toRemove);

    await this.prisma.seat.deleteMany({
      where: { id: { in: removable.map((s) => s.id) } },
    });
  }

  async updateStatus(id: string, status: DinnerStatus): Promise<Dinner> {
    return this.prisma.dinner.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  async cancelDinner(id: string): Promise<Dinner> {
    // Cancel all held and confirmed seats
    await this.prisma.seat.updateMany({
      where: {
        dinnerId: id,
        status: {
          in: ["HELD", "CONFIRMED"],
        },
      },
      data: {
        status: "CANCELLED",
        updatedAt: new Date(),
      },
    });

    // Update dinner status
    return this.prisma.dinner.update({
      where: { id },
      data: {
        status: "CANCELLED",
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<Dinner> {
    return this.prisma.dinner.delete({
      where: { id },
    });
  }

  /**
   * Check if user is authorized to manage this dinner
   * User must be OWNER or MANAGER of the restaurant
   */
  async isAuthorizedToManage(dinnerId: string, userId: string): Promise<boolean> {
    const dinner = await this.prisma.dinner.findUnique({
      where: { id: dinnerId },
      include: {
        restaurant: {
          include: {
            members: {
              where: {
                userId,
                role: {
                  in: ["OWNER", "MANAGER"],
                },
              },
            },
          },
        },
      },
    });

    return !!dinner && dinner.restaurant.members.length > 0;
  }

  /**
   * Find public dinners with filters and seat counts
   * Efficient query that includes seat availability in a single query
   * 
   * @param filters - Optional filters (city, theme, date range, pagination)
   * @returns Dinners with restaurant info and seat counts
   */
  async findPublicDinners(filters?: {
    city?: string;
    themeKey?: string;
    from?: Date;
    to?: Date;
    /** Exact table size (seatCount) match, e.g. from a "4 seats" filter pill. */
    seatCount?: number;
    /** Minimum table size (seatCount), e.g. from an "8+ seats" filter pill. Ignored if seatCount is also set. */
    minSeatCount?: number;
    limit?: number;
    offset?: number;
  }): Promise<Array<DinnerWithRestaurant & {
    _count: {
      seats: number;
    };
    seats: Array<{ status: string }>;
  }>> {
    const where: Prisma.DinnerWhereInput = {
      status: {
        in: ["SCHEDULED", "LIVE"],
      },
      startsAt: {
        gte: filters?.from || new Date(),
        ...(filters?.to && { lte: filters.to }),
      },
      restaurant: {
        status: "ACTIVE",
        ...(filters?.city && {
          city: {
            equals: filters.city,
            mode: "insensitive",
          },
        }),
      },
      ...(filters?.themeKey && {
        theme: {
          key: {
            equals: filters.themeKey,
            mode: "insensitive",
          },
        },
      }),
      ...(filters?.seatCount
        ? { seatCount: filters.seatCount }
        : filters?.minSeatCount
          ? { seatCount: { gte: filters.minSeatCount } }
          : {}),
    };

    return this.prisma.dinner.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            cuisine: true,
            heroImageUrl: true,
            latitude: true,
            longitude: true,
          },
        },
        theme: {
          select: {
            id: true,
            key: true,
            title: true,
            shortDescription: true,
          },
        },
        seats: {
          select: {
            status: true,
          },
        },
        _count: {
          select: {
            seats: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
      ...(filters?.limit && { take: filters.limit }),
      ...(filters?.offset && { skip: filters.offset }),
    });
  }

  /**
   * Count public dinners matching filters
   * Used for pagination
   * 
   * @param filters - Optional filters (city, theme, date range)
   * @returns Total count of matching dinners
   */
  async countPublicDinners(filters?: {
    city?: string;
    themeKey?: string;
    from?: Date;
    to?: Date;
    seatCount?: number;
    minSeatCount?: number;
  }): Promise<number> {
    const where: Prisma.DinnerWhereInput = {
      status: {
        in: ["SCHEDULED", "LIVE"],
      },
      startsAt: {
        gte: filters?.from || new Date(),
        ...(filters?.to && { lte: filters.to }),
      },
      restaurant: {
        status: "ACTIVE",
        ...(filters?.city && {
          city: {
            equals: filters.city,
            mode: "insensitive",
          },
        }),
      },
      ...(filters?.themeKey && {
        theme: {
          key: {
            equals: filters.themeKey,
            mode: "insensitive",
          },
        },
      }),
      ...(filters?.seatCount
        ? { seatCount: filters.seatCount }
        : filters?.minSeatCount
          ? { seatCount: { gte: filters.minSeatCount } }
          : {}),
    };

    return this.prisma.dinner.count({ where });
  }

  /**
   * Find dinner by ID with full details including seat counts
   * 
   * @param id - Dinner ID
   * @returns Dinner with restaurant and seat information
   */
  async findByIdWithDetails(id: string): Promise<(DinnerWithRestaurant & {
    meal: { id: string; name: string } | null;
    _count: {
      seats: number;
    };
    seats: Array<{
      id: string;
      status: string;
      dietaryNotes: string | null;
      checkedInAt: Date | null;
      confirmedByUser: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
      } | null;
      paymentIntents: Array<{ status: string; amount: number }>;
    }>;
  }) | null> {
    return this.prisma.dinner.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            description: true,
            cuisine: true,
            city: true,
            address: true,
            phone: true,
            website: true,
            heroImageUrl: true,
          },
        },
        theme: {
          select: {
            id: true,
            key: true,
            title: true,
            shortDescription: true,
            whatToExpect: true,
            boundaries: true,
            conversationStarters: true,
          },
        },
        meal: {
          select: {
            id: true,
            name: true,
          },
        },
        seats: {
          select: {
            id: true,
            status: true,
            dietaryNotes: true,
            checkedInAt: true,
            confirmedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            paymentIntents: {
              select: { status: true, amount: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            seats: true,
          },
        },
      },
    });
  }

  /**
   * Count dinners grouped by status (for platform analytics)
   * Aggregated in the database via groupBy - does not load rows into memory.
   */
  async countByStatus(): Promise<Record<DinnerStatus, number>> {
    const results = await this.prisma.dinner.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const counts: Record<DinnerStatus, number> = {
      DRAFT: 0,
      SCHEDULED: 0,
      LIVE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    for (const result of results) {
      counts[result.status] = result._count.status;
    }

    return counts;
  }

  /**
   * Count dinners grouped by theme (for platform analytics)
   * Aggregated in the database via groupBy, then joined with theme titles
   * in a single follow-up query - does not load dinner rows into memory.
   */
  async countByTheme(): Promise<
    Array<{ themeId: string; themeKey: string; themeTitle: string; count: number }>
  > {
    const grouped = await this.prisma.dinner.groupBy({
      by: ["themeId"],
      _count: { themeId: true },
    });

    if (grouped.length === 0) {
      return [];
    }

    const themes = await this.prisma.theme.findMany({
      where: { id: { in: grouped.map((g) => g.themeId) } },
      select: { id: true, key: true, title: true },
    });
    const themeById = new Map(themes.map((theme) => [theme.id, theme]));

    return grouped
      .map((group) => {
        const theme = themeById.get(group.themeId);
        return {
          themeId: group.themeId,
          themeKey: theme?.key ?? "unknown",
          themeTitle: theme?.title ?? "Unknown theme",
          count: group._count.themeId,
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Dinner count and seat fill rate for dinners starting within a date
   * range (for the admin Cockpit's "this week" stat). Seat counts are
   * aggregated in the database via count() - does not load dinner or
   * seat rows into memory.
   */
  async getStatsForDateRange(
    start: Date,
    end: Date
  ): Promise<{ dinnerCount: number; totalSeats: number; bookedSeats: number }> {
    const [dinnerCount, totalSeats, bookedSeats] = await Promise.all([
      this.prisma.dinner.count({
        where: { startsAt: { gte: start, lt: end } },
      }),
      this.prisma.seat.count({
        where: { dinner: { startsAt: { gte: start, lt: end } } },
      }),
      this.prisma.seat.count({
        where: {
          dinner: { startsAt: { gte: start, lt: end } },
          status: { in: ["CONFIRMED", "ATTENDED", "COMPLETED"] },
        },
      }),
    ]);

    return { dinnerCount, totalSeats, bookedSeats };
  }
}
