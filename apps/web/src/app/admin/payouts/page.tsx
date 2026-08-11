import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, payoutRepository, decrypt, maskAccountNumber } from "@dinewithme/db";
import { formatAmount as formatCurrency } from "@dinewithme/config/src/payment";
import { payoutPolicy } from "@dinewithme/config/src/payout-policy";
import { PayoutHistory } from "./components/payout-history";
import { BankDetailsForm } from "./components/bank-details-form";

export default async function PayoutsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/sign-in");
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0];
  if (!restaurant) {
    redirect("/admin/restaurant");
  }

  const isOwner = restaurant.members.some((m) => m.userId === user.id && m.role === "OWNER");

  const payouts = await payoutRepository.findByRestaurant(restaurant.id);

  // Always-current, not period-scoped (§16.1 wireframe's range-picker note).
  const pendingPayouts = payouts.filter((p) => p.status === "HELD" || p.status === "READY");
  const pendingCents = pendingPayouts.reduce((sum, p) => sum + p.netAmountCents, 0);
  const nextPayoutDate = pendingPayouts
    .map((p) => p.scheduledAt)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  // Also all-time, not period-scoped — a range picker here used to gate
  // only these two stats while Pending Payout/Next Payout Date stayed
  // always-current, which was confusing (change the range, wonder why half
  // the row didn't move) rather than useful. Removed per the wireframe's
  // own fix; these are now plain all-time figures like the other two.
  const paidPayouts = payouts.filter((p) => p.status === "PAID");
  const paidCents = paidPayouts.reduce((sum, p) => sum + p.netAmountCents, 0);
  const commissionCents = paidPayouts.reduce((sum, p) => sum + p.commissionAmountCents, 0);

  // Bank account number is decrypted here, server-side, only to produce a
  // masked display string - the raw decrypted value never leaves this
  // page, never reaches the client component's props.
  const maskedAccountNumber = restaurant.bankAccountNumber
    ? maskAccountNumber(decrypt(restaurant.bankAccountNumber))
    : null;

  return (
    <div className="payouts">
      <div style={{ marginBottom: 20 }}>
        <h1 className="pg-title">Payouts</h1>
        <p className="pg-sub">What you&apos;ve earned, and when it lands in your account</p>
      </div>

      <div className="stat-grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Pending Payout</div>
          <div className="stat-value" style={{ color: "var(--yellow-txt)" }}>
            {formatCurrency(pendingCents)}
          </div>
          <div className="stat-sub">
            From {pendingPayouts.length} completed dinner{pendingPayouts.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paid Out</div>
          <div className="stat-value">{formatCurrency(paidCents)}</div>
          <div className="stat-sub">All-time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Next Payout Date</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            {nextPayoutDate
              ? nextPayoutDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "—"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Commission</div>
          <div className="stat-value" style={{ color: "var(--t3)" }}>
            {formatCurrency(commissionCents)}
          </div>
          <div className="stat-sub">{Math.round(payoutPolicy.commissionRate * 100)}% platform rate, all-time</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <BankDetailsForm
          restaurantId={restaurant.id}
          isOwner={isOwner}
          bankName={restaurant.bankName}
          bankBranchCode={restaurant.bankBranchCode}
          bankAccountType={restaurant.bankAccountType}
          maskedAccountNumber={maskedAccountNumber}
          bankAccountHolderName={restaurant.bankAccountHolderName}
          verifiedAt={restaurant.bankDetailsVerifiedAt?.toISOString() ?? null}
        />
      </div>

      <PayoutHistory payouts={payouts} />
    </div>
  );
}
