import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { restaurantRepository, userRepository, auditLogger } from "@dinewithme/db";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { Role } from "@dinewithme/shared";
import { emailService } from "@dinewithme/email";
import { handleApiError } from "../../../lib/error-handler";

/**
 * POST /api/restaurants/[id]/approve
 * 
 * Approve a restaurant (PLATFORM_ADMIN only)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "restaurant": {...},
 *     "emailSent": true
 *   }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get database user
    const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is PLATFORM_ADMIN
    if (dbUser.role !== Role.PLATFORM_ADMIN) {
      return NextResponse.json(
        { success: false, error: "Only platform admins can approve restaurants" },
        { status: 403 }
      );
    }

    const restaurantId = params.id;

    // Get restaurant with owner details
    const restaurant = await restaurantRepository.findByIdWithMembers(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Check if already approved
    if (restaurant.status === "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Restaurant is already approved" },
        { status: 400 }
      );
    }

    // Find owner
    const owner = restaurant.members.find((m) => m.role === "OWNER");
    if (!owner) {
      return NextResponse.json(
        { success: false, error: "Restaurant has no owner" },
        { status: 400 }
      );
    }

    // Approve restaurant
    const updatedRestaurant = await restaurantRepository.approve(restaurantId);

    // Send approval email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const emailResult = await emailService.sendRestaurantApproved({
      ownerEmail: owner.user.email,
      ownerName: `${owner.user.firstName} ${owner.user.lastName}`,
      restaurantName: restaurant.name,
      dashboardUrl: `${baseUrl}/admin/restaurant`,
    });

    // Track analytics
    await track(AnalyticsEvents.RESTAURANT_APPROVED, {
      restaurantId,
      restaurantName: restaurant.name,
      approvedBy: dbUser.id,
      approverEmail: dbUser.email,
      emailSent: emailResult.success,
      timestamp: new Date().toISOString(),
    });

    // Log audit trail
    await auditLogger.restaurantApproved(dbUser.id, restaurantId, {
      restaurantName: restaurant.name,
      previousStatus: restaurant.status,
    });

    return NextResponse.json({
      success: true,
      data: {
        restaurant: updatedRestaurant,
        emailSent: emailResult.success,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
