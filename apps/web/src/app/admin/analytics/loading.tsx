import {
  SkeletonStatGrid,
  SkeletonCard,
  SkeletonBar,
} from "../components/skeletons";

/* Analytics loading skeleton: header + wide chart block + 3 stat cards + bars. */
export default function AnalyticsLoading() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <SkeletonBar width={160} height={22} style={{ marginBottom: 8 }} />
        <SkeletonBar width={220} height={13} />
      </div>

      {/* Revenue chart block */}
      <SkeletonCard style={{ marginBottom: 20 }}>
        <SkeletonBar width={100} height={14} style={{ marginBottom: 12 }} />
        <SkeletonBar width={180} height={30} style={{ marginBottom: 14 }} />
        <SkeletonBar width="100%" height={160} radius={12} />
      </SkeletonCard>

      {/* 3-up stat cards */}
      <div style={{ marginBottom: 20 }}>
        <SkeletonStatGrid count={3} />
      </div>

      {/* Fill-rate bars */}
      <SkeletonCard>
        <SkeletonBar width={200} height={14} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <SkeletonBar width="45%" height={11} style={{ marginBottom: 6 }} />
              <SkeletonBar width="100%" height={8} radius={9999} />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}
