import {
  restaurantRepository,
  dinnerRepository,
  seatRepository,
  paymentIntentRepository,
} from "@dinewithme/db";

function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
}

function formatPercent(numerator: number, denominator: number): string {
  if (denominator === 0) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export default async function OpsAnalyticsPage() {
  const [restaurantCounts, dinnerCounts, seatTotals, totalRevenueCents, dinnersByTheme] =
    await Promise.all([
      restaurantRepository.countByStatus(),
      dinnerRepository.countByStatus(),
      seatRepository.countBookedVsTotal(),
      paymentIntentRepository.sumSucceededAmount(),
      dinnerRepository.countByTheme(),
    ]);

  const totalRestaurants =
    restaurantCounts.PENDING + restaurantCounts.ACTIVE + restaurantCounts.PAUSED;
  const totalDinners =
    dinnerCounts.SCHEDULED + dinnerCounts.LIVE + dinnerCounts.COMPLETED + dinnerCounts.CANCELLED;
  const maxThemeCount = dinnersByTheme.reduce((max, t) => Math.max(max, t.count), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Platform Analytics</h2>
        <p className="text-slate-600 mt-1">
          Aggregate stats computed directly from our database
        </p>
      </div>

      {/* Top-level stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Total Restaurants</div>
          <div className="text-2xl font-semibold text-slate-900">{totalRestaurants}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Total Dinners</div>
          <div className="text-2xl font-semibold text-slate-900">{totalDinners}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Seat Fill Rate</div>
          <div className="text-2xl font-semibold text-slate-900">
            {formatPercent(seatTotals.booked, seatTotals.total)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {seatTotals.booked} booked / {seatTotals.total} total
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Total Revenue</div>
          <div className="text-2xl font-semibold text-slate-900">
            {formatCurrency(totalRevenueCents)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Succeeded payments only</div>
        </div>
      </div>

      {/* Restaurant status breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Restaurants by Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-sm font-medium text-slate-600">Pending</div>
            <div className="text-2xl font-semibold text-yellow-600 mt-1">
              {restaurantCounts.PENDING}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-sm font-medium text-slate-600">Active</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">
              {restaurantCounts.ACTIVE}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-sm font-medium text-slate-600">Paused</div>
            <div className="text-2xl font-semibold text-red-600 mt-1">
              {restaurantCounts.PAUSED}
            </div>
          </div>
        </div>
      </div>

      {/* Dinner status breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Dinners by Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-sm font-medium text-slate-600">Scheduled</div>
            <div className="text-2xl font-semibold text-blue-600 mt-1">
              {dinnerCounts.SCHEDULED}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-sm font-medium text-slate-600">Live</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">
              {dinnerCounts.LIVE}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-sm font-medium text-slate-600">Completed</div>
            <div className="text-2xl font-semibold text-slate-900 mt-1">
              {dinnerCounts.COMPLETED}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-sm font-medium text-slate-600">Cancelled</div>
            <div className="text-2xl font-semibold text-red-600 mt-1">
              {dinnerCounts.CANCELLED}
            </div>
          </div>
        </div>
      </div>

      {/* Dinners by theme */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Dinners by Theme</h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {dinnersByTheme.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No dinners have been created yet
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {dinnersByTheme.map((theme) => (
                <div
                  key={theme.themeId}
                  className="px-6 py-3 flex items-center gap-4"
                >
                  <div className="w-40 flex-shrink-0 text-sm font-medium text-slate-900 truncate">
                    {theme.themeTitle}
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-900 h-2 rounded-full"
                      style={{
                        width:
                          maxThemeCount > 0
                            ? `${(theme.count / maxThemeCount) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <div className="w-10 flex-shrink-0 text-right text-sm text-slate-600">
                    {theme.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
