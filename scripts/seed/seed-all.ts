/**
 * Comprehensive seed script
 * Seeds themes, restaurants, dinners, and sets up admin users
 * 
 * Usage: npx tsx scripts/seed/seed-all.ts <your-email>
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultThemes = [
  {
    key: "general-conversation",
    title: "General Conversation",
    shortDescription: "Open discussion on various topics",
    whatToExpect:
      "A relaxed dinner where you can discuss anything from current events to personal interests. Perfect for meeting new people and having engaging conversations.",
    boundaries:
      "Please be respectful of different viewpoints. Avoid overly controversial topics that might make others uncomfortable.",
    conversationStarters: [
      "What brought you to this dinner?",
      "What's been the highlight of your week?",
      "Any interesting projects you're working on?",
      "What do you like to do in your free time?",
      "Any book or podcast recommendations?",
    ],
  },
  {
    key: "tech-innovators",
    title: "Tech Innovators",
    shortDescription: "Technology, startups, and innovation",
    whatToExpect:
      "Discuss the latest in tech, share startup ideas, and connect with fellow technologists. From AI to web3, all tech topics are welcome.",
    boundaries:
      "Keep discussions constructive and inclusive. Avoid gatekeeping or dismissing others' technical knowledge.",
    conversationStarters: [
      "What tech trend excites you most right now?",
      "Working on any interesting projects?",
      "Thoughts on AI and its impact on society?",
      "Favorite programming language and why?",
      "What's your take on the future of remote work?",
    ],
  },
  {
    key: "creative-minds",
    title: "Creative Minds",
    shortDescription: "Art, design, and creative pursuits",
    whatToExpect:
      "Share creative projects, discuss art and design, and find inspiration from fellow creatives. All forms of creativity are celebrated.",
    boundaries:
      "Respect all forms of creative expression. Constructive feedback is welcome, but keep it kind.",
    conversationStarters: [
      "What creative projects are you working on?",
      "Who are your favorite artists or designers?",
      "How do you find creative inspiration?",
      "What's your creative process like?",
      "Any creative challenges you're facing?",
    ],
  },
  {
    key: "entrepreneurs",
    title: "Entrepreneurs",
    shortDescription: "Business, startups, and entrepreneurship",
    whatToExpect:
      "Connect with fellow entrepreneurs, share business challenges, and discuss growth strategies. From side hustles to scaling startups.",
    boundaries:
      "No hard selling or pitching. Focus on genuine connections and shared learning.",
    conversationStarters: [
      "What business are you building?",
      "Biggest challenge you're facing right now?",
      "How did you get started as an entrepreneur?",
      "Any recent wins you'd like to share?",
      "What's your approach to work-life balance?",
    ],
  },
  {
    key: "wellness-lifestyle",
    title: "Wellness & Lifestyle",
    shortDescription: "Health, fitness, and mindful living",
    whatToExpect:
      "Discuss wellness practices, fitness routines, nutrition, and mindful living. Share tips and learn from others on their wellness journey.",
    boundaries:
      "Respect different approaches to health and wellness. No medical advice or diet shaming.",
    conversationStarters: [
      "What does wellness mean to you?",
      "Any fitness or health goals you're working on?",
      "Favorite ways to practice self-care?",
      "How do you manage stress?",
      "Any wellness practices that have changed your life?",
    ],
  },
];

async function seedThemes() {
  console.log("\n🌱 Seeding themes...");

  for (const theme of defaultThemes) {
    const existing = await prisma.theme.findUnique({
      where: { key: theme.key },
    });

    if (existing) {
      console.log(`  ✓ Theme "${theme.title}" already exists`);
      continue;
    }

    await prisma.theme.create({
      data: theme,
    });

    console.log(`  ✓ Created theme: ${theme.title}`);
  }

  console.log(`✅ Themes seeded (${defaultThemes.length} total)`);
}

async function setupRestaurant(userEmail: string) {
  console.log("\n🏪 Setting up restaurant...");

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error(`User with email ${userEmail} not found. Please sign in first.`);
  }

  console.log(`  ✓ Found user: ${user.email}`);

  // Check if user already has a restaurant
  const existingMembership = await prisma.restaurantMember.findFirst({
    where: { userId: user.id },
    include: { restaurant: true },
  });

  if (existingMembership) {
    console.log(`  ✓ Restaurant already exists: ${existingMembership.restaurant.name}`);
    return existingMembership.restaurant;
  }

  // Get a theme for the restaurant
  const theme = await prisma.theme.findFirst({
    where: { key: "general-conversation" },
  });

  // Create restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "The Gathering Table",
      description: "An intimate dining experience focused on meaningful connections and conversations",
      cuisine: "Contemporary Fusion",
      city: "Cape Town",
      address: "123 Bree Street, Cape Town City Centre",
      latitude: -33.9249,
      longitude: 18.4241,
      phone: "+27 21 123 4567",
      website: "https://thegatheringtable.co.za",
      status: "ACTIVE",
    },
  });

  console.log(`  ✓ Created restaurant: ${restaurant.name}`);

  // Add user as restaurant owner
  await prisma.restaurantMember.create({
    data: {
      restaurantId: restaurant.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  console.log(`  ✓ Added ${user.email} as OWNER`);

  return restaurant;
}

async function seedDinners(restaurantId: string) {
  console.log("\n🍽️  Seeding dinners...");

  // Get themes
  const themes = await prisma.theme.findMany();
  
  if (themes.length === 0) {
    console.log("  ⚠️  No themes found, skipping theme assignment");
  }

  const now = new Date();
  const dinners = [
    {
      restaurantId,
      themeId: themes[0]?.id,
      startsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      endsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      description: "Connect with fellow tech enthusiasts over a delicious meal. Discuss the latest trends in AI, startups, and innovation.",
      seatCount: 12,
      status: "SCHEDULED" as const,
    },
    {
      restaurantId,
      themeId: themes[1]?.id,
      startsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      endsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
      description: "An evening for artists, designers, and creative professionals to share ideas and inspiration.",
      seatCount: 8,
      status: "SCHEDULED" as const,
    },
    {
      restaurantId,
      themeId: themes[2]?.id,
      startsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      description: "Network with fellow entrepreneurs, share challenges, and celebrate wins over dinner.",
      seatCount: 10,
      status: "SCHEDULED" as const,
    },
    {
      restaurantId,
      themeId: themes[3]?.id,
      startsAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      endsAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      description: "A mindful dining experience focused on wellness, healthy living, and self-care practices.",
      seatCount: 8,
      status: "SCHEDULED" as const,
    },
    {
      restaurantId,
      themeId: themes[4]?.id,
      startsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      endsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      description: "No specific theme - just good food and great conversations with interesting people.",
      seatCount: 16,
      status: "SCHEDULED" as const,
    },
  ];

  for (const dinner of dinners) {
    const created = await prisma.dinner.create({
      data: dinner,
    });

    // Create seats for the dinner
    const seats = Array.from({ length: dinner.seatCount }, () => ({
      dinnerId: created.id,
      status: "AVAILABLE" as const,
    }));

    await prisma.seat.createMany({
      data: seats,
    });

    console.log(`  ✓ Created: ${created.description.substring(0, 50)}... (${dinner.seatCount} seats)`);
  }

  console.log(`✅ Dinners seeded (${dinners.length} total)`);
}

async function setupAdminAccess(userEmail: string) {
  console.log("\n👤 Setting up admin access...");

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error(`User with email ${userEmail} not found`);
  }

  // Update user role to RESTAURANT_ADMIN
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "RESTAURANT_ADMIN" },
  });

  console.log(`  ✓ Updated ${user.email} to RESTAURANT_ADMIN`);
  console.log(`  ✓ Can now access: /admin and /admin/restaurant`);

  return updated;
}

async function main() {
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error("❌ Please provide your email address");
    console.log("\nUsage: npx tsx scripts/seed/seed-all.ts <your-email>");
    console.log("Example: npx tsx scripts/seed/seed-all.ts user@example.com");
    process.exit(1);
  }

  console.log("🚀 Starting comprehensive seed...");
  console.log(`📧 User email: ${userEmail}`);

  try {
    // 1. Seed themes
    await seedThemes();

    // 2. Setup restaurant
    const restaurant = await setupRestaurant(userEmail);

    // 3. Seed dinners
    await seedDinners(restaurant.id);

    // 4. Setup admin access
    await setupAdminAccess(userEmail);

    console.log("\n✅ All done! Your database is seeded.");
    console.log("\n📋 Summary:");
    console.log(`   • ${defaultThemes.length} themes created`);
    console.log(`   • 1 restaurant created: ${restaurant.name}`);
    console.log(`   • 5 dinners created with seats`);
    console.log(`   • Admin access granted to ${userEmail}`);
    console.log("\n🎉 You can now:");
    console.log("   • Visit /discover to see dinners");
    console.log("   • Visit /admin to manage your restaurant");
    console.log("   • Visit /admin/dinners to manage dinners");
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
