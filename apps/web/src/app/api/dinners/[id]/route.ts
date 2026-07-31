import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dinnerRepository, userRepository } from "@dinewithme/db";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { handleApiError } from "../../lib/error-handler";
import type { DinnerDetail } from "@dinewithme/shared";

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/dinners/:id
 * 
 * Get dinner details by ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "...",
 *     "theme": "Italian Night",
 *     "restaurant": {...},
 *     "seats": {
 *       "total": 12,
 *       "available": 5,
 *       "confirmed": 7
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params;

    // Get optional user (not required for public viewing)
    const { userId: clerkUserId } = await auth();
    let userId: string | undefined;

    if (clerkUserId) {
      const user = await userRepository.findByAuthProviderId(clerkUserId);
      userId = user?.id;
    }

    // Fetch dinner with details
    const dinner = await dinnerRepository.findByIdWithDetails(id);

    if (!dinner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Dinner not found",
            code: "NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Calculate seat counts
    const availableCount = dinner.seats.filter((s) => s.status === "AVAILABLE").length;
    const confirmedCount = dinner.seats.filter((s) => s.status === "CONFIRMED").length;
    const heldCount = dinner.seats.filter((s) => s.status === "HELD").length;
    const attendedCount = dinner.seats.filter((s) => s.status === "ATTENDED").length;

    // Type-safe restaurant access
    interface RestaurantDetail {
      id: string;
      name: string;
      description: string | null;
      cuisine: string | null;
      city: string | null;
      address: string | null;
      phone: string | null;
      website: string | null;
      heroImageUrl: string | null;
    }

    interface ThemeDetailData {
      id: string;
      key: string;
      title: string;
      shortDescription: string;
      whatToExpect: string | null;
      boundaries: string | null;
      conversationStarters: string[] | null;
    }

    const restaurant = dinner.restaurant as RestaurantDetail;
    const themeData = dinner.theme as ThemeDetailData | null;

    // Transform to response format
    const dinnerDetail: DinnerDetail = {
      id: dinner.id,
      theme: themeData ? {
        id: themeData.id,
        key: themeData.key,
        title: themeData.title,
        shortDescription: themeData.shortDescription,
        whatToExpect: themeData.whatToExpect || "",
        boundaries: themeData.boundaries || "",
        conversationStarters: themeData.conversationStarters || [],
      } : {
        id: "",
        key: "",
        title: "",
        shortDescription: "",
        whatToExpect: "",
        boundaries: "",
        conversationStarters: [],
      },
      description: dinner.description,
      startsAt: dinner.startsAt.toISOString(),
      endsAt: dinner.endsAt.toISOString(),
      seatCount: dinner.seatCount,
      status: dinner.status,
      pricePerSeatCents: dinner.pricePerSeatCents,
      createdAt: dinner.createdAt.toISOString(),
      updatedAt: dinner.updatedAt.toISOString(),
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        cuisine: restaurant.cuisine,
        city: restaurant.city,
        address: restaurant.address,
        phone: restaurant.phone,
        website: restaurant.website,
        heroImageUrl: restaurant.heroImageUrl,
      },
      seats: {
        total: dinner._count.seats,
        available: availableCount,
        confirmed: confirmedCount,
        held: heldCount,
        attended: attendedCount,
      },
    };

    // Emit analytics event
    await track(AnalyticsEvents.DINNER_DETAIL_VIEWED, {
      userId,
      dinnerId: dinner.id,
      restaurantId: restaurant.id,
      theme: themeData?.title || "",
      seatsAvailable: availableCount,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: dinnerDetail,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
