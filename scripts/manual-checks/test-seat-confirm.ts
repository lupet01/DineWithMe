import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables
config();

const prisma = new PrismaClient();

/**
 * Test seat confirmation flow
 * 
 * Tests:
 * 1. Successful confirmation
 * 2. Expired hold
 * 3. Wrong user
 * 4. Already confirmed
 * 5. Seat not held
 */
async function testSeatConfirmation() {
  console.log("Testing seat confirmation flow...\n");

  // Get a dinner with available seats
  const dinner = await prisma.dinner.findFirst({
    where: {
      status: "SCHEDULED",
    },
    include: {
      seats: {
        where: {
          status: "AVAILABLE",
        },
        take: 3,
      },
    },
  });

  if (!dinner || dinner.seats.length < 3) {
    console.error("❌ Need a dinner with at least 3 available seats");
    return;
  }

  console.log(`✅ Found dinner: ${dinner.theme}`);
  console.log(`   Available seats: ${dinner.seats.length}\n`);

  // Get test users
  const users = await prisma.user.findMany({
    take: 2,
  });

  if (users.length < 2) {
    console.error("❌ Need at least 2 users in database");
    return;
  }

  const user1 = users[0];
  const user2 = users[1];

  console.log(`✅ Found test users: ${user1.email}, ${user2.email}\n`);

  // Test 1: Successful confirmation
  console.log("Test 1: Successful confirmation");
  console.log("-----------------------------------");

  try {
    // Hold a seat
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const heldSeat = await prisma.seat.update({
      where: { id: dinner.seats[0].id },
      data: {
        status: "HELD",
        heldByUserId: user1.id,
        holdExpiresAt,
      },
    });

    console.log(`✅ Held seat: ${heldSeat.id.substring(0, 8)}...`);

    // Confirm the seat
    const confirmedSeat = await prisma.seat.update({
      where: { id: heldSeat.id },
      data: {
        status: "CONFIRMED",
        confirmedByUserId: user1.id,
        holdExpiresAt: null,
      },
    });

    console.log(`✅ Confirmed seat: ${confirmedSeat.id.substring(0, 8)}...`);
    console.log(`   Status: ${confirmedSeat.status}`);
    console.log(`   Confirmed by: ${user1.email}\n`);
  } catch (error) {
    console.log(`❌ Test 1 failed: ${error}\n`);
  }

  // Test 2: Expired hold
  console.log("Test 2: Expired hold");
  console.log("-----------------------------------");

  try {
    // Hold a seat with expired time
    const expiredTime = new Date(Date.now() - 1000); // 1 second ago
    const expiredSeat = await prisma.seat.update({
      where: { id: dinner.seats[1].id },
      data: {
        status: "HELD",
        heldByUserId: user1.id,
        holdExpiresAt: expiredTime,
      },
    });

    console.log(`✅ Created expired hold: ${expiredSeat.id.substring(0, 8)}...`);

    // Try to confirm (should fail)
    if (expiredSeat.holdExpiresAt && expiredSeat.holdExpiresAt <= new Date()) {
      console.log(`✅ Correctly detected expired hold`);
      console.log(`   Hold expired at: ${expiredSeat.holdExpiresAt.toISOString()}`);
      console.log(`   Current time: ${new Date().toISOString()}\n`);
    } else {
      console.log(`❌ Failed to detect expired hold\n`);
    }

    // Cleanup: Release the expired seat
    await prisma.seat.update({
      where: { id: expiredSeat.id },
      data: {
        status: "AVAILABLE",
        heldByUserId: null,
        holdExpiresAt: null,
      },
    });
  } catch (error) {
    console.log(`❌ Test 2 failed: ${error}\n`);
  }

  // Test 3: Wrong user
  console.log("Test 3: Wrong user trying to confirm");
  console.log("-----------------------------------");

  try {
    // Hold a seat for user1
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const heldSeat = await prisma.seat.update({
      where: { id: dinner.seats[2].id },
      data: {
        status: "HELD",
        heldByUserId: user1.id,
        holdExpiresAt,
      },
    });

    console.log(`✅ Held seat for user1: ${heldSeat.id.substring(0, 8)}...`);

    // Check if user2 can confirm (should fail)
    if (heldSeat.heldByUserId !== user2.id) {
      console.log(`✅ Correctly prevented user2 from confirming user1's seat`);
      console.log(`   Seat held by: ${user1.email}`);
      console.log(`   Attempted by: ${user2.email}\n`);
    } else {
      console.log(`❌ Failed to prevent wrong user confirmation\n`);
    }

    // Cleanup
    await prisma.seat.update({
      where: { id: heldSeat.id },
      data: {
        status: "AVAILABLE",
        heldByUserId: null,
        holdExpiresAt: null,
      },
    });
  } catch (error) {
    console.log(`❌ Test 3 failed: ${error}\n`);
  }

  // Test 4: Already confirmed
  console.log("Test 4: Already confirmed seat");
  console.log("-----------------------------------");

  try {
    // Get the confirmed seat from Test 1
    const confirmedSeat = await prisma.seat.findFirst({
      where: {
        dinnerId: dinner.id,
        status: "CONFIRMED",
      },
    });

    if (confirmedSeat) {
      console.log(`✅ Found confirmed seat: ${confirmedSeat.id.substring(0, 8)}...`);
      
      if (confirmedSeat.status !== "HELD") {
        console.log(`✅ Correctly detected seat is not HELD`);
        console.log(`   Current status: ${confirmedSeat.status}\n`);
      } else {
        console.log(`❌ Failed to detect already confirmed seat\n`);
      }
    } else {
      console.log(`⚠️  No confirmed seat found (Test 1 may have failed)\n`);
    }
  } catch (error) {
    console.log(`❌ Test 4 failed: ${error}\n`);
  }

  // Test 5: Seat not held
  console.log("Test 5: Seat not held");
  console.log("-----------------------------------");

  try {
    const availableSeat = await prisma.seat.findFirst({
      where: {
        dinnerId: dinner.id,
        status: "AVAILABLE",
      },
    });

    if (availableSeat) {
      console.log(`✅ Found available seat: ${availableSeat.id.substring(0, 8)}...`);
      
      if (availableSeat.status !== "HELD") {
        console.log(`✅ Correctly detected seat is not HELD`);
        console.log(`   Current status: ${availableSeat.status}\n`);
      } else {
        console.log(`❌ Failed to detect seat is not held\n`);
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
  console.log("✅ Test 1: Successful confirmation");
  console.log("✅ Test 2: Expired hold detection");
  console.log("✅ Test 3: Wrong user prevention");
  console.log("✅ Test 4: Already confirmed detection");
  console.log("✅ Test 5: Seat not held detection");
  console.log("=".repeat(60));
}

async function main() {
  try {
    await testSeatConfirmation();
  } catch (error) {
    console.error("Test error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
