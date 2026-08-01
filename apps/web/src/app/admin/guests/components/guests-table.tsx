"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpDown } from "lucide-react";
import { formatAmount } from "@dinewithme/config/src/payment";
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

function statusBadgeClass(status: string): string {
  if (status === "CONFIRMED") return "badge-green";
  if (status === "HELD") return "badge-blue";
  if (status === "ATTENDED" || status === "COMPLETED") return "badge-slate";
  if (status === "CANCELLED" || status === "EXPIRED" || status === "NO_SHOW") return "badge-red";
  return "badge-slate";
}

function paymentBadge(guest: Guest): { label: string; className: string } {
  const intent = guest.paymentIntents[0];
  if (!intent) {
    return guest.status === "HELD"
      ? { label: "Awaiting payment", className: "badge-slate" }
      : { label: "—", className: "badge-slate" };
  }
  if (intent.status === "SUCCEEDED") {
    return { label: `Paid · ${formatAmount(intent.amount)}`, className: "badge-green" };
  }
  if (intent.status === "REFUNDED") {
    return { label: "Refunded", className: "badge-slate" };
  }
  return { label: "Awaiting payment", className: "badge-slate" };
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
      <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px" }}>
        <div className="card-title" style={{ marginBottom: 6 }}>
          No bookings yet
        </div>
        <p style={{ fontSize: 13, color: "var(--t3)" }}>
          Guests who book a table at your dinners will show up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="search-toolbar">
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            className="field-input"
            placeholder="Search by guest name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
          />
        </div>
        <select
          className="field-input"
          style={{ width: "auto" }}
          value={dinnerFilter}
          onChange={(e) => setDinnerFilter(e.target.value)}
        >
          <option value="">All Dinners</option>
          {dinnerOptions.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
        <div className="tabs">
          {tabItems.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`tab ${tab === item.value ? "active" : ""}`}
              onClick={() => setTab(item.value as TabValue)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: stacked row-cards. Desktop: table. Same filtered data. */}
      <div className="only-mobile">
        {filtered.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", color: "var(--t3)" }}>
            No guests match your search
          </div>
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
            });

            return (
              <div key={guest.id} className="row-card">
                <div className="rc-top">
                  <div>
                    <div className="rc-title">
                      {person ? (
                        <button
                          type="button"
                          onClick={() => setQuickViewGuest(person)}
                          style={{ color: "inherit", background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}
                        >
                          {name}
                        </button>
                      ) : (
                        name
                      )}
                    </div>
                    <div className="rc-sub">
                      {guest.dinner.theme?.title || "Dinner"} · {dinnerDate}
                    </div>
                  </div>
                  <span className={`badge ${statusBadgeClass(guest.status)}`}>{guest.status}</span>
                </div>
                <div className="rc-meta">
                  {person?.email || "—"} · <span className={`badge ${payment.className}`}>{payment.label}</span>
                </div>
                <div className="rc-actions">
                  <Link
                    href={`/admin/dinners/${guest.dinner.id}`}
                    className="btn btn-sm btn-outline"
                    style={{ flex: 1, textAlign: "center" }}
                  >
                    View Dinner
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="only-desktop table-wrap">
        <div className="table-scroll">
          <table className="dtable">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Dinner</th>
                <th style={{ cursor: "pointer" }}>
                  Date <ArrowUpDown className="h-3 w-3" style={{ display: "inline", marginLeft: 2, color: "var(--t3)" }} />
                </th>
                <th>Seat Status</th>
                <th>Payment</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--t3)" }}>
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
                    <tr key={guest.id}>
                      <td>
                        {person ? (
                          <button
                            type="button"
                            onClick={() => setQuickViewGuest(person)}
                            className="td-strong"
                            style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}
                          >
                            {name}
                          </button>
                        ) : (
                          <div className="td-strong">{name}</div>
                        )}
                        {person && <div className="td-muted">{person.email}</div>}
                      </td>
                      <td>
                        <Link href={`/admin/dinners/${guest.dinner.id}`} style={{ fontSize: 13, color: "var(--p)", fontWeight: 600 }}>
                          {guest.dinner.theme?.title || "Dinner"}
                        </Link>
                      </td>
                      <td>
                        <div className="td-muted" style={{ marginTop: 0 }}>
                          {new Date(guest.dinner.startsAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass(guest.status)}`}>{guest.status}</span>
                      </td>
                      <td>
                        <span className={`badge ${payment.className}`}>{payment.label}</span>
                      </td>
                      <td>
                        <div className="td-actions">
                          <Link href={`/admin/dinners/${guest.dinner.id}`} className="btn btn-sm btn-outline">
                            View Dinner
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
