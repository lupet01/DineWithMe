import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDiscoveryQuery() {
  console.log("🔍 Testing discovery query...\n");

  try {
    const dinners = await prisma.dinner.findMany({
      where: {
        status: {
          in: ["SCHEDULED", "LIVE"],
        },
        startsAt: {
          gte: new Date(),
        },
        restaurant: {
          status: "ACTIVE",
        },
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            city: true,
            cuisine: true,
            heroImageUrl: true,
            status: true,
          },
        },
        theme: {
          select: {
            id: true,
            key: true,
            title: true,
            shortDescription: true,
            whatToExpect: true,
            boundaries: true,
            conversationStarters: true,
          },
        },
        _count: {
          select: {
            seats: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    });
    
    console.log(`✅ Found ${dinners.length} dinners\n`);
    
    if (dinners.length === 0) {
      console.log("❌ No dinners found!");
      console.log("\nPossible issues:");
      console.log("1. No dinners with status SCHEDULED or LIVE");
      console.log("2. All dinners are in the past");
      console.log("3. Restaurants are not ACTIVE");
      await prisma.$disconnect();
      return;
    }

    dinners.forEach((dinner, index) => {
      console.log(`${index + 1}. ${dinner.restaurant.name} - ${dinner.theme?.title || "No theme"}`);
      console.log(`   Status: ${dinner.status}`);
      console.log(`   Date: ${dinner.startsAt.toISOString()}`);
      console.log(`   Restaurant Status: ${dinner.restaurant.status}`);
      console.log(`   Seats: ${dinner._count.seats}`);
      console.log(`   Theme has all fields: ${!!(dinner.theme?.whatToExpect && dinner.theme?.boundaries)}`);
      console.log("");
    });

    console.log("✅ Discovery query working correctly!");
    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error);
    await prisma.$disconnect();
  }
}

testDiscoveryQuery();
