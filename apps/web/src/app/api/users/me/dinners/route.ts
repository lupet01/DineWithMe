import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@dinewithme/db";
import { handleApiError } from "@/app/api/lib/error-handler";
import type { UserDinner } from "@dinewithme/shared";

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
                address: true,
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

    // Party size per dinner (how many seats are actually booked at the
    // table, not just this user's own seat) - one grouped query for every
    // dinner in this result set rather than one query per card.
    const dinnerIds = Array.from(new Set(seats.map((seat) => seat.dinnerId)));
    const seatCounts = dinnerIds.length
      ? await prisma.seat.groupBy({
          by: ["dinnerId"],
          where: {
            dinnerId: { in: dinnerIds },
            status: { in: ["CONFIRMED", "ATTENDED", "COMPLETED"] },
          },
          _count: { dinnerId: true },
        })
      : [];
    const seatCountByDinnerId = new Map(
      seatCounts.map((row) => [row.dinnerId, row._count.dinnerId])
    );

    const now = new Date();

    const toUserDinner = (seat: (typeof seats)[number]): UserDinner => ({
      id: seat.dinner.id,
      theme: seat.dinner.theme,
      description: seat.dinner.description,
      startsAt: seat.dinner.startsAt.toISOString(),
      endsAt: seat.dinner.endsAt.toISOString(),
      status: seat.dinner.status,
      confirmedSeatCount: seatCountByDinnerId.get(seat.dinnerId) ?? 1,
      restaurant: seat.dinner.restaurant,
      seat: {
        id: seat.id,
        status: seat.status,
        confirmedAt: null,
        checkedInAt: seat.checkedInAt ? seat.checkedInAt.toISOString() : null,
      },
    });

    const upcoming = seats
      .filter((seat) => new Date(seat.dinner.startsAt) >= now)
      .map(toUserDinner);

    const past = seats
      .filter((seat) => new Date(seat.dinner.startsAt) < now)
      .map(toUserDinner);

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
