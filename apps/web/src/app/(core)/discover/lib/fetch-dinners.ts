import type { DinnerListItem } from "@dinewithme/shared";

export interface DiscoverFilters {
  city?: string;
  theme?: string;
  date?: string;
}

/**
 * Converts the "today"/"tomorrow"/"weekend"/"week" filter chip into an
 * explicit from/to range the API's date-range query params understand.
 * Shared by the list and map views so both apply identical date logic.
 */
function parseDateFilter(date?: string): { from?: Date; to?: Date } {
  if (!date) return {};

  const now = new Date();
  let from: Date | undefined;
  let to: Date | undefined;

  switch (date) {
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
    case "weekend": {
      const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
      from = new Date(now.setDate(now.getDate() + daysUntilSaturday));
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setDate(to.getDate() + 1); // Sunday
      to.setHours(23, 59, 59, 999);
      break;
    }
    case "week":
      from = new Date(now.setHours(0, 0, 0, 0));
      to = new Date(now.setDate(now.getDate() + 7));
      to.setHours(23, 59, 59, 999);
      break;
  }

  return { from, to };
}

export async function fetchDinners(
  params: DiscoverFilters
): Promise<{ dinners: DinnerListItem[]; count: number; total: number }> {
  try {
    const { from, to } = parseDateFilter(params.date);

    const queryParams = new URLSearchParams();
    if (params.city) queryParams.set("city", params.city);
    if (params.theme) queryParams.set("theme", params.theme);
    if (from) queryParams.set("from", from.toISOString());
    if (to) queryParams.set("to", to.toISOString());

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/dinners?${queryParams.toString()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch dinners");
    }

    const result = await response.json();

    return {
      dinners: result.data.dinners as DinnerListItem[],
      count: result.data.count,
      total: result.data.total,
    };
  } catch (error) {
    console.error("Error fetching dinners:", error);
    return { dinners: [], count: 0, total: 0 };
  }
}
