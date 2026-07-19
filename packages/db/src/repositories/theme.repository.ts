import type { Theme, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export class ThemeRepository extends BaseRepository<Theme> {
  /**
   * Find theme by ID
   */
  async findById(id: string): Promise<Theme | null> {
    return this.prisma.theme.findUnique({
      where: { id },
    });
  }

  /**
   * Find theme by key
   */
  async findByKey(key: string): Promise<Theme | null> {
    return this.prisma.theme.findUnique({
      where: { key },
    });
  }

  /**
   * Find all themes
   */
  async findMany(): Promise<Theme[]> {
    return this.prisma.theme.findMany({
      orderBy: { title: "asc" },
    });
  }

  /**
   * Find active themes only
   */
  async findActive(): Promise<Theme[]> {
    return this.prisma.theme.findMany({
      where: { isActive: true },
      orderBy: { title: "asc" },
    });
  }

  /**
   * Count of restaurants that have each theme enabled, keyed by themeId
   * (for the Theme Library's "N restaurants enabled" adoption stat).
   * Aggregated in the database via groupBy - does not load rows into memory.
   */
  async countEnabledRestaurantsByTheme(): Promise<Record<string, number>> {
    const grouped = await this.prisma.restaurantEnabledTheme.groupBy({
      by: ["themeId"],
      _count: { themeId: true },
    });

    return grouped.reduce<Record<string, number>>((acc, row) => {
      acc[row.themeId] = row._count.themeId;
      return acc;
    }, {});
  }

  /**
   * Find themes enabled for a restaurant
   */
  async findByRestaurant(restaurantId: string): Promise<Theme[]> {
    const enabledThemes = await this.prisma.restaurantEnabledTheme.findMany({
      where: { restaurantId },
      include: { theme: true },
    });

    return enabledThemes.map(et => et.theme);
  }

  /**
   * Create theme
   */
  async create(data: Prisma.ThemeCreateInput): Promise<Theme> {
    return this.prisma.theme.create({
      data,
    });
  }

  /**
   * Update theme
   */
  async update(id: string, data: Prisma.ThemeUpdateInput): Promise<Theme> {
    return this.prisma.theme.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete theme
   */
  async delete(id: string): Promise<Theme> {
    return this.prisma.theme.delete({
      where: { id },
    });
  }

  /**
   * Enable theme for restaurant
   */
  async enableForRestaurant(restaurantId: string, themeId: string): Promise<void> {
    await this.prisma.restaurantEnabledTheme.create({
      data: {
        restaurantId,
        themeId,
      },
    });
  }

  /**
   * Disable theme for restaurant
   */
  async disableForRestaurant(restaurantId: string, themeId: string): Promise<void> {
    const enabledTheme = await this.prisma.restaurantEnabledTheme.findFirst({
      where: {
        restaurantId,
        themeId,
      },
    });

    if (enabledTheme) {
      await this.prisma.restaurantEnabledTheme.delete({
        where: { id: enabledTheme.id },
      });
    }
  }

  /**
   * Check if theme is enabled for restaurant
   */
  async isEnabledForRestaurant(restaurantId: string, themeId: string): Promise<boolean> {
    const count = await this.prisma.restaurantEnabledTheme.count({
      where: {
        restaurantId,
        themeId,
      },
    });

    return count > 0;
  }

}
