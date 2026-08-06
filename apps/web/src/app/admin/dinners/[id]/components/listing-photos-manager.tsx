"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDinnerListingPhotos } from "../../media-actions";

interface Photo {
  id: string;
  url: string;
}

interface ListingPhotosManagerProps {
  dinnerId: string;
  /** Currently-selected listing photos, in display order (index 0 = header). */
  initialSelectedIds: string[];
  /** The restaurant's full photo pool (Media Library) to pick from. */
  photoPool: Photo[];
}

/**
 * Post-creation Listing Photos editor for Dinner Detail's Media tab
 * (§16.4/§16.8 wireframe - previously the only way to set a dinner's
 * listing photos was at Create Dinner; there was no way to add, remove, or
 * re-pick a header photo afterward). Reuses the same
 * saveDinnerListingPhotos/getRestaurantPhotoPool actions Create Dinner's
 * own picker already calls - this is just that picker with a Save button,
 * mounted on an existing dinner instead of a not-yet-created one.
 */
export function ListingPhotosManager({ dinnerId, initialSelectedIds, photoPool }: ListingPhotosManagerProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const togglePhoto = (photoId: string) => {
    setSaved(false);
    setSelectedIds((prev) => (prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]));
  };

  const makeHeaderPhoto = (photoId: string) => {
    setSaved(false);
    setSelectedIds((prev) => (prev.includes(photoId) ? [photoId, ...prev.filter((id) => id !== photoId)] : prev));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await saveDinnerListingPhotos(dinnerId, selectedIds);
    setSaving(false);
    if (!result.success) {
      setError(result.error || "Failed to save listing photos");
      return;
    }
    setSaved(true);
    router.refresh();
  };

  return (
    <div className="card card-pad">
      <div className="card-title" style={{ marginBottom: 6 }}>Listing Photos</div>
      <p style={{ fontSize: 12.5, color: "var(--t2)", marginBottom: 14 }}>
        Shown on the public dinner page. Your own food/venue photography — goes live immediately, no moderation
        queue. Max 10 recommended.
      </p>

      {photoPool.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--t3)" }}>
          No photos in your Media Library yet. Upload some there first, then pick them here.
        </p>
      ) : (
        <div className="gallery-grid">
          {photoPool.map((photo) => {
            const selectedIndex = selectedIds.indexOf(photo.id);
            const isSelected = selectedIndex !== -1;
            const isHeader = selectedIndex === 0;
            return (
              <div key={photo.id} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => togglePhoto(photo.id)}
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: `2px solid ${isHeader ? "var(--p)" : isSelected ? "var(--bdr2)" : "transparent"}`,
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      makeHeaderPhoto(photo.id);
                    }}
                    title={isHeader ? "Header photo" : "Make this the header photo"}
                    className="badge"
                    style={{
                      position: "absolute", top: 6, left: 6, fontSize: 9, border: 0, cursor: "pointer",
                      background: isHeader ? "var(--p)" : "rgba(255,255,255,.85)",
                      color: isHeader ? "#fff" : "var(--t3)",
                    }}
                  >
                    {isHeader ? "★ Primary" : "☆"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="field-error" style={{ marginTop: 10 }}>{error}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
        <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
          {saving ? "Saving..." : "Save Listing Photos"}
        </button>
        {saved && <span style={{ fontSize: 12, color: "var(--green-txt)" }}>Saved</span>}
      </div>
    </div>
  );
}
