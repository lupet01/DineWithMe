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
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      {status === "SCHEDULED" && (
        <button type="button" onClick={handleMarkLive} disabled={isUpdating} className="btn btn-green btn-sm">
          → Mark LIVE
        </button>
      )}
      <button type="button" onClick={handleCancel} disabled={isUpdating} className="btn btn-red btn-sm">
        Cancel Dinner
      </button>
      {error && <p style={{ fontSize: 12, color: "var(--red-txt)" }}>{error}</p>}
    </div>
  );
}
