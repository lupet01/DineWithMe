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
 * Client wrapper shared by DinnerInfo and DinnerCTA.
 *
 * DinnerDetailContent (the page-level component) is a server component, so it
 * can't hold the dietary-notes textarea state itself. This wrapper lifts that
 * state up just far enough that the sibling components can share it: the
 * textarea in DinnerInfo updates it, and DinnerCTA reads it when it POSTs the
 * booking to /api/bookings/create.
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
