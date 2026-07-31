"use client";

import { useMemo, useState } from "react";
import type { DinnerWithRestaurant } from "@dinewithme/db";
import { SortableColumnHeader, type SortDirection } from "@/components/ui/sortable-column-header";
import { DinnerRow } from "./dinner-row";

interface DinnersTableProps {
  dinners: DinnerWithRestaurant[];
}

const filterTabs = [
  { value: "all", label: "All Dinners" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
] as const;

export function DinnersTable({ dinners }: DinnersTableProps) {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [dateSort, setDateSort] = useState<SortDirection>("asc");

  // Filter dinners based on selected filter
  const filteredDinners = useMemo(() => {
    const filtered = dinners.filter((dinner) => {
      const now = new Date();
      const dinnerDate = new Date(dinner.startsAt);

      if (filter === "upcoming") {
        return dinnerDate >= now && dinner.status !== "CANCELLED" && dinner.status !== "COMPLETED";
      }
      if (filter === "past") {
        return dinnerDate < now || dinner.status === "COMPLETED" || dinner.status === "CANCELLED";
      }
      return true; // "all"
    });

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      return dateSort === "asc" ? diff : -diff;
    });
  }, [dinners, filter, dateSort]);

  if (dinners.length === 0) {
    return (
      <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
        <div className="card-title" style={{ marginBottom: 6 }}>No dinners yet</div>
        <p style={{ fontSize: 13, color: "var(--t3)" }}>
          Create your first dining experience to get started
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="tabs" style={{ marginBottom: 16 }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`tab ${filter === tab.value ? "active" : ""}`}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="dtable">
            <thead>
              <tr>
                <th>
                  <SortableColumnHeader
                    label="Date & Time"
                    active
                    direction={dateSort}
                    onSort={() => setDateSort(dateSort === "asc" ? "desc" : "asc")}
                  />
                </th>
                <th>Theme</th>
                <th>Seats</th>
                <th>Status</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDinners.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--t3)" }}>
                    No dinners found for this filter
                  </td>
                </tr>
              ) : (
                filteredDinners.map((dinner) => (
                  <DinnerRow key={dinner.id} dinner={dinner} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
