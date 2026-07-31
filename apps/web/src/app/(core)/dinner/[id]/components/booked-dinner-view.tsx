"use client";

import { useEffect, useState } from "react";
import { MapPin, Clock, Users, Ticket } from "lucide-react";
import type { DinnerDetail } from "@dinewithme/shared";
import { getIcebreakerQuestions } from "./icebreaker-actions";

interface BookedDinnerViewProps {
  dinner: DinnerDetail;
}

function InfoRow({
  icon,
  label,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-gray-50 px-4 py-3 first:border-0">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {sublabel && (
          <p className="mt-0.5 text-xs text-gray-500">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

/**
 * The rich "you're booked" cards - countdown, reservation details (incl.
 * confirmation code), and icebreaker questions. Originally lived only in
 * confirmation-success.tsx (shown once, right after checkout). Extracted
 * so dinner-booking-panel.tsx can show the same cards on every subsequent
 * visit to /dinner/[id] once userHasSeat is true, instead of a stripped-down
 * DinnerInfo view. Deliberately does not include the "What's Next" card or
 * any CTAs (success header, Cancel Reservation) - those stay specific to
 * the one-time post-checkout screen.
 */
export function BookedDinnerView({ dinner }: BookedDinnerViewProps) {
  const startsAt = new Date(dinner.startsAt);
  const endsAt = new Date(dinner.endsAt);

  const dateStr = startsAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeStr = `${startsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })} – ${endsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  const now = new Date();
  const msUntil = startsAt.getTime() - now.getTime();
  const daysUntil = Math.floor(msUntil / (1000 * 60 * 60 * 24));
  const hoursUntil = Math.floor(
    (msUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const countdownStr =
    daysUntil > 0 ? `${daysUntil}d ${hoursUntil}h` : `${hoursUntil}h`;

  // Generate a simple confirmation code from the dinner id
  const confirmationCode = `DWM-${dinner.id.slice(0, 8).toUpperCase()}`;

  const [icebreakers, setIcebreakers] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    getIcebreakerQuestions(dinner.theme.id)
      .then((questions) => {
        if (!cancelled) setIcebreakers(questions);
      })
      .catch((error) => {
        console.error("Failed to load icebreaker questions:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [dinner.theme.id]);

  return (
    <>
      {/* Countdown */}
      {msUntil > 0 && (
        <div className="rounded-2xl border border-primary-100 bg-primary-50 px-5 py-5 text-center">
          <p className="mb-1 text-sm text-gray-500">Time until dinner</p>
          <p className="text-[42px] font-extrabold leading-none tracking-tight text-primary-500">
            {countdownStr}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            We&apos;ll send you a reminder 30 minutes before
          </p>
        </div>
      )}

      {/* Reservation Details */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <h2 className="px-4 pt-4 pb-2 text-[17px] font-bold text-gray-900">
          Reservation Details
        </h2>
        <InfoRow
          icon={<MapPin className="h-5 w-5 text-primary-500" />}
          label={dinner.restaurant.name}
          sublabel={dinner.restaurant.address ?? dinner.restaurant.city ?? undefined}
        />
        <InfoRow
          icon={<Clock className="h-5 w-5 text-primary-500" />}
          label={`${dateStr}`}
          sublabel={timeStr}
        />
        <InfoRow
          icon={<Users className="h-5 w-5 text-primary-500" />}
          label={`${dinner.seats.total} people at the table`}
        />
        <InfoRow
          icon={<Ticket className="h-5 w-5 text-primary-500" />}
          label="Confirmation"
          sublabel={confirmationCode}
        />
      </div>

      {/* Icebreaker Questions */}
      {icebreakers.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          <h2 className="px-4 pt-4 pb-2 text-[17px] font-bold text-gray-900">
            Icebreaker Questions for {dinner.theme.title}
          </h2>
          {icebreakers.map((q, i) => (
            <div
              key={i}
              className="flex items-start gap-3 border-t border-gray-50 px-4 py-3 first:border-0"
            >
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-500">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed text-gray-800">{q}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
