import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Simulate exactly what findPublicDinners does
const now = new Date();
console.log('Current time:', now.toISOString());

const dinners = await prisma.dinner.findMany({
  where: {
    status: { in: ['SCHEDULED', 'LIVE'] },
    startsAt: { gte: now },
    restaurant: { status: 'ACTIVE' },
  },
  include: {
    restaurant: { select: { id: true, name: true, status: true } },
    theme: { select: { key: true } },
    _count: { select: { seats: true } },
  },
  orderBy: { startsAt: 'asc' },
});

console.log('Matching dinners:', dinners.length);
console.log(JSON.stringify(dinners, null, 2));

await prisma.$disconnect();
