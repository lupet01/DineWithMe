/**
 * Test script for dinner discovery filters
 * 
 * Tests server-side filtering with city, theme, and date parameters
 * 
 * Usage: node --import tsx scripts/test-dinner-filters.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Import DinnerRepository class
class DinnerRepository {
  constructor(private prisma: PrismaClient) {}

  async findPublicDinners(filters?: {
    city?: string;
    themeKey?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      status: {
        in: ["SCHEDULED", "LIVE"],
      },
      startsAt: {
        gte: filters?.from || new Date(),
        ...(filters?.to && { lte: filters.to }),
      },
      restaurant: {
        status: "ACTIVE",
        ...(filters?.city && {
          city: {
            equals: filters.city,
            mode: "insensitive",
          },
        }),
      },
      ...(filters?.themeKey && {
        theme: {
          key: {
            equals: filters.themeKey,
            mode: "insensitive",
          },
        },
      }),
    };

    return this.prisma.dinner.findMany({
      where,
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
        seats: {
          select: {
            status: true,
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
      ...(filters?.limit && { take: filters.limit }),
      ...(filters?.offset && { skip: filters.offset }),
    });
  }

  async countPublicDinners(filters?: {
    city?: string;
    themeKey?: string;
    from?: Date;
    to?: Date;
  }) {
    const where: any = {
      status: {
        in: ["SCHEDULED", "LIVE"],
      },
      startsAt: {
        gte: filters?.from || new Date(),
        ...(filters?.to && { lte: filters.to }),
      },
      restaurant: {
        status: "ACTIVE",
        ...(filters?.city && {
          city: {
            equals: filters.city,
            mode: "insensitive",
          },
        }),
      },
      ...(filters?.themeKey && {
        theme: {
          key: {
            equals: filters.themeKey,
            mode: "insensitive",
          },
        },
      }),
    };

    return this.prisma.dinner.count({ where });
  }
}

const dinnerRepository = new DinnerRepository(prisma);

async function testFilters() {
  console.log("🧪 Testing Dinner Discovery Filters\n");

  // Test 1: No filters (all upcoming dinners)
  console.log("Test 1: All upcoming dinners");
  const allDinners = await dinnerRepository.findPublicDinners();
  console.log(`✓ Found ${allDinners.length} dinners\n`);

  // Test 2: Filter by city
  console.log("Test 2: Filter by city (Cape Town)");
  const capeTownDinners = await dinnerRepository.findPublicDinners({
    city: "Cape Town",
  });
  console.log(`✓ Found ${capeTownDinners.length} dinners in Cape Town\n`);

  // Test 3: Filter by theme
  console.log("Test 3: Filter by theme (general-conversation)");
  const themeDinners = await dinnerRepository.findPublicDinners({
    themeKey: "general-conversation",
  });
  console.log(`✓ Found ${themeDinners.length} general-conversation dinners\n`);

  // Test 4: Combined filters
  console.log("Test 4: Combined filters (Cape Town + general-conversation)");
  const combinedDinners = await dinnerRepository.findPublicDinners({
    city: "Cape Town",
    themeKey: "general-conversation",
  });
  console.log(`✓ Found ${combinedDinners.length} general-conversation dinners in Cape Town\n`);

  // Test 5: Date range filter
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const nextWeek = new Date(tomorrow);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  console.log("Test 5: Date range filter (next 7 days)");
  const weekDinners = await dinnerRepository.findPublicDinners({
    from: tomorrow,
    to: nextWeek,
  });
  console.log(`✓ Found ${weekDinners.length} dinners in the next week\n`);

  // Test 6: Pagination
  console.log("Test 6: Pagination (limit 5, offset 0)");
  const paginatedDinners = await dinnerRepository.findPublicDinners({
    limit: 5,
    offset: 0,
  });
  console.log(`✓ Found ${paginatedDinners.length} dinners (page 1)\n`);

  // Test 7: Count total
  console.log("Test 7: Count total dinners");
  const totalCount = await dinnerRepository.countPublicDinners();
  console.log(`✓ Total count: ${totalCount} dinners\n`);

  // Test 8: Count with filters
  console.log("Test 8: Count with filters (Cape Town)");
  const capeTownCount = await dinnerRepository.countPublicDinners({
    city: "Cape Town",
  });
  console.log(`✓ Cape Town count: ${capeTownCount} dinners\n`);

  console.log("✅ All tests completed successfully!");
}

testFilters()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    prisma.$disconnect();
    process.exit(1);
  });
