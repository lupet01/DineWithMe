"use client";

import { useMemo, useState } from "react";
import type { DinnerWithRestaurant } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { SortableColumnHeader, type SortDirection } from "@/components/ui/sortable-column-header";
import { DinnerRow } from "./dinner-row";

interface DinnersTableProps {
  dinners: DinnerWithRestaurant[];
}

const filterTabs = [
  { value: "all", label: "All Dinners" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

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
      <Card>
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No dinners yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first dining experience to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs items={filterTabs} value={filter} onChange={(v) => setFilter(v as typeof filter)} />

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-100 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">
                  <SortableColumnHeader
                    label="Date & Time"
                    active
                    direction={dateSort}
                    onSort={() => setDateSort(dateSort === "asc" ? "desc" : "asc")}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Theme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Seats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDinners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
      </Card>
    </div>
  );
}
