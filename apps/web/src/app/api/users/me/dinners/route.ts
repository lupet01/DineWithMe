import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@dinewithme/db";
import { handleApiError } from "@/app/api/lib/error-handler";

/**
 * GET /api/users/me/dinners
 * 
 * Get current user's dinner bookings
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "upcoming": [...],
 *     "past": [...]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if ("error" in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    // Get user's seats with dinner and restaurant info
    const seats = await prisma.seat.findMany({
      where: {
        OR: [
          { heldByUserId: user.id },
          { confirmedByUserId: user.id },
        ],
        status: {
          in: ["CONFIRMED", "ATTENDED", "NO_SHOW"],
        },
      },
      include: {
        dinner: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                city: true,
                cuisine: true,
                heroImageUrl: true,
              },
            },
            theme: {
              select: {
                id: true,
                key: true,
                title: true,
                shortDescription: true,
              },
            },
          },
        },
      },
      orderBy: {
        dinner: {
          startsAt: "desc",
        },
      },
    });

    const now = new Date();

    // Split into upcoming and past
    const upcoming = seats
      .filter((seat) => new Date(seat.dinner.startsAt) >= now)
      .map((seat) => ({
        seatId: seat.id,
        seatStatus: seat.status,
        dinner: {
          id: seat.dinner.id,
          theme: seat.dinner.theme,
          description: seat.dinner.description,
          startsAt: seat.dinner.startsAt.toISOString(),
          endsAt: seat.dinner.endsAt.toISOString(),
          status: seat.dinner.status,
          restaurant: seat.dinner.restaurant,
        },
      }));

    const past = seats
      .filter((seat) => new Date(seat.dinner.startsAt) < now)
      .map((seat) => ({
        seatId: seat.id,
        seatStatus: seat.status,
        dinner: {
          id: seat.dinner.id,
          theme: seat.dinner.theme,
          description: seat.dinner.description,
          startsAt: seat.dinner.startsAt.toISOString(),
          endsAt: seat.dinner.endsAt.toISOString(),
          status: seat.dinner.status,
          restaurant: seat.dinner.restaurant,
        },
      }));

    return NextResponse.json({
      success: true,
      data: {
        upcoming,
        past,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
