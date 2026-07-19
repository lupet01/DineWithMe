import type { PrismaClient } from "@prisma/client";

export abstract class BaseRepository<T> {
  constructor(protected readonly prisma: PrismaClient) {}

  abstract findById(id: string): Promise<T | null>;
  abstract findMany(options?: unknown): Promise<T[]>;
  abstract create(data: unknown): Promise<T>;
  abstract update(id: string, data: unknown): Promise<T>;
  abstract delete(id: string): Promise<T>;
}
