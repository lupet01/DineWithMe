"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter } from "lucide-react";

interface ReviewFiltersProps {
  currentRating: string;
  currentDinner: string;
  dinners: { id: string; title: string }[];
}

// Rating is a pill segment, not a <select> (wireframe §sec-reviews-inbox
// frame-note explicitly converted it this pass); the dinner filter stays a
// select. Mobile uses shorter pill labels + a funnel-toggled "Filter by
// Dinner" panel (wireframe mobile ~5825-5855), mirroring the guests-table
// filter-sheet pattern; desktop keeps the inline pills + select row.
const RATING_TABS = [
  { value: "all", label: "All Ratings", shortLabel: "All" },
  { value: "5", label: "5★", shortLabel: "5★" },
  { value: "4", label: "4★", shortLabel: "4★" },
  { value: "3-", label: "≤3★", shortLabel: "≤3★" },
];

export function ReviewFilters({ currentRating, currentDinner, dinners }: ReviewFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Mobile-only "Filter by Dinner" panel, staged in draft state and only
  // committed on Apply / cleared on Reset. Desktop applies the dinner select
  // immediately, so this state is unused there.
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [draftDinner, setDraftDinner] = useState(currentDinner);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const activeRating = currentRating || "all";

  const handleApply = () => {
    setParam("dinner", draftDinner);
    setShowFilterPanel(false);
  };

  const handleReset = () => {
    setDraftDinner("all");
    setParam("dinner", "all");
  };

  return (
    <>
      {/* Desktop: inline rating pills + dinner select */}
      <div className="only-desktop-flex" style={{ alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div className="tabs">
          {RATING_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`tab ${activeRating === t.value ? "active" : ""}`}
              onClick={() => setParam("rating", t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={currentDinner}
          onChange={(e) => setParam("dinner", e.target.value)}
          className="field-input"
          style={{ width: "auto", fontSize: 12 }}
        >
          <option value="all">All Dinners</option>
          {dinners.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile: always-visible rating pills + funnel toggling a dinner panel */}
      <div className="only-mobile" style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="tabs" style={{ flex: 1 }}>
            {RATING_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`tab ${activeRating === t.value ? "active" : ""}`}
                style={{ flex: 1 }}
                onClick={() => setParam("rating", t.value)}
              >
                {t.shortLabel}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="m-icon-btn"
            aria-label="Toggle Filter by Dinner panel"
            title="More filters"
            onClick={() => {
              setDraftDinner(currentDinner);
              setShowFilterPanel((v) => !v);
            }}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {showFilterPanel && (
          <div className="card card-pad" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="card-title" style={{ fontSize: 13 }}>
                Filter by Dinner
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label className="field-label">Dinner</label>
                <select
                  className="field-input"
                  value={draftDinner}
                  onChange={(e) => setDraftDinner(e.target.value)}
                >
                  <option value="all">All Dinners</option>
                  {dinners.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                <button type="button" className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={handleReset}>
                  Reset
                </button>
                <button type="button" className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={handleApply}>
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
