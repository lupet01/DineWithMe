"use server";

import { themeIcebreakerRepository } from "@dinewithme/db";

/**
 * Top 3 icebreaker questions for a theme, by usage - backs Booked Dinner
 * View's "Icebreaker Questions" card (§16.4/§16.24). Increments each
 * returned question's usageCount, since being shown to a confirmed guest
 * is the only real "usage" signal this app has - there's no separate
 * mark-as-used interaction, so a fresh fetch here is the event itself.
 */
export async function getIcebreakerQuestions(themeId: string): Promise<string[]> {
  const top = await themeIcebreakerRepository.findTopByUsage(themeId, 3);
  if (top.length === 0) {
    return [];
  }

  await themeIcebreakerRepository.incrementUsage(top.map((t) => t.id));

  return top.map((t) => t.text);
}
