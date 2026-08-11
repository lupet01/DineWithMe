"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Search } from "lucide-react";
import type { MediaLibraryItem } from "@dinewithme/db";
import { requestMediaUploadUrl, saveMediaAsset, setFeaturedPhoto, deleteMediaAsset } from "../actions";
import { MediaTabs } from "./media-tabs";
import { FeaturedPhoto } from "./featured-photo";
import { PhotoTile } from "./photo-tile";
import { PhotoOptionsSheet } from "./photo-options-sheet";

type MediaTab = "ALL" | "PROFILE" | "DISH" | "DINNER";

interface MediaLibraryGridProps {
  restaurantId: string;
  items: MediaLibraryItem[];
}

const SOURCE_BY_TAB: Record<Exclude<MediaTab, "ALL">, MediaLibraryItem["source"]> = {
  PROFILE: "PROFILE",
  DISH: "DISH",
  DINNER: "DINNER",
};

export function MediaLibraryGrid({ restaurantId, items }: MediaLibraryGridProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<MediaTab>("ALL");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [optionsItem, setOptionsItem] = useState<MediaLibraryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: items.length,
      profile: items.filter((i) => i.source === "PROFILE").length,
      dish: items.filter((i) => i.source === "DISH").length,
      dinner: items.filter((i) => i.source === "DINNER").length,
    }),
    [items]
  );

  const featured = items.find((i) => i.isFeatured) ?? null;

  // The active tab's own count already reflects the featured photo (it's
  // still "a Profile photo" etc.), so filtering happens against the full
  // list, then the featured item is excluded from the grid below it
  // regardless of which tab is active - it's always shown once, up top,
  // never duplicated in the grid, rather than reappearing when its own
  // category tab is selected.
  const query = search.trim().toLowerCase();
  const filtered = (activeTab === "ALL" ? items : items.filter((i) => i.source === SOURCE_BY_TAB[activeTab])).filter(
    (i) =>
      query === "" ||
      i.sourceLabel.toLowerCase().includes(query) ||
      (i.caption?.toLowerCase().includes(query) ?? false)
  );
  const gridItems = filtered.filter((i) => i.id !== featured?.id);

  // "By Dinner" restructures the flat grid into per-dinner sections, each
  // under its own date heading, so photos from different dinners run the same
  // week never blur together (wireframe §sec-media-library). Every other tab
  // shares the flat grid. Insertion order of the Map preserves the
  // repository's ordering (newest dinner first).
  const dinnerGroups = useMemo(() => {
    if (activeTab !== "DINNER") return [] as [string, MediaLibraryItem[]][];
    const groups = new Map<string, MediaLibraryItem[]>();
    for (const item of gridItems) {
      const existing = groups.get(item.sourceLabel);
      if (existing) existing.push(item);
      else groups.set(item.sourceLabel, [item]);
    }
    return Array.from(groups.entries());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, gridItems]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const signResult = await requestMediaUploadUrl(restaurantId, file.name, file.type);
      if (!signResult.success || !signResult.data) {
        throw new Error(signResult.error || "Failed to get upload URL");
      }

      const uploadResponse = await fetch(signResult.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const saveResult = await saveMediaAsset(restaurantId, signResult.data.key, signResult.data.publicUrl);
      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save photo");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSetFeatured = async (mediaAssetId: string) => {
    setBusyId(mediaAssetId);
    setError(null);
    const result = await setFeaturedPhoto(restaurantId, mediaAssetId);
    setBusyId(null);
    if (!result.success) {
      setError(result.error || "Failed to set featured photo");
      return;
    }
    setOptionsItem(null);
    router.refresh();
  };

  const handleDelete = async (mediaAssetId: string) => {
    setBusyId(mediaAssetId);
    setError(null);
    const result = await deleteMediaAsset(mediaAssetId, restaurantId);
    setBusyId(null);
    if (!result.success) {
      setError(result.error || "Failed to delete photo");
      return;
    }
    setOptionsItem(null);
    router.refresh();
  };

  return (
    <>
      {/* Back-chevron to Restaurant Profile, not a Profile/Team/Media/Settings
          tab row — see Team's identical fix for the full reasoning. */}
      <div className="only-mobile-flex" style={{ justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <Link href="/admin/restaurant" className="m-icon-btn" aria-label="Back to Restaurant Profile">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="pg-title" style={{ flex: 1, textAlign: "center" }}>Media Library</h1>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="m-icon-btn"
          aria-label="Add Photo"
        >
          {uploading ? "…" : "+"}
        </button>
      </div>
      <div className="only-desktop-flex" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="pg-title">Media Library</h1>
          <p className="pg-sub">
            {items.length} photo{items.length === 1 ? "" : "s"} · every one reusable across Profile, Meals, and
            Dinners
          </p>
        </div>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn btn-primary">
          {uploading ? "Uploading…" : "+ Add Photo"}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && (
        <div className="alert alert-yellow">
          <p style={{ fontSize: 13, color: "var(--yellow-txt)" }}>{error}</p>
        </div>
      )}

      {/* Desktop: search folds into the same toolbar row as the tabs, matching
          Guests & Bookings. Mobile: full-width search row above the tabs. */}
      <div className="search-toolbar only-desktop-flex">
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            className="field-input"
            placeholder="Search by filename or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <MediaTabs active={activeTab} counts={counts} onChange={setActiveTab} />
      </div>

      <div className="only-mobile-flex" style={{ flexDirection: "column", gap: 10, alignItems: "stretch" }}>
        <div className="search-bar" style={{ width: "100%" }}>
          <Search className="search-icon" />
          <input
            className="field-input"
            placeholder="Search by filename or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <MediaTabs active={activeTab} counts={counts} onChange={setActiveTab} />
      </div>

      <FeaturedPhoto item={featured} onOpenOptions={setOptionsItem} />

      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--t3)" }}>No photos uploaded yet.</p>
      ) : gridItems.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--t3)" }}>
          {query ? "No photos match your search." : "No photos in this category yet."}
        </p>
      ) : activeTab === "DINNER" ? (
        <div>
          {dinnerGroups.map(([label, groupItems]) => (
            <div key={label} className="media-group">
              <div className="media-group-heading">{label}</div>
              <div className="media-library-grid">
                {groupItems.map((item) => (
                  <PhotoTile key={item.id} item={item} onOpenOptions={setOptionsItem} hideTag />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="media-library-grid">
          {gridItems.map((item) => (
            <PhotoTile key={item.id} item={item} onOpenOptions={setOptionsItem} />
          ))}
        </div>
      )}

      <p className="media-library-caption">
        Tap a tag to filter by that dinner or theme — groups every photo captured at that one dinner, so nothing
        gets mixed up between dinners run the same week. Tap any tile to set it as the Featured cover photo,
        delete it, or see which Meal/Dinner it&apos;s currently used on.
      </p>

      <PhotoOptionsSheet
        item={optionsItem}
        open={optionsItem !== null}
        onClose={() => setOptionsItem(null)}
        onSetFeatured={handleSetFeatured}
        onDelete={handleDelete}
        isBusy={optionsItem !== null && busyId === optionsItem.id}
      />
    </>
  );
}
