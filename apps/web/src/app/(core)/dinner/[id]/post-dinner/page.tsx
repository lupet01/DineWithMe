import { Suspense } from "react";
import { FeedbackFlow } from "./components/feedback-flow";
import { FeedbackFlowSkeleton } from "./components/feedback-flow-skeleton";

interface PostDinnerPageProps {
  params: {
    // Matches the [id] dynamic segment folder name, not "dinnerId" - the
    // previous version of this file read params.dinnerId, which is always
    // undefined for this route and broke every fetch in the flow.
    id: string;
  };
}

export default function PostDinnerPage({ params }: PostDinnerPageProps) {
  return (
    <Suspense fallback={<FeedbackFlowSkeleton />}>
      <FeedbackFlow dinnerId={params.id} />
    </Suspense>
  );
}
