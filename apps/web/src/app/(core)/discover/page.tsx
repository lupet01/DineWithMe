import { Suspense } from "react";
import { DiscoverHeader } from "./components/discover-header";
import { DinnerList } from "./components/dinner-list";
import { DinnerListSkeleton } from "./components/dinner-list-skeleton";
import { DiscoverMap } from "./components/discover-map";
import { StaticMapPlaceholder } from "./components/static-map-placeholder";

interface DiscoverPageProps {
  searchParams: {
    city?: string;
    theme?: string;
    date?: string;
    size?: string;
    view?: string;
  };
}

export default function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const view = searchParams.view === "map" ? "map" : "list";

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header + filter chips (chips only show when filter btn clicked) */}
      <DiscoverHeader
        currentView={view}
        currentTheme={searchParams.theme || ""}
        currentDate={searchParams.date || ""}
        currentSize={searchParams.size || ""}
      />

      {view === "map" ? (
        /* ── Map view ── */
        <div className="relative mx-4 mt-2 overflow-hidden rounded-2xl bg-cream-200"
          style={{ minHeight: "60vh" }}>
          <Suspense fallback={<StaticMapPlaceholder />}>
            <DiscoverMap searchParams={searchParams} />
          </Suspense>
        </div>
      ) : (
        /* ── List view ── */
        <div className="mx-auto max-w-lg px-4 pt-3 pb-28">
          <Suspense fallback={<DinnerListSkeleton />}>
            <DinnerList searchParams={searchParams} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
