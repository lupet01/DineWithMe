import { Card } from "@/components/ui/card";

export function DinnerDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Skeleton */}
      <div className="h-64 animate-pulse bg-gray-200" />

      {/* Content */}
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="space-y-4">
          {/* Restaurant Info Skeleton */}
          <Card>
            <div className="mb-3 space-y-2">
              <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          </Card>

          {/* Description Skeleton */}
          <Card>
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
            </div>
          </Card>

          {/* Details Skeleton */}
          <Card>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Expectations Skeleton */}
          <Card>
            <div className="mb-3 h-5 w-32 animate-pulse rounded bg-gray-200" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-0.5 h-5 w-5 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* CTA Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-lg px-4 py-4">
          <div className="space-y-2">
            <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
