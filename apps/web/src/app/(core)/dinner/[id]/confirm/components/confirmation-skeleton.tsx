import { Card } from "@/components/ui/card";

export function ConfirmationSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-b from-gray-100 to-gray-50 px-4 py-12 text-center">
        <div className="mx-auto mb-4 h-20 w-20 animate-pulse rounded-full bg-gray-200" />
        <div className="mx-auto mb-2 h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mx-auto h-5 w-64 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Content Skeleton */}
      <div className="mx-auto max-w-lg px-4 pb-6">
        {/* Summary Card Skeleton */}
        <Card className="mb-4">
          <div className="mb-3 h-6 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 animate-pulse rounded bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Instructions Card Skeleton */}
        <Card className="mb-4">
          <div className="mb-3 h-5 w-48 animate-pulse rounded bg-gray-200" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        </Card>

        {/* What's Next Card Skeleton */}
        <Card className="mb-6">
          <div className="mb-2 h-5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        </Card>

        {/* CTA Skeleton */}
        <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
        <div className="mt-3 h-12 w-full animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}
