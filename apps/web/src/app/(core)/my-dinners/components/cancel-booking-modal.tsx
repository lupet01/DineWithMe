"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { UserDinner } from "@dinewithme/shared";

interface CancelBookingModalProps {
  dinner: UserDinner;
  isOpen: boolean;
  onClose: () => void;
}

export function CancelBookingModal({ dinner, isOpen, onClose }: CancelBookingModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const startsAt = new Date(dinner.startsAt);
  const cutoffHours = 6;
  const deadline = new Date(startsAt);
  deadline.setHours(deadline.getHours() - cutoffHours);

  const now = new Date();
  const hoursUntil = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canCancel = hoursUntil >= cutoffHours;

  const deadlineStr = deadline.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seats/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatId: dinner.seat.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to cancel booking");
      }
      setSuccess(true);
      setTimeout(() => { onClose(); router.refresh(); }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[17px] font-bold text-gray-900">
            {success ? "Booking Cancelled" : "Cancel Reservation"}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-6">
          {success ? (
            /* Success state */
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-[15px] font-semibold text-gray-900">Reservation Cancelled</p>
              <p className="mt-1 text-[13px] text-gray-500">
                Your seat has been released. Hope to see you at another dinner!
              </p>
            </div>
          ) : (
            <>
              {/* Dinner summary card */}
              <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
                <div className="p-4">
                  <p className="text-[15px] font-bold text-gray-900">{dinner.restaurant.name}</p>
                  <p className="mt-1 text-[13px] text-gray-500">
                    📅 {startsAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    {" · "}
                    {startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                  <p className="mt-0.5 text-[12px] text-gray-400">
                    🎫 {dinner.seat?.id?.slice(0, 12).toUpperCase() ?? "N/A"}
                  </p>
                </div>
              </div>

              {/* Cancellation policy */}
              <div className={`mb-4 rounded-2xl border p-4 ${canCancel ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
                <p className={`text-[13px] font-semibold ${canCancel ? "text-amber-800" : "text-red-700"}`}>
                  ⚠️ Cancellation Policy
                </p>
                <p className={`mt-1 text-[13px] leading-relaxed ${canCancel ? "text-amber-700" : "text-red-600"}`}>
                  {canCancel
                    ? `You can cancel for a full refund up to 6 hours before the dinner starts. After that, no refunds are available.`
                    : `The free cancellation window has passed. Cancellations are no longer accepted within 6 hours of the dinner.`}
                </p>
                {canCancel && (
                  <div className="mt-3 rounded-xl bg-amber-100 px-3 py-2">
                    <p className="text-[12px] font-semibold text-amber-800">
                      ⏰ Free cancellation until {deadlineStr}
                    </p>
                  </div>
                )}
              </div>

              {/* Reason (optional) */}
              {canCancel && (
                <div className="mb-4">
                  <p className="mb-2 text-[13px] font-semibold text-gray-900">
                    Reason for cancelling (optional)
                  </p>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Let us know why you're cancelling..."
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-cream-200 px-3 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-600">
                  {error}
                </p>
              )}

              {/* CTAs */}
              <button
                onClick={handleCancel}
                disabled={isLoading || !canCancel}
                className="mb-2 w-full rounded-full bg-red-500 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Cancelling…" : "Confirm Cancellation"}
              </button>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-full rounded-full border-2 border-gray-200 bg-white py-4 text-[15px] font-semibold text-gray-900 transition-colors hover:bg-gray-50"
              >
                Keep My Reservation
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
