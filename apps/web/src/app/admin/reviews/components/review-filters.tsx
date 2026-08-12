"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface ReviewFiltersProps {
  currentRating: string;
  currentDinner: string;
  dinners: { id: string; title: string }[];
}

// Rating is a pill segment, not a <select> (wireframe §sec-reviews-inbox
// frame-note explicitly converted it this pass); the dinner filter stays a
// select.
const RATING_TABS = [
  { value: "all", label: "All Ratings" },
  { value: "5", label: "5★" },
  { value: "4", label: "4★" },
  { value: "3-", label: "≤3★" },
];

export function ReviewFilters({ currentRating, currentDinner, dinners }: ReviewFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
  );
}
