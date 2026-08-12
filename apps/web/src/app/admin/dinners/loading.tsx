import { SkeletonBar, SkeletonTable } from "../components/skeletons";

/* Dinners list loading skeleton: header + toolbar bar + table. */
export default function DinnersLoading() {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div>
          <SkeletonBar width={140} height={22} style={{ marginBottom: 8 }} />
          <SkeletonBar width={260} height={13} />
        </div>
        <SkeletonBar width={130} height={40} radius={50} />
      </div>
      {/* toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <SkeletonBar width={240} height={38} radius={12} />
        <SkeletonBar width={120} height={38} radius={12} />
      </div>
      <SkeletonTable rows={7} cols={5} />
    </div>
  );
}
