"use client";

import { useState } from "react";
import Link from "next/link";
import { formatAmount } from "@dinewithme/config/src/payment";
import { Badge } from "@/components/ui/badge";
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

function paymentBadge(seat: Seat): { label: string; tone: "success" | "neutral" | "warning" } {
  const intent = seat.paymentIntents[0];
  if (!intent) {
    return { label: "—", tone: "neutral" };
  }
  if (intent.status === "SUCCEEDED") {
    return { label: `Paid · ${formatAmount(intent.amount)}`, tone: "success" };
  }
  if (intent.status === "REFUNDED") {
    return { label: "Refunded", tone: "neutral" };
  }
  return { label: "Awaiting payment", tone: "warning" };
}

interface GuestRowProps {
  dinnerId: string;
  restaurantId: string;
  seat: Seat;
  canRefund: boolean;
  isPlatformAdmin: boolean;
}

function statusTone(status: string): "primary" | "success" | "neutral" {
  if (status === "ATTENDED" || status === "COMPLETED") return "success";
  if (status === "CONFIRMED") return "primary";
  return "neutral";
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

  return (
    <tr className="hover:bg-cream-100 transition-colors">
      <td className="px-6 py-4">
        {guest && isPlatformAdmin ? (
          <Link
            href={`/admin/ops/users/${guest.id}`}
            className="text-sm font-medium text-gray-900 hover:text-primary-600 hover:underline"
          >
            {name}
          </Link>
        ) : guest ? (
          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            className="text-sm font-medium text-gray-900 hover:text-primary-600 hover:underline"
          >
            {name}
          </button>
        ) : (
          <div className="text-sm font-medium text-gray-900">{name}</div>
        )}
        {guest && <div className="text-sm text-gray-500">{guest.email}</div>}
        {guest && !isPlatformAdmin && (
          <GuestQuickView
            open={quickViewOpen}
            onClose={() => setQuickViewOpen(false)}
            restaurantId={restaurantId}
            guest={guest}
          />
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
        {seat.dietaryNotes || "—"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge tone={statusTone(seat.status)}>{seat.status}</Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge tone={paymentBadge(seat).tone}>{paymentBadge(seat).label}</Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <div className="flex items-center justify-end gap-2">
          {canCheckIn && (
            <button
              onClick={handleCheckIn}
              disabled={isUpdating}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check In
            </button>
          )}
          {canRefund && (
            <button
              onClick={handleRefund}
              disabled={isUpdating}
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refund
            </button>
          )}
          {!canCheckIn && !canRefund && (
            <span className="text-xs text-gray-400">No actions</span>
          )}
        </div>
      </td>
    </tr>
  );
}
