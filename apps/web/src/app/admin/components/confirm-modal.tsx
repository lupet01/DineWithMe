"use client";

import { useEffect, useId, useRef, useState } from "react";
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

  const cardRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const reactId = useId();
  const titleId = `confirm-modal-title-${reactId}`;
  const descId = `confirm-modal-desc-${reactId}`;

  // Accessibility: focus management + focus trap + Escape-to-close. Guarded
  // for SSR (window/document only touched inside the effect) and only active
  // while the modal is open.
  useEffect(() => {
    if (!open) return;
    if (typeof document === "undefined") return;

    // Remember what had focus so we can restore it on close.
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] => {
      const root = cardRef.current;
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    };

    // Focus the first interactive element (confirm button preferred).
    const focusTarget = confirmBtnRef.current ?? getFocusable()[0] ?? cardRef.current;
    focusTarget?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!isSubmitting) {
          e.preventDefault();
          onClose();
        }
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !cardRef.current?.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !cardRef.current?.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the element that had it before the modal opened.
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open, isSubmitting, onClose]);

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
        <div
          ref={cardRef}
          className={`confirm-modal-card${isWide ? " wide" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
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
          <div id={titleId} style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{title}</div>
          <p id={descId} style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5, marginBottom: isWide ? 14 : 20 }}>
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
              ref={confirmBtnRef}
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
