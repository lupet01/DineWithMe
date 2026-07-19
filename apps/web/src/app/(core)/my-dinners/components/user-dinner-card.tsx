"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, Users, MessageSquare } from "lucide-react";
import { CancelBookingModal } from "./cancel-booking-modal";
import type { UserDinner } from "@dinewithme/shared";

interface UserDinnerCardProps {
  dinner: UserDinner;
  /** "upcoming" = large hero card | "past" = small horizontal card */
  variant?: "upcoming" | "past";
}

export function UserDinnerCard({ dinner, variant = "upcoming" }: UserDinnerCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [feedbackEligible, setFeedbackEligible] = useState(false);

  const startsAt = new Date(dinner.startsAt);
  const now = new Date();
  const msUntil = startsAt.getTime() - now.getTime();
  const isUpcoming = msUntil > 0;
  const daysUntil = Math.floor(msUntil / (1000 * 60 * 60 * 24));
  const hoursUntil = Math.floor((msUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const countdownLabel = daysUntil > 0
    ? `In ${daysUntil}d ${hoursUntil}h`
    : `In ${hoursUntil}h`;

  const timeStr = startsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const dateStr = startsAt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  // "Tonight", "Feb 18, 2026" style for past
  const displayDateStr = startsAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    if (variant === "past" && dinner.status === "COMPLETED") {
      fetch(`/api/feedback/eligibility?dinnerId=${dinner.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data?.eligible) setFeedbackEligible(true);
        })
        .catch(() => {});
    }
  }, [variant, dinner.id, dinner.status]);

  /* ── UPCOMING — large hero card (matches wireframe "My Reservations" top card) ── */
  if (variant === "upcoming") {
    return (
      <>
        <div className="overflow-hidden rounded-2xl bg-white shadow-card">
          <Link href={`/dinner/${dinner.id}`} className="block">
            {/* Full-bleed hero image */}
            <div className="relative h-[160px] w-full overflow-hidden bg-cream-200">
              {dinner.restaurant.heroImageUrl ? (
                <img
                  src={dinner.restaurant.heroImageUrl}
                  alt={dinner.restaurant.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                  <Users className="h-10 w-10 text-primary-300" />
                </div>
              )}
              {/* countdown badge top-right */}
              {isUpcoming && (
                <div className="absolute right-3 top-3 rounded-full bg-primary-500 px-3 py-1">
                  <span className="text-xs font-bold text-white">{countdownLabel}</span>
                </div>
              )}
            </div>

            {/* Card body */}
            <div className="px-4 pb-3 pt-3">
              <h3 className="mb-2 text-[16px] font-bold text-gray-900">
                {dinner.restaurant.name}
              </h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[13px] text-gray-600">
                  <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span>{dateStr}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-gray-600">
                  <Clock className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span>{timeStr}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-gray-600">
                  <Users className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span>
                    {dinner.confirmedSeatCount} {dinner.confirmedSeatCount === 1 ? "person" : "people"} at table
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Cancel reservation button — outside Link, below card body */}
          {isUpcoming && dinner.seat.status === "CONFIRMED" && (
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full rounded-full border-2 border-red-200 bg-white py-3 text-[14px] font-semibold text-red-500 transition-colors hover:bg-red-50 active:scale-[0.98]"
              >
                Cancel Reservation
              </button>
            </div>
          )}
        </div>

        <CancelBookingModal
          dinner={dinner}
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
        />
      </>
    );
  }

  /* ── PAST — small horizontal card with thumbnail (matches wireframe "Past Meals") ── */
  return (
    <>
      <Link href={`/dinner/${dinner.id}`} className="block">
        <div className="overflow-hidden rounded-2xl bg-white shadow-card transition-all active:scale-[0.98]">
          <div className="flex items-center gap-3 p-3">
            {/* Square thumbnail */}
            <div className="h-[60px] w-[60px] flex-shrink-0 overflow-hidden rounded-xl bg-cream-200">
              {dinner.restaurant.heroImageUrl && (
                <img
                  src={dinner.restaurant.heroImageUrl}
                  alt={dinner.restaurant.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-gray-900">
                {dinner.restaurant.name}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[12px] text-gray-500">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>{displayDateStr}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-gray-500">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span>{timeStr}</span>
              </div>
            </div>
          </div>

          {/* Feedback CTA when eligible */}
          {feedbackEligible && (
            <Link
              href={`/dinner/${dinner.id}/post-dinner`}
              onClick={(e) => e.stopPropagation()}
              className="mx-3 mb-3 flex items-center justify-center gap-2 rounded-full border-2 border-primary-200 bg-primary-50 py-2.5 text-[13px] font-semibold text-primary-600 transition-colors hover:bg-primary-100"
            >
              <MessageSquare className="h-4 w-4" />
              Leave Feedback
            </Link>
          )}
        </div>
      </Link>

      <CancelBookingModal
        dinner={dinner}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
      />
    </>
  );
}
