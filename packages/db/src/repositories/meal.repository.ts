import type { Meal, MealCourse, MealCourseOption, MealPerformance, MenuItem, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export type MealCourseOptionWithDish = MealCourseOption & { menuItem: MenuItem };
export type MealCourseWithOptions = MealCourse & { options: MealCourseOptionWithDish[] };
export type MealWithCourses = Meal & { courses: MealCourseWithOptions[]; performance: MealPerformance | null };
export type MealWithPerformance = Meal & { performance: MealPerformance | null };
export type MealWithCoursesAndPerformance = Meal & {
  performance: MealPerformance | null;
  courses: MealCourseWithOptions[];
};

const COURSE_ORDER = ["STARTER", "MAIN", "DESSERT"] as const;

export class MealRepository extends BaseRepository<Meal> {
  async findById(id: string): Promise<Meal | null> {
    return this.prisma.meal.findUnique({
      where: { id },
    });
  }

  async findMany(): Promise<Meal[]> {
    return this.prisma.meal.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<MealWithPerformance[]> {
    return this.prisma.meal.findMany({
      where: { restaurantId },
      include: { performance: true },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Like findByRestaurant, but with courses/options/dish data attached so
   * callers (the Meals list) can render a per-course dish summary and
   * course count without a second round-trip per Meal.
   */
  async findByRestaurantWithCourses(restaurantId: string): Promise<MealWithCoursesAndPerformance[]> {
    const meals = await this.prisma.meal.findMany({
      where: { restaurantId },
      include: {
        courses: {
          include: {
            options: {
              include: { menuItem: true },
            },
          },
        },
        performance: true,
      },
      orderBy: { name: "asc" },
    });

    return meals.map((meal) => ({
      ...meal,
      courses: [...meal.courses].sort(
        (a, b) => COURSE_ORDER.indexOf(a.courseType) - COURSE_ORDER.indexOf(b.courseType)
      ),
    }));
  }

  async findByIdWithCourses(id: string): Promise<MealWithCourses | null> {
    const meal = await this.prisma.meal.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            options: {
              include: { menuItem: true },
            },
          },
        },
        performance: true,
      },
    });
    if (!meal) return null;

    return {
      ...meal,
      courses: [...meal.courses].sort(
        (a, b) => COURSE_ORDER.indexOf(a.courseType) - COURSE_ORDER.indexOf(b.courseType)
      ),
    };
  }

  /**
   * A Meal always has exactly one MealCourse per MenuCourse value
   * (Starter/Main/Dessert) - the Meal Editor shows all three course
   * sections from the moment a Meal is created, rather than courses being
   * added/removed independently. Only which dishes fill each course
   * (MealCourseOption) is variable.
   */
  async create(data: Prisma.MealCreateWithoutCoursesInput): Promise<MealWithCourses> {
    const meal = await this.prisma.meal.create({
      data: {
        ...data,
        courses: {
          create: COURSE_ORDER.map((courseType, index) => ({
            courseType,
            displayOrder: index,
          })),
        },
      },
      include: {
        courses: { include: { options: { include: { menuItem: true } } } },
      },
    });
    return { ...meal, performance: null };
  }

  async update(id: string, data: Prisma.MealUpdateInput): Promise<Meal> {
    return this.prisma.meal.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Meal> {
    return this.prisma.meal.delete({
      where: { id },
    });
  }

  async findCourseById(mealCourseId: string): Promise<(MealCourse & { options: MealCourseOption[] }) | null> {
    return this.prisma.mealCourse.findUnique({
      where: { id: mealCourseId },
      include: { options: true },
    });
  }

  async addCourseOption(mealCourseId: string, menuItemId: string): Promise<MealCourseOptionWithDish> {
    return this.prisma.mealCourseOption.create({
      data: {
        mealCourse: { connect: { id: mealCourseId } },
        menuItem: { connect: { id: menuItemId } },
      },
      include: { menuItem: true },
    });
  }

  async removeCourseOption(optionId: string): Promise<MealCourseOption> {
    return this.prisma.mealCourseOption.delete({
      where: { id: optionId },
    });
  }

  /**
   * The meal id that a course option ultimately belongs to (via its course),
   * or null if the option doesn't exist. Lets callers verify an option
   * belongs to the meal they've authorized before mutating it — without this,
   * an owner of meal A could delete an option on another restaurant's meal by
   * passing that option's id.
   */
  async findMealIdForOption(optionId: string): Promise<string | null> {
    const option = await this.prisma.mealCourseOption.findUnique({
      where: { id: optionId },
      select: { mealCourse: { select: { mealId: true } } },
    });
    return option?.mealCourse.mealId ?? null;
  }
}
