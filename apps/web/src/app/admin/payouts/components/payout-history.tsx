import type { PayoutWithDinner } from "@dinewithme/db";
import { formatAmount as formatCurrency } from "@dinewithme/config/src/payment";

const STATUS_BADGE: Record<string, string> = {
  HELD: "badge-yellow",
  READY: "badge-blue",
  PAID: "badge-green",
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
    <div className="card card-pad">
      <div className="card-title" style={{ marginBottom: 14 }}>
        Payout History
      </div>
      {payouts.length === 0 ? (
        <div style={{ padding: "24px 0", fontSize: 13, color: "var(--t3)", textAlign: "center" }}>
          No payouts yet - they appear here a few business days after each dinner completes.
        </div>
      ) : (
        <>
          {/* Desktop: table. Mobile: stacked row-cards. Same data either way. */}
          <div className="only-desktop table-wrap">
            <div className="table-scroll">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Dinner</th>
                    <th>Date</th>
                    <th className="r">Gross</th>
                    <th className="r">Commission</th>
                    <th className="r">Net Payout</th>
                    <th className="r">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id}>
                      <td className="td-strong">
                        {payout.dinner.theme?.title || "Dinner"} ({payout.dinner.bookedSeatCount} seat
                        {payout.dinner.bookedSeatCount === 1 ? "" : "s"})
                      </td>
                      <td className="td-muted" style={{ marginTop: 0 }}>
                        {new Date(payout.dinner.startsAt).toLocaleDateString("en-ZA", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(payout.grossAmountCents)}</td>
                      <td style={{ textAlign: "right", color: "var(--t3)" }}>
                        − {formatCurrency(payout.commissionAmountCents)}
                      </td>
                      <td className="td-strong" style={{ textAlign: "right" }}>
                        {formatCurrency(payout.netAmountCents)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`badge ${STATUS_BADGE[payout.status] || "badge-slate"}`}>
                          {statusLabel(payout)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="only-mobile">
            {payouts.map((payout) => (
              <div key={payout.id} className="row-card">
                <div className="rc-top">
                  <div>
                    <div className="rc-title">{payout.dinner.theme?.title || "Dinner"}</div>
                    <div className="rc-sub">
                      {new Date(payout.dinner.startsAt).toLocaleDateString("en-ZA", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {payout.dinner.bookedSeatCount} seat{payout.dinner.bookedSeatCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <span className={`badge ${STATUS_BADGE[payout.status] || "badge-slate"}`}>
                    {statusLabel(payout)}
                  </span>
                </div>
                <div className="rc-meta">
                  {formatCurrency(payout.grossAmountCents)} gross →{" "}
                  <b style={{ color: "var(--text)" }}>{formatCurrency(payout.netAmountCents)}</b> net
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
