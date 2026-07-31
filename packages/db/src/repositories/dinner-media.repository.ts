import type { DinnerMedia, DinnerMediaKind, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export type DinnerMediaWithAsset = DinnerMedia & {
  mediaAsset: { id: string; url: string; caption: string | null };
};

export class DinnerMediaRepository extends BaseRepository<DinnerMedia> {
  async findById(id: string): Promise<DinnerMedia | null> {
    return this.prisma.dinnerMedia.findUnique({
      where: { id },
    });
  }

  async findMany(): Promise<DinnerMedia[]> {
    return this.prisma.dinnerMedia.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findByDinner(dinnerId: string, kind?: DinnerMediaKind): Promise<DinnerMediaWithAsset[]> {
    return this.prisma.dinnerMedia.findMany({
      where: { dinnerId, ...(kind ? { kind } : {}) },
      include: {
        mediaAsset: { select: { id: true, url: true, caption: true } },
      },
      orderBy: { displayOrder: "asc" },
    });
  }

  /**
   * The single photo shown when a guest browses Discover - whichever
   * DINNER_LISTING row has displayOrder 0, the header-photo convention
   * §16.21 established (no separate boolean field needed).
   */
  async findHeaderPhoto(dinnerId: string): Promise<DinnerMediaWithAsset | null> {
    return this.prisma.dinnerMedia.findFirst({
      where: { dinnerId, kind: "DINNER_LISTING", displayOrder: 0 },
      include: {
        mediaAsset: { select: { id: true, url: true, caption: true } },
      },
    });
  }

  async findPendingPromotions(): Promise<DinnerMediaWithAsset[]> {
    return this.prisma.dinnerMedia.findMany({
      where: { promotionStatus: "PENDING" },
      include: {
        mediaAsset: { select: { id: true, url: true, caption: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(data: Prisma.DinnerMediaCreateInput): Promise<DinnerMedia> {
    return this.prisma.dinnerMedia.create({
      data,
    });
  }

  async update(id: string, data: Prisma.DinnerMediaUpdateInput): Promise<DinnerMedia> {
    return this.prisma.dinnerMedia.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<DinnerMedia> {
    return this.prisma.dinnerMedia.delete({
      where: { id },
    });
  }

  /**
   * Make one DINNER_LISTING row the header photo (displayOrder 0),
   * demoting whatever previously held that slot - mirrors
   * RestaurantGalleryItemRepository.setFeatured's single-transaction shape.
   */
  async setHeaderPhoto(dinnerId: string, itemId: string): Promise<void> {
    const current = await this.prisma.dinnerMedia.findMany({
      where: { dinnerId, kind: "DINNER_LISTING" },
      orderBy: { displayOrder: "asc" },
    });

    await this.prisma.$transaction(
      current.map((item, index) => {
        const displayOrder = item.id === itemId ? 0 : index === 0 ? 1 : index + 1;
        return this.prisma.dinnerMedia.update({
          where: { id: item.id },
          data: { displayOrder },
        });
      })
    );
  }
}
