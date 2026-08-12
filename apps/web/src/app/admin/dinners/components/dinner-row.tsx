"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import type { DinnerWithRestaurant } from "@dinewithme/db";
import { updateDinnerStatus, requestDinnerCancellation, publishDinner, deleteDinner } from "../actions";
import { ConfirmModal } from "../../components/confirm-modal";
import { useToast } from "@/components/ui/toast";

interface DinnerRowProps {
  dinner: DinnerWithRestaurant;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatRands(cents: number) {
  return `R ${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "DRAFT":
      return "badge-draft";
    case "SCHEDULED":
      return "badge-blue";
    case "LIVE":
      return "badge-green";
    case "CANCELLED":
      return "badge-red";
    case "COMPLETED":
    default:
      return "badge-slate";
  }
}

/**
 * Shared state/actions behind both the desktop table row and the mobile
 * row-card (§16.3 wireframe's "Mobile adaptation" note - same data, same
 * actions, just two different renderings) so seat-count fetching and the
 * Publish / Mark Live / Complete / Cancel / Delete handlers aren't
 * duplicated. Cancel is a review request (Platform Ops approves + refunds),
 * so it opens the styled ConfirmModal to collect a required reason rather
 * than a native confirm.
 */
function useDinnerRowState(dinner: DinnerWithRestaurant) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [seatCounts, setSeatCounts] = useState({ confirmed: 0, available: 0 });

  useEffect(() => {
    async function fetchSeatCounts() {
      // A DRAFT dinner has no seat pool yet - nothing can be booked before
      // it's published, so skip the fetch rather than show a spurious 0/0.
      if (dinner.status === "DRAFT") return;
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
  }, [dinner.id, dinner.status]);

  const handleStatusChange = async (newStatus: "LIVE" | "COMPLETED") => {
    if (isUpdating) return;
    const confirmed = confirm(`Are you sure you want to mark this dinner as ${newStatus}?`);
    if (!confirmed) return;

    setIsUpdating(true);
    const result = await updateDinnerStatus(dinner.id, newStatus);
    setIsUpdating(false);

    if (!result.success) {
      toast.error(result.error || "Failed to update dinner status");
      return;
    }
    toast.success(newStatus === "LIVE" ? "Dinner is now live" : "Dinner marked completed");
  };

  const handlePublish = async () => {
    if (isUpdating) return;
    const confirmed = confirm("Publish this dinner? It becomes visible on Discover and bookable — its content locks after this.");
    if (!confirmed) return;

    setIsUpdating(true);
    const result = await publishDinner(dinner.id);
    setIsUpdating(false);

    if (!result.success) {
      toast.error(result.error || "Failed to publish dinner");
      return;
    }
    toast.success("Dinner published");
  };

  const handleDelete = async () => {
    if (isUpdating) return;
    const confirmed = confirm("Delete this draft dinner? This can't be undone.");
    if (!confirmed) return;

    setIsUpdating(true);
    const result = await deleteDinner(dinner.id);
    setIsUpdating(false);

    if (!result.success) {
      toast.error(result.error || "Failed to delete dinner");
      return;
    }
    toast.success("Draft deleted");
  };

  const confirmCancel = async (reason?: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    const result = await requestDinnerCancellation(dinner.id, reason);
    setIsUpdating(false);

    if (!result.success) {
      toast.error(result.error || "Failed to request cancellation");
      throw new Error(result.error || "Failed to request cancellation");
    }
    setCancelOpen(false);
    toast.success("Cancellation requested — pending review");
  };

  const revenueCents =
    dinner.status === "CANCELLED" || dinner.status === "DRAFT"
      ? 0
      : seatCounts.confirmed * (dinner.pricePerSeatCents ?? 0);
  const potentialCents = (dinner.pricePerSeatCents ?? 0) * dinner.seatCount;

  return {
    isUpdating,
    seatCounts,
    revenueCents,
    potentialCents,
    handleStatusChange,
    handlePublish,
    handleDelete,
    cancelOpen,
    setCancelOpen,
    confirmCancel,
    isDraft: dinner.status === "DRAFT",
    canMarkLive: dinner.status === "SCHEDULED",
    canMarkCompleted: dinner.status === "LIVE",
    canCancel: dinner.status === "SCHEDULED" || dinner.status === "LIVE",
  };
}

/** The shared Request-Cancellation modal, rendered by both row variants. */
function CancelDinnerModal({
  dinnerLabel,
  open,
  onClose,
  onConfirm,
}: {
  dinnerLabel: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
}) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
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
  );
}

export function DinnerRow({ dinner }: DinnerRowProps) {
  const {
    isUpdating,
    seatCounts,
    revenueCents,
    potentialCents,
    handleStatusChange,
    handlePublish,
    handleDelete,
    cancelOpen,
    setCancelOpen,
    confirmCancel,
    isDraft,
    canMarkLive,
    canMarkCompleted,
    canCancel,
  } = useDinnerRowState(dinner);

  const dinnerLabel = dinner.theme?.title || "this dinner";

  return (
    <tr>
      {/* Date & Time */}
      <td>
        <div className="td-strong">{formatDate(dinner.startsAt)}</div>
        <div className="td-muted">
          {formatTime(dinner.startsAt)} - {formatTime(dinner.endsAt)}
        </div>
      </td>

      {/* Theme */}
      <td>
        <div>{dinner.theme?.title || "No theme"}</div>
        {isDraft ? (
          <div className="td-muted">Not listed yet — still being set up</div>
        ) : (
          dinner.description && (
            <div className="td-muted" style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {dinner.description}
            </div>
          )
        )}
      </td>

      {/* Seats */}
      <td>
        {isDraft ? (
          <>
            <div className="td-strong" style={{ color: "var(--t3)" }}>—</div>
            <div className="td-muted">not open for booking</div>
          </>
        ) : (
          <>
            <div>
              <span className="td-strong">{seatCounts.confirmed}</span>
              <span className="td-muted"> / {dinner.seatCount}</span>
            </div>
            <div className="td-muted">{seatCounts.available} available</div>
          </>
        )}
      </td>

      {/* Revenue */}
      <td>
        {isDraft ? (
          <div className="td-strong" style={{ color: "var(--t3)" }}>—</div>
        ) : dinner.status === "CANCELLED" ? (
          <>
            <div className="td-strong" style={{ color: "var(--t3)" }}>R 0</div>
            <div className="td-muted">refunded</div>
          </>
        ) : (
          <>
            <div className="td-strong">{formatRands(revenueCents)}</div>
            <div className="td-muted">
              {dinner.status === "COMPLETED" ? "collected" : `of ${formatRands(potentialCents)} potential`}
            </div>
          </>
        )}
      </td>

      {/* Status */}
      <td>
        <span className={`badge ${getStatusBadgeClass(dinner.status)}`}>{dinner.status}</span>
      </td>

      {/* Actions */}
      <td>
        <div className="td-actions">
          {isDraft ? (
            <>
              <button onClick={handlePublish} disabled={isUpdating} className="btn btn-primary btn-sm">
                Publish
              </button>
              <details className="row-menu">
                <summary className="m-icon-btn" aria-label="More actions">
                  <MoreVertical className="h-3.5 w-3.5" />
                </summary>
                <div className="row-menu-panel">
                  <Link href={`/admin/dinners/${dinner.id}/edit`} className="row-menu-item">
                    Edit
                  </Link>
                  <button type="button" onClick={handleDelete} disabled={isUpdating} className="row-menu-item danger">
                    Delete
                  </button>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link href={`/admin/dinners/${dinner.id}`} className="btn btn-outline btn-sm">
                View
              </Link>
              {canMarkLive && (
                <button onClick={() => handleStatusChange("LIVE")} disabled={isUpdating} className="btn btn-green btn-sm">
                  Mark Live
                </button>
              )}
              {canMarkCompleted && (
                <button onClick={() => handleStatusChange("COMPLETED")} disabled={isUpdating} className="btn btn-outline btn-sm">
                  Complete
                </button>
              )}
              {canCancel && (
                <details className="row-menu">
                  <summary className="m-icon-btn" aria-label="More actions">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </summary>
                  <div className="row-menu-panel">
                    <button type="button" onClick={() => setCancelOpen(true)} disabled={isUpdating} className="row-menu-item danger">
                      Cancel Dinner
                    </button>
                  </div>
                </details>
              )}
            </>
          )}
        </div>
        <CancelDinnerModal
          dinnerLabel={dinnerLabel}
          open={cancelOpen}
          onClose={() => setCancelOpen(false)}
          onConfirm={confirmCancel}
        />
      </td>
    </tr>
  );
}

/**
 * Mobile row-card: the 6-column table collapses to a stacked card per
 * dinner (§16.3 wireframe) - date/theme up top, status badge inline, seat
 * count + revenue as plain text, action buttons full-width side by side.
 */
export function DinnerRowCard({ dinner }: DinnerRowProps) {
  const {
    isUpdating,
    seatCounts,
    revenueCents,
    handleStatusChange,
    handlePublish,
    handleDelete,
    cancelOpen,
    setCancelOpen,
    confirmCancel,
    isDraft,
    canMarkLive,
    canMarkCompleted,
    canCancel,
  } = useDinnerRowState(dinner);

  const dinnerLabel = dinner.theme?.title || "this dinner";

  const seatSummary =
    seatCounts.available === 0 && seatCounts.confirmed > 0
      ? "full"
      : `${seatCounts.available} available`;

  return (
    <div className="row-card">
      <div className="rc-top">
        <div>
          <div className="rc-title">{dinner.theme?.title || "No theme"}</div>
          <div className="rc-sub">
            {formatShortDate(dinner.startsAt)} · {formatTime(dinner.startsAt)}–{formatTime(dinner.endsAt)}
          </div>
        </div>
        <span className={`badge ${getStatusBadgeClass(dinner.status)}`}>{dinner.status}</span>
      </div>
      <div className="rc-meta">
        {isDraft
          ? "Not listed yet — still being set up"
          : dinner.status === "CANCELLED"
            ? "R 0 refunded"
            : `${seatCounts.confirmed} / ${dinner.seatCount} booked · ${seatSummary} · ${formatRands(revenueCents)}`}
      </div>
      <div className="rc-actions">
        {isDraft ? (
          <>
            <Link href={`/admin/dinners/${dinner.id}/edit`} className="btn btn-sm btn-outline" style={{ flex: 1, textAlign: "center" }}>
              Edit
            </Link>
            <button onClick={handlePublish} disabled={isUpdating} className="btn btn-sm btn-primary" style={{ flex: 1 }}>
              Publish
            </button>
            <button onClick={handleDelete} disabled={isUpdating} className="btn btn-sm btn-red" style={{ flex: 1 }}>
              Delete
            </button>
          </>
        ) : (
          <>
            <Link href={`/admin/dinners/${dinner.id}`} className="btn btn-sm btn-outline" style={{ flex: 1, textAlign: "center" }}>
              View
            </Link>
            {canMarkLive && (
              <button onClick={() => handleStatusChange("LIVE")} disabled={isUpdating} className="btn btn-sm btn-green" style={{ flex: 1 }}>
                Mark Live
              </button>
            )}
            {canMarkCompleted && (
              <button onClick={() => handleStatusChange("COMPLETED")} disabled={isUpdating} className="btn btn-sm btn-outline" style={{ flex: 1 }}>
                Complete
              </button>
            )}
            {canCancel && (
              <button onClick={() => setCancelOpen(true)} disabled={isUpdating} className="btn btn-sm btn-red" style={{ flex: 1 }}>
                Cancel
              </button>
            )}
          </>
        )}
      </div>
      <CancelDinnerModal
        dinnerLabel={dinnerLabel}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={confirmCancel}
      />
    </div>
  );
}
