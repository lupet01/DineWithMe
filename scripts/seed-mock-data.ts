/**
 * Seed mock data — no email required
 * Creates restaurants, themes, dinners, and available seats
 *
 * Usage: npx tsx scripts/seed-mock-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding mock data...");

  // ── 1. Themes ─────────────────────────────────────────────────────────────
  const deepTalk = await prisma.theme.upsert({
    where: { key: "deep-talk" },
    update: {},
    create: {
      key: "deep-talk",
      title: "Deep Talk",
      shortDescription: "Real conversation, no small talk",
      whatToExpect:
        "A curated dinner for people who want genuine connection. Expect guided questions, honest stories, and conversations you'll still be thinking about the next day.",
      boundaries:
        "No phones during dinner. Respectful disagreement is welcome — hostility is not. What's shared at the table stays at the table.",
      conversationStarters: [
        "What's a belief you've recently changed your mind about?",
        "If you could have dinner with anyone from history, who and why?",
        "What's something you're working on that genuinely excites you?",
        "What's the best piece of advice you've ever received?",
        "What would you do differently if you could restart your career?",
      ],
      isActive: true,
    },
  });

  const techInnovators = await prisma.theme.upsert({
    where: { key: "tech-innovators" },
    update: {},
    create: {
      key: "tech-innovators",
      title: "Tech Innovators",
      shortDescription: "Technology, startups, and what's next",
      whatToExpect:
        "Dinner with builders, founders, and curious minds. Discuss the ideas shaping the future — from AI to climate tech to the next wave of the web.",
      boundaries:
        "Keep it constructive. No gatekeeping. Everyone at the table brings something worth hearing.",
      conversationStarters: [
        "What tech trend excites you most right now?",
        "What problem do you wish someone would just solve already?",
        "What's a startup you've seen fail that had a great idea?",
        "How do you think AI will change your industry in 5 years?",
        "What's the last thing you built that you're proud of?",
      ],
      isActive: true,
    },
  });

  const creativeMinds = await prisma.theme.upsert({
    where: { key: "creative-minds" },
    update: {},
    create: {
      key: "creative-minds",
      title: "Creative Minds",
      shortDescription: "Art, design, and the creative process",
      whatToExpect:
        "A dinner for designers, artists, writers, and anyone who makes things. Talk about process, inspiration, creative blocks, and the work that moves you.",
      boundaries:
        "All creative fields welcome. No hierarchy between disciplines. Be curious about what you don't know.",
      conversationStarters: [
        "What was the last thing that genuinely inspired you?",
        "How do you get unstuck when you hit a creative block?",
        "What's a piece of work (not your own) you wish you'd made?",
        "How has your creative process changed over the years?",
        "What does your ideal creative environment look like?",
      ],
      isActive: true,
    },
  });

  console.log("✅ Themes created");

  // ── 2. Restaurants ────────────────────────────────────────────────────────
  const restaurant1 = await prisma.restaurant.upsert({
    where: { id: "mock-restaurant-1" },
    update: {},
    create: {
      id: "mock-restaurant-1",
      name: "Osteria Francescana",
      description: "Modern Italian fine dining in the heart of the city.",
      cuisine: "Modern Italian",
      city: "Cape Town",
      address: "12 Buitenkant Street, Cape Town",
      phone: "+27 21 000 0001",
      website: "https://example.com",
      heroImageUrl:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      status: "ACTIVE",
    },
  });

  const restaurant2 = await prisma.restaurant.upsert({
    where: { id: "mock-restaurant-2" },
    update: {},
    create: {
      id: "mock-restaurant-2",
      name: "The Garden Bistro",
      description: "Farm-to-table dining with a relaxed atmosphere.",
      cuisine: "Contemporary",
      city: "Cape Town",
      address: "45 Long Street, Cape Town",
      phone: "+27 21 000 0002",
      website: "https://example.com",
      heroImageUrl:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
      status: "ACTIVE",
    },
  });

  const restaurant3 = await prisma.restaurant.upsert({
    where: { id: "mock-restaurant-3" },
    update: {},
    create: {
      id: "mock-restaurant-3",
      name: "Ember & Oak",
      description: "Wood-fired cooking, natural wines, and great company.",
      cuisine: "Modern African",
      city: "Cape Town",
      address: "8 De Waal Drive, Cape Town",
      phone: "+27 21 000 0003",
      website: "https://example.com",
      heroImageUrl:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
      status: "ACTIVE",
    },
  });

  console.log("✅ Restaurants created");

  // ── 3. Enable themes for restaurants ─────────────────────────────────────
  const themeRestaurantPairs = [
    { restaurantId: restaurant1.id, themeId: deepTalk.id },
    { restaurantId: restaurant1.id, themeId: techInnovators.id },
    { restaurantId: restaurant2.id, themeId: deepTalk.id },
    { restaurantId: restaurant2.id, themeId: creativeMinds.id },
    { restaurantId: restaurant3.id, themeId: creativeMinds.id },
    { restaurantId: restaurant3.id, themeId: techInnovators.id },
  ];

  for (const pair of themeRestaurantPairs) {
    await prisma.restaurantEnabledTheme.upsert({
      where: {
        restaurantId_themeId: pair,
      },
      update: {},
      create: pair,
    });
  }

  console.log("✅ Restaurant themes linked");

  // ── 4. Dinners (upcoming) ─────────────────────────────────────────────────
  const now = new Date();

  const dinnersData = [
    {
      id: "mock-dinner-1",
      restaurantId: restaurant1.id,
      themeId: deepTalk.id,
      startsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      endsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      seatCount: 8,
      status: "SCHEDULED" as const,
      description: "An evening of honest conversation and excellent food.",
    },
    {
      id: "mock-dinner-2",
      restaurantId: restaurant1.id,
      themeId: techInnovators.id,
      startsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
      endsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      seatCount: 6,
      status: "SCHEDULED" as const,
      description: "Builders and thinkers over a tasting menu.",
    },
    {
      id: "mock-dinner-3",
      restaurantId: restaurant2.id,
      themeId: creativeMinds.id,
      startsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
      endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      seatCount: 8,
      status: "SCHEDULED" as const,
      description: "For makers, creatives, and anyone who thinks visually.",
    },
    {
      id: "mock-dinner-4",
      restaurantId: restaurant2.id,
      themeId: deepTalk.id,
      startsAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days
      endsAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      seatCount: 6,
      status: "SCHEDULED" as const,
      description: null,
    },
    {
      id: "mock-dinner-5",
      restaurantId: restaurant3.id,
      themeId: techInnovators.id,
      startsAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
      endsAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      seatCount: 8,
      status: "SCHEDULED" as const,
      description: "Tech talk over wood-fired food.",
    },
  ];

  for (const dinner of dinnersData) {
    await prisma.dinner.upsert({
      where: { id: dinner.id },
      update: {
        startsAt: dinner.startsAt,
        endsAt: dinner.endsAt,
      },
      create: dinner,
    });
  }

  console.log("✅ Dinners created");

  // ── 5. Seats for each dinner ──────────────────────────────────────────────
  for (const dinner of dinnersData) {
    // Check if seats already exist
    const existingSeats = await prisma.seat.count({
      where: { dinnerId: dinner.id },
    });

    if (existingSeats === 0) {
      await prisma.seat.createMany({
        data: Array.from({ length: dinner.seatCount }, () => ({
          dinnerId: dinner.id,
          status: "AVAILABLE" as const,
        })),
      });
    }
  }

  console.log("✅ Seats created");

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalDinners = await prisma.dinner.count();
  const totalSeats = await prisma.seat.count({ where: { status: "AVAILABLE" } });

  console.log(`\n🎉 Done! ${totalDinners} dinners, ${totalSeats} available seats`);
  console.log("👉 Visit http://localhost:3001/discover to see them");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
