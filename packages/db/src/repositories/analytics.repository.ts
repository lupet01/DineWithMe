import type { PrismaClient } from "@prisma/client";

export interface ThemeAnalytics {
  themeId: string;
  themeKey: string;
  themeTitle: string;
  totalDinners: number;
  totalSeats: number;
  seatsConfirmed: number;
  seatsAttended: number;
  seatsNoShow: number;
  confirmationRate: number; // seatsConfirmed / totalSeats
  attendanceRate: number; // seatsAttended / seatsConfirmed
  averageComfortScore: number | null; // Average comfort level (1-3 scale)
  totalFeedback: number;
  reportCount: number; // Count of UNCOMFORTABLE feedback
  reportRate: number; // reportCount / totalFeedback
}

export class AnalyticsRepository {
  constructor(private prisma: PrismaClient) {}
  /**
   * Get theme performance analytics
   * 
   * Aggregates metrics per theme:
   * - Total dinners
   * - Seat confirmation rate
   * - Attendance rate
   * - Average comfort score
   * - Report rate (UNCOMFORTABLE feedback)
   */
  async getThemeAnalytics(): Promise<ThemeAnalytics[]> {
    // Get all themes with their dinners
    const themes = await this.prisma.theme.findMany({
      where: { isActive: true },
      include: {
        dinners: {
          where: {
            status: {
              in: ["COMPLETED", "LIVE", "SCHEDULED"],
            },
          },
          include: {
            seats: {
              select: {
                id: true,
                status: true,
              },
            },
            feedback: {
              where: {
                targetUserId: null, // Only table-level feedback
              },
              select: {
                id: true,
                overallSentiment: true,
                comfortLevel: true,
              },
            },
          },
        },
      },
    });

    // Calculate metrics for each theme
    const analytics: ThemeAnalytics[] = themes.map((theme: any) => {
      const totalDinners = theme.dinners.length;
      
      // Seat metrics
      const allSeats = theme.dinners.flatMap((d: any) => d.seats);
      const totalSeats = allSeats.length;
      const seatsConfirmed = allSeats.filter(
        (s: any) => ["CONFIRMED", "ATTENDED", "COMPLETED", "NO_SHOW", "LEFT_EARLY"].includes(s.status)
      ).length;
      const seatsAttended = allSeats.filter(
        (s: any) => ["ATTENDED", "COMPLETED"].includes(s.status)
      ).length;
      const seatsNoShow = allSeats.filter((s: any) => s.status === "NO_SHOW").length;

      const confirmationRate = totalSeats > 0 ? seatsConfirmed / totalSeats : 0;
      const attendanceRate = seatsConfirmed > 0 ? seatsAttended / seatsConfirmed : 0;

      // Feedback metrics
      const allFeedback = theme.dinners.flatMap((d: any) => d.feedback);
      const totalFeedback = allFeedback.length;
      const reportCount = allFeedback.filter(
        (f: any) => f.overallSentiment === "UNCOMFORTABLE"
      ).length;
      const reportRate = totalFeedback > 0 ? reportCount / totalFeedback : 0;

      // Comfort score (FULL=3, MOSTLY=2, LOW=1)
      const comfortScores = allFeedback.map((f: any) => {
        switch (f.comfortLevel) {
          case "FULL":
            return 3;
          case "MOSTLY":
            return 2;
          case "LOW":
            return 1;
          default:
            return 0;
        }
      });
      const averageComfortScore =
        comfortScores.length > 0
          ? comfortScores.reduce((sum: number, score: number) => sum + score, 0) / comfortScores.length
          : null;

      return {
        themeId: theme.id,
        themeKey: theme.key,
        themeTitle: theme.title,
        totalDinners,
        totalSeats,
        seatsConfirmed,
        seatsAttended,
        seatsNoShow,
        confirmationRate: Math.round(confirmationRate * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        averageComfortScore:
          averageComfortScore !== null
            ? Math.round(averageComfortScore * 100) / 100
            : null,
        totalFeedback,
        reportCount,
        reportRate: Math.round(reportRate * 100) / 100,
      };
    });

    return analytics;
  }

  /**
   * Get analytics for a specific theme
   */
  async getThemeAnalyticsById(themeId: string): Promise<ThemeAnalytics | null> {
    const allAnalytics = await this.getThemeAnalytics();
    return allAnalytics.find((a) => a.themeId === themeId) || null;
  }

  /**
   * Get analytics for a specific theme by key
   */
  async getThemeAnalyticsByKey(themeKey: string): Promise<ThemeAnalytics | null> {
    const allAnalytics = await this.getThemeAnalytics();
    return allAnalytics.find((a) => a.themeKey === themeKey) || null;
  }
}
