import type { ComplianceDocument, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export class ComplianceDocumentRepository extends BaseRepository<ComplianceDocument> {
  async findById(id: string): Promise<ComplianceDocument | null> {
    return this.prisma.complianceDocument.findUnique({
      where: { id },
    });
  }

  async findMany(): Promise<ComplianceDocument[]> {
    return this.prisma.complianceDocument.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<ComplianceDocument[]> {
    return this.prisma.complianceDocument.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: Prisma.ComplianceDocumentCreateInput): Promise<ComplianceDocument> {
    return this.prisma.complianceDocument.create({
      data,
    });
  }

  async update(
    id: string,
    data: Prisma.ComplianceDocumentUpdateInput
  ): Promise<ComplianceDocument> {
    return this.prisma.complianceDocument.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<ComplianceDocument> {
    return this.prisma.complianceDocument.delete({
      where: { id },
    });
  }
}
