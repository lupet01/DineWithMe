"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatAmount } from "@dinewithme/config/src/payment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/search-bar";
import { Tabs } from "@/components/ui/tabs";
import { RowCard } from "@/components/ui/row-card";
import { GuestQuickView } from "@/app/admin/components/guest-quick-view";

interface GuestUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface Guest {
  id: string;
  status: string;
  dietaryNotes: string | null;
  confirmedByUser: GuestUser | null;
  heldByUser: GuestUser | null;
  dinner: {
    id: string;
    startsAt: Date | string;
    theme: { title: string } | null;
  };
  paymentIntents: Array<{ status: string; amount: number; currency: string }>;
}

interface GuestsTableProps {
  guests: Guest[];
  restaurantId: string;
}

function statusTone(status: string): "primary" | "success" | "neutral" | "danger" | "warning" {
  if (status === "ATTENDED" || status === "COMPLETED") return "success";
  if (status === "CONFIRMED") return "primary";
  if (status === "HELD") return "warning";
  if (status === "CANCELLED" || status === "EXPIRED" || status === "NO_SHOW") return "danger";
  return "neutral";
}

function paymentBadge(guest: Guest): { label: string; tone: "success" | "neutral" | "warning" } {
  const intent = guest.paymentIntents[0];
  if (!intent) {
    return guest.status === "HELD"
      ? { label: "Awaiting payment", tone: "warning" }
      : { label: "—", tone: "neutral" };
  }
  if (intent.status === "SUCCEEDED") {
    return { label: `Paid · ${formatAmount(intent.amount)}`, tone: "success" };
  }
  if (intent.status === "REFUNDED") {
    return { label: "Refunded", tone: "neutral" };
  }
  return { label: "Awaiting payment", tone: "warning" };
}

const CANCELLED_STATUSES = new Set(["CANCELLED", "EXPIRED", "NO_SHOW"]);

type TabValue = "upcoming" | "past" | "cancelled";

export function GuestsTable({ guests, restaurantId }: GuestsTableProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabValue>("upcoming");
  const [dinnerFilter, setDinnerFilter] = useState("");
  const [quickViewGuest, setQuickViewGuest] = useState<GuestUser | null>(null);

  const dinnerOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const guest of guests) {
      if (!seen.has(guest.dinner.id)) {
        seen.set(guest.dinner.id, guest.dinner.theme?.title || "Dinner");
      }
    }
    return Array.from(seen.entries());
  }, [guests]);

  const now = Date.now();

  const matchesTab = (guest: Guest, t: TabValue) => {
    const isCancelled = CANCELLED_STATUSES.has(guest.status);
    const isUpcoming = new Date(guest.dinner.startsAt).getTime() > now;
    if (t === "cancelled") return isCancelled;
    if (isCancelled) return false;
    return t === "upcoming" ? isUpcoming : !isUpcoming;
  };

  const tabCounts = useMemo(
    () => ({
      upcoming: guests.filter((g) => matchesTab(g, "upcoming")).length,
      past: guests.filter((g) => matchesTab(g, "past")).length,
      cancelled: guests.filter((g) => matchesTab(g, "cancelled")).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guests, now]
  );

  const tabItems = [
    { value: "upcoming", label: `Upcoming (${tabCounts.upcoming})` },
    { value: "past", label: `Past (${tabCounts.past})` },
    { value: "cancelled", label: `Cancelled (${tabCounts.cancelled})` },
  ];

  const byTab = useMemo(
    () => guests.filter((guest) => matchesTab(guest, tab)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guests, tab, now]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return byTab.filter((guest) => {
      if (dinnerFilter && guest.dinner.id !== dinnerFilter) return false;
      if (!query) return true;
      const person = guest.confirmedByUser ?? guest.heldByUser;
      const name = [person?.firstName, person?.lastName].filter(Boolean).join(" ").toLowerCase();
      const email = person?.email.toLowerCase() ?? "";
      return name.includes(query) || email.includes(query);
    });
  }, [byTab, search, dinnerFilter]);

  if (guests.length === 0) {
    return (
      <Card padding="lg" className="text-center text-gray-600">
        No bookings yet.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          placeholder="Search by guest name or email..."
          value={search}
          onValueChange={setSearch}
          className="sm:w-72"
        />
        <select
          value={dinnerFilter}
          onChange={(e) => setDinnerFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
        >
          <option value="">All Dinners</option>
          {dinnerOptions.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
        <Tabs items={tabItems} value={tab} onChange={(v) => setTab(v as TabValue)} />
      </div>

      {/* Mobile: stacked cards. Desktop: table below. Same filtered data. */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <Card padding="lg" className="text-center text-gray-500">
            No guests match your search
          </Card>
        ) : (
          filtered.map((guest) => {
            const person = guest.confirmedByUser ?? guest.heldByUser;
            const name =
              [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
              person?.email ||
              "Unknown guest";
            const payment = paymentBadge(guest);
            const dinnerDate = new Date(guest.dinner.startsAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <RowCard
                key={guest.id}
                title={
                  person ? (
                    <button
                      type="button"
                      onClick={() => setQuickViewGuest(person)}
                      className="text-left hover:text-primary-600 hover:underline"
                    >
                      {name}
                    </button>
                  ) : (
                    name
                  )
                }
                subtitle={
                  <Link
                    href={`/admin/dinners/${guest.dinner.id}`}
                    className="hover:text-primary-600 hover:underline"
                  >
                    {guest.dinner.theme?.title || "Dinner"} · {dinnerDate}
                  </Link>
                }
                trailing={
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={statusTone(guest.status)}>{guest.status}</Badge>
                    <Badge tone={payment.tone}>{payment.label}</Badge>
                  </div>
                }
              />
            );
          })
        )}
      </div>

      <Card padding="none" className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-100 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Dinner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Dietary Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No guests match your search
                  </td>
                </tr>
              ) : (
                filtered.map((guest) => {
                  const person = guest.confirmedByUser ?? guest.heldByUser;
                  const name =
                    [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
                    person?.email ||
                    "Unknown guest";
                  const payment = paymentBadge(guest);

                  return (
                    <tr key={guest.id} className="hover:bg-cream-100 transition-colors">
                      <td className="px-6 py-4">
                        {person ? (
                          <button
                            type="button"
                            onClick={() => setQuickViewGuest(person)}
                            className="text-sm font-medium text-gray-900 hover:text-primary-600 hover:underline"
                          >
                            {name}
                          </button>
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{name}</div>
                        )}
                        {person && (
                          <div className="text-sm text-gray-500">{person.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/dinners/${guest.dinner.id}`}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          {guest.dinner.theme?.title || "Dinner"}
                        </Link>
                        <div className="text-sm text-gray-500">
                          {new Date(guest.dinner.startsAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {guest.dietaryNotes || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge tone={statusTone(guest.status)}>{guest.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge tone={payment.tone}>{payment.label}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {quickViewGuest && (
        <GuestQuickView
          open
          onClose={() => setQuickViewGuest(null)}
          restaurantId={restaurantId}
          guest={quickViewGuest}
        />
      )}
    </div>
  );
}
