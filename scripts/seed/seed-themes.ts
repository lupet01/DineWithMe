/**
 * Seed script for default themes
 * Run this BEFORE applying the theme migration
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

async function main() {
  console.log("🌱 Seeding themes...");

  for (const theme of defaultThemes) {
    const existing = await prisma.theme.findUnique({
      where: { key: theme.key },
    });

    if (existing) {
      console.log(`✓ Theme "${theme.title}" already exists`);
      continue;
    }

    await prisma.theme.create({
      data: {
        ...theme,
        conversationStarters: theme.conversationStarters,
      },
    });

    console.log(`✓ Created theme: ${theme.title}`);
  }

  console.log("\n✅ Theme seeding complete!");
  console.log(`Created ${defaultThemes.length} themes`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding themes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
