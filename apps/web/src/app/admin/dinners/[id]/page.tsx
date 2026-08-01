import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { dinnerRepository, dinnerMediaRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { formatAmount } from "@dinewithme/config/src/payment";
import { getAuthUser } from "@/lib/auth/server";
import { GuestRow } from "./components/guest-row";
import { TablePhotosManager } from "./components/table-photos-manager";
import { DinnerDetailTabs } from "./components/dinner-detail-tabs";
import { DinnerStatusActions } from "./components/dinner-status-actions";

export default async function DinnerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const dinner = await dinnerRepository.findByIdWithDetails(params.id);
  if (!dinner) {
    notFound();
  }

  const confirmedSeats = dinner.seats.filter((seat) =>
    ["CONFIRMED", "ATTENDED", "COMPLETED"].includes(seat.status)
  );
  const availableCount = dinner.seats.filter((seat) => seat.status === "AVAILABLE").length;
  const attendedCount = dinner.seats.filter((seat) => seat.status === "ATTENDED" || seat.status === "COMPLETED").length;
  const canRefund = user.role === Role.PLATFORM_ADMIN;
  const revenueCents = confirmedSeats.length * (dinner.pricePerSeatCents ?? 0);

  const startsAt = new Date(dinner.startsAt);
  const endsAt = new Date(dinner.endsAt);

  const listingPhotoIds = new Set(
    (await dinnerMediaRepository.findByDinner(dinner.id, "DINNER_LISTING")).map((item) => item.id)
  );
  const allMedia = await dinnerMediaRepository.findByDinner(dinner.id);
  const tablePhotos = allMedia
    .filter((item) => !listingPhotoIds.has(item.id))
    .map((item) => ({
      id: item.id,
      mediaAssetId: item.mediaAsset.id,
      url: item.mediaAsset.url,
      promotionStatus: item.promotionStatus,
    }));

  const badgeClass =
    dinner.status === "CANCELLED" ? "badge-red" : dinner.status === "LIVE" ? "badge-green" : "badge-blue";

  const detailsPanel = (
    <div className="card card-pad">
      <div className="card-title" style={{ marginBottom: 14 }}>Dinner Details</div>
      <div>
        <div className="breakdown-row">
          <span className="breakdown-label">Theme</span>
          <span className="breakdown-value">{dinner.theme?.title || "—"}</span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Meal</span>
          <span className="breakdown-value">
            {dinner.meal ? (
              <Link href="/admin/meals" style={{ color: "var(--p)" }}>
                {dinner.meal.name} →
              </Link>
            ) : (
              "—"
            )}
          </span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Date</span>
          <span className="breakdown-value">
            {startsAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Time</span>
          <span className="breakdown-value">
            {startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} –{" "}
            {endsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Seat Count</span>
          <span className="breakdown-value">{dinner._count.seats}</span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Price per Seat</span>
          <span className="breakdown-value">
            {dinner.pricePerSeatCents != null ? formatAmount(dinner.pricePerSeatCents) : "—"}
          </span>
        </div>
      </div>
      {dinner.description && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--hair)", paddingTop: 14 }}>
          <div className="card-title" style={{ fontSize: 13, marginBottom: 6 }}>Description</div>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--t2)" }}>{dinner.description}</p>
        </div>
      )}
    </div>
  );

  const guestsPanel = (
    <>
      <div className="stat-grid-4" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Seats Total</div>
          <div className="stat-value">{dinner._count.seats}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmed</div>
          <div className="stat-value">{confirmedSeats.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Available</div>
          <div className="stat-value">{availableCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{formatAmount(revenueCents)}</div>
          {dinner.pricePerSeatCents != null && (
            <div className="stat-sub">{confirmedSeats.length} × {formatAmount(dinner.pricePerSeatCents)}</div>
          )}
        </div>
      </div>

      <div className="table-wrap">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 0" }}>
          <div className="card-title">Guest List</div>
          <span className="pg-sub" style={{ margin: 0 }}>{attendedCount} checked in</span>
        </div>
        {confirmedSeats.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--t3)" }}>No confirmed guests yet</div>
        ) : (
          <div className="table-scroll" style={{ marginTop: 12 }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Dietary Notes</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {confirmedSeats.map((seat) => (
                  <GuestRow
                    key={seat.id}
                    dinnerId={dinner.id}
                    restaurantId={dinner.restaurant.id}
                    seat={seat}
                    canRefund={canRefund}
                    isPlatformAdmin={canRefund}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  const mediaPanel = (
    <div id="table-photos">
      <TablePhotosManager dinnerId={dinner.id} photos={tablePhotos} isPlatformAdmin={canRefund} />
    </div>
  );

  return (
    <div className="din">
      <p className="pg-sub" style={{ marginBottom: 12 }}>
        <Link href="/admin/dinners" style={{ color: "var(--p)", fontWeight: 600 }}>
          ← Dinners
        </Link>{" "}
        / {dinner.theme?.title || "Dinner"} ·{" "}
        {startsAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <Link href="/admin/dinners" className="m-icon-btn" style={{ marginTop: 2 }}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 className="pg-title">{dinner.theme?.title || "Dinner"}</h1>
          <p className="pg-sub">
            {dinner.restaurant.name} ·{" "}
            {startsAt.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · {startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} ·{" "}
            {dinner._count.seats} seats
          </p>
        </div>
        <span className={`badge ${badgeClass}`}>{dinner.status}</span>
        <DinnerStatusActions dinnerId={dinner.id} status={dinner.status} />
        <a href={`/admin/dinners/${dinner.id}/export`} className="btn btn-outline btn-sm">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </a>
      </div>

      <DinnerDetailTabs detailsPanel={detailsPanel} guestsPanel={guestsPanel} mediaPanel={mediaPanel} />
    </div>
  );
}
