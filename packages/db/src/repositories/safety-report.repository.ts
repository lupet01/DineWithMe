import type { SafetyReport, SafetyReportStatus, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export type SafetyReportWithRelations = SafetyReport & {
  reporter: { id: string; firstName: string | null; lastName: string | null; email: string };
  reportedUser: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  dinner: { id: string; startsAt: Date; theme: { title: string } | null; restaurant: { name: string } } | null;
  reviewedBy: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
};

const relationsInclude = {
  reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
  reportedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
  dinner: {
    select: {
      id: true,
      startsAt: true,
      theme: { select: { title: true } },
      restaurant: { select: { name: true } },
    },
  },
  reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.SafetyReportInclude;

export class SafetyReportRepository extends BaseRepository<SafetyReport> {
  async findById(id: string): Promise<SafetyReport | null> {
    return this.prisma.safetyReport.findUnique({ where: { id } });
  }

  async findByIdWithRelations(id: string): Promise<SafetyReportWithRelations | null> {
    return this.prisma.safetyReport.findUnique({
      where: { id },
      include: relationsInclude,
    });
  }

  /**
   * All reports, most recently created first. Status filtering happens
   * client-side via tabs (report volume is expected to stay small enough
   * that a single query + in-memory filter is simpler than re-fetching
   * per tab).
   */
  async findMany(): Promise<SafetyReportWithRelations[]> {
    return this.prisma.safetyReport.findMany({
      include: relationsInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Every report naming this user as the one being reported about, most
   * recent first - backs User Detail's "Safety Reports Received" card.
   */
  async findByReportedUser(userId: string): Promise<SafetyReportWithRelations[]> {
    return this.prisma.safetyReport.findMany({
      where: { reportedUserId: userId },
      include: relationsInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: Prisma.SafetyReportCreateInput): Promise<SafetyReport> {
    return this.prisma.safetyReport.create({ data });
  }

  async update(id: string, data: Prisma.SafetyReportUpdateInput): Promise<SafetyReport> {
    return this.prisma.safetyReport.update({ where: { id }, data });
  }

  async delete(id: string): Promise<SafetyReport> {
    return this.prisma.safetyReport.delete({ where: { id } });
  }

  async setStatus(
    id: string,
    status: SafetyReportStatus,
    reviewedById: string,
    resolution?: string | null
  ): Promise<SafetyReport> {
    return this.update(id, {
      status,
      resolution,
      reviewedBy: { connect: { id: reviewedById } },
      reviewedAt: new Date(),
    });
  }

  async countByStatus(): Promise<Record<SafetyReportStatus, number>> {
    const results = await this.prisma.safetyReport.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const counts: Record<SafetyReportStatus, number> = {
      PENDING: 0,
      REVIEWED: 0,
      ACTIONED: 0,
      DISMISSED: 0,
    };

    for (const result of results) {
      counts[result.status] = result._count.status;
    }

    return counts;
  }
}
