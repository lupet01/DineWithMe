import {
  SkeletonStatGrid,
  SkeletonCard,
  SkeletonBar,
  SkeletonTable,
} from "../components/skeletons";

/* Payouts loading skeleton: header + 4-stat grid + card + table. */
export default function PayoutsLoading() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <SkeletonBar width={120} height={22} style={{ marginBottom: 8 }} />
        <SkeletonBar width={320} height={13} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <SkeletonStatGrid count={4} />
      </div>

      {/* Bank details card */}
      <SkeletonCard style={{ marginBottom: 20 }}>
        <SkeletonBar width={160} height={16} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBar key={i} width="100%" height={40} radius={12} />
          ))}
        </div>
      </SkeletonCard>

      <SkeletonTable rows={6} cols={4} />
    </div>
  );
}
