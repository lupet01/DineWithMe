import { PrismaClient } from "../node_modules/.prisma/client/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Get platform admin email from environment
  const platformAdminEmail = process.env.PLATFORM_ADMIN_EMAIL;

  if (!platformAdminEmail) {
    console.warn("⚠️  PLATFORM_ADMIN_EMAIL not set. Skipping admin creation.");
    console.log("   Set PLATFORM_ADMIN_EMAIL in .env to create a platform admin.");
    return;
  }

  console.log(`📧 Platform admin email: ${platformAdminEmail}`);

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: platformAdminEmail },
  });

  if (existingAdmin) {
    console.log("✅ Platform admin already exists:");
    console.log(`   ID: ${existingAdmin.id}`);
    console.log(`   Email: ${existingAdmin.email}`);
    console.log(`   Role: ${existingAdmin.role}`);

    // Update role if not PLATFORM_ADMIN
    if (existingAdmin.role !== "PLATFORM_ADMIN") {
      console.log("🔄 Updating role to PLATFORM_ADMIN...");
      const updated = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: "PLATFORM_ADMIN" },
      });
      console.log("✅ Role updated successfully!");
      console.log(`   New role: ${updated.role}`);
    }
  } else {
    console.log("⚠️  User not found in database.");
    console.log("   The user must sign in at least once before being promoted to admin.");
    console.log("   Steps:");
    console.log("   1. Sign in to the app with this email");
    console.log("   2. Run this seed script again");
  }

  console.log("\n✨ Seed completed!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
