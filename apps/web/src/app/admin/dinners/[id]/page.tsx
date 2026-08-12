import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { dinnerRepository, dinnerMediaRepository, restaurantGalleryItemRepository, payoutRepository, feedbackRepository, dinnerCancellationRequestRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { formatAmount } from "@dinewithme/config/src/payment";
import { getAuthUser } from "@/lib/auth/server";
import { TablePhotosManager } from "./components/table-photos-manager";
import { ListingPhotosManager } from "./components/listing-photos-manager";
import { MediaTabs } from "./components/media-tabs";
import { GuestListPanel } from "./components/guest-list-panel";
import { DinnerDetailTabs } from "./components/dinner-detail-tabs";
import { DinnerStatusActions } from "./components/dinner-status-actions";
import { DuplicateDinnerButton } from "./components/duplicate-dinner-button";
import { CONVERSATION_STYLES } from "../conversation-styles";

function formatPayoutStatus(payout: { status: string; paidAt: Date | null; scheduledAt: Date } | null): string {
  if (!payout) return "—";
  const shortDate = (d: Date) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (payout.status === "PAID") return payout.paidAt ? `✓ Paid ${shortDate(payout.paidAt)}` : "✓ Paid";
  if (payout.status === "READY") return "Ready to Pay";
  return `Pending (pays ${shortDate(payout.scheduledAt)})`;
}

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

  // Tenant isolation: this page renders confirmed guests' names, emails,
  // dietary notes and revenue. Only the dinner's own restaurant team
  // (OWNER/MANAGER) or Platform Ops may view it — mirrors the sibling
  // export route's isAuthorizedToManage gate, plus the PLATFORM_ADMIN
  // access this page already assumes (see canRefund below). Without this,
  // any restaurant admin could read another restaurant's guest list by URL.
  const canView =
    user.role === Role.PLATFORM_ADMIN ||
    (await dinnerRepository.isAuthorizedToManage(dinner.id, user.id));
  if (!canView) {
    notFound();
  }

  const confirmedSeats = dinner.seats.filter((seat) =>
    ["CONFIRMED", "ATTENDED", "COMPLETED"].includes(seat.status)
  );
  const availableCount = dinner.seats.filter((seat) => seat.status === "AVAILABLE").length;
  const attendedCount = dinner.seats.filter((seat) => seat.status === "ATTENDED" || seat.status === "COMPLETED").length;
  const noShowCount = dinner.seats.filter((seat) => seat.status === "NO_SHOW").length;
  const canRefund = user.role === Role.PLATFORM_ADMIN;
  const revenueCents = confirmedSeats.length * (dinner.pricePerSeatCents ?? 0);
  const canEdit = dinner.status === "SCHEDULED" || dinner.status === "LIVE";
  const isCompleted = dinner.status === "COMPLETED";

  const startsAt = new Date(dinner.startsAt);
  const endsAt = new Date(dinner.endsAt);
  const dinnerLabel = `${dinner.theme?.title || "Dinner"} (${startsAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })})`;

  const [listingMedia, allMedia, galleryItems, payout, dinnerFeedback] = await Promise.all([
    dinnerMediaRepository.findByDinner(dinner.id, "DINNER_LISTING"),
    dinnerMediaRepository.findByDinner(dinner.id),
    restaurantGalleryItemRepository.findByRestaurant(dinner.restaurant.id),
    isCompleted ? payoutRepository.findByDinnerId(dinner.id) : Promise.resolve(null),
    isCompleted ? feedbackRepository.findByDinner(dinner.id) : Promise.resolve([]),
  ]);

  // A pending cancellation request swaps the "Cancel Dinner" button for a
  // "pending review" chip (the request is with Platform Ops).
  const pendingCancellation =
    canEdit ? await dinnerCancellationRequestRepository.findPendingByDinner(dinner.id) : null;

  // Table-level ("how was the dinner overall") feedback only, not diner-to-
  // diner ratings — targetUserId is null for that row shape.
  const tableFeedback = dinnerFeedback.filter((f) => f.targetUserId === null && f.rating != null);
  const avgRating = tableFeedback.length > 0
    ? tableFeedback.reduce((sum, f) => sum + (f.rating ?? 0), 0) / tableFeedback.length
    : null;
  const ratingsByGuestId: Record<string, number> = {};
  for (const f of tableFeedback) {
    if (f.rating != null) ratingsByGuestId[f.authorId] = f.rating;
  }
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
    dinner.status === "CANCELLED"
      ? "badge-red"
      : dinner.status === "LIVE"
        ? "badge-green"
        : dinner.status === "COMPLETED"
          ? "badge-slate"
          : dinner.status === "DRAFT"
            ? "badge-draft"
            : "badge-blue"; // SCHEDULED

  const detailsPanel = (
    <div className="card card-pad">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Dinner Details</div>
        {/* No Edit button here: a dinner's content is editable only while it's a
            DRAFT (the edit route redirects any non-DRAFT back here), and a DRAFT
            never renders this detail page — so an Edit link on Details is always
            a dead round-trip. Editing lives on the Dinners list's DRAFT rows. */}
      </div>
      <div>
        <div className="breakdown-row">
          <span className="breakdown-label">Theme</span>
          <span className="breakdown-value">{dinner.theme?.title || "—"}</span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">
            Meal <span className="badge badge-blue" style={{ fontSize: 8.5, verticalAlign: 1 }}>NEW</span>
          </span>
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

  const fillRate = dinner._count.seats > 0 ? Math.round((attendedCount / dinner._count.seats) * 100) : 0;

  const guestsPanel = (
    <>
      {isCompleted ? (
        <div className="stat-grid-4" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-label">Final Attendance</div>
            <div className="stat-value">{attendedCount}</div>
            <div className="stat-sub" style={{ color: "var(--green-txt)" }}>
              {attendedCount} / {dinner._count.seats} · {fillRate}% fill
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Gross Revenue</div>
            <div className="stat-value">{formatAmount(revenueCents)}</div>
            {dinner.pricePerSeatCents != null && (
              <div className="stat-sub">{formatAmount(dinner.pricePerSeatCents)} × {confirmedSeats.length} seats</div>
            )}
          </div>
          <Link href="/admin/payouts" className="stat-card" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <div className="stat-label">Net Payout</div>
            <div className="stat-value">{payout ? formatAmount(payout.netAmountCents) : "—"}</div>
            <div className="stat-sub" style={{ color: "var(--blue-txt)" }}>{formatPayoutStatus(payout)}</div>
          </Link>
          <Link href="/admin/reviews" className="stat-card" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <div className="stat-label">Dinner Rating</div>
            <div className="stat-value" style={{ color: "var(--yellow-txt)" }}>
              {avgRating != null ? `${avgRating.toFixed(1)} ★` : "—"}
            </div>
            <div className="stat-sub" style={{ color: "var(--p)", fontWeight: 600 }}>
              {tableFeedback.length} review{tableFeedback.length === 1 ? "" : "s"} →
            </div>
          </Link>
        </div>
      ) : (
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
      )}

      {!isCompleted && (
        <p style={{ fontSize: 11, color: "var(--t3)", margin: "-8px 0 12px" }}>{attendedCount} checked in</p>
      )}

      <GuestListPanel
        dinnerId={dinner.id}
        restaurantId={dinner.restaurant.id}
        seats={isCompleted ? dinner.seats.filter((seat) => seat.status !== "AVAILABLE") : confirmedSeats}
        canRefund={canRefund}
        isPlatformAdmin={canRefund}
        isCompleted={isCompleted}
        ratingsByGuestId={ratingsByGuestId}
      />
      {isCompleted && noShowCount > 0 && (
        <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 10 }}>
          No-show guests are listed but grayed — their seat was held and paid. No-show revenue is included in the gross payout.
        </p>
      )}
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
      <p className="pg-sub only-desktop" style={{ marginBottom: 12 }}>
        <Link href="/admin/dinners" style={{ color: "var(--p)", fontWeight: 600 }}>
          ← Dinners
        </Link>{" "}
        / {dinner.theme?.title || "Dinner"} ·{" "}
        {startsAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
      <div className="only-mobile-flex" style={{ alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Link href="/admin/dinners" className="m-icon-btn" aria-label="Back to Dinners">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="pg-title" style={{ flex: 1, textAlign: "center" }}>
          {dinner.theme?.title || "Dinner"}
        </h1>
        <div style={{ width: 44 }} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 className="pg-title only-desktop">
            {isCompleted
              ? dinner.theme?.title || "Dinner"
              : `${dinner.theme?.title || "Dinner"} · ${startsAt.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })} · ${startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
          </h1>
          <p className="pg-sub">
            {isCompleted ? (
              <>
                {dinner.restaurant.name} ·{" "}
                {startsAt.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · {startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} ·{" "}
                {dinner._count.seats} seats
              </>
            ) : (
              <>
                {dinner.restaurant.name} · {dinner._count.seats} seats
              </>
            )}
          </p>
        </div>
        <span className={`badge ${badgeClass}`}>{dinner.status}</span>
        {isCompleted ? (
          <div className="only-desktop-flex" style={{ gap: 8 }}>
            <DuplicateDinnerButton dinnerId={dinner.id} className="btn btn-outline btn-sm" />
            <Link href={`/admin/dinners/${dinner.id}#table-photos`} className="btn btn-outline btn-sm" style={{ textDecoration: "none" }}>
              📷 View Photos
            </Link>
          </div>
        ) : (
          <div className="only-desktop-flex">
            <DinnerStatusActions dinnerId={dinner.id} status={dinner.status} dinnerLabel={dinnerLabel} pendingCancellation={pendingCancellation !== null} layout="inline" />
          </div>
        )}
      </div>

      <DinnerDetailTabs detailsPanel={detailsPanel} guestsPanel={guestsPanel} mediaPanel={mediaPanel} />

      {canEdit && (
        <div className="m-action-bar">
          <DinnerStatusActions dinnerId={dinner.id} status={dinner.status} dinnerLabel={dinnerLabel} pendingCancellation={pendingCancellation !== null} layout="bar" />
        </div>
      )}
      {isCompleted && (
        <div className="m-action-bar only-mobile-flex">
          <Link href={`/admin/dinners/${dinner.id}#table-photos`} className="btn btn-outline btn-block" style={{ flex: 1, textDecoration: "none" }}>
            📷 View Photos
          </Link>
          <DuplicateDinnerButton dinnerId={dinner.id} className="btn btn-outline btn-block" style={{ flex: 1 }} />
        </div>
      )}
    </div>
  );
}
