import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { dinnerRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { getAuthUser } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { GuestRow } from "./components/guest-row";

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
  const attendedCount = dinner.seats.filter((seat) => seat.status === "ATTENDED" || seat.status === "COMPLETED").length;
  const canRefund = user.role === Role.PLATFORM_ADMIN;

  const startsAt = new Date(dinner.startsAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/dinners"
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
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
            {startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <Badge tone={dinner.status === "CANCELLED" ? "danger" : dinner.status === "LIVE" ? "success" : "primary"}>
          {dinner.status}
        </Badge>
        <a
          href={`/admin/dinners/${dinner.id}/export`}
          className="inline-flex items-center gap-2 rounded-full border-2 border-primary-500 bg-white px-4 py-2 text-sm font-semibold text-primary-500 transition-colors hover:bg-primary-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <StatGrid className="md:grid-cols-3">
        <StatCard label="Seats Confirmed" value={`${confirmedSeats.length} / ${dinner._count.seats}`} />
        <StatCard label="Checked In" value={attendedCount} />
        <StatCard
          label="Description"
          value={<span className="text-base font-normal text-gray-700">{dinner.description || "—"}</span>}
        />
      </StatGrid>

      <Card padding="none" className="overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold text-gray-900">Guests</h2>
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
                    seat={seat}
                    canRefund={canRefund}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
