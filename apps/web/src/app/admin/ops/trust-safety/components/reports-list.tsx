"use client";

import { useMemo, useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { ReportCard } from "./report-card";
import type { SafetyReportWithRelations } from "@dinewithme/db";

interface ReportsListProps {
  reports: SafetyReportWithRelations[];
}

const FILTERS = [
  { value: "OPEN", label: "Open" },
  { value: "ACTIONED", label: "Actioned" },
  { value: "DISMISSED", label: "Dismissed" },
  { value: "ALL", label: "All" },
] as const;

export function ReportsList({ reports }: ReportsListProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("OPEN");

  const filtered = useMemo(() => {
    switch (filter) {
      case "OPEN":
        return reports.filter((r) => r.status === "PENDING" || r.status === "REVIEWED");
      case "ACTIONED":
        return reports.filter((r) => r.status === "ACTIONED");
      case "DISMISSED":
        return reports.filter((r) => r.status === "DISMISSED");
      default:
        return reports;
    }
  }, [reports, filter]);

  return (
    <div className="space-y-4">
      <Tabs items={[...FILTERS]} value={filter} onChange={(v) => setFilter(v as typeof filter)} />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
          No {filter === "ALL" ? "" : filter.toLowerCase()} reports.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
