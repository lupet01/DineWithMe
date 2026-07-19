"use client";

import { useState } from "react";
import type { DinnerDetail } from "@dinewithme/shared";
import { DinnerInfo } from "./dinner-info";
import { DinnerCTA } from "./dinner-cta";
import { BookedDinnerView } from "./booked-dinner-view";

interface DinnerBookingPanelProps {
  dinner: DinnerDetail;
  userHasSeat: boolean;
  hasSeatsAvailable: boolean;
  seatsAvailable: number;
}

/**
 * Client wrapper so the dietary-notes textarea in DinnerInfo and the
 * booking submission in DinnerCTA share one piece of state - the notes
 * typed pre-booking need to reach the booking API call, and both
 * components live in the same server-rendered tree otherwise.
 */
export function DinnerBookingPanel({
  dinner,
  userHasSeat,
  hasSeatsAvailable,
  seatsAvailable,
}: DinnerBookingPanelProps) {
  const [dietaryNotes, setDietaryNotes] = useState("");

  return (
    <>
      <div className="mx-auto max-w-lg space-y-3 px-4">
        <DinnerInfo
          dinner={dinner}
          userHasSeat={userHasSeat}
          dietaryNotes={dietaryNotes}
          onDietaryNotesChange={setDietaryNotes}
        />
        {/* Once booked, surface the same rich cards confirmation-success.tsx
            shows right after checkout (countdown, reservation details incl.
            confirmation code, icebreakers) instead of leaving them a one-time
            view. No success header or Cancel Reservation link here - the
            header is checkout-specific, and cancelling already lives on the
            My Reservations card (see cancel-booking-modal.tsx). */}
        {userHasSeat && <BookedDinnerView dinner={dinner} />}
      </div>

      <DinnerCTA
        dinnerId={dinner.id}
        hasSeatsAvailable={hasSeatsAvailable}
        seatsAvailable={seatsAvailable}
        userHasSeat={userHasSeat}
        dietaryNotes={dietaryNotes}
      />
    </>
  );
}
