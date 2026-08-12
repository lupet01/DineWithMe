import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, dinnerRepository, paymentIntentRepository, feedbackRepository, seatRepository } from "@dinewithme/db";
import { formatAmount } from "@dinewithme/config/src/payment";
import { RevenueRangePicker } from "../components/revenue-range-picker";
import { rangeToSince } from "../lib/date-range";
import { RevenueChart } from "@/components/ui/revenue-chart";

const BOOKED_STATUSES = new Set(["CONFIRMED", "ATTENDED", "COMPLETED"]);

const THEME_PALETTE = ["#FF6B4A", "#E85535", "#FFB4A0", "#7D2514", "#FF8F75"];

const TIME_OF_DAY_COLORS: Record<string, string> = {
  Morning: "#FFB4A0",
  Afternoon: "#FF8F75",
  Evening: "#FF6B4A",
  Night: "#7D2514",
};

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
      <div>
        <h1 className="pg-title" style={{ marginBottom: 16 }}>
          Analytics
        </h1>
        <div className="card card-pad" style={{ textAlign: "center", color: "var(--t3)" }}>
          Set up your restaurant profile first to see analytics here.
        </div>
      </div>
    );
  }

  const range = searchParams.range || "30d";
  const since = rangeToSince(range);
  const prevWindowMs = Date.now() - since.getTime();
  const prevSince = new Date(since.getTime() - prevWindowMs);

  const [dinners, dinnersInRange, revenue, prevRevenue, avgRating, recentDinners, revenueBuckets, bookingsByTimeOfDay] =
    await Promise.all([
      dinnerRepository.findByRestaurantWithTheme(restaurant.id),
      dinnerRepository.findByRestaurantWithSeatCountsSince(restaurant.id, since),
      paymentIntentRepository.sumSucceededAmountForRestaurantSince(restaurant.id, since),
      paymentIntentRepository.sumSucceededAmountForRestaurantBetween(restaurant.id, prevSince, since),
      feedbackRepository.getAverageRatingForRestaurant(restaurant.id),
      dinnerRepository.findRecentByRestaurantWithSeatCounts(restaurant.id, 5),
      paymentIntentRepository.sumSucceededAmountByBucketForRestaurantSince(restaurant.id, since),
      seatRepository.countBookingsByTimeOfDayForRestaurantSince(restaurant.id, since),
    ]);

  const revenueDeltaPct =
    prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null;

  const fillRates = dinnersInRange
    .filter((d) => d._count.seats > 0)
    .map((d) => d.seats.filter((s) => BOOKED_STATUSES.has(s.status)).length / d._count.seats);
  const avgFillRate =
    fillRates.length > 0 ? fillRates.reduce((a, b) => a + b, 0) / fillRates.length : null;

  const timeOfDayRows = [
    { label: "Morning", value: bookingsByTimeOfDay.morning },
    { label: "Afternoon", value: bookingsByTimeOfDay.afternoon },
    { label: "Evening", value: bookingsByTimeOfDay.evening },
    { label: "Night", value: bookingsByTimeOfDay.night },
  ].map((row) => ({ ...row, color: TIME_OF_DAY_COLORS[row.label] ?? "#9CA3AF" }));

  const themeCounts = dinners.reduce<Record<string, number>>((acc, dinner) => {
    const title = dinner.theme?.title ?? "No theme";
    acc[title] = (acc[title] ?? 0) + 1;
    return acc;
  }, {});

  const themeRows = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, count], i) => ({
      label: title,
      value: count,
      color: THEME_PALETTE[i % THEME_PALETTE.length] ?? "#FF6B4A",
    }));

  return (
    <div className="analytics">
      <p className="pg-sub only-desktop" style={{ marginBottom: 12 }}>
        <Link href="/admin" style={{ color: "var(--p)", fontWeight: 600 }}>
          ← Dashboard
        </Link>{" "}
        / Analytics
      </p>
      <div className="only-mobile-flex" style={{ alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Link href="/admin" className="m-icon-btn" aria-label="Back to Dashboard">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="pg-title" style={{ flex: 1, textAlign: "center" }}>
          Analytics
        </h1>
        <div style={{ width: 32 }} />
      </div>
      <div className="only-desktop" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
        <div>
          <h1 className="pg-title">Analytics</h1>
          <p className="pg-sub">{restaurant.name}&apos;s own performance</p>
        </div>
        <RevenueRangePicker current={range} />
      </div>
      <div className="only-mobile-flex" style={{ justifyContent: "flex-end", marginBottom: 14 }}>
        <RevenueRangePicker current={range} />
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <RevenueChart
          totalLabel={formatAmount(revenue)}
          deltaPct={revenueDeltaPct}
          buckets={revenueBuckets}
        />
      </div>

      <div className="stat-grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Dinners Hosted</div>
          <div className="stat-value">{dinnersInRange.length}</div>
          <div className="stat-sub">in selected period</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Fill Rate</div>
          <div className="stat-value">{avgFillRate !== null ? `${Math.round(avgFillRate * 100)}%` : "—"}</div>
          <div className="stat-sub">in selected period</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Dinner Rating</div>
          {/* Rating renders in yellow/gold — the file-wide "X.X ★" convention
              shared with Guest Feedback, Guest Profile, and the Completed
              Dinner Summary — not orange, which is reserved for the one
              primary action per screen. */}
          <div className="stat-value" style={{ color: "var(--yellow-txt)" }}>
            {avgRating ? `${avgRating.average.toFixed(1)} ★` : "—"}
          </div>
          <div className="stat-sub">
            {avgRating ? `From ${avgRating.count} feedback${avgRating.count === 1 ? "" : "s"}, all-time` : "No ratings yet"}
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>
          Fill Rate — Recent Dinners
        </div>
        {recentDinners.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--t3)" }}>No dinners yet</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentDinners.map((dinner) => {
              const booked = dinner.seats.filter((s) => BOOKED_STATUSES.has(s.status)).length;
              const total = dinner._count.seats;
              const pct = total > 0 ? Math.round((booked / total) * 100) : 0;
              return (
                <div key={dinner.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--t2)", marginBottom: 5 }}>
                    <span>
                      {new Date(dinner.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                      {dinner.theme?.title ?? "Dinner"}
                    </span>
                    <span style={{ color: "var(--t3)" }}>
                      {booked}/{total}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop: Dinners by Theme (left) then Bookings by Time of Day
          (right), matching the wireframe's ordering. */}
      <div className="cards-grid-2">
        <div className="card card-pad">
          <div className="card-title" style={{ marginBottom: 8 }}>
            Dinners by Theme
          </div>
          {themeRows.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--t3)" }}>No dinners yet</p>
          ) : (
            themeRows.map((row) => (
              <div key={row.label} className="breakdown-row">
                <span className="breakdown-label">
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: row.color, marginRight: 8 }} />
                  {row.label}
                </span>
                <span className="breakdown-value">{row.value}</span>
              </div>
            ))
          )}
        </div>
        <div className="card card-pad">
          <div className="card-title" style={{ marginBottom: 8 }}>
            Bookings by Time of Day
          </div>
          {timeOfDayRows.every((row) => row.value === 0) ? (
            <p style={{ fontSize: 13, color: "var(--t3)" }}>No bookings yet</p>
          ) : (
            <>
              {timeOfDayRows.map((row) => (
                <div key={row.label} className="breakdown-row">
                  <span className="breakdown-label">
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: row.color, marginRight: 8 }} />
                    {row.label}
                  </span>
                  <span className="breakdown-value">{row.value}</span>
                </div>
              ))}
              <p style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 8 }}>
                When guests actually book — not when the dinner happens. Timing a social post or push
                notification for your busiest window catches people mid-browse.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
