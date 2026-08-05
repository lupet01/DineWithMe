"use client";

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

export function PhotoTile({
  item,
  onOpenOptions,
}: {
  item: MediaLibraryItem;
  onOpenOptions: (item: MediaLibraryItem) => void;
}) {
  return (
    <button type="button" className="photo-tile" onClick={() => onOpenOptions(item)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={item.caption || item.sourceLabel} className="photo-tile-img" />
      <span className="photo-tile-tag">{item.sourceLabel}</span>
    </button>
  );
}
