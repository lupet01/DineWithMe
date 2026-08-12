import type { CSSProperties } from "react";

/*
 * Reusable skeleton primitives for admin route-level loading.tsx files.
 * Purely presentational — no data, no state. They lean on the shared
 * `.skeleton` shimmer class (and its `skeleton-shimmer` keyframe) already
 * defined at the end of admin-design-system.css, so nothing new is added
 * to the stylesheet. Sizing is done with inline styles per instance.
 *
 * Every loading.tsx that uses these renders inside AdminShell's `.dine-admin`
 * container, so the shimmer tokens (--bg2 / --bg3) resolve correctly.
 */

/** A single shimmer bar — the atom the other primitives are built from. */
export function SkeletonBar({
  width = "100%",
  height = 12,
  radius = 6,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: CSSProperties;
}) {
  return (
    <div
      className="skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

/** A card-shaped block matching `.card` (white bg, 20px radius, shadow-2). */
export function SkeletonCard({
  children,
  padded = true,
  style,
}: {
  children?: React.ReactNode;
  padded?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div className={padded ? "card card-pad" : "card"} style={style} aria-hidden="true">
      {children}
    </div>
  );
}

/** A single stat card interior — label bar over a larger value bar. */
export function SkeletonStatCard() {
  return (
    <div className="stat-card" aria-hidden="true">
      <SkeletonBar width="55%" height={12} style={{ marginBottom: 10 }} />
      <SkeletonBar width="70%" height={22} />
    </div>
  );
}

/** The dashboard/payouts 4-up stat grid; pass count={3} for the analytics 3-up. */
export function SkeletonStatGrid({ count = 4 }: { count?: 3 | 4 }) {
  return (
    <div className={count === 3 ? "stat-grid-3" : "stat-grid-4"} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}

/**
 * A table placeholder inside a `.table-wrap` — a header strip plus `rows`
 * body rows, each a row of shimmer cells. Roughly mirrors `.dtable`.
 */
export function SkeletonTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrap" aria-hidden="true">
      {/* header strip */}
      <div
        style={{
          display: "flex",
          gap: 18,
          padding: "12px 18px",
          background: "var(--bg2)",
          borderBottom: "1px solid var(--bdr)",
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBar key={i} width={i === 0 ? "26%" : "16%"} height={10} />
        ))}
      </div>
      {/* body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "14px 18px",
            borderBottom: r === rows - 1 ? "none" : "1px solid var(--bdr)",
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBar key={c} width={c === 0 ? "26%" : "16%"} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** A page header block: a large title bar over a shorter subtitle bar. */
export function SkeletonHeader({ style }: { style?: CSSProperties }) {
  return (
    <div style={{ marginBottom: 20, ...style }} aria-hidden="true">
      <SkeletonBar width={200} height={22} radius={6} style={{ marginBottom: 8 }} />
      <SkeletonBar width={280} height={13} radius={6} />
    </div>
  );
}
