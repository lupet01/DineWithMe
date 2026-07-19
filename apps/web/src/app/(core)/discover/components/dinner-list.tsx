import { auth } from "@clerk/nextjs/server";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import type { DinnerListItem } from "@dinewithme/shared";
import { DinnerCard } from "./dinner-card";
import { EmptyState } from "../../components/empty-state";
import { Compass } from "lucide-react";

interface DinnerListProps {
  searchParams: {
    city?: string;
    theme?: string;
    date?: string;
  };
}

async function fetchDinners(params: DinnerListProps["searchParams"]) {
  try {
    // Convert date filter to from/to dates
    let from: Date | undefined;
    let to: Date | undefined;

    if (params.date) {
      const now = new Date();

      switch (params.date) {
        case "today":
          from = new Date(now.setHours(0, 0, 0, 0));
          to = new Date(now.setHours(23, 59, 59, 999));
          break;
        case "tomorrow":
          from = new Date(now.setDate(now.getDate() + 1));
          from.setHours(0, 0, 0, 0);
          to = new Date(from);
          to.setHours(23, 59, 59, 999);
          break;
        case "weekend":
          // Find next Saturday
          const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
          from = new Date(now.setDate(now.getDate() + daysUntilSaturday));
          from.setHours(0, 0, 0, 0);
          to = new Date(from);
          to.setDate(to.getDate() + 1); // Sunday
          to.setHours(23, 59, 59, 999);
          break;
        case "week":
          from = new Date(now.setHours(0, 0, 0, 0));
          to = new Date(now.setDate(now.getDate() + 7));
          to.setHours(23, 59, 59, 999);
          break;
      }
    }

    // Build query params for API
    const queryParams = new URLSearchParams();
    if (params.city) queryParams.set("city", params.city);
    if (params.theme) queryParams.set("theme", params.theme);
    if (from) queryParams.set("from", from.toISOString());
    if (to) queryParams.set("to", to.toISOString());

    // Fetch from API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/dinners?${queryParams.toString()}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch dinners");
    }

    const result = await response.json();

    return {
      dinners: result.data.dinners as DinnerListItem[],
      count: result.data.count,
      total: result.data.total,
      filters: params,
    };
  } catch (error) {
    console.error("Error fetching dinners:", error);
    return { dinners: [], count: 0, total: 0, filters: {} };
  }
}

export async function DinnerList({ searchParams }: DinnerListProps) {
  const { userId } = await auth();
  const { dinners, count, total, filters } = await fetchDinners(searchParams);

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
