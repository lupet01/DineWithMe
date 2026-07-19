/**
 * Data migration script to convert existing Dinner.theme strings to themeId
 * Run this AFTER the schema migration but BEFORE starting the app
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Starting theme data migration...\n");

  // Get default theme for fallback
  const defaultTheme = await prisma.theme.findUnique({
    where: { key: "general-conversation" },
  });

  if (!defaultTheme) {
    throw new Error(
      "Default theme not found! Please run seed-themes.ts first."
    );
  }

  console.log(`Using default theme: ${defaultTheme.title} (${defaultTheme.id})`);

  // Get all dinners
  const dinners = await prisma.dinner.findMany({
    select: {
      id: true,
      theme: true,
    },
  });

  console.log(`\nFound ${dinners.length} dinners to migrate`);

  let migrated = 0;
  let skipped = 0;

  for (const dinner of dinners) {
    // Check if already has themeId (shouldn't happen but just in case)
    const current = await prisma.dinner.findUnique({
      where: { id: dinner.id },
      select: { themeId: true },
    });

    if (current?.themeId) {
      console.log(`⏭️  Dinner ${dinner.id} already has themeId, skipping`);
      skipped++;
      continue;
    }

    // Map old theme string to new theme key
    let themeKey = "general-conversation"; // default

    if (dinner.theme) {
      const themeString = dinner.theme.toLowerCase();
      
      if (themeString.includes("tech")) {
        themeKey = "tech-innovators";
      } else if (themeString.includes("creative") || themeString.includes("art")) {
        themeKey = "creative-minds";
      } else if (themeString.includes("entrepreneur") || themeString.includes("business")) {
        themeKey = "entrepreneurs";
      } else if (themeString.includes("wellness") || themeString.includes("health")) {
        themeKey = "wellness-lifestyle";
      }
    }

    // Find the theme
    const theme = await prisma.theme.findUnique({
      where: { key: themeKey },
    });

    if (!theme) {
      console.log(`⚠️  Theme "${themeKey}" not found, using default`);
      await prisma.dinner.update({
        where: { id: dinner.id },
        data: { themeId: defaultTheme.id },
      });
    } else {
      await prisma.dinner.update({
        where: { id: dinner.id },
        data: { themeId: theme.id },
      });
      console.log(
        `✓ Migrated dinner ${dinner.id}: "${dinner.theme}" → ${theme.title}`
      );
    }

    migrated++;
  }

  console.log("\n✅ Migration complete!");
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Skipped: ${skipped}`);

  // Enable all themes for all restaurants
  console.log("\n🔗 Enabling themes for restaurants...");
  
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true },
  });

  const themes = await prisma.theme.findMany({
    where: { isActive: true },
  });

  let enabledCount = 0;

  for (const restaurant of restaurants) {
    for (const theme of themes) {
      const existing = await prisma.restaurantEnabledTheme.findFirst({
        where: {
          restaurantId: restaurant.id,
          themeId: theme.id,
        },
      });

      if (!existing) {
        await prisma.restaurantEnabledTheme.create({
          data: {
            restaurantId: restaurant.id,
            themeId: theme.id,
          },
        });
        enabledCount++;
      }
    }
    console.log(`✓ Enabled ${themes.length} themes for ${restaurant.name}`);
  }

  console.log(`\n✅ Enabled ${enabledCount} theme-restaurant associations`);
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
