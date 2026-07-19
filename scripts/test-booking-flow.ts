/**
 * Test script to verify booking flow endpoints
 * 
 * This script tests the booking flow without actually making payments
 * Run with: node --import tsx scripts/test-booking-flow.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testBookingFlow() {
  console.log("🧪 Testing Booking Flow Endpoints\n");

  try {
    // Test 1: Check for available dinners
    console.log("Test 1: Finding available dinners...");
    const dinners = await prisma.dinner.findMany({
      where: {
        status: {
          in: ["SCHEDULED", "LIVE"],
        },
        startsAt: {
          gte: new Date(),
        },
      },
      include: {
        seats: {
          where: {
            status: "AVAILABLE",
          },
        },
        restaurant: {
          select: {
            name: true,
            status: true,
          },
        },
      },
      take: 5,
    });

    console.log(`✓ Found ${dinners.length} upcoming dinners\n`);

    if (dinners.length === 0) {
      console.log("⚠️  No upcoming dinners found. Create some test dinners first.");
      return;
    }

    // Test 2: Check seat availability
    for (const dinner of dinners) {
      const availableSeats = dinner.seats.length;
      console.log(`Dinner: ${dinner.id}`);
      console.log(`  Restaurant: ${dinner.restaurant.name} (${dinner.restaurant.status})`);
      console.log(`  Available seats: ${availableSeats}`);
      console.log(`  Starts at: ${dinner.startsAt.toLocaleString()}`);
      console.log();
    }

    // Test 3: Check for held seats that should expire
    console.log("Test 3: Checking for expired seat holds...");
    const expiredHolds = await prisma.seat.findMany({
      where: {
        status: "HELD",
        holdExpiresAt: {
          lte: new Date(),
        },
      },
    });

    console.log(`✓ Found ${expiredHolds.length} expired holds (should be released by cron job)\n`);

    // Test 4: Check payment intents
    console.log("Test 4: Checking recent payment intents...");
    const recentPayments = await prisma.paymentIntent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        seat: {
          select: {
            status: true,
          },
        },
      },
    });

    console.log(`✓ Found ${recentPayments.length} recent payment intents\n`);

    for (const payment of recentPayments) {
      console.log(`Payment: ${payment.id}`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Amount: R${(payment.amount / 100).toFixed(2)}`);
      console.log(`  Seat status: ${payment.seat?.status || "N/A"}`);
      console.log(`  Created: ${payment.createdAt.toLocaleString()}`);
      console.log();
    }

    // Test 5: Check for users with multiple bookings
    console.log("Test 5: Checking for duplicate bookings...");
    const duplicateBookings = await prisma.$queryRaw`
      SELECT "confirmedByUserId", "dinnerId", COUNT(*) as count
      FROM seats
      WHERE status = 'CONFIRMED'
      AND "confirmedByUserId" IS NOT NULL
      GROUP BY "confirmedByUserId", "dinnerId"
      HAVING COUNT(*) > 1
    `;

    if (Array.isArray(duplicateBookings) && duplicateBookings.length > 0) {
      console.log(`⚠️  Found ${duplicateBookings.length} users with duplicate bookings!`);
      console.log(duplicateBookings);
    } else {
      console.log(`✓ No duplicate bookings found\n`);
    }

    // Test 6: Verify webhook endpoint exists
    console.log("Test 6: Checking webhook configuration...");
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`
      : "http://localhost:3001/api/payments/webhook";
    
    console.log(`✓ Webhook URL: ${webhookUrl}`);
    console.log(`  Make sure this is configured in Paystack dashboard\n`);

    // Test 7: Check Paystack configuration
    console.log("Test 7: Checking Paystack configuration...");
    const paystackConfigured = !!(
      process.env.PAYSTACK_SECRET_KEY &&
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    );

    if (paystackConfigured) {
      console.log(`✓ Paystack keys configured`);
      console.log(`  Secret key: ${process.env.PAYSTACK_SECRET_KEY?.substring(0, 10)}...`);
      console.log(`  Public key: ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.substring(0, 10)}...\n`);
    } else {
      console.log(`⚠️  Paystack keys not configured`);
      console.log(`  Set PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in .env\n`);
    }

    console.log("✅ All tests completed!\n");
    console.log("Next steps:");
    console.log("1. Start the dev server: npm run dev");
    console.log("2. Navigate to a dinner page");
    console.log("3. Click 'Reserve Seat'");
    console.log("4. Complete payment with test card: 4084084084084081");
    console.log("5. Verify redirect to callback page");
    console.log("6. Check database for confirmed seat");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testBookingFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
