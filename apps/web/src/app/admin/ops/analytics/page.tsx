import {
  restaurantRepository,
  dinnerRepository,
  paymentIntentRepository,
  seatRepository,
} from "@dinewithme/db";
import { formatAmount } from "@dinewithme/config/src/payment";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { BreakdownList, type BreakdownRow } from "@/components/ui/breakdown-list";
import { ProgressList } from "@/components/ui/progress-list";

const RESTAURANT_STATUS_COLORS: Record<string, string> = {
  PENDING: "#F59E0B",
  ACTIVE: "#22C55E",
  PAUSED: "#EF4444",
};

const DINNER_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#3B82F6",
  LIVE: "#22C55E",
  COMPLETED: "#9CA3AF",
  CANCELLED: "#EF4444",
};

export default async function PlatformAnalyticsPage() {
  const [restaurantStatusCounts, dinnerStatusCounts, dinnersByTheme, totalRevenue, seatStats] =
    await Promise.all([
      restaurantRepository.countByStatus(),
      dinnerRepository.countByStatus(),
      dinnerRepository.countByTheme(),
      paymentIntentRepository.sumSucceededAmount(),
      seatRepository.countBookedVsTotal(),
    ]);

  const totalRestaurants = Object.values(restaurantStatusCounts).reduce((a, b) => a + b, 0);
  const totalDinners = Object.values(dinnerStatusCounts).reduce((a, b) => a + b, 0);
  const fillRate =
    seatStats.total === 0 ? 0 : Math.round((seatStats.booked / seatStats.total) * 100);

  const restaurantStatusRows: BreakdownRow[] = Object.entries(restaurantStatusCounts).map(
    ([status, count]) => ({
      label: status.charAt(0) + status.slice(1).toLowerCase(),
      value: count,
      color: RESTAURANT_STATUS_COLORS[status] ?? "#9CA3AF",
    })
  );

  const dinnerStatusRows: BreakdownRow[] = Object.entries(dinnerStatusCounts).map(
    ([status, count]) => ({
      label: status.charAt(0) + status.slice(1).toLowerCase(),
      value: count,
      color: DINNER_STATUS_COLORS[status] ?? "#9CA3AF",
    })
  );

  const maxThemeCount = dinnersByTheme[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
        <p className="text-gray-600 mt-1">Aggregate stats computed directly from our database</p>
      </div>

      <StatGrid className="md:grid-cols-4">
        <StatCard label="Total Restaurants" value={totalRestaurants} />
        <StatCard label="Total Dinners" value={totalDinners} />
        <StatCard
          label="Seat Fill Rate"
          value={`${fillRate}%`}
          caption={`${seatStats.booked} booked / ${seatStats.total} total`}
        />
        <StatCard label="Total Revenue" value={formatAmount(totalRevenue)} caption="Succeeded payments only" />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card padding="lg">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Restaurants by Status</h2>
          {restaurantStatusRows.every((r) => r.value === 0) ? (
            <p className="text-sm text-gray-500">No restaurants yet</p>
          ) : (
            <BreakdownList rows={restaurantStatusRows} />
          )}
        </Card>
        <Card padding="lg">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Dinners by Status</h2>
          {dinnerStatusRows.every((r) => r.value === 0) ? (
            <p className="text-sm text-gray-500">No dinners yet</p>
          ) : (
            <BreakdownList rows={dinnerStatusRows} />
          )}
        </Card>
      </div>

      <Card padding="none">
        <div className="p-5 pb-0">
          <h2 className="text-sm font-semibold text-gray-900">Dinners by Theme</h2>
        </div>
        {dinnersByTheme.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No dinners yet</p>
        ) : (
          <div className="mt-2">
            <ProgressList
              rows={dinnersByTheme.map((t) => ({
                label: t.themeTitle,
                value: t.count,
                max: maxThemeCount,
              }))}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
