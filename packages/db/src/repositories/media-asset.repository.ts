import type { MediaAsset, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export type MediaLibraryItem = {
  id: string;
  url: string;
  caption: string | null;
  uploadedAt: Date;
  isFeatured: boolean;
  source: "PROFILE" | "DISH" | "DINNER";
  sourceLabel: string;
  sourceHref: string | null;
};

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

  /**
   * The Media Library shows every photo regardless of where it's used -
   * Profile gallery, Dish Library, or a past Dinner - tagged by source so
   * the admin can filter/understand reuse (§16.6 wireframe). A photo is
   * only ever uploaded for one purpose in practice, so this priority order
   * (Dish > Dinner > Profile) is just a tie-break, not a real conflict.
   */
  async findLibraryByRestaurant(restaurantId: string): Promise<MediaLibraryItem[]> {
    const assets = await this.prisma.mediaAsset.findMany({
      where: { restaurantId },
      include: {
        galleryItems: true,
        menuItems: { select: { id: true, name: true } },
        dinnerMedia: { include: { dinner: { include: { theme: true } } } },
      },
      orderBy: { uploadedAt: "desc" },
    });

    const items: MediaLibraryItem[] = assets.map((asset) => {
      const isFeatured = asset.galleryItems.some((item) => item.role === "FEATURED");

      let source: MediaLibraryItem["source"] = "PROFILE";
      let sourceLabel = "Profile";
      let sourceHref: string | null = null;

      const [menuItem] = asset.menuItems;
      const [dinnerMedia] = asset.dinnerMedia;

      if (menuItem) {
        source = "DISH";
        sourceLabel = `Dish · ${menuItem.name}`;
        sourceHref = "/admin/dish-library";
      } else if (dinnerMedia) {
        const themeTitle = dinnerMedia.dinner.theme?.title ?? "Dinner";
        const dateLabel = dinnerMedia.dinner.startsAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        source = "DINNER";
        sourceLabel = `${themeTitle} · ${dateLabel}`;
        sourceHref = `/admin/dinners/${dinnerMedia.dinnerId}`;
      }

      return {
        id: asset.id,
        url: asset.url,
        caption: asset.caption,
        uploadedAt: asset.uploadedAt,
        isFeatured,
        source,
        sourceLabel,
        sourceHref,
      };
    });

    return items.sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return b.uploadedAt.getTime() - a.uploadedAt.getTime();
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
