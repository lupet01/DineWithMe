"use client";

import { useState } from "react";
import { ConfirmModal } from "../../components/confirm-modal";
import { useToast } from "@/components/ui/toast";

interface PauseListingCardProps {
  status: "PENDING" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  onPause: (reason?: string) => void;
  onReactivate: () => void;
  isPending: boolean;
}

export function PauseListingCard({ status, onPause, onReactivate, isPending }: PauseListingCardProps) {
  const { toast } = useToast();
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const isPaused = status === "PAUSED";
  const disabled = isPending || status === "PENDING" || status === "ARCHIVED";

  // onPause/onReactivate are fire-and-forget (the parent runs them inside a
  // transition and surfaces failures via its own alert), so these toasts are
  // optimistic success feedback for the common path — matching the wireframe's
  // instant-toggle intent.
  const handleClick = () => {
    if (disabled) return;
    if (isPaused) {
      setReactivateOpen(true);
      return;
    }
    const reason = prompt("Why are you pausing your restaurant? (Optional)");
    if (reason === null) return;
    onPause(reason || undefined);
    toast.success("Listing paused");
  };

  const handleReactivate = () => {
    onReactivate();
    setReactivateOpen(false);
    toast.success("Listing reactivated");
  };

  return (
    <>
      <div className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
        <div>
          <div className="card-title" style={{ padding: 0, marginBottom: 2 }}>
            Pause Listing
          </div>
          <div style={{ fontSize: 12.5, color: "var(--t2)" }}>
            Temporarily hide all your dinners from Discover — existing bookings are unaffected,
            unpause any time. For a single dinner, use Cancel on that dinner instead.
          </div>
          {status === "PENDING" && (
            <div className="pause-listing-note">Available once your restaurant is approved and live.</div>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPaused}
          aria-label="Pause Listing"
          onClick={handleClick}
          disabled={disabled}
          className={`toggle ${isPaused ? "on" : "off"}`}
          style={{ flexShrink: 0, opacity: disabled ? 0.5 : 1 }}
        >
          <span className="toggle-dot" />
        </button>
      </div>
      </div>

      <ConfirmModal
        open={reactivateOpen}
        onClose={() => setReactivateOpen(false)}
        onConfirm={handleReactivate}
        tone="green"
        title="Reactivate Listing"
        description="Reactivate your restaurant? Your dinners will be visible to diners on Discover again."
        confirmLabel="Reactivate"
        cancelLabel="Keep Paused"
      />
    </>
  );
}
