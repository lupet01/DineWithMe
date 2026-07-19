import { Suspense } from "react";
import { FeedbackFlow } from "./components/feedback-flow";
import { FeedbackFlowSkeleton } from "./components/feedback-flow-skeleton";

interface PostDinnerPageProps {
  params: {
    dinnerId: string;
  };
}

export default function PostDinnerPage({ params }: PostDinnerPageProps) {
  return (
    <Suspense fallback={<FeedbackFlowSkeleton />}>
      <FeedbackFlow dinnerId={params.dinnerId} />
    </Suspense>
  );
}
