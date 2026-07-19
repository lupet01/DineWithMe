import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables
config();

const prisma = new PrismaClient();

async function main() {
  console.log("Setting up database after reset...");

  // Create user
  const user = await prisma.user.upsert({
    where: { email: "luupetros@gmail.com" },
    update: {},
    create: {
      email: "luupetros@gmail.com",
      authProviderId: "user_2rXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with your actual Clerk ID
      firstName: "Petros",
      lastName: "Luu",
      role: "PLATFORM_ADMIN",
      status: "active",
    },
  });

  console.log(`✅ Created user: ${user.email} (${user.role})`);

  // Create restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { id: "temp-id-that-wont-exist" },
    update: {},
    create: {
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
  const membership = await prisma.restaurantMember.create({
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
    console.error("Error setting up database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
