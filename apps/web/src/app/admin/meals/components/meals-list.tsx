import Link from "next/link";
import type { MealWithCoursesAndPerformance, MealCourseWithOptions } from "@dinewithme/db";

const COURSE_ORDER = ["STARTER", "MAIN", "DESSERT"] as const;

function formatPrice(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
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

export function MealsList({ meals }: { meals: MealWithCoursesAndPerformance[] }) {
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
        {meals.map((meal) => (
          <Link
            key={meal.id}
            href={`/admin/meals/${meal.id}`}
            className="row-card"
            style={{ display: "block", textDecoration: "none" }}
          >
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
    </>
  );
}
