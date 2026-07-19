import { NextResponse } from "next/server";
import { seatRepository } from "@dinewithme/db";
import { handleApiError } from "../../../lib/error-handler";

// GET /api/dinners/[id]/seats - Get seat counts for a dinner
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const dinnerId = params.id;

    // Count seats by status — expired holds are treated as available
    const [confirmed, available, held, attended] = await Promise.all([
      seatRepository.countByDinnerAndStatus(dinnerId, "CONFIRMED"),
      seatRepository.countAvailableForDinner(dinnerId),
      seatRepository.countActiveHoldsForDinner(dinnerId),
      seatRepository.countByDinnerAndStatus(dinnerId, "ATTENDED"),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        confirmed,
        available,
        held,
        attended,
        total: confirmed + available + held + attended,
      },
      confirmed, // For backward compatibility
      available, // For backward compatibility
    });
  } catch (error) {
    return handleApiError(error);
  }
}
