import Link from "next/link";
import { AlertCircle, FileClock, Store, Palette } from "lucide-react";
import {
  restaurantRepository,
  dinnerRepository,
  paymentIntentRepository,
  auditLogRepository,
} from "@dinewithme/db";
import { formatAmount } from "@dinewithme/config/src/payment";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { ActivityFeed, ActivityItem } from "@/components/ui/activity-feed";

export default async function CockpitPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [pendingRestaurants, rollingRevenue, weekStats, recentActivity, restaurantStatusCounts] =
    await Promise.all([
      restaurantRepository.findPending(),
      paymentIntentRepository.sumSucceededAmountSince(thirtyDaysAgo),
      dinnerRepository.getStatsForDateRange(weekStart, weekEnd),
      auditLogRepository.findMany(10),
      restaurantRepository.countByStatus(),
    ]);

  const fillRate =
    weekStats.totalSeats === 0
      ? 0
      : Math.round((weekStats.bookedSeats / weekStats.totalSeats) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Cockpit</h2>
        <p className="text-gray-600 mt-1">Platform-wide overview</p>
      </div>

      {pendingRestaurants.length > 0 && (
        <Card padding="lg" className="border-amber-200 bg-amber-50 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">Action Required</h3>
            <p className="text-sm text-amber-800">
              {pendingRestaurants.length} restaurant{pendingRestaurants.length !== 1 ? "s" : ""}{" "}
              waiting for approval.{" "}
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

      <StatGrid className="md:grid-cols-4">
        <StatCard
          label="Revenue (30d)"
          value={formatAmount(rollingRevenue)}
        />
        <StatCard
          label="Dinners This Week"
          value={weekStats.dinnerCount}
        />
        <StatCard
          label="Fill Rate This Week"
          value={`${fillRate}%`}
          caption={`${weekStats.bookedSeats} of ${weekStats.totalSeats} seats`}
        />
        <StatCard
          label="Active Restaurants"
          value={restaurantStatusCounts.ACTIVE}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card padding="none" className="lg:col-span-2">
          <div className="p-6 pb-0">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <ActivityFeed isEmpty={recentActivity.length === 0} className="mt-4">
            {recentActivity.map((entry) => {
              // AuditLog has no restaurantId column - entityType/entityId
              // are the only fields that identify what an entry is about.
              // Only "restaurant" entries have an entityId that IS a
              // restaurant id, so that's the only case safe to link -
              // linking a "dinner" or "seat" entry to the restaurant
              // detail page would just be a guess.
              const href =
                entry.entityType === "restaurant"
                  ? `/admin/ops/restaurants/${entry.entityId}`
                  : undefined;

              return (
                <ActivityItem
                  key={entry.id}
                  icon={FileClock}
                  href={href}
                  title={
                    <>
                      <span className="font-medium">
                        {entry.actor.firstName || entry.actor.email}
                      </span>{" "}
                      {entry.actionType.toLowerCase().replace(/_/g, " ")}
                    </>
                  }
                  timestamp={new Date(entry.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                />
              );
            })}
          </ActivityFeed>
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Go To</h2>
          <div className="space-y-2">
            <Link
              href="/admin/ops/restaurants"
              className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 text-left transition-colors hover:border-primary-200 hover:bg-cream-100"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                <Store className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Restaurants</div>
                <div className="text-xs text-gray-600">
                  {pendingRestaurants.length} pending approval
                </div>
              </div>
            </Link>

            <Link
              href="/admin/ops/themes"
              className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 text-left transition-colors hover:border-primary-200 hover:bg-cream-100"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                <Palette className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Theme Library</div>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
