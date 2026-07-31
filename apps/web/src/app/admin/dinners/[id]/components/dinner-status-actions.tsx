"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateDinnerStatus, cancelDinner } from "../../actions";

interface DinnerStatusActionsProps {
  dinnerId: string;
  status: string;
}

export function DinnerStatusActions({ dinnerId, status }: DinnerStatusActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleMarkLive = () => {
    if (isUpdating) return;
    void runAction(updateDinnerStatus(dinnerId, "LIVE"));
  };

  const handleCancel = () => {
    if (isUpdating) return;
    const confirmed = confirm(
      "Cancel this dinner? All held and confirmed seats will be released."
    );
    if (!confirmed) return;
    void runAction(cancelDinner(dinnerId));
  };

  if (status !== "SCHEDULED" && status !== "LIVE") {
    return null;
  }

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      {status === "SCHEDULED" && (
        <button
          type="button"
          onClick={handleMarkLive}
          disabled={isUpdating}
          className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-200 disabled:opacity-50"
        >
          → Mark LIVE
        </button>
      )}
      <button
        type="button"
        onClick={handleCancel}
        disabled={isUpdating}
        className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
      >
        Cancel Dinner
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
