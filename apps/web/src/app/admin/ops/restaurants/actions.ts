"use server";

import { auth } from "@clerk/nextjs/server";
import {
  restaurantRepository,
  restaurantClosureRequestRepository,
  userRepository,
  auditLogger,
} from "@dinewithme/db";
import { revalidatePath } from "next/cache";
import { track } from "@dinewithme/analytics";
import { AnalyticsEvents } from "@dinewithme/analytics";
import { Role } from "@dinewithme/shared";
import { emailService } from "@dinewithme/email";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

async function requirePlatformAdmin() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }
  const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
  if (!dbUser) {
    throw new Error("User not found");
  }
  if (dbUser.role !== Role.PLATFORM_ADMIN) {
    throw new Error("Only platform admins can perform this action");
  }
  return dbUser;
}

/**
 * Approve a restaurant (PLATFORM_ADMIN only)
 */
export async function approveRestaurant(restaurantId: string): Promise<ActionResult> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get database user
    const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check if user is PLATFORM_ADMIN
    if (dbUser.role !== Role.PLATFORM_ADMIN) {
      return { success: false, error: "Only platform admins can approve restaurants" };
    }

    // Get restaurant with owner details
    const restaurant = await restaurantRepository.findByIdWithMembers(restaurantId);
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    // Find owner member
    const ownerMember = restaurant.members.find((m) => m.role === "OWNER");
    if (!ownerMember) {
      return { success: false, error: "Restaurant has no owner" };
    }

    // Get owner user details
    const owner = await userRepository.findById(ownerMember.userId);
    if (!owner) {
      return { success: false, error: "Owner user not found" };
    }

    // Approve restaurant
    await restaurantRepository.approve(restaurantId);

    // Send approval email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await emailService.sendRestaurantApproved({
      ownerEmail: owner.email,
      ownerName: `${owner.firstName} ${owner.lastName}`,
      restaurantName: restaurant.name,
      dashboardUrl: `${baseUrl}/admin/restaurant`,
    });

    // Track analytics
    track(AnalyticsEvents.RESTAURANT_APPROVED, {
      restaurantId,
      restaurantName: restaurant.name,
      approvedBy: dbUser.id,
      approverEmail: dbUser.email,
      timestamp: new Date().toISOString(),
    });

    // Log audit trail
    await auditLogger.restaurantApproved(dbUser.id, restaurantId, {
      restaurantName: restaurant.name,
      previousStatus: restaurant.status,
    });

    // Revalidate pages
    revalidatePath("/admin/ops/restaurants");

    return { success: true };
  } catch (error) {
    console.error("Error approving restaurant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve restaurant",
    };
  }
}

/**
 * Pause a restaurant (PLATFORM_ADMIN only)
 */
export async function pauseRestaurant(
  restaurantId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get database user
    const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check if user is PLATFORM_ADMIN
    if (dbUser.role !== Role.PLATFORM_ADMIN) {
      return { success: false, error: "Only platform admins can pause restaurants" };
    }

    // Get restaurant
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    // Pause restaurant
    await restaurantRepository.pause(restaurantId);

    // Track analytics
    track(AnalyticsEvents.RESTAURANT_PAUSED, {
      restaurantId,
      restaurantName: restaurant.name,
      pausedBy: dbUser.id,
      pauserEmail: dbUser.email,
      reason,
      timestamp: new Date().toISOString(),
    });

    // Log audit trail
    await auditLogger.restaurantPaused(dbUser.id, restaurantId, {
      restaurantName: restaurant.name,
      previousStatus: restaurant.status,
      reason,
    });

    // Revalidate pages
    revalidatePath("/admin/ops/restaurants");

    return { success: true };
  } catch (error) {
    console.error("Error pausing restaurant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to pause restaurant",
    };
  }
}

/**
 * Reactivate a paused restaurant (PLATFORM_ADMIN only)
 */
export async function reactivateRestaurant(restaurantId: string): Promise<ActionResult> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get database user
    const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    // Check if user is PLATFORM_ADMIN
    if (dbUser.role !== Role.PLATFORM_ADMIN) {
      return { success: false, error: "Only platform admins can reactivate restaurants" };
    }

    // Get restaurant
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    // Reactivate restaurant
    await restaurantRepository.approve(restaurantId);

    // Revalidate pages
    revalidatePath("/admin/ops/restaurants");

    return { success: true };
  } catch (error) {
    console.error("Error reactivating restaurant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reactivate restaurant",
    };
  }
}

/**
 * Approves a restaurant's closure request - the only path that ever
 * archives a restaurant (§4.5.5). Permanent; there is no un-archive.
 */
export async function approveClosureRequest(requestId: string): Promise<ActionResult> {
  try {
    const admin = await requirePlatformAdmin();

    const request = await restaurantClosureRequestRepository.findById(requestId);
    if (!request) {
      return { success: false, error: "Closure request not found" };
    }
    if (request.status !== "PENDING") {
      return { success: false, error: "This request has already been reviewed" };
    }

    const restaurant = await restaurantRepository.findById(request.restaurantId);
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    await restaurantClosureRequestRepository.update(requestId, {
      status: "APPROVED",
      reviewedBy: { connect: { id: admin.id } },
      reviewedAt: new Date(),
    });
    await restaurantRepository.archive(restaurant.id);

    track(AnalyticsEvents.RESTAURANT_ARCHIVED, {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      archivedBy: admin.id,
      reason: request.reason,
      timestamp: new Date().toISOString(),
    });
    await auditLogger.restaurantClosureReviewed(admin.id, restaurant.id, true, {
      restaurantName: restaurant.name,
      requestId,
      reason: request.reason,
    });

    revalidatePath("/admin/ops/restaurants");
    revalidatePath(`/admin/ops/restaurants/${restaurant.id}`);
    return { success: true };
  } catch (error) {
    console.error("Error approving closure request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve closure request",
    };
  }
}

/**
 * Rejects a closure request - dismissed, restaurant status untouched. The
 * owner can submit a new request later.
 */
export async function rejectClosureRequest(requestId: string): Promise<ActionResult> {
  try {
    const admin = await requirePlatformAdmin();

    const request = await restaurantClosureRequestRepository.findById(requestId);
    if (!request) {
      return { success: false, error: "Closure request not found" };
    }
    if (request.status !== "PENDING") {
      return { success: false, error: "This request has already been reviewed" };
    }

    await restaurantClosureRequestRepository.update(requestId, {
      status: "REJECTED",
      reviewedBy: { connect: { id: admin.id } },
      reviewedAt: new Date(),
    });

    await auditLogger.restaurantClosureReviewed(admin.id, request.restaurantId, false, {
      requestId,
      reason: request.reason,
    });

    revalidatePath("/admin/ops/restaurants");
    revalidatePath(`/admin/ops/restaurants/${request.restaurantId}`);
    return { success: true };
  } catch (error) {
    console.error("Error rejecting closure request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject closure request",
    };
  }
}
