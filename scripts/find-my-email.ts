/**
 * Helper script to find your email in the database
 * Run: npx tsx scripts/find-my-email.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Looking for users in database...\n");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (users.length === 0) {
    console.log("❌ No users found in database.");
    console.log("\n💡 This means you haven't signed in yet.");
    console.log("   1. Go to http://localhost:3001");
    console.log("   2. Sign in with Clerk");
    console.log("   3. Run this script again");
    return;
  }

  console.log(`✅ Found ${users.length} user(s):\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Name: ${user.firstName || "N/A"} ${user.lastName || ""}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    console.log("");
  });

  console.log("📋 To seed data, run:");
  console.log(`   npx tsx scripts/seed/seed-all.ts ${users[0].email}`);
  console.log("");
  console.log("🔑 To change role, run:");
  console.log(`   npx tsx scripts/set-user-role.ts ${users[0].email} RESTAURANT_ADMIN`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
