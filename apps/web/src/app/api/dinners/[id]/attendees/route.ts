import { NextResponse } from "next/server";
import { prisma } from "@dinewithme/db";
import { auth } from "@clerk/nextjs/server";
import { handleApiError } from "../../../lib/error-handler";

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/dinners/:id/attendees
 *
 * Returns confirmed attendees for a dinner (excluding the requesting user).
 * Used by the post-dinner feedback flow for person signals.
 *
 * Requires authentication — only attendees of the dinner can see other attendees.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const dinnerId = params.id;

    // Resolve the requesting user's DB id
    const requestingUser = await prisma.user.findUnique({
      where: { authProviderId: clerkUserId },
      select: { id: true },
    });

    if (!requestingUser) {
      return NextResponse.json(
        { success: false, error: { message: "User not found", code: "USER_NOT_FOUND" } },
        { status: 404 }
      );
    }

    // Authorization: only a confirmed participant of this dinner may see
    // who else is coming. Without this check any authenticated diner could
    // pass any dinnerId and harvest attendees' PII — a direct breach of the
    // app's anonymity guarantee (and POPIA). Membership requires an active
    // seat (CONFIRMED/ATTENDED/COMPLETED) held by the caller on this dinner.
    const callerSeat = await prisma.seat.findFirst({
      where: {
        dinnerId,
        confirmedByUserId: requestingUser.id,
        status: { in: ["CONFIRMED", "ATTENDED", "COMPLETED"] },
      },
      select: { id: true },
    });

    if (!callerSeat) {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden", code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    // Fetch seats with confirmed/attended/completed status, including the user who confirmed
    const seats = await prisma.seat.findMany({
      where: {
        dinnerId,
        status: { in: ["CONFIRMED", "ATTENDED", "COMPLETED"] },
        confirmedByUserId: { not: null },
      },
      select: {
        confirmedByUserId: true,
        confirmedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Deduplicate and exclude the requesting user. Only id + first name are
    // returned — the "who's coming" signal needs no email, and exposing it
    // would leak PII to fellow diners.
    const seen = new Set<string>();
    const attendees = [];

    for (const seat of seats) {
      const user = seat.confirmedByUser;
      if (user && user.id !== requestingUser.id && !seen.has(user.id)) {
        seen.add(user.id);
        attendees.push({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      }
    }

    return NextResponse.json({ success: true, data: { attendees } });
  } catch (error) {
    return handleApiError(error);
  }
}
