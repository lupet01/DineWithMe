"use server";

import { revalidatePath } from "next/cache";
import { themeRepository, auditLogger, AuditAction, AuditEntity } from "@dinewithme/db";
import { requireAuthUser } from "@/lib/auth/server";
import { restaurantRepository } from "@dinewithme/db";
import { track } from "@dinewithme/analytics";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Toggle theme enablement for a restaurant
 */
export async function toggleThemeForRestaurant(
  restaurantId: string,
  themeId: string,
  enable: boolean
): Promise<ActionResult> {
  try {
    // Require authenticated user
    const user = await requireAuthUser();

    // Check if user is owner of the restaurant
    const isOwner = await restaurantRepository.isUserOwner(
      restaurantId,
      user.id
    );
    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to manage themes for this restaurant",
      };
    }

    // Verify theme exists and is active
    const theme = await themeRepository.findById(themeId);
    if (!theme) {
      return {
        success: false,
        error: "Theme not found",
      };
    }

    if (!theme.isActive) {
      return {
        success: false,
        error: "This theme is not currently available",
      };
    }

    // Get restaurant for analytics
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      return {
        success: false,
        error: "Restaurant not found",
      };
    }

    if (enable) {
      // Check if already enabled
      const isEnabled = await themeRepository.isEnabledForRestaurant(
        restaurantId,
        themeId
      );

      if (isEnabled) {
        return {
          success: false,
          error: "Theme is already enabled for this restaurant",
        };
      }

      // Enable theme
      await themeRepository.enableForRestaurant(restaurantId, themeId);

      // Emit analytics event
      await track("theme_enabled_for_restaurant", {
        restaurantId,
        restaurantName: restaurant.name,
        themeId,
        themeKey: theme.key,
        themeTitle: theme.title,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

    // Log audit trail
    await auditLogger.log(
      user.id,
      AuditAction.THEME_ENABLED,
      AuditEntity.RESTAURANT,
      restaurantId,
      {
        themeId,
        themeKey: theme.key,
        themeTitle: theme.title,
      }
    );
    } else {
      // Disable theme
      await themeRepository.disableForRestaurant(restaurantId, themeId);

      // Emit analytics event
      await track("theme_disabled_for_restaurant", {
        restaurantId,
        restaurantName: restaurant.name,
        themeId,
        themeKey: theme.key,
        themeTitle: theme.title,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      // Log audit trail
      await auditLogger.log(
        user.id,
        AuditAction.THEME_DISABLED,
        AuditEntity.RESTAURANT,
        restaurantId,
        {
          themeId,
          themeKey: theme.key,
          themeTitle: theme.title,
        }
      );
    }

    // Revalidate pages
    revalidatePath("/admin/restaurant");
    revalidatePath("/admin/dinners");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("[Theme] Error toggling theme:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle theme",
    };
  }
}
