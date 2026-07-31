import type { RestaurantClosureRequest, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export type RestaurantClosureRequestWithRestaurant = RestaurantClosureRequest & {
  restaurant: { id: string; name: string };
  requestedBy: { id: string; firstName: string | null; lastName: string | null; email: string };
};

export class RestaurantClosureRequestRepository extends BaseRepository<RestaurantClosureRequest> {
  async findById(id: string): Promise<RestaurantClosureRequest | null> {
    return this.prisma.restaurantClosureRequest.findUnique({
      where: { id },
    });
  }

  async findMany(): Promise<RestaurantClosureRequest[]> {
    return this.prisma.restaurantClosureRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<RestaurantClosureRequest[]> {
    return this.prisma.restaurantClosureRequest.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * A restaurant can have at most one PENDING closure request at a time -
   * used to block submitting a duplicate while one's already in review.
   */
  async findPendingByRestaurant(restaurantId: string): Promise<RestaurantClosureRequest | null> {
    return this.prisma.restaurantClosureRequest.findFirst({
      where: { restaurantId, status: "PENDING" },
    });
  }

  async findPending(): Promise<RestaurantClosureRequestWithRestaurant[]> {
    return this.prisma.restaurantClosureRequest.findMany({
      where: { status: "PENDING" },
      include: {
        restaurant: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(data: Prisma.RestaurantClosureRequestCreateInput): Promise<RestaurantClosureRequest> {
    return this.prisma.restaurantClosureRequest.create({
      data,
    });
  }

  async update(id: string, data: Prisma.RestaurantClosureRequestUpdateInput): Promise<RestaurantClosureRequest> {
    return this.prisma.restaurantClosureRequest.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<RestaurantClosureRequest> {
    return this.prisma.restaurantClosureRequest.delete({
      where: { id },
    });
  }
}
