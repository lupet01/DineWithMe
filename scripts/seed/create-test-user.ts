import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables
config();

const prisma = new PrismaClient();

async function createTestUser() {
  console.log("Creating test user...\n");

  try {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: "testuser@example.com",
        authProviderId: "test_user_" + Date.now(), // Unique ID
        firstName: "Test",
        lastName: "User",
        role: "DINER",
        status: "active",
      },
    });

    console.log("✅ Created test user:");
    console.log(`   Email: ${testUser.email}`);
    console.log(`   ID: ${testUser.id}`);
    console.log(`   Role: ${testUser.role}\n`);

    // Check total users
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);

  } catch (error) {
    console.error("❌ Error creating test user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
