"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { FilterSheet } from "@/components/ui/filter-sheet";

interface ThemeOption {
  key: string;
  title: string;
}

interface DiscoverHeaderProps {
  currentView: "list" | "map";
  currentTheme: string;
  currentDate: string;
  currentSize: string;
  /** Active themes, fetched server-side in discover/page.tsx (this is a client component and can't hit the DB directly). */
  themes: ThemeOption[];
}

const datePresets = [
  { value: "", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "weekend", label: "This Weekend" },
  { value: "week", label: "This Week" },
];

// "8+" is a minimum-seats match, wired end-to-end via findPublicDinners'
// minSeatCount filter; the others are exact seatCount matches.
const sizePresets = [
  { value: "", label: "Any size" },
  { value: "2", label: "2 seats" },
  { value: "4", label: "4 seats" },
  { value: "6", label: "6 seats" },
  { value: "8+", label: "8+ seats" },
];

const viewTabs = [
  { value: "list", label: "List" },
  { value: "map", label: "Map" },
];

export function DiscoverHeader({
  currentView,
  currentTheme,
  currentDate,
  currentSize,
  themes,
}: DiscoverHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    if (currentView !== "list") params.set("view", currentView);
    if (currentTheme) params.set("theme", currentTheme);
    if (currentDate) params.set("date", currentDate);
    if (currentSize) params.set("size", currentSize);

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const activeFilterCount = [currentTheme, currentDate, currentSize].filter(Boolean).length;

  return (
    <div className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-xl">
      <div className="mx-auto max-w-lg px-4 pb-3 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900">
              Discover
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Find your next table</p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs
              items={viewTabs}
              value={currentView}
              onChange={(v) => updateParams({ view: v === "list" ? "" : v })}
            />
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-card"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4 text-gray-600" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {currentTheme && (
              <button
                onClick={() => updateParams({ theme: "" })}
                className="flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1.5 text-xs font-semibold text-primary-700"
              >
                {themes.find((t) => t.key === currentTheme)?.title ?? currentTheme}
                <X className="h-3 w-3" />
              </button>
            )}
            {currentDate && (
              <button
                onClick={() => updateParams({ date: "" })}
                className="flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1.5 text-xs font-semibold text-primary-700"
              >
                {datePresets.find((d) => d.value === currentDate)?.label ?? currentDate}
                <X className="h-3 w-3" />
              </button>
            )}
            {currentSize && (
              <button
                onClick={() => updateParams({ size: "" })}
                className="flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1.5 text-xs font-semibold text-primary-700"
              >
                {currentSize} seats
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      <FilterSheet open={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filters">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-900">When</p>
            <div className="flex flex-wrap gap-2">
              {datePresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    updateParams({ date: preset.value });
                    setIsFilterOpen(false);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    currentDate === preset.value
                      ? "bg-primary-500 text-white"
                      : "bg-cream-200 text-gray-700 hover:bg-cream-300"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {themes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-900">Theme</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    updateParams({ theme: "" });
                    setIsFilterOpen(false);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    currentTheme === ""
                      ? "bg-primary-500 text-white"
                      : "bg-cream-200 text-gray-700 hover:bg-cream-300"
                  }`}
                >
                  Any theme
                </button>
                {themes.map((theme) => (
                  <button
                    key={theme.key}
                    onClick={() => {
                      updateParams({ theme: theme.key });
                      setIsFilterOpen(false);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      currentTheme === theme.key
                        ? "bg-primary-500 text-white"
                        : "bg-cream-200 text-gray-700 hover:bg-cream-300"
                    }`}
                  >
                    {theme.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-900">Table Size</p>
            <div className="flex flex-wrap gap-2">
              {sizePresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    updateParams({ size: preset.value });
                    setIsFilterOpen(false);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    currentSize === preset.value
                      ? "bg-primary-500 text-white"
                      : "bg-cream-200 text-gray-700 hover:bg-cream-300"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterSheet>
    </div>
  );
}
