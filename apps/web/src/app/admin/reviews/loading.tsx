import { SkeletonCard, SkeletonBar } from "../components/skeletons";

/* Guest Feedback loading skeleton: header + list of card rows. */
export default function ReviewsLoading() {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <SkeletonBar width={180} height={22} style={{ marginBottom: 8 }} />
          <SkeletonBar width={260} height={13} />
        </div>
        <SkeletonBar width={140} height={38} radius={12} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <SkeletonBar width={40} height={40} radius={9999} />
              <div style={{ flex: 1 }}>
                <SkeletonBar width="40%" height={13} style={{ marginBottom: 6 }} />
                <SkeletonBar width="55%" height={11} />
              </div>
              <SkeletonBar width={70} height={14} />
            </div>
            <SkeletonBar width="100%" height={11} style={{ marginBottom: 6 }} />
            <SkeletonBar width="85%" height={11} />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
