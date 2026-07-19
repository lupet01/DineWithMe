import { restaurantRepository } from "@dinewithme/db";
import { RestaurantsTable } from "./components/restaurants-table";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";

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
        <h2 className="text-xl font-semibold text-gray-900">Restaurant Management</h2>
        <p className="text-gray-600 mt-1">
          Review and manage restaurant applications
        </p>
      </div>

      {/* Stats Cards */}
      <StatGrid className="md:grid-cols-4">
        <StatCard label="Total Restaurants" value={restaurants.length} />
        <Link href="/admin/ops/restaurants/pending">
          <Card padding="lg" className="transition-colors hover:bg-amber-50">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-600">Pending Approval</div>
              {pendingCount > 0 && <AlertCircle className="h-4 w-4 text-amber-600" />}
            </div>
            <div className="text-3xl font-semibold text-amber-600">{pendingCount}</div>
          </Card>
        </Link>
        <StatCard label="Active" value={<span className="text-green-600">{activeCount}</span>} />
        <StatCard label="Paused" value={<span className="text-red-600">{pausedCount}</span>} />
      </StatGrid>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <Card padding="lg" className="border-amber-200 bg-amber-50 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              Action Required
            </h3>
            <p className="text-sm text-amber-800">
              {pendingCount} restaurant{pendingCount !== 1 ? 's' : ''} waiting for approval.{' '}
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

      {/* Table */}
      <RestaurantsTable restaurants={restaurants} />
    </div>
  );
}
