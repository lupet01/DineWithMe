import { Suspense } from "react";
import { DinnerDetailContent } from "./components/dinner-detail-content";
import { DinnerDetailSkeleton } from "./components/dinner-detail-skeleton";

interface DinnerDetailPageProps {
  params: {
    id: string;
  };
}

export default function DinnerDetailPage({ params }: DinnerDetailPageProps) {
  return (
    <Suspense fallback={<DinnerDetailSkeleton />}>
      <DinnerDetailContent dinnerId={params.id} />
    </Suspense>
  );
}
