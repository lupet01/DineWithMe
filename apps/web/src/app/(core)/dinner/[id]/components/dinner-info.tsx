"use client";

import { MapPin, Users, Clock, Utensils } from "lucide-react";
import type { DinnerDetail } from "@dinewithme/shared";

interface DinnerInfoProps {
  dinner: DinnerDetail;
  userHasSeat?: boolean;
  dietaryNotes?: string;
  onDietaryNotesChange?: (value: string) => void;
}

// ── Reusable icon row matching the app's orange-circle style ──────────────────
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
    <div className="flex items-center gap-3 px-4 py-3 [&+&]:border-t [&+&]:border-gray-50">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

export function DinnerInfo({
  dinner,
  userHasSeat = false,
  dietaryNotes = "",
  onDietaryNotesChange,
}: DinnerInfoProps) {
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

  const spotsText =
    dinner.seats.available === 0
      ? "Sold out"
      : `${dinner.seats.available} of ${dinner.seats.total} spots remaining`;

  return (
    <div className="space-y-3">

      {/* Restaurant name — below hero, no card */}
      <div className="pt-2 pb-1">
        <h1 className="text-[22px] font-bold leading-tight text-gray-900">
          {dinner.restaurant.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {[dinner.restaurant.cuisine, dinner.restaurant.city]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {(dinner.restaurant.address || dinner.restaurant.city) && (
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            {dinner.restaurant.address ?? dinner.restaurant.city}
          </p>
        )}
      </div>

      {/* Table Details */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <h2 className="px-4 pt-4 pb-2 text-[17px] font-bold text-gray-900">
          Table Details
        </h2>
        <InfoRow
          icon={<Users className="h-5 w-5 text-primary-500" />}
          label="Available Spots"
          sublabel={spotsText}
        />
        <InfoRow
          icon={<Clock className="h-5 w-5 text-primary-500" />}
          label="Meal Time"
          sublabel={`${dateStr} · ${timeStr}`}
        />
        <InfoRow
          icon={<span className="text-lg">💬</span>}
          label="Conversation Style"
          sublabel={dinner.theme.shortDescription}
        />
        <InfoRow
          icon={<span className="text-lg">✨</span>}
          label="The Experience"
          sublabel={dinner.theme.title}
        />
      </div>

      {/* Who's Coming */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <h2 className="px-4 pt-4 pb-3 text-[17px] font-bold text-gray-900">
          Who&apos;s Coming
        </h2>
        <div className="px-4 pb-4">
          <div className="mb-3 flex items-center gap-2">
            {Array.from({ length: Math.min(Math.max(dinner.seats.confirmed, 1), 5) }).map(
              (_, i) => (
                <div
                  key={i}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              )
            )}
            <span className="ml-1 text-sm text-gray-600">
              {dinner.seats.confirmed} {dinner.seats.confirmed === 1 ? "person" : "people"} confirmed
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2.5">
            <Users className="h-4 w-4 text-primary-500 flex-shrink-0" />
            <p className="text-xs text-gray-600">
              Names are revealed after you join the table
            </p>
          </div>
        </div>
      </div>

      {/* Tonight's Menu */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <h2 className="px-4 pt-4 pb-2 text-[17px] font-bold text-gray-900">
          Tonight&apos;s Menu
        </h2>
        {[
          { course: "Starter", dish: "Seasonal starter" },
          { course: "Main", dish: "Chef's signature main" },
          { course: "Dessert", dish: "House dessert" },
        ].map(({ course, dish }) => (
          <div
            key={course}
            className="flex items-center gap-3 border-t border-gray-50 px-4 py-3 first:border-0"
          >
            <span className="w-14 flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {course}
            </span>
            <span className="text-sm text-gray-900">{dish}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 px-4 py-3">
          <button className="text-sm font-medium text-primary-500">
            View full menu →
          </button>
        </div>
      </div>

      {/* Dietary Notes — always show pre-booking */}
      {!userHasSeat && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          <div className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-gray-900">
              <Utensils className="h-4 w-4 text-gray-500" />
              Dietary Notes (Optional)
            </h2>
            <textarea
              value={dietaryNotes}
              onChange={(e) => onDietaryNotesChange?.(e.target.value)}
              placeholder="Any allergies or dietary restrictions?"
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-cream-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
      )}

    </div>
  );
}
