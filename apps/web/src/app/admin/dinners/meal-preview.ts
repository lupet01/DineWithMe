import type { MealCourseWithOptions } from "@dinewithme/db";

const COURSE_ORDER = ["STARTER", "MAIN", "DESSERT"] as const;

export interface DishPreviewItem {
  course: (typeof COURSE_ORDER)[number];
  name: string;
}

/**
 * Up to 3 dishes from a Meal's courses - one per course (Starter, Main,
 * Dessert), first option in each, wherever that course has at least one
 * option. Mirrors the diner-facing getTonightsMenuPreview() logic
 * (apps/web/src/app/(core)/dinner/[id]/components/menu-preview-actions.ts)
 * exactly, but works off a Meal directly instead of a dinnerId - needed
 * here because Create Dinner's live preview (§16.3 wireframe) has to show
 * what a not-yet-created dinner's menu would look like as the admin picks
 * a Meal, before there's a dinnerId to look one up by.
 */
export function mealCoursesToDishPreview(courses: MealCourseWithOptions[]): DishPreviewItem[] {
  const preview: DishPreviewItem[] = [];
  for (const courseType of COURSE_ORDER) {
    const course = courses.find((c) => c.courseType === courseType);
    const firstOption = course?.options[0];
    if (firstOption) {
      preview.push({ course: courseType, name: firstOption.menuItem.name });
    }
  }
  return preview;
}
