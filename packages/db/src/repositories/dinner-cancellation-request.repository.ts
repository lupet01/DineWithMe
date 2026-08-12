import type { DinnerCancellationRequest, Prisma } from "@prisma/client";
import { BaseRepository } from "./base";

export type DinnerCancellationRequestWithDinner = DinnerCancellationRequest & {
  dinner: {
    id: string;
    startsAt: Date;
    status: string;
    restaurant: { id: string; name: string };
    theme: { title: string } | null;
  };
  requestedBy: { id: string; firstName: string | null; lastName: string | null; email: string };
};

/**
 * Restaurant-admin dinner cancellations are admin-mediated (they release paid
 * seats + refund guests), so they go through a review request — mirrors
 * RestaurantClosureRequestRepository.
 */
export class DinnerCancellationRequestRepository extends BaseRepository<DinnerCancellationRequest> {
  async findById(id: string): Promise<DinnerCancellationRequest | null> {
    return this.prisma.dinnerCancellationRequest.findUnique({ where: { id } });
  }

  async findMany(): Promise<DinnerCancellationRequest[]> {
    return this.prisma.dinnerCancellationRequest.findMany({ orderBy: { createdAt: "desc" } });
  }

  async delete(id: string): Promise<DinnerCancellationRequest> {
    return this.prisma.dinnerCancellationRequest.delete({ where: { id } });
  }

  /** At most one PENDING request per dinner — blocks duplicate submissions. */
  async findPendingByDinner(dinnerId: string): Promise<DinnerCancellationRequest | null> {
    return this.prisma.dinnerCancellationRequest.findFirst({
      where: { dinnerId, status: "PENDING" },
    });
  }

  async findPending(): Promise<DinnerCancellationRequestWithDinner[]> {
    return this.prisma.dinnerCancellationRequest.findMany({
      where: { status: "PENDING" },
      include: {
        dinner: {
          select: {
            id: true,
            startsAt: true,
            status: true,
            restaurant: { select: { id: true, name: true } },
            theme: { select: { title: true } },
          },
        },
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(data: Prisma.DinnerCancellationRequestCreateInput): Promise<DinnerCancellationRequest> {
    return this.prisma.dinnerCancellationRequest.create({ data });
  }

  async update(
    id: string,
    data: Prisma.DinnerCancellationRequestUpdateInput
  ): Promise<DinnerCancellationRequest> {
    return this.prisma.dinnerCancellationRequest.update({ where: { id }, data });
  }
}
