/**
 * Script to set a user's role
 * Usage: npx tsx scripts/set-user-role.ts <email> <role>
 * Example: npx tsx scripts/set-user-role.ts user@example.com RESTAURANT_ADMIN
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const validRoles = ["DINER", "RESTAURANT_ADMIN", "PLATFORM_ADMIN"];

async function setUserRole(email: string, role: string) {
  if (!validRoles.includes(role)) {
    console.error(`❌ Invalid role: ${role}`);
    console.error(`Valid roles: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: role as any },
    });

    console.log(`✅ Updated user role:`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Role: ${updated.role}`);
    console.log(`   ID: ${updated.id}`);
  } catch (error) {
    console.error("❌ Error updating user role:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
const role = process.argv[3];

if (!email || !role) {
  console.error("Usage: npx tsx scripts/set-user-role.ts <email> <role>");
  console.error(`Valid roles: ${validRoles.join(", ")}`);
  process.exit(1);
}

setUserRole(email, role);
