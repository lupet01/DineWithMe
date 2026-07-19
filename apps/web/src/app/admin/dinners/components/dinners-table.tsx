"use client";

import { useState } from "react";
import type { DinnerWithRestaurant } from "@dinewithme/db";
import { DinnerRow } from "./dinner-row";

interface DinnersTableProps {
  dinners: DinnerWithRestaurant[];
}

export function DinnersTable({ dinners }: DinnersTableProps) {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  // Filter dinners based on selected filter
  const filteredDinners = dinners.filter((dinner) => {
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

  if (dinners.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No dinners yet
          </h3>
          <p className="text-slate-600 mb-6">
            Create your first dining experience to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        <button
          onClick={() => setFilter("all")}
          className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === "all"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          All Dinners
        </button>
        <button
          onClick={() => setFilter("upcoming")}
          className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === "upcoming"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter("past")}
          className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === "past"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Past
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Theme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Seats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDinners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
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
