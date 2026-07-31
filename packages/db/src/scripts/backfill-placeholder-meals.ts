/**
 * One-time backfill: every dinner scheduled before the Meals system shipped
 * has `mealId = null`. Per explicit product decision (not left as an
 * accept-null default), each affected restaurant gets one placeholder Meal
 * - named "Untitled Menu" - assembled from up to 3 existing Dish Library
 * items per course, and every one of that restaurant's null-mealId dinners
 * is pointed at it. This means Tonight's Menu/Full Menu have something real
 * to show immediately, not an empty state, for dinners scheduled before
 * a restaurant ever touches the new Meals screen.
 *
 * Idempotent: safe to re-run - skips a restaurant if it already has a Meal
 * named "Untitled Menu" (reuses it rather than creating a duplicate), and
 * only touches dinners that still have mealId = null.
 */
import { PrismaClient, MenuCourse } from "@prisma/client";

const prisma = new PrismaClient();

const PLACEHOLDER_MEAL_NAME = "Untitled Menu";
const COURSE_ORDER: MenuCourse[] = [MenuCourse.STARTER, MenuCourse.MAIN, MenuCourse.DESSERT];

async function main() {
  let mealsCreated = 0;
  let optionsCreated = 0;
  let dinnersUpdated = 0;

  const restaurantIds = await prisma.dinner.findMany({
    where: { mealId: null },
    select: { restaurantId: true },
    distinct: ["restaurantId"],
  });

  for (const { restaurantId } of restaurantIds) {
    let placeholderMeal = await prisma.meal.findFirst({
      where: { restaurantId, name: PLACEHOLDER_MEAL_NAME },
      include: { courses: true },
    });

    if (!placeholderMeal) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { defaultPricePerSeatCents: true },
      });

      placeholderMeal = await prisma.meal.create({
        data: {
          restaurantId,
          name: PLACEHOLDER_MEAL_NAME,
          suggestedPricePerSeatCents: restaurant?.defaultPricePerSeatCents ?? 0,
          isActive: true,
          courses: {
            create: COURSE_ORDER.map((courseType, index) => ({
              courseType,
              displayOrder: index,
            })),
          },
        },
        include: { courses: true },
      });
      mealsCreated++;

      const dishes = await prisma.menuItem.findMany({
        where: { restaurantId },
        orderBy: { position: "asc" },
      });

      for (const course of placeholderMeal.courses) {
        const dishesForCourse = dishes.filter((d) => d.course === course.courseType).slice(0, 3);
        for (const dish of dishesForCourse) {
          await prisma.mealCourseOption.create({
            data: { mealCourseId: course.id, menuItemId: dish.id },
          });
          optionsCreated++;
        }
      }
    }

    const result = await prisma.dinner.updateMany({
      where: { restaurantId, mealId: null },
      data: { mealId: placeholderMeal.id },
    });
    dinnersUpdated += result.count;
  }

  console.log(
    `Backfill complete: ${mealsCreated} placeholder Meals created, ${optionsCreated} MealCourseOption rows created, ${dinnersUpdated} dinners assigned a mealId across ${restaurantIds.length} restaurants.`
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
