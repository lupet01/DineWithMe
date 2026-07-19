/**
 * Check Booking Status
 * 
 * Quick script to check the status of bookings in the database
 * 
 * Usage: npx tsx scripts/check-bookings.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking booking status...\n");

  // Get all dinners
  const dinners = await prisma.dinner.findMany({
    include: {
      restaurant: { select: { name: true } },
      theme: { select: { title: true } },
      seats: {
        include: {
          heldByUser: { select: { email: true, firstName: true, lastName: true } },
          confirmedByUser: { select: { email: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  console.log(`📊 Found ${dinners.length} dinners\n`);

  for (const dinner of dinners) {
    const availableSeats = dinner.seats.filter((s) => s.status === "AVAILABLE").length;
    const heldSeats = dinner.seats.filter((s) => s.status === "HELD").length;
    const confirmedSeats = dinner.seats.filter((s) => s.status === "CONFIRMED").length;
    const totalSeats = dinner.seats.length;

    console.log(`🍽️  ${dinner.restaurant.name} - ${dinner.theme.title}`);
    console.log(`   Date: ${dinner.startsAt.toLocaleDateString()} ${dinner.startsAt.toLocaleTimeString()}`);
    console.log(`   Seats: ${availableSeats} available, ${heldSeats} held, ${confirmedSeats} confirmed (${totalSeats} total)`);

    // Show confirmed bookings
    const confirmed = dinner.seats.filter((s) => s.status === "CONFIRMED");
    if (confirmed.length > 0) {
      console.log(`   ✅ Confirmed bookings:`);
      for (const seat of confirmed) {
        const user = seat.confirmedByUser;
        const name = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Unknown";
        console.log(`      • ${name}`);
      }
    }

    // Show held seats
    const held = dinner.seats.filter((s) => s.status === "HELD");
    if (held.length > 0) {
      console.log(`   ⏳ Held seats:`);
      for (const seat of held) {
        const user = seat.heldByUser;
        const name = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Unknown";
        const expiresIn = seat.holdExpiresAt
          ? Math.round((seat.holdExpiresAt.getTime() - Date.now()) / 1000 / 60)
          : 0;
        console.log(`      • ${name} (expires in ${expiresIn} min)`);
      }
    }

    console.log("");
  }

  // Get payment intents
  const payments = await prisma.paymentIntent.findMany({
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      dinner: {
        include: {
          restaurant: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (payments.length > 0) {
    console.log(`💳 Recent payments (last 10):\n`);
    for (const payment of payments) {
      const user = payment.user;
      const name = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Unknown";
      const amount = `R${(payment.amount / 100).toFixed(2)}`;
      const status = payment.status;
      const statusEmoji = status === "SUCCEEDED" ? "✅" : status === "FAILED" ? "❌" : "⏳";

      console.log(`${statusEmoji} ${name} - ${amount} - ${status}`);
      console.log(`   Restaurant: ${payment.dinner.restaurant.name}`);
      console.log(`   Reference: ${payment.providerReference || "N/A"}`);
      console.log(`   Date: ${payment.createdAt.toLocaleString()}`);
      console.log("");
    }
  } else {
    console.log("💳 No payments yet\n");
  }

  // Get analytics events (if table exists)
  try {
    const analytics = await prisma.analytics.findMany({
      where: {
        eventType: {
          in: ["seat_hold_requested", "seat_held_success", "seat_confirmed"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (analytics.length > 0) {
      console.log(`📈 Recent booking events (last 10):\n`);
      for (const event of analytics) {
        console.log(`   ${event.eventType} - ${event.createdAt.toLocaleString()}`);
      }
    }
  } catch (error) {
    console.log("📈 Analytics table not available\n");
  }

  console.log("\n✅ Done!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
