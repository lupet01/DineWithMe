/**
 * Fix Discovery Page Issues
 * 
 * This script:
 * 1. Sets all restaurants to ACTIVE status
 * 2. Checks dinner data
 * 3. Verifies API response
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Fixing discovery page issues...\n");

  // 1. Fix restaurant status
  console.log("1️⃣  Checking restaurant status...");
  const restaurants = await prisma.restaurant.findMany();
  
  for (const restaurant of restaurants) {
    if (restaurant.status !== "ACTIVE") {
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { status: "ACTIVE" },
      });
      console.log(`   ✅ Set ${restaurant.name} to ACTIVE`);
    } else {
      console.log(`   ✓ ${restaurant.name} is already ACTIVE`);
    }
  }

  // 2. Check dinners
  console.log("\n2️⃣  Checking dinners...");
  const dinners = await prisma.dinner.findMany({
    include: {
      restaurant: { select: { name: true, status: true } },
      theme: { select: { title: true } },
      _count: { select: { seats: true } },
    },
    where: {
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
  });

  console.log(`   Found ${dinners.length} upcoming dinners:`);
  for (const dinner of dinners) {
    console.log(`   • ${dinner.restaurant.name} - ${dinner.theme.title}`);
    console.log(`     Status: ${dinner.status}, Restaurant: ${dinner.restaurant.status}`);
    console.log(`     Date: ${dinner.startsAt.toLocaleDateString()}`);
    console.log(`     Seats: ${dinner._count.seats}`);
  }

  // 3. Test the query that the API uses
  console.log("\n3️⃣  Testing API query...");
  const publicDinners = await prisma.dinner.findMany({
    where: {
      status: { in: ["SCHEDULED", "LIVE"] },
      startsAt: { gte: new Date() },
      restaurant: { status: "ACTIVE" },
    },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          city: true,
          cuisine: true,
          heroImageUrl: true,
        },
      },
      theme: {
        select: {
          id: true,
          key: true,
          title: true,
          shortDescription: true,
        },
      },
      seats: { select: { status: true } },
      _count: { select: { seats: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  console.log(`   API would return ${publicDinners.length} dinners`);
  
  if (publicDinners.length === 0) {
    console.log("\n⚠️  No dinners found! Possible issues:");
    console.log("   • All dinners might be in the past");
    console.log("   • Dinner status might not be SCHEDULED or LIVE");
    console.log("   • Restaurant status might not be ACTIVE");
  } else {
    console.log("\n✅ Discovery should work now!");
    console.log("\nDinners that will show:");
    for (const dinner of publicDinners) {
      const available = dinner.seats.filter(s => s.status === "AVAILABLE").length;
      console.log(`   • ${dinner.restaurant.name} - ${dinner.theme.title}`);
      console.log(`     ${available}/${dinner._count.seats} seats available`);
    }
  }

  console.log("\n🎯 Next steps:");
  console.log("   1. Restart your dev server");
  console.log("   2. Visit http://localhost:3000/discover");
  console.log("   3. You should see the dinners listed");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
