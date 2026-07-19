import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seats = await prisma.seat.findMany({
  where: { status: "HELD" },
  select: { id: true, dinnerId: true, heldByUserId: true, holdExpiresAt: true },
});

console.log("Held seats:", JSON.stringify(seats, null, 2));
console.log("Current time:", new Date().toISOString());
await prisma.$disconnect();
