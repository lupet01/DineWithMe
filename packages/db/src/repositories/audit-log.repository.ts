import type { AuditLog, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export type AuditLogWithActor = AuditLog & {
  actor: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export class AuditLogRepository extends BaseRepository<AuditLog> {
  async findById(id: string): Promise<AuditLog | null> {
    return this.prisma.auditLog.findUnique({
      where: { id },
    });
  }

  async findMany(limit: number = 100): Promise<AuditLogWithActor[]> {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByActor(actorUserId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { actorUserId },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    limit: number = 100
  ): Promise<AuditLogWithActor[]> {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByActionType(actionType: string, limit: number = 100): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { actionType },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data,
    });
  }

  /**
   * Audit logs are immutable — only creation and retention cleanup are allowed.
   */
  async update(_id: string, _data: Prisma.AuditLogUpdateInput): Promise<AuditLog> {
    throw new Error("Audit logs are immutable and cannot be updated");
  }

  /**
   * Audit logs are immutable — use deleteOlderThan() for retention cleanup.
   */
  async delete(_id: string): Promise<AuditLog> {
    throw new Error("Audit logs are immutable and cannot be deleted individually");
  }

  /**
   * Log an action with metadata
   */
  async log(
    actorUserId: string,
    actionType: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<AuditLog> {
    return this.create({
      actor: { connect: { id: actorUserId } },
      actionType,
      entityType,
      entityId,
      metadata: metadata || {},
    });
  }

  /**
   * Delete old audit logs (for cleanup)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
