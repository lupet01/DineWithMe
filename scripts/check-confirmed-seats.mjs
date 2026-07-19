import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seats = await prisma.seat.findMany({
  where: { status: "CONFIRMED" },
  select: {
    id: true,
    status: true,
    heldByUserId: true,
    confirmedByUserId: true,
    dinnerId: true,
  },
});

console.log("Confirmed seats:", JSON.stringify(seats, null, 2));
await prisma.$disconnect();
