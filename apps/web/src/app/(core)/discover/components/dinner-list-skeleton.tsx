import { Card } from "@/components/ui/card";

function DinnerCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Image skeleton */}
      <div className="h-48 animate-pulse rounded-xl bg-gray-200" />

      {/* Content skeleton */}
      <div className="mt-3 space-y-3">
        {/* Title */}
        <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Details */}
        <div className="space-y-2 pt-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </Card>
  );
}

export function DinnerListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Count skeleton */}
      <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />

      {/* Card skeletons */}
      <DinnerCardSkeleton />
      <DinnerCardSkeleton />
      <DinnerCardSkeleton />
    </div>
  );
}
