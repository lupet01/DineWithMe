import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, dinnerRepository, seatRepository, paymentIntentRepository } from "@dinewithme/db";
import { formatAmount } from "@dinewithme/config/src/payment";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { BreakdownList, type BreakdownRow } from "@/components/ui/breakdown-list";

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#FF6B4A",
  LIVE: "#22C55E",
  COMPLETED: "#9CA3AF",
  CANCELLED: "#EF4444",
};

const THEME_PALETTE = ["#FF6B4A", "#E85535", "#FFB4A0", "#7D2514", "#FF8F75"];

export default async function RestaurantAnalyticsPage() {
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

  const [dinners, seatStats, revenue] = await Promise.all([
    dinnerRepository.findByRestaurantWithTheme(restaurant.id),
    seatRepository.getRestaurantStats(restaurant.id),
    paymentIntentRepository.sumSucceededAmountForRestaurant(restaurant.id),
  ]);

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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">{restaurant.name}</p>
      </div>

      <StatGrid className="md:grid-cols-3">
        <StatCard label="Total Revenue" value={formatAmount(revenue)} />
        <StatCard label="Total Dinners" value={dinners.length} />
        <StatCard label="Guests Served" value={seatStats.totalGuests} />
      </StatGrid>

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
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Top Themes</h2>
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
