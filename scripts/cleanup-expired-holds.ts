/**
 * Cleanup Expired Holds
 * 
 * Releases seats that have expired holds
 * 
 * Usage: npx tsx scripts/cleanup-expired-holds.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupExpiredHolds() {
  console.log("🧹 Cleaning up expired holds...\n");

  try {
    const now = new Date();

    // Find expired holds
    const expiredSeats = await prisma.seat.findMany({
      where: {
        status: "HELD",
        holdExpiresAt: {
          lt: now,
        },
      },
      include: {
        dinner: {
          include: {
            restaurant: true,
            theme: true,
          },
        },
      },
    });

    if (expiredSeats.length === 0) {
      console.log("✅ No expired holds found\n");
      await prisma.$disconnect();
      return;
    }

    console.log(`Found ${expiredSeats.length} expired holds:\n`);

    for (const seat of expiredSeats) {
      const minutesExpired = Math.floor(
        (now.getTime() - seat.holdExpiresAt!.getTime()) / 1000 / 60
      );
      console.log(
        `  • ${seat.dinner.restaurant.name} - ${seat.dinner.theme?.title}`
      );
      console.log(`    Expired ${minutesExpired} minutes ago`);
    }

    // Release the holds
    const result = await prisma.seat.updateMany({
      where: {
        status: "HELD",
        holdExpiresAt: {
          lt: now,
        },
      },
      data: {
        status: "AVAILABLE",
        heldByUserId: null,
        holdExpiresAt: null,
        updatedAt: now,
      },
    });

    console.log(`\n✅ Released ${result.count} expired holds\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

cleanupExpiredHolds();
