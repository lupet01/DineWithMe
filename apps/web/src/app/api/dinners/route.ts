import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dinnerRepository, userRepository } from "@dinewithme/db";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { handleApiError } from "../lib/error-handler";
import type { DinnerListItem } from "@dinewithme/shared";

/**
 * GET /api/dinners
 * 
 * List public dinners with filters and pagination
 * 
 * Query parameters:
 * - city: Filter by city (case-insensitive)
 * - theme: Filter by theme key (case-insensitive)
 * - from: Start date (ISO string)
 * - to: End date (ISO string)
 * - limit: Number of results per page (default: 50, max: 100)
 * - offset: Number of results to skip (default: 0)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "dinners": [...],
 *     "count": 10,
 *     "total": 45,
 *     "filters": { "city": "Cape Town", "theme": "italian" },
 *     "pagination": { "limit": 50, "offset": 0, "hasMore": true }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Get optional user (not required for public listing)
    const { userId: clerkUserId } = await auth();
    let userId: string | undefined;

    if (clerkUserId) {
      const user = await userRepository.findByAuthProviderId(clerkUserId);
      userId = user?.id;
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get("city") || undefined;
    const theme = searchParams.get("theme") || undefined;
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    const limitStr = searchParams.get("limit");
    const offsetStr = searchParams.get("offset");

    // Parse pagination with defaults and limits
    const limit = Math.min(parseInt(limitStr || "50", 10), 100);
    const offset = Math.max(parseInt(offsetStr || "0", 10), 0);

    const filters = {
      city,
      themeKey: theme,
      from: fromStr ? new Date(fromStr) : undefined,
      to: toStr ? new Date(toStr) : undefined,
      limit,
      offset,
    };

    // Fetch dinners with seat counts and total count in parallel
    const [dinners, total] = await Promise.all([
      dinnerRepository.findPublicDinners(filters),
      dinnerRepository.countPublicDinners({
        city: filters.city,
        themeKey: filters.themeKey,
        from: filters.from,
        to: filters.to,
      }),
    ]);

    // Type for the actual restaurant data returned from the query
    interface RestaurantListData {
      id: string;
      name: string;
      city: string | null;
      cuisine: string | null;
      heroImageUrl: string | null;
      latitude: number | null;
      longitude: number | null;
    }

    // Transform to response format with seat calculations
    const dinnersWithSeats: DinnerListItem[] = dinners.map((dinner) => {
      const availableCount = dinner.seats.filter((s) => s.status === "AVAILABLE").length;
      const confirmedCount = dinner.seats.filter((s) => s.status === "CONFIRMED").length;
      const restaurant = dinner.restaurant as unknown as RestaurantListData;

      return {
        id: dinner.id,
        theme: dinner.theme || { id: "", key: "", title: "", shortDescription: "" },
        description: dinner.description,
        startsAt: dinner.startsAt.toISOString(),
        endsAt: dinner.endsAt.toISOString(),
        status: dinner.status,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          city: restaurant.city,
          cuisine: restaurant.cuisine,
          heroImageUrl: restaurant.heroImageUrl,
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
        },
        seats: {
          total: dinner._count.seats,
          available: availableCount,
          confirmed: confirmedCount,
        },
      };
    });

    // Emit analytics event
    await track(AnalyticsEvents.DINNER_LIST_VIEWED, {
      userId,
      filters: {
        city,
        theme,
        from: fromStr || undefined,
        to: toStr || undefined,
      },
      resultCount: dinnersWithSeats.length,
      totalCount: total,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        dinners: dinnersWithSeats,
        count: dinnersWithSeats.length,
        total,
        filters: {
          ...(city && { city }),
          ...(theme && { theme }),
          ...(fromStr && { from: fromStr }),
          ...(toStr && { to: toStr }),
        },
        pagination: {
          limit,
          offset,
          hasMore: offset + dinnersWithSeats.length < total,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
