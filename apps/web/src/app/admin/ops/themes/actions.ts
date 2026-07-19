"use server";

import { auth } from "@clerk/nextjs/server";
import { themeRepository, userRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { revalidatePath } from "next/cache";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

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
    revalidatePath("/admin/ops/themes");
    return { success: true, data: { id: theme.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create theme",
    };
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update theme",
    };
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update theme",
    };
  }
}
