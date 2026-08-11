"use client";

import { useState } from "react";
import { AlertTriangle, ArrowUpCircle, Trash2, X } from "lucide-react";

export type ConfirmModalTone = "red" | "yellow" | "green";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  title: string;
  description: string;
  /** Bullet list of what this action does — presence of this prop (or requireReason) switches the modal into the wider 460px multi-field variant, matching Cancel Dinner/Close Restaurant in the wireframe. */
  consequences?: string[];
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmLabel: string;
  /** Defaults to "Keep It" per the file-wide rule that the dismiss button always states what staying does, never "Cancel"/"OK"/"Yes". */
  cancelLabel?: string;
  tone: ConfirmModalTone;
}

const TONE_STYLES: Record<ConfirmModalTone, { bg: string; fg: string; icon: typeof Trash2 }> = {
  red: { bg: "var(--red-bg)", fg: "var(--red-txt)", icon: Trash2 },
  yellow: { bg: "var(--yellow-bg)", fg: "var(--yellow-txt)", icon: AlertTriangle },
  green: { bg: "var(--green-bg)", fg: "var(--green-txt)", icon: ArrowUpCircle },
};

/**
 * Shared confirmation modal for every destructive/status-change action in
 * RES Admin (Mark LIVE, Cancel/Complete Dinner, Delete Meal/Dish/Photo,
 * Remove Team Member, Revoke Invite, Unsaved Changes) — see
 * confirm-modal-* classes in admin-design-system.css for the responsive
 * shell (full-screen sheet on mobile, centered card on desktop).
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  consequences,
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder,
  confirmLabel,
  cancelLabel = "Keep It",
  tone,
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const isWide = consequences !== undefined || requireReason;
  const { bg, fg, icon: Icon } = TONE_STYLES[tone];
  const reasonMissing = requireReason && reason.trim().length === 0;

  const handleConfirm = async () => {
    if (reasonMissing) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(requireReason ? reason.trim() : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  };

  return (
    <div className="dine-admin">
      <div
        className="confirm-modal-backdrop"
        onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
      >
        <div className={`confirm-modal-card${isWide ? " wide" : ""}`}>
          <button
            type="button"
            className="m-icon-btn confirm-modal-close only-mobile-flex"
            aria-label={cancelLabel}
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </button>

          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: bg,
              color: fg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{title}</div>
          <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5, marginBottom: isWide ? 14 : 20 }}>
            {description}
          </p>

          {consequences && consequences.length > 0 && (
            <ul
              style={{
                textAlign: "left",
                fontSize: 12.5,
                color: "var(--t2)",
                lineHeight: 1.6,
                marginBottom: 14,
                paddingLeft: 18,
              }}
            >
              {consequences.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}

          {requireReason && (
            <div style={{ textAlign: "left", marginBottom: 20 }}>
              <label className="field-label">
                {reasonLabel} <span className="req">*</span>
              </label>
              <textarea
                className="field-input ta"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                disabled={isSubmitting}
              />
            </div>
          )}

          {error && (
            <p style={{ fontSize: 12.5, color: "var(--red-txt)", marginBottom: 12 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline only-desktop-flex"
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={tone === "green" ? "btn btn-green" : "btn"}
              style={tone === "green" ? { flex: 1, fontWeight: 700 } : { flex: 1, background: "var(--red-txt)", color: "white" }}
              onClick={handleConfirm}
              disabled={isSubmitting || reasonMissing}
            >
              {isSubmitting ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
