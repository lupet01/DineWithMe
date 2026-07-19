"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Map, List } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTER_CHIPS = [
  { key: "date",  value: "today",       label: "Distance" },
  { key: "date",  value: "tomorrow",    label: "Meal Time" },
  { key: "size",  value: "small",       label: "Table Size" },
  { key: "theme", value: "deep-talk",   label: "Conversation Style" },
  { key: "theme", value: "icebreakers", label: "Icebreakers" },
];

interface DiscoverHeaderProps {
  currentView: "list" | "map";
  currentTheme: string;
  currentDate: string;
  currentSize: string;
}

export function DiscoverHeader({
  currentView,
  currentTheme,
  currentDate,
  currentSize,
}: DiscoverHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters = !!(currentTheme || currentDate || currentSize);

  const toggleView = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentView === "list") {
      params.set("view", "map");
    } else {
      params.delete("view");
    }
    router.push(`/discover?${params.toString()}`);
  };

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const existing = params.get(key);
    if (existing === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/discover?${params.toString()}`);
  };

  const isChipActive = (key: string, value: string) => {
    if (key === "theme") return currentTheme === value;
    if (key === "date")  return currentDate === value;
    if (key === "size")  return currentSize === value;
    return false;
  };

  return (
    <div>
      {/* ── Top bar — STICKY so it stays fixed when scrolling ── */}
      <div className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 pb-3 pt-5">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900">
              Browse Tables
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">
              Find your next meal companion
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter toggle — orange when open OR has active filters */}
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border transition-all",
                filtersOpen || hasActiveFilters
                  ? "border-transparent bg-primary-500 shadow-soft"
                  : "border-gray-100 bg-white shadow-card"
              )}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal
                className={cn(
                  "h-4 w-4",
                  filtersOpen || hasActiveFilters ? "text-white" : "text-gray-700"
                )}
                strokeWidth={2}
              />
            </button>

            {/* Map / List toggle */}
            <button
              onClick={toggleView}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border transition-all",
                currentView === "map"
                  ? "border-transparent bg-primary-500 shadow-soft"
                  : "border-gray-100 bg-white shadow-card"
              )}
              aria-label={currentView === "map" ? "Switch to list" : "Switch to map"}
            >
              {currentView === "map" ? (
                <List className="h-4 w-4 text-white" strokeWidth={2} />
              ) : (
                <Map className="h-4 w-4 text-gray-700" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* ── Filter chips row — only shown when filter button clicked ── */}
        {filtersOpen && (
          <div className="overflow-x-auto pb-3 pt-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2 px-4" style={{ width: "max-content" }}>
              {FILTER_CHIPS.map((chip, i) => {
                const active = isChipActive(chip.key, chip.value);
                return (
                  <button
                    key={i}
                    onClick={() => setFilter(chip.key, chip.value)}
                    className={cn(
                      "flex-shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all",
                      active
                        ? "bg-primary-500 text-white shadow-soft"
                        : "border border-gray-200 bg-white text-gray-900 shadow-card"
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom border only when scrolled / always for separation */}
        <div className="h-px bg-gray-100" />
      </div>
    </div>
  );
}
