import Link from "next/link";
import { formatAmount } from "@dinewithme/config/src/payment";

interface PayoutsSnapshotCardProps {
  nextPayoutAmountCents: number | null;
  nextPayoutDate: string | null;
  bankName: string | null;
  maskedAccountNumber: string | null;
  verifiedAt: string | null;
}

export function PayoutsSnapshotCard({
  nextPayoutAmountCents,
  nextPayoutDate,
  bankName,
  maskedAccountNumber,
  verifiedAt,
}: PayoutsSnapshotCardProps) {
  const hasPendingPayout = nextPayoutAmountCents != null && nextPayoutAmountCents > 0;
  const hasBankInfo = bankName != null;

  return (
    <div className="card card-pad payouts-snapshot-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
        }}
      >
        <div className="card-title" style={{ padding: 0 }}>
          Payouts
        </div>
        <Link
          href="/admin/payouts"
          style={{ fontSize: 12, color: "var(--p)", fontWeight: 600, textDecoration: "none" }}
        >
          Full Payouts page →
        </Link>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
            {hasPendingPayout ? formatAmount(nextPayoutAmountCents!) : "—"}
          </div>
          <div style={{ fontSize: 11, color: "var(--t3)" }}>
            {hasPendingPayout && nextPayoutDate
              ? `Next Payout · ${new Date(nextPayoutDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : "No payout pending"}
          </div>
        </div>

        {hasBankInfo ? (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
              {bankName} {maskedAccountNumber}
            </div>
            <div
              style={{
                fontSize: 11,
                color: verifiedAt ? "var(--t3)" : "var(--yellow-txt)",
              }}
            >
              {verifiedAt ? "Verified ✓" : "Pending Verification"}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: "var(--t3)" }}>
              No payout destination on file —{" "}
              <Link href="/admin/payouts" style={{ color: "var(--p)", fontWeight: 600, textDecoration: "none" }}>
                add one →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
