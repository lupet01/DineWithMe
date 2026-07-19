/**
 * Seed script for strategic MVP themes
 * Based on psychological safety, conversion friction, and marketplace liquidity
 * 
 * Run this to replace the initial themes with the strategic set
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const strategicThemes = [
  {
    key: "social",
    title: "Social Table",
    shortDescription: "Easy conversation, good energy, no pressure",
    whatToExpect:
      "Light, relaxed discussion with a mix of people open to meeting others. No agenda — just shared time and curiosity. This is your safe space to ease into social connection without any performance pressure.",
    boundaries:
      "Not a dating event. No aggressive selling or recruiting. Respect everyone's space and pace. Keep conversation light and inclusive.",
    conversationStarters: [
      "What's been the highlight of your week?",
      "What's something you've recently enjoyed in the city?",
      "Any interesting discoveries lately?",
      "What brought you here tonight?",
      "What do you like to do when you have free time?",
    ],
  },
  {
    key: "new-in-town",
    title: "New in Town",
    shortDescription: "For newcomers building their circle",
    whatToExpect:
      "Shared stories about moving, adapting, and discovering. Connect with people who understand what it's like to start fresh. City tips, honest experiences, and the relief of knowing you're not the only one figuring things out.",
    boundaries:
      "No exclusionary group behavior. Be welcoming and open. Respect different backgrounds and journeys. This is about integration, not cliques.",
    conversationStarters: [
      "What brought you here?",
      "What's been surprisingly hard about the move?",
      "What's one place you've discovered that you love?",
      "Where are you from originally?",
      "What do you miss most from home?",
    ],
  },
  {
    key: "professional-conversation",
    title: "Professional Conversation",
    shortDescription: "Curiosity-led career conversations — no pitching",
    whatToExpect:
      "Discussions about growth, work, ideas, and industries. Mixed backgrounds and honest career stories. This is about learning from each other's paths, not extracting value. Curiosity-first, not transactional.",
    boundaries:
      "No pitching. No recruiting. No extracting LinkedIn contacts without consent. Keep it human — this isn't a networking event, it's a conversation about work and growth.",
    conversationStarters: [
      "What's something you're learning at work lately?",
      "What's a lesson you wish you knew earlier in your career?",
      "What drew you to your current field?",
      "What's been your biggest professional challenge recently?",
      "If you could explore any other career path, what would it be?",
    ],
  },
  {
    key: "womens-table",
    title: "Women's Table",
    shortDescription: "A space for women to connect comfortably",
    whatToExpect:
      "Open, supportive conversation among women. Share experiences, insights, and stories in a relaxed and respectful environment. No judgment, no pressure — just genuine connection.",
    boundaries:
      "This table is reserved for women. No judgment or exclusion based on background, career, or life stage. Respect differences and create space for everyone to be heard.",
    conversationStarters: [
      "What's something that's shaped your journey recently?",
      "What's something you're proud of this year?",
      "What's been your biggest learning moment lately?",
      "How do you recharge when life gets overwhelming?",
      "What's one thing you wish more people understood about your experience?",
    ],
  },
];

async function main() {
  console.log("🌱 Seeding strategic MVP themes...\n");

  // Deactivate old themes
  const oldThemes = await prisma.theme.findMany({
    where: {
      key: {
        notIn: strategicThemes.map((t) => t.key),
      },
    },
  });

  if (oldThemes.length > 0) {
    console.log(`Deactivating ${oldThemes.length} old themes...`);
    await prisma.theme.updateMany({
      where: {
        key: {
          notIn: strategicThemes.map((t) => t.key),
        },
      },
      data: {
        isActive: false,
      },
    });
  }

  // Create or update strategic themes
  for (const theme of strategicThemes) {
    const existing = await prisma.theme.findUnique({
      where: { key: theme.key },
    });

    if (existing) {
      await prisma.theme.update({
        where: { key: theme.key },
        data: {
          ...theme,
          conversationStarters: theme.conversationStarters,
          isActive: true,
        },
      });
      console.log(`✓ Updated theme: ${theme.title}`);
    } else {
      await prisma.theme.create({
        data: {
          ...theme,
          conversationStarters: theme.conversationStarters,
          isActive: true,
        },
      });
      console.log(`✓ Created theme: ${theme.title}`);
    }
  }

  console.log("\n✅ Strategic theme seeding complete!");
  console.log(`\nActive themes:`);
  
  const activeThemes = await prisma.theme.findMany({
    where: { isActive: true },
    select: { key: true, title: true, shortDescription: true },
  });

  activeThemes.forEach((theme) => {
    console.log(`  • ${theme.title}: ${theme.shortDescription}`);
  });

  // Show theme rubric scores (conceptual)
  console.log("\n📊 Theme Rubric Scores (1-5):");
  console.log("  Social Table:");
  console.log("    Conversion: 5, Clarity: 5, Safety: 5, Script: 4, Repeatability: 4");
  console.log("  New in Town:");
  console.log("    Conversion: 5, Clarity: 5, Safety: 5, Script: 5, Repeatability: 5");
  console.log("  Professional Conversation:");
  console.log("    Conversion: 4, Clarity: 4, Safety: 4, Script: 5, Repeatability: 5");
  console.log("  Women's Table:");
  console.log("    Conversion: 5, Clarity: 5, Safety: 5, Script: 4, Repeatability: 5");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding strategic themes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
