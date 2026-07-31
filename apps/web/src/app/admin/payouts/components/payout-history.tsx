import type { PayoutWithDinner } from "@dinewithme/db";
import { formatAmount as formatCurrency } from "@dinewithme/config/src/payment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_TONE: Record<string, "primary" | "success" | "neutral"> = {
  HELD: "neutral",
  READY: "primary",
  PAID: "success",
};

function formatShortDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Embeds the relevant date into the status label (§16.1 wireframe:
 * "Pending (pays Jul 15)" / "✓ Paid Jul 12") rather than a bare status word
 * - scheduledAt/paidAt are already fetched on every Payout, just weren't
 * surfaced here before.
 */
function statusLabel(payout: PayoutWithDinner): string {
  if (payout.status === "PAID") {
    return payout.paidAt ? `✓ Paid ${formatShortDate(payout.paidAt)}` : "✓ Paid";
  }
  if (payout.status === "READY") {
    return "Ready to Pay";
  }
  return `Pending (pays ${formatShortDate(payout.scheduledAt)})`;
}

export function PayoutHistory({ payouts }: { payouts: PayoutWithDinner[] }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-6 pb-0">
        <h2 className="text-lg font-semibold text-gray-900">Payout History</h2>
      </div>
      {payouts.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          No payouts yet - they appear here a few business days after each dinner completes.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-cream-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Dinner
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                  Gross
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                  Commission
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                  Net
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {payout.dinner.theme?.title || "Dinner"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payout.dinner.startsAt).toLocaleDateString("en-ZA", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-700">
                    {formatCurrency(payout.grossAmountCents)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-700">
                    {formatCurrency(payout.commissionAmountCents)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(payout.netAmountCents)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge tone={STATUS_TONE[payout.status] || "neutral"}>
                      {statusLabel(payout)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
