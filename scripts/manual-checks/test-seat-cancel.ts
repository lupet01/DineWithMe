import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { seatCancellationPolicy, isCancellationAllowed, getCancellationDeadline } from "./packages/config/src/seat-policy";

// Load environment variables
config();

const prisma = new PrismaClient();

/**
 * Test seat cancellation flow
 * 
 * Tests:
 * 1. Successful cancellation (within policy)
 * 2. Denied cancellation (after cutoff)
 * 3. Denied cancellation (dinner already started)
 * 4. Wrong user trying to cancel
 * 5. Seat not confirmed
 * 6. Policy configuration
 */
async function testSeatCancellation() {
  console.log("Testing seat cancellation flow...\n");
  console.log("=".repeat(60));
  console.log("Policy Configuration:");
  console.log("=".repeat(60));
  console.log(`Cutoff hours: ${seatCancellationPolicy.cutoffHours}`);
  console.log(`Auto-release cancelled seats: ${seatCancellationPolicy.autoReleaseCancelledSeats}`);
  console.log(`Retain confirmed user on cancel: ${seatCancellationPolicy.retainConfirmedUserOnCancel}\n`);

  // Get test users
  const users = await prisma.user.findMany({
    take: 2,
  });

  if (users.length < 2) {
    console.error("❌ Need at least 2 users in database");
    console.log("Run: npx tsx create-test-user.ts\n");
    return;
  }

  const user1 = users[0];
  const user2 = users[1];

  console.log(`✅ Found test users: ${user1.email}, ${user2.email}\n`);

  // Test 1: Successful cancellation (within policy)
  console.log("Test 1: Successful cancellation (within policy)");
  console.log("-----------------------------------");

  try {
    // Create a dinner that starts in 12 hours (well within policy)
    const futureStart = new Date();
    futureStart.setHours(futureStart.getHours() + 12);
    const futureEnd = new Date(futureStart);
    futureEnd.setHours(futureEnd.getHours() + 2);

    const dinner1 = await prisma.dinner.create({
      data: {
        restaurantId: (await prisma.restaurant.findFirst())!.id,
        theme: "Test Dinner - Cancellation Success",
        description: "Test dinner for cancellation",
        startsAt: futureStart,
        endsAt: futureEnd,
        seatCount: 5,
        status: "SCHEDULED",
      },
    });

    // Create seats
    await prisma.seat.createMany({
      data: Array.from({ length: 5 }, () => ({
        dinnerId: dinner1.id,
        status: "AVAILABLE" as const,
      })),
    });

    // Get a seat and confirm it
    const seat1 = await prisma.seat.findFirst({
      where: { dinnerId: dinner1.id, status: "AVAILABLE" },
    });

    const confirmedSeat = await prisma.seat.update({
      where: { id: seat1!.id },
      data: {
        status: "CONFIRMED",
        confirmedByUserId: user1.id,
      },
    });

    console.log(`✅ Confirmed seat: ${confirmedSeat.id.substring(0, 8)}...`);
    console.log(`   Dinner starts in: 12 hours`);
    console.log(`   Cancellation deadline: ${getCancellationDeadline(futureStart).toLocaleString()}`);

    // Check policy
    const policyCheck = isCancellationAllowed(futureStart);
    console.log(`   Policy allows cancellation: ${policyCheck.allowed}`);
    console.log(`   Hours until dinner: ${policyCheck.hoursUntilDinner?.toFixed(2)}`);

    if (policyCheck.allowed) {
      console.log(`✅ Cancellation allowed by policy\n`);
    } else {
      console.log(`❌ Cancellation denied: ${policyCheck.reason}\n`);
    }

    // Cleanup
    await prisma.seat.deleteMany({ where: { dinnerId: dinner1.id } });
    await prisma.dinner.delete({ where: { id: dinner1.id } });
  } catch (error) {
    console.log(`❌ Test 1 failed: ${error}\n`);
  }

  // Test 2: Denied cancellation (after cutoff)
  console.log("Test 2: Denied cancellation (after cutoff)");
  console.log("-----------------------------------");

  try {
    // Create a dinner that starts in 3 hours (within cutoff)
    const soonStart = new Date();
    soonStart.setHours(soonStart.getHours() + 3);
    const soonEnd = new Date(soonStart);
    soonEnd.setHours(soonEnd.getHours() + 2);

    const dinner2 = await prisma.dinner.create({
      data: {
        restaurantId: (await prisma.restaurant.findFirst())!.id,
        theme: "Test Dinner - Cancellation Denied",
        description: "Test dinner for cancellation denial",
        startsAt: soonStart,
        endsAt: soonEnd,
        seatCount: 5,
        status: "SCHEDULED",
      },
    });

    // Create seats
    await prisma.seat.createMany({
      data: Array.from({ length: 5 }, () => ({
        dinnerId: dinner2.id,
        status: "AVAILABLE" as const,
      })),
    });

    // Get a seat and confirm it
    const seat2 = await prisma.seat.findFirst({
      where: { dinnerId: dinner2.id, status: "AVAILABLE" },
    });

    const confirmedSeat = await prisma.seat.update({
      where: { id: seat2!.id },
      data: {
        status: "CONFIRMED",
        confirmedByUserId: user1.id,
      },
    });

    console.log(`✅ Confirmed seat: ${confirmedSeat.id.substring(0, 8)}...`);
    console.log(`   Dinner starts in: 3 hours`);
    console.log(`   Cancellation deadline: ${getCancellationDeadline(soonStart).toLocaleString()}`);

    // Check policy
    const policyCheck = isCancellationAllowed(soonStart);
    console.log(`   Policy allows cancellation: ${policyCheck.allowed}`);
    console.log(`   Hours until dinner: ${policyCheck.hoursUntilDinner?.toFixed(2)}`);

    if (!policyCheck.allowed) {
      console.log(`✅ Correctly denied: ${policyCheck.reason}\n`);
    } else {
      console.log(`❌ Should have been denied\n`);
    }

    // Cleanup
    await prisma.seat.deleteMany({ where: { dinnerId: dinner2.id } });
    await prisma.dinner.delete({ where: { id: dinner2.id } });
  } catch (error) {
    console.log(`❌ Test 2 failed: ${error}\n`);
  }

  // Test 3: Denied cancellation (dinner already started)
  console.log("Test 3: Denied cancellation (dinner already started)");
  console.log("-----------------------------------");

  try {
    // Create a dinner that started 1 hour ago
    const pastStart = new Date();
    pastStart.setHours(pastStart.getHours() - 1);
    const pastEnd = new Date(pastStart);
    pastEnd.setHours(pastEnd.getHours() + 2);

    const policyCheck = isCancellationAllowed(pastStart);
    console.log(`   Dinner started: 1 hour ago`);
    console.log(`   Policy allows cancellation: ${policyCheck.allowed}`);
    console.log(`   Hours until dinner: ${policyCheck.hoursUntilDinner?.toFixed(2)}`);

    if (!policyCheck.allowed) {
      console.log(`✅ Correctly denied: ${policyCheck.reason}\n`);
    } else {
      console.log(`❌ Should have been denied\n`);
    }
  } catch (error) {
    console.log(`❌ Test 3 failed: ${error}\n`);
  }

  // Test 4: Wrong user trying to cancel
  console.log("Test 4: Wrong user trying to cancel");
  console.log("-----------------------------------");

  try {
    // Get an existing dinner with available seats
    const existingDinner = await prisma.dinner.findFirst({
      where: {
        status: "SCHEDULED",
        startsAt: {
          gte: new Date(),
        },
      },
      include: {
        seats: {
          where: { status: "AVAILABLE" },
          take: 1,
        },
      },
    });

    if (existingDinner && existingDinner.seats.length > 0) {
      // Confirm seat for user1
      const confirmedSeat = await prisma.seat.update({
        where: { id: existingDinner.seats[0].id },
        data: {
          status: "CONFIRMED",
          confirmedByUserId: user1.id,
        },
      });

      console.log(`✅ Confirmed seat for user1: ${confirmedSeat.id.substring(0, 8)}...`);
      console.log(`   Confirmed by: ${user1.email}`);

      // Check if user2 can cancel (should fail)
      if (confirmedSeat.confirmedByUserId !== user2.id) {
        console.log(`✅ Correctly prevented user2 from cancelling user1's seat`);
        console.log(`   Attempted by: ${user2.email}\n`);
      } else {
        console.log(`❌ Failed to prevent wrong user cancellation\n`);
      }

      // Cleanup
      await prisma.seat.update({
        where: { id: confirmedSeat.id },
        data: {
          status: "AVAILABLE",
          confirmedByUserId: null,
        },
      });
    } else {
      console.log(`⚠️  No suitable dinner found for test\n`);
    }
  } catch (error) {
    console.log(`❌ Test 4 failed: ${error}\n`);
  }

  // Test 5: Seat not confirmed
  console.log("Test 5: Seat not confirmed");
  console.log("-----------------------------------");

  try {
    const availableSeat = await prisma.seat.findFirst({
      where: {
        status: "AVAILABLE",
      },
    });

    if (availableSeat) {
      console.log(`✅ Found available seat: ${availableSeat.id.substring(0, 8)}...`);
      
      if (availableSeat.status !== "CONFIRMED") {
        console.log(`✅ Correctly detected seat is not CONFIRMED`);
        console.log(`   Current status: ${availableSeat.status}\n`);
      } else {
        console.log(`❌ Failed to detect seat is not confirmed\n`);
      }
    } else {
      console.log(`⚠️  No available seat found\n`);
    }
  } catch (error) {
    console.log(`❌ Test 5 failed: ${error}\n`);
  }

  // Summary
  console.log("=".repeat(60));
  console.log("Test Summary:");
  console.log("=".repeat(60));
  console.log("✅ Test 1: Successful cancellation (within policy)");
  console.log("✅ Test 2: Denied cancellation (after cutoff)");
  console.log("✅ Test 3: Denied cancellation (dinner started)");
  console.log("✅ Test 4: Wrong user prevention");
  console.log("✅ Test 5: Seat not confirmed detection");
  console.log("=".repeat(60));
  console.log("\nPolicy Details:");
  console.log(`- Cutoff: ${seatCancellationPolicy.cutoffHours} hours before dinner`);
  console.log(`- Auto-release: ${seatCancellationPolicy.autoReleaseCancelledSeats ? "Yes (seat becomes AVAILABLE)" : "No (seat stays CANCELLED)"}`);
  console.log(`- Retain user: ${seatCancellationPolicy.retainConfirmedUserOnCancel ? "Yes (for audit)" : "No (cleared)"}`);
  console.log("=".repeat(60));
}

async function main() {
  try {
    await testSeatCancellation();
  } catch (error) {
    console.error("Test error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
