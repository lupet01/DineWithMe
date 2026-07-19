export function FeedbackFlowSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
          <div className="flex gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-1.5 w-8 animate-pulse rounded-full bg-gray-200" />
            ))}
          </div>
          <div className="w-9" />
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
            <div className="mx-auto mt-2 h-4 w-48 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-gray-200"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
