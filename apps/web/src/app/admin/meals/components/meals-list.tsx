import Link from "next/link";
import type { MealWithPerformance } from "@dinewithme/db";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function formatPrice(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

function formatPercent(value: number | null | undefined): string {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

export function MealsList({ meals }: { meals: MealWithPerformance[] }) {
  if (meals.length === 0) {
    return (
      <Card padding="lg">
        <p className="text-sm text-gray-500">
          No Meals yet. Create one above to start assembling a menu from your Dish Library.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="none" className="divide-y divide-gray-100">
      {meals.map((meal) => (
        <Link
          key={meal.id}
          href={`/admin/meals/${meal.id}`}
          className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-cream-100"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{meal.name}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Suggested {formatPrice(meal.suggestedPricePerSeatCents)} / seat
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-4 text-right">
            {meal.performance && (
              <div className="hidden sm:block">
                <p className="text-xs text-gray-500">
                  {meal.performance.totalDinners}{" "}
                  {meal.performance.totalDinners === 1 ? "dinner" : "dinners"}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPercent(meal.performance.avgFillRate)} fill
                  {meal.performance.avgWouldReturnRate != null &&
                    ` · ${formatPercent(meal.performance.avgWouldReturnRate)} would return`}
                </p>
              </div>
            )}
            <Badge tone={meal.isActive ? "success" : "neutral"}>
              {meal.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </Link>
      ))}
    </Card>
  );
}
