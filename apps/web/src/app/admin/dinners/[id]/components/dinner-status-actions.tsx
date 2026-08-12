"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "../../../components/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { updateDinnerStatus, requestDinnerCancellation } from "../../actions";

interface DinnerStatusActionsProps {
  dinnerId: string;
  status: string;
  dinnerLabel: string;
  /** True when a cancellation request for this dinner is already awaiting Platform Ops review. */
  pendingCancellation?: boolean;
  /** "bar": buttons share a full-width row (the mobile sticky action bar). */
  layout?: "inline" | "bar";
}

type OpenModal = "markLive" | "complete" | "cancel" | null;

export function DinnerStatusActions({
  dinnerId,
  status,
  dinnerLabel,
  pendingCancellation = false,
  layout = "inline",
}: DinnerStatusActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [openModal, setOpenModal] = useState<OpenModal>(null);

  const runAction = async (
    result: Promise<{ success: boolean; error?: string }>,
    successMessage: string
  ) => {
    const res = await result;
    if (!res.success) {
      toast.error(res.error || "Action failed");
      throw new Error(res.error || "Action failed");
    }
    setOpenModal(null);
    toast.success(successMessage);
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
      {pendingCancellation ? (
        <span className="badge badge-yellow" style={{ flexShrink: 0 }}>
          Cancellation pending review
        </span>
      ) : (
        <button type="button" onClick={() => setOpenModal("cancel")} className="btn btn-red btn-sm" style={barStyle}>
          Cancel Dinner
        </button>
      )}

      <ConfirmModal
        open={openModal === "markLive"}
        onClose={() => setOpenModal(null)}
        onConfirm={() => runAction(updateDinnerStatus(dinnerId, "LIVE"), "Dinner is now live")}
        tone="green"
        title="Mark dinner as Live?"
        description={`You're about to mark ${dinnerLabel} as LIVE. This tells guests their dinner is happening and unlocks check-in. You can't undo this to go back to Scheduled.`}
        confirmLabel="→ Mark as LIVE"
        cancelLabel="Not Yet"
      />

      <ConfirmModal
        open={openModal === "complete"}
        onClose={() => setOpenModal(null)}
        onConfirm={() => runAction(updateDinnerStatus(dinnerId, "COMPLETED"), "Dinner marked completed")}
        tone="green"
        title="Mark dinner as completed?"
        description={`${dinnerLabel} will move to your results view — attendance, revenue, and payout status replace the live check-in tools. This can't be undone.`}
        confirmLabel="Mark Completed"
        cancelLabel="Not Yet"
      />

      <ConfirmModal
        open={openModal === "cancel"}
        onClose={() => setOpenModal(null)}
        onConfirm={(reason) => runAction(requestDinnerCancellation(dinnerId, reason), "Cancellation requested — pending review")}
        tone="red"
        title="Request to cancel this dinner?"
        description={`You're requesting to cancel ${dinnerLabel}. This goes to Platform Ops for review rather than cancelling instantly.`}
        consequences={[
          "The dinner is NOT cancelled yet — it stays bookable until Platform Ops approves",
          "On approval, every held/confirmed seat is released and each paying guest is automatically refunded and emailed",
          "You'll be notified once it's reviewed — usually within a day or two",
        ]}
        requireReason
        reasonLabel="Reason for cancellation"
        reasonPlaceholder="e.g. Unforeseen kitchen maintenance — we'll reschedule soon…"
        confirmLabel="Request Cancellation"
        cancelLabel="Keep Dinner"
      />
    </div>
  );
}
