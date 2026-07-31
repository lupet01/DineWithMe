"use server";

import { dinnerRepository, mealRepository } from "@dinewithme/db";
import { MenuCourse } from "@prisma/client";

export interface MenuPreviewItem {
  id: string;
  course: MenuCourse;
  name: string;
}

const COURSE_ORDER = [MenuCourse.STARTER, MenuCourse.MAIN, MenuCourse.DESSERT];

/**
 * Returns up to 3 dishes from the dinner's assigned Meal - one per course
 * (Starter, Main, Dessert), in that order, wherever that course has at
 * least one option. Backs the "Tonight's Menu" preview card on the dinner
 * detail page; the full list (all options per course, with photos) lives
 * at /dinner/[id]/menu. No price here by design (§16.22) - the only price
 * a diner ever sees is the single per-seat total.
 */
export async function getTonightsMenuPreview(dinnerId: string): Promise<MenuPreviewItem[]> {
  const dinner = await dinnerRepository.findById(dinnerId);
  if (!dinner?.mealId) {
    return [];
  }

  const meal = await mealRepository.findByIdWithCourses(dinner.mealId);
  if (!meal) {
    return [];
  }

  const preview: MenuPreviewItem[] = [];
  for (const courseType of COURSE_ORDER) {
    const course = meal.courses.find((c) => c.courseType === courseType);
    const firstOption = course?.options[0];
    if (firstOption) {
      preview.push({
        id: firstOption.menuItem.id,
        course: courseType,
        name: firstOption.menuItem.name,
      });
    }
  }

  return preview;
}
