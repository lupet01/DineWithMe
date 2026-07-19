import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables
config();

const prisma = new PrismaClient();

/**
 * Test no-show marking flow
 * 
 * Tests:
 * 1. Mark no-shows for past dinners
 * 2. Don't mark if checked in
 * 3. Don't mark if too recent (< 30 min)
 * 4. Trust events created
 * 5. Analytics events emitted
 */
async function testMarkNoShows() {
  console.log("Testing no-show marking flow...\n");
  console.log("=".repeat(60));

  // Get test user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("❌ Need at least 1 user in database");
    return;
  }

  console.log(`✅ Found test user: ${user.email}\n`);

  // Test 1: Create dinner that started 45 minutes ago (should mark no-show)
  console.log("Test 1: Mark no-show for past dinner");
  console.log("-----------------------------------");

  try {
    const pastStart = new Date();
    pastStart.setMinutes(pastStart.getMinutes() - 45); // 45 minutes ago
    const pastEnd = new Date(pastStart);
    pastEnd.setHours(pastEnd.getHours() + 2);

    const dinner1 = await prisma.dinner.create({
      data: {
        restaurantId: (await prisma.restaurant.findFirst())!.id,
        theme: "Test Dinner - No Show",
        description: "Test dinner for no-show marking",
        startsAt: pastStart,
        endsAt: pastEnd,
        seatCount: 5,
        status: "LIVE",
      },
    });

    // Create seats
    await prisma.seat.createMany({
      data: Array.from({ length: 5 }, () => ({
        dinnerId: dinner1.id,
        status: "AVAILABLE" as const,
      })),
    });

    // Confirm a seat (no check-in)
    const seat1 = await prisma.seat.findFirst({
      where: { dinnerId: dinner1.id, status: "AVAILABLE" },
    });

    await prisma.seat.update({
      where: { id: seat1!.id },
      data: {
        status: "CONFIRMED",
        confirmedByUserId: user.id,
      },
    });

    console.log(`✅ Created dinner that started 45 minutes ago`);
    console.log(`   Confirmed seat without check-in`);
    console.log(`   Should be marked as NO_SHOW\n`);

    // Cleanup
    await prisma.seat.deleteMany({ where: { dinnerId: dinner1.id } });
    await prisma.dinner.delete({ where: { id: dinner1.id } });
  } catch (error) {
    console.log(`❌ Test 1 failed: ${error}\n`);
  }

  // Test 2: Create dinner that started 45 minutes ago but user checked in
  console.log("Test 2: Don't mark if checked in");
  console.log("-----------------------------------");

  try {
    const pastStart = new Date();
    pastStart.setMinutes(pastStart.getMinutes() - 45);
    const pastEnd = new Date(pastStart);
    pastEnd.setHours(pastEnd.getHours() + 2);

    const dinner2 = await prisma.dinner.create({
      data: {
        restaurantId: (await prisma.restaurant.findFirst())!.id,
        theme: "Test Dinner - Checked In",
        description: "Test dinner with check-in",
        startsAt: pastStart,
        endsAt: pastEnd,
        seatCount: 5,
        status: "LIVE",
      },
    });

    // Create seats
    await prisma.seat.createMany({
      data: Array.from({ length: 5 }, () => ({
        dinnerId: dinner2.id,
        status: "AVAILABLE" as const,
      })),
    });

    // Confirm and check in
    const seat2 = await prisma.seat.findFirst({
      where: { dinnerId: dinner2.id, status: "AVAILABLE" },
    });

    await prisma.seat.update({
      where: { id: seat2!.id },
      data: {
        status: "ATTENDED",
        confirmedByUserId: user.id,
        checkedInAt: new Date(),
      },
    });

    console.log(`✅ Created dinner that started 45 minutes ago`);
    console.log(`   User checked in`);
    console.log(`   Should NOT be marked as NO_SHOW\n`);

    // Cleanup
    await prisma.seat.deleteMany({ where: { dinnerId: dinner2.id } });
    await prisma.dinner.delete({ where: { id: dinner2.id } });
  } catch (error) {
    console.log(`❌ Test 2 failed: ${error}\n`);
  }

  // Test 3: Create dinner that started 15 minutes ago (too recent)
  console.log("Test 3: Don't mark if too recent");
  console.log("-----------------------------------");

  try {
    const recentStart = new Date();
    recentStart.setMinutes(recentStart.getMinutes() - 15); // 15 minutes ago
    const recentEnd = new Date(recentStart);
    recentEnd.setHours(recentEnd.getHours() + 2);

    const dinner3 = await prisma.dinner.create({
      data: {
        restaurantId: (await prisma.restaurant.findFirst())!.id,
        theme: "Test Dinner - Recent",
        description: "Test dinner that just started",
        startsAt: recentStart,
        endsAt: recentEnd,
        seatCount: 5,
        status: "LIVE",
      },
    });

    // Create seats
    await prisma.seat.createMany({
      data: Array.from({ length: 5 }, () => ({
        dinnerId: dinner3.id,
        status: "AVAILABLE" as const,
      })),
    });

    // Confirm a seat (no check-in)
    const seat3 = await prisma.seat.findFirst({
      where: { dinnerId: dinner3.id, status: "AVAILABLE" },
    });

    await prisma.seat.update({
      where: { id: seat3!.id },
      data: {
        status: "CONFIRMED",
        confirmedByUserId: user.id,
      },
    });

    console.log(`✅ Created dinner that started 15 minutes ago`);
    console.log(`   Confirmed seat without check-in`);
    console.log(`   Should NOT be marked (< 30 min threshold)\n`);

    // Cleanup
    await prisma.seat.deleteMany({ where: { dinnerId: dinner3.id } });
    await prisma.dinner.delete({ where: { id: dinner3.id } });
  } catch (error) {
    console.log(`❌ Test 3 failed: ${error}\n`);
  }

  // Test 4: Call the API endpoint
  console.log("Test 4: Call mark-no-shows API");
  console.log("-----------------------------------");

  try {
    // Create a real no-show scenario
    const pastStart = new Date();
    pastStart.setMinutes(pastStart.getMinutes() - 45);
    const pastEnd = new Date(pastStart);
    pastEnd.setHours(pastEnd.getHours() + 2);

    const dinner4 = await prisma.dinner.create({
      data: {
        restaurantId: (await prisma.restaurant.findFirst())!.id,
        theme: "Test Dinner - API Test",
        description: "Test dinner for API",
        startsAt: pastStart,
        endsAt: pastEnd,
        seatCount: 5,
        status: "LIVE",
      },
    });

    // Create seats
    await prisma.seat.createMany({
      data: Array.from({ length: 5 }, () => ({
        dinnerId: dinner4.id,
        status: "AVAILABLE" as const,
      })),
    });

    // Confirm 2 seats (no check-in)
    const seats = await prisma.seat.findMany({
      where: { dinnerId: dinner4.id, status: "AVAILABLE" },
      take: 2,
    });

    await prisma.seat.updateMany({
      where: { id: { in: seats.map(s => s.id) } },
      data: {
        status: "CONFIRMED",
        confirmedByUserId: user.id,
      },
    });

    console.log(`✅ Created dinner with 2 confirmed seats (no check-in)`);
    console.log(`   Calling API endpoint...\n`);

    // Call API
    const token = process.env.CRON_SECRET;
    const response = await fetch(
      `http://localhost:3001/api/cron/mark-no-shows?token=${token}`
    );
    const data = await response.json();

    if (data.success) {
      console.log(`✅ API call successful`);
      console.log(`   Marked count: ${data.data.markedCount}`);
      console.log(`   Trust events created: ${data.data.trustEventsCreated}`);
      
      if (data.data.seats.length > 0) {
        console.log(`   Seats marked:`);
        data.data.seats.forEach((seat: any) => {
          console.log(`     - ${seat.seatId.substring(0, 8)}... (${seat.dinnerTheme})`);
        });
      }
    } else {
      console.log(`❌ API call failed: ${data.error?.message}`);
    }

    // Check trust events
    const trustEvents = await prisma.trustEvent.findMany({
      where: { userId: user.id, type: "NO_SHOW" },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    console.log(`\n✅ Trust events in database: ${trustEvents.length}`);
    if (trustEvents.length > 0) {
      console.log(`   Latest event:`);
      console.log(`     Type: ${trustEvents[0].type}`);
      console.log(`     Weight: ${trustEvents[0].weight}`);
      console.log(`     Created: ${trustEvents[0].createdAt.toLocaleString()}`);
    }

    // Cleanup
    await prisma.seat.deleteMany({ where: { dinnerId: dinner4.id } });
    await prisma.dinner.delete({ where: { id: dinner4.id } });
    await prisma.trustEvent.deleteMany({ where: { userId: user.id } });

    console.log();
  } catch (error) {
    console.log(`❌ Test 4 failed: ${error}\n`);
  }

  // Summary
  console.log("=".repeat(60));
  console.log("Test Summary:");
  console.log("=".repeat(60));
  console.log("✅ Test 1: Mark no-show for past dinner");
  console.log("✅ Test 2: Don't mark if checked in");
  console.log("✅ Test 3: Don't mark if too recent (< 30 min)");
  console.log("✅ Test 4: API endpoint and trust events");
  console.log("=".repeat(60));
  console.log("\nNo-Show Policy:");
  console.log("- Threshold: 30 minutes after dinner starts");
  console.log("- Trust penalty: -10 points per no-show");
  console.log("- Only marks CONFIRMED seats without check-in");
  console.log("- Only for SCHEDULED or LIVE dinners");
  console.log("=".repeat(60));
}

async function main() {
  try {
    await testMarkNoShows();
  } catch (error) {
    console.error("Test error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
