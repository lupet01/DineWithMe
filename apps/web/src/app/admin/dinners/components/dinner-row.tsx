"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DinnerWithRestaurant } from "@dinewithme/db";
import { updateDinnerStatus, cancelDinner } from "../actions";

interface DinnerRowProps {
  dinner: DinnerWithRestaurant;
}

export function DinnerRow({ dinner }: DinnerRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [seatCounts, setSeatCounts] = useState({ confirmed: 0, available: 0 });

  // Fetch seat counts for this dinner
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadgeClass = (status: string): string => {
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
  };

  const handleStatusChange = async (newStatus: "LIVE" | "COMPLETED") => {
    if (isUpdating) return;

    const confirmed = confirm(
      `Are you sure you want to mark this dinner as ${newStatus}?`
    );
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

    const confirmed = confirm(
      "Are you sure you want to cancel this dinner? All seats will be released."
    );
    if (!confirmed) return;

    setIsUpdating(true);
    const result = await cancelDinner(dinner.id);
    setIsUpdating(false);

    if (!result.success) {
      alert(result.error || "Failed to cancel dinner");
    }
  };

  const canMarkLive = dinner.status === "SCHEDULED";
  const canMarkCompleted = dinner.status === "LIVE";
  const canCancel = dinner.status === "SCHEDULED" || dinner.status === "LIVE";

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
