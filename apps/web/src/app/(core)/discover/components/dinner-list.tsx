import { auth } from "@clerk/nextjs/server";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { DinnerCard } from "./dinner-card";
import { EmptyState } from "../../components/empty-state";
import { Compass } from "lucide-react";
import { fetchDinners, type DiscoverFilters } from "../lib/fetch-dinners";

interface DinnerListProps {
  searchParams: DiscoverFilters;
}

export async function DinnerList({ searchParams }: DinnerListProps) {
  const { userId } = await auth();
  const { dinners, count, total } = await fetchDinners(searchParams);
  const filters = searchParams;

  // Track analytics
  if (userId) {
    await track(AnalyticsEvents.DINNER_LIST_VIEWED, {
      userId,
      filters,
      resultCount: count,
      totalCount: total,
      timestamp: new Date().toISOString(),
    });
  }

  // Empty state
  if (dinners.length === 0) {
    return (
      <EmptyState
        icon={Compass}
        title="No Dinners Found"
        description={
          Object.keys(searchParams).length > 0
            ? "Try adjusting your filters to see more results"
            : "Check back soon for upcoming dinner experiences"
        }
      />
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {dinners.map((dinner) => (
        <DinnerCard key={dinner.id} dinner={dinner} />
      ))}
    </div>
  );
}
