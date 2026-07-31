import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Camera, Clock, Lock, ClipboardList, Store, Banknote, FileClock } from "lucide-react";
import { getAuthUser } from "@/lib/auth/server";
import {
  restaurantRepository,
  dinnerRepository,
  seatRepository,
  auditLogRepository,
  paymentIntentRepository,
  feedbackRepository,
  complianceDocumentRepository,
  payoutRepository,
} from "@dinewithme/db";
import { formatAmount } from "@dinewithme/config/src/payment";
import { Role } from "@dinewithme/shared";
import { LiveMomentBanner } from "./components/live-moment-banner";
import { RevenueRangePicker } from "./components/revenue-range-picker";
import { rangeToSince } from "./lib/date-range";
import { updateDinnerStatus } from "./dinners/actions";
import { checkInGuest } from "./dinners/[id]/actions";

export default async function AdminDashboardPage({
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

  const range = searchParams.range || "30d";
  const since = rangeToSince(range);
  const prevWindowMs = Date.now() - since.getTime();
  const prevSince = new Date(since.getTime() - prevWindowMs);

  const isPending = restaurant?.status === "PENDING";
  const isArchived = restaurant?.status === "ARCHIVED";
  const isLive = restaurant?.status === "ACTIVE" || restaurant?.status === "PAUSED";
  const showLiveMoment =
    restaurant?.status === "ACTIVE" && restaurant.liveMomentSeenAt === null;

  const [
    stats,
    revenue,
    prevRevenue,
    avgRating,
    upcomingDinners,
    liveDinner,
    complianceDocuments,
    payouts,
  ] =
    restaurant && !isPending
      ? await Promise.all([
          seatRepository.getRestaurantStats(restaurant.id),
          paymentIntentRepository.sumSucceededAmountForRestaurantSince(restaurant.id, since),
          paymentIntentRepository.sumSucceededAmountForRestaurantBetween(
            restaurant.id,
            prevSince,
            since
          ),
          feedbackRepository.getAverageRatingForRestaurant(restaurant.id),
          dinnerRepository.findUpcomingByRestaurantWithSeatCounts(restaurant.id),
          dinnerRepository.findLiveByRestaurant(restaurant.id),
          complianceDocumentRepository.findByRestaurant(restaurant.id),
          payoutRepository.findByRestaurant(restaurant.id),
        ])
      : [{ activeSeats: 0, totalGuests: 0 }, 0, 0, null, [], null, [], []];

  // Platform-wide audit log is only safe to show a platform admin - a
  // restaurant admin should never see other restaurants' activity, and
  // AuditLog has no restaurantId to scope by.
  const recentActivity =
    user.role === Role.PLATFORM_ADMIN ? await auditLogRepository.findMany(10) : [];

  const bookedStatuses = new Set(["CONFIRMED", "ATTENDED", "COMPLETED"]);
  const checkedInStatuses = new Set(["ATTENDED", "COMPLETED", "LEFT_EARLY"]);
  const upcomingDinnersForTable = upcomingDinners.slice(0, 5);

  const revenueDeltaPct =
    prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null;

  const pendingComplianceCount = complianceDocuments.filter((d) => !d.verifiedAt).length;
  const readyPayoutCents = payouts
    .filter((p) => p.status === "READY")
    .reduce((sum, p) => sum + p.netAmountCents, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const guestsToCheckInTonight = upcomingDinners
    .filter((d) => new Date(d.startsAt) >= today && new Date(d.startsAt) < tomorrow)
    .reduce((sum, d) => sum + d.seats.filter((s) => s.status === "CONFIRMED").length, 0);

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

  /**
   * Check-in from the Live Now card. Delegates to dinners/[id]/actions.ts's
   * checkInGuest (auth + audit logging already handled there) and
   * additionally revalidates this page.
   */
  async function checkInFromDashboard(dinnerId: string, seatId: string) {
    "use server";
    await checkInGuest(dinnerId, seatId);
    revalidatePath("/admin");
  }

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          marginBottom: 22,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 className="pg-title">Dashboard</h1>
          <p className="pg-sub">
            Welcome back, {user?.firstName || user?.email}
            {restaurant ? ` · ${restaurant.name}` : ""}
          </p>
        </div>
        {isLive && (
          <Link href="/admin/dinners/new" className="btn btn-primary" style={{ fontSize: 12 }}>
            + Create Dinner
          </Link>
        )}
      </div>

      {/* Pending Review Banner */}
      {isPending && (
        <div className="alert alert-yellow" style={{ marginBottom: 16 }}>
          <Clock className="alert-icon h-4 w-4" />
          <div>
            <div className="alert-title">Your application is under review</div>
            <div className="alert-body">
              Submitted{" "}
              {new Date(restaurant.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              . We&apos;ll email you as soon as it&apos;s approved — usually within a day or two.
              In the meantime, feel free to finish setting up your menu and photos below; nothing
              will be bookable by diners until you&apos;re approved.
            </div>
          </div>
        </div>
      )}

      {/* Archived Notice */}
      {isArchived && restaurant && (
        <div className="alert alert-slate" style={{ marginBottom: 16 }}>
          <Lock className="alert-icon h-4 w-4" />
          <div>
            <div className="alert-title">This restaurant is closed</div>
            <div className="alert-body">
              {restaurant.name} was permanently closed and is no longer visible to diners. Your
              dinner history below is preserved, but you can&apos;t create new dinners.
            </div>
          </div>
        </div>
      )}

      {/* You're Live! Moment */}
      {showLiveMoment && restaurant && (
        <div style={{ marginBottom: 16 }}>
          <LiveMomentBanner restaurantId={restaurant.id} restaurantName={restaurant.name} />
        </div>
      )}

      {/* Revenue range picker */}
      {!isPending && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <RevenueRangePicker current={range} />
        </div>
      )}

      {/* Stats Grid — desktop: full labels + captions on every card */}
      <div className="only-desktop" style={{ marginBottom: 20 }}>
      <div className="stat-grid-4" style={{ opacity: isPending ? 0.5 : 1 }}>
        <div className="stat-card">
          <div className="stat-label">Upcoming Dinners</div>
          <div className="stat-value">{isPending ? "—" : upcomingDinners.length}</div>
          {!isPending && (
            <div className="stat-sub">
              {upcomingDinners[0]
                ? `Next: ${new Date(upcomingDinners[0].startsAt).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}`
                : "No upcoming dinners"}
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Seats Confirmed</div>
          <div className="stat-value">{isPending ? "—" : stats.activeSeats}</div>
          {!isPending && (
            <div className="stat-sub">
              {upcomingDinners.length > 0
                ? `Across ${upcomingDinners.length} dinner${upcomingDinners.length === 1 ? "" : "s"}`
                : "No confirmed seats"}
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue</div>
          <div className="stat-value">{isPending ? "—" : formatAmount(revenue)}</div>
          {!isPending && revenueDeltaPct !== null && (
            <div className="stat-sub">
              {revenueDeltaPct >= 0 ? "↑" : "↓"} {Math.abs(revenueDeltaPct)}% vs prior period
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Dinner Rating</div>
          <div className="stat-value">
            {isPending ? "—" : avgRating ? `${avgRating.average.toFixed(1)} ★` : "—"}
          </div>
          {!isPending && (
            <div className="stat-sub">
              {avgRating
                ? `From ${avgRating.count} feedback${avgRating.count === 1 ? "" : "s"}`
                : "No ratings yet"}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Stats Grid — mobile: shorter labels, only the first card keeps a caption (matches wireframe's mobile frame exactly) */}
      <div className="only-mobile" style={{ marginBottom: 14 }}>
      <div className="stat-grid-4" style={{ opacity: isPending ? 0.5 : 1 }}>
        <div className="stat-card">
          <div className="stat-label">Upcoming</div>
          <div className="stat-value">{isPending ? "—" : upcomingDinners.length}</div>
          {!isPending && (
            <div className="stat-sub">
              {upcomingDinners[0]
                ? `Next: ${new Date(upcomingDinners[0].startsAt).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}`
                : "No upcoming dinners"}
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Seats Confirmed</div>
          <div className="stat-value">{isPending ? "—" : stats.activeSeats}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            {isPending ? "—" : formatAmount(revenue)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Rating</div>
          <div className="stat-value">
            {isPending ? "—" : avgRating ? `${avgRating.average.toFixed(1)} ★` : "—"}
          </div>
        </div>
      </div>
      </div>

      {isPending ? (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 420 }}>
            <Link href="/admin/restaurant" className="btn btn-outline">
              Edit Restaurant Profile
            </Link>
            <span className="btn btn-outline" style={{ opacity: 0.4, cursor: "not-allowed" }}>
              + Create Dinner
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 10 }}>
            Create Dinner unlocks once you&apos;re approved.
          </p>
        </>
      ) : (
        <>
          {/* Upcoming Dinners — desktop: table inside a card */}
          <div className="card card-pad only-desktop" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div className="card-title">Upcoming Dinners</div>
              <Link
                href="/admin/dinners"
                style={{ fontSize: "12.5px", color: "var(--p)", fontWeight: 600 }}
              >
                View all →
              </Link>
            </div>
            {upcomingDinnersForTable.length === 0 ? (
              <div style={{ padding: "24px 0", fontSize: 13, color: "var(--t3)" }}>
                No upcoming dinners scheduled.
              </div>
            ) : (
              <div className="table-scroll">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>Dinner</th>
                      <th>Date</th>
                      <th>Seats</th>
                      <th>Status</th>
                      <th className="r">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingDinnersForTable.map((dinner) => {
                      const confirmedCount = dinner.seats.filter((seat) =>
                        bookedStatuses.has(seat.status)
                      ).length;

                      return (
                        <tr key={dinner.id} className={dinner.status === "LIVE" ? "row-live" : undefined}>
                          <td className="td-strong">{dinner.theme?.title || "Untitled dinner"}</td>
                          <td className="td-muted" style={{ marginTop: 0 }}>
                            {new Date(dinner.startsAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </td>
                          <td>
                            <span style={{ fontSize: 13, color: "var(--text)" }}>
                              {confirmedCount} / {dinner._count.seats}{" "}
                              <span style={{ color: "var(--t3)", fontSize: 11 }}>confirmed</span>
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${dinner.status === "LIVE" ? "badge-green" : "badge-blue"}`}
                            >
                              {dinner.status}
                            </span>
                          </td>
                          <td>
                            <div className="td-actions">
                              <Link href={`/admin/dinners/${dinner.id}`} className="btn btn-sm btn-outline">
                                View
                              </Link>
                              {dinner.status === "SCHEDULED" && (
                                <form action={markDinnerLive.bind(null, dinner.id)}>
                                  <button type="submit" className="btn btn-sm btn-green">
                                    → LIVE
                                  </button>
                                </form>
                              )}
                              {dinner.status === "LIVE" && (
                                <Link
                                  href={`/admin/dinners/${dinner.id}#table-photos`}
                                  className="btn btn-sm btn-primary"
                                  title="Quick photo capture, tagged to this dinner automatically"
                                >
                                  <Camera className="h-3 w-3" /> Add Photos
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming Dinners — mobile: stacked row-cards, no table */}
          <div className="only-mobile" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="section-block-title" style={{ marginBottom: 0 }}>
                Upcoming Dinners
              </div>
              <Link href="/admin/dinners" style={{ fontSize: "12.5px", color: "var(--p)", fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            {upcomingDinnersForTable.length === 0 ? (
              <div style={{ padding: "12px 0", fontSize: 13, color: "var(--t3)" }}>
                No upcoming dinners scheduled.
              </div>
            ) : (
              upcomingDinnersForTable.map((dinner) => {
                const confirmedCount = dinner.seats.filter((seat) => bookedStatuses.has(seat.status)).length;
                return (
                  <div key={dinner.id} className="row-card">
                    <div className="rc-top">
                      <div>
                        <div className="rc-title">{dinner.theme?.title || "Untitled dinner"}</div>
                        <div className="rc-sub">
                          {new Date(dinner.startsAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <span className={`badge ${dinner.status === "LIVE" ? "badge-green" : "badge-blue"}`}>
                        {dinner.status}
                      </span>
                    </div>
                    <div className="rc-meta">
                      {confirmedCount} / {dinner._count.seats} confirmed
                    </div>
                    <div className="rc-actions">
                      <Link href={`/admin/dinners/${dinner.id}`} className="btn btn-sm btn-outline" style={{ flex: 1 }}>
                        View
                      </Link>
                      {dinner.status === "SCHEDULED" && (
                        <form action={markDinnerLive.bind(null, dinner.id)} style={{ flex: 1 }}>
                          <button type="submit" className="btn btn-sm btn-green btn-block">
                            → LIVE
                          </button>
                        </form>
                      )}
                      {dinner.status === "LIVE" && (
                        <Link
                          href={`/admin/dinners/${dinner.id}#table-photos`}
                          className="btn btn-sm btn-primary"
                          style={{ flex: 1 }}
                        >
                          <Camera className="h-3 w-3" /> Add Photos
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Live Now — skipped entirely when nothing is LIVE */}
          {liveDinner && (
            <>
              {/* Desktop: bordered card, full-width guest rows */}
              <div className="card card-pad only-desktop" style={{ marginBottom: 16, borderColor: "#bbf7d0" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--green-txt)",
                        display: "inline-block",
                      }}
                    />
                    Live Now: {liveDinner.theme?.title || "Untitled dinner"}
                  </div>
                  <Link
                    href={`/admin/dinners/${liveDinner.id}`}
                    style={{ fontSize: 12, color: "var(--p)", fontWeight: 600 }}
                  >
                    Full Guest List →
                  </Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {liveDinner.seats
                    .filter((s) => bookedStatuses.has(s.status))
                    .map((seat) => {
                      const name = seat.confirmedByUser
                        ? [seat.confirmedByUser.firstName, seat.confirmedByUser.lastName]
                            .filter(Boolean)
                            .join(" ") || "Guest"
                        : "Guest";
                      const isCheckedIn = checkedInStatuses.has(seat.status);
                      return (
                        <div key={seat.id} className="live-guest-row">
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                              {name}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "var(--t3)" }}>
                              {seat.dietaryNotes || "None"}
                            </div>
                          </div>
                          {isCheckedIn ? (
                            <span className="badge badge-green" style={{ fontSize: "9.5px", flexShrink: 0 }}>
                              ✓ Checked In
                            </span>
                          ) : (
                            <form action={checkInFromDashboard.bind(null, liveDinner.id, seat.id)}>
                              <button
                                type="submit"
                                className="btn btn-sm btn-primary"
                                style={{ padding: "4px 10px", flexShrink: 0 }}
                              >
                                Check In
                              </button>
                            </form>
                          )}
                        </div>
                      );
                    })}
                </div>
                <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 10 }}>
                  No Refund action here, by design — only the diner (before the dinner, from their
                  own account) or Platform Ops can refund a seat, never the restaurant.
                </p>
              </div>

              {/* Mobile: bare section title + stacked row-cards */}
              <div className="only-mobile" style={{ marginBottom: 16 }}>
                <div className="section-block-title">Live Now: {liveDinner.theme?.title || "Untitled dinner"}</div>
                {liveDinner.seats
                  .filter((s) => bookedStatuses.has(s.status))
                  .map((seat) => {
                    const name = seat.confirmedByUser
                      ? [seat.confirmedByUser.firstName, seat.confirmedByUser.lastName]
                          .filter(Boolean)
                          .join(" ") || "Guest"
                      : "Guest";
                    const isCheckedIn = checkedInStatuses.has(seat.status);
                    return (
                      <div key={seat.id} className="row-card">
                        <div className="rc-top">
                          <div>
                            <div className="rc-title">{name}</div>
                            <div className="rc-sub">{seat.dietaryNotes || "None"}</div>
                          </div>
                          {isCheckedIn && (
                            <span className="badge badge-green" style={{ fontSize: "9.5px" }}>
                              ✓ Checked In
                            </span>
                          )}
                        </div>
                        {!isCheckedIn && (
                          <form action={checkInFromDashboard.bind(null, liveDinner.id, seat.id)} className="rc-actions">
                            <button type="submit" className="btn btn-sm btn-primary btn-block">
                              Check In
                            </button>
                          </form>
                        )}
                      </div>
                    );
                  })}
                <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                  <Link
                    href={`/admin/dinners/${liveDinner.id}`}
                    style={{ fontSize: "12.5px", color: "var(--p)", fontWeight: 600 }}
                  >
                    Full Guest List →
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Go To — desktop: card-wrapped; mobile: bare list under a section title */}
          <div className="card card-pad only-desktop">
            <div className="card-title" style={{ marginBottom: 12 }}>
              Go To
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/admin/guests" className="quick-link">
                <div className="quick-link-icon">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <div className="quick-link-title">Guests &amp; Bookings</div>
                  <div className="quick-link-sub">
                    {guestsToCheckInTonight > 0
                      ? `${guestsToCheckInTonight} guest${guestsToCheckInTonight === 1 ? "" : "s"} to check in tonight`
                      : "Nobody to check in tonight"}
                  </div>
                </div>
              </Link>
              <Link href="/admin/restaurant" className="quick-link">
                <div className="quick-link-icon">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <div className="quick-link-title">Restaurant Profile</div>
                  <div className="quick-link-sub">
                    {pendingComplianceCount > 0
                      ? `${pendingComplianceCount} compliance doc${pendingComplianceCount === 1 ? "" : "s"} ${pendingComplianceCount === 1 ? "needs" : "need"} attention`
                      : "All compliance docs verified"}
                  </div>
                </div>
              </Link>
              <Link href="/admin/payouts" className="quick-link">
                <div className="quick-link-icon">
                  <Banknote className="h-4 w-4" />
                </div>
                <div>
                  <div className="quick-link-title">Payouts</div>
                  <div className="quick-link-sub">
                    {readyPayoutCents > 0
                      ? `${formatAmount(readyPayoutCents)} ready this week`
                      : "Nothing ready yet"}
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="only-mobile">
            <div className="section-block-title" style={{ marginTop: 14 }}>
              Go To
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/admin/guests" className="quick-link">
                <div className="quick-link-icon">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <div className="quick-link-title">Guests &amp; Bookings</div>
                  <div className="quick-link-sub">
                    {guestsToCheckInTonight > 0
                      ? `${guestsToCheckInTonight} guest${guestsToCheckInTonight === 1 ? "" : "s"} to check in tonight`
                      : "Nobody to check in tonight"}
                  </div>
                </div>
              </Link>
              <Link href="/admin/restaurant" className="quick-link">
                <div className="quick-link-icon">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <div className="quick-link-title">Restaurant Profile</div>
                  <div className="quick-link-sub">
                    {pendingComplianceCount > 0
                      ? `${pendingComplianceCount} compliance doc${pendingComplianceCount === 1 ? "" : "s"} ${pendingComplianceCount === 1 ? "needs" : "need"} attention`
                      : "All compliance docs verified"}
                  </div>
                </div>
              </Link>
              <Link href="/admin/payouts" className="quick-link">
                <div className="quick-link-icon">
                  <Banknote className="h-4 w-4" />
                </div>
                <div>
                  <div className="quick-link-title">Payouts</div>
                  <div className="quick-link-sub">
                    {readyPayoutCents > 0
                      ? `${formatAmount(readyPayoutCents)} ready this week`
                      : "Nothing ready yet"}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Recent Activity — platform-admin only, outside wireframe scope */}
      {user.role === Role.PLATFORM_ADMIN && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ padding: "22px 22px 0" }}>
            <div className="card-title">Recent Activity</div>
          </div>
          <div style={{ padding: 22 }}>
            {recentActivity.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--t3)" }}>No recent activity.</div>
            ) : (
              recentActivity.map((entry) => (
                <div key={entry.id} className="activity-item">
                  <div className="activity-icon">
                    <FileClock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="activity-text">
                      <b>{entry.actor.firstName || entry.actor.email}</b>{" "}
                      {entry.actionType.toLowerCase().replace(/_/g, " ")}
                    </div>
                    <div className="activity-time">
                      {new Date(entry.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
