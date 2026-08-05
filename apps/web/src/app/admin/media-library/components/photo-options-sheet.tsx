"use client";

import Link from "next/link";
import { FilterSheet } from "@/components/ui/filter-sheet";

interface MediaLibraryItem {
  id: string;
  url: string;
  caption: string | null;
  uploadedAt: Date;
  isFeatured: boolean;
  source: "PROFILE" | "DISH" | "DINNER";
  sourceLabel: string;
  sourceHref: string | null;
}

interface PhotoOptionsSheetProps {
  item: MediaLibraryItem | null;
  open: boolean;
  onClose: () => void;
  onSetFeatured: (mediaAssetId: string) => void;
  onDelete: (mediaAssetId: string) => void;
  isBusy: boolean;
}

export function PhotoOptionsSheet({
  item,
  open,
  onClose,
  onSetFeatured,
  onDelete,
  isBusy,
}: PhotoOptionsSheetProps) {
  const handleDelete = () => {
    if (!item) return;
    if (!window.confirm("Delete this photo? This cannot be undone.")) return;
    onDelete(item.id);
  };

  return (
    <FilterSheet open={open} onClose={onClose} title={item?.sourceLabel ?? "Photo Options"}>
      {item && (
        <div className="photo-options-body">
          <img src={item.url} alt={item.caption ?? item.sourceLabel} className="photo-options-preview" />

          <div className="photo-options-usage">
            {item.sourceHref ? (
              <Link href={item.sourceHref} className="photo-options-usage-link">
                Used as {item.sourceLabel} →
              </Link>
            ) : (
              <span>Used as {item.sourceLabel}</span>
            )}
          </div>

          <div className="photo-options-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={isBusy || item.isFeatured}
              onClick={() => onSetFeatured(item.id)}
            >
              {item.isFeatured ? "Currently Featured" : "Set as Featured Cover"}
            </button>
            <button type="button" className="btn btn-red" disabled={isBusy} onClick={handleDelete}>
              Delete Photo
            </button>
          </div>
        </div>
      )}
    </FilterSheet>
  );
}
