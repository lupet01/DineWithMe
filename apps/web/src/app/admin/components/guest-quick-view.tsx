"use client";

import { useEffect, useState } from "react";
import { FilterSheet } from "@/components/ui/filter-sheet";
import { getGuestQuickView, type GuestQuickViewData } from "@/app/admin/guests/quick-view-actions";

interface GuestQuickViewProps {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
  guest: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export function GuestQuickView({ open, onClose, restaurantId, guest }: GuestQuickViewProps) {
  const [data, setData] = useState<GuestQuickViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    getGuestQuickView(guest.id, restaurantId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, guest.id, restaurantId]);

  const name = [guest.firstName, guest.lastName].filter(Boolean).join(" ") || guest.email;

  return (
    <FilterSheet open={open} onClose={onClose} title={name}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">{guest.email}</p>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-cream-100 p-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Dinners at this restaurant
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900">{data.dinnersCount}</div>
              </div>
              <div className="rounded-xl bg-cream-100 p-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Attendance
                </div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {data.attendedCount} / {data.dinnersCount}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Dietary notes
              </div>
              <div className="mt-1 text-sm text-gray-900">{data.dietaryNotes || "None on file"}</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-cream-100 p-3 text-xs text-gray-500">
              Trust score, payment history, and safety-report history aren&apos;t shown here — those
              stay platform-admin-only.
            </div>
          </>
        )}
      </div>
    </FilterSheet>
  );
}
