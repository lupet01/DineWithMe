"use client";

import { useMemo, useState } from "react";
import type { Restaurant, RestaurantMember, User } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { SearchBar } from "@/components/ui/search-bar";
import { RestaurantRow } from "./restaurant-row";

type RestaurantWithMembers = Restaurant & {
  members: (RestaurantMember & { user: User })[];
};

interface RestaurantsTableProps {
  restaurants: RestaurantWithMembers[];
}

export function RestaurantsTable({ restaurants }: RestaurantsTableProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "paused" | "archived">("all");
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  const counts = {
    pending: restaurants.filter((r) => r.status === "PENDING").length,
    active: restaurants.filter((r) => r.status === "ACTIVE").length,
    paused: restaurants.filter((r) => r.status === "PAUSED").length,
    archived: restaurants.filter((r) => r.status === "ARCHIVED").length,
  };

  const filterTabs = [
    { value: "all", label: `All (${restaurants.length})` },
    { value: "pending", label: `Pending (${counts.pending})` },
    { value: "active", label: `Active (${counts.active})` },
    { value: "paused", label: `Paused (${counts.paused})` },
    { value: "archived", label: `Archived (${counts.archived})` },
  ];

  const locations = useMemo(() => {
    const cities = new Set(restaurants.map((r) => r.city).filter(Boolean) as string[]);
    return Array.from(cities).sort();
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      if (filter !== "all" && restaurant.status !== filter.toUpperCase()) {
        return false;
      }
      if (locationFilter !== "all" && restaurant.city !== locationFilter) {
        return false;
      }
      if (query && !restaurant.name.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [restaurants, filter, locationFilter, search]);

  if (restaurants.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No restaurants yet
          </h3>
          <p className="text-gray-600">
            Restaurants will appear here once they register
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs items={filterTabs} value={filter} onChange={(v) => setFilter(v as typeof filter)} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchBar
            placeholder="Search by name..."
            value={search}
            onValueChange={setSearch}
            className="sm:w-56"
          />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-full border border-gray-100 bg-white px-4 py-3 text-sm text-gray-900 shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="all">All locations</option>
            {locations.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-100 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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
      </Card>
    </div>
  );
}
