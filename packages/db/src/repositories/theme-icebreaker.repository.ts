import type { ThemeIcebreaker, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export class ThemeIcebreakerRepository extends BaseRepository<ThemeIcebreaker> {
  async findById(id: string): Promise<ThemeIcebreaker | null> {
    return this.prisma.themeIcebreaker.findUnique({
      where: { id },
    });
  }

  async findMany(): Promise<ThemeIcebreaker[]> {
    return this.prisma.themeIcebreaker.findMany({
      orderBy: { displayOrder: "asc" },
    });
  }

  async findByTheme(themeId: string): Promise<ThemeIcebreaker[]> {
    return this.prisma.themeIcebreaker.findMany({
      where: { themeId },
      orderBy: { displayOrder: "asc" },
    });
  }

  /**
   * Top starters for a theme by usage, for Booked Dinner View's "Icebreaker
   * Questions" - falls back to displayOrder among ties (e.g. all zero on a
   * theme with no usage data yet) so the order is still deterministic.
   */
  async findTopByUsage(themeId: string, limit: number): Promise<ThemeIcebreaker[]> {
    return this.prisma.themeIcebreaker.findMany({
      where: { themeId },
      orderBy: [{ usageCount: "desc" }, { displayOrder: "asc" }],
      take: limit,
    });
  }

  async create(data: Prisma.ThemeIcebreakerCreateInput): Promise<ThemeIcebreaker> {
    return this.prisma.themeIcebreaker.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ThemeIcebreakerUpdateInput): Promise<ThemeIcebreaker> {
    return this.prisma.themeIcebreaker.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<ThemeIcebreaker> {
    return this.prisma.themeIcebreaker.delete({
      where: { id },
    });
  }

  async incrementUsage(ids: string[]): Promise<void> {
    await this.prisma.themeIcebreaker.updateMany({
      where: { id: { in: ids } },
      data: { usageCount: { increment: 1 } },
    });
  }
}
