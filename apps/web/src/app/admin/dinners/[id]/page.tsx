import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { dinnerRepository, dinnerMediaRepository, restaurantGalleryItemRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { formatAmount } from "@dinewithme/config/src/payment";
import { getAuthUser } from "@/lib/auth/server";
import { TablePhotosManager } from "./components/table-photos-manager";
import { ListingPhotosManager } from "./components/listing-photos-manager";
import { MediaTabs } from "./components/media-tabs";
import { GuestListPanel } from "./components/guest-list-panel";
import { DinnerDetailTabs } from "./components/dinner-detail-tabs";
import { DinnerStatusActions } from "./components/dinner-status-actions";
import { CONVERSATION_STYLES } from "../conversation-styles";

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
  const canEdit = dinner.status === "SCHEDULED" || dinner.status === "LIVE";

  const startsAt = new Date(dinner.startsAt);
  const endsAt = new Date(dinner.endsAt);

  const [listingMedia, allMedia, galleryItems] = await Promise.all([
    dinnerMediaRepository.findByDinner(dinner.id, "DINNER_LISTING"),
    dinnerMediaRepository.findByDinner(dinner.id),
    restaurantGalleryItemRepository.findByRestaurant(dinner.restaurant.id),
  ]);
  const listingPhotoIds = new Set(listingMedia.map((item) => item.id));
  const tablePhotos = allMedia
    .filter((item) => !listingPhotoIds.has(item.id))
    .map((item) => ({
      id: item.id,
      mediaAssetId: item.mediaAsset.id,
      url: item.mediaAsset.url,
      promotionStatus: item.promotionStatus,
    }));

  const conversationStyleLabel = dinner.conversationStyle
    ? CONVERSATION_STYLES.find((s) => s.value === dinner.conversationStyle)?.label ?? dinner.conversationStyle
    : null;

  const badgeClass =
    dinner.status === "CANCELLED" ? "badge-red" : dinner.status === "LIVE" ? "badge-green" : "badge-blue";

  const detailsPanel = (
    <div className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Dinner Details</div>
        {canEdit && (
          <Link href={`/admin/dinners/${dinner.id}/edit`} className="btn btn-outline btn-sm">
            Edit Dinner
          </Link>
        )}
      </div>
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
          <span className="breakdown-label">Conversation Style</span>
          <span className="breakdown-value">{conversationStyleLabel || "—"}</span>
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

      <p style={{ fontSize: 11, color: "var(--t3)", margin: "-8px 0 12px" }}>{attendedCount} checked in</p>

      <GuestListPanel
        dinnerId={dinner.id}
        restaurantId={dinner.restaurant.id}
        seats={confirmedSeats}
        canRefund={canRefund}
        isPlatformAdmin={canRefund}
      />
    </>
  );

  const mediaPanel = (
    <div id="table-photos">
      <MediaTabs
        listingPanel={
          <ListingPhotosManager
            dinnerId={dinner.id}
            initialSelectedIds={listingMedia.map((item) => item.mediaAsset.id)}
            photoPool={galleryItems.map((item) => ({ id: item.mediaAsset.id, url: item.mediaAsset.url }))}
          />
        }
        tablePanel={<TablePhotosManager dinnerId={dinner.id} photos={tablePhotos} isPlatformAdmin={canRefund} />}
      />
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
      </div>

      <DinnerDetailTabs detailsPanel={detailsPanel} guestsPanel={guestsPanel} mediaPanel={mediaPanel} />
    </div>
  );
}
