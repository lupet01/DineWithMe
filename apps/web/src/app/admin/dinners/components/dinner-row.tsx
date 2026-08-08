"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DinnerWithRestaurant } from "@dinewithme/db";
import { updateDinnerStatus, cancelDinner } from "../actions";

interface DinnerRowProps {
  dinner: DinnerWithRestaurant;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return "badge-blue";
    case "LIVE":
      return "badge-green";
    case "CANCELLED":
      return "badge-red";
    case "COMPLETED":
    default:
      return "badge-slate";
  }
}

/**
 * Shared state/actions behind both the desktop table row and the mobile
 * row-card (§16.3 wireframe's "Mobile adaptation" note - same data, same
 * actions, just two different renderings) so seat-count fetching and the
 * Mark Live / Complete / Cancel handlers aren't duplicated.
 */
function useDinnerRowState(dinner: DinnerWithRestaurant) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [seatCounts, setSeatCounts] = useState({ confirmed: 0, available: 0 });

  useEffect(() => {
    async function fetchSeatCounts() {
      try {
        const response = await fetch(`/api/dinners/${dinner.id}/seats`);
        if (response.ok) {
          const data = await response.json();
          setSeatCounts({
            confirmed: data.confirmed || 0,
            available: data.available || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch seat counts:", error);
      }
    }
    fetchSeatCounts();
  }, [dinner.id]);

  const handleStatusChange = async (newStatus: "LIVE" | "COMPLETED") => {
    if (isUpdating) return;
    const confirmed = confirm(`Are you sure you want to mark this dinner as ${newStatus}?`);
    if (!confirmed) return;

    setIsUpdating(true);
    const result = await updateDinnerStatus(dinner.id, newStatus);
    setIsUpdating(false);

    if (!result.success) {
      alert(result.error || "Failed to update dinner status");
    }
  };

  const handleCancel = async () => {
    if (isUpdating) return;
    const confirmed = confirm("Are you sure you want to cancel this dinner? All seats will be released.");
    if (!confirmed) return;

    setIsUpdating(true);
    const result = await cancelDinner(dinner.id);
    setIsUpdating(false);

    if (!result.success) {
      alert(result.error || "Failed to cancel dinner");
    }
  };

  return {
    isUpdating,
    seatCounts,
    handleStatusChange,
    handleCancel,
    canMarkLive: dinner.status === "SCHEDULED",
    canMarkCompleted: dinner.status === "LIVE",
    canCancel: dinner.status === "SCHEDULED" || dinner.status === "LIVE",
  };
}

export function DinnerRow({ dinner }: DinnerRowProps) {
  const { isUpdating, seatCounts, handleStatusChange, handleCancel, canMarkLive, canMarkCompleted, canCancel } =
    useDinnerRowState(dinner);

  return (
    <tr>
      {/* Date & Time */}
      <td>
        <div className="td-strong">{formatDate(dinner.startsAt)}</div>
        <div className="td-muted">
          {formatTime(dinner.startsAt)} - {formatTime(dinner.endsAt)}
        </div>
      </td>

      {/* Theme */}
      <td>
        <div>{dinner.theme?.title || "No theme"}</div>
        {dinner.description && (
          <div className="td-muted" style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {dinner.description}
          </div>
        )}
      </td>

      {/* Seats */}
      <td>
        <div>
          <span className="td-strong">{seatCounts.confirmed}</span>
          <span className="td-muted"> / {dinner.seatCount}</span>
        </div>
        <div className="td-muted">{seatCounts.available} available</div>
      </td>

      {/* Status */}
      <td>
        <span className={`badge ${getStatusBadgeClass(dinner.status)}`}>{dinner.status}</span>
      </td>

      {/* Actions */}
      <td>
        <div className="td-actions">
          <Link href={`/admin/dinners/${dinner.id}`} className="btn btn-outline btn-sm">
            View
          </Link>
          {(canMarkLive || canMarkCompleted) && (
            <Link href={`/admin/dinners/${dinner.id}/edit`} className="btn btn-outline btn-sm">
              Edit
            </Link>
          )}
          {canMarkLive && (
            <button
              onClick={() => handleStatusChange("LIVE")}
              disabled={isUpdating}
              className="btn btn-green btn-sm"
            >
              Mark Live
            </button>
          )}

          {canMarkCompleted && (
            <button
              onClick={() => handleStatusChange("COMPLETED")}
              disabled={isUpdating}
              className="btn btn-outline btn-sm"
            >
              Complete
            </button>
          )}

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="btn btn-red btn-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * Mobile row-card: the 5-column table collapses to a stacked card per
 * dinner (§16.3 wireframe) - date/theme up top, status badge inline, seat
 * count as plain text, action buttons full-width side by side.
 */
export function DinnerRowCard({ dinner }: DinnerRowProps) {
  const { isUpdating, seatCounts, handleStatusChange, handleCancel, canMarkLive, canMarkCompleted, canCancel } =
    useDinnerRowState(dinner);

  const seatSummary =
    seatCounts.available === 0 && seatCounts.confirmed > 0
      ? "full"
      : `${seatCounts.available} available`;

  return (
    <div className="row-card">
      <div className="rc-top">
        <div>
          <div className="rc-title">{dinner.theme?.title || "No theme"}</div>
          <div className="rc-sub">
            {formatShortDate(dinner.startsAt)} · {formatTime(dinner.startsAt)}–{formatTime(dinner.endsAt)}
          </div>
        </div>
        <span className={`badge ${getStatusBadgeClass(dinner.status)}`}>{dinner.status}</span>
      </div>
      <div className="rc-meta">
        {seatCounts.confirmed} / {dinner.seatCount} booked · {seatSummary}
      </div>
      <div className="rc-actions">
        <Link href={`/admin/dinners/${dinner.id}`} className="btn btn-sm btn-outline" style={{ flex: 1, textAlign: "center" }}>
          View
        </Link>
        {(canMarkLive || canMarkCompleted) && (
          <Link href={`/admin/dinners/${dinner.id}/edit`} className="btn btn-sm btn-outline" style={{ flex: 1, textAlign: "center" }}>
            Edit
          </Link>
        )}
        {canMarkLive && (
          <button
            onClick={() => handleStatusChange("LIVE")}
            disabled={isUpdating}
            className="btn btn-sm btn-green"
            style={{ flex: 1 }}
          >
            Mark Live
          </button>
        )}
        {canMarkCompleted && (
          <button
            onClick={() => handleStatusChange("COMPLETED")}
            disabled={isUpdating}
            className="btn btn-sm btn-outline"
            style={{ flex: 1 }}
          >
            Complete
          </button>
        )}
        {canCancel && (
          <button onClick={handleCancel} disabled={isUpdating} className="btn btn-sm btn-red" style={{ flex: 1 }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
