"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface ReviewFiltersProps {
  currentRating: string;
  currentDinner: string;
  dinners: { id: string; title: string }[];
}

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

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <select
        value={currentRating}
        onChange={(e) => setParam("rating", e.target.value)}
        className="field-input"
        style={{ width: "auto", fontSize: 12 }}
      >
        <option value="all">All Ratings</option>
        <option value="5">5 Stars</option>
        <option value="4">4 Stars</option>
        <option value="3-">3 Stars &amp; below</option>
      </select>
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
