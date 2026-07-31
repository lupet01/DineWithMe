import type { MediaAsset, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export class MediaAssetRepository extends BaseRepository<MediaAsset> {
  async findById(id: string): Promise<MediaAsset | null> {
    return this.prisma.mediaAsset.findUnique({
      where: { id },
    });
  }

  async findMany(): Promise<MediaAsset[]> {
    return this.prisma.mediaAsset.findMany({
      orderBy: { uploadedAt: "desc" },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<MediaAsset[]> {
    return this.prisma.mediaAsset.findMany({
      where: { restaurantId },
      orderBy: { uploadedAt: "desc" },
    });
  }

  async create(data: Prisma.MediaAssetCreateInput): Promise<MediaAsset> {
    return this.prisma.mediaAsset.create({
      data,
    });
  }

  async update(id: string, data: Prisma.MediaAssetUpdateInput): Promise<MediaAsset> {
    return this.prisma.mediaAsset.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<MediaAsset> {
    return this.prisma.mediaAsset.delete({
      where: { id },
    });
  }
}
