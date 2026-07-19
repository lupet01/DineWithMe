"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant, RestaurantMember, User } from "@prisma/client";
import { approveRestaurant, pauseRestaurant, reactivateRestaurant } from "../actions";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type RestaurantWithMembers = Restaurant & {
  members: (RestaurantMember & { user: User })[];
};

interface RestaurantRowProps {
  restaurant: RestaurantWithMembers;
}

export function RestaurantRow({ restaurant }: RestaurantRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusTone = (status: string): "warning" | "success" | "danger" | "neutral" => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "ACTIVE":
        return "success";
      case "PAUSED":
        return "danger";
      default:
        return "neutral";
    }
  };

  const showToast = (success: boolean, msg: string) => {
    setMessage(msg);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };

  const owner = restaurant.members.find((m) => m.role === "OWNER")?.user;

  const handleApprove = async () => {
    if (isUpdating) return;

    const confirmed = confirm(
      `Are you sure you want to approve "${restaurant.name}"?\n\nThis will:\n• Set status to ACTIVE\n• Allow them to create dinners\n• Send approval email to owner`
    );
    if (!confirmed) return;

    setIsUpdating(true);
    const result = await approveRestaurant(restaurant.id);
    setIsUpdating(false);

    if (result.success) {
      showToast(true, `${restaurant.name} has been approved! Email sent to owner.`);
      router.refresh();
    } else {
      showToast(false, result.error || "Failed to approve restaurant");
    }
  };

  const handlePause = async () => {
    if (isUpdating) return;

    const reason = prompt(
      `Why are you pausing "${restaurant.name}"? (Optional)\n\nThis will prevent them from creating new dinners.`
    );
    if (reason === null) return; // User cancelled

    setIsUpdating(true);
    const result = await pauseRestaurant(restaurant.id, reason || undefined);
    setIsUpdating(false);

    if (result.success) {
      showToast(true, `${restaurant.name} has been paused.`);
      router.refresh();
    } else {
      showToast(false, result.error || "Failed to pause restaurant");
    }
  };

  const handleReactivate = async () => {
    if (isUpdating) return;

    const confirmed = confirm(
      `Are you sure you want to reactivate "${restaurant.name}"?`
    );
    if (!confirmed) return;

    setIsUpdating(true);
    const result = await reactivateRestaurant(restaurant.id);
    setIsUpdating(false);

    if (result.success) {
      showToast(true, `${restaurant.name} has been reactivated.`);
      router.refresh();
    } else {
      showToast(false, result.error || "Failed to reactivate restaurant");
    }
  };

  const canApprove = restaurant.status === "PENDING";
  const canPause = restaurant.status === "ACTIVE";
  const canReactivate = restaurant.status === "PAUSED";

  return (
    <>
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg flex items-start gap-3 max-w-md animate-in slide-in-from-top">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">{message}</p>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showError && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg flex items-start gap-3 max-w-md animate-in slide-in-from-top">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">{message}</p>
          </div>
        </div>
      )}

      <tr className="hover:bg-cream-100 transition-colors">
        {/* Restaurant */}
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900">
            {restaurant.name}
          </div>
          {restaurant.cuisine && (
            <div className="text-sm text-gray-500">{restaurant.cuisine}</div>
          )}
        </td>

        {/* Owner */}
        <td className="px-6 py-4">
          {owner ? (
            <div>
              <div className="text-sm text-gray-900">
                {owner.firstName} {owner.lastName}
              </div>
              <div className="text-sm text-gray-500">{owner.email}</div>
            </div>
          ) : (
            <span className="text-sm text-gray-400">No owner</span>
          )}
        </td>

        {/* Location */}
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900">
            {restaurant.city || "Not specified"}
          </div>
          {restaurant.address && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {restaurant.address}
            </div>
          )}
        </td>

        {/* Status */}
        <td className="px-6 py-4 whitespace-nowrap">
          <Badge tone={getStatusTone(restaurant.status)}>{restaurant.status}</Badge>
        </td>

        {/* Created */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-600">
            {formatDate(restaurant.createdAt)}
          </div>
        </td>

        {/* Actions */}
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
          <div className="flex items-center justify-end gap-2">
            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={isUpdating}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isUpdating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve"
                )}
              </button>
            )}

            {canPause && (
              <button
                onClick={handlePause}
                disabled={isUpdating}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pause
              </button>
            )}

            {canReactivate && (
              <button
                onClick={handleReactivate}
                disabled={isUpdating}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reactivate
              </button>
            )}

            {!canApprove && !canPause && !canReactivate && (
              <span className="text-xs text-gray-400">No actions</span>
            )}
          </div>
        </td>
      </tr>
    </>
  );
}
