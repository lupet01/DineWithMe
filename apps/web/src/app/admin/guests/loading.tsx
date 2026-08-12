import { SkeletonBar, SkeletonTable } from "../components/skeletons";

/* Guests & Bookings loading skeleton: header + toolbar + table. */
export default function GuestsLoading() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <SkeletonBar width={220} height={22} style={{ marginBottom: 8 }} />
        <SkeletonBar width={300} height={13} />
      </div>
      {/* toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <SkeletonBar width={240} height={38} radius={12} />
        <SkeletonBar width={120} height={38} radius={12} />
      </div>
      <SkeletonTable rows={7} cols={4} />
    </div>
  );
}
