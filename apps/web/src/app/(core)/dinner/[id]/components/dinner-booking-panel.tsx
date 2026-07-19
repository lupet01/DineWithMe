"use client";

import { useState } from "react";
import type { DinnerDetail } from "@dinewithme/shared";
import { DinnerInfo } from "./dinner-info";
import { DinnerCTA } from "./dinner-cta";

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
      <div className="mx-auto max-w-lg px-4">
        <DinnerInfo
          dinner={dinner}
          userHasSeat={userHasSeat}
          dietaryNotes={dietaryNotes}
          onDietaryNotesChange={setDietaryNotes}
        />
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
