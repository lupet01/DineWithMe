"use server";

import { menuItemRepository } from "@dinewithme/db";
import { MenuCourse } from "@prisma/client";

export interface MenuPreviewItem {
  id: string;
  course: MenuCourse;
  name: string;
  priceCents: number;
}

/**
 * Returns up to 3 available menu items for a restaurant - one per course
 * (Starter, Main, Dessert), in that order, where the restaurant has one
 * available. Backs the "Tonight's Menu" preview card on the dinner detail
 * page; the full list lives at /dinner/[id]/menu.
 */
export async function getTonightsMenuPreview(
  restaurantId: string
): Promise<MenuPreviewItem[]> {
  const items = await menuItemRepository.findAvailableByRestaurant(restaurantId);

  const preview: MenuPreviewItem[] = [];
  for (const course of [MenuCourse.STARTER, MenuCourse.MAIN, MenuCourse.DESSERT]) {
    const item = items.find((i) => i.course === course);
    if (item) {
      preview.push({
        id: item.id,
        course: item.course,
        name: item.name,
        priceCents: item.priceCents,
      });
    }
  }

  return preview.slice(0, 3);
}
