import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Plus, Store, FileClock, Users, BarChart3 } from "lucide-react";
import { getAuthUser } from "@/lib/auth/server";
import {
  restaurantRepository,
  dinnerRepository,
  seatRepository,
  auditLogRepository,
  paymentIntentRepository,
  feedbackRepository,
} from "@dinewithme/db";
import { formatAmount } from "@dinewithme/config/src/payment";
import { Role } from "@dinewithme/shared";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { ActivityFeed, ActivityItem } from "@/components/ui/activity-feed";
import { updateDinnerStatus } from "./dinners/actions";

export default async function AdminDashboardPage() {
  const user = await getAuthUser();

  if (!user) {
    return null;
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0] || null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [stats, revenue30d, avgRating, upcomingDinners] = restaurant
    ? await Promise.all([
        seatRepository.getRestaurantStats(restaurant.id),
        paymentIntentRepository.sumSucceededAmountForRestaurantSince(restaurant.id, thirtyDaysAgo),
        feedbackRepository.getAverageRatingForRestaurant(restaurant.id),
        dinnerRepository.findUpcomingByRestaurantWithSeatCounts(restaurant.id),
      ])
    : [{ activeSeats: 0, totalGuests: 0 }, 0, null, []];

  // Platform-wide audit log is only safe to show a platform admin - a
  // restaurant admin should never see other restaurants' activity, and
  // AuditLog has no restaurantId to scope by.
  const recentActivity =
    user.role === Role.PLATFORM_ADMIN ? await auditLogRepository.findMany(10) : [];

  const bookedStatuses = new Set(["CONFIRMED", "ATTENDED", "COMPLETED"]);
  const upcomingDinnersForTable = upcomingDinners.slice(0, 5);

  /**
   * Marks a dinner LIVE from the dashboard's mini-table. Delegates to the
   * existing dinners/actions.ts updateDinnerStatus (which already handles
   * auth, analytics, and audit logging) and additionally revalidates this
   * page - updateDinnerStatus only revalidates /admin/dinners, not /admin.
   */
  async function markDinnerLive(dinnerId: string) {
    "use server";
    await updateDinnerStatus(dinnerId, "LIVE");
    revalidatePath("/admin");
  }

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
      <StatGrid className="md:grid-cols-4">
        <StatCard
          label="Upcoming Dinners"
          value={upcomingDinners.length}
          caption={upcomingDinners.length === 0 ? "No upcoming dinners" : undefined}
        />
        <StatCard
          label="Seats Confirmed"
          value={stats.activeSeats}
          caption={stats.activeSeats === 0 ? "No confirmed seats" : undefined}
        />
        <StatCard label="Revenue (30d)" value={formatAmount(revenue30d)} />
        <StatCard
          label="Avg Dinner Rating"
          value={avgRating ? avgRating.average.toFixed(1) : "—"}
          caption={avgRating ? `${avgRating.count} rating${avgRating.count === 1 ? "" : "s"}` : "No ratings yet"}
        />
      </StatGrid>

      {/* Upcoming Dinners */}
      <Card padding="none">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Dinners</h2>
        </div>
        {upcomingDinnersForTable.length === 0 ? (
          <div className="px-6 pb-6 text-sm text-gray-500">No upcoming dinners scheduled.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingDinnersForTable.map((dinner) => {
              const confirmedCount = dinner.seats.filter((seat) =>
                bookedStatuses.has(seat.status)
              ).length;

              return (
                <div
                  key={dinner.id}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {dinner.theme?.title || "Untitled dinner"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(dinner.startsAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      &middot; {confirmedCount} / {dinner._count.seats} seats
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/dinners/${dinner.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-cream-200 rounded-lg hover:bg-cream-300 transition-colors"
                    >
                      View
                    </Link>
                    {dinner.status === "SCHEDULED" && (
                      <form action={markDinnerLive.bind(null, dinner.id)}>
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          Mark Live
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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

          <Link
            href="/admin/guests"
            className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 text-left transition-colors hover:border-primary-200 hover:bg-cream-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">View Guest List</div>
              <div className="text-sm text-gray-600">See everyone who has booked</div>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 text-left transition-colors hover:border-primary-200 hover:bg-cream-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <BarChart3 className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">View Analytics</div>
              <div className="text-sm text-gray-600">Track performance over time</div>
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
