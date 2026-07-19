import { Suspense } from "react";
import { DiscoverHeader } from "./components/discover-header";
import { DinnerList } from "./components/dinner-list";
import { DinnerListSkeleton } from "./components/dinner-list-skeleton";

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
        <div className="relative mx-4 mt-2 overflow-hidden rounded-2xl bg-cream-200 pb-24"
          style={{ minHeight: "60vh" }}>
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"
                stroke="#FF6B4A" strokeWidth="1.5" fill="#FFE8E1"
              />
              <circle cx="12" cy="10" r="3" fill="#FF6B4A" />
            </svg>
            <p className="text-sm font-medium text-gray-500">Map view</p>
            <p className="text-xs text-gray-400">3 tables nearby</p>
          </div>

          {/* Floating restaurant card at bottom */}
          <div className="absolute bottom-4 left-3 right-3 overflow-hidden rounded-2xl bg-white shadow-card">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-cream-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-gray-900">
                  Osteria Francescana
                </p>
                <p className="text-xs text-gray-500">2 spots left · 4 total</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1 text-xs text-gray-400">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                0.5 mi
              </div>
            </div>
          </div>
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
