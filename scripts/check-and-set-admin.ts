/**
 * Check current users and optionally promote to PLATFORM_ADMIN
 * Usage: npx tsx scripts/check-and-set-admin.ts
 * Usage: npx tsx scripts/check-and-set-admin.ts your@email.com
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const targetEmail = process.argv[2];

  // Show all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, firstName: true, lastName: true },
    orderBy: { createdAt: "desc" },
  });

  console.log("\n📋 Current users in database:");
  console.log("─".repeat(60));
  if (users.length === 0) {
    console.log("  No users found. Sign in to the app first to create a user.");
  } else {
    users.forEach((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "(no name)";
      console.log(`  ${u.email}`);
      console.log(`    Role: ${u.role}  |  Name: ${name}  |  ID: ${u.id}`);
    });
  }
  console.log("─".repeat(60));

  // Promote if email provided
  if (targetEmail) {
    const user = users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
    if (!user) {
      console.error(`\n❌ User not found: ${targetEmail}`);
      console.log("   Make sure you've signed in to the app at least once first.");
      process.exit(1);
    }

    if (user.role === "PLATFORM_ADMIN") {
      console.log(`\n✅ ${targetEmail} is already PLATFORM_ADMIN`);
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "PLATFORM_ADMIN" },
      });
      console.log(`\n✅ Promoted ${targetEmail} to PLATFORM_ADMIN`);
      console.log("   Navigate to http://localhost:3001/admin to access the admin portal.");
    }
  } else {
    console.log("\n💡 To promote a user to PLATFORM_ADMIN:");
    console.log("   npx tsx scripts/check-and-set-admin.ts your@email.com\n");
    console.log("   To give yourself RESTAURANT_ADMIN access:");
    console.log("   npx tsx scripts/set-restaurant-admin.ts your@email.com\n");
  }
}

main()
  .catch((e) => { console.error("❌ Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
