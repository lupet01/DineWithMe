import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables
config();

const prisma = new PrismaClient();

async function main() {
  console.log("Setting up restaurant...");

  // Find the user by email (should exist after Clerk sync)
  const user = await prisma.user.findUnique({
    where: { email: "luupetros@gmail.com" },
  });

  if (!user) {
    console.error("❌ User not found. Please sign in first to sync your Clerk account.");
    console.log("After signing in, run this script again.");
    return;
  }

  console.log(`✅ Found user: ${user.email} (${user.role})`);

  // Check if user already has a restaurant
  const existingMembership = await prisma.restaurantMember.findFirst({
    where: { userId: user.id },
    include: { restaurant: true },
  });

  if (existingMembership) {
    console.log(`✅ User already has restaurant: ${existingMembership.restaurant.name}`);
    return;
  }

  // Create restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "The Cozy Kitchen",
      description: "A warm and inviting restaurant serving comfort food",
      cuisine: "American",
      city: "Cape Town",
      address: "123 Main Street",
      phone: "+27 21 123 4567",
      status: "ACTIVE",
    },
  });

  console.log(`✅ Created restaurant: ${restaurant.name} (${restaurant.status})`);

  // Add user as restaurant owner
  await prisma.restaurantMember.create({
    data: {
      restaurantId: restaurant.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  console.log(`✅ Added ${user.email} as OWNER of ${restaurant.name}`);
  console.log("\n✅ Setup complete! You can now run: npx tsx seed-dinners.ts");
}

main()
  .catch((e) => {
    console.error("Error setting up restaurant:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
