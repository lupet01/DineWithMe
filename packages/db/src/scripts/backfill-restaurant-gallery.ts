/**
 * One-time backfill: creates MediaAsset + RestaurantGalleryItem rows from
 * every existing photo source, so RestaurantGalleryItem reads can be
 * cut over to later without losing any existing restaurant's photos.
 *
 * Two sources handled, since they can diverge:
 * 1. RestaurantMedia rows (type HERO -> role FEATURED, type GALLERY -> role
 *    GALLERY).
 * 2. Restaurant.heroImageUrl values with no corresponding RestaurantMedia
 *    (type: HERO) row - these exist because some restaurants had their hero
 *    image set directly (e.g. via seed data) rather than through the normal
 *    upload flow, so there's no RestaurantMedia row to read a storage key
 *    from. The synthetic MediaAsset's `key` is set to the url itself as a
 *    best-effort placeholder - there was never a real signed-upload object
 *    behind these to delete in the first place.
 *
 * Idempotent: safe to re-run - skips a restaurant's HERO/FEATURED slot if a
 * FEATURED RestaurantGalleryItem already exists for it, and skips GALLERY
 * items whose exact (restaurantId, url) pair has already been backfilled.
 *
 * Does NOT touch RestaurantMedia or Restaurant.heroImageUrl - this is
 * additive only, read-path cutover is a separate, later change.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let mediaAssetsCreated = 0;
  let galleryItemsCreated = 0;

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, heroImageUrl: true },
  });

  for (const restaurant of restaurants) {
    const existingFeatured = await prisma.restaurantGalleryItem.findFirst({
      where: { restaurantId: restaurant.id, role: "FEATURED" },
    });

    const restaurantMedia = await prisma.restaurantMedia.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: "asc" },
    });

    const heroMedia = restaurantMedia.find((m) => m.type === "HERO");
    const galleryMedia = restaurantMedia.filter((m) => m.type === "GALLERY");

    // Featured/hero slot: prefer a real RestaurantMedia(HERO) row (has a
    // real storage key); fall back to the bare heroImageUrl if that's all
    // that exists.
    if (!existingFeatured) {
      if (heroMedia) {
        const asset = await prisma.mediaAsset.create({
          data: { restaurantId: restaurant.id, url: heroMedia.url, key: heroMedia.key },
        });
        mediaAssetsCreated++;
        await prisma.restaurantGalleryItem.create({
          data: { restaurantId: restaurant.id, mediaAssetId: asset.id, role: "FEATURED" },
        });
        galleryItemsCreated++;
      } else if (restaurant.heroImageUrl) {
        const asset = await prisma.mediaAsset.create({
          data: {
            restaurantId: restaurant.id,
            url: restaurant.heroImageUrl,
            key: restaurant.heroImageUrl,
          },
        });
        mediaAssetsCreated++;
        await prisma.restaurantGalleryItem.create({
          data: { restaurantId: restaurant.id, mediaAssetId: asset.id, role: "FEATURED" },
        });
        galleryItemsCreated++;
      }
    }

    // Gallery slots: one MediaAsset + RestaurantGalleryItem(GALLERY) per
    // existing RestaurantMedia(GALLERY) row, skipping any url already
    // backfilled for this restaurant.
    for (const media of galleryMedia) {
      const alreadyBackfilled = await prisma.restaurantGalleryItem.findFirst({
        where: { restaurantId: restaurant.id, mediaAsset: { url: media.url } },
      });
      if (alreadyBackfilled) continue;

      const asset = await prisma.mediaAsset.create({
        data: { restaurantId: restaurant.id, url: media.url, key: media.key },
      });
      mediaAssetsCreated++;
      await prisma.restaurantGalleryItem.create({
        data: { restaurantId: restaurant.id, mediaAssetId: asset.id, role: "GALLERY" },
      });
      galleryItemsCreated++;
    }
  }

  console.log(
    `Backfill complete: ${mediaAssetsCreated} MediaAsset rows, ${galleryItemsCreated} RestaurantGalleryItem rows created across ${restaurants.length} restaurants.`
  );
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
