"use client";

import { useState } from "react";
import Link from "next/link";
import { formatAmount } from "@dinewithme/config/src/payment";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "../../../components/confirm-modal";
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
  /** COMPLETED dinner: renders as a read-only results row (dietary/check-in/rating) instead of the live check-in/payment/actions row. */
  isCompleted?: boolean;
  rating?: number;
}

function statusBadgeClass(status: string): string {
  if (status === "ATTENDED" || status === "COMPLETED") return "badge-green";
  if (status === "CONFIRMED") return "badge-blue";
  if (status === "NO_SHOW") return "badge-red";
  return "badge-slate";
}

export function GuestRow({
  dinnerId,
  seat,
  canRefund,
  isPlatformAdmin,
  isCompleted = false,
  rating,
}: GuestRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const { toast } = useToast();

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
      toast.error(result.error || "Failed to check in guest");
    } else {
      toast.success("Guest checked in");
    }
  };

  const handleRefund = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const result = await refundSeat(dinnerId, seat.id);
    setIsUpdating(false);
    if (!result.success) {
      toast.error(result.error || "Failed to refund seat");
    } else {
      toast.success("Booking refunded");
    }
  };

  const canCheckIn = seat.status === "CONFIRMED";
  const payment = paymentBadge(seat);

  const nameCell = (
    <td>
      {guest && isPlatformAdmin ? (
        <Link href={`/admin/ops/users/${guest.id}`} className="td-strong" style={{ textDecoration: "none" }}>
          {name}
        </Link>
      ) : guest ? (
        <Link href={`/admin/guests/${guest.id}`} className="td-strong" style={{ textDecoration: "none" }}>
          {name}
        </Link>
      ) : (
        <div className="td-strong">{name}</div>
      )}
      {guest && !isCompleted && <div className="td-muted">{guest.email}</div>}
    </td>
  );

  if (isCompleted) {
    const isNoShow = seat.status === "NO_SHOW";
    return (
      <tr style={isNoShow ? { opacity: 0.6 } : undefined}>
        {nameCell}
        <td style={{ color: "var(--t2)" }}>{seat.dietaryNotes || "—"}</td>
        <td>
          <span className={`badge ${statusBadgeClass(seat.status)}`}>{seat.status}</span>
        </td>
        <td className="r">
          {rating != null ? (
            <span style={{ fontWeight: 700, color: "var(--yellow-txt)" }}>{rating.toFixed(1)} ★</span>
          ) : (
            <span style={{ color: "var(--t3)" }}>—</span>
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      {nameCell}
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
            <button onClick={handleCheckIn} disabled={isUpdating} className="btn btn-green">
              Check In
            </button>
          )}
          {canRefund && (
            <button onClick={() => setRefundOpen(true)} disabled={isUpdating} className="btn btn-sm btn-red">
              Refund
            </button>
          )}
          {!canCheckIn && !canRefund && (
            <span style={{ fontSize: 12, color: "var(--t3)" }}>No actions</span>
          )}
        </div>
        <ConfirmModal
          open={refundOpen}
          onClose={() => setRefundOpen(false)}
          onConfirm={async () => {
            await handleRefund();
            setRefundOpen(false);
          }}
          tone="red"
          title={`Refund ${name}'s booking?`}
          description="The guest is refunded for this seat and their booking is released."
          consequences={["This can't be undone"]}
          confirmLabel="Refund Booking"
        />
      </td>
    </tr>
  );
}
