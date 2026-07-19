"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveRestaurant,
  pauseRestaurant,
  reactivateRestaurant,
} from "../../actions";

interface RestaurantStatusActionsProps {
  restaurantId: string;
  restaurantName: string;
  status: string;
}

export function RestaurantStatusActions({
  restaurantId,
  restaurantName,
  status,
}: RestaurantStatusActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canApprove = status === "PENDING";
  const canPause = status === "ACTIVE";
  const canReactivate = status === "PAUSED";

  const runAction = async (result: Promise<{ success: boolean; error?: string }>) => {
    setIsUpdating(true);
    setError(null);
    const res = await result;
    setIsUpdating(false);
    if (!res.success) {
      setError(res.error || "Action failed");
      return;
    }
    router.refresh();
  };

  const handleApprove = () => {
    if (isUpdating) return;
    const confirmed = confirm(`Approve "${restaurantName}"? This sets status to ACTIVE.`);
    if (!confirmed) return;
    void runAction(approveRestaurant(restaurantId));
  };

  const handlePause = () => {
    if (isUpdating) return;
    const reason = prompt(`Why are you pausing "${restaurantName}"? (Optional)`);
    if (reason === null) return;
    void runAction(pauseRestaurant(restaurantId, reason || undefined));
  };

  const handleReactivate = () => {
    if (isUpdating) return;
    const confirmed = confirm(`Reactivate "${restaurantName}"?`);
    if (!confirmed) return;
    void runAction(reactivateRestaurant(restaurantId));
  };

  if (!canApprove && !canPause && !canReactivate) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {canApprove && (
        <button
          onClick={handleApprove}
          disabled={isUpdating}
          className="rounded-full px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          Approve
        </button>
      )}
      {canPause && (
        <button
          onClick={handlePause}
          disabled={isUpdating}
          className="rounded-full px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          Pause
        </button>
      )}
      {canReactivate && (
        <button
          onClick={handleReactivate}
          disabled={isUpdating}
          className="rounded-full px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          Reactivate
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
