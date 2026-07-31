import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";
import { payoutRepository, restaurantRepository, decrypt, maskAccountNumber } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PayoutDetailActions } from "./components/payout-detail-actions";

function formatCurrency(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_TONE: Record<string, "primary" | "success" | "neutral"> = {
  HELD: "neutral",
  READY: "primary",
  PAID: "success",
};

export default async function PayoutDetailPage({ params }: { params: { id: string } }) {
  const payout = await payoutRepository.findByIdWithDinner(params.id);
  if (!payout) {
    notFound();
  }

  const restaurant = await restaurantRepository.findById(payout.restaurantId);
  if (!restaurant) {
    notFound();
  }

  const maskedAccountNumber = restaurant.bankAccountNumber
    ? maskAccountNumber(decrypt(restaurant.bankAccountNumber))
    : null;

  const dinnerCompleted = payout.status !== "HELD" || new Date() >= payout.dinner.endsAt;
  const refundWindowClosed = payout.status === "READY" || payout.status === "PAID";
  const readyToProcess = payout.status === "READY" || payout.status === "PAID";
  const paid = payout.status === "PAID";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/ops/payouts"
          className="rounded-lg p-2 transition-colors hover:bg-cream-200"
          aria-label="Back to Payout Settlement"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{restaurant.name}</h1>
          <p className="text-gray-600">{payout.dinner.theme?.title || "Dinner"}</p>
        </div>
        <Badge tone={STATUS_TONE[payout.status] || "neutral"} className="ml-auto">
          {payout.status}
        </Badge>
      </div>

      <Card padding="lg" className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Breakdown</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Gross (confirmed seats × price)</span>
            <span>{formatCurrency(payout.grossAmountCents)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Platform Commission</span>
            <span>-{formatCurrency(payout.commissionAmountCents)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-gray-900">
            <span>Net Payout</span>
            <span>{formatCurrency(payout.netAmountCents)}</span>
          </div>
          <div className="flex justify-between pt-1 text-xs text-gray-400">
            <span>Booking fee collected (not part of payout)</span>
            <span>{formatCurrency(payout.bookingFeeCents)}</span>
          </div>
        </div>
      </Card>

      <Card padding="lg" className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
        <div className="space-y-3">
          <TimelineStep
            done={dinnerCompleted}
            label="Dinner completed"
            detail={formatDate(payout.dinner.endsAt)}
          />
          <TimelineStep
            done={refundWindowClosed}
            label="Refund window closed"
            detail={
              refundWindowClosed
                ? formatDate(payout.scheduledAt)
                : `Closes ${formatDate(payout.scheduledAt)}`
            }
          />
          <TimelineStep done={readyToProcess} label="Ready to process" detail={undefined} />
          <TimelineStep
            done={paid}
            label="Paid"
            detail={payout.paidAt ? formatDate(payout.paidAt) : undefined}
          />
        </div>
      </Card>

      <Card padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Payout Destination</h2>
          <Badge tone={restaurant.bankDetailsVerifiedAt ? "success" : "primary"}>
            {restaurant.bankDetailsVerifiedAt ? "Verified" : "Pending Verification"}
          </Badge>
        </div>
        {maskedAccountNumber ? (
          <div className="rounded-lg border border-gray-100 bg-cream-100 p-4 text-sm">
            <p className="font-semibold text-gray-900">{restaurant.bankAccountHolderName}</p>
            <p className="text-gray-600">
              {restaurant.bankName} · {maskedAccountNumber}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            This restaurant hasn&apos;t added payout destination details yet.
          </p>
        )}
      </Card>

      <PayoutDetailActions
        payoutId={payout.id}
        restaurantId={restaurant.id}
        isReady={payout.status === "READY"}
        isVerified={!!restaurant.bankDetailsVerifiedAt}
      />
    </div>
  );
}

function TimelineStep({ done, label, detail }: { done: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
      ) : (
        <Circle className="h-5 w-5 flex-shrink-0 text-gray-300" />
      )}
      <div className="flex-1">
        <p className={`text-sm font-medium ${done ? "text-gray-900" : "text-gray-400"}`}>{label}</p>
        {detail && (
          <p className="flex items-center gap-1 text-xs text-gray-500">
            {!done && <Clock className="h-3 w-3" />}
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}
