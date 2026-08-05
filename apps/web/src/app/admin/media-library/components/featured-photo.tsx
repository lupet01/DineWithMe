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

export function FeaturedPhoto({
  item,
  onOpenOptions,
}: {
  item: MediaLibraryItem | null;
  onOpenOptions: (item: MediaLibraryItem) => void;
}) {
  if (!item) {
    return (
      <div className="featured-photo-empty">
        <p style={{ fontSize: 13, color: "var(--t3)" }}>No featured cover photo set yet.</p>
      </div>
    );
  }

  const badgeLabel = item.source === "PROFILE" ? "★ Featured · Profile Cover" : `★ Featured · ${item.sourceLabel}`;

  return (
    <button type="button" className="featured-photo" onClick={() => onOpenOptions(item)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={item.caption || "Featured photo"} className="featured-photo-img" />
      <span className="badge featured-photo-badge">{badgeLabel}</span>
    </button>
  );
}
