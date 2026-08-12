"use client";

import { useToast } from "@/components/ui/toast";

interface PauseListingCardProps {
  status: "PENDING" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  onPause: (reason?: string) => void;
  onReactivate: () => void;
  isPending: boolean;
}

export function PauseListingCard({ status, onPause, onReactivate, isPending }: PauseListingCardProps) {
  const { toast } = useToast();
  const isPaused = status === "PAUSED";
  const disabled = isPending || status === "PENDING" || status === "ARCHIVED";

  // The wireframe's Pause Listing is a bare instant/reversible toggle — no
  // reason prompt, no confirm dialog in either direction. onPause/onReactivate
  // are fire-and-forget (the parent runs them inside a transition and surfaces
  // failures via its own alert), so these toasts are optimistic success
  // feedback for the common path.
  const handleClick = () => {
    if (disabled) return;
    if (isPaused) {
      onReactivate();
      toast.success("Listing reactivated");
    } else {
      onPause();
      toast.success("Listing paused");
    }
  };

  return (
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
  );
}
