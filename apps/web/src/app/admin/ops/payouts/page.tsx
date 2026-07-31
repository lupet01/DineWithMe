import { payoutRepository } from "@dinewithme/db";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { PayoutSettlementTable } from "./components/payout-settlement-table";

function formatCurrency(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

export default async function OpsPayoutsPage() {
  const payouts = await payoutRepository.findAllWithRestaurant();

  const readyCount = payouts.filter((p) => p.status === "READY").length;
  const heldCount = payouts.filter((p) => p.status === "HELD").length;
  const readyTotalCents = payouts
    .filter((p) => p.status === "READY")
    .reduce((sum, p) => sum + p.netAmountCents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Payout Settlement</h2>
        <p className="mt-1 text-gray-600">Process payouts to restaurants once their hold window closes</p>
      </div>

      <StatGrid className="md:grid-cols-3">
        <StatCard label="Ready to Pay" value={readyCount} />
        <StatCard label="Held (Refund Window Open)" value={heldCount} />
        <StatCard label="Ready Total" value={formatCurrency(readyTotalCents)} />
      </StatGrid>

      <PayoutSettlementTable payouts={payouts} />
    </div>
  );
}
