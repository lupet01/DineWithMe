import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, dinnerRepository, paymentIntentRepository, feedbackRepository } from "@dinewithme/db";
import { formatAmount } from "@dinewithme/config/src/payment";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { BreakdownList, type BreakdownRow } from "@/components/ui/breakdown-list";
import { ProgressList } from "@/components/ui/progress-list";
import { RevenueRangePicker } from "../components/revenue-range-picker";
import { rangeToSince } from "../lib/date-range";

const BOOKED_STATUSES = new Set(["CONFIRMED", "ATTENDED", "COMPLETED"]);

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#FF6B4A",
  LIVE: "#22C55E",
  COMPLETED: "#9CA3AF",
  CANCELLED: "#EF4444",
};

const THEME_PALETTE = ["#FF6B4A", "#E85535", "#FFB4A0", "#7D2514", "#FF8F75"];

export default async function RestaurantAnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0] || null;

  if (!restaurant) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <Card padding="lg" className="text-center text-gray-600">
          Set up your restaurant profile first to see analytics here.
        </Card>
      </div>
    );
  }

  const range = searchParams.range || "30d";
  const since = rangeToSince(range);
  const prevWindowMs = Date.now() - since.getTime();
  const prevSince = new Date(since.getTime() - prevWindowMs);

  const [dinners, dinnersInRange, revenue, prevRevenue, avgRating, recentDinners] =
    await Promise.all([
      dinnerRepository.findByRestaurantWithTheme(restaurant.id),
      dinnerRepository.findByRestaurantWithSeatCountsSince(restaurant.id, since),
      paymentIntentRepository.sumSucceededAmountForRestaurantSince(restaurant.id, since),
      paymentIntentRepository.sumSucceededAmountForRestaurantBetween(restaurant.id, prevSince, since),
      feedbackRepository.getAverageRatingForRestaurant(restaurant.id),
      dinnerRepository.findRecentByRestaurantWithSeatCounts(restaurant.id, 5),
    ]);

  const revenueDeltaPct =
    prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null;

  const fillRates = dinnersInRange
    .filter((d) => d._count.seats > 0)
    .map((d) => d.seats.filter((s) => BOOKED_STATUSES.has(s.status)).length / d._count.seats);
  const avgFillRate =
    fillRates.length > 0 ? fillRates.reduce((a, b) => a + b, 0) / fillRates.length : null;

  const statusCounts = dinners.reduce<Record<string, number>>((acc, dinner) => {
    acc[dinner.status] = (acc[dinner.status] ?? 0) + 1;
    return acc;
  }, {});

  const statusRows: BreakdownRow[] = Object.entries(statusCounts).map(([status, count]) => ({
    label: status,
    value: count,
    color: STATUS_COLORS[status] ?? "#9CA3AF",
  }));

  const themeCounts = dinners.reduce<Record<string, number>>((acc, dinner) => {
    const title = dinner.theme?.title ?? "No theme";
    acc[title] = (acc[title] ?? 0) + 1;
    return acc;
  }, {});

  const themeRows: BreakdownRow[] = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, count], i) => ({
      label: title,
      value: count,
      color: THEME_PALETTE[i % THEME_PALETTE.length] ?? "#FF6B4A",
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">{restaurant.name}&apos;s own performance</p>
        </div>
        <RevenueRangePicker current={range} />
      </div>

      <StatGrid className="md:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatAmount(revenue)}
          caption={
            revenueDeltaPct !== null
              ? `${revenueDeltaPct >= 0 ? "↑" : "↓"} ${Math.abs(revenueDeltaPct)}% vs prior period`
              : undefined
          }
        />
        <StatCard label="Dinners Hosted" value={dinnersInRange.length} caption="in selected period" />
        <StatCard
          label="Avg Fill Rate"
          value={avgFillRate !== null ? `${Math.round(avgFillRate * 100)}%` : "—"}
          caption="in selected period"
        />
        <StatCard
          label="Avg Dinner Rating"
          value={avgRating ? `${avgRating.average.toFixed(1)} ★` : "—"}
          caption={avgRating ? `From ${avgRating.count} feedback${avgRating.count === 1 ? "" : "s"}, all-time` : "No ratings yet"}
        />
      </StatGrid>

      <Card padding="none">
        <div className="p-5 pb-0">
          <h2 className="text-sm font-semibold text-gray-900">Fill Rate — Recent Dinners</h2>
        </div>
        {recentDinners.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No dinners yet</p>
        ) : (
          <div className="mt-2">
            <ProgressList
              rows={recentDinners.map((dinner) => {
                const booked = dinner.seats.filter((s) => BOOKED_STATUSES.has(s.status)).length;
                const total = dinner._count.seats;
                return {
                  label: `${new Date(dinner.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${dinner.theme?.title ?? "Dinner"}`,
                  value: booked,
                  max: total || 1,
                  caption: `${booked}/${total}`,
                };
              })}
            />
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card padding="lg">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Dinners by Status</h2>
          {statusRows.length === 0 ? (
            <p className="text-sm text-gray-500">No dinners yet</p>
          ) : (
            <BreakdownList rows={statusRows} />
          )}
        </Card>
        <Card padding="lg">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Dinners by Theme</h2>
          {themeRows.length === 0 ? (
            <p className="text-sm text-gray-500">No dinners yet</p>
          ) : (
            <BreakdownList rows={themeRows} />
          )}
        </Card>
      </div>
    </div>
  );
}
