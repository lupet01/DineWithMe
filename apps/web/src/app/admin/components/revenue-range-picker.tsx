"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar } from "lucide-react";

const RANGES = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "6mo", label: "Last 6 Months" },
  { value: "ytd", label: "Year to Date" },
];

export function RevenueRangePicker({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="range-picker" title="Revenue stat below reads from this range">
      <Calendar />
      <select value={current} onChange={handleChange}>
        {RANGES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <span className="range-picker-chevron">▾</span>
    </div>
  );
}
