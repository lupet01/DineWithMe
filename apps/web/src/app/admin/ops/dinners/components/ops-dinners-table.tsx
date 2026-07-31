"use client";

import { useMemo, useState } from "react";
import type { DinnerWithRestaurant } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { SearchBar } from "@/components/ui/search-bar";
import { OpsDinnerRow } from "./ops-dinner-row";

interface OpsDinnersTableProps {
  dinners: DinnerWithRestaurant[];
}

const filterTabs = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function OpsDinnersTable({ dinners }: OpsDinnersTableProps) {
  const [filter, setFilter] = useState<
    "all" | "scheduled" | "live" | "completed" | "cancelled"
  >("all");
  const [search, setSearch] = useState("");

  const filteredDinners = useMemo(() => {
    const query = search.trim().toLowerCase();

    return dinners
      .filter((dinner) => {
        if (filter !== "all" && dinner.status !== filter.toUpperCase()) {
          return false;
        }
        if (
          query &&
          !dinner.restaurant.name.toLowerCase().includes(query) &&
          !(dinner.theme?.title.toLowerCase().includes(query) ?? false)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  }, [dinners, filter, search]);

  if (dinners.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No dinners yet</h3>
          <p className="text-gray-600">Dinners will appear here once restaurants create them</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs items={filterTabs} value={filter} onChange={(v) => setFilter(v as typeof filter)} />
        <SearchBar
          placeholder="Search restaurant or theme…"
          value={search}
          onValueChange={setSearch}
          className="sm:w-64"
        />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-100 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Theme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Date / Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Seats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDinners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No dinners found for this filter
                  </td>
                </tr>
              ) : (
                filteredDinners.map((dinner) => <OpsDinnerRow key={dinner.id} dinner={dinner} />)
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
