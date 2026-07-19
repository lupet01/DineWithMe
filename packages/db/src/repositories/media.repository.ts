import type { RestaurantMedia, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export class MediaRepository extends BaseRepository<RestaurantMedia> {
  async findById(id: string): Promise<RestaurantMedia | null> {
    return this.prisma.restaurantMedia.findUnique({
      where: { id },
    });
  }

  async findMany(): Promise<RestaurantMedia[]> {
    return this.prisma.restaurantMedia.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<RestaurantMedia[]> {
    return this.prisma.restaurantMedia.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: Prisma.RestaurantMediaCreateInput): Promise<RestaurantMedia> {
    return this.prisma.restaurantMedia.create({
      data,
    });
  }

  async update(
    id: string,
    data: Prisma.RestaurantMediaUpdateInput
  ): Promise<RestaurantMedia> {
    return this.prisma.restaurantMedia.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<RestaurantMedia> {
    return this.prisma.restaurantMedia.delete({
      where: { id },
    });
  }
}
