import Link from "next/link";
import type { MealWithCoursesAndPerformance, MealCourseWithOptions } from "@dinewithme/db";
import { NewMealButton } from "./new-meal-button";

const COURSE_ORDER = ["STARTER", "MAIN", "DESSERT"] as const;

function formatPrice(cents: number): string {
  return `R ${Math.round(cents / 100)}`;
}

function formatPercent(value: number | null | undefined): string {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

function populatedCourses(courses: MealCourseWithOptions[]): MealCourseWithOptions[] {
  return COURSE_ORDER.map((courseType) => courses.find((c) => c.courseType === courseType)).filter(
    (course): course is MealCourseWithOptions => !!course && course.options.length > 0
  );
}

function courseSummary(courses: MealCourseWithOptions[]): string {
  return populatedCourses(courses)
    .map((course) => course.options.map((option) => option.menuItem.name).join(" or "))
    .join(" · ");
}

export function MealsList({
  meals,
  restaurantId,
}: {
  meals: MealWithCoursesAndPerformance[];
  restaurantId: string;
}) {
  if (meals.length === 0) {
    return (
      <div className="card card-pad" style={{ textAlign: "center", padding: "40px 32px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🍝</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Build your first Meal
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--t2)",
            lineHeight: 1.6,
            marginBottom: 20,
            maxWidth: 320,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Meals are reusable menus — build one from your Dish Library, then pick it by name when creating a
          dinner. You won&apos;t need to re-describe the menu every time.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/admin/dish-library" className="btn btn-outline">
            Add dishes first →
          </Link>
          <NewMealButton restaurantId={restaurantId} />
        </div>
        <div style={{ fontSize: 11.5, color: "var(--t3)", marginTop: 16 }}>
          Start with your Dish Library. A Meal assembles dishes into courses — you&apos;ll need at least one dish
          before you can build a Meal.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop: table. Mobile: stacked row-cards. Same data either way. */}
      <div className="only-desktop table-wrap">
        <div className="table-scroll">
          <table className="dtable">
            <thead>
              <tr>
                <th>Meal</th>
                <th style={{ textAlign: "center" }}>Courses</th>
                <th style={{ textAlign: "center" }}>Suggested Price</th>
                <th style={{ textAlign: "center" }}>Dinners</th>
                <th style={{ textAlign: "center" }}>Fill Rate</th>
                <th style={{ textAlign: "center" }}>Would Return</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((meal) => {
                const hasHistory = !!meal.performance && meal.performance.totalDinners > 0;
                const summary = courseSummary(meal.courses);

                return (
                  <tr key={meal.id}>
                    <td>
                      <Link
                        href={`/admin/meals/${meal.id}`}
                        style={{ textDecoration: "none", color: "var(--p)", fontWeight: 600 }}
                      >
                        {meal.name}
                      </Link>
                      {summary && (
                        <div style={{ fontSize: 11.5, color: "var(--t3)", marginTop: 2 }}>{summary}</div>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>{populatedCourses(meal.courses).length}</td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>
                      {formatPrice(meal.suggestedPricePerSeatCents)}
                    </td>
                    <td style={{ textAlign: "center" }}>{meal.performance?.totalDinners ?? 0}</td>
                    <td style={{ textAlign: "center" }}>
                      {hasHistory ? (
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              (meal.performance!.avgFillRate ?? 0) >= 0.75
                                ? "var(--green-txt)"
                                : "var(--yellow-txt)",
                          }}
                        >
                          {formatPercent(meal.performance!.avgFillRate)}
                        </span>
                      ) : (
                        <span style={{ color: "var(--t3)", fontSize: 12 }}>early days</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {hasHistory ? (
                        formatPercent(meal.performance!.avgWouldReturnRate)
                      ) : (
                        <span style={{ color: "var(--t3)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="only-mobile">
        {meals.map((meal) => {
          const hasHistory = !!meal.performance && meal.performance.totalDinners > 0;
          const summary = courseSummary(meal.courses);
          const fillRate = meal.performance?.avgFillRate ?? null;
          const wouldReturn = meal.performance?.avgWouldReturnRate ?? null;

          return (
            <Link
              key={meal.id}
              href={`/admin/meals/${meal.id}`}
              className="row-card"
              style={{ display: "block", textDecoration: "none" }}
            >
              <div className="rc-top">
                <div style={{ minWidth: 0 }}>
                  <div className="rc-title">{meal.name}</div>
                  <div className="rc-sub">
                    {summary || `Suggested ${formatPrice(meal.suggestedPricePerSeatCents)} / seat`}
                  </div>
                </div>
                {/* Fill-rate badge, matching the desktop table's performance
                    column — green ≥75%, yellow below; graceful "early days"
                    slate badge before any dinners have run. */}
                {hasHistory ? (
                  <span
                    className={`badge ${(fillRate ?? 0) >= 0.75 ? "badge-green" : "badge-yellow"}`}
                    style={{ fontSize: 9.5 }}
                  >
                    {formatPercent(fillRate)} fill
                  </span>
                ) : (
                  <span className="badge badge-slate" style={{ fontSize: 9.5 }}>
                    early days
                  </span>
                )}
              </div>
              <div className="rc-meta">
                <span style={{ fontWeight: 800, fontSize: 14 }}>
                  {formatPrice(meal.suggestedPricePerSeatCents)}
                </span>
                <span style={{ color: "var(--bdr2)" }}>·</span>
                <span style={{ color: "var(--t3)", fontWeight: 500 }}>
                  {populatedCourses(meal.courses).length} courses
                </span>
                <span style={{ color: "var(--bdr2)" }}>·</span>
                <span style={{ color: "var(--t3)", fontWeight: 500 }}>
                  {meal.performance?.totalDinners ?? 0}{" "}
                  {(meal.performance?.totalDinners ?? 0) === 1 ? "dinner" : "dinners"}
                </span>
              </div>
              {hasHistory && wouldReturn != null && (
                <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>
                  {formatPercent(wouldReturn)} would return
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
