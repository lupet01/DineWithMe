"use client";

import { useState, useEffect } from "react";
import type { DinnerWithRestaurant } from "@dinewithme/db";
import { Badge } from "@/components/ui/badge";
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

  const getStatusTone = (status: string): "primary" | "success" | "danger" | "neutral" => {
    switch (status) {
      case "SCHEDULED":
        return "primary";
      case "LIVE":
        return "success";
      case "CANCELLED":
        return "danger";
      case "COMPLETED":
      default:
        return "neutral";
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
    <tr className="hover:bg-cream-100 transition-colors">
      {/* Date & Time */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {formatDate(dinner.startsAt)}
        </div>
        <div className="text-sm text-gray-500">
          {formatTime(dinner.startsAt)} - {formatTime(dinner.endsAt)}
        </div>
      </td>

      {/* Theme */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          {dinner.theme?.title || "No theme"}
        </div>
        {dinner.description && (
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {dinner.description}
          </div>
        )}
      </td>

      {/* Seats */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          <span className="font-medium">{seatCounts.confirmed}</span>
          <span className="text-gray-500"> / {dinner.seatCount}</span>
        </div>
        <div className="text-xs text-gray-500">
          {seatCounts.available} available
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge tone={getStatusTone(dinner.status)}>{dinner.status}</Badge>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <div className="flex items-center justify-end gap-2">
          {canMarkLive && (
            <button
              onClick={() => handleStatusChange("LIVE")}
              disabled={isUpdating}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark Live
            </button>
          )}

          {canMarkCompleted && (
            <button
              onClick={() => handleStatusChange("COMPLETED")}
              disabled={isUpdating}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-cream-200 rounded-lg hover:bg-cream-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete
            </button>
          )}

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}

          {!canMarkLive && !canMarkCompleted && !canCancel && (
            <span className="text-xs text-gray-400">No actions</span>
          )}
        </div>
      </td>
    </tr>
  );
}
