/**
 * Seed Test Data for Booking Flow Testing
 * 
 * This script creates:
 * - Themes
 * - A test restaurant
 * - Multiple dinners (free and paid)
 * - Available seats
 * 
 * Usage: 
 *   npx tsx scripts/seed-test-data.ts
 * 
 * Or with a specific user email:
 *   npx tsx scripts/seed-test-data.ts user@example.com
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const themes = [
  {
    key: "tech-innovators",
    title: "Tech Innovators",
    shortDescription: "Technology, startups, and innovation",
    whatToExpect: "Discuss the latest in tech, share startup ideas, and connect with fellow technologists.",
    boundaries: "Keep discussions constructive and inclusive.",
    conversationStarters: [
      "What tech trend excites you most?",
      "Working on any interesting projects?",
      "Thoughts on AI and its impact?",
    ],
  },
  {
    key: "creative-minds",
    title: "Creative Minds",
    shortDescription: "Art, design, and creative pursuits",
    whatToExpect: "Share creative projects, discuss art and design, and find inspiration.",
    boundaries: "Respect all forms of creative expression.",
    conversationStarters: [
      "What creative projects are you working on?",
      "Who are your favorite artists?",
      "How do you find creative inspiration?",
    ],
  },
  {
    key: "entrepreneurs",
    title: "Entrepreneurs",
    shortDescription: "Business and entrepreneurship",
    whatToExpect: "Connect with fellow entrepreneurs and discuss business challenges.",
    boundaries: "No hard selling or pitching.",
    conversationStarters: [
      "What business are you building?",
      "Biggest challenge you're facing?",
      "Any recent wins to share?",
    ],
  },
];

async function seedThemes() {
  console.log("\n🎨 Seeding themes...");
  
  for (const theme of themes) {
    const existing = await prisma.theme.findUnique({
      where: { key: theme.key },
    });

    if (existing) {
      console.log(`  ✓ Theme "${theme.title}" already exists`);
      continue;
    }

    await prisma.theme.create({ data: theme });
    console.log(`  ✓ Created theme: ${theme.title}`);
  }
}

async function createTestRestaurant(ownerEmail?: string) {
  console.log("\n🏪 Creating test restaurant...");

  // Check if restaurant already exists
  const existing = await prisma.restaurant.findFirst({
    where: { name: "The Test Kitchen" },
  });

  if (existing) {
    console.log(`  ✓ Restaurant already exists: ${existing.name}`);
    return existing;
  }

  // Create restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "The Test Kitchen",
      description: "A test restaurant for booking flow testing",
      cuisine: "Contemporary Fusion",
      city: "Cape Town",
      address: "123 Test Street, Cape Town",
      latitude: -33.9249,
      longitude: 18.4241,
      phone: "+27 21 123 4567",
      status: "ACTIVE",
    },
  });

  console.log(`  ✓ Created restaurant: ${restaurant.name}`);

  // If owner email provided, add them as owner
  if (ownerEmail) {
    const user = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (user) {
      await prisma.restaurantMember.create({
        data: {
          restaurantId: restaurant.id,
          userId: user.id,
          role: "OWNER",
        },
      });
      console.log(`  ✓ Added ${ownerEmail} as OWNER`);

      // Update user role
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "RESTAURANT_ADMIN" },
      });
      console.log(`  ✓ Updated ${ownerEmail} to RESTAURANT_ADMIN`);
    }
  }

  return restaurant;
}

async function seedDinners(restaurantId: string) {
  console.log("\n🍽️  Seeding dinners...");

  const themes = await prisma.theme.findMany();
  const now = new Date();

  const dinners = [
    {
      restaurantId,
      themeId: themes[0]?.id,
      startsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
      endsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      description: "Tech Innovators Meetup - Discuss AI, startups, and innovation (R75 commitment)",
      seatCount: 8,
      status: "SCHEDULED" as const,
    },
    {
      restaurantId,
      themeId: themes[1]?.id,
      startsAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
      endsAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
      description: "Creative Minds Gathering - Share projects and find inspiration (R75 commitment)",
      seatCount: 6,
      status: "SCHEDULED" as const,
    },
    {
      restaurantId,
      themeId: themes[2]?.id,
      startsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
      endsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      description: "Entrepreneurs Networking - Connect with fellow founders (R75 commitment)",
      seatCount: 10,
      status: "SCHEDULED" as const,
    },
    {
      restaurantId,
      themeId: themes[0]?.id,
      startsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
      endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      description: "Casual Tech Chat - Relaxed evening with tech enthusiasts (R75 commitment)",
      seatCount: 12,
      status: "SCHEDULED" as const,
    },
    {
      restaurantId,
      themeId: themes[1]?.id,
      startsAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days
      endsAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      description: "Premium Creative Workshop - Intensive creative session (R75 commitment)",
      seatCount: 8,
      status: "SCHEDULED" as const,
    },
  ];

  for (const dinner of dinners) {
    // Check if dinner already exists
    const existing = await prisma.dinner.findFirst({
      where: {
        restaurantId: dinner.restaurantId,
        description: dinner.description,
      },
    });

    if (existing) {
      console.log(`  ✓ Dinner already exists: ${dinner.description.substring(0, 50)}...`);
      continue;
    }

    const created = await prisma.dinner.create({
      data: dinner,
    });

    // Create seats
    const seats = Array.from({ length: dinner.seatCount }, () => ({
      dinnerId: created.id,
      status: "AVAILABLE" as const,
    }));

    await prisma.seat.createMany({ data: seats });

    console.log(`  ✓ Created: ${dinner.description.substring(0, 60)}... (${dinner.seatCount} seats)`);
  }
}

async function main() {
  const userEmail = process.argv[2];

  console.log("🚀 Seeding test data for booking flow...\n");

  if (userEmail) {
    console.log(`📧 User email: ${userEmail}`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.log("⚠️  User not found in database.");
      console.log("   Please sign in to the app first, then run this script again.");
      console.log("\nContinuing with restaurant and dinner creation...\n");
    }
  } else {
    console.log("ℹ️  No user email provided. Restaurant will be created without an owner.");
    console.log("   To assign an owner, run: npx tsx scripts/seed-test-data.ts your@email.com\n");
  }

  try {
    // 1. Seed themes
    await seedThemes();

    // 2. Create test restaurant
    const restaurant = await createTestRestaurant(userEmail);

    // 3. Seed dinners
    await seedDinners(restaurant.id);

    console.log("\n✅ Test data seeded successfully!\n");
    console.log("📋 Summary:");
    console.log(`   • ${themes.length} themes`);
    console.log(`   • 1 restaurant: ${restaurant.name}`);
    console.log(`   • 5 dinners with R75 commitment fee each`);
    console.log(`   • Multiple available seats per dinner`);
    
    console.log("\n🧪 Test the booking flow:");
    console.log("   1. Visit http://localhost:3000/discover");
    console.log("   2. Click on a dinner");
    console.log("   3. Click 'Reserve Seat'");
    console.log("   4. Should redirect to Paystack payment page");
    console.log("   5. Complete payment (use test card: 4084084084084081)");
    console.log("   6. Should redirect back to confirmation page");
    
    if (userEmail) {
      console.log("\n👤 Admin access:");
      console.log("   • Visit http://localhost:3000/admin");
      console.log("   • Manage dinners at http://localhost:3000/admin/dinners");
    }

  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
