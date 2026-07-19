"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCommitmentAmount, formatAmount } from "@dinewithme/config/src/payment";

interface DinnerCTAProps {
  dinnerId: string;
  hasSeatsAvailable: boolean;
  seatsAvailable: number;
  userHasSeat?: boolean;
  dietaryNotes?: string;
}

export function DinnerCTA({
  dinnerId,
  hasSeatsAvailable,
  seatsAvailable,
  userHasSeat = false,
  dietaryNotes,
}: DinnerCTAProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const commitmentAmountLabel = formatAmount(getCommitmentAmount(dinnerId));

  if (userHasSeat) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-cream-100/95 px-4 pb-8 pt-3 backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => router.push("/my-dinners")}
            className="w-full rounded-full bg-green-500 py-4 text-base font-semibold text-white shadow-soft transition-colors hover:bg-green-600 active:scale-[0.98]"
          >
            You&apos;re booked — View My Dinners
          </button>
        </div>
      </div>
    );
  }

  const handleReserve = async () => {
    setIsLoading(true);
    try {
      const trimmedDietaryNotes = dietaryNotes?.trim();
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dinnerId,
          ...(trimmedDietaryNotes ? { dietaryNotes: trimmedDietaryNotes } : {}),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const msg =
          typeof error.error === "string"
            ? error.error
            : "Failed to create booking";
        if (msg.includes("already has a seat")) {
          alert(
            "You already have a reservation for this dinner. Check 'My Dinners' to view it."
          );
        } else if (msg.includes("No available seats")) {
          alert("Sorry, this dinner is now fully booked.");
        } else {
          alert(msg);
        }
        setIsLoading(false);
        return;
      }

      const { data } = await response.json();
      if (data.requiresPayment && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        router.push(
          `/dinner/${dinnerId}/callback?seatId=${data.seatId}&status=success`
        );
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-cream-100/95 px-4 pb-8 pt-3 backdrop-blur-md">
      <div className="mx-auto max-w-lg">
        {hasSeatsAvailable ? (
          <>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-gray-500">
                <Users className="h-4 w-4" />
                {seatsAvailable} {seatsAvailable === 1 ? "seat" : "seats"} left
              </span>
              {seatsAvailable <= 3 && (
                <span className="text-xs font-semibold text-primary-500">
                  Filling fast!
                </span>
              )}
            </div>
            <button
              onClick={handleReserve}
              disabled={isLoading}
              className={cn(
                "w-full rounded-full bg-primary-500 py-4 text-base font-semibold text-white shadow-soft transition-colors hover:bg-primary-600 active:scale-[0.98]",
                isLoading && "cursor-not-allowed opacity-60"
              )}
            >
              {isLoading ? "Reserving…" : `Reserve Your Seat — ${commitmentAmountLabel}`}
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">
              {commitmentAmountLabel} commitment fee, fully refundable up to 24 hours before the dinner
            </p>
          </>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-center gap-1.5 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              Sold out
            </div>
            <button
              onClick={() => alert("Waitlist feature coming soon!")}
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary-500 bg-white py-4 text-base font-semibold text-primary-500 transition-colors hover:bg-primary-50 active:scale-[0.98]"
            >
              <Bell className="h-5 w-5" />
              Join Waitlist
            </button>
          </>
        )}
      </div>
    </div>
  );
}
