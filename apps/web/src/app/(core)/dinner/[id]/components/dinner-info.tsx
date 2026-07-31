"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Users, Clock, Utensils, Navigation, Phone } from "lucide-react";
import type { DinnerDetail } from "@dinewithme/shared";
import { MenuCourse } from "@prisma/client";
import {
  getTonightsMenuPreview,
  type MenuPreviewItem,
} from "./menu-preview-actions";

interface DinnerInfoProps {
  dinner: DinnerDetail;
  userHasSeat?: boolean;
  dietaryNotes?: string;
  onDietaryNotesChange?: (value: string) => void;
}

const COURSE_LABELS: Record<MenuCourse, string> = {
  [MenuCourse.STARTER]: "Starter",
  [MenuCourse.MAIN]: "Main",
  [MenuCourse.DESSERT]: "Dessert",
};

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

  const [menuPreview, setMenuPreview] = useState<MenuPreviewItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTonightsMenuPreview(dinner.id)
      .then((items) => {
        if (!cancelled) setMenuPreview(items);
      })
      .catch((error) => {
        console.error("Failed to load menu preview:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [dinner.id]);

  const directionsQuery =
    dinner.restaurant.address ||
    [dinner.restaurant.name, dinner.restaurant.city].filter(Boolean).join(" ");
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    directionsQuery
  )}`;

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

        {(dinner.restaurant.address || dinner.restaurant.phone) && (
          <div className="mt-3 flex items-center gap-2">
            {dinner.restaurant.address && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-100"
              >
                <Navigation className="h-3.5 w-3.5" />
                Directions
              </a>
            )}
            {dinner.restaurant.phone && (
              <a
                href={`tel:${dinner.restaurant.phone}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-100"
              >
                <Phone className="h-3.5 w-3.5" />
                Call Restaurant
              </a>
            )}
          </div>
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

      {/* Tonight's Menu — up to 3 dishes, one per course, from the restaurant's real menu */}
      {menuPreview.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-[17px] font-bold text-gray-900">
              Tonight&apos;s Menu
            </h2>
            <Link
              href={`/dinner/${dinner.id}/menu`}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              View full menu →
            </Link>
          </div>
          {menuPreview.map((item) => (
            <InfoRow
              key={item.id}
              icon={<Utensils className="h-4 w-4 text-primary-500" />}
              label={item.name}
              sublabel={COURSE_LABELS[item.course]}
            />
          ))}
        </div>
      )}

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
