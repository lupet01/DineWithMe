"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setReviewNote } from "../actions";

// Mirrors VIBE_TAG_OPTIONS in the diner-facing post-dinner feedback flow
// (apps/web/src/app/(core)/dinner/[id]/post-dinner/components/sentiment-step.tsx)
// — stored as codes, not human-readable strings, so both sides need this map.
const VIBE_TAG_LABELS: Record<string, string> = {
  GREAT_CONVERSATIONS: "Great conversations",
  GOOD_FOOD: "Good food",
  WELCOMING: "Welcoming",
  INTIMATE: "Intimate",
  ENERGETIC: "Energetic",
  RELAXED: "Relaxed",
};

interface ReviewRowProps {
  feedbackId: string;
  authorName: string;
  authorInitials: string;
  dinnerId: string;
  dinnerTitle: string;
  dinnerDate: string;
  rating: number;
  notes: string | null;
  restaurantNote: string | null;
  vibeTags: string[];
}

export function ReviewRow({
  feedbackId,
  authorName,
  authorInitials,
  dinnerId,
  dinnerTitle,
  dinnerDate,
  rating,
  notes,
  restaurantNote,
  vibeTags,
}: ReviewRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(restaurantNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await setReviewNote(feedbackId, note);
    setSaving(false);

    if (!result.success) {
      setError(result.error || "Failed to save note");
      return;
    }
    setEditing(false);
    router.refresh();
  };

  return (
    <div className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: "50%", background: "var(--p-tint)", color: "var(--p)",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}
          >
            {authorInitials}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{authorName}</div>
            <div style={{ fontSize: 11.5, color: "var(--t3)" }}>
              Attended{" "}
              <Link href={`/admin/dinners/${dinnerId}`} style={{ color: "var(--p)", fontWeight: 600, textDecoration: "none" }}>
                {dinnerTitle}
              </Link>{" "}
              · {dinnerDate}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--yellow-txt)", flexShrink: 0 }}>{rating.toFixed(1)} ★</div>
      </div>

      {notes && <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text)" }}>&quot;{notes}&quot;</p>}

      {vibeTags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {vibeTags.map((tag) => (
            <span key={tag} className="badge badge-slate" style={{ fontSize: 9.5 }}>
              {VIBE_TAG_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>
      )}

      {editing ? (
        <div style={{ marginTop: 12 }}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal note - not shared with the guest"
            className="field-input ta"
            rows={3}
            disabled={saving}
          />
          {error && <p style={{ fontSize: 12, color: "var(--red-txt)", marginTop: 6 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setNote(restaurantNote ?? "");
                setError(null);
              }}
              disabled={saving}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
              {saving ? "Saving…" : "Save Note"}
            </button>
          </div>
        </div>
      ) : restaurantNote ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{
            background: "var(--bg2)", border: "1px solid var(--bdr)", borderRadius: 12, padding: "12px 14px",
            marginTop: 12, textAlign: "left", cursor: "pointer", width: "100%",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Your Private Note (not shared with guest)
          </div>
          <div style={{ fontSize: 12.5, color: "var(--t2)", lineHeight: 1.4 }}>{restaurantNote}</div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="m-text-btn"
          style={{ marginTop: 12, fontSize: 12 }}
        >
          + Add private note
        </button>
      )}
    </div>
  );
}
