import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { dinnerRepository, dinnerMediaRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { formatAmount } from "@dinewithme/config/src/payment";
import { getAuthUser } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
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

  const badgeTone = dinner.status === "CANCELLED" ? "danger" : dinner.status === "LIVE" ? "success" : "info";

  const detailsPanel = (
    <Card padding="lg">
      <h2 className="mb-3.5 text-base font-bold text-gray-900">Dinner Details</h2>
      <dl className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <dt className="text-gray-500">Theme</dt>
          <dd className="font-medium text-gray-900">{dinner.theme?.title || "—"}</dd>
        </div>
        <div className="flex items-center justify-between text-sm">
          <dt className="text-gray-500">Meal</dt>
          <dd className="font-medium text-gray-900">
            {dinner.meal ? (
              <Link href="/admin/meals" className="text-primary-600 hover:underline">
                {dinner.meal.name} →
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between text-sm">
          <dt className="text-gray-500">Date</dt>
          <dd className="font-medium text-gray-900">
            {startsAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </dd>
        </div>
        <div className="flex items-center justify-between text-sm">
          <dt className="text-gray-500">Time</dt>
          <dd className="font-medium text-gray-900">
            {startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} –{" "}
            {endsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </dd>
        </div>
        <div className="flex items-center justify-between text-sm">
          <dt className="text-gray-500">Seat Count</dt>
          <dd className="font-medium text-gray-900">{dinner._count.seats}</dd>
        </div>
        <div className="flex items-center justify-between text-sm">
          <dt className="text-gray-500">Price per Seat</dt>
          <dd className="font-medium text-gray-900">
            {dinner.pricePerSeatCents != null ? formatAmount(dinner.pricePerSeatCents) : "—"}
          </dd>
        </div>
      </dl>
      {dinner.description && (
        <div className="mt-3.5 border-t border-gray-100 pt-3.5">
          <h3 className="mb-1.5 text-sm font-bold text-gray-900">Description</h3>
          <p className="text-sm leading-relaxed text-gray-600">{dinner.description}</p>
        </div>
      )}
    </Card>
  );

  const guestsPanel = (
    <>
      <StatGrid className="md:grid-cols-4">
        <StatCard label="Seats Total" value={dinner._count.seats} />
        <StatCard label="Confirmed" value={confirmedSeats.length} />
        <StatCard label="Available" value={availableCount} />
        <StatCard
          label="Revenue"
          value={formatAmount(revenueCents)}
          caption={
            dinner.pricePerSeatCents != null
              ? `${confirmedSeats.length} × ${formatAmount(dinner.pricePerSeatCents)}`
              : undefined
          }
        />
      </StatGrid>

      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold text-gray-900">Guest List</h2>
          <span className="text-xs text-gray-400">{attendedCount} checked in</span>
        </div>
        {confirmedSeats.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No confirmed guests yet</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-100 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Dietary Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
      </Card>
    </>
  );

  const mediaPanel = (
    <div id="table-photos">
      <TablePhotosManager dinnerId={dinner.id} photos={tablePhotos} isPlatformAdmin={canRefund} />
    </div>
  );

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-400">
        <Link href="/admin/dinners" className="font-semibold text-primary-500 hover:underline">
          ← Dinners
        </Link>{" "}
        /{" "}
        {dinner.theme?.title || "Dinner"} ·{" "}
        {startsAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
      <div className="flex items-start gap-4">
        <Link
          href="/admin/dinners"
          className="mt-1 flex-shrink-0 p-2 hover:bg-cream-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            {dinner.theme?.title || "Dinner"}
          </h1>
          <p className="text-gray-600 mt-1">
            {dinner.restaurant.name} ·{" "}
            {startsAt.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            ·{" "}
            {startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} ·{" "}
            {dinner._count.seats} seats
          </p>
        </div>
        <Badge tone={badgeTone}>{dinner.status}</Badge>
        <DinnerStatusActions dinnerId={dinner.id} status={dinner.status} />
        <a
          href={`/admin/dinners/${dinner.id}/export`}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border-2 border-primary-500 bg-white px-4 py-2 text-sm font-semibold text-primary-500 transition-colors hover:bg-primary-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <DinnerDetailTabs detailsPanel={detailsPanel} guestsPanel={guestsPanel} mediaPanel={mediaPanel} />
    </div>
  );
}
