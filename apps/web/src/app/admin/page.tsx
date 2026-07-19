import Link from "next/link";
import { Plus, Store, FileClock } from "lucide-react";
import { getAuthUser } from "@/lib/auth/server";
import {
  restaurantRepository,
  dinnerRepository,
  seatRepository,
  auditLogRepository,
} from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { ActivityFeed, ActivityItem } from "@/components/ui/activity-feed";

export default async function AdminDashboardPage() {
  const user = await getAuthUser();

  if (!user) {
    return null;
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0] || null;

  const [dinners, stats] = restaurant
    ? await Promise.all([
        dinnerRepository.findByRestaurant(restaurant.id),
        seatRepository.getRestaurantStats(restaurant.id),
      ])
    : [[], { activeSeats: 0, totalGuests: 0 }];

  // Platform-wide audit log is only safe to show a platform admin - a
  // restaurant admin should never see other restaurants' activity, and
  // AuditLog has no restaurantId to scope by.
  const recentActivity =
    user.role === Role.PLATFORM_ADMIN ? await auditLogRepository.findMany(10) : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.firstName || user?.email}
        </p>
      </div>

      {/* Stats Grid */}
      <StatGrid>
        <StatCard
          label="Total Dinners"
          value={dinners.length}
          caption={dinners.length === 0 ? "No dinners yet" : undefined}
        />
        <StatCard
          label="Active Seats"
          value={stats.activeSeats}
          caption={stats.activeSeats === 0 ? "No active seats" : undefined}
        />
        <StatCard
          label="Total Guests"
          value={stats.totalGuests}
          caption={stats.totalGuests === 0 ? "No guests yet" : undefined}
        />
      </StatGrid>

      {/* Quick Actions */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/admin/dinners/new"
            className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 text-left transition-colors hover:border-primary-200 hover:bg-cream-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <Plus className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Create Dinner</div>
              <div className="text-sm text-gray-600">Set up a new dining experience</div>
            </div>
          </Link>

          <Link
            href="/admin/restaurant"
            className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 text-left transition-colors hover:border-primary-200 hover:bg-cream-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <Store className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Update Restaurant</div>
              <div className="text-sm text-gray-600">Edit your restaurant profile</div>
            </div>
          </Link>
        </div>
      </Card>

      {/* Recent Activity */}
      {user.role === Role.PLATFORM_ADMIN && (
        <Card padding="none">
          <div className="p-6 pb-0">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <ActivityFeed isEmpty={recentActivity.length === 0} className="mt-4">
            {recentActivity.map((entry) => (
              <ActivityItem
                key={entry.id}
                icon={FileClock}
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
            ))}
          </ActivityFeed>
        </Card>
      )}
    </div>
  );
}
