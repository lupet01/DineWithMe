import type { MenuItem, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export class MenuItemRepository extends BaseRepository<MenuItem> {
  /**
   * Find menu item by ID
   */
  async findById(id: string): Promise<MenuItem | null> {
    return this.prisma.menuItem.findUnique({
      where: { id },
    });
  }

  /**
   * Find all menu items
   */
  async findMany(): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      orderBy: [{ course: "asc" }, { position: "asc" }],
    });
  }

  /**
   * Find all menu items for a restaurant, ordered by course then position
   */
  async findByRestaurant(restaurantId: string): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: [{ course: "asc" }, { position: "asc" }],
    });
  }

  /**
   * Find only available menu items for a restaurant, ordered by course then position.
   * Used for diner-facing menu views.
   */
  async findAvailableByRestaurant(restaurantId: string): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where: { restaurantId, isAvailable: true },
      orderBy: [{ course: "asc" }, { position: "asc" }],
    });
  }

  /**
   * Create menu item
   */
  async create(data: Prisma.MenuItemCreateInput): Promise<MenuItem> {
    return this.prisma.menuItem.create({
      data,
    });
  }

  /**
   * Update menu item
   */
  async update(id: string, data: Prisma.MenuItemUpdateInput): Promise<MenuItem> {
    return this.prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete menu item
   */
  async delete(id: string): Promise<MenuItem> {
    return this.prisma.menuItem.delete({
      where: { id },
    });
  }

  /**
   * How many distinct Meals reference each dish, keyed by menuItemId.
   * Dishes with no entry here aren't used in any Meal yet.
   */
  async countMealUsage(restaurantId: string): Promise<Record<string, number>> {
    const counts = await this.prisma.mealCourseOption.groupBy({
      by: ["menuItemId"],
      where: {
        menuItem: { restaurantId },
      },
      _count: { menuItemId: true },
    });

    return Object.fromEntries(counts.map((c) => [c.menuItemId, c._count.menuItemId]));
  }
}
