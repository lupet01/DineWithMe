import Link from "next/link";
import type { MealWithPerformance } from "@dinewithme/db";

function formatPrice(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

function formatPercent(value: number | null | undefined): string {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

export function MealsList({ meals }: { meals: MealWithPerformance[] }) {
  if (meals.length === 0) {
    return (
      <div className="card card-pad">
        <p style={{ fontSize: 13, color: "var(--t3)" }}>
          No Meals yet. Create one above to start assembling a menu from your Dish Library.
        </p>
      </div>
    );
  }

  return (
    <div>
      {meals.map((meal) => (
        <Link key={meal.id} href={`/admin/meals/${meal.id}`} className="row-card" style={{ display: "block", textDecoration: "none" }}>
          <div className="rc-top">
            <div style={{ minWidth: 0 }}>
              <div className="rc-title">{meal.name}</div>
              <div className="rc-sub">Suggested {formatPrice(meal.suggestedPricePerSeatCents)} / seat</div>
            </div>
            <span className={`badge ${meal.isActive ? "badge-green" : "badge-slate"}`}>
              {meal.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {meal.performance && (
            <div className="rc-meta">
              {meal.performance.totalDinners} {meal.performance.totalDinners === 1 ? "dinner" : "dinners"}
              {" · "}
              {formatPercent(meal.performance.avgFillRate)} fill
              {meal.performance.avgWouldReturnRate != null &&
                ` · ${formatPercent(meal.performance.avgWouldReturnRate)} would return`}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
