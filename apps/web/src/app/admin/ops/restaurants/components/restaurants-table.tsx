"use client";

import { useState } from "react";
import type { Restaurant, RestaurantMember, User } from "@prisma/client";
import { RestaurantRow } from "./restaurant-row";

type RestaurantWithMembers = Restaurant & {
  members: (RestaurantMember & { user: User })[];
};

interface RestaurantsTableProps {
  restaurants: RestaurantWithMembers[];
}

export function RestaurantsTable({ restaurants }: RestaurantsTableProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "paused">("all");

  // Filter restaurants based on selected filter
  const filteredRestaurants = restaurants.filter((restaurant) => {
    if (filter === "all") return true;
    return restaurant.status === filter.toUpperCase();
  });

  // Count by status
  const counts = {
    pending: restaurants.filter((r) => r.status === "PENDING").length,
    active: restaurants.filter((r) => r.status === "ACTIVE").length,
    paused: restaurants.filter((r) => r.status === "PAUSED").length,
  };

  if (restaurants.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No restaurants yet
          </h3>
          <p className="text-slate-600">
            Restaurants will appear here once they register
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-600">Pending Review</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">
                {counts.pending}
              </div>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-600">Active</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">
                {counts.active}
              </div>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-600">Paused</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">
                {counts.paused}
              </div>
            </div>
            <div className="text-3xl">⏸️</div>
          </div>
        </div>
      </div>

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
          All ({restaurants.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === "pending"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Pending ({counts.pending})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === "active"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Active ({counts.active})
        </button>
        <button
          onClick={() => setFilter("paused")}
          className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === "paused"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Paused ({counts.paused})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No restaurants found for this filter
                  </td>
                </tr>
              ) : (
                filteredRestaurants.map((restaurant) => (
                  <RestaurantRow key={restaurant.id} restaurant={restaurant} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
