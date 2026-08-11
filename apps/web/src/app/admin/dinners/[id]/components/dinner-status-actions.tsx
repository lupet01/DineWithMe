"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "../../../components/confirm-modal";
import { updateDinnerStatus, cancelDinner } from "../../actions";

interface DinnerStatusActionsProps {
  dinnerId: string;
  status: string;
  dinnerLabel: string;
  /** "bar": buttons share a full-width row (the mobile sticky action bar). */
  layout?: "inline" | "bar";
}

type OpenModal = "markLive" | "complete" | "cancel" | null;

export function DinnerStatusActions({ dinnerId, status, dinnerLabel, layout = "inline" }: DinnerStatusActionsProps) {
  const router = useRouter();
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (result: Promise<{ success: boolean; error?: string }>) => {
    setError(null);
    const res = await result;
    if (!res.success) {
      setError(res.error || "Action failed");
      throw new Error(res.error || "Action failed");
    }
    setOpenModal(null);
    router.refresh();
  };

  if (status !== "SCHEDULED" && status !== "LIVE") {
    return null;
  }

  const barStyle = layout === "bar" ? { flex: 1 } : undefined;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, width: layout === "bar" ? "100%" : undefined }}>
      {status === "SCHEDULED" && (
        <button type="button" onClick={() => setOpenModal("markLive")} className="btn btn-green btn-sm" style={barStyle}>
          → Mark LIVE
        </button>
      )}
      {status === "LIVE" && (
        <button type="button" onClick={() => setOpenModal("complete")} className="btn btn-outline btn-sm" style={barStyle}>
          Complete
        </button>
      )}
      <button type="button" onClick={() => setOpenModal("cancel")} className="btn btn-red btn-sm" style={barStyle}>
        Cancel Dinner
      </button>
      {error && <p style={{ fontSize: 12, color: "var(--red-txt)" }}>{error}</p>}

      <ConfirmModal
        open={openModal === "markLive"}
        onClose={() => setOpenModal(null)}
        onConfirm={() => runAction(updateDinnerStatus(dinnerId, "LIVE"))}
        tone="green"
        title="Mark dinner as Live?"
        description={`You're about to mark ${dinnerLabel} as LIVE. This tells guests their dinner is happening and unlocks check-in. You can't undo this to go back to Scheduled.`}
        confirmLabel="→ Mark as LIVE"
        cancelLabel="Cancel"
      />

      <ConfirmModal
        open={openModal === "complete"}
        onClose={() => setOpenModal(null)}
        onConfirm={() => runAction(updateDinnerStatus(dinnerId, "COMPLETED"))}
        tone="green"
        title="Mark dinner as completed?"
        description={`${dinnerLabel} will move to your results view — attendance, revenue, and payout status replace the live check-in tools. This can't be undone.`}
        confirmLabel="Mark Completed"
        cancelLabel="Not Yet"
      />

      <ConfirmModal
        open={openModal === "cancel"}
        onClose={() => setOpenModal(null)}
        onConfirm={(reason) => runAction(cancelDinner(dinnerId, reason))}
        tone="red"
        title="Cancel this dinner?"
        description={`You're cancelling ${dinnerLabel}.`}
        consequences={[
          "All held and confirmed seats are released immediately",
          "This dinner is permanently cancelled — it cannot be reopened",
        ]}
        requireReason
        reasonLabel="Reason for cancellation"
        reasonPlaceholder="e.g. Unforeseen kitchen maintenance — we'll reschedule soon…"
        confirmLabel="Cancel Dinner"
        cancelLabel="Keep Dinner"
      />
    </div>
  );
}
