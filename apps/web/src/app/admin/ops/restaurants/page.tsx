import type { RestaurantStatus } from "@prisma/client";
import { restaurantRepository, restaurantClosureRequestRepository } from "@dinewithme/db";
import Link from "next/link";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { UrlTabs } from "@/components/ui/url-tabs";
import { TableSearch } from "@/components/ui/table-search";
import { UrlSelect } from "@/components/ui/url-select";
import { Pagination } from "@/components/ui/pagination";
import { RestaurantsTable } from "./components/restaurants-table";

const PAGE_SIZE = 20;

// Only known tab values map to a status filter; anything else is ignored so a
// hand-edited ?status= can never reach Prisma as an invalid enum value.
const STATUS_VALUES: Record<string, RestaurantStatus> = {
  pending: "PENDING",
  active: "ACTIVE",
  paused: "PAUSED",
  archived: "ARCHIVED",
};

export default async function OpsRestaurantsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; status?: string; city?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const search = searchParams.q ?? "";
  const status = searchParams.status ? STATUS_VALUES[searchParams.status] : undefined;
  const city = searchParams.city || undefined;

  const [{ restaurants, total }, counts, cities, pendingClosureRequests] = await Promise.all([
    restaurantRepository.findManyWithMembersPaginated({
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      search,
      status,
      city,
    }),
    restaurantRepository.countByStatus(),
    restaurantRepository.listCities(),
    restaurantClosureRequestRepository.findPending(),
  ]);

  // counts is keyed by the RestaurantStatus enum (UPPERCASE); `total` from the
  // paginated query is the filtered match count for the pager, so the
  // all-restaurants figure is summed separately here.
  const totalRestaurants = counts.PENDING + counts.ACTIVE + counts.PAUSED + counts.ARCHIVED;

  const statusTabs = [
    { value: "all", label: `All (${totalRestaurants})` },
    { value: "pending", label: `Pending (${counts.PENDING})` },
    { value: "active", label: `Active (${counts.ACTIVE})` },
    { value: "paused", label: `Paused (${counts.PAUSED})` },
    { value: "archived", label: `Archived (${counts.ARCHIVED})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Restaurant Management</h2>
        <p className="text-gray-600 mt-1">Review and manage restaurant applications</p>
      </div>

      {/* Stats Cards — always full-dataset, independent of the active filter/page */}
      <StatGrid className="md:grid-cols-5">
        <StatCard label="Total Restaurants" value={totalRestaurants} />
        <Link href="/admin/ops/restaurants/pending">
          <Card padding="lg" className="transition-colors hover:bg-amber-50">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-600">Pending Approval</div>
              {counts.PENDING > 0 && <AlertCircle className="h-4 w-4 text-amber-600" />}
            </div>
            <div className="text-3xl font-semibold text-amber-600">{counts.PENDING}</div>
          </Card>
        </Link>
        <StatCard label="Active" value={<span className="text-green-600">{counts.ACTIVE}</span>} />
        <StatCard label="Paused" value={<span className="text-red-600">{counts.PAUSED}</span>} />
        <StatCard label="Archived" value={<span className="text-gray-500">{counts.ARCHIVED}</span>} />
      </StatGrid>

      {/* Pending Alert */}
      {counts.PENDING > 0 && (
        <Card padding="lg" className="border-amber-200 bg-amber-50 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">Action Required</h3>
            <p className="text-sm text-amber-800">
              {counts.PENDING} restaurant{counts.PENDING !== 1 ? "s" : ""} waiting for approval.{" "}
              <Link
                href="/admin/ops/restaurants/pending"
                className="font-medium underline hover:no-underline"
              >
                Review now
              </Link>
            </p>
          </div>
        </Card>
      )}

      {/* Closure Requests Alert */}
      {pendingClosureRequests.length > 0 && (
        <Card padding="lg" className="border-red-200 bg-red-50 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900 mb-1">Closure Requests</h3>
            <ul className="space-y-1">
              {pendingClosureRequests.map((request) => (
                <li key={request.id} className="text-sm text-red-800">
                  <Link
                    href={`/admin/ops/restaurants/${request.restaurantId}`}
                    className="font-medium underline hover:no-underline"
                  >
                    {request.restaurant.name}
                  </Link>{" "}
                  wants to close - requested by {request.requestedBy.firstName || request.requestedBy.email}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <UrlTabs param="status" items={statusTabs} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <TableSearch placeholder="Search by name..." className="sm:w-56" />
          <UrlSelect
            param="city"
            options={cities}
            allLabel="All locations"
            aria-label="Filter by location"
            className="rounded-full border border-gray-100 bg-white px-4 py-3 text-sm text-gray-900 shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
      </div>

      {/* Table */}
      <RestaurantsTable restaurants={restaurants} />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}
