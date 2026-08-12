"use server";

import { auth } from "@clerk/nextjs/server";
import { actionFailure, type ActionResult, Role } from "@dinewithme/shared";
import { themeRepository, userRepository, themeIcebreakerRepository } from "@dinewithme/db";
import { revalidatePath } from "next/cache";


async function requirePlatformAdmin() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: "Unauthorized" as const };
  }
  const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
  if (!dbUser || dbUser.role !== Role.PLATFORM_ADMIN) {
    return { error: "Only platform admins can manage the theme library" as const };
  }
  return { dbUser };
}

export interface ThemeFormInput {
  key: string;
  title: string;
  shortDescription: string;
  whatToExpect: string;
  boundaries: string;
  conversationStarters: string[];
}

export async function createTheme(input: ThemeFormInput): Promise<ActionResult<{ id: string }>> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const theme = await themeRepository.create({
      key: input.key,
      title: input.title,
      shortDescription: input.shortDescription,
      whatToExpect: input.whatToExpect,
      boundaries: input.boundaries,
      conversationStarters: input.conversationStarters,
    });

    // Seed real ThemeIcebreaker rows from the same starters entered here -
    // Theme Profile's Icebreakers section is the source of truth for every
    // theme from this point on, this textarea is just how a brand-new
    // theme gets its first few.
    for (const [i, text] of input.conversationStarters.entries()) {
      await themeIcebreakerRepository.create({
        theme: { connect: { id: theme.id } },
        text,
        displayOrder: i,
      });
    }

    revalidatePath("/admin/ops/themes");
    return { success: true, data: { id: theme.id } };
  } catch (error) {
    return actionFailure(error, "Failed to create theme");
  }
}

export async function updateTheme(
  themeId: string,
  input: ThemeFormInput
): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    await themeRepository.update(themeId, {
      key: input.key,
      title: input.title,
      shortDescription: input.shortDescription,
      whatToExpect: input.whatToExpect,
      boundaries: input.boundaries,
      conversationStarters: input.conversationStarters,
    });
    revalidatePath("/admin/ops/themes");
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to update theme");
  }
}

export interface ThemeContentInput {
  title: string;
  shortDescription: string;
  whatToExpect: string;
  boundaries: string;
}

/**
 * Content editing for Theme Profile - deliberately narrower than
 * updateTheme (no key, no conversationStarters). key never changes after
 * creation; conversationStarters is vestigial once ThemeIcebreaker rows
 * exist (§16.24) and Theme Profile's Icebreakers section is its own CRUD
 * surface, not this form.
 */
export async function updateThemeContent(themeId: string, input: ThemeContentInput): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    await themeRepository.update(themeId, {
      title: input.title,
      shortDescription: input.shortDescription,
      whatToExpect: input.whatToExpect,
      boundaries: input.boundaries,
    });
    revalidatePath(`/admin/ops/themes/${themeId}`);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to update theme");
  }
}

export async function addIcebreaker(themeId: string, text: string): Promise<ActionResult<{ id: string }>> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { success: false, error: "Enter a question" };
  }

  try {
    const existing = await themeIcebreakerRepository.findByTheme(themeId);
    const icebreaker = await themeIcebreakerRepository.create({
      theme: { connect: { id: themeId } },
      text: trimmed,
      displayOrder: existing.length,
    });
    revalidatePath(`/admin/ops/themes/${themeId}`);
    return { success: true, data: { id: icebreaker.id } };
  } catch (error) {
    return actionFailure(error, "Failed to add icebreaker");
  }
}

export async function updateIcebreaker(themeId: string, icebreakerId: string, text: string): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { success: false, error: "Enter a question" };
  }

  try {
    await themeIcebreakerRepository.update(icebreakerId, { text: trimmed });
    revalidatePath(`/admin/ops/themes/${themeId}`);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to update icebreaker");
  }
}

export async function deleteIcebreaker(themeId: string, icebreakerId: string): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    await themeIcebreakerRepository.delete(icebreakerId);
    revalidatePath(`/admin/ops/themes/${themeId}`);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete icebreaker");
  }
}

/**
 * Toggle a theme's isActive flag rather than exposing a hard delete -
 * Theme is referenced by Dinner/RestaurantEnabledTheme/etc, and the
 * Dinner -> Theme relation has no onDelete rule (defaults to
 * restrict), so a real delete would fail for any theme that's ever
 * been used and just be confusing. Deactivating hides it from new
 * dinner creation without touching history.
 */
export async function toggleThemeActive(themeId: string, isActive: boolean): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    await themeRepository.update(themeId, { isActive });
    revalidatePath("/admin/ops/themes");
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to update theme");
  }
}
