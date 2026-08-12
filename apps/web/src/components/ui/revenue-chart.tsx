/**
 * Presentational revenue chart — the full-width line chart + big total +
 * delta % shown on Analytics (and reused on the Dashboard). No
 * interactivity, so it renders fine as a plain (server or client)
 * component.
 *
 * SVG math is normalized to a 1080x160 viewBox: an all-zero / flat series
 * still draws a flat baseline instead of dividing by zero.
 */

export interface RevenueChartProps {
  /** Pre-formatted total, e.g. formatAmount(revenue). */
  totalLabel: string;
  /** Percentage change vs the prior period; null hides the delta line. */
  deltaPct: number | null;
  /** Time buckets in chronological order. */
  buckets: { bucketStart: Date; amount: number }[];
}

export function RevenueChart({ totalLabel, deltaPct, buckets }: RevenueChartProps) {
  // Chart points normalized to the SVG viewBox (1080x160) - a flat/all-zero
  // series still draws a flat baseline rather than dividing by zero.
  const maxBucketAmount = Math.max(1, ...buckets.map((b) => b.amount));
  const chartPoints = buckets.map((b, i) => {
    const x = buckets.length > 1 ? (i / (buckets.length - 1)) * 1080 : 0;
    const y = 144 - (b.amount / maxBucketAmount) * 128;
    return `${Math.round(x)},${Math.round(y)}`;
  });
  const chartPolyline = chartPoints.join(" ");
  const chartPolygon = `0,160 ${chartPoints.join(" ")} 1080,160`;
  const lastPoint = chartPoints[chartPoints.length - 1]?.split(",").map(Number);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div className="card-title">Revenue</div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px" }}>
          {totalLabel}
        </div>
        {deltaPct !== null && (
          <div style={{ fontSize: 13, color: deltaPct >= 0 ? "var(--green-txt)" : "var(--red-txt)", fontWeight: 700 }}>
            {deltaPct >= 0 ? "↑" : "↓"} {Math.abs(deltaPct)}% vs prior period
          </div>
        )}
      </div>
      <svg viewBox="0 0 1080 160" preserveAspectRatio="none" style={{ width: "100%", height: 160, display: "block" }}>
        <defs>
          <linearGradient id="analyticsRevChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--p)", stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: "var(--p)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <line x1="0" y1="40" x2="1080" y2="40" style={{ stroke: "var(--bdr)" }} />
        <line x1="0" y1="80" x2="1080" y2="80" style={{ stroke: "var(--bdr)" }} />
        <line x1="0" y1="120" x2="1080" y2="120" style={{ stroke: "var(--bdr)" }} />
        <polygon points={chartPolygon} fill="url(#analyticsRevChartGrad)" />
        <polyline
          points={chartPolyline}
          style={{ fill: "none", stroke: "var(--p)", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }}
        />
        {lastPoint && <circle cx={lastPoint[0]} cy={lastPoint[1]} r="5" style={{ fill: "var(--p)" }} />}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--t3)", marginTop: 4 }}>
        {buckets.map((b, i) => (
          <span key={i}>
            {i === buckets.length - 1
              ? "Today"
              : b.bucketStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ))}
      </div>
    </>
  );
}
