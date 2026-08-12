import {
  SkeletonHeader,
  SkeletonStatGrid,
  SkeletonCard,
  SkeletonBar,
  SkeletonTable,
} from "./components/skeletons";

/* Dashboard loading skeleton: header + 4-stat grid + a table card. */
export default function DashboardLoading() {
  return (
    <div>
      <SkeletonHeader style={{ marginBottom: 22 }} />
      <div style={{ marginBottom: 20 }}>
        <SkeletonStatGrid count={4} />
      </div>
      <SkeletonCard style={{ marginBottom: 16 }}>
        <SkeletonBar width={180} height={16} style={{ marginBottom: 16 }} />
        <SkeletonTable rows={5} cols={5} />
      </SkeletonCard>
    </div>
  );
}
