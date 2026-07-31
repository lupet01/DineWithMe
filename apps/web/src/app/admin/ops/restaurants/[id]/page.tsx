import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Globe, MapPin, Phone } from "lucide-react";
import {
  restaurantRepository,
  restaurantClosureRequestRepository,
  dinnerRepository,
  paymentIntentRepository,
  themeRepository,
  complianceDocumentRepository,
} from "@dinewithme/db";
import { formatAmount } from "@dinewithme/config/src/payment";
import { toWhatsAppLink } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { RestaurantStatusActions } from "./components/restaurant-status-actions";
import { ClosureRequestReview } from "./components/closure-request-review";
import { ComplianceDocuments } from "./components/compliance-documents";

// No per-restaurant fee schedule exists anywhere in the schema or config
// yet (checked packages/config/src/payment.ts and the PaymentIntent model -
// neither tracks a platform cut). Using a flat illustrative rate here so
// the stat card isn't blank, clearly caveated in its caption rather than
// presented as tracked financial data.
const ILLUSTRATIVE_PLATFORM_FEE_RATE = 0.15;

const STATUS_TONE: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  PENDING: "warning",
  ACTIVE: "success",
  PAUSED: "danger",
  ARCHIVED: "neutral",
};

const DINNER_STATUS_TONE: Record<string, "info" | "success" | "danger" | "neutral"> = {
  SCHEDULED: "info",
  LIVE: "success",
  COMPLETED: "neutral",
  CANCELLED: "danger",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const restaurantId = params.id;

  const [restaurant, dinners, revenue, enabledThemes, complianceDocuments, pendingClosureRequest] =
    await Promise.all([
      restaurantRepository.findByIdWithMembers(restaurantId),
      dinnerRepository.findByRestaurantWithTheme(restaurantId),
      paymentIntentRepository.sumSucceededAmountForRestaurant(restaurantId),
      themeRepository.findByRestaurant(restaurantId),
      complianceDocumentRepository.findByRestaurant(restaurantId),
      restaurantClosureRequestRepository.findPendingByRestaurant(restaurantId),
    ]);

  if (!restaurant) {
    notFound();
  }

  const owner = restaurant.members.find((m) => m.role === "OWNER")?.user;
  const platformFees = Math.round(revenue * ILLUSTRATIVE_PLATFORM_FEE_RATE);
  const recentDinners = dinners.slice(0, 15);
  const whatsAppLink = toWhatsAppLink(restaurant.phone);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/ops/restaurants"
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">{restaurant.name}</h1>
          <p className="text-gray-600 mt-1">
            {restaurant.cuisine || "Cuisine not specified"}
            {restaurant.city ? ` · ${restaurant.city}` : ""}
          </p>
        </div>
        <Badge tone={STATUS_TONE[restaurant.status] ?? "neutral"}>{restaurant.status}</Badge>
        {whatsAppLink && (
          <a
            href={whatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
          >
            Message Owner (WhatsApp)
          </a>
        )}
        <RestaurantStatusActions
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          status={restaurant.status}
        />
      </div>

      {/* Closure Request Review */}
      {pendingClosureRequest && (
        <ClosureRequestReview
          requestId={pendingClosureRequest.id}
          reason={pendingClosureRequest.reason}
          requestedAt={pendingClosureRequest.createdAt}
        />
      )}

      {/* Profile Summary */}
      <Card padding="lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Profile</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Owner
            </div>
            <div className="mt-1 text-sm text-gray-900">
              {owner ? (
                <Link
                  href={`/admin/ops/users/${owner.id}`}
                  className="hover:text-primary-600 hover:underline"
                >
                  {owner.firstName} {owner.lastName}
                  <div className="text-gray-500">{owner.email}</div>
                </Link>
              ) : (
                <span className="text-gray-400">No owner</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Address
            </div>
            <div className="mt-1 flex items-start gap-1.5 text-sm text-gray-900">
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span>
                {restaurant.address || "Not specified"}
                {restaurant.city ? `, ${restaurant.city}` : ""}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-900">
              <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              {restaurant.phone || <span className="text-gray-400">Not specified</span>}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Website
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-900">
              <Globe className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              {restaurant.website ? (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  {restaurant.website}
                </a>
              ) : (
                <span className="text-gray-400">Not specified</span>
              )}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Enabled Themes
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {enabledThemes.length === 0 ? (
                <span className="text-sm text-gray-400">No themes enabled</span>
              ) : (
                enabledThemes.map((theme) => (
                  <Badge key={theme.id} tone="primary">
                    {theme.title}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Revenue Stats */}
      <StatGrid className="md:grid-cols-3">
        <StatCard label="Total Revenue" value={formatAmount(revenue)} />
        <StatCard
          label="Platform Fees Taken"
          value={formatAmount(platformFees)}
          caption={`Illustrative at a flat ${Math.round(
            ILLUSTRATIVE_PLATFORM_FEE_RATE * 100
          )}% rate — no per-restaurant fee schedule exists yet`}
        />
        <StatCard label="Dinners Hosted" value={dinners.length} />
      </StatGrid>

      {/* Dinner History */}
      <Card padding="none">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold text-gray-900">Dinner History</h2>
        </div>
        {recentDinners.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No dinners yet</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-cream-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Theme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Seats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentDinners.map((dinner) => (
                  <tr key={dinner.id} className="hover:bg-cream-100 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {dinner.theme?.title ?? "No theme"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(dinner.startsAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{dinner.seatCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge tone={DINNER_STATUS_TONE[dinner.status] ?? "neutral"}>
                        {dinner.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Compliance Documents */}
      <ComplianceDocuments restaurantId={restaurant.id} documents={complianceDocuments} />

      {/* Theme Performance - illustrative placeholder only */}
      <Card padding="lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Theme Performance Here</h2>
          <Badge tone="warning">Illustrative — pipeline not yet built</Badge>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          This panel shows sample layout only. Real theme-performance analytics require the
          DinnerContext / ThemePerformance aggregation pipeline, which does not exist in this
          codebase yet.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { theme: "Tech Innovators", fillRate: "82%", rating: "4.6" },
            { theme: "Creative Minds", fillRate: "76%", rating: "4.5" },
            { theme: "Founders & Builders", fillRate: "68%", rating: "4.3" },
          ].map((row) => (
            <div key={row.theme} className="rounded-xl border border-dashed border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-900">{row.theme}</div>
              <div className="mt-2 text-xs text-gray-500">Fill rate: {row.fillRate}</div>
              <div className="text-xs text-gray-500">Avg. rating: {row.rating}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
