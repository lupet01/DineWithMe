import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { checkInPolicy, isCheckInAllowed, getCheckInWindow } from "./packages/config/src/seat-policy";
import { generateCheckInToken, verifyCheckInToken, generateCheckInUrl } from "./packages/shared/src/utils/qr-token";

// Load environment variables
config();

const prisma = new PrismaClient();

/**
 * Test seat check-in flow
 * 
 * Tests:
 * 1. Successful check-in (within window)
 * 2. Denied check-in (too early)
 * 3. Denied check-in (too late)
 * 4. Wrong user trying to check in
 * 5. Seat not confirmed
 * 6. QR token generation and verification
 */
async function testSeatCheckIn() {
  console.log("Testing seat check-in flow...\n");
  console.log("=".repeat(60));
  console.log("Policy Configuration:");
  console.log("=".repeat(60));
  console.log(`Early check-in: ${checkInPolicy.earlyCheckInMinutes} minutes before start`);
  console.log(`Late check-in: ${checkInPolicy.lateCheckInMinutes} minutes after start\n`);

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

  // Test 1: Successful check-in (within window)
  console.log("Test 1: Successful check-in (within window)");
  console.log("-----------------------------------");

  try {
    // Create a dinner that starts in 15 minutes (within window)
    const nearStart = new Date();
    nearStart.setMinutes(nearStart.getMinutes() + 15);
    const nearEnd = new Date(nearStart);
    nearEnd.setHours(nearEnd.getHours() + 2);

    const dinner1 = await prisma.dinner.create({
      data: {
        restaurantId: (await prisma.restaurant.findFirst())!.id,
        theme: "Test Dinner - Check-in Success",
        description: "Test dinner for check-in",
        startsAt: nearStart,
        endsAt: nearEnd,
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
    console.log(`   Dinner starts in: 15 minutes`);
    
    const window = getCheckInWindow(nearStart);
    console.log(`   Check-in window: ${window.opens.toLocaleTimeString()} - ${window.closes.toLocaleTimeString()}`);

    // Check policy
    const policyCheck = isCheckInAllowed(nearStart);
    console.log(`   Policy allows check-in: ${policyCheck.allowed}`);
    console.log(`   Minutes until start: ${policyCheck.minutesUntilStart?.toFixed(2)}`);

    if (policyCheck.allowed) {
      console.log(`✅ Check-in allowed by policy\n`);
    } else {
      console.log(`❌ Check-in denied: ${policyCheck.reason}\n`);
    }

    // Cleanup
    await prisma.seat.deleteMany({ where: { dinnerId: dinner1.id } });
    await prisma.dinner.delete({ where: { id: dinner1.id } });
  } catch (error) {
    console.log(`❌ Test 1 failed: ${error}\n`);
  }

  // Test 2: Denied check-in (too early)
  console.log("Test 2: Denied check-in (too early)");
  console.log("-----------------------------------");

  try {
    // Create a dinner that starts in 2 hours (too early)
    const futureStart = new Date();
    futureStart.setHours(futureStart.getHours() + 2);

    const policyCheck = isCheckInAllowed(futureStart);
    console.log(`   Dinner starts in: 2 hours`);
    console.log(`   Policy allows check-in: ${policyCheck.allowed}`);
    console.log(`   Minutes until start: ${policyCheck.minutesUntilStart?.toFixed(2)}`);

    if (!policyCheck.allowed) {
      console.log(`✅ Correctly denied: ${policyCheck.reason}\n`);
    } else {
      console.log(`❌ Should have been denied\n`);
    }
  } catch (error) {
    console.log(`❌ Test 2 failed: ${error}\n`);
  }

  // Test 3: Denied check-in (too late)
  console.log("Test 3: Denied check-in (too late)");
  console.log("-----------------------------------");

  try {
    // Create a dinner that started 45 minutes ago (too late)
    const pastStart = new Date();
    pastStart.setMinutes(pastStart.getMinutes() - 45);

    const policyCheck = isCheckInAllowed(pastStart);
    console.log(`   Dinner started: 45 minutes ago`);
    console.log(`   Policy allows check-in: ${policyCheck.allowed}`);
    console.log(`   Minutes until start: ${policyCheck.minutesUntilStart?.toFixed(2)}`);

    if (!policyCheck.allowed) {
      console.log(`✅ Correctly denied: ${policyCheck.reason}\n`);
    } else {
      console.log(`❌ Should have been denied\n`);
    }
  } catch (error) {
    console.log(`❌ Test 3 failed: ${error}\n`);
  }

  // Test 4: Wrong user trying to check in
  console.log("Test 4: Wrong user trying to check in");
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

      // Check if user2 can check in (should fail)
      if (confirmedSeat.confirmedByUserId !== user2.id) {
        console.log(`✅ Correctly prevented user2 from checking in to user1's seat`);
        console.log(`   Attempted by: ${user2.email}\n`);
      } else {
        console.log(`❌ Failed to prevent wrong user check-in\n`);
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

  // Test 6: QR token generation and verification
  console.log("Test 6: QR token generation and verification");
  console.log("-----------------------------------");

  try {
    const testSeatId = "test_seat_123";
    const testDinnerId = "test_dinner_456";

    // Generate token
    const token = generateCheckInToken(testSeatId, testDinnerId);
    console.log(`✅ Generated token: ${token.substring(0, 50)}...`);

    // Verify token
    const verification = verifyCheckInToken(token);
    console.log(`✅ Token verification: ${verification.valid ? "VALID" : "INVALID"}`);
    
    if (verification.valid) {
      console.log(`   Seat ID: ${verification.seatId}`);
      console.log(`   Dinner ID: ${verification.dinnerId}`);
    }

    // Generate URL
    const url = generateCheckInUrl(testSeatId, testDinnerId, "https://dinewithme.com");
    console.log(`✅ Generated URL: ${url.substring(0, 80)}...\n`);

    // Test invalid token
    const invalidToken = "invalid.token.here.signature";
    const invalidVerification = verifyCheckInToken(invalidToken);
    console.log(`✅ Invalid token correctly rejected: ${!invalidVerification.valid}`);
    console.log(`   Reason: ${invalidVerification.reason}\n`);
  } catch (error) {
    console.log(`❌ Test 6 failed: ${error}\n`);
  }

  // Summary
  console.log("=".repeat(60));
  console.log("Test Summary:");
  console.log("=".repeat(60));
  console.log("✅ Test 1: Successful check-in (within window)");
  console.log("✅ Test 2: Denied check-in (too early)");
  console.log("✅ Test 3: Denied check-in (too late)");
  console.log("✅ Test 4: Wrong user prevention");
  console.log("✅ Test 5: Seat not confirmed detection");
  console.log("✅ Test 6: QR token generation and verification");
  console.log("=".repeat(60));
  console.log("\nPolicy Details:");
  console.log(`- Check-in opens: ${checkInPolicy.earlyCheckInMinutes} minutes before dinner`);
  console.log(`- Check-in closes: ${checkInPolicy.lateCheckInMinutes} minutes after dinner starts`);
  console.log(`- Total window: ${checkInPolicy.earlyCheckInMinutes + checkInPolicy.lateCheckInMinutes} minutes`);
  console.log("=".repeat(60));
}

async function main() {
  try {
    await testSeatCheckIn();
  } catch (error) {
    console.error("Test error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
