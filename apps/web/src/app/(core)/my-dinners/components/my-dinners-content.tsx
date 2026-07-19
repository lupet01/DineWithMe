"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { UserDinnerCard } from "./user-dinner-card";
import type { UserDinner } from "@dinewithme/shared";

export function MyDinnersContent() {
  const [upcoming, setUpcoming] = useState<UserDinner[]>([]);
  const [past, setPast] = useState<UserDinner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/me/dinners", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setUpcoming(d.data.upcoming ?? []);
          setPast(d.data.past ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-cream-100 pb-28">
      {/* Page header — sticky, matches wireframe exactly */}
      <div className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-xl">
        <div className="px-4 pb-3 pt-5">
          <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900">
            My Reservations
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            Your dining experiences
          </p>
        </div>
        <div className="h-px bg-gray-100" />
      </div>

      <div className="mx-auto max-w-lg px-4 pt-2">
        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-cream-300" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Upcoming section ── */}
            {upcoming.length > 0 ? (
              <div className="mb-5">
                <h2 className="mb-3 text-[13px] font-semibold text-gray-900">
                  Upcoming
                </h2>
                <div className="space-y-3">
                  {upcoming.map((d) => (
                    <UserDinnerCard
                      key={d.id}
                      dinner={d}
                      variant="upcoming"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-5 rounded-2xl bg-white px-6 py-10 text-center shadow-card">
                <p className="text-[15px] font-semibold text-gray-900">
                  No upcoming dinners
                </p>
                <p className="mt-1 text-[13px] text-gray-500">
                  You don&apos;t have any upcoming reservations
                </p>
                <Link
                  href="/discover"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                >
                  <Sparkles className="h-4 w-4" />
                  Discover Dinners
                </Link>
              </div>
            )}

            {/* ── Past Meals section ── */}
            {past.length > 0 && (
              <div>
                <h2 className="mb-3 text-[13px] font-semibold text-gray-900">
                  Past Meals
                </h2>
                <div className="space-y-3">
                  {past.map((d) => (
                    <UserDinnerCard
                      key={d.id}
                      dinner={d}
                      variant="past"
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
