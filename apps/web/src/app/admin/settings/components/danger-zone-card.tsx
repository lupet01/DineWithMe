"use client";

import { useState } from "react";

interface DangerZoneCardProps {
  pendingClosureRequest: { id: string; reason: string } | null;
  onSubmitClosure: (reason: string) => void;
  onCancelClosure: () => void;
  isPending: boolean;
}

export function DangerZoneCard({
  pendingClosureRequest,
  onSubmitClosure,
  onCancelClosure,
  isPending,
}: DangerZoneCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitClosure(reason);
    setReason("");
    setShowForm(false);
  };

  return (
    <div className="card card-pad danger-zone-card">
      <div className="card-title danger-zone-title" style={{ padding: 0, marginBottom: 4 }}>
        Danger Zone
      </div>
      <p className="danger-zone-body" style={{ fontSize: 12.5, marginBottom: 14 }}>
        Closing your restaurant is permanent-track, not instant — it affects existing bookings,
        payout history, and guest records, so it goes to Platform Ops for review rather than
        taking effect immediately.
      </p>

      {pendingClosureRequest ? (
        <div className="danger-zone-pending">
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Closure request pending review</p>
          <p style={{ fontSize: 13, margin: "4px 0 0" }}>&quot;{pendingClosureRequest.reason}&quot;</p>
          <button
            type="button"
            onClick={onCancelClosure}
            disabled={isPending}
            className="danger-zone-cancel-link"
          >
            Cancel request
          </button>
        </div>
      ) : showForm ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            placeholder="Tell us why you're closing your restaurant..."
            disabled={isPending}
            className="field-input ta"
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="submit"
              disabled={isPending || !reason.trim()}
              className="btn btn-red btn-sm"
            >
              {isPending ? "Submitting…" : "Submit Closure Request"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={isPending}
              className="danger-zone-cancel-link"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn btn-outline danger-zone-btn"
        >
          Request to Close This Restaurant
        </button>
      )}
    </div>
  );
}
