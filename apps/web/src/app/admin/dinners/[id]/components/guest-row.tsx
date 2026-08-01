"use client";

import { useState } from "react";
import Link from "next/link";
import { formatAmount } from "@dinewithme/config/src/payment";
import { GuestQuickView } from "@/app/admin/components/guest-quick-view";
import { checkInGuest, refundSeat } from "../actions";

interface Seat {
  id: string;
  status: string;
  dietaryNotes: string | null;
  checkedInAt: Date | null;
  confirmedByUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  paymentIntents: Array<{ status: string; amount: number }>;
}

function paymentBadge(seat: Seat): { label: string; badgeClass: string } {
  const intent = seat.paymentIntents[0];
  if (!intent) {
    return { label: "—", badgeClass: "badge-slate" };
  }
  if (intent.status === "SUCCEEDED") {
    return { label: `Paid · ${formatAmount(intent.amount)}`, badgeClass: "badge-green" };
  }
  if (intent.status === "REFUNDED") {
    return { label: "Refunded", badgeClass: "badge-slate" };
  }
  return { label: "Awaiting payment", badgeClass: "badge-yellow" };
}

interface GuestRowProps {
  dinnerId: string;
  restaurantId: string;
  seat: Seat;
  canRefund: boolean;
  isPlatformAdmin: boolean;
}

function statusBadgeClass(status: string): string {
  if (status === "ATTENDED" || status === "COMPLETED") return "badge-green";
  if (status === "CONFIRMED") return "badge-blue";
  return "badge-slate";
}

export function GuestRow({
  dinnerId,
  restaurantId,
  seat,
  canRefund,
  isPlatformAdmin,
}: GuestRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const guest = seat.confirmedByUser;
  const name = guest
    ? [guest.firstName, guest.lastName].filter(Boolean).join(" ") || guest.email
    : "Unknown guest";

  const handleCheckIn = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const result = await checkInGuest(dinnerId, seat.id);
    setIsUpdating(false);
    if (!result.success) {
      alert(result.error || "Failed to check in guest");
    }
  };

  const handleRefund = async () => {
    if (isUpdating) return;
    const confirmed = confirm(`Refund ${name}'s booking? This cannot be undone.`);
    if (!confirmed) return;

    setIsUpdating(true);
    const result = await refundSeat(dinnerId, seat.id);
    setIsUpdating(false);
    if (!result.success) {
      alert(result.error || "Failed to refund seat");
    } else {
      alert("Refund issued.");
    }
  };

  const canCheckIn = seat.status === "CONFIRMED";
  const payment = paymentBadge(seat);

  return (
    <tr>
      <td>
        {guest && isPlatformAdmin ? (
          <Link href={`/admin/ops/users/${guest.id}`} className="td-strong" style={{ textDecoration: "none" }}>
            {name}
          </Link>
        ) : guest ? (
          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            className="td-strong"
            style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}
          >
            {name}
          </button>
        ) : (
          <div className="td-strong">{name}</div>
        )}
        {guest && <div className="td-muted">{guest.email}</div>}
        {guest && !isPlatformAdmin && (
          <GuestQuickView
            open={quickViewOpen}
            onClose={() => setQuickViewOpen(false)}
            restaurantId={restaurantId}
            guest={guest}
          />
        )}
      </td>
      <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--t2)" }}>
        {seat.dietaryNotes || "—"}
      </td>
      <td>
        <span className={`badge ${statusBadgeClass(seat.status)}`}>{seat.status}</span>
      </td>
      <td>
        <span className={`badge ${payment.badgeClass}`}>{payment.label}</span>
      </td>
      <td>
        <div className="td-actions">
          {canCheckIn && (
            <button onClick={handleCheckIn} disabled={isUpdating} className="btn btn-sm btn-green">
              Check In
            </button>
          )}
          {canRefund && (
            <button onClick={handleRefund} disabled={isUpdating} className="btn btn-sm btn-red">
              Refund
            </button>
          )}
          {!canCheckIn && !canRefund && (
            <span style={{ fontSize: 12, color: "var(--t3)" }}>No actions</span>
          )}
        </div>
      </td>
    </tr>
  );
}
