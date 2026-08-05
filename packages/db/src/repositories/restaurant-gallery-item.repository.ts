import type { RestaurantGalleryItem, RestaurantGalleryRole, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export type RestaurantGalleryItemWithAsset = RestaurantGalleryItem & {
  mediaAsset: { id: string; url: string; caption: string | null };
};

export class RestaurantGalleryItemRepository extends BaseRepository<RestaurantGalleryItem> {
  async findById(id: string): Promise<RestaurantGalleryItem | null> {
    return this.prisma.restaurantGalleryItem.findUnique({
      where: { id },
    });
  }

  async findMany(): Promise<RestaurantGalleryItem[]> {
    return this.prisma.restaurantGalleryItem.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<RestaurantGalleryItemWithAsset[]> {
    return this.prisma.restaurantGalleryItem.findMany({
      where: { restaurantId },
      include: {
        mediaAsset: { select: { id: true, url: true, caption: true } },
      },
      orderBy: [{ role: "asc" }, { displayOrder: "asc" }],
    });
  }

  async findFeatured(restaurantId: string): Promise<RestaurantGalleryItemWithAsset | null> {
    return this.prisma.restaurantGalleryItem.findFirst({
      where: { restaurantId, role: "FEATURED" },
      include: {
        mediaAsset: { select: { id: true, url: true, caption: true } },
      },
    });
  }

  async create(data: Prisma.RestaurantGalleryItemCreateInput): Promise<RestaurantGalleryItem> {
    return this.prisma.restaurantGalleryItem.create({
      data,
    });
  }

  async update(
    id: string,
    data: Prisma.RestaurantGalleryItemUpdateInput
  ): Promise<RestaurantGalleryItem> {
    return this.prisma.restaurantGalleryItem.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<RestaurantGalleryItem> {
    return this.prisma.restaurantGalleryItem.delete({
      where: { id },
    });
  }

  /**
   * Set a single item as FEATURED, demoting whatever previously held that
   * role back to GALLERY - only one item can be FEATURED per restaurant at
   * a time, matching the Media Library's single-cover-photo treatment.
   */
  async setFeatured(restaurantId: string, itemId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.restaurantGalleryItem.updateMany({
        where: { restaurantId, role: "FEATURED" as RestaurantGalleryRole },
        data: { role: "GALLERY" as RestaurantGalleryRole },
      }),
      this.prisma.restaurantGalleryItem.update({
        where: { id: itemId },
        data: { role: "FEATURED" as RestaurantGalleryRole },
      }),
    ]);
  }

  /**
   * Media Library lets ANY photo become the featured cover, including
   * Dish/Dinner-sourced ones that don't have a gallery item yet - unlike
   * setFeatured() above, this takes a mediaAssetId and creates the gallery
   * item on demand rather than requiring one to already exist.
   */
  async setFeaturedByMediaAsset(restaurantId: string, mediaAssetId: string): Promise<void> {
    const existing = await this.prisma.restaurantGalleryItem.findFirst({
      where: { restaurantId, mediaAssetId },
    });

    await this.prisma.$transaction([
      this.prisma.restaurantGalleryItem.updateMany({
        where: { restaurantId, role: "FEATURED" as RestaurantGalleryRole },
        data: { role: "GALLERY" as RestaurantGalleryRole },
      }),
      existing
        ? this.prisma.restaurantGalleryItem.update({
            where: { id: existing.id },
            data: { role: "FEATURED" as RestaurantGalleryRole },
          })
        : this.prisma.restaurantGalleryItem.create({
            data: {
              restaurant: { connect: { id: restaurantId } },
              mediaAsset: { connect: { id: mediaAssetId } },
              role: "FEATURED" as RestaurantGalleryRole,
              displayOrder: 0,
            },
          }),
    ]);
  }
}
