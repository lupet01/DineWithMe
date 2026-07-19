/**
 * Test script for EPIC 2.1 Restaurant implementation
 * Run with: npx tsx test-restaurant-setup.ts
 */

import { restaurantRepository, userRepository } from "./packages/db/src";

async function testRestaurantSetup() {
  console.log("🧪 Testing Restaurant Setup...\n");

  try {
    // 1. Get or create a test user
    console.log("1️⃣ Finding test user...");
    const users = await userRepository.findMany();
    
    if (users.length === 0) {
      console.log("❌ No users found. Please create a user first.");
      return;
    }
    
    const testUser = users[0];
    console.log(`✅ Using user: ${testUser.email} (${testUser.id})\n`);

    // 2. Create a test restaurant
    console.log("2️⃣ Creating test restaurant...");
    const restaurant = await restaurantRepository.createWithOwner(
      {
        name: "Test Restaurant - EPIC 2.1",
        description: "A test restaurant for EPIC 2.1",
        cuisine: "International",
        city: "Cape Town",
        address: "123 Test Street",
        phone: "+27 21 123 4567",
      },
      testUser.id
    );
    console.log(`✅ Created restaurant: ${restaurant.name} (${restaurant.id})\n`);

    // 3. Verify ownership
    console.log("3️⃣ Verifying ownership...");
    const isOwner = await restaurantRepository.isUserOwner(
      restaurant.id,
      testUser.id
    );
    console.log(`✅ User is owner: ${isOwner}\n`);

    // 4. Get user's restaurants
    console.log("4️⃣ Getting user's restaurants...");
    const userRestaurants = await restaurantRepository.findManyForUser(
      testUser.id
    );
    console.log(`✅ User has ${userRestaurants.length} restaurant(s)\n`);

    // 5. Update restaurant
    console.log("5️⃣ Updating restaurant...");
    const updated = await restaurantRepository.update(restaurant.id, {
      description: "Updated description for testing",
      website: "https://test-restaurant.example.com",
    });
    console.log(`✅ Updated restaurant: ${updated.name}\n`);

    // 6. Get restaurant with members
    console.log("6️⃣ Getting restaurant with members...");
    const withMembers = await restaurantRepository.findByIdWithMembers(
      restaurant.id
    );
    console.log(`✅ Restaurant has ${withMembers?.members.length} member(s)\n`);

    // 7. Clean up (optional - comment out to keep test data)
    console.log("7️⃣ Cleaning up test data...");
    await restaurantRepository.delete(restaurant.id);
    console.log(`✅ Deleted test restaurant\n`);

    console.log("🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testRestaurantSetup();
