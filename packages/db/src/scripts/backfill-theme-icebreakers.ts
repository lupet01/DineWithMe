/**
 * One-time backfill: every existing Theme has live icebreaker text sitting
 * in its flat `conversationStarters` JSON array - this converts each array
 * entry into its own ThemeIcebreaker row, preserving the text and original
 * order via displayOrder. usageCount/avgRating start at zero/null rather
 * than being backfilled, since no historical per-starter usage data exists
 * anywhere to backfill from.
 *
 * Idempotent: safe to re-run - skips a theme entirely if it already has
 * any ThemeIcebreaker rows.
 *
 * Does NOT touch Theme.conversationStarters - this is additive only, any
 * read-path cutover (e.g. Booked Dinner View) is a separate change.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let themesProcessed = 0;
  let rowsCreated = 0;

  const themes = await prisma.theme.findMany({
    select: { id: true, title: true, conversationStarters: true },
  });

  for (const theme of themes) {
    const existingCount = await prisma.themeIcebreaker.count({ where: { themeId: theme.id } });
    if (existingCount > 0) continue;

    const starters = Array.isArray(theme.conversationStarters)
      ? (theme.conversationStarters as unknown[]).filter((s): s is string => typeof s === "string")
      : [];

    if (starters.length === 0) continue;

    await prisma.themeIcebreaker.createMany({
      data: starters.map((text, index) => ({
        themeId: theme.id,
        text,
        displayOrder: index,
      })),
    });

    themesProcessed++;
    rowsCreated += starters.length;
  }

  console.log(
    `Backfill complete: ${rowsCreated} ThemeIcebreaker rows created across ${themesProcessed} themes.`
  );
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
