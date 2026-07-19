import { restaurantRepository } from "@dinewithme/db";
import { RestaurantsTable } from "./components/restaurants-table";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default async function OpsRestaurantsPage() {
  // Fetch all restaurants with members in a single query (fixes N+1 issue)
  const restaurants = await restaurantRepository.findManyWithMembers();

  // Count by status
  const pendingCount = restaurants.filter((r) => r.status === "PENDING").length;
  const activeCount = restaurants.filter((r) => r.status === "ACTIVE").length;
  const pausedCount = restaurants.filter((r) => r.status === "PAUSED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Restaurant Management</h2>
        <p className="text-slate-600 mt-1">
          Review and manage restaurant applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Total Restaurants</div>
          <div className="text-2xl font-semibold text-slate-900">{restaurants.length}</div>
        </div>

        {/* Pending */}
        <Link
          href="/admin/ops/restaurants/pending"
          className="bg-white rounded-lg border border-slate-200 p-4 hover:border-yellow-300 hover:bg-yellow-50 transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-slate-600 group-hover:text-yellow-700">Pending Approval</div>
            {pendingCount > 0 && (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
          </div>
          <div className="text-2xl font-semibold text-yellow-600">{pendingCount}</div>
        </Link>

        {/* Active */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Active</div>
          <div className="text-2xl font-semibold text-green-600">{activeCount}</div>
        </div>

        {/* Paused */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Paused</div>
          <div className="text-2xl font-semibold text-red-600">{pausedCount}</div>
        </div>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-900 mb-1">
              Action Required
            </h3>
            <p className="text-sm text-yellow-800">
              {pendingCount} restaurant{pendingCount !== 1 ? 's' : ''} waiting for approval.{' '}
              <Link
                href="/admin/ops/restaurants/pending"
                className="font-medium underline hover:no-underline"
              >
                Review now
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <RestaurantsTable restaurants={restaurants} />
    </div>
  );
}
