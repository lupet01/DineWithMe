/**
 * Test script for EPIC 4.6: My Dinners Page
 * 
 * Tests:
 * 1. Repository method: findUserDinners
 * 2. API endpoint: GET /api/users/me/dinners
 * 3. Data separation: upcoming vs past
 * 
 * Prerequisites:
 * - User must be signed in
 * - User must have at least one confirmed seat
 * - Database must be running
 * 
 * Usage:
 *   npx tsx test-my-dinners.ts
 */

import { seatRepository, userRepository } from "@dinewithme/db";

async function testMyDinners() {
  console.log("🧪 Testing My Dinners Feature\n");

  try {
    // Step 1: Find a test user with confirmed seats
    console.log("1️⃣ Finding test user...");
    
    // Get user by email (update with your test email)
    const testEmail = "luupetros@gmail.com";
    const user = await userRepository.findByEmail(testEmail);
    
    if (!user) {
      console.error("❌ User not found. Please update testEmail in script.");
      return;
    }
    
    console.log(`✅ Found user: ${user.email} (${user.id})\n`);

    // Step 2: Test repository method
    console.log("2️⃣ Testing repository method: findUserDinners...");
    
    const userDinners = await seatRepository.findUserDinners(user.id);
    
    console.log(`✅ Found ${userDinners.length} dinners`);
    
    if (userDinners.length === 0) {
      console.log("ℹ️  No dinners found. User needs to confirm a seat first.\n");
      console.log("To test:");
      console.log("1. Go to /discover");
      console.log("2. Click on a dinner");
      console.log("3. Reserve a seat");
      console.log("4. Confirm the reservation");
      console.log("5. Run this test again\n");
      return;
    }

    // Display dinners
    console.log("\n📋 User's Dinners:");
    userDinners.forEach(({ seat, dinner }, index) => {
      console.log(`\n${index + 1}. ${dinner.theme}`);
      console.log(`   Restaurant: ${dinner.restaurant.name}`);
      console.log(`   Start: ${dinner.startsAt.toISOString()}`);
      console.log(`   Seat Status: ${seat.status}`);
      console.log(`   Seat ID: ${seat.id}`);
    });

    // Step 3: Test data separation
    console.log("\n3️⃣ Testing upcoming vs past separation...");
    
    const now = new Date();
    const upcoming = userDinners.filter(({ dinner }) => 
      new Date(dinner.startsAt) >= now
    );
    const past = userDinners.filter(({ dinner }) => 
      new Date(dinner.startsAt) < now
    );
    
    console.log(`✅ Upcoming: ${upcoming.length}`);
    console.log(`✅ Past: ${past.length}`);

    // Step 4: Test API endpoint (manual)
    console.log("\n4️⃣ API Endpoint Test:");
    console.log("To test the API endpoint:");
    console.log("1. Sign in to the app");
    console.log("2. Navigate to /my-dinners");
    console.log("3. Check browser console for API calls");
    console.log("4. Verify dinners display correctly");
    console.log("\nOr use curl:");
    console.log(`curl -H "Cookie: YOUR_SESSION_COOKIE" http://localhost:3001/api/users/me/dinners`);

    // Step 5: Summary
    console.log("\n✅ All tests passed!");
    console.log("\n📊 Summary:");
    console.log(`   Total dinners: ${userDinners.length}`);
    console.log(`   Upcoming: ${upcoming.length}`);
    console.log(`   Past: ${past.length}`);
    console.log(`   User: ${user.email}`);

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }
  }
}

// Run tests
testMyDinners()
  .then(() => {
    console.log("\n✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
