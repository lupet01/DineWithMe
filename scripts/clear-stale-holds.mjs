import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const result = await prisma.seat.updateMany({
  where: {
    status: "HELD",
    holdExpiresAt: { lte: new Date() },
  },
  data: {
    status: "AVAILABLE",
    heldByUserId: null,
    holdExpiresAt: null,
  },
});

console.log(`Cleared ${result.count} stale held seats`);
await prisma.$disconnect();
