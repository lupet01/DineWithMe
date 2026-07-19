import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seats = await prisma.seat.findMany({
  select: {
    id: true,
    status: true,
    heldByUserId: true,
    confirmedByUserId: true,
    holdExpiresAt: true,
    dinnerId: true,
  },
  orderBy: { updatedAt: "desc" },
  take: 20,
});

console.log("Recent seats:", JSON.stringify(seats, null, 2));
await prisma.$disconnect();
